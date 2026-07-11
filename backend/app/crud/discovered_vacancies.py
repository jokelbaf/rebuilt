import uuid
from collections.abc import Sequence
from typing import Any

from models import DiscoveredVacancy
from models.base import utcnow
from modules.db import make_session
from sqlalchemy import func
from sqlmodel import col, or_, select


async def list_all(
    *,
    status: str | None = None,
    platform: str | None = None,
    min_score: int | None = None,
    query: str | None = None,
) -> Sequence[DiscoveredVacancy]:
    """Return discovered vacancies matching inbox filters."""
    async with make_session() as session:
        statement = select(DiscoveredVacancy)
        if status:
            statement = statement.where(DiscoveredVacancy.status == status)
        if platform:
            statement = statement.where(DiscoveredVacancy.platform == platform)
        if min_score is not None:
            statement = statement.where(col(DiscoveredVacancy.score) >= min_score)
        if query:
            needle = f"%{query.lower()}%"
            statement = statement.where(
                or_(
                    func.lower(col(DiscoveredVacancy.title)).like(needle),
                    func.lower(col(DiscoveredVacancy.company)).like(needle),
                )
            )
        statement = statement.order_by(
            col(DiscoveredVacancy.score).desc().nullslast(),
            col(DiscoveredVacancy.created_at).desc(),
        )
        result = await session.exec(statement)
        return result.all()


async def get(discovered_id: uuid.UUID) -> DiscoveredVacancy | None:
    """Return a discovered vacancy by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(DiscoveredVacancy, discovered_id)


async def count(*, status: str | None = None) -> int:
    """Count discovered vacancies matching an optional status."""
    async with make_session() as session:
        statement = select(func.count()).select_from(DiscoveredVacancy)
        if status:
            statement = statement.where(DiscoveredVacancy.status == status)
        result = await session.exec(statement)
        return result.one()


async def exists(platform: str, external_id: str) -> bool:
    """Return whether a platform vacancy has ever been discovered."""
    async with make_session() as session:
        result = await session.exec(
            select(DiscoveredVacancy.id).where(
                DiscoveredVacancy.platform == platform,
                DiscoveredVacancy.external_id == external_id,
            )
        )
        return result.first() is not None


async def create(vacancy: DiscoveredVacancy) -> DiscoveredVacancy:
    """Persist a discovered vacancy."""
    async with make_session() as session:
        session.add(vacancy)
        await session.commit()
        await session.refresh(vacancy)
        return vacancy


async def update(discovered_id: uuid.UUID, data: dict[str, Any]) -> DiscoveredVacancy | None:
    """Update a discovered vacancy, returning the updated row or None."""
    async with make_session() as session:
        vacancy = await session.get(DiscoveredVacancy, discovered_id)
        if not vacancy:
            return None
        vacancy.sqlmodel_update(data)
        vacancy.updated_at = utcnow()
        session.add(vacancy)
        await session.commit()
        await session.refresh(vacancy)
        return vacancy


async def list_for_run(run_id: uuid.UUID) -> Sequence[DiscoveredVacancy]:
    """Return all discovered vacancies created by a run."""
    async with make_session() as session:
        result = await session.exec(
            select(DiscoveredVacancy)
            .where(DiscoveredVacancy.run_id == run_id)
            .order_by(col(DiscoveredVacancy.created_at).asc())
        )
        return result.all()
