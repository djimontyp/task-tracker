"""add message status and history tables

Revision ID: 0b564c832cf3
Revises: 0a5aba48aca0
Create Date: 2025-11-02 21:54:29.577803

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "0b564c832cf3"
down_revision: Union[str, Sequence[str], None] = "0a5aba48aca0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add status fields to messages table
    op.add_column("messages", sa.Column("status", sa.String(20), nullable=True, server_default="pending"))
    op.add_column("messages", sa.Column("approved_at", sa.DateTime(), nullable=True))
    op.add_column("messages", sa.Column("rejected_at", sa.DateTime(), nullable=True))
    op.add_column("messages", sa.Column("rejection_reason", sa.String(50), nullable=True))
    op.add_column("messages", sa.Column("rejection_comment", sa.Text(), nullable=True))

    # Index for filtering by status
    op.create_index("ix_messages_status", "messages", ["status"])

    # Create message_history table
    op.create_table(
        "message_history",
        sa.Column("id", UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("message_id", UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("from_topic_id", UUID(as_uuid=True), nullable=True),
        sa.Column("to_topic_id", UUID(as_uuid=True), nullable=True),
        sa.Column("admin_user", sa.String(100), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["from_topic_id"], ["topics.id"]),
        sa.ForeignKeyConstraint(["to_topic_id"], ["topics.id"]),
    )
    op.create_index("ix_message_history_id", "message_history", ["id"])
    op.create_index("ix_message_history_message_id", "message_history", ["message_id"])

    # Create classification_feedback table
    op.create_table(
        "classification_feedback",
        sa.Column("id", UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("message_id", UUID(as_uuid=True), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("feedback_type", sa.String(50), nullable=False),
        sa.Column("reason", sa.String(50), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("confidence_at_feedback", sa.Float(), nullable=True),
        sa.Column("topic_at_feedback", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["message_id"], ["messages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_at_feedback"], ["topics.id"]),
    )
    op.create_index("ix_classification_feedback_id", "classification_feedback", ["id"])
    op.create_index("ix_classification_feedback_message_id", "classification_feedback", ["message_id"])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop classification_feedback table
    op.drop_index("ix_classification_feedback_message_id", "classification_feedback")
    op.drop_index("ix_classification_feedback_id", "classification_feedback")
    op.drop_table("classification_feedback")

    # Drop message_history table
    op.drop_index("ix_message_history_message_id", "message_history")
    op.drop_index("ix_message_history_id", "message_history")
    op.drop_table("message_history")

    # Remove status fields from messages table
    op.drop_index("ix_messages_status", "messages")
    op.drop_column("messages", "rejection_comment")
    op.drop_column("messages", "rejection_reason")
    op.drop_column("messages", "rejected_at")
    op.drop_column("messages", "approved_at")
    op.drop_column("messages", "status")
