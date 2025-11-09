"""Unit tests for message inspection API endpoints."""

import uuid
from datetime import datetime

import pytest
from app.models import (
    ClassificationFeedback,
    Message,
    MessageHistory,
    Source,
    Topic,
    User,
)
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        telegram_id=12345,
        username="testuser",
        first_name="Test",
        last_name="User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_source(db_session: AsyncSession) -> Source:
    """Create a test source."""
    source = Source(
        name="Test Source",
        source_type="telegram",
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def test_topic(db_session: AsyncSession) -> Topic:
    """Create a test topic."""
    topic = Topic(
        name="Test Topic",
        description="Test description",
        icon="💬",
        color="#FF5733",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)
    return topic


@pytest.fixture
async def test_message(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
    test_topic: Topic,
) -> Message:
    """Create a test message."""
    message = Message(
        external_message_id="msg123",
        content="This is a test message",
        sent_at=datetime.utcnow(),
        source_id=test_source.id,
        author_id=test_user.id,
        topic_id=test_topic.id,
        confidence=0.85,
        classification="signal",
        importance_score=0.75,
        status="pending",
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)
    return message


@pytest.mark.asyncio
async def test_inspect_message_success(
    client: AsyncClient,
    test_message: Message,
) -> None:
    """Test GET /messages/{id}/inspect returns full details."""
    response = await client.get(f"/api/v1/messages/{test_message.id}/inspect")
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert "classification" in data
    assert "atoms" in data
    assert "history" in data

    assert data["message"]["id"] == str(test_message.id)
    assert data["message"]["content"] == "This is a test message"
    assert data["classification"]["confidence"] == 85.0


@pytest.mark.asyncio
async def test_inspect_message_not_found(
    client: AsyncClient,
) -> None:
    """Test 404 when message doesn't exist."""
    fake_id = uuid.uuid4()
    response = await client.get(f"/api/v1/messages/{fake_id}/inspect")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_inspect_message_with_history(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test inspect includes message history."""
    history = MessageHistory(
        message_id=test_message.id,
        action="classified",
        to_topic_id=test_message.topic_id,
    )
    db_session.add(history)
    await db_session.commit()

    response = await client.get(f"/api/v1/messages/{test_message.id}/inspect")
    assert response.status_code == 200

    data = response.json()
    assert len(data["history"]) >= 1
    assert data["history"][0]["action"] == "classified"


@pytest.mark.asyncio
async def test_reassign_message_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test PUT /messages/{id}/reassign updates topic."""
    new_topic = Topic(
        name="New Topic",
        description="New description",
        icon="🔥",
        color="#00FF00",
    )
    db_session.add(new_topic)
    await db_session.commit()
    await db_session.refresh(new_topic)

    response = await client.put(
        f"/api/v1/messages/{test_message.id}/reassign",
        json={"new_topic_id": str(new_topic.id), "reason": "Better fit"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    await db_session.refresh(test_message)
    assert test_message.topic_id == new_topic.id


@pytest.mark.asyncio
async def test_reassign_message_invalid_topic(
    client: AsyncClient,
    test_message: Message,
) -> None:
    """Test 404 when reassigning to non-existent topic."""
    fake_topic_id = str(uuid.uuid4())
    response = await client.put(
        f"/api/v1/messages/{test_message.id}/reassign",
        json={"new_topic_id": fake_topic_id},
    )
    assert response.status_code == 404
    assert "topic not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_reassign_message_invalid_format(
    client: AsyncClient,
    test_message: Message,
) -> None:
    """Test 400 when topic ID format is invalid."""
    response = await client.put(
        f"/api/v1/messages/{test_message.id}/reassign",
        json={"new_topic_id": "not-a-uuid"},
    )
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_reassign_creates_history(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
    test_topic: Topic,
) -> None:
    """Test reassignment creates history event."""
    new_topic = Topic(
        name="Another Topic",
        description="Another description",
        icon="⚡",
        color="#0000FF",
    )
    db_session.add(new_topic)
    await db_session.commit()
    await db_session.refresh(new_topic)

    response = await client.put(
        f"/api/v1/messages/{test_message.id}/reassign",
        json={"new_topic_id": str(new_topic.id), "reason": "Test reason"},
    )
    assert response.status_code == 200

    from sqlmodel import select

    history_query = select(MessageHistory).where(
        MessageHistory.message_id == test_message.id,
        MessageHistory.action == "reassigned",
    )
    result = await db_session.execute(history_query)
    history = result.scalars().first()

    assert history is not None
    assert history.from_topic_id == test_topic.id
    assert history.to_topic_id == new_topic.id
    assert history.reason == "Test reason"


@pytest.mark.asyncio
async def test_approve_message_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test POST /messages/{id}/approve updates status."""
    response = await client.post(f"/api/v1/messages/{test_message.id}/approve")
    assert response.status_code == 200
    assert response.json()["status"] == "approved"

    await db_session.refresh(test_message)
    assert test_message.status == "approved"
    assert test_message.approved_at is not None


@pytest.mark.asyncio
async def test_approve_message_not_found(
    client: AsyncClient,
) -> None:
    """Test 404 when approving non-existent message."""
    fake_id = uuid.uuid4()
    response = await client.post(f"/api/v1/messages/{fake_id}/approve")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_approve_creates_history(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test approval creates history event."""
    response = await client.post(f"/api/v1/messages/{test_message.id}/approve")
    assert response.status_code == 200

    from sqlmodel import select

    history_query = select(MessageHistory).where(
        MessageHistory.message_id == test_message.id,
        MessageHistory.action == "approved",
    )
    result = await db_session.execute(history_query)
    history = result.scalars().first()

    assert history is not None


@pytest.mark.asyncio
async def test_approve_stores_feedback(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test approval stores positive feedback."""
    response = await client.post(f"/api/v1/messages/{test_message.id}/approve")
    assert response.status_code == 200

    from sqlmodel import select

    feedback_query = select(ClassificationFeedback).where(
        ClassificationFeedback.message_id == test_message.id,
        ClassificationFeedback.is_correct == True,  # noqa: E712
    )
    result = await db_session.execute(feedback_query)
    feedback = result.scalars().first()

    assert feedback is not None
    assert feedback.feedback_type == "approve"


@pytest.mark.asyncio
async def test_reject_message_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test POST /messages/{id}/reject with reason."""
    response = await client.post(
        f"/api/v1/messages/{test_message.id}/reject",
        json={"reason": "wrong_topic", "comment": "Should be in different category"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"

    await db_session.refresh(test_message)
    assert test_message.status == "rejected"
    assert test_message.rejected_at is not None
    assert test_message.rejection_reason == "wrong_topic"
    assert test_message.rejection_comment == "Should be in different category"


@pytest.mark.asyncio
async def test_reject_message_not_found(
    client: AsyncClient,
) -> None:
    """Test 404 when rejecting non-existent message."""
    fake_id = uuid.uuid4()
    response = await client.post(
        f"/api/v1/messages/{fake_id}/reject",
        json={"reason": "noise"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_reject_creates_history(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test rejection creates history event."""
    response = await client.post(
        f"/api/v1/messages/{test_message.id}/reject",
        json={"reason": "duplicate"},
    )
    assert response.status_code == 200

    from sqlmodel import select

    history_query = select(MessageHistory).where(
        MessageHistory.message_id == test_message.id,
        MessageHistory.action == "rejected",
    )
    result = await db_session.execute(history_query)
    history = result.scalars().first()

    assert history is not None
    assert history.reason == "duplicate"


@pytest.mark.asyncio
async def test_reject_stores_feedback(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test rejection stores negative feedback."""
    response = await client.post(
        f"/api/v1/messages/{test_message.id}/reject",
        json={"reason": "noise", "comment": "Just spam"},
    )
    assert response.status_code == 200

    from sqlmodel import select

    feedback_query = select(ClassificationFeedback).where(
        ClassificationFeedback.message_id == test_message.id,
        ClassificationFeedback.is_correct == False,  # noqa: E712
    )
    result = await db_session.execute(feedback_query)
    feedback = result.scalars().first()

    assert feedback is not None
    assert feedback.feedback_type == "reject"
    assert feedback.reason == "noise"
    assert feedback.comment == "Just spam"


@pytest.mark.asyncio
async def test_inspect_classification_details(
    client: AsyncClient,
    test_message: Message,
) -> None:
    """Test classification details formatting."""
    response = await client.get(f"/api/v1/messages/{test_message.id}/inspect")
    assert response.status_code == 200

    classification = response.json()["classification"]
    assert classification["confidence"] == 85.0
    assert classification["topic_id"] is not None
    assert classification["topic_title"] == "Test Topic"


@pytest.mark.asyncio
async def test_inspect_atoms_details(
    client: AsyncClient,
    test_message: Message,
) -> None:
    """Test atoms details structure."""
    response = await client.get(f"/api/v1/messages/{test_message.id}/inspect")
    assert response.status_code == 200

    atoms = response.json()["atoms"]
    assert "entities" in atoms
    assert "keywords" in atoms
    assert "people" in atoms["entities"]
    assert "places" in atoms["entities"]
    assert "organizations" in atoms["entities"]
    assert "concepts" in atoms["entities"]


@pytest.mark.asyncio
async def test_multiple_actions_workflow(
    client: AsyncClient,
    db_session: AsyncSession,
    test_message: Message,
) -> None:
    """Test complete workflow: inspect → reassign → approve."""
    inspect_response = await client.get(f"/api/v1/messages/{test_message.id}/inspect")
    assert inspect_response.status_code == 200

    new_topic = Topic(
        name="Workflow Topic",
        description="Test workflow",
        icon="🎯",
        color="#FF00FF",
    )
    db_session.add(new_topic)
    await db_session.commit()
    await db_session.refresh(new_topic)

    reassign_response = await client.put(
        f"/api/v1/messages/{test_message.id}/reassign",
        json={"new_topic_id": str(new_topic.id)},
    )
    assert reassign_response.status_code == 200

    approve_response = await client.post(f"/api/v1/messages/{test_message.id}/approve")
    assert approve_response.status_code == 200

    final_inspect = await client.get(f"/api/v1/messages/{test_message.id}/inspect")
    assert final_inspect.status_code == 200
    history = final_inspect.json()["history"]
    assert len(history) >= 2
