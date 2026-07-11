import json

from crud import settings as settings_crud
from loguru import logger
from pydantic import ValidationError
from schemas.discovery import DiscoverySettings

SETTINGS_KEY = "discovery.settings"


async def get_settings() -> DiscoverySettings:
    """Load validated discovery settings, falling back to defaults when absent or invalid."""
    stored = await settings_crud.get_value(SETTINGS_KEY)
    if not stored:
        return DiscoverySettings()
    try:
        return DiscoverySettings.model_validate_json(stored)
    except ValidationError:
        logger.warning("Stored discovery settings are invalid; using defaults")
        return DiscoverySettings()


async def save_settings(settings: DiscoverySettings) -> DiscoverySettings:
    """Persist and return validated discovery settings."""
    await settings_crud.set_value(
        SETTINGS_KEY, json.dumps(settings.model_dump(mode="json", by_alias=True))
    )
    return settings
