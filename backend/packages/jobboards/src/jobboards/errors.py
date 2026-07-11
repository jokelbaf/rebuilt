class JobBoardError(Exception):
    """Base class for all job-board client errors."""


class AuthRequiredError(JobBoardError):
    """The session is missing or expired and the request needs a valid one."""


class AuthFailedError(JobBoardError):
    """Authentication with the supplied credentials was rejected."""


class RateLimitedError(JobBoardError):
    """The platform rejected the request for exceeding its rate limits."""


class ParseError(JobBoardError):
    """The platform's response could not be parsed into the unified types."""
