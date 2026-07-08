import datetime

from schemas import CamelModel


class TemplateCreate(CamelModel):
    """Payload to create a template."""

    name: str
    html: str


class TemplateUpdate(CamelModel):
    """Payload to update a template's HTML."""

    html: str


class TemplateSummary(CamelModel):
    """Lightweight representation of a template for listings."""

    name: str
    updated_at: datetime.datetime


class TemplatePublic(TemplateSummary):
    """Full representation of a template including its HTML."""

    html: str
