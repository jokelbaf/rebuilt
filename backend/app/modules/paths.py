import os
import pathlib

import platformdirs

APP_NAME = "ReBuilt"
APP_AUTHOR = "ReBuilt"


def get_data_dir() -> pathlib.Path:
    """Resolve the application data directory, honoring the REBUILT_DATA override."""
    override = os.getenv("REBUILT_DATA")
    base = (
        pathlib.Path(override).expanduser()
        if override
        else pathlib.Path(platformdirs.user_data_dir(APP_NAME, APP_AUTHOR))
    )
    base = base.resolve()
    base.mkdir(parents=True, exist_ok=True)
    return base


def get_database_path() -> pathlib.Path:
    """Resolve the SQLite database file path inside the data directory."""
    return get_data_dir() / "rebuilt.db"


def get_database_url() -> str:
    """Build the async SQLite connection URL, honoring a DATABASE_URL override."""
    if url := os.getenv("DATABASE_URL"):
        return url
    return f"sqlite+aiosqlite:///{get_database_path().as_posix()}"


def get_exports_dir() -> pathlib.Path:
    """Resolve the directory where exported PDF documents are stored."""
    path = get_data_dir() / "exports"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_clones_dir() -> pathlib.Path:
    """Resolve the directory used for temporary repository clones."""
    path = get_data_dir() / "clones"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_chats_dir() -> pathlib.Path:
    """Resolve the directory where chat uploads are stored."""
    path = get_data_dir() / "chats"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_static_dir() -> pathlib.Path:
    """Resolve the bundled frontend directory, next to the executable when compiled."""
    if "__compiled__" in globals():
        base = pathlib.Path(__compiled__.containing_dir)  # type: ignore[name-defined]  # noqa: F821
    else:
        base = pathlib.Path(__file__).resolve().parents[2]
    return base / "static"
