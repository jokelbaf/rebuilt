import base64
import binascii
import json
from datetime import UTC, datetime
from typing import Any, ClassVar, cast

from ..base import JobBoardClient
from ..errors import AuthFailedError, AuthRequiredError, ParseError
from ..text import html_to_text
from ..types import SearchFilters, SearchPage, SessionState, VacancyDetails, VacancySummary
from . import graphql

_AUTH_URL = "https://auth-api.robota.ua/Login"
_API_URL = "https://dracula.robota.ua/"
_ORIGIN = "https://robota.ua"
_PAGE_SIZE = 20


class RobotaClient(JobBoardClient):
    """Authenticated robota.ua client backed by its dracula GraphQL gateway."""

    platform: ClassVar[str] = "robota"

    async def authenticate(self, email: str, password: str) -> SessionState:
        """Log in through auth-api.robota.ua and return a JWT-backed session."""
        response = await self._client.post(
            _AUTH_URL,
            json={"username": email, "password": password},
            headers={"Accept": "application/json", "Origin": _ORIGIN, "Referer": f"{_ORIGIN}/"},
        )
        if response.status_code in (401, 403):
            raise AuthFailedError("robota.ua rejected the credentials.")
        if response.status_code != 200:
            raise AuthFailedError(f"robota.ua login failed with status {response.status_code}.")

        token = _extract_token(response.text)
        if not token:
            raise AuthFailedError("robota.ua login did not return a token.")
        return SessionState(
            cookies=dict(response.cookies), token=token, expires_at=_jwt_expiry(token)
        )

    async def verify(self, session: SessionState) -> bool:
        """Return whether the session still holds an unexpired token."""
        if not session.token:
            return False
        return session.expires_at is None or session.expires_at > datetime.now(UTC)

    async def search(self, filters: SearchFilters, *, session: SessionState) -> SearchPage:
        """Return one page of published vacancies matching the filters."""
        variables = graphql.search_variables(filters, _PAGE_SIZE)
        data = await self._graphql(
            "getPublishedVacanciesList", graphql.SEARCH_QUERY, variables, session
        )
        published = cast(dict[str, Any], data.get("publishedVacancies") or {})
        nodes = cast(list[Any], published.get("items") or [])
        total = published.get("totalCount")
        total = int(total) if isinstance(total, int) else None
        items = [
            self._map_summary(cast(dict[str, Any], node))
            for node in nodes
            if isinstance(node, dict)
        ]
        has_next = total is not None and filters.page * _PAGE_SIZE < total
        return SearchPage(items=items, has_next=has_next, total=total)

    async def fetch(self, external_id: str, *, session: SessionState) -> VacancyDetails:
        """Fetch a single published vacancy with its full description."""
        variables = graphql.detail_variables(external_id)
        data = await self._graphql("getPublishedVacancy", graphql.DETAIL_QUERY, variables, session)
        node = data.get("publishedVacancy")
        if not isinstance(node, dict):
            raise ParseError("robota.ua returned no vacancy for the given id.")
        return self._map_details(cast(dict[str, Any], node))

    async def _graphql(
        self, operation: str, query: str, variables: dict[str, Any], session: SessionState
    ) -> dict[str, Any]:
        """Run a GraphQL operation against the dracula gateway and return its data object."""
        if not session.token:
            raise AuthRequiredError("A robota.ua session is required.")
        await self._polite_delay()
        response = await self._client.post(
            _API_URL,
            params={"q": operation},
            json={"operationName": operation, "variables": variables, "query": query},
            headers={
                "Authorization": f"Bearer {session.token}",
                "Accept": "application/json",
                "Origin": _ORIGIN,
                "Referer": f"{_ORIGIN}/",
            },
        )
        if response.status_code in (401, 403):
            raise AuthRequiredError("robota.ua session is no longer valid.")
        content_type = response.headers.get("content-type", "")
        if response.status_code != 200 or "application/json" not in content_type:
            raise ParseError(f"Unexpected robota.ua response for {operation}.")
        body = cast(dict[str, Any], response.json())
        if body.get("errors"):
            raise ParseError(f"robota.ua returned GraphQL errors for {operation}.")
        data = body.get("data")
        if not isinstance(data, dict):
            raise ParseError(f"robota.ua returned no data for {operation}.")
        return cast(dict[str, Any], data)

    def _map_summary(self, node: dict[str, Any]) -> VacancySummary:
        """Map a robota vacancy node onto the unified summary type."""
        external_id = str(node.get("id") or "")
        company = cast(dict[str, Any], node.get("company") or {})
        city = cast(dict[str, Any], node.get("city") or {})
        salary = cast(dict[str, Any], node.get("salary") or {})
        schedules = cast(list[Any], node.get("schedules") or [])
        badges = cast(list[Any], node.get("badges") or [])
        salary_min = _positive(salary.get("amountFrom"))
        salary_max = _positive(salary.get("amountTo"))
        return VacancySummary(
            platform=self.platform,
            external_id=external_id,
            url=_vacancy_url(external_id, str(company.get("id") or "")),
            title=str(node.get("title") or "").strip(),
            company=str(company.get("name") or ""),
            company_logo_url=_logo(company.get("logoUrl")),
            location=str(city.get("name") or ""),
            remote=any(str(_id(s)) == graphql.REMOTE_SCHEDULE_ID for s in schedules),
            salary_min=salary_min,
            salary_max=salary_max,
            salary_currency="UAH" if salary_min or salary_max else None,
            tags=[str(_name(b)) for b in badges if _name(b)],
            snippet=_collapse(str(node.get("description") or "")),
            raw=node,
        )

    def _map_details(self, node: dict[str, Any]) -> VacancyDetails:
        """Map a robota vacancy detail node onto the unified details type."""
        summary = self._map_summary(node).model_dump()
        full_html = str(node.get("fullDescription") or "")
        text = (
            html_to_text(full_html) if full_html else _collapse(str(node.get("description") or ""))
        )
        schedules = cast(list[Any], node.get("schedules") or [])
        summary["employment"] = ", ".join(str(_name(s)) for s in schedules if _name(s))
        posted = _parse_iso(node.get("sortDate"))
        if posted:
            summary["posted_at"] = posted
        return VacancyDetails(
            **summary,
            description_text=text,
            description_html=full_html,
        )


def _id(value: Any) -> Any:
    """Return the ``id`` of a node dict, or None."""
    return cast(dict[str, Any], value).get("id") if isinstance(value, dict) else None


def _name(value: Any) -> Any:
    """Return the ``name`` of a node dict, or None."""
    return cast(dict[str, Any], value).get("name") if isinstance(value, dict) else None


def _positive(value: Any) -> int | None:
    """Return the integer value when it is a positive number, else None."""
    return int(value) if isinstance(value, int | float) and value > 0 else None


def _logo(value: Any) -> str | None:
    """Return a real company logo URL, dropping robota's default placeholder."""
    url = str(value or "")
    return url if url and "defaultlogo" not in url else None


def _vacancy_url(external_id: str, company_id: str) -> str:
    """Reconstruct the canonical robota.ua vacancy URL."""
    if company_id:
        return f"https://robota.ua/company{company_id}/vacancy{external_id}"
    return f"https://robota.ua/vacancy{external_id}"


def _collapse(text: str) -> str:
    """Collapse whitespace runs in a listing snippet."""
    return " ".join(text.split())


def _parse_iso(value: Any) -> datetime | None:
    """Parse an ISO datetime string, returning None on failure."""
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _extract_token(text: str) -> str:
    """Extract the JWT from a login response body that is a JSON-encoded string."""
    raw = text.strip()
    try:
        decoded = json.loads(raw)
    except json.JSONDecodeError:
        return raw
    return decoded if isinstance(decoded, str) else ""


def _jwt_expiry(token: str) -> datetime | None:
    """Decode a JWT payload and return its expiry as an aware datetime."""
    parts = token.split(".")
    if len(parts) < 2:
        return None
    padded = parts[1] + "=" * (-len(parts[1]) % 4)
    try:
        payload = cast(dict[str, Any], json.loads(base64.urlsafe_b64decode(padded)))
    except binascii.Error, ValueError:
        return None
    exp = payload.get("exp")
    return datetime.fromtimestamp(exp, tz=UTC) if isinstance(exp, int | float) else None
