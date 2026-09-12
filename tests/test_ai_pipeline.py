"""
Unit tests for VIGIL AI Pipeline & Core Modules (Modules 1-7).
"""

import numpy as np
import pytest
from ai.audio_processor import AudioProcessor
from ai.voice_detector import VoiceDetector
from ai.speaker_verifier import SpeakerVerifier
from ai.speech_to_text import SpeechToTextEngine
from ai.context_analyzer import ContextAnalyzer
from ai.risk_engine import DynamicRiskEngine
from ai.threat_classifier import ThreatClassifier
from ai.pipeline import VigilAIPipeline


def test_audio_processor():
    processor = AudioProcessor(target_sample_rate=16000)
    assert processor.validate_audio("sample.wav", 1024) is True

    # Generate synthetic 16kHz sine wave PCM
    duration = 2.0
    t = np.linspace(0, duration, int(16000 * duration), endpoint=False)
    sine_wave = (np.sin(2 * np.pi * 440 * t) * 0.5).astype(np.float32)

    wav_bytes = processor.generate_synthetic_wav_header(sine_wave, 16000)
    samples, sr, meta = processor.extract_raw_pcm(wav_bytes)

    assert sr == 16000
    assert meta["duration"] > 0
    assert len(samples) > 0


def test_voice_detector():
    detector = VoiceDetector()
    samples = np.random.uniform(-0.5, 0.5, 16000 * 2).astype(np.float32)
    res = detector.predict(samples, 16000)

    assert "real_probability" in res
    assert "synthetic_probability" in res
    assert "classification" in res
    assert res["classification"] in ["REAL", "SYNTHETIC", "UNCERTAIN"]


def test_speaker_verifier():
    verifier = SpeakerVerifier()
    sample1 = np.random.uniform(-0.3, 0.3, 16000 * 2).astype(np.float32)
    sample2 = np.random.uniform(-0.3, 0.3, 16000 * 2).astype(np.float32)

    enrollment = verifier.register_speaker("SPK_001", "John Doe", [sample1, sample2])
    assert enrollment["registered"] is True

    verification = verifier.verify_speaker("SPK_001", sample1, 16000)
    assert verification["status"] in ["MATCH", "MISMATCH"]
    assert verification["similarity"] >= 0.0


def test_context_analyzer():
    analyzer = ContextAnalyzer()

    # Scam transcript test
    transcript = "Sir your bank account will be blocked today immediately. Please tell me the OTP to avoid legal action."
    res = analyzer.analyze_transcript(transcript)

    assert res["otp_request"] is True
    assert res["urgency_score"] > 0.30
    assert res["impersonation_context"] == "BANK"
    assert "OTP_REQUEST" in res["detected_signals"]
    assert res["social_engineering_score"] > 0.50


def test_risk_engine_and_threat_classifier():
    risk_engine = DynamicRiskEngine()
    classifier = ThreatClassifier()

    voice_res = {"synthetic_probability": 0.85, "classification": "SYNTHETIC"}
    speaker_res = {"status": "MISMATCH", "similarity": 0.25}
    context_res = {
        "otp_request": True,
        "money_request": True,
        "credential_request": False,
        "urgency_score": 0.80,
        "secrecy_score": 0.60,
        "impersonation_context": "BANK",
        "social_engineering_score": 0.88,
        "detected_signals": ["OTP_REQUEST", "MONEY_REQUEST", "BANK_IMPERSONATION"]
    }

    risk_eval = risk_engine.evaluate_risk(voice_res, speaker_res, context_res)
    assert risk_eval["risk_score"] >= 80
    assert risk_eval["risk_level"] == "CRITICAL"
    assert len(risk_eval["contributing_factors"]) >= 3

    threat_eval = classifier.classify_threats(risk_eval, voice_res, speaker_res, context_res)
    assert threat_eval["action_code"] == "TERMINATE_CALL_IMMEDIATELY"
    assert "VOICE_CLONING" in threat_eval["threat_categories"]


def test_vigil_ai_pipeline():
    pipeline = VigilAIPipeline()
    sample_pcm = np.sin(np.linspace(0, 100, 16000 * 3)).astype(np.float32)
    wav_bytes = pipeline.audio_processor.generate_synthetic_wav_header(sample_pcm, 16000)

    res = pipeline.process_audio_file(wav_bytes, "test_call.wav")
    assert "risk_assessment" in res
    assert "threat_classification" in res
    assert "voice_authenticity" in res
