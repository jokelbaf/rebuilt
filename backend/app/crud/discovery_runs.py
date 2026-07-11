import uuid
from collections.abc import Sequence
from typing import Any

from models import DiscoveryEvent, DiscoveryRun
from modules.db import make_session
from sqlalchemy import delete
from sqlmodel import col, select


async def list_all(limit: int = 50) -> Sequence[DiscoveryRun]:
    """Return recent discovery runs, newest first."""
    async with make_session() as session:
        statement = select(DiscoveryRun).order_by(col(DiscoveryRun.started_at).desc()).limit(limit)
        result = await session.exec(statement)
        return result.all()


async def get(run_id: uuid.UUID) -> DiscoveryRun | None:
    """Return a discovery run by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(DiscoveryRun, run_id)


async def get_active() -> DiscoveryRun | None:
    """Return the newest running discovery run, if one exists."""
    async with make_session() as session:
        statement = (
            select(DiscoveryRun)
            .where(DiscoveryRun.status == "running")
            .order_by(col(DiscoveryRun.started_at).desc())
        )
        result = await session.exec(statement)
        return result.first()


async def get_last_completed() -> DiscoveryRun | None:
    """Return the most recent completed discovery run, if one exists."""
    async with make_session() as session:
        statement = (
            select(DiscoveryRun)
            .where(DiscoveryRun.status == "completed")
            .order_by(col(DiscoveryRun.finished_at).desc())
        )
        result = await session.exec(statement)
        return result.first()


async def create(run: DiscoveryRun) -> DiscoveryRun:
    """Persist a discovery run."""
    async with make_session() as session:
        session.add(run)
        await session.commit()
        await session.refresh(run)
        return run


async def update(run_id: uuid.UUID, data: dict[str, Any]) -> DiscoveryRun | None:
    """Update a discovery run, returning the updated row or None."""
    async with make_session() as session:
        run = await session.get(DiscoveryRun, run_id)
        if not run:
            return None
        run.sqlmodel_update(data)
        session.add(run)
        await session.commit()
        await session.refresh(run)
        return run


async def delete_run(run_id: uuid.UUID) -> bool:
    """Delete a finished discovery run and its persisted events."""
    async with make_session() as session:
        run = await session.get(DiscoveryRun, run_id)
        if not run or run.status == "running":
            return False
        await session.exec(delete(DiscoveryEvent).where(col(DiscoveryEvent.run_id) == run_id))
        await session.delete(run)
        await session.commit()
        return True


async def prune(keep: int = 50) -> None:
    """Delete runs beyond the retention limit together with their events."""
    async with make_session() as session:
        result = await session.exec(
            select(DiscoveryRun.id).order_by(col(DiscoveryRun.started_at).desc()).offset(keep)
        )
        run_ids = list(result.all())
        if not run_ids:
            return
        await session.exec(delete(DiscoveryEvent).where(col(DiscoveryEvent.run_id).in_(run_ids)))
        await session.exec(delete(DiscoveryRun).where(col(DiscoveryRun.id).in_(run_ids)))
        await session.commit()
