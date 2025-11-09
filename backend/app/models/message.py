"""Message model for storing messages from various sources."""

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector  # type: ignore[import-untyped]
from sqlalchemy import Column, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .base import TimestampMixin
from .enums import AnalysisStatus


class Message(TimestampMixin, SQLModel, table=True):
    """Message table - stores incoming messages from various sources.

    Each message MUST have:
    - source_id: where the message came from
    - author_id: who wrote it (always a User, including Bot User for system messages)
    """

    __tablename__ = "messages"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        description="Unique identifier for the message",
    )
    external_message_id: str = Field(index=True, max_length=100, description="ID from external system")
    content: str = Field(sa_type=Text, description="Message content")
    sent_at: datetime = Field(description="When message was sent")

    source_id: int = Field(foreign_key="sources.id", description="Source where message came from")
    author_id: int = Field(foreign_key="users.id", description="Author of the message (User.id)")

    telegram_profile_id: int | None = Field(
        default=None,
        foreign_key="telegram_profiles.id",
        description="Telegram profile if message is from Telegram",
    )

    avatar_url: str | None = Field(default=None, max_length=500, description="Cached avatar URL from User")

    classification: str | None = Field(default=None, max_length=50, description="AI classification result")
    confidence: float | None = Field(default=None, ge=0.0, le=1.0, description="Classification confidence score")
    analyzed: bool = Field(default=False, description="Whether message was analyzed")

    analysis_status: str | None = Field(
        default=AnalysisStatus.pending.value,
        max_length=50,
        description="Analysis processing status: pending/analyzed/spam/noise",
    )
    included_in_runs: list[str] | None = Field(
        default=None,
        sa_type=JSONB,
        description="UUIDs of AnalysisRuns that processed this message",
    )

    topic_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="topics.id",
        index=True,
        description="Ground truth topic ID for classification experiments",
    )

    embedding: list[float] | None = Field(
        default=None,
        sa_column=Column(Vector(1536)),
        description="Vector embedding for semantic search (must match settings.embedding.openai_embedding_dimensions)",
    )

    importance_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Importance score for noise filtering (0.0=noise, 1.0=critical signal)",
    )
    noise_classification: str | None = Field(
        default=None,
        max_length=50,
        description="Noise classification type (signal/noise/spam/low_quality/high_quality)",
    )
    noise_factors: dict[str, float] | None = Field(
        default=None,
        sa_type=JSONB,
        description="Contributing factors for noise score (JSONB: {factor_name: weight})",
    )

    status: str | None = Field(
        default="pending",
        max_length=20,
        description="Message status: pending, approved, rejected",
    )
    approved_at: datetime | None = Field(
        default=None,
        description="Timestamp when message was approved",
    )
    rejected_at: datetime | None = Field(
        default=None,
        description="Timestamp when message was rejected",
    )
    rejection_reason: str | None = Field(
        default=None,
        max_length=50,
        description="Reason for rejection: wrong_topic, noise, duplicate, other",
    )
    rejection_comment: str | None = Field(
        default=None,
        sa_type=Text,
        description="Additional comment for rejection",
    )
