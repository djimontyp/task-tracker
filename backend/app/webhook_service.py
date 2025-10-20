import logging
from datetime import datetime
from typing import Any

import httpx
from core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from .models import WebhookSettings
from .schemas import TelegramWebhookConfig

logger = logging.getLogger(__name__)


class TelegramWebhookService:
    """Service for managing Telegram webhook configuration"""

    TELEGRAM_API_BASE = "https://api.telegram.org/bot"

    def __init__(self, bot_token: str | None = None):
        self.bot_token = bot_token or settings.telegram.telegram_bot_token
        if not self.bot_token:
            raise ValueError("Telegram bot token is required")

        # Simple in-memory cache for user avatar URLs to reduce Telegram API calls
        self._avatar_cache: dict[int, str] = {}

    async def set_webhook(self, webhook_url: str) -> dict[str, Any]:
        """Set Telegram webhook URL via Bot API"""
        url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/setWebhook"

        payload = {"url": webhook_url, "allowed_updates": ["message", "callback_query"]}

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
                    return {
                        "success": False,
                        "error": result.get("description", "Unknown error"),
                    }
        except httpx.RequestError as e:
            logger.error(f"Request error setting webhook: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error setting webhook: {e}")
            return {"success": False, "error": f"Unexpected error getting chat info: {str(e)}"}

    async def get_user_avatar_url(self, user_id: int) -> str | None:
        """Fetch Telegram user avatar URL using Bot API."""

        if not user_id:
            print(f"❌ get_user_avatar_url: user_id is None or 0")
            return None

        if user_id in self._avatar_cache:
            print(f"💾 get_user_avatar_url: returning cached avatar for user {user_id}")
            return self._avatar_cache[user_id]

        print(f"🔄 get_user_avatar_url: fetching avatar for user {user_id}")
        profile_photos_url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/getUserProfilePhotos"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    profile_photos_url,
                    json={"user_id": user_id, "limit": 1},
                    timeout=30.0,
                )
                response.raise_for_status()
                result = response.json()

            if not result.get("ok"):
                logger.warning(
                    "Telegram API error fetching profile photos for %s: %s",
                    user_id,
                    result.get("description", "unknown error"),
                )
                return None

            photos = result.get("result", {}).get("photos", [])
            total_count = result.get("result", {}).get("total_count", 0)
            print(f"📸 get_user_avatar_url: user {user_id} has {total_count} photos, got {len(photos)} in response")

            if not photos:
                print(f"⚠️  get_user_avatar_url: user {user_id} has no profile photos")
                return None

            # Latest photo is first in array. Take biggest size (last item)
            file_id = photos[0][-1]["file_id"]

            get_file_url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/getFile"
            async with httpx.AsyncClient() as client:
                file_response = await client.post(get_file_url, json={"file_id": file_id}, timeout=30.0)
                file_response.raise_for_status()
                file_result = file_response.json()

            if not file_result.get("ok"):
                logger.warning(
                    "Telegram API error fetching file for %s: %s",
                    user_id,
                    file_result.get("description", "unknown error"),
                )
                return None

            file_path = file_result.get("result", {}).get("file_path")
            if not file_path:
                print(f"❌ get_user_avatar_url: no file_path in response for user {user_id}")
                return None

            avatar_url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
            self._avatar_cache[user_id] = avatar_url
            print(f"✅ get_user_avatar_url: successfully got avatar for user {user_id}: {avatar_url[:50]}...")
            return avatar_url

        except httpx.RequestError as exc:
            logger.error("Failed to fetch avatar for user %s: %s", user_id, exc)
            return None
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Unexpected error fetching avatar for user %s: %s", user_id, exc)
            return None

    async def delete_webhook(self) -> dict[str, Any]:
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
                    return {
                        "success": False,
                        "error": result.get("description", "Unknown error"),
                    }

        except httpx.RequestError as e:
            logger.error(f"Request error deleting webhook: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error deleting webhook: {e}")
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    async def get_webhook_info(self) -> dict[str, Any]:
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
                    return {
                        "success": False,
                        "error": result.get("description", "Unknown error"),
                    }

        except httpx.RequestError as e:
            logger.error(f"Request error getting webhook info: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error getting webhook info: {e}")
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    async def get_chat_info(self, chat_id: int) -> dict[str, Any]:
        """Get chat information from Telegram"""
        url = f"{self.TELEGRAM_API_BASE}{self.bot_token}/getChat"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json={"chat_id": chat_id}, timeout=30.0)
                response.raise_for_status()
                result = response.json()

                if result.get("ok"):
                    chat_data = result["result"]
                    return {
                        "success": True,
                        "data": {
                            "id": chat_data["id"],
                            "name": chat_data.get("title") or chat_data.get("first_name") or f"Chat {chat_id}",
                            "type": chat_data.get("type"),
                        },
                    }
                else:
                    logger.error(f"Telegram API error for chat {chat_id}: {result}")
                    return {
                        "success": False,
                        "error": result.get("description", "Unknown error"),
                    }

        except httpx.RequestError as e:
            logger.error(f"Request error getting chat info for {chat_id}: {e}")
            return {"success": False, "error": f"Request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error getting chat info for {chat_id}: {e}")
            return {"success": False, "error": f"Unexpected error: {str(e)}"}


class WebhookSettingsService:
    """Service for managing webhook settings in database"""

    TELEGRAM_SETTINGS_NAME = "telegram_webhook"

    @staticmethod
    def _dict_to_telegram_config(data: dict[str, Any]) -> TelegramWebhookConfig:
        """Convert dict to TelegramWebhookConfig, handling type conversions"""
        from .schemas import TelegramGroupInfo

        last_set_at_str = data.get("last_set_at")
        last_set_at = datetime.fromisoformat(last_set_at_str) if last_set_at_str else None

        groups_raw = data.get("groups", [])
        groups = [TelegramGroupInfo(**g) if isinstance(g, dict) else g for g in groups_raw]

        return TelegramWebhookConfig(
            protocol=data.get("protocol", "https"),
            host=data.get("host", ""),
            webhook_url=data.get("webhook_url"),
            is_active=data.get("is_active", False),
            last_set_at=last_set_at,
            groups=groups,
        )

    async def get_telegram_config(self, db: AsyncSession) -> TelegramWebhookConfig | None:
        """Get Telegram webhook configuration from database"""
        try:
            statement = select(WebhookSettings).where(WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME)
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                telegram_config = settings_record.config.get("telegram", {})
                return self._dict_to_telegram_config(telegram_config)

            return None

        except Exception as e:
            logger.error(f"Error getting telegram config: {e}")
            return None

    async def save_telegram_config(
        self,
        db: AsyncSession,
        protocol: str,
        host: str,
        is_active: bool = False,
        groups: list[dict] | None = None,
    ) -> TelegramWebhookConfig:
        """Save Telegram webhook configuration to database"""
        normalized_host = host.strip().rstrip("/")
        webhook_url = f"{protocol}://{normalized_host}/webhook/telegram"

        config_data = {
            "telegram": {
                "protocol": protocol,
                "host": normalized_host,
                "webhook_url": webhook_url,
                "is_active": is_active,
                "last_set_at": datetime.utcnow().isoformat() if is_active else None,
                "groups": groups or [],
            }
        }

        try:
            # Check if settings exist
            statement = select(WebhookSettings).where(WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME)
            result = await db.execute(statement)
            existing = result.scalars().first()

            if existing:
                # Update existing
                from sqlalchemy.orm.attributes import flag_modified

                existing.config = config_data
                existing.is_active = is_active
                flag_modified(existing, "config")
                db.add(existing)
            else:
                # Create new
                new_settings = WebhookSettings(
                    name=self.TELEGRAM_SETTINGS_NAME,
                    config=config_data,
                    is_active=is_active,
                )
                db.add(new_settings)

            await db.commit()
            await db.refresh(existing if existing else new_settings)

            return self._dict_to_telegram_config(config_data["telegram"])

        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving telegram config: {e}")
            raise

    async def set_telegram_webhook_active(self, db: AsyncSession, is_active: bool) -> TelegramWebhookConfig | None:
        """Update the active status of Telegram webhook"""
        try:
            statement = select(WebhookSettings).where(WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME)
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                # Create a deep copy and update
                import copy

                from sqlalchemy.orm.attributes import flag_modified

                config = copy.deepcopy(settings_record.config)
                if "telegram" in config:
                    config["telegram"]["is_active"] = is_active
                    if is_active:
                        config["telegram"]["last_set_at"] = datetime.utcnow().isoformat()
                    else:
                        config["telegram"]["last_set_at"] = None

                    # Preserve groups if they exist
                    if "groups" not in config["telegram"]:
                        config["telegram"]["groups"] = []

                    settings_record.config = config
                    settings_record.is_active = is_active
                    flag_modified(settings_record, "config")
                    db.add(settings_record)
                    await db.commit()
                    await db.refresh(settings_record)
                    return self._dict_to_telegram_config(config["telegram"])

            return None

        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating webhook active status: {e}")
            return None

    async def add_telegram_group(self, db: AsyncSession, group_info: dict) -> TelegramWebhookConfig | None:
        """Add a Telegram group to configuration"""
        try:
            statement = select(WebhookSettings).where(WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME)
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                import copy

                from sqlalchemy.orm.attributes import flag_modified

                config = copy.deepcopy(settings_record.config)
                if "telegram" in config:
                    groups = config["telegram"].get("groups", [])
                    # Check if group already exists
                    if not any(g["id"] == group_info["id"] for g in groups):
                        groups.append(group_info)
                        config["telegram"]["groups"] = groups
                        settings_record.config = config
                        flag_modified(settings_record, "config")
                        db.add(settings_record)
                        await db.commit()
                        await db.refresh(settings_record)
                    return self._dict_to_telegram_config(config["telegram"])
            else:
                # Create new settings if not exists
                config_data = {
                    "telegram": {
                        "protocol": "https",
                        "host": "",
                        "webhook_url": None,
                        "is_active": False,
                        "last_set_at": None,
                        "groups": [group_info],
                    }
                }
                new_settings = WebhookSettings(
                    name=self.TELEGRAM_SETTINGS_NAME,
                    config=config_data,
                    is_active=False,
                )
                db.add(new_settings)
                await db.commit()
                await db.refresh(new_settings)
                return self._dict_to_telegram_config(config_data["telegram"])

            return None

        except Exception as e:
            await db.rollback()
            logger.error(f"Error adding telegram group: {e}")
            return None

    async def remove_telegram_group(self, db: AsyncSession, group_id: int) -> TelegramWebhookConfig | None:
        """Remove a Telegram group from configuration"""
        try:
            statement = select(WebhookSettings).where(WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME)
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                import copy

                from sqlalchemy.orm.attributes import flag_modified

                config = copy.deepcopy(settings_record.config)
                if "telegram" in config:
                    groups = config["telegram"].get("groups", [])
                    # Remove group with matching ID
                    updated_groups = [g for g in groups if g["id"] != group_id]
                    config["telegram"]["groups"] = updated_groups
                    settings_record.config = config
                    flag_modified(settings_record, "config")
                    db.add(settings_record)
                    await db.commit()
                    await db.refresh(settings_record)
                    return self._dict_to_telegram_config(config["telegram"])

            return None

        except Exception as e:
            await db.rollback()
            logger.error(f"Error removing telegram group: {e}")
            return None

    async def update_group_names(
        self, db: AsyncSession, telegram_service: "TelegramWebhookService"
    ) -> TelegramWebhookConfig | None:
        """Update all group names by fetching from Telegram"""
        try:
            statement = select(WebhookSettings).where(WebhookSettings.name == self.TELEGRAM_SETTINGS_NAME)
            result = await db.execute(statement)
            settings_record = result.scalars().first()

            if settings_record:
                import copy

                from sqlalchemy.orm.attributes import flag_modified

                config = copy.deepcopy(settings_record.config)
                if "telegram" in config:
                    groups = config["telegram"].get("groups", [])
                    updated_groups = []

                    for group in groups:
                        chat_info = await telegram_service.get_chat_info(group["id"])
                        if chat_info["success"]:
                            updated_groups.append({
                                "id": group["id"],
                                "name": chat_info["data"]["name"],
                            })
                        else:
                            # Keep old data if fetch fails
                            updated_groups.append(group)

                    config["telegram"]["groups"] = updated_groups
                    settings_record.config = config
                    flag_modified(settings_record, "config")
                    db.add(settings_record)
                    await db.commit()
                    await db.refresh(settings_record)
                    return self._dict_to_telegram_config(config["telegram"])

            return None

        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating group names: {e}")
            return None


# Service instances
telegram_webhook_service = TelegramWebhookService()
webhook_settings_service = WebhookSettingsService()
