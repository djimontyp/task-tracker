"""add_threading_and_language_fields

Revision ID: f3a1c52d26a6
Revises: 65d68f84e4e9
Create Date: 2025-12-28 23:12:08.131980

"""

from typing import Sequence, Union

import sqlmodel
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f3a1c52d26a6"
down_revision: Union[str, Sequence[str], None] = "65d68f84e4e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add threading and language fields to messages table."""
    # Add source-agnostic threading fields
    op.add_column(
        "messages",
        sa.Column(
            "source_channel_id",
            sqlmodel.sql.sqltypes.AutoString(length=100),
            nullable=True,
        ),
    )
    op.add_column(
        "messages",
        sa.Column(
            "source_thread_id",
            sqlmodel.sql.sqltypes.AutoString(length=100),
            nullable=True,
        ),
    )
    op.add_column(
        "messages",
        sa.Column(
            "source_parent_id",
            sqlmodel.sql.sqltypes.AutoString(length=100),
            nullable=True,
        ),
    )
    op.add_column(
        "messages",
        sa.Column(
            "detected_language",
            sqlmodel.sql.sqltypes.AutoString(length=10),
            nullable=True,
        ),
    )

    # Create indexes for efficient batching queries
    op.create_index(
        op.f("ix_messages_source_channel_id"),
        "messages",
        ["source_channel_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_messages_source_thread_id"),
        "messages",
        ["source_thread_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove threading and language fields from messages table."""
    op.drop_index(op.f("ix_messages_source_thread_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_source_channel_id"), table_name="messages")
    op.drop_column("messages", "detected_language")
    op.drop_column("messages", "source_parent_id")
    op.drop_column("messages", "source_thread_id")
    op.drop_column("messages", "source_channel_id")
