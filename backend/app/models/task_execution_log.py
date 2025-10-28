"""Task execution logging models for monitoring background tasks."""

from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, Index, Text
from sqlalchemy import Enum as SQLEnum
from sqlmodel import Field, SQLModel


class TaskStatus(str, Enum):
    """Task execution status enum."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class TaskExecutionLog(SQLModel, table=True):
    """Records individual task execution attempts with status, timing, and error information."""

    __tablename__ = "task_execution_logs"

    id: int | None = Field(default=None, primary_key=True)
    task_name: str = Field(max_length=255, nullable=False)
    status: TaskStatus = Field(
        default=TaskStatus.PENDING,
        sa_column=Column(SQLEnum(TaskStatus, native_enum=False), nullable=False),
    )
    task_id: str | None = Field(default=None, max_length=255)
    params: dict | None = Field(default=None, sa_column=Column(JSON))
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
    duration_ms: int | None = Field(default=None)
    error_message: str | None = Field(default=None, sa_column=Column(Text))
    error_traceback: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        Index(
            "idx_task_logs_composite",
            "task_name",
            "status",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        Index(
            "idx_task_logs_created_at",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        Index("idx_task_logs_task_name", "task_name"),
        Index("idx_task_logs_status", "status"),
    )
