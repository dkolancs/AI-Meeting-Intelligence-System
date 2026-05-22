import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.connection_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws")


@router.websocket("/{session_id}")
async def websocket_endpoint(session_id: str, websocket: WebSocket):
    await manager.connect(session_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except (json.JSONDecodeError, AttributeError):
                pass
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        logger.info(f"WebSocket client disconnected from session {session_id}")
