"""VIGIL authentication and server-side authorization."""

import datetime
import os
from typing import Optional, Callable

import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from passlib.context import CryptContext

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "dev-only-change-this-vigil-secret",
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256",
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
)


VALID_ROLES = {
    "USER",
    "ADMIN",
    "SUPER_ADMIN",
}


VALID_STATUSES = {
    "PENDING",
    "ACTIVE",
    "REJECTED",
    "SUSPENDED",
}


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def get_password_hash(
    password: str,
) -> str:

    return pwd_context.hash(password)


def validate_password(
    password: str,
) -> None:

    if len(password) < 10:
        raise HTTPException(
            status_code=422,
            detail=(
                "Password must be at least "
                "10 characters long"
            ),
        )

    if len(password) > 128:
        raise HTTPException(
            status_code=422,
            detail=(
                "Password must be "
                "128 characters or fewer"
            ),
        )


def create_access_token(
    user: User,
    expires_delta: Optional[
        datetime.timedelta
    ] = None,
) -> str:

    expire = (
        datetime.datetime.utcnow()
        + (
            expires_delta
            or datetime.timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )
    )

    # Only identify the account inside the token.
    #
    # IMPORTANT:
    # Role and account status are NOT trusted from JWT.
    # They are read from the database for every request.
    payload = {
        "sub": str(user.id),
        "exp": expire,
        "type": "access",
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("type") != "access":
            raise credentials_exception

        user_id = payload.get("sub")

        if not user_id:
            raise credentials_exception

        user = (
            db.query(User)
            .filter(
                User.id == int(user_id)
            )
            .first()
        )

    except (
        jwt.PyJWTError,
        ValueError,
        TypeError,
    ):
        raise credentials_exception

    if user is None:
        raise credentials_exception

    if user.role not in VALID_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Account has an invalid role configuration",
        )

    return user


def require_active_user(
    user: User = Depends(get_current_user),
) -> User:

    if user.account_status == "PENDING":
        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_PENDING_APPROVAL",
        )

    if user.account_status == "REJECTED":
        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_REJECTED",
        )

    if user.account_status == "SUSPENDED":
        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_SUSPENDED",
        )

    if user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=403,
            detail="ACCOUNT_NOT_ACTIVE",
        )

    return user


def require_roles(
    *allowed_roles: str,
) -> Callable:

    allowed = set(allowed_roles)

    def dependency(
        user: User = Depends(
            require_active_user
        ),
    ) -> User:

        if user.role not in allowed:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions",
            )

        return user

    return dependency


require_admin = require_roles(
    "ADMIN",
    "SUPER_ADMIN",
)

require_super_admin = require_roles(
    "SUPER_ADMIN",
)
