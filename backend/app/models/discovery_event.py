import datetime
import uuid
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class DiscoveryEvent(SQLModel, table=True):
    """A persisted audit event emitted during a discovery run."""

    id: int | None = Field(default=None, primary_key=True)
    run_id: uuid.UUID = Field(foreign_key="discoveryrun.id", index=True)
    ts: datetime.datetime = Field(default_factory=utcnow)
    level: str
    kind: str
    message: str
    data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
