import datetime
import typing
import uuid

from schemas import CamelModel


class GitSourceCreate(CamelModel):
    """Payload to add a git source's credentials."""

    username: str
    password: str


class GitSourcePublic(CamelModel):
    """Public representation of a git source (without the secret token)."""

    id: uuid.UUID
    username: str
    created_at: datetime.datetime


class GitOwner(CamelModel):
    """A repository owner (the authenticated user or an organization)."""

    login: str
    type: typing.Literal["user", "organization"]


class GitRepo(CamelModel):
    """A repository accessible through a git source."""

    id: int
    name: str
    full_name: str
    description: str | None = None
    private: bool
