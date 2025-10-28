"""Failed task model for Dead Letter Queue (DLQ) to track and retry failed background tasks."""

from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, Index, Text
from sqlalchemy import Enum as SQLEnum
from sqlmodel import Field, SQLModel


class FailedTaskStatus(str, Enum):
    """Status of failed background tasks in Dead Letter Queue."""

    failed = "failed"
    retrying = "retrying"
    abandoned = "abandoned"


class FailedTask(SQLModel, table=True):
    """Records failed background tasks for retry and monitoring.

    This Dead Letter Queue (DLQ) stores tasks that failed after all retry attempts,
    allowing manual inspection, retry, or abandonment. Supports exponential backoff
    retry mechanism with configurable max attempts.
    """

    __tablename__ = "failed_tasks"

    id: int | None = Field(default=None, primary_key=True)
    task_name: str = Field(max_length=255, nullable=False, description="Name of the failed task function")
    task_args: dict | None = Field(default=None, sa_column=Column(JSON), description="Original task arguments as JSON")
    error_message: str | None = Field(
        default=None, sa_column=Column(Text), description="Last error message from failed attempt"
    )
    error_traceback: str | None = Field(
        default=None, sa_column=Column(Text), description="Full traceback of last error"
    )
    attempts: int = Field(default=0, description="Number of retry attempts made")
    status: FailedTaskStatus = Field(
        default=FailedTaskStatus.failed,
        sa_column=Column(SQLEnum(FailedTaskStatus, native_enum=False), nullable=False),
        description="Current status of the failed task",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When task first failed")
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="When task was last updated (retry, status change)"
    )

    __table_args__ = (
        Index(
            "idx_failed_tasks_status_created",
            "status",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        Index(
            "idx_failed_tasks_created_at",
            "created_at",
            postgresql_ops={"created_at": "DESC"},
        ),
        Index("idx_failed_tasks_status", "status"),
        Index("idx_failed_tasks_task_name", "task_name"),
    )
