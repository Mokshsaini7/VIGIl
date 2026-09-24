"""VIGIL database configuration and bootstrap migrations."""

import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./vigil.db",
)


connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)


engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def migrate_security_schema() -> None:
    """
    Apply Phase 1 security changes to an existing SQLite database.

    SQLAlchemy create_all() does not modify existing tables.
    Therefore, existing VIGIL installations need these columns added
    manually during application startup.
    """

    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as conn:

        columns = {
            row[1]
            for row in conn.execute(
                text("PRAGMA table_info(users)")
            )
        }

        # No users table yet.
        # create_all() will create it later.
        if not columns:
            return

        # Add account_status.
        if "account_status" not in columns:
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN account_status
                    VARCHAR(20)
                    NOT NULL
                    DEFAULT 'PENDING'
                    """
                )
            )

        # Add approval timestamp.
        if "approved_at" not in columns:
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN approved_at DATETIME
                    """
                )
            )

        # Add last-login timestamp.
        if "last_login" not in columns:
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN last_login DATETIME
                    """
                )
            )

        # Convert old VIGIL roles into normal users.
        conn.execute(
            text(
                """
                UPDATE users
                SET role = 'USER'
                WHERE role IS NULL
                OR role IN (
                    'ANALYST',
                    'OPERATOR',
                    'VIEWER'
                )
                """
            )
        )

        # Existing active users remain active.
        # This prevents the migration from locking out
        # an already working VIGIL installation.
        conn.execute(
            text(
                """
                UPDATE users
                SET account_status = 'ACTIVE'
                WHERE account_status = 'PENDING'
                AND is_active = 1
                """
            )
        )
        
