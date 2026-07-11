import abc
import uuid
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class NewVacancyNotification:
    """One high-scoring vacancy included in a notification."""

    title: str
    company: str
    score: int
    url: str


@dataclass(frozen=True, slots=True)
class NewVacanciesNotification:
    """Typed notification payload for high-scoring vacancies from one run."""

    run_id: uuid.UUID
    vacancies: list[NewVacancyNotification]


class Notifier(abc.ABC):
    """Interface implemented by vacancy discovery notification channels."""

    @abc.abstractmethod
    async def send(self, event: NewVacanciesNotification) -> None:
        """Send one new-vacancies notification."""
