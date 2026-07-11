import re
from dataclasses import dataclass
from typing import Any, TypedDict, cast

from ai import get_provider
from crud import files as files_crud
from crud import projects as projects_crud
from errors import APIError
from jobboards import VacancyDetails, VacancySummary
from loguru import logger
from models import SearchQuery

from services.extraction import parse_json_array

_BATCH_SIZE = 10
_MAX_CONTEXT_CHARS = 14_000
_TOKEN = re.compile(r"[\w+#.-]{2,}", re.UNICODE)
_SCORING_SYSTEM = (
    "You are a technical recruiter rating job vacancies against a candidate profile. "
    "Return only the requested JSON array with no markdown or commentary."
)


class ProfileSignals(TypedDict):
    """Normalized candidate terms used by the inexpensive pre-score."""

    terms: set[str]
    tech: set[str]
    roles: set[str]
    seniorities: set[str]


@dataclass(frozen=True, slots=True)
class ScoredItem:
    """A validated AI fit score for one external vacancy."""

    external_id: str
    score: int
    verdict: str


def _tokens(text: str) -> set[str]:
    """Extract normalized searchable terms from free text."""
    return {match.group(0).casefold() for match in _TOKEN.finditer(text)}


def prescore(item: VacancySummary, query: SearchQuery, profile: ProfileSignals) -> int:
    """Compute a cheap overlap score for deciding which summaries deserve detail fetches."""
    item_terms = _tokens(
        " ".join([item.title, item.company, item.snippet, item.location, *item.tags])
    )
    query_terms = _tokens(" ".join([query.name, query.wishes, query.seniority]))
    score = 4 * len(item_terms & profile["tech"])
    score += 3 * len(item_terms & query_terms)
    score += 2 * len(item_terms & profile["roles"])
    score += len(item_terms & profile["terms"])
    score += len(item_terms & profile["seniorities"])
    if query.seniority and query.seniority.casefold() in item_terms:
        score += 2
    return score


async def build_user_summary() -> tuple[str, ProfileSignals]:
    """Build compact candidate context and normalized pre-scoring signals once per run."""
    profile = await files_crud.list_for("profile")
    experience = await files_crud.list_for("experience")
    projects = list(await projects_crud.list_all())[:12]

    profile_text = "\n\n".join(file.content for file in profile)
    experience_text = "\n\n".join(file.content for file in experience)
    project_lines = [
        " | ".join(
            part
            for part in (
                project.title,
                project.level,
                ", ".join(project.tech),
                ", ".join(project.roles),
                project.description,
            )
            if part
        )
        for project in projects
    ]
    summary = (
        f"## Profile\n{profile_text or '(empty)'}\n\n"
        f"## Experience\n{experience_text or '(empty)'}\n\n"
        f"## Projects\n{chr(10).join(project_lines) or '(empty)'}"
    )[:_MAX_CONTEXT_CHARS]
    tech = {value.casefold() for project in projects for value in project.tech if value.strip()}
    roles = {value.casefold() for project in projects for value in project.roles if value.strip()}
    seniorities = {project.level.casefold() for project in projects if project.level.strip()}
    terms = _tokens(f"{profile_text}\n{experience_text}\n{' '.join(project_lines)}")
    return summary, ProfileSignals(terms=terms, tech=tech, roles=roles, seniorities=seniorities)


def _query_context(query: SearchQuery) -> str:
    """Format all saved search preferences for vacancy scoring."""
    salary = (
        f"{query.salary_min} {query.salary_currency} minimum"
        if query.salary_min is not None and query.salary_currency
        else "not specified"
    )
    return "\n".join(
        (
            f"Target role / position: {query.name}",
            f"Additional wishes: {query.wishes or 'none'}",
            f"Minimum salary: {salary}",
            f"Seniority: {query.seniority or 'not specified'}",
            f"Remote only: {'yes' if query.remote_only else 'no'}",
            f"Location: {query.location or 'not specified'}",
            f"English level: {query.english_level or 'not specified'}",
        )
    )


def _vacancy_context(item: VacancyDetails) -> str:
    """Format all normalized vacancy facts for one scoring item."""
    salary_values = [value for value in (item.salary_min, item.salary_max) if value is not None]
    salary = (
        f"{'-'.join(str(value) for value in salary_values)} {item.salary_currency or ''}".strip()
        if salary_values
        else "not listed"
    )
    return "\n".join(
        (
            f"### {item.external_id}",
            f"Title: {item.title}",
            f"Company: {item.company or 'not listed'}",
            f"Platform: {item.platform}",
            f"Location: {item.location or 'not listed'}",
            f"Remote: {'yes' if item.remote else 'no'}",
            f"Employment: {item.employment or 'not listed'}",
            f"Experience: {item.experience_years or 'not listed'}",
            f"English: {item.english_level or 'not listed'}",
            f"Salary: {salary}",
            f"Tags: {', '.join(item.tags) or 'none'}",
            "Description:",
            item.description_text[:5000] or item.snippet[:1000] or "(unavailable)",
        )
    )


def _prompt(items: list[VacancyDetails], user_summary: str, query: SearchQuery) -> str:
    """Build one strict batch-scoring prompt."""
    vacancies = "\n\n".join(_vacancy_context(item) for item in items)
    return f"""Rate each vacancy's fit for the candidate from 0 to 100.

Return ONLY a JSON array with one object per vacancy and exactly these keys:
- "externalId": the supplied vacancy id
- "score": integer from 0 to 100
- "verdict": one concise sentence explaining the fit

The candidate is searching for "{query.name}" roles. Rate each vacancy against that target,
their background, and the search preferences below. Candidate preferences are goals, not
biographical facts. Apply explicit constraints, but do not invent missing requirements.

# Candidate
{user_summary}

# Search preferences
{_query_context(query)}

# Vacancies
{vacancies}
"""


def _coerce_scores(raw: list[Any], expected: set[str]) -> list[ScoredItem]:
    """Validate model-produced score objects and discard malformed or unknown entries."""
    scores: list[ScoredItem] = []
    seen: set[str] = set()
    for value in raw:
        if not isinstance(value, dict):
            continue
        item = cast(dict[str, Any], value)
        external_id = str(item.get("externalId") or "").strip()
        score = item.get("score")
        verdict = " ".join(str(item.get("verdict") or "").split())
        if (
            external_id not in expected
            or external_id in seen
            or not isinstance(score, int)
            or isinstance(score, bool)
        ):
            continue
        seen.add(external_id)
        scores.append(
            ScoredItem(external_id=external_id, score=max(0, min(100, score)), verdict=verdict)
        )
    return scores


async def ai_score(
    items: list[VacancyDetails], user_summary: str, query: SearchQuery
) -> tuple[list[ScoredItem], str | None]:
    """Score detailed vacancies in AI batches, returning any failure reason encountered."""
    provider = get_provider()
    scores: list[ScoredItem] = []
    error: str | None = None
    for offset in range(0, len(items), _BATCH_SIZE):
        batch = items[offset : offset + _BATCH_SIZE]
        try:
            output = await provider.complete(
                _prompt(batch, user_summary, query),
                system=_SCORING_SYSTEM,
                model=provider.fast_model(),
            )
            raw = parse_json_array(output)
        except APIError as exc:
            logger.warning("Discovery AI scoring batch failed: {}", exc.message)
            error = error or exc.message
            continue
        scores.extend(_coerce_scores(raw, {item.external_id for item in batch}))
    return scores, error
