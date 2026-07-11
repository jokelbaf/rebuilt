from crud import vacancies as vacancies_crud
from models import Vacancy
from parsing import clean_url, parse_vacancy
from parsing.language import detect_language
from schemas.vacancies import VacancyCreate, VacancyParse

from .vacancy_analysis import VacancySignals, analyze_vacancy


async def persist(
    title: str,
    description: str,
    language: str,
    signals: VacancySignals,
    source: str | None = None,
) -> Vacancy:
    """Build and persist a vacancy from parsed content and extracted signals."""
    vacancy = Vacancy(
        title=title,
        description=description,
        language=language,
        source=source,
        tech=signals["tech"],
        keywords=signals["keywords"],
        roles=signals["roles"],
        seniority=signals["seniority"],
    )
    return await vacancies_crud.create(vacancy)


async def create_manual(payload: VacancyCreate) -> Vacancy:
    """Create a vacancy from manual input, enriched with AI-extracted signals."""
    language = detect_language(f"{payload.title}\n{payload.description}")
    signals = await analyze_vacancy(payload.title, payload.description)
    return await persist(payload.title, payload.description, language, signals)


async def create_from_url(payload: VacancyParse) -> Vacancy:
    """Parse a vacancy from a URL, enriched with AI-extracted signals."""
    parsed = await parse_vacancy(payload.url)
    signals = await analyze_vacancy(parsed.title, parsed.description)
    return await persist(
        parsed.title, parsed.description, parsed.language, signals, clean_url(payload.url)
    )
