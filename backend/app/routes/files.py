from crud import files as files_crud
from errors import ConflictError, NotFoundError
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from models import MarkdownFile
from modules.text import make_excerpt, slugify
from responses import ok
from schemas.files import (
    MarkdownFileCreate,
    MarkdownFilePublic,
    MarkdownFileSummary,
    MarkdownFileUpdate,
)

COLLECTIONS = ("profile", "experience")


def _summary(file: MarkdownFile) -> MarkdownFileSummary:
    """Build a markdown file summary with a derived excerpt."""
    return MarkdownFileSummary(
        name=file.name,
        excerpt=make_excerpt(file.content),
        updated_at=file.updated_at,
    )


def _public(file: MarkdownFile) -> MarkdownFilePublic:
    """Build a full markdown file representation with a derived excerpt."""
    return MarkdownFilePublic(
        name=file.name,
        excerpt=make_excerpt(file.content),
        updated_at=file.updated_at,
        content=file.content,
    )


def create_files_router(collection: str) -> APIRouter:
    """Build a CRUD router for a markdown file collection."""
    router = APIRouter(prefix=f"/api/{collection}", tags=[collection.capitalize()])

    @router.get("")
    async def list_files(q: str | None = Query(default=None)) -> JSONResponse:
        """List markdown files in the collection."""
        files = await files_crud.list_for(collection, q)
        return ok([_summary(file) for file in files])

    @router.post("")
    async def create_file(payload: MarkdownFileCreate) -> JSONResponse:
        """Create a markdown file in the collection."""
        name = slugify(payload.name)
        if not name:
            raise ConflictError("A valid file name is required.")
        if await files_crud.get(collection, name):
            raise ConflictError("A file with this name already exists.")
        file = await files_crud.create(
            MarkdownFile(collection=collection, name=name, content=payload.content)
        )
        return ok(_public(file))

    @router.get("/{name}")
    async def get_file(name: str) -> JSONResponse:
        """Get a markdown file by name."""
        file = await files_crud.get(collection, name)
        if not file:
            raise NotFoundError("File not found.")
        return ok(_public(file))

    @router.put("/{name}")
    async def update_file(name: str, payload: MarkdownFileUpdate) -> JSONResponse:
        """Update a markdown file's content."""
        file = await files_crud.update(collection, name, payload.content)
        if not file:
            raise NotFoundError("File not found.")
        return ok(_public(file))

    @router.delete("/{name}")
    async def delete_file(name: str) -> JSONResponse:
        """Delete a markdown file."""
        if not await files_crud.delete(collection, name):
            raise NotFoundError("File not found.")
        return ok()

    return router


routers = [create_files_router(collection) for collection in COLLECTIONS]
