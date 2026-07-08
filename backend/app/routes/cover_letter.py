import uuid

from crud import cover_letters as cover_letters_crud
from errors import NotFoundError
from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse
from models.base import utcnow
from pdf import render_pdf
from responses import ok
from schemas.cover_letter import CoverLetterSaved, GenerateCoverLetter, SaveCoverLetter
from schemas.resume import ExportPdf, ExportPdfResult, GeneratedDocument
from services import export, generation

router = APIRouter(prefix="/api/cover-letter", tags=["Cover Letter"])


@router.post("/generate")
async def generate_cover_letter(payload: GenerateCoverLetter) -> JSONResponse:
    """Generate a cover letter for a resume."""
    cover_letter = await generation.generate_cover_letter(payload)
    return ok(GeneratedDocument(id=cover_letter.id, html=cover_letter.html))


@router.post("/export")
async def export_cover_letter(payload: ExportPdf) -> JSONResponse:
    """Export a generated cover letter to PDF."""
    result: ExportPdfResult = await export.export_cover_letter_pdf(payload)
    return ok(result)


@router.post("/save")
async def save_cover_letter(payload: SaveCoverLetter) -> JSONResponse:
    """Persist a finalized cover letter."""
    cover_letter = await cover_letters_crud.get(payload.id)
    if not cover_letter:
        raise NotFoundError("Cover letter not found.")
    cover_letter.name = payload.name
    cover_letter.html = payload.html
    cover_letter.resume_id = payload.resume_id
    cover_letter.is_saved = True
    cover_letter.updated_at = utcnow()
    await cover_letters_crud.save(cover_letter)
    return ok(CoverLetterSaved(name=cover_letter.name))


@router.get("/download/{cover_letter_id}")
async def download_cover_letter(cover_letter_id: uuid.UUID) -> FileResponse:
    """Download a cover letter PDF, rendering it from stored HTML if needed."""
    path = export.export_path("cover-letter", cover_letter_id)
    if not path.is_file():
        cover_letter = await cover_letters_crud.get(cover_letter_id)
        if not cover_letter:
            raise NotFoundError("Cover letter not found.")
        await render_pdf(cover_letter.html, path)
    return FileResponse(path, media_type="application/pdf", filename=f"{cover_letter_id}.pdf")
