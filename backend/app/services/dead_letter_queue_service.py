"""Service for managing Dead Letter Queue (DLQ) for failed background tasks."""

import traceback
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.failed_task import FailedTask, FailedTaskStatus


class DeadLetterQueueService:
    """Service for managing failed background tasks in Dead Letter Queue.

    Provides functionality to record task failures, query failed tasks,
    and manage retry/abandonment of failed tasks.
    """

    def __init__(self, session: AsyncSession):
        """Initialize DLQ service.

        Args:
            session: Async database session for DLQ operations
        """
        self.session = session

    async def record_failure(
        self,
        task_name: str,
        task_args: dict[str, Any] | None,
        error: Exception,
        attempts: int = 0,
    ) -> FailedTask:
        """Record a failed task in the Dead Letter Queue.

        Args:
            task_name: Name of the failed task function
            task_args: Original task arguments as dictionary
            error: Exception that caused the failure
            attempts: Number of retry attempts made before recording

        Returns:
            FailedTask: The created failed task record
        """
        error_message = str(error)
        error_traceback = "".join(traceback.format_exception(type(error), error, error.__traceback__))

        failed_task = FailedTask(
            task_name=task_name,
            task_args=task_args,
            error_message=error_message,
            error_traceback=error_traceback,
            attempts=attempts,
            status=FailedTaskStatus.failed,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        self.session.add(failed_task)
        await self.session.commit()
        await self.session.refresh(failed_task)

        return failed_task

    async def get_failed_tasks(
        self,
        status: FailedTaskStatus | None = None,
        task_name: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[FailedTask], int]:
        """Query failed tasks with optional filters.

        Args:
            status: Filter by task status (failed/retrying/abandoned)
            task_name: Filter by task function name
            limit: Maximum number of results to return
            offset: Number of results to skip for pagination

        Returns:
            Tuple of (list of FailedTask, total count)
        """
        query = select(FailedTask)

        if status is not None:
            query = query.where(FailedTask.status == status)  # type: ignore[arg-type]

        if task_name is not None:
            query = query.where(FailedTask.task_name == task_name)  # type: ignore[arg-type]

        count_query = select(func.count()).select_from(query.subquery())
        total_count_result = await self.session.execute(count_query)
        total_count = total_count_result.scalar() or 0

        from sqlalchemy import desc

        query = query.order_by(desc(FailedTask.created_at))  # type: ignore[arg-type]
        query = query.offset(offset).limit(limit)

        result = await self.session.execute(query)
        failed_tasks = list(result.scalars().all())

        return failed_tasks, total_count

    async def get_failed_task(self, task_id: int) -> FailedTask | None:
        """Get a single failed task by ID.

        Args:
            task_id: ID of the failed task

        Returns:
            FailedTask if found, None otherwise
        """
        query = select(FailedTask).where(FailedTask.id == task_id)  # type: ignore[arg-type]
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def mark_retrying(self, task_id: int) -> FailedTask | None:
        """Mark a failed task as retrying.

        Args:
            task_id: ID of the failed task to retry

        Returns:
            Updated FailedTask if found, None otherwise
        """
        failed_task = await self.get_failed_task(task_id)
        if failed_task is None:
            return None

        failed_task.status = FailedTaskStatus.retrying
        failed_task.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(failed_task)

        return failed_task

    async def mark_abandoned(self, task_id: int) -> FailedTask | None:
        """Mark a failed task as permanently abandoned.

        Args:
            task_id: ID of the failed task to abandon

        Returns:
            Updated FailedTask if found, None otherwise
        """
        failed_task = await self.get_failed_task(task_id)
        if failed_task is None:
            return None

        failed_task.status = FailedTaskStatus.abandoned
        failed_task.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(failed_task)

        return failed_task

    async def increment_attempts(self, task_id: int) -> FailedTask | None:
        """Increment retry attempts counter for a failed task.

        Args:
            task_id: ID of the failed task

        Returns:
            Updated FailedTask if found, None otherwise
        """
        failed_task = await self.get_failed_task(task_id)
        if failed_task is None:
            return None

        failed_task.attempts += 1
        failed_task.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(failed_task)

        return failed_task

    async def delete_failed_task(self, task_id: int) -> bool:
        """Delete a failed task from DLQ.

        Args:
            task_id: ID of the failed task to delete

        Returns:
            True if deleted, False if not found
        """
        failed_task = await self.get_failed_task(task_id)
        if failed_task is None:
            return False

        await self.session.delete(failed_task)
        await self.session.commit()

        return True
