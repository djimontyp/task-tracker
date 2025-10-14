"""API tests for Classification Experiment endpoints.

Tests focus on:
- Creating experiments with validation
- Listing experiments with pagination and filters
- Retrieving detailed experiment results
- Deleting experiments with safety checks
- Metrics calculation accuracy
"""

from datetime import datetime
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from app.models import (
    ClassificationExperiment,
    ExperimentStatus,
    LLMProvider,
    Message,
    ProviderType,
    Source,
    Topic,
    User,
)


@pytest.mark.asyncio
async def test_create_experiment_success(client, db_session):
    """Test POST /api/v1/experiments/topic-classification - successful creation."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    topic = Topic(name="Work", description="Work related messages")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    source = Source(name="telegram", type="telegram")
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)

    for i in range(10):
        message = Message(
            external_message_id=f"msg_{i}",
            content=f"Test message {i} about work",
            sent_at=datetime.utcnow(),
            source_id=source.id,
            author_id=user.id,
            topic_id=topic.id,
        )
        db_session.add(message)
    await db_session.commit()

    with patch("app.api.v1.experiments.execute_classification_experiment") as mock_task:
        mock_task.kiq = AsyncMock()

        experiment_data = {
            "provider_id": str(provider.id),
            "model_name": "llama3.2:3b",
            "message_count": 5,
        }

        response = await client.post("/api/v1/experiments/topic-classification", json=experiment_data)

        assert response.status_code == 201
        data = response.json()
        assert data["model_name"] == "llama3.2:3b"
        assert data["message_count"] == 5
        assert data["status"] == ExperimentStatus.pending.value
        assert data["accuracy"] is None
        assert "id" in data
        assert "provider_id" in data

        mock_task.kiq.assert_called_once()


@pytest.mark.asyncio
async def test_create_experiment_invalid_provider_404(client, db_session):
    """Test create experiment with non-existent provider returns 404."""
    random_id = uuid4()

    experiment_data = {
        "provider_id": str(random_id),
        "model_name": "llama3.2:3b",
        "message_count": 10,
    }

    response = await client.post("/api/v1/experiments/topic-classification", json=experiment_data)

    assert response.status_code == 400
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_experiment_inactive_provider_400(client, db_session):
    """Test create experiment with inactive provider returns 400."""
    provider = LLMProvider(
        name="Inactive Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=False,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    experiment_data = {
        "provider_id": str(provider.id),
        "model_name": "llama3.2:3b",
        "message_count": 10,
    }

    response = await client.post("/api/v1/experiments/topic-classification", json=experiment_data)

    assert response.status_code == 400
    assert "not active" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_experiment_insufficient_messages_400(client, db_session):
    """Test create experiment with insufficient messages returns 400."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    topic = Topic(name="Work", description="Work related messages")
    db_session.add(topic)
    await db_session.commit()

    experiment_data = {
        "provider_id": str(provider.id),
        "model_name": "llama3.2:3b",
        "message_count": 100,
    }

    response = await client.post("/api/v1/experiments/topic-classification", json=experiment_data)

    assert response.status_code == 400
    assert "not enough messages" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_list_experiments_pagination(client, db_session):
    """Test GET /api/v1/experiments/topic-classification - pagination works."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    for i in range(15):
        experiment = ClassificationExperiment(
            provider_id=provider.id,
            model_name=f"model_{i}",
            message_count=10,
            topics_snapshot={},
            status=ExperimentStatus.completed,
        )
        db_session.add(experiment)
    await db_session.commit()

    response = await client.get("/api/v1/experiments/topic-classification?skip=0&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 10
    assert data["total"] == 15
    assert data["page"] == 1
    assert data["page_size"] == 10

    response = await client.get("/api/v1/experiments/topic-classification?skip=10&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] == 15
    assert data["page"] == 2


@pytest.mark.asyncio
async def test_list_experiments_status_filter(client, db_session):
    """Test list experiments with status filter."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    exp1 = ClassificationExperiment(
        provider_id=provider.id,
        model_name="model1",
        message_count=10,
        topics_snapshot={},
        status=ExperimentStatus.completed,
    )
    exp2 = ClassificationExperiment(
        provider_id=provider.id,
        model_name="model2",
        message_count=10,
        topics_snapshot={},
        status=ExperimentStatus.failed,
    )
    exp3 = ClassificationExperiment(
        provider_id=provider.id,
        model_name="model3",
        message_count=10,
        topics_snapshot={},
        status=ExperimentStatus.completed,
    )
    db_session.add_all([exp1, exp2, exp3])
    await db_session.commit()

    response = await client.get(f"/api/v1/experiments/topic-classification?status={ExperimentStatus.completed.value}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert all(item["status"] == ExperimentStatus.completed.value for item in data["items"])

    response = await client.get(f"/api/v1/experiments/topic-classification?status={ExperimentStatus.failed.value}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == ExperimentStatus.failed.value


@pytest.mark.asyncio
async def test_get_experiment_details(client, db_session):
    """Test GET /api/v1/experiments/topic-classification/{id} - returns detailed results."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    experiment = ClassificationExperiment(
        provider_id=provider.id,
        model_name="llama3.2:3b",
        message_count=3,
        topics_snapshot={"1": {"name": "Work", "description": "Work tasks"}},
        status=ExperimentStatus.completed,
        accuracy=0.85,
        avg_confidence=0.92,
        avg_execution_time_ms=1250.5,
        confusion_matrix={"Work": {"Work": 5, "Personal": 1}},
        classification_results=[
            {
                "message_id": 1,
                "message_content": "Test message 1",
                "actual_topic_id": 1,
                "actual_topic_name": "Work",
                "predicted_topic_id": 1,
                "predicted_topic_name": "Work",
                "confidence": 0.95,
                "execution_time_ms": 1200,
                "reasoning": "Clear work context",
                "alternatives": [],
            }
        ],
    )
    db_session.add(experiment)
    await db_session.commit()
    await db_session.refresh(experiment)

    response = await client.get(f"/api/v1/experiments/topic-classification/{experiment.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == experiment.id
    assert data["accuracy"] == 0.85
    assert data["avg_confidence"] == 0.92
    assert data["confusion_matrix"] == {"Work": {"Work": 5, "Personal": 1}}
    assert len(data["classification_results"]) == 1
    assert data["classification_results"][0]["message_id"] == 1


@pytest.mark.asyncio
async def test_get_experiment_not_found_404(client, db_session):
    """Test get experiment with non-existent ID returns 404."""
    response = await client.get("/api/v1/experiments/topic-classification/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_experiment_success(client, db_session):
    """Test DELETE /api/v1/experiments/topic-classification/{id} - successfully deletes."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    experiment = ClassificationExperiment(
        provider_id=provider.id,
        model_name="llama3.2:3b",
        message_count=10,
        topics_snapshot={},
        status=ExperimentStatus.completed,
    )
    db_session.add(experiment)
    await db_session.commit()
    await db_session.refresh(experiment)

    response = await client.delete(f"/api/v1/experiments/topic-classification/{experiment.id}")
    assert response.status_code == 204

    get_response = await client.get(f"/api/v1/experiments/topic-classification/{experiment.id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_running_experiment_400(client, db_session):
    """Test cannot delete experiment that is currently running."""
    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    experiment = ClassificationExperiment(
        provider_id=provider.id,
        model_name="llama3.2:3b",
        message_count=10,
        topics_snapshot={},
        status=ExperimentStatus.running,
    )
    db_session.add(experiment)
    await db_session.commit()
    await db_session.refresh(experiment)

    response = await client.delete(f"/api/v1/experiments/topic-classification/{experiment.id}")
    assert response.status_code == 400
    assert "running" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_experiment_not_found_404(client, db_session):
    """Test delete experiment with non-existent ID returns 404."""
    response = await client.delete("/api/v1/experiments/topic-classification/99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_calculate_metrics_accuracy(db_session):
    """Test metrics calculation for accuracy."""
    from app.services.topic_classification_service import TopicClassificationService

    service = TopicClassificationService(db_session)

    results = [
        {
            "actual_topic_name": "Work",
            "predicted_topic_name": "Work",
            "confidence": 0.95,
            "execution_time_ms": 1000,
        },
        {
            "actual_topic_name": "Work",
            "predicted_topic_name": "Personal",
            "confidence": 0.75,
            "execution_time_ms": 1200,
        },
        {
            "actual_topic_name": "Personal",
            "predicted_topic_name": "Personal",
            "confidence": 0.88,
            "execution_time_ms": 1100,
        },
        {
            "actual_topic_name": "Personal",
            "predicted_topic_name": "Personal",
            "confidence": 0.92,
            "execution_time_ms": 1050,
        },
    ]

    metrics = await service.calculate_metrics(results)

    assert metrics["accuracy"] == 0.75
    assert metrics["avg_confidence"] == 0.875
    assert metrics["avg_execution_time_ms"] == 1087.5
    assert metrics["confusion_matrix"]["Work"]["Work"] == 1
    assert metrics["confusion_matrix"]["Work"]["Personal"] == 1
    assert metrics["confusion_matrix"]["Personal"]["Personal"] == 2


@pytest.mark.asyncio
async def test_calculate_metrics_empty_results(db_session):
    """Test metrics calculation with empty results."""
    from app.services.topic_classification_service import TopicClassificationService

    service = TopicClassificationService(db_session)

    metrics = await service.calculate_metrics([])

    assert metrics["accuracy"] == 0.0
    assert metrics["avg_confidence"] == 0.0
    assert metrics["avg_execution_time_ms"] == 0.0
    assert metrics["confusion_matrix"] == {}
