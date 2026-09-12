# VIGIL — Voice Integrity & Impersonation Guard
## Master Project Execution Plan for Smart India Hackathon (SIH) 2026

> **Tagline:** Detect. Verify. Understand. Protect.  
> **Core Objective:** AI-powered voice security platform detecting synthetic AI voices, voice-cloning impersonation, speaker mismatch, and social-engineering voice attacks in real time.

---

## 1. Project Status & Inspection Summary

- **Workspace Path:** `C:\Users\moksh saini\.gemini\antigravity\scratch\VIGIL`
- **Initial Status:** Fresh Build (Zero codebase existing).
- **Environment:**
  - Python: `3.13.7`
  - Node.js: `v24.20.0`
  - npm: `11.19.0`
- **Architecture Strategy:** Full-stack production-grade architecture combining Next.js dashboard, Python FastAPI backend, modular AI/ML pipeline, SQLAlchemy database layer (PostgreSQL/SQLite), WebSockets, and JWT RBAC security.

---

## 2. Target System Architecture

```
                                    VIGIL
                                      │
                                      ↓
                                WEB DASHBOARD
                           (Next.js + Tailwind CSS)
                                      │
                                      ↓
                                 FastAPI API
                               (REST + WebSocket)
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ↓                             ↓                             ↓
 AUDIO PROCESSING             AI/ML CORE ENGINES             SECURITY & AUDIT
(Chunking, Standardizing)             │                       (JWT, RBAC, Logs)
        │            ┌────────────────┼────────────────┐            │
        │            ↓                ↓                ↓            │
        │      AI VOICE DETECTOR  SPEAKER VERIFY     STT/ASR        │
        │     (Synthetic/Real)   (d-vector match)  (Whisper/NLP)    │
        │            │                │                │            │
        │            └────────────────┼────────────────┘            │
        │                             ↓                             │
        │                      CONTEXT ANALYSIS                     │
        │                     (Social Engineering)                  │
        │                             ↓                             │
        │                        RISK ENGINE                        │
        │                    (0-100 Score & Factors)                │
        │                             ↓                             │
        │                       THREAT ENGINE                       │
        │                    (Category & Action)                    │
        │                             ↓                             │
        └──────────────────────────→ ALERTS ←───────────────────────┘
                                      │
                                      ↓
                           PostgreSQL / SQLite DB
                                      │
                            Cloud Storage Mock / File
```

---

## 3. Modular Architecture Breakdown

### Frontend (Next.js 14+ / React + Tailwind CSS)
- **SOC Intelligence Dashboard:** Dark-mode primary design, low clutter, high information density.
- **Key Views:**
  1. **Overview Dashboard:** Operational status, active metrics, threat distribution chart, recent alerts, live risk gauge.
  2. **Live Monitor:** Real-time audio waveform visualizer, live risk score updates, live speech-to-text transcript with highlighted risk flags, threat signal panel, risk timeline.
  3. **Analyze Audio:** File drag-and-drop upload, format validation, execution of complete VIGIL inspection pipeline, detailed forensic report.
  4. **Speaker Verification & Profiles:** Speaker enrollment interface, audio sample collection, speaker profile management, similarity matching status.
  5. **Threat Intelligence:** Attack pattern distributions, threat vectors, fraud category statistics.
  6. **Session Analysis:** Historical session audit view, forensic transcript playback, event timeline.
  7. **Alert Center:** Priority alerts (CRITICAL, HIGH, MODERATE, LOW), status lifecycle (NEW, ACKNOWLEDGED, RESOLVED).
  8. **SIH Interactive Demo Mode:** 5 pre-configured reproducible test scenarios (Genuine Call, AI Voice Clone, Bank Impersonation, Family Emergency Scam, Financial Scam).

### Backend & AI/ML Core (FastAPI + Python Services)
- **Module 1 — Audio Processing (`ai/audio_processor.py`):** Multi-format validation, 16kHz mono normalization, RMS energy calculation, sliding window chunking (5s/10s).
- **Module 2 — AI Voice Detection (`ai/voice_detector.py`):** Multi-feature acoustic extraction (MFCCs, spectral centroid, spectral bandwidth, zero crossing rate, pitch stability) coupled with anti-spoofing classifier returning real/synthetic probability and confidence.
- **Module 3 — Speaker Verification (`ai/speaker_verifier.py`):** Voiceprint embedding creation, cosine similarity match against enrolled baseline profiles, match/mismatch status with configurable confidence threshold.
- **Module 4 — Speech-to-Text (`ai/speech_to_text.py`):** ASR engine supporting English, Hindi, and Hinglish speech recognition with confidence scoring and timestamp generation.
- **Module 5 — Context Analysis (`ai/context_analyzer.py`):** Rule + NLP hybrid analysis for financial fraud, OTP requests, credentials, bank/police/family impersonation, urgency level, secrecy score, and pressure tactics.
- **Module 6 — Dynamic Risk Engine (`ai/risk_engine.py`):** Transparent weighted score calculation (0–100 scale: LOW, GUARDED, MODERATE, HIGH, CRITICAL) with granular contributing factor explanations.
- **Module 7 — Threat Classification & Action (`ai/threat_classifier.py`):** Multi-label threat categorization and actionable, plain-English security instructions.

### Security, Database & Real-Time (FastAPI Core)
- **Database (`backend/app/db/`):** SQLAlchemy ORM supporting PostgreSQL/SQLite. Schema for `users`, `roles`, `speaker_profiles`, `analysis_sessions`, `transcripts`, `alerts`, and `audit_logs`.
- **Security (`backend/app/core/security.py`):** OAuth2 + JWT tokens, password hashing with passlib/bcrypt, RBAC enforcing `ADMIN`, `ANALYST`, `OPERATOR`, and `VIEWER` permissions.
- **WebSocket (`backend/app/api/websocket.py`):** `/ws/analyze` endpoint accepting audio binary/base64 chunks, returning real-time JSON analysis frames for live UI updates.

---

## 4. Technology Selection Rationale

| Technology | Layer | Purpose | Alternatives Considered | Rationale |
|------------|-------|---------|-------------------------|-----------|
| **Next.js / React** | Frontend | High-performance SOC UI | Vue, Vanilla JS | Industry standard, rich library ecosystem (Recharts, Lucide, Tailwind). |
| **Tailwind CSS** | Frontend | Modern dark-mode styling | Material UI, Bootstrap | Highly customizable, sleek security operations center aesthetic. |
| **FastAPI** | Backend | High-throughput REST & WebSockets | Flask, Django | Async native, built-in OpenAPI docs, minimal latency for AI inference. |
| **PyTorch / Librosa / Scipy** | AI Engine | Feature extraction & model inference | Raw NumPy | Proven tools for acoustic analysis, MFCC extraction, spectrogram modeling. |
| **Whisper / Faster-Whisper** | AI Engine | Multilingual Speech-to-Text | Vosk, Google Speech API | SOTA multilingual support (English, Hindi, Hinglish), local offline execution. |
| **SQLAlchemy** | Database | Database ORM | Django ORM, Raw SQL | Seamless cross-support for PostgreSQL and SQLite, flexible migrations. |
| **PyJWT + Passlib** | Security | Token authentication & hashing | Session cookies | Stateless, scalable, secure role-based access control. |

---

## 5. Implementation Plan & Phases

- **Phase 0:** Project Inspection & Master Architecture Setup.
- **Phase 1:** Core Repository Layout & Backend Foundation.
- **Phase 2:** Frontend Skeleton & Next.js Tailwind Dashboard.
- **Phase 3:** Module 1 — Audio Processing Engine.
- **Phase 4:** Module 2 — AI Synthetic Voice Detection Engine.
- **Phase 5:** Module 5 — Speaker Verification Engine.
- **Phase 6:** Module 4 — Speech-to-Text Engine.
- **Phase 7:** Module 5 — Context Analysis & Social Engineering Detector.
- **Phase 8:** Module 6 — Dynamic Risk Engine.
- **Phase 9:** Module 7 — Threat Classification & Recommended Actions.
- **Phase 10:** FastAPI REST API Integration.
- **Phase 11:** WebSocket Real-time Audio Stream Handler.
- **Phase 12:** Database Schema & SQLAlchemy Persistence.
- **Phase 13:** Security, JWT Authentication & RBAC Layer.
- **Phase 14:** Security Audit Logs & System Monitoring.
- **Phase 15:** Full-Stack API Integration (Frontend + Backend).
- **Phase 16:** Professional UI/UX Refinement & SOC Aesthetics.
- **Phase 17:** Interactive SIH Demo Mode (5 Scenarios).
- **Phase 18:** Automated Test Suite (Unit & End-to-End).
- **Phase 19:** Performance Tuning & Model Benchmarking.
- **Phase 20:** SIH Presentation Readiness & Complete Documentation Set.

---

## 6. Key Risks & Mitigation

1. **Audio Streaming Latency:** Real-time chunking must process within < 500ms.  
   *Mitigation:* Optimized lightweight feature extractors and asynchronous WebSocket pipelines.
2. **Hinglish/Multilingual STT Accuracy:** Phonetic variations in Hindi-English code-switching.  
   *Mitigation:* Hybrid phoneme & intent rule classifier paired with Whisper ASR.
3. **False Positives in AI Voice Detection:** Audio compression artifacts resembling synthetic speech.  
   *Mitigation:* Multi-feature fusion (spectral flux + pitch variation + high-frequency energy dispersion) rather than single-metric reliance.

---

## 7. Testing & Verification Strategy

- **Unit Tests:** `pytest` suites covering feature extractors, risk engine formulas, context analyzers, and JWT security.
- **Integration Tests:** FastAPI test client validating REST endpoints, WebSockets, and DB transactions.
- **End-to-End Tests:** Live audio playback via WebSocket and verification against 5 SIH presentation scenarios.
