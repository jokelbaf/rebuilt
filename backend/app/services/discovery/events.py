import asyncio
import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any, Literal

from crud import discovery_events as events_crud
from models import DiscoveryEvent, DiscoveryRun
from schemas.discovery import DiscoveryEventPublic, DiscoveryRunPublic

_QUEUE_SIZE = 256


@dataclass(frozen=True, slots=True)
class DiscoveryStreamItem:
    """A named discovery payload ready for SSE serialization."""

    event: Literal["discovery-event", "run-status"]
    data: DiscoveryEventPublic | DiscoveryRunPublic


_subscribers: set[asyncio.Queue[DiscoveryStreamItem]] = set()


def _publish(item: DiscoveryStreamItem) -> None:
    """Publish an item to every live subscriber without blocking producers."""
    for queue in tuple(_subscribers):
        if queue.full():
            queue.get_nowait()
        queue.put_nowait(item)


async def emit(
    run_id: uuid.UUID,
    level: str,
    kind: str,
    message: str,
    data: dict[str, Any] | None = None,
) -> DiscoveryEventPublic:
    """Persist a discovery event and publish it to live subscribers."""
    event = await events_crud.create(
        DiscoveryEvent(
            run_id=run_id,
            level=level,
            kind=kind,
            message=message,
            data=data or {},
        )
    )
    public = DiscoveryEventPublic.model_validate(event)
    _publish(DiscoveryStreamItem(event="discovery-event", data=public))
    return public


def publish_run_status(run: DiscoveryRun) -> None:
    """Publish the latest state of a discovery run to live subscribers."""
    _publish(
        DiscoveryStreamItem(
            event="run-status",
            data=DiscoveryRunPublic.model_validate(run),
        )
    )


async def subscribe() -> AsyncIterator[DiscoveryStreamItem]:
    """Yield discovery events published after this subscription begins."""
    queue: asyncio.Queue[DiscoveryStreamItem] = asyncio.Queue(maxsize=_QUEUE_SIZE)
    _subscribers.add(queue)
    try:
        while True:
            yield await queue.get()
    finally:
        _subscribers.discard(queue)
