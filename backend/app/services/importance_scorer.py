"""Importance scoring service for noise filtering in messages.

This service calculates importance scores (0.0-1.0) for messages based on 4 factors:
1. Content Factor (40%): Quality of message content (length, keywords, questions)
2. Author Factor (20%): Reputation of message author based on history
3. Temporal Factor (20%): Time-based relevance (recency, activity)
4. Topics Factor (20%): Relevance to important topics

Final classification:
- noise: score < 0.3
- weak_signal: 0.3 <= score <= 0.7
- signal: score > 0.7
"""

import logging
import re
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.ai_config import ai_config
from app.models.message import Message
from app.models.topic import Topic

logger = logging.getLogger(__name__)

NOISE_KEYWORDS = {"+1", "lol", "ok", "haha", "yeah", "yep", "nope", "hmm", "aha", "👍", "👌", "🙂", "😀"}
SIGNAL_KEYWORDS = {
    "bug",
    "error",
    "issue",
    "problem",
    "how",
    "why",
    "help",
    "question",
    "idea",
    "proposal",
    "feature",
    "request",
    "critical",
    "urgent",
    "important",
}


class ImportanceScorer:
    """Service for calculating importance scores for messages.

    Uses 4 weighted scoring factors to classify messages as noise/weak_signal/signal.
    Implements heuristic-based scoring without LLM/AI for fast processing.
    """

    def __init__(self) -> None:
        """Initialize importance scorer."""
        pass

    def _score_content(self, content: str) -> float:
        """Score message content quality based on heuristics.

        Scoring rules:
        - Length: < 10 chars = 0.1, 10-50 = 0.4, 50-200 = 0.7, > 200 = 0.9
        - Noise keywords: 0.05-0.15
        - Signal keywords: 0.8-0.95
        - Question marks: bonus +0.1
        - URLs/code blocks: bonus +0.15

        Args:
            content: Message content text

        Returns:
            Content quality score (0.0-1.0)

        Example:
            >>> scorer = ImportanceScorer()
            >>> scorer._score_content("lol")
            0.1
            >>> scorer._score_content("How can I fix this critical bug?")
            0.95
        """
        if not content or not content.strip():
            return 0.05

        content_lower = content.lower().strip()
        length = len(content)

        if content_lower in NOISE_KEYWORDS:
            return 0.1

        if any(keyword in content_lower for keyword in NOISE_KEYWORDS):
            return 0.15

        base_score = 0.0
        if length < 10:
            base_score = 0.1
        elif length < 50:
            base_score = 0.4
        elif length < 200:
            base_score = 0.7
        else:
            base_score = 0.9

        signal_match = any(keyword in content_lower for keyword in SIGNAL_KEYWORDS)
        if signal_match:
            base_score = max(base_score, 0.8)

        if "?" in content:
            base_score = min(base_score + 0.1, 1.0)

        has_url = bool(re.search(r"https?://", content))
        has_code = bool(re.search(r"```|`[^`]+`", content))
        if has_url or has_code:
            base_score = min(base_score + 0.15, 1.0)

        return round(base_score, 2)

    async def _score_author(self, author_id: int, db: AsyncSession) -> float:
        """Score author reputation based on message history.

        Queries database for author's historical performance:
        - Total messages sent
        - Average importance score of previous messages
        - No history: 0.5 (neutral)
        - High avg score (>0.7): 0.9
        - Low avg score (<0.3): 0.2

        Args:
            author_id: User ID of message author
            db: Database session

        Returns:
            Author reputation score (0.0-1.0)

        Example:
            >>> score = await scorer._score_author(123, db)
            >>> assert 0.0 <= score <= 1.0
        """
        stmt = (
            select(func.count(Message.id).label("total"), func.avg(Message.importance_score).label("avg_score"))  # type: ignore[arg-type]
            .where(Message.author_id == author_id)  # type: ignore[arg-type]
            .where(Message.importance_score.is_not(None))  # type: ignore[union-attr]
        )

        result = await db.execute(stmt)
        row = result.one_or_none()

        if not row or row.total == 0:
            return 0.5

        avg_score = float(row.avg_score) if row.avg_score is not None else 0.5

        if avg_score > 0.7:
            return 0.9
        elif avg_score < 0.3:
            return 0.2
        else:
            return round(avg_score, 2)

    async def _score_temporal(self, message: Message, db: AsyncSession) -> float:
        """Score temporal relevance based on message recency and topic activity.

        Scoring rules:
        - < 1 hour old: 0.9
        - < 24 hours: 0.7
        - < 7 days: 0.5
        - > 7 days: 0.3
        - Active topic (recent messages): +0.1 bonus

        Args:
            message: Message to score
            db: Database session

        Returns:
            Temporal relevance score (0.0-1.0)

        Example:
            >>> score = await scorer._score_temporal(message, db)
            >>> assert 0.0 <= score <= 1.0
        """
        now = datetime.now(UTC)
        message_time = message.sent_at.replace(tzinfo=UTC) if message.sent_at.tzinfo is None else message.sent_at
        time_delta = now - message_time
        hours_old = time_delta.total_seconds() / 3600

        if hours_old < 1:
            base_score = 0.9
        elif hours_old < 24:
            base_score = 0.7
        elif hours_old < 168:
            base_score = 0.5
        else:
            base_score = 0.3

        if message.topic_id:
            one_day_ago_aware = datetime.now(UTC) - timedelta(hours=24)
            one_day_ago = one_day_ago_aware.replace(tzinfo=None)
            stmt = (
                select(func.count(Message.id))  # type: ignore[arg-type]
                .where(Message.topic_id == message.topic_id)  # type: ignore[arg-type]
                .where(Message.sent_at > one_day_ago)  # type: ignore[arg-type]
            )
            result = await db.execute(stmt)
            recent_count = result.scalar_one()

            if recent_count > 3:
                base_score = min(base_score + 0.1, 1.0)

        return round(base_score, 2)

    async def _score_topics(self, message: Message, db: AsyncSession) -> float:
        """Score topic relevance based on topic importance.

        Scoring rules:
        - No topic assigned: 0.4 (general chat)
        - Topic with high message count: 0.9
        - Topic with medium count: 0.6
        - Topic with low count: 0.4

        Args:
            message: Message to score
            db: Database session

        Returns:
            Topic relevance score (0.0-1.0)

        Example:
            >>> score = await scorer._score_topics(message, db)
            >>> assert 0.0 <= score <= 1.0
        """
        if not message.topic_id:
            return 0.4

        stmt = select(func.count(Message.id)).where(Message.topic_id == message.topic_id)  # type: ignore[arg-type]
        result = await db.execute(stmt)
        message_count = result.scalar_one()

        stmt_topic = select(Topic).where(Topic.id == message.topic_id)  # type: ignore[arg-type]
        result_topic = await db.execute(stmt_topic)
        topic = result_topic.scalar_one_or_none()

        if not topic:
            return 0.4

        if message_count > 50:
            return 0.9
        elif message_count > 10:
            return 0.6
        else:
            return 0.4

    async def score_message(self, message: Message, db: AsyncSession) -> dict[str, float | str | dict[str, float]]:
        """Calculate final importance score for message using 4 weighted factors.

        Weight distribution:
        - Content: 40%
        - Author: 20%
        - Temporal: 20%
        - Topics: 20%

        Classification thresholds:
        - noise: < 0.3
        - weak_signal: 0.3-0.7
        - signal: > 0.7

        Args:
            message: Message to score
            db: Database session

        Returns:
            Dict with:
                - importance_score: Final weighted score (0.0-1.0)
                - classification: noise/weak_signal/signal
                - noise_factors: Individual factor scores

        Example:
            >>> result = await scorer.score_message(message, db)
            >>> print(result["importance_score"])
            0.75
            >>> print(result["classification"])
            'signal'
            >>> print(result["noise_factors"])
            {'content': 0.8, 'author': 0.7, 'temporal': 0.9, 'topics': 0.6}
        """
        content_score = self._score_content(message.content)
        author_score = await self._score_author(message.author_id, db)
        temporal_score = await self._score_temporal(message, db)
        topics_score = await self._score_topics(message, db)

        importance_score = (
            content_score * ai_config.message_scoring.content_weight
            + author_score * ai_config.message_scoring.author_weight
            + temporal_score * ai_config.message_scoring.temporal_weight
            + topics_score * ai_config.message_scoring.topics_weight
        )
        importance_score = round(importance_score, 2)

        if importance_score < ai_config.message_scoring.noise_threshold:
            classification = "noise"
        elif importance_score > ai_config.message_scoring.signal_threshold:
            classification = "signal"
        else:
            classification = "weak_signal"

        noise_factors = {
            "content": content_score,
            "author": author_score,
            "temporal": temporal_score,
            "topics": topics_score,
        }

        logger.info(
            f"Scored message {message.id}: {importance_score:.2f} ({classification}) - "
            f"content={content_score:.2f}, author={author_score:.2f}, "
            f"temporal={temporal_score:.2f}, topics={topics_score:.2f}"
        )

        return {
            "importance_score": importance_score,
            "classification": classification,
            "noise_factors": noise_factors,
        }
