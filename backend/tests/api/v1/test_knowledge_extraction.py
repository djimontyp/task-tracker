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
async def agent_config(db_session: AsyncSession, sample_provider: LLMProvider) -> "AgentConfig":
    """Create a test agent config linked to sample_provider."""
    from uuid import uuid4

    from app.models import AgentConfig

    config = AgentConfig(
        id=uuid4(),
        name="test_agent",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge from messages",
        is_active=True,
    )
    db_session.add(config)
    await db_session.commit()
    await db_session.refresh(config)
    return config


@pytest.fixture
async def inactive_agent_config(db_session: AsyncSession, inactive_provider: LLMProvider) -> "AgentConfig":
    """Create an inactive agent config linked to inactive_provider."""
    from uuid import uuid4

    from app.models import AgentConfig

    config = AgentConfig(
        id=uuid4(),
        name="inactive_agent",
        provider_id=inactive_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge from messages",
        is_active=False,
    )
    db_session.add(config)
    await db_session.commit()
    await db_session.refresh(config)
    return config


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
    client: AsyncClient, agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test successfully triggering knowledge extraction."""

    message_ids = [msg.id for msg in sample_messages[:5]]

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": message_ids,
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert "message" in data
        assert data["message_count"] == 5
        assert data["agent_config_id"] == str(agent_config.id)

        mock_task.kiq.assert_called_once()
        call_kwargs = mock_task.kiq.call_args[1]
        assert call_kwargs["message_ids"] == message_ids
        assert call_kwargs["agent_config_id"] == str(agent_config.id)


@pytest.mark.asyncio
async def test_trigger_extraction_single_message(
    client: AsyncClient, agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test extraction with a single message."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": [sample_messages[0].id],
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 1


@pytest.mark.asyncio
async def test_trigger_extraction_max_messages(
    client: AsyncClient, agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test extraction with maximum allowed messages (100)."""
    message_ids = [msg.id for msg in sample_messages]
    message_ids.extend([9999 + i for i in range(90)])

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": message_ids,
            "agent_config_id": str(agent_config.id),
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
        "agent_config_id": non_existent_id,
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert non_existent_id in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_inactive_provider(
    client: AsyncClient, inactive_agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test 400 error when provider is not active."""
    payload = {
        "message_ids": [sample_messages[0].id],
        "agent_config_id": str(inactive_agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "not active" in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_empty_message_ids(client: AsyncClient, agent_config: "AgentConfig") -> None:
    """Test validation error for empty message_ids list."""
    payload = {
        "message_ids": [],
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_too_many_messages(client: AsyncClient, agent_config: "AgentConfig") -> None:
    """Test validation error for exceeding max message limit (100)."""
    payload = {
        "message_ids": list(range(1, 102)),
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_missing_message_ids(client: AsyncClient, agent_config: "AgentConfig") -> None:
    """Test validation error for missing message_ids field."""
    payload = {
        "agent_config_id": str(agent_config.id),
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
        "agent_config_id": "not-a-valid-uuid",
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_invalid_message_ids_type(client: AsyncClient, agent_config: "AgentConfig") -> None:
    """Test validation error for invalid message_ids type."""
    payload = {
        "message_ids": "not-a-list",
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_negative_message_ids(client: AsyncClient, agent_config: "AgentConfig") -> None:
    """Test validation handles negative message IDs."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "message_ids": [-1, -2, -3],
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_duplicate_message_ids(
    client: AsyncClient, agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test extraction handles duplicate message IDs."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        message_id = sample_messages[0].id
        payload = {
            "message_ids": [message_id, message_id, message_id],
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_task_queueing_failure(
    client: AsyncClient, agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test handling of task queueing failure."""
    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock(side_effect=Exception("Task queue unavailable"))

        payload = {
            "message_ids": [sample_messages[0].id],
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        # API should return 500 error when task queueing fails
        assert response.status_code == 500


# Period-based extraction tests


@pytest.mark.asyncio
async def test_trigger_extraction_with_period_last_24h(
    client: AsyncClient,
    agent_config: "AgentConfig",
    sample_provider: LLMProvider,
    sample_user: User,
    sample_source: Source,
    db_session: AsyncSession,
) -> None:
    """Test extraction with last_24h period."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_success",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    recent_time = now - timedelta(hours=12)

    messages = [
        Message(
            external_message_id=f"msg_24h_{i}",
            content=f"Recent message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]
    for msg in messages:
        db_session.add(msg)
    await db_session.commit()

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "period": {"period_type": "last_24h"},
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_with_period_last_7d(
    client: AsyncClient,
    agent_config: "AgentConfig",
    sample_provider: LLMProvider,
    sample_user: User,
    sample_source: Source,
    db_session: AsyncSession,
) -> None:
    """Test extraction with last_7d period."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_with_period_last_",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    recent_time = now - timedelta(days=3)

    messages = [
        Message(
            external_message_id=f"msg_7d_{i}",
            content=f"Recent message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]
    for msg in messages:
        db_session.add(msg)
    await db_session.commit()

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "period": {"period_type": "last_7d"},
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_with_period_custom(
    client: AsyncClient,
    agent_config: "AgentConfig",
    sample_provider: LLMProvider,
    sample_user: User,
    sample_source: Source,
    db_session: AsyncSession,
) -> None:
    """Test extraction with custom period."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_with_period_custom",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    start_date = now - timedelta(days=5)
    end_date = now - timedelta(days=2)
    msg_time = now - timedelta(days=3)

    messages = [
        Message(
            external_message_id=f"msg_custom_{i}",
            content=f"Message {i}",
            sent_at=msg_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
        )
        for i in range(3)
    ]
    for msg in messages:
        db_session.add(msg)
    await db_session.commit()

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "period": {
                "period_type": "custom",
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_with_period_and_topic_filter(
    client: AsyncClient,
    agent_config: "AgentConfig",
    sample_user: User,
    sample_source: Source,
    db_session: AsyncSession,
) -> None:
    """Test extraction with period and topic filter."""
    from datetime import UTC, datetime, timedelta

    from app.models import Topic

    topic = Topic(name="Test Topic", description="Test", icon="Icon", color="#000")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    now = datetime.now(UTC)
    recent_time = now - timedelta(hours=12)

    messages_with_topic = [
        Message(
            external_message_id=f"msg_topic_{i}",
            content=f"Message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
            topic_id=topic.id,
        )
        for i in range(3)
    ]

    messages_without_topic = [
        Message(
            external_message_id=f"msg_no_topic_{i}",
            content=f"Message {i}",
            sent_at=recent_time,
            source_id=sample_source.id,
            author_id=sample_user.id,
            topic_id=None,
        )
        for i in range(2)
    ]

    for msg in messages_with_topic + messages_without_topic:
        db_session.add(msg)
    await db_session.commit()

    with patch("app.api.v1.knowledge.extract_knowledge_from_messages_task") as mock_task:
        mock_task.kiq = AsyncMock()

        payload = {
            "period": {"period_type": "last_24h", "topic_id": topic.id},
            "agent_config_id": str(agent_config.id),
        }

        response = await client.post("/api/v1/knowledge/extract", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["message_count"] == 3


@pytest.mark.asyncio
async def test_trigger_extraction_with_both_message_ids_and_period_fails(
    client: AsyncClient, agent_config: "AgentConfig", sample_messages: list[Message]
) -> None:
    """Test validation fails when both message_ids and period provided."""
    from datetime import UTC, datetime

    now = datetime.now(UTC)

    payload = {
        "message_ids": [sample_messages[0].id],
        "period": {"period_type": "last_24h"},
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_with_neither_message_ids_nor_period_fails(
    client: AsyncClient, agent_config: "AgentConfig"
) -> None:
    """Test validation fails when neither message_ids nor period provided."""
    payload = {
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_period_no_messages_found(
    client: AsyncClient,
    agent_config: "AgentConfig",
    sample_provider: LLMProvider,
    sample_user: User,
    sample_source: Source,
    db_session: AsyncSession,
) -> None:
    """Test 400 response when period has no messages."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_with_period_and_topic_filter",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    old_time = now - timedelta(days=100)

    msg = Message(
        external_message_id="msg_very_old",
        content="Very old message",
        sent_at=old_time,
        source_id=sample_source.id,
        author_id=sample_user.id,
    )
    db_session.add(msg)
    await db_session.commit()

    payload = {
        "period": {"period_type": "last_24h"},
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "No messages found" in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_invalid_period_type(client: AsyncClient, agent_config: "AgentConfig") -> None:
    """Test validation error for invalid period_type."""
    payload = {
        "period": {"period_type": "invalid_period"},
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_trigger_extraction_custom_period_missing_start_date(
    client: AsyncClient, agent_config: "AgentConfig", sample_provider: LLMProvider, db_session: AsyncSession
) -> None:
    """Test validation error for custom period without start_date."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_invalid_period_type",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    end_date = now - timedelta(days=2)

    payload = {
        "period": {
            "period_type": "custom",
            "end_date": end_date.isoformat(),
        },
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "Custom period requires both" in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_custom_period_missing_end_date(
    client: AsyncClient, agent_config: "AgentConfig", sample_provider: LLMProvider, db_session: AsyncSession
) -> None:
    """Test validation error for custom period without end_date."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_custom_period_missing_end_date",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    start_date = now - timedelta(days=5)

    payload = {
        "period": {
            "period_type": "custom",
            "start_date": start_date.isoformat(),
        },
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "Custom period requires both" in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_custom_period_start_after_end(
    client: AsyncClient, agent_config: "AgentConfig", sample_provider: LLMProvider, db_session: AsyncSession
) -> None:
    """Test validation error for custom period with start_date after end_date."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_custom_period_start_after_end",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    start_date = now - timedelta(days=2)
    end_date = now - timedelta(days=5)

    payload = {
        "period": {
            "period_type": "custom",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "start_date must be before end_date" in data["detail"]


@pytest.mark.asyncio
async def test_trigger_extraction_custom_period_future_dates(
    client: AsyncClient, agent_config: "AgentConfig", sample_provider: LLMProvider, db_session: AsyncSession
) -> None:
    """Test validation error for custom period with future dates."""
    from datetime import UTC, datetime, timedelta
    from uuid import uuid4

    from app.models import AgentConfig

    agent_config = AgentConfig(
        id=uuid4(),
        name="test_trigger_extraction_custom_period_future_dates",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent_config)
    await db_session.commit()
    await db_session.refresh(agent_config)

    now = datetime.now(UTC)
    future = now + timedelta(days=5)
    start_date = future
    end_date = future + timedelta(days=1)

    payload = {
        "period": {
            "period_type": "custom",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
        "agent_config_id": str(agent_config.id),
    }

    response = await client.post("/api/v1/knowledge/extract", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "cannot be in the future" in data["detail"]
