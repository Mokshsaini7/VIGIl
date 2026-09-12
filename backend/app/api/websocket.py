"""
VIGIL — Real-Time WebSocket Audio Handler

Endpoints:
    /ws/analyze
    /ws/live-monitor

Protocol:
    JSON messages containing PCM16 audio encoded as base64.
"""

import base64
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

import numpy as np

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from ai.pipeline import VigilAIPipeline


router = APIRouter()

pipeline = VigilAIPipeline()


def make_json_safe(value: Any) -> Any:

    if isinstance(value, dict):
        return {
            key: make_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, np.ndarray):
        return value.tolist()

    if isinstance(value, np.generic):
        return value.item()

    return value


def build_response(
    session_id: str,
    result: Dict[str, Any],
    transcript: str,
) -> Dict[str, Any]:

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

    return make_json_safe({

        "type": "analysis_update",

        "session_id": session_id,

        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),

        "transcript": transcript,

        "voice_analysis": {
            "synthetic_probability": (
                voice.get(
                    "synthetic_probability",
                    0.0
                )
            ),
            "real_probability": (
                voice.get(
                    "real_probability",
                    0.0
                )
            ),
            "voice_status": (
                voice.get(
                    "classification",
                    "INSUFFICIENT_AUDIO"
                )
            ),
            "confidence": (
                voice.get(
                    "confidence",
                    0.0
                )
            ),
            "acoustic_features": (
                voice.get(
                    "acoustic_features",
                    {}
                )
            ),
        },

        "speaker_analysis": {
            "speaker_match": (
                speaker.get(
                    "similarity"
                )
            ),
            "status": (
                speaker.get(
                    "status",
                    "NOT_ENROLLED"
                )
            ),
            "verified": (
                speaker.get(
                    "verified"
                )
            ),
            "confidence": (
                speaker.get(
                    "confidence",
                    0.0
                )
            ),
            "speaker_id": (
                speaker.get(
                    "speaker_id"
                )
            ),
            "speaker_name": (
                speaker.get(
                    "speaker_name"
                )
            ),
        },

        "context_analysis": {
            "context_risk": (
                context.get(
                    "threat_score",
                    0.0
                )
            ),
            "social_engineering_score": (
                context.get(
                    "social_engineering_score",
                    0.0
                )
            ),
            "risk_factors": (
                context.get(
                    "detected_signals",
                    []
                )
            ),
            "detected_categories": [
                key
                for key in (
                    "otp_request",
                    "money_request",
                    "credential_request",
                    "remote_access_request",
                )
                if context.get(key)
            ],
            "impersonation_context": (
                context.get(
                    "impersonation_context",
                    "NONE"
                )
            ),
            "urgency_score": (
                context.get(
                    "urgency_score",
                    0.0
                )
            ),
            "secrecy_score": (
                context.get(
                    "secrecy_score",
                    0.0
                )
            ),
        },

        "risk": {
            "score": risk.get(
                "risk_score",
                0
            ),
            "threat_level": risk.get(
                "risk_level",
                "LOW"
            ),
            "contributing_factors": risk.get(
                "contributing_factors",
                []
            ),
        },

        "threat": {
            "categories": threat.get(
                "threat_categories",
                []
            ),
            "primary_threat": threat.get(
                "primary_threat",
                "SAFE"
            ),
            "recommendation": threat.get(
                "recommended_action",
                "Continue with standard caution."
            ),
            "action_code": threat.get(
                "action_code",
                "PROCEED_NORMAL"
            ),
            "requires_immediate_action": threat.get(
                "requires_immediate_action",
                False
            ),
        },
    })


async def handle_connection(
    websocket: WebSocket
):

    await websocket.accept()

    session_id = str(
        uuid.uuid4()
    )

    transcript = ""

    target_speaker_id = None

    print(
        f"[VIGIL WS] Connected: {session_id}"
    )

    try:

        await websocket.send_json({
            "type": "session_started",
            "session_id": session_id,
            "status": "ACTIVE",
        })

        while True:

            raw_message = (
                await websocket.receive_text()
            )

            try:

                payload = json.loads(
                    raw_message
                )

            except json.JSONDecodeError:

                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON payload.",
                })

                continue

            message_type = payload.get(
                "type",
                "audio_chunk"
            )

            # ----------------------------------------
            # PING
            # ----------------------------------------

            if message_type == "ping":

                await websocket.send_json({
                    "type": "pong",
                    "status": "ACTIVE",
                    "session_id": session_id,
                })

                continue

            # ----------------------------------------
            # START SESSION
            # ----------------------------------------

            if message_type == "start_session":

                target_speaker_id = (
                    payload.get(
                        "speaker_id"
                    )
                )

                await websocket.send_json({
                    "type": "session_started",
                    "session_id": session_id,
                    "status": "ACTIVE",
                    "speaker_id": target_speaker_id,
                })

                continue

            # ----------------------------------------
            # TRANSCRIPT UPDATE
            # ----------------------------------------

            if message_type in (
                "transcript",
                "speech",
            ):

                incoming_text = (
                    payload.get(
                        "text",
                        ""
                    )
                    .strip()
                )

                if incoming_text:

                    transcript = incoming_text

                result = pipeline.process_audio_chunk(
                    np.zeros(
                        16000,
                        dtype=np.float32
                    ),
                    16000,
                    target_speaker_id,
                    transcript,
                )

                response = build_response(
                    session_id,
                    result,
                    transcript,
                )

                await websocket.send_json(
                    response
                )

                continue

            # ----------------------------------------
            # AUDIO
            # ----------------------------------------

            audio_b64 = payload.get(
                "audio_b64",
                ""
            )

            if not audio_b64:

                continue

            try:

                audio_bytes = base64.b64decode(
                    audio_b64,
                    validate=True
                )

            except Exception:

                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid base64 audio.",
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

            samples, actual_rate, metadata = (
                pipeline.audio_processor.decode_pcm16(
                    audio_bytes,
                    sample_rate,
                    channels
                )
            )

            if len(samples) == 0:

                continue

            result = pipeline.process_audio_chunk(
                samples,
                actual_rate,
                target_speaker_id,
                transcript,
            )

            response = build_response(
                session_id,
                result,
                transcript,
            )

            response["audio"] = {
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
                response
            )

            # ----------------------------------------
            # STOP
            # ----------------------------------------

            if message_type == "stop_session":

                await websocket.send_json({
                    "type": "session_stopped",
                    "session_id": session_id,
                })

                break

    except WebSocketDisconnect:

        print(
            f"[VIGIL WS] Disconnected: {session_id}"
        )

    except Exception as exc:

        print(
            f"[VIGIL WS ERROR] {session_id}: {exc}"
        )

        try:

            await websocket.send_json({
                "type": "error",
                "message": "Live analysis failed.",
                "detail": str(exc),
            })

        except Exception:
            pass


@router.websocket("/ws/analyze")
async def websocket_analyze(
    websocket: WebSocket
):

    await handle_connection(
        websocket
    )


@router.websocket("/ws/live-monitor")
async def websocket_live_monitor(
    websocket: WebSocket
):

    await handle_connection(
        websocket
    )
