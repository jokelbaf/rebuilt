from collections.abc import Sequence

from models import MarkdownFile
from models.base import utcnow
from modules.db import make_session
from sqlalchemy import func
from sqlmodel import col, or_, select


async def list_for(collection: str, query: str | None = None) -> Sequence[MarkdownFile]:
    """Return markdown files in a collection, optionally filtered by name or content."""
    async with make_session() as session:
        statement = select(MarkdownFile).where(MarkdownFile.collection == collection)
        if query:
            needle = f"%{query.lower()}%"
            statement = statement.where(
                or_(
                    func.lower(col(MarkdownFile.name)).like(needle),
                    func.lower(col(MarkdownFile.content)).like(needle),
                )
            )
        statement = statement.order_by(col(MarkdownFile.updated_at).desc())
        result = await session.exec(statement)
        return result.all()


async def get(collection: str, name: str) -> MarkdownFile | None:
    """Return a markdown file by collection and name, or None."""
    async with make_session() as session:
        return await session.get(MarkdownFile, (collection, name))


async def create(file: MarkdownFile) -> MarkdownFile:
    """Persist a new markdown file."""
    async with make_session() as session:
        session.add(file)
        await session.commit()
        await session.refresh(file)
        return file


async def update(collection: str, name: str, content: str) -> MarkdownFile | None:
    """Update a markdown file's content, returning the updated file or None."""
    async with make_session() as session:
        file = await session.get(MarkdownFile, (collection, name))
        if not file:
            return None
        file.content = content
        file.updated_at = utcnow()
        session.add(file)
        await session.commit()
        await session.refresh(file)
        return file


async def delete(collection: str, name: str) -> bool:
    """Delete a markdown file, returning whether it existed."""
    async with make_session() as session:
        file = await session.get(MarkdownFile, (collection, name))
        if not file:
            return False
        await session.delete(file)
        await session.commit()
        return True
