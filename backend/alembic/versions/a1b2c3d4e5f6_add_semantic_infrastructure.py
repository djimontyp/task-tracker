"""add_semantic_infrastructure

Revision ID: a1b2c3d4e5f6
Revises: 3624702e10e4
Create Date: 2026-01-07 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "3624702e10e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add semantic infrastructure columns.

    - topics.is_active: boolean with index for soft delete support
    - topic_atoms.similarity_score: float for semantic similarity between topic and atom
    """
    # Add is_active column to topics table with default=True
    op.add_column(
        "topics",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    # Create index on is_active for filtering active topics
    op.create_index(
        op.f("ix_topics_is_active"),
        "topics",
        ["is_active"],
        unique=False,
    )

    # Add similarity_score column to topic_atoms table (nullable)
    op.add_column(
        "topic_atoms",
        sa.Column("similarity_score", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    """Remove semantic infrastructure columns."""
    # Drop similarity_score from topic_atoms
    op.drop_column("topic_atoms", "similarity_score")

    # Drop index and column from topics
    op.drop_index(op.f("ix_topics_is_active"), table_name="topics")
    op.drop_column("topics", "is_active")
