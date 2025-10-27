"""Trigger test task via HTTP API to generate monitoring events."""
import asyncio
import json

import httpx


async def main() -> None:
    """Create dummy telegram message to trigger background tasks."""
    api_url = "http://localhost/webhook/telegram"

    # Telegram message format (simplified)
    telegram_data = {
        "message": {
            "message_id": 9999999,
            "from": {
                "id": 12345,
                "is_bot": False,
                "first_name": "Test",
                "username": "test_user",
            },
            "chat": {
                "id": 12345,
                "first_name": "Test",
                "username": "test_user",
                "type": "private",
            },
            "date": 1730000000,
            "text": "Test message for monitoring WebSocket",
        }
    }

    print("🚀 Triggering test task via Telegram webhook...")
    print("📊 Open http://localhost/dashboard/monitoring to see real-time events")
    print()

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(api_url, json=telegram_data)
            print(f"✅ Status: {response.status_code}")
            print(f"📝 Response: {response.text[:200]}")

            print()
            print("✅ Task queued! Background tasks will be triggered:")
            print("   1. save_telegram_message (immediate)")
            print("   2. score_message_task (queued after)")
            print()
            print("Check MonitoringPage for real-time events!")

        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
