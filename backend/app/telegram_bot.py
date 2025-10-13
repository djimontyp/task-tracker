import asyncio
from typing import Any

import httpx
from aiogram import Bot, Dispatcher, html
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)
from aiogram.utils.markdown import hbold, hitalic
from core.config import settings
from core.logging import logger, setup_logging

setup_logging()

bot = Bot(settings.telegram_bot_token, parse_mode=ParseMode.HTML)
dp = Dispatcher()


@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    """Handle /start command"""
    if not message.from_user:
        return
    user_name = html.bold(message.from_user.full_name)

    webapp_button = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🎯 Create Task", web_app=WebAppInfo(url=settings.webapp_url))],
            [InlineKeyboardButton(text="📊 Dashboard", url=f"{settings.api_base_url}/dashboard")],
        ]
    )

    await message.answer(
        f"Hello, {user_name}! 👋\n\n"
        f"Welcome to {hbold('Task Tracker')} 🎯\n\n"
        f"I help you manage tasks and track issues efficiently:\n"
        f"• Create tasks via WebApp\n"
        f"• View dashboard with statistics\n"
        f"• Real-time notifications\n\n"
        f"Use the buttons below to get started:",
        reply_markup=webapp_button,
    )


@dp.message(Command("webapp"))
async def webapp_command(message: Message) -> None:
    """Handle /webapp command"""
    webapp_button = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎯 Open Task Creator",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ]
        ]
    )

    await message.answer(
        f"{hbold('Task Creator WebApp')} 📱\n\nClick the button below to open the task creation interface:",
        reply_markup=webapp_button,
    )


@dp.message(Command("dashboard"))
async def dashboard_command(message: Message) -> None:
    """Handle /dashboard command"""
    dashboard_button = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="📊 Open Dashboard", url=f"{settings.api_base_url}/dashboard")]]
    )

    await message.answer(
        f"{hbold('Task Dashboard')} 📊\n\nView your tasks and statistics:",
        reply_markup=dashboard_button,
    )


@dp.message(Command("help"))
async def help_command(message: Message) -> None:
    """Handle /help command"""
    help_text = f"""
{hbold("Task Tracker Bot Help")} 📚

{hbold("Commands:")}
/start - Welcome message with main options
/webapp - Open task creation WebApp
/dashboard - Open web dashboard
/help - Show this help message

{hbold("Features:")}
• {hitalic("Smart message processing")} - I automatically classify messages as tasks
• {hitalic("WebApp integration")} - Create tasks with beautiful interface
• {hitalic("Real-time updates")} - WebSocket notifications
• {hitalic("Multi-channel support")} - Works with different communication channels

{hbold("Usage:")}
Just send me any message and I'll help classify it as a task, or use the WebApp for structured task creation.
    """

    await message.answer(help_text)


@dp.message()
async def process_message(message: Message) -> None:
    """Process regular messages and send to API for classification"""
    if not message.from_user:
        return

    try:
        avatar_url = None

        try:
            photos = await bot.get_user_profile_photos(message.from_user.id, limit=1)
            if photos.total_count > 0:
                largest_photo = photos.photos[0][-1]
                file = await bot.get_file(largest_photo.file_id)
                avatar_url = f"https://api.telegram.org/file/bot{settings.telegram_bot_token}/{file.file_path}"
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.warning("Failed to fetch avatar for user %s: %s", message.from_user.id, exc)

        # Prepare message data
        message_data = {
            "id": str(message.message_id),
            "content": message.text or message.caption or "[Media]",
            "author": message.from_user.full_name or "Unknown",
            "timestamp": message.date.isoformat(),
            "chat_id": str(message.chat.id),
            "user_id": message.from_user.id,
            "avatar_url": avatar_url,
        }

        # Send to FastAPI backend
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{settings.api_base_url}/api/messages", json=message_data, timeout=5.0)

            if response.status_code == 200:
                logger.info(f"✅ Message sent to API: {message_data['id']}")

                # Send acknowledgment
                await message.reply(
                    f"✅ Message received and processing!\n"
                    f"{hitalic('I will analyze this message for task classification.')}\n\n"
                    f"Use /webapp to create structured tasks."
                )
            else:
                logger.warning(f"⚠️ API error {response.status_code}: {response.text}")
                await message.reply("⚠️ Processing error. Please try again later.")

    except Exception as e:
        logger.error(f"❌ Failed to process message: {e}")
        await message.reply("❌ Failed to process message. Please try again.")


async def notify_task_created(chat_id: int, task_data: dict[str, Any]) -> None:
    """Send notification when a task is created"""
    try:
        notification_text = f"""
🎯 {hbold("New Task Created!")}

{hbold("Title:")} {task_data.get("title", "N/A")}
{hbold("Category:")} {task_data.get("category", "N/A").title()}
{hbold("Priority:")} {task_data.get("priority", "N/A").title()}
{hbold("Author:")} {task_data.get("author", "Unknown")}

{hitalic(task_data.get("description", "")[:100])}{"..." if len(task_data.get("description", "")) > 100 else ""}
        """

        await bot.send_message(chat_id, notification_text)
        logger.info(f"✅ Task notification sent to chat {chat_id}")

    except Exception as e:
        logger.error(f"❌ Failed to send task notification: {e}")


async def main() -> None:
    """Main function to run the bot"""
    logger.info("🤖 Starting Task Tracker Bot with Aiogram 3...")

    # Start polling
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
