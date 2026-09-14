"""
VIGIL — FastAPI Main Application Entrypoint

Integrates:
- REST API endpoints
- WebSockets
- CORS
- Database table auto-creation
- Health checks
- Clean startup
"""

import os
import sys

# ============================================================
# PATH RESOLUTION
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

for path in (PROJECT_ROOT, BACKEND_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)


# ============================================================
# FASTAPI / DATABASE IMPORTS
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db.database import engine, Base, SessionLocal
from app.api.endpoints import router as api_router
from app.api.websocket import router as ws_router


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

try:
    Base.metadata.create_all(bind=engine)
    print("VIGIL database tables initialized successfully.")
except Exception as e:
    print(f"Database initialization warning: {e}")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="VIGIL — Voice Integrity & Impersonation Guard API",
    description=(
        "AI-powered real-time voice security platform detecting "
        "synthetic voices, voice cloning, speaker mismatch, "
        "and social engineering attacks."
    ),
    version="1.0.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

# Production frontend domains
# + old Vercel deployment
# + local development
origins = [
    "https://www.vigilvoice.in",
    "https://vigilvoice.in",

    "https://vigil-alpha-inky.vercel.app",

    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "system": "VIGIL — Voice Integrity & Impersonation Guard",
        "tagline": "Detect. Verify. Understand. Protect.",
        "status": "ONLINE",
        "docs_url": "/docs",
    }


# ============================================================
# GENERAL HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VIGIL Backend",
        "version": "1.0.0",
    }


# ============================================================
# DATABASE HEALTH CHECK
# ============================================================

@app.get("/health/db")
def database_health():
    db = None

    try:
        db = SessionLocal()

        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }

    finally:
        if db is not None:
            db.close()


# ============================================================
# REST API ROUTER
# ============================================================

app.include_router(
    api_router,
    prefix="/api",
)


# ============================================================
# WEBSOCKET ROUTER
# ============================================================

app.include_router(ws_router)


# ============================================================
# STARTUP MESSAGE
# ============================================================

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("VIGIL BACKEND STARTED")
    print("Voice Integrity & Impersonation Guard")
    print("=" * 60)
    print("Allowed frontend origins:")
    
    for origin in origins:
        print(f"  - {origin}")

    print("=" * 60)
