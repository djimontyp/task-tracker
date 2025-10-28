"""Pydantic schemas for task monitoring API."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.failed_task import FailedTaskStatus
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
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage (success / total * 100)")


class MonitoringMetricsResponse(BaseModel):
    """Response model for monitoring metrics endpoint."""

    time_window_hours: int = Field(..., description="Time window used for metrics calculation")
    generated_at: datetime = Field(..., description="Timestamp when metrics were generated (ISO 8601 UTC)")
    metrics: list[TaskMetrics] = Field(..., description="Per-task-type health metrics")


class TaskExecutionLogResponse(BaseModel):
    """Response model for task execution log record."""

    id: int = Field(..., description="Unique log record ID")
    task_name: str = Field(..., description="Task function name")
    status: TaskStatus = Field(..., description="Task execution status")
    task_id: str | None = Field(None, description="TaskIQ internal task ID")
    params: dict[str, Any] | None = Field(None, description="Task input parameters (JSON)")
    started_at: datetime | None = Field(None, description="Task start timestamp (ISO 8601 UTC)")
    completed_at: datetime | None = Field(None, description="Task completion timestamp (ISO 8601 UTC)")
    duration_ms: int | None = Field(None, ge=0, description="Execution duration in milliseconds")
    error_message: str | None = Field(None, description="Error message if status=failed")
    error_traceback: str | None = Field(None, description="Full stack trace if status=failed")
    created_at: datetime = Field(..., description="Log record creation timestamp (ISO 8601 UTC)")

    class Config:
        """Pydantic configuration."""

        from_attributes = True


class TaskHistoryResponse(BaseModel):
    """Paginated response model for task execution history."""

    total_count: int = Field(..., ge=0, description="Total number of records matching filters")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(..., ge=10, le=100, description="Number of records per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    items: list[TaskExecutionLogResponse] = Field(..., description="Task execution log records")


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str = Field(..., description="Human-readable error message")


class FailedTaskResponse(BaseModel):
    """Response model for failed task in Dead Letter Queue."""

    id: int = Field(..., description="Unique failed task record ID")
    task_name: str = Field(..., description="Name of the failed task function")
    task_args: dict[str, Any] | None = Field(None, description="Original task arguments (JSON)")
    error_message: str | None = Field(None, description="Last error message from failed attempt")
    error_traceback: str | None = Field(None, description="Full stack trace of last error")
    attempts: int = Field(..., ge=0, description="Number of retry attempts made")
    status: FailedTaskStatus = Field(..., description="Current status (failed/retrying/abandoned)")
    created_at: datetime = Field(..., description="When task first failed (ISO 8601 UTC)")
    updated_at: datetime = Field(..., description="When task was last updated (ISO 8601 UTC)")

    class Config:
        """Pydantic configuration."""

        from_attributes = True


class FailedTasksListResponse(BaseModel):
    """Paginated response model for failed tasks list."""

    total_count: int = Field(..., ge=0, description="Total number of failed tasks matching filters")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    page_size: int = Field(..., ge=10, le=100, description="Number of records per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    items: list[FailedTaskResponse] = Field(..., description="Failed task records")


class RetryTaskRequest(BaseModel):
    """Request model for retrying a failed task."""

    task_id: int = Field(..., description="ID of the failed task to retry")


class RetryTaskResponse(BaseModel):
    """Response model for retry operation."""

    success: bool = Field(..., description="Whether retry was successful")
    message: str = Field(..., description="Human-readable result message")
    task_id: int | None = Field(None, description="ID of the retried task")


class CategoryAccuracyMetrics(BaseModel):
    """Accuracy metrics for a single classification category."""

    category: str = Field(..., description="Category name (noise/weak_signal/signal)")
    precision: float = Field(..., ge=0, le=1, description="Precision score (0.0-1.0)")
    recall: float = Field(..., ge=0, le=1, description="Recall score (0.0-1.0)")
    f1_score: float = Field(..., ge=0, le=1, description="F1 score (0.0-1.0)")
    support: int = Field(..., ge=0, description="Number of samples in dataset for this category")


class ScoringAccuracyResponse(BaseModel):
    """Response model for scoring accuracy validation endpoint."""

    overall_accuracy: float = Field(..., ge=0, le=1, description="Overall classification accuracy (0.0-1.0)")
    category_metrics: list[CategoryAccuracyMetrics] = Field(..., description="Per-category precision/recall/F1 metrics")
    total_samples: int = Field(..., ge=0, description="Total number of validation samples analyzed")
    generated_at: datetime = Field(..., description="Timestamp when metrics were generated (ISO 8601 UTC)")
    alert_threshold_met: bool = Field(
        ..., description="True if overall accuracy is below 80% threshold (requires attention)"
    )
