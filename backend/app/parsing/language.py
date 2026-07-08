from typing import cast

import langdetect
from langdetect.lang_detect_exception import LangDetectException
from modules.languages import DEFAULT_LANGUAGE, LANGUAGE_NAMES


def detect_language(text: str) -> str:
    """Detect the language code of a text, constrained to the supported languages."""
    try:
        detected = langdetect.detect(text)  # pyright: ignore[reportUnknownMemberType, reportUnknownVariableType]
    except LangDetectException:
        return DEFAULT_LANGUAGE
    code = cast(str, detected).lower()
    return code if code in LANGUAGE_NAMES else DEFAULT_LANGUAGE
