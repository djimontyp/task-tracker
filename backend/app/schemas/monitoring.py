"""Pydantic schemas for task monitoring API."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.task_execution_log import TaskStatus


class TaskMetrics(BaseModel):
    """Task execution metrics for a specific task type."""

    task_name: str = Field(..., description="Task function name")
    total_executions: int = Field(..., ge=0, description="Total executions in time window")
    pending: int = Field(..., ge=0, description="Count of pending (queued) tasks")
    running: int = Field(..., ge=0, description="Count of currently running tasks")
    success: int = Field(..., ge=0, description="Count of successfully completed tasks")
    failed: int = Field(..., ge=0, description="Count of failed tasks")
    avg_duration_ms: float = Field(
        ...,
        ge=0,
        description="Average execution duration in milliseconds (successful tasks only)",
    )
    success_rate: float = Field(
        ..., ge=0, le=100, description="Success rate percentage (success / total * 100)"
    )


class MonitoringMetricsResponse(BaseModel):
    """Response model for monitoring metrics endpoint."""

    time_window_hours: int = Field(..., description="Time window used for metrics calculation")
    generated_at: datetime = Field(
        ..., description="Timestamp when metrics were generated (ISO 8601 UTC)"
    )
    metrics: list[TaskMetrics] = Field(..., description="Per-task-type health metrics")


class TaskExecutionLogResponse(BaseModel):
    """Response model for task execution log record."""

    id: int = Field(..., description="Unique log record ID")
    task_name: str = Field(..., description="Task function name")
    status: TaskStatus = Field(..., description="Task execution status")
    task_id: Optional[str] = Field(None, description="TaskIQ internal task ID")
    params: Optional[dict[str, Any]] = Field(None, description="Task input parameters (JSON)")
    started_at: Optional[datetime] = Field(
        None, description="Task start timestamp (ISO 8601 UTC)"
    )
    completed_at: Optional[datetime] = Field(
        None, description="Task completion timestamp (ISO 8601 UTC)"
    )
    duration_ms: Optional[int] = Field(
        None, ge=0, description="Execution duration in milliseconds"
    )
    error_message: Optional[str] = Field(None, description="Error message if status=failed")
    error_traceback: Optional[str] = Field(
        None, description="Full stack trace if status=failed"
    )
    created_at: datetime = Field(
        ..., description="Log record creation timestamp (ISO 8601 UTC)"
    )

    class Config:
        """Pydantic configuration."""

        from_attributes = True


class TaskHistoryResponse(BaseModel):
    """Paginated response model for task execution history."""

    total_count: int = Field(..., ge=0, description="Total number of records matching filters")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(
        ..., ge=10, le=100, description="Number of records per page"
    )
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    items: list[TaskExecutionLogResponse] = Field(..., description="Task execution log records")


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str = Field(..., description="Human-readable error message")
