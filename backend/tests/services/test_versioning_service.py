"""Unit tests for VersioningService."""

import pytest
from app.models.atom import Atom, AtomType
from app.models.topic import Topic
from app.services.versioning_service import VersioningService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def versioning_service() -> VersioningService:
    """Create VersioningService instance."""
    return VersioningService()


@pytest.fixture
async def sample_topic(db_session: AsyncSession) -> Topic:
    """Create a sample topic for testing."""
    topic = Topic(
        name="Test Topic",
        description="Test description",
        icon="FolderIcon",
        color="#64748B",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)
    return topic


@pytest.fixture
async def sample_atom(db_session: AsyncSession) -> Atom:
    """Create a sample atom for testing."""
    atom = Atom(
        type=AtomType.insight.value,
        title="Test Atom",
        content="Test content for atom",
        confidence=0.85,
        user_approved=False,
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)
    return atom


class TestTopicVersioning:
    """Tests for topic versioning functionality."""

    async def test_create_topic_version(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test creating a new topic version."""
        data = {
            "name": "Updated Topic",
            "description": "Updated description",
            "icon": "BriefcaseIcon",
            "color": "#3B82F6",
        }

        version = await versioning_service.create_topic_version(
            db_session,
            topic_id=sample_topic.id,
            data=data,
            created_by="user_123",
        )

        assert version.id is not None
        assert version.topic_id == sample_topic.id
        assert version.version == 1
        assert version.data == data
        assert version.created_by == "user_123"
        assert version.approved is False
        assert version.approved_at is None
        assert version.created_at is not None

    async def test_create_multiple_topic_versions(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test creating multiple versions increments version number."""
        data1 = {"name": "Version 1", "description": "First version"}
        data2 = {"name": "Version 2", "description": "Second version"}
        data3 = {"name": "Version 3", "description": "Third version"}

        v1 = await versioning_service.create_topic_version(db_session, sample_topic.id, data1)
        v2 = await versioning_service.create_topic_version(db_session, sample_topic.id, data2)
        v3 = await versioning_service.create_topic_version(db_session, sample_topic.id, data3)

        assert v1.version == 1
        assert v2.version == 2
        assert v3.version == 3

    async def test_get_topic_versions(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test retrieving all versions for a topic."""
        await versioning_service.create_topic_version(db_session, sample_topic.id, {"name": "V1"})
        await versioning_service.create_topic_version(db_session, sample_topic.id, {"name": "V2"})
        await versioning_service.create_topic_version(db_session, sample_topic.id, {"name": "V3"})

        versions = await versioning_service.get_versions(db_session, "topic", sample_topic.id)

        assert len(versions) == 3
        assert versions[0].version == 3  # Newest first
        assert versions[1].version == 2
        assert versions[2].version == 1

    async def test_approve_topic_version(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test approving a version applies changes to the entity."""
        original_name = sample_topic.name
        new_data = {
            "name": "Approved Name",
            "description": "Approved description",
            "icon": "CheckCircleIcon",
            "color": "#22C55E",
        }

        version = await versioning_service.create_topic_version(db_session, sample_topic.id, new_data)

        approved_version = await versioning_service.approve_version(
            db_session, "topic", sample_topic.id, version.version
        )

        assert approved_version.approved is True
        assert approved_version.approved_at is not None

        await db_session.refresh(sample_topic)
        assert sample_topic.name == "Approved Name"
        assert sample_topic.description == "Approved description"
        assert sample_topic.icon == "CheckCircleIcon"
        assert sample_topic.color == "#22C55E"

    async def test_approve_already_approved_version_raises_error(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test approving an already approved version raises an error."""
        version = await versioning_service.create_topic_version(db_session, sample_topic.id, {"name": "Test"})

        await versioning_service.approve_version(db_session, "topic", sample_topic.id, version.version)

        with pytest.raises(ValueError, match="already approved"):
            await versioning_service.approve_version(db_session, "topic", sample_topic.id, version.version)

    async def test_reject_topic_version(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test rejecting a version does not apply changes."""
        original_name = sample_topic.name
        new_data = {"name": "Rejected Name", "description": "Rejected"}

        version = await versioning_service.create_topic_version(db_session, sample_topic.id, new_data)

        rejected_version = await versioning_service.reject_version(
            db_session, "topic", sample_topic.id, version.version
        )

        assert rejected_version.approved is False
        assert rejected_version.approved_at is None

        await db_session.refresh(sample_topic)
        assert sample_topic.name == original_name


class TestAtomVersioning:
    """Tests for atom versioning functionality."""

    async def test_create_atom_version(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_atom: Atom,
    ) -> None:
        """Test creating a new atom version."""
        data = {
            "type": AtomType.solution.value,
            "title": "Updated Atom",
            "content": "Updated content",
            "confidence": 0.92,
            "meta": {"tags": ["important"]},
        }

        version = await versioning_service.create_atom_version(
            db_session,
            atom_id=sample_atom.id,
            data=data,
            created_by="user_456",
        )

        assert version.id is not None
        assert version.atom_id == sample_atom.id
        assert version.version == 1
        assert version.data == data
        assert version.created_by == "user_456"
        assert version.approved is False
        assert version.approved_at is None

    async def test_create_multiple_atom_versions(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_atom: Atom,
    ) -> None:
        """Test creating multiple atom versions increments version number."""
        v1 = await versioning_service.create_atom_version(db_session, sample_atom.id, {"title": "V1", "content": "C1"})
        v2 = await versioning_service.create_atom_version(db_session, sample_atom.id, {"title": "V2", "content": "C2"})

        assert v1.version == 1
        assert v2.version == 2

    async def test_get_atom_versions(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_atom: Atom,
    ) -> None:
        """Test retrieving all versions for an atom."""
        await versioning_service.create_atom_version(db_session, sample_atom.id, {"title": "V1"})
        await versioning_service.create_atom_version(db_session, sample_atom.id, {"title": "V2"})

        versions = await versioning_service.get_versions(db_session, "atom", sample_atom.id)

        assert len(versions) == 2
        assert versions[0].version == 2  # Newest first
        assert versions[1].version == 1

    async def test_approve_atom_version(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_atom: Atom,
    ) -> None:
        """Test approving an atom version applies changes."""
        new_data = {
            "type": AtomType.decision.value,
            "title": "Approved Title",
            "content": "Approved content",
            "confidence": 0.95,
        }

        version = await versioning_service.create_atom_version(db_session, sample_atom.id, new_data)

        approved_version = await versioning_service.approve_version(db_session, "atom", sample_atom.id, version.version)

        assert approved_version.approved is True

        await db_session.refresh(sample_atom)
        assert sample_atom.type == AtomType.decision.value
        assert sample_atom.title == "Approved Title"
        assert sample_atom.content == "Approved content"
        assert sample_atom.confidence == 0.95


class TestVersionDiff:
    """Tests for version diff functionality."""

    async def test_get_version_diff_for_topic(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test generating diff between two topic versions."""
        v1_data = {
            "name": "Original Name",
            "description": "Original desc",
            "icon": "FolderIcon",
            "color": "#64748B",
        }
        v2_data = {
            "name": "Updated Name",
            "description": "Original desc",
            "icon": "BriefcaseIcon",
            "color": "#64748B",
        }

        v1 = await versioning_service.create_topic_version(db_session, sample_topic.id, v1_data)
        v2 = await versioning_service.create_topic_version(db_session, sample_topic.id, v2_data)

        diff = await versioning_service.get_version_diff(db_session, "topic", sample_topic.id, v1.version, v2.version)

        assert diff["from_version"] == v1.version
        assert diff["to_version"] == v2.version
        assert "changes" in diff
        assert "summary" in diff
        assert len(diff["changes"]) > 0

    async def test_get_version_diff_for_atom(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_atom: Atom,
    ) -> None:
        """Test generating diff between two atom versions."""
        v1_data = {"title": "Old Title", "content": "Old content"}
        v2_data = {"title": "New Title", "content": "New content"}

        v1 = await versioning_service.create_atom_version(db_session, sample_atom.id, v1_data)
        v2 = await versioning_service.create_atom_version(db_session, sample_atom.id, v2_data)

        diff = await versioning_service.get_version_diff(db_session, "atom", sample_atom.id, v1.version, v2.version)

        assert diff["from_version"] == v1.version
        assert diff["to_version"] == v2.version
        assert "changes" in diff

    async def test_get_version_diff_nonexistent_version_raises_error(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test diff with nonexistent version raises error."""
        await versioning_service.create_topic_version(db_session, sample_topic.id, {"name": "Test"})

        with pytest.raises(ValueError, match="Version not found"):
            await versioning_service.get_version_diff(db_session, "topic", sample_topic.id, 1, 999)

    async def test_diff_with_no_changes(
        self,
        db_session: AsyncSession,
        versioning_service: VersioningService,
        sample_topic: Topic,
    ) -> None:
        """Test diff when versions have identical data."""
        data = {"name": "Same", "description": "Same"}

        v1 = await versioning_service.create_topic_version(db_session, sample_topic.id, data)
        v2 = await versioning_service.create_topic_version(db_session, sample_topic.id, data)

        diff = await versioning_service.get_version_diff(db_session, "topic", sample_topic.id, v1.version, v2.version)

        assert diff["summary"] == "No changes detected"
        assert len(diff["changes"]) == 0
