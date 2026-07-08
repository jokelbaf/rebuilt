import pathlib

from constants import EXPORTS_DIR
from crud import cover_letters as cover_letters_crud
from crud import resumes as resumes_crud
from crud import vacancies as vacancies_crud
from errors import NotFoundError
from models.base import utcnow
from modules.text import slugify
from pdf import render_pdf
from schemas.resume import ExportPdf, ExportPdfResult


def export_path(prefix: str, document_id: object) -> pathlib.Path:
    """Return the on-disk PDF path for an exported document."""
    return EXPORTS_DIR / f"{prefix}-{document_id}.pdf"


async def export_resume_pdf(payload: ExportPdf) -> ExportPdfResult:
    """Render a resume's HTML to PDF and return its download details."""
    resume = await resumes_crud.get(payload.id)
    if not resume:
        raise NotFoundError("Resume not found.")

    resume.html = payload.html
    resume.updated_at = utcnow()
    await resumes_crud.save(resume)

    vacancy = await vacancies_crud.get(resume.vacancy_id)
    label = slugify(vacancy.title) if vacancy else "resume"

    await render_pdf(payload.html, export_path("resume", resume.id))
    return ExportPdfResult(
        file_name=f"{label or 'resume'}.pdf",
        download_url=f"/api/resume/download/{resume.id}",
    )


async def export_cover_letter_pdf(payload: ExportPdf) -> ExportPdfResult:
    """Render a cover letter's HTML to PDF and return its download details."""
    cover_letter = await cover_letters_crud.get(payload.id)
    if not cover_letter:
        raise NotFoundError("Cover letter not found.")

    cover_letter.html = payload.html
    cover_letter.updated_at = utcnow()
    await cover_letters_crud.save(cover_letter)

    resume = await resumes_crud.get(cover_letter.resume_id)
    base = f"{resume.name}-cover-letter" if resume and resume.name else "cover-letter"
    label = slugify(base)

    await render_pdf(payload.html, export_path("cover-letter", cover_letter.id))
    return ExportPdfResult(
        file_name=f"{label or 'cover-letter'}.pdf",
        download_url=f"/api/cover-letter/download/{cover_letter.id}",
    )
