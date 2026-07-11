from datetime import UTC, datetime, timedelta

import pytest
from jobboards.djinni import DjinniClient
from jobboards.robota import RobotaClient
from jobboards.types import SessionState


@pytest.fixture
def robota_client() -> RobotaClient:
    """A robota client with no inter-request delay for fast tests."""
    return RobotaClient(min_delay=0, max_delay=0)


@pytest.fixture
def robota_session() -> SessionState:
    """A valid robota session with a far-future expiry."""
    return SessionState(token="test-token", expires_at=datetime.now(UTC) + timedelta(days=1))


@pytest.fixture
def djinni_client() -> DjinniClient:
    """A Djinni client with no inter-request delay for fast tests."""
    return DjinniClient(min_delay=0, max_delay=0)


@pytest.fixture
def djinni_session() -> SessionState:
    """A valid Djinni cookie session."""
    return SessionState(cookies={"sessionid": "test-session", "csrftoken": "test-csrf"})
