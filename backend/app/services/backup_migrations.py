from collections.abc import Callable, Iterator
from typing import Any, cast

from errors import BadRequestError
from migrations import LATEST_SCHEMA_REVISION

BackupTables = dict[str, Any]
BackupUpgrade = Callable[[BackupTables], None]


def upgrade_backup(tables: BackupTables, source_revision: int) -> BackupTables:
    """Upgrade serialized backup rows to the current database schema."""
    if source_revision < 0 or source_revision > LATEST_SCHEMA_REVISION:
        raise BadRequestError("This backup was created by a newer or incompatible ReBuilt version.")
    for revision in range(source_revision + 1, LATEST_SCHEMA_REVISION + 1):
        BACKUP_UPGRADES[revision](tables)
    return tables


def _upgrade_to_v1(tables: BackupTables) -> None:
    """Normalize backups created before schema revisions were recorded."""
    _set_defaults(
        tables,
        "vacancy",
        {"source": None, "tech": [], "keywords": [], "roles": [], "seniority": ""},
    )
    _set_defaults(
        tables,
        "project",
        {
            "description": "",
            "level": "mid",
            "tech": [],
            "roles": [],
            "resume_bullets": [],
            "keywords": [],
        },
    )
    _set_defaults(
        tables,
        "chat",
        {"effort": None, "pinned": False, "provider_session_id": None, "provider_state": {}},
    )
    _set_defaults(tables, "chat_message", {"context": [], "attachments": []})


def _set_defaults(tables: BackupTables, table: str, defaults: dict[str, Any]) -> None:
    """Fill fields absent from rows serialized by an older application version."""
    for row in _rows(tables, table):
        for key, value in defaults.items():
            if key not in row:
                row[key] = value.copy() if isinstance(value, list | dict) else value


def _rows(tables: BackupTables, table: str) -> Iterator[dict[str, Any]]:
    """Yield shaped row dictionaries from one serialized backup table."""
    rows = tables.get(table)
    if not isinstance(rows, list):
        return
    for raw_row in cast(list[Any], rows):
        if isinstance(raw_row, dict):
            yield cast(dict[str, Any], raw_row)


BACKUP_UPGRADES: dict[int, BackupUpgrade] = {1: _upgrade_to_v1}

if set(BACKUP_UPGRADES) != set(range(1, LATEST_SCHEMA_REVISION + 1)):
    raise RuntimeError("Every database revision must define a backup-data upgrade.")
