# Smart India Hackathon (SIH) 2026 Judge Demonstration Guide

## 3-5 Minute Live Jury Presentation Flow

Follow this sequence to present VIGIL to SIH judges:

---

### Step 1: System Introduction (30 seconds)
- Open VIGIL Overview Dashboard (`http://localhost:3000`).
- Explain: *"VIGIL is not just a deepfake detector—it is a complete Voice Impersonation Defense System combining acoustic voice authenticity, biometric speaker verification, speech-to-text NLP intent analysis, and dynamic risk scoring."*

---

### Step 2: Genuine Call Baseline Demo (45 seconds)
- Navigate to **SIH Demo Mode** -> Select **Scenario 1: Genuine Customer Call**.
- Show the jury:
  - Voice: **REAL** (92% Probability)
  - Speaker Match: **MATCH** (94% Similarity)
  - Risk Score: **12 / 100 — LOW**
  - Action Advisory: *"Conversation appears normal."*

---

### Step 3: AI Voice Clone Attack Demo (45 seconds)
- Select **Scenario 2: AI Voice Clone Attack**.
- Highlight:
  - Voice: **SYNTHETIC** (94% AI Probability)
  - Speaker Match: **MISMATCH** (38% Similarity)
  - Risk Score: **78 / 100 — HIGH**

---

### Step 4: Bank Impersonation & OTP Scam (60 seconds)
- Select **Scenario 3: Bank Impersonation & OTP Scam**.
- Show live risk escalation:
  - Transcript: *"Sir your bank account will be blocked today immediately! Read out the OTP code right now to stop legal action."*
  - Identified Flags: `OTP_REQUEST`, `URGENCY_DETECTED`, `BANK_IMPERSONATION`
  - Risk Score: **94 / 100 — CRITICAL**
  - Explainable Breakdown: Lists exact factors (Synthetic voice + Mismatch + OTP + Bank impersonation).
  - Action Advisory: *"CRITICAL THREAT! Do NOT share OTP, PIN or credentials."*

---

### Step 5: Live Monitor & Conclusion (30 seconds)
- Navigate to **Live Monitor** screen.
- Show the live audio waveform visualizer and WebSocket real-time sliding chunk evaluation.
- Conclude: VIGIL correlates multiple signals to prevent voice financial fraud in real time.
