import datetime

from sqlmodel import Field, SQLModel

from .base import utcnow


class Template(SQLModel, table=True):
    """An HTML template used to render resumes and cover letters."""

    name: str = Field(primary_key=True)
    html: str
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
