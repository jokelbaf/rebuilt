import dataclasses


@dataclasses.dataclass(frozen=True, slots=True)
class ChatDelta:
    """A streamed fragment of assistant text."""

    text: str


@dataclasses.dataclass(frozen=True, slots=True)
class ChatToolUse:
    """A tool invocation performed by the assistant during a turn."""

    name: str
    summary: str


@dataclasses.dataclass(frozen=True, slots=True)
class ChatSessionStart:
    """Announces the provider-side session id used for a turn."""

    session_id: str


@dataclasses.dataclass(frozen=True, slots=True)
class ChatDone:
    """The end of an assistant turn, carrying the full text and session reference."""

    text: str
    session_id: str | None


ChatEvent = ChatDelta | ChatToolUse | ChatSessionStart | ChatDone
"""Any event emitted by a provider while streaming a chat turn."""


@dataclasses.dataclass(frozen=True, slots=True)
class AiModelInfo:
    """A model offered by an AI provider."""

    id: str
    label: str
    description: str = ""
    default: bool = False
    efforts: tuple[str, ...] = ()


@dataclasses.dataclass(frozen=True, slots=True)
class AiUsageWindow:
    """Usage consumed within one provider quota window."""

    used_percent: float
    resets_at: int | None


@dataclasses.dataclass(frozen=True, slots=True)
class AiUsageSnapshot:
    """Current short-term and weekly usage for an AI provider."""

    five_hour: AiUsageWindow | None
    weekly: AiUsageWindow | None
