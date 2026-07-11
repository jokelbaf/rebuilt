import asyncio
import contextlib
import datetime

from crud import discovery_runs as runs_crud
from errors import ConflictError
from loguru import logger
from schemas.discovery import DiscoverySettings

from .currency import refresh_if_stale
from .runner import run_discovery
from .settings import get_settings

_task: asyncio.Task[None] | None = None


def start() -> None:
    """Start the process-local vacancy discovery scheduler task."""
    global _task
    if _task is None or _task.done():
        _task = asyncio.create_task(_loop(), name="discovery-scheduler")


async def stop() -> None:
    """Cancel and await the process-local vacancy discovery scheduler task."""
    global _task
    if _task is None:
        return
    _task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await _task
    _task = None


async def _is_due(interval_minutes: int) -> bool:
    """Return whether no completed run exists within the configured interval."""
    last = await runs_crud.get_last_completed()
    if not last or not last.finished_at:
        return True
    finished_at = last.finished_at
    if finished_at.tzinfo is None:
        finished_at = finished_at.replace(tzinfo=datetime.UTC)
    elapsed = datetime.datetime.now(datetime.UTC) - finished_at
    return elapsed >= datetime.timedelta(minutes=interval_minutes)


async def next_run_at(settings: DiscoverySettings | None = None) -> datetime.datetime | None:
    """Return the next scheduled discovery time, or None when automation is disabled."""
    current = settings or await get_settings()
    if not current.enabled:
        return None
    last = await runs_crud.get_last_completed()
    if not last or not last.finished_at:
        return datetime.datetime.now(datetime.UTC)
    finished_at = last.finished_at
    if finished_at.tzinfo is None:
        finished_at = finished_at.replace(tzinfo=datetime.UTC)
    return finished_at + datetime.timedelta(minutes=current.interval_minutes)


async def _loop() -> None:
    """Refresh currencies and trigger overdue scheduled discovery runs."""
    while True:
        try:
            await refresh_if_stale()
            settings = await get_settings()
            if settings.enabled and await _is_due(settings.interval_minutes):
                await run_discovery("scheduled")
        except ConflictError:
            pass
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("Discovery scheduler iteration failed: {}", exc)
        await asyncio.sleep(60)
