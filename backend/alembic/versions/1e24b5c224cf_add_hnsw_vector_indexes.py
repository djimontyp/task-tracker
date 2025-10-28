"""add hnsw vector indexes

Revision ID: 1e24b5c224cf
Revises: 706c956e4f2b
Create Date: 2025-10-27 23:46:10.933012

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1e24b5c224cf"
down_revision: Union[str, Sequence[str], None] = "706c956e4f2b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create HNSW indexes for vector similarity search on messages and atoms."""
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_messages_embedding_hnsw
        ON messages USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_atoms_embedding_hnsw
        ON atoms USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)


def downgrade() -> None:
    """Remove HNSW indexes."""
    op.execute("DROP INDEX IF EXISTS idx_atoms_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS idx_messages_embedding_hnsw")
