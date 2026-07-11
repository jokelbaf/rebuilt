from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SearchFilters(BaseModel):
    """Platform-agnostic search criteria; salary is already in the platform's currency."""

    keywords: list[str] = []
    salary_min: int | None = None
    salary_currency: str | None = None
    remote: bool = False
    location: str = ""
    seniority: str = ""
    english_level: str = ""
    page: int = 1


class VacancySummary(BaseModel):
    """A vacancy as it appears on a listing page."""

    platform: str
    external_id: str
    url: str
    title: str
    company: str = ""
    company_logo_url: str | None = None
    location: str = ""
    remote: bool = False
    employment: str = ""
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    tags: list[str] = []
    snippet: str = ""
    posted_at: datetime | None = None
    raw: dict[str, Any] = {}


class VacancyDetails(VacancySummary):
    """A vacancy with its full description and detail-only fields."""

    description_text: str = ""
    description_html: str = ""
    experience_years: str = ""
    english_level: str = ""


class SearchPage(BaseModel):
    """One page of search results."""

    items: list[VacancySummary] = []
    has_next: bool = False
    total: int | None = None


class SessionState(BaseModel):
    """Opaque authentication state owned by the app, passed back to the client."""

    cookies: dict[str, str] = {}
    token: str | None = None
    expires_at: datetime | None = None
