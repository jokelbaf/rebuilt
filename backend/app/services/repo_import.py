import shutil
import uuid
from typing import TypedDict

from ai import get_provider, prompts
from constants import CLONES_DIR
from crud import projects as projects_crud
from gitops import service as git_service
from models import Project
from modules.text import slugify, strip_code_fences, unique_name

from .extraction import coerce_level, coerce_str_list, parse_json_object


class ProjectMetadata(TypedDict):
    """Resume-ready project metadata extracted from a repository."""

    title: str
    description: str
    tech: list[str]
    roles: list[str]
    level: str
    resume_bullets: list[str]
    keywords: list[str]


def _parse_metadata(raw: str, fallback_title: str) -> ProjectMetadata:
    """Parse the AI's JSON output into validated project metadata fields."""
    data = parse_json_object(strip_code_fences(raw))
    title = str(data.get("title") or fallback_title).strip() or fallback_title
    return ProjectMetadata(
        title=title,
        description=str(data.get("description") or "").strip(),
        tech=coerce_str_list(data.get("tech")),
        roles=coerce_str_list(data.get("roles")),
        level=coerce_level(data.get("level")),
        resume_bullets=coerce_str_list(data.get("resumeBullets")),
        keywords=coerce_str_list(data.get("keywords")),
    )


async def import_from_git(owner: str, repo: str) -> Project:
    """Clone a repository, analyze it with AI, and persist a project."""
    workspace = CLONES_DIR / f"{owner}-{repo}-{uuid.uuid4().hex[:8]}"
    try:
        await git_service.clone(owner, repo, workspace)
        output = await get_provider().complete(
            prompts.build_repo_analysis_prompt(),
            system=prompts.REPO_ANALYSIS_SYSTEM,
            workspace=workspace,
        )
        metadata = _parse_metadata(output, fallback_title=repo)
    finally:
        shutil.rmtree(workspace, ignore_errors=True)

    name = await unique_name(slugify(repo) or "project", projects_crud.get_by_name)
    project = Project(name=name, **metadata)
    return await projects_crud.create(project)
