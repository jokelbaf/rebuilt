import uuid
from collections.abc import Sequence

from models import CoverLetter
from modules.db import make_session
from sqlmodel import col, select


async def list_saved() -> Sequence[CoverLetter]:
    """Return all saved cover letters, most recently updated first."""
    async with make_session() as session:
        result = await session.exec(
            select(CoverLetter)
            .where(col(CoverLetter.is_saved).is_(True))
            .order_by(col(CoverLetter.updated_at).desc())
        )
        return result.all()


async def get(cover_letter_id: uuid.UUID) -> CoverLetter | None:
    """Return a cover letter by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(CoverLetter, cover_letter_id)


async def create(cover_letter: CoverLetter) -> CoverLetter:
    """Persist a new cover letter."""
    async with make_session() as session:
        session.add(cover_letter)
        await session.commit()
        await session.refresh(cover_letter)
        return cover_letter


async def save(cover_letter: CoverLetter) -> CoverLetter:
    """Persist updates to an existing cover letter."""
    async with make_session() as session:
        merged = await session.merge(cover_letter)
        await session.commit()
        await session.refresh(merged)
        return merged


async def delete(cover_letter_id: uuid.UUID) -> bool:
    """Delete a cover letter, returning whether it existed."""
    async with make_session() as session:
        cover_letter = await session.get(CoverLetter, cover_letter_id)
        if not cover_letter:
            return False
        await session.delete(cover_letter)
        await session.commit()
        return True
