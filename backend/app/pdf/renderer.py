import asyncio
import pathlib
from typing import Any

import weasyprint


def _render_sync(html: str, destination: pathlib.Path) -> None:
    """Render HTML to a PDF file synchronously."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    document: Any = weasyprint.HTML(string=html)
    document.write_pdf(str(destination))


async def render_pdf(html: str, destination: pathlib.Path) -> None:
    """Render an HTML string to a PDF file off the event loop."""
    await asyncio.to_thread(_render_sync, html, destination)
