"""SQLModel database models."""

from .app_setting import AppSetting
from .chat import Chat, ChatMessage
from .cover_letter import CoverLetter
from .discovered_vacancy import DiscoveredVacancy
from .discovery_event import DiscoveryEvent
from .discovery_run import DiscoveryRun
from .git_source import GitSource
from .markdown_file import MarkdownFile
from .platform_account import PlatformAccount
from .project import Project
from .resume import Resume
from .search_query import SearchQuery
from .template import Template
from .vacancy import Vacancy

__all__ = [
    "AppSetting",
    "Chat",
    "ChatMessage",
    "CoverLetter",
    "DiscoveredVacancy",
    "DiscoveryEvent",
    "DiscoveryRun",
    "GitSource",
    "MarkdownFile",
    "PlatformAccount",
    "Project",
    "Resume",
    "SearchQuery",
    "Template",
    "Vacancy",
]
