import pathlib

import models  # type: ignore  # noqa: F401
from constants import DATABASE_URL
from fastapi import FastAPI
from migrations import upgrade_database
from migrations.runner import configure_sqlite_connection
from sqlalchemy import event
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
event.listen(engine.sync_engine, "connect", configure_sqlite_connection)

_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init(app: FastAPI) -> None:
    """Migrate and initialize the database engine."""
    await upgrade_database(engine, _database_path())
    app.state.engine = engine


async def shutdown() -> None:
    """Dispose of the database engine."""
    await engine.dispose()


def make_session() -> AsyncSession:
    """Create a new async database session."""
    return _session_factory()


def _database_path() -> pathlib.Path | None:
    """Return the SQLite file path used by the configured engine."""
    database = engine.url.database
    if engine.url.get_backend_name() != "sqlite" or not database or database == ":memory:":
        return None
    return pathlib.Path(database)
