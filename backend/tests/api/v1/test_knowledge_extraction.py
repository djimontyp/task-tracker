"""Comprehensive tests for Knowledge Extraction API endpoints.

This test module provides complete coverage for /api/v1/knowledge/extract endpoint:
- POST /api/v1/knowledge/extract - Trigger knowledge extraction from messages
- Request validation (message_ids, provider_id)
- Provider existence and activation checks
- Background task queueing
- Error handling
"""

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from app.models import LLMProvider, Message, ProviderType, Source, SourceType, User
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def sample_source(db_session: AsyncSession) -> Source:
    """Create a test source."""
    source = Source(
        name="Test Telegram",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def sample_provider(db_session: AsyncSession) -> LLMProvider:
    """Create a test LLM provider."""
    provider = LLMProvider(
        id=uuid4(),
        name="Test Ollama",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def inactive_provider(db_session: AsyncSession) -> LLMProvider:
    """Create an inactive LLM provider."""
    provider = LLMProvider(
        id=uuid4(),
        name="Inactive Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=False,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def sample_messages(db_session: AsyncSession, sample_user: User, sample_source: Source) -> list[Message]:
    """Create test messages."""
    from datetime import UTC, datetime

    messages = []
    for i in range(10):
        message = Message(
            external_message_id=f"msg_{i}",
            content=f"Test message content {i}",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
            analyzed=False,
        )
        db_session.add(message)
        messages.append(message)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)

    return messages


@pytest.mark.asyncio
async def test_trigger_extraction_success(
    client: AsyncClient, sample_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test successfully triggering knowledge extraction."""
    message_ids = [msg.id for msg in sample_messages[:5]]

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": message_ids,
            "provider_id": str(sample_provider.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert "message" in data
        assert data["message_count"] == 5
        assert data["provider_id"] == str(sample_provider.id)

        mock_task.kiq.assert_called_once()
        call_kwargs = mock_task.kiq.call_args[1]
        assert call_kwargs["message_ids"] == message_ids
        assert call_kwargs["provider_id"] == str(sample_provider.id)


@pytest.mark.asyncio
async def test_trigger_extraction_single_message(
    client: AsyncClient, sample_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test extraction with a single message."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": [sample_messages[0].id],
            "provider_id": str(sample_provider.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 1


@pytest.mark.asyncio
async def test_trigger_extraction_max_messages(
    client: AsyncClient, sample_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test extraction with maximum allowed messages (100)."""
    message_ids = [msg.id for msg in sample_messages]
    message_ids.extend([9999 + i for i in range(90)])

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": message_ids,
            "provider_id": str(sample_provider.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 100


@pytest.mark.asyncio
async def test_trigger_extraction_provider_not_found(client: AsyncClient, sample_messages: list[Message]) -> None:
    """Test 404 error when provider doesn't exist."""
    non_existent_id = str(uuid4())

    payload = {
        "message_ids": [sample_messages[0].id],
        "provider_id": non_existent_id,
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert non_existent_id in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_inactive_provider(
    client: AsyncClient, inactive_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test 400 error when provider is not active."""
    payload = {
        "message_ids": [sample_messages[0].id],
        "provider_id": str(inactive_provider.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "not active" in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_empty_message_ids(client: AsyncClient, sample_provider: LLMProvider) -> None:
    """Test validation error for empty message_ids list."""
    payload = {
        "message_ids": [],
        "provider_id": str(sample_provider.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_too_many_messages(client: AsyncClient, sample_provider: LLMProvider) -> None:
    """Test validation error for exceeding max message limit (100)."""
    payload = {
        "message_ids": list(range(1, 102)),
        "provider_id": str(sample_provider.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_missing_message_ids(client: AsyncClient, sample_provider: LLMProvider) -> None:
    """Test validation error for missing message_ids field."""
    payload = {
        "provider_id": str(sample_provider.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_missing_provider_id(client: AsyncClient, sample_messages: list[Message]) -> None:
    """Test validation error for missing provider_id field."""
    payload = {
        "message_ids": [sample_messages[0].id],
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_invalid_provider_id_format(
    client: AsyncClient, sample_messages: list[Message]
) -> None:
    """Test validation error for invalid UUID format."""
    payload = {
        "message_ids": [sample_messages[0].id],
        "provider_id": "not-a-valid-uuid",
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_invalid_message_ids_type(client: AsyncClient, sample_provider: LLMProvider) -> None:
    """Test validation error for invalid message_ids type."""
    payload = {
        "message_ids": "not-a-list",
        "provider_id": str(sample_provider.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_negative_message_ids(client: AsyncClient, sample_provider: LLMProvider) -> None:
    """Test validation handles negative message IDs."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": [-1, -2, -3],
            "provider_id": str(sample_provider.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_duplicate_message_ids(
    client: AsyncClient, sample_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test extraction handles duplicate message IDs."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        message_id = sample_messages[0].id
        payload = {
            "message_ids": [message_id, message_id, message_id],
            "provider_id": str(sample_provider.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_task_queueing_failure(
    client: AsyncClient, sample_provider: LLMProvider, sample_messages: list[Message]
) -> None:
    """Test handling of task queueing failure."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock(side_effect=Exception("Task queue unavailable"))

        payload = {
            "message_ids": [sample_messages[0].id],
            "provider_id": str(sample_provider.id),
        }

        with pytest.raises(Exception, match="Task queue unavailable"):
            await client.post("/api/v1/knowledge/extract", json=payload)
