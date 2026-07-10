from ai import get_active_provider_name, list_providers, set_active_provider
from ai.provider import DEFAULT_PROVIDER, has_provider
from crud import settings as settings_crud
from errors import BadRequestError
from schemas.settings import AiProviderPublic, AiSettingsPublic

_AI_PROVIDER_KEY = "ai_provider"


async def initialize_ai_provider() -> None:
    """Load the persisted AI provider into the runtime registry."""
    stored = await settings_crud.get_value(_AI_PROVIDER_KEY)
    set_active_provider(stored if stored and has_provider(stored) else DEFAULT_PROVIDER)


async def get_ai_settings() -> AiSettingsPublic:
    """Return the active AI provider and all available choices."""
    return AiSettingsPublic(
        provider=get_active_provider_name(),
        providers=[
            AiProviderPublic(
                id=provider.name,
                label=provider.label,
                description=provider.description,
                available=provider.available(),
                install_hint=provider.install_hint,
            )
            for provider in list_providers()
        ],
    )


async def update_ai_provider(name: str) -> AiSettingsPublic:
    """Validate, persist and activate an AI provider."""
    if not has_provider(name):
        raise BadRequestError("Unknown AI provider.")
    provider = next(item for item in list_providers() if item.name == name)
    if not provider.available():
        raise BadRequestError(f"{provider.label} is not available. {provider.install_hint}")
    await settings_crud.set_value(_AI_PROVIDER_KEY, name)
    set_active_provider(name)
    return await get_ai_settings()
