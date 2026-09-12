"""
VIGIL — FastAPI Main Application Entrypoint
Integrates REST Endpoints, WebSockets, CORS, Database Table Auto-creation, and Clean Startup.
"""
from sqlalchemy import text
from app.db.database import SessionLocal
import sys
import os

# Auto-add path resolution for uvicorn reloader subprocesses & different working directories
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)

for path in (PROJECT_ROOT, BACKEND_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api.endpoints import router as api_router
from app.api.websocket import router as ws_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VIGIL — Voice Integrity & Impersonation Guard API",
    description="AI-powered real-time voice security platform detecting synthetic voices, voice cloning, speaker mismatch, and social engineering attacks.",
    version="1.0.0"
)

# CORS configuration
origins = [
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


@app.get("/")
def root():
    return {
        "system": "VIGIL — Voice Integrity & Impersonation Guard",
        "tagline": "Detect. Verify. Understand. Protect.",
        "status": "ONLINE",
        "docs_url": "/docs"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "VIGIL Backend",
        "version": "1.0.0"
    }


# Mount REST and WebSocket Routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)
@app.get("/health/db")
def database_health():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }