"""
VIGIL database configuration and schema bootstrap.

Supports:
- SQLite for local development
- PostgreSQL / Supabase for production

The security schema is automatically checked and migrated
for both SQLite and PostgreSQL.
"""

import os

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

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
    pool_pre_ping=True,
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


Base = declarative_base()


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# SECURITY SCHEMA MIGRATION
# ============================================================

def migrate_security_schema() -> None:
    """
    Ensure the VIGIL security/authentication schema exists.

    This is intentionally safe to run during application startup.

    It supports:
        SQLite
        PostgreSQL / Supabase
    """

    inspector = inspect(engine)

    # --------------------------------------------------------
    # USERS TABLE
    # --------------------------------------------------------

    existing_tables = inspector.get_table_names()

    if "users" not in existing_tables:
        # Base.metadata.create_all() will create the complete
        # users table later in startup.
        return

    columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    # --------------------------------------------------------
    # ADD account_status
    # --------------------------------------------------------

    if "account_status" not in columns:

        if DATABASE_URL.startswith("sqlite"):

            with engine.begin() as conn:
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

        else:

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN IF NOT EXISTS
                        account_status
                        VARCHAR(20)
                        NOT NULL
                        DEFAULT 'PENDING'
                        """
                    )
                )

    # --------------------------------------------------------
    # ADD approved_at
    # --------------------------------------------------------

    if "approved_at" not in columns:

        if DATABASE_URL.startswith("sqlite"):

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN approved_at DATETIME
                        """
                    )
                )

        else:

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN IF NOT EXISTS
                        approved_at TIMESTAMPTZ NULL
                        """
                    )
                )

    # --------------------------------------------------------
    # ADD last_login
    # --------------------------------------------------------

    if "last_login" not in columns:

        if DATABASE_URL.startswith("sqlite"):

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN last_login DATETIME
                        """
                    )
                )

        else:

            with engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        ALTER TABLE users
                        ADD COLUMN IF NOT EXISTS
                        last_login TIMESTAMPTZ NULL
                        """
                    )
                )

    # --------------------------------------------------------
    # REFRESH COLUMN INFORMATION
    # --------------------------------------------------------

    inspector = inspect(engine)

    columns = {
        column["name"]
        for column in inspector.get_columns("users")
    }

    # --------------------------------------------------------
    # MIGRATE OLD ROLES
    # --------------------------------------------------------

    if "role" in columns:

        with engine.begin() as conn:

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

    # --------------------------------------------------------
    # PRESERVE EXISTING ACTIVE USERS
    # --------------------------------------------------------

    if (
        "account_status" in columns
        and "is_active" in columns
    ):

        with engine.begin() as conn:

            if DATABASE_URL.startswith("sqlite"):

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

            else:

                conn.execute(
                    text(
                        """
                        UPDATE users
                        SET account_status = 'ACTIVE'
                        WHERE account_status = 'PENDING'
                        AND is_active = TRUE
                        """
                    )
                )


# ============================================================
# DATABASE HEALTH CHECK
# ============================================================

def check_database_connection() -> bool:
    """
    Verify that the database is reachable.
    """

    try:

        with engine.connect() as conn:

            conn.execute(
                text("SELECT 1")
            )

        return True

    except Exception as exc:

        print(
            "[DATABASE ERROR]",
            str(exc),
        )

        return False
