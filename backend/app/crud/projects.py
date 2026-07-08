import uuid
from collections.abc import Sequence
from typing import Any

from models import Project
from models.base import utcnow
from modules.db import make_session
from sqlalchemy import func
from sqlmodel import col, or_, select


async def list_all(query: str | None = None) -> Sequence[Project]:
    """Return projects, optionally filtered by title or name, newest first."""
    async with make_session() as session:
        statement = select(Project)
        if query:
            needle = f"%{query.lower()}%"
            statement = statement.where(
                or_(
                    func.lower(col(Project.title)).like(needle),
                    func.lower(col(Project.name)).like(needle),
                )
            )
        statement = statement.order_by(col(Project.updated_at).desc())
        result = await session.exec(statement)
        return result.all()


async def get(project_id: uuid.UUID) -> Project | None:
    """Return a project by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(Project, project_id)


async def get_by_name(name: str) -> Project | None:
    """Return a project by its unique name, or None if it does not exist."""
    async with make_session() as session:
        result = await session.exec(select(Project).where(Project.name == name))
        return result.first()


async def create(project: Project) -> Project:
    """Persist a new project."""
    async with make_session() as session:
        session.add(project)
        await session.commit()
        await session.refresh(project)
        return project


async def update(project_id: uuid.UUID, data: dict[str, Any]) -> Project | None:
    """Update a project's fields, returning the updated project or None."""
    async with make_session() as session:
        project = await session.get(Project, project_id)
        if not project:
            return None
        project.sqlmodel_update(data)
        project.updated_at = utcnow()
        session.add(project)
        await session.commit()
        await session.refresh(project)
        return project


async def delete(project_id: uuid.UUID) -> bool:
    """Delete a project, returning whether it existed."""
    async with make_session() as session:
        project = await session.get(Project, project_id)
        if not project:
            return False
        await session.delete(project)
        await session.commit()
        return True
