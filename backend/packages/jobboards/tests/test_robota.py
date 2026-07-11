from datetime import UTC, datetime, timedelta

import httpx
import pytest
import respx
from jobboards.errors import AuthFailedError, AuthRequiredError, ParseError
from jobboards.robota import RobotaClient
from jobboards.types import SearchFilters, SessionState

_AUTH_URL = "https://auth-api.robota.ua/Login"
_API_URL = "https://dracula.robota.ua/"


def _graphql_route(operation: str) -> respx.Route:
    """Register a dracula route matched by its ?q=<operation> parameter."""
    return respx.post(_API_URL, params={"q": operation})


async def test_authenticate_rejects_bad_credentials(robota_client: RobotaClient) -> None:
    with respx.mock:
        respx.post(_AUTH_URL).mock(return_value=httpx.Response(401, text="Unauthorized"))
        with pytest.raises(AuthFailedError):
            await robota_client.authenticate("user@example.com", "wrong")


async def test_authenticate_without_token_fails(robota_client: RobotaClient) -> None:
    with respx.mock:
        respx.post(_AUTH_URL).mock(return_value=httpx.Response(200, json=""))
        with pytest.raises(AuthFailedError):
            await robota_client.authenticate("user@example.com", "secret")


@pytest.mark.parametrize(
    ("session", "expected"),
    [
        (SessionState(token=None), False),
        (SessionState(token="t", expires_at=datetime.now(UTC) - timedelta(hours=1)), False),
        (SessionState(token="t", expires_at=datetime.now(UTC) + timedelta(hours=1)), True),
        (SessionState(token="t", expires_at=None), True),
    ],
)
async def test_verify_session(
    robota_client: RobotaClient, session: SessionState, expected: bool
) -> None:
    assert await robota_client.verify(session) is expected


async def test_search_requires_session(robota_client: RobotaClient) -> None:
    with respx.mock:
        _graphql_route("getPublishedVacanciesList").mock(return_value=httpx.Response(200, json={}))
        with pytest.raises(AuthRequiredError):
            await robota_client.search(SearchFilters(), session=SessionState(token=None))


async def test_search_expired_session_raises_auth_required(
    robota_client: RobotaClient, robota_session: SessionState
) -> None:
    with respx.mock:
        _graphql_route("getPublishedVacanciesList").mock(return_value=httpx.Response(401))
        with pytest.raises(AuthRequiredError):
            await robota_client.search(SearchFilters(), session=robota_session)


async def test_search_cloudflare_html_raises_parse_error(
    robota_client: RobotaClient, robota_session: SessionState
) -> None:
    html = "<html><body>Attention Required! Cloudflare</body></html>"
    with respx.mock:
        _graphql_route("getPublishedVacanciesList").mock(
            return_value=httpx.Response(200, html=html)
        )
        with pytest.raises(ParseError):
            await robota_client.search(SearchFilters(), session=robota_session)


async def test_search_graphql_errors_raise_parse_error(
    robota_client: RobotaClient, robota_session: SessionState
) -> None:
    body = {"errors": [{"message": "boom"}], "data": None}
    with respx.mock:
        _graphql_route("getPublishedVacanciesList").mock(
            return_value=httpx.Response(200, json=body)
        )
        with pytest.raises(ParseError):
            await robota_client.search(SearchFilters(), session=robota_session)


async def test_fetch_missing_vacancy_raises_parse_error(
    robota_client: RobotaClient, robota_session: SessionState
) -> None:
    with respx.mock:
        _graphql_route("getPublishedVacancy").mock(
            return_value=httpx.Response(200, json={"data": {"publishedVacancy": None}})
        )
        with pytest.raises(ParseError):
            await robota_client.fetch("404", session=robota_session)


async def test_search_maps_salary_and_default_logo(
    robota_client: RobotaClient, robota_session: SessionState
) -> None:
    node = {
        "id": "42",
        "title": "Backend Engineer",
        "description": "\t\t  spaced   snippet\n",
        "salary": {"amountFrom": 50000, "amountTo": 90000},
        "company": {"id": "7", "name": "Acme", "logoUrl": "https://x/defaultlogo.gif"},
        "city": {"id": "1", "name": "Kyiv"},
        "schedules": [{"id": "1"}],
        "badges": [{"name": "Bonus"}],
    }
    payload = {"data": {"publishedVacancies": {"totalCount": 1, "items": [node]}}}
    with respx.mock:
        _graphql_route("getPublishedVacanciesList").mock(
            return_value=httpx.Response(200, json=payload)
        )
        page = await robota_client.search(SearchFilters(), session=robota_session)

    summary = page.items[0]
    assert summary.salary_min == 50000
    assert summary.salary_max == 90000
    assert summary.salary_currency == "UAH"
    assert summary.company_logo_url is None  # default placeholder dropped
    assert summary.remote is False
    assert summary.snippet == "spaced snippet"
    assert page.has_next is False
