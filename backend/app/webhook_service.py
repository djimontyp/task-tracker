import asyncio
import logging
from datetime import datetime
from typing import Dict, Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from core.config import settings
from .models import WebhookSettings
from .schemas import TelegramWebhookConfig, SetWebhookResponse

logger = logging.getLogger(__name__)


class TelegramWebhookService:
    """Service for managing Telegram webhook configuration"""

    TELEGRAM_API_BASE = "https://api.telegram.org/bot"

    def __init__(self, bot_token: str = None):
        self.bot_token = bot_token or settings.telegram_bot_token
        if not self.bot_token:
            raise ValueError("Telegram bot token is required")

    async def set_webhook(self, webhook_url: str) -> Dict[str, Any]:
        """Set Telegram webhook URL via Bot API"""
        url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/setWebhook"

        payload = {
            "url": webhook_url,
            "allowed_updates": ["message", "callback_query"]
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()

                if result.get("ok"):
                    logger.info(f"Telegram webhook set successfully: {webhook_url}")
                    return {"success": True, "data": result}
                else:
                    logger.error(f"Telegram API error: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}

        except httpx.RequestError as e:
            logger.error(f"Request error setting webhook: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error setting webhook: {e}")
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    async def delete_webhook(self) -> Dict[str, Any]:
        """Remove Telegram webhook"""
        url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/deleteWebhook"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, timeout=30.0)
                response.raise_for_status()
                result = response.json()

                if result.get("ok"):
                    logger.info("Telegram webhook deleted successfully")
                    return {"success": True, "data": result}
                else:
                    logger.error(f"Telegram API error: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}

        except httpx.RequestError as e:
            logger.error(f"Request error deleting webhook: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error deleting webhook: {e}")
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    async def get_webhook_info(self) -> Dict[str, Any]:
        """Get current webhook information from Telegram"""
        url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/getWebhookInfo"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                result = response.json()

                if result.get("ok"):
                    return {"success": True, "data": result["result"]}
                else:
                    logger.error(f"Telegram API error: {result}")
                    return {"success": False, "error": result.get("description", "Unknown error")}

        except httpx.RequestError as e:
            logger.error(f"Request error getting webhook info: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error getting webhook info: {e}")
            return {"success": False, "error": f"Unexpected error: {str(e)}"}


class WebhookSettingsService:
    """Service for managing webhook settings in database"""

    TELEGRAM_SETTINGS_NAME = "telegram_webhook"

    async def get_telegram_config(self, db: AsyncSession) -> TelegramWebhookConfig | None:
        """Get Telegram webhook configuration from database"""
        try:
            statement = select(WebhookSettings).where(
                WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME
            )
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                telegram_config = settings_record.config.get("telegram", {})
                return TelegramWebhookConfig(**telegram_config)

            return None

        except Exception as e:
            logger.error(f"Error getting telegram config: {e}")
            return None

    async def save_telegram_config(
        self,
        db: AsyncSession,
        protocol: str,
        host: str,
        is_active: bool = False
    ) -> TelegramWebhookConfig:
        """Save Telegram webhook configuration to database"""
        webhook_url = f"{protocol}://{host}/webhook/telegram"

        config_data = {
            "telegram": {
                "protocol": protocol,
                "host": host,
                "webhook_url": webhook_url,
                "is_active": is_active,
                "last_set_at": datetime.utcnow().isoformat() if is_active else None
            }
        }

        try:
            # Check if settings exist
            statement = select(WebhookSettings).where(
                WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME
            )
            result = await db.execute(statement)
            existing = result.scalars().first()

            if existing:
                # Update existing
                existing.config = config_data
                existing.is_active = is_active
                db.add(existing)
            else:
                # Create new
                new_settings = WebhookSettings(
                    name=self.TELEGRAM_SETTINGS_NAME,
                    config=config_data,
                    is_active=is_active
                )
                db.add(new_settings)

            await db.commit()
            await db.refresh(existing if existing else new_settings)

            return TelegramWebhookConfig(**config_data["telegram"])

        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving telegram config: {e}")
            raise

    async def set_telegram_webhook_active(self, db: AsyncSession, is_active: bool) -> bool:
        """Update the active status of Telegram webhook"""
        try:
            statement = select(WebhookSettings).where(
                WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME
            )
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                # Update telegram config within the JSON
                config = settings_record.config.copy()
                if "telegram" in config:
                    config["telegram"]["is_active"] = is_active
                    if is_active:
                        config["telegram"]["last_set_at"] = datetime.utcnow().isoformat()

                    settings_record.config = config
                    settings_record.is_active = is_active
                    db.add(settings_record)
                    await db.commit()
                    return True

            return False

        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating webhook active status: {e}")
            return False


# Service instances
telegram_webhook_service = TelegramWebhookService()
webhook_settings_service = WebhookSettingsService()