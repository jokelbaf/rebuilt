import datetime
import uuid

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class Vacancy(SQLModel, table=True):
    """A job posting that resumes can be tailored to."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str
    description: str
    language: str
    source: str | None = None
    tech: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    keywords: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    roles: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    seniority: str = ""
    created_at: datetime.datetime = Field(default_factory=utcnow)
