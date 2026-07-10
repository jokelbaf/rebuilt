import asyncio
import dataclasses
import json
import pathlib
import shutil
from collections.abc import AsyncIterator
from typing import Any, cast

from errors import UpstreamError
from loguru import logger

from .base import AiProvider
from .events import AiModelInfo, ChatDelta, ChatDone, ChatEvent, ChatSessionStart, ChatToolUse

_STREAM_LINE_LIMIT = 2**23
_MCP_SERVER = "rebuilt"
_MCP_TOOL_PREFIX = f"mcp__{_MCP_SERVER}__"
_TOOL_SUMMARY_LIMIT = 120

_EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"]
_BUILTIN_MODELS = [
    AiModelInfo(
        id="haiku",
        label="Haiku 4.5",
        description="Fastest for everyday tasks",
        efforts=tuple(_EFFORT_LEVELS),
    ),
    AiModelInfo(
        id="sonnet",
        label="Sonnet 5",
        description="Balanced intelligence and speed",
        efforts=tuple(_EFFORT_LEVELS),
    ),
    AiModelInfo(
        id="opus",
        label="Opus 4.8",
        description="Most capable for complex work",
        efforts=tuple(_EFFORT_LEVELS),
    ),
]
_CLI_CONFIG_PATH = pathlib.Path.home() / ".claude.json"
_DEFAULT_MODEL = "sonnet"
_FAST_MODEL = "haiku"


class ClaudeCodeProvider(AiProvider):
    """AI provider backed by the local ``claude`` CLI running in print mode."""

    name = "claude-code"
    label = "Claude Code"
    description = "Anthropic's local Claude Code CLI."
    install_hint = "Install Claude Code and sign in with the claude CLI."

    def __init__(self, executable: str = "claude") -> None:
        self._executable = shutil.which(executable) or executable
        self._extra_models_cache: tuple[float, list[AiModelInfo]] | None = None

    async def complete(
        self,
        prompt: str,
        *,
        system: str | None = None,
        model: str | None = None,
        workspace: pathlib.Path | None = None,
    ) -> str:
        """Run a single completion through ``claude -p`` and return its text output."""
        args = [
            self._executable,
            "-p",
            "--output-format",
            "json",
            "--model",
            model or _DEFAULT_MODEL,
        ]
        if system:
            args += ["--append-system-prompt", system]

        cwd: str | None = None
        if workspace is not None:
            cwd = str(workspace)
            args += ["--add-dir", str(workspace), "--dangerously-skip-permissions"]

        try:
            process = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )
            stdout, stderr = await process.communicate(input=prompt.encode())
        except FileNotFoundError as exc:
            raise UpstreamError("The Claude CLI is not available.") from exc

        if process.returncode != 0:
            logger.error(
                "claude CLI failed ({}): {}",
                process.returncode,
                stderr.decode(errors="replace").strip(),
            )
            raise UpstreamError("AI generation failed.")

        return self._extract_result(stdout.decode(errors="replace"))

    async def chat_stream(
        self,
        prompt: str,
        *,
        system: str | None = None,
        model: str | None = None,
        effort: str | None = None,
        session_id: str | None = None,
        workspace: pathlib.Path | None = None,
        mcp_url: str | None = None,
    ) -> AsyncIterator[ChatEvent]:
        """Stream one conversational turn through ``claude -p`` in stream-json mode."""
        args = [
            self._executable,
            "-p",
            "--verbose",
            "--output-format",
            "stream-json",
            "--include-partial-messages",
            "--model",
            model or _DEFAULT_MODEL,
        ]
        if effort:
            args += ["--effort", effort]
        if system:
            args += ["--append-system-prompt", system]
        if session_id:
            args += ["--resume", session_id]

        allowed_tools = ["Read"]
        if mcp_url:
            config = json.dumps({"mcpServers": {_MCP_SERVER: {"type": "http", "url": mcp_url}}})
            args += ["--mcp-config", config, "--strict-mcp-config"]
            allowed_tools.append(f"mcp__{_MCP_SERVER}")
        args += ["--allowedTools", ",".join(allowed_tools)]

        cwd: str | None = None
        if workspace is not None:
            cwd = str(workspace)
            args += ["--add-dir", str(workspace)]

        try:
            process = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
                limit=_STREAM_LINE_LIMIT,
            )
        except FileNotFoundError as exc:
            raise UpstreamError("The Claude CLI is not available.") from exc

        assert process.stdin and process.stdout and process.stderr
        stderr_task = asyncio.create_task(process.stderr.read())

        try:
            process.stdin.write(prompt.encode())
            await process.stdin.drain()
            process.stdin.close()

            text_parts: list[str] = []
            final_session = session_id
            got_result = False

            async for raw_line in process.stdout:
                data = self._parse_line(raw_line)
                if data is None:
                    continue
                kind = data.get("type")

                if kind == "system" and data.get("subtype") == "init":
                    final_session = self._session_id(data, final_session)
                    if final_session:
                        yield ChatSessionStart(final_session)
                elif kind == "stream_event":
                    text = self._stream_event_text(data, has_text=bool(text_parts))
                    if text:
                        text_parts.append(text)
                        yield ChatDelta(text)
                elif kind == "assistant":
                    for event in self._tool_events(data):
                        yield event
                elif kind == "result":
                    final_session = self._session_id(data, final_session)
                    if data.get("is_error"):
                        logger.error("claude chat turn errored: {}", data)
                        raise UpstreamError("AI chat generation failed.")
                    got_result = True

            await process.wait()
            if process.returncode != 0 or not got_result:
                stderr_output = (await stderr_task).decode(errors="replace").strip()
                logger.error("claude CLI failed ({}): {}", process.returncode, stderr_output)
                raise UpstreamError("AI chat generation failed.")

            yield ChatDone("".join(text_parts), final_session)
        finally:
            if process.returncode is None:
                process.kill()
                await process.wait()
            if not stderr_task.done():
                stderr_task.cancel()

    def models(self) -> list[AiModelInfo]:
        """Return the builtin claude models plus any extras cached by the CLI."""
        models = [
            dataclasses.replace(info, default=info.id == _DEFAULT_MODEL) for info in _BUILTIN_MODELS
        ]
        known = {info.id for info in models}
        models += [info for info in self._extra_models() if info.id not in known]
        return models

    def fast_model(self) -> str:
        """Return the Claude model preferred for lightweight tasks."""
        return _FAST_MODEL

    def available(self) -> bool:
        """Return whether the Claude CLI is available on PATH."""
        return shutil.which(self._executable) is not None

    def _extra_models(self) -> list[AiModelInfo]:
        """Read additional models from the claude CLI config cache, if present."""
        try:
            mtime = _CLI_CONFIG_PATH.stat().st_mtime
        except OSError:
            return []
        if self._extra_models_cache and self._extra_models_cache[0] == mtime:
            return self._extra_models_cache[1]

        models: list[AiModelInfo] = []
        try:
            config: Any = json.loads(_CLI_CONFIG_PATH.read_text(encoding="utf-8"))
            if not isinstance(config, dict):
                return []
            entries = cast(dict[str, Any], config).get("additionalModelOptionsCache")
            if not isinstance(entries, list):
                return []
            for entry in cast("list[Any]", entries):
                if not isinstance(entry, dict):
                    continue
                data = cast(dict[str, Any], entry)
                value, label = data.get("value"), data.get("label")
                if not isinstance(value, str) or not isinstance(label, str) or not value:
                    continue
                description = data.get("description")
                models.append(
                    AiModelInfo(
                        id=value,
                        label=label,
                        description=description if isinstance(description, str) else "",
                        efforts=tuple(_EFFORT_LEVELS),
                    )
                )
        except OSError, json.JSONDecodeError:
            logger.warning("Could not read extra models from the claude CLI config.")
            return []

        self._extra_models_cache = (mtime, models)
        return models

    @staticmethod
    def _parse_line(raw_line: bytes) -> dict[str, Any] | None:
        """Parse one stream-json stdout line into a dict, or None when not one."""
        line = raw_line.decode(errors="replace").strip()
        if not line:
            return None
        try:
            payload: Any = json.loads(line)
        except json.JSONDecodeError:
            return None
        if not isinstance(payload, dict):
            return None
        return cast(dict[str, Any], payload)

    @staticmethod
    def _session_id(data: dict[str, Any], fallback: str | None) -> str | None:
        """Extract the session id from a stream-json message."""
        session = data.get("session_id")
        return session if isinstance(session, str) else fallback

    @staticmethod
    def _stream_event_text(data: dict[str, Any], *, has_text: bool) -> str | None:
        """Extract streamed text from a stream_event message, or None."""
        event = data.get("event")
        if not isinstance(event, dict):
            return None
        event = cast(dict[str, Any], event)
        event_type = event.get("type")
        if event_type == "content_block_delta":
            delta = event.get("delta")
            if isinstance(delta, dict):
                delta = cast(dict[str, Any], delta)
                if delta.get("type") == "text_delta":
                    text = delta.get("text")
                    if isinstance(text, str):
                        return text
        elif event_type == "content_block_start" and has_text:
            block = event.get("content_block")
            if isinstance(block, dict) and cast(dict[str, Any], block).get("type") == "text":
                return "\n\n"
        return None

    @staticmethod
    def _tool_events(data: dict[str, Any]) -> list[ChatToolUse]:
        """Extract tool-use events from a complete assistant message."""
        message = data.get("message")
        if not isinstance(message, dict):
            return []
        content = cast(dict[str, Any], message).get("content")
        if not isinstance(content, list):
            return []

        events: list[ChatToolUse] = []
        for block in cast(list[Any], content):
            if not isinstance(block, dict):
                continue
            block = cast(dict[str, Any], block)
            if block.get("type") != "tool_use":
                continue
            raw_name = block.get("name")
            name = raw_name if isinstance(raw_name, str) else "tool"
            if name != "Read" and not name.startswith(_MCP_TOOL_PREFIX):
                continue
            summary = ""
            raw_input = block.get("input")
            if isinstance(raw_input, dict) and raw_input:
                items = cast(dict[str, Any], raw_input)
                summary = ", ".join(f"{key}: {value}" for key, value in items.items())
                if len(summary) > _TOOL_SUMMARY_LIMIT:
                    summary = summary[: _TOOL_SUMMARY_LIMIT - 3] + "..."
            events.append(ChatToolUse(name=name.removeprefix(_MCP_TOOL_PREFIX), summary=summary))
        return events

    @staticmethod
    def _extract_result(raw: str) -> str:
        """Extract the result text from the claude CLI JSON envelope."""
        try:
            payload: Any = json.loads(raw)
        except json.JSONDecodeError:
            return raw.strip()

        if isinstance(payload, dict):
            data = cast(dict[str, Any], payload)
            if data.get("is_error"):
                raise UpstreamError("AI generation returned an error.")
            result = data.get("result")
            if isinstance(result, str):
                return result.strip()

        return raw.strip()
