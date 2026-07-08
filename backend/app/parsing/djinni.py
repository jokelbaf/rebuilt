import httpx
from bs4 import BeautifulSoup
from errors import BadRequestError

from .base import (
    ParsedVacancy,
    VacancyParser,
    content_to_text,
    extract_jsonld_jobposting,
    fetch_html,
    html_to_text,
)


class DjinniParser(VacancyParser):
    """Parser for djinni.co job postings."""

    hosts = ("djinni.co",)

    async def parse(self, url: str, client: httpx.AsyncClient) -> ParsedVacancy:
        """Parse a djinni.co vacancy, preferring its JSON-LD JobPosting data."""
        html = await fetch_html(client, url)

        posting = extract_jsonld_jobposting(html)
        if posting:
            title = str(posting.get("title") or "").strip()
            description = content_to_text(str(posting.get("description") or ""))
            if title and description:
                return ParsedVacancy(title=title, description=description)

        soup = BeautifulSoup(html, "lxml")
        title_el = soup.select_one("h1")
        description_el = soup.select_one(".job-post-description, .row-mobile-order-2")
        if not title_el or not description_el:
            raise BadRequestError("Could not parse this djinni.co vacancy.")

        return ParsedVacancy(
            title=title_el.get_text(strip=True),
            description=html_to_text(str(description_el)),
        )
