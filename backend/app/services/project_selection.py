from collections.abc import Sequence

from models import Project, Vacancy

MAX_CONTEXT_PROJECTS = 12
"""Maximum number of projects fed to the AI when generating a resume."""


def _normalize(items: Sequence[str]) -> set[str]:
    """Lowercase and trim a sequence of tags into a set."""
    return {item.strip().lower() for item in items if item.strip()}


def _score(
    project: Project,
    vac_tech: set[str],
    vac_keywords: set[str],
    vac_roles: set[str],
    vac_seniority: str,
    description: str,
) -> float:
    """Score a project's relevance to a vacancy from overlapping signals."""
    project_tech = _normalize(project.tech)
    project_keywords = _normalize(project.keywords)
    project_roles = _normalize(project.roles)

    score = 0.0
    score += 3.0 * len(project_tech & vac_tech)
    score += 2.0 * len(project_keywords & vac_keywords)
    score += 2.0 * len(project_roles & vac_roles)
    score += 1.0 * sum(1 for tag in project_tech | project_keywords if tag in description)
    if vac_seniority and project.level.lower() == vac_seniority:
        score += 1.0
    return score


def select_relevant_projects(
    vacancy: Vacancy,
    projects: Sequence[Project],
    limit: int = MAX_CONTEXT_PROJECTS,
) -> list[Project]:
    """Select the projects most relevant to a vacancy, capped at ``limit``."""
    if len(projects) <= limit:
        return list(projects)

    vac_tech = _normalize(vacancy.tech)
    vac_keywords = _normalize(vacancy.keywords)
    vac_roles = _normalize(vacancy.roles)
    vac_seniority = vacancy.seniority.lower()
    description = vacancy.description.lower()

    ranked = sorted(
        projects,
        key=lambda project: _score(
            project, vac_tech, vac_keywords, vac_roles, vac_seniority, description
        ),
        reverse=True,
    )
    return ranked[:limit]
