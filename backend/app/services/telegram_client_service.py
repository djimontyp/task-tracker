"""
Telegram Client Service using Telethon for fetching historical messages.

This service uses Telegram Client API (MTProto) instead of Bot API,
which allows fetching historical messages from groups.

IMPORTANT: Requires user authentication (phone number + code), not bot token!
"""
import logging
from typing import List, Dict, Any
from datetime import datetime

from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import Message as TelethonMessage

from core.config import settings

logger = logging.getLogger(__name__)


class TelegramClientService:
    """
    Service for fetching historical messages using Telegram Client API (MTProto).
    
    This is different from Bot API - it requires user account authentication.
    """

    def __init__(self, api_id: int = None, api_hash: str = None, session_name: str = "task_tracker"):
        """
        Initialize Telegram Client.
        
        Args:
            api_id: Telegram API ID (get from https://my.telegram.org)
            api_hash: Telegram API Hash
            session_name: Session file name for storing auth
        """
        self.api_id = api_id or getattr(settings, 'telegram_api_id', None)
        self.api_hash = api_hash or getattr(settings, 'telegram_api_hash', None)
        self.session_string = getattr(settings, 'telegram_session_string', None)
        self.client: TelegramClient | None = None

    async def connect(self, phone: str = None):
        """
        Connect to Telegram and authenticate.

        Args:
            phone: Phone number for authentication (only needed first time)
        """
        if not self.api_id or not self.api_hash:
            raise ValueError(
                "No API credentials. Set TELEGRAM_API_ID and TELEGRAM_API_HASH."
            )

        if not self.session_string:
            raise ValueError(
                "No session string. Generate one using backend/scripts/generate_session.py "
                "and set TELEGRAM_SESSION_STRING in .env"
            )

        logger.info("Connecting to Telegram with StringSession")

        # Use provided session string
        session = StringSession(self.session_string)
        self.client = TelegramClient(session, self.api_id, self.api_hash)

        # Connect without phone (session already authorized)
        await self.client.connect()

        if not await self.client.is_user_authorized():
            logger.error("❌ Session is not authorized! Please regenerate session string.")
            raise RuntimeError(
                "Session expired or invalid. Regenerate using backend/scripts/generate_session.py"
            )

        logger.info("✅ Successfully connected to Telegram with existing session")

    async def disconnect(self):
        """Disconnect from Telegram."""
        if self.client:
            await self.client.disconnect()
            logger.info("Disconnected from Telegram")

    async def fetch_group_history(
        self,
        chat_id: int | str,
        limit: int = 100,
        offset_date: datetime | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical messages from a Telegram group.
        
        Args:
            chat_id: Group chat ID (e.g., -1002988379206)
            limit: Number of messages to fetch
            offset_date: Fetch messages before this date
            
        Returns:
            List of message dictionaries
        """
        if not self.client:
            raise RuntimeError("Client not connected. Call connect() first.")

        logger.info(f"Fetching {limit} messages from chat {chat_id}")
        
        messages = []
        try:
            # Fetch messages using Telethon
            async for message in self.client.iter_messages(
                chat_id,
                limit=limit,
                offset_date=offset_date,
            ):
                if message.text:  # Only text messages for now
                    messages.append(self._convert_message(message))
            
            logger.info(f"✅ Fetched {len(messages)} messages from chat {chat_id}")
            return messages
            
        except Exception as e:
            logger.error(f"Error fetching messages from {chat_id}: {e}")
            raise

    def _convert_message(self, message: TelethonMessage) -> Dict[str, Any]:
        """
        Convert Telethon message to our format.
        
        Args:
            message: Telethon message object
            
        Returns:
            Dict with message data compatible with our SimpleMessage model
        """
        # Get sender info
        sender_name = "Unknown"
        if message.sender:
            if hasattr(message.sender, 'first_name'):
                sender_name = message.sender.first_name or "Unknown"
                if hasattr(message.sender, 'last_name') and message.sender.last_name:
                    sender_name += f" {message.sender.last_name}"
            elif hasattr(message.sender, 'title'):
                sender_name = message.sender.title
        
        return {
            "message_id": message.id,
            "text": message.text or "",
            "date": int(message.date.timestamp()) if message.date else None,
            "from": {
                "id": message.sender_id,
                "first_name": sender_name,
                "username": getattr(message.sender, 'username', None) if message.sender else None,
            }
        }


# Singleton instance (will be initialized when needed)
telegram_client_service: TelegramClientService | None = None


def get_telegram_client_service() -> TelegramClientService:
    """
    Get or create Telegram Client Service instance.
    
    Returns:
        TelegramClientService instance
    """
    global telegram_client_service
    
    if telegram_client_service is None:
        telegram_client_service = TelegramClientService()
    
    return telegram_client_service
