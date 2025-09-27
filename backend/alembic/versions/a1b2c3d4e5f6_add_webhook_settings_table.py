"""add_webhook_settings_table

Revision ID: a1b2c3d4e5f6
Revises: 7fd78d0a94e6
Create Date: 2025-09-27 02:52:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "7fd78d0a94e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add webhook_settings table for storing webhook configurations."""
    op.create_table(
        "webhook_settings",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, default=True),
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
        sa.PrimaryKeyConstraint("id"),
    )

    # Add index for faster lookups by name
    op.create_index(
        "ix_webhook_settings_name", "webhook_settings", ["name"], unique=True
    )
    op.create_index("ix_webhook_settings_is_active", "webhook_settings", ["is_active"])


def downgrade() -> None:
    """Remove webhook_settings table."""
    op.drop_index("ix_webhook_settings_is_active", table_name="webhook_settings")
    op.drop_index("ix_webhook_settings_name", table_name="webhook_settings")
    op.drop_table("webhook_settings")
