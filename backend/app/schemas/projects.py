import datetime
import uuid

from schemas import CamelModel

PROJECT_LEVELS = ("intern", "junior", "mid", "senior", "lead", "principal")


class ProjectInput(CamelModel):
    """Payload to create or update a project."""

    title: str
    description: str = ""
    tech: list[str] = []
    roles: list[str] = []
    level: str = "mid"
    resume_bullets: list[str] = []
    keywords: list[str] = []


class ProjectImportGit(CamelModel):
    """Payload to import a project from a git repository."""

    owner: str
    repo: str


class ProjectSummary(CamelModel):
    """Lightweight representation of a project for listings."""

    id: uuid.UUID
    name: str
    title: str
    tech: list[str]
    level: str
    updated_at: datetime.datetime


class ProjectPublic(ProjectSummary):
    """Full representation of a project including resume-building metadata."""

    description: str
    roles: list[str]
    resume_bullets: list[str]
    keywords: list[str]
