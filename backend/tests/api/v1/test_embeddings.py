"""API tests for embedding generation endpoints.

Tests cover:
1. POST /embeddings/messages/{id} - Generate single message embedding
2. POST /embeddings/messages/batch - Generate batch message embeddings
3. POST /embeddings/atoms/{id} - Generate single atom embedding
4. POST /embeddings/atoms/batch - Generate batch atom embeddings
5. Response schema validation
6. Error handling (404, 400, 500)
7. Skip already embedded items
8. Provider validation
9. Batch task creation
10. Empty batch handling
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
        name="OpenAI Embed Test",
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
        first_name="Embed",
        last_name="Tester",
        email="embed.test@tasktracker.test",
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
        name="Embed Test Chat",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.mark.asyncio
async def test_generate_message_embedding_success(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test successful embedding generation for a message."""
    message = Message(
        external_message_id="embed-test-1",
        content="Test message for embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    with (
        patch("app.api.v1.embeddings.EmbeddingService") as mock_service_class,
    ):
        mock_service = MagicMock()
        mock_embedded_message = MagicMock()
        mock_embedded_message.embedding = [0.1] * 1536
        mock_service.embed_message = AsyncMock(return_value=mock_embedded_message)
        mock_service_class.return_value = mock_service

        response = await client.post(
            f"/api/v1/embeddings/messages/{message.id}",
            json={"provider_id": str(openai_provider.id)},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == message.id
        assert data["embedding_length"] == 1536
        assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_generate_message_embedding_already_exists(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test skipping message that already has embedding."""
    existing_embedding = [0.5] * 1536
    message = Message(
        external_message_id="embed-test-skip",
        content="Message with existing embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=existing_embedding,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    response = await client.post(
        f"/api/v1/embeddings/messages/{message.id}",
        json={"provider_id": str(openai_provider.id)},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == message.id
    assert data["embedding_length"] == 1536
    assert data["status"] == "skipped"


@pytest.mark.asyncio
async def test_generate_message_embedding_not_found(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test error when message doesn't exist."""
    fake_message_id = 99999

    response = await client.post(
        f"/api/v1/embeddings/messages/{fake_message_id}",
        json={"provider_id": str(openai_provider.id)},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_generate_message_embedding_provider_not_found(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test error when provider doesn't exist."""
    message = Message(
        external_message_id="embed-test-noprovider",
        content="Test message",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    fake_provider_id = str(uuid4())

    response = await client.post(
        f"/api/v1/embeddings/messages/{message.id}",
        json={"provider_id": fake_provider_id},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_generate_message_embedding_service_error(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test error handling when embedding service fails."""
    message = Message(
        external_message_id="embed-test-error",
        content="Test message",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    with patch("app.api.v1.embeddings.EmbeddingService") as mock_service_class:
        mock_service = MagicMock()
        mock_service.embed_message = AsyncMock(side_effect=Exception("API Error"))
        mock_service_class.return_value = mock_service

        response = await client.post(
            f"/api/v1/embeddings/messages/{message.id}",
            json={"provider_id": str(openai_provider.id)},
        )

        assert response.status_code == 500
        assert "failed" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_generate_batch_embeddings_success(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test successful batch embedding generation."""
    messages = []
    for i in range(5):
        msg = Message(
            external_message_id=f"batch-{i}",
            content=f"Batch message {i}",
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

    with patch("app.api.v1.embeddings.embed_messages_batch_task") as mock_task:
        mock_task.kiq = AsyncMock(return_value=MagicMock(task_id="task-123"))

        response = await client.post(
            "/api/v1/embeddings/messages/batch",
            json={
                "message_ids": message_ids,
                "provider_id": str(openai_provider.id),
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "task_id" in data
        assert data["task_id"] == "task-123"
        assert data["count"] == 5
        assert data["provider_id"] == str(openai_provider.id)


@pytest.mark.asyncio
async def test_generate_batch_embeddings_empty_list(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test error when message_ids list is empty."""
    response = await client.post(
        "/api/v1/embeddings/messages/batch",
        json={
            "message_ids": [],
            "provider_id": str(openai_provider.id),
        },
    )

    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_generate_batch_embeddings_provider_not_found(
    client: AsyncClient,
) -> None:
    """Test error when provider doesn't exist for batch operation."""
    fake_provider_id = str(uuid4())

    response = await client.post(
        "/api/v1/embeddings/messages/batch",
        json={
            "message_ids": [1, 2, 3],
            "provider_id": fake_provider_id,
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_atom_embedding_success(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
) -> None:
    """Test successful embedding generation for an atom."""
    atom = Atom(
        type="problem",
        title="Test Atom",
        content="Test atom content for embedding",
        embedding=None,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    with patch("app.api.v1.embeddings.EmbeddingService") as mock_service_class:
        mock_service = MagicMock()
        mock_embedded_atom = MagicMock()
        mock_embedded_atom.embedding = [0.2] * 1536
        mock_service.embed_atom = AsyncMock(return_value=mock_embedded_atom)
        mock_service_class.return_value = mock_service

        response = await client.post(
            f"/api/v1/embeddings/atoms/{atom.id}",
            json={"provider_id": str(openai_provider.id)},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == atom.id
        assert data["embedding_length"] == 1536
        assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_generate_atom_embedding_already_exists(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
) -> None:
    """Test skipping atom that already has embedding."""
    existing_embedding = [0.7] * 1536
    atom = Atom(
        type="solution",
        title="Atom with embedding",
        content="Content with existing embedding",
        embedding=existing_embedding,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    response = await client.post(
        f"/api/v1/embeddings/atoms/{atom.id}",
        json={"provider_id": str(openai_provider.id)},
    )

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == atom.id
    assert data["embedding_length"] == 1536
    assert data["status"] == "skipped"


@pytest.mark.asyncio
async def test_generate_atom_embedding_not_found(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test error when atom doesn't exist."""
    fake_atom_id = 99999

    response = await client.post(
        f"/api/v1/embeddings/atoms/{fake_atom_id}",
        json={"provider_id": str(openai_provider.id)},
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_generate_batch_atom_embeddings_success(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
) -> None:
    """Test successful batch atom embedding generation."""
    atoms = []
    for i in range(3):
        atom = Atom(
            type="pattern",
            title=f"Batch Atom {i}",
            content=f"Batch content {i}",
            embedding=None,
        )
        atoms.append(atom)
        db_session.add(atom)

    await db_session.commit()
    for atom in atoms:
        await db_session.refresh(atom)

    atom_ids = [atom.id for atom in atoms]

    with patch("app.api.v1.embeddings.embed_atoms_batch_task") as mock_task:
        mock_task.kiq = AsyncMock(return_value=MagicMock(task_id="atom-task-456"))

        response = await client.post(
            "/api/v1/embeddings/atoms/batch",
            json={
                "atom_ids": atom_ids,
                "provider_id": str(openai_provider.id),
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "task_id" in data
        assert data["task_id"] == "atom-task-456"
        assert data["count"] == 3
        assert data["provider_id"] == str(openai_provider.id)


@pytest.mark.asyncio
async def test_generate_batch_atom_embeddings_empty_list(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test error when atom_ids list is empty."""
    response = await client.post(
        "/api/v1/embeddings/atoms/batch",
        json={
            "atom_ids": [],
            "provider_id": str(openai_provider.id),
        },
    )

    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_embed_response_schema_validation(
    client: AsyncClient,
    db_session: AsyncSession,
    openai_provider: LLMProvider,
    test_user: User,
    test_source: Source,
) -> None:
    """Test that embedding response matches expected schema."""
    message = Message(
        external_message_id="schema-test",
        content="Schema validation test",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    with patch("app.api.v1.embeddings.EmbeddingService") as mock_service_class:
        mock_service = MagicMock()
        mock_embedded = MagicMock()
        mock_embedded.embedding = [0.1] * 1536
        mock_service.embed_message = AsyncMock(return_value=mock_embedded)
        mock_service_class.return_value = mock_service

        response = await client.post(
            f"/api/v1/embeddings/messages/{message.id}",
            json={"provider_id": str(openai_provider.id)},
        )

        assert response.status_code == 200
        data = response.json()

        assert "id" in data
        assert "embedding_length" in data
        assert "status" in data
        assert isinstance(data["id"], int)
        assert isinstance(data["embedding_length"], int)
        assert data["status"] in ["completed", "skipped"]


@pytest.mark.asyncio
async def test_batch_response_schema_validation(
    client: AsyncClient,
    openai_provider: LLMProvider,
) -> None:
    """Test that batch response matches expected schema."""
    with patch("app.api.v1.embeddings.embed_messages_batch_task") as mock_task:
        mock_task.kiq = AsyncMock(return_value=MagicMock(task_id="test-task-id"))

        response = await client.post(
            "/api/v1/embeddings/messages/batch",
            json={
                "message_ids": [1, 2, 3],
                "provider_id": str(openai_provider.id),
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "task_id" in data
        assert "count" in data
        assert "provider_id" in data
        assert isinstance(data["task_id"], str)
        assert isinstance(data["count"], int)
        assert isinstance(data["provider_id"], str)


@pytest.mark.asyncio
async def test_embedding_invalid_provider_type(
    client: AsyncClient,
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test error when provider doesn't support embeddings."""
    message = Message(
        external_message_id="invalid-provider",
        content="Test message",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    invalid_provider = LLMProvider(
        id=uuid4(),
        name="Invalid Provider",
        type=ProviderType.openai,
        api_key_encrypted=b"test",
        is_active=True,
    )
    db_session.add(invalid_provider)
    await db_session.commit()
    await db_session.refresh(invalid_provider)

    with patch("app.api.v1.embeddings.EmbeddingService") as mock_service_class:
        mock_service_class.side_effect = ValueError("Provider doesn't support embeddings")

        response = await client.post(
            f"/api/v1/embeddings/messages/{message.id}",
            json={"provider_id": str(invalid_provider.id)},
        )

        assert response.status_code == 400
