import abc
import pathlib

from schemas.git import GitOwner, GitRepo


class GitProvider(abc.ABC):
    """Interface for a git hosting provider scoped to a single credential."""

    @abc.abstractmethod
    async def list_owners(self) -> list[GitOwner]:
        """Return the authenticated user and the organizations they belong to."""

    @abc.abstractmethod
    async def list_repos(self, owner: str) -> list[GitRepo]:
        """Return the repositories owned by the given user or organization."""

    @abc.abstractmethod
    async def clone(self, owner: str, repo: str, destination: pathlib.Path) -> None:
        """Clone a repository into the destination directory."""
