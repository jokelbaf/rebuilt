import json
import os
import pathlib
from typing import Any, cast

_VERSION_ENV = "REBUILT_VERSION"


def get_application_version() -> str:
    """Return the ReBuilt product version supplied by the desktop shell."""
    if version := os.getenv(_VERSION_ENV):
        return version
    if "__compiled__" in globals():
        return "unknown"

    try:
        config_path = pathlib.Path(__file__).resolve().parents[3] / "shell" / "tauri.conf.json"
        config: Any = json.loads(config_path.read_text(encoding="utf-8"))
        version = cast(dict[str, Any], config).get("version") if isinstance(config, dict) else None
        return version if isinstance(version, str) else "unknown"
    except OSError, json.JSONDecodeError:
        return "unknown"
