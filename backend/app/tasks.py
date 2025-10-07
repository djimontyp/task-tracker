from datetime import datetime
from typing import Dict, Any, List

from loguru import logger
from sqlmodel import select

from core.taskiq_config import nats_broker
from .database import AsyncSessionLocal
from .models import SimpleSource, SimpleMessage, MessageIngestionJob, IngestionStatus
from .webhook_service import telegram_webhook_service
from .websocket import manager
from .services.telegram_ingestion_service import telegram_ingestion_service


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

            # Fetch real Telegram avatar if user_id available
            if user_id:
                try:
                    avatar_url = await telegram_webhook_service.get_user_avatar_url(
                        int(user_id)
                    )
                    if avatar_url:
                        logger.info(f"Fetched avatar URL for user {user_id}")
                except Exception as exc:
                    logger.warning(
                        "Failed to fetch avatar for Telegram user %s: %s", user_id, exc
                    )
                    avatar_url = None

            # Extract user data
            first_name = from_user.get("first_name", "")
            last_name = from_user.get("last_name", "")
            telegram_username = from_user.get("username")

            # Display name: "FirstName LastName" or fallback to username
            author = f"{first_name} {last_name}".strip() or telegram_username or "Unknown"

            db_message = SimpleMessage(
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                author=author,
                telegram_user_id=user_id,
                telegram_username=telegram_username,
                first_name=first_name,
                last_name=last_name,
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


@nats_broker.task
async def ingest_telegram_messages_task(
    job_id: int,
    chat_ids: List[str],
    limit: int = 1000,
) -> str:
    """
    Background task for ingesting messages from Telegram chats.
    
    Args:
        job_id: MessageIngestionJob ID for tracking
        chat_ids: List of Telegram chat IDs or usernames
        limit: Total messages to fetch per chat
    """
    try:
        async with AsyncSessionLocal() as db:
            # Get job
            job = await db.get(MessageIngestionJob, job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return f"Error: Job {job_id} not found"

            # Update job status to running
            job.status = IngestionStatus.running
            job.started_at = datetime.utcnow()
            await db.commit()

            # Broadcast start event
            await manager.broadcast({
                "type": "ingestion.started",
                "data": {
                    "job_id": job_id,
                    "status": "running",
                    "chat_ids": chat_ids,
                }
            })

            # Get or create source
            source = await telegram_ingestion_service.get_or_create_source(db)

            total_fetched = 0
            total_stored = 0
            total_skipped = 0
            total_errors = 0

            # Process each chat
            for chat_idx, chat_id in enumerate(chat_ids, 1):
                logger.info(f"Processing chat {chat_idx}/{len(chat_ids)}: {chat_id}")
                
                # Fetch messages in batches
                batch_size = 100  # Telegram API limit
                offset_id = 0
                messages_from_chat = 0

                while messages_from_chat < limit:
                    # Fetch batch
                    messages = await telegram_ingestion_service.fetch_chat_history(
                        chat_id=chat_id,
                        limit=min(batch_size, limit - messages_from_chat),
                        offset_id=offset_id,
                    )

                    if not messages:
                        logger.info(f"No more messages from chat {chat_id}")
                        break

                    # Process each message
                    batch_stored = 0
                    batch_skipped = 0
                    batch_errors = 0

                    for msg in messages:
                        success, reason = await telegram_ingestion_service.store_message(
                            db, msg, source
                        )
                        
                        if reason == "stored":
                            batch_stored += 1
                        elif reason == "duplicate":
                            batch_skipped += 1
                        else:
                            batch_errors += 1

                    # Update counters
                    total_fetched += len(messages)
                    total_stored += batch_stored
                    total_skipped += batch_skipped
                    total_errors += batch_errors
                    messages_from_chat += len(messages)

                    # Update job progress
                    await telegram_ingestion_service.update_job_progress(
                        db=db,
                        job=job,
                        messages_fetched=len(messages),
                        messages_stored=batch_stored,
                        messages_skipped=batch_skipped,
                        errors_count=batch_errors,
                        current_batch=chat_idx,
                    )

                    # Broadcast progress
                    await manager.broadcast({
                        "type": "ingestion.progress",
                        "data": {
                            "job_id": job_id,
                            "chat_id": chat_id,
                            "messages_fetched": total_fetched,
                            "messages_stored": total_stored,
                            "messages_skipped": total_skipped,
                            "current_chat": chat_idx,
                            "total_chats": len(chat_ids),
                        }
                    })

                    # Get last message ID for next batch
                    if messages:
                        offset_id = messages[-1].get("message_id", 0)

                    # Commit batch
                    await db.commit()

                    logger.info(
                        f"Batch complete: fetched={len(messages)}, "
                        f"stored={batch_stored}, skipped={batch_skipped}, errors={batch_errors}"
                    )

            # Mark job as completed
            job.status = IngestionStatus.completed
            job.completed_at = datetime.utcnow()
            job.total_batches = len(chat_ids)
            await db.commit()

            # Broadcast completion
            await manager.broadcast({
                "type": "ingestion.completed",
                "data": {
                    "job_id": job_id,
                    "status": "completed",
                    "messages_fetched": total_fetched,
                    "messages_stored": total_stored,
                    "messages_skipped": total_skipped,
                    "errors_count": total_errors,
                }
            })

            logger.info(
                f"✅ Ingestion job {job_id} completed: "
                f"fetched={total_fetched}, stored={total_stored}, "
                f"skipped={total_skipped}, errors={total_errors}"
            )

            return f"Completed: {total_stored} messages stored, {total_skipped} duplicates skipped"

    except Exception as e:
        logger.error(f"❌ Ingestion job {job_id} failed: {e}")
        logger.exception("Full traceback:")

        # Mark job as failed
        try:
            async with AsyncSessionLocal() as db:
                job = await db.get(MessageIngestionJob, job_id)
                if job:
                    job.status = IngestionStatus.failed
                    job.error_log = {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
                    await db.commit()

                    # Broadcast failure
                    await manager.broadcast({
                        "type": "ingestion.failed",
                        "data": {
                            "job_id": job_id,
                            "status": "failed",
                            "error": str(e),
                        }
                    })
        except Exception as inner_e:
            logger.error(f"Failed to update job status: {inner_e}")

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
