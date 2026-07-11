from collections.abc import Sequence
from typing import Any

from models import PlatformAccount
from modules.db import make_session
from sqlmodel import col, select


async def list_all() -> Sequence[PlatformAccount]:
    """Return all configured platform accounts ordered by platform."""
    async with make_session() as session:
        result = await session.exec(select(PlatformAccount).order_by(col(PlatformAccount.platform)))
        return result.all()


async def get(platform: str) -> PlatformAccount | None:
    """Return the account for a platform, or None when it is not configured."""
    async with make_session() as session:
        result = await session.exec(
            select(PlatformAccount).where(PlatformAccount.platform == platform)
        )
        return result.first()


async def upsert(platform: str, email: str, password: str) -> PlatformAccount:
    """Create or replace a platform account's credentials."""
    async with make_session() as session:
        result = await session.exec(
            select(PlatformAccount).where(PlatformAccount.platform == platform)
        )
        account = result.first()
        if account:
            account.email = email
            account.password = password
            account.session_state = None
            account.status = "unverified"
            account.last_verified_at = None
        else:
            account = PlatformAccount(platform=platform, email=email, password=password)
        session.add(account)
        await session.commit()
        await session.refresh(account)
        return account


async def update(platform: str, data: dict[str, Any]) -> PlatformAccount | None:
    """Update a platform account, returning the updated row or None."""
    async with make_session() as session:
        result = await session.exec(
            select(PlatformAccount).where(PlatformAccount.platform == platform)
        )
        account = result.first()
        if not account:
            return None
        account.sqlmodel_update(data)
        session.add(account)
        await session.commit()
        await session.refresh(account)
        return account


async def delete(platform: str) -> bool:
    """Delete a platform account, returning whether it existed."""
    async with make_session() as session:
        result = await session.exec(
            select(PlatformAccount).where(PlatformAccount.platform == platform)
        )
        account = result.first()
        if not account:
            return False
        await session.delete(account)
        await session.commit()
        return True
