"""
VIGIL — Module 3: Speaker Verification Engine

Provides acoustic speaker verification when a trusted speaker profile
has been enrolled.

No enrollment = NOT_ENROLLED, not a mismatch.
"""

from typing import Dict, Any, List, Optional

import numpy as np


class SpeakerVerifier:

    def __init__(
        self,
        match_threshold: float = 0.72
    ):
        self.match_threshold = match_threshold
        self.speaker_profiles: Dict[str, Dict[str, Any]] = {}

    def extract_speaker_embedding(
        self,
        samples: np.ndarray,
        sample_rate: int = 16000
    ) -> np.ndarray:

        if samples is None or len(samples) < 512:
            return np.zeros(
                128,
                dtype=np.float32
            )

        frame_len = max(
            len(samples) // 8,
            64
        )

        embedding = []

        for i in range(8):

            start = i * frame_len
            end = min(
                start + frame_len,
                len(samples)
            )

            chunk = samples[start:end]

            if len(chunk) == 0:
                embedding.extend(
                    [0.0] * 16
                )
                continue

            fft_values = np.abs(
                np.fft.rfft(chunk)
            )

            bands = np.array_split(
                fft_values,
                16
            )

            energies = [
                np.log1p(
                    np.sum(band ** 2)
                )
                for band in bands
            ]

            embedding.extend(energies)

        vector = np.array(
            embedding,
            dtype=np.float32
        )

        norm = np.linalg.norm(vector)

        if norm > 1e-6:
            vector /= norm

        return vector

    def register_speaker(
        self,
        speaker_id: str,
        name: str,
        audio_samples_list: List[np.ndarray],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:

        if not audio_samples_list:
            raise ValueError(
                "At least one audio sample is required."
            )

        embeddings = [
            self.extract_speaker_embedding(sample)
            for sample in audio_samples_list
        ]

        average = np.mean(
            embeddings,
            axis=0
        )

        norm = np.linalg.norm(
            average
        )

        if norm > 1e-6:
            average /= norm

        self.speaker_profiles[speaker_id] = {
            "speaker_id": speaker_id,
            "name": name,
            "sample_count": len(
                audio_samples_list
            ),
            "embedding": average.tolist(),
            "metadata": metadata or {},
        }

        return {
            "speaker_id": speaker_id,
            "name": name,
            "registered": True,
            "sample_count": len(
                audio_samples_list
            ),
            "status": "ENROLLED",
        }

    def compute_similarity(
        self,
        embedding_a: np.ndarray,
        embedding_b: np.ndarray
    ) -> float:

        norm_a = np.linalg.norm(
            embedding_a
        )

        norm_b = np.linalg.norm(
            embedding_b
        )

        if norm_a < 1e-6 or norm_b < 1e-6:
            return 0.0

        similarity = float(
            np.dot(
                embedding_a,
                embedding_b
            ) / (norm_a * norm_b)
        )

        return float(
            np.clip(
                similarity,
                0.0,
                1.0
            )
        )

    def verify_speaker(
        self,
        speaker_id: str,
        samples: np.ndarray,
        sample_rate: int = 16000
    ) -> Dict[str, Any]:

        if not speaker_id:
            return {
                "similarity": None,
                "verified": None,
                "status": "NOT_ENROLLED",
                "confidence": 0.0,
                "message": (
                    "No trusted speaker profile selected."
                ),
            }

        if speaker_id not in self.speaker_profiles:
            return {
                "similarity": None,
                "verified": None,
                "status": "NOT_ENROLLED",
                "confidence": 0.0,
                "message": (
                    f"Speaker profile '{speaker_id}' "
                    "is not enrolled."
                ),
            }

        profile = self.speaker_profiles[
            speaker_id
        ]

        reference = np.array(
            profile["embedding"],
            dtype=np.float32
        )

        test_embedding = (
            self.extract_speaker_embedding(
                samples,
                sample_rate
            )
        )

        similarity = self.compute_similarity(
            reference,
            test_embedding
        )

        similarity = round(
            similarity,
            2
        )

        verified = (
            similarity >= self.match_threshold
        )

        status = (
            "MATCH"
            if verified
            else "MISMATCH"
        )

        confidence = round(
            min(
                0.70 + similarity * 0.28,
                0.98
            ),
            2
        )

        return {
            "similarity": similarity,
            "verified": verified,
            "status": status,
            "confidence": confidence,
            "speaker_id": speaker_id,
            "speaker_name": profile["name"],
        }
