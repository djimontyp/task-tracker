"""add_hnsw_vector_indexes

Revision ID: 706c956e4f2b
Revises: 9b7be1927504
Create Date: 2025-10-27 23:32:03.917697

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "706c956e4f2b"
down_revision: Union[str, Sequence[str], None] = "9b7be1927504"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create HNSW indexes on vector columns for semantic search."""
    op.execute("""
        CREATE INDEX idx_messages_embedding_hnsw
        ON messages USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)

    op.execute("""
        CREATE INDEX idx_atoms_embedding_hnsw
        ON atoms USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)


def downgrade() -> None:
    """Drop HNSW indexes."""
    op.execute("DROP INDEX IF EXISTS idx_messages_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS idx_atoms_embedding_hnsw")
