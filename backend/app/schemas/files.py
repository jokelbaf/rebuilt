import datetime

from schemas import CamelModel


class MarkdownFileCreate(CamelModel):
    """Payload to create a markdown file."""

    name: str
    content: str


class MarkdownFileUpdate(CamelModel):
    """Payload to update a markdown file's content."""

    content: str


class MarkdownFileSummary(CamelModel):
    """Lightweight representation of a markdown file for listings."""

    name: str
    excerpt: str
    updated_at: datetime.datetime


class MarkdownFilePublic(MarkdownFileSummary):
    """Full representation of a markdown file including its content."""

    content: str
