import abc
import asyncio
import random
from typing import ClassVar, Self

import httpx

from .types import SearchFilters, SearchPage, SessionState, VacancyDetails

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
DEFAULT_HEADERS = {
    "User-Agent": DEFAULT_USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9,uk;q=0.8",
}

_MIN_DELAY = 0.4
_MAX_DELAY = 1.1


class JobBoardClient(abc.ABC):
    """Base class for authenticated job-board clients."""

    platform: ClassVar[str]

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        min_delay: float = _MIN_DELAY,
        max_delay: float = _MAX_DELAY,
    ) -> None:
        self._client = client or httpx.AsyncClient(
            headers=DEFAULT_HEADERS,
            timeout=httpx.Timeout(30.0),
            follow_redirects=False,
        )
        self._min_delay = min_delay
        self._max_delay = max_delay

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.aclose()

    async def _polite_delay(self) -> None:
        """Sleep a small jittered interval to avoid hammering the platform."""
        if self._max_delay > 0:
            await asyncio.sleep(random.uniform(self._min_delay, self._max_delay))

    @abc.abstractmethod
    async def authenticate(self, email: str, password: str) -> SessionState:
        """Log in with credentials and return a fresh session."""

    @abc.abstractmethod
    async def verify(self, session: SessionState) -> bool:
        """Return whether the session is still valid."""

    @abc.abstractmethod
    async def search(self, filters: SearchFilters, *, session: SessionState) -> SearchPage:
        """Return one page of search results as unified summaries."""

    @abc.abstractmethod
    async def fetch(self, external_id: str, *, session: SessionState) -> VacancyDetails:
        """Fetch the full details of a single vacancy."""
