from datetime import datetime
from typing import Dict, Any

from loguru import logger
from sqlmodel import select

from core.taskiq_config import nats_broker
from .database import AsyncSessionLocal
from .models import SimpleSource, SimpleMessage
from .webhook_service import telegram_webhook_service
from .websocket import manager


@nats_broker.task
async def process_message(message: str) -> str:
    """Example function for message processing"""

    logger.info(f"Processing message: {message}")
    # Implementation of message processing will be here
    return f"Processed: {message}"


@nats_broker.task
async def save_telegram_message(telegram_data: Dict[str, Any]) -> str:
    """Background task to save Telegram message to database"""
    try:
        logger.info(
            f"Starting to save Telegram message: {telegram_data.get('message', {}).get('message_id', 'unknown')}"
        )

        async with AsyncSessionLocal() as db:
            message = telegram_data["message"]
            logger.debug(f"Processing message data: {message}")

            # Get or create telegram source
            source_statement = select(SimpleSource).where(
                SimpleSource.name == "telegram"
            )
            result = await db.execute(source_statement)
            source = result.scalar_one_or_none()

            if not source:
                logger.info("Creating new Telegram source record")
                source = SimpleSource(name="telegram", created_at=datetime.now())
                db.add(source)
                await db.flush()  # Flush to get the ID
                await db.refresh(source)
                logger.info(f"Created Telegram source with ID: {source.id}")
            else:
                logger.debug(f"Using existing Telegram source with ID: {source.id}")

            avatar_url = None

            from_user = message.get("from", {})
            user_id = from_user.get("id") or message.get("user_id")

            if user_id:
                try:
                    avatar_url = await telegram_webhook_service.get_user_avatar_url(
                        int(user_id)
                    )
                except Exception as exc:  # pragma: no cover - defensive logging
                    logger.warning(
                        "Failed to fetch avatar for Telegram user %s: %s", user_id, exc
                    )

            # Create message record
            db_message = SimpleMessage(
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=message.get("from", {}).get("first_name", "Unknown"),
                sent_at=datetime.fromtimestamp(message["date"]),
                source_id=source.id,
                created_at=datetime.now(),
                avatar_url=avatar_url,
            )

            db.add(db_message)
            logger.debug(f"Added message to session: {db_message.external_message_id}")

            # CRITICAL: Commit the transaction!
            await db.commit()
            logger.info(
                f"✅ Successfully committed Telegram message {message['message_id']} to database"
            )

            try:
                await manager.broadcast(
                    {
                        "type": "message.updated",
                        "data": {
                            "id": db_message.id,
                            "external_message_id": db_message.external_message_id,
                            "persisted": True,
                            "avatar_url": avatar_url,
                        },
                    }
                )
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.warning(
                    "Failed to broadcast persisted update for message %s: %s",
                    message["message_id"],
                    exc,
                )

            return f"Saved message {message['message_id']}"

    except Exception as e:
        logger.error(f"❌ Failed to save Telegram message: {e}")
        logger.exception("Full traceback:")
        return f"Error: {str(e)}"


if __name__ == "__main__":
    # Example usage of TaskIQ with NATS

    import asyncio

    async def main():
        """Main function for sending example task"""

        logger.info("Sending task for message processing...")
        task = await process_message.kiq("Example message for processing")

        logger.info("Waiting for processing result...")
        result = await task.wait_result()

        logger.info(f"Result: {result.return_value}")

    asyncio.run(main())
