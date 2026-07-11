import datetime
import uuid
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class PlatformAccount(SQLModel, table=True):
    """Credentials and session state for an authenticated job-board account."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    platform: str = Field(unique=True, index=True)
    email: str
    password: str
    session_state: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    status: str = "unverified"
    last_verified_at: datetime.datetime | None = None
    created_at: datetime.datetime = Field(default_factory=utcnow)
