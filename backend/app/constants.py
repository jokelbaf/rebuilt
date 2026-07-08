import os

from modules import paths

IS_PROD = os.getenv("PRODUCTION", "no").lower() in {"yes", "true", "1"}
"""Whether the application is running in production mode."""

IS_DEV = not IS_PROD
"""Whether the application is running in development mode."""

DATA_DIR = paths.get_data_dir()
"""Resolved application data directory."""

DATABASE_URL = paths.get_database_url()
"""Async SQLite connection URL."""

EXPORTS_DIR = paths.get_exports_dir()
"""Directory where exported PDF documents are stored."""

CLONES_DIR = paths.get_clones_dir()
"""Directory used for temporary repository clones."""

CHATS_DIR = paths.get_chats_dir()
"""Directory where chat uploads are stored."""

STATIC_DIR = paths.get_static_dir()
"""Directory containing the bundled frontend build."""

DEFAULT_MODEL = "sonnet"
"""Default AI model used for generation and analysis."""

FAST_MODEL = "haiku"
"""Lightweight AI model used for quick extraction tasks."""
