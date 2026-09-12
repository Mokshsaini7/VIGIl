"""
VIGIL — Real-Time WebSocket Audio Handler

Provides:
    /ws/analyze
    /ws/live-monitor

Receives:
    - raw PCM16 microphone audio
    - browser speech-to-text transcript
    - control messages

Returns:
    - voice authenticity analysis
    - speaker verification
    - context analysis
    - dynamic risk score
    - threat classification
"""

import base64
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ai.pipeline import VigilAIPipeline


router = APIRouter()

pipeline = VigilAIPipeline()


# ============================================================
# JSON SERIALIZATION
# ============================================================

def make_json_safe(value: Any) -> Any:
    """
    Convert NumPy/Python objects into JSON-safe values.
    """

    if isinstance(value, dict):
        return {
            str(key): make_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, np.ndarray):
        return value.tolist()

    if isinstance(value, np.floating):
        return float(value)

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.bool_):
        return bool(value)

    if isinstance(value, float):

        if np.isnan(value) or np.isinf(value):
            return 0.0

        return value

    return value


# ============================================================
# RESPONSE FORMATTER
# ============================================================

def build_analysis_response(
    result: Dict[str, Any],
    session_id: Optional[str],
    timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convert the internal pipeline result into the stable
    WebSocket response schema expected by the frontend.
    """

    voice = result.get(
        "voice_authenticity",
        {}
    )

    speaker = result.get(
        "speaker_verification",
        {}
    )

    context = result.get(
        "context_analysis",
        {}
    )

    risk = result.get(
        "risk_assessment",
        {}
    )

    threat = result.get(
        "threat_classification",
        {}
    )

    transcription = result.get(
        "transcription",
        {}
    )

    transcript = result.get(
        "transcript",
        ""
    )

    if not transcript:
        transcript = transcription.get(
            "transcript",
            ""
        )

    # --------------------------------------------------------
    # Voice analysis
    # --------------------------------------------------------

    synthetic_probability = voice.get(
        "synthetic_probability",
        0.0
    )

    real_probability = voice.get(
        "real_probability",
        1.0
    )

    voice_confidence = voice.get(
        "confidence",
        0.0
    )

    voice_classification = voice.get(
        "classification",
        "UNCERTAIN"
    )

    if voice_classification == "SYNTHETIC":
        voice_status = "suspicious"

    elif voice_classification == "REAL":
        voice_status = "likely_real"

    else:
        voice_status = "uncertain"

    # --------------------------------------------------------
    # Speaker analysis
    # --------------------------------------------------------

    speaker_similarity = speaker.get(
        "similarity"
    )

    speaker_verified = speaker.get(
        "verified"
    )

    speaker_status_raw = speaker.get(
        "status",
        "NOT_ENROLLED"
    )

    if speaker_status_raw == "MATCH":
        speaker_status = "MATCH"

    elif speaker_status_raw in (
        "MISMATCH",
        "NO_MATCH"
    ):
        speaker_status = "MISMATCH"

    elif speaker_status_raw in (
        "NOT_ENROLLED",
        "UNKNOWN"
    ):
        speaker_status = "NOT_ENROLLED"

    else:
        speaker_status = str(
            speaker_status_raw
        )

    # --------------------------------------------------------
    # Context analysis
    # --------------------------------------------------------

    detected_signals = context.get(
        "detected_signals",
        []
    )

    detected_categories = []

    if context.get(
        "otp_request",
        False
    ):
        detected_categories.append(
            "OTP_REQUEST"
        )

    if context.get(
        "money_request",
        False
    ):
        detected_categories.append(
            "MONEY_REQUEST"
        )

    if context.get(
        "credential_request",
        False
    ):
        detected_categories.append(
            "CREDENTIAL_REQUEST"
        )

    if context.get(
        "remote_access_request",
        False
    ):
        detected_categories.append(
            "REMOTE_ACCESS"
        )

    impersonation_context = context.get(
        "impersonation_context",
        ""
    )

    if impersonation_context:
        detected_categories.append(
            "IMPERSONATION"
        )

    # --------------------------------------------------------
    # Risk
    # --------------------------------------------------------

    risk_score = risk.get(
        "risk_score",
        risk.get(
            "score",
            0
        )
    )

    risk_level = risk.get(
        "risk_level",
        risk.get(
            "level",
            "LOW"
        )
    )

    risk_factors = risk.get(
        "contributing_factors",
        risk.get(
            "risk_factors",
            []
        )
    )

    recommendation = risk.get(
        "recommendation",
        ""
    )

    # --------------------------------------------------------
    # Threat
    # --------------------------------------------------------

    threat_level = threat.get(
        "threat_level",
        risk_level
    )

    threat_categories = threat.get(
        "categories",
        threat.get(
            "threats",
            []
        )
    )

    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    response = {
        "type": "analysis_update",

        "session_id": session_id,

        "timestamp": (
            timestamp
            or datetime.now(
                timezone.utc
            ).isoformat()
        ),

        "transcript": transcript,

        "voice_analysis": {
            "synthetic_probability": synthetic_probability,
            "real_probability": real_probability,
            "voice_status": voice_status,
            "classification": voice_classification,
            "confidence": voice_confidence,
        },

        "speaker_analysis": {
            "speaker_match": speaker_similarity,
            "verified": speaker_verified,
            "status": speaker_status,
            "confidence": speaker.get(
                "confidence",
                0.0
            ),
        },

        "context_analysis": {
            "context_risk": context.get(
                "social_engineering_score",
                0.0
            ),
            "risk_factors": risk_factors,
            "detected_categories": detected_categories,
            "detected_signals": detected_signals,
            "impersonation_context": impersonation_context,
            "otp_request": context.get(
                "otp_request",
                False
            ),
            "money_request": context.get(
                "money_request",
                False
            ),
            "credential_request": context.get(
                "credential_request",
                False
            ),
            "remote_access_request": context.get(
                "remote_access_request",
                False
            ),
        },

        "risk": {
            "score": risk_score,
            "threat_level": risk_level,
            "recommendation": recommendation,
        },

        "threat": {
            "level": threat_level,
            "categories": threat_categories,
            "details": threat,
        },
    }

    return make_json_safe(response)


# ============================================================
# AUDIO DECODER
# ============================================================

def decode_audio_payload(
    audio_b64: str,
    sample_rate: int = 16000,
    channels: int = 1
):
    """
    Decode base64 PCM16 audio received from the browser.
    """

    if not audio_b64:
        return (
            np.array(
                [],
                dtype=np.float32
            ),
            sample_rate,
            {}
        )

    try:
        audio_bytes = base64.b64decode(
            audio_b64
        )

    except Exception as exc:
        raise ValueError(
            f"Invalid base64 audio data: {exc}"
        ) from exc

    samples, decoded_rate, metadata = (
        pipeline.audio_processor.decode_pcm16(
            audio_bytes,
            sample_rate=sample_rate,
            channels=channels
        )
    )

    return (
        samples,
        decoded_rate,
        metadata
    )


# ============================================================
# TEXT-ONLY ANALYSIS
# ============================================================

def process_text_only(
    text: str
) -> Dict[str, Any]:
    """
    Analyze browser-provided speech recognition text.

    No fake audio is generated here.

    Voice/speaker analysis will remain unavailable because
    this path contains no actual microphone samples.
    """

    transcript = (
        text.strip()
        if text
        else ""
    )

    context_result = (
        pipeline.context_analyzer
        .analyze_transcript(
            transcript
        )
    )

    empty_voice_result = {
        "real_probability": None,
        "synthetic_probability": None,
        "confidence": 0.0,
        "classification": "UNCERTAIN",
        "acoustic_features": {},
        "status": "NO_AUDIO"
    }

    empty_speaker_result = {
        "similarity": None,
        "verified": None,
        "status": "NOT_ENROLLED",
        "confidence": 0.0,
        "message": (
            "Speaker verification requires "
            "an enrolled speaker profile."
        )
    }

    risk_result = (
        pipeline.risk_engine.evaluate_risk(
            empty_voice_result,
            empty_speaker_result,
            context_result
        )
    )

    threat_result = (
        pipeline.threat_classifier
        .classify_threats(
            risk_result,
            empty_voice_result,
            empty_speaker_result,
            context_result
        )
    )

    return {
        "voice_authenticity": empty_voice_result,
        "speaker_verification": empty_speaker_result,
        "transcript": transcript,
        "context_analysis": context_result,
        "risk_assessment": risk_result,
        "threat_classification": threat_result,
    }


# ============================================================
# CONNECTION HANDLER
# ============================================================

async def handle_connection(
    websocket: WebSocket
):
    """
    Shared handler for both WebSocket endpoints.
    """

    await websocket.accept()

    print(
        "[WEBSOCKET] "
        "VIGIL client connected."
    )

    session_id: Optional[str] = None
    target_speaker_id: Optional[str] = None

    try:

        while True:

            raw_message = (
                await websocket.receive_text()
            )

            # ------------------------------------------------
            # Parse JSON
            # ------------------------------------------------

            try:

                payload = json.loads(
                    raw_message
                )

            except json.JSONDecodeError:

                await websocket.send_json({
                    "type": "error",
                    "message": (
                        "Invalid JSON payload."
                    )
                })

                continue

            if not isinstance(
                payload,
                dict
            ):

                await websocket.send_json({
                    "type": "error",
                    "message": (
                        "WebSocket payload "
                        "must be a JSON object."
                    )
                })

                continue

            message_type = payload.get(
                "type",
                "audio_chunk"
            )

            # ------------------------------------------------
            # PING
            # ------------------------------------------------

            if message_type == "ping":

                await websocket.send_json({
                    "type": "pong",
                    "status": "ACTIVE",
                    "timestamp": datetime.now(
                        timezone.utc
                    ).isoformat()
                })

                continue

            # ------------------------------------------------
            # START SESSION
            # ------------------------------------------------

            if message_type == "start_session":

                session_id = (
                    payload.get(
                        "session_id"
                    )
                    or datetime.now(
                        timezone.utc
                    ).strftime(
                        "%Y%m%d%H%M%S"
                    )
                )

                target_speaker_id = (
                    payload.get(
                        "speaker_id"
                    )
                    or payload.get(
                        "target_speaker_id"
                    )
                )

                await websocket.send_json({
                    "type": "session_started",
                    "session_id": session_id,
                    "status": "ACTIVE"
                })

                continue

            # ------------------------------------------------
            # STOP SESSION
            # ------------------------------------------------

            if message_type == "stop_session":

                await websocket.send_json({
                    "type": "session_stopped",
                    "session_id": session_id,
                    "status": "STOPPED"
                })

                session_id = None

                continue

            # ------------------------------------------------
            # UPDATE SPEAKER
            # ------------------------------------------------

            if message_type == "set_speaker":

                target_speaker_id = (
                    payload.get(
                        "speaker_id"
                    )
                    or payload.get(
                        "target_speaker_id"
                    )
                )

                await websocket.send_json({
                    "type": "speaker_updated",
                    "speaker_id": target_speaker_id
                })

                continue

            # ------------------------------------------------
            # TRANSCRIPT FROM BROWSER
            # ------------------------------------------------

            if message_type in (
                "transcript",
                "speech_text"
            ):

                text = payload.get(
                    "text",
                    ""
                )

                result = process_text_only(
                    text
                )

                response = (
                    build_analysis_response(
                        result,
                        session_id,
                        payload.get(
                            "timestamp"
                        )
                    )
                )

                await websocket.send_json(
                    response
                )

                continue

            # ------------------------------------------------
            # AUDIO CHUNK
            # ------------------------------------------------

            if message_type in (
                "audio_chunk",
                "chunk",
                "audio"
            ):

                audio_b64 = payload.get(
                    "audio_b64",
                    payload.get(
                        "audio",
                        ""
                    )
                )

                if not audio_b64:

                    await websocket.send_json({
                        "type": "error",
                        "message": (
                            "No audio data "
                            "was provided."
                        )
                    })

                    continue

                sample_rate = int(
                    payload.get(
                        "sample_rate",
                        16000
                    )
                )

                channels = int(
                    payload.get(
                        "channels",
                        1
                    )
                )

                try:

                    samples, decoded_rate, metadata = (
                        decode_audio_payload(
                            audio_b64,
                            sample_rate=sample_rate,
                            channels=channels
                        )
                    )

                except Exception as exc:

                    await websocket.send_json({
                        "type": "error",
                        "message": (
                            f"Audio decoding failed: {exc}"
                        )
                    })

                    continue

                if len(samples) == 0:

                    await websocket.send_json({
                        "type": "audio_status",
                        "status": "NO_AUDIO",
                        "session_id": session_id
                    })

                    continue

                # --------------------------------------------
                # Run actual VIGIL AI pipeline
                # --------------------------------------------

                browser_transcript = payload.get(
                    "text"
                )

                result = pipeline.process_audio_chunk(
                    chunk_samples=samples,
                    sample_rate=decoded_rate,
                    target_speaker_id=(
                        target_speaker_id
                    ),
                    custom_text=(
                        browser_transcript
                        if browser_transcript
                        else None
                    )
                )

                response = (
                    build_analysis_response(
                        result,
                        session_id,
                        payload.get(
                            "timestamp"
                        )
                    )
                )

                # Include basic processing metadata.
                response["audio"] = {
                    "sample_rate": decoded_rate,
                    "channels": metadata.get(
                        "channels",
                        channels
                    ),
                    "duration": metadata.get(
                        "duration",
                        0.0
                    ),
                    "rms_energy": metadata.get(
                        "rms_energy",
                        0.0
                    ),
                }

                await websocket.send_json(
                    make_json_safe(
                        response
                    )
                )

                continue

            # ------------------------------------------------
            # UNKNOWN MESSAGE
            # ------------------------------------------------

            await websocket.send_json({
                "type": "error",
                "message": (
                    f"Unsupported message type: "
                    f"{message_type}"
                )
            })

    except WebSocketDisconnect:

        print(
            "[WEBSOCKET] "
            "Client disconnected."
        )

    except Exception as exc:

        print(
            "[WEBSOCKET ERROR] "
            f"{type(exc).__name__}: {exc}"
        )

        try:

            await websocket.send_json({
                "type": "error",
                "message": (
                    "Internal WebSocket processing error."
                )
            })

        except Exception:
            pass


# ============================================================
# WEBSOCKET ENDPOINTS
# ============================================================

@router.websocket("/ws/analyze")
async def websocket_analyze_stream(
    websocket: WebSocket
):
    """
    General VIGIL real-time analysis endpoint.
    """

    await handle_connection(
        websocket
    )


@router.websocket("/ws/live-monitor")
async def websocket_live_monitor(
    websocket: WebSocket
):
    """
    Endpoint used by the VIGIL Live Monitor frontend.
    """

    await handle_connection(
        websocket
    )
