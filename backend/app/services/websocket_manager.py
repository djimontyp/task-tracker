"""WebSocket connection manager for real-time updates.

Manages WebSocket connections with topic-based subscriptions for broadcasting
state changes to connected clients. Supports cross-process communication via NATS
for worker-to-API message propagation.

Features:
- Topic-based pub/sub pattern
- Cross-process NATS relay (worker → API → WebSocket)
- Heartbeat system for connection health monitoring
- Message sequencing for replay on reconnect
"""

import asyncio
import json
import os
import time
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import WebSocket
from loguru import logger
from nats.aio.client import Client as NATSClient
from nats.aio.subscription import Subscription


@dataclass
class ConnectionInfo:
    """Metadata for a WebSocket connection."""

    id: str
    websocket: WebSocket
    topics: set[str] = field(default_factory=set)
    connected_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    last_pong: datetime = field(default_factory=lambda: datetime.now(UTC))


class WebSocketManager:
    """Manages WebSocket connections with topic-based pub/sub pattern.

    Supports multiple topics (agents, tasks, providers) and allows clients
    to subscribe to specific topics for targeted updates.

    Cross-process communication:
    - Worker process: Publishes messages to NATS subjects (websocket.{topic})
    - API process: Subscribes to NATS subjects and relays to WebSocket clients
    """

    # Heartbeat configuration
    PING_INTERVAL = 20  # Send ping every N seconds
    PONG_TIMEOUT = 30  # Connection stale if no pong within N seconds

    def __init__(self) -> None:
        """Initialize WebSocket manager."""
        # Connection storage: topic -> {conn_id: ConnectionInfo}
        self._connections: dict[str, dict[str, ConnectionInfo]] = {}
        # Reverse index: conn_id -> ConnectionInfo (for fast lookup)
        self._conn_by_id: dict[str, ConnectionInfo] = {}
        self._lock = asyncio.Lock()
        self._nats_client: NATSClient | None = None
        self._nats_subscriptions: list[Subscription] = []
        self._is_worker = self._detect_worker_process()
        self._startup_complete = False
        self._heartbeat_task: asyncio.Task[None] | None = None
        logger.info(
            f"🔧 WebSocketManager initialized: is_worker={self._is_worker}, TASKIQ_WORKER={os.getenv('TASKIQ_WORKER')}"
        )

    async def connect(
        self, websocket: WebSocket, topics: list[str] | None = None, accept: bool = True
    ) -> str:
        """Accept WebSocket connection and subscribe to topics.

        Args:
            websocket: WebSocket connection
            topics: List of topics to subscribe to (default: all topics)
            accept: Whether to accept the WebSocket connection (default: True)

        Returns:
            Connection ID (8-char UUID) for tracking and debugging

        Example:
            conn_id = await manager.connect(websocket, ["agents", "providers"])
        """
        if accept:
            await websocket.accept()

        # Default to all topics if none specified
        if topics is None:
            topics = ["agents", "tasks", "providers", "metrics"]

        # Generate unique connection ID
        conn_id = str(uuid.uuid4())[:8]
        conn_info = ConnectionInfo(
            id=conn_id,
            websocket=websocket,
            topics=set(topics),
        )

        async with self._lock:
            # Store in reverse index
            self._conn_by_id[conn_id] = conn_info

            # Store in topic-based index
            for topic in topics:
                if topic not in self._connections:
                    self._connections[topic] = {}
                self._connections[topic][conn_id] = conn_info

        logger.info(f"🔌 Connection {conn_id} established, topics: {topics}")
        return conn_id

    async def disconnect(self, websocket: WebSocket | None = None, conn_id: str | None = None) -> None:
        """Remove WebSocket connection from all topics.

        Args:
            websocket: WebSocket connection to remove (legacy)
            conn_id: Connection ID to remove (preferred)

        Note: Either websocket or conn_id must be provided.
        """
        async with self._lock:
            # Find connection by ID or WebSocket
            target_conn: ConnectionInfo | None = None

            if conn_id and conn_id in self._conn_by_id:
                target_conn = self._conn_by_id[conn_id]
            elif websocket:
                # Legacy: find by WebSocket object
                for conn_info in self._conn_by_id.values():
                    if conn_info.websocket is websocket:
                        target_conn = conn_info
                        break

            if not target_conn:
                return

            # Remove from reverse index
            self._conn_by_id.pop(target_conn.id, None)

            # Remove from all topic indexes
            for topic in target_conn.topics:
                if topic in self._connections:
                    self._connections[topic].pop(target_conn.id, None)

            logger.info(f"🔌 Connection {target_conn.id} disconnected")

    async def subscribe(self, conn_id: str, topic: str) -> bool:
        """Subscribe connection to additional topic.

        Args:
            conn_id: Connection ID to subscribe
            topic: Topic to subscribe to

        Returns:
            True if subscribed successfully, False if connection not found

        Example:
            await manager.subscribe(conn_id, "tasks")
        """
        async with self._lock:
            conn_info = self._conn_by_id.get(conn_id)
            if not conn_info:
                logger.warning(f"Cannot subscribe: connection {conn_id} not found")
                return False

            if topic not in self._connections:
                self._connections[topic] = {}

            self._connections[topic][conn_id] = conn_info
            conn_info.topics.add(topic)
            logger.debug(f"Connection {conn_id} subscribed to {topic}")
            return True

    async def unsubscribe(self, conn_id: str, topic: str) -> bool:
        """Unsubscribe connection from topic.

        Args:
            conn_id: Connection ID to unsubscribe
            topic: Topic to unsubscribe from

        Returns:
            True if unsubscribed successfully, False if connection not found
        """
        async with self._lock:
            conn_info = self._conn_by_id.get(conn_id)
            if not conn_info:
                logger.warning(f"Cannot unsubscribe: connection {conn_id} not found")
                return False

            if topic in self._connections:
                self._connections[topic].pop(conn_id, None)
            conn_info.topics.discard(topic)
            logger.debug(f"Connection {conn_id} unsubscribed from {topic}")
            return True

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
        logger.info(f"WebSocketManager.startup() called: is_worker={self._is_worker}, nats_servers={nats_servers}")

        if self._startup_complete:
            logger.warning("WebSocketManager already initialized, skipping startup")
            return

        try:
            self._nats_client = NATSClient()
            await self._nats_client.connect(servers=nats_servers)
            logger.info(f"NATS client connected for WebSocketManager (worker={self._is_worker})")

            if not self._is_worker:
                await self._subscribe_to_nats_topics()
                # Start heartbeat loop only in API process
                self._heartbeat_task = asyncio.create_task(self._start_heartbeat_loop())
                logger.info("Heartbeat loop started")

            self._startup_complete = True
        except Exception as e:
            logger.error(f"Failed to connect NATS for WebSocketManager: {e}")
            self._nats_client = None

    async def _subscribe_to_nats_topics(self) -> None:
        """Subscribe to NATS subjects for relaying to WebSocket clients (API process only)."""
        if not self._nats_client or self._is_worker:
            return

        topics = ["agents", "tasks", "providers", "knowledge", "messages", "monitoring", "metrics"]

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
        """Cleanup NATS connection, subscriptions, and heartbeat task."""
        try:
            # Cancel heartbeat task
            if self._heartbeat_task:
                self._heartbeat_task.cancel()
                try:
                    await self._heartbeat_task
                except asyncio.CancelledError:
                    pass
                self._heartbeat_task = None
                logger.info("Heartbeat loop stopped")

            for subscription in self._nats_subscriptions:
                await subscription.unsubscribe()
            self._nats_subscriptions.clear()

            if self._nats_client:
                await self._nats_client.drain()
                self._nats_client = None
                logger.info("NATS client disconnected for WebSocketManager")

            self._startup_complete = False
        except Exception as e:
            logger.error(f"Error during WebSocketManager shutdown: {e}")

    async def _start_heartbeat_loop(self) -> None:
        """Background task: send pings every PING_INTERVAL, cleanup stale connections."""
        logger.info(f"Heartbeat loop started (ping every {self.PING_INTERVAL}s, timeout {self.PONG_TIMEOUT}s)")
        while True:
            try:
                await asyncio.sleep(self.PING_INTERVAL)
                await self._send_pings()
                await self._cleanup_stale_connections()
            except asyncio.CancelledError:
                logger.info("Heartbeat loop cancelled")
                raise
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")

    async def _send_pings(self) -> None:
        """Send ping message to all connections."""
        ping_msg = {"type": "ping", "ts": int(time.time() * 1000)}

        from app.core.json_encoder import UUIDJSONEncoder

        ping_json = json.dumps(ping_msg, cls=UUIDJSONEncoder)

        async with self._lock:
            conn_infos = list(self._conn_by_id.values())

        if not conn_infos:
            return

        logger.debug(f"Sending ping to {len(conn_infos)} connections")

        disconnected_ids: list[str] = []
        for conn_info in conn_infos:
            try:
                await conn_info.websocket.send_text(ping_json)
            except Exception as e:
                logger.warning(f"Failed to send ping to {conn_info.id}: {e}")
                disconnected_ids.append(conn_info.id)

        # Cleanup connections that failed to receive ping
        if disconnected_ids:
            for conn_id in disconnected_ids:
                await self.disconnect(conn_id=conn_id)

    async def _cleanup_stale_connections(self) -> None:
        """Remove connections that haven't sent pong within PONG_TIMEOUT."""
        now = datetime.now(UTC)
        stale_threshold = timedelta(seconds=self.PONG_TIMEOUT)

        async with self._lock:
            conn_infos = list(self._conn_by_id.values())

        stale_ids: list[str] = []
        for conn_info in conn_infos:
            time_since_pong = now - conn_info.last_pong
            if time_since_pong > stale_threshold:
                logger.warning(
                    f"Connection {conn_info.id} stale: no pong for {time_since_pong.total_seconds():.1f}s"
                )
                stale_ids.append(conn_info.id)

        # Disconnect stale connections
        for conn_id in stale_ids:
            logger.info(f"Removing stale connection {conn_id}")
            await self.disconnect(conn_id=conn_id)

        if stale_ids:
            logger.info(f"Cleaned up {len(stale_ids)} stale connections")

    async def handle_pong(self, conn_id: str) -> None:
        """Update last_pong timestamp when client responds to ping.

        Args:
            conn_id: Connection ID that sent the pong
        """
        async with self._lock:
            if conn_id in self._conn_by_id:
                self._conn_by_id[conn_id].last_pong = datetime.now(UTC)
                logger.debug(f"Pong received from {conn_id}")

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
            from app.core.json_encoder import UUIDJSONEncoder

            subject = f"websocket.{topic}"
            message_bytes = json.dumps(message, cls=UUIDJSONEncoder).encode()
            await self._nats_client.publish(subject, message_bytes)
            logger.debug(f"📤 Published to NATS {subject}: {message.get('type', 'unknown')}")
        except Exception as e:
            logger.error(f"❌ Failed to publish to NATS {topic}: {e}")

    async def _broadcast_local(self, topic: str, message: dict[str, Any]) -> None:
        """Broadcast message to local WebSocket connections (API process).

        Adds message to buffer with sequence number for reconnection support.

        Args:
            topic: Topic to broadcast to
            message: Message data to send
        """
        from app.services.message_buffer import message_buffer

        # Add to buffer and get sequence number
        seq = await message_buffer.add(topic, message)
        message_with_seq = {**message, "_seq": seq}

        async with self._lock:
            if topic not in self._connections:
                logger.debug(f"No WebSocket connections for topic {topic}")
                return

            # Get list of ConnectionInfo objects
            conn_infos = list(self._connections[topic].values())

        if not conn_infos:
            logger.debug(f"No active WebSocket clients for topic {topic}")
            return

        from app.core.json_encoder import UUIDJSONEncoder

        message_json = json.dumps(message_with_seq, cls=UUIDJSONEncoder)
        logger.info(
            f"Broadcasting {message.get('type', 'unknown')} (seq={seq}) to {len(conn_infos)} client(s) on topic {topic}"
        )

        disconnected_ids: list[str] = []
        for conn_info in conn_infos:
            try:
                await conn_info.websocket.send_text(message_json)
            except Exception as e:
                logger.warning(f"Failed to send to connection {conn_info.id}: {e}")
                disconnected_ids.append(conn_info.id)

        # Cleanup disconnected connections
        if disconnected_ids:
            async with self._lock:
                for disc_conn_id in disconnected_ids:
                    disc_conn = self._conn_by_id.pop(disc_conn_id, None)
                    if disc_conn:
                        for t in disc_conn.topics:
                            if t in self._connections:
                                self._connections[t].pop(disc_conn_id, None)

    def get_connection_count(self, topic: str | None = None) -> int:
        """Get number of active connections.

        Args:
            topic: Specific topic to count (None for total unique connections)

        Returns:
            Number of active connections
        """
        if topic is not None:
            return len(self._connections.get(topic, {}))

        # Total unique connections (from reverse index)
        return len(self._conn_by_id)

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
