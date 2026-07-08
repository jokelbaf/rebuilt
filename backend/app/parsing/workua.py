import httpx
from bs4 import BeautifulSoup
from errors import BadRequestError

from .base import ParsedVacancy, VacancyParser, fetch_html, html_to_text


class WorkUaParser(VacancyParser):
    """Parser for work.ua job postings."""

    hosts = ("work.ua",)

    async def parse(self, url: str, client: httpx.AsyncClient) -> ParsedVacancy:
        """Parse a work.ua vacancy from its server-rendered HTML."""
        html = await fetch_html(client, url)
        soup = BeautifulSoup(html, "lxml")

        title_el = soup.select_one("h1#h1-name") or soup.find("h1")
        description_el = soup.select_one("#job-description")
        if not title_el or not description_el:
            raise BadRequestError("Could not parse this work.ua vacancy.")

        return ParsedVacancy(
            title=title_el.get_text(strip=True),
            description=html_to_text(str(description_el)),
        )
