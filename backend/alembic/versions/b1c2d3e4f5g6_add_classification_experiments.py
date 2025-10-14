"""Add classification experiments table

Revision ID: b1c2d3e4f5g6
Revises: a8ec482173f8
Create Date: 2025-10-14 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b1c2d3e4f5g6"
down_revision: Union[str, None] = "0258925ce803"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create classification_experiments table."""
    op.create_table(
        "classification_experiments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "provider_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("message_count", sa.Integer(), nullable=False),
        sa.Column("topics_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("avg_confidence", sa.Float(), nullable=True),
        sa.Column("avg_execution_time_ms", sa.Float(), nullable=True),
        sa.Column("confusion_matrix", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "classification_results",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["provider_id"],
            ["llm_providers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Drop classification_experiments table."""
    op.drop_table("classification_experiments")
