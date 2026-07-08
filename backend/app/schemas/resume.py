import datetime
import uuid

from schemas import CamelModel


class GenerateResume(CamelModel):
    """Payload to generate a resume for a vacancy."""

    vacancy_id: uuid.UUID
    language: str
    template_id: str
    notes: str | None = None


class SaveResume(CamelModel):
    """Payload to persist a finalized resume."""

    id: uuid.UUID
    name: str
    html: str
    vacancy_id: uuid.UUID
    language: str


class GeneratedDocument(CamelModel):
    """A generated document's id and HTML content."""

    id: uuid.UUID
    html: str


class ExportPdf(CamelModel):
    """Payload to export a generated document to PDF."""

    id: uuid.UUID
    html: str


class ExportPdfResult(CamelModel):
    """Result of a PDF export, pointing at the downloadable file."""

    file_name: str
    download_url: str


class ResumeSummary(CamelModel):
    """Lightweight representation of a saved resume."""

    id: uuid.UUID
    name: str
    vacancy_id: uuid.UUID
    language: str
    updated_at: datetime.datetime
