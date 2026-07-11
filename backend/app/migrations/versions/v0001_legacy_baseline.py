import sqlalchemy as sa
from alembic.operations import Operations

REVISION = 1
NAME = "legacy baseline"

_STATEMENTS = (
    """
    CREATE TABLE IF NOT EXISTS appsetting (
        "key" VARCHAR NOT NULL,
        value VARCHAR NOT NULL,
        PRIMARY KEY ("key")
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS chat (
        id CHAR(32) NOT NULL,
        title VARCHAR NOT NULL,
        provider VARCHAR NOT NULL,
        model VARCHAR NOT NULL,
        effort VARCHAR,
        pinned BOOLEAN NOT NULL,
        provider_session_id VARCHAR,
        provider_state JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS coverletter (
        id CHAR(32) NOT NULL,
        name VARCHAR NOT NULL,
        resume_id CHAR(32) NOT NULL,
        html VARCHAR NOT NULL,
        is_saved BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS discoveryrun (
        id CHAR(32) NOT NULL,
        "trigger" VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        started_at DATETIME NOT NULL,
        finished_at DATETIME,
        stats JSON,
        error VARCHAR NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS gitsource (
        id CHAR(32) NOT NULL,
        provider VARCHAR NOT NULL,
        username VARCHAR NOT NULL,
        token VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS markdownfile (
        collection VARCHAR NOT NULL,
        name VARCHAR NOT NULL,
        content VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (collection, name)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS platformaccount (
        id CHAR(32) NOT NULL,
        platform VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        password VARCHAR NOT NULL,
        session_state JSON,
        status VARCHAR NOT NULL,
        last_verified_at DATETIME,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_platformaccount_platform ON platformaccount (platform)",
    """
    CREATE TABLE IF NOT EXISTS project (
        id CHAR(32) NOT NULL,
        name VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        description VARCHAR NOT NULL,
        level VARCHAR NOT NULL,
        tech JSON,
        roles JSON,
        resume_bullets JSON,
        keywords JSON,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_project_name ON project (name)",
    """
    CREATE TABLE IF NOT EXISTS resume (
        id CHAR(32) NOT NULL,
        name VARCHAR NOT NULL,
        vacancy_id CHAR(32) NOT NULL,
        language VARCHAR NOT NULL,
        html VARCHAR NOT NULL,
        is_saved BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS searchquery (
        id CHAR(32) NOT NULL,
        name VARCHAR NOT NULL,
        enabled BOOLEAN NOT NULL,
        platforms JSON,
        wishes VARCHAR NOT NULL,
        salary_min INTEGER,
        salary_currency VARCHAR,
        seniority VARCHAR NOT NULL,
        remote_only BOOLEAN NOT NULL,
        location VARCHAR NOT NULL,
        english_level VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS template (
        name VARCHAR NOT NULL,
        html VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (name)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS vacancy (
        id CHAR(32) NOT NULL,
        title VARCHAR NOT NULL,
        description VARCHAR NOT NULL,
        language VARCHAR NOT NULL,
        source VARCHAR,
        tech JSON,
        keywords JSON,
        roles JSON,
        seniority VARCHAR NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS chatmessage (
        id CHAR(32) NOT NULL,
        chat_id CHAR(32) NOT NULL,
        role VARCHAR NOT NULL,
        content VARCHAR NOT NULL,
        context JSON,
        attachments JSON,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(chat_id) REFERENCES chat (id)
    )
    """,
    "CREATE INDEX IF NOT EXISTS ix_chatmessage_chat_id ON chatmessage (chat_id)",
    """
    CREATE TABLE IF NOT EXISTS discoveredvacancy (
        id CHAR(32) NOT NULL,
        platform VARCHAR NOT NULL,
        external_id VARCHAR NOT NULL,
        url VARCHAR NOT NULL,
        title VARCHAR NOT NULL,
        company VARCHAR NOT NULL,
        company_logo_url VARCHAR,
        location VARCHAR NOT NULL,
        remote BOOLEAN NOT NULL,
        employment VARCHAR NOT NULL,
        experience_years VARCHAR NOT NULL,
        english_level VARCHAR NOT NULL,
        salary_min INTEGER,
        salary_max INTEGER,
        salary_currency VARCHAR,
        tags JSON,
        snippet VARCHAR NOT NULL,
        description VARCHAR NOT NULL,
        description_html VARCHAR NOT NULL,
        posted_at DATETIME,
        raw JSON,
        score INTEGER,
        verdict VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        dismiss_reason VARCHAR NOT NULL,
        vacancy_id CHAR(32),
        run_id CHAR(32) NOT NULL,
        search_query_id CHAR(32),
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE (platform, external_id),
        FOREIGN KEY(vacancy_id) REFERENCES vacancy (id),
        FOREIGN KEY(run_id) REFERENCES discoveryrun (id),
        FOREIGN KEY(search_query_id) REFERENCES searchquery (id)
    )
    """,
    "CREATE INDEX IF NOT EXISTS ix_discoveredvacancy_platform ON discoveredvacancy (platform)",
    "CREATE INDEX IF NOT EXISTS ix_discoveredvacancy_run_id ON discoveredvacancy (run_id)",
    "CREATE INDEX IF NOT EXISTS ix_discoveredvacancy_status ON discoveredvacancy (status)",
    """
    CREATE TABLE IF NOT EXISTS discoveryevent (
        id INTEGER NOT NULL,
        run_id CHAR(32) NOT NULL,
        ts DATETIME NOT NULL,
        level VARCHAR NOT NULL,
        kind VARCHAR NOT NULL,
        message VARCHAR NOT NULL,
        data JSON,
        PRIMARY KEY (id),
        FOREIGN KEY(run_id) REFERENCES discoveryrun (id)
    )
    """,
    "CREATE INDEX IF NOT EXISTS ix_discoveryevent_run_id ON discoveryevent (run_id)",
)


def upgrade(operations: Operations) -> None:
    """Create or adopt the complete pre-migration ReBuilt schema."""
    for statement in _STATEMENTS:
        operations.execute(sa.text(statement))
