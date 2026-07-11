import json
import re
from datetime import datetime
from typing import Any, cast
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag

from ..errors import ParseError
from ..text import content_to_text, html_to_text
from ..types import SearchPage, VacancyDetails, VacancySummary

_BASE_URL = "https://djinni.co"
_NUMBER = re.compile(r"\d[\d\s,.]*")
_PAGE = re.compile(r"(?:[?&])page=(\d+)")
_EMPLOYMENT_TYPES = {
    "FULL_TIME": "Full-time",
    "PART_TIME": "Part-time",
    "CONTRACTOR": "Contract",
    "TEMPORARY": "Temporary",
    "INTERN": "Internship",
    "VOLUNTEER": "Volunteer",
    "PER_DIEM": "Per diem",
    "OTHER": "Other",
}


def parse_search_page(html: str, page: int) -> SearchPage:
    """Parse a Djinni jobs listing into unified vacancy summaries."""
    soup = BeautifulSoup(html, "lxml")
    postings = _job_postings(soup)
    posting_by_id = {
        str(posting.get("identifier")): posting
        for posting in postings
        if posting.get("identifier") is not None
    }
    cards = soup.select("div.job-item[id^='job-item-']")
    if not cards:
        if soup.select_one("main#jobs_main"):
            return SearchPage(items=[], has_next=False, total=0)
        raise ParseError("Djinni returned a jobs page without vacancy cards.")

    items = [
        _parse_card(card, posting_by_id.get(_card_id(card), {})) for card in cards if _card_id(card)
    ]
    if not items:
        raise ParseError("Djinni vacancy cards did not contain valid ids.")
    return SearchPage(items=items, has_next=_has_next_page(soup, page), total=None)


def parse_vacancy_details(html: str, external_id: str) -> VacancyDetails:
    """Parse a Djinni vacancy detail page into unified vacancy details."""
    soup = BeautifulSoup(html, "lxml")
    posting = next(
        (item for item in _job_postings(soup) if str(item.get("identifier") or "") == external_id),
        None,
    )
    if posting is None:
        raise ParseError("Djinni returned no structured vacancy details for the given id.")

    description = soup.select_one("div.job-post__description")
    description_html = description.decode_contents().strip() if description else ""
    plain_description = str(posting.get("description") or "")
    salary_min, salary_max, salary_currency = _salary(posting, "")
    organization = _mapping(posting.get("hiringOrganization"))
    months = _number(_mapping(posting.get("experienceRequirements")).get("monthsOfExperience"))
    location = _posting_location(posting)
    tags = _tags(posting)
    logo = soup.select_one("header img.userpic-image")
    url = str(posting.get("url") or f"{_BASE_URL}/jobs/{external_id}/")
    return VacancyDetails(
        platform="djinni",
        external_id=external_id,
        url=urljoin(_BASE_URL, url),
        title=str(posting.get("title") or "").strip(),
        company=str(organization.get("name") or "").strip(),
        company_logo_url=_attribute(logo, "src"),
        location=location,
        remote=str(posting.get("jobLocationType") or "").upper() == "TELECOMMUTE",
        employment=_employment(posting.get("employmentType")),
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=salary_currency,
        tags=tags,
        snippet=_collapse(plain_description)[:500],
        posted_at=_parse_datetime(posting.get("datePosted")),
        raw=posting,
        description_text=(
            html_to_text(description_html)
            if description_html
            else content_to_text(plain_description)
        ),
        description_html=description_html,
        experience_years=_years(months),
        english_level=_english_level(soup),
    )


def _parse_card(card: Tag, posting: dict[str, Any]) -> VacancySummary:
    """Parse one listing card and its matching JSON-LD payload."""
    external_id = _card_id(card)
    link = card.select_one("a.job_item__header-link")
    href = _attribute(link, "href")
    title = _text(card.select_one("h2.job-item__position"))
    if not external_id or not href or not title:
        raise ParseError("Djinni returned a malformed vacancy card.")

    meta = [_text(node) for node in card.select("div.fw-medium span.text-nowrap")]
    remote = any("віддалено" in value.casefold() for value in meta)
    tags = _tags(posting)
    location = _card_location(meta, tags)
    salary_text = _text(card.select_one("header div.col-auto div.fs-5"))
    salary_min, salary_max, salary_currency = _salary(posting, salary_text)
    organization = _mapping(posting.get("hiringOrganization"))
    snippet = _text(card.select_one(".js-truncated-text"))
    logo = card.select_one("img.userpic-image")
    return VacancySummary(
        platform="djinni",
        external_id=external_id,
        url=urljoin(_BASE_URL, urlparse(href).path),
        title=title,
        company=_text(card.select_one("span.small.text-gray-800"))
        or str(organization.get("name") or ""),
        company_logo_url=_attribute(logo, "src"),
        location=location or _posting_location(posting),
        remote=remote or str(posting.get("jobLocationType") or "").upper() == "TELECOMMUTE",
        employment=_employment(posting.get("employmentType")),
        salary_min=salary_min,
        salary_max=salary_max,
        salary_currency=salary_currency,
        tags=tags,
        snippet=_collapse(snippet),
        posted_at=_parse_datetime(posting.get("datePosted")),
        raw=posting,
    )


def _job_postings(soup: BeautifulSoup) -> list[dict[str, Any]]:
    """Extract JobPosting objects from all JSON-LD scripts on a page."""
    postings: list[dict[str, Any]] = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            payload: Any = json.loads(script.get_text())
        except json.JSONDecodeError:
            continue
        values: list[Any] = cast(list[Any], payload) if isinstance(payload, list) else [payload]
        for value in values:
            if not isinstance(value, dict):
                continue
            posting = cast(dict[str, Any], value)
            if posting.get("@type") == "JobPosting":
                postings.append(posting)
    return postings


def _salary(posting: dict[str, Any], visible: str) -> tuple[int | None, int | None, str | None]:
    """Extract an absolute salary from JSON-LD or visible card text."""
    base = _mapping(posting.get("baseSalary"))
    value = base.get("value")
    currency = str(base.get("currency") or "") or None
    if isinstance(value, dict):
        salary_value = cast(dict[str, Any], value)
        salary_min = _integer(salary_value.get("minValue"))
        salary_max = _integer(salary_value.get("maxValue"))
        if salary_min is not None or salary_max is not None:
            return salary_min, salary_max, currency or "USD"
    exact = _integer(value)
    if exact is not None:
        return exact, exact, currency or "USD"

    if "$" not in visible or not re.search(r"\d", visible):
        return None, None, None
    amounts = [_integer(match.group()) for match in _NUMBER.finditer(visible)]
    numbers = [amount for amount in amounts if amount is not None]
    if not numbers:
        return None, None, None
    if len(numbers) > 1:
        return min(numbers), max(numbers), "USD"
    if "до" in visible.casefold() or "up to" in visible.casefold():
        return None, numbers[0], "USD"
    if "від" in visible.casefold() or "from" in visible.casefold():
        return numbers[0], None, "USD"
    return numbers[0], numbers[0], "USD"


def _posting_location(posting: dict[str, Any]) -> str:
    """Extract a readable location from JobPosting location objects."""
    if str(posting.get("jobLocationType") or "").upper() == "TELECOMMUTE":
        requirements = _mapping(posting.get("applicantLocationRequirements"))
        address = _mapping(requirements.get("address"))
    else:
        location: Any = posting.get("jobLocation")
        if isinstance(location, list):
            locations = cast(list[Any], location)
            location = locations[0] if locations else cast(dict[str, Any], {})
        address = _mapping(_mapping(location).get("address"))
    parts: list[str] = []
    for key in ("addressLocality", "addressRegion", "addressCountry"):
        value = address.get(key)
        values: list[Any] = cast(list[Any], value) if isinstance(value, list) else [value]
        parts.extend(str(item).strip() for item in values if item)
    return ", ".join(dict.fromkeys(parts))


def _card_location(meta: list[str], tags: list[str]) -> str:
    """Return the location item from a listing card metadata row."""
    folded_tags = {tag.casefold() for tag in tags}
    for value in meta:
        folded = value.casefold()
        if (
            not value
            or folded in folded_tags
            or "віддалено" in folded
            or "досвід" in folded
            or "англійська" in folded
        ):
            continue
        return value
    return ""


def _tags(posting: dict[str, Any]) -> list[str]:
    """Return unique category and industry tags from JobPosting data."""
    values = [posting.get("category"), posting.get("industry")]
    tags = [str(value).strip() for value in values if value]
    return list(dict.fromkeys(tags))


def _english_level(soup: BeautifulSoup) -> str:
    """Extract the required English level from the vacancy page."""
    primary = soup.select_one(".csc--language .csc__primary")
    secondary = soup.select_one(".csc--language .csc__secondary")
    if primary and secondary and "англійська" in _text(primary).casefold():
        return _text(secondary)
    text = soup.get_text(" ", strip=True)
    match = re.search(r"Англійська\s+([A-C][12](?:\s*[–-][^·|]+)?)", text)
    return match.group(1).strip() if match else ""


def _employment(value: Any) -> str:
    """Format schema.org employment types as readable labels."""
    values = cast(list[Any], value) if isinstance(value, list) else [value]
    labels = [
        _EMPLOYMENT_TYPES.get(str(item).upper(), str(item).replace("_", " ").title())
        for item in values
        if item
    ]
    return ", ".join(dict.fromkeys(labels))


def _has_next_page(soup: BeautifulSoup, page: int) -> bool:
    """Return whether pagination includes a page after the current one."""
    for link in soup.select(".pagination a[href]"):
        href = _attribute(link, "href") or ""
        match = _PAGE.search(href)
        if match and int(match.group(1)) > page:
            return True
    return False


def _card_id(card: Tag) -> str:
    """Extract a vacancy id from a listing card."""
    value = str(card.get("id") or "")
    return value.removeprefix("job-item-") if value.startswith("job-item-") else ""


def _attribute(node: Tag | None, name: str) -> str | None:
    """Return one string-valued HTML attribute."""
    if node is None:
        return None
    value = node.get(name)
    return value if isinstance(value, str) and value else None


def _text(node: Tag | None) -> str:
    """Return normalized text from an HTML element."""
    return _collapse(node.get_text(" ", strip=True)) if node else ""


def _collapse(value: str) -> str:
    """Collapse whitespace runs into single spaces."""
    return " ".join(value.split())


def _mapping(value: Any) -> dict[str, Any]:
    """Return a typed mapping for a JSON object."""
    return cast(dict[str, Any], value) if isinstance(value, dict) else {}


def _number(value: Any) -> float | None:
    """Return a numeric JSON value as a float."""
    return float(value) if isinstance(value, int | float) else None


def _integer(value: Any) -> int | None:
    """Return a numeric JSON or display value as an integer."""
    if isinstance(value, int | float):
        return int(value)
    if not isinstance(value, str):
        return None
    digits = re.sub(r"[^\d]", "", value)
    return int(digits) if digits else None


def _years(months: float | None) -> str:
    """Format a month count as a compact number of years."""
    if months is None:
        return ""
    years = months / 12
    value = str(int(years)) if years.is_integer() else f"{years:g}"
    return f"{value} years"


def _parse_datetime(value: Any) -> datetime | None:
    """Parse an ISO datetime value, returning None on failure."""
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None
