import re

from bs4 import BeautifulSoup, Comment, Doctype, Tag
from bs4.element import NavigableString, PageElement

_HTML_TAG = re.compile(r"<[a-zA-Z][^>]*>")
_LIST_INDENT = "  "
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


def content_to_text(content: str) -> str:
    """Convert a body that may be HTML or newline-formatted plain text into readable text."""
    if _HTML_TAG.search(content):
        return html_to_text(content)
    lines = [line.strip() for line in content.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


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
