"""WebSocket connection manager for real-time updates.

Manages WebSocket connections with topic-based subscriptions for broadcasting
state changes to connected clients.
"""

import asyncio
import json
from typing import Any

from fastapi import WebSocket


class WebSocketManager:
    """Manages WebSocket connections with topic-based pub/sub pattern.

    Supports multiple topics (agents, tasks, providers) and allows clients
    to subscribe to specific topics for targeted updates.
    """

    def __init__(self) -> None:
        """Initialize WebSocket manager."""
        # Map of topic -> set of connected websockets
        self._connections: dict[str, set[WebSocket]] = {}
        # Lock for thread-safe connection management
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, topics: list[str] | None = None, accept: bool = True) -> None:
        """Accept WebSocket connection and subscribe to topics.

        Args:
            websocket: WebSocket connection
            topics: List of topics to subscribe to (default: all topics)
            accept: Whether to accept the WebSocket connection (default: True)

        Example:
            await manager.connect(websocket, ["agents", "providers"])
        """
        if accept:
            await websocket.accept()

        # Default to all topics if none specified
        if topics is None:
            topics = ["agents", "tasks", "providers"]

        async with self._lock:
            for topic in topics:
                if topic not in self._connections:
                    self._connections[topic] = set()
                self._connections[topic].add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove WebSocket connection from all topics.

        Args:
            websocket: WebSocket connection to remove
        """
        async with self._lock:
            for topic_connections in self._connections.values():
                topic_connections.discard(websocket)

    async def subscribe(self, websocket: WebSocket, topic: str) -> None:
        """Subscribe WebSocket to additional topic.

        Args:
            websocket: WebSocket connection
            topic: Topic to subscribe to

        Example:
            await manager.subscribe(websocket, "tasks")
        """
        async with self._lock:
            if topic not in self._connections:
                self._connections[topic] = set()
            self._connections[topic].add(websocket)

    async def unsubscribe(self, websocket: WebSocket, topic: str) -> None:
        """Unsubscribe WebSocket from topic.

        Args:
            websocket: WebSocket connection
            topic: Topic to unsubscribe from
        """
        async with self._lock:
            if topic in self._connections:
                self._connections[topic].discard(websocket)

    async def broadcast(self, topic: str, message: dict[str, Any]) -> None:
        """Broadcast message to all subscribers of a topic.

        Args:
            topic: Topic to broadcast to
            message: Message data to send (will be JSON serialized)

        Example:
            await manager.broadcast("agents", {
                "event": "created",
                "data": {"id": "...", "name": "..."}
            })
        """
        async with self._lock:
            if topic not in self._connections:
                return

            # Get snapshot of connections to avoid modification during iteration
            connections = list(self._connections[topic])

        # Serialize message once
        message_json = json.dumps(message)

        # Send to all connections (outside lock to avoid blocking)
        disconnected = []
        for websocket in connections:
            try:
                await websocket.send_text(message_json)
            except Exception:
                # Connection failed, mark for cleanup
                disconnected.append(websocket)

        # Clean up failed connections
        if disconnected:
            async with self._lock:
                for websocket in disconnected:
                    for topic_connections in self._connections.values():
                        topic_connections.discard(websocket)

    def get_connection_count(self, topic: str | None = None) -> int:
        """Get number of active connections.

        Args:
            topic: Specific topic to count (None for total across all topics)

        Returns:
            Number of active connections
        """
        if topic is not None:
            return len(self._connections.get(topic, set()))

        # Count unique connections across all topics
        all_connections = set()
        for topic_connections in self._connections.values():
            all_connections.update(topic_connections)
        return len(all_connections)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
