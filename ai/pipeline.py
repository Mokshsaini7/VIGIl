"""
VIGIL — End-to-End AI Security Pipeline
"""

from typing import Dict, Any, Optional

import numpy as np

from ai.audio_processor import AudioProcessor
from ai.voice_detector import VoiceDetector
from ai.speaker_verifier import SpeakerVerifier
from ai.speech_to_text import SpeechToTextEngine
from ai.context_analyzer import ContextAnalyzer
from ai.risk_engine import DynamicRiskEngine
from ai.threat_classifier import ThreatClassifier


class VigilAIPipeline:

    def __init__(self):

        self.audio_processor = AudioProcessor()
        self.voice_detector = VoiceDetector()
        self.speaker_verifier = SpeakerVerifier()
        self.stt_engine = SpeechToTextEngine()
        self.context_analyzer = ContextAnalyzer()
        self.risk_engine = DynamicRiskEngine()
        self.threat_classifier = ThreatClassifier()

    def process_audio_chunk(
        self,
        chunk_samples: np.ndarray,
        sample_rate: int = 16000,
        target_speaker_id: Optional[str] = None,
        custom_text: Optional[str] = None,
    ) -> Dict[str, Any]:

        if chunk_samples is None:
            chunk_samples = np.array(
                [],
                dtype=np.float32
            )

        chunk_samples = np.asarray(
            chunk_samples,
            dtype=np.float32
        )

        normalized = (
            self.audio_processor.normalize_audio(
                chunk_samples
            )
        )

        # -----------------------------
        # Voice authenticity
        # -----------------------------

        if len(normalized) >= 512:

            voice_result = (
                self.voice_detector.predict(
                    normalized,
                    sample_rate
                )
            )

        else:

            voice_result = {
                "real_probability": 0.0,
                "synthetic_probability": 0.0,
                "confidence": 0.0,
                "classification": "INSUFFICIENT_AUDIO",
                "acoustic_features": {},
            }

        # -----------------------------
        # Speaker verification
        # -----------------------------

        speaker_result = (
            self.speaker_verifier.verify_speaker(
                target_speaker_id,
                normalized,
                sample_rate
            )
            if target_speaker_id
            else self.speaker_verifier.verify_speaker(
                "",
                normalized,
                sample_rate
            )
        )

        # -----------------------------
        # STT
        # -----------------------------

        stt_result = (
            self.stt_engine.transcribe(
                normalized,
                sample_rate
            )
        )

        transcript = (
            custom_text.strip()
            if custom_text
            else stt_result.get(
                "transcript",
                ""
            )
        )

        # -----------------------------
        # Context analysis
        # -----------------------------

        context_result = (
            self.context_analyzer.analyze_transcript(
                transcript
            )
        )

        # -----------------------------
        # Risk
        # -----------------------------

        risk_result = (
            self.risk_engine.evaluate_risk(
                voice_result,
                speaker_result,
                context_result
            )
        )

        # -----------------------------
        # Threat classification
        # -----------------------------

        threat_result = (
            self.threat_classifier.classify_threats(
                risk_result,
                voice_result,
                speaker_result,
                context_result
            )
        )

        return {
            "voice_authenticity": voice_result,
            "speaker_verification": speaker_result,
            "transcription": {
                **stt_result,
                "transcript": transcript,
            },
            "transcript": transcript,
            "context_analysis": context_result,
            "risk_assessment": risk_result,
            "threat_classification": threat_result,
        }
