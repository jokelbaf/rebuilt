import datetime
import uuid
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class Chat(SQLModel, table=True):
    """A persisted AI chat conversation."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = "New chat"
    provider: str
    model: str
    effort: str | None = None
    pinned: bool = False
    provider_session_id: str | None = None
    provider_state: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)


class ChatMessage(SQLModel, table=True):
    """A single user or assistant message within a chat."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chat_id: uuid.UUID = Field(foreign_key="chat.id", index=True)
    role: str
    content: str
    context: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    attachments: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime.datetime = Field(default_factory=utcnow)
