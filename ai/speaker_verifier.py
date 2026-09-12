"""
VIGIL — Speaker Verification Engine

Responsibilities:
- Create deterministic speaker embeddings from acoustic features
- Register trusted speaker profiles
- Compare incoming voice samples with enrolled profiles
- Return speaker match / mismatch information

Important:
This is an MVP acoustic speaker-verification baseline.
It is NOT a production-grade biometric model.
A pretrained speaker-embedding model can later replace
the embedding implementation without changing the pipeline API.
"""

from typing import Any, Dict, List, Optional, Tuple

import numpy as np


class SpeakerVerifier:
    """
    VIGIL speaker verification engine.

    The current implementation uses deterministic acoustic
    features to create a lightweight speaker representation.

    No import from ai.pipeline is required here.
    """

    def __init__(
        self,
        match_threshold: float = 0.72
    ):
        self.match_threshold = match_threshold

        # {
        #     "speaker_id": {
        #         "embedding": np.ndarray,
        #         "metadata": {...}
        #     }
        # }
        self.speaker_profiles: Dict[
            str,
            Dict[str, Any]
        ] = {}

    # ========================================================
    # FEATURE EXTRACTION
    # ========================================================

    def extract_speaker_embedding(
        self,
        samples: np.ndarray,
        sample_rate: int = 16000
    ) -> np.ndarray:
        """
        Create a lightweight deterministic speaker embedding.

        This is an MVP baseline based on acoustic characteristics.
        It should not be described as a neural speaker embedding.

        Returns a normalized vector.
        """

        samples = np.asarray(
            samples,
            dtype=np.float32
        )

        if len(samples) == 0:
            return np.zeros(
                32,
                dtype=np.float32
            )

        samples = np.nan_to_num(
            samples,
            nan=0.0,
            posinf=0.0,
            neginf=0.0
        )

        samples = np.clip(
            samples,
            -1.0,
            1.0
        )

        # ----------------------------------------------------
        # Basic statistics
        # ----------------------------------------------------

        mean = float(
            np.mean(samples)
        )

        std = float(
            np.std(samples)
        )

        rms = float(
            np.sqrt(
                np.mean(
                    np.square(samples)
                )
            )
        )

        abs_mean = float(
            np.mean(
                np.abs(samples)
            )
        )

        peak = float(
            np.max(
                np.abs(samples)
            )
        )

        # ----------------------------------------------------
        # Zero crossing rate
        # ----------------------------------------------------

        if len(samples) > 1:

            signs = np.sign(
                samples
            )

            zcr = float(
                np.mean(
                    np.abs(
                        np.diff(signs)
                    ) > 0
                )
            )

        else:

            zcr = 0.0

        # ----------------------------------------------------
        # Spectral features
        # ----------------------------------------------------

        if len(samples) >= 256:

            fft_size = min(
                len(samples),
                4096
            )

            working = samples[
                :fft_size
            ]

            window = np.hanning(
                len(working)
            )

            windowed = (
                working * window
            )

            spectrum = np.abs(
                np.fft.rfft(
                    windowed
                )
            )

            frequencies = np.fft.rfftfreq(
                len(windowed),
                d=1.0 / sample_rate
            )

            total_energy = float(
                np.sum(spectrum)
            ) + 1e-12

            spectral_centroid = float(
                np.sum(
                    frequencies * spectrum
                ) / total_energy
            )

            spectral_bandwidth = float(
                np.sqrt(
                    np.sum(
                        (
                            frequencies
                            - spectral_centroid
                        ) ** 2
                        * spectrum
                    )
                    / total_energy
                )
            )

            cumulative = np.cumsum(
                spectrum
            )

            rolloff_threshold = (
                0.85
                * total_energy
            )

            rolloff_indices = np.where(
                cumulative
                >= rolloff_threshold
            )[0]

            if len(rolloff_indices) > 0:

                spectral_rolloff = float(
                    frequencies[
                        rolloff_indices[0]
                    ]
                )

            else:

                spectral_rolloff = 0.0

            # Low / mid / high spectral energy.
            low_mask = (
                frequencies < 1000
            )

            mid_mask = (
                (frequencies >= 1000)
                & (frequencies < 3000)
            )

            high_mask = (
                frequencies >= 3000
            )

            low_energy = float(
                np.sum(
                    spectrum[low_mask]
                )
            ) / total_energy

            mid_energy = float(
                np.sum(
                    spectrum[mid_mask]
                )
            ) / total_energy

            high_energy = float(
                np.sum(
                    spectrum[high_mask]
                )
            ) / total_energy

        else:

            spectral_centroid = 0.0
            spectral_bandwidth = 0.0
            spectral_rolloff = 0.0
            low_energy = 0.0
            mid_energy = 0.0
            high_energy = 0.0

        # ----------------------------------------------------
        # Frame-level statistics
        # ----------------------------------------------------

        frame_size = 512

        frame_values: List[float] = []

        for start in range(
            0,
            len(samples),
            frame_size
        ):

            frame = samples[
                start:start + frame_size
            ]

            if len(frame) < 64:
                continue

            frame_rms = float(
                np.sqrt(
                    np.mean(
                        np.square(frame)
                    )
                )
            )

            frame_values.append(
                frame_rms
            )

        if len(frame_values) > 1:

            frame_rms_mean = float(
                np.mean(frame_values)
            )

            frame_rms_std = float(
                np.std(frame_values)
            )

        else:

            frame_rms_mean = rms
            frame_rms_std = 0.0

        # ----------------------------------------------------
        # Energy percentiles
        # ----------------------------------------------------

        abs_samples = np.abs(
            samples
        )

        percentile_25 = float(
            np.percentile(
                abs_samples,
                25
            )
        )

        percentile_50 = float(
            np.percentile(
                abs_samples,
                50
            )
        )

        percentile_75 = float(
            np.percentile(
                abs_samples,
                75
            )
        )

        percentile_90 = float(
            np.percentile(
                abs_samples,
                90
            )
        )

        # ----------------------------------------------------
        # Construct embedding
        # ----------------------------------------------------

        embedding = np.array(
            [
                mean,
                std,
                rms,
                abs_mean,
                peak,
                zcr,

                spectral_centroid / 8000.0,
                spectral_bandwidth / 8000.0,
                spectral_rolloff / 8000.0,

                low_energy,
                mid_energy,
                high_energy,

                frame_rms_mean,
                frame_rms_std,

                percentile_25,
                percentile_50,
                percentile_75,
                percentile_90,

                float(len(samples)) / (
                    sample_rate * 10.0
                ),

                # Additional deterministic
                # nonlinear acoustic features.
                mean * mean,
                std * std,
                rms * rms,
                abs_mean * abs_mean,
                peak * peak,

                zcr * zcr,

                low_energy * mid_energy,
                mid_energy * high_energy,
                low_energy * high_energy,

                spectral_centroid
                * spectral_centroid
                / (8000.0 ** 2),

                spectral_bandwidth
                * spectral_bandwidth
                / (8000.0 ** 2),

                spectral_rolloff
                * spectral_rolloff
                / (8000.0 ** 2),

            ],
            dtype=np.float32
        )

        # ----------------------------------------------------
        # Normalize embedding
        # ----------------------------------------------------

        norm = float(
            np.linalg.norm(
                embedding
            )
        )

        if norm > 1e-8:

            embedding = (
                embedding / norm
            ).astype(np.float32)

        else:

            embedding = np.zeros(
                len(embedding),
                dtype=np.float32
            )

        return embedding

    # ========================================================
    # REGISTER SPEAKER
    # ========================================================

    def register_speaker(
        self,
        speaker_id: str,
        samples: np.ndarray,
        sample_rate: int = 16000,
        metadata: Optional[
            Dict[str, Any]
        ] = None
    ) -> Dict[str, Any]:
        """
        Enroll a trusted speaker profile.
        """

        if not speaker_id:
            raise ValueError(
                "speaker_id is required."
            )

        embedding = (
            self.extract_speaker_embedding(
                samples,
                sample_rate
            )
        )

        self.speaker_profiles[
            speaker_id
        ] = {
            "embedding": embedding,
            "metadata": metadata or {},
        }

        return {
            "speaker_id": speaker_id,
            "status": "ENROLLED",
            "embedding_dimensions": int(
                len(embedding)
            ),
            "message": (
                "Speaker profile enrolled "
                "successfully."
            ),
        }

    # ========================================================
    # DELETE SPEAKER
    # ========================================================

    def delete_speaker(
        self,
        speaker_id: str
    ) -> bool:
        """
        Delete an enrolled speaker profile.
        """

        if speaker_id not in self.speaker_profiles:
            return False

        del self.speaker_profiles[
            speaker_id
        ]

        return True

    # ========================================================
    # LIST SPEAKERS
    # ========================================================

    def list_speakers(
        self
    ) -> List[Dict[str, Any]]:
        """
        Return enrolled speaker IDs and metadata.
        """

        profiles = []

        for speaker_id, profile in (
            self.speaker_profiles.items()
        ):

            profiles.append({
                "speaker_id": speaker_id,
                "metadata": profile.get(
                    "metadata",
                    {}
                ),
            })

        return profiles

    # ========================================================
    # COSINE SIMILARITY
    # ========================================================

    def compute_similarity(
        self,
        embedding_a: np.ndarray,
        embedding_b: np.ndarray
    ) -> float:
        """
        Calculate cosine similarity between
        two speaker embeddings.
        """

        embedding_a = np.asarray(
            embedding_a,
            dtype=np.float32
        )

        embedding_b = np.asarray(
            embedding_b,
            dtype=np.float32
        )

        if (
            len(embedding_a) == 0
            or len(embedding_b) == 0
        ):
            return 0.0

        if (
            len(embedding_a)
            != len(embedding_b)
        ):
            return 0.0

        norm_a = float(
            np.linalg.norm(
                embedding_a
            )
        )

        norm_b = float(
            np.linalg.norm(
                embedding_b
            )
        )

        if (
            norm_a <= 1e-8
            or norm_b <= 1e-8
        ):
            return 0.0

        similarity = float(
            np.dot(
                embedding_a,
                embedding_b
            )
            / (
                norm_a * norm_b
            )
        )

        # Numerical safety.
        similarity = max(
            -1.0,
            min(
                1.0,
                similarity
            )
        )

        # Convert [-1, 1] to [0, 1].
        similarity = (
            similarity + 1.0
        ) / 2.0

        return round(
            similarity,
            4
        )

    # ========================================================
    # VERIFY SPEAKER
    # ========================================================

    def verify_speaker(
        self,
        speaker_id: str,
        samples: np.ndarray,
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Compare incoming audio against an enrolled speaker.
        """

        if not speaker_id:

            return {
                "similarity": None,
                "verified": None,
                "status": "NOT_ENROLLED",
                "confidence": 0.0,
                "message": (
                    "No trusted speaker profile "
                    "was selected."
                ),
            }

        if (
            speaker_id
            not in self.speaker_profiles
        ):

            return {
                "similarity": None,
                "verified": None,
                "status": "NOT_ENROLLED",
                "confidence": 0.0,
                "message": (
                    f"Speaker profile "
                    f"'{speaker_id}' was not found."
                ),
            }

        incoming_embedding = (
            self.extract_speaker_embedding(
                samples,
                sample_rate
            )
        )

        stored_embedding = (
            self.speaker_profiles[
                speaker_id
            ]["embedding"]
        )

        similarity = (
            self.compute_similarity(
                incoming_embedding,
                stored_embedding
            )
        )

        verified = (
            similarity
            >= self.match_threshold
        )

        if verified:

            status = "MATCH"

        else:

            status = "MISMATCH"

        # Similarity itself is used as a
        # simple confidence indicator.
        confidence = round(
            max(
                0.0,
                min(
                    1.0,
                    similarity
                )
            ),
            4
        )

        return {
            "similarity": similarity,
            "verified": verified,
            "status": status,
            "confidence": confidence,
            "threshold": self.match_threshold,
            "speaker_id": speaker_id,
        }
