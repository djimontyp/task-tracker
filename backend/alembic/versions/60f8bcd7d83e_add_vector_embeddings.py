"""add_vector_embeddings

Revision ID: 60f8bcd7d83e
Revises: 689e9e04ad3a
Create Date: 2025-10-16 13:08:33.206102

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision: str = "60f8bcd7d83e"
down_revision: Union[str, Sequence[str], None] = "689e9e04ad3a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add vector embedding columns and HNSW indexes for semantic search."""
    # Add vector columns to messages table
    op.add_column("messages", sa.Column("embedding", Vector(1536), nullable=True))

    # Add vector columns to atoms table
    op.add_column("atoms", sa.Column("embedding", Vector(1536), nullable=True))

    # Create HNSW indexes for efficient vector search
    # Using HNSW instead of IVFFlat for better performance on small datasets
    # IVFFlat requires training data (minimum 1000 vectors)

    # For messages (use HNSW with cosine distance)
    op.execute("""
        CREATE INDEX IF NOT EXISTS messages_embedding_idx
        ON messages USING hnsw (embedding vector_cosine_ops)
    """)

    # For atoms (use HNSW with cosine distance)
    op.execute("""
        CREATE INDEX IF NOT EXISTS atoms_embedding_idx
        ON atoms USING hnsw (embedding vector_cosine_ops)
    """)


def downgrade() -> None:
    """Remove vector embedding columns and indexes."""
    # Drop indexes first
    op.execute("DROP INDEX IF EXISTS messages_embedding_idx")
    op.execute("DROP INDEX IF EXISTS atoms_embedding_idx")

    # Drop columns
    op.drop_column("messages", "embedding")
    op.drop_column("atoms", "embedding")
