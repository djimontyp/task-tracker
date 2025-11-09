import pytest
from app.models.atom import Atom
from app.models.topic import Topic
from app.services.versioning import VersioningService
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_get_topic_versions_empty(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /topics/{id}/versions with no versions"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    response = await client.get(f"/api/v1/topics/{topic.id}/versions")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_topic_versions(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /topics/{id}/versions returns versions ordered newest first"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version1 = await service.create_topic_version(
        db_session,
        topic.id,
        {"name": "Version 1", "description": "First version"},
        created_by="user1",
    )
    version2 = await service.create_topic_version(
        db_session,
        topic.id,
        {"name": "Version 2", "description": "Second version"},
        created_by="user2",
    )

    response = await client.get(f"/api/v1/topics/{topic.id}/versions")
    assert response.status_code == 200
    versions = response.json()
    assert len(versions) == 2
    assert versions[0]["id"] == version2.id
    assert versions[0]["version"] == 2
    assert versions[0]["created_by"] == "user2"
    assert versions[1]["id"] == version1.id
    assert versions[1]["version"] == 1
    assert versions[1]["created_by"] == "user1"


@pytest.mark.asyncio
async def test_get_topic_version_diff(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /topics/{id}/versions/{version}/diff"""
    topic = Topic(
        name="Original Title",
        description="Original description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    await service.create_topic_version(
        db_session,
        topic.id,
        {"name": "Original Title", "description": "Original description"},
    )
    await service.create_topic_version(
        db_session,
        topic.id,
        {"name": "Modified Title", "description": "Modified description"},
    )

    response = await client.get(
        f"/api/v1/topics/{topic.id}/versions/2/diff",
        params={"compare_to": 1},
    )
    assert response.status_code == 200
    diff = response.json()
    assert diff["from_version"] == 1
    assert diff["to_version"] == 2
    assert len(diff["changes"]) > 0
    assert "changes detected" in diff["summary"].lower() or "values changed" in diff["summary"].lower()


@pytest.mark.asyncio
async def test_get_topic_version_diff_invalid_version(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /topics/{id}/versions/{version}/diff with invalid version"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    response = await client.get(
        f"/api/v1/topics/{topic.id}/versions/99/diff",
        params={"compare_to": 1},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_approve_topic_version(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test POST /topics/{id}/versions/{version}/approve"""
    topic = Topic(
        name="Original Title",
        description="Original description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(
        db_session,
        topic.id,
        {"name": "New Title", "description": "New description"},
    )

    assert not version.approved

    response = await client.post(f"/api/v1/topics/{topic.id}/versions/{version.version}/approve", json={})
    assert response.status_code == 200
    result = response.json()
    assert result["approved"] is True
    assert result["approved_at"] is not None

    await db_session.refresh(topic)
    assert topic.name == "New Title"
    assert topic.description == "New description"


@pytest.mark.asyncio
async def test_approve_topic_version_invalid(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test POST /topics/{id}/versions/{version}/approve with invalid version"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    response = await client.post(f"/api/v1/topics/{topic.id}/versions/99/approve", json={})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_reject_topic_version(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test POST /topics/{id}/versions/{version}/reject"""
    topic = Topic(
        name="Original Title",
        description="Original description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    service = VersioningService()
    version = await service.create_topic_version(
        db_session,
        topic.id,
        {"name": "Rejected Title", "description": "Rejected description"},
    )

    response = await client.post(f"/api/v1/topics/{topic.id}/versions/{version.version}/reject", json={})
    assert response.status_code == 200
    result = response.json()
    assert result["approved"] is False

    await db_session.refresh(topic)
    assert topic.name == "Original Title"
    assert topic.description == "Original description"


@pytest.mark.asyncio
async def test_get_atom_versions(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /atoms/{id}/versions"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Test Atom",
        content="Test content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    version1 = await service.create_atom_version(
        db_session,
        atom.id,
        {"content": "Version 1", "confidence": 0.8},
    )
    version2 = await service.create_atom_version(
        db_session,
        atom.id,
        {"content": "Version 2", "confidence": 0.95},
    )

    response = await client.get(f"/api/v1/atoms/{atom.id}/versions")
    assert response.status_code == 200
    versions = response.json()
    assert len(versions) == 2
    assert versions[0]["id"] == version2.id
    assert versions[1]["id"] == version1.id


@pytest.mark.asyncio
async def test_get_atom_version_diff(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test GET /atoms/{id}/versions/{version}/diff"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Original Atom",
        content="Original content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    await service.create_atom_version(
        db_session,
        atom.id,
        {"content": "Original content", "confidence": 0.9},
    )
    await service.create_atom_version(
        db_session,
        atom.id,
        {"content": "Modified content", "confidence": 0.95},
    )

    response = await client.get(
        f"/api/v1/atoms/{atom.id}/versions/2/diff",
        params={"compare_to": 1},
    )
    assert response.status_code == 200
    diff = response.json()
    assert diff["from_version"] == 1
    assert diff["to_version"] == 2
    assert len(diff["changes"]) > 0


@pytest.mark.asyncio
async def test_approve_atom_version(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test POST /atoms/{id}/versions/{version}/approve"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Original Atom",
        content="Original content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    version = await service.create_atom_version(
        db_session,
        atom.id,
        {"content": "New content", "confidence": 0.95},
    )

    response = await client.post(f"/api/v1/atoms/{atom.id}/versions/{version.version}/approve", json={})
    assert response.status_code == 200
    result = response.json()
    assert result["approved"] is True

    await db_session.refresh(atom)
    assert atom.content == "New content"
    assert atom.confidence == 0.95


@pytest.mark.asyncio
async def test_reject_atom_version(client: AsyncClient, db_session: AsyncSession) -> None:
    """Test POST /atoms/{id}/versions/{version}/reject"""
    topic = Topic(
        name="Test Topic",
        description="Test description",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)

    atom = Atom(
        topic_id=topic.id,
        type="fact",
        title="Original Atom",
        content="Original content",
        confidence=0.9,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    service = VersioningService()
    version = await service.create_atom_version(
        db_session,
        atom.id,
        {"content": "Rejected content", "confidence": 0.5},
    )

    response = await client.post(f"/api/v1/atoms/{atom.id}/versions/{version.version}/reject", json={})
    assert response.status_code == 200
    result = response.json()
    assert result["approved"] is False

    await db_session.refresh(atom)
    assert atom.content == "Original content"
    assert atom.confidence == 0.9
