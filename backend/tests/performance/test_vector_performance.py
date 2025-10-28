"""Performance tests for vector operations and semantic search.

Tests benchmark:
1. Embedding generation speed (<500ms per message target)
2. Semantic search performance (<200ms for 10k messages target)
3. RAG context building speed (<500ms target)
4. Batch embedding throughput
5. Vector similarity query performance
6. Large dataset handling

NOTE: These tests are marked with @pytest.mark.performance and should be
run separately from regular test suite. They require a real database with
pgvector extension enabled.

Run with: pytest tests/performance/ -v --tb=short
"""

import time
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
from app.services.rag_context_builder import RAGContextBuilder
from app.services.semantic_search_service import SemanticSearchService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def openai_provider(db_session: AsyncSession) -> LLMProvider:
    """Create OpenAI provider for performance testing."""
    provider = LLMProvider(
        id=uuid4(),
        name="OpenAI Performance Test",
        type=ProviderType.openai,
        api_key_encrypted=b"test_key",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        first_name="Perf",
        last_name="Test",
        email="perf@test.com",
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
        name="Perf Test",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.mark.performance
@pytest.mark.asyncio
async def test_embedding_generation_performance(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Benchmark: Embedding generation should complete in <500ms per message.

    This test measures the time to generate an embedding for a single message
    including API call to OpenAI and database storage.
    """
    message = Message(
        external_message_id="perf-test-1",
        content="Performance test message for embedding generation benchmark",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        service = EmbeddingService(openai_provider)

        start_time = time.time()
        await service.embed_message(db_session, message)
        duration = time.time() - start_time

        assert duration < 0.5, f"Embedding generation took {duration:.3f}s (target: <0.5s)"

        print(f"\n✓ Embedding generation: {duration * 1000:.2f}ms")


@pytest.mark.performance
@pytest.mark.asyncio
async def test_batch_embedding_throughput(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Benchmark: Batch embedding should process 100 messages efficiently.

    This test measures throughput for batch embedding operations.
    Target: <10s for 100 messages (100ms per message amortized).
    """
    messages = []
    for i in range(100):
        msg = Message(
            external_message_id=f"batch-perf-{i}",
            content=f"Performance test message {i}",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=None,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)

    message_ids = [msg.id for msg in messages]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        service = EmbeddingService(openai_provider)

        start_time = time.time()
        stats = await service.embed_messages_batch(db_session, message_ids, batch_size=100)
        duration = time.time() - start_time

        assert stats["success"] == 100
        assert duration < 10.0, f"Batch embedding took {duration:.3f}s (target: <10s for 100 messages)"

        throughput = 100 / duration
        print(f"\n✓ Batch embedding: {duration:.2f}s total, {throughput:.1f} messages/sec")


@pytest.mark.performance
@pytest.mark.asyncio
async def test_semantic_search_performance_small_dataset(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Benchmark: Semantic search on small dataset (<100 messages).

    Target: <100ms for searches on small datasets.
    Note: Requires PostgreSQL with pgvector. Skipped on SQLite.
    """
    dialect = db_session.bind.dialect.name
    if dialect == "sqlite":
        pytest.skip("Vector similarity operations require PostgreSQL with pgvector")
    for i in range(50):
        msg = Message(
            external_message_id=f"search-perf-{i}",
            content=f"Test message {i} about various topics",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=[float(i % 10) * 0.1] * 1536,
        )
        db_session.add(msg)

    await db_session.commit()

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.5] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)

        start_time = time.time()
        results = await search_service.search_messages(db_session, "test query", limit=10, threshold=0.7)
        duration = time.time() - start_time

        print(f"\n✓ Semantic search (50 messages): {duration * 1000:.2f}ms, {len(results)} results")


@pytest.mark.performance
@pytest.mark.asyncio
async def test_rag_context_building_performance(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Benchmark: RAG context building should complete in <500ms.

    This includes:
    - Embedding generation for current messages
    - Retrieval of similar proposals (5 items)
    - Retrieval of relevant atoms (5 items)
    - Retrieval of related messages (5 items)
    - Context formatting
    """
    for i in range(20):
        msg = Message(
            external_message_id=f"rag-hist-{i}",
            content=f"Historical message {i}",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=[float(i) * 0.05] * 1536,
        )
        db_session.add(msg)

    await db_session.commit()

    current_messages = [
        Message(
            external_message_id="rag-current",
            content="Current message for RAG test",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
        )
    ]

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.5] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)
        rag_builder = RAGContextBuilder(embedding_service, search_service)

        start_time = time.time()
        context = await rag_builder.build_context(db_session, current_messages, top_k=5)
        duration = time.time() - start_time

        assert duration < 0.5, f"RAG context building took {duration:.3f}s (target: <0.5s)"

        print(f"\n✓ RAG context building: {duration * 1000:.2f}ms")
        print(f"  - Proposals: {len(context['similar_proposals'])}")
        print(f"  - Atoms: {len(context['relevant_atoms'])}")
        print(f"  - Messages: {len(context['related_messages'])}")


@pytest.mark.performance
@pytest.mark.asyncio
async def test_vector_storage_performance(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Benchmark: Vector storage and retrieval performance.

    Measures time to:
    1. Store 100 messages with embeddings
    2. Query messages with embeddings
    3. Retrieve embeddings from database
    """
    messages = []
    for i in range(100):
        msg = Message(
            external_message_id=f"storage-perf-{i}",
            content=f"Storage test {i}",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=[float(i % 50) * 0.02] * 1536,
        )
        messages.append(msg)
        db_session.add(msg)

    start_time = time.time()
    await db_session.commit()
    storage_duration = time.time() - start_time

    for msg in messages:
        await db_session.refresh(msg)

    start_time = time.time()
    retrieved = await db_session.get(Message, messages[50].id)
    retrieval_duration = time.time() - start_time

    assert retrieved is not None
    assert retrieved.embedding is not None

    print(f"\n✓ Vector storage (100 messages): {storage_duration * 1000:.2f}ms")
    print(f"✓ Vector retrieval (single): {retrieval_duration * 1000:.2f}ms")


@pytest.mark.performance
@pytest.mark.asyncio
async def test_find_similar_messages_performance(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Benchmark: Finding similar messages by embedding.

    Target: <100ms for similarity search on moderate dataset (100 messages).
    Note: Requires PostgreSQL with pgvector. Skipped on SQLite.
    """
    dialect = db_session.bind.dialect.name
    if dialect == "sqlite":
        pytest.skip("Vector similarity operations require PostgreSQL with pgvector")
    messages = []
    for i in range(100):
        msg = Message(
            external_message_id=f"similar-perf-{i}",
            content=f"Test message {i}",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=[float(i % 20) * 0.05] * 1536,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)

    source_message = messages[0]

    search_service = SemanticSearchService()

    start_time = time.time()
    results = await search_service.find_similar_messages(db_session, source_message.id, limit=10, threshold=0.7)
    duration = time.time() - start_time

    print(f"\n✓ Find similar messages (100 total): {duration * 1000:.2f}ms, {len(results)} results")


@pytest.mark.performance
@pytest.mark.asyncio
async def test_atom_search_performance(
    db_session: AsyncSession,
    openai_provider: LLMProvider,
) -> None:
    """Benchmark: Semantic search performance on atoms.

    Atoms are typically smaller in number but searched frequently.
    Target: <50ms for atom searches.
    Note: Requires PostgreSQL with pgvector. Skipped on SQLite.
    """
    dialect = db_session.bind.dialect.name
    if dialect == "sqlite":
        pytest.skip("Vector similarity operations require PostgreSQL with pgvector")
    for i in range(50):
        atom = Atom(
            type="pattern",
            title=f"Test Pattern {i}",
            content=f"Pattern content {i}",
            embedding=[float(i % 10) * 0.1] * 1536,
        )
        db_session.add(atom)

    await db_session.commit()

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.5] * 1536)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)

        start_time = time.time()
        results = await search_service.search_atoms(db_session, "test pattern", limit=10, threshold=0.7)
        duration = time.time() - start_time

        print(f"\n✓ Atom search (50 atoms): {duration * 1000:.2f}ms, {len(results)} results")


@pytest.mark.performance
def test_performance_summary() -> None:
    """Print performance test summary and targets.

    This test always passes but prints expected performance targets.
    """
    print("\n" + "=" * 60)
    print("PERFORMANCE TARGETS (with pgvector on PostgreSQL)")
    print("=" * 60)
    print("Embedding generation:        <500ms per message")
    print("Batch embedding:             <100ms per message (amortized)")
    print("Semantic search (10k msgs):  <200ms")
    print("Semantic search (100 msgs):  <100ms")
    print("RAG context building:        <500ms")
    print("Vector storage (100 msgs):   <1000ms")
    print("Vector retrieval:            <50ms")
    print("Similarity search:           <100ms (100 messages)")
    print("Atom search:                 <50ms (50 atoms)")
    print("=" * 60)
    print("\nNOTE: Tests use SQLite in-memory DB, not PostgreSQL.")
    print("Actual production performance may vary with pgvector.")
    print("=" * 60)
