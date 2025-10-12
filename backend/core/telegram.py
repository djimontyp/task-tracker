"""
Telegram API utilities for webhook management and bot configuration.

Handles setting up webhooks, validating tokens, and managing Telegram bot configuration.
"""

from typing import Any

import httpx
from loguru import logger


class TelegramWebhookManager:
    """Manages Telegram webhook setup and configuration"""

    def __init__(self, timeout: int = 5):
        """Initialize webhook manager with timeout configuration"""
        self.timeout = timeout

    async def setup_webhook(self, bot_token: str, webhook_base_url: str) -> dict[str, Any]:
        """
        Set up Telegram webhook for the bot

        Args:
            bot_token: Telegram bot token
            webhook_base_url: Base URL where webhook will be registered

        Returns:
            Dict with setup result and any error messages

        Raises:
            httpx.HTTPError: If HTTP request fails
            ValueError: If token or URL is invalid
        """
        if not bot_token:
            raise ValueError("Bot token is required")

        if not webhook_base_url:
            raise ValueError("Webhook base URL is required")

        # Construct webhook URL
        webhook_url = f"{webhook_base_url.rstrip('/')}/webhook/telegram"

        # Construct Telegram API URL
        api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Prepare webhook data
                webhook_data = {
                    "url": webhook_url,
                    "drop_pending_updates": True,  # Clear any pending updates
                    "allowed_updates": ["message"],  # Only receive message updates
                }

                logger.info(f"Setting up Telegram webhook: {webhook_url}")

                # Make API request
                response = await client.post(api_url, json=webhook_data)
                response.raise_for_status()

                result = response.json()

                if result.get("ok"):
                    logger.success(f"Webhook setup successful for URL: {webhook_url}")
                    return {
                        "success": True,
                        "webhook_url": webhook_url,
                        "message": "Webhook configured successfully",
                        "telegram_response": result,
                    }
                else:
                    error_msg = result.get("description", "Unknown error")
                    logger.error(f"Telegram API error: {error_msg}")
                    return {
                        "success": False,
                        "error": error_msg,
                        "webhook_url": webhook_url,
                        "telegram_response": result,
                    }

        except httpx.TimeoutException:
            error_msg = f"Timeout connecting to Telegram API (>{self.timeout}s)"
            logger.error(error_msg)
            return {"success": False, "error": error_msg, "webhook_url": webhook_url}

        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.text}"
            logger.error(f"HTTP error setting webhook: {error_msg}")
            return {"success": False, "error": error_msg, "webhook_url": webhook_url}

        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"Webhook setup failed: {error_msg}")
            return {"success": False, "error": error_msg, "webhook_url": webhook_url}

    async def get_webhook_info(self, bot_token: str) -> dict[str, Any]:
        """
        Get current webhook information for the bot

        Args:
            bot_token: Telegram bot token

        Returns:
            Dict with webhook info or error message
        """
        if not bot_token:
            raise ValueError("Bot token is required")

        api_url = f"https://api.telegram.org/bot{bot_token}/getWebhookInfo"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(api_url)
                response.raise_for_status()

                result = response.json()

                if result.get("ok"):
                    return {"success": True, "info": result.get("result", {})}
                else:
                    error_msg = result.get("description", "Unknown error")
                    return {"success": False, "error": error_msg}

        except Exception as e:
            logger.error(f"Failed to get webhook info: {e}")
            return {"success": False, "error": f"Failed to get webhook info: {str(e)}"}

    async def validate_bot_token(self, bot_token: str) -> dict[str, Any]:
        """
        Validate bot token by calling getMe API

        Args:
            bot_token: Telegram bot token to validate

        Returns:
            Dict with validation result and bot info if valid
        """
        if not bot_token:
            return {"valid": False, "error": "Bot token is required"}

        api_url = f"https://api.telegram.org/bot{bot_token}/getMe"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(api_url)
                response.raise_for_status()

                result = response.json()

                if result.get("ok"):
                    bot_info = result.get("result", {})
                    return {
                        "valid": True,
                        "bot_info": {
                            "id": bot_info.get("id"),
                            "username": bot_info.get("username"),
                            "first_name": bot_info.get("first_name"),
                            "is_bot": bot_info.get("is_bot", False),
                        },
                    }
                else:
                    error_msg = result.get("description", "Invalid token")
                    return {"valid": False, "error": error_msg}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                return {"valid": False, "error": "Unauthorized: Invalid bot token"}
            else:
                return {"valid": False, "error": f"HTTP {e.response.status_code}: {e.response.text}"}

        except Exception as e:
            return {"valid": False, "error": f"Token validation failed: {str(e)}"}

    async def delete_webhook(self, bot_token: str) -> dict[str, Any]:
        """
        Delete/clear the current webhook for the bot

        Args:
            bot_token: Telegram bot token

        Returns:
            Dict with deletion result
        """
        if not bot_token:
            raise ValueError("Bot token is required")

        api_url = f"https://api.telegram.org/bot{bot_token}/deleteWebhook"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(api_url, json={"drop_pending_updates": True})
                response.raise_for_status()

                result = response.json()

                if result.get("ok"):
                    return {"success": True, "message": "Webhook deleted successfully"}
                else:
                    error_msg = result.get("description", "Unknown error")
                    return {"success": False, "error": error_msg}

        except Exception as e:
            return {"success": False, "error": f"Failed to delete webhook: {str(e)}"}


# Global instance for use throughout the application
telegram_webhook_manager = TelegramWebhookManager()
