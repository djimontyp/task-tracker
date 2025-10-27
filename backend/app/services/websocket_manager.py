"""WebSocket connection manager for real-time updates.

Manages WebSocket connections with topic-based subscriptions for broadcasting
state changes to connected clients. Supports cross-process communication via NATS
for worker-to-API message propagation.
"""

import asyncio
import json
import os
from typing import Any

from fastapi import WebSocket
from loguru import logger
from nats.aio.client import Client as NATSClient
from nats.aio.subscription import Subscription


class WebSocketManager:
    """Manages WebSocket connections with topic-based pub/sub pattern.

    Supports multiple topics (agents, tasks, providers) and allows clients
    to subscribe to specific topics for targeted updates.

    Cross-process communication:
    - Worker process: Publishes messages to NATS subjects (websocket.{topic})
    - API process: Subscribes to NATS subjects and relays to WebSocket clients
    """

    def __init__(self) -> None:
        """Initialize WebSocket manager."""
        self._connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._nats_client: NATSClient | None = None
        self._nats_subscriptions: list[Subscription] = []
        self._is_worker = self._detect_worker_process()
        self._startup_complete = False
        logger.info(f"🔧 WebSocketManager initialized: is_worker={self._is_worker}, TASKIQ_WORKER={os.getenv('TASKIQ_WORKER')}")

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

    def _detect_worker_process(self) -> bool:
        """Detect if running in worker process.

        Returns:
            True if running in worker process, False if API process
        """
        return os.getenv("TASKIQ_WORKER", "false").lower() == "true"

    async def startup(self, nats_servers: str) -> None:
        """Initialize NATS connection for cross-process broadcasting.

        Args:
            nats_servers: NATS server URL(s)
        """
        logger.info(f"🚀 WebSocketManager.startup() called: is_worker={self._is_worker}, nats_servers={nats_servers}")

        if self._startup_complete:
            logger.warning("WebSocketManager already initialized, skipping startup")
            return

        try:
            self._nats_client = NATSClient()
            await self._nats_client.connect(servers=nats_servers)
            logger.info(f"✅ NATS client connected for WebSocketManager (worker={self._is_worker})")

            if not self._is_worker:
                await self._subscribe_to_nats_topics()

            self._startup_complete = True
        except Exception as e:
            logger.error(f"❌ Failed to connect NATS for WebSocketManager: {e}")
            self._nats_client = None

    async def _subscribe_to_nats_topics(self) -> None:
        """Subscribe to NATS subjects for relaying to WebSocket clients (API process only)."""
        if not self._nats_client or self._is_worker:
            return

        topics = ["agents", "tasks", "providers", "knowledge", "messages", "monitoring"]

        for topic in topics:
            subject = f"websocket.{topic}"
            try:
                subscription = await self._nats_client.subscribe(subject, cb=self._handle_nats_message)
                self._nats_subscriptions.append(subscription)
                logger.info(f"📡 Subscribed to NATS subject: {subject}")
            except Exception as e:
                logger.error(f"❌ Failed to subscribe to {subject}: {e}")

    async def _handle_nats_message(self, msg: Any) -> None:
        """Handle incoming NATS message and relay to WebSocket clients.

        Args:
            msg: NATS message object
        """
        try:
            subject = msg.subject
            topic = subject.replace("websocket.", "")
            data = json.loads(msg.data.decode())

            logger.debug(f"📨 Received NATS message on {subject}: {data.get('type', 'unknown')}")

            await self._broadcast_local(topic, data)
        except Exception as e:
            logger.error(f"❌ Error handling NATS message: {e}")

    async def shutdown(self) -> None:
        """Cleanup NATS connection and subscriptions."""
        try:
            for subscription in self._nats_subscriptions:
                await subscription.unsubscribe()
            self._nats_subscriptions.clear()

            if self._nats_client:
                await self._nats_client.drain()
                self._nats_client = None
                logger.info("✅ NATS client disconnected for WebSocketManager")

            self._startup_complete = False
        except Exception as e:
            logger.error(f"❌ Error during WebSocketManager shutdown: {e}")

    async def broadcast(self, topic: str, message: dict[str, Any]) -> None:
        """Broadcast message to all subscribers of a topic.

        Automatically routes messages:
        - Worker process: Publishes to NATS for cross-process delivery
        - API process: Broadcasts directly to local WebSocket connections

        Args:
            topic: Topic to broadcast to
            message: Message data to send (will be JSON serialized)

        Example:
            await manager.broadcast("agents", {
                "event": "created",
                "data": {"id": "...", "name": "..."}
            })
        """
        if self._is_worker:
            await self._broadcast_via_nats(topic, message)
        else:
            await self._broadcast_local(topic, message)

    async def _broadcast_via_nats(self, topic: str, message: dict[str, Any]) -> None:
        """Publish message to NATS for cross-process delivery (worker process).

        Args:
            topic: Topic to broadcast to
            message: Message data to send
        """
        if not self._nats_client:
            logger.warning(f"⚠️ NATS client not initialized, cannot broadcast {topic} message from worker")
            return

        try:
            subject = f"websocket.{topic}"
            message_bytes = json.dumps(message).encode()
            await self._nats_client.publish(subject, message_bytes)
            logger.debug(f"📤 Published to NATS {subject}: {message.get('type', 'unknown')}")
        except Exception as e:
            logger.error(f"❌ Failed to publish to NATS {topic}: {e}")

    async def _broadcast_local(self, topic: str, message: dict[str, Any]) -> None:
        """Broadcast message to local WebSocket connections (API process).

        Args:
            topic: Topic to broadcast to
            message: Message data to send
        """
        async with self._lock:
            if topic not in self._connections:
                logger.debug(f"⚠️ No WebSocket connections for topic {topic}")
                return

            connections = list(self._connections[topic])

        if not connections:
            logger.debug(f"⚠️ No active WebSocket clients for topic {topic}")
            return

        message_json = json.dumps(message)
        logger.info(
            f"📡 Broadcasting {message.get('type', 'unknown')} to {len(connections)} client(s) on topic {topic}"
        )

        disconnected = []
        for websocket in connections:
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                logger.warning(f"❌ Failed to send to WebSocket client: {e}")
                disconnected.append(websocket)

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

    async def broadcast_task_event(
        self,
        event_type: str,
        task_name: str,
        status: Any,
        task_id: str,
        duration_ms: int | None = None,
        error_message: str | None = None,
        params: dict[str, Any] | None = None,
    ) -> None:
        """Broadcast task execution event to monitoring topic.

        Args:
            event_type: Event type (task_started, task_completed, task_failed)
            task_name: Name of the task function
            status: Task execution status
            task_id: TaskIQ internal task ID
            duration_ms: Execution duration in milliseconds
            error_message: Error message if task failed
            params: Task input parameters
        """
        from datetime import UTC, datetime

        event = {
            "type": event_type,
            "task_name": task_name,
            "status": status.value if hasattr(status, "value") else str(status),
            "timestamp": datetime.now(UTC).isoformat(),
            "data": {
                "task_id": task_id,
                "duration_ms": duration_ms,
                "error_message": error_message,
                "params": params,
            },
        }

        connection_count = self.get_connection_count("monitoring")
        logger.info(f"📡 Broadcasting {event_type} for task {task_name} (ID: {task_id}) to {connection_count} clients")
        await self.broadcast("monitoring", event)


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
