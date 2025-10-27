"""Service for task execution monitoring metrics and history."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task_execution_log import TaskExecutionLog, TaskStatus
from app.schemas.monitoring import (
    MonitoringMetricsResponse,
    TaskExecutionLogResponse,
    TaskHistoryResponse,
    TaskMetrics,
)


class MonitoringService:
    """Service for retrieving task execution metrics and history."""

    def __init__(self, session: AsyncSession):
        """Initialize monitoring service.

        Args:
            session: Async database session
        """
        self.session = session

    async def get_metrics(self, time_window_hours: int = 24) -> MonitoringMetricsResponse:
        """Get aggregated task execution metrics for specified time window.

        Calculates execution counts by status, average duration, and success rate
        for each task type within the time window.

        Args:
            time_window_hours: Hours to look back for metrics (default: 24)

        Returns:
            MonitoringMetricsResponse with per-task metrics
        """
        cutoff_time = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=time_window_hours)

        from sqlalchemy import case

        query = (
            select(  # type: ignore[call-overload]
                TaskExecutionLog.task_name,
                func.count().label("total_executions"),
                func.sum(
                    case((TaskExecutionLog.status == TaskStatus.PENDING, 1), else_=0)  # type: ignore[arg-type]
                ).label("pending"),
                func.sum(
                    case((TaskExecutionLog.status == TaskStatus.RUNNING, 1), else_=0)  # type: ignore[arg-type]
                ).label("running"),
                func.sum(
                    case((TaskExecutionLog.status == TaskStatus.SUCCESS, 1), else_=0)  # type: ignore[arg-type]
                ).label("success"),
                func.sum(
                    case((TaskExecutionLog.status == TaskStatus.FAILED, 1), else_=0)  # type: ignore[arg-type]
                ).label("failed"),
                func.avg(
                    case((TaskExecutionLog.status == TaskStatus.SUCCESS, TaskExecutionLog.duration_ms))  # type: ignore[arg-type]
                ).label("avg_duration_ms"),
            )
            .where(TaskExecutionLog.created_at >= cutoff_time)
            .group_by(TaskExecutionLog.task_name)
            .order_by(TaskExecutionLog.task_name)
        )

        result = await self.session.execute(query)
        rows = result.all()

        metrics = []
        for row in rows:
            total = int(row.total_executions)
            success_count = int(row.success) if row.success else 0
            success_rate = (success_count / total * 100.0) if total > 0 else 0.0

            metrics.append(
                TaskMetrics(
                    task_name=row.task_name,
                    total_executions=total,
                    pending=int(row.pending) if row.pending else 0,
                    running=int(row.running) if row.running else 0,
                    success=success_count,
                    failed=int(row.failed) if row.failed else 0,
                    avg_duration_ms=float(row.avg_duration_ms) if row.avg_duration_ms else 0.0,
                    success_rate=round(success_rate, 2),
                )
            )

        return MonitoringMetricsResponse(
            time_window_hours=time_window_hours,
            generated_at=datetime.now(UTC).replace(tzinfo=None),
            metrics=metrics,
        )

    async def get_history(
        self,
        task_name: str | None = None,
        status: TaskStatus | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> TaskHistoryResponse:
        """Get paginated task execution history with optional filters.

        Args:
            task_name: Filter by task function name
            status: Filter by execution status
            start_date: Filter logs created after this date
            end_date: Filter logs created before this date
            page: Page number (1-indexed)
            page_size: Number of records per page

        Returns:
            TaskHistoryResponse with paginated results
        """
        query = select(TaskExecutionLog)

        if task_name:
            query = query.where(TaskExecutionLog.task_name == task_name)

        if status:
            query = query.where(TaskExecutionLog.status == status)

        if start_date:
            query = query.where(TaskExecutionLog.created_at >= start_date)

        if end_date:
            query = query.where(TaskExecutionLog.created_at <= end_date)

        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await self.session.execute(count_query)
        total_count = total_count_result.scalar() or 0

        query = query.order_by(TaskExecutionLog.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.session.execute(query)
        logs = result.scalars().all()

        items = [
            TaskExecutionLogResponse(
                id=log.id or 0,
                task_name=log.task_name,
                status=log.status,
                task_id=log.task_id,
                params=log.params,
                started_at=log.started_at,
                completed_at=log.completed_at,
                duration_ms=log.duration_ms,
                error_message=log.error_message,
                error_traceback=log.error_traceback,
                created_at=log.created_at,
            )
            for log in logs
        ]

        total_pages = (total_count + page_size - 1) // page_size

        return TaskHistoryResponse(
            total_count=total_count,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            items=items,
        )
