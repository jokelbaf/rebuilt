import asyncio
import contextlib
import importlib
import json
import os
import pathlib
import shlex
import socket
import struct
import tempfile
import time
from typing import Any, Protocol, cast

from errors import UpstreamError

from .events import AiUsageSnapshot, AiUsageWindow

_CLI_CONFIG_PATH = pathlib.Path.home() / ".claude.json"
_PANEL_FALLBACK_DELAY = 8
_POLL_INTERVAL = 0.2
_REQUEST_TIMEOUT = 20
_STATUS_SYNC_DELAY = 2
_USAGE_READY_MARKERS = ("Current session", "Current week")


class _WindowsPtyProcess(Protocol):
    """A Claude process attached to a Windows pseudoterminal."""

    fileobj: socket.socket

    def close(self, force: bool = False) -> None:
        """Close the pseudoterminal and optionally terminate its process."""
        ...

    def isalive(self) -> bool:
        """Return whether the child process is still running."""
        ...

    def read(self, size: int = 1024) -> str:
        """Read terminal output from the child process."""
        ...

    def write(self, value: str) -> int:
        """Write terminal input to the child process."""
        ...


class _WindowsPtyFactory(Protocol):
    """A factory for Windows pseudoterminal processes."""

    def spawn(self, argv: list[str], cwd: str | None = None) -> _WindowsPtyProcess:
        """Start a command in a Windows pseudoterminal."""
        ...


async def read_claude_usage(executable: str) -> AiUsageSnapshot:
    """Read Claude Code limits through its documented status-line JSON."""
    workspace = _trusted_workspace()
    if workspace is None:
        raise UpstreamError("Open Claude Code once in a trusted project before checking usage.")

    with tempfile.TemporaryDirectory(prefix="rebuilt-claude-usage-") as directory_name:
        directory = pathlib.Path(directory_name)
        status_path = directory / "status.json"
        settings = json.dumps(
            {
                "statusLine": {
                    "type": "command",
                    "command": _status_command(directory, status_path),
                }
            }
        )
        args = _usage_command(executable, settings)
        if os.name == "nt":
            return await asyncio.to_thread(_read_windows_usage, args, workspace, status_path)
        return await _read_posix_usage(args, workspace, status_path)


def _usage_command(executable: str, settings: str) -> list[str]:
    """Build the isolated interactive Claude usage command."""
    return [
        executable,
        "--ax-screen-reader",
        "--setting-sources",
        "",
        "--settings",
        settings,
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
        "--no-chrome",
        "/usage",
    ]


def _status_command(directory: pathlib.Path, status_path: pathlib.Path) -> str:
    """Create the platform-native command that captures status-line input."""
    if os.name != "nt":
        return f"tee {shlex.quote(str(status_path))}"

    script_path = directory / "capture-status.ps1"
    output_path = status_path.as_posix().replace("'", "''")
    script_path.write_text(
        f"$input | Set-Content -LiteralPath '{output_path}' -Encoding utf8\n",
        encoding="utf-8",
    )
    return f"powershell -NoProfile -File {shlex.quote(script_path.as_posix())}"


async def _read_posix_usage(
    args: list[str], workspace: pathlib.Path, status_path: pathlib.Path
) -> AiUsageSnapshot:
    """Capture Claude usage through a POSIX pseudoterminal."""
    master_fd, slave_fd = os.openpty()
    _set_posix_pty_size(slave_fd)
    os.set_blocking(master_fd, False)
    try:
        process = await asyncio.create_subprocess_exec(
            *args,
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            cwd=workspace,
            start_new_session=True,
        )
    except FileNotFoundError as exc:
        os.close(master_fd)
        raise UpstreamError("The Claude CLI is not available.") from exc
    finally:
        os.close(slave_fd)

    output = ""
    dismissed = False
    ready_at: float | None = None
    started_at = time.monotonic()
    try:
        async with asyncio.timeout(_REQUEST_TIMEOUT):
            while process.returncode is None:
                output = _recent_output(output, _drain_posix_pty(master_fd))
                if ready_at is None and _usage_is_ready(output):
                    ready_at = time.monotonic()
                if not dismissed and _should_dismiss_usage(ready_at, started_at):
                    os.write(master_fd, b"\x1b")
                    dismissed = True
                snapshot = _read_snapshot(status_path)
                if snapshot is not None:
                    return snapshot
                await asyncio.sleep(_POLL_INTERVAL)
    except TimeoutError as exc:
        raise UpstreamError("Claude Code usage did not respond in time.") from exc
    finally:
        os.close(master_fd)
        if process.returncode is None:
            process.terminate()
            try:
                await asyncio.wait_for(process.wait(), timeout=2)
            except TimeoutError:
                process.kill()
                await process.wait()

    raise UpstreamError("Claude Code returned no usage limits for this account.")


def _set_posix_pty_size(fd: int) -> None:
    """Set a usable terminal size for Claude's interactive renderer."""
    import fcntl
    import termios

    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 120, 0, 0))


def _read_windows_usage(
    args: list[str], workspace: pathlib.Path, status_path: pathlib.Path
) -> AiUsageSnapshot:
    """Capture Claude usage through a Windows ConPTY pseudoterminal."""
    winpty: Any = importlib.import_module("winpty")
    factory = cast(_WindowsPtyFactory, winpty.PtyProcess)
    try:
        process = factory.spawn(args, cwd=str(workspace))
    except FileNotFoundError as exc:
        raise UpstreamError("The Claude CLI is not available.") from exc

    process.fileobj.setblocking(False)
    output = ""
    dismissed = False
    ready_at: float | None = None
    started_at = time.monotonic()
    deadline = started_at + _REQUEST_TIMEOUT
    try:
        while process.isalive() and time.monotonic() < deadline:
            output = _recent_output(output, _drain_windows_pty(process))
            if ready_at is None and _usage_is_ready(output):
                ready_at = time.monotonic()
            if not dismissed and _should_dismiss_usage(ready_at, started_at):
                process.write("\x1b")
                dismissed = True
            snapshot = _read_snapshot(status_path)
            if snapshot is not None:
                return snapshot
            time.sleep(_POLL_INTERVAL)
    finally:
        with contextlib.suppress(OSError):
            process.close(force=True)

    if time.monotonic() >= deadline:
        raise UpstreamError("Claude Code usage did not respond in time.")
    raise UpstreamError("Claude Code returned no usage limits for this account.")


def _recent_output(current: str, incoming: str, limit: int = 65_536) -> str:
    """Keep enough recent terminal output to detect the loaded usage panel."""
    return (current + incoming)[-limit:]


def _usage_is_ready(output: str) -> bool:
    """Return whether Claude has loaded the usage panel and can be dismissed."""
    return all(marker in output for marker in _USAGE_READY_MARKERS) and output.count("Resets ") >= 2


def _should_dismiss_usage(ready_at: float | None, started_at: float) -> bool:
    """Return whether the usage panel has had enough time to update status data."""
    now = time.monotonic()
    if ready_at is not None and now - ready_at >= _STATUS_SYNC_DELAY:
        return True
    return now - started_at >= _PANEL_FALLBACK_DELAY


def _drain_posix_pty(master_fd: int) -> str:
    """Drain pending POSIX terminal output without blocking."""
    chunks: list[bytes] = []
    while True:
        try:
            chunk = os.read(master_fd, 65_536)
        except BlockingIOError, OSError:
            break
        if not chunk:
            break
        chunks.append(chunk)
    return b"".join(chunks).decode(errors="replace")


def _drain_windows_pty(process: _WindowsPtyProcess) -> str:
    """Drain pending Windows terminal output without blocking."""
    chunks: list[str] = []
    while True:
        try:
            chunk = process.read(65_536)
        except BlockingIOError, EOFError, OSError:
            break
        if not chunk:
            break
        chunks.append(chunk)
    return "".join(chunks)


def _trusted_workspace() -> pathlib.Path | None:
    """Return an existing workspace already trusted by Claude Code."""
    try:
        payload: Any = json.loads(_CLI_CONFIG_PATH.read_text(encoding="utf-8"))
    except OSError, json.JSONDecodeError:
        return None
    if not isinstance(payload, dict):
        return None
    projects = cast(dict[str, Any], payload).get("projects")
    if not isinstance(projects, dict):
        return None
    for raw_path, raw_settings in cast(dict[str, Any], projects).items():
        if not isinstance(raw_settings, dict):
            continue
        settings = cast(dict[str, Any], raw_settings)
        path = pathlib.Path(raw_path)
        if settings.get("hasTrustDialogAccepted") is True and path.is_dir():
            return path
    return None


def _read_snapshot(path: pathlib.Path) -> AiUsageSnapshot | None:
    """Read a complete Claude status-line snapshot when limits are present."""
    try:
        payload: Any = json.loads(path.read_text(encoding="utf-8-sig"))
    except OSError, json.JSONDecodeError:
        return None
    if not isinstance(payload, dict):
        return None
    rate_limits = cast(dict[str, Any], payload).get("rate_limits")
    if not isinstance(rate_limits, dict):
        return None
    limits = cast(dict[str, Any], rate_limits)
    return AiUsageSnapshot(
        five_hour=_parse_window(limits.get("five_hour")),
        weekly=_parse_window(limits.get("seven_day")),
    )


def _parse_window(value: Any) -> AiUsageWindow | None:
    """Parse one Claude Code usage window."""
    if not isinstance(value, dict):
        return None
    data = cast(dict[str, Any], value)
    used_percent = data.get("used_percentage")
    resets_at = data.get("resets_at")
    if isinstance(used_percent, bool) or not isinstance(used_percent, int | float):
        return None
    return AiUsageWindow(
        used_percent=max(0.0, min(float(used_percent), 100.0)),
        resets_at=resets_at if isinstance(resets_at, int) else None,
    )
