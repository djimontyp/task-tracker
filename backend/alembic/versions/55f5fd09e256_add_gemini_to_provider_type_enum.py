"""add_gemini_to_provider_type_enum

Revision ID: 55f5fd09e256
Revises: 18b82dace293
Create Date: 2026-01-10 14:15:29.653459

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '55f5fd09e256'
down_revision: Union[str, Sequence[str], None] = '18b82dace293'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'gemini' value to providertype enum."""
    op.execute("ALTER TYPE providertype ADD VALUE IF NOT EXISTS 'gemini'")


def downgrade() -> None:
    """Cannot remove enum value in PostgreSQL - requires recreating the type."""
    # PostgreSQL does not support removing enum values directly
    # This would require recreating the enum type and updating all references
    pass
