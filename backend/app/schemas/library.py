import datetime
import uuid

from schemas import CamelModel


class DocumentHtmlUpdate(CamelModel):
    """Payload used to replace a saved document's HTML."""

    html: str


class ResumeListItem(CamelModel):
    """A saved resume as shown in the created-documents library."""

    id: uuid.UUID
    name: str
    vacancy_title: str | None
    language: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ResumeDetail(ResumeListItem):
    """A saved resume including its rendered HTML for previewing."""

    html: str


class CoverLetterListItem(CamelModel):
    """A saved cover letter as shown in the created-documents library."""

    id: uuid.UUID
    name: str
    vacancy_title: str | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class CoverLetterDetail(CoverLetterListItem):
    """A saved cover letter including its rendered HTML for previewing."""

    html: str
