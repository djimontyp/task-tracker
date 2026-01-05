import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from core.taskiq_config import nats_broker
from loguru import logger
from sqlalchemy import func, select

from app.config.ai_config import ai_config
from app.database import AsyncSessionLocal
from app.models import AgentConfig, IngestionStatus, Message, MessageIngestionJob
from app.services.batching_service import group_messages_by_conversation, select_conversations_for_batch
from app.services.telegram_ingestion_service import telegram_ingestion_service
from app.services.user_service import get_or_create_source, identify_or_create_user
from app.services.websocket_manager import websocket_manager
from app.webhook_service import telegram_webhook_service


async def queue_knowledge_extraction_if_needed(message_id: uuid.UUID, db: Any) -> None:
    """Queue knowledge extraction task if unprocessed message threshold is reached.

    Checks if there are enough recent unprocessed messages to trigger automatic
    knowledge extraction. When threshold is reached, queues background task with
    active LLM provider.

    Args:
        message_id: ID of newly created message
        db: Database session

    Logic:
        - Count messages without topic_id in last 24 hours
        - If count >= KNOWLEDGE_EXTRACTION_THRESHOLD, trigger extraction
        - Use first active LLM provider found
        - Process all unprocessed messages in batch
    """
    from app.tasks.knowledge import extract_knowledge_from_messages_task

    cutoff_time = datetime.utcnow() - timedelta(hours=ai_config.knowledge_extraction.lookback_hours)

    count_stmt = (
        select(func.count()).select_from(Message).where(Message.topic_id.is_(None), Message.sent_at >= cutoff_time)  # type: ignore[union-attr]
    )
    result = await db.execute(count_stmt)
    unprocessed_count = result.scalar() or 0

    logger.debug(
        f"Knowledge extraction check: {unprocessed_count} unprocessed messages in last "
        f"{ai_config.knowledge_extraction.lookback_hours}h (threshold: {ai_config.knowledge_extraction.message_threshold})"
    )

    if unprocessed_count < ai_config.knowledge_extraction.message_threshold:
        return

    agent_config_stmt = (
        select(AgentConfig).where(AgentConfig.is_active == True, AgentConfig.name == "knowledge_extractor").limit(1)  # noqa: E712
    )
    agent_config_result = await db.execute(agent_config_stmt)
    agent_config = agent_config_result.scalar_one_or_none()

    if not agent_config:
        logger.warning("No active agent config 'knowledge_extractor' found for knowledge extraction, skipping")
        return

    # Fetch all unprocessed messages for intelligent conversation-aware batching
    messages_stmt = (
        select(Message)
        .where(Message.topic_id.is_(None), Message.sent_at >= cutoff_time)  # type: ignore[union-attr, arg-type]
        .order_by(Message.source_channel_id, Message.source_thread_id, Message.sent_at)  # type: ignore[arg-type]
    )
    messages_result = await db.execute(messages_stmt)
    all_messages = list(messages_result.scalars().all())

    if not all_messages:
        return

    # Group by conversation (channel + thread) with time-gap fallback
    grouped = group_messages_by_conversation(all_messages)

    # Select complete conversations up to batch size
    message_ids = select_conversations_for_batch(grouped, ai_config.knowledge_extraction.batch_size)

    if not message_ids:
        return

    logger.info(
        f"🧠 Threshold reached ({unprocessed_count} >= {ai_config.knowledge_extraction.message_threshold}), "
        f"queueing knowledge extraction for {len(message_ids)} messages ({len(grouped)} conversations) "
        f"using agent '{agent_config.name}'"
    )

    await extract_knowledge_from_messages_task.kiq(
        message_ids=message_ids, agent_config_id=str(agent_config.id), created_by="auto_threshold"
    )


@nats_broker.task
async def process_message(message: str) -> str:
    """Example function for message processing"""

    logger.info(f"Processing message: {message}")
    return f"Processed: {message}"


@nats_broker.task
async def save_telegram_message(telegram_data: dict[str, Any]) -> str:
    """Background task to save Telegram message to database"""
    from app.tasks.scoring import score_message_task

    try:
        logger.info(
            f"Starting to save Telegram message: {telegram_data.get('message', {}).get('message_id', 'unknown')}"
        )

        async with AsyncSessionLocal() as db:
            message = telegram_data["message"]
            logger.debug(f"Processing message data: {message}")

            source = await get_or_create_source(db, name="telegram")

            from_user = message.get("from", {})
            telegram_user_id = from_user.get("id") or message.get("user_id")

            if not telegram_user_id:
                logger.warning(f"Message {message['message_id']} has no sender, skipping")
                return f"❌ Skipped message {message['message_id']}: no sender"

            first_name = from_user.get("first_name", "Unknown")
            last_name = from_user.get("last_name")
            language_code = from_user.get("language_code")
            is_bot = from_user.get("is_bot", False)

            user, tg_profile = await identify_or_create_user(
                db=db,
                telegram_user_id=telegram_user_id,
                first_name=first_name,
                last_name=last_name,
                language_code=language_code,
                is_bot=is_bot,
            )

            # Attempt to retrieve user avatar
            avatar_url = user.avatar_url
            if not avatar_url:
                try:
                    avatar_url = await telegram_webhook_service.get_user_avatar_url(int(telegram_user_id))
                    if avatar_url:
                        user.avatar_url = avatar_url
                        await db.flush()
                        logger.info(f"Fetched and updated avatar for user {user.id}")
                except Exception as exc:
                    logger.warning(f"Failed to fetch avatar for Telegram user {telegram_user_id}: {exc}")

            # Extract threading information from Telegram data
            chat_data = message.get("chat", {})
            reply_to = message.get("reply_to_message")

            # Persist message in database
            db_message = Message(
                external_message_id=str(message["message_id"]),
                content=message.get("text", message.get("caption", "[Media]")),
                sent_at=datetime.fromtimestamp(message["date"]),
                source_id=source.id,
                author_id=user.id,
                telegram_profile_id=tg_profile.id,
                avatar_url=avatar_url,
                analyzed=False,
                # Threading fields (source-agnostic)
                source_channel_id=str(chat_data.get("id")) if chat_data.get("id") else None,
                source_thread_id=str(message.get("message_thread_id")) if message.get("message_thread_id") else None,
                source_parent_id=str(reply_to.get("message_id")) if reply_to else None,
            )

            db.add(db_message)
            logger.debug(f"Added message to session: {db_message.external_message_id}")

            await db.commit()
            await db.refresh(db_message)
            logger.info(f"✅ Successfully committed Telegram message {message['message_id']} from {user.full_name}")

            # Trigger async importance scoring for the new message
            if db_message.id is not None:
                try:
                    await score_message_task.kiq(db_message.id)
                    logger.info(f"📊 Queued scoring task for message {db_message.id}")
                except Exception as exc:
                    logger.warning(f"Failed to queue scoring task for message {db_message.id}: {exc}")

                # Queue knowledge extraction if threshold reached
                try:
                    await queue_knowledge_extraction_if_needed(db_message.id, db)
                except Exception as exc:
                    logger.warning(f"Failed to queue knowledge extraction for message {db_message.id}: {exc}")

            # Broadcast full message data after persisting to DB
            try:
                from app.services.websocket_manager import websocket_manager

                connection_count = websocket_manager.get_connection_count("messages")
                logger.info(f"📡 Broadcasting message.updated to {connection_count} WebSocket clients")

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
                    },
                )
                logger.info(f"✅ message.updated broadcast sent for message {message['message_id']}")
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
    chat_ids: list[str],
    limit: int = 1000,
    offset_date_iso: str | None = None,
) -> str:
    """
    Background task for ingesting messages from Telegram chats.

    Args:
        job_id: MessageIngestionJob ID for tracking
        chat_ids: List of Telegram chat IDs or usernames
        limit: Total messages to fetch per chat
        offset_date_iso: ISO format datetime string for time-based filtering.
            If provided, only fetches messages newer than this date.
    """
    # Parse offset_date from ISO string if provided
    offset_date: datetime | None = None
    if offset_date_iso:
        try:
            offset_date = datetime.fromisoformat(offset_date_iso)
        except ValueError:
            logger.warning(f"Invalid offset_date_iso: {offset_date_iso}, ignoring")
    try:
        async with AsyncSessionLocal() as db:
            # Retrieve ingestion job or return error
            job = await db.get(MessageIngestionJob, job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return f"Error: Job {job_id} not found"

            # Mark job as running and initialize database
            job.status = IngestionStatus.running
            job.started_at = datetime.now(UTC)
            await db.commit()

            # Notify WebSocket clients about job start
            await websocket_manager.broadcast(
                "messages",
                {
                    "type": "ingestion.started",
                    "data": {
                        "job_id": job_id,
                        "status": "running",
                        "chat_ids": chat_ids,
                    },
                },
            )

            # Obtain telegram source
            source = await get_or_create_source(db, name="telegram")

            total_fetched = 0
            total_stored = 0
            total_skipped = 0
            total_errors = 0

            # Process each chat sequentially
            for chat_idx, chat_id in enumerate(chat_ids, 1):
                logger.info(f"Processing chat {chat_idx}/{len(chat_ids)}: {chat_id}")

                batch_size = 100  # Telegram API limit
                offset_id = 0
                messages_from_chat = 0

                while messages_from_chat < limit:
                    # Fetch messages in batches with optional time filter
                    messages = await telegram_ingestion_service.fetch_chat_history(
                        chat_id=chat_id,
                        limit=min(batch_size, limit - messages_from_chat),
                        offset_id=offset_id,
                        offset_date=offset_date,
                    )

                    if not messages:
                        logger.info(f"No more messages from chat {chat_id}")
                        break

                    # Process messages in current batch
                    batch_stored = 0
                    batch_skipped = 0
                    batch_errors = 0

                    for msg in messages:
                        success, reason = await telegram_ingestion_service.store_message(db, msg, source)

                        if reason == "stored":
                            batch_stored += 1
                        elif reason == "duplicate":
                            batch_skipped += 1
                        else:
                            batch_errors += 1

                    total_fetched += len(messages)
                    total_stored += batch_stored
                    total_skipped += batch_skipped
                    total_errors += batch_errors
                    messages_from_chat += len(messages)

                    await telegram_ingestion_service.update_job_progress(
                        db=db,
                        job=job,
                        messages_fetched=len(messages),
                        messages_stored=batch_stored,
                        messages_skipped=batch_skipped,
                        errors_count=batch_errors,
                        current_batch=chat_idx,
                    )

                    # Send real-time progress updates
                    await websocket_manager.broadcast(
                        "messages",
                        {
                            "type": "ingestion.progress",
                            "data": {
                                "job_id": job_id,
                                "chat_id": chat_id,
                                "messages_fetched": total_fetched,
                                "messages_stored": total_stored,
                                "messages_skipped": total_skipped,
                                "current_chat": chat_idx,
                                "total_chats": len(chat_ids),
                            },
                        },
                    )

                    if messages:
                        offset_id = messages[-1].get("message_id", 0)

                    # Persist batch changes
                    await db.commit()

                    logger.info(
                        f"Batch complete: fetched={len(messages)}, "
                        f"stored={batch_stored}, skipped={batch_skipped}, errors={batch_errors}"
                    )

            # Finalize ingestion job
            job.status = IngestionStatus.completed
            job.completed_at = datetime.now(UTC)
            job.total_batches = len(chat_ids)
            await db.commit()

            # Broadcast final job status
            await websocket_manager.broadcast(
                "messages",
                {
                    "type": "ingestion.completed",
                    "data": {
                        "job_id": job_id,
                        "status": "completed",
                        "messages_fetched": total_fetched,
                        "messages_stored": total_stored,
                        "messages_skipped": total_skipped,
                        "errors_count": total_errors,
                    },
                },
            )

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
                    job.error_log = {"error": str(e), "timestamp": datetime.now(UTC).isoformat()}
                    await db.commit()

                    # Broadcast failure
                    await websocket_manager.broadcast(
                        "messages",
                        {
                            "type": "ingestion.failed",
                            "data": {
                                "job_id": job_id,
                                "status": "failed",
                                "error": str(e),
                            },
                        },
                    )
        except Exception as inner_e:
            logger.error(f"Failed to update job status: {inner_e}")

        return f"Error: {str(e)}"


if __name__ == "__main__":
    import asyncio

    async def main() -> None:
        """Main function for sending example task"""
        logger.info("Sending task for message processing...")
        task = await process_message.kiq("Example message for processing")

        logger.info("Waiting for processing result...")
        result = await task.wait_result()

        logger.info(f"Result: {result.return_value}")

    asyncio.run(main())
