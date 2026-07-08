import datetime
import uuid

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class Project(SQLModel, table=True):
    """A project used as a building block when generating resumes."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(unique=True, index=True)
    title: str
    description: str = ""
    level: str = "mid"
    tech: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    roles: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    resume_bullets: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    keywords: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
