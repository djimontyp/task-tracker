"""add i18n fields

Revision ID: 65d68f84e4e9
Revises: 294de4f0784e
Create Date: 2025-12-14 15:29:27.375247

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65d68f84e4e9'
down_revision: Union[str, Sequence[str], None] = '294de4f0784e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add i18n language fields with default 'uk' (Ukrainian)
    op.add_column(
        'project_configs',
        sa.Column('language', sa.String(length=10), nullable=False, server_default='uk')
    )
    op.add_column(
        'users',
        sa.Column('ui_language', sa.String(length=10), nullable=False, server_default='uk')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'ui_language')
    op.drop_column('project_configs', 'language')
