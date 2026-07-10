import functools

from .base import AiProvider
from .claude_code import ClaudeCodeProvider
from .codex import CodexProvider

DEFAULT_PROVIDER = "claude-code"

_PROVIDERS: dict[str, type[AiProvider]] = {
    "claude-code": ClaudeCodeProvider,
    "codex": CodexProvider,
}
_active_provider = DEFAULT_PROVIDER


@functools.lru_cache
def _build_provider(name: str) -> AiProvider:
    """Build and cache a registered AI provider."""
    provider_cls = _PROVIDERS[name]
    return provider_cls()


def get_provider(name: str | None = None) -> AiProvider:
    """Return the active or explicitly named AI provider singleton."""
    return _build_provider(name or _active_provider)


def list_providers() -> list[AiProvider]:
    """Return every registered AI provider."""
    return [_build_provider(name) for name in _PROVIDERS]


def has_provider(name: str) -> bool:
    """Return whether an AI provider name is registered."""
    return name in _PROVIDERS


def set_active_provider(name: str) -> None:
    """Set the active AI provider for new work."""
    if name not in _PROVIDERS:
        raise ValueError(f"Unknown AI provider: {name}")
    global _active_provider
    _active_provider = name


def get_active_provider_name() -> str:
    """Return the active AI provider name."""
    return _active_provider
