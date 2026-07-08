"""Data-access layer, one module per resource."""

from . import (
    cover_letters,
    files,
    git_sources,
    projects,
    resumes,
    templates,
    vacancies,
)

__all__ = [
    "cover_letters",
    "files",
    "git_sources",
    "projects",
    "resumes",
    "templates",
    "vacancies",
]
