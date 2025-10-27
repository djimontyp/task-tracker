"""API endpoints for task execution monitoring."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app.dependencies import DatabaseDep
from app.models.task_execution_log import TaskStatus
from app.schemas.monitoring import (
    ErrorResponse,
    MonitoringMetricsResponse,
    TaskHistoryResponse,
)
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
