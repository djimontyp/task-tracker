"""Merge legacy settings removal

Revision ID: d4e5f6a8b9
Revises: 2e5c5bba615b, c3d4e5f6a7b8
Create Date: 2025-10-02 23:48:21.945228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a8b9'
down_revision: Union[str, Sequence[str], None] = ('2e5c5bba615b', 'c3d4e5f6a7b8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop legacy settings table if it still exists."""
    op.execute("DROP TABLE IF EXISTS settings")


def downgrade() -> None:
    """Recreate legacy settings table for downgrade."""
    op.create_table(
        "settings",
        sa.Column("telegram_bot_token_encrypted", sa.Text(), nullable=True),
        sa.Column("telegram_webhook_base_url", sa.String(length=500), nullable=True),
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
        sa.Column("id", sa.BigInteger(), primary_key=True, nullable=False),
    )
