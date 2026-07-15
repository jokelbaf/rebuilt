import datetime

from schemas import CamelModel


class AiProviderPublic(CamelModel):
    """Public availability and display metadata for an AI provider."""

    id: str
    label: str
    description: str
    available: bool
    install_hint: str


class AiSettingsPublic(CamelModel):
    """The active AI provider and all provider choices."""

    provider: str
    providers: list[AiProviderPublic]


class AiSettingsUpdate(CamelModel):
    """Payload used to select the active AI provider."""

    provider: str


class AiUsageWindowPublic(CamelModel):
    """A provider usage percentage and its next reset time."""

    used_percent: float
    resets_at: datetime.datetime | None


class AiUsagePublic(CamelModel):
    """Current usage windows for the active AI provider."""

    provider: str
    provider_label: str
    five_hour: AiUsageWindowPublic | None
    weekly: AiUsageWindowPublic | None


class AboutPublic(CamelModel):
    """Application identity shown in the settings About section."""

    name: str
    version: str
