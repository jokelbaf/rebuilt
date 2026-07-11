import asyncio
import contextlib
import time
import uuid
from collections import defaultdict
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, TypedDict, cast

import httpx
from crud import discovered_vacancies as discovered_crud
from crud import discovery_runs as runs_crud
from crud import platform_accounts as accounts_crud
from crud import search_queries as queries_crud
from errors import ConflictError
from jobboards import (
    AuthRequiredError,
    JobBoardClient,
    JobBoardError,
    SearchFilters,
    SearchPage,
    SessionState,
    VacancyDetails,
    VacancySummary,
    get_client,
)
from loguru import logger
from models import DiscoveredVacancy, DiscoveryRun, PlatformAccount, SearchQuery
from models.base import utcnow
from notifications.service import notify_new_vacancies
from schemas.discovery import DiscoverySettings

from . import events
from .currency import convert
from .events import emit
from .scoring import ProfileSignals, ScoredItem, ai_score, build_user_summary, prescore
from .settings import get_settings

_PRESCORE_THRESHOLD = 1
_MAX_DETAIL_CANDIDATES = 30
_PLATFORM_CURRENCIES = {"robota": "UAH", "djinni": "USD"}
_PLATFORM_URLS = {
    "robota": "https://dracula.robota.ua/",
    "djinni": "https://djinni.co/jobs/",
}
_lock = asyncio.Lock()
_launch_lock = asyncio.Lock()
_task: asyncio.Task[DiscoveryRun] | None = None
_active_run_id: uuid.UUID | None = None


class PlatformStats(TypedDict):
    """Mutable per-platform counters persisted with a discovery run."""

    requests: int
    found: int
    new: int
    scored: int
    errors: int


@dataclass(frozen=True, slots=True)
class Candidate:
    """A deduplicated vacancy summary associated with its originating search query."""

    summary: VacancySummary
    query: SearchQuery
    prescore: int


def is_running() -> bool:
    """Return whether an in-process discovery execution currently owns the runner lock."""
    return (_task is not None and not _task.done()) or _lock.locked()


def active_run_id() -> uuid.UUID | None:
    """Return the id of the process-local active discovery run."""
    return _active_run_id


def _consume_task_result(task: asyncio.Task[DiscoveryRun]) -> None:
    """Retrieve a detached discovery task result to avoid unhandled task warnings."""
    if not task.cancelled():
        task.exception()


def _stats_for(stats: dict[str, PlatformStats], platform: str) -> PlatformStats:
    """Return existing platform counters or initialize them."""
    if platform not in stats:
        stats[platform] = PlatformStats(requests=0, found=0, new=0, scored=0, errors=0)
    return stats[platform]


async def _persist_stats(run_id: uuid.UUID, stats: dict[str, PlatformStats]) -> None:
    """Persist a snapshot of mutable run counters."""
    await runs_crud.update(run_id, {"stats": cast(dict[str, Any], stats)})


async def _request[T](
    run_id: uuid.UUID,
    platform: str,
    operation: str,
    stats: dict[str, PlatformStats],
    action: Callable[[], Awaitable[T]],
    *,
    data: dict[str, Any] | None = None,
) -> T:
    """Execute and audit one external job-board client operation."""
    started = time.monotonic()
    _stats_for(stats, platform)["requests"] += 1
    try:
        result = await action()
    except Exception:
        _stats_for(stats, platform)["errors"] += 1
        raise
    duration = round((time.monotonic() - started) * 1000)
    await emit(
        run_id,
        "info",
        "request",
        f"{platform}: completed {operation} request.",
        {
            "platform": platform,
            "operation": operation,
            "url": _PLATFORM_URLS.get(platform, ""),
            "durationMs": duration,
            **(data or {}),
        },
    )
    return result


async def _authenticate(
    run_id: uuid.UUID,
    account: PlatformAccount,
    client: JobBoardClient,
    stats: dict[str, PlatformStats],
) -> SessionState:
    """Authenticate and persist a fresh session for a platform account."""
    try:
        session = await _request(
            run_id,
            account.platform,
            "authenticate",
            stats,
            lambda: client.authenticate(account.email, account.password),
        )
    except JobBoardError, httpx.HTTPError:
        await accounts_crud.update(
            account.platform,
            {"status": "failed", "session_state": None, "last_verified_at": utcnow()},
        )
        raise
    await accounts_crud.update(
        account.platform,
        {
            "status": "ok",
            "session_state": session.model_dump(mode="json"),
            "last_verified_at": utcnow(),
        },
    )
    return session


async def _search(
    run_id: uuid.UUID,
    client: JobBoardClient,
    account: PlatformAccount,
    session: SessionState,
    filters: SearchFilters,
    stats: dict[str, PlatformStats],
) -> tuple[SearchPage, SessionState]:
    """Search a page, re-authenticating once when the stored session has expired."""

    async def request() -> SearchPage:
        return await client.search(filters, session=session)

    try:
        page = await _request(
            run_id,
            account.platform,
            "search",
            stats,
            request,
            data={"page": filters.page},
        )
        return page, session
    except AuthRequiredError:
        session = await _authenticate(run_id, account, client, stats)
        page = await _request(
            run_id,
            account.platform,
            "search",
            stats,
            lambda: client.search(filters, session=session),
            data={"page": filters.page, "reauthenticated": True},
        )
        return page, session


async def _fetch(
    run_id: uuid.UUID,
    client: JobBoardClient,
    account: PlatformAccount,
    session: SessionState,
    external_id: str,
    stats: dict[str, PlatformStats],
) -> tuple[VacancyDetails, SessionState]:
    """Fetch vacancy details, re-authenticating once when required."""
    try:
        details = await _request(
            run_id,
            account.platform,
            "fetch",
            stats,
            lambda: client.fetch(external_id, session=session),
            data={"externalId": external_id},
        )
        return details, session
    except AuthRequiredError:
        session = await _authenticate(run_id, account, client, stats)
        details = await _request(
            run_id,
            account.platform,
            "fetch",
            stats,
            lambda: client.fetch(external_id, session=session),
            data={"externalId": external_id, "reauthenticated": True},
        )
        return details, session


def _filters(query: SearchQuery, platform: str, page: int) -> SearchFilters:
    """Build platform-native search filters from a persisted query."""
    salary = query.salary_min
    target_currency = _PLATFORM_CURRENCIES.get(platform)
    if salary is not None and query.salary_currency and target_currency:
        salary = convert(salary, query.salary_currency, target_currency)
    return SearchFilters(
        keywords=[query.name],
        salary_min=salary,
        salary_currency=target_currency,
        remote=query.remote_only,
        location=query.location,
        seniority=query.seniority,
        english_level=query.english_level,
        page=page,
    )


async def _collect_candidates(
    run: DiscoveryRun,
    settings: DiscoverySettings,
    profile: ProfileSignals,
    stats: dict[str, PlatformStats],
) -> tuple[list[Candidate], dict[str, PlatformAccount]]:
    """Search every enabled platform-query pair and return never-before-seen summaries."""
    queries = await queries_crud.list_all(enabled_only=True)
    accounts = {account.platform: account for account in await accounts_crud.list_all()}
    candidates: list[Candidate] = []
    seen: set[tuple[str, str]] = set()

    for query in queries:
        for platform in query.platforms:
            platform_stats = _stats_for(stats, platform)
            account = accounts.get(platform)
            if not account or account.status != "ok" or not account.session_state:
                await emit(
                    run.id,
                    "warning",
                    "search",
                    f"Skipped {platform} for “{query.name}”: a verified account is required.",
                    {"platform": platform, "searchQueryId": str(query.id)},
                )
                continue
            try:
                session = SessionState.model_validate(account.session_state)
                async with get_client(platform) as client:
                    for page_number in range(1, settings.max_pages_per_query + 1):
                        page, session = await _search(
                            run.id,
                            client,
                            account,
                            session,
                            _filters(query, platform, page_number),
                            stats,
                        )
                        platform_stats["found"] += len(page.items)
                        for item in page.items:
                            key = (item.platform, item.external_id)
                            if key in seen or await discovered_crud.exists(*key):
                                continue
                            seen.add(key)
                            platform_stats["new"] += 1
                            candidates.append(
                                Candidate(
                                    summary=item,
                                    query=query,
                                    prescore=prescore(item, query, profile),
                                )
                            )
                        await _persist_stats(run.id, stats)
                        if not page.has_next:
                            break
            except (JobBoardError, httpx.HTTPError) as exc:
                await emit(
                    run.id,
                    "error",
                    "search",
                    f"{platform} search failed for “{query.name}”: {exc}",
                    {"platform": platform, "searchQueryId": str(query.id)},
                )
    return candidates, accounts


async def _fetch_details(
    run: DiscoveryRun,
    candidates: list[Candidate],
    accounts: dict[str, PlatformAccount],
    stats: dict[str, PlatformStats],
) -> dict[tuple[str, str], VacancyDetails]:
    """Fetch full details for the highest pre-scoring candidates."""
    eligible = [candidate for candidate in candidates if candidate.prescore >= _PRESCORE_THRESHOLD]
    selected = sorted(eligible, key=lambda item: item.prescore, reverse=True)[
        :_MAX_DETAIL_CANDIDATES
    ]
    grouped: dict[str, list[Candidate]] = defaultdict(list)
    for candidate in selected:
        grouped[candidate.summary.platform].append(candidate)

    details: dict[tuple[str, str], VacancyDetails] = {}
    for platform, items in grouped.items():
        account = accounts[platform]
        session = SessionState.model_validate(account.session_state)
        async with get_client(platform) as client:
            for candidate in items:
                external_id = candidate.summary.external_id
                try:
                    detail, session = await _fetch(
                        run.id, client, account, session, external_id, stats
                    )
                except (JobBoardError, httpx.HTTPError) as exc:
                    await emit(
                        run.id,
                        "warning",
                        "parse",
                        f"{platform}: could not load details for {candidate.summary.title}: {exc}",
                        {"platform": platform, "externalId": external_id},
                    )
                    continue
                details[(platform, external_id)] = detail
                await emit(
                    run.id,
                    "info",
                    "parse",
                    f"{platform}: parsed details for {detail.title}.",
                    {"platform": platform, "externalId": external_id},
                )
    return details


async def _score_details(
    run: DiscoveryRun,
    candidates: list[Candidate],
    details: dict[tuple[str, str], VacancyDetails],
    user_summary: str,
    stats: dict[str, PlatformStats],
) -> tuple[dict[tuple[str, str], ScoredItem], str | None]:
    """AI-score detailed candidates in query-specific groups, reporting any failure reason."""
    grouped: dict[tuple[uuid.UUID, str], list[Candidate]] = defaultdict(list)
    for candidate in candidates:
        if (candidate.summary.platform, candidate.summary.external_id) in details:
            grouped[(candidate.query.id, candidate.summary.platform)].append(candidate)

    scores: dict[tuple[str, str], ScoredItem] = {}
    error: str | None = None
    for items in grouped.values():
        query = items[0].query
        batch = [details[(item.summary.platform, item.summary.external_id)] for item in items]
        await emit(
            run.id,
            "info",
            "ai",
            f"Scoring {len(batch)} vacancies for “{query.name}” with the fast AI model.",
            {"searchQueryId": str(query.id), "count": len(batch)},
        )
        scored, batch_error = await ai_score(batch, user_summary, query)
        error = error or batch_error
        by_external_id = {item.external_id: item for item in scored}
        for candidate in items:
            score = by_external_id.get(candidate.summary.external_id)
            if not score:
                continue
            key = (candidate.summary.platform, candidate.summary.external_id)
            scores[key] = score
            _stats_for(stats, candidate.summary.platform)["scored"] += 1
        if batch_error:
            _stats_for(stats, items[0].summary.platform)["errors"] += 1
            await emit(
                run.id,
                "error",
                "score",
                f"AI scoring failed for “{query.name}”: {batch_error} "
                f"({len(scored)} of {len(batch)} scored).",
                {"searchQueryId": str(query.id), "scored": len(scored), "requested": len(batch)},
            )
        else:
            await emit(
                run.id,
                "info",
                "score",
                f"Scored {len(scored)} of {len(batch)} vacancies for “{query.name}”.",
                {"searchQueryId": str(query.id), "scored": len(scored), "requested": len(batch)},
            )
    return scores, error


async def _persist_candidates(
    run: DiscoveryRun,
    candidates: list[Candidate],
    details: dict[tuple[str, str], VacancyDetails],
    scores: dict[tuple[str, str], ScoredItem],
) -> list[DiscoveredVacancy]:
    """Persist only AI-scored candidates so failed or low-relevance runs never flood the inbox."""
    persisted: list[DiscoveredVacancy] = []
    for candidate in candidates:
        summary = candidate.summary
        key = (summary.platform, summary.external_id)
        score = scores.get(key)
        if score is None:
            continue
        detail = details.get(key)
        source = detail or summary
        vacancy = DiscoveredVacancy(
            platform=source.platform,
            external_id=source.external_id,
            url=source.url,
            title=source.title,
            company=source.company,
            company_logo_url=source.company_logo_url,
            location=source.location,
            remote=source.remote,
            employment=source.employment,
            experience_years=detail.experience_years if detail else "",
            english_level=detail.english_level if detail else "",
            salary_min=source.salary_min,
            salary_max=source.salary_max,
            salary_currency=source.salary_currency,
            tags=source.tags,
            snippet=source.snippet,
            description=detail.description_text if detail else "",
            description_html=detail.description_html if detail else "",
            posted_at=source.posted_at,
            raw=source.raw,
            score=score.score if score else None,
            verdict=score.verdict if score else "",
            run_id=run.id,
            search_query_id=candidate.query.id,
        )
        persisted.append(await discovered_crud.create(vacancy))
    return persisted


async def _execute(run: DiscoveryRun) -> DiscoveryRun:
    """Execute a previously persisted discovery run to completion."""
    global _active_run_id, _task
    async with _lock:
        stats: dict[str, PlatformStats] = {}
        try:
            await emit(run.id, "info", "search", f"Started {run.trigger} vacancy discovery.")
            settings = await get_settings()
            user_summary, profile = await build_user_summary()
            candidates, accounts = await _collect_candidates(run, settings, profile, stats)
            await emit(
                run.id,
                "info",
                "decision",
                f"Found {len(candidates)} never-before-seen vacancies.",
                {"new": len(candidates)},
            )
            details = await _fetch_details(run, candidates, accounts, stats)
            scores, scoring_error = await _score_details(
                run, candidates, details, user_summary, stats
            )
            persisted = await _persist_candidates(run, candidates, details, scores)
            await _persist_stats(run.id, stats)
            await notify_new_vacancies(persisted, settings)
            if scoring_error and not persisted:
                await emit(
                    run.id,
                    "error",
                    "decision",
                    f"Discovery finished without scoring any vacancies: {scoring_error}",
                    {"new": 0},
                )
            elif scoring_error:
                await emit(
                    run.id,
                    "warning",
                    "decision",
                    f"Added {len(persisted)} vacancies; some AI scoring failed: {scoring_error}",
                    {"new": len(persisted), "scored": len(scores)},
                )
            else:
                await emit(
                    run.id,
                    "info",
                    "decision",
                    f"Discovery completed with {len(persisted)} new inbox vacancies.",
                    {"new": len(persisted), "scored": len(scores)},
                )
            updated = await runs_crud.update(
                run.id,
                {
                    "status": "completed",
                    "finished_at": utcnow(),
                    "stats": cast(dict[str, Any], stats),
                    "error": scoring_error or "",
                },
            )
            await runs_crud.prune()
            completed = updated or run
            events.publish_run_status(completed)
            return completed
        except asyncio.CancelledError:
            await emit(run.id, "warning", "decision", "Discovery run was cancelled.")
            cancelled = await runs_crud.update(
                run.id,
                {
                    "status": "cancelled",
                    "finished_at": utcnow(),
                    "stats": cast(dict[str, Any], stats),
                },
            )
            if cancelled:
                events.publish_run_status(cancelled)
            raise
        except Exception as exc:
            logger.exception("Vacancy discovery run failed: {}", exc)
            await emit(run.id, "error", "decision", f"Discovery run failed: {exc}")
            failed = await runs_crud.update(
                run.id,
                {
                    "status": "failed",
                    "finished_at": utcnow(),
                    "stats": cast(dict[str, Any], stats),
                    "error": str(exc),
                },
            )
            if failed:
                events.publish_run_status(failed)
            raise
        finally:
            if _active_run_id == run.id:
                _active_run_id = None
            if _task is asyncio.current_task():
                _task = None


async def start_discovery(trigger: str) -> DiscoveryRun:
    """Persist and start a discovery run in the background."""
    global _active_run_id, _task
    async with _launch_lock:
        if is_running():
            raise ConflictError("A vacancy discovery run is already active.")
        run = await runs_crud.create(DiscoveryRun(trigger=trigger, stats={}))
        _active_run_id = run.id
        _task = asyncio.create_task(_execute(run), name=f"discovery-run-{run.id}")
        _task.add_done_callback(_consume_task_result)
        events.publish_run_status(run)
        return run


async def cancel_discovery(run_id: uuid.UUID) -> DiscoveryRun:
    """Cancel the process-local active discovery run and return its final state."""
    task = _task
    if task is None or task.done() or _active_run_id != run_id:
        raise ConflictError("This discovery run is not active in this process.")
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    run = await runs_crud.get(run_id)
    if not run:
        raise RuntimeError("Cancelled discovery run disappeared.")
    return run


async def stop() -> None:
    """Cancel and await any active discovery run during application shutdown."""
    task = _task
    if task is None or task.done():
        return
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task


async def run_discovery(trigger: str) -> DiscoveryRun:
    """Start a discovery run and wait for it to finish."""
    await start_discovery(trigger)
    task = _task
    if task is None:
        raise RuntimeError("Discovery task did not start.")
    return await task
