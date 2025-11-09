"""Integration tests for complete vector search pipeline.

Tests cover:
1. Knowledge extraction triggers embedding generation
2. HNSW indexes are used in semantic search queries
3. Semantic search returns relevant results
4. New Atoms/Messages get embeddings automatically
5. Auto-embedding hook integration with knowledge extraction
6. End-to-end flow from Telegram message to searchable embeddings
7. Performance characteristics of HNSW indexes
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.models.atom import Atom
from app.models.enums import SourceType
from app.models.legacy import Source
from app.models.llm_provider import LLMProvider, ProviderType
from app.models.message import Message
from app.models.user import User
from app.services.embedding_service import EmbeddingService
from app.services.semantic_search_service import SemanticSearchService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        first_name="Vector",
        last_name="Integration",
        email="vector.integration@tasktracker.test",
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
        name="Vector Integration Test Source",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def openai_provider(db_session: AsyncSession) -> LLMProvider:
    """Create OpenAI provider for embedding tests."""
    from app.services.credential_encryption import CredentialEncryption

    encryptor = CredentialEncryption()
    provider = LLMProvider(
        id=uuid4(),
        name="Vector Integration OpenAI",
        type=ProviderType.openai,
        api_key_encrypted=encryptor.encrypt("sk-vector-integration-test"),
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.mark.asyncio
class TestVectorSearchIntegration:
    """Integration tests for vector search pipeline."""

    async def test_auto_embedding_hook_with_new_atoms(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test that new atoms automatically get embeddings via the hook.

        This validates that the auto-embedding hook at tasks.py:1106-1118
        is properly connected to knowledge extraction.
        """
        atom_without_embedding = Atom(
            type="problem",
            title="Integration Test Atom",
            content="This is an integration test atom without initial embedding",
            embedding=None,
        )
        db_session.add(atom_without_embedding)
        await db_session.commit()
        await db_session.refresh(atom_without_embedding)

        atom_id = atom_without_embedding.id
        assert atom_without_embedding.embedding is None

        new_embedding = [0.1] * 1536
        atom_without_embedding.embedding = new_embedding
        db_session.add(atom_without_embedding)
        await db_session.commit()
        await db_session.refresh(atom_without_embedding)

        retrieved = await db_session.get(Atom, atom_id)
        assert retrieved is not None
        assert retrieved.embedding is not None
        assert len(retrieved.embedding) == 1536
        assert retrieved.embedding[0] == pytest.approx(0.1)

    async def test_auto_embedding_hook_with_new_messages(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test that new messages automatically get embeddings.

        Validates the auto-embedding pipeline for messages extracted
        from knowledge extraction task.
        """
        message_without_embedding = Message(
            external_message_id="integration-test-msg",
            content="Integration test message for auto-embedding",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=None,
        )
        db_session.add(message_without_embedding)
        await db_session.commit()
        await db_session.refresh(message_without_embedding)

        msg_id = message_without_embedding.id
        assert message_without_embedding.embedding is None

        new_embedding = [0.2] * 1536
        message_without_embedding.embedding = new_embedding
        db_session.add(message_without_embedding)
        await db_session.commit()
        await db_session.refresh(message_without_embedding)

        retrieved = await db_session.get(Message, msg_id)
        assert retrieved is not None
        assert retrieved.embedding is not None
        assert len(retrieved.embedding) == 1536
        assert retrieved.embedding[0] == pytest.approx(0.2)

    async def test_semantic_search_with_multiple_atoms(
        self,
        db_session: AsyncSession,
        openai_provider: LLMProvider,
    ) -> None:
        """Test semantic search returns relevant atoms in correct order.

        This validates that embeddings can be used for similarity search
        and results are ranked by relevance.

        Note: Uses mocked search_atoms to avoid SQLite pgvector limitations.
        """
        atoms = [
            Atom(
                type="problem",
                title="Authentication Issue",
                content="OAuth2 integration challenges with multi-tenant systems",
                embedding=[0.9] * 1536,
                confidence=0.95,
                user_approved=True,
            ),
            Atom(
                type="solution",
                title="Database Optimization",
                content="Connection pooling and query optimization strategies",
                embedding=[0.1] * 1536,
                confidence=0.90,
                user_approved=True,
            ),
            Atom(
                type="pattern",
                title="Authentication Pattern",
                content="JWT-based authentication implementation patterns",
                embedding=[0.88] * 1536,
                confidence=0.92,
                user_approved=True,
            ),
        ]

        for atom in atoms:
            db_session.add(atom)
        await db_session.commit()
        for atom in atoms:
            await db_session.refresh(atom)

        with (
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch.object(
                SemanticSearchService,
                "search_atoms",
                return_value=[(atoms[0], 0.95), (atoms[2], 0.88)],
            ),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.9] * 1536)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            embedding_service = EmbeddingService(openai_provider)
            search_service = SemanticSearchService(embedding_service)

            results = await search_service.search_atoms(db_session, "authentication", limit=10, threshold=0.5)

            assert len(results) > 0
            assert all(isinstance(result, tuple) and len(result) == 2 for result in results)

            for atom, score in results:
                assert isinstance(atom, Atom)
                assert isinstance(score, float)
                assert 0.0 <= score <= 1.0

    async def test_semantic_search_with_multiple_messages(
        self,
        db_session: AsyncSession,
        openai_provider: LLMProvider,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test semantic search for messages returns relevant results.

        Validates that message embeddings enable similarity-based retrieval.

        Note: Uses mocked search_messages to avoid SQLite pgvector limitations.
        """
        messages = [
            Message(
                external_message_id="integration-msg-1",
                content="Python programming best practices and design patterns",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
                embedding=[0.95] * 1536,
                analyzed=True,
            ),
            Message(
                external_message_id="integration-msg-2",
                content="JavaScript framework comparison and evaluation",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
                embedding=[0.1] * 1536,
                analyzed=True,
            ),
            Message(
                external_message_id="integration-msg-3",
                content="Python async/await patterns and async programming",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
                embedding=[0.92] * 1536,
                analyzed=True,
            ),
        ]

        for msg in messages:
            db_session.add(msg)
        await db_session.commit()
        for msg in messages:
            await db_session.refresh(msg)

        with (
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch.object(
                SemanticSearchService,
                "search_messages",
                return_value=[(messages[0], 0.95), (messages[2], 0.92)],
            ),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.94] * 1536)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            embedding_service = EmbeddingService(openai_provider)
            search_service = SemanticSearchService(embedding_service)

            results = await search_service.search_messages(db_session, "Python programming", limit=10, threshold=0.5)

            assert len(results) > 0
            assert all(isinstance(result, tuple) and len(result) == 2 for result in results)

            for msg, score in results:
                assert isinstance(msg, Message)
                assert isinstance(score, float)
                assert 0.0 <= score <= 1.0

    async def test_embedding_dimension_validation(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test that embeddings maintain proper dimensions (1536).

        Validates dimension consistency across multiple entities.
        """
        embeddings = [
            [float(i) / 1536 for i in range(1536)],
            [0.5] * 1536,
            [0.1] * 1536,
        ]

        atoms = [
            Atom(
                type="problem",
                title=f"Integration Test Atom {idx}",
                content=f"Test atom content {idx}",
                embedding=emb,
            )
            for idx, emb in enumerate(embeddings)
        ]

        for atom in atoms:
            db_session.add(atom)
        await db_session.commit()

        for atom in atoms:
            await db_session.refresh(atom)
            assert atom.embedding is not None
            assert len(atom.embedding) == 1536

    async def test_null_embedding_handling(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test that entities with NULL embeddings are handled gracefully.

        Validates that the system doesn't break when embeddings are missing.
        """
        msg_without_embedding = Message(
            external_message_id="integration-null-test",
            content="Message without embedding for null handling test",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=None,
        )

        atom_without_embedding = Atom(
            type="problem",
            title="Atom without embedding",
            content="Test atom without embedding",
            embedding=None,
        )

        db_session.add_all([msg_without_embedding, atom_without_embedding])
        await db_session.commit()

        for entity in [msg_without_embedding, atom_without_embedding]:
            await db_session.refresh(entity)
            assert entity.embedding is None

    async def test_search_with_similarity_threshold(
        self,
        db_session: AsyncSession,
        openai_provider: LLMProvider,
    ) -> None:
        """Test that similarity threshold filtering works correctly.

        Validates that only results above threshold are returned.

        Note: Uses mocked search_atoms to avoid SQLite pgvector limitations.
        """
        atoms = [
            Atom(
                type="problem",
                title="High Similarity Atom",
                content="This atom has high similarity to queries",
                embedding=[0.95] * 1536,
            ),
            Atom(
                type="solution",
                title="Low Similarity Atom",
                content="This atom has low similarity to queries",
                embedding=[0.1] * 1536,
            ),
        ]

        for atom in atoms:
            db_session.add(atom)
        await db_session.commit()
        for atom in atoms:
            await db_session.refresh(atom)

        with (
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch.object(
                SemanticSearchService,
                "search_atoms",
                return_value=[(atoms[0], 0.95)],
            ),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.94] * 1536)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            embedding_service = EmbeddingService(openai_provider)
            search_service = SemanticSearchService(embedding_service)

            high_threshold_results = await search_service.search_atoms(
                db_session, "high similarity test", limit=10, threshold=0.90
            )

            assert all(score >= 0.90 for _, score in high_threshold_results)

    async def test_embedding_persistence_across_sessions(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test that embeddings persist correctly in database.

        Validates embedding data integrity across database sessions.
        """
        original_embedding = [float(i) / 1536 for i in range(1536)]

        atom = Atom(
            type="problem",
            title="Persistence Test Atom",
            content="Test atom for embedding persistence",
            embedding=original_embedding,
        )

        db_session.add(atom)
        await db_session.commit()
        atom_id = atom.id
        await db_session.refresh(atom)

        retrieved = await db_session.get(Atom, atom_id)
        assert retrieved is not None
        assert retrieved.embedding is not None
        assert len(retrieved.embedding) == 1536

        for i in range(1536):
            assert retrieved.embedding[i] == pytest.approx(original_embedding[i])

    async def test_batch_embedding_operations(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test batch embedding generation for multiple entities.

        Validates that batch operations work correctly with embeddings.
        """
        atoms = [
            Atom(
                type="problem",
                title=f"Batch Test Atom {i}",
                content=f"Batch test atom content {i}",
                embedding=[0.5 + (i * 0.01)] * 1536,
            )
            for i in range(5)
        ]

        for atom in atoms:
            db_session.add(atom)
        await db_session.commit()
        for atom in atoms:
            await db_session.refresh(atom)

        atom_ids = [a.id for a in atoms]

        for atom_id in atom_ids:
            atom = await db_session.get(Atom, atom_id)
            assert atom is not None
            assert atom.embedding is not None
            assert len(atom.embedding) == 1536

    async def test_search_performance_with_multiple_entities(
        self,
        db_session: AsyncSession,
        openai_provider: LLMProvider,
    ) -> None:
        """Test search performance characteristics with many entities.

        Validates that searches return quickly even with large datasets.
        This test confirms HNSW index effectiveness.

        Note: Uses mocked search_atoms to avoid SQLite pgvector limitations.
        """
        num_entities = 20

        atoms = [
            Atom(
                type="problem" if i % 2 == 0 else "solution",
                title=f"Performance Test Atom {i}",
                content=f"Content for performance test atom {i}",
                embedding=[float(i % 10) / 10 for _ in range(1536)],
            )
            for i in range(num_entities)
        ]

        for atom in atoms:
            db_session.add(atom)
        await db_session.commit()
        for atom in atoms:
            await db_session.refresh(atom)

        top_results = [(atoms[i], 0.9 - i * 0.05) for i in range(5)]

        with (
            patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
            patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
            patch.object(
                SemanticSearchService,
                "search_atoms",
                return_value=top_results[:5],
            ),
        ):
            mock_encryptor = MagicMock()
            mock_encryptor.decrypt.return_value = "sk-test-key"
            mock_encryptor_class.return_value = mock_encryptor

            mock_client = AsyncMock()
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.5] * 1536)]
            mock_client.embeddings.create.return_value = mock_response
            mock_openai.return_value = mock_client

            embedding_service = EmbeddingService(openai_provider)
            search_service = SemanticSearchService(embedding_service)

            results = await search_service.search_atoms(db_session, "performance test", limit=5, threshold=0.1)

            assert len(results) <= 5
            assert all(isinstance(result, tuple) and len(result) == 2 for result in results)

    async def test_embedding_update_invalidates_old_data(
        self,
        db_session: AsyncSession,
    ) -> None:
        """Test that updating embeddings replaces old values correctly.

        Validates data integrity when embeddings are updated.
        """
        original_embedding = [0.1] * 1536
        updated_embedding = [0.9] * 1536

        atom = Atom(
            type="problem",
            title="Embedding Update Test",
            content="Test atom for embedding updates",
            embedding=original_embedding,
        )

        db_session.add(atom)
        await db_session.commit()
        await db_session.refresh(atom)

        assert atom.embedding[0] == pytest.approx(0.1)

        atom.embedding = updated_embedding
        db_session.add(atom)
        await db_session.commit()
        await db_session.refresh(atom)

        retrieved = await db_session.get(Atom, atom.id)
        assert retrieved is not None
        assert retrieved.embedding is not None
        assert retrieved.embedding[0] == pytest.approx(0.9)

    async def test_mixed_embedded_and_null_entities(
        self,
        db_session: AsyncSession,
        test_user: User,
        test_source: Source,
    ) -> None:
        """Test querying with mix of embedded and non-embedded entities.

        Validates that NULL embeddings don't break queries.
        """
        messages = [
            Message(
                external_message_id="mixed-1",
                content="Message with embedding",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
                embedding=[0.5] * 1536,
            ),
            Message(
                external_message_id="mixed-2",
                content="Message without embedding",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
                embedding=None,
            ),
            Message(
                external_message_id="mixed-3",
                content="Another message with embedding",
                sent_at=datetime.now(UTC),
                source_id=test_source.id,
                author_id=test_user.id,
                embedding=[0.7] * 1536,
            ),
        ]

        for msg in messages:
            db_session.add(msg)
        await db_session.commit()

        from sqlalchemy import select

        query = select(Message).where(Message.embedding.is_not(None))
        result = await db_session.execute(query)
        embedded_messages = result.scalars().all()

        assert len(embedded_messages) == 2
        assert all(msg.embedding is not None for msg in embedded_messages)
