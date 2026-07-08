LANGUAGE_NAMES: dict[str, str] = {
    "en": "English",
    "uk": "Ukrainian",
    "de": "German",
    "fr": "French",
    "es": "Spanish",
    "pl": "Polish",
}
"""Supported language codes mapped to their English display names."""

DEFAULT_LANGUAGE = "en"
"""Fallback language code used when detection is inconclusive."""


def language_name(code: str) -> str:
    """Return the display name for a language code, falling back to the code itself."""
    return LANGUAGE_NAMES.get(code, code)
