"""
VIGIL — Real-Time WebSocket Audio Handler

Endpoints:
    /ws/analyze
    /ws/live-monitor

Receives:
    - Real microphone audio chunks
    - Live transcript text
    - Session/control messages

Returns:
    - Voice analysis
    - Conversation/context analysis
    - Risk score
    - Threat level
    - Security recommendation

IMPORTANT:
This module does NOT generate fake/synthetic microphone data.
"""

import base64
import json
import uuid
from datetime import datetime, timezone

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ai.pipeline import VigilAIPipeline


router = APIRouter()

# Load the VIGIL AI pipeline once.
pipeline = VigilAIPipeline()


def safe_float(value, default=0.0):
    """
    Safely convert a value to float.
    """
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def clamp(value, minimum=0.0, maximum=1.0):
    """
    Keep a numeric value inside a safe range.
    """
    return max(
        minimum,
        min(maximum, value)
    )


def make_timestamp():
    """
    UTC timestamp for WebSocket responses.
    """
    return datetime.now(
        timezone.utc
    ).isoformat()


def normalize_result(result):
    """
    Convert pipeline output into a JSON-safe dictionary.

    The existing pipeline may return numpy values.
    Those values cannot always be serialized directly
    by FastAPI.
    """

    if result is None:
        return {}

    if isinstance(result, dict):
        normalized = {}

        for key, value in result.items():

            if isinstance(
                value,
                np.generic
            ):
                normalized[key] = value.item()

            elif isinstance(
                value,
                np.ndarray
            ):
                normalized[key] = value.tolist()

            elif isinstance(
                value,
                dict
            ):
                normalized[key] = normalize_result(
                    value
                )

            elif isinstance(
                value,
                list
            ):
                normalized[key] = [
                    (
                        item.item()
                        if isinstance(
                            item,
                            np.generic
                        )
                        else item
                    )
                    for item in value
                ]

            else:
                normalized[key] = value

        return normalized

    if isinstance(
        result,
        np.generic
    ):
        return result.item()

    return result


def get_value(
    data,
    possible_keys,
    default=None
):
    """
    Retrieve the first available key from a dictionary.
    """
    if not isinstance(data, dict):
        return default

    for key in possible_keys:
        if key in data:
            return data[key]

    return default


async def handle_connection(
    websocket: WebSocket
):
    """
    Shared WebSocket implementation.

    Both:

        /ws/analyze
        /ws/live-monitor

    use this handler.
    """

    await websocket.accept()

    session_id = str(
        uuid.uuid4()
    )

    target_speaker_id = None

    print(
        f"[VIGIL WS] Client connected. "
        f"Session={session_id}"
    )

    # ---------------------------------------------------------
    # Send connection confirmation
    # ---------------------------------------------------------

    await websocket.send_json(
        {
            "type": "ready",
            "session_id": session_id,
            "status": "CONNECTED",
            "timestamp": make_timestamp(),
        }
    )

    try:

        while True:

            message = await websocket.receive()

            # =================================================
            # BINARY MESSAGE
            # =================================================

            if message.get("bytes") is not None:

                audio_bytes = message["bytes"]

                if not audio_bytes:
                    continue

                print(
                    f"[VIGIL WS] Received binary "
                    f"audio: {len(audio_bytes)} bytes"
                )

                /*
                Binary audio is acknowledged here.
                The browser implementation currently
                sends audio as base64 JSON, so this
                branch is primarily for future raw
                WebSocket audio support.
                */

                await websocket.send_json(
                    {
                        "type": "audio_received",
                        "session_id": session_id,
                        "bytes_received": len(
                            audio_bytes
                        ),
                        "timestamp": make_timestamp(),
                    }
                )

                continue

            # =================================================
            # TEXT MESSAGE
            # =================================================

            data_text = message.get("text")

            if not data_text:
                continue

            try:
                payload = json.loads(
                    data_text
                )

            except json.JSONDecodeError:

                await websocket.send_json(
                    {
                        "type": "error",
                        "session_id": session_id,
                        "error": "Invalid JSON payload.",
                    }
                )

                continue

            if not isinstance(
                payload,
                dict
            ):
                await websocket.send_json(
                    {
                        "type": "error",
                        "session_id": session_id,
                        "error": "WebSocket payload must be a JSON object.",
                    }
                )

                continue

            # -------------------------------------------------
            # Message information
            # -------------------------------------------------

            msg_type = payload.get(
                "type",
                "audio_chunk"
            )

            target_speaker_id = (
                payload.get(
                    "target_speaker_id"
                )
                or payload.get(
                    "speaker_id"
                )
                or target_speaker_id
            )

            custom_text = payload.get(
                "text"
            )

            # =================================================
            # PING
            # =================================================

            if msg_type == "ping":

                await websocket.send_json(
                    {
                        "type": "pong",
                        "session_id": session_id,
                        "status": "ACTIVE",
                        "timestamp": make_timestamp(),
                    }
                )

                continue

            # =================================================
            # START SESSION
            # =================================================

            if msg_type in {
                "start",
                "start_session"
            }:

                target_speaker_id = (
                    payload.get(
                        "target_speaker_id"
                    )
                    or payload.get(
                        "speaker_id"
                    )
                )

                await websocket.send_json(
                    {
                        "type": "session_started",
                        "session_id": session_id,
                        "target_speaker_id":
                            target_speaker_id,
                        "status": "LISTENING",
                        "timestamp": make_timestamp(),
                    }
                )

                continue

            # =================================================
            # STOP SESSION
            # =================================================

            if msg_type in {
                "stop",
                "stop_session"
            }:

                await websocket.send_json(
                    {
                        "type": "session_stopped",
                        "session_id": session_id,
                        "status": "STOPPED",
                        "timestamp": make_timestamp(),
                    }
                )

                break

            # =================================================
            # TRANSCRIPT ONLY
            # =================================================

            if msg_type == "transcript":

                if not custom_text:
                    continue

                try:

                    chunk_result = (
                        pipeline.process_audio_chunk(
                            chunk_samples=np.zeros(
                                160,
                                dtype=np.float32
                            ),
                            sample_rate=16000,
                            target_speaker_id=
                                target_speaker_id,
                            custom_text=
                                custom_text
                        )
                    )

                    result = normalize_result(
                        chunk_result
                    )

                    await websocket.send_json(
                        {
                            "type": "analysis_frame",
                            "session_id": session_id,
                            "timestamp":
                                make_timestamp(),
                            "transcript":
                                custom_text,
                            "results":
                                result,
                        }
                    )

                except Exception as error:

                    print(
                        "[VIGIL WS] "
                        f"Transcript analysis error: {error}"
                    )

                    await websocket.send_json(
                        {
                            "type": "analysis_error",
                            "session_id":
                                session_id,
                            "timestamp":
                                make_timestamp(),
                            "error":
                                "Transcript analysis failed.",
                        }
                    )

                continue

            # =================================================
            # AUDIO CHUNK
            # =================================================

            raw_audio_b64 = (
                payload.get(
                    "audio_b64"
                )
                or payload.get(
                    "audio"
                )
            )

            if not raw_audio_b64:

                /*
                Do not generate fake audio.
                */

                if custom_text:

                    try:

                        chunk_result = (
                            pipeline.process_audio_chunk(
                                chunk_samples=np.zeros(
                                    160,
                                    dtype=np.float32
                                ),
                                sample_rate=16000,
                                target_speaker_id=
                                    target_speaker_id,
                                custom_text=
                                    custom_text
                            )
                        )

                        result = normalize_result(
                            chunk_result
                        )

                        await websocket.send_json(
                            {
                                "type":
                                    "analysis_frame",
                                "session_id":
                                    session_id,
                                "timestamp":
                                    make_timestamp(),
                                "transcript":
                                    custom_text,
                                "results":
                                    result,
                            }
                        )

                    except Exception as error:

                        print(
                            "[VIGIL WS] "
                            f"Text-only processing error: {error}"
                        )

                continue

            # =================================================
            # DECODE BASE64
            # =================================================

            try:

                audio_bytes = base64.b64decode(
                    raw_audio_b64,
                    validate=True
                )

            except Exception as error:

                print(
                    "[VIGIL WS] "
                    f"Invalid base64 audio: {error}"
                )

                await websocket.send_json(
                    {
                        "type":
                            "analysis_error",
                        "session_id":
                            session_id,
                        "timestamp":
                            make_timestamp(),
                        "error":
                            "Invalid base64 audio data.",
                    }
                )

                continue

            if not audio_bytes:

                continue

            # =================================================
            # AUDIO PROCESSING
            # =================================================

            try:

                extracted = (
                    pipeline.audio_processor
                    .extract_raw_pcm(
                        audio_bytes
                    )
                )

                if not extracted:
                    raise ValueError(
                        "Audio processor returned no data."
                    )

                chunk_samples = None
                sample_rate = 16000
                metadata = {}

                # -------------------------------------------------
                # Support tuple returned by current audio processor
                # -------------------------------------------------

                if isinstance(
                    extracted,
                    tuple
                ):

                    if len(extracted) >= 1:
                        chunk_samples = (
                            extracted[0]
                        )

                    if len(extracted) >= 2:
                        sample_rate = (
                            extracted[1]
                            or 16000
                        )

                    if len(extracted) >= 3:
                        metadata = (
                            extracted[2]
                            or {}
                        )

                else:

                    chunk_samples = extracted

                if chunk_samples is None:
                    raise ValueError(
                        "No PCM samples extracted."
                    )

                chunk_samples = np.asarray(
                    chunk_samples,
                    dtype=np.float32
                )

                if chunk_samples.size == 0:
                    raise ValueError(
                        "Audio chunk contains no samples."
                    )

                # -------------------------------------------------
                # Normalize audio safely
                # -------------------------------------------------

                max_abs = float(
                    np.max(
                        np.abs(
                            chunk_samples
                        )
                    )
                )

                if max_abs > 1.0:

                    chunk_samples = (
                        chunk_samples /
                        max_abs
                    )

                sample_rate = int(
                    safe_float(
                        sample_rate,
                        16000
                    )
                )

                # =================================================
                # RUN VIGIL AI PIPELINE
                # =================================================

                chunk_result = (
                    pipeline.process_audio_chunk(
                        chunk_samples=
                            chunk_samples,
                        sample_rate=
                            sample_rate,
                        target_speaker_id=
                            target_speaker_id,
                        custom_text=
                            custom_text
                    )
                )

                result = normalize_result(
                    chunk_result
                )

                # =================================================
                # SEND ANALYSIS
                # =================================================

                await websocket.send_json(
                    {
                        "type":
                            "analysis_frame",
                        "session_id":
                            session_id,
                        "timestamp":
                            payload.get(
                                "timestamp"
                            )
                            or make_timestamp(),
                        "audio_samples":
                            int(
                                chunk_samples.size
                            ),
                        "sample_rate":
                            sample_rate,
                        "results":
                            result,
                    }
                )

            except Exception as error:

                print(
                    "[VIGIL WS] "
                    f"Audio processing error: {error}"
                )

                await websocket.send_json(
                    {
                        "type":
                            "analysis_error",
                        "session_id":
                            session_id,
                        "timestamp":
                            make_timestamp(),
                        "error":
                            "Audio analysis failed.",
                        "details":
                            str(error),
                    }
                )

    except WebSocketDisconnect:

        print(
            f"[VIGIL WS] Client disconnected. "
            f"Session={session_id}"
        )

    except Exception as error:

        print(
            f"[VIGIL WS] Unexpected error "
            f"Session={session_id}: {error}"
        )

        try:

            await websocket.send_json(
                {
                    "type":
                        "server_error",
                    "session_id":
                        session_id,
                    "timestamp":
                        make_timestamp(),
                    "error":
                        "VIGIL WebSocket server error.",
                }
            )

        except Exception:
            pass

        try:
            await websocket.close()
        except Exception:
            pass


# =============================================================
# /ws/analyze
# =============================================================

@router.websocket("/ws/analyze")
async def websocket_analyze_stream(
    websocket: WebSocket
):
    await handle_connection(
        websocket
    )


# =============================================================
# /ws/live-monitor
# =============================================================

@router.websocket("/ws/live-monitor")
async def websocket_live_monitor_stream(
    websocket: WebSocket
):
    await handle_connection(
        websocket
    )
