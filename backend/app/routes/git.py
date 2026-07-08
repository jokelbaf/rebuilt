import uuid

from crud import git_sources as git_sources_crud
from errors import NotFoundError
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from gitops import service as git_service
from models import GitSource
from responses import ok
from schemas.git import GitSourceCreate, GitSourcePublic

router = APIRouter(prefix="/api/git", tags=["Git"])


@router.get("/sources")
async def list_sources() -> JSONResponse:
    """List configured git sources."""
    sources = await git_sources_crud.list_all()
    return ok([GitSourcePublic.model_validate(source) for source in sources])


@router.post("/sources")
async def create_source(payload: GitSourceCreate) -> JSONResponse:
    """Add a git source's credentials."""
    source = await git_sources_crud.create(
        GitSource(username=payload.username, token=payload.password)
    )
    return ok(GitSourcePublic.model_validate(source))


@router.delete("/sources/{source_id}")
async def delete_source(source_id: uuid.UUID) -> JSONResponse:
    """Delete a git source."""
    if not await git_sources_crud.delete(source_id):
        raise NotFoundError("Git source not found.")
    return ok()


@router.get("/owners")
async def list_owners() -> JSONResponse:
    """List repository owners accessible across all git sources."""
    owners = await git_service.list_owners()
    return ok(owners)


@router.get("/owners/{owner}/repos")
async def list_repos(owner: str, q: str | None = Query(default=None)) -> JSONResponse:
    """List repositories for an owner."""
    repos = await git_service.list_repos(owner, q)
    return ok(repos)
