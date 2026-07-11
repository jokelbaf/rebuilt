import asyncio
import datetime
import pathlib
import sqlite3
from dataclasses import dataclass
from typing import Any

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from loguru import logger
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine

from .base import Migration
from .registry import LATEST_SCHEMA_REVISION, MIGRATIONS

_MIGRATION_TABLE = "schema_migration"
_CREATE_MIGRATION_TABLE = f"""
CREATE TABLE IF NOT EXISTS {_MIGRATION_TABLE} (
    revision INTEGER NOT NULL PRIMARY KEY,
    name VARCHAR NOT NULL,
    applied_at DATETIME NOT NULL
)
"""
_SNAPSHOT_LIMIT = 3


class MigrationError(RuntimeError):
    """Database migration failed or found an incompatible schema revision."""


@dataclass(frozen=True)
class MigrationResult:
    """Summary of a completed database migration run."""

    previous_revision: int
    current_revision: int
    applied: tuple[int, ...]
    snapshot: pathlib.Path | None = None


@dataclass(frozen=True)
class _DatabaseState:
    """Applied migration rows and whether application tables already exist."""

    applied: dict[int, str]
    has_application_tables: bool


async def upgrade_database(
    engine: AsyncEngine, database_path: pathlib.Path | None = None
) -> MigrationResult:
    """Upgrade a database to the latest bundled schema revision."""
    async with engine.connect() as connection:
        state = await connection.run_sync(_read_state)
    _validate_state(state.applied)

    previous_revision = max(state.applied, default=0)
    pending = tuple(
        migration for migration in MIGRATIONS if migration.revision not in state.applied
    )
    snapshot = None
    if pending and state.has_application_tables and database_path and database_path.is_file():
        snapshot = await asyncio.to_thread(_create_snapshot, database_path, pending[-1].revision)

    if pending:
        async with engine.begin() as connection:
            await connection.run_sync(_apply_migrations, pending)
        logger.info(
            "Migrated database from revision {} to {}",
            previous_revision,
            pending[-1].revision,
        )

    async with engine.connect() as connection:
        await connection.run_sync(_validate_database)

    return MigrationResult(
        previous_revision=previous_revision,
        current_revision=LATEST_SCHEMA_REVISION,
        applied=tuple(migration.revision for migration in pending),
        snapshot=snapshot,
    )


def _read_state(connection: Connection) -> _DatabaseState:
    """Read migration history and detect pre-migration application tables."""
    table_exists = connection.scalar(
        sa.text("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = :name"),
        {"name": _MIGRATION_TABLE},
    )
    applied: dict[int, str] = {}
    if table_exists:
        rows = connection.execute(sa.text(f"SELECT revision, name FROM {_MIGRATION_TABLE}"))
        applied = {int(row.revision): str(row.name) for row in rows}
    application_tables = connection.scalar(
        sa.text(
            "SELECT COUNT(*) FROM sqlite_master "
            "WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != :name"
        ),
        {"name": _MIGRATION_TABLE},
    )
    return _DatabaseState(applied=applied, has_application_tables=bool(application_tables))


def _validate_state(applied: dict[int, str]) -> None:
    """Reject unknown, missing, or modified migration history."""
    known = {migration.revision: migration for migration in MIGRATIONS}
    unknown = sorted(set(applied) - set(known))
    if unknown:
        raise MigrationError(
            "The database was opened by a newer or incompatible ReBuilt version "
            f"(unknown schema revision {unknown[-1]})."
        )
    for revision, name in applied.items():
        migration = known[revision]
        if name != migration.name:
            raise MigrationError(f"Database migration {revision} does not match this build.")
    if applied and set(applied) != set(range(1, max(applied) + 1)):
        raise MigrationError("The database migration history contains a revision gap.")


def _apply_migrations(connection: Connection, migrations: tuple[Migration, ...]) -> None:
    """Apply pending migrations and record each completed revision."""
    connection.execute(sa.text(_CREATE_MIGRATION_TABLE))
    operations = Operations(MigrationContext.configure(connection))
    for migration in migrations:
        migration.upgrade(operations)
        connection.execute(
            sa.text(
                f"INSERT INTO {_MIGRATION_TABLE} "
                "(revision, name, applied_at) "
                "VALUES (:revision, :name, :applied_at)"
            ),
            {
                "revision": migration.revision,
                "name": migration.name,
                "applied_at": datetime.datetime.now(datetime.UTC).isoformat(),
            },
        )


def _validate_database(connection: Connection) -> None:
    """Verify SQLite structural and referential integrity after migration."""
    integrity = tuple(connection.scalars(sa.text("PRAGMA integrity_check")))
    if integrity != ("ok",):
        raise MigrationError(f"SQLite integrity check failed: {', '.join(integrity)}")
    foreign_key_errors = tuple(connection.execute(sa.text("PRAGMA foreign_key_check")))
    if foreign_key_errors:
        raise MigrationError(
            f"SQLite foreign-key check found {len(foreign_key_errors)} violation(s)."
        )


def _create_snapshot(database_path: pathlib.Path, target_revision: int) -> pathlib.Path:
    """Create a consistent SQLite snapshot before changing an existing database."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    snapshot = database_path.with_name(
        f"{database_path.name}.pre-migration-r{target_revision:04d}-{timestamp}.bak"
    )
    with (
        sqlite3.connect(database_path) as source,
        sqlite3.connect(snapshot) as destination,
    ):
        source.backup(destination)
    snapshots = sorted(
        database_path.parent.glob(f"{database_path.name}.pre-migration-*.bak"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for old_snapshot in snapshots[_SNAPSHOT_LIMIT:]:
        old_snapshot.unlink()
    return snapshot


def configure_sqlite_connection(dbapi_connection: Any, _: Any) -> None:
    """Enable SQLite connection safeguards required by the application."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.close()
