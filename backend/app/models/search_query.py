import datetime
import uuid

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .base import utcnow


class SearchQuery(SQLModel, table=True):
    """A reusable set of job-board search criteria and candidate wishes."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    enabled: bool = True
    platforms: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    wishes: str = ""
    salary_min: int | None = None
    salary_currency: str | None = None
    seniority: str = ""
    remote_only: bool = False
    location: str = ""
    english_level: str = ""
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
