import uuid

from crud import discovered_vacancies as discovered_crud
from crud import vacancies as vacancies_crud
from errors import ConflictError, NotFoundError
from models import Vacancy
from parsing import parse_vacancy
from parsing.language import detect_language

from services import vacancies as vacancies_service
from services.vacancy_analysis import analyze_vacancy


async def approve(discovered_id: uuid.UUID) -> Vacancy:
    """Promote a discovered vacancy into the approved vacancy library."""
    discovered = await discovered_crud.get(discovered_id)
    if not discovered:
        raise NotFoundError("Discovered vacancy not found.")
    if discovered.status == "approved" and discovered.vacancy_id:
        existing = await vacancies_crud.get(discovered.vacancy_id)
        if existing:
            return existing
    if discovered.status != "new":
        raise ConflictError("Only new discovered vacancies can be approved.")

    title = discovered.title
    description = discovered.description
    language = ""
    if not description:
        parsed = await parse_vacancy(discovered.url)
        title = parsed.title or title
        description = parsed.description
        language = parsed.language
    if not description:
        raise ConflictError("The discovered vacancy has no description to promote.")
    if not language:
        language = detect_language(f"{title}\n{description}")
    signals = await analyze_vacancy(title, description)
    vacancy = await vacancies_service.persist(title, description, language, signals, discovered.url)
    updated = await discovered_crud.update(
        discovered.id,
        {"status": "approved", "vacancy_id": vacancy.id, "dismiss_reason": ""},
    )
    if not updated:
        raise NotFoundError("Discovered vacancy not found.")
    return vacancy


async def dismiss(discovered_id: uuid.UUID, reason: str = "") -> None:
    """Dismiss a new discovered vacancy with an optional reason."""
    discovered = await discovered_crud.get(discovered_id)
    if not discovered:
        raise NotFoundError("Discovered vacancy not found.")
    if discovered.status != "new":
        raise ConflictError("Only new discovered vacancies can be dismissed.")
    await discovered_crud.update(
        discovered.id, {"status": "dismissed", "dismiss_reason": reason.strip()}
    )


async def restore(discovered_id: uuid.UUID) -> None:
    """Restore a dismissed discovered vacancy to the approval inbox."""
    discovered = await discovered_crud.get(discovered_id)
    if not discovered:
        raise NotFoundError("Discovered vacancy not found.")
    if discovered.status != "dismissed":
        raise ConflictError("Only dismissed discovered vacancies can be restored.")
    await discovered_crud.update(discovered.id, {"status": "new", "dismiss_reason": ""})
