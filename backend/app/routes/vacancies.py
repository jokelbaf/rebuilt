import uuid

from crud import vacancies as vacancies_crud
from errors import NotFoundError
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from responses import ok
from schemas.vacancies import (
    VacancyCreate,
    VacancyDetail,
    VacancyParse,
    VacancyPublic,
    VacancyUpdate,
)
from services import vacancies as vacancies_service

router = APIRouter(prefix="/api/vacancies", tags=["Vacancies"])


@router.get("")
async def list_vacancies(q: str | None = Query(default=None)) -> JSONResponse:
    """List vacancies, optionally filtered by a search query."""
    vacancies = await vacancies_crud.list_all(q)
    return ok([VacancyPublic.model_validate(vacancy) for vacancy in vacancies])


@router.post("")
async def create_vacancy(payload: VacancyCreate) -> JSONResponse:
    """Create a vacancy from manual input."""
    vacancy = await vacancies_service.create_manual(payload)
    return ok(VacancyDetail.model_validate(vacancy))


@router.post("/parse")
async def parse_vacancy_from_url(payload: VacancyParse) -> JSONResponse:
    """Parse a vacancy from a job-posting URL and persist it."""
    vacancy = await vacancies_service.create_from_url(payload)
    return ok(VacancyDetail.model_validate(vacancy))


@router.get("/{vacancy_id}")
async def get_vacancy(vacancy_id: uuid.UUID) -> JSONResponse:
    """Get a single vacancy by id."""
    vacancy = await vacancies_crud.get(vacancy_id)
    if not vacancy:
        raise NotFoundError("Vacancy not found.")
    return ok(VacancyDetail.model_validate(vacancy))


@router.put("/{vacancy_id}")
async def update_vacancy(vacancy_id: uuid.UUID, payload: VacancyUpdate) -> JSONResponse:
    """Update every editable field of a vacancy."""
    vacancy = await vacancies_crud.update(vacancy_id, payload.model_dump())
    if not vacancy:
        raise NotFoundError("Vacancy not found.")
    return ok(VacancyDetail.model_validate(vacancy))


@router.delete("/{vacancy_id}")
async def delete_vacancy(vacancy_id: uuid.UUID) -> JSONResponse:
    """Delete a vacancy."""
    if not await vacancies_crud.delete(vacancy_id):
        raise NotFoundError("Vacancy not found.")
    return ok()
