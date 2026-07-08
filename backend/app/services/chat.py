import asyncio
import pathlib
import re
import shutil
import uuid
from collections.abc import AsyncIterator, Sequence
from typing import Any

from ai import get_provider, prompts
from ai.events import ChatDelta, ChatSessionStart, ChatToolUse
from ai.mcp import get_mcp_url
from constants import CHATS_DIR, FAST_MODEL
from crud import chats as chats_crud
from crud import files as files_crud
from crud import projects as projects_crud
from crud import vacancies as vacancies_crud
from errors import APIError, BadRequestError, ConflictError, NotFoundError
from fastapi import UploadFile
from loguru import logger
from models import Chat, ChatMessage
from pydantic import TypeAdapter, ValidationError
from schemas.chat import (
    ChatAttachmentPublic,
    ChatContextRef,
    ChatCreate,
    ChatMessagePublic,
    ChatStreamDelta,
    ChatStreamDone,
    ChatStreamError,
    ChatStreamEvent,
    ChatStreamTool,
    ChatUpdate,
)

from .context import format_files, format_project

_active_chats: set[uuid.UUID] = set()

_context_adapter: TypeAdapter[list[ChatContextRef]] = TypeAdapter(list[ChatContextRef])

_MAX_INVENTORY_ITEMS = 30
_TITLE_LIMIT = 80
_FALLBACK_TITLE_LIMIT = 60


async def create_chat(payload: ChatCreate) -> Chat:
    """Create a new chat bound to the active provider and a validated model."""
    ensure_model(payload.model)
    ensure_effort(payload.effort)
    return await chats_crud.create(
        Chat(provider=get_provider().name, model=payload.model, effort=payload.effort)
    )


async def update_chat(chat_id: uuid.UUID, payload: ChatUpdate) -> Chat:
    """Rename or pin a chat without bumping its recency."""
    updates: dict[str, Any] = {}
    if payload.title is not None:
        title = payload.title.strip()
        if not title:
            raise BadRequestError("Chat title cannot be empty.")
        updates["title"] = title[:_TITLE_LIMIT]
    if payload.pinned is not None:
        updates["pinned"] = payload.pinned
    if not updates:
        raise BadRequestError("Nothing to update.")
    chat = await chats_crud.update(chat_id, updates, touch=False)
    if not chat:
        raise NotFoundError("Chat not found.")
    return chat


async def delete_chat(chat_id: uuid.UUID) -> None:
    """Delete a chat, its messages and its uploaded files."""
    if not await chats_crud.delete(chat_id):
        raise NotFoundError("Chat not found.")
    shutil.rmtree(CHATS_DIR / str(chat_id), ignore_errors=True)


def ensure_model(model: str) -> None:
    """Validate that the active provider offers the given model."""
    if model not in {info.id for info in get_provider().models()}:
        raise BadRequestError("Unknown AI model.")


def ensure_effort(effort: str | None) -> None:
    """Validate that the active provider supports the given effort level."""
    if effort and effort not in get_provider().efforts():
        raise BadRequestError("Unknown AI effort level.")


def ensure_idle(chat_id: uuid.UUID) -> None:
    """Ensure the chat is not currently generating a response."""
    if chat_id in _active_chats:
        raise ConflictError("This chat is already generating a response.")


def parse_context(raw: str) -> list[ChatContextRef]:
    """Parse the JSON-encoded context references of a message."""
    try:
        return _context_adapter.validate_json(raw)
    except ValidationError as exc:
        raise BadRequestError("Invalid context references.") from exc


async def save_uploads(
    chat_id: uuid.UUID, files: Sequence[UploadFile]
) -> list[ChatAttachmentPublic]:
    """Persist uploaded files into the chat's uploads directory."""
    if not files:
        return []
    directory = _uploads_dir(chat_id)
    directory.mkdir(parents=True, exist_ok=True)
    saved: list[ChatAttachmentPublic] = []
    for upload in files:
        target = _unique_path(directory, _safe_filename(upload.filename or "file"))
        content = await upload.read()
        target.write_bytes(content)
        saved.append(
            ChatAttachmentPublic(
                name=target.name, media_type=upload.content_type, size=len(content)
            )
        )
    return saved


async def stream_message(
    chat: Chat,
    content: str,
    refs: Sequence[ChatContextRef],
    attachments: Sequence[ChatAttachmentPublic],
    model: str,
    effort: str | None,
) -> AsyncIterator[ChatStreamEvent]:
    """Run one chat turn, persisting both messages and yielding stream payloads."""
    if chat.id in _active_chats:
        yield ChatStreamError(message="This chat is already generating a response.")
        return

    _active_chats.add(chat.id)
    try:
        is_first = not await chats_crud.list_messages(chat.id)
        updates: dict[str, Any] = {}
        if model != chat.model:
            updates["model"] = model
        if effort != chat.effort:
            updates["effort"] = effort

        await chats_crud.add_message(
            ChatMessage(
                chat_id=chat.id,
                role="user",
                content=content,
                context=[ref.model_dump() for ref in refs],
                attachments=[attachment.model_dump() for attachment in attachments],
            )
        )

        title_task = asyncio.create_task(_generate_title(content)) if is_first else None
        system = prompts.build_chat_system_prompt(await _build_inventory())
        uploads_dir = _uploads_dir(chat.id)
        uploads_dir.mkdir(parents=True, exist_ok=True)
        prompt = _build_prompt(content, await _expand_context(refs), attachments, uploads_dir)

        accumulated: list[str] = []
        session_id = chat.provider_session_id
        error: str | None = None
        finished = False

        try:
            async for event in get_provider().chat_stream(
                prompt,
                system=system,
                model=model,
                effort=effort,
                session_id=chat.provider_session_id,
                workspace=uploads_dir,
                mcp_url=get_mcp_url(),
            ):
                if isinstance(event, ChatDelta):
                    accumulated.append(event.text)
                    yield ChatStreamDelta(text=event.text)
                elif isinstance(event, ChatToolUse):
                    yield ChatStreamTool(name=event.name, summary=event.summary)
                elif isinstance(event, ChatSessionStart):
                    session_id = event.session_id
                else:
                    accumulated = [event.text]
                    session_id = event.session_id or session_id
            finished = True
        except APIError as exc:
            error = exc.message
            finished = True
        finally:
            if not finished:
                if title_task and not title_task.done():
                    title_task.cancel()
                if title_task:
                    updates["title"] = _fallback_title(content)
                await _finalize(chat, "".join(accumulated), session_id, updates)

        title: str | None = None
        if title_task:
            if error and not title_task.done():
                title_task.cancel()
                title = _fallback_title(content)
            else:
                title = await title_task
        if title:
            updates["title"] = title

        message = await _finalize(chat, "".join(accumulated), session_id, updates)
        if error:
            yield ChatStreamError(message=error)
        elif message is None:
            yield ChatStreamError(message="The AI returned no output.")
        else:
            yield ChatStreamDone(message=ChatMessagePublic.model_validate(message), title=title)
    finally:
        _active_chats.discard(chat.id)


async def _finalize(
    chat: Chat, text: str, session_id: str | None, updates: dict[str, Any]
) -> ChatMessage | None:
    """Persist the assistant output and provider session state after a turn."""
    message: ChatMessage | None = None
    if text.strip():
        message = await chats_crud.add_message(
            ChatMessage(chat_id=chat.id, role="assistant", content=text)
        )
    if session_id and session_id != chat.provider_session_id:
        updates["provider_session_id"] = session_id
    await chats_crud.update(chat.id, updates)
    return message


async def _build_inventory() -> str:
    """Summarize stored app data so the model knows what exists."""
    vacancies = await vacancies_crud.list_all()
    projects = await projects_crud.list_all()
    profile = await files_crud.list_for("profile")
    experience = await files_crud.list_for("experience")
    return "\n".join(
        (
            f"Vacancies ({len(vacancies)}): {_inventory_names([v.title for v in vacancies])}",
            f"Projects ({len(projects)}): {_inventory_names([p.title for p in projects])}",
            f"Profile notes ({len(profile)}): {_inventory_names([f.name for f in profile])}",
            f"Experience notes ({len(experience)}): "
            f"{_inventory_names([f.name for f in experience])}",
        )
    )


def _inventory_names(names: list[str]) -> str:
    """Render a capped, comma-separated list of entity names."""
    if not names:
        return "(none)"
    shown = ", ".join(names[:_MAX_INVENTORY_ITEMS])
    return shown + (", …" if len(names) > _MAX_INVENTORY_ITEMS else "")


async def _expand_context(refs: Sequence[ChatContextRef]) -> str:
    """Render attached context references into prompt blocks."""
    blocks: list[str] = []
    for ref in refs:
        body = await _context_body(ref)
        if body is None:
            logger.warning("Skipping missing chat context {} '{}'", ref.type, ref.id)
            continue
        title, text = body
        blocks.append(f'<context type="{ref.type}" title="{title}">\n{text}\n</context>')
    return "\n\n".join(blocks)


async def _context_body(ref: ChatContextRef) -> tuple[str, str] | None:
    """Fetch the title and text of a referenced app entity, or None when missing."""
    if ref.type == "vacancy":
        try:
            vacancy_id = uuid.UUID(ref.id)
        except ValueError:
            return None
        vacancy = await vacancies_crud.get(vacancy_id)
        return (vacancy.title, vacancy.description) if vacancy else None
    if ref.type == "project":
        try:
            project = await projects_crud.get(uuid.UUID(ref.id))
        except ValueError:
            project = await projects_crud.get_by_name(ref.id)
        return (project.title, format_project(project)) if project else None
    file = await files_crud.get(ref.type, ref.id)
    return (file.name, format_files([file])) if file else None


def _build_prompt(
    content: str,
    context_block: str,
    attachments: Sequence[ChatAttachmentPublic],
    uploads_dir: pathlib.Path,
) -> str:
    """Assemble the provider prompt from the message, attachments and context."""
    parts = [content.strip()]
    if attachments:
        listed = "\n".join(
            f"- {uploads_dir / attachment.name}"
            + (f" ({attachment.media_type})" if attachment.media_type else "")
            for attachment in attachments
        )
        parts.append(
            "<attachments>\nThe user attached these files; read them with the Read tool:\n"
            f"{listed}\n</attachments>"
        )
    if context_block:
        parts.append(context_block)
    return "\n\n".join(part for part in parts if part)


async def _generate_title(message: str) -> str:
    """Generate a short chat title from the first user message."""
    try:
        raw = await get_provider().complete(
            prompts.build_chat_title_prompt(message),
            system=prompts.CHAT_TITLE_SYSTEM,
            model=FAST_MODEL,
        )
    except APIError as exc:
        logger.warning("Chat title generation failed: {}", exc.message)
        return _fallback_title(message)
    title = sanitize_title(raw)
    return title[:_TITLE_LIMIT] or _fallback_title(message)


def sanitize_title(raw: str) -> str:
    """Reduce model output to a single line of plain text without markdown markup."""
    line = raw.strip().splitlines()[0].strip() if raw.strip() else ""
    line = re.sub(r"^#{1,6}\s+", "", line)
    line = re.sub(r"[*_`~]+", "", line)
    line = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", line)
    return " ".join(line.split()).strip("\"' ").strip()


def _fallback_title(message: str) -> str:
    """Derive a chat title from the first line of a message."""
    stripped = message.strip()
    if not stripped:
        return "New chat"
    line = stripped.splitlines()[0].strip()
    if len(line) > _FALLBACK_TITLE_LIMIT:
        line = line[:_FALLBACK_TITLE_LIMIT].rstrip() + "…"
    return line or "New chat"


def _uploads_dir(chat_id: uuid.UUID) -> pathlib.Path:
    """Resolve the uploads directory of a chat."""
    return CHATS_DIR / str(chat_id) / "uploads"


def _safe_filename(name: str) -> str:
    """Sanitize an uploaded filename into a safe basename."""
    base = pathlib.PurePosixPath(name.replace("\\", "/")).name or "file"
    return re.sub(r"[^\w.\- ]", "_", base).strip() or "file"


def _unique_path(directory: pathlib.Path, name: str) -> pathlib.Path:
    """Return a non-colliding path for a filename inside a directory."""
    target = directory / name
    stem, suffix = pathlib.Path(name).stem, pathlib.Path(name).suffix
    counter = 1
    while target.exists():
        target = directory / f"{stem}-{counter}{suffix}"
        counter += 1
    return target
