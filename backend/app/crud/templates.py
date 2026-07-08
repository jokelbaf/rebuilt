from collections.abc import Sequence

from models import Template
from models.base import utcnow
from modules.db import make_session
from sqlmodel import col, select


async def list_all() -> Sequence[Template]:
    """Return all templates, most recently updated first."""
    async with make_session() as session:
        result = await session.exec(select(Template).order_by(col(Template.updated_at).desc()))
        return result.all()


async def get(name: str) -> Template | None:
    """Return a template by name, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(Template, name)


async def create(template: Template) -> Template:
    """Persist a new template."""
    async with make_session() as session:
        session.add(template)
        await session.commit()
        await session.refresh(template)
        return template


async def update(name: str, html: str) -> Template | None:
    """Update a template's HTML, returning the updated template or None."""
    async with make_session() as session:
        template = await session.get(Template, name)
        if not template:
            return None
        template.html = html
        template.updated_at = utcnow()
        session.add(template)
        await session.commit()
        await session.refresh(template)
        return template


async def delete(name: str) -> bool:
    """Delete a template, returning whether it existed."""
    async with make_session() as session:
        template = await session.get(Template, name)
        if not template:
            return False
        await session.delete(template)
        await session.commit()
        return True
