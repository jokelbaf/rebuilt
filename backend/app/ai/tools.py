import uuid

from crud import discovered_vacancies as discovered_crud
from crud import discovery_events as discovery_events_crud
from crud import discovery_runs as discovery_runs_crud
from crud import files as files_crud
from crud import projects as projects_crud
from crud import vacancies as vacancies_crud
from errors import APIError, ConflictError
from mcp.server.fastmcp import FastMCP
from models import DiscoveredVacancy
from services.context import format_files, format_project
from services.discovery import promote as discovery_promote
from services.discovery import runner as discovery_runner
from services.discovery import scheduler as discovery_scheduler
from services.discovery import settings as discovery_settings

mcp: FastMCP[None] = FastMCP(
    "rebuilt",
    stateless_http=True,
    json_response=True,
    streamable_http_path="/",
)


@mcp.tool()
async def search_vacancies(query: str = "") -> str:
    """Search the user's stored vacancies by keyword; an empty query lists all vacancies."""
    vacancies = await vacancies_crud.list_all(query or None)
    if not vacancies:
        return "No vacancies found." if query else "The user has no stored vacancies."
    lines = [
        f"- {vacancy.title} (id: {vacancy.id}, source: {vacancy.source or 'manual'}, "
        f"language: {vacancy.language})"
        for vacancy in vacancies
    ]
    return "Vacancies:\n" + "\n".join(lines)


@mcp.tool()
async def get_vacancy(vacancy_id: str) -> str:
    """Fetch the full details of a stored vacancy by its id."""
    try:
        parsed = uuid.UUID(vacancy_id)
    except ValueError:
        return "Invalid vacancy id; use the id returned by search_vacancies."
    vacancy = await vacancies_crud.get(parsed)
    if not vacancy:
        return "Vacancy not found."
    sections = [f"# {vacancy.title}", f"Language: {vacancy.language}"]
    if vacancy.seniority:
        sections.append(f"Seniority: {vacancy.seniority}")
    if vacancy.tech:
        sections.append("Tech: " + ", ".join(vacancy.tech))
    if vacancy.roles:
        sections.append("Roles: " + ", ".join(vacancy.roles))
    if vacancy.keywords:
        sections.append("Keywords: " + ", ".join(vacancy.keywords))
    sections.append(f"\n{vacancy.description}")
    return "\n".join(sections)


@mcp.tool()
async def search_projects(query: str = "") -> str:
    """Search the user's projects by keyword (title or name); an empty query lists all projects."""
    projects = await projects_crud.list_all(query or None)
    if not projects:
        return "No projects found." if query else "The user has no stored projects."
    lines = [
        f"- {project.name}: {project.title} [{project.level}]"
        + (f" - tech: {', '.join(project.tech)}" if project.tech else "")
        for project in projects
    ]
    return "Projects:\n" + "\n".join(lines)


@mcp.tool()
async def get_project(name: str) -> str:
    """Fetch the full details of a project by the name returned by search_projects."""
    project = await projects_crud.get_by_name(name)
    if not project:
        return "Project not found; use the name returned by search_projects."
    return format_project(project)


@mcp.tool()
async def get_profile() -> str:
    """Fetch all of the user's profile notes (who they are, skills, education, links)."""
    files = await files_crud.list_for("profile")
    if not files:
        return "The user has no profile notes yet."
    return format_files(files)


@mcp.tool()
async def get_experience() -> str:
    """Fetch all of the user's work experience notes (jobs, positions, achievements)."""
    files = await files_crud.list_for("experience")
    if not files:
        return "The user has no experience notes yet."
    return format_files(files)


def _parse_discovered_id(vacancy_id: str) -> uuid.UUID | None:
    """Parse a discovered-vacancy id supplied by an MCP caller."""
    try:
        return uuid.UUID(vacancy_id)
    except ValueError:
        return None


def _format_salary(
    minimum: int | None,
    maximum: int | None,
    currency: str | None,
) -> str:
    """Format a compact salary range for conversational tool output."""
    if minimum is None and maximum is None:
        return "not listed"
    amount = (
        f"{minimum:,}–{maximum:,}"
        if minimum is not None and maximum is not None
        else f"{minimum if minimum is not None else maximum:,}"
    )
    return f"{amount} {currency or ''}".strip()


def _format_discovered_line(vacancy: DiscoveredVacancy) -> str:
    """Format one discovered vacancy as a compact recommendation line."""
    return (
        f"- {vacancy.title} at {vacancy.company or 'company not listed'} "
        f"[{vacancy.platform}; salary: "
        f"{_format_salary(vacancy.salary_min, vacancy.salary_max, vacancy.salary_currency)}; "
        f"score: {vacancy.score if vacancy.score is not None else 'unscored'}; "
        f"id: {vacancy.id}]"
    )


@mcp.tool()
async def search_discovered_vacancies(
    query: str = "", status: str = "new", min_score: int = 0
) -> str:
    """Search the vacancy discovery inbox by title or company and decision status."""
    if status not in {"new", "approved", "dismissed"}:
        return "Invalid status; use new, approved, or dismissed."
    vacancies = await discovered_crud.list_all(
        status=status,
        min_score=max(0, min(100, min_score)),
        query=query.strip() or None,
    )
    if not vacancies:
        return "No discovered vacancies match those filters."
    return "Discovered vacancies:\n" + "\n".join(
        _format_discovered_line(vacancy) for vacancy in vacancies
    )


@mcp.tool()
async def get_discovered_vacancy(vacancy_id: str) -> str:
    """Fetch full details for a vacancy in the discovery inbox."""
    parsed = _parse_discovered_id(vacancy_id)
    if parsed is None:
        return "Invalid vacancy id; use an id returned by a discovery search tool."
    vacancy = await discovered_crud.get(parsed)
    if not vacancy:
        return "Discovered vacancy not found."
    sections = [
        f"# {vacancy.title}",
        f"Company: {vacancy.company or 'not listed'}",
        f"Platform: {vacancy.platform}",
        f"Status: {vacancy.status}",
        f"Score: {vacancy.score if vacancy.score is not None else 'unscored'}",
        f"Verdict: {vacancy.verdict or 'No AI verdict available.'}",
        "Salary: "
        + _format_salary(vacancy.salary_min, vacancy.salary_max, vacancy.salary_currency),
        f"Location: {vacancy.location or 'not listed'}",
        f"Remote: {'yes' if vacancy.remote else 'no'}",
        f"Employment: {vacancy.employment or 'not listed'}",
        f"Experience: {vacancy.experience_years or 'not listed'}",
        f"English: {vacancy.english_level or 'not listed'}",
        f"Tags: {', '.join(vacancy.tags) if vacancy.tags else 'none'}",
        f"URL: {vacancy.url}",
        f"Id: {vacancy.id}",
    ]
    if vacancy.description:
        sections.append(f"\n{vacancy.description}")
    elif vacancy.snippet:
        sections.append(f"\n{vacancy.snippet}")
    return "\n".join(sections)


@mcp.tool()
async def latest_recommendations(limit: int = 10) -> str:
    """List the highest-scoring newest undecided vacancy recommendations."""
    vacancies = await discovered_crud.list_all(status="new")
    selected = vacancies[: max(1, min(50, limit))]
    if not selected:
        return "There are no new vacancy recommendations."
    return "Latest recommendations:\n" + "\n".join(
        _format_discovered_line(vacancy) for vacancy in selected
    )


@mcp.tool()
async def get_discovery_status() -> str:
    """Report the active or latest discovery run and the next scheduled execution."""
    active = await discovery_runs_crud.get_active()
    run = active
    if run is None:
        recent = await discovery_runs_crud.list_all(1)
        run = recent[0] if recent else None
    settings = await discovery_settings.get_settings()
    next_run = await discovery_scheduler.next_run_at(settings)
    schedule = next_run.isoformat() if next_run else "disabled"
    if run is None:
        return f"No discovery runs have been recorded. Next scheduled run: {schedule}."
    lines = [
        f"Discovery run {run.id}: {run.status} ({run.trigger}).",
        f"Started: {run.started_at.isoformat()}.",
        f"Finished: {run.finished_at.isoformat() if run.finished_at else 'not yet'}.",
        f"Stats: {run.stats}.",
        f"Next scheduled run: {schedule}.",
    ]
    events = await discovery_events_crud.list_for_run(run.id, limit=5)
    if events:
        lines.append("Latest events:")
        lines.extend(f"- [{event.level}/{event.kind}] {event.message}" for event in events)
    return "\n".join(lines)


@mcp.tool()
async def start_discovery() -> str:
    """Start a vacancy discovery run without waiting for it to finish."""
    try:
        run = await discovery_runner.start_discovery("chat")
    except ConflictError:
        active_id = discovery_runner.active_run_id()
        suffix = f" (run id: {active_id})" if active_id else ""
        return f"Vacancy discovery is already running{suffix}."
    return f"Started vacancy discovery (run id: {run.id})."


@mcp.tool()
async def approve_discovered_vacancy(vacancy_id: str) -> str:
    """Approve a discovered vacancy and add it to the user's stored vacancies."""
    parsed = _parse_discovered_id(vacancy_id)
    if parsed is None:
        return "Invalid vacancy id; use an id returned by a discovery search tool."
    try:
        vacancy = await discovery_promote.approve(parsed)
    except APIError as exc:
        return f"Could not approve vacancy: {exc.message}"
    return f"Approved the vacancy and created stored vacancy {vacancy.id}."


@mcp.tool()
async def dismiss_discovered_vacancy(vacancy_id: str, reason: str = "") -> str:
    """Dismiss a discovered vacancy with an optional reason."""
    parsed = _parse_discovered_id(vacancy_id)
    if parsed is None:
        return "Invalid vacancy id; use an id returned by a discovery search tool."
    try:
        await discovery_promote.dismiss(parsed, reason)
    except APIError as exc:
        return f"Could not dismiss vacancy: {exc.message}"
    return "Dismissed the discovered vacancy."
