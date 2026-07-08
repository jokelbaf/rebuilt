import uuid
from collections.abc import Sequence

from models import Resume
from modules.db import make_session
from sqlalchemy import func
from sqlmodel import col, select


async def list_saved(query: str | None = None) -> Sequence[Resume]:
    """Return saved resumes, optionally filtered by name, most recently updated first."""
    async with make_session() as session:
        statement = select(Resume).where(col(Resume.is_saved).is_(True))
        if query:
            needle = f"%{query.lower()}%"
            statement = statement.where(func.lower(col(Resume.name)).like(needle))
        statement = statement.order_by(col(Resume.updated_at).desc())
        result = await session.exec(statement)
        return result.all()


async def get(resume_id: uuid.UUID) -> Resume | None:
    """Return a resume by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(Resume, resume_id)


async def create(resume: Resume) -> Resume:
    """Persist a new resume."""
    async with make_session() as session:
        session.add(resume)
        await session.commit()
        await session.refresh(resume)
        return resume


async def save(resume: Resume) -> Resume:
    """Persist updates to an existing resume."""
    async with make_session() as session:
        merged = await session.merge(resume)
        await session.commit()
        await session.refresh(merged)
        return merged


async def delete(resume_id: uuid.UUID) -> bool:
    """Delete a resume, returning whether it existed."""
    async with make_session() as session:
        resume = await session.get(Resume, resume_id)
        if not resume:
            return False
        await session.delete(resume)
        await session.commit()
        return True
