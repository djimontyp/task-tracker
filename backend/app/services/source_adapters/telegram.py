"""Telegram source adapter implementation.

Uses Telethon Client API (MTProto) for:
- Fetching message counts via get_messages(limit=0)
- Streaming historical messages via iter_messages
- Testing connection via is_user_authorized()
"""

import logging
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from telethon.errors import FloodWaitError, AuthKeyError
from telethon.tl.types import Message as TelethonMessage

from app.services.telegram_client_service import TelegramClientService
from .base import SourceAdapter, MessageCountResult, ConnectionTestResult

logger = logging.getLogger(__name__)


class TelegramSourceAdapter(SourceAdapter):
    """Telegram implementation of SourceAdapter.

    Uses TelegramClientService (Telethon) for API access.
    Requires user authentication (not bot token).
    """

    def __init__(self, client_service: TelegramClientService | None = None):
        """Initialize adapter.

        Args:
            client_service: Optional TelegramClientService instance
                           (creates default if None)
        """
        self.client_service = client_service or TelegramClientService()

    async def get_message_count(self, chat_id: str, since: datetime | None = None) -> MessageCountResult:
        """Get message count from Telegram chat.

        Uses Telethon's get_messages(limit=0) which returns total count
        without fetching actual messages.

        Args:
            chat_id: Telegram chat ID (e.g., "-1002988379206")
            since: Only count messages after this datetime

        Returns:
            MessageCountResult with count or error
        """
        try:
            # Connect to Telegram
            await self.client_service.connect()

            if not self.client_service.client:
                return MessageCountResult(
                    count=None,
                    is_estimate=False,
                    error="Client not connected",
                    source_id=chat_id,
                )

            # Get total count using limit=0
            # This returns metadata without fetching messages
            messages = await self.client_service.client.get_messages(
                int(chat_id),
                limit=0,
            )

            total = messages.total

            # If since is provided, count messages after that date
            if since:
                logger.info(f"Counting messages since {since} for chat {chat_id}")

                try:
                    # Step 1: Find first message after 'since' using reverse iteration
                    # With reverse=True, offset_date returns messages AFTER the date
                    first_msg_after = await self.client_service.client.get_messages(
                        int(chat_id),
                        limit=1,
                        offset_date=since,
                        reverse=True,
                    )

                    # If no messages found after since, count is 0
                    if not first_msg_after or len(first_msg_after) == 0:
                        return MessageCountResult(
                            count=0,
                            is_estimate=False,
                            error=None,
                            source_id=chat_id,
                        )

                    # Step 2: Get newest message to calculate count via ID difference
                    first_msg_id = first_msg_after[0].id

                    newest = await self.client_service.client.get_messages(
                        int(chat_id),
                        limit=1,
                    )
                    newest_id = newest[0].id if newest else first_msg_id

                    # Count = newest_id - first_msg_id + 1
                    # This is an estimate (gaps in IDs possible, but rare)
                    count = newest_id - first_msg_id + 1

                    logger.info(f"Estimated {count} messages since {since} (IDs {first_msg_id}-{newest_id})")

                    return MessageCountResult(
                        count=count,
                        is_estimate=True,  # ID-based estimate
                        error=None,
                        source_id=chat_id,
                    )

                except FloodWaitError:
                    # Re-raise to be handled by outer except
                    raise
                except Exception as e:
                    # If time-based count fails, fallback to total
                    logger.warning(f"Failed to count messages since {since}, using total: {e}")
                    return MessageCountResult(
                        count=total,
                        is_estimate=True,
                        error=None,
                        source_id=chat_id,
                    )

            # No time filter - return total
            return MessageCountResult(
                count=total,
                is_estimate=False,  # Total is exact
                error=None,
                source_id=chat_id,
            )

        except FloodWaitError as e:
            # Rate limited by Telegram
            logger.warning(f"Rate limited when fetching count for {chat_id}: wait {e.seconds}s")
            return MessageCountResult(
                count=None,
                is_estimate=False,
                error=f"Rate limited. Try again in {e.seconds} seconds.",
                source_id=chat_id,
            )

        except AuthKeyError as e:
            # Authentication expired
            logger.error(f"Auth error for {chat_id}: {e}")
            return MessageCountResult(
                count=None,
                is_estimate=False,
                error="Authentication expired. Please reconnect.",
                source_id=chat_id,
            )

        except ValueError as e:
            # Invalid chat_id or missing credentials
            logger.error(f"Invalid chat_id or credentials: {e}")
            return MessageCountResult(
                count=None,
                is_estimate=False,
                error=f"Invalid chat ID or credentials: {e}",
                source_id=chat_id,
            )

        except Exception as e:
            # Unknown error
            logger.error(f"Unexpected error fetching count for {chat_id}: {e}")
            return MessageCountResult(
                count=None,
                is_estimate=False,
                error=f"Failed to fetch count: {e}",
                source_id=chat_id,
            )

        finally:
            # Always disconnect
            if self.client_service.client:
                await self.client_service.disconnect()

    async def fetch_history(
        self,
        chat_id: str,
        since: datetime | None = None,
        limit: int | None = None,
        offset_id: int = 0,
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Fetch historical messages from Telegram chat.

        Uses Telethon's iter_messages which streams messages efficiently.

        Args:
            chat_id: Telegram chat ID
            since: Only fetch messages after this datetime (local filtering)
            limit: Maximum number of messages (None = unlimited)
            offset_id: Message ID to start from (0 = latest, for pagination)

        Yields:
            Message dictionaries compatible with Message model
        """
        try:
            # Connect to Telegram
            await self.client_service.connect()

            if not self.client_service.client:
                logger.error("Client not connected, cannot fetch history")
                return

            # Ensure since is timezone-aware (Telethon returns UTC-aware datetimes)
            if since and since.tzinfo is None:
                since = since.replace(tzinfo=timezone.utc)

            logger.info(f"Fetching history from {chat_id}, since={since}, limit={limit}, offset_id={offset_id}")

            # Iterate over messages
            # Use offset_id for pagination (NOT offset_date or reverse which are incompatible)
            # Filter by date locally to avoid Telethon reverse=True issues
            count = 0
            async for message in self.client_service.client.iter_messages(
                int(chat_id),
                limit=limit,
                offset_id=offset_id,
            ):
                # Only process text messages
                if message.text:
                    # Local filtering by date
                    if since and message.date < since:
                        break  # Reached messages older than since, stop
                    yield self._convert_message(message)
                    count += 1

                    # Log progress every 100 messages
                    if count % 100 == 0:
                        logger.info(f"Fetched {count} messages from {chat_id}")

            logger.info(f"✅ Completed fetching {count} messages from {chat_id}")

        except Exception as e:
            logger.error(f"Error fetching history from {chat_id}: {e}")
            raise

        finally:
            # Always disconnect
            if self.client_service.client:
                await self.client_service.disconnect()

    async def test_connection(self) -> ConnectionTestResult:
        """Test Telegram connection.

        Verifies:
        - API credentials are configured
        - Session is valid
        - User is authorized

        Returns:
            ConnectionTestResult with success status
        """
        try:
            # Try to connect
            await self.client_service.connect()

            if not self.client_service.client:
                return ConnectionTestResult(
                    success=False,
                    error="Failed to create client",
                )

            # Check if authorized
            if not await self.client_service.client.is_user_authorized():
                return ConnectionTestResult(
                    success=False,
                    error="Session expired or invalid",
                )

            # Success
            return ConnectionTestResult(
                success=True,
                error=None,
            )

        except ValueError as e:
            # Missing credentials
            return ConnectionTestResult(
                success=False,
                error=f"Missing credentials: {e}",
            )

        except RuntimeError as e:
            # Session error
            return ConnectionTestResult(
                success=False,
                error=f"Session error: {e}",
            )

        except Exception as e:
            # Unknown error
            return ConnectionTestResult(
                success=False,
                error=f"Connection test failed: {e}",
            )

        finally:
            # Always disconnect
            if self.client_service.client:
                await self.client_service.disconnect()

    def _convert_message(self, message: TelethonMessage) -> dict[str, Any]:
        """Convert Telethon message to dict format.

        Uses same conversion logic as TelegramClientService.

        Args:
            message: Telethon message object

        Returns:
            Dict compatible with Message model
        """
        # Get sender info
        sender_name = "Unknown"
        if message.sender:
            if hasattr(message.sender, "first_name"):
                sender_name = message.sender.first_name or "Unknown"
                if hasattr(message.sender, "last_name") and message.sender.last_name:
                    sender_name += f" {message.sender.last_name}"
            elif hasattr(message.sender, "title"):
                sender_name = message.sender.title

        return {
            "message_id": message.id,
            "text": message.text or "",
            "date": int(message.date.timestamp()) if message.date else None,
            "from": {
                "id": message.sender_id,
                "first_name": sender_name,
                "last_name": getattr(message.sender, "last_name", None) if message.sender else None,
                "username": getattr(message.sender, "username", None) if message.sender else None,
                "language_code": getattr(message.sender, "lang_code", None) if message.sender else None,
                "is_bot": getattr(message.sender, "bot", False) if message.sender else False,
            },
        }
