"""Tests for pgvector extension setup and functionality.

NOTE: These tests are designed to work with SQLite for testing.
In production, PostgreSQL with pgvector extension is required.

Tests cover:
1. Vector column existence in schema
2. Vector storage and retrieval
3. Embedding dimension validation
4. Basic vector operations (not available in SQLite)
"""

import os

import pytest
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
class TestPgvectorSetup:
    """Test suite for pgvector extension configuration.

    These tests validate the database schema setup for vector operations.
    Full vector similarity operations require PostgreSQL with pgvector extension.
    """

    async def test_messages_table_has_embedding_column(self, db_session: AsyncSession) -> None:
        """Verify messages table has embedding column in schema."""
        from sqlalchemy import inspect

        def check_column(connection):
            inspector = inspect(connection)
            columns = inspector.get_columns("messages")
            column_names = [col["name"] for col in columns]
            return "embedding" in column_names

        has_embedding = await db_session.connection(execution_options={"synchronize_session": False})
        result = await has_embedding.run_sync(check_column)

        assert result, "messages table should have embedding column"

    async def test_atoms_table_has_embedding_column(self, db_session: AsyncSession) -> None:
        """Verify atoms table has embedding column in schema."""
        from sqlalchemy import inspect

        def check_column(connection):
            inspector = inspect(connection)
            columns = inspector.get_columns("atoms")
            column_names = [col["name"] for col in columns]
            return "embedding" in column_names

        has_embedding = await db_session.connection(execution_options={"synchronize_session": False})
        result = await has_embedding.run_sync(check_column)

        assert result, "atoms table should have embedding column"

    async def test_embedding_column_accepts_null(self, db_session: AsyncSession) -> None:
        """Verify embedding column accepts NULL values."""
        from datetime import UTC, datetime

        from app.models.enums import SourceType
        from app.models.legacy import Source
        from app.models.message import Message
        from app.models.user import User

        user = User(
            first_name="Test",
            last_name="User",
            email="pgvector.test@tasktracker.test",
            is_active=True,
        )
        db_session.add(user)

        source = Source(
            name="PGVector Test Source",
            type=SourceType.telegram,
            is_active=True,
        )
        db_session.add(source)

        await db_session.commit()
        await db_session.refresh(user)
        await db_session.refresh(source)

        msg = Message(
            external_message_id="pgvector_test_null",
            content="Message without embedding",
            sent_at=datetime.now(UTC),
            source_id=source.id,
            author_id=user.id,
            embedding=None,
        )
        db_session.add(msg)
        await db_session.commit()
        await db_session.refresh(msg)

        assert msg.embedding is None

    async def test_embedding_column_accepts_vector(self, db_session: AsyncSession) -> None:
        """Verify embedding column accepts vector data."""
        from datetime import UTC, datetime

        from app.models.enums import SourceType
        from app.models.legacy import Source
        from app.models.message import Message
        from app.models.user import User

        user = User(
            first_name="Test",
            last_name="User",
            email="pgvector.vec@tasktracker.test",
            is_active=True,
        )
        db_session.add(user)

        source = Source(
            name="PGVector Test Source Vec",
            type=SourceType.telegram,
            is_active=True,
        )
        db_session.add(source)

        await db_session.commit()
        await db_session.refresh(user)
        await db_session.refresh(source)

        embedding = [0.1] * 1536

        msg = Message(
            external_message_id="pgvector_test_vec",
            content="Message with embedding",
            sent_at=datetime.now(UTC),
            source_id=source.id,
            author_id=user.id,
            embedding=embedding,
        )
        db_session.add(msg)
        await db_session.commit()
        await db_session.refresh(msg)

        assert msg.embedding is not None
        assert len(msg.embedding) == 1536
        assert msg.embedding[0] == pytest.approx(0.1)

    async def test_embedding_dimension_1536(self, db_session: AsyncSession) -> None:
        """Verify embeddings maintain 1536 dimensions (OpenAI text-embedding-3-small)."""
        from datetime import UTC, datetime

        from app.models.enums import SourceType
        from app.models.legacy import Source
        from app.models.message import Message
        from app.models.user import User

        user = User(
            first_name="Test",
            last_name="User",
            email="pgvector.dim@tasktracker.test",
            is_active=True,
        )
        db_session.add(user)

        source = Source(
            name="PGVector Test Source Dim",
            type=SourceType.telegram,
            is_active=True,
        )
        db_session.add(source)

        await db_session.commit()
        await db_session.refresh(user)
        await db_session.refresh(source)

        test_embeddings = [
            [0.1] * 1536,
            [0.5] * 1536,
            [0.9] * 1536,
        ]

        for idx, embedding in enumerate(test_embeddings):
            msg = Message(
                external_message_id=f"pgvector_dim_{idx}",
                content=f"Dimension test {idx}",
                sent_at=datetime.now(UTC),
                source_id=source.id,
                author_id=user.id,
                embedding=embedding,
            )
            db_session.add(msg)

        await db_session.commit()

        from app.models.message import Message
        from sqlalchemy import select

        result = await db_session.execute(
            select(Message).where(Message.external_message_id.like("pgvector_dim_%"))  # type: ignore[union-attr]
        )
        messages = result.scalars().all()

        assert len(messages) == 3
        for msg in messages:
            assert msg.embedding is not None
            assert len(msg.embedding) == 1536


@pytest.mark.skipif(
    os.getenv("TEST_DATABASE_URL", "sqlite").startswith("sqlite"), reason="Requires PostgreSQL with pgvector extension"
)
@pytest.mark.asyncio
class TestPgvectorOperations:
    """Test suite for pgvector-specific operations.

    These tests require PostgreSQL with pgvector extension installed.
    They are skipped by default in SQLite test environment.
    """

    async def test_pgvector_extension_installed(self, db_session: AsyncSession) -> None:
        """Verify pgvector extension is installed and enabled."""
        from sqlalchemy import text

        result = await db_session.execute(text("SELECT * FROM pg_extension WHERE extname = 'vector'"))
        extension = result.fetchone()

        assert extension is not None, "pgvector extension not installed"
        assert extension.extname == "vector"

    async def test_messages_embedding_index_exists(self, db_session: AsyncSession) -> None:
        """Verify HNSW index exists on messages.embedding."""
        from sqlalchemy import text

        result = await db_session.execute(
            text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'messages'
            AND indexname = 'messages_embedding_idx'
        """)
        )
        index = result.fetchone()

        assert index is not None, "messages_embedding_idx not found"
        assert "hnsw" in index.indexdef.lower(), "Index should use HNSW method"
        assert "vector_cosine_ops" in index.indexdef, "Index should use cosine distance"

    async def test_atoms_embedding_index_exists(self, db_session: AsyncSession) -> None:
        """Verify HNSW index exists on atoms.embedding."""
        from sqlalchemy import text

        result = await db_session.execute(
            text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'atoms'
            AND indexname = 'atoms_embedding_idx'
        """)
        )
        index = result.fetchone()

        assert index is not None, "atoms_embedding_idx not found"
        assert "hnsw" in index.indexdef.lower(), "Index should use HNSW method"
        assert "vector_cosine_ops" in index.indexdef, "Index should use cosine distance"

    async def test_cosine_similarity_calculation(self, db_session: AsyncSession) -> None:
        """Test pgvector cosine similarity operator works correctly."""
        from sqlalchemy import text

        vec1 = [1.0, 0.0, 0.0]
        vec2 = [1.0, 0.0, 0.0]
        vec3 = [0.0, 1.0, 0.0]

        result = await db_session.execute(
            text("""
            SELECT
                1 - (:vec1::vector <=> :vec2::vector) / 2 AS similarity_identical,
                1 - (:vec1::vector <=> :vec3::vector) / 2 AS similarity_orthogonal
        """),
            {"vec1": str(vec1), "vec2": str(vec2), "vec3": str(vec3)},
        )

        row = result.fetchone()

        assert abs(row.similarity_identical - 1.0) < 0.01
        assert abs(row.similarity_orthogonal - 0.5) < 0.1
