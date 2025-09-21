from typing import Any, Dict, List

from loguru import logger
from telegram.ext import Application, ContextTypes, MessageHandler, filters

from telegram import Update


class TelegramAdapter:
    """Simple adapter for receiving messages from Telegram groups"""

    def __init__(self, bot_token: str, group_chat_id: str):
        self.bot_token = bot_token
        self.group_chat_id = group_chat_id
        self.processed_messages = set()
        self.new_messages = []

        # Create application
        self.application = Application.builder().token(bot_token).build()

        # Handler for all messages from our group
        self.application.add_handler(
            MessageHandler(
                filters.ALL & filters.Chat(chat_id=int(group_chat_id)),
                self._handle_message,
            )
        )

        logger.debug(f"TelegramAdapter ready for group {group_chat_id}")

    async def _handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle new message"""
        message = update.message
        if not message:
            return

        message_id = str(message.message_id)
        if message_id in self.processed_messages:
            return

        # Create message data
        message_data = {
            "id": message_id,
            "content": message.text or message.caption or "[Media]",
            "author": message.from_user.full_name if message.from_user else "Unknown",
            "timestamp": message.date.isoformat(),
            "chat_id": str(message.chat_id),
        }

        self.new_messages.append(message_data)
        logger.info(f"📨 {message_data['author']}: {message_data['content']}")

    async def fetch_messages(self) -> List[Dict[str, Any]]:
        """Get new messages"""
        messages = self.new_messages.copy()
        self.new_messages.clear()
        return messages

    async def normalize_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize message to standard format"""
        return {
            "external_id": message["id"],
            "content": message["content"],
            "author": message["author"],
            "timestamp": message["timestamp"],
            "source_type": "telegram",
            "source_id": message["chat_id"],
        }

    async def mark_as_processed(self, message_id: str) -> None:
        """Mark message as processed"""
        self.processed_messages.add(message_id)

    def start_polling(self):
        """Start listening for messages"""
        logger.debug("Starting Telegram listener...")
        self.application.run_polling()
