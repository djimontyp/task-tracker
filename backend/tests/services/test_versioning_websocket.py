"""Tests for WebSocket event broadcasting in versioning service."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from app.models.atom import Atom
from app.models.topic import Topic
from app.services.versioning_service import VersioningService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_approve_version_broadcasts_pending_count_update(
    db_session: AsyncSession,
) -> None:
    """Test that approve_version broadcasts pending_count_updated event"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(
        db_session, topic.id, {"name": "New Version", "description": "Updated"}
    )

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.approve_version(db_session, "topic", topic.id, version.version)

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args

        assert call_args[0][0] == "versions"
        message = call_args[0][1]
        assert message["event"] == "pending_count_updated"
        assert "count" in message
        assert "last_updated" in message
        assert isinstance(message["count"], int)


@pytest.mark.asyncio
async def test_reject_version_broadcasts_pending_count_update(
    db_session: AsyncSession,
) -> None:
    """Test that reject_version broadcasts pending_count_updated event"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(db_session, topic.id, {"name": "Rejected Version"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.reject_version(db_session, "topic", topic.id, version.version)

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args

        assert call_args[0][0] == "versions"
        message = call_args[0][1]
        assert message["event"] == "pending_count_updated"


@pytest.mark.asyncio
async def test_bulk_approve_broadcasts_pending_count_update(
    db_session: AsyncSession,
) -> None:
    """Test that bulk_approve_versions broadcasts pending_count_updated event"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(db_session, topic.id, {"name": "Version 1"})
    version2 = await service.create_topic_version(db_session, topic.id, {"name": "Version 2"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.bulk_approve_versions(db_session, "topic", [version1.id, version2.id])

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args
        assert call_args[0][0] == "versions"


@pytest.mark.asyncio
async def test_bulk_reject_broadcasts_pending_count_update(
    db_session: AsyncSession,
) -> None:
    """Test that bulk_reject_versions broadcasts pending_count_updated event"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(db_session, topic.id, {"name": "Version 1"})
    version2 = await service.create_topic_version(db_session, topic.id, {"name": "Version 2"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.bulk_reject_versions(db_session, "topic", [version1.id, version2.id])

        mock_manager.broadcast.assert_called_once()


@pytest.mark.asyncio
async def test_websocket_event_payload_structure(db_session: AsyncSession) -> None:
    """Test that WebSocket event has correct payload structure"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(db_session, topic.id, {"name": "Version"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.approve_version(db_session, "topic", topic.id, version.version)

        message = mock_manager.broadcast.call_args[0][1]
        assert "event" in message
        assert "count" in message
        assert "last_updated" in message

        assert message["event"] == "pending_count_updated"
        assert isinstance(message["count"], int)
        assert isinstance(message["last_updated"], str)

        datetime.fromisoformat(message["last_updated"])


@pytest.mark.asyncio
async def test_pending_count_decreases_after_approval(db_session: AsyncSession) -> None:
    """Test that pending count decreases after version approval"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(db_session, topic.id, {"name": "Version 1"})
    version2 = await service.create_topic_version(db_session, topic.id, {"name": "Version 2"})

    initial_count = await service.get_pending_versions_count(db_session)
    assert initial_count == 2

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.approve_version(db_session, "topic", topic.id, version1.version)

        final_count = await service.get_pending_versions_count(db_session)
        assert final_count == 1

        message = mock_manager.broadcast.call_args[0][1]
        assert message["count"] == 1


@pytest.mark.asyncio
async def test_pending_count_with_mixed_entities(db_session: AsyncSession) -> None:
    """Test pending count includes both topic and atom versions"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Test Atom",
        content="Content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    await service.create_topic_version(db_session, topic.id, {"name": "Topic V1"})
    await service.create_topic_version(db_session, topic.id, {"name": "Topic V2"})
    await service.create_atom_version(db_session, atom.id, {"content": "Atom V1"})

    pending_count = await service.get_pending_versions_count(db_session)
    assert pending_count == 3


@pytest.mark.asyncio
async def test_websocket_broadcast_called_once_per_operation(
    db_session: AsyncSession,
) -> None:
    """Test that WebSocket broadcast is called exactly once per operation"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(db_session, topic.id, {"name": "Version"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.approve_version(db_session, "topic", topic.id, version.version)

        assert mock_manager.broadcast.call_count == 1


@pytest.mark.asyncio
async def test_bulk_operations_single_broadcast(db_session: AsyncSession) -> None:
    """Test that bulk operations trigger only one broadcast (not per version)"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(db_session, topic.id, {"name": "Version 1"})
    version2 = await service.create_topic_version(db_session, topic.id, {"name": "Version 2"})
    version3 = await service.create_topic_version(db_session, topic.id, {"name": "Version 3"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.bulk_approve_versions(db_session, "topic", [version1.id, version2.id, version3.id])

        assert mock_manager.broadcast.call_count == 1


@pytest.mark.asyncio
async def test_websocket_broadcast_on_atom_version_approval(
    db_session: AsyncSession,
) -> None:
    """Test WebSocket broadcast for atom version approval"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Test Atom",
        content="Content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    version = await service.create_atom_version(db_session, atom.id, {"content": "Updated"})

    with patch("app.services.versioning_service.websocket_manager") as mock_manager:
        mock_manager.broadcast = AsyncMock()

        await service.approve_version(db_session, "atom", atom.id, version.version)

        mock_manager.broadcast.assert_called_once()
        call_args = mock_manager.broadcast.call_args
        assert call_args[0][0] == "versions"
        assert call_args[0][1]["event"] == "pending_count_updated"
