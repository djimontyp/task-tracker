"""Models for message ingestion tracking."""

from datetime import datetime
from enum import Enum

from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class IngestionStatus(str, Enum):
    """Status of message ingestion job."""

    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class MessageIngestionJob(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Tracks message ingestion jobs from external sources.
    Similar to AnalysisRun pattern from ANALYSIS_SYSTEM_ARCHITECTURE.md
    """

    __tablename__ = "message_ingestion_jobs"

    # Source configuration
    source_type: str = Field(max_length=50, description="Source type (telegram, slack, etc)")
    source_identifiers: dict = Field(
        sa_type=JSONB, description="Source-specific identifiers (group_ids, chat_ids, etc)"
    )

    # Time window
    time_window_start: datetime | None = Field(default=None, description="Start of time window for fetching")
    time_window_end: datetime | None = Field(default=None, description="End of time window for fetching")

    # Status tracking
    status: IngestionStatus = Field(default=IngestionStatus.pending, description="Current job status")
    messages_fetched: int = Field(default=0, description="Total messages fetched")
    messages_stored: int = Field(default=0, description="Messages successfully stored")
    messages_skipped: int = Field(default=0, description="Messages skipped (duplicates)")
    errors_count: int = Field(default=0, description="Number of errors encountered")

    # Progress tracking
    current_batch: int = Field(default=0, description="Current batch number")
    total_batches: int | None = Field(default=None, description="Estimated total batches")

    # Results and errors
    error_log: dict | None = Field(default=None, sa_type=JSONB, description="Error details")

    # Lifecycle timestamps
    started_at: datetime | None = Field(default=None, description="When job started processing")
    completed_at: datetime | None = Field(default=None, description="When job completed")


class MessageIngestionJobCreate(SQLModel):
    """Schema for creating ingestion jobs."""

    source_type: str
    source_identifiers: dict
    time_window_start: datetime | None = None
    time_window_end: datetime | None = None


class MessageIngestionJobPublic(SQLModel):
    """Public schema for ingestion job responses."""

    id: int
    source_type: str
    source_identifiers: dict
    status: IngestionStatus
    messages_fetched: int
    messages_stored: int
    messages_skipped: int
    errors_count: int
    current_batch: int
    total_batches: int | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
