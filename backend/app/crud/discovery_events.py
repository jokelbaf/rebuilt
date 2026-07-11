import uuid
from collections.abc import Sequence

from models import DiscoveryEvent
from modules.db import make_session
from sqlmodel import col, select


async def create(event: DiscoveryEvent) -> DiscoveryEvent:
    """Persist a discovery event."""
    async with make_session() as session:
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event


async def list_for_run(
    run_id: uuid.UUID, *, before_id: int | None = None, limit: int = 100
) -> Sequence[DiscoveryEvent]:
    """Return a page of run events, newest first."""
    async with make_session() as session:
        statement = select(DiscoveryEvent).where(DiscoveryEvent.run_id == run_id)
        if before_id is not None:
            statement = statement.where(col(DiscoveryEvent.id) < before_id)
        statement = statement.order_by(col(DiscoveryEvent.id).desc()).limit(limit)
        result = await session.exec(statement)
        return result.all()
