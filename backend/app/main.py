"""
VIGIL — FastAPI Main Application Entrypoint

Integrates:
- REST endpoints
- WebSockets
- CORS
- Database initialization
- Phase 1 security migration
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

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from app.db.database import (
    engine,
    Base,
    migrate_security_schema,
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

migrate_security_schema()

Base.metadata.create_all(
    bind=engine
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
        "security platform detecting "
        "synthetic voices, voice cloning, "
        "speaker mismatch, and social "
        "engineering attacks."
    ),

    version="2.0.0-phase1",
)


# ============================================================
# CORS
# ============================================================

configured_origins = os.getenv(
    "ALLOW_ORIGINS",
    (
        "http://localhost:3000,"
        "http://127.0.0.1:3000"
    ),
)

origins = [
    origin.strip()
    for origin in (
        configured_origins.split(",")
    )
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
# ROUTERS
# ============================================================

app.include_router(
    api_router,
    prefix="/api",
)

app.include_router(
    ws_router
)
