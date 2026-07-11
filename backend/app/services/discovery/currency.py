import asyncio
import datetime
import json
from typing import Any, cast

import httpx
from constants import SUPPORTED_CURRENCIES
from crud import settings as settings_crud
from loguru import logger
from pydantic import BaseModel, ValidationError

RATES_KEY = "discovery.exchange_rates"
_RATES_URL = "https://open.er-api.com/v6/latest/USD"
_MAX_AGE = datetime.timedelta(hours=24)
_refresh_lock = asyncio.Lock()


class ExchangeRates(BaseModel):
    """Stored USD-based exchange rates and their fetch timestamp."""

    base: str = "USD"
    rates: dict[str, float]
    fetched_at: datetime.datetime


_current: ExchangeRates | None = None


async def load_rates() -> ExchangeRates | None:
    """Load persisted exchange rates into the process cache."""
    global _current
    stored = await settings_crud.get_value(RATES_KEY)
    if not stored:
        return None
    try:
        _current = ExchangeRates.model_validate_json(stored)
    except ValidationError:
        logger.warning("Stored discovery exchange rates are invalid")
        _current = None
    return _current


def rates_are_stale(rates: ExchangeRates | None = None) -> bool:
    """Return whether rates are absent or older than the refresh interval."""
    value = rates or _current
    if not value:
        return True
    fetched_at = value.fetched_at
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=datetime.UTC)
    return datetime.datetime.now(datetime.UTC) - fetched_at >= _MAX_AGE


async def refresh_if_stale(*, force: bool = False) -> ExchangeRates | None:
    """Refresh exchange rates when needed, preserving stored rates on failure."""
    global _current
    async with _refresh_lock:
        if _current is None:
            await load_rates()
        if not force and not rates_are_stale():
            return _current
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(_RATES_URL)
                response.raise_for_status()
                body = cast(dict[str, Any], response.json())
            raw_rates = body.get("rates")
            if body.get("result") != "success" or not isinstance(raw_rates, dict):
                raise ValueError("Exchange-rate response was invalid.")
            values = cast(dict[str, Any], raw_rates)
            rates = {
                currency: float(values[currency])
                for currency in SUPPORTED_CURRENCIES
                if isinstance(values.get(currency), int | float)
            }
            if "USD" not in rates:
                rates["USD"] = 1.0
            _current = ExchangeRates(rates=rates, fetched_at=datetime.datetime.now(datetime.UTC))
            await settings_crud.set_value(RATES_KEY, json.dumps(_current.model_dump(mode="json")))
        except (httpx.HTTPError, TypeError, ValueError) as exc:
            logger.warning("Could not refresh discovery exchange rates: {}", exc)
        return _current


def convert(amount: int, from_currency: str, to_currency: str) -> int | None:
    """Convert an amount through cached USD-based rates, or return None when unavailable."""
    source = from_currency.upper()
    target = to_currency.upper()
    if source == target:
        return amount
    if not _current:
        return None
    source_rate = _current.rates.get(source)
    target_rate = _current.rates.get(target)
    if not source_rate or not target_rate:
        return None
    return round(amount / source_rate * target_rate)
