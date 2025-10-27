"""APScheduler integration service for automated job execution."""

from datetime import UTC, datetime
from typing import Any

from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_job import JobStatus, ScheduledJob, ScheduledJobCreate, ScheduledJobUpdate
from app.services.websocket_manager import websocket_manager
from core.config import settings


class SchedulerService:
    """
    Service for managing scheduled jobs with APScheduler.

    Provides persistent job storage with PostgreSQL, cron-based scheduling,
    manual triggers, and real-time status tracking via WebSocket.
    """

    def __init__(self) -> None:
        """Initialize scheduler (job store created on start)."""
        self.scheduler: AsyncIOScheduler | None = None
        self._started = False

    def _initialize_scheduler(self) -> None:
        """Initialize scheduler with PostgreSQL job store."""
        if self.scheduler is not None:
            return

        jobstores = {
            "default": SQLAlchemyJobStore(
                url=settings.database.database_url.replace("+asyncpg", ""),
            )
        }

        self.scheduler = AsyncIOScheduler(jobstores=jobstores, timezone="UTC")

    async def start(self) -> None:
        """Start the scheduler if not already running."""
        if not self._started:
            self._initialize_scheduler()
            if self.scheduler is not None:
                self.scheduler.start()
                self._started = True
                logger.info("Scheduler started successfully")

    async def shutdown(self) -> None:
        """Gracefully shutdown the scheduler."""
        if self._started and self.scheduler is not None:
            self.scheduler.shutdown()
            self._started = False
            logger.info("Scheduler shutdown complete")

    async def create_job(
        self,
        session: AsyncSession,
        job_data: ScheduledJobCreate,
    ) -> ScheduledJob:
        """
        Create a new scheduled job.

        Args:
            session: Database session
            job_data: Job creation data

        Returns:
            Created ScheduledJob instance

        Raises:
            ValueError: If cron expression is invalid
        """
        job = ScheduledJob(
            name=job_data.name,
            description=job_data.description,
            schedule_cron=job_data.schedule_cron,
            enabled=job_data.enabled,
            task_name=job_data.task_name,
            status=JobStatus.idle,
        )

        session.add(job)
        await session.commit()
        await session.refresh(job)

        if job.enabled:
            await self._schedule_job(job)

        logger.info(f"Created scheduled job: {job.name} (ID: {job.id})")
        return job

    async def update_job(
        self,
        session: AsyncSession,
        job_id: int,
        job_data: ScheduledJobUpdate,
    ) -> ScheduledJob | None:
        """
        Update an existing scheduled job.

        Args:
            session: Database session
            job_id: Job ID
            job_data: Update data

        Returns:
            Updated ScheduledJob or None if not found
        """
        stmt = select(ScheduledJob).where(ScheduledJob.id == job_id)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            return None

        update_data = job_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)

        await session.commit()
        await session.refresh(job)

        if self.scheduler is not None:
            self.scheduler.remove_job(str(job.id), jobstore="default")

        if job.enabled:
            await self._schedule_job(job)

        logger.info(f"Updated scheduled job: {job.name} (ID: {job.id})")
        return job

    async def delete_job(self, session: AsyncSession, job_id: int) -> bool:
        """
        Delete a scheduled job.

        Args:
            session: Database session
            job_id: Job ID

        Returns:
            True if deleted, False if not found
        """
        stmt = select(ScheduledJob).where(ScheduledJob.id == job_id)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            return False

        if self.scheduler is not None:
            self.scheduler.remove_job(str(job.id), jobstore="default")

        await session.delete(job)
        await session.commit()

        logger.info(f"Deleted scheduled job: {job.name} (ID: {job.id})")
        return True

    async def toggle_job(self, session: AsyncSession, job_id: int) -> ScheduledJob | None:
        """
        Toggle job enabled status.

        Args:
            session: Database session
            job_id: Job ID

        Returns:
            Updated ScheduledJob or None if not found
        """
        stmt = select(ScheduledJob).where(ScheduledJob.id == job_id)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            return None

        job.enabled = not job.enabled
        await session.commit()
        await session.refresh(job)

        if job.enabled:
            await self._schedule_job(job)
        else:
            if self.scheduler is not None:
                self.scheduler.remove_job(str(job.id), jobstore="default")

        logger.info(f"Toggled job {job.name} (ID: {job.id}): enabled={job.enabled}")
        return job

    async def trigger_job_manually(self, session: AsyncSession, job_id: int) -> ScheduledJob | None:
        """
        Manually trigger a job execution.

        Args:
            session: Database session
            job_id: Job ID

        Returns:
            ScheduledJob or None if not found
        """
        stmt = select(ScheduledJob).where(ScheduledJob.id == job_id)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        job = result.scalar_one_or_none()

        if not job or job.id is None:
            return None

        logger.info(f"Manual trigger for job: {job.name} (ID: {job.id})")
        await self._execute_job(job.id)

        await session.refresh(job)
        return job

    async def get_job(self, session: AsyncSession, job_id: int) -> ScheduledJob | None:
        """
        Get a job by ID.

        Args:
            session: Database session
            job_id: Job ID

        Returns:
            ScheduledJob or None if not found
        """
        stmt = select(ScheduledJob).where(ScheduledJob.id == job_id)  # type: ignore[arg-type]
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_jobs(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[list[ScheduledJob], int]:
        """
        List all jobs with pagination.

        Args:
            session: Database session
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            Tuple of (jobs list, total count)
        """
        stmt = select(ScheduledJob).offset(skip).limit(limit).order_by(ScheduledJob.created_at.desc())  # type: ignore[union-attr]
        result = await session.execute(stmt)
        jobs = list(result.scalars().all())

        count_stmt = select(ScheduledJob)
        count_result = await session.execute(count_stmt)
        total = len(list(count_result.scalars().all()))

        return jobs, total

    async def _schedule_job(self, job: ScheduledJob) -> None:
        """
        Schedule a job with APScheduler.

        Args:
            job: ScheduledJob instance
        """
        if self.scheduler is None:
            logger.warning(f"Cannot schedule job {job.name}: scheduler not initialized")
            return

        trigger = CronTrigger.from_crontab(job.schedule_cron, timezone="UTC")

        self.scheduler.add_job(
            func=self._execute_job,
            trigger=trigger,
            args=[job.id],
            id=str(job.id),
            name=job.name,
            replace_existing=True,
        )

        apscheduler_job = self.scheduler.get_job(str(job.id))
        if apscheduler_job is None:
            logger.warning(f"Failed to get APScheduler job for {job.name}")
            return

        next_run = apscheduler_job.next_run_time

        from app.database import AsyncSessionLocal

        async with AsyncSessionLocal() as session:
            stmt = select(ScheduledJob).where(ScheduledJob.id == job.id)  # type: ignore[arg-type]
            result = await session.execute(stmt)
            db_job = result.scalar_one_or_none()
            if db_job:
                db_job.next_run = next_run
                await session.commit()

        logger.info(f"Scheduled job '{job.name}' with cron: {job.schedule_cron}, next run: {next_run}")

    async def _execute_job(self, job_id: int) -> None:
        """
        Execute a scheduled job.

        Args:
            job_id: Job ID
        """
        from app.database import AsyncSessionLocal

        async with AsyncSessionLocal() as session:
            stmt = select(ScheduledJob).where(ScheduledJob.id == job_id)  # type: ignore[arg-type]
            result = await session.execute(stmt)
            job = result.scalar_one_or_none()

            if not job:
                logger.error(f"Job {job_id} not found for execution")
                return

            logger.info(f"Executing job: {job.name} (ID: {job.id})")

            job.status = JobStatus.running
            job.run_count += 1
            job.last_run = datetime.now(UTC)
            await session.commit()

            await websocket_manager.broadcast(
                "scheduler",
                {
                    "event": "job_started",
                    "job_id": job.id,
                    "name": job.name,
                    "run_count": job.run_count,
                },
            )

            try:
                if job.task_name:
                    await self._execute_taskiq_task(job.task_name)
                else:
                    logger.warning(f"Job {job.name} has no task_name configured")

                job.status = JobStatus.success
                job.success_count += 1
                job.error_message = None
                logger.info(f"Job {job.name} completed successfully")

            except Exception as e:
                job.status = JobStatus.failed
                job.error_message = str(e)
                logger.error(f"Job {job.name} failed: {e}")

            finally:
                if self.scheduler is not None:
                    apscheduler_job = self.scheduler.get_job(str(job.id))
                    if apscheduler_job and apscheduler_job.next_run_time:
                        job.next_run = apscheduler_job.next_run_time

                await session.commit()

                await websocket_manager.broadcast(
                    "scheduler",
                    {
                        "event": "job_completed",
                        "job_id": job.id,
                        "name": job.name,
                        "status": job.status.value,
                        "run_count": job.run_count,
                        "success_count": job.success_count,
                        "error_message": job.error_message,
                    },
                )

    async def _execute_taskiq_task(self, task_name: str) -> Any:
        """
        Execute a TaskIQ task by name.

        Args:
            task_name: TaskIQ task name (e.g., "extract_knowledge_from_messages_task")

        Raises:
            ValueError: If task not found
        """
        from app import tasks

        if not hasattr(tasks, task_name):
            raise ValueError(f"TaskIQ task '{task_name}' not found in app.tasks")

        task_func = getattr(tasks, task_name)

        if not hasattr(task_func, "kiq"):
            raise ValueError(f"'{task_name}' is not a TaskIQ task (missing .kiq method)")

        await task_func.kiq()
        logger.info(f"Queued TaskIQ task: {task_name}")


scheduler_service = SchedulerService()
