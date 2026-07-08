from crud import templates as templates_crud
from errors import ConflictError, NotFoundError
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models import Template
from modules.text import slugify
from responses import ok
from schemas.templates import TemplateCreate, TemplatePublic, TemplateSummary, TemplateUpdate

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.get("")
async def list_templates() -> JSONResponse:
    """List all templates."""
    templates = await templates_crud.list_all()
    return ok([TemplateSummary.model_validate(template) for template in templates])


@router.post("")
async def create_template(payload: TemplateCreate) -> JSONResponse:
    """Create a new template."""
    name = slugify(payload.name)
    if not name:
        raise ConflictError("A valid template name is required.")
    if await templates_crud.get(name):
        raise ConflictError("A template with this name already exists.")
    template = await templates_crud.create(Template(name=name, html=payload.html))
    return ok(TemplatePublic.model_validate(template))


@router.get("/{name}")
async def get_template(name: str) -> JSONResponse:
    """Get a single template by name."""
    template = await templates_crud.get(name)
    if not template:
        raise NotFoundError("Template not found.")
    return ok(TemplatePublic.model_validate(template))


@router.put("/{name}")
async def update_template(name: str, payload: TemplateUpdate) -> JSONResponse:
    """Update a template's HTML."""
    template = await templates_crud.update(name, payload.html)
    if not template:
        raise NotFoundError("Template not found.")
    return ok(TemplatePublic.model_validate(template))


@router.delete("/{name}")
async def delete_template(name: str) -> JSONResponse:
    """Delete a template."""
    if not await templates_crud.delete(name):
        raise NotFoundError("Template not found.")
    return ok()
