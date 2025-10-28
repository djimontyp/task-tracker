"""Tests for embedding background tasks.

Tests cover:
1. Successful batch embedding of messages
2. Successful batch embedding of atoms
3. Handling of missing provider
4. Partial failures in batch processing
5. Skipping already embedded items
"""

from datetime import UTC, datetime
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.models.atom import Atom
from app.models.enums import SourceType
from app.models.legacy import Source
from app.models.llm_provider import LLMProvider, ProviderType
from app.models.message import Message
from app.models.user import User
from app.tasks import embed_atoms_batch_task, embed_messages_batch_task
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        first_name="Test",
        last_name="User",
        email="background.test@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_source(db_session: AsyncSession) -> Source:
    """Create test source."""
    source = Source(
        name="Background Test Source",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def test_provider(db_session: AsyncSession) -> LLMProvider:
    """Create test LLM provider for background tasks."""
    from app.services.credential_encryption import CredentialEncryption

    encryptor = CredentialEncryption()
    provider = LLMProvider(
        id=uuid4(),
        name="Test Background Provider",
        type=ProviderType.openai,
        api_key_encrypted=encryptor.encrypt("sk-test-background-key"),
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.mark.asyncio
class TestEmbeddingBackgroundTasks:
    """Test suite for embedding background tasks."""

    async def test_embed_messages_batch_task_success(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
        test_provider: LLMProvider,
    ) -> None:
        """Test successful batch embedding of messages."""
        messages = [
            Message(
                external_message_id=f"bg_test_{i}",
                content=f"Background test message content {i}",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
            )
            for i in range(5)
        ]
        db_session.add_all(messages)
        await db_session.commit()

        for msg in messages:
            await db_session.refresh(msg)

        message_ids = [m.id for m in messages]

        mock_embedding = [0.1] * 1536

        async def mock_db_context() -> AsyncGenerator:
            yield db_session

        with (
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.tasks.knowledge.get_db_session_context", return_value=mock_db_context()),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=mock_embedding)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            result = await embed_messages_batch_task(message_ids=message_ids, provider_id=str(test_provider.id))

            assert result["success"] == 5
            assert result["failed"] == 0
            assert result["skipped"] == 0

            for msg_id in message_ids:
                msg = await db_session.get(Message, msg_id)
                assert msg is not None
                assert msg.embedding is not None
                assert len(msg.embedding) == 1536

    async def test_embed_atoms_batch_task_success(
        self,
        db_session: AsyncSession,
        test_provider: LLMProvider,
    ) -> None:
        """Test successful batch embedding of atoms."""
        atoms = [
            Atom(
                type="problem",
                title=f"Background Test Problem {i}",
                content=f"This is background test problem content {i}",
            )
            for i in range(5)
        ]
        db_session.add_all(atoms)
        await db_session.commit()

        for atom in atoms:
            await db_session.refresh(atom)

        atom_ids = [a.id for a in atoms]

        mock_embedding = [0.2] * 1536

        async def mock_db_context() -> AsyncGenerator:
            yield db_session

        with (
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.tasks.knowledge.get_db_session_context", return_value=mock_db_context()),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=mock_embedding)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            result = await embed_atoms_batch_task(atom_ids=atom_ids, provider_id=str(test_provider.id))

            assert result["success"] == 5
            assert result["failed"] == 0
            assert result["skipped"] == 0

            for atom_id in atom_ids:
                atom = await db_session.get(Atom, atom_id)
                assert atom is not None
                assert atom.embedding is not None
                assert len(atom.embedding) == 1536

    async def test_batch_task_handles_missing_provider(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test graceful handling of missing provider."""
        messages = [
            Message(
                external_message_id=f"missing_prov_{i}",
                content=f"Message {i}",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
            )
            for i in range(3)
        ]
        db_session.add_all(messages)
        await db_session.commit()

        for msg in messages:
            await db_session.refresh(msg)

        message_ids = [m.id for m in messages]
        fake_provider_id = str(uuid4())

        async def mock_db_context() -> AsyncGenerator:
            yield db_session

        with patch("app.tasks.knowledge.get_db_session_context", return_value=mock_db_context()):
            with pytest.raises(ValueError, match="not found"):
                await embed_messages_batch_task(message_ids=message_ids, provider_id=fake_provider_id)

    async def test_batch_task_handles_partial_failures(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
        test_provider: LLMProvider,
    ) -> None:
        """Test batch processing with some invalid message IDs."""
        valid_msg = Message(
            external_message_id="valid_partial",
            content="Valid message for partial failure test",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
        db_session.add(valid_msg)
        await db_session.commit()
        await db_session.refresh(valid_msg)

        message_ids = [valid_msg.id, 99999, 88888]

        mock_embedding = [0.3] * 1536

        async def mock_db_context() -> AsyncGenerator:
            yield db_session

        with (
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.tasks.knowledge.get_db_session_context", return_value=mock_db_context()),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=mock_embedding)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            result = await embed_messages_batch_task(message_ids=message_ids, provider_id=str(test_provider.id))

            assert result["success"] >= 1

            msg = await db_session.get(Message, valid_msg.id)
            assert msg is not None
            assert msg.embedding is not None

    async def test_batch_task_skips_already_embedded(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
        test_provider: LLMProvider,
    ) -> None:
        """Test that already embedded messages are skipped."""
        existing_embedding = [0.5] * 1536

        msg = Message(
            external_message_id="already_embedded",
            content="Already embedded message",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=existing_embedding,
        )
        db_session.add(msg)
        await db_session.commit()
        await db_session.refresh(msg)

        async def mock_db_context() -> AsyncGenerator:
            yield db_session

        with (
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.tasks.knowledge.get_db_session_context", return_value=mock_db_context()),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_openai.return_value = mock_client

            result = await embed_messages_batch_task(message_ids=[msg.id], provider_id=str(test_provider.id))

            assert result["skipped"] == 1
            assert result["success"] == 0

            refreshed = await db_session.get(Message, msg.id)
            assert refreshed is not None
            assert len(refreshed.embedding) == len(existing_embedding)

            mock_client.embeddings.create.assert_not_called()

    async def test_batch_task_skips_already_embedded_atoms(
        self,
        db_session: AsyncSession,
        test_provider: LLMProvider,
    ) -> None:
        """Test that already embedded atoms are skipped."""
        existing_embedding = [0.6] * 1536

        atom = Atom(
            type="solution",
            title="Already Embedded Atom",
            content="This atom already has an embedding",
            embedding=existing_embedding,
        )
        db_session.add(atom)
        await db_session.commit()
        await db_session.refresh(atom)

        async def mock_db_context() -> AsyncGenerator:
            yield db_session

        with (
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.tasks.knowledge.get_db_session_context", return_value=mock_db_context()),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_openai.return_value = mock_client

            result = await embed_atoms_batch_task(atom_ids=[atom.id], provider_id=str(test_provider.id))

            assert result["skipped"] == 1
            assert result["success"] == 0

            refreshed = await db_session.get(Atom, atom.id)
            assert refreshed is not None
            assert len(refreshed.embedding) == len(existing_embedding)

            mock_client.embeddings.create.assert_not_called()
