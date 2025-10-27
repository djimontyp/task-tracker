"""API endpoints for scheduled job management.

Provides endpoints for managing automated background jobs with cron scheduling,
execution tracking, manual triggers, and real-time status updates via WebSocket.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.scheduled_job import (
    ScheduledJobCreate,
    ScheduledJobListResponse,
    ScheduledJobPublic,
    ScheduledJobUpdate,
)
from app.services.scheduler_service import scheduler_service

router = APIRouter(prefix="/scheduler/jobs", tags=["scheduler"])


@router.get(
    "",
    response_model=ScheduledJobListResponse,
    summary="List scheduled jobs",
    description="Get list of all scheduled jobs with pagination and status information.",
)
async def list_jobs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: AsyncSession = Depends(get_session),
) -> ScheduledJobListResponse:
    """List all scheduled jobs with pagination.

    Returns jobs sorted by creation date with execution statistics,
    next run time, and current status.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        session: Database session

    Returns:
        List of scheduled jobs with pagination metadata
    """
    jobs, total = await scheduler_service.list_jobs(session, skip=skip, limit=limit)
    page = (skip // limit) + 1 if limit else 1

    return ScheduledJobListResponse(
        jobs=[ScheduledJobPublic.model_validate(job) for job in jobs],
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/{job_id}",
    response_model=ScheduledJobPublic,
    summary="Get job details",
    description="Retrieve detailed information about a specific scheduled job.",
)
async def get_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
) -> ScheduledJobPublic:
    """Get detailed information about a scheduled job.

    Args:
        job_id: Job ID
        session: Database session

    Returns:
        Complete job details including schedule, execution history, and status

    Raises:
        HTTPException: 404 if job not found
    """
    job = await scheduler_service.get_job(session, job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled job with ID {job_id} not found",
        )

    return ScheduledJobPublic.model_validate(job)


@router.post(
    "",
    response_model=ScheduledJobPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create scheduled job",
    description="Create a new scheduled job with cron expression.",
)
async def create_job(
    job_data: ScheduledJobCreate,
    session: AsyncSession = Depends(get_session),
) -> ScheduledJobPublic:
    """Create a new scheduled job.

    Creates a job with specified cron schedule. If enabled, the job
    will be automatically scheduled with APScheduler.

    Args:
        job_data: Job creation data with name, schedule, and task
        session: Database session

    Returns:
        Created job with calculated next run time

    Raises:
        HTTPException: 400 if cron expression is invalid

    Example:
        {
            "name": "Daily Knowledge Extraction",
            "description": "Extract knowledge from unprocessed messages",
            "schedule_cron": "0 9 * * *",
            "enabled": true,
            "task_name": "extract_knowledge_from_messages_task"
        }
    """
    try:
        job = await scheduler_service.create_job(session, job_data)
        return ScheduledJobPublic.model_validate(job)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid cron expression: {str(e)}",
        )


@router.put(
    "/{job_id}",
    response_model=ScheduledJobPublic,
    summary="Update scheduled job",
    description="Update job configuration including schedule and task name.",
)
async def update_job(
    job_id: int,
    job_data: ScheduledJobUpdate,
    session: AsyncSession = Depends(get_session),
) -> ScheduledJobPublic:
    """Update a scheduled job.

    Updates job configuration and reschedules if enabled. Only provided
    fields will be updated (partial update).

    Args:
        job_id: Job ID
        job_data: Update data with optional fields
        session: Database session

    Returns:
        Updated job details

    Raises:
        HTTPException: 404 if job not found
        HTTPException: 400 if cron expression is invalid
    """
    try:
        job = await scheduler_service.update_job(session, job_id, job_data)

        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scheduled job with ID {job_id} not found",
            )

        return ScheduledJobPublic.model_validate(job)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid cron expression: {str(e)}",
        )


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete scheduled job",
    description="Remove a scheduled job and unschedule its executions.",
)
async def delete_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a scheduled job.

    Removes job from APScheduler and database. This operation is permanent.

    Args:
        job_id: Job ID
        session: Database session

    Raises:
        HTTPException: 404 if job not found
    """
    deleted = await scheduler_service.delete_job(session, job_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled job with ID {job_id} not found",
        )


@router.post(
    "/{job_id}/toggle",
    response_model=ScheduledJobPublic,
    summary="Toggle job status",
    description="Enable or disable a scheduled job.",
)
async def toggle_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
) -> ScheduledJobPublic:
    """Toggle job enabled/disabled status.

    Toggles between enabled and disabled. When disabled, job is removed
    from scheduler. When enabled, job is rescheduled.

    Args:
        job_id: Job ID
        session: Database session

    Returns:
        Updated job with new enabled status

    Raises:
        HTTPException: 404 if job not found
    """
    job = await scheduler_service.toggle_job(session, job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled job with ID {job_id} not found",
        )

    return ScheduledJobPublic.model_validate(job)


@router.post(
    "/{job_id}/trigger",
    response_model=ScheduledJobPublic,
    summary="Manually trigger job",
    description="Execute a job immediately, outside its normal schedule.",
)
async def trigger_job(
    job_id: int,
    session: AsyncSession = Depends(get_session),
) -> ScheduledJobPublic:
    """Manually trigger job execution.

    Executes job immediately regardless of schedule. Does not affect
    next scheduled run time.

    Args:
        job_id: Job ID
        session: Database session

    Returns:
        Job details after manual execution

    Raises:
        HTTPException: 404 if job not found
    """
    job = await scheduler_service.trigger_job_manually(session, job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled job with ID {job_id} not found",
        )

    return ScheduledJobPublic.model_validate(job)
