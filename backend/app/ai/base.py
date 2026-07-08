import abc
import pathlib
from collections.abc import AsyncIterator

from .events import AiModelInfo, ChatEvent


class AiProvider(abc.ABC):
    """Unified interface for an AI backend used to generate and analyze content."""

    name: str

    @abc.abstractmethod
    async def complete(
        self,
        prompt: str,
        *,
        system: str | None = None,
        model: str | None = None,
        workspace: pathlib.Path | None = None,
    ) -> str:
        """Run a single completion and return the model's text output.

        When ``workspace`` is provided, the provider may read files within that
        directory to inform its answer.
        """

    @abc.abstractmethod
    def chat_stream(
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
        """Stream one conversational turn as a sequence of chat events.

        ``session_id`` resumes a previous provider-side conversation when the
        provider supports it. ``mcp_url`` points at the app's MCP server so the
        provider can call the app's data tools.
        """

    @abc.abstractmethod
    def models(self) -> list[AiModelInfo]:
        """Return the models this provider offers for chatting."""

    def efforts(self) -> list[str]:
        """Return the effort levels this provider supports, if any."""
        return []
