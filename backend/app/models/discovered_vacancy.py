import datetime
import uuid
from typing import Any

from sqlalchemy import JSON, Column, UniqueConstraint
from sqlmodel import Field, SQLModel

from .base import utcnow


class DiscoveredVacancy(SQLModel, table=True):
    """A job-board vacancy awaiting an explicit approval or dismissal decision."""

    __table_args__ = (UniqueConstraint("platform", "external_id"),)

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    platform: str = Field(index=True)
    external_id: str
    url: str
    title: str
    company: str = ""
    company_logo_url: str | None = None
    location: str = ""
    remote: bool = False
    employment: str = ""
    experience_years: str = ""
    english_level: str = ""
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    snippet: str = ""
    description: str = ""
    description_html: str = ""
    posted_at: datetime.datetime | None = None
    raw: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    score: int | None = None
    verdict: str = ""
    status: str = Field(default="new", index=True)
    dismiss_reason: str = ""
    vacancy_id: uuid.UUID | None = Field(default=None, foreign_key="vacancy.id")
    run_id: uuid.UUID = Field(foreign_key="discoveryrun.id", index=True)
    search_query_id: uuid.UUID | None = Field(default=None, foreign_key="searchquery.id")
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
