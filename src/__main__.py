import sys

from loguru import logger

from src.cli import TaskTrackerCLI
from src.config import settings
from src.telegram_adapter import TelegramAdapter


def setup_logging():
    """Setup logging configuration"""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level=settings.log_level,
    )


def run_telegram():
    """Start Telegram listener"""
    setup_logging()

    # Check configuration
    if not settings.telegram_bot_token:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        logger.info("Add to .env: TELEGRAM_BOT_TOKEN=your_token")
        return

    if not settings.telegram_group_chat_id:
        logger.error("TELEGRAM_GROUP_CHAT_ID not set!")
        logger.info("Add to .env: TELEGRAM_GROUP_CHAT_ID=your_chat_id")
        return

    logger.info(f"🤖 Starting Task Tracker for group {settings.telegram_group_chat_id}")

    # Create and start adapter
    adapter = TelegramAdapter(
        bot_token=settings.telegram_bot_token,
        group_chat_id=settings.telegram_group_chat_id,
    )

    logger.success("✅ Listening to Telegram group... Ctrl+C to stop")
    adapter.start_polling()


def run_cli():
    """Start interactive CLI"""
    app = TaskTrackerCLI()
    app.run()


def main():
    """Entry point for Task Tracker"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "tg":
            run_telegram()
        elif command == "cli":
            run_cli()
        else:
            print("Available commands:")
            print("  tg - Start Telegram listener")
            print("  cli      - Start interactive CLI")
            sys.exit(1)
    else:
        # Default: start Telegram listener
        run_telegram()


if __name__ == "__main__":
    main()
