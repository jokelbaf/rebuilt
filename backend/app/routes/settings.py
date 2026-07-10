from fastapi import APIRouter
from fastapi.responses import JSONResponse
from responses import ok
from schemas.settings import AiSettingsUpdate
from services import settings as settings_service

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/ai")
async def get_ai_settings() -> JSONResponse:
    """Return the persisted AI provider setting and available choices."""
    return ok(await settings_service.get_ai_settings())


@router.patch("/ai")
async def update_ai_settings(payload: AiSettingsUpdate) -> JSONResponse:
    """Persist and activate the selected AI provider."""
    return ok(await settings_service.update_ai_provider(payload.provider))
