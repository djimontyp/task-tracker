"""add_updated_at_to_atom_links_and_topic_atoms

Revision ID: 689e9e04ad3a
Revises: b1c2d3e4f5g6
Create Date: 2025-10-14 02:29:36.302365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '689e9e04ad3a'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5g6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add updated_at columns to atom_links and topic_atoms tables."""
    op.add_column(
        "atom_links",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )
    op.add_column(
        "topic_atoms",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    """Remove updated_at columns from atom_links and topic_atoms tables."""
    op.drop_column("topic_atoms", "updated_at")
    op.drop_column("atom_links", "updated_at")
