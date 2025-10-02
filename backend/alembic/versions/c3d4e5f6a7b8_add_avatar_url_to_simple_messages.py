"""add avatar url to simple_messages

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6g7
Create Date: 2025-10-02 20:06:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6g7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add avatar_url column to simple_messages."""
    op.add_column(
        "simple_messages",
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    """Remove avatar_url column from simple_messages."""
    op.drop_column("simple_messages", "avatar_url")
