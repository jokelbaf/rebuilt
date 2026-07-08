from ai import get_provider, prompts
from crud import cover_letters as cover_letters_crud
from crud import resumes as resumes_crud
from crud import templates as templates_crud
from crud import vacancies as vacancies_crud
from errors import NotFoundError
from models import CoverLetter, Resume
from modules.text import extract_html
from schemas.cover_letter import GenerateCoverLetter
from schemas.resume import GenerateResume

from .context import build_candidate_context


async def generate_resume(payload: GenerateResume) -> Resume:
    """Generate a resume tailored to a vacancy and persist it as a draft."""
    vacancy = await vacancies_crud.get(payload.vacancy_id)
    if not vacancy:
        raise NotFoundError("Vacancy not found.")
    template = await templates_crud.get(payload.template_id)
    if not template:
        raise NotFoundError("Template not found.")

    context = await build_candidate_context(vacancy)
    prompt = prompts.build_resume_prompt(
        template_html=template.html,
        language=payload.language,
        vacancy_title=vacancy.title,
        vacancy_description=vacancy.description,
        context=context,
        notes=payload.notes,
    )
    output = await get_provider().complete(prompt, system=prompts.RESUME_SYSTEM)

    resume = Resume(
        vacancy_id=vacancy.id,
        language=payload.language,
        html=extract_html(output),
    )
    return await resumes_crud.create(resume)


async def generate_cover_letter(payload: GenerateCoverLetter) -> CoverLetter:
    """Generate a cover letter for a resume and persist it as a draft."""
    resume = await resumes_crud.get(payload.resume_id)
    if not resume:
        raise NotFoundError("Resume not found.")
    template = await templates_crud.get(payload.template_id)
    if not template:
        raise NotFoundError("Template not found.")
    vacancy = await vacancies_crud.get(resume.vacancy_id)
    if not vacancy:
        raise NotFoundError("Linked vacancy not found.")

    prompt = prompts.build_cover_letter_prompt(
        template_html=template.html,
        language=resume.language,
        vacancy_title=vacancy.title,
        vacancy_description=vacancy.description,
        resume_html=resume.html,
        notes=payload.notes,
    )
    output = await get_provider().complete(prompt, system=prompts.COVER_LETTER_SYSTEM)

    cover_letter = CoverLetter(resume_id=resume.id, html=extract_html(output))
    return await cover_letters_crud.create(cover_letter)
