import asyncio
import datetime
import io
import json
import pathlib
import shutil
import struct
from collections.abc import Iterator
from compression import zstd
from typing import Any, cast

from constants import DATA_DIR
from errors import BadRequestError
from loguru import logger
from models import (
    Chat,
    ChatMessage,
    CoverLetter,
    GitSource,
    MarkdownFile,
    Project,
    Resume,
    Template,
    Vacancy,
)
from models.base import utcnow
from modules.db import make_session
from pydantic import ValidationError
from schemas.backup import BackupSummary
from sqlalchemy import delete
from sqlmodel import SQLModel, select

MAGIC = b"REBUILT\x01"
FORMAT_VERSION = 1

_COMPRESSION_LEVEL = 10
_SECTION_HEADER = struct.Struct(">HQ")
_SECTION_MANIFEST = 1
_SECTION_DATABASE = 2
_SECTION_FILE = 3

_TABLES: dict[str, type[SQLModel]] = {
    "vacancy": Vacancy,
    "project": Project,
    "template": Template,
    "resume": Resume,
    "cover_letter": CoverLetter,
    "markdown_file": MarkdownFile,
    "git_source": GitSource,
    "chat": Chat,
    "chat_message": ChatMessage,
}
_FILE_ROOTS = ("chats", "exports")
_TEMP_ROOTS = ("clones",)


def backup_filename() -> str:
    """Build a timestamped filename for a downloaded backup."""
    return f"backup-{utcnow():%Y%m%d-%H%M%S}.rebuilt"


async def create_backup() -> bytes:
    """Serialize the full database and unrecoverable data files into a .rebuilt archive."""
    tables = await _dump_tables()
    buffer = io.BytesIO()
    _write_section(buffer, _SECTION_MANIFEST, json.dumps(_build_manifest(tables)).encode())
    _write_section(buffer, _SECTION_DATABASE, json.dumps(tables).encode())
    for relative, path in _iter_data_files():
        _write_section(buffer, _SECTION_FILE, _encode_file(relative, path.read_bytes()))
    compressed = await asyncio.to_thread(zstd.compress, buffer.getvalue(), _COMPRESSION_LEVEL)
    return MAGIC + struct.pack(">H", FORMAT_VERSION) + compressed


async def restore_backup(data: bytes) -> BackupSummary:
    """Replace all stored data with the contents of a .rebuilt archive."""
    payload = await _decode_archive(data)
    tables, files = _parse_sections(payload)
    rows = {name: _coerce_rows(model, tables.get(name, [])) for name, model in _TABLES.items()}
    _ensure_safe_paths(files)

    async with make_session() as session:
        for model in _TABLES.values():
            await session.exec(delete(model))  # pyright: ignore[reportDeprecated, reportCallIssue, reportArgumentType]
        for instances in rows.values():
            session.add_all(instances)
        await session.commit()

    _replace_files(files)
    logger.info("Restored backup with {} files", len(files))
    return _build_summary(rows, len(files))


async def erase_all_data() -> None:
    """Delete every stored database row and all data files."""
    async with make_session() as session:
        for model in _TABLES.values():
            await session.exec(delete(model))  # pyright: ignore[reportDeprecated, reportCallIssue, reportArgumentType]
        await session.commit()
    for root in _FILE_ROOTS + _TEMP_ROOTS:
        _reset_dir(DATA_DIR / root)
    logger.info("Erased all application data")


async def _dump_tables() -> dict[str, list[dict[str, Any]]]:
    """Dump every table into JSON-serializable row dictionaries."""
    dump: dict[str, list[dict[str, Any]]] = {}
    async with make_session() as session:
        for name, model in _TABLES.items():
            result = await session.exec(select(model))
            dump[name] = [row.model_dump(mode="json") for row in result.all()]
    return dump


def _build_manifest(tables: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
    """Build the manifest section describing the backup."""
    return {
        "formatVersion": FORMAT_VERSION,
        "createdAt": datetime.datetime.now(datetime.UTC).isoformat(),
        "counts": {name: len(rows) for name, rows in tables.items()},
    }


def _write_section(buffer: io.BytesIO, section_id: int, payload: bytes) -> None:
    """Append one length-prefixed section to the archive buffer."""
    buffer.write(_SECTION_HEADER.pack(section_id, len(payload)))
    buffer.write(payload)


def _encode_file(relative: str, content: bytes) -> bytes:
    """Encode a file entry as a path-prefixed payload."""
    path_bytes = relative.encode()
    return struct.pack(">H", len(path_bytes)) + path_bytes + content


def _iter_data_files() -> Iterator[tuple[str, pathlib.Path]]:
    """Yield the relative path and location of every backed-up data file."""
    for root in _FILE_ROOTS:
        base = DATA_DIR / root
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if path.is_file():
                yield path.relative_to(DATA_DIR).as_posix(), path


async def _decode_archive(data: bytes) -> bytes:
    """Validate a .rebuilt archive header and return its decompressed payload."""
    header_size = len(MAGIC) + 2
    if len(data) < header_size or data[: len(MAGIC)] != MAGIC:
        raise BadRequestError("This is not a valid ReBuilt backup file.")
    (version,) = struct.unpack_from(">H", data, len(MAGIC))
    if version != FORMAT_VERSION:
        raise BadRequestError(f"Unsupported backup format version {version}.")
    try:
        return await asyncio.to_thread(zstd.decompress, data[header_size:])
    except zstd.ZstdError as exc:
        raise BadRequestError("The backup file is corrupted.") from exc


def _parse_sections(payload: bytes) -> tuple[dict[str, Any], list[tuple[str, bytes]]]:
    """Split the decompressed payload into database rows and file entries."""
    tables: dict[str, Any] | None = None
    files: list[tuple[str, bytes]] = []
    offset = 0
    while offset < len(payload):
        if offset + _SECTION_HEADER.size > len(payload):
            raise BadRequestError("The backup file is truncated.")
        section_id, length = _SECTION_HEADER.unpack_from(payload, offset)
        offset += _SECTION_HEADER.size
        if offset + length > len(payload):
            raise BadRequestError("The backup file is truncated.")
        body = payload[offset : offset + length]
        offset += length

        if section_id == _SECTION_DATABASE:
            tables = _parse_database(body)
        elif section_id == _SECTION_FILE:
            files.append(_parse_file(body))

    if tables is None:
        raise BadRequestError("The backup file contains no database section.")
    return tables, files


def _parse_database(body: bytes) -> dict[str, Any]:
    """Parse and shape-check the database section."""
    try:
        data: Any = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise BadRequestError("The backup database section is corrupted.") from exc
    if not isinstance(data, dict):
        raise BadRequestError("The backup database section is corrupted.")
    return cast(dict[str, Any], data)


def _parse_file(body: bytes) -> tuple[str, bytes]:
    """Parse one file section into its relative path and content."""
    if len(body) < 2:
        raise BadRequestError("The backup file is truncated.")
    (path_length,) = struct.unpack_from(">H", body, 0)
    if len(body) < 2 + path_length:
        raise BadRequestError("The backup file is truncated.")
    try:
        relative = body[2 : 2 + path_length].decode()
    except UnicodeDecodeError as exc:
        raise BadRequestError("The backup file is corrupted.") from exc
    return relative, body[2 + path_length :]


def _coerce_rows(model: type[SQLModel], rows: Any) -> list[SQLModel]:
    """Validate raw backup rows into model instances."""
    if not isinstance(rows, list):
        raise BadRequestError("The backup database section is corrupted.")
    fields = set(model.model_fields)
    instances: list[SQLModel] = []
    for row in cast(list[Any], rows):
        if not isinstance(row, dict):
            raise BadRequestError("The backup database section is corrupted.")
        filtered = {key: value for key, value in cast(dict[str, Any], row).items() if key in fields}
        try:
            instances.append(model.model_validate(filtered))
        except ValidationError as exc:
            raise BadRequestError("The backup data is incompatible with this version.") from exc
    return instances


def _ensure_safe_paths(files: list[tuple[str, bytes]]) -> None:
    """Reject file entries that would escape the managed data directories."""
    for relative, _ in files:
        path = pathlib.PurePosixPath(relative)
        if path.is_absolute() or ".." in path.parts or not path.parts:
            raise BadRequestError("The backup contains an invalid file path.")
        if path.parts[0] not in _FILE_ROOTS:
            raise BadRequestError("The backup contains an invalid file path.")


def _replace_files(files: list[tuple[str, bytes]]) -> None:
    """Replace the managed data directories with the backed-up files."""
    for root in _FILE_ROOTS:
        _reset_dir(DATA_DIR / root)
    for relative, content in files:
        destination = DATA_DIR / pathlib.PurePosixPath(relative)
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(content)


def _reset_dir(path: pathlib.Path) -> None:
    """Remove a directory tree and recreate it empty."""
    shutil.rmtree(path, ignore_errors=True)
    path.mkdir(parents=True, exist_ok=True)


def _build_summary(rows: dict[str, list[SQLModel]], file_count: int) -> BackupSummary:
    """Build the restore summary from coerced rows."""
    return BackupSummary(
        vacancies=len(rows["vacancy"]),
        projects=len(rows["project"]),
        templates=len(rows["template"]),
        resumes=len(rows["resume"]),
        cover_letters=len(rows["cover_letter"]),
        markdown_files=len(rows["markdown_file"]),
        git_sources=len(rows["git_source"]),
        chats=len(rows["chat"]),
        chat_messages=len(rows["chat_message"]),
        files=file_count,
    )
