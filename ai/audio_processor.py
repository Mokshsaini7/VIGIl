"""
VIGIL — Module 1: Audio Processing Engine

Handles:
- WAV decoding
- Raw PCM16 decoding for real-time microphone streaming
- Audio validation
- Normalization
- Chunk segmentation
- Audio metadata extraction
"""

import io
import struct
import wave
from typing import Dict, Any, Tuple, List

import numpy as np


SUPPORTED_FORMATS = {
    ".wav",
    ".mp3",
    ".ogg",
    ".flac",
    ".m4a",
    ".webm",
}

STANDARD_SAMPLE_RATE = 16000
DEFAULT_CHUNK_DURATION = 5.0


class AudioProcessingError(Exception):
    """Custom exception for audio processing failures."""
    pass


class AudioProcessor:
    """Core audio validation, decoding, normalization and chunking engine."""

    def __init__(self, target_sample_rate: int = STANDARD_SAMPLE_RATE):
        self.target_sample_rate = target_sample_rate

    # ---------------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------------

    def validate_audio(
        self,
        filename: str,
        file_size: int,
        max_size_mb: int = 25
    ) -> bool:

        ext = (
            "." + filename.split(".")[-1].lower()
            if "." in filename
            else ""
        )

        if ext not in SUPPORTED_FORMATS:
            raise AudioProcessingError(
                f"Unsupported audio format '{ext}'. "
                f"Supported formats: {', '.join(sorted(SUPPORTED_FORMATS))}"
            )

        if file_size > max_size_mb * 1024 * 1024:
            raise AudioProcessingError(
                f"File size exceeds maximum limit of {max_size_mb} MB"
            )

        return True

    # ---------------------------------------------------------
    # RAW PCM16 DECODER
    # ---------------------------------------------------------

    def decode_pcm16(
        self,
        audio_bytes: bytes,
        sample_rate: int = STANDARD_SAMPLE_RATE,
        channels: int = 1
    ) -> Tuple[np.ndarray, int, Dict[str, Any]]:

        if not audio_bytes:
            return (
                np.array([], dtype=np.float32),
                sample_rate,
                self._empty_metadata(sample_rate)
            )

        if channels < 1:
            channels = 1

        # PCM16 = 2 bytes per sample.
        valid_length = len(audio_bytes) - (len(audio_bytes) % 2)

        if valid_length <= 0:
            return (
                np.array([], dtype=np.float32),
                sample_rate,
                self._empty_metadata(sample_rate)
            )

        samples = np.frombuffer(
            audio_bytes[:valid_length],
            dtype="<i2"
        ).astype(np.float32)

        samples /= 32768.0

        # Convert stereo/multichannel → mono.
        if channels > 1:
            usable = len(samples) - (len(samples) % channels)

            if usable <= 0:
                samples = np.array([], dtype=np.float32)
            else:
                samples = samples[:usable]
                samples = samples.reshape(-1, channels).mean(axis=1)

        samples = np.clip(samples, -1.0, 1.0)

        duration = (
            len(samples) / float(sample_rate)
            if sample_rate > 0
            else 0.0
        )

        rms = (
            float(np.sqrt(np.mean(samples ** 2)))
            if len(samples) > 0
            else 0.0
        )

        metadata = {
            "channels": channels,
            "sample_rate": sample_rate,
            "sample_width": 2,
            "encoding": "PCM16_LE",
            "n_frames": len(samples),
            "duration": round(duration, 3),
            "rms_energy": round(rms, 5),
        }

        return samples, sample_rate, metadata

    # ---------------------------------------------------------
    # WAV DECODER
    # ---------------------------------------------------------

    def extract_raw_pcm(
        self,
        audio_bytes: bytes
    ) -> Tuple[np.ndarray, int, Dict[str, Any]]:

        if not audio_bytes:
            raise AudioProcessingError("Audio payload is empty.")

        try:
            with wave.open(io.BytesIO(audio_bytes), "rb") as wf:

                n_channels = wf.getnchannels()
                sample_rate = wf.getframerate()
                sample_width = wf.getsampwidth()
                n_frames = wf.getnframes()

                raw_data = wf.readframes(n_frames)

                if sample_width == 2:
                    dtype = np.int16
                elif sample_width == 4:
                    dtype = np.int32
                elif sample_width == 1:
                    dtype = np.uint8
                else:
                    raise AudioProcessingError(
                        f"Unsupported WAV sample width: {sample_width}"
                    )

                samples = np.frombuffer(
                    raw_data,
                    dtype=dtype
                ).astype(np.float32)

                if sample_width == 2:
                    samples /= 32768.0

                elif sample_width == 4:
                    samples /= 2147483648.0

                elif sample_width == 1:
                    samples = (samples - 128.0) / 128.0

                if n_channels > 1:
                    samples = samples.reshape(
                        -1,
                        n_channels
                    ).mean(axis=1)

                samples = np.clip(samples, -1.0, 1.0)

                duration = (
                    n_frames / float(sample_rate)
                    if sample_rate > 0
                    else 0.0
                )

                rms = (
                    float(np.sqrt(np.mean(samples ** 2)))
                    if len(samples) > 0
                    else 0.0
                )

                metadata = {
                    "channels": n_channels,
                    "sample_rate": sample_rate,
                    "sample_width": sample_width,
                    "encoding": "WAV_PCM",
                    "n_frames": len(samples),
                    "duration": round(duration, 3),
                    "rms_energy": round(rms, 5),
                }

                return samples, sample_rate, metadata

        except (wave.Error, EOFError, ValueError) as exc:
            raise AudioProcessingError(
                "Invalid or unsupported WAV audio payload."
            ) from exc

    # ---------------------------------------------------------
    # NORMALIZATION
    # ---------------------------------------------------------

    def normalize_audio(
        self,
        samples: np.ndarray,
        target_rms: float = 0.1
    ) -> np.ndarray:

        if samples is None or len(samples) == 0:
            return np.array([], dtype=np.float32)

        samples = np.asarray(
            samples,
            dtype=np.float32
        )

        current_rms = float(
            np.sqrt(np.mean(samples ** 2))
        )

        if current_rms <= 1e-6:
            return samples

        gain = target_rms / current_rms

        normalized = samples * gain

        return np.clip(
            normalized,
            -1.0,
            1.0
        ).astype(np.float32)

    # ---------------------------------------------------------
    # CHUNKING
    # ---------------------------------------------------------

    def segment_into_chunks(
        self,
        samples: np.ndarray,
        sample_rate: int,
        chunk_duration: float = DEFAULT_CHUNK_DURATION
    ) -> List[Dict[str, Any]]:

        if (
            samples is None
            or len(samples) == 0
            or sample_rate <= 0
            or chunk_duration <= 0
        ):
            return []

        chunk_samples = int(
            chunk_duration * sample_rate
        )

        if chunk_samples <= 0:
            return []

        chunks = []

        for idx, start in enumerate(
            range(0, len(samples), chunk_samples)
        ):

            end = min(
                start + chunk_samples,
                len(samples)
            )

            chunk_data = samples[start:end]

            start_time = start / float(sample_rate)
            end_time = end / float(sample_rate)

            chunks.append({
                "chunk_id": idx + 1,
                "start_time": round(start_time, 3),
                "end_time": round(end_time, 3),
                "duration": round(
                    end_time - start_time,
                    3
                ),
                "sample_count": len(chunk_data),
                "samples": chunk_data,
            })

        return chunks

    # ---------------------------------------------------------
    # WAV GENERATOR
    # ---------------------------------------------------------

    def generate_synthetic_wav_header(
        self,
        pcm_samples: np.ndarray,
        sample_rate: int = STANDARD_SAMPLE_RATE
    ) -> bytes:

        int_samples = (
            np.clip(
                pcm_samples,
                -1.0,
                1.0
            ) * 32767
        ).astype(np.int16)

        pcm_bytes = int_samples.tobytes()

        data_size = len(pcm_bytes)

        header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF",
            36 + data_size,
            b"WAVE",
            b"fmt ",
            16,
            1,
            1,
            sample_rate,
            sample_rate * 2,
            2,
            16,
            b"data",
            data_size,
        )

        return header + pcm_bytes

    # ---------------------------------------------------------
    # INTERNAL
    # ---------------------------------------------------------

    def _empty_metadata(
        self,
        sample_rate: int
    ) -> Dict[str, Any]:

        return {
            "channels": 1,
            "sample_rate": sample_rate,
            "sample_width": 2,
            "encoding": "PCM16_LE",
            "n_frames": 0,
            "duration": 0.0,
            "rms_energy": 0.0,
        }
