"""add_knowledge_extraction_runs

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-08 16:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create knowledge_extraction_runs table for extraction tracking with cancellation."""
    op.create_table(
        "knowledge_extraction_runs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("task_id", sa.String(length=255), nullable=True),
        sa.Column("agent_config_id", sa.UUID(), nullable=False),
        # Status
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("cancel_requested", sa.Boolean(), nullable=False, server_default="false"),
        # Progress counters
        sa.Column("message_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("messages_processed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("topics_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("atoms_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("links_created", sa.Integer(), nullable=False, server_default="0"),
        # Lifecycle timestamps
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        # Error tracking
        sa.Column("error", sa.String(length=2000), nullable=True),
        # Timestamps from mixin
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        # Constraints
        sa.ForeignKeyConstraint(
            ["agent_config_id"],
            ["agent_configs.id"],
            name=op.f("knowledge_extraction_runs_agent_config_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("knowledge_extraction_runs_pkey")),
    )

    # Index on status for filtering active/pending runs
    op.create_index(
        op.f("ix_knowledge_extraction_runs_status"),
        "knowledge_extraction_runs",
        ["status"],
        unique=False,
    )

    # Index on agent_config_id for faster lookups
    op.create_index(
        op.f("ix_knowledge_extraction_runs_agent_config_id"),
        "knowledge_extraction_runs",
        ["agent_config_id"],
        unique=False,
    )


def downgrade() -> None:
    """Drop knowledge_extraction_runs table."""
    op.drop_index(op.f("ix_knowledge_extraction_runs_agent_config_id"), table_name="knowledge_extraction_runs")
    op.drop_index(op.f("ix_knowledge_extraction_runs_status"), table_name="knowledge_extraction_runs")
    op.drop_table("knowledge_extraction_runs")
