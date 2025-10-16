"""Contract tests for topic-message relationship endpoints."""

from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Message, Topic, User
from app.models.enums import SourceType
from app.models.legacy import Source


@pytest.fixture
async def test_topic(db_session: AsyncSession) -> Topic:
    """Create a test topic."""
    topic = Topic(
        name="Test Topic for Messages",
        description="A topic for testing message relationships",
        icon="FolderIcon",
        color="#3B82F6",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)
    return topic


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        first_name="Test",
        last_name="User",
        email="test.user@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_source(db_session: AsyncSession) -> Source:
    """Create a test source."""
    source = Source(
        name="Test Chat",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.fixture
async def messages_with_topic(
    db_session: AsyncSession,
    test_topic: Topic,
    test_user: User,
    test_source: Source,
) -> list[Message]:
    """Create test messages associated with a topic."""
    messages = []
    for i in range(5):
        msg = Message(
            external_message_id=f"msg_{i}",
            content=f"Test message {i} for topic",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            topic_id=test_topic.id,
            analyzed=True,
            classification="task" if i % 2 == 0 else "note",
            confidence=0.9,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)
    return messages


@pytest.fixture
async def messages_without_topic(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> list[Message]:
    """Create test messages without a topic."""
    messages = []
    for i in range(3):
        msg = Message(
            external_message_id=f"msg_no_topic_{i}",
            content=f"Message {i} without topic",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            topic_id=None,
            analyzed=False,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()
    for msg in messages:
        await db_session.refresh(msg)
    return messages


@pytest.mark.asyncio
async def test_get_topic_messages_success(
    client: AsyncClient,
    test_topic: Topic,
    messages_with_topic: list[Message],
) -> None:
    """Test successful retrieval of messages for a topic."""
    response = await client.get(f"/api/v1/topics/{test_topic.id}/messages")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5

    for message_data in data:
        assert "id" in message_data
        assert "content" in message_data
        assert "author_name" in message_data
        assert "source_name" in message_data
        assert message_data["content"].endswith("for topic")


@pytest.mark.asyncio
async def test_get_topic_messages_with_pagination(
    client: AsyncClient,
    test_topic: Topic,
    messages_with_topic: list[Message],
) -> None:
    """Test pagination for topic messages."""
    response = await client.get(
        f"/api/v1/topics/{test_topic.id}/messages",
        params={"skip": 0, "limit": 2},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    response_page_2 = await client.get(
        f"/api/v1/topics/{test_topic.id}/messages",
        params={"skip": 2, "limit": 2},
    )

    assert response_page_2.status_code == 200
    data_page_2 = response_page_2.json()
    assert len(data_page_2) == 2

    first_ids = {msg["id"] for msg in data}
    second_ids = {msg["id"] for msg in data_page_2}
    assert first_ids.isdisjoint(second_ids)


@pytest.mark.asyncio
async def test_get_topic_messages_not_found(client: AsyncClient) -> None:
    """Test 404 error for non-existent topic."""
    fake_topic_id = 99999
    response = await client.get(f"/api/v1/topics/{fake_topic_id}/messages")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_topic_messages_empty_list(
    client: AsyncClient,
    test_topic: Topic,
) -> None:
    """Test empty list when topic has no messages."""
    response = await client.get(f"/api/v1/topics/{test_topic.id}/messages")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
async def test_filter_messages_by_topic_id(
    client: AsyncClient,
    test_topic: Topic,
    messages_with_topic: list[Message],
    messages_without_topic: list[Message],
) -> None:
    """Test filtering messages by topic_id in /api/v1/messages endpoint."""
    response = await client.get(
        "/api/v1/messages",
        params={"topic_id": test_topic.id, "page": 1, "page_size": 50},
    )

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] == 5

    for message in data["items"]:
        assert message["content"].endswith("for topic")


@pytest.mark.asyncio
async def test_filter_messages_by_topic_id_empty(
    client: AsyncClient,
    messages_without_topic: list[Message],
) -> None:
    """Test filtering messages by non-existent topic_id returns empty list."""
    fake_topic_id = 99999
    response = await client.get(
        "/api/v1/messages",
        params={"topic_id": fake_topic_id, "page": 1, "page_size": 50},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


@pytest.mark.asyncio
async def test_filter_messages_without_topic_id(
    client: AsyncClient,
    messages_with_topic: list[Message],
    messages_without_topic: list[Message],
) -> None:
    """Test that omitting topic_id filter returns all messages."""
    response = await client.get(
        "/api/v1/messages",
        params={"page": 1, "page_size": 50},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 8
    assert len(data["items"]) == 8


@pytest.mark.asyncio
async def test_messages_sorted_by_sent_at_desc(
    client: AsyncClient,
    test_topic: Topic,
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test that messages are sorted by sent_at in descending order."""
    base_time = datetime.now(UTC)

    messages = []
    for i in range(3):
        msg = Message(
            external_message_id=f"msg_sorted_{i}",
            content=f"Message {i}",
            sent_at=base_time.replace(second=i),
            source_id=test_source.id,
            author_id=test_user.id,
            topic_id=test_topic.id,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()

    response = await client.get(f"/api/v1/topics/{test_topic.id}/messages")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    sent_times = [datetime.fromisoformat(msg["sent_at"].replace("Z", "+00:00")) for msg in data]
    assert sent_times == sorted(sent_times, reverse=True)
