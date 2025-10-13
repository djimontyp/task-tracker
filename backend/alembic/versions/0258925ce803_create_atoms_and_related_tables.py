"""create atoms and related tables

Revision ID: 0258925ce803
Revises: a8ec482173f8
Create Date: 2025-10-13 13:43:01.795918

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0258925ce803'
down_revision: Union[str, Sequence[str], None] = 'a8ec482173f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create atoms table
    op.create_table(
        'atoms',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('user_approved', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('meta', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_atoms_title'), 'atoms', ['title'], unique=False)

    # Create atom_links table (bidirectional links between atoms)
    op.create_table(
        'atom_links',
        sa.Column('from_atom_id', sa.BigInteger(), nullable=False),
        sa.Column('to_atom_id', sa.BigInteger(), nullable=False),
        sa.Column('link_type', sa.String(length=20), nullable=False),
        sa.Column('strength', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['from_atom_id'], ['atoms.id'], ),
        sa.ForeignKeyConstraint(['to_atom_id'], ['atoms.id'], ),
        sa.PrimaryKeyConstraint('from_atom_id', 'to_atom_id')
    )

    # Create topic_atoms table (many-to-many: topics <-> atoms)
    op.create_table(
        'topic_atoms',
        sa.Column('topic_id', sa.BigInteger(), nullable=False),
        sa.Column('atom_id', sa.BigInteger(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['atom_id'], ['atoms.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
        sa.PrimaryKeyConstraint('topic_id', 'atom_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('topic_atoms')
    op.drop_table('atom_links')
    op.drop_index(op.f('ix_atoms_title'), table_name='atoms')
    op.drop_table('atoms')
