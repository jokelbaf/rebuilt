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


class LinkedInParser(VacancyParser):
    """Parser for linkedin.com job postings (public guest view)."""

    hosts = ("linkedin.com",)

    async def parse(self, url: str, client: httpx.AsyncClient) -> ParsedVacancy:
        """Parse a linkedin.com vacancy from its public guest job view."""
        html = await fetch_html(client, url)
        soup = BeautifulSoup(html, "lxml")

        title_el = (
            soup.select_one("h1.top-card-layout__title")
            or soup.select_one("h1.topcard__title")
            or soup.find("h1")
        )
        description_el = (
            soup.select_one(".show-more-less-html__markup")
            or soup.select_one(".description__text--rich")
            or soup.select_one(".description__text")
        )

        title = title_el.get_text(strip=True) if title_el else ""
        description = html_to_text(str(description_el)) if description_el else ""

        if not description:
            posting = extract_jsonld_jobposting(html)
            if posting:
                title = title or str(posting.get("title") or "").strip()
                description = content_to_text(str(posting.get("description") or ""))

        if not title or not description:
            raise BadRequestError(
                "Could not parse this linkedin.com vacancy. It may require signing in."
            )

        return ParsedVacancy(title=title, description=description)
