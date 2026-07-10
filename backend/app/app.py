# ruff: noqa: E402
import dotenv

dotenv.load_dotenv()

import contextlib
import logging
import os

import uvicorn
from ai import mcp as ai_mcp
from constants import IS_DEV, IS_PROD, STATIC_DIR
from errors import register_error_handlers
from fastapi import FastAPI
from loguru import logger
from modules import db
from routes import (
    backup,
    chat,
    cover_letter,
    files,
    git,
    health,
    library,
    projects,
    resume,
    settings,
    templates,
    vacancies,
)
from services import settings as settings_service

for name in list(logging.root.manager.loggerDict.keys()):
    logging.getLogger(name).handlers.clear()
    logging.getLogger(name).propagate = True


class InterceptHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_back and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


logging.basicConfig(handlers=[InterceptHandler()], level=logging.INFO)

loggers = (
    "uvicorn",
    "uvicorn.access",
    "uvicorn.error",
    "fastapi",
    "asyncio",
    "starlette",
    "sqlalchemy.engine",
)

for logger_name in loggers:
    logging_logger = logging.getLogger(logger_name)
    logging_logger.handlers = []
    logging_logger.propagate = True


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager."""
    await db.init(app)
    await settings_service.initialize_ai_provider()

    async with ai_mcp.run_session_manager():
        yield

    await db.shutdown()


app = FastAPI(
    title="Rebuilt API Documentation",
    description="AI-powered resume builder.",
    lifespan=lifespan,
    docs_url="/docs" if IS_DEV else None,
    redoc_url=None,
)

register_error_handlers(app)

app.include_router(health.router)
app.include_router(vacancies.router)
app.include_router(templates.router)
app.include_router(projects.router)
app.include_router(resume.router)
app.include_router(cover_letter.router)
app.include_router(library.router)
app.include_router(git.router)
app.include_router(chat.router)
app.include_router(settings.router)
app.include_router(backup.router)
for files_router in files.routers:
    app.include_router(files_router)

app.mount("/mcp", ai_mcp.build_http_app())

if IS_PROD and STATIC_DIR.is_dir():
    app.frontend("/", directory=STATIC_DIR)
elif IS_PROD:
    logger.warning("Static directory {} not found; the frontend will not be served.", STATIC_DIR)


if __name__ == "__main__":
    uvicorn.run(
        # Reload needs an import string; when compiled the main module is `__main__`,
        # so pass the app object directly to avoid re-importing/re-running the module.
        "app:app" if IS_DEV else app,
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=IS_DEV,
        log_config=None,
        log_level=None,
        proxy_headers=True,
        server_header=False,
    )
