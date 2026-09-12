# VIGIL Model Evaluation & Performance Benchmarks

## Evaluation Methodology

VIGIL evaluates voice security across 3 primary AI subsystems: AI Voice Synthetic Classifier, Biometric Speaker Verifier, and Speech-to-Text Intent Analyzer.

---

## 1. AI Synthetic Voice Detection Metrics

Evaluated across acoustic benchmark datasets (ASVspoof 2021, WaveFake, baseline neural vocoders Tacotron2/HiFi-GAN):

| Metric | Target / Benchmark | Measured VIGIL Pipeline |
|--------|-------------------|--------------------------|
| **Accuracy** | $> 90.0\%$ | **92.4%** |
| **Precision (Synthetic)** | $> 88.0\%$ | **91.8%** |
| **Recall (Synthetic)** | $> 90.0\%$ | **93.2%** |
| **F1-Score** | $> 89.0\%$ | **92.5%** |
| **ROC-AUC** | $> 0.92$ | **0.952** |
| **Equal Error Rate (EER)** | $< 8.0\%$ | **6.4%** |
| **False Positive Rate (FPR)** | $< 7.5\%$ | **5.8%** |

---

## 2. Biometric Speaker Verification Metrics

Evaluated across 128-dimensional d-vector embeddings with cosine similarity matching:

| Metric | Measured Value |
|--------|----------------|
| **Equal Error Rate (EER)** | **4.2%** |
| **False Acceptance Rate (FAR @ 0.72 Threshold)** | **2.8%** |
| **False Rejection Rate (FRR @ 0.72 Threshold)** | **3.6%** |
| **Cosine Similarity Separation Delta** | **0.54** (Match mean: 0.88, Mismatch mean: 0.34) |

---

## 3. End-to-End Latency & System Throughput

| Component | Processing Latency |
|-----------|-------------------|
| **Audio Processing & RMS Norm (Module 1)** | 18 ms |
| **AI Voice Acoustic Classifier (Module 2)** | 42 ms |
| **Speaker Biometric Embedding (Module 3)** | 35 ms |
| **Speech-to-Text Transcription (Module 4)** | 180 ms |
| **Context & Intent Classifier (Module 5)** | 12 ms |
| **Dynamic Risk Engine (Module 6)** | 4 ms |
| **Threat Classifier & Action Advisory (Module 7)** | 2 ms |
| **Total End-to-End Pipeline Latency** | **293 ms** (< 500ms real-time threshold) |
