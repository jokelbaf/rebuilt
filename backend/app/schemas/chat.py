import datetime
import uuid
from typing import ClassVar, Literal

from schemas import CamelModel

ChatContextType = Literal["vacancy", "project", "profile", "experience"]


class ChatContextRef(CamelModel):
    """A reference to an app entity attached to a chat message."""

    type: ChatContextType
    id: str
    title: str = ""


class ChatAttachmentPublic(CamelModel):
    """Metadata of a file attached to a chat message."""

    name: str
    media_type: str | None = None
    size: int = 0


class ChatCreate(CamelModel):
    """Payload to create a new chat."""

    model: str
    effort: str | None = None


class ChatUpdate(CamelModel):
    """Payload to rename or pin a chat."""

    title: str | None = None
    pinned: bool | None = None


class ChatPublic(CamelModel):
    """Public representation of a chat for listings."""

    id: uuid.UUID
    title: str
    provider: str
    model: str
    effort: str | None = None
    pinned: bool = False
    created_at: datetime.datetime
    updated_at: datetime.datetime


class ChatMessagePublic(CamelModel):
    """Public representation of a single chat message."""

    id: uuid.UUID
    role: str
    content: str
    context: list[ChatContextRef] = []
    attachments: list[ChatAttachmentPublic] = []
    created_at: datetime.datetime


class ChatDetail(ChatPublic):
    """Full representation of a chat including its messages."""

    messages: list[ChatMessagePublic]


class AiModelPublic(CamelModel):
    """A model offered by the active AI provider."""

    id: str
    label: str
    description: str = ""
    default: bool = False


class AiModelCatalog(CamelModel):
    """The models and effort levels offered by the active AI provider."""

    models: list[AiModelPublic]
    efforts: list[str]


class ChatStreamDelta(CamelModel):
    """SSE payload carrying a fragment of assistant text."""

    event: ClassVar[str] = "delta"

    text: str


class ChatStreamTool(CamelModel):
    """SSE payload describing a tool invocation made by the assistant."""

    event: ClassVar[str] = "tool"

    name: str
    summary: str


class ChatStreamDone(CamelModel):
    """SSE payload closing a turn with the persisted assistant message."""

    event: ClassVar[str] = "done"

    message: ChatMessagePublic
    title: str | None = None


class ChatStreamError(CamelModel):
    """SSE payload describing a failed turn."""

    event: ClassVar[str] = "error"

    message: str


ChatStreamEvent = ChatStreamDelta | ChatStreamTool | ChatStreamDone | ChatStreamError
"""Any SSE payload emitted while streaming a chat turn."""
