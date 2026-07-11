from .base import JobBoardClient
from .djinni import DjinniClient
from .errors import JobBoardError
from .robota import RobotaClient

CLIENTS: dict[str, type[JobBoardClient]] = {
    DjinniClient.platform: DjinniClient,
    RobotaClient.platform: RobotaClient,
}


def get_client(platform: str) -> JobBoardClient:
    """Instantiate the client registered for the given platform."""
    try:
        client_class = CLIENTS[platform]
    except KeyError as exc:
        raise JobBoardError(f"No job-board client registered for '{platform}'.") from exc
    return client_class()
