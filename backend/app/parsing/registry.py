import urllib.parse

import httpx
from errors import BadRequestError

from .base import ParsedVacancy, VacancyParser
from .djinni import DjinniParser
from .language import detect_language
from .linkedin import LinkedInParser
from .robota import RobotaUaParser
from .workua import WorkUaParser

PARSERS: list[VacancyParser] = [
    RobotaUaParser(),
    WorkUaParser(),
    DjinniParser(),
    LinkedInParser(),
]


def _select_parser(host: str) -> VacancyParser | None:
    """Return the parser that handles the given hostname, if any."""
    return next((parser for parser in PARSERS if parser.matches(host)), None)


def clean_url(url: str) -> str:
    """Strip query parameters and fragments, keeping the canonical posting URL."""
    parsed = urllib.parse.urlparse(url)
    return urllib.parse.urlunparse(parsed._replace(query="", fragment="", params=""))


async def parse_vacancy(url: str) -> ParsedVacancy:
    """Parse a vacancy URL into structured data with a detected language."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise BadRequestError("Enter a valid vacancy URL.")

    parser = _select_parser(parsed.netloc)
    if parser is None:
        raise BadRequestError(
            "This job board is not supported yet. "
            "Supported sites: robota.ua, work.ua, djinni.co, linkedin.com."
        )

    async with httpx.AsyncClient(timeout=25.0) as client:
        try:
            result = await parser.parse(url, client)
        except httpx.HTTPError as exc:
            raise BadRequestError("Could not fetch the vacancy page.") from exc

    result.language = detect_language(f"{result.title}\n{result.description}")
    return result
