import models  # type: ignore  # noqa: F401
from constants import DATABASE_URL
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init(app: FastAPI) -> None:
    """Initialize the database engine and create tables."""
    app.state.engine = engine
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def shutdown() -> None:
    """Dispose of the database engine."""
    await engine.dispose()


def make_session() -> AsyncSession:
    """Create a new async database session."""
    return _session_factory()
