import uuid
from collections.abc import AsyncIterator
from typing import Annotated

from ai import get_provider
from crud import chats as chats_crud
from errors import BadRequestError, NotFoundError
from fastapi import APIRouter, File, Form, Query, UploadFile
from fastapi.responses import JSONResponse
from fastapi.sse import EventSourceResponse, format_sse_event
from responses import ok
from schemas.chat import (
    AiModelCatalog,
    AiModelPublic,
    ChatCreate,
    ChatDetail,
    ChatMessagePublic,
    ChatPublic,
    ChatStreamEvent,
    ChatUpdate,
)
from services import chat as chat_service

router = APIRouter(prefix="/api/chats", tags=["Chats"])


@router.get("")
async def list_chats(query: Annotated[str | None, Query()] = None) -> JSONResponse:
    """List all chats, optionally filtered by title."""
    chats = await chats_crud.list_all(query)
    return ok([ChatPublic.model_validate(chat) for chat in chats])


@router.post("")
async def create_chat(payload: ChatCreate) -> JSONResponse:
    """Create a new chat bound to the active AI provider."""
    chat = await chat_service.create_chat(payload)
    return ok(ChatPublic.model_validate(chat))


@router.get("/models")
async def list_models() -> JSONResponse:
    """List the models and effort levels offered by the active AI provider."""
    provider = get_provider()
    catalog = AiModelCatalog(
        models=[
            AiModelPublic(id=m.id, label=m.label, description=m.description, default=m.default)
            for m in provider.models()
        ],
        efforts=provider.efforts(),
    )
    return ok(catalog)


@router.get("/{chat_id}")
async def get_chat(chat_id: uuid.UUID) -> JSONResponse:
    """Get a single chat including all of its messages."""
    chat = await chats_crud.get(chat_id)
    if not chat:
        raise NotFoundError("Chat not found.")
    messages = await chats_crud.list_messages(chat_id)
    detail = ChatDetail(
        **ChatPublic.model_validate(chat).model_dump(),
        messages=[ChatMessagePublic.model_validate(message) for message in messages],
    )
    return ok(detail)


@router.patch("/{chat_id}")
async def update_chat(chat_id: uuid.UUID, payload: ChatUpdate) -> JSONResponse:
    """Rename or pin a chat."""
    chat = await chat_service.update_chat(chat_id, payload)
    return ok(ChatPublic.model_validate(chat))


@router.delete("/{chat_id}")
async def delete_chat(chat_id: uuid.UUID) -> JSONResponse:
    """Delete a chat, its messages and its uploaded files."""
    await chat_service.delete_chat(chat_id)
    return ok()


@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: uuid.UUID,
    content: Annotated[str, Form()] = "",
    model: Annotated[str, Form()] = "",
    effort: Annotated[str, Form()] = "",
    context: Annotated[str, Form()] = "[]",
    files: Annotated[list[UploadFile] | None, File()] = None,
) -> EventSourceResponse:
    """Send a message to a chat and stream the assistant's reply as SSE."""
    chat = await chats_crud.get(chat_id)
    if not chat:
        raise NotFoundError("Chat not found.")
    if not content.strip() and not files:
        raise BadRequestError("Message content is required.")
    chat_service.ensure_model(model)
    chat_service.ensure_effort(effort or None)
    chat_service.ensure_idle(chat_id)
    refs = chat_service.parse_context(context)
    attachments = await chat_service.save_uploads(chat_id, files or [])
    stream = chat_service.stream_message(chat, content, refs, attachments, model, effort or None)
    return EventSourceResponse(
        _to_sse(stream),
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _to_sse(stream: AsyncIterator[ChatStreamEvent]) -> AsyncIterator[bytes]:
    """Encode chat stream payloads into named SSE wire-format events."""
    async for item in stream:
        yield format_sse_event(data_str=item.model_dump_json(by_alias=True), event=item.event)
