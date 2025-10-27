"""Tests for SchedulerService job management."""

import pytest
from app.models.scheduled_job import JobStatus, ScheduledJobCreate, ScheduledJobUpdate
from app.services.scheduler_service import SchedulerService
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
def scheduler_service() -> SchedulerService:
    """Create scheduler service instance (without starting APScheduler)."""
    return SchedulerService()


@pytest.mark.asyncio
async def test_create_job_basic(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test creating a basic scheduled job."""
    job_data = ScheduledJobCreate(
        name="Test Job",
        description="Test description",
        schedule_cron="0 9 * * *",
        enabled=True,
        task_name="test_task",
    )

    job = await scheduler_service.create_job(db_session, job_data)

    assert job.id is not None
    assert job.name == "Test Job"
    assert job.description == "Test description"
    assert job.schedule_cron == "0 9 * * *"
    assert job.enabled is True
    assert job.status == JobStatus.idle
    assert job.run_count == 0
    assert job.success_count == 0


@pytest.mark.asyncio
async def test_create_job_disabled(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test creating a disabled job (should not be scheduled)."""
    job_data = ScheduledJobCreate(
        name="Disabled Job",
        schedule_cron="0 * * * *",
        enabled=False,
        task_name="test_task",
    )

    job = await scheduler_service.create_job(db_session, job_data)

    assert job.enabled is False
    assert job.next_run is None


@pytest.mark.asyncio
async def test_get_job_by_id(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test retrieving a job by ID."""
    job_data = ScheduledJobCreate(
        name="Retrievable Job",
        schedule_cron="0 12 * * *",
        enabled=True,
    )

    created_job = await scheduler_service.create_job(db_session, job_data)
    assert created_job.id is not None

    retrieved_job = await scheduler_service.get_job(db_session, created_job.id)

    assert retrieved_job is not None
    assert retrieved_job.id == created_job.id
    assert retrieved_job.name == "Retrievable Job"


@pytest.mark.asyncio
async def test_get_job_not_found(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test retrieving a non-existent job returns None."""
    job = await scheduler_service.get_job(db_session, 99999)
    assert job is None


@pytest.mark.asyncio
async def test_list_jobs(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test listing jobs with pagination."""
    for i in range(5):
        job_data = ScheduledJobCreate(
            name=f"Job {i}",
            schedule_cron="0 * * * *",
            enabled=True,
        )
        await scheduler_service.create_job(db_session, job_data)

    jobs, total = await scheduler_service.list_jobs(db_session, skip=0, limit=10)

    assert len(jobs) == 5
    assert total == 5


@pytest.mark.asyncio
async def test_update_job(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test updating a job's configuration."""
    job_data = ScheduledJobCreate(
        name="Original Name",
        schedule_cron="0 9 * * *",
        enabled=True,
    )

    created_job = await scheduler_service.create_job(db_session, job_data)
    assert created_job.id is not None

    update_data = ScheduledJobUpdate(
        name="Updated Name",
        schedule_cron="0 18 * * *",
    )

    updated_job = await scheduler_service.update_job(db_session, created_job.id, update_data)

    assert updated_job is not None
    assert updated_job.name == "Updated Name"
    assert updated_job.schedule_cron == "0 18 * * *"


@pytest.mark.asyncio
async def test_delete_job(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test deleting a job."""
    job_data = ScheduledJobCreate(
        name="Job to Delete",
        schedule_cron="0 * * * *",
        enabled=True,
    )

    created_job = await scheduler_service.create_job(db_session, job_data)
    assert created_job.id is not None

    deleted = await scheduler_service.delete_job(db_session, created_job.id)
    assert deleted is True

    retrieved_job = await scheduler_service.get_job(db_session, created_job.id)
    assert retrieved_job is None


@pytest.mark.asyncio
async def test_toggle_job(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test toggling a job's enabled status."""
    job_data = ScheduledJobCreate(
        name="Toggle Job",
        schedule_cron="0 * * * *",
        enabled=True,
    )

    created_job = await scheduler_service.create_job(db_session, job_data)
    assert created_job.id is not None
    assert created_job.enabled is True

    toggled_job = await scheduler_service.toggle_job(db_session, created_job.id)
    assert toggled_job is not None
    assert toggled_job.enabled is False

    toggled_again = await scheduler_service.toggle_job(db_session, created_job.id)
    assert toggled_again is not None
    assert toggled_again.enabled is True


@pytest.mark.asyncio
async def test_create_job_with_invalid_cron(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test creating a job with invalid cron expression.

    Note: Without starting the scheduler, cron validation happens
    during scheduling, not creation. This test verifies the job can
    be created with any cron string.
    """
    job_data = ScheduledJobCreate(
        name="Invalid Cron Job",
        schedule_cron="invalid cron",
        enabled=False,
    )

    job = await scheduler_service.create_job(db_session, job_data)
    assert job.schedule_cron == "invalid cron"


@pytest.mark.asyncio
async def test_job_execution_counters(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test that job counters are properly initialized."""
    job_data = ScheduledJobCreate(
        name="Counter Job",
        schedule_cron="0 * * * *",
        enabled=True,
    )

    job = await scheduler_service.create_job(db_session, job_data)

    assert job.run_count == 0
    assert job.success_count == 0
    assert job.last_run is None
    assert job.error_message is None


@pytest.mark.asyncio
async def test_job_status_initial_state(
    db_session: AsyncSession,
    scheduler_service: SchedulerService,
) -> None:
    """Test that new jobs have idle status."""
    job_data = ScheduledJobCreate(
        name="Status Job",
        schedule_cron="0 * * * *",
        enabled=True,
    )

    job = await scheduler_service.create_job(db_session, job_data)

    assert job.status == JobStatus.idle
