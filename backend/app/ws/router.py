import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..websocket import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connection",
                    "data": {
                        "status": "connected",
                        "message": "Ready for real-time updates",
                    },
                }
            )
        )

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
