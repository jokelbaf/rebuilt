import contextlib
import os
from collections.abc import AsyncGenerator

from starlette.applications import Starlette

from .tools import mcp


def build_http_app() -> Starlette:
    """Build the streamable-HTTP ASGI app exposing the app's MCP tools."""
    return mcp.streamable_http_app()


@contextlib.asynccontextmanager
async def run_session_manager() -> AsyncGenerator[None]:
    """Run the MCP session manager for the lifetime of the application."""
    async with mcp.session_manager.run():
        yield


def get_mcp_url() -> str:
    """Return the URL where the app's own MCP server is reachable."""
    port = os.getenv("PORT", "8000")
    return f"http://127.0.0.1:{port}/mcp/"
