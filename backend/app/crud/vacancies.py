import uuid
from collections.abc import Sequence
from typing import Any

from models import Vacancy
from modules.db import make_session
from sqlalchemy import func
from sqlmodel import col, or_, select


async def list_all(query: str | None = None) -> Sequence[Vacancy]:
    """Return vacancies, optionally filtered by title or description, newest first."""
    async with make_session() as session:
        statement = select(Vacancy)
        if query:
            needle = f"%{query.lower()}%"
            statement = statement.where(
                or_(
                    func.lower(col(Vacancy.title)).like(needle),
                    func.lower(col(Vacancy.description)).like(needle),
                )
            )
        statement = statement.order_by(col(Vacancy.created_at).desc())
        result = await session.exec(statement)
        return result.all()


async def get(vacancy_id: uuid.UUID) -> Vacancy | None:
    """Return a vacancy by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(Vacancy, vacancy_id)


async def create(vacancy: Vacancy) -> Vacancy:
    """Persist a new vacancy."""
    async with make_session() as session:
        session.add(vacancy)
        await session.commit()
        await session.refresh(vacancy)
        return vacancy


async def update(vacancy_id: uuid.UUID, data: dict[str, Any]) -> Vacancy | None:
    """Update a vacancy's fields, returning the updated vacancy or None."""
    async with make_session() as session:
        vacancy = await session.get(Vacancy, vacancy_id)
        if not vacancy:
            return None
        vacancy.sqlmodel_update(data)
        session.add(vacancy)
        await session.commit()
        await session.refresh(vacancy)
        return vacancy


async def delete(vacancy_id: uuid.UUID) -> bool:
    """Delete a vacancy, returning whether it existed."""
    async with make_session() as session:
        vacancy = await session.get(Vacancy, vacancy_id)
        if not vacancy:
            return False
        await session.delete(vacancy)
        await session.commit()
        return True
