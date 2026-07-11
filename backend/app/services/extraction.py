import json
import re
from typing import Any, cast

from errors import UpstreamError
from schemas.projects import PROJECT_LEVELS

_JSON_OBJECT = re.compile(r"\{.*\}", re.DOTALL)
_JSON_ARRAY = re.compile(r"\[.*\]", re.DOTALL)


def coerce_str_list(value: Any) -> list[str]:
    """Coerce an arbitrary JSON value into a list of non-empty strings."""
    if not isinstance(value, list):
        return []
    items = cast(list[Any], value)
    return [str(item).strip() for item in items if str(item).strip()]


def coerce_level(value: Any, default: str = "mid") -> str:
    """Coerce a value into a valid project/seniority level."""
    level = str(value).lower()
    return level if level in PROJECT_LEVELS else default


def parse_json_object(text: str) -> dict[str, Any]:
    """Extract and parse the first JSON object from model output."""
    match = _JSON_OBJECT.search(text)
    if not match:
        raise UpstreamError("The AI response did not contain valid JSON.")
    try:
        data: Any = json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise UpstreamError("The AI response contained malformed JSON.") from exc
    if not isinstance(data, dict):
        raise UpstreamError("The AI response was not a JSON object.")
    return cast(dict[str, Any], data)


def parse_json_array(text: str) -> list[Any]:
    """Extract and parse the first JSON array from model output."""
    match = _JSON_ARRAY.search(text)
    if not match:
        raise UpstreamError("The AI response did not contain a valid JSON array.")
    try:
        data: Any = json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise UpstreamError("The AI response contained malformed JSON.") from exc
    if not isinstance(data, list):
        raise UpstreamError("The AI response was not a JSON array.")
    return cast(list[Any], data)
