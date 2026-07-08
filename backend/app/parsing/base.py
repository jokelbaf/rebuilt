import abc
import dataclasses
import json
import re
from typing import Any, cast

import httpx
from bs4 import BeautifulSoup, Comment, Doctype, Tag
from bs4.element import NavigableString, PageElement

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9,uk;q=0.8",
}


@dataclasses.dataclass
class ParsedVacancy:
    """The structured result of parsing a job posting."""

    title: str
    description: str
    language: str = ""


class VacancyParser(abc.ABC):
    """Base class for job-board specific vacancy parsers."""

    hosts: tuple[str, ...] = ()

    def matches(self, host: str) -> bool:
        """Return whether this parser handles the given hostname."""
        host = host.lower().removeprefix("www.")
        return any(host == h or host.endswith(f".{h}") for h in self.hosts)

    @abc.abstractmethod
    async def parse(self, url: str, client: httpx.AsyncClient) -> ParsedVacancy:
        """Parse the vacancy at the given URL into a ParsedVacancy."""


async def fetch_html(client: httpx.AsyncClient, url: str) -> str:
    """Fetch a page and return its HTML, raising on HTTP errors."""
    response = await client.get(url, headers=DEFAULT_HEADERS, follow_redirects=True)
    response.raise_for_status()
    return response.text


_HTML_TAG = re.compile(r"<[a-zA-Z][^>]*>")

_BLOCK_TAGS = {
    "address",
    "article",
    "aside",
    "blockquote",
    "dd",
    "div",
    "dl",
    "dt",
    "figure",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "main",
    "p",
    "pre",
    "section",
    "table",
    "tr",
}
_SKIPPED_TAGS = {"script", "style", "noscript", "template", "head", "iframe", "svg"}
_LIST_INDENT = "  "


def content_to_text(content: str) -> str:
    """Convert a body that may be HTML or newline-formatted plain text into readable text."""
    if _HTML_TAG.search(content):
        return html_to_text(content)
    lines = [line.strip() for line in content.splitlines()]
    text = re.sub(r"\n{3,}", "\n\n", "\n".join(lines))
    return text.strip()


def html_to_text(html: str) -> str:
    """Convert an HTML fragment to readable plain text with paragraphs and lists."""
    soup = BeautifulSoup(html, "lxml")
    text = _render_children(soup)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _render_children(element: Tag) -> str:
    """Render the children of an element into plain text."""
    return "".join(_render_node(child) for child in element.children)


def _render_node(node: PageElement) -> str:
    """Render a single DOM node into plain text."""
    if isinstance(node, Comment | Doctype):
        return ""
    if isinstance(node, NavigableString):
        return re.sub(r"\s+", " ", str(node))
    if not isinstance(node, Tag):
        return ""

    name = (node.name or "").lower()
    if name in _SKIPPED_TAGS:
        return ""
    if name == "br":
        return "\n"
    if name in {"ul", "ol"}:
        rendered = _render_list(node)
        return f"\n\n{rendered}\n\n" if rendered else ""
    if name in _BLOCK_TAGS:
        inner = _tidy_lines(_render_children(node))
        return f"\n\n{inner}\n\n" if inner else ""
    return _render_children(node)


def _render_list(element: Tag) -> str:
    """Render a list element into marker-prefixed lines, indenting nested lists."""
    ordered = (element.name or "").lower() == "ol"
    lines: list[str] = []
    index = 1
    for item in element.find_all("li", recursive=False):
        marker = f"{index}." if ordered else "-"
        index += 1
        body = re.sub(r"\n{2,}", "\n", _tidy_lines(_render_children(item)))
        item_lines = body.split("\n") if body else [""]
        lines.append(f"{marker} {item_lines[0]}".rstrip())
        lines.extend(f"{_LIST_INDENT}{line}".rstrip() for line in item_lines[1:])
    return "\n".join(lines)


def _tidy_lines(text: str) -> str:
    """Trim stray single spaces after line breaks and surrounding whitespace."""
    return re.sub(r"\n (?=\S)", "\n", text).strip()


def extract_jsonld_jobposting(html: str) -> dict[str, Any] | None:
    """Return the first schema.org JobPosting JSON-LD object found in the HTML."""
    soup = BeautifulSoup(html, "lxml")
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        try:
            data: Any = json.loads(raw)
        except json.JSONDecodeError, TypeError:
            continue
        items: list[Any] = cast("list[Any]", data) if isinstance(data, list) else [data]
        for item in items:
            if isinstance(item, dict):
                entry = cast(dict[str, Any], item)
                if entry.get("@type") == "JobPosting":
                    return entry
    return None
