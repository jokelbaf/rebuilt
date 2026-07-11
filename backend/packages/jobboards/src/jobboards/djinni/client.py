from typing import ClassVar
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from ..base import JobBoardClient
from ..errors import AuthFailedError, AuthRequiredError, ParseError, RateLimitedError
from ..types import SearchFilters, SearchPage, SessionState, VacancyDetails
from .parsers import parse_search_page, parse_vacancy_details

_BASE_URL = "https://djinni.co"
_LOGIN_URL = f"{_BASE_URL}/login"
_LOGIN_POST_URL = f"{_LOGIN_URL}?from=frontpage_main"
_VERIFY_URL = f"{_BASE_URL}/my/"
_JOBS_URL = f"{_BASE_URL}/jobs/"
_EXPERIENCE_LEVELS = {
    "no experience": "no_exp",
    "no_exp": "no_exp",
    "1 year": "1y",
    "1y": "1y",
    "2 years": "2y",
    "2y": "2y",
    "3 years": "3y",
    "3y": "3y",
    "5 years": "5y",
    "5y": "5y",
}
_ENGLISH_LEVELS = {
    "no english": "no_english",
    "no_english": "no_english",
    "pre-intermediate": "pre",
    "pre": "pre",
    "intermediate": "intermediate",
    "b1": "intermediate",
    "upper-intermediate": "upper",
    "upper": "upper",
    "b2": "upper",
    "fluent": "fluent",
    "c1": "fluent",
    "c2": "fluent",
}


class DjinniClient(JobBoardClient):
    """Authenticated djinni.co client backed by its server-rendered pages."""

    platform: ClassVar[str] = "djinni"

    async def authenticate(self, email: str, password: str) -> SessionState:
        """Log in through Djinni's Django form and return a cookie session."""
        login = await self._client.get(_LOGIN_URL)
        _raise_for_transport(login, "login page")
        csrf = _csrf_token(login.text)
        if not csrf:
            raise ParseError("Djinni login page did not contain a CSRF token.")

        cookies = dict(login.cookies)
        response = await self._client.post(
            _LOGIN_POST_URL,
            data={"email": email, "password": password, "csrfmiddlewaretoken": csrf},
            headers={
                "Referer": _LOGIN_URL,
                "Origin": _BASE_URL,
                "Cookie": _cookie_header(cookies),
            },
        )
        _raise_for_transport(response, "login")
        if response.status_code not in (301, 302, 303) or not _authenticated_redirect(response):
            raise AuthFailedError("Djinni rejected the credentials.")

        cookies.update(dict(response.cookies))
        session = SessionState(cookies=cookies)
        if not await self.verify(session):
            raise AuthFailedError("Djinni login did not create an authenticated session.")
        return session

    async def verify(self, session: SessionState) -> bool:
        """Return whether Djinni still recognizes the stored cookie session."""
        if not session.cookies.get("sessionid"):
            return False
        await self._polite_delay()
        response = await self._client.get(
            _VERIFY_URL, headers={"Cookie": _cookie_header(session.cookies)}
        )
        if response.status_code == 429:
            raise RateLimitedError("Djinni rate-limited session verification.")
        if _redirects_to_login(response):
            return False
        if response.is_redirect:
            target = urljoin(_BASE_URL, response.headers.get("location", ""))
            if urlparse(target).netloc != urlparse(_BASE_URL).netloc:
                return False
            response = await self._client.get(
                target, headers={"Cookie": _cookie_header(session.cookies)}
            )
            if _redirects_to_login(response):
                return False
        return response.status_code == 200 and _is_authenticated_html(response.text)

    async def search(self, filters: SearchFilters, *, session: SessionState) -> SearchPage:
        """Return one page of Djinni vacancies matching the filters."""
        _require_session(session)
        await self._polite_delay()
        response = await self._client.get(
            _JOBS_URL,
            params=_search_params(filters),
            headers={"Cookie": _cookie_header(session.cookies)},
        )
        _raise_for_authenticated_page(response, "jobs search")
        return parse_search_page(response.text, filters.page)

    async def fetch(self, external_id: str, *, session: SessionState) -> VacancyDetails:
        """Fetch one Djinni vacancy and its full description."""
        _require_session(session)
        await self._polite_delay()
        headers = {"Cookie": _cookie_header(session.cookies)}
        response = await self._client.get(f"{_JOBS_URL}{external_id}-vacancy/", headers=headers)
        _raise_for_authenticated_page(response, "vacancy detail", allow_redirect=True)
        if response.is_redirect:
            location = response.headers.get("location", "")
            target = urljoin(_BASE_URL, location)
            if urlparse(target).netloc != urlparse(_BASE_URL).netloc:
                raise ParseError("Djinni redirected the vacancy to an unexpected host.")
            await self._polite_delay()
            response = await self._client.get(target, headers=headers)
            _raise_for_authenticated_page(response, "vacancy detail")
        return parse_vacancy_details(response.text, external_id)


def _search_params(filters: SearchFilters) -> dict[str, str | list[str]]:
    """Build Djinni's repeated query parameters from unified filters."""
    params: dict[str, str | list[str]] = {"search_type": "basic-search"}
    keywords = " ".join(keyword.strip() for keyword in filters.keywords if keyword.strip())
    if keywords:
        params["all_keywords"] = keywords
    if filters.salary_min is not None:
        params["salary"] = str(filters.salary_min)
    seniority = _EXPERIENCE_LEVELS.get(filters.seniority.strip().casefold())
    if seniority:
        params["exp_level"] = seniority
    if filters.remote:
        params["employment"] = "remote"
    if filters.location:
        params["region"] = filters.location
    english = _ENGLISH_LEVELS.get(filters.english_level.strip().casefold())
    if english:
        params["english_level"] = english
    if filters.page > 1:
        params["page"] = str(filters.page)
    return params


def _csrf_token(html: str) -> str:
    """Extract the Django CSRF form token from the login page."""
    soup = BeautifulSoup(html, "lxml")
    field = soup.select_one("input[name='csrfmiddlewaretoken']")
    value = field.get("value") if field else None
    return value if isinstance(value, str) else ""


def _cookie_header(cookies: dict[str, str]) -> str:
    """Serialize persisted cookies for one authenticated request."""
    return "; ".join(f"{name}={value}" for name, value in cookies.items())


def _require_session(session: SessionState) -> None:
    """Raise when no Djinni session cookie was supplied."""
    if not session.cookies.get("sessionid"):
        raise AuthRequiredError("A Djinni session is required.")


def _raise_for_transport(response: httpx.Response, operation: str) -> None:
    """Translate Djinni transport failures into package errors."""
    if response.status_code == 429:
        raise RateLimitedError(f"Djinni rate-limited the {operation} request.")
    if response.status_code >= 400:
        raise ParseError(f"Djinni {operation} failed with status {response.status_code}.")


def _raise_for_authenticated_page(
    response: httpx.Response, operation: str, *, allow_redirect: bool = False
) -> None:
    """Validate that a Djinni page response still belongs to an authenticated user."""
    if response.status_code == 429:
        raise RateLimitedError(f"Djinni rate-limited the {operation} request.")
    if _redirects_to_login(response) or (
        response.status_code == 200 and not _is_authenticated_html(response.text)
    ):
        raise AuthRequiredError("Djinni session is no longer valid.")
    if response.is_redirect and allow_redirect:
        return
    if response.status_code != 200:
        raise ParseError(f"Djinni {operation} failed with status {response.status_code}.")


def _authenticated_redirect(response: httpx.Response) -> bool:
    """Return whether login redirected into Djinni's authenticated area."""
    location = response.headers.get("location", "")
    return location.startswith("/my/") or location == "/my/"


def _redirects_to_login(response: httpx.Response) -> bool:
    """Return whether a response redirects to Djinni's login page."""
    return response.is_redirect and "/login" in response.headers.get("location", "")


def _is_authenticated_html(html: str) -> bool:
    """Return whether Djinni page chrome identifies an authenticated candidate."""
    soup = BeautifulSoup(html, "lxml")
    body = soup.body
    return bool(
        body and body.get("data-usertype") == "candidate" and soup.select_one("a[href='/logout']")
    )
