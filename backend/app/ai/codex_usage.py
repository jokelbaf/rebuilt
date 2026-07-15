import asyncio
import json
from typing import Any, cast

from errors import UpstreamError
from loguru import logger

from .events import AiUsageSnapshot, AiUsageWindow

_FIVE_HOURS_MINUTES = 300
_WEEK_MINUTES = 10_080
_REQUEST_TIMEOUT = 15


async def read_codex_usage(executable: str, version: str) -> AiUsageSnapshot:
    """Read account rate limits through the Codex app-server protocol."""
    try:
        process = await asyncio.create_subprocess_exec(
            executable,
            "app-server",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
    except FileNotFoundError as exc:
        raise UpstreamError("The Codex CLI is not available.") from exc

    assert process.stdin and process.stdout and process.stderr
    stderr_task = asyncio.create_task(process.stderr.read())
    messages: tuple[dict[str, Any], ...] = (
        {
            "method": "initialize",
            "id": 1,
            "params": {
                "clientInfo": {"name": "rebuilt", "title": "ReBuilt", "version": version},
                "capabilities": {"experimentalApi": True},
            },
        },
        {"method": "initialized", "params": {}},
        {"method": "account/rateLimits/read", "id": 2, "params": None},
    )

    try:
        for message in messages:
            process.stdin.write(json.dumps(message).encode() + b"\n")
        await process.stdin.drain()

        async with asyncio.timeout(_REQUEST_TIMEOUT):
            async for raw_line in process.stdout:
                payload = _parse_object(raw_line)
                if payload is None or payload.get("id") != 2:
                    continue
                error = payload.get("error")
                if isinstance(error, dict):
                    message = cast(dict[str, Any], error).get("message")
                    raise UpstreamError(
                        message if isinstance(message, str) else "Codex usage is unavailable."
                    )
                return _usage_snapshot(payload.get("result"))
    except TimeoutError as exc:
        raise UpstreamError("Codex usage did not respond in time.") from exc
    finally:
        if process.returncode is None:
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=2)
            except TimeoutError:
                process.kill()
                await process.wait()
        stderr = await stderr_task
        if process.returncode not in {0, -15} and stderr:
            logger.warning(
                "Codex usage probe ended with: {}", stderr.decode(errors="replace").strip()
            )

    raise UpstreamError("Codex usage is unavailable.")


def _usage_snapshot(value: Any) -> AiUsageSnapshot:
    """Normalize a Codex rate-limit response into the shared usage shape."""
    if not isinstance(value, dict):
        raise UpstreamError("Codex returned invalid usage data.")
    result = cast(dict[str, Any], value)
    rate_limits = result.get("rateLimitsByLimitId")
    snapshot: Any = None
    if isinstance(rate_limits, dict):
        snapshot = cast(dict[str, Any], rate_limits).get("codex")
    if not isinstance(snapshot, dict):
        snapshot = result.get("rateLimits")
    if not isinstance(snapshot, dict):
        raise UpstreamError("Codex returned no usage limits for this account.")

    five_hour: AiUsageWindow | None = None
    weekly: AiUsageWindow | None = None
    for key in ("primary", "secondary"):
        window = _parse_window(cast(dict[str, Any], snapshot).get(key))
        if window is None:
            continue
        duration, usage = window
        if duration == _FIVE_HOURS_MINUTES:
            five_hour = usage
        elif duration == _WEEK_MINUTES:
            weekly = usage
    return AiUsageSnapshot(five_hour=five_hour, weekly=weekly)


def _parse_window(value: Any) -> tuple[int, AiUsageWindow] | None:
    """Parse one Codex quota window when its duration is known."""
    if not isinstance(value, dict):
        return None
    data = cast(dict[str, Any], value)
    duration = data.get("windowDurationMins")
    used_percent = data.get("usedPercent")
    resets_at = data.get("resetsAt")
    if (
        not isinstance(duration, int)
        or isinstance(used_percent, bool)
        or not isinstance(used_percent, int | float)
    ):
        return None
    return duration, AiUsageWindow(
        used_percent=max(0.0, min(float(used_percent), 100.0)),
        resets_at=resets_at if isinstance(resets_at, int) else None,
    )


def _parse_object(raw: bytes) -> dict[str, Any] | None:
    """Parse a JSONL object emitted by the Codex app server."""
    try:
        payload: Any = json.loads(raw)
    except json.JSONDecodeError, UnicodeDecodeError:
        return None
    return cast(dict[str, Any], payload) if isinstance(payload, dict) else None
