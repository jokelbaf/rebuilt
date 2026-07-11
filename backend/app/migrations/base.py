from collections.abc import Callable
from dataclasses import dataclass

from alembic.operations import Operations

MigrationUpgrade = Callable[[Operations], None]


@dataclass(frozen=True)
class Migration:
    """One immutable database schema migration."""

    revision: int
    name: str
    upgrade: MigrationUpgrade
