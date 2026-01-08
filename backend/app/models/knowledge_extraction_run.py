"""Models for knowledge extraction run tracking with cancellation support."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlalchemy import Column, DateTime, ForeignKey
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class ExtractionStatus(str, Enum):
    """Status of knowledge extraction run."""

    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelling = "cancelling"
    cancelled = "cancelled"


class KnowledgeExtractionRun(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Tracks knowledge extraction jobs with full cancellation support.

    Implements cooperative cancellation pattern:
    1. API sets cancel_requested=True, status='cancelling'
    2. Worker polls cancel_requested at checkpoints
    3. Worker exits gracefully, sets status='cancelled'
    """

    __tablename__ = "knowledge_extraction_runs"

    # TaskIQ task reference
    task_id: str | None = Field(
        default=None, max_length=255, description="TaskIQ task ID for tracking"
    )

    # Agent configuration
    agent_config_id: UUID = Field(
        sa_column=Column(
            ForeignKey("agent_configs.id", ondelete="CASCADE"), nullable=False
        ),
        description="Agent config used for extraction",
    )

    # Status tracking
    status: ExtractionStatus = Field(
        default=ExtractionStatus.pending, description="Current extraction status"
    )
    cancel_requested: bool = Field(
        default=False, description="Flag for cooperative cancellation"
    )

    # Progress counters
    message_count: int = Field(default=0, description="Total messages to process")
    messages_processed: int = Field(default=0, description="Messages processed so far")
    topics_created: int = Field(default=0, description="Topics created")
    atoms_created: int = Field(default=0, description="Atoms created")
    links_created: int = Field(default=0, description="Atom links created")

    # Lifecycle timestamps
    started_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When extraction started",
    )
    completed_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When extraction completed",
    )
    cancelled_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True)),
        description="When extraction was cancelled",
    )

    # Error tracking
    error: str | None = Field(
        default=None, max_length=2000, description="Error message if failed"
    )


class KnowledgeExtractionRunCreate(SQLModel):
    """Schema for creating extraction runs."""

    agent_config_id: UUID
    message_count: int


class KnowledgeExtractionRunPublic(SQLModel):
    """Public schema for extraction run responses."""

    id: int
    task_id: str | None
    agent_config_id: UUID
    status: ExtractionStatus
    cancel_requested: bool
    message_count: int
    messages_processed: int
    topics_created: int
    atoms_created: int
    links_created: int
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    cancelled_at: datetime | None
    error: str | None
