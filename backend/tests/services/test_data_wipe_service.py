"""Tests for DataWipeService."""

from datetime import UTC, datetime, timedelta

import pytest
from app.models.atom import Atom
from app.models.confirmation_token import ConfirmationToken, DataWipeScope
from app.models.legacy import Source
from app.models.message import Message
from app.models.topic import Topic
from app.models.user import User
from app.services.data_wipe_service import DataWipeService
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select


@pytest.fixture
def data_wipe_service() -> DataWipeService:
    """Create DataWipeService instance."""
    return DataWipeService()


@pytest.fixture
async def sample_source(db_session: AsyncSession) -> Source:
    """Create a sample source."""
    source = Source(
        name="Test Source",
        type="telegram",
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    """Create a sample user."""
    user = User(
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_data(
    db_session: AsyncSession,
    sample_source: Source,
    sample_user: User,
) -> dict[str, int]:
    """Create sample messages, atoms, and topics."""
    # Create topics
    topics = []
    for i in range(3):
        topic = Topic(
            name=f"Topic {i}",
            description=f"Description {i}",
        )
        db_session.add(topic)
        topics.append(topic)

    await db_session.commit()

    # Create atoms
    atoms = []
    for i in range(5):
        atom = Atom(
            type="problem",
            title=f"Atom {i}",
            content=f"Content {i}",
        )
        db_session.add(atom)
        atoms.append(atom)

    await db_session.commit()

    # Create messages
    messages = []
    for i in range(10):
        message = Message(
            external_message_id=f"msg_{i}",
            content=f"Message content {i}",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        db_session.add(message)
        messages.append(message)

    await db_session.commit()

    return {
        "topics": len(topics),
        "atoms": len(atoms),
        "messages": len(messages),
    }


class TestDataWipeService:
    """Test DataWipeService functionality."""

    @pytest.mark.asyncio
    async def test_get_affected_counts_all(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_data: dict[str, int],
    ) -> None:
        """Test getting affected counts for all scope."""
        counts = await data_wipe_service.get_affected_counts(
            db_session, DataWipeScope.all
        )

        assert counts["messages"] == sample_data["messages"], (
            f"Expected {sample_data['messages']} messages, got {counts['messages']}"
        )
        assert counts["atoms"] == sample_data["atoms"], (
            f"Expected {sample_data['atoms']} atoms, got {counts['atoms']}"
        )
        assert counts["topics"] == sample_data["topics"], (
            f"Expected {sample_data['topics']} topics, got {counts['topics']}"
        )

    @pytest.mark.asyncio
    async def test_get_affected_counts_messages_only(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_data: dict[str, int],
    ) -> None:
        """Test getting affected counts for messages scope."""
        counts = await data_wipe_service.get_affected_counts(
            db_session, DataWipeScope.messages
        )

        assert "messages" in counts
        assert "atoms" not in counts
        assert "topics" not in counts
        assert counts["messages"] == sample_data["messages"]

    @pytest.mark.asyncio
    async def test_generate_confirmation_token(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_data: dict[str, int],
    ) -> None:
        """Test generating a confirmation token."""
        confirmation = await data_wipe_service.generate_confirmation_token(
            db_session, DataWipeScope.all
        )

        assert confirmation.token is not None, "Token should not be None"
        assert len(confirmation.token) == 64, (
            f"Token should be 64 chars, got {len(confirmation.token)}"
        )
        assert confirmation.scope == "all"
        assert "permanently delete" in confirmation.warning.lower()
        assert confirmation.affected_counts["messages"] == sample_data["messages"]

        # Verify token was saved to DB
        result = await db_session.execute(
            select(ConfirmationToken).where(
                ConfirmationToken.token == confirmation.token
            )
        )
        db_token = result.scalar_one_or_none()
        assert db_token is not None, "Token should be saved to database"
        assert db_token.used is False

    @pytest.mark.asyncio
    async def test_validate_token_valid(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
    ) -> None:
        """Test validating a valid token."""
        confirmation = await data_wipe_service.generate_confirmation_token(
            db_session, DataWipeScope.all
        )

        token = await data_wipe_service.validate_token(
            db_session, confirmation.token
        )

        assert token is not None, "Valid token should be returned"
        assert token.is_valid() is True

    @pytest.mark.asyncio
    async def test_validate_token_not_found(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
    ) -> None:
        """Test validating a non-existent token."""
        token = await data_wipe_service.validate_token(
            db_session, "nonexistent_token_12345678901234567890"
        )

        assert token is None, "Non-existent token should return None"

    @pytest.mark.asyncio
    async def test_validate_token_expired(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
    ) -> None:
        """Test validating an expired token."""
        # Create token with past expiry
        token = ConfirmationToken(
            token="expired_token_12345678901234567890123456789012",
            scope="all",
            expires_at=datetime.now(UTC) - timedelta(minutes=10),
        )
        db_session.add(token)
        await db_session.commit()

        result = await data_wipe_service.validate_token(db_session, token.token)

        assert result is None, "Expired token should return None"

    @pytest.mark.asyncio
    async def test_validate_token_already_used(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
    ) -> None:
        """Test validating an already used token."""
        # Create used token
        token = ConfirmationToken(
            token="used_token_12345678901234567890123456789012345",
            scope="all",
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
            used=True,
            used_at=datetime.now(UTC),
        )
        db_session.add(token)
        await db_session.commit()

        result = await data_wipe_service.validate_token(db_session, token.token)

        assert result is None, "Used token should return None"

    @pytest.mark.asyncio
    async def test_execute_wipe_all(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_data: dict[str, int],
    ) -> None:
        """Test executing a full data wipe."""
        # Generate token
        confirmation = await data_wipe_service.generate_confirmation_token(
            db_session, DataWipeScope.all
        )

        # Execute wipe
        result = await data_wipe_service.execute_wipe(
            db_session, confirmation.token
        )

        assert result.success is True, "Wipe should succeed"
        assert result.deleted_counts["messages"] == sample_data["messages"]
        assert result.deleted_counts["atoms"] == sample_data["atoms"]
        assert result.deleted_counts["topics"] == sample_data["topics"]

        # Verify data is deleted
        remaining_messages = await db_session.execute(select(Message))
        assert len(list(remaining_messages.scalars().all())) == 0, (
            "All messages should be deleted"
        )

        remaining_atoms = await db_session.execute(select(Atom))
        assert len(list(remaining_atoms.scalars().all())) == 0, (
            "All atoms should be deleted"
        )

        remaining_topics = await db_session.execute(select(Topic))
        assert len(list(remaining_topics.scalars().all())) == 0, (
            "All topics should be deleted"
        )

    @pytest.mark.asyncio
    async def test_execute_wipe_messages_only(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_data: dict[str, int],
    ) -> None:
        """Test executing a messages-only wipe."""
        confirmation = await data_wipe_service.generate_confirmation_token(
            db_session, DataWipeScope.messages
        )

        result = await data_wipe_service.execute_wipe(
            db_session, confirmation.token
        )

        assert result.success is True
        assert result.deleted_counts["messages"] == sample_data["messages"]

        # Verify messages deleted but atoms/topics remain
        remaining_messages = await db_session.execute(select(Message))
        assert len(list(remaining_messages.scalars().all())) == 0

        remaining_atoms = await db_session.execute(select(Atom))
        assert len(list(remaining_atoms.scalars().all())) == sample_data["atoms"], (
            "Atoms should NOT be deleted in messages scope"
        )

        remaining_topics = await db_session.execute(select(Topic))
        assert len(list(remaining_topics.scalars().all())) == sample_data["topics"], (
            "Topics should NOT be deleted in messages scope"
        )

    @pytest.mark.asyncio
    async def test_execute_wipe_preserves_sources(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_source: Source,
        sample_data: dict[str, int],
    ) -> None:
        """Test that wipe preserves sources and users."""
        confirmation = await data_wipe_service.generate_confirmation_token(
            db_session, DataWipeScope.all
        )

        await data_wipe_service.execute_wipe(db_session, confirmation.token)

        # Verify source is preserved
        result = await db_session.execute(
            select(Source).where(Source.id == sample_source.id)
        )
        source = result.scalar_one_or_none()
        assert source is not None, "Source should be preserved after wipe"

    @pytest.mark.asyncio
    async def test_execute_wipe_invalid_token(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
    ) -> None:
        """Test executing wipe with invalid token fails."""
        with pytest.raises(ValueError, match="Invalid or expired"):
            await data_wipe_service.execute_wipe(
                db_session, "invalid_token_12345678901234567890"
            )

    @pytest.mark.asyncio
    async def test_execute_wipe_token_used_once(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
        sample_data: dict[str, int],
    ) -> None:
        """Test that token can only be used once."""
        confirmation = await data_wipe_service.generate_confirmation_token(
            db_session, DataWipeScope.all
        )

        # First use should succeed
        result = await data_wipe_service.execute_wipe(
            db_session, confirmation.token
        )
        assert result.success is True

        # Second use should fail
        with pytest.raises(ValueError, match="Invalid or expired"):
            await data_wipe_service.execute_wipe(
                db_session, confirmation.token
            )

    @pytest.mark.asyncio
    async def test_cleanup_expired_tokens(
        self,
        db_session: AsyncSession,
        data_wipe_service: DataWipeService,
    ) -> None:
        """Test cleanup of expired tokens."""
        # Create expired token
        expired_token = ConfirmationToken(
            token="expired_123456789012345678901234567890123456",
            scope="all",
            expires_at=datetime.now(UTC) - timedelta(minutes=10),
        )
        db_session.add(expired_token)

        # Create used token
        used_token = ConfirmationToken(
            token="used_1234567890123456789012345678901234567890",
            scope="all",
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
            used=True,
        )
        db_session.add(used_token)

        # Create valid token
        valid_token = ConfirmationToken(
            token="valid_123456789012345678901234567890123456789",
            scope="all",
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
        )
        db_session.add(valid_token)

        await db_session.commit()

        # Cleanup
        cleaned = await data_wipe_service.cleanup_expired_tokens(db_session)

        assert cleaned == 2, f"Expected 2 tokens cleaned, got {cleaned}"

        # Verify valid token remains
        result = await db_session.execute(
            select(ConfirmationToken).where(
                ConfirmationToken.token == valid_token.token
            )
        )
        remaining = result.scalar_one_or_none()
        assert remaining is not None, "Valid token should remain after cleanup"


class TestConfirmationTokenModel:
    """Test ConfirmationToken model methods."""

    def test_generate_token_length(self) -> None:
        """Test that generated token has correct length."""
        token = ConfirmationToken.generate_token()
        assert len(token) == 64, f"Token should be 64 chars, got {len(token)}"

    def test_generate_token_unique(self) -> None:
        """Test that generated tokens are unique."""
        tokens = [ConfirmationToken.generate_token() for _ in range(100)]
        assert len(set(tokens)) == 100, "All tokens should be unique"

    def test_calculate_expiry(self) -> None:
        """Test that expiry is calculated correctly."""
        before = datetime.now(UTC)
        expiry = ConfirmationToken.calculate_expiry()
        after = datetime.now(UTC)

        expected_min = before + timedelta(minutes=ConfirmationToken.TTL_MINUTES)
        expected_max = after + timedelta(minutes=ConfirmationToken.TTL_MINUTES)

        assert expected_min <= expiry <= expected_max, (
            f"Expiry {expiry} should be between {expected_min} and {expected_max}"
        )

    def test_is_expired_false(self) -> None:
        """Test is_expired returns False for valid token."""
        token = ConfirmationToken(
            token="test",
            scope="all",
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
        )
        assert token.is_expired() is False

    def test_is_expired_true(self) -> None:
        """Test is_expired returns True for expired token."""
        token = ConfirmationToken(
            token="test",
            scope="all",
            expires_at=datetime.now(UTC) - timedelta(minutes=5),
        )
        assert token.is_expired() is True

    def test_is_valid_true(self) -> None:
        """Test is_valid returns True for valid unused token."""
        token = ConfirmationToken(
            token="test",
            scope="all",
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
            used=False,
        )
        assert token.is_valid() is True

    def test_is_valid_false_used(self) -> None:
        """Test is_valid returns False for used token."""
        token = ConfirmationToken(
            token="test",
            scope="all",
            expires_at=datetime.now(UTC) + timedelta(minutes=5),
            used=True,
        )
        assert token.is_valid() is False

    def test_is_valid_false_expired(self) -> None:
        """Test is_valid returns False for expired token."""
        token = ConfirmationToken(
            token="test",
            scope="all",
            expires_at=datetime.now(UTC) - timedelta(minutes=5),
            used=False,
        )
        assert token.is_valid() is False
