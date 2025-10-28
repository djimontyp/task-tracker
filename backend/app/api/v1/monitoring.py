"""API endpoints for task execution monitoring."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from app.dependencies import DatabaseDep
from app.models.failed_task import FailedTaskStatus
from app.models.task_execution_log import TaskStatus
from app.schemas.monitoring import (
    ErrorResponse,
    FailedTaskResponse,
    FailedTasksListResponse,
    MonitoringMetricsResponse,
    RetryTaskResponse,
    ScoringAccuracyResponse,
    TaskHistoryResponse,
)
from app.services.dead_letter_queue_service import DeadLetterQueueService
from app.services.monitoring_service import MonitoringService

router = APIRouter(tags=["monitoring"])


@router.get(
    "/metrics",
    response_model=MonitoringMetricsResponse,
    summary="Get task execution health metrics",
    response_description="Aggregated metrics for all task types in time window",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid time window parameter"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_task_metrics(
    db: DatabaseDep,
    time_window: Annotated[
        int,
        Query(
            ge=1,
            le=168,
            description="Time window in hours for metrics calculation (default: 24)",
        ),
    ] = 24,
) -> MonitoringMetricsResponse:
    """Get aggregated health metrics for background task execution.

    Returns execution counts by status (pending, running, success, failed),
    average duration, and success rate for each task type within the specified
    time window.

    **Use Cases:**
    - Monitor task health across all 10 task types
    - Identify failing tasks that need attention
    - Track performance trends over time

    **Parameters:**
    - **time_window**: Hours to look back (1-168, default 24)

    **Returns:**
    - Metrics array with per-task statistics
    - Time window and generation timestamp

    **Example:**
    ```
    GET /api/v1/monitoring/metrics?time_window=48
    ```
    """
    try:
        service = MonitoringService(db)
        return await service.get_metrics(time_window_hours=time_window)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/history",
    response_model=TaskHistoryResponse,
    summary="Get task execution history",
    response_description="Paginated task execution logs with optional filters",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_task_history(
    db: DatabaseDep,
    task_name: Annotated[
        str | None,
        Query(description="Filter by task function name"),
    ] = None,
    status: Annotated[
        TaskStatus | None,
        Query(description="Filter by execution status"),
    ] = None,
    start_date: Annotated[
        datetime | None,
        Query(description="Filter logs created after this timestamp (ISO 8601 UTC)"),
    ] = None,
    end_date: Annotated[
        datetime | None,
        Query(description="Filter logs created before this timestamp (ISO 8601 UTC)"),
    ] = None,
    page: Annotated[
        int,
        Query(ge=1, description="Page number (1-indexed)"),
    ] = 1,
    page_size: Annotated[
        int,
        Query(ge=10, le=100, description="Number of records per page"),
    ] = 50,
) -> TaskHistoryResponse:
    """Get searchable task execution history with filtering and pagination.

    Returns detailed execution logs including task parameters, timing, and
    error information for debugging failed tasks.

    **Use Cases:**
    - Debug failed tasks with full error traces
    - Investigate performance issues (slow tasks)
    - Audit task execution history

    **Filters:**
    - **task_name**: Filter by specific task (e.g., "score_message_task")
    - **status**: Filter by status (pending, running, success, failed)
    - **start_date**: Logs created after date (ISO 8601)
    - **end_date**: Logs created before date (ISO 8601)

    **Pagination:**
    - **page**: Current page (1-indexed)
    - **page_size**: Records per page (10-100)

    **Returns:**
    - Paginated results with total count and page info
    - Task execution details including errors and parameters

    **Example:**
    ```
    GET /api/v1/monitoring/history?task_name=score_message_task&status=failed
    ```
    """
    try:
        service = MonitoringService(db)
        return await service.get_history(
            task_name=task_name,
            status=status,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/failed-tasks",
    response_model=FailedTasksListResponse,
    summary="List failed tasks in Dead Letter Queue",
    response_description="Paginated list of failed tasks with optional filters",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid query parameters"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def list_failed_tasks(
    db: DatabaseDep,
    status: Annotated[
        FailedTaskStatus | None,
        Query(description="Filter by task status (failed/retrying/abandoned)"),
    ] = None,
    task_name: Annotated[
        str | None,
        Query(description="Filter by task function name"),
    ] = None,
    page: Annotated[
        int,
        Query(ge=1, description="Page number (1-indexed)"),
    ] = 1,
    page_size: Annotated[
        int,
        Query(ge=10, le=100, description="Number of records per page"),
    ] = 50,
) -> FailedTasksListResponse:
    """Get failed tasks from Dead Letter Queue with filtering and pagination.

    Returns tasks that failed after all retry attempts, allowing manual
    inspection, retry, or abandonment. Useful for debugging persistent failures.

    **Use Cases:**
    - Monitor tasks failing after all retry attempts
    - Manually retry failed tasks after fixing underlying issues
    - Investigate error patterns and recurring failures
    - Manage abandoned tasks

    **Filters:**
    - **status**: Filter by status (failed, retrying, abandoned)
    - **task_name**: Filter by specific task (e.g., "score_message")

    **Pagination:**
    - **page**: Current page (1-indexed)
    - **page_size**: Records per page (10-100)

    **Returns:**
    - Paginated results with total count and page info
    - Full error details including traceback for debugging

    **Example:**
    ```
    GET /api/v1/monitoring/failed-tasks?status=failed&page=1&page_size=20
    ```
    """
    try:
        service = DeadLetterQueueService(db)
        offset = (page - 1) * page_size
        failed_tasks, total_count = await service.get_failed_tasks(
            status=status,
            task_name=task_name,
            limit=page_size,
            offset=offset,
        )

        items = [
            FailedTaskResponse(
                id=task.id or 0,
                task_name=task.task_name,
                task_args=task.task_args,
                error_message=task.error_message,
                error_traceback=task.error_traceback,
                attempts=task.attempts,
                status=task.status,
                created_at=task.created_at,
                updated_at=task.updated_at,
            )
            for task in failed_tasks
        ]

        total_pages = (total_count + page_size - 1) // page_size

        return FailedTasksListResponse(
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            items=items,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/failed-tasks/{task_id}",
    response_model=FailedTaskResponse,
    summary="Get a single failed task by ID",
    response_description="Detailed information about a failed task",
    responses={
        404: {"model": ErrorResponse, "description": "Failed task not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_failed_task(
    db: DatabaseDep,
    task_id: Annotated[int, Path(description="ID of the failed task")],
) -> FailedTaskResponse:
    """Get detailed information about a specific failed task.

    Returns full error details including traceback, original arguments,
    and retry attempts for debugging and manual retry.

    **Parameters:**
    - **task_id**: ID of the failed task from DLQ

    **Returns:**
    - Complete failed task record with error details

    **Example:**
    ```
    GET / api / v1 / monitoring / failed - tasks / 123
    ```
    """
    try:
        service = DeadLetterQueueService(db)
        failed_task = await service.get_failed_task(task_id)

        if not failed_task:
            raise HTTPException(status_code=404, detail=f"Failed task {task_id} not found")

        return FailedTaskResponse(
            id=failed_task.id or 0,
            task_name=failed_task.task_name,
            task_args=failed_task.task_args,
            error_message=failed_task.error_message,
            error_traceback=failed_task.error_traceback,
            attempts=failed_task.attempts,
            status=failed_task.status,
            created_at=failed_task.created_at,
            updated_at=failed_task.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/failed-tasks/{task_id}/abandon",
    response_model=RetryTaskResponse,
    summary="Mark a failed task as abandoned",
    response_description="Confirmation of abandonment",
    responses={
        404: {"model": ErrorResponse, "description": "Failed task not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def abandon_failed_task(
    db: DatabaseDep,
    task_id: Annotated[int, Path(description="ID of the failed task to abandon")],
) -> RetryTaskResponse:
    """Mark a failed task as permanently abandoned.

    Use this to remove tasks from active failed queue that should not be
    retried (e.g., due to invalid data or obsolete operations).

    **Parameters:**
    - **task_id**: ID of the failed task to abandon

    **Returns:**
    - Success confirmation with task ID

    **Example:**
    ```
    POST / api / v1 / monitoring / failed - tasks / 123 / abandon
    ```
    """
    try:
        service = DeadLetterQueueService(db)
        result = await service.mark_abandoned(task_id)

        if not result:
            raise HTTPException(status_code=404, detail=f"Failed task {task_id} not found")

        return RetryTaskResponse(
            success=True,
            message=f"Task {task_id} marked as abandoned",
            task_id=task_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get(
    "/scoring-accuracy",
    response_model=ScoringAccuracyResponse,
    summary="Get scoring accuracy metrics",
    response_description="Accuracy metrics for importance scoring system",
    responses={
        404: {"model": ErrorResponse, "description": "Validation dataset not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_scoring_accuracy(db: DatabaseDep) -> ScoringAccuracyResponse:
    """Get accuracy metrics for the importance scoring system.

    Validates ImportanceScorer against a labeled dataset to measure classification
    performance. Returns precision, recall, and F1-score for each category
    (noise, weak_signal, signal) plus overall accuracy.

    **Use Cases:**
    - Monitor scoring system accuracy over time
    - Detect degradation in classification quality
    - Validate scoring improvements after model updates
    - Alert when accuracy drops below 80% threshold

    **Metrics Explained:**
    - **Precision**: Of predicted signals, how many were actually signals
    - **Recall**: Of actual signals, how many were correctly identified
    - **F1 Score**: Harmonic mean of precision and recall
    - **Overall Accuracy**: Percentage of correct classifications

    **Alert Threshold:**
    - `alert_threshold_met=true` when accuracy < 80% (requires attention)

    **Returns:**
    - Per-category metrics (noise, weak_signal, signal)
    - Overall accuracy score
    - Total validation samples analyzed
    - Alert status if accuracy is below threshold

    **Example:**
    ```
    GET / api / v1 / monitoring / scoring - accuracy
    ```

    **Response Example:**
    ```json
    {
      "overall_accuracy": 0.847,
      "category_metrics": [
        {
          "category": "noise",
          "precision": 0.901,
          "recall": 0.885,
          "f1_score": 0.893,
          "support": 45
        },
        {
          "category": "weak_signal",
          "precision": 0.782,
          "recall": 0.801,
          "f1_score": 0.791,
          "support": 32
        },
        {
          "category": "signal",
          "precision": 0.912,
          "recall": 0.889,
          "f1_score": 0.900,
          "support": 23
        }
      ],
      "total_samples": 100,
      "generated_at": "2025-10-28T14:30:00",
      "alert_threshold_met": false
    }
    ```
    """
    try:
        service = MonitoringService(db)
        return await service.get_scoring_accuracy()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
