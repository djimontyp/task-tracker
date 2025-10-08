"""
Script for Telegram Client authentication (one-time setup).

This script helps you authenticate with Telegram using your phone number.
After successful authentication, a session file will be created and you won't
need to authenticate again.

Usage:
    python scripts/telegram_auth.py
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.telegram_client_service import TelegramClientService
from core.config import settings


async def main():
    """Run Telegram authentication."""
    print("=" * 60)
    print("Telegram Client Authentication Setup")
    print("=" * 60)
    print()
    
    # Check if credentials are configured
    if not settings.telegram_api_id or not settings.telegram_api_hash:
        print("❌ ERROR: Telegram API credentials not configured!")
        print()
        print("Please set the following environment variables:")
        print("  TELEGRAM_API_ID=your_api_id")
        print("  TELEGRAM_API_HASH=your_api_hash")
        print()
        print("Get them from: https://my.telegram.org/apps")
        return
    
    print(f"✅ API ID: {settings.telegram_api_id}")
    print(f"✅ API Hash: {settings.telegram_api_hash[:8]}...")
    print()
    
    # Get phone number
    phone = input("Enter your phone number (with country code, e.g., +380123456789): ")
    if not phone:
        print("❌ Phone number is required!")
        return
    
    print()
    print("Connecting to Telegram...")
    print()
    
    # Create client and authenticate
    # Use telegram_sessions directory if exists (for Docker compatibility)
    import os
    sessions_dir = "telegram_sessions" if os.path.exists("telegram_sessions") else "."
    session_path = f"{sessions_dir}/task_tracker"
    
    from telethon import TelegramClient
    client = TelegramClient(session_path, settings.telegram_api_id, settings.telegram_api_hash)
    
    try:
        await client.start(phone=phone)
        
        print()
        print("=" * 60)
        print("✅ SUCCESS! Authentication completed!")
        print("=" * 60)
        print()
        print(f"Session file created: {session_path}.session")
        print("You can now use message ingestion without re-authenticating.")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR: {e}")
        print("=" * 60)
        print()
    finally:
        if client:
            await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
