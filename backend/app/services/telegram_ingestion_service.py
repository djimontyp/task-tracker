"""Service for ingesting historical messages from Telegram."""
import logging
from datetime import datetime
from typing import List, Dict, Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import (
    SimpleMessage,
    SimpleSource,
    MessageIngestionJob,
    IngestionStatus,
)
from app.webhook_service import TelegramWebhookService
from app.services.telegram_client_service import get_telegram_client_service
from core.config import settings

logger = logging.getLogger(__name__)


class TelegramIngestionService:
    """Service for fetching historical messages from Telegram groups."""

    TELEGRAM_API_BASE = "https://api.telegram.org/bot"

    def __init__(self, bot_token: str = None):
        self.bot_token = bot_token or settings.telegram_bot_token
        if not self.bot_token:
            raise ValueError("Telegram bot token is required")
        self.telegram_service = TelegramWebhookService(bot_token=self.bot_token)

    async def fetch_chat_history(
        self,
        chat_id: str,
        limit: int = 100,
        offset_id: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical messages from a Telegram chat using Telethon Client API.
        
        This uses Telegram Client API (MTProto) instead of Bot API,
        which allows fetching historical messages.
        
        IMPORTANT: Requires Telegram user authentication (not bot token)!
        
        Args:
            chat_id: Telegram chat ID (e.g., -1002988379206)
            limit: Number of messages to fetch
            offset_id: Message ID to start from (0 = latest)
            
        Returns:
            List of message objects
        """
        logger.info(f"Attempting to fetch {limit} messages from chat {chat_id}")
        
        try:
            # Get Telegram Client service
            client_service = get_telegram_client_service()
            
            # Connect to Telegram (will use existing session if available)
            await client_service.connect()
            
            # Fetch messages
            messages = await client_service.fetch_group_history(
                chat_id=int(chat_id),
                limit=limit,
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
            logger.error(
                f"⚠️  Telegram authentication required: {e}. "
                f"Please run authentication setup first."
            )
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
        message_data: Dict[str, Any],
        source: SimpleSource,
    ) -> tuple[bool, str]:
        """
        Store a single message in the database.
        
        Returns:
            (success: bool, reason: str) - reason is 'stored', 'duplicate', or 'error'
        """
        try:
            message_id = str(message_data.get("message_id", ""))
            if not message_id:
                return False, "error"

            # Check for duplicate by external_message_id
            existing_stmt = select(SimpleMessage).where(
                SimpleMessage.external_message_id == message_id
            )
            result = await db.execute(existing_stmt)
            existing = result.scalar_one_or_none()

            if existing:
                logger.debug(f"Message {message_id} already exists, skipping")
                return False, "duplicate"

            # Extract message data
            text = message_data.get("text", "")
            from_user = message_data.get("from", {})
            user_id = from_user.get("id")

            # Extract user data
            first_name = from_user.get("first_name", "")
            last_name = from_user.get("last_name", "")
            telegram_username = from_user.get("username")

            # Display name: "FirstName LastName" or fallback to username
            author = f"{first_name} {last_name}".strip() or telegram_username or "Unknown"
            
            # Get timestamp
            timestamp = message_data.get("date")
            if timestamp:
                sent_at = datetime.fromtimestamp(timestamp)
            else:
                sent_at = datetime.utcnow()

            # Fetch avatar if user_id available
            avatar_url = None
            if user_id:
                try:
                    avatar_url = await self.telegram_service.get_user_avatar_url(user_id)
                except Exception as e:
                    logger.warning(f"Failed to fetch avatar for user {user_id}: {e}")

            # Create message
            db_message = SimpleMessage(
                external_message_id=message_id,
                content=text or "[No text content]",
                author=author,
                telegram_user_id=user_id,
                telegram_username=telegram_username,
                first_name=first_name,
                last_name=last_name,
                sent_at=sent_at,
                source_id=source.id,
                created_at=datetime.utcnow(),
                avatar_url=avatar_url,
                analyzed=False,
            )

            db.add(db_message)
            await db.flush()
            
            logger.info(f"Stored message {message_id} from {author}")
            return True, "stored"

        except Exception as e:
            logger.error(f"Error storing message: {e}")
            return False, "error"

    async def get_or_create_source(
        self, db: AsyncSession, source_name: str = "telegram"
    ) -> SimpleSource:
        """Get or create Telegram source."""
        stmt = select(SimpleSource).where(SimpleSource.name == source_name)
        result = await db.execute(stmt)
        source = result.scalar_one_or_none()

        if not source:
            source = SimpleSource(name=source_name, created_at=datetime.utcnow())
            db.add(source)
            await db.flush()
            await db.refresh(source)
            logger.info(f"Created new source: {source_name}")

        return source

    async def update_job_progress(
        self,
        db: AsyncSession,
        job: MessageIngestionJob,
        messages_fetched: int = 0,
        messages_stored: int = 0,
        messages_skipped: int = 0,
        errors_count: int = 0,
        current_batch: int = 0,
    ):
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
