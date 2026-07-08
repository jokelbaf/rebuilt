import pathlib

import httpx
from crud import git_sources as git_sources_crud
from errors import BadRequestError, UpstreamError
from models import GitSource
from schemas.git import GitOwner, GitRepo

from .base import GitProvider
from .github import GitHubProvider


def _build_provider(source: GitSource) -> GitProvider:
    """Build a git provider for a stored source."""
    if source.provider == "github":
        return GitHubProvider(source.username, source.token)
    raise BadRequestError(f"Unsupported git provider: {source.provider}")


async def list_owners() -> list[GitOwner]:
    """Aggregate accessible owners across all configured git sources."""
    sources = await git_sources_crud.list_all()
    owners: dict[str, GitOwner] = {}
    for source in sources:
        provider = _build_provider(source)
        try:
            for owner in await provider.list_owners():
                owners.setdefault(owner.login.lower(), owner)
        except httpx.HTTPError as exc:
            raise UpstreamError("Failed to reach the git provider.") from exc
    return list(owners.values())


async def _resolve(owner: str) -> GitProvider:
    """Return the provider whose credentials can access the given owner."""
    sources = await git_sources_crud.list_all()
    for source in sources:
        provider = _build_provider(source)
        try:
            logins = {item.login.lower() for item in await provider.list_owners()}
        except httpx.HTTPError as exc:
            raise UpstreamError("Failed to reach the git provider.") from exc
        if owner.lower() in logins:
            return provider
    raise BadRequestError("No configured git source can access this owner.")


async def list_repos(owner: str, query: str | None) -> list[GitRepo]:
    """List an owner's repositories, optionally filtered by a search query."""
    provider = await _resolve(owner)
    try:
        repos = await provider.list_repos(owner)
    except httpx.HTTPError as exc:
        raise UpstreamError("Failed to list repositories.") from exc

    if query:
        needle = query.lower()
        repos = [
            repo
            for repo in repos
            if needle in repo.name.lower() or needle in (repo.description or "").lower()
        ]
    return repos


async def clone(owner: str, repo: str, destination: pathlib.Path) -> None:
    """Clone a repository into the destination using the matching git source."""
    provider = await _resolve(owner)
    await provider.clone(owner, repo, destination)
