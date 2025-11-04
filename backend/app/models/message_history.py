"""Message history model for tracking classification changes."""

import uuid
from datetime import datetime

from sqlalchemy import Text
from sqlmodel import Field, SQLModel

from .base import TimestampMixin


class MessageHistory(TimestampMixin, SQLModel, table=True):
    """
    Message history table - tracks classification changes and actions.

    Records all significant events in a message's lifecycle:
    - Initial classification
    - Topic reassignments
    - Admin approvals/rejections
    - Metadata changes
    """

    __tablename__ = "message_history"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        description="Unique identifier for the history event",
    )
    message_id: uuid.UUID = Field(
        foreign_key="messages.id",
        index=True,
        description="Message this event relates to",
    )
    action: str = Field(
        max_length=50,
        description="Action type: classified, reassigned, approved, rejected",
    )
    from_topic_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="topics.id",
        description="Previous topic (for reassignment events)",
    )
    to_topic_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="topics.id",
        description="New topic (for reassignment events)",
    )
    admin_user: str | None = Field(
        default=None,
        max_length=100,
        description="Username of admin who performed action",
    )
    reason: str | None = Field(
        default=None,
        sa_type=Text,
        description="Optional reason or comment for the action",
    )


class MessageHistoryPublic(SQLModel):
    """Public schema for message history responses."""

    id: str
    message_id: str
    action: str
    from_topic_id: str | None
    to_topic_id: str | None
    admin_user: str | None
    reason: str | None
    created_at: datetime
    updated_at: datetime
