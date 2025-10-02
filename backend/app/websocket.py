import json
from typing import Set

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        print(f"📢 Broadcasting to {len(self.active_connections)} connections: {message.get('type')}")
        disconnected = set()
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(json.dumps(message))
                print(f"  ✅ Sent to connection")
            except Exception as e:
                print(f"  ❌ Failed to send: {e}")
                disconnected.add(connection)

        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()
