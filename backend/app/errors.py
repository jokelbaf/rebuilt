from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from loguru import logger
from responses import envelope
from starlette.exceptions import HTTPException
from starlette.responses import Response


class APIError(Exception):
    """Base application error carrying an HTTP status code and a client message."""

    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class BadRequestError(APIError):
    """The request was malformed or semantically invalid."""

    status_code = status.HTTP_400_BAD_REQUEST


class NotFoundError(APIError):
    """The requested resource does not exist."""

    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(APIError):
    """The request conflicts with the current state of a resource."""

    status_code = status.HTTP_409_CONFLICT


class UpstreamError(APIError):
    """An external dependency (AI, git host, job board) failed."""

    status_code = status.HTTP_502_BAD_GATEWAY


def register_error_handlers(app: FastAPI) -> None:
    """Register the standard envelope error handlers on the application."""

    @app.exception_handler(APIError)
    async def _api_error(_: Request, exc: APIError) -> Response:
        return envelope(message=exc.message, status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, __: RequestValidationError) -> Response:
        return envelope(
            message="The request payload is invalid.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    @app.exception_handler(HTTPException)
    async def _http_error(_: Request, exc: HTTPException) -> Response:
        return envelope(message=str(exc.detail), status_code=exc.status_code)

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> Response:
        logger.exception("Unhandled error: {}", exc)
        return envelope(
            message="An unexpected error occurred.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
