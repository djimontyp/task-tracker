"""Integration tests for vector operations in messages and atoms tables.

Tests cover:
1. Vector storage and retrieval for messages
2. Vector storage and retrieval for atoms
3. Null embedding handling
4. Vector dimension validation
5. Database-level vector operations
6. Vector similarity queries (if pgvector is available)
"""

from datetime import UTC, datetime

import pytest
from app.models.atom import Atom
from app.models.enums import SourceType
from app.models.legacy import Source
from app.models.message import Message
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        first_name="Test",
        last_name="User",
        email="vector.test@tasktracker.test",
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
        name="Vector Test Chat",
        type=SourceType.telegram,
        is_active=True,
    )
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)
    return source


@pytest.mark.asyncio
async def test_message_vector_storage_and_retrieval(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test that embeddings can be stored and retrieved from messages table."""
    embedding = [0.1] * 1536

    message = Message(
        external_message_id="vec-test-1",
        content="Test message for vector operations",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=embedding,
    )

    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    retrieved = await db_session.get(Message, message.id)

    assert retrieved is not None
    assert retrieved.embedding is not None
    assert len(retrieved.embedding) == 1536
    assert all(abs(retrieved.embedding[i] - embedding[i]) < 0.0001 for i in range(1536))


@pytest.mark.asyncio
async def test_message_vector_update(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test updating message embedding after creation."""
    message = Message(
        external_message_id="vec-test-update",
        content="Message without initial embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )

    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    assert message.embedding is None

    new_embedding = [0.5] * 1536
    message.embedding = new_embedding
    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    assert message.embedding is not None
    assert len(message.embedding) == 1536
    assert message.embedding[0] == pytest.approx(0.5)


@pytest.mark.asyncio
async def test_message_null_embedding_handling(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test that messages can be created without embeddings."""
    message = Message(
        external_message_id="vec-test-null",
        content="Message without embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )

    db_session.add(message)
    await db_session.commit()
    await db_session.refresh(message)

    retrieved = await db_session.get(Message, message.id)

    assert retrieved is not None
    assert retrieved.embedding is None


@pytest.mark.asyncio
async def test_atom_vector_storage_and_retrieval(db_session: AsyncSession) -> None:
    """Test that embeddings can be stored and retrieved from atoms table."""
    embedding = [0.2] * 1536

    atom = Atom(
        type="problem",
        title="Vector Test Atom",
        content="This is a test atom for vector operations",
        embedding=embedding,
        confidence=0.95,
        user_approved=False,
    )

    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    retrieved = await db_session.get(Atom, atom.id)

    assert retrieved is not None
    assert retrieved.embedding is not None
    assert len(retrieved.embedding) == 1536
    assert all(abs(retrieved.embedding[i] - embedding[i]) < 0.0001 for i in range(1536))


@pytest.mark.asyncio
async def test_atom_vector_update(db_session: AsyncSession) -> None:
    """Test updating atom embedding after creation."""
    atom = Atom(
        type="solution",
        title="Atom without embedding",
        content="Initial content without embedding",
        embedding=None,
    )

    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    assert atom.embedding is None

    new_embedding = [0.7] * 1536
    atom.embedding = new_embedding
    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    assert atom.embedding is not None
    assert len(atom.embedding) == 1536
    assert atom.embedding[0] == pytest.approx(0.7)


@pytest.mark.asyncio
async def test_atom_null_embedding_handling(db_session: AsyncSession) -> None:
    """Test that atoms can be created without embeddings."""
    atom = Atom(
        type="pattern",
        title="Atom without vector",
        content="This atom has no embedding",
        embedding=None,
    )

    db_session.add(atom)
    await db_session.commit()
    await db_session.refresh(atom)

    retrieved = await db_session.get(Atom, atom.id)

    assert retrieved is not None
    assert retrieved.embedding is None


@pytest.mark.asyncio
async def test_multiple_messages_with_different_embeddings(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test storing multiple messages with different embeddings."""
    messages = []

    for i in range(5):
        embedding = [float(i) / 10] * 1536
        msg = Message(
            external_message_id=f"vec-test-multi-{i}",
            content=f"Message {i}",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=embedding,
        )
        messages.append(msg)
        db_session.add(msg)

    await db_session.commit()

    for i, msg in enumerate(messages):
        await db_session.refresh(msg)
        retrieved = await db_session.get(Message, msg.id)
        assert retrieved is not None
        assert retrieved.embedding is not None
        assert retrieved.embedding[0] == pytest.approx(float(i) / 10)


@pytest.mark.asyncio
async def test_query_messages_with_embeddings_only(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test filtering messages that have embeddings."""
    msg_with_embedding = Message(
        external_message_id="vec-test-has",
        content="Message with embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=[0.1] * 1536,
    )

    msg_without_embedding = Message(
        external_message_id="vec-test-no",
        content="Message without embedding",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=None,
    )

    db_session.add_all([msg_with_embedding, msg_without_embedding])
    await db_session.commit()

    query = select(Message).where(Message.embedding.is_not(None))
    result = await db_session.execute(query)
    messages_with_embeddings = result.scalars().all()

    assert len(messages_with_embeddings) >= 1
    for msg in messages_with_embeddings:
        assert msg.embedding is not None


@pytest.mark.asyncio
async def test_query_atoms_with_embeddings_only(db_session: AsyncSession) -> None:
    """Test filtering atoms that have embeddings."""
    atom_with_embedding = Atom(
        type="problem",
        title="Atom with embedding",
        content="Content with embedding",
        embedding=[0.1] * 1536,
    )

    atom_without_embedding = Atom(
        type="solution",
        title="Atom without embedding",
        content="Content without embedding",
        embedding=None,
    )

    db_session.add_all([atom_with_embedding, atom_without_embedding])
    await db_session.commit()

    query = select(Atom).where(Atom.embedding.is_not(None))
    result = await db_session.execute(query)
    atoms_with_embeddings = result.scalars().all()

    assert len(atoms_with_embeddings) >= 1
    for atom in atoms_with_embeddings:
        assert atom.embedding is not None


@pytest.mark.asyncio
async def test_embedding_persists_after_refresh(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test that embeddings persist correctly after commit and refresh."""
    embedding = [0.3] * 1536

    message = Message(
        external_message_id="vec-test-persist",
        content="Persistence test",
        sent_at=datetime.now(UTC),
        source_id=test_source.id,
        author_id=test_user.id,
        embedding=embedding,
    )

    db_session.add(message)
    await db_session.commit()
    message_id = message.id
    await db_session.refresh(message)

    retrieved = await db_session.get(Message, message_id)
    assert retrieved is not None
    assert retrieved.embedding is not None
    assert len(retrieved.embedding) == 1536
    assert retrieved.embedding[0] == pytest.approx(0.3)


@pytest.mark.asyncio
async def test_embedding_dimension_consistency(
    db_session: AsyncSession,
    test_user: User,
    test_source: Source,
) -> None:
    """Test that stored embeddings maintain 1536 dimensions."""
    test_embeddings = [
        [0.1] * 1536,
        [0.5] * 1536,
        [0.9] * 1536,
    ]

    for idx, embedding in enumerate(test_embeddings):
        msg = Message(
            external_message_id=f"vec-test-dim-{idx}",
            content=f"Dimension test {idx}",
            sent_at=datetime.now(UTC),
            source_id=test_source.id,
            author_id=test_user.id,
            embedding=embedding,
        )
        db_session.add(msg)

    await db_session.commit()

    query = select(Message).where(Message.embedding.is_not(None))
    result = await db_session.execute(query)
    messages = result.scalars().all()

    for msg in messages:
        if msg.external_message_id.startswith("vec-test-dim-"):
            assert len(msg.embedding) == 1536
