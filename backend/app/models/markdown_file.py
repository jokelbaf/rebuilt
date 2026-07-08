import datetime

from sqlmodel import Field, SQLModel

from .base import utcnow


class MarkdownFile(SQLModel, table=True):
    """A markdown note belonging to a collection (profile or experience)."""

    collection: str = Field(primary_key=True)
    name: str = Field(primary_key=True)
    content: str
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
