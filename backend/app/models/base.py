import datetime


def utcnow() -> datetime.datetime:
    """Return the current timezone-aware UTC timestamp."""
    return datetime.datetime.now(datetime.UTC)
