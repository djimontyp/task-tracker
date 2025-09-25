from datetime import datetime
from typing import Dict, Any

from sqlmodel import select
from core.taskiq_config import nats_broker
from .database import get_db_session_context
from .api_schemas import SimpleSource, SimpleMessage


@nats_broker.task
async def process_message(message: str) -> str:
    """Example function for message processing"""

    print(f"Processing message: {message}")
    # Implementation of message processing will be here
    return f"Processed: {message}"


@nats_broker.task
async def save_telegram_message(telegram_data: Dict[str, Any]) -> str:
    """Background task to save Telegram message to database"""
    try:
        async with get_db_session_context() as db:
            message = telegram_data["message"]

            # Get or create telegram source
            source_statement = select(SimpleSource).where(SimpleSource.name == "telegram")
            result = await db.execute(source_statement)
            source = result.scalar_one_or_none()

            if not source:
                source = SimpleSource(name="telegram", created_at=datetime.now())
                db.add(source)
                await db.flush()  # Flush to get the ID
                await db.refresh(source)

            # Create message record
            db_message = SimpleMessage(
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=message.get("from", {}).get("first_name", "Unknown"),
                sent_at=datetime.fromtimestamp(message["date"]),
                source_id=source.id,
                created_at=datetime.now()
            )

            db.add(db_message)

            print(f"✅ Saved Telegram message {message['message_id']} to database")
            return f"Saved message {message['message_id']}"

    except Exception as e:
        print(f"❌ Failed to save Telegram message: {e}")
        return f"Error: {str(e)}"


if __name__ == "__main__":
    # Example usage of TaskIQ with NATS

    import asyncio

    async def main():
        """Main function for sending example task"""

        print("Sending task for message processing...")
        task = await process_message.kiq("Example message for processing")

        print("Waiting for processing result...")
        result = await task.wait_result()

        print(f"Result: {result.return_value}")

    asyncio.run(main())
