from fastapi import APIRouter, Response
from fastapi.responses import PlainTextResponse

router = APIRouter(prefix="/api")


@router.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    description="Simple liveness probe that returns `OK` as plain text.",
    responses={
        200: {"content": {"text/plain": {"example": "OK"}}, "description": "Service is alive."}
    },
)
async def health_check() -> Response:
    """Return a plain text liveness response."""
    return PlainTextResponse("OK")
