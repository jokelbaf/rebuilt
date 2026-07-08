import uuid

from schemas import CamelModel


class GenerateCoverLetter(CamelModel):
    """Payload to generate a cover letter for a resume."""

    resume_id: uuid.UUID
    template_id: str
    notes: str | None = None


class SaveCoverLetter(CamelModel):
    """Payload to persist a finalized cover letter."""

    id: uuid.UUID
    name: str
    html: str
    resume_id: uuid.UUID


class CoverLetterSaved(CamelModel):
    """Result returned after saving a cover letter."""

    name: str
