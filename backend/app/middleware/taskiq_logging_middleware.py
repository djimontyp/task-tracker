"""TaskIQ middleware for logging task execution lifecycle events."""

import traceback
from datetime import UTC, datetime
from typing import Any

from loguru import logger
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from taskiq import TaskiqMessage, TaskiqMiddleware, TaskiqResult

from app.database import AsyncSessionLocal
from app.models.task_execution_log import TaskExecutionLog, TaskStatus
from app.services.websocket_manager import websocket_manager


class TaskLoggingMiddleware(TaskiqMiddleware):
    """Middleware to log task execution lifecycle to database and broadcast via WebSocket."""

    def __init__(self) -> None:
        """Initialize the middleware."""
        super().__init__()
        self._task_logs: dict[str, int] = {}

    async def pre_execute(self, message: TaskiqMessage) -> TaskiqMessage:
        """Log task start before execution.

        Creates a TaskExecutionLog record with status=RUNNING and broadcasts task_started event.

        Args:
            message: TaskIQ message containing task metadata

        Returns:
            Unmodified message
        """
        async with AsyncSessionLocal() as session:
            now = datetime.now(UTC).replace(tzinfo=None)
            log = TaskExecutionLog(
                task_name=message.task_name,
                status=TaskStatus.RUNNING,
                task_id=message.task_id,
                params=message.kwargs if message.kwargs else None,
                started_at=now,
                created_at=now,
                updated_at=now,
            )
            session.add(log)
            await session.commit()
            await session.refresh(log)

            if log.id:
                self._task_logs[message.task_id] = log.id

        try:
            await websocket_manager.broadcast_task_event(
                event_type="task_started",
                task_name=message.task_name,
                status=TaskStatus.RUNNING,
                task_id=message.task_id,
                params=message.kwargs if message.kwargs else None,
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast task_started event: {e}")

        return message

    async def post_execute(
        self, message: TaskiqMessage, result: TaskiqResult[Any]
    ) -> None:
        """Log task completion or failure after execution.

        Updates the TaskExecutionLog record with final status, duration, and error details.
        Broadcasts task_completed or task_failed event via WebSocket.

        Args:
            message: TaskIQ message containing task metadata
            result: Task execution result with status and error info
        """
        log_id = self._task_logs.pop(message.task_id, None)
        if not log_id:
            return

        async with AsyncSessionLocal() as session:
            result_log = await session.execute(
                select(TaskExecutionLog).where(TaskExecutionLog.id == log_id)  # type: ignore[arg-type]
            )
            log = result_log.scalar_one_or_none()

            if not log:
                return

            completed_at = datetime.now(UTC).replace(tzinfo=None)

            if log.started_at:
                duration_ms = int((completed_at - log.started_at).total_seconds() * 1000)
            else:
                duration_ms = None

            if result.is_err:
                status = TaskStatus.FAILED
                error_message = str(result.error) if result.error else "Unknown error"
                error_traceback = (
                    "".join(
                        traceback.format_exception(
                            type(result.error), result.error, result.error.__traceback__
                        )
                    )
                    if result.error
                    else None
                )
                event_type = "task_failed"
            else:
                status = TaskStatus.SUCCESS
                error_message = None
                error_traceback = None
                event_type = "task_completed"

            await session.execute(
                update(TaskExecutionLog)
                .where(TaskExecutionLog.id == log_id)  # type: ignore[arg-type]
                .values(
                    status=status,
                    completed_at=completed_at,
                    duration_ms=duration_ms,
                    error_message=error_message,
                    error_traceback=error_traceback,
                    updated_at=datetime.now(UTC).replace(tzinfo=None),
                )
            )
            await session.commit()

            try:
                await websocket_manager.broadcast_task_event(
                    event_type=event_type,
                    task_name=message.task_name,
                    status=status,
                    task_id=message.task_id,
                    duration_ms=duration_ms,
                    error_message=error_message,
                    params=message.kwargs if message.kwargs else None,
                )
            except Exception as e:
                logger.warning(f"Failed to broadcast {event_type} event: {e}")
