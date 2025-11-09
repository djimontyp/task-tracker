"""remove_notification_preferences_table

Revision ID: fa8965201e90
Revises: 966b8f9ef4f4
Create Date: 2025-11-09 16:38:10.739562

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa8965201e90'
down_revision: Union[str, Sequence[str], None] = '966b8f9ef4f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('notification_preferences')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        'notification_preferences',
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('email_enabled', sa.Boolean(), nullable=False),
        sa.Column('email_address', sa.String(length=255), nullable=True),
        sa.Column('telegram_enabled', sa.Boolean(), nullable=False),
        sa.Column('telegram_chat_id', sa.String(length=100), nullable=True),
        sa.Column('pending_threshold', sa.Integer(), nullable=False),
        sa.Column('digest_enabled', sa.Boolean(), nullable=False),
        sa.Column('digest_frequency', sa.String(), nullable=False),
        sa.Column('digest_time', sa.String(length=5), nullable=False),
        sa.Column('last_notification_sent', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
