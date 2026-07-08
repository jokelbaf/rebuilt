import uuid
from collections.abc import Sequence

from models import GitSource
from modules.db import make_session
from sqlmodel import col, select


async def list_all() -> Sequence[GitSource]:
    """Return all git sources, newest first."""
    async with make_session() as session:
        result = await session.exec(select(GitSource).order_by(col(GitSource.created_at).desc()))
        return result.all()


async def get(source_id: uuid.UUID) -> GitSource | None:
    """Return a git source by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(GitSource, source_id)


async def create(source: GitSource) -> GitSource:
    """Persist a new git source."""
    async with make_session() as session:
        session.add(source)
        await session.commit()
        await session.refresh(source)
        return source


async def delete(source_id: uuid.UUID) -> bool:
    """Delete a git source, returning whether it existed."""
    async with make_session() as session:
        source = await session.get(GitSource, source_id)
        if not source:
            return False
        await session.delete(source)
        await session.commit()
        return True
