import uuid
from collections.abc import Sequence
from typing import Any

from models import SearchQuery
from models.base import utcnow
from modules.db import make_session
from sqlmodel import col, select


async def list_all(*, enabled_only: bool = False) -> Sequence[SearchQuery]:
    """Return search queries, optionally restricted to enabled rows."""
    async with make_session() as session:
        statement = select(SearchQuery)
        if enabled_only:
            statement = statement.where(SearchQuery.enabled)
        result = await session.exec(statement.order_by(col(SearchQuery.created_at).asc()))
        return result.all()


async def get(query_id: uuid.UUID) -> SearchQuery | None:
    """Return a search query by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(SearchQuery, query_id)


async def create(query: SearchQuery) -> SearchQuery:
    """Persist a search query."""
    async with make_session() as session:
        session.add(query)
        await session.commit()
        await session.refresh(query)
        return query


async def update(query_id: uuid.UUID, data: dict[str, Any]) -> SearchQuery | None:
    """Update a search query, returning the updated row or None."""
    async with make_session() as session:
        query = await session.get(SearchQuery, query_id)
        if not query:
            return None
        query.sqlmodel_update(data)
        query.updated_at = utcnow()
        session.add(query)
        await session.commit()
        await session.refresh(query)
        return query


async def delete(query_id: uuid.UUID) -> bool:
    """Delete a search query, returning whether it existed."""
    async with make_session() as session:
        query = await session.get(SearchQuery, query_id)
        if not query:
            return False
        await session.delete(query)
        await session.commit()
        return True
