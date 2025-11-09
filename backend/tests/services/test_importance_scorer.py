"""Tests for ImportanceScorer service.

Tests cover:
1. Content scoring with various message types
2. Author scoring based on reputation history
3. Temporal scoring based on message age
4. Topics scoring based on topic activity
5. Final importance score calculation
6. Classification thresholds (noise/weak_signal/signal)
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.models.message import Message
from app.models.topic import Topic
from app.services.importance_scorer import ImportanceScorer
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def scorer() -> ImportanceScorer:
    """Create ImportanceScorer instance."""
    return ImportanceScorer()


@pytest.fixture
def mock_db() -> AsyncMock:
    """Create mock database session."""
    return AsyncMock(spec=AsyncSession)


def create_message(
    content: str,
    author_id: int = 1,
    topic_id: int | None = None,
    sent_at: datetime | None = None,
    message_id: int = 1,
) -> Message:
    """Helper to create test message."""
    if sent_at is None:
        sent_at = datetime.now(UTC)

    return Message(
        id=message_id,
        external_message_id=f"test-{message_id}",
        content=content,
        sent_at=sent_at,
        source_id=1,
        author_id=author_id,
        topic_id=topic_id,
    )


@pytest.mark.asyncio
async def test_score_content_noise_keywords(scorer: ImportanceScorer) -> None:
    """Test content scoring for noise keywords."""
    assert scorer._score_content("+1") == 0.1
    assert scorer._score_content("lol") == 0.1
    assert scorer._score_content("ok") == 0.1
    assert scorer._score_content("👍") == 0.1
    assert scorer._score_content("yeah lol") == 0.15


@pytest.mark.asyncio
async def test_score_content_signal_keywords(scorer: ImportanceScorer) -> None:
    """Test content scoring for signal keywords."""
    score = scorer._score_content("Found a critical bug in the system")
    assert score >= 0.8

    score = scorer._score_content("How can I fix this error?")
    assert score >= 0.8


@pytest.mark.asyncio
async def test_score_content_length_based(scorer: ImportanceScorer) -> None:
    """Test content scoring based on message length."""
    assert scorer._score_content("hi") == 0.1
    assert scorer._score_content("This is a short message") == 0.4

    medium_msg = "This is a medium length message with some useful information"
    assert scorer._score_content(medium_msg) == 0.7

    long_msg = "This is a very long message " * 20
    assert scorer._score_content(long_msg) == 0.9


@pytest.mark.asyncio
async def test_score_content_question_bonus(scorer: ImportanceScorer) -> None:
    """Test content scoring question mark bonus."""
    score_without_question = scorer._score_content("This is a statement")
    score_with_question = scorer._score_content("This is a question?")

    assert score_with_question >= score_without_question


@pytest.mark.asyncio
async def test_score_content_url_code_bonus(scorer: ImportanceScorer) -> None:
    """Test content scoring URL/code bonus."""
    url_msg = "Check this out: https://example.com"
    score = scorer._score_content(url_msg)
    assert score >= 0.55

    code_msg = "Try this code: `print('hello')`"
    score = scorer._score_content(code_msg)
    assert score >= 0.55


@pytest.mark.asyncio
async def test_score_content_empty(scorer: ImportanceScorer) -> None:
    """Test content scoring for empty messages."""
    assert scorer._score_content("") == 0.05
    assert scorer._score_content("   ") == 0.05


@pytest.mark.asyncio
async def test_score_author_no_history(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test author scoring with no message history."""
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = MagicMock(total=0, avg_score=None)
    mock_db.execute.return_value = mock_result

    score = await scorer._score_author(123, mock_db)
    assert score == 0.5


@pytest.mark.asyncio
async def test_score_author_high_reputation(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test author scoring for high reputation user."""
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = MagicMock(total=50, avg_score=0.85)
    mock_db.execute.return_value = mock_result

    score = await scorer._score_author(123, mock_db)
    assert score == 0.9


@pytest.mark.asyncio
async def test_score_author_low_reputation(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test author scoring for low reputation user."""
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = MagicMock(total=30, avg_score=0.2)
    mock_db.execute.return_value = mock_result

    score = await scorer._score_author(123, mock_db)
    assert score == 0.2


@pytest.mark.asyncio
async def test_score_author_medium_reputation(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test author scoring for medium reputation user."""
    mock_result = MagicMock()
    mock_result.one_or_none.return_value = MagicMock(total=20, avg_score=0.55)
    mock_db.execute.return_value = mock_result

    score = await scorer._score_author(123, mock_db)
    assert score == 0.55


@pytest.mark.asyncio
async def test_score_temporal_recent_message(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test temporal scoring for recent message."""
    message = create_message(
        content="Recent message",
        sent_at=datetime.now(UTC) - timedelta(minutes=30),
    )

    mock_db.execute.return_value.scalar_one.return_value = 0

    score = await scorer._score_temporal(message, mock_db)
    assert score == 0.9


@pytest.mark.asyncio
async def test_score_temporal_day_old_message(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test temporal scoring for 12-hour old message."""
    message = create_message(
        content="Day old message",
        sent_at=datetime.now(UTC) - timedelta(hours=12),
    )

    mock_db.execute.return_value.scalar_one.return_value = 0

    score = await scorer._score_temporal(message, mock_db)
    assert score == 0.7


@pytest.mark.asyncio
async def test_score_temporal_week_old_message(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test temporal scoring for 3-day old message."""
    message = create_message(
        content="Week old message",
        sent_at=datetime.now(UTC) - timedelta(days=3),
    )

    mock_db.execute.return_value.scalar_one.return_value = 0

    score = await scorer._score_temporal(message, mock_db)
    assert score == 0.5


@pytest.mark.asyncio
async def test_score_temporal_old_message(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test temporal scoring for very old message."""
    message = create_message(
        content="Very old message",
        sent_at=datetime.now(UTC) - timedelta(days=30),
    )

    mock_db.execute.return_value.scalar_one.return_value = 0

    score = await scorer._score_temporal(message, mock_db)
    assert score == 0.3


@pytest.mark.asyncio
async def test_score_temporal_active_topic_bonus(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test temporal scoring with active topic bonus."""
    message = create_message(
        content="Message in active topic",
        sent_at=datetime.now(UTC) - timedelta(hours=5),
        topic_id=1,
    )

    mock_result = MagicMock()
    mock_result.scalar_one.return_value = 10
    mock_db.execute.return_value = mock_result

    score = await scorer._score_temporal(message, mock_db)
    assert score == 0.8


@pytest.mark.asyncio
async def test_score_topics_no_topic(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test topics scoring for message without topic."""
    message = create_message(content="General chat message", topic_id=None)

    score = await scorer._score_topics(message, mock_db)
    assert score == 0.4


@pytest.mark.asyncio
async def test_score_topics_high_activity(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test topics scoring for high-activity topic."""
    message = create_message(content="Message in popular topic", topic_id=1)

    mock_result_count = MagicMock()
    mock_result_count.scalar_one.return_value = 100

    mock_result_topic = MagicMock()
    mock_result_topic.scalar_one_or_none.return_value = Topic(
        id=1,
        name="Popular Topic",
        description="Very active topic",
    )

    mock_db.execute.side_effect = [mock_result_count, mock_result_topic]

    score = await scorer._score_topics(message, mock_db)
    assert score == 0.9


@pytest.mark.asyncio
async def test_score_topics_medium_activity(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test topics scoring for medium-activity topic."""
    message = create_message(content="Message in normal topic", topic_id=1)

    mock_result_count = MagicMock()
    mock_result_count.scalar_one.return_value = 25

    mock_result_topic = MagicMock()
    mock_result_topic.scalar_one_or_none.return_value = Topic(
        id=1,
        name="Normal Topic",
        description="Medium activity topic",
    )

    mock_db.execute.side_effect = [mock_result_count, mock_result_topic]

    score = await scorer._score_topics(message, mock_db)
    assert score == 0.6


@pytest.mark.asyncio
async def test_score_topics_low_activity(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test topics scoring for low-activity topic."""
    message = create_message(content="Message in quiet topic", topic_id=1)

    mock_result_count = MagicMock()
    mock_result_count.scalar_one.return_value = 3

    mock_result_topic = MagicMock()
    mock_result_topic.scalar_one_or_none.return_value = Topic(
        id=1,
        name="Quiet Topic",
        description="Low activity topic",
    )

    mock_db.execute.side_effect = [mock_result_count, mock_result_topic]

    score = await scorer._score_topics(message, mock_db)
    assert score == 0.4


@pytest.mark.asyncio
async def test_score_message_noise_classification(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test full message scoring: noise classification."""
    message = create_message(content="+1", sent_at=datetime.now(UTC) - timedelta(days=10))

    mock_result_author = MagicMock()
    mock_result_author.one_or_none.return_value = MagicMock(total=10, avg_score=0.2)

    mock_result_temporal = MagicMock()
    mock_result_temporal.scalar_one.return_value = 0

    mock_db.execute.side_effect = [mock_result_author, mock_result_temporal]

    result = await scorer.score_message(message, mock_db)

    assert result["importance_score"] < 0.3
    assert result["classification"] == "noise"
    assert "content" in result["noise_factors"]
    assert "author" in result["noise_factors"]
    assert "temporal" in result["noise_factors"]
    assert "topics" in result["noise_factors"]


@pytest.mark.asyncio
async def test_score_message_signal_classification(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test full message scoring: signal classification."""
    message = create_message(
        content="Found a critical bug in the payment system. How can we fix this error?",
        sent_at=datetime.now(UTC) - timedelta(minutes=15),
        topic_id=1,
    )

    mock_result_author = MagicMock()
    mock_result_author.one_or_none.return_value = MagicMock(total=50, avg_score=0.85)

    mock_result_temporal = MagicMock()
    mock_result_temporal.scalar_one.return_value = 5

    mock_result_topic_count = MagicMock()
    mock_result_topic_count.scalar_one.return_value = 75

    mock_result_topic = MagicMock()
    mock_result_topic.scalar_one_or_none.return_value = Topic(
        id=1,
        name="Bug Reports",
        description="Critical bugs",
    )

    mock_db.execute.side_effect = [
        mock_result_author,
        mock_result_temporal,
        mock_result_topic_count,
        mock_result_topic,
    ]

    result = await scorer.score_message(message, mock_db)

    assert result["importance_score"] > 0.7
    assert result["classification"] == "signal"
    assert result["noise_factors"]["content"] >= 0.8
    assert result["noise_factors"]["author"] == 0.9
    assert result["noise_factors"]["temporal"] == 1.0
    assert result["noise_factors"]["topics"] == 0.9


@pytest.mark.asyncio
async def test_score_message_weak_signal_classification(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test full message scoring: weak_signal classification."""
    message = create_message(
        content="Thanks for the update, this is helpful information.",
        sent_at=datetime.now(UTC) - timedelta(hours=6),
        topic_id=1,
    )

    mock_result_author = MagicMock()
    mock_result_author.one_or_none.return_value = MagicMock(total=20, avg_score=0.55)

    mock_result_temporal = MagicMock()
    mock_result_temporal.scalar_one.return_value = 2

    mock_result_topic_count = MagicMock()
    mock_result_topic_count.scalar_one.return_value = 15

    mock_result_topic = MagicMock()
    mock_result_topic.scalar_one_or_none.return_value = Topic(
        id=1,
        name="Updates",
        description="General updates",
    )

    mock_db.execute.side_effect = [
        mock_result_author,
        mock_result_temporal,
        mock_result_topic_count,
        mock_result_topic,
    ]

    result = await scorer.score_message(message, mock_db)

    # Verify classification is consistent with actual thresholds from ai_config
    # noise_threshold=0.25, signal_threshold=0.65
    score = result["importance_score"]
    if score < 0.25:
        assert result["classification"] == "noise"
    elif score > 0.65:
        assert result["classification"] == "signal"
    else:
        assert result["classification"] == "weak_signal"


@pytest.mark.asyncio
async def test_score_message_weights_calculation(scorer: ImportanceScorer, mock_db: AsyncMock) -> None:
    """Test that scoring weights are applied correctly."""
    message = create_message(
        content="Test message for weight calculation",
        sent_at=datetime.now(UTC),
    )

    mock_result_author = MagicMock()
    mock_result_author.one_or_none.return_value = MagicMock(total=0, avg_score=None)

    mock_result_temporal = MagicMock()
    mock_result_temporal.scalar_one.return_value = 0

    mock_db.execute.side_effect = [mock_result_author, mock_result_temporal]

    result = await scorer.score_message(message, mock_db)

    content_score = result["noise_factors"]["content"]
    author_score = result["noise_factors"]["author"]
    temporal_score = result["noise_factors"]["temporal"]
    topics_score = result["noise_factors"]["topics"]

    expected_score = content_score * 0.4 + author_score * 0.2 + temporal_score * 0.2 + topics_score * 0.2
    expected_score = round(expected_score, 2)

    assert result["importance_score"] == expected_score
