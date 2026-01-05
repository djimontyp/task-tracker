"""Base abstract class for source adapters.

Source adapters provide unified interface for:
1. Fetching message count estimates
2. Fetching historical messages
3. Testing connection

This abstraction allows supporting multiple sources (Telegram, Slack, Discord, etc.)
with consistent API.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any, AsyncGenerator


@dataclass
class MessageCountResult:
    """Result of message count estimation.

    Attributes:
        count: Number of messages, or None if unavailable
        is_estimate: True if count is approximate (not exact)
        error: Error message if count fetch failed, None otherwise
        source_id: Identifier of the source (e.g., chat_id)
    """

    count: int | None
    is_estimate: bool
    error: str | None
    source_id: str


@dataclass
class ConnectionTestResult:
    """Result of connection test.

    Attributes:
        success: True if connection successful
        error: Error message if failed, None otherwise
    """

    success: bool
    error: str | None


class SourceAdapter(ABC):
    """Abstract base class for source adapters.

    Implementations must provide:
    - get_message_count: Estimate message count for time range
    - fetch_history: Stream historical messages
    - test_connection: Verify source is accessible
    """

    @abstractmethod
    async def get_message_count(self, chat_id: str, since: datetime | None = None) -> MessageCountResult:
        """Get estimated message count for a chat/channel.

        Args:
            chat_id: Source-specific chat/channel identifier
            since: Only count messages after this datetime (None = all messages)

        Returns:
            MessageCountResult with count or error

        Note:
            - Count may be approximate (check is_estimate flag)
            - Returns None count if source doesn't support counting
            - Populates error field on failure (rate limit, auth error, etc.)
        """
        pass

    @abstractmethod
    def fetch_history(
        self,
        chat_id: str,
        since: datetime | None = None,
        limit: int | None = None,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Fetch historical messages from a chat/channel.

        Args:
            chat_id: Source-specific chat/channel identifier
            since: Only fetch messages after this datetime (None = all messages)
            limit: Maximum number of messages to fetch (None = unlimited)

        Yields:
            Raw message dictionaries compatible with Message model

        Note:
            - Message format varies by source but must be convertible to Message model
            - Yielding allows streaming large message sets without loading all in memory
        """
        pass

    @abstractmethod
    async def test_connection(self) -> ConnectionTestResult:
        """Test if source connection is working.

        Returns:
            ConnectionTestResult with success status and optional error

        Note:
            - Should verify authentication and basic API access
            - Does not need to fetch actual data
        """
        pass
