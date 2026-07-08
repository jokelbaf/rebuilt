import uuid
from collections.abc import Sequence
from typing import Any

from models import Chat, ChatMessage
from models.base import utcnow
from modules.db import make_session
from sqlalchemy import func
from sqlmodel import col, select


async def list_all(query: str | None = None) -> Sequence[Chat]:
    """Return chats, optionally filtered by title, most recently updated first."""
    async with make_session() as session:
        statement = select(Chat)
        if query:
            needle = f"%{query.lower()}%"
            statement = statement.where(func.lower(col(Chat.title)).like(needle))
        statement = statement.order_by(col(Chat.pinned).desc(), col(Chat.updated_at).desc())
        result = await session.exec(statement)
        return result.all()


async def get(chat_id: uuid.UUID) -> Chat | None:
    """Return a chat by id, or None if it does not exist."""
    async with make_session() as session:
        return await session.get(Chat, chat_id)


async def create(chat: Chat) -> Chat:
    """Persist a new chat."""
    async with make_session() as session:
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        return chat


async def update(chat_id: uuid.UUID, data: dict[str, Any], *, touch: bool = True) -> Chat | None:
    """Update a chat's fields, returning the updated chat or None."""
    async with make_session() as session:
        chat = await session.get(Chat, chat_id)
        if not chat:
            return None
        chat.sqlmodel_update(data)
        if touch:
            chat.updated_at = utcnow()
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        return chat


async def delete(chat_id: uuid.UUID) -> bool:
    """Delete a chat and all of its messages, returning whether it existed."""
    async with make_session() as session:
        chat = await session.get(Chat, chat_id)
        if not chat:
            return False
        messages = await session.exec(select(ChatMessage).where(ChatMessage.chat_id == chat_id))
        for message in messages.all():
            await session.delete(message)
        await session.delete(chat)
        await session.commit()
        return True


async def list_messages(chat_id: uuid.UUID) -> Sequence[ChatMessage]:
    """Return all messages of a chat, oldest first."""
    async with make_session() as session:
        statement = (
            select(ChatMessage)
            .where(ChatMessage.chat_id == chat_id)
            .order_by(col(ChatMessage.created_at).asc())
        )
        result = await session.exec(statement)
        return result.all()


async def add_message(message: ChatMessage) -> ChatMessage:
    """Persist a new chat message."""
    async with make_session() as session:
        session.add(message)
        await session.commit()
        await session.refresh(message)
        return message
