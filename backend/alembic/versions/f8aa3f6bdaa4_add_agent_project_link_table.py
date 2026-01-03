"""Add agent project link table

Revision ID: f8aa3f6bdaa4
Revises: f3a1c52d26a6
Create Date: 2026-01-03 22:19:21.063299

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8aa3f6bdaa4'
down_revision: Union[str, Sequence[str], None] = 'f3a1c52d26a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create agent_project_links junction table."""
    op.create_table(
        'agent_project_links',
        sa.Column('agent_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['agent_id'], ['agent_configs.id'], name=op.f('agent_project_links_agent_id_fkey')),
        sa.ForeignKeyConstraint(['project_id'], ['project_configs.id'], name=op.f('agent_project_links_project_id_fkey')),
        sa.PrimaryKeyConstraint('agent_id', 'project_id', name=op.f('agent_project_links_pkey'))
    )


def downgrade() -> None:
    """Drop agent_project_links junction table."""
    op.drop_table('agent_project_links')
