import logging
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self._connections:
            self._connections[session_id] = []
        self._connections[session_id].append(websocket)
        logger.info(f"WebSocket connected: session={session_id}, total={len(self._connections[session_id])}")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self._connections:
            try:
                self._connections[session_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[session_id]:
                del self._connections[session_id]
        logger.info(f"WebSocket disconnected: session={session_id}")

    async def broadcast(self, session_id: str, event: dict):
        if session_id not in self._connections:
            return
        dead: list[WebSocket] = []
        for ws in list(self._connections[session_id]):
            try:
                await ws.send_json(event)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)

    def session_has_clients(self, session_id: str) -> bool:
        return bool(self._connections.get(session_id))


manager = ConnectionManager()
