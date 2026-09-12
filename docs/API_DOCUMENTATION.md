# VIGIL API Specification

## Base URL
`http://localhost:8000/api`

---

## Authentication Endpoints

### `POST /api/auth/register`
Registers a new system user.
- **Request Body:**
  ```json
  {
    "username": "analyst1",
    "email": "analyst@vigil.sec",
    "password": "Password123!",
    "role": "ANALYST"
  }
  ```
- **Response:** `200 OK` with JWT token.

### `POST /api/auth/login`
Authenticates a user and issues JWT bearer token.
- **Form Data:** `username`, `password`
- **Response:**
  ```json
  {
    "access_token": "eyJhbGci...",
    "token_type": "bearer",
    "username": "analyst1",
    "role": "ANALYST"
  }
  ```

---

## Audio Inspection Endpoints

### `POST /api/audio/analyze`
Executes complete VIGIL multi-layer security analysis on uploaded audio file.
- **Multipart Form Data:**
  - `file`: Audio file (`.wav`, `.mp3`, `.ogg`, `.flac`)
  - `speaker_id` (optional): Expected speaker ID string (e.g. `SPK_001`)
- **Response:**
  ```json
  {
    "session_code": "VGL-8F29A1",
    "results": {
      "voice_authenticity": { "synthetic_probability": 0.89, "classification": "SYNTHETIC" },
      "speaker_verification": { "status": "MISMATCH", "similarity": 0.28 },
      "transcription": { "transcript": "..." },
      "risk_assessment": { "risk_score": 92, "risk_level": "CRITICAL" },
      "threat_classification": { "primary_threat": "BANK_IMPERSONATION", "recommended_action": "..." }
    }
  }
  ```

---

## Real-Time WebSocket Interface

### `WS /ws/analyze`
Bidirectional WebSocket stream accepting base64 audio chunks / JSON frames.
- **Frame Request:**
  ```json
  {
    "type": "chunk",
    "audio_b64": "<base64_encoded_pcm_bytes>",
    "speaker_id": "SPK_001",
    "text": "Sir your bank account will be blocked today..."
  }
  ```
- **Frame Response:**
  ```json
  {
    "type": "analysis_frame",
    "results": {
      "voice_authenticity": { "synthetic_probability": 0.88 },
      "risk_assessment": { "risk_score": 94, "risk_level": "CRITICAL" }
    }
  }
  ```
