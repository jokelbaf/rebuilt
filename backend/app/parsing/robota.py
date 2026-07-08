import re
from typing import Any, cast

import httpx
from errors import BadRequestError

from .base import DEFAULT_HEADERS, ParsedVacancy, VacancyParser, html_to_text

_VACANCY_ID = re.compile(r"vacancy/?(\d+)")
_API_URL = "https://dracula.robota.ua?q=getPublishedVacancy"
_QUERY = (
    "query getPublishedVacancy($id: ID!, $trackView: Boolean) {"
    " publishedVacancy(id: $id, trackView: $trackView) {"
    " id title description fullDescription"
    " city { name __typename }"
    " company { name __typename }"
    " __typename } }"
)


class RobotaUaParser(VacancyParser):
    """Parser for robota.ua job postings, backed by its public GraphQL API."""

    hosts = ("robota.ua",)

    async def parse(self, url: str, client: httpx.AsyncClient) -> ParsedVacancy:
        """Parse a robota.ua vacancy through its public GraphQL API."""
        match = _VACANCY_ID.search(url)
        if not match:
            raise BadRequestError("Could not determine the robota.ua vacancy id from the URL.")

        body = {
            "operationName": "getPublishedVacancy",
            "variables": {"id": match.group(1), "trackView": False},
            "query": _QUERY,
        }
        response = await client.post(
            _API_URL,
            json=body,
            headers={**DEFAULT_HEADERS, "Accept": "application/json"},
        )
        if response.status_code != 200 or "application/json" not in response.headers.get(
            "content-type", ""
        ):
            raise BadRequestError(
                "Could not fetch this robota.ua vacancy. "
                "It may be expired or temporarily protected."
            )

        data: Any = response.json()
        try:
            vacancy: Any = data["data"]["publishedVacancy"]
        except (KeyError, TypeError) as exc:
            raise BadRequestError("Could not parse this robota.ua vacancy.") from exc
        if not isinstance(vacancy, dict):
            raise BadRequestError("Could not parse this robota.ua vacancy.")

        fields = cast(dict[str, Any], vacancy)
        title = str(fields.get("title") or "").strip()
        body = fields.get("fullDescription") or fields.get("description") or ""
        description = html_to_text(str(body))
        if not title or not description:
            raise BadRequestError("Could not parse this robota.ua vacancy.")

        return ParsedVacancy(title=title, description=description)
