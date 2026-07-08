import datetime
import uuid

from sqlmodel import Field, SQLModel

from .base import utcnow


class GitSource(SQLModel, table=True):
    """Stored credentials used to access a git hosting provider."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    provider: str = "github"
    username: str
    token: str
    created_at: datetime.datetime = Field(default_factory=utcnow)
