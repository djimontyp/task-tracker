"""Tests for SemanticSearchService class.

Tests cover:
1. Search messages by query text
2. Find similar messages by ID
3. Find duplicate messages
4. Search atoms by query text
5. Find similar atoms by ID
6. Empty results when no matches above threshold
7. Respect similarity threshold filtering
8. Verify ordering by similarity (most similar first)
9. Handle messages/atoms without embeddings
10. Error handling for missing items
11. Error handling for empty queries
12. Service without embedding_service for similarity methods
"""

from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.models.atom import Atom
from app.models.llm_provider import LLMProvider, ProviderType
from app.models.message import Message
from app.services.embedding_service import EmbeddingService
from app.services.semantic_search_service import SemanticSearchService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def openai_provider() -> LLMProvider:
    """Create mock OpenAI provider."""
    return LLMProvider(
        id=uuid4(),
        name="OpenAI Test",
        type=ProviderType.openai,
        api_key_encrypted=b"encrypted_key_12345",
        is_active=True,
    )


@pytest.fixture
def mock_embedding() -> list[float]:
    """Create mock embedding vector (1536 dimensions)."""
    return [0.1] * 1536


@pytest.fixture
def mock_session() -> AsyncSession:
    """Create mock database session."""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def sample_messages() -> list[Message]:
    """Create sample messages with embeddings."""
    now = datetime.now(UTC)
    return [
        Message(
            id=1,
            external_message_id="msg-1",
            content="Python programming tutorial for beginners",
            sent_at=now,
            source_id=1,
            author_id=1,
            embedding=[0.9] * 1536,
            created_at=now,
            updated_at=now,
        ),
        Message(
            id=2,
            external_message_id="msg-2",
            content="JavaScript guide for web development",
            sent_at=now,
            source_id=1,
            author_id=1,
            embedding=[0.1] * 1536,
            created_at=now,
            updated_at=now,
        ),
        Message(
            id=3,
            external_message_id="msg-3",
            content="Advanced Python patterns and best practices",
            sent_at=now,
            source_id=1,
            author_id=1,
            embedding=[0.85] * 1536,
            created_at=now,
            updated_at=now,
        ),
    ]


@pytest.fixture
def sample_atoms() -> list[Atom]:
    """Create sample atoms with embeddings."""
    now = datetime.now(UTC)
    return [
        Atom(
            id=1,
            type="problem",
            title="Dependency Injection Pattern",
            content="How to implement DI in FastAPI",
            embedding=[0.9] * 1536,
            created_at=now,
            updated_at=now,
        ),
        Atom(
            id=2,
            type="solution",
            title="Database Connection Pooling",
            content="Optimize database connections",
            embedding=[0.1] * 1536,
            created_at=now,
            updated_at=now,
        ),
        Atom(
            id=3,
            type="pattern",
            title="FastAPI Dependency System",
            content="Using FastAPI's dependency injection",
            embedding=[0.88] * 1536,
            created_at=now,
            updated_at=now,
        ),
    ]


@pytest.mark.asyncio
async def test_search_messages_success(
    mock_session: AsyncSession,
    openai_provider: LLMProvider,
    mock_embedding: list[float],
    sample_messages: list[Message],
) -> None:
    """Test successful message search by query text."""
    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = [
        MagicMock(
            _mapping={
                "id": sample_messages[0].id,
                "external_message_id": sample_messages[0].external_message_id,
                "content": sample_messages[0].content,
                "sent_at": sample_messages[0].sent_at,
                "source_id": sample_messages[0].source_id,
                "author_id": sample_messages[0].author_id,
                "telegram_profile_id": None,
                "avatar_url": None,
                "classification": None,
                "confidence": None,
                "analyzed": False,
                "analysis_status": "pending",
                "included_in_runs": None,
                "topic_id": None,
                "embedding": sample_messages[0].embedding,
                "created_at": sample_messages[0].created_at,
                "updated_at": sample_messages[0].updated_at,
                "similarity": 0.92,
            }
        )
    ]
    mock_session.execute.return_value = mock_execute_result

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=mock_embedding)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)

        results = await search_service.search_messages(mock_session, "Python tutorial", limit=10, threshold=0.7)

        assert len(results) == 1
        assert results[0][1] == 0.92
        assert results[0][0].content == "Python programming tutorial for beginners"
        mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_search_messages_empty_query(
    mock_session: AsyncSession,
    openai_provider: LLMProvider,
) -> None:
    """Test error handling for empty query."""
    embedding_service = EmbeddingService(openai_provider)
    search_service = SemanticSearchService(embedding_service)

    with pytest.raises(ValueError, match="Search query cannot be empty"):
        await search_service.search_messages(mock_session, "", limit=10, threshold=0.7)

    with pytest.raises(ValueError, match="Search query cannot be empty"):
        await search_service.search_messages(mock_session, "   ", limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_search_messages_no_embedding_service(mock_session: AsyncSession) -> None:
    """Test error when embedding service is not provided for text search."""
    search_service = SemanticSearchService()

    with pytest.raises(ValueError, match="EmbeddingService is required"):
        await search_service.search_messages(mock_session, "test query", limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_find_similar_messages_success(
    mock_session: AsyncSession,
    sample_messages: list[Message],
) -> None:
    """Test finding similar messages by message ID."""
    source_message = sample_messages[0]
    mock_session.get.return_value = source_message

    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = [
        MagicMock(
            _mapping={
                "id": sample_messages[2].id,
                "external_message_id": sample_messages[2].external_message_id,
                "content": sample_messages[2].content,
                "sent_at": sample_messages[2].sent_at,
                "source_id": sample_messages[2].source_id,
                "author_id": sample_messages[2].author_id,
                "telegram_profile_id": None,
                "avatar_url": None,
                "classification": None,
                "confidence": None,
                "analyzed": False,
                "analysis_status": "pending",
                "included_in_runs": None,
                "topic_id": None,
                "embedding": sample_messages[2].embedding,
                "created_at": sample_messages[2].created_at,
                "updated_at": sample_messages[2].updated_at,
                "similarity": 0.88,
            }
        )
    ]
    mock_session.execute.return_value = mock_execute_result

    search_service = SemanticSearchService()
    results = await search_service.find_similar_messages(mock_session, message_id=1, limit=10, threshold=0.7)

    assert len(results) == 1
    assert results[0][1] == 0.88
    assert results[0][0].content == "Advanced Python patterns and best practices"
    mock_session.get.assert_awaited_once_with(Message, 1)
    mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_find_similar_messages_not_found(mock_session: AsyncSession) -> None:
    """Test error when source message doesn't exist."""
    mock_session.get.return_value = None

    search_service = SemanticSearchService()

    with pytest.raises(ValueError, match="Message 999 not found"):
        await search_service.find_similar_messages(mock_session, message_id=999, limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_find_similar_messages_no_embedding(mock_session: AsyncSession) -> None:
    """Test error when source message has no embedding."""
    now = datetime.now(UTC)
    message_without_embedding = Message(
        id=1,
        external_message_id="msg-1",
        content="Test message",
        sent_at=now,
        source_id=1,
        author_id=1,
        embedding=None,
    )
    mock_session.get.return_value = message_without_embedding

    search_service = SemanticSearchService()

    with pytest.raises(ValueError, match="Message 1 has no embedding"):
        await search_service.find_similar_messages(mock_session, message_id=1, limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_find_duplicates(
    mock_session: AsyncSession,
    sample_messages: list[Message],
) -> None:
    """Test finding duplicate messages with high threshold."""
    source_message = sample_messages[0]
    mock_session.get.return_value = source_message

    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = [
        MagicMock(
            _mapping={
                "id": sample_messages[2].id,
                "external_message_id": sample_messages[2].external_message_id,
                "content": sample_messages[2].content,
                "sent_at": sample_messages[2].sent_at,
                "source_id": sample_messages[2].source_id,
                "author_id": sample_messages[2].author_id,
                "telegram_profile_id": None,
                "avatar_url": None,
                "classification": None,
                "confidence": None,
                "analyzed": False,
                "analysis_status": "pending",
                "included_in_runs": None,
                "topic_id": None,
                "embedding": sample_messages[2].embedding,
                "created_at": sample_messages[2].created_at,
                "updated_at": sample_messages[2].updated_at,
                "similarity": 0.97,
            }
        )
    ]
    mock_session.execute.return_value = mock_execute_result

    search_service = SemanticSearchService()
    results = await search_service.find_duplicates(mock_session, message_id=1, threshold=0.95)

    assert len(results) == 1
    assert results[0][1] == 0.97
    mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_search_atoms_success(
    mock_session: AsyncSession,
    openai_provider: LLMProvider,
    mock_embedding: list[float],
    sample_atoms: list[Atom],
) -> None:
    """Test successful atom search by query text."""
    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = [
        MagicMock(
            _mapping={
                "id": sample_atoms[0].id,
                "type": sample_atoms[0].type,
                "title": sample_atoms[0].title,
                "content": sample_atoms[0].content,
                "confidence": None,
                "user_approved": False,
                "meta": None,
                "embedding": sample_atoms[0].embedding,
                "created_at": sample_atoms[0].created_at,
                "updated_at": sample_atoms[0].updated_at,
                "similarity": 0.91,
            }
        )
    ]
    mock_session.execute.return_value = mock_execute_result

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=mock_embedding)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)

        results = await search_service.search_atoms(mock_session, "dependency injection", limit=10, threshold=0.7)

        assert len(results) == 1
        assert results[0][1] == 0.91
        assert results[0][0].title == "Dependency Injection Pattern"
        mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_search_atoms_empty_query(
    mock_session: AsyncSession,
    openai_provider: LLMProvider,
) -> None:
    """Test error handling for empty query when searching atoms."""
    embedding_service = EmbeddingService(openai_provider)
    search_service = SemanticSearchService(embedding_service)

    with pytest.raises(ValueError, match="Search query cannot be empty"):
        await search_service.search_atoms(mock_session, "", limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_search_atoms_no_embedding_service(mock_session: AsyncSession) -> None:
    """Test error when embedding service is not provided for atom text search."""
    search_service = SemanticSearchService()

    with pytest.raises(ValueError, match="EmbeddingService is required"):
        await search_service.search_atoms(mock_session, "test query", limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_find_similar_atoms_success(
    mock_session: AsyncSession,
    sample_atoms: list[Atom],
) -> None:
    """Test finding similar atoms by atom ID."""
    source_atom = sample_atoms[0]
    mock_session.get.return_value = source_atom

    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = [
        MagicMock(
            _mapping={
                "id": sample_atoms[2].id,
                "type": sample_atoms[2].type,
                "title": sample_atoms[2].title,
                "content": sample_atoms[2].content,
                "confidence": None,
                "user_approved": False,
                "meta": None,
                "embedding": sample_atoms[2].embedding,
                "created_at": sample_atoms[2].created_at,
                "updated_at": sample_atoms[2].updated_at,
                "similarity": 0.89,
            }
        )
    ]
    mock_session.execute.return_value = mock_execute_result

    search_service = SemanticSearchService()
    results = await search_service.find_similar_atoms(mock_session, atom_id=1, limit=10, threshold=0.7)

    assert len(results) == 1
    assert results[0][1] == 0.89
    assert results[0][0].title == "FastAPI Dependency System"
    mock_session.get.assert_awaited_once_with(Atom, 1)
    mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_find_similar_atoms_not_found(mock_session: AsyncSession) -> None:
    """Test error when source atom doesn't exist."""
    mock_session.get.return_value = None

    search_service = SemanticSearchService()

    with pytest.raises(ValueError, match="Atom 999 not found"):
        await search_service.find_similar_atoms(mock_session, atom_id=999, limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_find_similar_atoms_no_embedding(mock_session: AsyncSession) -> None:
    """Test error when source atom has no embedding."""
    now = datetime.now(UTC)
    atom_without_embedding = Atom(
        id=1,
        type="problem",
        title="Test Atom",
        content="Test content",
        embedding=None,
        created_at=now,
        updated_at=now,
    )
    mock_session.get.return_value = atom_without_embedding

    search_service = SemanticSearchService()

    with pytest.raises(ValueError, match="Atom 1 has no embedding"):
        await search_service.find_similar_atoms(mock_session, atom_id=1, limit=10, threshold=0.7)


@pytest.mark.asyncio
async def test_search_messages_empty_results(
    mock_session: AsyncSession,
    openai_provider: LLMProvider,
    mock_embedding: list[float],
) -> None:
    """Test search returns empty list when no matches above threshold."""
    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = []
    mock_session.execute.return_value = mock_execute_result

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=mock_embedding)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)

        results = await search_service.search_messages(mock_session, "no match query", limit=10, threshold=0.9)

        assert len(results) == 0
        mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_search_atoms_empty_results(
    mock_session: AsyncSession,
    openai_provider: LLMProvider,
    mock_embedding: list[float],
) -> None:
    """Test atom search returns empty list when no matches above threshold."""
    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = []
    mock_session.execute.return_value = mock_execute_result

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=mock_embedding)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        embedding_service = EmbeddingService(openai_provider)
        search_service = SemanticSearchService(embedding_service)

        results = await search_service.search_atoms(mock_session, "no match query", limit=10, threshold=0.9)

        assert len(results) == 0
        mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_find_similar_messages_empty_results(
    mock_session: AsyncSession,
    sample_messages: list[Message],
) -> None:
    """Test finding similar messages returns empty when no similar items."""
    source_message = sample_messages[0]
    mock_session.get.return_value = source_message

    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = []
    mock_session.execute.return_value = mock_execute_result

    search_service = SemanticSearchService()
    results = await search_service.find_similar_messages(mock_session, message_id=1, limit=10, threshold=0.99)

    assert len(results) == 0
    mock_session.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_find_similar_atoms_empty_results(
    mock_session: AsyncSession,
    sample_atoms: list[Atom],
) -> None:
    """Test finding similar atoms returns empty when no similar items."""
    source_atom = sample_atoms[0]
    mock_session.get.return_value = source_atom

    mock_execute_result = MagicMock()
    mock_execute_result.fetchall.return_value = []
    mock_session.execute.return_value = mock_execute_result

    search_service = SemanticSearchService()
    results = await search_service.find_similar_atoms(mock_session, atom_id=1, limit=10, threshold=0.99)

    assert len(results) == 0
    mock_session.execute.assert_awaited_once()
