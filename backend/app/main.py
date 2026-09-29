"""
VIGIL — FastAPI Main Application
"""

import sys
import os


# ============================================================
# PATH RESOLUTION
# ============================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.dirname(
    CURRENT_DIR
)

PROJECT_ROOT = os.path.dirname(
    BACKEND_DIR
)


for path in (
    PROJECT_ROOT,
    BACKEND_DIR,
):

    if path not in sys.path:

        sys.path.insert(
            0,
            path,
        )


# ============================================================
# IMPORTS
# ============================================================

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.db.database import (
    engine,
    Base,
    migrate_security_schema,
    check_database_connection,
)

from app.api.endpoints import (
    router as api_router,
)

from app.api.websocket import (
    router as ws_router,
)


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

print("[VIGIL] Initializing database...")


if not check_database_connection():

    print(
        "[VIGIL] WARNING: Database connection "
        "could not be verified."
    )

else:

    print(
        "[VIGIL] Database connection OK."
    )


try:

    migrate_security_schema()

    print(
        "[VIGIL] Security schema migration checked."
    )

except Exception as exc:

    print(
        "[VIGIL] SECURITY SCHEMA MIGRATION ERROR:",
        str(exc),
    )

    raise


Base.metadata.create_all(
    bind=engine
)


print(
    "[VIGIL] Database tables verified."
)


# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title=(
        "VIGIL — Voice Integrity "
        "& Impersonation Guard API"
    ),

    description=(
        "AI-powered real-time voice "
        "security platform."
    ),

    version="2.1.0",
)


# ============================================================
# CORS
# ============================================================

configured_origins = os.getenv(
    "ALLOW_ORIGINS",
    (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "https://www.vigilvoice.in,"
        "https://vigilvoice.in"
    ),
)


origins = [
    origin.strip()
    for origin in configured_origins.split(",")
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,

    allow_origins=origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "system": (
            "VIGIL — Voice Integrity "
            "& Impersonation Guard"
        ),

        "tagline": (
            "Detect. Verify. "
            "Understand. Protect."
        ),

        "status": "ONLINE",

        "docs_url": "/docs",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    database_ok = check_database_connection()

    return {
        "status": (
            "OPERATIONAL"
            if database_ok
            else "DEGRADED"
        ),

        "database": (
            "CONNECTED"
            if database_ok
            else "ERROR"
        ),

        "system": "VIGIL",
    }


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    api_router,
    prefix="/api",
)

app.include_router(
    ws_router
)
