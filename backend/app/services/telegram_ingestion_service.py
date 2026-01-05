"""Service for ingesting historical messages from Telegram."""

import logging
from datetime import datetime
from typing import Any

from core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import (
    Message,
    MessageIngestionJob,
    Source,
)
from app.services.telegram_client_service import get_telegram_client_service
from app.services.user_service import identify_or_create_user
from app.webhook_service import TelegramWebhookService

logger = logging.getLogger(__name__)


class TelegramIngestionService:
    """Service for fetching historical messages from Telegram groups."""

    TELEGRAM_API_BASE = "https://api.telegram.org/bot"

    def __init__(self, bot_token: str | None = None) -> None:
        self.bot_token = bot_token or settings.telegram.telegram_bot_token
        if not self.bot_token:
            raise ValueError("Telegram bot token is required")
        self.telegram_service = TelegramWebhookService(bot_token=self.bot_token)

    async def fetch_chat_history(
        self,
        chat_id: str,
        limit: int = 100,
        offset_id: int = 0,
        offset_date: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """
        Fetch historical messages from a Telegram chat using Telethon Client API.

        This uses Telegram Client API (MTProto) instead of Bot API,
        which allows fetching historical messages.

        IMPORTANT: Requires Telegram user authentication (not bot token)!

        Args:
            chat_id: Telegram chat ID (e.g., -1002988379206)
            limit: Number of messages to fetch
            offset_id: Message ID to start from (0 = latest)
            offset_date: Only fetch messages newer than this date

        Returns:
            List of message objects
        """
        date_filter = f" (after {offset_date})" if offset_date else ""
        logger.info(f"Attempting to fetch {limit} messages from chat {chat_id}{date_filter}")

        try:
            # Get Telegram Client service
            client_service = get_telegram_client_service()

            # Connect to Telegram (will use existing session if available)
            await client_service.connect()

            # Fetch messages with optional time filter
            messages = await client_service.fetch_group_history(
                chat_id=int(chat_id),
                limit=limit,
                offset_date=offset_date,
            )

            logger.info(f"Successfully fetched {len(messages)} messages from chat {chat_id}")
            return messages

        except ValueError as e:
            logger.error(
                f"⚠️  Telegram API credentials not configured: {e}. "
                f"Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in environment."
            )
            return []
        except RuntimeError as e:
            logger.error(f"⚠️  Telegram authentication required: {e}. Please run authentication setup first.")
            return []
        except Exception as e:
            logger.error(f"Error fetching chat history: {e}")
            return []
        finally:
            # Disconnect after fetching
            if client_service.client:
                await client_service.disconnect()

    async def store_message(
        self,
        db: AsyncSession,
        message_data: dict[str, Any],
        source: Source,
    ) -> tuple[bool, str]:
        """
        Store a single message in the database.

        Uses identify_or_create_user() to auto-create User and TelegramProfile.

        Returns:
            (success: bool, reason: str) - reason is 'stored', 'duplicate', or 'error'
        """
        try:
            message_id = str(message_data.get("message_id", ""))
            if not message_id:
                return False, "error"

            existing_stmt = select(Message).where(Message.external_message_id == message_id)
            result = await db.execute(existing_stmt)
            existing = result.scalar_one_or_none()

            if existing:
                logger.debug(f"Message {message_id} already exists, skipping")
                return False, "duplicate"

            text = message_data.get("text", "")
            from_user = message_data.get("from", {})
            telegram_user_id = from_user.get("id")

            if not telegram_user_id:
                logger.warning(f"Message {message_id} has no sender, skipping")
                return False, "error"

            first_name = from_user.get("first_name", "")
            last_name = from_user.get("last_name")
            language_code = from_user.get("language_code")
            is_bot = from_user.get("is_bot", False)

            timestamp = message_data.get("date")
            if timestamp:
                sent_at = datetime.fromtimestamp(timestamp)
            else:
                sent_at = datetime.utcnow()

            user, tg_profile = await identify_or_create_user(
                db=db,
                telegram_user_id=telegram_user_id,
                first_name=first_name,
                last_name=last_name,
                language_code=language_code,
                is_bot=is_bot,
            )

            avatar_url = user.avatar_url
            if not avatar_url:
                try:
                    avatar_url = await self.telegram_service.get_user_avatar_url(telegram_user_id)
                    if avatar_url:
                        user.avatar_url = avatar_url
                        await db.flush()
                except Exception as e:
                    logger.warning(f"Failed to fetch avatar for user {telegram_user_id}: {e}")

            db_message = Message(
                external_message_id=message_id,
                content=text or "[No text content]",
                sent_at=sent_at,
                source_id=source.id,
                author_id=user.id,
                telegram_profile_id=tg_profile.id,
                avatar_url=avatar_url,
                analyzed=False,
            )

            db.add(db_message)
            await db.flush()

            logger.info(f"Stored message {message_id} from {user.full_name}")
            return True, "stored"

        except Exception as e:
            logger.error(f"Error storing message: {e}")
            return False, "error"

    async def update_job_progress(
        self,
        db: AsyncSession,
        job: MessageIngestionJob,
        messages_fetched: int = 0,
        messages_stored: int = 0,
        messages_skipped: int = 0,
        errors_count: int = 0,
        current_batch: int = 0,
    ) -> None:
        """Update job progress counters."""
        if messages_fetched > 0:
            job.messages_fetched += messages_fetched
        if messages_stored > 0:
            job.messages_stored += messages_stored
        if messages_skipped > 0:
            job.messages_skipped += messages_skipped
        if errors_count > 0:
            job.errors_count += errors_count
        if current_batch > 0:
            job.current_batch = current_batch

        await db.commit()
        await db.refresh(job)


# Singleton instance
telegram_ingestion_service = TelegramIngestionService()
