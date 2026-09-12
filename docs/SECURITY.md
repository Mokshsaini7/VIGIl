# VIGIL Security Architecture & Governance

## Security Overview

VIGIL enforces zero-trust data protection standards across authentication, authorization, audio payload processing, and database auditing.

---

## 1. Authentication & Role-Based Access Control (RBAC)

- **JWT Tokens:** Authenticated endpoints require a signed HTTP Bearer token signed via `HS256`. Tokens expire after 1440 minutes (24h).
- **Password Hashing:** User passwords are encrypted using `PBKDF2-SHA256` key derivation.
- **RBAC Matrix:**

| Role | Access Permissions |
|------|--------------------|
| **ADMIN** | Full system access, configuration changes, user management, full audit inspection |
| **ANALYST** | Audio analysis execution, forensic session review, alert triage & acknowledgment |
| **OPERATOR** | Live monitor watching, real-time alert triage |
| **VIEWER** | Read-only dashboard view |

---

## 2. Audio Data Privacy & Retention Policy

- **Minimal Retention Principle:** Raw audio binary streams uploaded for real-time WebSocket analysis are processed in RAM memory buffers and discarded after feature extraction.
- **Metadata Storage:** Only derived mathematical acoustic feature vectors, transcripts, and risk scores are persisted to the database.
- **Biometric Protection:** Speaker profile d-vectors are stored as 128-dimensional floating point arrays. Raw voice samples used for enrollment are not retained on disk.

---

## 3. Threat Mitigation Controls

- **Rate Limiting & File Bounds:** Upload size capped at 25MB. Format strict validation whitelist (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`, `.webm`).
- **Audit Logging:** Every administrative action, login, speaker enrollment, and high-risk alert generation triggers an immutable audit log record in `audit_logs`.
