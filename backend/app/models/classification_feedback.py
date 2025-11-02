"""Classification feedback model for ML retraining."""

import uuid
from datetime import datetime

from sqlalchemy import Text
from sqlmodel import Field, SQLModel

from .base import TimestampMixin


class ClassificationFeedback(TimestampMixin, SQLModel, table=True):
    """
    Classification feedback table - stores user feedback for model retraining.

    Captures approve/reject decisions to create a labeled dataset
    for improving classification accuracy over time.
    """

    __tablename__ = "classification_feedback"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        description="Unique identifier for the feedback record",
    )
    message_id: uuid.UUID = Field(
        foreign_key="messages.id",
        index=True,
        description="Message that received feedback",
    )
    is_correct: bool = Field(
        description="True = classification approved, False = rejected",
    )
    feedback_type: str = Field(
        max_length=50,
        description="Type of feedback: approve or reject",
    )
    reason: str | None = Field(
        default=None,
        max_length=50,
        description="Rejection reason: wrong_topic, noise, duplicate, other",
    )
    comment: str | None = Field(
        default=None,
        sa_type=Text,
        description="Additional context for the feedback",
    )
    confidence_at_feedback: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Classification confidence when feedback was given",
    )
    topic_at_feedback: uuid.UUID | None = Field(
        default=None,
        foreign_key="topics.id",
        description="Topic assignment when feedback was given",
    )


class ClassificationFeedbackPublic(SQLModel):
    """Public schema for classification feedback responses."""

    id: str
    message_id: str
    is_correct: bool
    feedback_type: str
    reason: str | None
    comment: str | None
    confidence_at_feedback: float | None
    topic_at_feedback: str | None
    created_at: datetime
    updated_at: datetime
