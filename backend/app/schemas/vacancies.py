import datetime
import uuid

from schemas import CamelModel


class VacancyCreate(CamelModel):
    """Payload to manually create a vacancy."""

    title: str
    description: str


class VacancyParse(CamelModel):
    """Payload to parse a vacancy from a job-posting URL."""

    url: str


class VacancyUpdate(CamelModel):
    """Payload to update every editable field of a vacancy."""

    title: str
    description: str
    language: str
    source: str | None = None
    tech: list[str] = []
    keywords: list[str] = []
    roles: list[str] = []
    seniority: str = ""


class VacancyPublic(CamelModel):
    """Public representation of a vacancy for listings."""

    id: uuid.UUID
    title: str
    description: str
    language: str
    source: str | None = None
    created_at: datetime.datetime


class VacancyDetail(VacancyPublic):
    """Full representation of a vacancy including its matching signals."""

    tech: list[str]
    keywords: list[str]
    roles: list[str]
    seniority: str
