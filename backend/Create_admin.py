"""
Create the first VIGIL administrator
from the command line.

Usage:

    python create_admin.py

Required environment variables:

    VIGIL_ADMIN_USERNAME
    VIGIL_ADMIN_EMAIL
    VIGIL_ADMIN_PASSWORD

This is intentionally NOT exposed
through a public HTTP endpoint.
"""

import os
import sys

from pathlib import Path


# ============================================================
# PATH
# ============================================================

ROOT = Path(
    __file__
).resolve().parents[1]

BACKEND = Path(
    __file__
).resolve().parent


for path in (
    ROOT,
    BACKEND,
):

    if str(path) not in sys.path:

        sys.path.insert(
            0,
            str(path),
        )


# ============================================================
# APPLICATION IMPORTS
# ============================================================

from app.db.database import (
    Base,
    engine,
    SessionLocal,
    migrate_security_schema,
)

from app.db.models import User

from app.core.security import (
    get_password_hash,
    validate_password,
)


# ============================================================
# DATABASE
# ============================================================

migrate_security_schema()

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# ADMIN CONFIGURATION
# ============================================================

username = os.getenv(
    "VIGIL_ADMIN_USERNAME"
)

email = os.getenv(
    "VIGIL_ADMIN_EMAIL"
)

password = os.getenv(
    "VIGIL_ADMIN_PASSWORD"
)


if not all(
    (
        username,
        email,
        password,
    )
):

    raise SystemExit(
        "Set "
        "VIGIL_ADMIN_USERNAME, "
        "VIGIL_ADMIN_EMAIL and "
        "VIGIL_ADMIN_PASSWORD "
        "first."
    )


validate_password(
    password
)


# ============================================================
# CREATE / PROMOTE ADMIN
# ============================================================

db = SessionLocal()

try:

    existing = (
        db.query(User)
        .filter(
            (User.username == username)
            | (User.email == email)
        )
        .first()
    )

    if existing:

        existing.role = "ADMIN"

        existing.account_status = (
            "ACTIVE"
        )

        existing.is_active = True

        db.commit()

        print(
            "Updated existing account "
            f"'{existing.username}' "
            "to ADMIN/ACTIVE."
        )

    else:

        user = User(
            username=username,
            email=email.lower(),
            hashed_password=(
                get_password_hash(
                    password
                )
            ),
            role="ADMIN",
            account_status="ACTIVE",
            is_active=True,
        )

        db.add(user)

        db.commit()

        print(
            f"Created ADMIN account "
            f"'{username}'."
        )

finally:

    db.close()
