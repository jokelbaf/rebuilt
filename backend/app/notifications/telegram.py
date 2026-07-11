import html

import httpx

from .base import NewVacanciesNotification, Notifier

_MAX_MESSAGE_LENGTH = 3800


class NotificationDeliveryError(RuntimeError):
    """Report a notification failure without exposing channel credentials."""


class TelegramNotifier(Notifier):
    """Send high-scoring vacancy summaries through the Telegram Bot API."""

    def __init__(self, bot_token: str, chat_id: str) -> None:
        self._bot_token = bot_token
        self._chat_id = chat_id

    async def send(self, event: NewVacanciesNotification) -> None:
        """Send a formatted vacancy digest to the configured Telegram chat."""
        items = [
            f"<b>{html.escape(item.title)}</b> - {html.escape(item.company)}\n"
            f"Score: {item.score}/100\n"
            f'<a href="{html.escape(item.url, quote=True)}">Open vacancy</a>'
            for item in event.vacancies
        ]
        header = f"<b>ReBuilt found {len(event.vacancies)} strong matches</b>"
        for text in _message_chunks(header, items):
            await self._send_message(text)

    async def send_test(self) -> None:
        """Send a test message to verify Telegram credentials and chat access."""
        await self._send_message("<b>ReBuilt is connected.</b> Vacancy alerts will appear here.")

    async def _send_message(self, text: str) -> None:
        """Send one Telegram message with credential-safe error handling."""
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                response = await client.post(
                    f"https://api.telegram.org/bot{self._bot_token}/sendMessage",
                    json={
                        "chat_id": self._chat_id,
                        "text": text,
                        "parse_mode": "HTML",
                        "link_preview_options": {"is_disabled": True},
                    },
                )
                response.raise_for_status()
            except httpx.HTTPError as exc:
                raise NotificationDeliveryError(
                    "Telegram rejected the bot token or chat ID, or could not be reached."
                ) from exc


def _message_chunks(header: str, items: list[str]) -> list[str]:
    """Split a vacancy digest into Telegram-safe message sizes."""
    chunks: list[str] = []
    current = header
    for item in items:
        candidate = f"{current}\n\n{item}"
        if len(candidate) <= _MAX_MESSAGE_LENGTH:
            current = candidate
            continue
        chunks.append(current)
        current = item
    chunks.append(current)
    return chunks
