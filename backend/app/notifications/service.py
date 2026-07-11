from collections.abc import Sequence

from models import DiscoveredVacancy
from schemas.discovery import DiscoverySettings
from services.discovery.events import emit

from .base import NewVacanciesNotification, NewVacancyNotification, Notifier
from .telegram import TelegramNotifier


def _configured_notifiers(settings: DiscoverySettings) -> list[Notifier]:
    """Build the enabled and fully configured notification channels."""
    notifications = settings.notifications
    if (
        notifications.telegram_enabled
        and notifications.telegram_bot_token
        and notifications.telegram_chat_id
    ):
        return [TelegramNotifier(notifications.telegram_bot_token, notifications.telegram_chat_id)]
    return []


async def notify_new_vacancies(
    vacancies: Sequence[DiscoveredVacancy], settings: DiscoverySettings
) -> None:
    """Dispatch high-scoring vacancies through configured channels without failing the run."""
    selected = [
        vacancy
        for vacancy in vacancies
        if vacancy.score is not None and vacancy.score >= settings.score_threshold_notify
    ]
    if not selected:
        return
    event = NewVacanciesNotification(
        run_id=selected[0].run_id,
        vacancies=[
            NewVacancyNotification(
                title=vacancy.title,
                company=vacancy.company,
                score=vacancy.score or 0,
                url=vacancy.url,
            )
            for vacancy in selected
        ],
    )
    for notifier in _configured_notifiers(settings):
        try:
            await notifier.send(event)
            await emit(
                event.run_id,
                "info",
                "notify",
                f"Sent {len(selected)} high-scoring vacancies through {type(notifier).__name__}.",
            )
        except Exception as exc:
            await emit(
                event.run_id,
                "warning",
                "notify",
                f"{type(notifier).__name__} failed: {exc}",
            )
