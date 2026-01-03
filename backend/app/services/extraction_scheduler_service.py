"""
Extraction Scheduler Service for managing scheduled knowledge extraction tasks.

Uses TaskIQ with NATS KeyValue storage for dynamic cron scheduling.
Each ScheduledExtractionTask maps to a TaskIQ ScheduledTask that triggers
the run_scheduled_extraction task.
"""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlmodel.ext.asyncio.session import AsyncSession
from taskiq.scheduler.scheduled_task.v2 import ScheduledTask as TaskIQScheduledTask
from taskiq_nats.schedule_source import NATSKeyValueScheduleSource

from app.models.scheduled_extraction_task import ScheduledExtractionTask
from core.config import settings


class ExtractionSchedulerService:
    """
    Service for managing scheduled extraction tasks with TaskIQ NATS scheduler.

    Provides:
    - sync_scheduled_tasks() - sync all active tasks from DB to TaskIQ
    - schedule_task() - add single task to scheduler
    - unschedule_task() - remove task from scheduler
    - trigger_task() - manually trigger task execution
    """

    SCHEDULE_ID_PREFIX = "extraction_task_"
    BUCKET_NAME = "pulse_radar_schedules"

    def __init__(self) -> None:
        """Initialize scheduler (NATS connection created on startup)."""
        self._schedule_source: NATSKeyValueScheduleSource | None = None
        self._started = False

    @property
    def schedule_source(self) -> NATSKeyValueScheduleSource:
        """Get schedule source, raising if not started."""
        if self._schedule_source is None:
            raise RuntimeError("ExtractionSchedulerService not started. Call startup() first.")
        return self._schedule_source

    async def startup(self) -> None:
        """Initialize NATS connection and schedule source."""
        if self._started:
            logger.debug("ExtractionSchedulerService already started")
            return

        try:
            self._schedule_source = NATSKeyValueScheduleSource(
                servers=settings.taskiq.taskiq_nats_servers,
                bucket_name=self.BUCKET_NAME,
                prefix="extraction",
            )
            await self._schedule_source.startup()
            self._started = True
            logger.info(
                f"ExtractionSchedulerService started with NATS servers: {settings.taskiq.taskiq_nats_servers}"
            )
        except Exception as e:
            logger.error(f"Failed to start ExtractionSchedulerService: {e}", exc_info=True)
            raise

    async def shutdown(self) -> None:
        """Close NATS connection."""
        if self._schedule_source is not None:
            await self._schedule_source.shutdown()
            self._schedule_source = None
            self._started = False
            logger.info("ExtractionSchedulerService shutdown complete")

    def _make_schedule_id(self, task_id: UUID) -> str:
        """Generate unique schedule ID for a task."""
        return f"{self.SCHEDULE_ID_PREFIX}{task_id}"

    def _parse_task_id_from_schedule(self, schedule_id: str) -> UUID | None:
        """Extract task UUID from schedule ID."""
        if schedule_id.startswith(self.SCHEDULE_ID_PREFIX):
            try:
                return UUID(schedule_id[len(self.SCHEDULE_ID_PREFIX) :])
            except ValueError:
                return None
        return None

    async def sync_scheduled_tasks(self, session: AsyncSession) -> dict[str, int]:
        """
        Synchronize all active ScheduledExtractionTasks with TaskIQ scheduler.

        Compares DB tasks with current schedules:
        - Adds missing schedules for active tasks
        - Removes schedules for inactive/deleted tasks

        Args:
            session: Database session

        Returns:
            Statistics dict with added/removed/unchanged counts
        """
        stats = {"added": 0, "removed": 0, "unchanged": 0, "errors": 0}

        # Get all active tasks from DB
        stmt = select(ScheduledExtractionTask).where(ScheduledExtractionTask.is_active == True)  # type: ignore[arg-type]  # noqa: E712
        result = await session.execute(stmt)
        db_tasks = {task.id: task for task in result.scalars().all()}

        # Get current schedules from NATS
        try:
            current_schedules = await self.schedule_source.get_schedules()
        except Exception as e:
            logger.error(f"Failed to get schedules from NATS: {e}")
            current_schedules = []

        # Build set of current schedule IDs (only our extraction tasks)
        current_schedule_ids: set[str] = set()
        for sched in current_schedules:
            if sched.schedule_id.startswith(self.SCHEDULE_ID_PREFIX):
                current_schedule_ids.add(sched.schedule_id)

        # Build set of expected schedule IDs
        expected_schedule_ids = {self._make_schedule_id(task_id) for task_id in db_tasks}

        # Remove schedules that should not exist
        to_remove = current_schedule_ids - expected_schedule_ids
        for schedule_id in to_remove:
            try:
                await self.schedule_source.delete_schedule(schedule_id)
                stats["removed"] += 1
                logger.info(f"Removed stale schedule: {schedule_id}")
            except Exception as e:
                logger.error(f"Failed to remove schedule {schedule_id}: {e}")
                stats["errors"] += 1

        # Add/update schedules for active tasks
        for task_id, task in db_tasks.items():
            schedule_id = self._make_schedule_id(task_id)
            try:
                if schedule_id in current_schedule_ids:
                    # Update: remove and re-add (TaskIQ does not have update)
                    await self.schedule_source.delete_schedule(schedule_id)

                await self._add_schedule_for_task(task)

                if schedule_id in current_schedule_ids:
                    stats["unchanged"] += 1
                else:
                    stats["added"] += 1

                logger.debug(f"Synced schedule for task '{task.name}' (ID: {task.id})")
            except Exception as e:
                logger.error(f"Failed to sync schedule for task {task.id}: {e}")
                stats["errors"] += 1

        logger.info(
            f"Schedule sync complete: added={stats['added']}, "
            f"removed={stats['removed']}, unchanged={stats['unchanged']}, "
            f"errors={stats['errors']}"
        )
        return stats

    async def schedule_task(self, task: ScheduledExtractionTask) -> bool:
        """
        Add or update schedule for a single task.

        Args:
            task: ScheduledExtractionTask to schedule

        Returns:
            True if scheduled successfully, False otherwise
        """
        if not task.is_active:
            logger.warning(f"Cannot schedule inactive task: {task.id}")
            return False

        schedule_id = self._make_schedule_id(task.id)

        try:
            # Remove existing schedule if any
            try:
                await self.schedule_source.delete_schedule(schedule_id)
            except Exception:
                pass  # Schedule might not exist

            await self._add_schedule_for_task(task)
            logger.info(f"Scheduled task '{task.name}' with cron: {task.cron_schedule}")
            return True
        except Exception as e:
            logger.error(f"Failed to schedule task {task.id}: {e}", exc_info=True)
            return False

    async def unschedule_task(self, task_id: UUID) -> bool:
        """
        Remove schedule for a task.

        Args:
            task_id: UUID of task to unschedule

        Returns:
            True if unscheduled successfully, False otherwise
        """
        schedule_id = self._make_schedule_id(task_id)

        try:
            await self.schedule_source.delete_schedule(schedule_id)
            logger.info(f"Unscheduled task: {task_id}")
            return True
        except Exception as e:
            logger.warning(f"Failed to unschedule task {task_id}: {e}")
            return False

    async def _add_schedule_for_task(self, task: ScheduledExtractionTask) -> None:
        """
        Create TaskIQ ScheduledTask for extraction task.

        Args:
            task: ScheduledExtractionTask to create schedule for
        """
        schedule = TaskIQScheduledTask(
            task_name="run_scheduled_extraction",
            labels={},
            args=[],
            kwargs={"scheduled_task_id": str(task.id)},
            schedule_id=self._make_schedule_id(task.id),
            cron=task.cron_schedule,
        )
        await self.schedule_source.add_schedule(schedule)

    async def get_scheduled_task_ids(self) -> list[UUID]:
        """
        Get list of currently scheduled task IDs.

        Returns:
            List of task UUIDs that have active schedules
        """
        try:
            schedules = await self.schedule_source.get_schedules()
            task_ids = []
            for sched in schedules:
                task_id = self._parse_task_id_from_schedule(sched.schedule_id)
                if task_id:
                    task_ids.append(task_id)
            return task_ids
        except Exception as e:
            logger.error(f"Failed to get scheduled task IDs: {e}")
            return []

    async def trigger_task(self, session: AsyncSession, task_id: UUID) -> dict[str, Any]:
        """
        Manually trigger execution of a scheduled task.

        Args:
            session: Database session
            task_id: UUID of task to trigger

        Returns:
            Result dict with status and details
        """
        from app.tasks.knowledge import run_scheduled_extraction

        # Get task from DB
        stmt = select(ScheduledExtractionTask).where(ScheduledExtractionTask.id == task_id)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        task = result.scalar_one_or_none()

        if not task:
            return {"status": "error", "reason": "task_not_found"}

        logger.info(f"Manually triggering task '{task.name}' (ID: {task.id})")

        # Queue the task via TaskIQ
        await run_scheduled_extraction.kiq(scheduled_task_id=str(task.id))

        return {
            "status": "triggered",
            "task_id": str(task.id),
            "task_name": task.name,
            "triggered_at": datetime.now(UTC).isoformat(),
        }


# Singleton instance
extraction_scheduler_service = ExtractionSchedulerService()
