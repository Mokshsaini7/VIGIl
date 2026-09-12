# VIGIL AI Core Pipeline Specification

## Pipeline Overview

VIGIL processes audio inputs through a multi-stage sequential and parallel feature fusion network.

```
INPUT AUDIO -> [Module 1: Audio Processing]
                     │
         ┌───────────┼───────────┐
         ↓           ↓           ↓
    [Module 2]  [Module 3]  [Module 4]
   AI Voice     Speaker     Speech-to-Text
   Detector     Verifier    ASR
         │           │           │
         └───────────┼───────────┘
                     ↓
           [Module 5: Context Analysis]
                     ↓
           [Module 6: Dynamic Risk Engine]
                     ↓
           [Module 7: Threat Classifier]
                     ↓
             OUTPUT ADVISORY
```

---

## Module Specifications

### Module 1 — Audio Processor (`ai/audio_processor.py`)
- Standardizes all incoming audio format to **16kHz 16-bit Mono PCM**.
- Performs RMS energy gain normalization ($target\_rms = 0.10$).
- Segments real-time audio streams into sliding time windows ($5.0s / 10.0s$ chunks).

### Module 2 — AI Voice Detection (`ai/voice_detector.py`)
- Feature Extraction:
  - Zero-Crossing Rate (ZCR)
  - Spectral Centroid
  - Spectral Bandwidth
  - Spectral Rolloff (85% energy point)
  - Pitch & Energy Variance (Vocoder static artifact metric)
  - High-frequency phase instability (> 4000Hz vocoder attenuation)
- Outputs `real_probability`, `synthetic_probability`, `confidence`, and `classification` (`REAL` / `SYNTHETIC` / `UNCERTAIN`).

### Module 3 — Speaker Verification (`ai/speaker_verifier.py`)
- Generates 128-dimensional acoustic d-vector embedding representation.
- Calculates normalized Cosine Similarity against enrolled reference profile vector:
  $$\text{Cosine Similarity} = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
- Status: `MATCH` ($\ge 0.72$), `MISMATCH` ($< 0.72$), or `UNKNOWN`.

### Module 4 — Speech-to-Text ASR (`ai/speech_to_text.py`)
- Automatic speech recognition supporting English, Hindi, and Hinglish code-switching.
- Generates timestamped utterances and transcript string.

### Module 5 — Context Analysis (`ai/context_analyzer.py`)
- Rule + NLP hybrid classifier for social engineering intent vectors:
  - OTP Theft
  - Financial & UPI Transfer Demands
  - Credential & Card Harvests
  - Remote Access Requests (AnyDesk, TeamViewer)
  - Impersonation Category (`BANK`, `POLICE`, `GOVERNMENT`, `FAMILY`, `TECH_SUPPORT`)
  - Urgency & Secrecy Scores

### Module 6 — Dynamic Risk Engine (`ai/risk_engine.py`)
- Multi-signal weighted scoring formula (0–100 scale):
  - Synthetic AI Voice Probability (Max 30 pts)
  - Speaker Mismatch (Max 25 pts)
  - Social Engineering Score (Max 20 pts)
  - Explicit High-Risk Intent (Max 15 pts)
  - Urgency & Secrecy (Max 10 pts)
- Severity Mapping:
  - **0–20:** LOW
  - **21–40:** GUARDED
  - **41–60:** MODERATE
  - **61–80:** HIGH
  - **81–100:** CRITICAL

### Module 7 — Threat Classifier & Recommendations (`ai/threat_classifier.py`)
- Maps scores and signals to threat categories (`CRITICAL_IMPERSONATION`, `VOICE_CLONING`, `BANK_IMPERSONATION`, `FINANCIAL_FRAUD`, etc.).
- Issues plain-English actionable security advisories for end users.
