from typing import TypedDict

from ai import get_provider, prompts
from constants import FAST_MODEL
from errors import APIError
from loguru import logger

from .extraction import coerce_level, coerce_str_list, parse_json_object


class VacancySignals(TypedDict):
    """Signals extracted from a vacancy, used to rank candidate projects."""

    tech: list[str]
    keywords: list[str]
    roles: list[str]
    seniority: str


def _empty() -> VacancySignals:
    """Return empty vacancy signals."""
    return VacancySignals(tech=[], keywords=[], roles=[], seniority="")


async def analyze_vacancy(title: str, description: str) -> VacancySignals:
    """Extract matching signals from a vacancy, returning empty signals on failure."""
    try:
        output = await get_provider().complete(
            prompts.build_vacancy_analysis_prompt(title, description),
            system=prompts.VACANCY_ANALYSIS_SYSTEM,
            model=FAST_MODEL,
        )
        data = parse_json_object(output)
    except APIError as exc:
        logger.warning("Vacancy analysis failed, continuing without signals: {}", exc.message)
        return _empty()

    return VacancySignals(
        tech=coerce_str_list(data.get("tech")),
        keywords=coerce_str_list(data.get("keywords")),
        roles=coerce_str_list(data.get("roles")),
        seniority=coerce_level(data.get("seniority"), default=""),
    )
