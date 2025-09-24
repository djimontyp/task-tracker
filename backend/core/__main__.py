"""
This module is deprecated.
The Telegram bot functionality has been moved to api/telegram_bot.py using aiogram.
Use 'just bot' command to run the new Telegram bot.
"""

import sys


def main():
    print("❌ This CLI entry point is deprecated.")
    print("📱 Use 'just bot' to run the Telegram bot")
    print("🌐 Use 'just services' to start all services")
    sys.exit(1)


if __name__ == "__main__":
    main()
