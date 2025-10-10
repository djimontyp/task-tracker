from datetime import datetime
from typing import Dict, Any, List

from loguru import logger
from sqlmodel import select

from core.taskiq_config import nats_broker
from .database import AsyncSessionLocal
from .models import Source, Message, MessageIngestionJob, IngestionStatus, User, TelegramProfile
from .services.user_service import identify_or_create_user, get_or_create_source
from .webhook_service import telegram_webhook_service
from .services.websocket_manager import websocket_manager
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
            source = await get_or_create_source(db, name="telegram")

            from_user = message.get("from", {})
            telegram_user_id = from_user.get("id") or message.get("user_id")

            if not telegram_user_id:
                logger.warning(f"Message {message['message_id']} has no sender, skipping")
                return f"❌ Skipped message {message['message_id']}: no sender"

            # Extract user data
            first_name = from_user.get("first_name", "Unknown")
            last_name = from_user.get("last_name")
            language_code = from_user.get("language_code")
            is_bot = from_user.get("is_bot", False)

            # Identify or create User + TelegramProfile
            user, tg_profile = await identify_or_create_user(
                db=db,
                telegram_user_id=telegram_user_id,
                first_name=first_name,
                last_name=last_name,
                language_code=language_code,
                is_bot=is_bot,
            )

            # Fetch avatar if not set
            avatar_url = user.avatar_url
            if not avatar_url:
                try:
                    avatar_url = await telegram_webhook_service.get_user_avatar_url(
                        int(telegram_user_id)
                    )
                    if avatar_url:
                        user.avatar_url = avatar_url
                        await db.flush()
                        logger.info(f"Fetched and updated avatar for user {user.id}")
                except Exception as exc:
                    logger.warning(
                        f"Failed to fetch avatar for Telegram user {telegram_user_id}: {exc}"
                    )

            # Create message
            db_message = Message(
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                sent_at=datetime.fromtimestamp(message["date"]),
                source_id=source.id,
                author_id=user.id,
                telegram_profile_id=tg_profile.id,
                avatar_url=avatar_url,
                analyzed=False,
            )

            db.add(db_message)
            logger.debug(f"Added message to session: {db_message.external_message_id}")

            # CRITICAL: Commit the transaction!
            await db.commit()
            logger.info(
                f"✅ Successfully committed Telegram message {message['message_id']} from {user.full_name}"
            )

            # Broadcast full message data after persisting to DB
            try:
                await websocket_manager.broadcast(
                    "messages",
                    {
                        "type": "message.updated",
                        "data": {
                            "id": db_message.id,
                            "external_message_id": db_message.external_message_id,
                            "author_id": user.id,
                            "author_name": user.full_name,
                            "source_id": source.id,
                            "source_name": source.name,
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
            await websocket_manager.broadcast("messages", {
                "type": "ingestion.started",
                "data": {
                    "job_id": job_id,
                    "status": "running",
                    "chat_ids": chat_ids,
                }
            })

            # Get or create source
            source = await get_or_create_source(db, name="telegram")

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
                    await websocket_manager.broadcast("messages", {
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
            await websocket_manager.broadcast("messages", {
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
                    await websocket_manager.broadcast("messages", {
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


@nats_broker.task
async def execute_analysis_run(run_id: str) -> dict:
    """Execute analysis run: process messages and create proposals.

    This is the main background job that coordinates the entire analysis run:
    1. Update status to "running"
    2. Fetch messages in time window
    3. Pre-filter messages (keywords, length, @mentions)
    4. Group into batches
    5. Process each batch with LLM
    6. Update status to "completed" or "failed"

    WebSocket events are broadcast at each stage for real-time updates.

    Args:
        run_id: UUID as string for the analysis run to execute

    Returns:
        Summary dictionary with execution statistics

    Raises:
        Exception: If critical errors occur during processing

    Example:
        >>> await execute_analysis_run.kiq(str(run_id))
    """
    from uuid import UUID
    from .database import get_db_session_context
    from .services.analysis_service import AnalysisExecutor

    logger.info(f"Starting analysis run execution: {run_id}")

    # Convert string UUID to UUID object
    run_uuid = UUID(run_id)

    # Get database session context for background task
    async for db in get_db_session_context():
        executor = AnalysisExecutor(db)

        try:
            # 1. Update status to "running"
            logger.info(f"Run {run_id}: Starting run")
            await executor.start_run(run_uuid)

            # 2. Fetch messages in time window
            logger.info(f"Run {run_id}: Fetching messages")
            messages = await executor.fetch_messages(run_uuid)
            logger.info(f"Run {run_id}: Found {len(messages)} messages in window")

            # 3. Pre-filter messages (keywords, length, @mentions)
            logger.info(f"Run {run_id}: Pre-filtering messages")
            filtered = await executor.prefilter_messages(run_uuid, messages)
            logger.info(f"Run {run_id}: {len(filtered)} messages after pre-filter")

            # 4. Group into batches
            logger.info(f"Run {run_id}: Creating batches")
            batches = await executor.create_batches(filtered)
            logger.info(f"Run {run_id}: Created {len(batches)} batches")

            # 5. Process each batch
            total_proposals = 0
            for batch_idx, batch in enumerate(batches):
                logger.info(
                    f"Run {run_id}: Processing batch {batch_idx + 1}/{len(batches)} "
                    f"({len(batch)} messages)"
                )

                # Update progress
                await executor.update_progress(run_uuid, batch_idx + 1, len(batches))

                # Create proposals from batch
                proposals = await executor.process_batch(run_uuid, batch)

                # Save proposals
                saved_count = await executor.save_proposals(run_uuid, proposals)
                total_proposals += saved_count

                logger.info(
                    f"Run {run_id}: Batch {batch_idx + 1} completed, "
                    f"created {saved_count} proposals"
                )

            # 6. Update status to "completed"
            logger.info(f"Run {run_id}: Completing run with {total_proposals} proposals")
            result = await executor.complete_run(run_uuid)

            logger.info(f"Run {run_id}: Successfully completed")
            return {
                "run_id": run_id,
                "status": "completed",
                "messages_fetched": len(messages),
                "messages_filtered": len(filtered),
                "batches_processed": len(batches),
                "proposals_created": total_proposals,
            }

        except Exception as e:
            # Handle errors - update run to failed status
            logger.error(
                f"Run {run_id}: Failed with error: {e}",
                exc_info=True,
            )

            try:
                await executor.fail_run(run_uuid, str(e))
            except Exception as fail_error:
                logger.error(
                    f"Run {run_id}: Failed to update run status: {fail_error}",
                    exc_info=True,
                )

            # Re-raise to mark TaskIQ job as failed
            raise


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
