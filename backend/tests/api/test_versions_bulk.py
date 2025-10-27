"""Tests for bulk version approval/rejection endpoints."""

import pytest
from app.models.atom import Atom
from app.models.topic import Topic
from app.services.versioning_service import VersioningService
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_bulk_approve_topic_versions_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk approve multiple topic versions successfully"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(db_session, topic.id, {"name": "Version 1", "description": "Desc 1"})
    version2 = await service.create_topic_version(db_session, topic.id, {"name": "Version 2", "description": "Desc 2"})
    version3 = await service.create_topic_version(db_session, topic.id, {"name": "Version 3", "description": "Desc 3"})

    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "topic",
            "version_ids": [version1.id, version2.id, version3.id],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 3
    assert result["failed_ids"] == []
    assert result["errors"] == {}

    await db_session.refresh(topic)
    assert topic.name == "Version 3"
    assert topic.description == "Desc 3"


@pytest.mark.asyncio
async def test_bulk_approve_atom_versions_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk approve multiple atom versions successfully"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Test Atom",
        content="Original content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    version1 = await service.create_atom_version(db_session, atom.id, {"content": "Content 1", "confidence": 0.85})
    version2 = await service.create_atom_version(db_session, atom.id, {"content": "Content 2", "confidence": 0.90})

    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "atom",
            "version_ids": [version1.id, version2.id],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 2
    assert result["failed_ids"] == []

    await db_session.refresh(atom)
    assert atom.content == "Content 2"
    assert atom.confidence == 0.90


@pytest.mark.asyncio
async def test_bulk_approve_partial_failure(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk approve with some versions failing (non-existent IDs)"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(
        db_session, topic.id, {"name": "Valid Version", "description": "Valid"}
    )

    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "topic",
            "version_ids": [version.id, 99999, 99998],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 1
    assert 99999 in result["failed_ids"]
    assert 99998 in result["failed_ids"]
    assert "99999" in result["errors"]
    assert "99998" in result["errors"]
    assert "not found" in result["errors"]["99999"].lower()


@pytest.mark.asyncio
async def test_bulk_approve_already_approved(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk approve fails for already approved versions"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(db_session, topic.id, {"name": "Test", "description": "Test"})

    await service.approve_version(db_session, "topic", topic.id, version.version)

    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "topic",
            "version_ids": [version.id],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 0
    assert version.id in result["failed_ids"]
    assert str(version.id) in result["errors"]
    assert "already approved" in result["errors"][str(version.id)].lower()


@pytest.mark.asyncio
async def test_bulk_approve_empty_list(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk approve with empty version_ids list"""
    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "topic",
            "version_ids": [],
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_bulk_approve_invalid_entity_type(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk approve with invalid entity_type"""
    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "invalid",
            "version_ids": [1, 2, 3],
        },
    )

    assert response.status_code == 400
    assert "entity_type must be" in response.json()["detail"]


@pytest.mark.asyncio
async def test_bulk_reject_topic_versions_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk reject multiple topic versions successfully"""
    topic = Topic(name="Original", description="Original description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(
        db_session, topic.id, {"name": "Rejected 1", "description": "Rejected 1"}
    )
    version2 = await service.create_topic_version(
        db_session, topic.id, {"name": "Rejected 2", "description": "Rejected 2"}
    )

    response = await client.post(
        "/api/v1/bulk-reject",
        json={
            "entity_type": "topic",
            "version_ids": [version1.id, version2.id],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 2
    assert result["failed_ids"] == []

    await db_session.refresh(topic)
    assert topic.name == "Original"
    assert topic.description == "Original description"


@pytest.mark.asyncio
async def test_bulk_reject_atom_versions_success(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk reject multiple atom versions successfully"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Test Atom",
        content="Original content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    version1 = await service.create_atom_version(db_session, atom.id, {"content": "Rejected 1"})
    version2 = await service.create_atom_version(db_session, atom.id, {"content": "Rejected 2"})

    response = await client.post(
        "/api/v1/bulk-reject",
        json={
            "entity_type": "atom",
            "version_ids": [version1.id, version2.id],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 2
    assert result["failed_ids"] == []

    await db_session.refresh(atom)
    assert atom.content == "Original content"


@pytest.mark.asyncio
async def test_bulk_reject_partial_failure(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk reject with some non-existent version IDs"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(db_session, topic.id, {"name": "Valid Version"})

    response = await client.post(
        "/api/v1/bulk-reject",
        json={
            "entity_type": "topic",
            "version_ids": [version.id, 88888],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 1
    assert 88888 in result["failed_ids"]
    assert "88888" in result["errors"]
    assert "not found" in result["errors"]["88888"].lower()


@pytest.mark.asyncio
async def test_bulk_reject_empty_list(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk reject with empty version_ids list"""
    response = await client.post(
        "/api/v1/bulk-reject",
        json={
            "entity_type": "topic",
            "version_ids": [],
        },
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_bulk_reject_invalid_entity_type(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test bulk reject with invalid entity_type"""
    response = await client.post(
        "/api/v1/bulk-reject",
        json={
            "entity_type": "user",
            "version_ids": [1],
        },
    )

    assert response.status_code == 400
    assert "entity_type must be" in response.json()["detail"]


@pytest.mark.asyncio
async def test_bulk_approve_mixed_topics_and_atoms(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test that bulk operations are scoped to entity_type correctly"""
    topic = Topic(name="Test Topic", description="Test description")
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Test Atom",
        content="Original content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    topic_version = await service.create_topic_version(db_session, topic.id, {"name": "Topic Version"})
    atom_version = await service.create_atom_version(db_session, atom.id, {"content": "Atom Version"})

    response = await client.post(
        "/api/v1/bulk-approve",
        json={
            "entity_type": "topic",
            "version_ids": [topic_version.id, atom_version.id],
        },
    )

    assert response.status_code == 200
    result = response.json()
    assert result["success_count"] == 1
    assert atom_version.id in result["failed_ids"]
