"""Authenticated VIGIL real-time WebSocket audio handler."""

import json
import base64

import numpy as np
import jwt

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from sqlalchemy.orm import Session

from ai.pipeline import VigilAIPipeline

from app.core.security import (
    SECRET_KEY,
    ALGORITHM,
)

from app.db.database import SessionLocal

from app.db.models import User


router = APIRouter()

pipeline = VigilAIPipeline()


def authenticate_websocket(
    token: str,
    db: Session,
) -> User | None:

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("type") != "access":
            return None

        user_id = int(
            payload.get("sub")
        )

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if (
            user
            and user.account_status
            == "ACTIVE"
        ):
            return user

    except (
        jwt.PyJWTError,
        ValueError,
        TypeError,
    ):
        return None

    return None


@router.websocket(
    "/ws/analyze"
)
async def websocket_analyze_stream(
    websocket: WebSocket,
):

    token = (
        websocket.query_params
        .get("token")
    )

    db = SessionLocal()

    user = authenticate_websocket(
        token or "",
        db,
    )

    if not user:

        await websocket.close(
            code=1008,
            reason=(
                "Authentication required"
            ),
        )

        db.close()

        return

    await websocket.accept()

    print(
        "[WEBSOCKET] "
        f"Authenticated VIGIL stream: "
        f"{user.username}"
    )

    try:

        while True:

            data_text = (
                await websocket.receive_text()
            )

            try:

                payload = json.loads(
                    data_text
                )

            except Exception:

                await websocket.send_json(
                    {
                        "error": (
                            "Invalid JSON "
                            "frame payload"
                        )
                    }
                )

                continue

            msg_type = payload.get(
                "type",
                "chunk",
            )

            target_speaker_id = (
                payload.get(
                    "speaker_id"
                )
            )

            custom_text = (
                payload.get(
                    "text"
                )
            )

            # ------------------------------------------------
            # Ping
            # ------------------------------------------------

            if msg_type == "ping":

                await websocket.send_json(
                    {
                        "type": "pong",
                        "status": "ACTIVE",
                    }
                )

                continue

            raw_audio_b64 = (
                payload.get(
                    "audio_b64",
                    "",
                )
            )

            # ------------------------------------------------
            # Real audio frame
            # ------------------------------------------------

            if raw_audio_b64:

                try:

                    audio_bytes = (
                        base64.b64decode(
                            raw_audio_b64,
                            validate=True,
                        )
                    )

                    (
                        chunk_samples,
                        sr,
                        meta,
                    ) = (
                        pipeline
                        .audio_processor
                        .extract_raw_pcm(
                            audio_bytes
                        )
                    )

                except Exception:

                    await websocket.send_json(
                        {
                            "error": (
                                "Invalid audio "
                                "payload"
                            )
                        }
                    )

                    continue

            # ------------------------------------------------
            # Text/demo frame
            # ------------------------------------------------

            else:

                # Text-only demo frames remain
                # supported but are explicitly
                # simulation data.

                chunk_samples = (
                    np.sin(
                        np.linspace(
                            0,
                            440
                            * 2
                            * np.pi,
                            16000 * 3,
                        )
                    ).astype(
                        np.float32
                    )
                )

                sr = 16000

            chunk_result = (
                pipeline.process_audio_chunk(
                    chunk_samples=chunk_samples,
                    sample_rate=sr,
                    target_speaker_id=(
                        target_speaker_id
                    ),
                    custom_text=custom_text,
                )
            )

            await websocket.send_json(
                {
                    "type": (
                        "analysis_frame"
                    ),
                    "timestamp": (
                        payload.get(
                            "timestamp"
                        )
                    ),
                    "results": chunk_result,
                }
            )

    except WebSocketDisconnect:

        print(
            "[WEBSOCKET] "
            f"Disconnected: "
            f"{user.username}"
        )

    except Exception as exc:

        print(
            "[WEBSOCKET ERROR] "
            f"Stream failure: {exc}"
        )

    finally:

        db.close()
