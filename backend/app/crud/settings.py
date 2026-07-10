from models import AppSetting
from modules.db import make_session


async def get_value(key: str) -> str | None:
    """Return a persisted setting value, or None when it is unset."""
    async with make_session() as session:
        setting = await session.get(AppSetting, key)
        return setting.value if setting else None


async def set_value(key: str, value: str) -> None:
    """Create or replace a persisted setting value."""
    async with make_session() as session:
        setting = await session.get(AppSetting, key)
        if setting:
            setting.value = value
        else:
            setting = AppSetting(key=key, value=value)
        session.add(setting)
        await session.commit()
