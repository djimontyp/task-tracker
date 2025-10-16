"""Tests for EmbeddingService class.

Tests cover:
1. OpenAI embedding generation
2. Ollama embedding generation
3. Single message embedding
4. Single atom embedding
5. Batch message embedding
6. Batch atom embedding
7. Skip already embedded items
8. Error handling
"""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from app.models.atom import Atom
from app.models.llm_provider import LLMProvider, ProviderType
from app.models.message import Message
from app.services.embedding_service import EmbeddingService
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
def ollama_provider() -> LLMProvider:
    """Create mock Ollama provider."""
    return LLMProvider(
        id=uuid4(),
        name="Ollama Test",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )


@pytest.fixture
def mock_embedding() -> list[float]:
    """Create mock embedding vector (1536 dimensions)."""
    return [0.1] * 1536


@pytest.mark.asyncio
async def test_generate_embedding_openai(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test OpenAI embedding generation."""
    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key-12345"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=mock_embedding)]
        mock_client.embeddings.create.return_value = mock_response
        mock_openai.return_value = mock_client

        service = EmbeddingService(openai_provider)
        result = await service.generate_embedding("test text")

        assert len(result) == 1536
        assert result == mock_embedding
        mock_client.embeddings.create.assert_called_once()


@pytest.mark.asyncio
async def test_generate_embedding_ollama(ollama_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test Ollama embedding generation."""
    with patch("app.services.embedding_service.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.json = MagicMock(return_value={"embedding": mock_embedding})
        mock_response.raise_for_status = MagicMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = AsyncMock()
        mock_client_class.return_value = mock_client

        service = EmbeddingService(ollama_provider)
        result = await service.generate_embedding("test text")

        assert len(result) == 1536
        assert result == mock_embedding
        mock_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_generate_embedding_empty_text(openai_provider: LLMProvider) -> None:
    """Test error handling for empty text."""
    service = EmbeddingService(openai_provider)

    with pytest.raises(ValueError, match="Cannot generate embedding for empty text"):
        await service.generate_embedding("")

    with pytest.raises(ValueError, match="Cannot generate embedding for empty text"):
        await service.generate_embedding("   ")


@pytest.mark.asyncio
async def test_embed_message(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test embedding a single message."""
    mock_session = AsyncMock(spec=AsyncSession)
    message = Message(
        id=1,
        external_message_id="test-123",
        content="Test message content",
        sent_at=MagicMock(),
        source_id=1,
        author_id=1,
        embedding=None,
    )

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

        service = EmbeddingService(openai_provider)
        result = await service.embed_message(mock_session, message)

        assert result.embedding is not None
        assert len(result.embedding) == 1536
        mock_session.add.assert_called_once_with(message)
        mock_session.commit.assert_awaited_once()
        mock_session.refresh.assert_awaited_once_with(message)


@pytest.mark.asyncio
async def test_embed_message_already_embedded(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test skipping message that already has embedding."""
    mock_session = AsyncMock(spec=AsyncSession)
    message = Message(
        id=1,
        external_message_id="test-123",
        content="Test message content",
        sent_at=MagicMock(),
        source_id=1,
        author_id=1,
        embedding=mock_embedding,
    )

    service = EmbeddingService(openai_provider)
    result = await service.embed_message(mock_session, message)

    assert result.embedding == mock_embedding
    mock_session.add.assert_not_called()
    mock_session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_embed_atom(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test embedding a single atom."""
    mock_session = AsyncMock(spec=AsyncSession)
    atom = Atom(
        id=1, type="problem", title="Test Problem", content="This is a test problem description", embedding=None
    )

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

        service = EmbeddingService(openai_provider)
        result = await service.embed_atom(mock_session, atom)

        assert result.embedding is not None
        assert len(result.embedding) == 1536
        mock_session.add.assert_called_once_with(atom)
        mock_session.commit.assert_awaited_once()
        mock_session.refresh.assert_awaited_once_with(atom)


@pytest.mark.asyncio
async def test_embed_atom_already_embedded(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test skipping atom that already has embedding."""
    mock_session = AsyncMock(spec=AsyncSession)
    atom = Atom(
        id=1,
        type="problem",
        title="Test Problem",
        content="This is a test problem description",
        embedding=mock_embedding,
    )

    service = EmbeddingService(openai_provider)
    result = await service.embed_atom(mock_session, atom)

    assert result.embedding == mock_embedding
    mock_session.add.assert_not_called()
    mock_session.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_embed_messages_batch(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test batch embedding of multiple messages."""
    mock_session = AsyncMock(spec=AsyncSession)

    messages = [
        Message(
            id=i,
            external_message_id=f"test-{i}",
            content=f"Message {i}",
            sent_at=MagicMock(),
            source_id=1,
            author_id=1,
            embedding=None,
        )
        for i in range(1, 6)
    ]

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = messages
    mock_session.execute.return_value = mock_result

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

        service = EmbeddingService(openai_provider)
        stats = await service.embed_messages_batch(mock_session, [1, 2, 3, 4, 5], batch_size=100)

        assert stats["success"] == 5
        assert stats["failed"] == 0
        assert stats["skipped"] == 0
        assert mock_session.commit.await_count == 1


@pytest.mark.asyncio
async def test_embed_messages_batch_with_skips(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test batch embedding skips already embedded messages."""
    mock_session = AsyncMock(spec=AsyncSession)

    messages = [
        Message(
            id=1,
            external_message_id="test-1",
            content="Message 1",
            sent_at=MagicMock(),
            source_id=1,
            author_id=1,
            embedding=mock_embedding,
        ),
        Message(
            id=2,
            external_message_id="test-2",
            content="Message 2",
            sent_at=MagicMock(),
            source_id=1,
            author_id=1,
            embedding=None,
        ),
        Message(
            id=3,
            external_message_id="test-3",
            content="Message 3",
            sent_at=MagicMock(),
            source_id=1,
            author_id=1,
            embedding=mock_embedding,
        ),
    ]

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = messages
    mock_session.execute.return_value = mock_result

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

        service = EmbeddingService(openai_provider)
        stats = await service.embed_messages_batch(mock_session, [1, 2, 3], batch_size=100)

        assert stats["success"] == 1
        assert stats["failed"] == 0
        assert stats["skipped"] == 2


@pytest.mark.asyncio
async def test_embed_atoms_batch(openai_provider: LLMProvider, mock_embedding: list[float]) -> None:
    """Test batch embedding of multiple atoms."""
    mock_session = AsyncMock(spec=AsyncSession)

    atoms = [
        Atom(id=i, type="problem", title=f"Problem {i}", content=f"Content {i}", embedding=None) for i in range(1, 6)
    ]

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = atoms
    mock_session.execute.return_value = mock_result

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

        service = EmbeddingService(openai_provider)
        stats = await service.embed_atoms_batch(mock_session, [1, 2, 3, 4, 5], batch_size=100)

        assert stats["success"] == 5
        assert stats["failed"] == 0
        assert stats["skipped"] == 0
        assert mock_session.commit.await_count == 1


@pytest.mark.asyncio
async def test_invalid_provider_type() -> None:
    """Test error handling for unsupported provider type."""
    invalid_provider = MagicMock()
    invalid_provider.type = "invalid_type"
    invalid_provider.name = "Invalid Provider"

    with pytest.raises(ValueError, match="doesn't support embeddings"):
        EmbeddingService(invalid_provider)


@pytest.mark.asyncio
async def test_openai_missing_api_key(openai_provider: LLMProvider) -> None:
    """Test error handling when OpenAI API key is missing."""
    openai_provider.api_key_encrypted = None

    service = EmbeddingService(openai_provider)

    with pytest.raises(ValueError, match="requires an API key"):
        await service.generate_embedding("test text")


@pytest.mark.asyncio
async def test_ollama_missing_base_url(ollama_provider: LLMProvider) -> None:
    """Test error handling when Ollama base_url is missing."""
    ollama_provider.base_url = None

    service = EmbeddingService(ollama_provider)

    with pytest.raises(ValueError, match="missing base_url"):
        await service.generate_embedding("test text")


@pytest.mark.asyncio
async def test_embed_message_rollback_on_error(openai_provider: LLMProvider) -> None:
    """Test that database session is rolled back on error."""
    mock_session = AsyncMock(spec=AsyncSession)
    message = Message(
        id=1,
        external_message_id="test-123",
        content="Test message content",
        sent_at=MagicMock(),
        source_id=1,
        author_id=1,
        embedding=None,
    )

    with (
        patch("app.services.embedding_service.CredentialEncryption") as mock_encryptor_class,
        patch("app.services.embedding_service.AsyncOpenAI") as mock_openai,
    ):
        mock_encryptor = MagicMock()
        mock_encryptor.decrypt.return_value = "sk-test-key"
        mock_encryptor_class.return_value = mock_encryptor

        mock_client = AsyncMock()
        mock_client.embeddings.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client

        service = EmbeddingService(openai_provider)

        with pytest.raises(Exception):
            await service.embed_message(mock_session, message)

        mock_session.rollback.assert_awaited_once()
