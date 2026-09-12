# VIGIL System Architecture Specification

## Overview

VIGIL is architected as a modular, high-throughput, real-time voice security platform combining Next.js frontend, Python FastAPI backend, custom AI/ML acoustic and NLP inference pipeline, and PostgreSQL/SQLite persistence.

---

## Dataflow Architecture

```
Microphone / Audio File
         │
         ↓
  Next.js Dashboard ──(WebSocket / REST)──> FastAPI Gateway
                                                  │
                                                  ↓
                                        VigilAIPipeline
                                                  │
 ┌────────────────────────────────────────────────┼────────────────────────────────────────────────┐
 ↓                                                ↓                                                ↓
Module 1: Audio Processor               Module 2: Voice Detector                        Module 3: Speaker Verifier
(16kHz mono, RMS Norm, Chunking)       (MFCCs, ZCR, Spectral Centroid, Vocoder)         (128-dim d-vector, Cosine Match)
 │                                                │                                                │
 └────────────────────────────────────────────────┼────────────────────────────────────────────────┘
                                                  │
                                                  ↓
                                        Module 4: Speech-to-Text
                                        (Whisper Multilingual ASR)
                                                  │
                                                  ↓
                                        Module 5: Context Analyzer
                                        (NLP + Rule Social Eng Intent)
                                                  │
                                                  ↓
                                        Module 6: Dynamic Risk Engine
                                        (0-100 Weighted Score + Factors)
                                                  │
                                                  ↓
                                        Module 7: Threat Classifier
                                        (Multi-label Category + Action)
                                                  │
                                                  ↓
                                    Persisted to Database & WebSocket Push
```

---

## Core Components

### 1. Web Dashboard Layer (`frontend/`)
- Built using **Next.js 14** with **React 18** and **Tailwind CSS**.
- Low-clutter, dark-mode Cybersecurity Operations Center (SOC) visual layout.
- Features dynamic SVG score gauge, live canvas waveform visualizer, and Recharts timeline visualizers.

### 2. API & Real-Time Communication Layer (`backend/app/api/`)
- Built using **FastAPI** for low-latency asynchronous processing.
- Handles REST endpoints (`/api/audio/analyze`, `/api/speaker/verify`, etc.) and WebSocket streaming (`/ws/analyze`).

### 3. AI Core Engine (`ai/`)
- Modular Python pipeline (`VigilAIPipeline`) chaining 7 decoupled sub-modules.
- Can be run offline, in batch, or as real-time sliding window chunk evaluator.
