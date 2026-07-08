import functools
import os

from .base import AiProvider
from .claude_code import ClaudeCodeProvider

_PROVIDERS: dict[str, type[AiProvider]] = {
    "claude-code": ClaudeCodeProvider,
}


@functools.lru_cache
def get_provider() -> AiProvider:
    """Return the configured AI provider singleton."""
    name = os.getenv("REBUILT_AI_PROVIDER", "claude-code")
    provider_cls = _PROVIDERS.get(name, ClaudeCodeProvider)
    return provider_cls()
