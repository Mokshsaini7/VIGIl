# VIGIL — Voice Integrity & Impersonation Guard
## AI-Powered Real-Time Voice Security & Impersonation Defense Platform

> **Tagline:** Detect. Verify. Understand. Protect.  
> **Smart India Hackathon (SIH) 2026 Ready Prototype**

---

## Executive Summary

VIGIL is an enterprise-grade AI voice security operations platform designed to protect individuals, financial institutions, and organizations from voice deepfakes, synthetic voice cloning attacks, biometric speaker mismatch, and social-engineering telephone scams.

Unlike basic deepfake audio detectors, VIGIL operates as a multi-layer **Voice Impersonation Defense System** that correlates acoustic voice authenticity, speaker biometric identity, multilingual speech-to-text transcript analysis, intent classification, and a dynamic 0-100 risk engine into explainable real-time security advisories.

---

## Key Questions Answered by VIGIL

1. **WHO** is speaking? *(Biometric Speaker Verification - d-vector similarity)*
2. **IS** the voice authentic? *(Acoustic Anti-Spoofing & Vocoder Detection)*
3. **IS** this the expected speaker? *(Cosine Similarity Threshold Matching)*
4. **WHAT** is being said? *(Multilingual Speech-to-Text Transcription)*
5. **IS** the conversation suspicious? *(NLP & Intent Classification Engine)*
6. **WHY** is it suspicious? *(Explainable Contributing Risk Factors)*
7. **HOW** severe is the threat? *(Dynamic 0–100 Risk Score: Low, Guarded, Moderate, High, Critical)*
8. **WHAT** should the user do? *(Real-Time Actionable Security Advisory)*

---

## Core System Architecture

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
```

---

## SIH 2026 Interactive Demonstration Scenarios

VIGIL features a dedicated **SIH 2026 Judge Demonstration Suite** featuring 5 pre-configured, 100% reproducible scam scenarios:

1. **Scenario 1: Genuine Customer Support Call** (Real voice, Speaker Matched -> LOW Risk 12/100)
2. **Scenario 2: AI-Generated Voice Clone Attempt** (94% Synthetic Voice -> HIGH Risk 78/100)
3. **Scenario 3: Bank Impersonation & OTP Scam** (Fake SBI Manager, Urgency + OTP harvest -> CRITICAL Risk 94/100)
4. **Scenario 4: Family Emergency Scam** (Son AI Voice Clone, Hospital claim, Rs 50,000 request -> CRITICAL Risk 96/100)
5. **Scenario 5: Remote Access & Financial Scam** (AnyDesk download request, UPI PIN harvest -> CRITICAL Risk 98/100)

---

## Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js v18+

### 2. Backend Setup & Startup
```bash
cd backend
python -m pip install -r ../requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 3. Frontend Setup & Startup
```bash
cd frontend
npm install
npm run dev
```
Dashboard live at: `http://localhost:3000`

---

## Documentation Index

- [`VIGIL_MASTER_PLAN.md`](./VIGIL_MASTER_PLAN.md): Complete project plan.
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md): Multi-layer system design specification.
- [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md): REST & WebSocket API specification.
- [`docs/AI_PIPELINE.md`](./docs/AI_PIPELINE.md): AI/ML Module specifications (Modules 1-7).
- [`docs/DATABASE_SCHEMA.md`](./docs/DATABASE_SCHEMA.md): Database schemas & tables.
- [`docs/SECURITY.md`](./docs/SECURITY.md): JWT, RBAC, and data privacy architecture.
- [`docs/TESTING.md`](./docs/TESTING.md): Verification test suite and execution report.
- [`docs/SIH_DEMO.md`](./docs/SIH_DEMO.md): SIH 2026 Judge demonstration flow.
- [`docs/MODEL_EVALUATION.md`](./docs/MODEL_EVALUATION.md): Accuracy, FAR, FRR, EER, and latency benchmarks.
