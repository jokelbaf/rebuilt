import abc
import pathlib
from collections.abc import AsyncIterator

from .events import AiModelInfo, AiUsageSnapshot, ChatEvent


class AiProvider(abc.ABC):
    """Unified interface for an AI backend used to generate and analyze content."""

    name: str
    label: str
    description: str
    install_hint: str

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

    @abc.abstractmethod
    async def usage(self) -> AiUsageSnapshot:
        """Return current account usage windows for this provider."""

    def efforts(self, model: str | None = None) -> list[str]:
        """Return the effort levels supported by a model, if any."""
        if model:
            info = next((item for item in self.models() if item.id == model), None)
            return list(info.efforts) if info else []
        return list(dict.fromkeys(effort for item in self.models() for effort in item.efforts))

    def default_model(self) -> str | None:
        """Return the provider's default model id, if one is available."""
        models = self.models()
        default = next((item for item in models if item.default), None)
        return default.id if default else (models[0].id if models else None)

    def fast_model(self) -> str | None:
        """Return the provider model preferred for lightweight tasks."""
        return self.default_model()

    def available(self) -> bool:
        """Return whether the provider's local runtime is available."""
        return True
