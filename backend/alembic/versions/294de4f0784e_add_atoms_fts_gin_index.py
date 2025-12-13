"""add_atoms_fts_gin_index

Revision ID: 294de4f0784e
Revises: fa8965201e90
Create Date: 2025-12-13 16:44:12.089530

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '294de4f0784e'
down_revision: Union[str, Sequence[str], None] = 'fa8965201e90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Create GIN index for Full-Text Search on atoms table.
    Uses 'simple' configuration for language-independent search.
    Searches across title and content fields.
    """
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_atoms_fts
        ON atoms USING GIN (to_tsvector('simple', title || ' ' || content))
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS idx_atoms_fts")
