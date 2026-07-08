import uuid

from crud import files as files_crud
from crud import projects as projects_crud
from crud import vacancies as vacancies_crud
from mcp.server.fastmcp import FastMCP
from services.context import format_files, format_project

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
