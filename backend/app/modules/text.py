import re
from collections.abc import Awaitable, Callable
from typing import Any


def slugify(value: str) -> str:
    """Convert a string into a lowercase, hyphenated slug."""
    value = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return value.strip("-")


def strip_markdown(content: str) -> str:
    """Strip common markdown syntax from text, keeping only its readable content."""
    text = re.sub(r"```[^\n`]*", "", content)
    text = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"<[^>\n]+>", "", text)
    text = re.sub(r"^\s{0,3}#{1,6}\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s{0,3}>\s?", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*(?:[-*+]|\d+[.)])\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*(?:[-*_]\s*){3,}$", "", text, flags=re.MULTILINE)
    text = re.sub(r"[*_~`]+", "", text)
    text = re.sub(r"^\|.*\|\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*\\$", "", text, flags=re.MULTILINE)
    return text


def make_excerpt(content: str, limit: int = 160) -> str:
    """Build a single-line plain-text excerpt from longer markdown content."""
    text = " ".join(strip_markdown(content).split())
    return text[:limit].rstrip()


def strip_code_fences(text: str) -> str:
    """Strip a surrounding markdown code fence from a block of text, if present."""
    stripped = text.strip()
    if not stripped.startswith("```"):
        return stripped
    lines = stripped.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip().startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def extract_html(text: str) -> str:
    """Extract a full HTML document from model output, dropping any surrounding prose."""
    text = strip_code_fences(text)
    lowered = text.lower()

    start = lowered.find("<!doctype")
    if start == -1:
        start = lowered.find("<html")
    end = lowered.rfind("</html>")

    if start != -1 and end != -1:
        return text[start : end + len("</html>")].strip()
    if start != -1:
        return text[start:].strip()
    return text.strip()


async def unique_name(base: str, exists: Callable[[str], Awaitable[Any]]) -> str:
    """Return a name based on ``base`` that is not already taken."""
    candidate = base or "item"
    suffix = 2
    while await exists(candidate) is not None:
        candidate = f"{base}-{suffix}"
        suffix += 1
    return candidate
