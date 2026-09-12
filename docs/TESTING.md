# VIGIL Verification & Test Strategy

## Test Suite Summary

VIGIL includes automated unit and integration tests built with `pytest` and `httpx`.

```
============================== 9 passed in 2.54s ==============================
```

---

## 1. Automated Test Suites

### AI Core Modules (`tests/test_ai_pipeline.py`)
- `test_audio_processor`: Validates format checking, PCM decoding, RMS energy calculation, and WAV binary header generation.
- `test_voice_detector`: Tests zero-crossing rate, spectral centroid, spectral bandwidth, and synthetic voice probability estimation.
- `test_speaker_verifier`: Tests 128-dim d-vector extraction, speaker registration, and cosine similarity calculation.
- `test_context_analyzer`: Tests regex intent extraction for OTP requests, urgency, secrecy, and impersonation context scoring.
- `test_risk_engine_and_threat_classifier`: Validates 0–100 score fusion and multi-label threat label assignment.
- `test_vigil_ai_pipeline`: Validates end-to-end pipeline execution on synthesized PCM audio streams.

### REST API & Database (`tests/test_backend_api.py`)
- `test_root_and_health`: Validates system root and operational health endpoints.
- `test_auth_flow`: Validates user registration, password hashing, and JWT login authentication.
- `test_demo_scenarios_api`: Validates SIH demonstration scenario triggers and DB session/alert persistence.

---

## 2. Command to Run Tests

```bash
python -m pytest tests/ -v
```
