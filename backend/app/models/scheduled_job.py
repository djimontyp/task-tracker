"""Scheduled job model for automated task execution."""

from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlmodel import Field, SQLModel

from .base import IDMixin, TimestampMixin


class JobStatus(str, Enum):
    """Status of scheduled job execution."""

    idle = "idle"
    running = "running"
    success = "success"
    failed = "failed"


class ScheduledJob(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Scheduled job for automated background task execution.

    Manages recurring tasks with cron schedules, execution tracking,
    and error handling for system automation.
    """

    __tablename__ = "scheduled_jobs"

    name: str = Field(
        sa_column=Column(String(255), nullable=False, unique=True),
        description="Unique job name identifier",
    )
    description: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Human-readable job description",
    )
    schedule_cron: str = Field(
        sa_column=Column(String(100), nullable=False),
        description="Cron expression for job schedule (e.g., '0 9 * * *')",
    )
    enabled: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, server_default="true"),
        description="Whether this job is active and should be executed",
    )
    last_run: datetime | None = Field(
        default=None,
        description="Timestamp of last execution",
    )
    next_run: datetime | None = Field(
        default=None,
        description="Timestamp of next scheduled execution",
    )
    status: JobStatus = Field(
        default=JobStatus.idle,
        sa_column=Column(String(20), nullable=False, server_default="idle"),
        description="Current execution status",
    )
    error_message: str | None = Field(
        default=None,
        sa_column=Column(Text, nullable=True),
        description="Error message from last failed execution",
    )
    run_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
        description="Total number of executions",
    )
    success_count: int = Field(
        default=0,
        sa_column=Column(Integer, nullable=False, server_default="0"),
        description="Number of successful executions",
    )
    task_name: str | None = Field(
        default=None,
        sa_column=Column(String(255), nullable=True),
        description="TaskIQ task name to execute",
    )


class ScheduledJobCreate(SQLModel):
    """Schema for creating a new scheduled job."""

    name: str = Field(min_length=1, max_length=255, description="Unique job name")
    description: str | None = Field(None, description="Job description")
    schedule_cron: str = Field(min_length=1, max_length=100, description="Cron expression")
    enabled: bool = Field(default=True, description="Job enabled status")
    task_name: str | None = Field(None, description="TaskIQ task name")


class ScheduledJobUpdate(SQLModel):
    """Schema for updating an existing scheduled job."""

    name: str | None = Field(None, min_length=1, max_length=255, description="Job name")
    description: str | None = Field(None, description="Job description")
    schedule_cron: str | None = Field(None, min_length=1, max_length=100, description="Cron expression")
    enabled: bool | None = Field(None, description="Job enabled status")
    task_name: str | None = Field(None, description="TaskIQ task name")


class ScheduledJobPublic(SQLModel):
    """Public schema for scheduled job responses."""

    id: int
    name: str
    description: str | None
    schedule_cron: str
    enabled: bool
    last_run: datetime | None
    next_run: datetime | None
    status: JobStatus
    error_message: str | None
    run_count: int
    success_count: int
    task_name: str | None
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True


class ScheduledJobListResponse(SQLModel):
    """Response schema for paginated job listing."""

    jobs: list[ScheduledJobPublic]
    total: int
    page: int
    page_size: int
