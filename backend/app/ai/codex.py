import asyncio
import json
import pathlib
import shutil
import subprocess
from collections.abc import AsyncIterator
from typing import Any, cast

from errors import UpstreamError
from loguru import logger
from modules.version import get_application_version

from .base import AiProvider
from .codex_usage import read_codex_usage
from .events import (
    AiModelInfo,
    AiUsageSnapshot,
    ChatDelta,
    ChatDone,
    ChatEvent,
    ChatSessionStart,
    ChatToolUse,
)

_MCP_SERVER = "rebuilt"
_MCP_TOOLS = (
    "search_vacancies",
    "get_vacancy",
    "search_projects",
    "get_project",
    "get_profile",
    "get_experience",
)
_TOOL_SUMMARY_LIMIT = 120
_MODEL_CATALOG_TIMEOUT = 10


class CodexProvider(AiProvider):
    """AI provider backed by the local Codex CLI in JSONL exec mode."""

    name = "codex"
    label = "Codex"
    description = "OpenAI's local Codex CLI using your existing sign-in."
    install_hint = "Install Codex and sign in with the codex CLI."

    def __init__(self, executable: str = "codex") -> None:
        self._executable_name = executable
        self._executable = shutil.which(executable) or executable
        self._models_cache: list[AiModelInfo] | None = None

    async def complete(
        self,
        prompt: str,
        *,
        system: str | None = None,
        model: str | None = None,
        workspace: pathlib.Path | None = None,
    ) -> str:
        """Run an ephemeral Codex turn and return its final response."""
        args = self._command(
            system=system,
            model=model,
            effort=None,
            session_id=None,
            workspace=workspace,
            mcp_url=None,
            ephemeral=True,
        )
        try:
            process = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await process.communicate(input=prompt.encode())
        except FileNotFoundError as exc:
            raise UpstreamError("The Codex CLI is not available.") from exc

        final_text, error = self._completed_turn(stdout)
        if process.returncode != 0 or error:
            self._log_failure(process.returncode, stderr, error)
            raise UpstreamError(error or "AI generation failed.")
        if not final_text:
            raise UpstreamError("The AI returned no output.")
        return final_text

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
        """Stream one Codex turn from JSONL exec events."""
        args = self._command(
            system=system,
            model=model,
            effort=effort,
            session_id=session_id,
            workspace=workspace,
            mcp_url=mcp_url,
            ephemeral=False,
        )
        try:
            process = await asyncio.create_subprocess_exec(
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
        except FileNotFoundError as exc:
            raise UpstreamError("The Codex CLI is not available.") from exc

        assert process.stdin and process.stdout and process.stderr
        stderr_task = asyncio.create_task(process.stderr.read())
        final_session = session_id
        final_text = ""
        error: str | None = None
        completed = False
        seen_tools: set[str] = set()

        try:
            process.stdin.write(prompt.encode())
            await process.stdin.drain()
            process.stdin.close()

            async for raw_line in process.stdout:
                data = self._parse_line(raw_line)
                if data is None:
                    continue
                kind = data.get("type")
                if kind == "thread.started":
                    thread_id = data.get("thread_id")
                    if isinstance(thread_id, str):
                        final_session = thread_id
                        yield ChatSessionStart(thread_id)
                elif kind in {"item.started", "item.completed"}:
                    item = data.get("item")
                    if not isinstance(item, dict):
                        continue
                    item = cast(dict[str, Any], item)
                    item_id = item.get("id")
                    tool = self._tool_event(item)
                    if tool and isinstance(item_id, str) and item_id not in seen_tools:
                        seen_tools.add(item_id)
                        yield tool
                    if kind == "item.completed" and item.get("type") == "agent_message":
                        text = item.get("text")
                        if isinstance(text, str) and text:
                            final_text = text
                            yield ChatDelta(text)
                elif kind in {"turn.failed", "error"}:
                    error = self._event_error(data) or "AI chat generation failed."
                elif kind == "turn.completed":
                    completed = True

            await process.wait()
            if process.returncode != 0 or error or not completed:
                stderr = await stderr_task
                self._log_failure(process.returncode, stderr, error)
                raise UpstreamError(error or "AI chat generation failed.")
            if not final_text:
                raise UpstreamError("The AI returned no output.")
            yield ChatDone(final_text, final_session)
        finally:
            if process.returncode is None:
                process.kill()
                await process.wait()
            if not stderr_task.done():
                stderr_task.cancel()

    def models(self) -> list[AiModelInfo]:
        """Return the visible model catalog bundled with the Codex CLI."""
        if self._models_cache is None:
            self._models_cache = self._load_models()
        return list(self._models_cache)

    async def usage(self) -> AiUsageSnapshot:
        """Return Codex account usage from the local app server."""
        return await read_codex_usage(self._executable, get_application_version())

    def fast_model(self) -> str | None:
        """Return the quickest visible Codex model from the local catalog."""
        models = self.models()
        fast = next(
            (item for item in models if "mini" in item.id or "luna" in item.id),
            None,
        )
        return fast.id if fast else self.default_model()

    def available(self) -> bool:
        """Return whether the Codex CLI is available on PATH."""
        return shutil.which(self._executable_name) is not None

    def _command(
        self,
        *,
        system: str | None,
        model: str | None,
        effort: str | None,
        session_id: str | None,
        workspace: pathlib.Path | None,
        mcp_url: str | None,
        ephemeral: bool,
    ) -> list[str]:
        """Build a non-interactive Codex exec command."""
        args = [self._executable, "exec"]
        if session_id:
            args.append("resume")
        args += [
            "--json",
            "--skip-git-repo-check",
            "--ignore-user-config",
            "-c",
            'approval_policy="never"',
        ]
        if not session_id:
            args += ["--sandbox", "read-only"]
            if workspace:
                args += ["--cd", str(workspace)]
        if ephemeral:
            args.append("--ephemeral")
        selected_model = model or self.default_model()
        if selected_model:
            args += ["--model", selected_model]
        if effort:
            args += ["-c", f"model_reasoning_effort={json.dumps(effort)}"]
        if system:
            args += ["-c", f"developer_instructions={json.dumps(system)}"]
        if mcp_url:
            args += [
                "-c",
                f"mcp_servers.{_MCP_SERVER}.url={json.dumps(mcp_url)}",
                "-c",
                f'mcp_servers.{_MCP_SERVER}.default_tools_approval_mode="approve"',
                "-c",
                f"mcp_servers.{_MCP_SERVER}.enabled_tools={json.dumps(list(_MCP_TOOLS))}",
            ]
        if session_id:
            args.append(session_id)
        args.append("-")
        return args

    def _load_models(self) -> list[AiModelInfo]:
        """Load and normalize the Codex CLI's bundled model catalog."""
        try:
            result = subprocess.run(
                [self._executable, "debug", "models", "--bundled"],
                capture_output=True,
                text=True,
                timeout=_MODEL_CATALOG_TIMEOUT,
                check=False,
            )
        except FileNotFoundError, subprocess.SubprocessError:
            return []
        if result.returncode != 0:
            logger.warning("Could not load the Codex model catalog: {}", result.stderr.strip())
            return []
        try:
            payload: Any = json.loads(result.stdout)
        except json.JSONDecodeError:
            logger.warning("Could not parse the Codex model catalog.")
            return []
        if not isinstance(payload, dict):
            return []
        entries = cast(dict[str, Any], payload).get("models")
        if not isinstance(entries, list):
            return []

        models: list[AiModelInfo] = []
        for entry in cast(list[Any], entries):
            info = self._model_info(entry, default=not models)
            if info:
                models.append(info)
        return models

    @staticmethod
    def _model_info(entry: Any, *, default: bool) -> AiModelInfo | None:
        """Normalize one visible Codex model catalog entry."""
        if not isinstance(entry, dict):
            return None
        data = cast(dict[str, Any], entry)
        if data.get("visibility") != "list":
            return None
        slug = data.get("slug")
        label = data.get("display_name")
        if not isinstance(slug, str) or not isinstance(label, str):
            return None
        description = data.get("description")
        raw_efforts = data.get("supported_reasoning_levels")
        efforts: list[str] = []
        if isinstance(raw_efforts, list):
            for raw in cast(list[Any], raw_efforts):
                if not isinstance(raw, dict):
                    continue
                effort = cast(dict[str, Any], raw).get("effort")
                if isinstance(effort, str):
                    efforts.append(effort)
        return AiModelInfo(
            id=slug,
            label=label,
            description=description if isinstance(description, str) else "",
            default=default,
            efforts=tuple(efforts),
        )

    @staticmethod
    def _completed_turn(raw: bytes) -> tuple[str, str | None]:
        """Extract the final response and error from Codex JSONL output."""
        final_text = ""
        error: str | None = None
        for raw_line in raw.splitlines():
            data = CodexProvider._parse_line(raw_line)
            if data is None:
                continue
            if data.get("type") == "item.completed":
                item = data.get("item")
                if isinstance(item, dict):
                    item = cast(dict[str, Any], item)
                    text = item.get("text")
                    if item.get("type") == "agent_message" and isinstance(text, str):
                        final_text = text
            elif data.get("type") in {"turn.failed", "error"}:
                error = CodexProvider._event_error(data)
        return final_text, error

    @staticmethod
    def _parse_line(raw_line: bytes) -> dict[str, Any] | None:
        """Parse one Codex JSONL event into a dictionary."""
        try:
            payload: Any = json.loads(raw_line)
        except json.JSONDecodeError, UnicodeDecodeError:
            return None
        return cast(dict[str, Any], payload) if isinstance(payload, dict) else None

    @staticmethod
    def _event_error(data: dict[str, Any]) -> str | None:
        """Extract an error message from a Codex event."""
        raw = data.get("error")
        if isinstance(raw, dict):
            message = cast(dict[str, Any], raw).get("message")
            return message if isinstance(message, str) else None
        message = data.get("message")
        return message if isinstance(message, str) else None

    @staticmethod
    def _tool_event(item: dict[str, Any]) -> ChatToolUse | None:
        """Convert a visible Codex tool item into a chat tool event."""
        kind = item.get("type")
        if kind == "mcp_tool_call" and item.get("server") == _MCP_SERVER:
            name = item.get("tool")
            if not isinstance(name, str):
                name = "tool"
            return ChatToolUse(name=name, summary=CodexProvider._summary(item.get("arguments")))
        if kind == "command_execution":
            command = item.get("command")
            if isinstance(command, str):
                return ChatToolUse(name="Read", summary=CodexProvider._truncate(command))
        return None

    @staticmethod
    def _summary(value: Any) -> str:
        """Render a compact summary of a tool argument payload."""
        if isinstance(value, dict):
            data = cast(dict[str, Any], value)
            return CodexProvider._truncate(", ".join(f"{key}: {val}" for key, val in data.items()))
        return CodexProvider._truncate(str(value)) if value is not None else ""

    @staticmethod
    def _truncate(value: str) -> str:
        """Truncate a tool summary to the UI limit."""
        return (
            value if len(value) <= _TOOL_SUMMARY_LIMIT else value[: _TOOL_SUMMARY_LIMIT - 3] + "..."
        )

    @staticmethod
    def _log_failure(returncode: int | None, stderr: bytes, error: str | None) -> None:
        """Log diagnostic output for a failed Codex invocation."""
        details = stderr.decode(errors="replace").strip()
        logger.error("codex CLI failed ({}): {} {}", returncode, error or "", details)
