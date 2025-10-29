import uuid
from typing import Any

from core.taskiq_config import nats_broker
from loguru import logger
from sqlalchemy import desc as sql_desc
from sqlalchemy import select

from app.database import get_db_session_context
from app.models import Message
from app.services.importance_scorer import ImportanceScorer
from app.services.websocket_manager import websocket_manager
from app.utils.retry_utils import task_retry_with_dlq


@task_retry_with_dlq(max_attempts=3, task_name="score_message")
@nats_broker.task
async def score_message_task(message_id: uuid.UUID) -> dict[str, Any]:
    """Background task to score a single message using ImportanceScorer.

    Calculates importance score based on content, author, temporal, and topic factors.
    Updates message record with score, classification, and noise factors.

    Args:
        message_id: Message ID to score

    Returns:
        Dictionary with scoring results:
            - message_id: Message ID scored
            - importance_score: Final weighted score (0.0-1.0)
            - classification: noise/weak_signal/signal
            - noise_factors: Individual factor scores

    Raises:
        ValueError: If message not found

    Example:
        >>> task = await score_message_task.kiq(123)
        >>> result = await task.wait_result()
        >>> print(result.return_value["importance_score"])
        0.75
    """
    logger.info(f"Starting message scoring task for message {message_id}")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        message = await db.get(Message, message_id)
        if not message:
            raise ValueError(f"Message {message_id} not found")

        scorer = ImportanceScorer()
        result = await scorer.score_message(message, db)

        importance_score = result["importance_score"]
        classification = result["classification"]
        noise_factors = result["noise_factors"]

        message.importance_score = importance_score  # type: ignore[assignment]
        message.noise_classification = classification  # type: ignore[assignment]
        message.noise_factors = noise_factors  # type: ignore[assignment]
        await db.commit()

        logger.info(f"Message {message_id} scored: {importance_score:.2f} ({classification})")

        await websocket_manager.broadcast(
            "noise_filtering",
            {
                "event": "message_scored",
                "data": {
                    "message_id": message_id,
                    "importance_score": importance_score,
                    "classification": classification,
                },
            },
        )

        return {
            "message_id": message_id,
            "importance_score": importance_score,
            "classification": classification,
            "noise_factors": noise_factors,
        }

    except Exception as e:
        logger.error(f"Message scoring task failed for message {message_id}: {e}", exc_info=True)
        raise


@nats_broker.task
async def score_unscored_messages_task(limit: int = 100) -> dict[str, int]:
    """Background task to score messages with NULL importance_score.

    Processes unscored messages in batches, calculates importance scores,
    and updates database records. Designed for bulk scoring operations.

    Args:
        limit: Maximum number of messages to score (default: 100)

    Returns:
        Statistics dictionary with:
            - total_found: Messages found without scores
            - scored: Successfully scored messages
            - failed: Messages that failed to score

    Example:
        >>> task = await score_unscored_messages_task.kiq(50)
        >>> result = await task.wait_result()
        >>> print(result.return_value)
        {"total_found": 50, "scored": 48, "failed": 2}
    """
    logger.info(f"Starting batch scoring task for up to {limit} unscored messages")

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        stmt = (
            select(Message)
            .where(Message.importance_score.is_(None))  # type: ignore[union-attr]
            .order_by(sql_desc(Message.sent_at))  # type: ignore[arg-type]
            .limit(limit)
        )

        result = await db.execute(stmt)
        messages = list(result.scalars().all())

        total_found = len(messages)
        logger.info(f"Found {total_found} unscored messages to process")

        if total_found == 0:
            return {"total_found": 0, "scored": 0, "failed": 0}

        scorer = ImportanceScorer()
        scored_count = 0
        failed_count = 0

        for idx, message in enumerate(messages, 1):
            try:
                scoring_result = await scorer.score_message(message, db)

                message.importance_score = scoring_result["importance_score"]  # type: ignore[assignment]
                message.noise_classification = scoring_result["classification"]  # type: ignore[assignment]
                message.noise_factors = scoring_result["noise_factors"]  # type: ignore[assignment]

                scored_count += 1

                if idx % 10 == 0:
                    logger.info(f"Progress: {idx}/{total_found} messages scored")

            except Exception as e:
                logger.error(f"Failed to score message {message.id}: {e}")
                failed_count += 1

        await db.commit()

        logger.info(f"Batch scoring completed: {scored_count} scored, {failed_count} failed out of {total_found}")

        await websocket_manager.broadcast(
            "noise_filtering",
            {
                "event": "batch_scored",
                "data": {
                    "total_found": total_found,
                    "scored": scored_count,
                    "failed": failed_count,
                },
            },
        )

        return {
            "total_found": total_found,
            "scored": scored_count,
            "failed": failed_count,
        }

    except Exception as e:
        logger.error(f"Batch scoring task failed: {e}", exc_info=True)
        raise
