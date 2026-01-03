"""Add custom_prompt to agent_config

Revision ID: 04caae1822ca
Revises: f8aa3f6bdaa4
Create Date: 2026-01-03 22:40:37.302018

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '04caae1822ca'
down_revision: Union[str, Sequence[str], None] = 'f8aa3f6bdaa4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add custom_prompt column to agent_configs table."""
    op.add_column('agent_configs', sa.Column('custom_prompt', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove custom_prompt column from agent_configs table."""
    op.drop_column('agent_configs', 'custom_prompt')
