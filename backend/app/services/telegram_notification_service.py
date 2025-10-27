import os

import httpx


class TelegramNotificationService:
    def __init__(self) -> None:
        self.bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not self.bot_token:
            raise ValueError("TELEGRAM_BOT_TOKEN not configured")
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_message(self, chat_id: str, text: str) -> dict[str, object]:
        """Send Telegram message."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
                timeout=10.0,
            )
            if response.status_code != 200:
                raise ValueError(f"Telegram API error: {response.text}")
            result: dict[str, object] = response.json()
            return result

    async def send_test_notification(self, chat_id: str) -> dict[str, object]:
        """Send test notification."""
        text = (
            "*Task Tracker Test*\n\n"
            "Telegram notifications are working correctly!\n\n"
            "You can now receive alerts and daily digests."
        )
        return await self.send_message(chat_id, text)

    async def send_pending_alert(self, chat_id: str, pending_count: int) -> dict[str, object]:
        """Send pending alert."""
        dashboard_url = os.getenv("DASHBOARD_URL", "http://localhost")
        text = (
            f"*Pending Versions Alert*\n\n"
            f"You have *{pending_count}* versions awaiting review.\n\n"
            f"[View Dashboard]({dashboard_url})"
        )
        return await self.send_message(chat_id, text)

    async def send_daily_digest(self, chat_id: str, stats: dict[str, int]) -> dict[str, object]:
        """Send daily digest."""
        dashboard_url = os.getenv("DASHBOARD_URL", "http://localhost")
        text = (
            "*Daily Automation Digest*\n\n"
            f"Auto-Approved: *{stats['approved']}*\n"
            f"Rejected: *{stats['rejected']}*\n"
            f"Pending Review: *{stats['pending']}*\n"
            f"Auto-Approval Rate: *{stats['auto_approval_rate']}%*\n\n"
            f"[View Dashboard]({dashboard_url})"
        )
        return await self.send_message(chat_id, text)


telegram_service = TelegramNotificationService()
