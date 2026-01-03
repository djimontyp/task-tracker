"""Scheduled extraction task model for automated knowledge extraction."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class ScheduledExtractionTask(SQLModel, table=True):
    """
    Scheduled extraction task for automated knowledge extraction.

    Defines a recurring task that triggers knowledge extraction from messages
    using a specific agent, with configurable filters and auto-approve settings.
    """

    __tablename__ = "scheduled_extraction_tasks"

    # Primary Key
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Core Fields
    name: str = Field(max_length=255, description="Task name")
    cron_schedule: str = Field(max_length=100, description="Cron expression (e.g., '0 8 * * *')")
    agent_id: UUID = Field(foreign_key="agent_configs.id", description="Reference to agent config")
    is_active: bool = Field(default=True, description="Whether task is active")

    # Filters
    channel_ids: list[str] | None = Field(
        default=None,
        sa_type=JSONB,
        description="Filter by channel IDs (Telegram chat_ids)",
    )
    min_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Minimum importance score for messages",
    )
    lookback_hours: int = Field(
        default=24,
        ge=1,
        description="How many hours back to look for messages",
    )

    # Auto-approve config
    auto_approve_enabled: bool = Field(
        default=False,
        description="Enable automatic approval of extracted atoms",
    )
    confidence_threshold: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Minimum confidence for auto-approval",
    )
    allowed_atom_types: list[str] | None = Field(
        default=None,
        sa_type=JSONB,
        description="Atom types allowed for auto-approval",
    )

    # Execution tracking
    last_run_at: datetime | None = Field(
        default=None,
        description="Timestamp of last execution",
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
    )


# API Schemas
class ScheduledExtractionTaskCreate(SQLModel):
    """Schema for creating a new scheduled extraction task."""

    name: str = Field(min_length=1, max_length=255, description="Task name")
    cron_schedule: str = Field(min_length=1, max_length=100, description="Cron expression")
    agent_id: UUID = Field(description="Agent config ID")
    is_active: bool = Field(default=True, description="Task active status")

    # Filters
    channel_ids: list[str] | None = Field(default=None, description="Channel IDs filter")
    min_score: float | None = Field(default=None, ge=0.0, le=1.0, description="Min importance score")
    lookback_hours: int = Field(default=24, ge=1, description="Lookback period in hours")

    # Auto-approve
    auto_approve_enabled: bool = Field(default=False, description="Enable auto-approval")
    confidence_threshold: float | None = Field(default=None, ge=0.0, le=1.0, description="Min confidence")
    allowed_atom_types: list[str] | None = Field(default=None, description="Allowed atom types")


class ScheduledExtractionTaskUpdate(SQLModel):
    """Schema for updating a scheduled extraction task."""

    name: str | None = Field(default=None, min_length=1, max_length=255, description="Task name")
    cron_schedule: str | None = Field(default=None, min_length=1, max_length=100, description="Cron expression")
    agent_id: UUID | None = Field(default=None, description="Agent config ID")
    is_active: bool | None = Field(default=None, description="Task active status")

    # Filters
    channel_ids: list[str] | None = Field(default=None, description="Channel IDs filter")
    min_score: float | None = Field(default=None, ge=0.0, le=1.0, description="Min importance score")
    lookback_hours: int | None = Field(default=None, ge=1, description="Lookback period in hours")

    # Auto-approve
    auto_approve_enabled: bool | None = Field(default=None, description="Enable auto-approval")
    confidence_threshold: float | None = Field(default=None, ge=0.0, le=1.0, description="Min confidence")
    allowed_atom_types: list[str] | None = Field(default=None, description="Allowed atom types")


class ScheduledExtractionTaskPublic(SQLModel):
    """Public schema for scheduled extraction task responses."""

    id: UUID
    name: str
    cron_schedule: str
    agent_id: UUID
    is_active: bool

    # Filters
    channel_ids: list[str] | None = None
    min_score: float | None = None
    lookback_hours: int

    # Auto-approve
    auto_approve_enabled: bool
    confidence_threshold: float | None = None
    allowed_atom_types: list[str] | None = None

    # Execution
    last_run_at: datetime | None = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScheduledExtractionTaskListResponse(SQLModel):
    """Response schema for paginated task listing."""

    items: list[ScheduledExtractionTaskPublic]
    total: int
    page: int
    page_size: int
