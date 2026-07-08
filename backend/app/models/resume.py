import datetime
import uuid

from sqlmodel import Field, SQLModel

from .base import utcnow


class Resume(SQLModel, table=True):
    """A generated resume tailored to a vacancy, optionally finalized and saved."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = ""
    vacancy_id: uuid.UUID
    language: str
    html: str
    is_saved: bool = False
    created_at: datetime.datetime = Field(default_factory=utcnow)
    updated_at: datetime.datetime = Field(default_factory=utcnow)
