import uuid
from collections.abc import AsyncIterator
from typing import Annotated

import httpx
from crud import discovered_vacancies as discovered_crud
from crud import discovery_events as events_crud
from crud import discovery_runs as runs_crud
from crud import platform_accounts as accounts_crud
from crud import search_queries as queries_crud
from errors import BadRequestError, ConflictError, NotFoundError, UpstreamError
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from fastapi.sse import EventSourceResponse, format_sse_event
from jobboards import CLIENTS, JobBoardError, SessionState, get_client
from models import DiscoveredVacancy, PlatformAccount, SearchQuery
from models.base import utcnow
from notifications.telegram import NotificationDeliveryError, TelegramNotifier
from responses import ok
from schemas.discovery import (
    DiscoveredVacancyApproval,
    DiscoveredVacancyCount,
    DiscoveredVacancyDetail,
    DiscoveredVacancyDismiss,
    DiscoveredVacancyPublic,
    DiscoveryEventPublic,
    DiscoveryExchangeRates,
    DiscoveryNotificationSettings,
    DiscoveryNotificationTest,
    DiscoveryRunPublic,
    DiscoverySettings,
    PlatformAccountPublic,
    PlatformAccountUpsert,
    SearchQueryCreate,
    SearchQueryPublic,
    SearchQueryUpdate,
)
from services.discovery import currency, promote, runner
from services.discovery import events as discovery_events
from services.discovery import settings as discovery_settings

router = APIRouter(prefix="/api/discovery", tags=["Discovery"])


def _account_public(account: PlatformAccount) -> PlatformAccountPublic:
    """Build a credential-safe public platform account schema."""
    return PlatformAccountPublic(
        id=account.id,
        platform=account.platform,
        email=account.email,
        has_password=bool(account.password),
        status=account.status,
        last_verified_at=account.last_verified_at,
        created_at=account.created_at,
    )


def _validate_platform(platform: str) -> str:
    """Return a normalized registered platform or raise a client error."""
    normalized = platform.strip().lower()
    if normalized not in CLIENTS:
        raise BadRequestError("Unknown job-board platform.")
    return normalized


def _validate_query_platforms(platforms: list[str]) -> list[str]:
    """Normalize and validate a non-empty platform selection."""
    normalized = list(dict.fromkeys(_validate_platform(item) for item in platforms))
    if not normalized:
        raise BadRequestError("Select at least one job-board platform.")
    return normalized


def _salary_conversion(
    vacancy: DiscoveredVacancyPublic,
    preferred_currency: str,
) -> dict[str, int | str | None]:
    """Build converted salary fields for a public discovered vacancy."""
    source = vacancy.salary_currency
    if not source or source == preferred_currency:
        return {}
    minimum = (
        currency.convert(vacancy.salary_min, source, preferred_currency)
        if vacancy.salary_min is not None
        else None
    )
    maximum = (
        currency.convert(vacancy.salary_max, source, preferred_currency)
        if vacancy.salary_max is not None
        else None
    )
    if minimum is None and maximum is None:
        return {}
    return {
        "converted_salary_min": minimum,
        "converted_salary_max": maximum,
        "converted_salary_currency": preferred_currency,
    }


def _vacancy_public_with_currency(
    vacancy: DiscoveredVacancy, preferred_currency: str
) -> DiscoveredVacancyPublic:
    """Build a discovered vacancy using an explicit display currency."""
    public = DiscoveredVacancyPublic.model_validate(vacancy)
    return public.model_copy(update=_salary_conversion(public, preferred_currency))


async def _vacancy_public(vacancy: DiscoveredVacancy) -> DiscoveredVacancyPublic:
    """Build a discovered vacancy with display-currency salary values."""
    settings = await discovery_settings.get_settings()
    return _vacancy_public_with_currency(vacancy, settings.preferred_currency)


async def _vacancy_detail(vacancy: DiscoveredVacancy) -> DiscoveredVacancyDetail:
    """Build discovered vacancy details with display-currency salary values."""
    detail = DiscoveredVacancyDetail.model_validate(vacancy)
    settings = await discovery_settings.get_settings()
    return detail.model_copy(update=_salary_conversion(detail, settings.preferred_currency))


@router.get("/settings")
async def get_settings() -> JSONResponse:
    """Return global vacancy discovery settings."""
    return ok(await discovery_settings.get_settings())


@router.put("/settings")
async def update_settings(payload: DiscoverySettings) -> JSONResponse:
    """Replace global vacancy discovery settings."""
    return ok(await discovery_settings.save_settings(payload))


@router.post("/notifications/telegram/test")
async def test_telegram_notification(
    payload: DiscoveryNotificationSettings,
) -> JSONResponse:
    """Send a test message using the supplied Telegram configuration."""
    if not payload.telegram_bot_token.strip() or not payload.telegram_chat_id.strip():
        raise BadRequestError("Telegram bot token and chat ID are required.")
    try:
        notifier = TelegramNotifier(payload.telegram_bot_token, payload.telegram_chat_id)
        await notifier.send_test()
    except NotificationDeliveryError as exc:
        raise UpstreamError(str(exc)) from exc
    return ok(DiscoveryNotificationTest(channel="telegram", delivered=True))


@router.get("/exchange-rates")
async def get_exchange_rates() -> JSONResponse:
    """Return cached exchange-rate freshness without exposing stored values."""
    rates = await currency.load_rates()
    return ok(
        DiscoveryExchangeRates(
            base=rates.base if rates else "USD",
            currencies=sorted(rates.rates) if rates else [],
            fetched_at=rates.fetched_at if rates else None,
        )
    )


@router.get("/accounts")
async def list_accounts() -> JSONResponse:
    """List configured job-board accounts without secrets."""
    accounts = await accounts_crud.list_all()
    return ok([_account_public(account) for account in accounts])


@router.post("/accounts")
async def upsert_account(payload: PlatformAccountUpsert) -> JSONResponse:
    """Create or replace credentials for a job-board account."""
    platform = _validate_platform(payload.platform)
    if not payload.email.strip() or not payload.password:
        raise BadRequestError("Email and password are required.")
    account = await accounts_crud.upsert(platform, payload.email.strip(), payload.password)
    return ok(_account_public(account))


@router.delete("/accounts/{platform}")
async def delete_account(platform: str) -> JSONResponse:
    """Delete a configured job-board account."""
    platform = _validate_platform(platform)
    if not await accounts_crud.delete(platform):
        raise NotFoundError("Platform account not found.")
    return ok()


@router.post("/accounts/{platform}/verify")
async def verify_account(platform: str) -> JSONResponse:
    """Authenticate a platform account and persist its fresh session state."""
    platform = _validate_platform(platform)
    account = await accounts_crud.get(platform)
    if not account:
        raise NotFoundError("Platform account not found.")
    try:
        async with get_client(platform) as client:
            session = await client.authenticate(account.email, account.password)
            verified = await client.verify(session)
    except (JobBoardError, httpx.HTTPError) as exc:
        await accounts_crud.update(
            platform, {"status": "failed", "session_state": None, "last_verified_at": utcnow()}
        )
        raise UpstreamError(str(exc)) from exc
    if not verified:
        await accounts_crud.update(
            platform, {"status": "failed", "session_state": None, "last_verified_at": utcnow()}
        )
        raise UpstreamError(f"{platform} did not accept the authenticated session.")
    updated = await accounts_crud.update(
        platform,
        {
            "status": "ok",
            "session_state": session.model_dump(mode="json"),
            "last_verified_at": utcnow(),
        },
    )
    if not updated:
        raise NotFoundError("Platform account not found.")
    SessionState.model_validate(updated.session_state)
    return ok(_account_public(updated))


@router.get("/queries")
async def list_queries() -> JSONResponse:
    """List all configured discovery search queries."""
    queries = await queries_crud.list_all()
    return ok([SearchQueryPublic.model_validate(query) for query in queries])


@router.post("/queries")
async def create_query(payload: SearchQueryCreate) -> JSONResponse:
    """Create a discovery search query."""
    if not payload.name.strip():
        raise BadRequestError("Search query name is required.")
    data = payload.model_dump()
    data["name"] = payload.name.strip()
    data["platforms"] = _validate_query_platforms(payload.platforms)
    query = await queries_crud.create(SearchQuery(**data))
    return ok(SearchQueryPublic.model_validate(query))


@router.patch("/queries/{query_id}")
async def update_query(query_id: uuid.UUID, payload: SearchQueryUpdate) -> JSONResponse:
    """Partially update a discovery search query."""
    existing = await queries_crud.get(query_id)
    if not existing:
        raise NotFoundError("Search query not found.")
    data = payload.model_dump(exclude_unset=True)
    required = {
        "name",
        "enabled",
        "platforms",
        "wishes",
        "seniority",
        "remote_only",
        "location",
        "english_level",
    }
    if any(key in data and data[key] is None for key in required):
        raise BadRequestError("Required search-query fields cannot be null.")
    if "name" in data:
        name = str(data["name"]).strip()
        if not name:
            raise BadRequestError("Search query name is required.")
        data["name"] = name
    if "platforms" in data:
        data["platforms"] = _validate_query_platforms(payload.platforms or [])
    merged = SearchQueryCreate.model_validate(existing).model_dump()
    merged.update(data)
    SearchQueryCreate.model_validate(merged)
    query = await queries_crud.update(query_id, data)
    if not query:
        raise NotFoundError("Search query not found.")
    return ok(SearchQueryPublic.model_validate(query))


@router.delete("/queries/{query_id}")
async def delete_query(query_id: uuid.UUID) -> JSONResponse:
    """Delete a discovery search query."""
    if not await queries_crud.delete(query_id):
        raise NotFoundError("Search query not found.")
    return ok()


@router.post("/runs")
async def start_run() -> JSONResponse:
    """Start a manual discovery run in the background."""
    run = await runner.start_discovery("manual")
    return ok(DiscoveryRunPublic.model_validate(run))


@router.get("/runs")
async def list_runs(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> JSONResponse:
    """List recent discovery runs, newest first."""
    runs = await runs_crud.list_all(limit)
    return ok([DiscoveryRunPublic.model_validate(run) for run in runs])


@router.get("/runs/{run_id}")
async def get_run(run_id: uuid.UUID) -> JSONResponse:
    """Return one discovery run."""
    run = await runs_crud.get(run_id)
    if not run:
        raise NotFoundError("Discovery run not found.")
    return ok(DiscoveryRunPublic.model_validate(run))


@router.get("/runs/{run_id}/events")
async def list_run_events(
    run_id: uuid.UUID,
    before: Annotated[int | None, Query(ge=1)] = None,
    limit: Annotated[int, Query(ge=1, le=250)] = 100,
) -> JSONResponse:
    """Return a newest-first page of persisted events for a discovery run."""
    if not await runs_crud.get(run_id):
        raise NotFoundError("Discovery run not found.")
    items = await events_crud.list_for_run(run_id, before_id=before, limit=limit)
    return ok([DiscoveryEventPublic.model_validate(item) for item in items])


@router.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: uuid.UUID) -> JSONResponse:
    """Cancel an active discovery run."""
    if not await runs_crud.get(run_id):
        raise NotFoundError("Discovery run not found.")
    run = await runner.cancel_discovery(run_id)
    return ok(DiscoveryRunPublic.model_validate(run))


@router.delete("/runs/{run_id}")
async def delete_run(run_id: uuid.UUID) -> JSONResponse:
    """Delete a finished discovery run from activity history."""
    run = await runs_crud.get(run_id)
    if not run:
        raise NotFoundError("Discovery run not found.")
    if run.status == "running":
        raise ConflictError("An active discovery run cannot be deleted.")
    if not await runs_crud.delete_run(run_id):
        raise NotFoundError("Discovery run not found.")
    return ok()


@router.get("/vacancies")
async def list_discovered_vacancies(
    status: Annotated[str | None, Query()] = None,
    platform: Annotated[str | None, Query()] = None,
    min_score: Annotated[int | None, Query(alias="minScore", ge=0, le=100)] = None,
    query: Annotated[str | None, Query(alias="q")] = None,
) -> JSONResponse:
    """List discovered vacancies matching inbox filters."""
    if status and status not in {"new", "approved", "dismissed"}:
        raise BadRequestError("Unknown discovered-vacancy status.")
    normalized_platform = _validate_platform(platform) if platform else None
    vacancies = await discovered_crud.list_all(
        status=status,
        platform=normalized_platform,
        min_score=min_score,
        query=query,
    )
    settings = await discovery_settings.get_settings()
    return ok(
        [_vacancy_public_with_currency(item, settings.preferred_currency) for item in vacancies]
    )


@router.get("/vacancies/count")
async def count_discovered_vacancies(
    status: Annotated[str | None, Query()] = None,
) -> JSONResponse:
    """Count discovered vacancies matching an optional inbox status."""
    if status and status not in {"new", "approved", "dismissed"}:
        raise BadRequestError("Unknown discovered-vacancy status.")
    return ok(DiscoveredVacancyCount(count=await discovered_crud.count(status=status)))


@router.get("/vacancies/{discovered_id}")
async def get_discovered_vacancy(discovered_id: uuid.UUID) -> JSONResponse:
    """Return full details for one discovered vacancy."""
    vacancy = await discovered_crud.get(discovered_id)
    if not vacancy:
        raise NotFoundError("Discovered vacancy not found.")
    return ok(await _vacancy_detail(vacancy))


@router.post("/vacancies/{discovered_id}/approve")
async def approve_discovered_vacancy(discovered_id: uuid.UUID) -> JSONResponse:
    """Promote a discovered vacancy into the stored vacancy library."""
    vacancy = await promote.approve(discovered_id)
    return ok(DiscoveredVacancyApproval(vacancy_id=vacancy.id))


@router.post("/vacancies/{discovered_id}/dismiss")
async def dismiss_discovered_vacancy(
    discovered_id: uuid.UUID,
    payload: DiscoveredVacancyDismiss | None = None,
) -> JSONResponse:
    """Dismiss a discovered vacancy with an optional reason."""
    await promote.dismiss(discovered_id, payload.reason if payload else "")
    vacancy = await discovered_crud.get(discovered_id)
    if not vacancy:
        raise NotFoundError("Discovered vacancy not found.")
    return ok(await _vacancy_public(vacancy))


@router.post("/vacancies/{discovered_id}/restore")
async def restore_discovered_vacancy(discovered_id: uuid.UUID) -> JSONResponse:
    """Restore a dismissed vacancy to the discovery inbox."""
    await promote.restore(discovered_id)
    vacancy = await discovered_crud.get(discovered_id)
    if not vacancy:
        raise NotFoundError("Discovered vacancy not found.")
    return ok(await _vacancy_public(vacancy))


@router.get("/stream")
async def stream_discovery() -> EventSourceResponse:
    """Stream live discovery events and run status changes as SSE."""
    return EventSourceResponse(
        _to_sse(discovery_events.subscribe()),
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _to_sse(
    stream: AsyncIterator[discovery_events.DiscoveryStreamItem],
) -> AsyncIterator[bytes]:
    """Encode discovery stream payloads into named SSE wire-format events."""
    async for item in stream:
        yield format_sse_event(
            data_str=item.data.model_dump_json(by_alias=True),
            event=item.event,
        )
