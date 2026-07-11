import datetime
import uuid
from typing import Any, Self

from constants import SUPPORTED_CURRENCIES
from pydantic import Field, field_validator, model_validator

from schemas import CamelModel


class PlatformAccountPublic(CamelModel):
    """Public job-board account state without stored credentials or sessions."""

    id: uuid.UUID
    platform: str
    email: str
    has_password: bool
    status: str
    last_verified_at: datetime.datetime | None
    created_at: datetime.datetime


class PlatformAccountUpsert(CamelModel):
    """Credentials used to create or replace a job-board account."""

    platform: str
    email: str
    password: str


class SearchQueryBase(CamelModel):
    """Shared discovery search-query fields."""

    name: str
    enabled: bool = True
    platforms: list[str]
    wishes: str = ""
    salary_min: int | None = Field(default=None, ge=0)
    salary_currency: str | None = None
    seniority: str = ""
    remote_only: bool = False
    location: str = ""
    english_level: str = ""

    @field_validator("salary_currency")
    @classmethod
    def validate_currency(cls, value: str | None) -> str | None:
        """Normalize and validate an optional salary currency."""
        if value is None:
            return None
        currency = value.upper()
        if currency not in SUPPORTED_CURRENCIES:
            raise ValueError("Unsupported salary currency.")
        return currency

    @model_validator(mode="after")
    def validate_salary(self) -> Self:
        """Require an explicit currency whenever a minimum salary is configured."""
        if self.salary_min is not None and self.salary_currency is None:
            raise ValueError("Salary currency is required with a minimum salary.")
        return self


class SearchQueryCreate(SearchQueryBase):
    """Payload used to create a discovery search query."""


class SearchQueryUpdate(CamelModel):
    """Partial payload used to update a discovery search query."""

    name: str | None = None
    enabled: bool | None = None
    platforms: list[str] | None = None
    wishes: str | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_currency: str | None = None
    seniority: str | None = None
    remote_only: bool | None = None
    location: str | None = None
    english_level: str | None = None

    @field_validator("salary_currency")
    @classmethod
    def validate_currency(cls, value: str | None) -> str | None:
        """Normalize and validate an optional salary currency."""
        if value is None:
            return None
        currency = value.upper()
        if currency not in SUPPORTED_CURRENCIES:
            raise ValueError("Unsupported salary currency.")
        return currency


class SearchQueryPublic(SearchQueryBase):
    """Public representation of a discovery search query."""

    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime


class DiscoveryNotificationSettings(CamelModel):
    """All discovery notification channel settings."""

    telegram_enabled: bool = False
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""


class DiscoveryNotificationTest(CamelModel):
    """Result of a notification-channel delivery test."""

    channel: str
    delivered: bool


class DiscoverySettings(CamelModel):
    """Global vacancy discovery scheduling, scoring, and display settings."""

    enabled: bool = False
    interval_minutes: int = Field(default=240, ge=1)
    max_pages_per_query: int = Field(default=3, ge=1, le=10)
    score_threshold_notify: int = Field(default=75, ge=0, le=100)
    preferred_currency: str = "USD"
    notifications: DiscoveryNotificationSettings = Field(
        default_factory=DiscoveryNotificationSettings
    )

    @field_validator("preferred_currency")
    @classmethod
    def validate_preferred_currency(cls, value: str) -> str:
        """Normalize and validate the preferred display currency."""
        currency = value.upper()
        if currency not in SUPPORTED_CURRENCIES:
            raise ValueError("Unsupported preferred currency.")
        return currency


class DiscoveryExchangeRates(CamelModel):
    """Public exchange-rate cache metadata used by discovery settings."""

    base: str
    currencies: list[str]
    fetched_at: datetime.datetime | None


class DiscoveryRunPublic(CamelModel):
    """Public representation of one discovery execution."""

    id: uuid.UUID
    trigger: str
    status: str
    started_at: datetime.datetime
    finished_at: datetime.datetime | None
    stats: dict[str, Any]
    error: str


class DiscoveryEventPublic(CamelModel):
    """Public representation of a persisted discovery audit event."""

    id: int
    run_id: uuid.UUID
    ts: datetime.datetime
    level: str
    kind: str
    message: str
    data: dict[str, Any]


class DiscoveredVacancyDismiss(CamelModel):
    """Optional reason supplied when dismissing a discovered vacancy."""

    reason: str = ""


class DiscoveredVacancyApproval(CamelModel):
    """Identifier of the stored vacancy created by an approval."""

    vacancy_id: uuid.UUID


class DiscoveredVacancyCount(CamelModel):
    """Count of discovered vacancies matching a filter."""

    count: int


class DiscoveredVacancyPublic(CamelModel):
    """List representation of a discovered vacancy."""

    id: uuid.UUID
    platform: str
    external_id: str
    url: str
    title: str
    company: str
    company_logo_url: str | None
    location: str
    remote: bool
    employment: str
    experience_years: str
    english_level: str
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    converted_salary_min: int | None = None
    converted_salary_max: int | None = None
    converted_salary_currency: str | None = None
    tags: list[str]
    snippet: str
    posted_at: datetime.datetime | None
    score: int | None
    verdict: str
    status: str
    dismiss_reason: str
    vacancy_id: uuid.UUID | None
    run_id: uuid.UUID
    search_query_id: uuid.UUID | None
    created_at: datetime.datetime
    updated_at: datetime.datetime


class DiscoveredVacancyDetail(DiscoveredVacancyPublic):
    """Full discovered vacancy representation including source content and payload."""

    description: str
    description_html: str
    raw: dict[str, Any]
