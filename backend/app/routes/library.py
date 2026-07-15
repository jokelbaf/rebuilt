import uuid

from errors import NotFoundError
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from responses import ok
from schemas.library import DocumentHtmlUpdate
from services import library

router = APIRouter(prefix="/api/library", tags=["Library"])


@router.get("/resumes")
async def list_resumes() -> JSONResponse:
    """List saved resumes with their linked vacancy title."""
    return ok(await library.list_resumes())


@router.get("/resumes/{resume_id}")
async def get_resume(resume_id: uuid.UUID) -> JSONResponse:
    """Get a saved resume with its rendered HTML."""
    resume = await library.get_resume(resume_id)
    if not resume:
        raise NotFoundError("Resume not found.")
    return ok(resume)


@router.patch("/resumes/{resume_id}")
async def update_resume(resume_id: uuid.UUID, payload: DocumentHtmlUpdate) -> JSONResponse:
    """Update a saved resume's HTML and exported PDF."""
    resume = await library.update_resume_html(resume_id, payload.html)
    if not resume:
        raise NotFoundError("Resume not found.")
    return ok(resume)


@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: uuid.UUID) -> JSONResponse:
    """Delete a saved resume."""
    if not await library.delete_resume(resume_id):
        raise NotFoundError("Resume not found.")
    return ok()


@router.get("/cover-letters")
async def list_cover_letters() -> JSONResponse:
    """List saved cover letters with their linked vacancy title."""
    return ok(await library.list_cover_letters())


@router.get("/cover-letters/{cover_letter_id}")
async def get_cover_letter(cover_letter_id: uuid.UUID) -> JSONResponse:
    """Get a saved cover letter with its rendered HTML."""
    cover_letter = await library.get_cover_letter(cover_letter_id)
    if not cover_letter:
        raise NotFoundError("Cover letter not found.")
    return ok(cover_letter)


@router.patch("/cover-letters/{cover_letter_id}")
async def update_cover_letter(
    cover_letter_id: uuid.UUID, payload: DocumentHtmlUpdate
) -> JSONResponse:
    """Update a saved cover letter's HTML and exported PDF."""
    cover_letter = await library.update_cover_letter_html(cover_letter_id, payload.html)
    if not cover_letter:
        raise NotFoundError("Cover letter not found.")
    return ok(cover_letter)


@router.delete("/cover-letters/{cover_letter_id}")
async def delete_cover_letter(cover_letter_id: uuid.UUID) -> JSONResponse:
    """Delete a saved cover letter."""
    if not await library.delete_cover_letter(cover_letter_id):
        raise NotFoundError("Cover letter not found.")
    return ok()
