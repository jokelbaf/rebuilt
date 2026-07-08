import uuid

from crud import resumes as resumes_crud
from errors import NotFoundError
from fastapi import APIRouter, Query
from fastapi.responses import FileResponse, JSONResponse
from models.base import utcnow
from pdf import render_pdf
from responses import ok
from schemas.resume import (
    ExportPdf,
    ExportPdfResult,
    GeneratedDocument,
    GenerateResume,
    ResumeSummary,
    SaveResume,
)
from services import export, generation

router = APIRouter(prefix="/api", tags=["Resume"])


@router.get("/resumes")
async def list_resumes(q: str | None = Query(default=None)) -> JSONResponse:
    """List saved resumes, optionally filtered by a search query."""
    resumes = await resumes_crud.list_saved(q)
    return ok([ResumeSummary.model_validate(resume) for resume in resumes])


@router.post("/resume/generate")
async def generate_resume(payload: GenerateResume) -> JSONResponse:
    """Generate a resume tailored to a vacancy."""
    resume = await generation.generate_resume(payload)
    return ok(GeneratedDocument(id=resume.id, html=resume.html))


@router.post("/resume/export")
async def export_resume(payload: ExportPdf) -> JSONResponse:
    """Export a generated resume to PDF."""
    result: ExportPdfResult = await export.export_resume_pdf(payload)
    return ok(result)


@router.post("/resume/save")
async def save_resume(payload: SaveResume) -> JSONResponse:
    """Persist a finalized resume."""
    resume = await resumes_crud.get(payload.id)
    if not resume:
        raise NotFoundError("Resume not found.")
    resume.name = payload.name
    resume.html = payload.html
    resume.vacancy_id = payload.vacancy_id
    resume.language = payload.language
    resume.is_saved = True
    resume.updated_at = utcnow()
    saved = await resumes_crud.save(resume)
    return ok(ResumeSummary.model_validate(saved))


@router.get("/resume/download/{resume_id}")
async def download_resume(resume_id: uuid.UUID) -> FileResponse:
    """Download a resume PDF, rendering it from stored HTML if needed."""
    path = export.export_path("resume", resume_id)
    if not path.is_file():
        resume = await resumes_crud.get(resume_id)
        if not resume:
            raise NotFoundError("Resume not found.")
        await render_pdf(resume.html, path)
    return FileResponse(path, media_type="application/pdf", filename=f"{resume_id}.pdf")
