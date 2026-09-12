"""
Integration tests for VIGIL FastAPI REST APIs & Database Persistence.
"""

import sys
import os
import uuid
import pytest

# Dynamic sys.path setup for tests
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

for path in (PROJECT_ROOT, BACKEND_DIR):
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["system"] == "VIGIL — Voice Integrity & Impersonation Guard"

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "OPERATIONAL"

    model_stat = client.get("/api/model/status")
    assert model_stat.status_code == 200
    assert "audio_processor" in model_stat.json()


def test_auth_flow():
    # Register dynamic test user
    uid = uuid.uuid4().hex[:6]
    test_username = f"analyst_{uid}"
    test_email = f"analyst_{uid}@sih.gov.in"
    test_pass = "SecurePassword123!"

    reg_data = {
        "username": test_username,
        "email": test_email,
        "password": test_pass,
        "role": "ANALYST"
    }
    reg_res = client.post("/api/auth/register", json=reg_data)
    assert reg_res.status_code == 200
    assert reg_res.json()["username"] == test_username
    assert "access_token" in reg_res.json()

    # Login
    login_res = client.post(
        "/api/auth/login",
        data={"username": test_username, "password": test_pass}
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


def test_demo_scenarios_api():
    scenarios_res = client.get("/api/demo/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) == 5

    # Simulate Scenario 3 (Bank Impersonation Scam)
    sim_res = client.post("/api/demo/simulate/demo_3_bank_scam")
    assert sim_res.status_code == 200
    res_data = sim_res.json()
    assert "session_code" in res_data
    assert res_data["scenario"]["threat"] == "BANK_IMPERSONATION"
    assert res_data["scenario"]["risk_score"] >= 80

    # Verify session recorded in database list
    sessions_res = client.get("/api/sessions")
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    assert len(sessions) > 0

    # Verify alert created in alert center
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0
