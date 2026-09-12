"""
VIGIL — End-to-End AI Core Security Pipeline
Orchestrates Audio Processing, Synthetic Detection, Speaker Verification, 
ASR, Context Analysis, Dynamic Risk Engine, and Threat Classifier into a single unified interface.
"""

import numpy as np
from typing import Dict, Any, Optional, List

from ai.audio_processor import AudioProcessor
from ai.voice_detector import VoiceDetector
from ai.speaker_verifier import SpeakerVerifier
from ai.speech_to_text import SpeechToTextEngine
from ai.context_analyzer import ContextAnalyzer
from ai.risk_engine import DynamicRiskEngine
from ai.threat_classifier import ThreatClassifier


class VigilAIPipeline:
    """
    Unified end-to-end security pipeline answering:
    - WHO is speaking?
    - IS the voice authentic?
    - IS this the expected speaker?
    - WHAT is being said?
    - IS the conversation suspicious?
    - WHY is it suspicious?
    - HOW severe is the threat?
    - WHAT should the user do?
    """

    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.voice_detector = VoiceDetector()
        self.speaker_verifier = SpeakerVerifier()
        self.stt_engine = SpeechToTextEngine()
        self.context_analyzer = ContextAnalyzer()
        self.risk_engine = DynamicRiskEngine()
        self.threat_classifier = ThreatClassifier()

    def process_audio_file(
        self, audio_bytes: bytes, filename: str, target_speaker_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete multi-module analysis on an uploaded audio file.
        """
        # Validate format & size
        self.audio_processor.validate_audio(filename, len(audio_bytes))

        # Module 1: Extract PCM & Metadata
        samples, sample_rate, metadata = self.audio_processor.extract_raw_pcm(audio_bytes)
        normalized_samples = self.audio_processor.normalize_audio(samples)

        # Module 2: AI Voice Detection
        voice_result = self.voice_detector.predict(normalized_samples, sample_rate, metadata)

        # Module 3: Speaker Verification
        if target_speaker_id and target_speaker_id in self.speaker_verifier.speaker_profiles:
            speaker_result = self.speaker_verifier.verify_speaker(target_speaker_id, normalized_samples, sample_rate)
        else:
            speaker_result = {
                "similarity": 0.50,
                "verified": False,
                "status": "UNKNOWN",
                "confidence": 0.50,
                "message": "No trusted speaker profile specified for verification."
            }

        # Module 4: Speech to Text (ASR)
        stt_result = self.stt_engine.transcribe(normalized_samples, sample_rate)

        # Module 5: Context Analysis
        context_result = self.context_analyzer.analyze_transcript(stt_result["transcript"])

        # Module 6: Dynamic Risk Engine
        risk_result = self.risk_engine.evaluate_risk(voice_result, speaker_result, context_result)

        # Module 7: Threat Classification & Actions
        threat_result = self.threat_classifier.classify_threats(
            risk_result, voice_result, speaker_result, context_result
        )

        return {
            "metadata": metadata,
            "voice_authenticity": voice_result,
            "speaker_verification": speaker_result,
            "transcription": stt_result,
            "context_analysis": context_result,
            "risk_assessment": risk_result,
            "threat_classification": threat_result
        }

    def process_audio_chunk(
        self, chunk_samples: np.ndarray, sample_rate: int = 16000, target_speaker_id: Optional[str] = None, custom_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes a real-time sliding audio chunk (e.g. 5s window) from WebSocket stream.
        """
        norm_samples = self.audio_processor.normalize_audio(chunk_samples)

        voice_result = self.voice_detector.predict(norm_samples, sample_rate)

        if target_speaker_id and target_speaker_id in self.speaker_verifier.speaker_profiles:
            speaker_result = self.speaker_verifier.verify_speaker(target_speaker_id, norm_samples, sample_rate)
        else:
            speaker_result = {"similarity": 0.50, "verified": False, "status": "UNKNOWN", "confidence": 0.50}

        stt_result = self.stt_engine.transcribe(norm_samples, sample_rate)
        transcript = custom_text if custom_text else stt_result["transcript"]

        context_result = self.context_analyzer.analyze_transcript(transcript)
        risk_result = self.risk_engine.evaluate_risk(voice_result, speaker_result, context_result)
        threat_result = self.threat_classifier.classify_threats(risk_result, voice_result, speaker_result, context_result)

        return {
            "voice_authenticity": voice_result,
            "speaker_verification": speaker_result,
            "transcript": transcript,
            "context_analysis": context_result,
            "risk_assessment": risk_result,
            "threat_classification": threat_result
        }
