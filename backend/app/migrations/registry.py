from .base import Migration
from .versions import v0001_legacy_baseline

MIGRATIONS = (
    Migration(
        revision=v0001_legacy_baseline.REVISION,
        name=v0001_legacy_baseline.NAME,
        upgrade=v0001_legacy_baseline.upgrade,
    ),
)

if tuple(migration.revision for migration in MIGRATIONS) != tuple(range(1, len(MIGRATIONS) + 1)):
    raise RuntimeError("Database migration revisions must be contiguous and start at 1.")

LATEST_SCHEMA_REVISION = MIGRATIONS[-1].revision
