"""
VIGIL — Module 4: Speech-to-Text Engine

The browser performs real-time speech recognition for the live monitor.
The backend can optionally use Faster-Whisper when configured.

IMPORTANT:
No fabricated transcript is ever returned.
"""

from typing import Dict, Any, Optional

import numpy as np


class SpeechToTextEngine:

    def __init__(
        self,
        default_language: str = "English"
    ):
        self.default_language = default_language
        self._whisper_model = None

    def transcribe(
        self,
        samples: np.ndarray,
        sample_rate: int = 16000,
        context_prompt: Optional[str] = None
    ) -> Dict[str, Any]:

        if samples is None or len(samples) < 512:
            return {
                "transcript": "",
                "language": self.default_language,
                "confidence": 0.0,
                "segments": [],
                "source": "backend"
            }

        energy = float(
            np.sqrt(
                np.mean(
                    samples.astype(np.float32) ** 2
                )
            )
        )

        if energy < 1e-4:
            return {
                "transcript": "",
                "language": self.default_language,
                "confidence": 0.0,
                "segments": [],
                "source": "backend"
            }

        # Optional Faster-Whisper integration.
        if self._whisper_model is not None:
            try:

                segments, info = (
                    self._whisper_model.transcribe(
                        samples,
                        language=None
                    )
                )

                segment_list = list(segments)

                transcript = " ".join(
                    segment.text.strip()
                    for segment in segment_list
                    if segment.text
                ).strip()

                return {
                    "transcript": transcript,
                    "language": (
                        info.language.capitalize()
                        if info.language
                        else self.default_language
                    ),
                    "confidence": round(
                        float(info.language_probability),
                        2
                    ),
                    "segments": [
                        {
                            "start": float(segment.start),
                            "end": float(segment.end),
                            "text": segment.text.strip(),
                        }
                        for segment in segment_list
                    ],
                    "source": "faster-whisper"
                }

            except Exception:
                pass

        # DO NOT fabricate speech.
        return {
            "transcript": "",
            "language": self.default_language,
            "confidence": 0.0,
            "segments": [],
            "source": "browser-required"
        }
