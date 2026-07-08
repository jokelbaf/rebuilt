from collections.abc import Sequence

from crud import files as files_crud
from crud import projects as projects_crud
from models import MarkdownFile, Project, Vacancy

from .project_selection import select_relevant_projects


def format_files(files: Sequence[MarkdownFile]) -> str:
    """Render a list of markdown files into a single context section."""
    return "\n\n".join(f"### {file.name}\n{file.content}" for file in files)


def format_project(project: Project) -> str:
    """Render a single project into a context block."""
    lines = [f"### {project.title} ({project.level})"]
    if project.description:
        lines.append(project.description)
    if project.tech:
        lines.append("Tech: " + ", ".join(project.tech))
    if project.roles:
        lines.append("Roles: " + ", ".join(project.roles))
    if project.resume_bullets:
        bullets = "\n".join(f"- {bullet}" for bullet in project.resume_bullets)
        lines.append(f"Highlights:\n{bullets}")
    if project.keywords:
        lines.append("Keywords: " + ", ".join(project.keywords))
    return "\n".join(lines)


async def build_candidate_context(vacancy: Vacancy) -> str:
    """Assemble profile, experience and the most relevant projects into a context block."""
    sections: list[str] = []

    profile = await files_crud.list_for("profile")
    if profile:
        sections.append("## Profile\n" + format_files(profile))

    experience = await files_crud.list_for("experience")
    if experience:
        sections.append("## Experience\n" + format_files(experience))

    projects = await projects_crud.list_all()
    if projects:
        relevant = select_relevant_projects(vacancy, projects)
        sections.append("## Projects\n" + "\n\n".join(format_project(p) for p in relevant))

    return "\n\n".join(sections) if sections else "(no candidate context provided)"
