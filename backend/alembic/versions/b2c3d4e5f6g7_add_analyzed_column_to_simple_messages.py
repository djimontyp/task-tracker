"""add analyzed column to simple_messages

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-09-27 13:40:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6g7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add analyzed column to simple_messages table."""
    op.add_column(
        "simple_messages",
        sa.Column("analyzed", sa.Boolean(), nullable=False, default=False),
    )

    # Create an index on the analyzed column for efficient queries
    op.create_index("ix_simple_messages_analyzed", "simple_messages", ["analyzed"])


def downgrade() -> None:
    """Remove analyzed column from simple_messages table."""
    op.drop_index("ix_simple_messages_analyzed", table_name="simple_messages")
    op.drop_column("simple_messages", "analyzed")
