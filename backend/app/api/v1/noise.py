"""API endpoints for noise filtering statistics and scoring.

Provides statistics on message classification by importance score:
- Signal: importance_score > 0.7 (high-value messages)
- Noise: importance_score < 0.3 (low-value messages)
- Weak Signal: importance_score 0.3-0.7 (needs review)

Also provides endpoints for triggering background scoring tasks.
"""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.legacy import Source
from app.models.message import Message
from app.schemas.noise import NoiseSource, NoiseStatsResponse, NoiseTrendData

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/noise", tags=["noise"])


@router.get(
    "/stats",
    response_model=NoiseStatsResponse,
    summary="Get noise filtering statistics",
    description="Retrieve statistics on signal vs noise classification with 7-day trends and top noise sources.",
)
async def get_noise_stats(
    session: AsyncSession = Depends(get_session),
) -> NoiseStatsResponse:
    """Get noise filtering statistics for dashboard.

    Returns comprehensive statistics including:
    - Total message counts and signal/noise breakdown
    - Signal ratio (percentage of high-value messages)
    - Weak signals needing human review
    - 7-day trend showing daily signal/noise/weak_signal counts
    - Top 5 sources generating the most noise

    Classification thresholds:
    - Signal: importance_score > 0.7
    - Noise: importance_score < 0.3
    - Weak Signal: importance_score 0.3-0.7 (needs review)

    Args:
        session: Database session

    Returns:
        Noise filtering statistics with trends and source analysis
    """
    total_messages_result = await session.execute(
        select(
            func.count(Message.id).label("total"),  # type: ignore[arg-type]
            func.count(
                case(
                    ((Message.importance_score.is_not(None)) & (Message.importance_score > 0.7), 1)  # type: ignore[operator,union-attr]
                )
            ).label("signal"),
            func.count(
                case(
                    ((Message.importance_score.is_not(None)) & (Message.importance_score < 0.3), 1)  # type: ignore[operator,union-attr]
                )
            ).label("noise"),
            func.count(
                case((
                    (Message.importance_score.is_not(None))  # type: ignore[union-attr]
                    & (Message.importance_score >= 0.3)  # type: ignore[operator]
                    & (Message.importance_score <= 0.7),  # type: ignore[operator]
                    1,
                ))
            ).label("weak_signal"),
        )
    )
    counts_row = total_messages_result.first()

    if not counts_row:
        logger.warning("No messages found in database")
        total = signal = noise = weak_signal = 0
    else:
        total = counts_row.total or 0
        signal = counts_row.signal or 0
        noise = counts_row.noise or 0
        weak_signal = counts_row.weak_signal or 0

    signal_ratio = float(signal / total) if total > 0 else 0.0

    seven_days_ago = datetime.now() - timedelta(days=7)
    trend_result = await session.execute(
        select(
            func.date(Message.sent_at).label("date"),
            func.count(
                case(
                    ((Message.importance_score.is_not(None)) & (Message.importance_score > 0.7), 1)  # type: ignore[operator,union-attr]
                )
            ).label("signal"),
            func.count(
                case(
                    ((Message.importance_score.is_not(None)) & (Message.importance_score < 0.3), 1)  # type: ignore[operator,union-attr]
                )
            ).label("noise"),
            func.count(
                case((
                    (Message.importance_score.is_not(None))  # type: ignore[union-attr]
                    & (Message.importance_score >= 0.3)  # type: ignore[operator]
                    & (Message.importance_score <= 0.7),  # type: ignore[operator]
                    1,
                ))
            ).label("weak_signal"),
        )
        .where(Message.sent_at >= seven_days_ago)  # type: ignore[arg-type]
        .group_by(func.date(Message.sent_at))
        .order_by(func.date(Message.sent_at).asc())
    )
    trend_rows = trend_result.all()

    trend_data: list[NoiseTrendData] = []
    for row in trend_rows:
        trend_data.append(
            NoiseTrendData(
                date=row.date.strftime("%Y-%m-%d"),
                signal=row.signal or 0,
                noise=row.noise or 0,
                weak_signal=row.weak_signal or 0,
            )
        )

    noise_sources_result = await session.execute(
        select(Source.name, func.count(Message.id).label("noise_count"))  # type: ignore[arg-type,call-overload]
        .join(Message, Message.source_id == Source.id)
        .where((Message.importance_score.is_not(None)) & (Message.importance_score < 0.3))  # type: ignore[operator,union-attr]
        .group_by(Source.name)
        .order_by(func.count(Message.id).desc())  # type: ignore[arg-type]
        .limit(5)
    )
    noise_sources_rows = noise_sources_result.all()

    top_noise_sources: list[NoiseSource] = []
    for row in noise_sources_rows:
        top_noise_sources.append(NoiseSource(name=row.name, count=int(row.noise_count or 0)))

    logger.info(
        f"Noise stats: total={total}, signal={signal}, noise={noise}, "
        f"weak_signal={weak_signal}, ratio={signal_ratio:.2f}"
    )

    return NoiseStatsResponse(
        total_messages=total,
        signal_count=signal,
        noise_count=noise,
        signal_ratio=signal_ratio,
        needs_review=weak_signal,
        trend=trend_data,
        top_noise_sources=top_noise_sources,
    )


@router.post(
    "/score/{message_id}",
    summary="Score a specific message",
    description="Trigger background task to calculate importance score for a message using ImportanceScorer.",
    status_code=202,
)
async def score_message(
    message_id: int,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str | int]:
    """Trigger background scoring task for a specific message.

    Validates that the message exists, then queues a background task
    to calculate importance score based on content, author, temporal, and topic factors.

    Args:
        message_id: Message ID to score
        session: Database session

    Returns:
        Confirmation with message ID and task status

    Raises:
        HTTPException: 404 if message not found
    """
    from app.tasks import score_message_task

    message = await session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail=f"Message {message_id} not found")

    await score_message_task.kiq(message_id)

    logger.info(f"Queued scoring task for message {message_id}")

    return {
        "status": "scoring task queued",
        "message_id": message_id,
    }


@router.post(
    "/score-batch",
    summary="Score unscored messages in batch",
    description="Trigger background task to score messages with NULL importance_score. Processes up to 'limit' messages.",
    status_code=202,
)
async def score_batch(
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of messages to score"),
    session: AsyncSession = Depends(get_session),
) -> dict[str, str | int]:
    """Trigger background batch scoring task for unscored messages.

    Finds messages where importance_score IS NULL and queues them for scoring.
    Processes most recent messages first, up to the specified limit.

    Args:
        limit: Maximum messages to score (1-1000, default 100)
        session: Database session

    Returns:
        Confirmation with count of messages queued for scoring
    """
    from app.tasks import score_unscored_messages_task

    stmt = (
        select(func.count(Message.id)).where(Message.importance_score.is_(None))  # type: ignore[arg-type,union-attr]
    )

    result = await session.execute(stmt)
    unscored_count = result.scalar_one()

    messages_to_score = min(unscored_count, limit)

    await score_unscored_messages_task.kiq(limit)

    logger.info(f"Queued batch scoring task for up to {limit} messages ({unscored_count} unscored available)")

    return {
        "status": "batch scoring task queued",
        "messages_queued": messages_to_score,
        "total_unscored": unscored_count,
    }
