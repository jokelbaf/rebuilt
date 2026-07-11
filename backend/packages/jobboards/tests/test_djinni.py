import httpx
import pytest
import respx
from jobboards.djinni import DjinniClient
from jobboards.djinni.parsers import parse_search_page, parse_vacancy_details
from jobboards.errors import AuthRequiredError, ParseError, RateLimitedError
from jobboards.registry import CLIENTS, get_client
from jobboards.types import SearchFilters, SessionState

_LOGIN_URL = "https://djinni.co/login"
_LOGIN_POST_URL = "https://djinni.co/login?from=frontpage_main"
_VERIFY_URL = "https://djinni.co/my/"
_JOBS_URL = "https://djinni.co/jobs/"


async def test_authenticate_requires_csrf_token(djinni_client: DjinniClient) -> None:
    with respx.mock:
        respx.get(_LOGIN_URL).mock(return_value=httpx.Response(200, text="<html></html>"))
        with pytest.raises(ParseError):
            await djinni_client.authenticate("user@example.com", "secret")


def test_listing_parser_accepts_empty_results() -> None:
    page = parse_search_page("<html><body><main id='jobs_main'></main></body></html>", 1)

    assert page.items == []
    assert page.has_next is False
    assert page.total == 0


def test_parsers_reject_malformed_pages() -> None:
    with pytest.raises(ParseError):
        parse_search_page("<html><body></body></html>", 1)
    with pytest.raises(ParseError):
        parse_vacancy_details("<html><body></body></html>", "404")


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(302, headers={"location": "/login?next=/jobs/"}),
        httpx.Response(200, text="<html><body data-usertype='none'></body></html>"),
    ],
)
async def test_search_expired_session_raises_auth_required(
    djinni_client: DjinniClient,
    djinni_session: SessionState,
    response: httpx.Response,
) -> None:
    with respx.mock:
        respx.get(_JOBS_URL).mock(return_value=response)
        with pytest.raises(AuthRequiredError):
            await djinni_client.search(SearchFilters(), session=djinni_session)


async def test_search_requires_session(djinni_client: DjinniClient) -> None:
    with pytest.raises(AuthRequiredError):
        await djinni_client.search(SearchFilters(), session=SessionState())


async def test_fetch_rate_limit_raises_package_error(
    djinni_client: DjinniClient, djinni_session: SessionState
) -> None:
    with respx.mock:
        respx.get(f"{_JOBS_URL}810899-vacancy/").mock(return_value=httpx.Response(429))
        with pytest.raises(RateLimitedError):
            await djinni_client.fetch("810899", session=djinni_session)


def test_registry_exposes_djinni_client() -> None:
    assert CLIENTS["djinni"] is DjinniClient
    assert isinstance(get_client("djinni"), DjinniClient)
