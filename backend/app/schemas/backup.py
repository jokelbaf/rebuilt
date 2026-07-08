from schemas import CamelModel


class BackupSummary(CamelModel):
    """Counts of the entities contained in a backup after a restore."""

    vacancies: int = 0
    projects: int = 0
    templates: int = 0
    resumes: int = 0
    cover_letters: int = 0
    markdown_files: int = 0
    git_sources: int = 0
    chats: int = 0
    chat_messages: int = 0
    files: int = 0
