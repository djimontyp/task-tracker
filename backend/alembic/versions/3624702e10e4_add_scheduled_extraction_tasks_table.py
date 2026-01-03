"""add_scheduled_extraction_tasks_table

Revision ID: 3624702e10e4
Revises: 04caae1822ca
Create Date: 2026-01-03 22:44:31.939534

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "3624702e10e4"
down_revision: Union[str, Sequence[str], None] = "04caae1822ca"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create scheduled_extraction_tasks table."""
    op.create_table(
        "scheduled_extraction_tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cron_schedule", sa.String(length=100), nullable=False),
        sa.Column("agent_id", sa.UUID(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        # Filters
        sa.Column("channel_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("min_score", sa.Float(), nullable=True),
        sa.Column("lookback_hours", sa.Integer(), nullable=False, server_default="24"),
        # Auto-approve config
        sa.Column("auto_approve_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("confidence_threshold", sa.Float(), nullable=True),
        sa.Column("allowed_atom_types", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        # Execution tracking
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        # Constraints
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["agent_configs.id"],
            name=op.f("scheduled_extraction_tasks_agent_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("scheduled_extraction_tasks_pkey")),
    )

    # Create index on agent_id for faster lookups
    op.create_index(
        op.f("ix_scheduled_extraction_tasks_agent_id"),
        "scheduled_extraction_tasks",
        ["agent_id"],
        unique=False,
    )

    # Create index on is_active for filtering active tasks
    op.create_index(
        op.f("ix_scheduled_extraction_tasks_is_active"),
        "scheduled_extraction_tasks",
        ["is_active"],
        unique=False,
    )


def downgrade() -> None:
    """Drop scheduled_extraction_tasks table."""
    op.drop_index(op.f("ix_scheduled_extraction_tasks_is_active"), table_name="scheduled_extraction_tasks")
    op.drop_index(op.f("ix_scheduled_extraction_tasks_agent_id"), table_name="scheduled_extraction_tasks")
    op.drop_table("scheduled_extraction_tasks")
