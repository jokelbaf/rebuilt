import datetime
import uuid
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class DiscoveryRun(SQLModel, table=True):
    """One manual, scheduled, or chat-triggered vacancy discovery execution."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    trigger: str
    status: str = "running"
    started_at: datetime.datetime = Field(default_factory=utcnow)
    finished_at: datetime.datetime | None = None
    stats: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    error: str = ""
