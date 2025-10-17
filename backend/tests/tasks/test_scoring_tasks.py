"""Tests for message scoring background tasks."""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

import pytest
from app.models.legacy import Source
from app.models.message import Message
from app.models.user import User
from app.tasks import score_message_task, score_unscored_messages_task
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        first_name="Test",
        last_name="User",
        full_name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_source(db_session: AsyncSession) -> Source:
    """Create test source."""
    source = Source(name="test_source")
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def test_message(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> Message:
    """Create test message without importance score."""
    message = Message(
        external_message_id="test_123",
        content="This is a test message with some important content about a bug",
        sent_at=datetime.now(UTC),
        source_id=test_source.id or 0,
        author_id=test_user.id or 0,
        importance_score=None,
        noise_classification=None,
        noise_factors=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)
    return message


class TestScoreMessageTask:
    """Tests for score_message_task."""

    @pytest.mark.asyncio
    async def test_score_message_success(
        self,
        db_session: AsyncSession,
        test_message: Message,
    ) -> None:
        """Test successful message scoring."""
        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            result = await score_message_task(test_message.id or 0)

            assert result["message_id"] == test_message.id
            assert "importance_score" in result
            assert "classification" in result
            assert "noise_factors" in result
            assert 0.0 <= result["importance_score"] <= 1.0
            assert result["classification"] in ["noise", "weak_signal", "signal"]

            await db_session.refresh(test_message)
            assert test_message.importance_score is not None
            assert test_message.noise_classification is not None
            assert test_message.noise_factors is not None

    @pytest.mark.asyncio
    async def test_score_message_not_found(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test scoring non-existent message raises ValueError."""
        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            with pytest.raises(ValueError, match="Message 99999 not found"):
                await score_message_task(99999)

    @pytest.mark.asyncio
    async def test_score_message_updates_fields(
        self,
        db_session: AsyncSession,
        test_message: Message,
    ) -> None:
        """Test that scoring updates all required fields."""
        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            await score_message_task(test_message.id or 0)

            await db_session.refresh(test_message)

            assert test_message.importance_score is not None
            assert isinstance(test_message.importance_score, float)
            assert test_message.noise_classification in ["noise", "weak_signal", "signal"]
            assert test_message.noise_factors is not None
            assert "content" in test_message.noise_factors
            assert "author" in test_message.noise_factors
            assert "temporal" in test_message.noise_factors
            assert "topics" in test_message.noise_factors


class TestScoreUnscoredMessagesTask:
    """Tests for score_unscored_messages_task."""

    @pytest.mark.asyncio
    async def test_score_unscored_messages_success(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test batch scoring of unscored messages."""
        messages = []
        for i in range(5):
            msg = Message(
                external_message_id=f"batch_test_{i}",
                content=f"Test message {i} with some content",
                sent_at=datetime.now(UTC),
                source_id=test_source.id or 0,
                author_id=test_user.id or 0,
                importance_score=None,
            )
            db_session.add(msg)
            messages.append(msg)

        await db_session.commit()

        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            result = await score_unscored_messages_task(limit=10)

            assert result["total_found"] == 5
            assert result["scored"] == 5
            assert result["failed"] == 0

            for msg in messages:
                await db_session.refresh(msg)
                assert msg.importance_score is not None
                assert msg.noise_classification is not None

    @pytest.mark.asyncio
    async def test_score_unscored_messages_respects_limit(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test that batch scoring respects limit parameter."""
        for i in range(10):
            msg = Message(
                external_message_id=f"limit_test_{i}",
                content=f"Test message {i}",
                sent_at=datetime.now(UTC),
                source_id=test_source.id or 0,
                author_id=test_user.id or 0,
                importance_score=None,
            )
            db_session.add(msg)

        await db_session.commit()

        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            result = await score_unscored_messages_task(limit=5)

            assert result["total_found"] == 5
            assert result["scored"] == 5

    @pytest.mark.asyncio
    async def test_score_unscored_messages_empty(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test batch scoring with no unscored messages."""
        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            result = await score_unscored_messages_task(limit=100)

            assert result["total_found"] == 0
            assert result["scored"] == 0
            assert result["failed"] == 0

    @pytest.mark.asyncio
    async def test_score_unscored_messages_skips_already_scored(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test that batch scoring skips messages with existing scores."""
        unscored_msg = Message(
            external_message_id="unscored_1",
            content="Unscored message",
            sent_at=datetime.now(UTC),
            source_id=test_source.id or 0,
            author_id=test_user.id or 0,
            importance_score=None,
        )
        db_session.add(unscored_msg)

        scored_msg = Message(
            external_message_id="scored_1",
            content="Already scored message",
            sent_at=datetime.now(UTC),
            source_id=test_source.id or 0,
            author_id=test_user.id or 0,
            importance_score=0.75,
            noise_classification="signal",
        )
        db_session.add(scored_msg)

        await db_session.commit()

        with patch("app.tasks.get_db_session_context") as mock_db_context:
            mock_context = AsyncMock()
            mock_context.__anext__.return_value = db_session
            mock_db_context.return_value = mock_context

            result = await score_unscored_messages_task(limit=100)

            assert result["total_found"] == 1
            assert result["scored"] == 1
