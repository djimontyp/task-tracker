import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services.websocket_manager import websocket_manager
from ..websocket import manager as legacy_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, topics: str = None):
    """WebSocket endpoint with topic-based subscriptions.

    Query params:
        topics: Comma-separated list of topics to subscribe to (agents,tasks,providers)
                If not specified, subscribes to all topics

    Message format (client to server):
        {"action": "subscribe", "topic": "agents"}
        {"action": "unsubscribe", "topic": "tasks"}

    Message format (server to client):
        {"topic": "agents", "event": "created", "data": {...}}
    """
    # Parse topics from query param
    topic_list = None
    if topics:
        topic_list = [t.strip() for t in topics.split(",")]

    # Accept WebSocket connection once
    await websocket.accept()

    # Register with legacy manager (without accepting again)
    legacy_manager.active_connections.add(websocket)

    # Register with new topic-based manager (without accepting again)
    if topic_list is None:
        topic_list = ["agents", "tasks", "providers"]
    
    async with websocket_manager._lock:
        for topic in topic_list:
            if topic not in websocket_manager._connections:
                websocket_manager._connections[topic] = set()
            websocket_manager._connections[topic].add(websocket)

    try:
        # Send connection confirmation
        await websocket.send_text(
            json.dumps(
                {
                    "type": "connection",
                    "data": {
                        "status": "connected",
                        "message": "Ready for real-time updates",
                        "topics": topic_list or ["agents", "tasks", "providers"],
                    },
                }
            )
        )

        # Listen for subscription changes
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                action = message.get("action")
                topic = message.get("topic")

                if action == "subscribe" and topic:
                    await websocket_manager.subscribe(websocket, topic)
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "subscription",
                                "data": {"action": "subscribed", "topic": topic},
                            }
                        )
                    )
                elif action == "unsubscribe" and topic:
                    await websocket_manager.unsubscribe(websocket, topic)
                    await websocket.send_text(
                        json.dumps(
                            {
                                "type": "subscription",
                                "data": {"action": "unsubscribed", "topic": topic},
                            }
                        )
                    )
            except json.JSONDecodeError:
                # Ignore invalid JSON messages
                pass

    except WebSocketDisconnect:
        legacy_manager.disconnect(websocket)
        await websocket_manager.disconnect(websocket)
