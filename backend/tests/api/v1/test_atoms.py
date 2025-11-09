"""Comprehensive tests for Atoms API endpoints and Topic-Atom relationships.

This test module provides complete coverage for all /api/v1/atoms endpoints including:
- List atoms (GET /api/v1/atoms) with pagination
- Get atom by ID (GET /api/v1/atoms/{id})
- Create atom (POST /api/v1/atoms)
- Update atom (PATCH /api/v1/atoms/{id})
- Delete atom (DELETE /api/v1/atoms/{id})
- Link atom to topic (POST /api/v1/atoms/{id}/topics/{topic_id})
- Get topic atoms (GET /api/v1/topics/{id}/atoms)
- Get topic messages (GET /api/v1/topics/{id}/messages)
"""

import uuid
from datetime import UTC, datetime

import pytest
from app.models import (
    Atom,
    AtomType,
    Message,
    Source,
    SourceType,
    Topic,
    TopicAtom,
    User,
)
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
async def sample_topic(db_session: AsyncSession) -> Topic:
    """Create a test topic."""
    topic = Topic(
        name="Test Topic",
        description="Test topic description",
        icon="AcademicCapIcon",
        color="#3B82F6",
    )
    db_session.add(topic)
    await db_session.commit()
    await db_session.refresh(topic)
    return topic


@pytest.fixture
async def sample_atom(db_session: AsyncSession) -> Atom:
    """Create a test atom."""
    atom = Atom(
        type=AtomType.problem.value,
        title="Test Problem",
        content="This is a test problem description",
        confidence=0.85,
        user_approved=False,
        meta={"tags": ["test", "sample"]},
    )
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)
    return atom


@pytest.fixture
async def sample_message(
    db_session: AsyncSession, sample_user: User, sample_source: Source, sample_topic: Topic
) -> Message:
    """Create a test message."""
    message = Message(
        external_message_id="test_msg_123",
        content="Test message content",
        sent_at=datetime.now(UTC),
        source_id=sample_source.id,
        author_id=sample_user.id,
        topic_id=sample_topic.id,
        classification="test",
        confidence=0.9,
        analyzed=True,
    )
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)
    return message


@pytest.fixture
async def multiple_atoms(db_session: AsyncSession) -> list[Atom]:
    """Create multiple atoms for pagination testing."""
    atoms = []
    atom_types = [AtomType.problem, AtomType.solution, AtomType.insight, AtomType.decision, AtomType.question]

    for i in range(5):
        atom = Atom(
            type=atom_types[i].value,
            title=f"Test Atom {i}",
            content=f"Content for atom {i}",
            confidence=0.7 + (i * 0.05),
            user_approved=(i % 2 == 0),
        )
        db_session.add(atom)
        atoms.append(atom)

    await db_session.commit()
    for atom in atoms:
        await db_session.refresh(atom)

    return atoms


@pytest.mark.asyncio
async def test_list_atoms_empty(client: AsyncClient):
    """Test listing atoms when database is empty."""
    response = await client.get("/api/v1/atoms")

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) == 0
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_atoms(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test listing atoms with data."""
    response = await client.get("/api/v1/atoms")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 5
    assert data["total"] == 5
    assert data["page"] == 1
    assert data["page_size"] == 100

    first_atom = data["items"][0]
    assert "id" in first_atom
    assert "type" in first_atom
    assert "title" in first_atom
    assert "content" in first_atom
    assert "confidence" in first_atom
    assert "user_approved" in first_atom
    assert "created_at" in first_atom
    assert "updated_at" in first_atom


@pytest.mark.asyncio
async def test_list_atoms_pagination_skip(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test pagination with skip parameter."""
    response = await client.get("/api/v1/atoms?skip=2&limit=2")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["page"] == 2


@pytest.mark.asyncio
async def test_list_atoms_pagination_limit(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test pagination with limit parameter."""
    response = await client.get("/api/v1/atoms?limit=3")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] == 5


@pytest.mark.asyncio
async def test_list_atoms_invalid_pagination_negative_skip(client: AsyncClient):
    """Test validation error for negative skip value."""
    response = await client.get("/api/v1/atoms?skip=-1")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_atoms_invalid_pagination_zero_limit(client: AsyncClient):
    """Test validation error for zero limit value."""
    response = await client.get("/api/v1/atoms?limit=0")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_atoms_invalid_pagination_excessive_limit(client: AsyncClient):
    """Test validation error for limit exceeding maximum (1000)."""
    response = await client.get("/api/v1/atoms?limit=1001")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_atom(client: AsyncClient, sample_atom: Atom):
    """Test successfully retrieving an atom by ID."""
    response = await client.get(f"/api/v1/atoms/{sample_atom.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_atom.id)
    assert data["type"] == sample_atom.type
    assert data["title"] == sample_atom.title
    assert data["content"] == sample_atom.content
    assert data["confidence"] == sample_atom.confidence
    assert data["user_approved"] == sample_atom.user_approved
    assert data["meta"] == sample_atom.meta


@pytest.mark.asyncio
async def test_get_atom_not_found(client: AsyncClient):
    """Test 404 error when atom doesn't exist."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/atoms/{nonexistent_id}")

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert nonexistent_id in data["detail"]


@pytest.mark.asyncio
async def test_create_atom(client: AsyncClient):
    """Test creating an atom with valid data."""
    payload = {
        "type": "problem",
        "title": "New Problem",
        "content": "This is a new problem that needs solving",
        "confidence": 0.9,
        "user_approved": True,
        "meta": {"tags": ["new", "test"]},
    }

    response = await client.post("/api/v1/atoms", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["type"] == payload["type"]
    assert data["title"] == payload["title"]
    assert data["content"] == payload["content"]
    assert data["confidence"] == payload["confidence"]
    assert data["user_approved"] == payload["user_approved"]
    assert data["meta"] == payload["meta"]
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_atom_minimal_fields(client: AsyncClient):
    """Test creating atom with only required fields."""
    payload = {
        "type": "insight",
        "title": "Simple Insight",
        "content": "This is a simple insight",
    }

    response = await client.post("/api/v1/atoms", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["type"] == payload["type"]
    assert data["title"] == payload["title"]
    assert data["content"] == payload["content"]
    assert data["confidence"] is None
    assert data["user_approved"] is False
    assert data["meta"] is None


@pytest.mark.asyncio
async def test_create_atom_all_types(client: AsyncClient):
    """Test creating atoms with all valid types."""
    atom_types = ["problem", "solution", "decision", "question", "insight", "pattern", "requirement"]

    for atom_type in atom_types:
        payload = {
            "type": atom_type,
            "title": f"Test {atom_type}",
            "content": f"Content for {atom_type}",
        }

        response = await client.post("/api/v1/atoms", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == atom_type


@pytest.mark.asyncio
async def test_create_atom_invalid_type(client: AsyncClient):
    """Test validation error for invalid atom type."""
    payload = {
        "type": "invalid_type",
        "title": "Test",
        "content": "Test content",
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_atom_missing_required_title(client: AsyncClient):
    """Test validation error for missing required field: title."""
    payload = {
        "type": "problem",
        "content": "Test content",
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_atom_missing_required_content(client: AsyncClient):
    """Test validation error for missing required field: content."""
    payload = {
        "type": "problem",
        "title": "Test",
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_atom_empty_title(client: AsyncClient):
    """Test validation error for empty title."""
    payload = {
        "type": "problem",
        "title": "",
        "content": "Test content",
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_atom_empty_content(client: AsyncClient):
    """Test validation error for empty content."""
    payload = {
        "type": "problem",
        "title": "Test",
        "content": "",
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_atom_invalid_confidence_below_zero(client: AsyncClient):
    """Test validation error for confidence below 0.0."""
    payload = {
        "type": "problem",
        "title": "Test",
        "content": "Test content",
        "confidence": -0.1,
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_atom_invalid_confidence_above_one(client: AsyncClient):
    """Test validation error for confidence above 1.0."""
    payload = {
        "type": "problem",
        "title": "Test",
        "content": "Test content",
        "confidence": 1.1,
    }

    response = await client.post("/api/v1/atoms", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_atom(client: AsyncClient, sample_atom: Atom):
    """Test updating an atom."""
    payload = {
        "title": "Updated Title",
        "content": "Updated content",
        "confidence": 0.95,
        "user_approved": True,
    }

    response = await client.patch(f"/api/v1/atoms/{sample_atom.id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_atom.id)
    assert data["title"] == payload["title"]
    assert data["content"] == payload["content"]
    assert data["confidence"] == payload["confidence"]
    assert data["user_approved"] == payload["user_approved"]


@pytest.mark.asyncio
async def test_update_atom_partial(client: AsyncClient, sample_atom: Atom):
    """Test partial update of an atom."""
    original_title = sample_atom.title
    original_content = sample_atom.content

    payload = {"user_approved": True}

    response = await client.patch(f"/api/v1/atoms/{sample_atom.id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["user_approved"] is True
    assert data["title"] == original_title
    assert data["content"] == original_content


@pytest.mark.asyncio
async def test_update_atom_change_type(client: AsyncClient, sample_atom: Atom):
    """Test changing atom type."""
    payload = {"type": "solution"}

    response = await client.patch(f"/api/v1/atoms/{sample_atom.id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "solution"


@pytest.mark.asyncio
async def test_update_atom_not_found(client: AsyncClient):
    """Test 404 error when updating non-existent atom."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    payload = {"title": "New Title"}

    response = await client.patch(f"/api/v1/atoms/{nonexistent_id}", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_update_atom_invalid_type(client: AsyncClient, sample_atom: Atom):
    """Test validation error for invalid atom type during update."""
    payload = {"type": "invalid_type"}

    response = await client.patch(f"/api/v1/atoms/{sample_atom.id}", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_atom(client: AsyncClient, sample_atom: Atom, db_session: AsyncSession):
    """Test successfully deleting an atom."""
    atom_id = sample_atom.id

    response = await client.delete(f"/api/v1/atoms/{atom_id}")
    assert response.status_code == 204

    db_session.expire_all()
    deleted_atom = await db_session.get(Atom, atom_id)
    assert deleted_atom is None


@pytest.mark.asyncio
async def test_delete_atom_not_found(client: AsyncClient):
    """Test 404 error when deleting non-existent atom."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await client.delete(f"/api/v1/atoms/{nonexistent_id}")

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_link_atom_to_topic(client: AsyncClient, sample_atom: Atom, sample_topic: Topic):
    """Test linking an atom to a topic."""
    response = await client.post(f"/api/v1/atoms/{sample_atom.id}/topics/{sample_topic.id}")

    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Atom linked to topic successfully"
    assert data["atom_id"] == str(sample_atom.id)
    assert data["topic_id"] == str(sample_topic.id)


@pytest.mark.asyncio
async def test_link_atom_to_topic_with_position_and_note(client: AsyncClient, sample_atom: Atom, sample_topic: Topic):
    """Test linking atom to topic with position and note."""
    response = await client.post(
        f"/api/v1/atoms/{sample_atom.id}/topics/{sample_topic.id}?position=1&note=Important+context"
    )

    assert response.status_code == 201
    data = response.json()
    assert data["atom_id"] == str(sample_atom.id)
    assert data["topic_id"] == str(sample_topic.id)


@pytest.mark.asyncio
async def test_link_atom_to_topic_atom_not_found(client: AsyncClient, sample_topic: Topic):
    """Test 404 error when atom doesn't exist."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await client.post(f"/api/v1/atoms/{nonexistent_id}/topics/{sample_topic.id}")

    assert response.status_code == 404
    data = response.json()
    assert "Atom" in data["detail"]


@pytest.mark.asyncio
async def test_link_atom_to_topic_topic_not_found(client: AsyncClient, sample_atom: Atom):
    """Test 404 error when topic doesn't exist."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await client.post(f"/api/v1/atoms/{sample_atom.id}/topics/{nonexistent_id}")

    assert response.status_code == 404
    data = response.json()
    assert "Topic" in data["detail"]


@pytest.mark.asyncio
async def test_link_atom_to_topic_duplicate(
    client: AsyncClient, sample_atom: Atom, sample_topic: Topic, db_session: AsyncSession
):
    """Test 409 conflict when link already exists."""
    topic_atom = TopicAtom(
        topic_id=sample_topic.id,
        atom_id=sample_atom.id,
    )
    db_session.add(topic_atom)
    await db_session.commit()

    response = await client.post(f"/api/v1/atoms/{sample_atom.id}/topics/{sample_topic.id}")

    assert response.status_code == 409
    data = response.json()
    assert "already linked" in data["detail"]


@pytest.mark.asyncio
async def test_get_topic_atoms_empty(client: AsyncClient, sample_topic: Topic):
    """Test getting atoms for a topic with no atoms."""
    response = await client.get(f"/api/v1/topics/{sample_topic.id}/atoms")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
async def test_get_topic_atoms(
    client: AsyncClient, sample_topic: Topic, multiple_atoms: list[Atom], db_session: AsyncSession
):
    """Test getting atoms for a topic."""
    for i, atom in enumerate(multiple_atoms[:3]):
        topic_atom = TopicAtom(
            topic_id=sample_topic.id,
            atom_id=atom.id,
            position=i,
            note=f"Note for atom {i}",
        )
        db_session.add(topic_atom)
    await db_session.commit()

    response = await client.get(f"/api/v1/topics/{sample_topic.id}/atoms")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert all("id" in atom for atom in data)
    assert all("type" in atom for atom in data)
    assert all("title" in atom for atom in data)


@pytest.mark.asyncio
async def test_get_topic_atoms_topic_not_found(client: AsyncClient):
    """Test 404 error when topic doesn't exist."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/topics/{nonexistent_id}/atoms")

    assert response.status_code == 404
    data = response.json()
    assert "Topic" in data["detail"]


@pytest.mark.asyncio
async def test_get_topic_messages_empty(client: AsyncClient, sample_topic: Topic):
    """Test getting messages for a topic with no messages."""
    response = await client.get(f"/api/v1/topics/{sample_topic.id}/messages")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.asyncio
async def test_get_topic_messages(client: AsyncClient, sample_message: Message):
    """Test getting messages for a topic."""
    topic_id = sample_message.topic_id

    response = await client.get(f"/api/v1/topics/{topic_id}/messages")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    message = data[0]
    assert message["id"] == str(sample_message.id)
    assert message["content"] == sample_message.content
    assert "author_name" in message
    assert "source_name" in message


@pytest.mark.asyncio
async def test_get_topic_messages_multiple(
    client: AsyncClient, sample_topic: Topic, sample_user: User, sample_source: Source, db_session: AsyncSession
):
    """Test getting multiple messages for a topic."""
    for i in range(3):
        message = Message(
            external_message_id=f"msg_{i}",
            content=f"Message {i}",
            sent_at=datetime.now(UTC),
            source_id=sample_source.id,
            author_id=sample_user.id,
            topic_id=sample_topic.id,
        )
        db_session.add(message)
    await db_session.commit()

    response = await client.get(f"/api/v1/topics/{sample_topic.id}/messages")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


@pytest.mark.asyncio
async def test_get_topic_messages_topic_not_found(client: AsyncClient):
    """Test 404 error when topic doesn't exist."""
    nonexistent_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/topics/{nonexistent_id}/messages")

    assert response.status_code == 404
    data = response.json()
    assert "Topic" in data["detail"]


@pytest.mark.asyncio
async def test_bulk_approve_atoms_success(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test successful bulk approval of multiple atoms."""
    atom_ids = [str(atom.id) for atom in multiple_atoms[:3]]
    payload = {"atom_ids": atom_ids}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["approved_count"] == 3
    assert data["failed_ids"] == []
    assert data["errors"] == []

    for atom_id in atom_ids:
        atom_response = await client.get(f"/api/v1/atoms/{atom_id}")
        assert atom_response.status_code == 200
        atom_data = atom_response.json()
        assert atom_data["user_approved"] is True


@pytest.mark.asyncio
async def test_bulk_approve_atoms_partial_success(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test bulk approval with some non-existent atoms."""
    valid_atom_ids = [str(atom.id) for atom in multiple_atoms[:2]]
    invalid_atom_id = "00000000-0000-0000-0000-000000000000"
    atom_ids = valid_atom_ids + [invalid_atom_id]
    payload = {"atom_ids": atom_ids}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["approved_count"] == 2
    assert invalid_atom_id in data["failed_ids"]
    assert len(data["failed_ids"]) == 1
    assert len(data["errors"]) == 1
    assert "not found" in data["errors"][0].lower()

    for atom_id in valid_atom_ids:
        atom_response = await client.get(f"/api/v1/atoms/{atom_id}")
        atom_data = atom_response.json()
        assert atom_data["user_approved"] is True


@pytest.mark.asyncio
async def test_bulk_approve_atoms_invalid_uuid(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test bulk approval with invalid UUID format."""
    valid_atom_id = str(multiple_atoms[0].id)
    invalid_uuid = "not-a-valid-uuid"
    payload = {"atom_ids": [valid_atom_id, invalid_uuid]}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["approved_count"] == 1
    assert invalid_uuid in data["failed_ids"]
    assert len(data["errors"]) == 1
    assert "Invalid UUID format" in data["errors"][0]


@pytest.mark.asyncio
async def test_bulk_approve_atoms_empty_list(client: AsyncClient):
    """Test validation error for empty atom_ids list."""
    payload = {"atom_ids": []}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_bulk_approve_atoms_idempotent(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test that re-approving already approved atoms is idempotent."""
    atom_ids = [str(atom.id) for atom in multiple_atoms[:2]]
    payload = {"atom_ids": atom_ids}

    response1 = await client.post("/api/v1/atoms/bulk-approve", json=payload)
    assert response1.status_code == 200
    data1 = response1.json()
    assert data1["approved_count"] == 2

    response2 = await client.post("/api/v1/atoms/bulk-approve", json=payload)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["approved_count"] == 2
    assert data2["failed_ids"] == []


@pytest.mark.asyncio
async def test_bulk_approve_atoms_all_invalid(client: AsyncClient):
    """Test bulk approval when all atoms are invalid."""
    payload = {"atom_ids": ["invalid-uuid-1", "invalid-uuid-2", "00000000-0000-0000-0000-000000000000"]}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["approved_count"] == 0
    assert len(data["failed_ids"]) == 3
    assert len(data["errors"]) == 3


@pytest.mark.asyncio
async def test_bulk_approve_atoms_single_atom(client: AsyncClient, sample_atom: Atom):
    """Test bulk approval with a single atom."""
    payload = {"atom_ids": [str(sample_atom.id)]}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["approved_count"] == 1
    assert data["failed_ids"] == []
    assert data["errors"] == []

    atom_response = await client.get(f"/api/v1/atoms/{sample_atom.id}")
    atom_data = atom_response.json()
    assert atom_data["user_approved"] is True


@pytest.mark.asyncio
async def test_bulk_approve_atoms_missing_field(client: AsyncClient):
    """Test validation error for missing atom_ids field."""
    payload = {}

    response = await client.post("/api/v1/atoms/bulk-approve", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_bulk_archive_atoms_success(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test successful bulk archiving of multiple atoms."""
    atom_ids = [str(atom.id) for atom in multiple_atoms[:3]]
    payload = {"atom_ids": atom_ids}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["archived_count"] == 3
    assert data["failed_ids"] == []
    assert data["errors"] == []

    for atom_id in atom_ids:
        atom_response = await client.get(f"/api/v1/atoms/{atom_id}")
        assert atom_response.status_code == 200
        atom_data = atom_response.json()
        assert atom_data["archived"] is True
        assert atom_data["archived_at"] is not None


@pytest.mark.asyncio
async def test_bulk_archive_atoms_partial_success(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test bulk archiving with some non-existent atoms."""
    valid_atom_ids = [str(atom.id) for atom in multiple_atoms[:2]]
    invalid_atom_id = "00000000-0000-0000-0000-000000000000"
    atom_ids = valid_atom_ids + [invalid_atom_id]
    payload = {"atom_ids": atom_ids}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["archived_count"] == 2
    assert invalid_atom_id in data["failed_ids"]
    assert len(data["failed_ids"]) == 1
    assert len(data["errors"]) == 1
    assert "not found" in data["errors"][0].lower()

    for atom_id in valid_atom_ids:
        atom_response = await client.get(f"/api/v1/atoms/{atom_id}")
        atom_data = atom_response.json()
        assert atom_data["archived"] is True


@pytest.mark.asyncio
async def test_bulk_archive_atoms_invalid_uuid(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test bulk archiving with invalid UUID format."""
    valid_atom_id = str(multiple_atoms[0].id)
    invalid_uuid = "not-a-valid-uuid"
    payload = {"atom_ids": [valid_atom_id, invalid_uuid]}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["archived_count"] == 1
    assert invalid_uuid in data["failed_ids"]
    assert len(data["errors"]) == 1
    assert "Invalid UUID format" in data["errors"][0]


@pytest.mark.asyncio
async def test_bulk_archive_atoms_empty_list(client: AsyncClient):
    """Test validation error for empty atom_ids list."""
    payload = {"atom_ids": []}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_bulk_archive_atoms_idempotent(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test that re-archiving already archived atoms is idempotent."""
    atom_ids = [str(atom.id) for atom in multiple_atoms[:2]]
    payload = {"atom_ids": atom_ids}

    response1 = await client.post("/api/v1/atoms/bulk-archive", json=payload)
    assert response1.status_code == 200
    data1 = response1.json()
    assert data1["archived_count"] == 2

    response2 = await client.post("/api/v1/atoms/bulk-archive", json=payload)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["archived_count"] == 2
    assert data2["failed_ids"] == []


@pytest.mark.asyncio
async def test_bulk_archive_atoms_all_invalid(client: AsyncClient):
    """Test bulk archiving when all atoms are invalid."""
    payload = {"atom_ids": ["invalid-uuid-1", "invalid-uuid-2", "00000000-0000-0000-0000-000000000000"]}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["archived_count"] == 0
    assert len(data["failed_ids"]) == 3
    assert len(data["errors"]) == 3


@pytest.mark.asyncio
async def test_bulk_archive_atoms_single_atom(client: AsyncClient, sample_atom: Atom):
    """Test bulk archiving with a single atom."""
    payload = {"atom_ids": [str(sample_atom.id)]}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["archived_count"] == 1
    assert data["failed_ids"] == []
    assert data["errors"] == []

    atom_response = await client.get(f"/api/v1/atoms/{sample_atom.id}")
    atom_data = atom_response.json()
    assert atom_data["archived"] is True
    assert atom_data["archived_at"] is not None


@pytest.mark.asyncio
async def test_bulk_archive_atoms_missing_field(client: AsyncClient):
    """Test validation error for missing atom_ids field."""
    payload = {}

    response = await client.post("/api/v1/atoms/bulk-archive", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_bulk_delete_atoms_success(client: AsyncClient, multiple_atoms: list[Atom], db_session: AsyncSession):
    """Test successful bulk deletion of multiple atoms."""
    atom_ids = [str(atom.id) for atom in multiple_atoms[:3]]
    payload = {"atom_ids": atom_ids}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_count"] == 3
    assert data["failed_ids"] == []
    assert data["errors"] == []

    for atom_id in atom_ids:
        db_session.expire_all()
        atom_uuid = uuid.UUID(atom_id)
        deleted_atom = await db_session.get(Atom, atom_uuid)
        assert deleted_atom is None


@pytest.mark.asyncio
async def test_bulk_delete_atoms_partial_success(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test bulk deletion with some non-existent atoms."""
    valid_atom_ids = [str(atom.id) for atom in multiple_atoms[:2]]
    invalid_atom_id = "00000000-0000-0000-0000-000000000000"
    atom_ids = valid_atom_ids + [invalid_atom_id]
    payload = {"atom_ids": atom_ids}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_count"] == 2
    assert invalid_atom_id in data["failed_ids"]
    assert len(data["failed_ids"]) == 1
    assert len(data["errors"]) == 1
    assert "not found" in data["errors"][0].lower()


@pytest.mark.asyncio
async def test_bulk_delete_atoms_invalid_uuid(client: AsyncClient, multiple_atoms: list[Atom]):
    """Test bulk deletion with invalid UUID format."""
    valid_atom_id = str(multiple_atoms[0].id)
    invalid_uuid = "not-a-valid-uuid"
    payload = {"atom_ids": [valid_atom_id, invalid_uuid]}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_count"] == 1
    assert invalid_uuid in data["failed_ids"]
    assert len(data["errors"]) == 1
    assert "Invalid UUID format" in data["errors"][0]


@pytest.mark.asyncio
async def test_bulk_delete_atoms_empty_list(client: AsyncClient):
    """Test validation error for empty atom_ids list."""
    payload = {"atom_ids": []}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_bulk_delete_atoms_cascade_relationships(
    client: AsyncClient, sample_atom: Atom, sample_topic: Topic, db_session: AsyncSession
):
    """Test that cascade delete removes related records (atom_links, topic_atoms, atom_versions)."""
    from app.models.atom import AtomLink, TopicAtom
    from app.models.atom_version import AtomVersion

    atom_id = sample_atom.id

    atom_link = AtomLink(
        from_atom_id=atom_id,
        to_atom_id=atom_id,
        link_type="relates_to",
        strength=0.8,
    )
    db_session.add(atom_link)

    topic_atom = TopicAtom(
        topic_id=sample_topic.id,
        atom_id=atom_id,
        position=1,
        note="Test relationship",
    )
    db_session.add(topic_atom)

    atom_version = AtomVersion(
        atom_id=atom_id,
        version=1,
        data={"title": "Version 1"},
        approved=False,
    )
    db_session.add(atom_version)
    await db_session.commit()

    payload = {"atom_ids": [str(atom_id)]}
    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_count"] == 1
    assert data["failed_ids"] == []

    db_session.expire_all()
    deleted_atom = await db_session.get(Atom, atom_id)
    assert deleted_atom is None

    from sqlmodel import select

    links_query = select(AtomLink).where((AtomLink.from_atom_id == atom_id) | (AtomLink.to_atom_id == atom_id))
    links_result = await db_session.execute(links_query)
    assert links_result.scalars().all() == []

    topic_atoms_query = select(TopicAtom).where(TopicAtom.atom_id == atom_id)
    topic_atoms_result = await db_session.execute(topic_atoms_query)
    assert topic_atoms_result.scalars().all() == []

    versions_query = select(AtomVersion).where(AtomVersion.atom_id == atom_id)
    versions_result = await db_session.execute(versions_query)
    assert versions_result.scalars().all() == []


@pytest.mark.asyncio
async def test_bulk_delete_atoms_all_invalid(client: AsyncClient):
    """Test bulk deletion when all atoms are invalid."""
    payload = {"atom_ids": ["invalid-uuid-1", "invalid-uuid-2", "00000000-0000-0000-0000-000000000000"]}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_count"] == 0
    assert len(data["failed_ids"]) == 3
    assert len(data["errors"]) == 3


@pytest.mark.asyncio
async def test_bulk_delete_atoms_single_atom(client: AsyncClient, sample_atom: Atom, db_session: AsyncSession):
    """Test bulk deletion with a single atom."""
    atom_id = sample_atom.id
    payload = {"atom_ids": [str(atom_id)]}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["deleted_count"] == 1
    assert data["failed_ids"] == []
    assert data["errors"] == []

    db_session.expire_all()
    deleted_atom = await db_session.get(Atom, atom_id)
    assert deleted_atom is None


@pytest.mark.asyncio
async def test_bulk_delete_atoms_missing_field(client: AsyncClient):
    """Test validation error for missing atom_ids field."""
    payload = {}

    response = await client.post("/api/v1/atoms/bulk-delete", json=payload)

    assert response.status_code == 422
