import datetime
import uuid

from sqlmodel import Field, SQLModel

from .base import utcnow


class CoverLetter(SQLModel, table=True):
    """A generated cover letter linked to a resume."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = ""
    resume_id: uuid.UUID
    html: str
    is_saved: bool = False
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
