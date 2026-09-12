"""
VIGIL — Module 11: Real-Time WebSocket Audio Handler
Endpoint: /ws/analyze
Streams live audio chunks (5-10s windows) and returns real-time risk scores, 
transcript flags, and security alert events without page reloads.
"""

import json
import base64
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ai.pipeline import VigilAIPipeline

router = APIRouter()
pipeline = VigilAIPipeline()


@router.websocket("/ws/analyze")
async def websocket_analyze_stream(websocket: WebSocket):
    """
    Real-time bi-directional audio analysis stream handler.
    Receives JSON frames with base64 PCM audio / text chunks and pushes live security evaluations.
    """
    await websocket.accept()
    print("[WEBSOCKET] Client connected to VIGIL Real-Time Monitor stream.")

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                payload = json.loads(data_text)
            except Exception:
                await websocket.send_json({"error": "Invalid JSON frame payload"})
                continue

            msg_type = payload.get("type", "chunk")
            target_speaker_id = payload.get("speaker_id", None)
            custom_text = payload.get("text", None)

            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "status": "ACTIVE"})
                continue

            # Base64 decoded PCM audio array or synthetic wave
            raw_audio_b64 = payload.get("audio_b64", "")
            if raw_audio_b64:
                audio_bytes = base64.b64decode(raw_audio_b64)
                chunk_samples, sr, meta = pipeline.audio_processor.extract_raw_pcm(audio_bytes)
            else:
                # Generate synthetic test audio array if text-only chunk frame
                chunk_samples = np.sin(np.linspace(0, 440 * 2 * np.pi, 16000 * 3)).astype(np.float32)
                sr = 16000

            # Execute real-time chunk evaluation
            chunk_result = pipeline.process_audio_chunk(
                chunk_samples=chunk_samples,
                sample_rate=sr,
                target_speaker_id=target_speaker_id,
                custom_text=custom_text
            )

            # Send live frame back to WebSocket client
            response_frame = {
                "type": "analysis_frame",
                "timestamp": payload.get("timestamp"),
                "results": chunk_result
            }
            await websocket.send_json(response_frame)

    except WebSocketDisconnect:
        print("[WEBSOCKET] Client disconnected cleanly.")
    except Exception as e:
        print(f"[WEBSOCKET ERROR] Stream failure: {e}")
