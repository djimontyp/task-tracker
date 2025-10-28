import time
from datetime import UTC, datetime
from uuid import UUID

from core.taskiq_config import nats_broker
from loguru import logger
from sqlalchemy import func, select

from app.database import get_db_session_context
from app.models import ClassificationExperiment, ExperimentStatus, LLMProvider, Message, Topic
from app.services.analysis_service import AnalysisExecutor
from app.services.topic_classification_service import TopicClassificationService
from app.services.websocket_manager import websocket_manager


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
        topics_result = await db.execute(select(Topic).order_by(Topic.id))  # type: ignore[arg-type]
        topics = list(topics_result.scalars().all())

        if not topics:
            raise ValueError("No topics available for classification")

        # Retrieve messages with pre-assigned topics
        logger.info(f"Experiment {experiment_id}: Loading messages with topics")
        messages_result = await db.execute(
            select(Message).where(Message.topic_id.isnot(None)).order_by(func.random()).limit(experiment.message_count)  # type: ignore[union-attr]
        )
        messages = list(messages_result.scalars().all())

        if len(messages) < experiment.message_count:
            logger.warning(
                f"Experiment {experiment_id}: Only {len(messages)} messages with topics available, "
                f"requested {experiment.message_count}"
            )

        # Load LLM provider for classification
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
