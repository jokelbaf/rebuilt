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
