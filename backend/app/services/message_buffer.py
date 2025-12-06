"""Message buffer for WebSocket reconnection support.

Stores recent messages with sequence numbers to allow clients to replay
missed messages after brief disconnections.

Features:
- Per-topic message buffering with sequence numbers
- Automatic expiration of old messages (MAX_AGE)
- Size limits per topic (MAX_SIZE)
- Thread-safe operations with asyncio lock
"""

import asyncio
from collections import deque
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any


@dataclass
class BufferedMessage:
    """A message stored in the buffer with metadata."""

    seq: int
    message: dict[str, Any]
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


class MessageBuffer:
    """Buffer for storing recent WebSocket messages per topic.

    Allows clients to request missed messages after reconnection by providing
    the last sequence number they received.

    Attributes:
        MAX_AGE: Maximum age of buffered messages (5 minutes)
        MAX_SIZE: Maximum messages per topic (100)
    """

    MAX_AGE = timedelta(minutes=5)
    MAX_SIZE = 100

    def __init__(self) -> None:
        """Initialize the message buffer."""
        self._buffers: dict[str, deque[BufferedMessage]] = {}
        self._sequences: dict[str, int] = {}
        self._lock = asyncio.Lock()

    async def add(self, topic: str, message: dict[str, Any]) -> int:
        """Add message to buffer and return sequence number.

        Args:
            topic: Topic the message belongs to
            message: Message data to buffer

        Returns:
            Sequence number assigned to this message
        """
        async with self._lock:
            # Initialize topic buffer if needed
            if topic not in self._buffers:
                self._buffers[topic] = deque(maxlen=self.MAX_SIZE)
                self._sequences[topic] = 0

            # Increment sequence number
            self._sequences[topic] += 1
            seq = self._sequences[topic]

            # Create buffered message
            buffered = BufferedMessage(seq=seq, message=message)
            self._buffers[topic].append(buffered)

            # Cleanup old messages
            await self._cleanup_expired(topic)

            return seq

    async def _cleanup_expired(self, topic: str) -> None:
        """Remove messages older than MAX_AGE.

        Args:
            topic: Topic to cleanup

        Note: Must be called within lock context.
        """
        if topic not in self._buffers:
            return

        now = datetime.now(UTC)
        buffer = self._buffers[topic]

        # Remove expired messages from the front
        while buffer and (now - buffer[0].timestamp) > self.MAX_AGE:
            buffer.popleft()

    async def get_since(self, topic: str, since_seq: int) -> list[dict[str, Any]]:
        """Get messages after the specified sequence number.

        Args:
            topic: Topic to get messages from
            since_seq: Last sequence number client received

        Returns:
            List of messages with seq > since_seq (within MAX_AGE)
        """
        async with self._lock:
            if topic not in self._buffers:
                return []

            await self._cleanup_expired(topic)

            now = datetime.now(UTC)
            result: list[dict[str, Any]] = []

            for buffered in self._buffers[topic]:
                # Skip messages the client already has
                if buffered.seq <= since_seq:
                    continue
                # Skip expired messages
                if (now - buffered.timestamp) > self.MAX_AGE:
                    continue

                # Add sequence to message for client tracking
                msg_with_seq = {**buffered.message, "_seq": buffered.seq}
                result.append(msg_with_seq)

            return result

    async def get_current_seq(self, topic: str) -> int:
        """Get current sequence number for a topic.

        Args:
            topic: Topic to query

        Returns:
            Current sequence number (0 if topic has no messages)
        """
        async with self._lock:
            return self._sequences.get(topic, 0)

    async def get_stats(self) -> dict[str, Any]:
        """Get buffer statistics for monitoring.

        Returns:
            Dictionary with buffer stats per topic
        """
        async with self._lock:
            stats: dict[str, Any] = {}
            for topic, buffer in self._buffers.items():
                stats[topic] = {
                    "count": len(buffer),
                    "current_seq": self._sequences.get(topic, 0),
                    "oldest_age_seconds": None,
                }
                if buffer:
                    oldest = buffer[0]
                    age = (datetime.now(UTC) - oldest.timestamp).total_seconds()
                    stats[topic]["oldest_age_seconds"] = round(age, 1)
            return stats


# Global singleton instance
message_buffer = MessageBuffer()
