"""
VIGIL — Audio Processing Engine

Responsibilities:
- Audio upload validation
- WAV decoding
- Raw PCM16 decoding for real-time microphone streaming
- Audio normalization
- Audio chunk segmentation
- WAV header generation
- Basic audio metadata extraction

This module intentionally does NOT generate synthetic/fake audio.
"""

import io
import struct
import wave
from typing import Dict, Any, Tuple, List, Optional

import numpy as np


# ============================================================
# CONSTANTS
# ============================================================

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


# ============================================================
# CUSTOM EXCEPTION
# ============================================================

class AudioProcessingError(Exception):
    """Raised when audio processing or validation fails."""

    pass


# ============================================================
# AUDIO PROCESSOR
# ============================================================

class AudioProcessor:
    """
    Main audio processing class used by VIGIL.

    Audio internally uses:
        float32
        range approximately [-1.0, 1.0]
        sample rate normally 16000 Hz
        mono channel
    """

    def __init__(
        self,
        target_sample_rate: int = STANDARD_SAMPLE_RATE
    ):
        self.target_sample_rate = target_sample_rate

    # ========================================================
    # VALIDATION
    # ========================================================

    def validate_audio(
        self,
        filename: str,
        file_size: int,
        max_size_mb: int = 25
    ) -> bool:
        """
        Validate uploaded audio filename and file size.
        """

        if not filename:
            raise AudioProcessingError(
                "Audio filename is required."
            )

        filename_lower = filename.lower()

        if "." not in filename_lower:
            raise AudioProcessingError(
                "Audio file must have a valid extension."
            )

        extension = "." + filename_lower.split(".")[-1]

        if extension not in SUPPORTED_FORMATS:
            supported = ", ".join(
                sorted(SUPPORTED_FORMATS)
            )

            raise AudioProcessingError(
                f"Unsupported audio format '{extension}'. "
                f"Supported formats: {supported}"
            )

        if file_size <= 0:
            raise AudioProcessingError(
                "Audio file is empty."
            )

        maximum_bytes = max_size_mb * 1024 * 1024

        if file_size > maximum_bytes:
            raise AudioProcessingError(
                f"Audio file exceeds the maximum "
                f"size of {max_size_mb} MB."
            )

        return True

    # ========================================================
    # EMPTY METADATA
    # ========================================================

    def _empty_metadata(
        self,
        sample_rate: int
    ) -> Dict[str, Any]:
        """
        Return a consistent empty metadata structure.
        """

        return {
            "channels": 1,
            "sample_rate": sample_rate,
            "sample_width": 2,
            "n_frames": 0,
            "duration": 0.0,
            "rms_energy": 0.0,
        }

    # ========================================================
    # RAW PCM16 DECODER
    # ========================================================

    def decode_pcm16(
        self,
        audio_bytes: bytes,
        sample_rate: int = STANDARD_SAMPLE_RATE,
        channels: int = 1
    ) -> Tuple[np.ndarray, int, Dict[str, Any]]:
        """
        Decode raw little-endian PCM16 audio.

        This is used by the browser microphone WebSocket.

        Browser flow:

            Microphone
                ↓
            Float32 audio
                ↓
            PCM16
                ↓
            Base64
                ↓
            WebSocket
                ↓
            decode_pcm16()

        Returns:

            samples:
                numpy float32 array in approximately [-1, 1]

            sample_rate:
                normally 16000

            metadata:
                basic audio information
        """

        if not audio_bytes:
            return (
                np.array([], dtype=np.float32),
                sample_rate,
                self._empty_metadata(sample_rate)
            )

        if sample_rate <= 0:
            raise AudioProcessingError(
                "Sample rate must be greater than zero."
            )

        if channels < 1:
            channels = 1

        # PCM16 = 2 bytes per sample.
        # Ignore a possible incomplete final byte.
        valid_length = len(audio_bytes)

        if valid_length % 2 != 0:
            valid_length -= 1

        if valid_length <= 0:
            return (
                np.array([], dtype=np.float32),
                sample_rate,
                self._empty_metadata(sample_rate)
            )

        try:
            samples = np.frombuffer(
                audio_bytes[:valid_length],
                dtype="<i2"
            ).astype(np.float32)

        except Exception as exc:
            raise AudioProcessingError(
                f"Unable to decode PCM16 audio: {exc}"
            ) from exc

        # Convert int16 to float32 [-1, 1].
        samples /= 32768.0

        # Handle stereo/multi-channel PCM.
        if channels > 1:

            usable_samples = (
                len(samples)
                - (len(samples) % channels)
            )

            if usable_samples <= 0:
                samples = np.array(
                    [],
                    dtype=np.float32
                )

            else:
                samples = samples[:usable_samples]

                samples = samples.reshape(
                    -1,
                    channels
                )

                # Convert multi-channel audio to mono.
                samples = np.mean(
                    samples,
                    axis=1
                ).astype(np.float32)

        samples = np.clip(
            samples,
            -1.0,
            1.0
        ).astype(np.float32)

        if len(samples) > 0:
            rms = float(
                np.sqrt(
                    np.mean(
                        np.square(samples)
                    )
                )
            )
        else:
            rms = 0.0

        duration = (
            len(samples) / float(sample_rate)
            if sample_rate > 0
            else 0.0
        )

        metadata = {
            "channels": channels,
            "sample_rate": sample_rate,
            "sample_width": 2,
            "encoding": "PCM16_LE",
            "n_frames": int(len(samples)),
            "duration": round(duration, 3),
            "rms_energy": round(rms, 5),
        }

        return (
            samples,
            sample_rate,
            metadata
        )

    # ========================================================
    # WAV DECODER
    # ========================================================

    def extract_raw_pcm(
        self,
        audio_bytes: bytes
    ) -> Tuple[np.ndarray, int, Dict[str, Any]]:
        """
        Extract PCM samples from a WAV file.

        Returns:

            samples:
                float32 audio

            sample_rate:
                original WAV sample rate

            metadata:
                WAV information

        Important:
        This method expects an actual WAV container.
        It does NOT fabricate audio when decoding fails.
        """

        if not audio_bytes:
            raise AudioProcessingError(
                "Audio data is empty."
            )

        try:
            with wave.open(
                io.BytesIO(audio_bytes),
                "rb"
            ) as wf:

                n_channels = wf.getnchannels()
                sample_rate = wf.getframerate()
                sample_width = wf.getsampwidth()
                n_frames = wf.getnframes()

                if n_channels <= 0:
                    raise AudioProcessingError(
                        "Invalid number of audio channels."
                    )

                if sample_rate <= 0:
                    raise AudioProcessingError(
                        "Invalid audio sample rate."
                    )

                if sample_width not in (1, 2, 3, 4):
                    raise AudioProcessingError(
                        f"Unsupported WAV sample width: "
                        f"{sample_width} bytes."
                    )

                raw_data = wf.readframes(
                    n_frames
                )

        except AudioProcessingError:
            raise

        except Exception as exc:
            raise AudioProcessingError(
                "Unable to decode WAV audio. "
                "The uploaded file may not be a valid WAV file."
            ) from exc

        # ----------------------------------------------------
        # 8-bit PCM
        # ----------------------------------------------------

        if sample_width == 1:

            samples = np.frombuffer(
                raw_data,
                dtype=np.uint8
            ).astype(np.float32)

            samples = (
                samples - 128.0
            ) / 128.0

        # ----------------------------------------------------
        # 16-bit PCM
        # ----------------------------------------------------

        elif sample_width == 2:

            samples = np.frombuffer(
                raw_data,
                dtype="<i2"
            ).astype(np.float32)

            samples /= 32768.0

        # ----------------------------------------------------
        # 24-bit PCM
        # ----------------------------------------------------

        elif sample_width == 3:

            raw = np.frombuffer(
                raw_data,
                dtype=np.uint8
            )

            usable_length = (
                len(raw)
                - (len(raw) % 3)
            )

            raw = raw[:usable_length]

            if len(raw) == 0:

                samples = np.array(
                    [],
                    dtype=np.float32
                )

            else:

                raw = raw.reshape(
                    -1,
                    3
                )

                values = (
                    raw[:, 0].astype(np.int32)
                    |
                    (raw[:, 1].astype(np.int32) << 8)
                    |
                    (raw[:, 2].astype(np.int32) << 16)
                )

                # Sign extension for 24-bit PCM.
                negative_mask = (
                    values & 0x800000
                ) != 0

                values[negative_mask] -= (
                    1 << 24
                )

                samples = (
                    values.astype(np.float32)
                    / 8388608.0
                )

        # ----------------------------------------------------
        # 32-bit PCM
        # ----------------------------------------------------

        elif sample_width == 4:

            samples = np.frombuffer(
                raw_data,
                dtype="<i4"
            ).astype(np.float32)

            samples /= 2147483648.0

        else:

            raise AudioProcessingError(
                "Unsupported WAV sample format."
            )

        # ----------------------------------------------------
        # Convert multi-channel audio to mono.
        # ----------------------------------------------------

        if n_channels > 1:

            usable_samples = (
                len(samples)
                - (len(samples) % n_channels)
            )

            if usable_samples > 0:

                samples = samples[
                    :usable_samples
                ]

                samples = samples.reshape(
                    -1,
                    n_channels
                )

                samples = np.mean(
                    samples,
                    axis=1
                ).astype(np.float32)

            else:

                samples = np.array(
                    [],
                    dtype=np.float32
                )

        samples = np.clip(
            samples,
            -1.0,
            1.0
        ).astype(np.float32)

        duration = (
            len(samples) / float(sample_rate)
            if sample_rate > 0
            else 0.0
        )

        rms = (
            float(
                np.sqrt(
                    np.mean(
                        np.square(samples)
                    )
                )
            )
            if len(samples) > 0
            else 0.0
        )

        metadata = {
            "channels": n_channels,
            "sample_rate": sample_rate,
            "sample_width": sample_width,
            "n_frames": int(n_frames),
            "duration": round(duration, 3),
            "rms_energy": round(rms, 5),
            "encoding": "PCM",
        }

        return (
            samples,
            sample_rate,
            metadata
        )

    # ========================================================
    # AUDIO NORMALIZATION
    # ========================================================

    def normalize_audio(
        self,
        samples: np.ndarray,
        target_rms: float = 0.1
    ) -> np.ndarray:
        """
        Normalize audio to a reasonable RMS level.

        This prevents extremely quiet microphone signals
        from being treated as useful audio while avoiding
        uncontrolled amplification.
        """

        if samples is None:
            return np.array(
                [],
                dtype=np.float32
            )

        samples = np.asarray(
            samples,
            dtype=np.float32
        )

        if len(samples) == 0:
            return samples

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

        current_rms = float(
            np.sqrt(
                np.mean(
                    np.square(samples)
                )
            )
        )

        if current_rms <= 1e-6:
            return samples

        if target_rms <= 0:
            return samples

        gain = target_rms / current_rms

        # Prevent excessive amplification.
        gain = min(
            gain,
            4.0
        )

        normalized = samples * gain

        return np.clip(
            normalized,
            -1.0,
            1.0
        ).astype(np.float32)

    # ========================================================
    # CHUNK SEGMENTATION
    # ========================================================

    def segment_into_chunks(
        self,
        samples: np.ndarray,
        sample_rate: int = STANDARD_SAMPLE_RATE,
        chunk_duration: float = DEFAULT_CHUNK_DURATION
    ) -> List[np.ndarray]:
        """
        Split audio into fixed-duration chunks.

        Example:

            15 seconds
            ↓
            5 second chunks

            [0-5]
            [5-10]
            [10-15]
        """

        if samples is None:
            return []

        samples = np.asarray(
            samples,
            dtype=np.float32
        )

        if len(samples) == 0:
            return []

        if sample_rate <= 0:
            raise AudioProcessingError(
                "Sample rate must be greater than zero."
            )

        if chunk_duration <= 0:
            raise AudioProcessingError(
                "Chunk duration must be greater than zero."
            )

        chunk_size = int(
            sample_rate * chunk_duration
        )

        if chunk_size <= 0:
            raise AudioProcessingError(
                "Calculated chunk size is invalid."
            )

        chunks: List[np.ndarray] = []

        for start in range(
            0,
            len(samples),
            chunk_size
        ):

            end = min(
                start + chunk_size,
                len(samples)
            )

            chunk = samples[
                start:end
            ]

            if len(chunk) > 0:
                chunks.append(
                    chunk.astype(np.float32)
                )

        return chunks

    # ========================================================
    # GENERATE WAV HEADER
    # ========================================================

    def generate_wav_header(
        self,
        data_size: int,
        sample_rate: int = STANDARD_SAMPLE_RATE,
        channels: int = 1,
        sample_width: int = 2
    ) -> bytes:
        """
        Generate a standard PCM WAV header.

        Useful when converting raw PCM chunks into a WAV
        container for libraries that require WAV input.
        """

        if data_size < 0:
            raise AudioProcessingError(
                "WAV data size cannot be negative."
            )

        if sample_rate <= 0:
            raise AudioProcessingError(
                "Sample rate must be greater than zero."
            )

        if channels <= 0:
            raise AudioProcessingError(
                "Channels must be greater than zero."
            )

        if sample_width <= 0:
            raise AudioProcessingError(
                "Sample width must be greater than zero."
            )

        byte_rate = (
            sample_rate
            * channels
            * sample_width
        )

        block_align = (
            channels
            * sample_width
        )

        riff_size = 36 + data_size

        header = struct.pack(
            "<4sI4s"
            "4sIHHIIHH"
            "4sI",
            b"RIFF",
            riff_size,
            b"WAVE",
            b"fmt ",
            16,
            1,
            channels,
            sample_rate,
            byte_rate,
            block_align,
            sample_width * 8,
            b"data",
            data_size,
        )

        return header

    # ========================================================
    # BACKWARD-COMPATIBILITY ALIAS
    # ========================================================

    def generate_synthetic_wav_header(
        self,
        data_size: int,
        sample_rate: int = STANDARD_SAMPLE_RATE,
        channels: int = 1,
        sample_width: int = 2
    ) -> bytes:
        """
        Backward-compatible method name.

        Despite the historical method name, this method does
        NOT generate synthetic audio. It only generates a
        standard WAV container header.
        """

        return self.generate_wav_header(
            data_size=data_size,
            sample_rate=sample_rate,
            channels=channels,
            sample_width=sample_width,
        )
