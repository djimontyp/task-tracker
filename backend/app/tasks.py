import time
from datetime import datetime
from typing import Any

from core.taskiq_config import nats_broker
from loguru import logger

from .database import AsyncSessionLocal
from .models import IngestionStatus, Message, MessageIngestionJob
from .services.telegram_ingestion_service import telegram_ingestion_service
from .services.user_service import get_or_create_source, identify_or_create_user
from .services.websocket_manager import websocket_manager
from .webhook_service import telegram_webhook_service


@nats_broker.task
async def process_message(message: str) -> str:
    """Example function for message processing"""

    logger.info(f"Processing message: {message}")
    return f"Processed: {message}"


@nats_broker.task
async def save_telegram_message(telegram_data: dict[str, Any]) -> str:
    """Background task to save Telegram message to database"""
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

            # Create or identify Telegram user with profile
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
            )

            db.add(db_message)
            logger.debug(f"Added message to session: {db_message.external_message_id}")

            await db.commit()
            logger.info(f"✅ Successfully committed Telegram message {message['message_id']} from {user.full_name}")

            # Broadcast full message data after persisting to DB
            try:
                from .services.websocket_manager import websocket_manager

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
            # Retrieve ingestion job or return error
            job = await db.get(MessageIngestionJob, job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return f"Error: Job {job_id} not found"

            # Mark job as running and initialize database
            job.status = IngestionStatus.running
            job.started_at = datetime.utcnow()
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
                    # Fetch messages in batches
                    messages = await telegram_ingestion_service.fetch_chat_history(
                        chat_id=chat_id,
                        limit=min(batch_size, limit - messages_from_chat),
                        offset_id=offset_id,
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

                    # Update job statistics
                    total_fetched += len(messages)
                    total_stored += batch_stored
                    total_skipped += batch_skipped
                    total_errors += batch_errors
                    messages_from_chat += len(messages)

                    # Update progress tracking
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

                    # Set offset for next batch
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
            job.completed_at = datetime.utcnow()
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
                    job.error_log = {"error": str(e), "timestamp": datetime.utcnow().isoformat()}
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


@nats_broker.task
async def execute_analysis_run(run_id: str, use_rag: bool = False) -> dict[str, str | int]:
    """Execute analysis run: process messages and create proposals.

    This is the main background job that coordinates the entire analysis run:
    1. Update status to "running"
    2. Fetch messages in time window
    3. Pre-filter messages (keywords, length, @mentions)
    4. Group into batches
    5. Process each batch with LLM (optionally with RAG context)
    6. Update status to "completed" or "failed"

    WebSocket events are broadcast at each stage for real-time updates.

    Args:
        run_id: UUID as string for the analysis run to execute
        use_rag: Enable RAG (Retrieval-Augmented Generation) for context-aware proposals

    Returns:
        Summary dictionary with execution statistics

    Raises:
        Exception: If critical errors occur during processing

    Example:
        >>> await execute_analysis_run.kiq(str(run_id), use_rag=True)
    """
    from uuid import UUID

    from .database import get_db_session_context
    from .services.analysis_service import AnalysisExecutor

    logger.info(f"Starting analysis run execution: {run_id}")

    # Convert input identifier to UUID
    run_uuid = UUID(run_id)

    # Initialize database context and executor
    db_context = get_db_session_context()
    db = await anext(db_context)
    executor = AnalysisExecutor(db)  # type: ignore[arg-type]

    try:
        # Start analysis run
        logger.info(f"Run {run_id}: Starting run")
        await executor.start_run(run_uuid)

        # Retrieve messages for analysis
        logger.info(f"Run {run_id}: Fetching messages")
        messages = await executor.fetch_messages(run_uuid)
        logger.info(f"Run {run_id}: Found {len(messages)} messages in window")

        # Apply initial message filtering
        logger.info(f"Run {run_id}: Pre-filtering messages")
        filtered = await executor.prefilter_messages(run_uuid, messages)
        logger.info(f"Run {run_id}: {len(filtered)} messages after pre-filter")

        # Organize messages into processing batches
        logger.info(f"Run {run_id}: Creating batches")
        batches = await executor.create_batches(filtered)
        logger.info(f"Run {run_id}: Created {len(batches)} batches")

        # Process messages in sequential batches
        total_proposals = 0
        for batch_idx, batch in enumerate(batches):
            logger.info(f"Run {run_id}: Processing batch {batch_idx + 1}/{len(batches)} ({len(batch)} messages)")

            # Update overall progress tracking
            await executor.update_progress(run_uuid, batch_idx + 1, len(batches))

            # Generate proposals for current batch
            proposals = await executor.process_batch(run_uuid, batch, use_rag=use_rag)

            # Persist batch proposals
            saved_count = await executor.save_proposals(run_uuid, proposals)
            total_proposals += saved_count

            logger.info(
                f"Run {run_id}: Batch {batch_idx + 1} completed, created {saved_count} proposals (RAG: {use_rag})"
            )

        # Mark run as completed
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


@nats_broker.task
async def execute_classification_experiment(experiment_id: int) -> dict[str, str | int | float]:
    """Execute classification experiment in background.

    Processes messages with topic_id, classifies them using LLM,
    calculates accuracy metrics, and broadcasts progress via WebSocket.

    Args:
        experiment_id: ClassificationExperiment ID to execute

    Returns:
        Summary dictionary with execution statistics

    Raises:
        Exception: If critical errors occur during processing

    Example:
        >>> await execute_classification_experiment.kiq(experiment_id)
    """
    from datetime import UTC, datetime

    from sqlalchemy import func, select

    from .database import get_db_session_context
    from .models import ClassificationExperiment, ExperimentStatus, Message, Topic
    from .services.topic_classification_service import TopicClassificationService
    from .services.websocket_manager import websocket_manager

    logger.info(f"Starting classification experiment execution: {experiment_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        # Retrieve experiment metadata
        experiment = await db.get(ClassificationExperiment, experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")

        # Start experiment tracking
        experiment.status = ExperimentStatus.running
        experiment.started_at = datetime.now(UTC)
        await db.commit()

        # Notify WebSocket clients about experiment start
        await websocket_manager.broadcast(
            "experiments",
            {
                "type": "experiment_started",
                "experiment_id": experiment_id,
                "message_count": experiment.message_count,
            },
        )

        # Load available topics
        logger.info(f"Experiment {experiment_id}: Loading topics")
        topics_result = await db.execute(select(Topic).order_by(Topic.id))
        topics = list(topics_result.scalars().all())

        if not topics:
            raise ValueError("No topics available for classification")

        # Retrieve messages with pre-assigned topics
        logger.info(f"Experiment {experiment_id}: Loading messages with topics")
        messages_result = await db.execute(
            select(Message).where(Message.topic_id.isnot(None)).order_by(func.random()).limit(experiment.message_count)
        )
        messages = list(messages_result.scalars().all())

        if len(messages) < experiment.message_count:
            logger.warning(
                f"Experiment {experiment_id}: Only {len(messages)} messages with topics available, "
                f"requested {experiment.message_count}"
            )

        # Load LLM provider for classification
        from .models import LLMProvider

        provider = await db.get(LLMProvider, experiment.provider_id)
        if not provider:
            raise ValueError(f"Provider {experiment.provider_id} not found")

        service = TopicClassificationService(db)

        # Classify messages and track results
        classification_results = []
        for idx, message in enumerate(messages, 1):
            start_time = time.perf_counter()
            try:
                # Perform message classification
                result, exec_time = await service.classify_message(message, topics, provider, experiment.model_name)

                # Identify actual topic
                actual_topic = next((t for t in topics if t.id == message.topic_id), None)

                # Record classification result
                classification_result = {
                    "message_id": message.id,
                    "message_content": message.content[:200],
                    "actual_topic_id": message.topic_id,
                    "actual_topic_name": actual_topic.name if actual_topic else None,
                    "predicted_topic_id": result.topic_id,
                    "predicted_topic_name": result.topic_name,
                    "confidence": result.confidence,
                    "execution_time_ms": exec_time,
                    "reasoning": result.reasoning,
                    "alternatives": [alt.model_dump() for alt in result.alternatives],
                }

                classification_results.append(classification_result)

                # Periodic progress updates
                if idx % 10 == 0 or idx == len(messages):
                    percentage = int((idx / len(messages)) * 100)
                    await websocket_manager.broadcast(
                        "experiments",
                        {
                            "type": "experiment_progress",
                            "experiment_id": experiment_id,
                            "current": idx,
                            "total": len(messages),
                            "percentage": percentage,
                        },
                    )
                    logger.info(f"Experiment {experiment_id}: Processed {idx}/{len(messages)} messages ({percentage}%)")

            except Exception as e:
                # Handle and log classification errors
                exec_time = (time.perf_counter() - start_time) * 1000
                logger.error(
                    f"Experiment {experiment_id}: Failed to classify message {message.id} after {exec_time:.2f}ms: {e}"
                )
                actual_topic = next((t for t in topics if t.id == message.topic_id), None)
                classification_results.append({
                    "message_id": message.id,
                    "message_content": message.content[:200],
                    "actual_topic_id": message.topic_id,
                    "actual_topic_name": actual_topic.name if actual_topic else None,
                    "predicted_topic_id": -1,
                    "predicted_topic_name": "ERROR",
                    "confidence": 0.0,
                    "execution_time_ms": exec_time,
                    "reasoning": f"Classification failed: {str(e)}",
                    "alternatives": [],
                })

        # Calculate experiment metrics
        logger.info(f"Experiment {experiment_id}: Calculating metrics")
        metrics = await service.calculate_metrics(classification_results)

        # Update experiment status and results
        experiment.status = ExperimentStatus.completed
        experiment.completed_at = datetime.now(UTC)
        experiment.accuracy = metrics["accuracy"]
        experiment.avg_confidence = metrics["avg_confidence"]
        experiment.avg_execution_time_ms = metrics["avg_execution_time_ms"]
        experiment.confusion_matrix = metrics["confusion_matrix"]
        experiment.classification_results = classification_results
        await db.commit()

        # Broadcast experiment completion
        await websocket_manager.broadcast(
            "experiments",
            {
                "type": "experiment_completed",
                "experiment_id": experiment_id,
                "accuracy": metrics["accuracy"],
            },
        )

        logger.info(
            f"Experiment {experiment_id}: Completed successfully - "
            f"Accuracy: {metrics['accuracy']:.2%}, "
            f"Avg Confidence: {metrics['avg_confidence']:.2f}"
        )

        return {
            "experiment_id": experiment_id,
            "status": "completed",
            "messages_classified": len(classification_results),
            "accuracy": metrics["accuracy"],
            "avg_confidence": metrics["avg_confidence"],
        }

    except Exception as e:
        logger.error(f"Experiment {experiment_id}: Failed with error: {e}", exc_info=True)

        try:
            experiment = await db.get(ClassificationExperiment, experiment_id)
            if experiment:
                experiment.status = ExperimentStatus.failed
                experiment.completed_at = datetime.now(UTC)
                experiment.error_message = str(e)
                await db.commit()

                await websocket_manager.broadcast(
                    "experiments",
                    {
                        "type": "experiment_failed",
                        "experiment_id": experiment_id,
                        "error": str(e),
                    },
                )
        except Exception as inner_e:
            logger.error(f"Experiment {experiment_id}: Failed to update status: {inner_e}")

        raise


@nats_broker.task
async def embed_messages_batch_task(message_ids: list[int], provider_id: str) -> dict[str, int]:
    """Background task for batch embedding messages.

    Processes messages in batches and generates embeddings using specified LLM provider.
    Designed for long-running embedding operations with automatic error handling.

    Args:
        message_ids: List of message IDs to embed
        provider_id: LLMProvider UUID as string

    Returns:
        Statistics dictionary with success/failed/skipped counts

    Example:
        >>> task = await embed_messages_batch_task.kiq([1, 2, 3], str(provider_id))
        >>> result = await task.wait_result()
        >>> print(result.return_value)  # {"success": 3, "failed": 0, "skipped": 0}
    """
    from uuid import UUID

    from .database import get_db_session_context
    from .models.llm_provider import LLMProvider
    from .services.embedding_service import EmbeddingService

    logger.info(f"Starting batch embedding task: {len(message_ids)} messages with provider {provider_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        provider = await db.get(LLMProvider, UUID(provider_id))
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")

        service = EmbeddingService(provider)
        stats = await service.embed_messages_batch(db, message_ids, batch_size=100)

        logger.info(
            f"Batch embedding task completed: {stats['success']} success, "
            f"{stats['failed']} failed, {stats['skipped']} skipped"
        )

        return stats

    except Exception as e:
        logger.error(f"Batch embedding task failed: {e}", exc_info=True)
        raise


@nats_broker.task
async def embed_atoms_batch_task(atom_ids: list[int], provider_id: str) -> dict[str, int]:
    """Background task for batch embedding atoms.

    Processes atoms in batches and generates embeddings using specified LLM provider.
    Designed for long-running embedding operations with automatic error handling.

    Args:
        atom_ids: List of atom IDs to embed
        provider_id: LLMProvider UUID as string

    Returns:
        Statistics dictionary with success/failed/skipped counts

    Example:
        >>> task = await embed_atoms_batch_task.kiq([1, 2, 3], str(provider_id))
        >>> result = await task.wait_result()
        >>> print(result.return_value)  # {"success": 3, "failed": 0, "skipped": 0}
    """
    from uuid import UUID

    from .database import get_db_session_context
    from .models.llm_provider import LLMProvider
    from .services.embedding_service import EmbeddingService

    logger.info(f"Starting batch atom embedding task: {len(atom_ids)} atoms with provider {provider_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        provider = await db.get(LLMProvider, UUID(provider_id))
        if not provider:
            raise ValueError(f"Provider {provider_id} not found")

        service = EmbeddingService(provider)
        stats = await service.embed_atoms_batch(db, atom_ids, batch_size=100)

        logger.info(
            f"Batch atom embedding task completed: {stats['success']} success, "
            f"{stats['failed']} failed, {stats['skipped']} skipped"
        )

        return stats

    except Exception as e:
        logger.error(f"Batch atom embedding task failed: {e}", exc_info=True)
        raise


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
