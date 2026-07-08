import uuid

from crud import cover_letters as cover_letters_crud
from crud import resumes as resumes_crud
from crud import vacancies as vacancies_crud
from models import CoverLetter, Resume
from schemas.library import (
    CoverLetterDetail,
    CoverLetterListItem,
    ResumeDetail,
    ResumeListItem,
)

from .export import export_path


async def _vacancy_titles() -> dict[uuid.UUID, str]:
    """Return a mapping of vacancy id to title for resolving document labels."""
    vacancies = await vacancies_crud.list_all()
    return {vacancy.id: vacancy.title for vacancy in vacancies}


async def list_resumes() -> list[ResumeListItem]:
    """Return saved resumes enriched with their linked vacancy title."""
    resumes = await resumes_crud.list_saved()
    titles = await _vacancy_titles()
    return [
        ResumeListItem(
            id=resume.id,
            name=resume.name,
            vacancy_title=titles.get(resume.vacancy_id),
            language=resume.language,
            created_at=resume.created_at,
            updated_at=resume.updated_at,
        )
        for resume in resumes
    ]


async def get_resume(resume_id: uuid.UUID) -> ResumeDetail | None:
    """Return a saved resume with its HTML, or None if it does not exist."""
    resume = await resumes_crud.get(resume_id)
    if not resume or not resume.is_saved:
        return None
    titles = await _vacancy_titles()
    return ResumeDetail(
        id=resume.id,
        name=resume.name,
        vacancy_title=titles.get(resume.vacancy_id),
        language=resume.language,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        html=resume.html,
    )


async def delete_resume(resume_id: uuid.UUID) -> bool:
    """Delete a saved resume and its exported PDF, returning whether it existed."""
    if not await resumes_crud.delete(resume_id):
        return False
    export_path("resume", resume_id).unlink(missing_ok=True)
    return True


async def _resume_titles() -> tuple[dict[uuid.UUID, Resume], dict[uuid.UUID, str]]:
    """Return resume-by-id and vacancy-title-by-id maps for cover-letter labels."""
    titles = await _vacancy_titles()
    resumes = await resumes_crud.list_saved()
    return {resume.id: resume for resume in resumes}, titles


def _cover_letter_title(
    cover_letter: CoverLetter,
    resumes: dict[uuid.UUID, Resume],
    titles: dict[uuid.UUID, str],
) -> str | None:
    """Resolve the vacancy title behind a cover letter through its resume."""
    resume = resumes.get(cover_letter.resume_id)
    return titles.get(resume.vacancy_id) if resume else None


async def list_cover_letters() -> list[CoverLetterListItem]:
    """Return saved cover letters enriched with their linked vacancy title."""
    cover_letters = await cover_letters_crud.list_saved()
    resumes, titles = await _resume_titles()
    return [
        CoverLetterListItem(
            id=cover_letter.id,
            name=cover_letter.name,
            vacancy_title=_cover_letter_title(cover_letter, resumes, titles),
            created_at=cover_letter.created_at,
            updated_at=cover_letter.updated_at,
        )
        for cover_letter in cover_letters
    ]


async def get_cover_letter(cover_letter_id: uuid.UUID) -> CoverLetterDetail | None:
    """Return a saved cover letter with its HTML, or None if it does not exist."""
    cover_letter = await cover_letters_crud.get(cover_letter_id)
    if not cover_letter or not cover_letter.is_saved:
        return None
    resumes, titles = await _resume_titles()
    return CoverLetterDetail(
        id=cover_letter.id,
        name=cover_letter.name,
        vacancy_title=_cover_letter_title(cover_letter, resumes, titles),
        created_at=cover_letter.created_at,
        updated_at=cover_letter.updated_at,
        html=cover_letter.html,
    )


async def delete_cover_letter(cover_letter_id: uuid.UUID) -> bool:
    """Delete a saved cover letter and its exported PDF, returning whether it existed."""
    if not await cover_letters_crud.delete(cover_letter_id):
        return False
    export_path("cover-letter", cover_letter_id).unlink(missing_ok=True)
    return True
