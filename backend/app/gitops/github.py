import asyncio
import pathlib
from typing import Any, TypedDict, cast

import httpx
from errors import UpstreamError
from loguru import logger
from schemas.git import GitOwner, GitRepo

from .base import GitProvider

API_BASE = "https://api.github.com"
_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


class _Account(TypedDict):
    login: str


class _Repo(TypedDict):
    id: int
    name: str
    full_name: str
    description: str | None
    private: bool


class GitHubProvider(GitProvider):
    """GitHub-backed git provider scoped to a single personal access token."""

    def __init__(self, username: str, token: str) -> None:
        self._username = username
        self._token = token

    def _client(self) -> httpx.AsyncClient:
        """Create an authenticated GitHub API client."""
        return httpx.AsyncClient(
            base_url=API_BASE,
            headers={**_HEADERS, "Authorization": f"Bearer {self._token}"},
            timeout=20.0,
        )

    async def _get(
        self, client: httpx.AsyncClient, path: str, params: dict[str, str | int] | None = None
    ) -> Any:
        """Perform an authenticated GET request and return parsed JSON."""
        response = await client.get(path, params=params)
        if response.status_code == 401:
            raise UpstreamError("The git credentials are invalid or expired.")
        response.raise_for_status()
        return response.json()

    async def list_owners(self) -> list[GitOwner]:
        """Return the authenticated user and their organizations as owners."""
        async with self._client() as client:
            user = cast(_Account, await self._get(client, "/user"))
            orgs = cast(list[_Account], await self._get(client, "/user/orgs", {"per_page": 100}))

        owners = [GitOwner(login=user["login"], type="user")]
        owners += [GitOwner(login=org["login"], type="organization") for org in orgs]
        return owners

    async def list_repos(self, owner: str) -> list[GitRepo]:
        """Return repositories for the given owner, including private ones."""
        async with self._client() as client:
            if owner.lower() == self._username.lower():
                raw = await self._paginate(client, "/user/repos", {"affiliation": "owner"})
            else:
                raw = await self._paginate(client, f"/orgs/{owner}/repos", {"type": "all"})

        return [
            GitRepo(
                id=repo["id"],
                name=repo["name"],
                full_name=repo["full_name"],
                description=repo["description"],
                private=repo["private"],
            )
            for repo in raw
        ]

    async def _paginate(
        self, client: httpx.AsyncClient, path: str, params: dict[str, str | int]
    ) -> list[_Repo]:
        """Collect all pages of a paginated GitHub list endpoint."""
        results: list[_Repo] = []
        page = 1
        while True:
            batch = cast(
                list[_Repo],
                await self._get(client, path, {**params, "per_page": 100, "page": page}),
            )
            if not batch:
                break
            results.extend(batch)
            if len(batch) < 100:
                break
            page += 1
        return results

    async def clone(self, owner: str, repo: str, destination: pathlib.Path) -> None:
        """Shallow-clone a repository into the destination using the access token."""
        url = f"https://{self._username}:{self._token}@github.com/{owner}/{repo}.git"
        process = await asyncio.create_subprocess_exec(
            "git",
            "clone",
            "--depth",
            "1",
            url,
            str(destination),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await process.communicate()
        if process.returncode != 0:
            logger.error("git clone failed: {}", stderr.decode(errors="replace").strip())
            raise UpstreamError("Failed to clone the repository.")
