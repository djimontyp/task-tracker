"""API tests for semantic search endpoints.

Tests cover:
1. GET /search/messages - Search messages by query text
2. GET /search/messages/{id}/similar - Find similar messages
3. GET /search/messages/{id}/duplicates - Find duplicate messages
4. GET /search/atoms - Search atoms by query text
5. GET /search/atoms/{id}/similar - Find similar atoms
6. Response schema validation
7. Error handling (404, 400, 500)
8. Threshold filtering
9. Limit parameter validation
10. Provider validation
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
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def openai_provider(db_session: AsyncSession) -> LLMProvider:
    """Create OpenAI provider for testing."""
    provider = LLMProvider(
        id=uuid4(),
        name="OpenAI Search Test",
        type=ProviderType.openai,
        api_key_encrypted=b"encrypted_test_key",
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
        first_name="Search",
        last_name="Tester",
        email="search.test@tasktracker.test",
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
        name="Search Test Chat",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def messages_with_embeddings(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> list[Message]:
    """Create messages with embeddings for search testing."""
    messages = []

    message_data = [
        ("Python programming tutorial", [0.9] * 1536),
        ("JavaScript web development", [0.1] * 1536),
        ("Advanced Python patterns", [0.85] * 1536),
    ]

    for content, embedding in message_data:
        msg = Message(
            external_message_id=f"search-{content[:10]}",
            content=content,
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=embedding,
            analyzed=True,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)

    return messages


@pytest.fixture
async def atoms_with_embeddings(db_session: AsyncSession) -> list[Atom]:
    """Create atoms with embeddings for search testing."""
    atoms = []

    atom_data = [
        ("problem", "Authentication Flow", "OAuth2 implementation", [0.9] * 1536),
        ("solution", "Database Optimization", "Connection pooling strategy", [0.1] * 1536),
        ("pattern", "DI Pattern", "Dependency injection in FastAPI", [0.88] * 1536),
    ]

    for atom_type, title, content, embedding in atom_data:
        atom = Atom(
            type=atom_type,
            title=title,
            content=content,
            embedding=embedding,
            confidence=0.9,
            user_approved=True,
        )
        atoms.append(atom)
        db_session.add(atom)

    await db_session.commit()
    for atom in atoms:
        await db_session.refresh(atom)

    return atoms


@pytest.mark.asyncio
async def test_search_messages_semantic_success(
    client: AsyncClient,
    openai_provider: LLMProvider,
    messages_with_embeddings: list[Message],
) -> None:
    """Test successful semantic search for messages."""
    with (
        patch("app.api.v1.semantic_search.EmbeddingService") as mock_embedding_class,
        patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class,
    ):
        mock_embedding_service = MagicMock()
        mock_embedding_service.generate_embedding = AsyncMock(return_value=[0.9] * 1536)
        mock_embedding_class.return_value = mock_embedding_service

        mock_search_service = MagicMock()
        mock_search_service.search_messages = AsyncMock(return_value=[(messages_with_embeddings[0], 0.92)])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            "/api/v1/search/messages",
            params={
                "query": "Python tutorial",
                "provider_id": openai_provider.id,
                "limit": 10,
                "threshold": 0.7,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 1
        assert "message" in data[0]
        assert "similarity_score" in data[0]
        assert data[0]["similarity_score"] == 0.92
        assert data[0]["message"]["content"] == "Python programming tutorial"


@pytest.mark.asyncio
async def test_search_messages_empty_query(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test error handling for empty search query."""
    response = await client.get(
        "/api/v1/search/messages",
        params={
            "query": "",
            "provider_id": openai_provider.id,
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_messages_provider_not_found(client: AsyncClient) -> None:
    """Test error when provider doesn't exist."""
    fake_provider_id = uuid4()

    response = await client.get(
        "/api/v1/search/messages",
        params={
            "query": "test query",
            "provider_id": str(fake_provider_id),
        },
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_search_messages_with_limit(
    client: AsyncClient,
    openai_provider: LLMProvider,
    messages_with_embeddings: list[Message],
) -> None:
    """Test search with custom limit parameter."""
    with (
        patch("app.api.v1.semantic_search.EmbeddingService") as mock_embedding_class,
        patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class,
    ):
        mock_embedding_service = MagicMock()
        mock_embedding_service.generate_embedding = AsyncMock(return_value=[0.9] * 1536)
        mock_embedding_class.return_value = mock_embedding_service

        mock_search_service = MagicMock()
        mock_search_service.search_messages = AsyncMock(
            return_value=[(messages_with_embeddings[0], 0.92), (messages_with_embeddings[2], 0.88)]
        )
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            "/api/v1/search/messages",
            params={
                "query": "Python",
                "provider_id": openai_provider.id,
                "limit": 5,
                "threshold": 0.7,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5


@pytest.mark.asyncio
async def test_search_messages_with_high_threshold(
    client: AsyncClient,
    openai_provider: LLMProvider,
    messages_with_embeddings: list[Message],
) -> None:
    """Test search with high similarity threshold."""
    with (
        patch("app.api.v1.semantic_search.EmbeddingService") as mock_embedding_class,
        patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class,
    ):
        mock_embedding_service = MagicMock()
        mock_embedding_service.generate_embedding = AsyncMock(return_value=[0.9] * 1536)
        mock_embedding_class.return_value = mock_embedding_service

        mock_search_service = MagicMock()
        mock_search_service.search_messages = AsyncMock(return_value=[])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            "/api/v1/search/messages",
            params={
                "query": "test",
                "provider_id": openai_provider.id,
                "threshold": 0.99,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data == []


@pytest.mark.asyncio
async def test_find_similar_messages_success(
    client: AsyncClient,
    messages_with_embeddings: list[Message],
) -> None:
    """Test finding similar messages by message ID."""
    message_id = messages_with_embeddings[0].id

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_similar_messages = AsyncMock(return_value=[(messages_with_embeddings[2], 0.88)])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            f"/api/v1/search/messages/{message_id}/similar",
            params={"limit": 10, "threshold": 0.7},
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["similarity_score"] == 0.88
        assert data[0]["message"]["content"] == "Advanced Python patterns"


@pytest.mark.asyncio
async def test_find_similar_messages_not_found(client: AsyncClient) -> None:
    """Test error when message doesn't exist."""
    fake_message_id = 99999

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_similar_messages = AsyncMock(
            side_effect=ValueError(f"Message {fake_message_id} not found")
        )
        mock_search_class.return_value = mock_search_service

        response = await client.get(f"/api/v1/search/messages/{fake_message_id}/similar")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_find_similar_messages_no_embedding(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test error when message has no embedding."""
    message = Message(
        external_message_id="no-embed-test",
        content="Message without embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_similar_messages = AsyncMock(
            side_effect=ValueError(f"Message {message.id} has no embedding")
        )
        mock_search_class.return_value = mock_search_service

        response = await client.get(f"/api/v1/search/messages/{message.id}/similar")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_find_duplicate_messages_success(
    client: AsyncClient,
    messages_with_embeddings: list[Message],
) -> None:
    """Test finding potential duplicate messages."""
    message_id = messages_with_embeddings[0].id

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_duplicates = AsyncMock(return_value=[(messages_with_embeddings[2], 0.97)])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            f"/api/v1/search/messages/{message_id}/duplicates",
            params={"threshold": 0.95},
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["similarity_score"] == 0.97


@pytest.mark.asyncio
async def test_find_duplicate_messages_custom_threshold(
    client: AsyncClient,
    messages_with_embeddings: list[Message],
) -> None:
    """Test duplicate detection with custom threshold."""
    message_id = messages_with_embeddings[0].id

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_duplicates = AsyncMock(return_value=[])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            f"/api/v1/search/messages/{message_id}/duplicates",
            params={"threshold": 0.99},
        )

        assert response.status_code == 200
        assert response.json() == []


@pytest.mark.asyncio
async def test_search_atoms_semantic_success(
    client: AsyncClient,
    openai_provider: LLMProvider,
    atoms_with_embeddings: list[Atom],
) -> None:
    """Test successful semantic search for atoms."""
    with (
        patch("app.api.v1.semantic_search.EmbeddingService") as mock_embedding_class,
        patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class,
    ):
        mock_embedding_service = MagicMock()
        mock_embedding_service.generate_embedding = AsyncMock(return_value=[0.9] * 1536)
        mock_embedding_class.return_value = mock_embedding_service

        mock_search_service = MagicMock()
        mock_search_service.search_atoms = AsyncMock(return_value=[(atoms_with_embeddings[0], 0.91)])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            "/api/v1/search/atoms",
            params={
                "query": "authentication",
                "provider_id": openai_provider.id,
                "limit": 10,
                "threshold": 0.7,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 1
        assert "atom" in data[0]
        assert "similarity_score" in data[0]
        assert data[0]["similarity_score"] == 0.91
        assert data[0]["atom"]["title"] == "Authentication Flow"


@pytest.mark.asyncio
async def test_search_atoms_provider_not_found(client: AsyncClient) -> None:
    """Test error when provider doesn't exist for atom search."""
    fake_provider_id = uuid4()

    response = await client.get(
        "/api/v1/search/atoms",
        params={
            "query": "test query",
            "provider_id": str(fake_provider_id),
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_find_similar_atoms_success(
    client: AsyncClient,
    atoms_with_embeddings: list[Atom],
) -> None:
    """Test finding similar atoms by atom ID."""
    atom_id = atoms_with_embeddings[0].id

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_similar_atoms = AsyncMock(return_value=[(atoms_with_embeddings[2], 0.89)])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            f"/api/v1/search/atoms/{atom_id}/similar",
            params={"limit": 10, "threshold": 0.7},
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["similarity_score"] == 0.89
        assert data[0]["atom"]["title"] == "DI Pattern"


@pytest.mark.asyncio
async def test_find_similar_atoms_not_found(client: AsyncClient) -> None:
    """Test error when atom doesn't exist."""
    fake_atom_id = 99999

    with patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class:
        mock_search_service = MagicMock()
        mock_search_service.find_similar_atoms = AsyncMock(side_effect=ValueError(f"Atom {fake_atom_id} not found"))
        mock_search_class.return_value = mock_search_service

        response = await client.get(f"/api/v1/search/atoms/{fake_atom_id}/similar")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_search_response_schema_validation(
    client: AsyncClient,
    openai_provider: LLMProvider,
    messages_with_embeddings: list[Message],
) -> None:
    """Test that search response matches expected schema."""
    with (
        patch("app.api.v1.semantic_search.EmbeddingService") as mock_embedding_class,
        patch("app.api.v1.semantic_search.SemanticSearchService") as mock_search_class,
    ):
        mock_embedding_service = MagicMock()
        mock_embedding_service.generate_embedding = AsyncMock(return_value=[0.9] * 1536)
        mock_embedding_class.return_value = mock_embedding_service

        mock_search_service = MagicMock()
        mock_search_service.search_messages = AsyncMock(return_value=[(messages_with_embeddings[0], 0.92)])
        mock_search_class.return_value = mock_search_service

        response = await client.get(
            "/api/v1/search/messages",
            params={
                "query": "test",
                "provider_id": openai_provider.id,
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        for result in data:
            assert "message" in result
            assert "similarity_score" in result
            assert isinstance(result["similarity_score"], float)
            assert 0.0 <= result["similarity_score"] <= 1.0

            message = result["message"]
            assert "id" in message
            assert "content" in message
            assert "sent_at" in message


@pytest.mark.asyncio
async def test_search_limit_validation(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test limit parameter validation."""
    response_invalid_low = await client.get(
        "/api/v1/search/messages",
        params={
            "query": "test",
            "provider_id": openai_provider.id,
            "limit": 0,
        },
    )
    assert response_invalid_low.status_code == 422

    response_invalid_high = await client.get(
        "/api/v1/search/messages",
        params={
            "query": "test",
            "provider_id": openai_provider.id,
            "limit": 101,
        },
    )
    assert response_invalid_high.status_code == 422


@pytest.mark.asyncio
async def test_search_threshold_validation(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test threshold parameter validation."""
    response_invalid_low = await client.get(
        "/api/v1/search/messages",
        params={
            "query": "test",
            "provider_id": openai_provider.id,
            "threshold": -0.1,
        },
    )
    assert response_invalid_low.status_code == 422

    response_invalid_high = await client.get(
        "/api/v1/search/messages",
        params={
            "query": "test",
            "provider_id": openai_provider.id,
            "threshold": 1.1,
        },
    )
    assert response_invalid_high.status_code == 422
