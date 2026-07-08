import uuid

from crud import projects as projects_crud
from errors import NotFoundError
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from models import Project
from modules.text import slugify, unique_name
from responses import ok
from schemas.projects import ProjectImportGit, ProjectInput, ProjectPublic, ProjectSummary
from services import repo_import

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("")
async def list_projects(q: str | None = Query(default=None)) -> JSONResponse:
    """List projects, optionally filtered by a search query."""
    projects = await projects_crud.list_all(q)
    return ok([ProjectSummary.model_validate(project) for project in projects])


@router.post("")
async def create_project(payload: ProjectInput) -> JSONResponse:
    """Create a project from manual input."""
    name = await unique_name(slugify(payload.title) or "project", projects_crud.get_by_name)
    project = await projects_crud.create(Project(name=name, **payload.model_dump()))
    return ok(ProjectPublic.model_validate(project))


@router.post("/import/git")
async def import_project_from_git(payload: ProjectImportGit) -> JSONResponse:
    """Import a project by cloning and analyzing a git repository."""
    project = await repo_import.import_from_git(payload.owner, payload.repo)
    return ok(ProjectPublic.model_validate(project))


@router.get("/{project_id}")
async def get_project(project_id: uuid.UUID) -> JSONResponse:
    """Get a single project by id."""
    project = await projects_crud.get(project_id)
    if not project:
        raise NotFoundError("Project not found.")
    return ok(ProjectPublic.model_validate(project))


@router.put("/{project_id}")
async def update_project(project_id: uuid.UUID, payload: ProjectInput) -> JSONResponse:
    """Update a project's fields."""
    project = await projects_crud.update(project_id, payload.model_dump())
    if not project:
        raise NotFoundError("Project not found.")
    return ok(ProjectPublic.model_validate(project))


@router.delete("/{project_id}")
async def delete_project(project_id: uuid.UUID) -> JSONResponse:
    """Delete a project."""
    if not await projects_crud.delete(project_id):
        raise NotFoundError("Project not found.")
    return ok()
