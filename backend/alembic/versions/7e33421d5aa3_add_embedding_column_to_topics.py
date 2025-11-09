"""add_embedding_column_to_topics

Revision ID: 7e33421d5aa3
Revises: 0b564c832cf3
Create Date: 2025-11-04 00:50:16.901346

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7e33421d5aa3"
down_revision: Union[str, Sequence[str], None] = "0b564c832cf3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE topics ADD COLUMN IF NOT EXISTS embedding vector(1536)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE topics DROP COLUMN IF EXISTS embedding")
