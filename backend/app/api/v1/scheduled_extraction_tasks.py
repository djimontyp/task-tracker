"""API endpoints for Scheduled Extraction Task management.

Provides CRUD endpoints for managing scheduled knowledge extraction tasks
that run on a cron schedule using specific agents.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import (
    AgentConfig,
    ScheduledExtractionTask,
    ScheduledExtractionTaskCreate,
    ScheduledExtractionTaskListResponse,
    ScheduledExtractionTaskPublic,
    ScheduledExtractionTaskUpdate,
)
from app.services.extraction_scheduler_service import extraction_scheduler_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scheduled-extraction-tasks", tags=["scheduled-extraction-tasks"])


# ============================================================================
# CRUD Operations
# ============================================================================


@router.post(
    "",
    response_model=ScheduledExtractionTaskPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create scheduled extraction task",
    description="Create new scheduled extraction task with cron schedule and agent configuration.",
)
async def create_task(
    task_data: ScheduledExtractionTaskCreate,
    session: AsyncSession = Depends(get_session),
) -> ScheduledExtractionTaskPublic:
    """Create new scheduled extraction task.

    Args:
        task_data: Task configuration (name, cron_schedule, agent_id, filters, auto-approve settings)
        session: Database session

    Returns:
        Created task configuration

    Raises:
        HTTPException 404: Agent not found
        HTTPException 400: Invalid configuration
    """
    # Verify agent exists
    agent_result = await session.execute(
        select(AgentConfig).where(AgentConfig.id == task_data.agent_id)  # type: ignore[arg-type]
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{task_data.agent_id}' not found",
        )

    # Create task
    task = ScheduledExtractionTask.model_validate(task_data)
    session.add(task)
    await session.commit()
    await session.refresh(task)

    logger.info(f"Created scheduled extraction task '{task.name}' with ID {task.id}")

    # Register with scheduler if active
    if task.is_active:
        try:
            await extraction_scheduler_service.schedule_task(task)
        except Exception as e:
            logger.warning(f"Failed to schedule task {task.id}: {e}")

    return ScheduledExtractionTaskPublic.model_validate(task)


@router.get(
    "",
    response_model=ScheduledExtractionTaskListResponse,
    summary="List scheduled extraction tasks",
    description="Get paginated list of scheduled extraction tasks with optional filters.",
)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    agent_id: UUID | None = Query(None, description="Filter by agent ID"),
    session: AsyncSession = Depends(get_session),
) -> ScheduledExtractionTaskListResponse:
    """List scheduled extraction tasks with pagination and filters.

    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        is_active: Filter for active/inactive tasks
        agent_id: Filter by specific agent
        session: Database session

    Returns:
        Paginated list of tasks
    """
    # Build query
    query = select(ScheduledExtractionTask)

    # Apply filters
    if is_active is not None:
        query = query.where(ScheduledExtractionTask.is_active == is_active)  # type: ignore[arg-type]
    if agent_id is not None:
        query = query.where(ScheduledExtractionTask.agent_id == agent_id)  # type: ignore[arg-type]

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and order
    offset = (page - 1) * page_size
    query = query.order_by(desc(ScheduledExtractionTask.created_at))  # type: ignore[arg-type]
    query = query.offset(offset).limit(page_size)

    # Execute query
    result = await session.execute(query)
    tasks = result.scalars().all()

    return ScheduledExtractionTaskListResponse(
        items=[ScheduledExtractionTaskPublic.model_validate(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{task_id}",
    response_model=ScheduledExtractionTaskPublic,
    summary="Get scheduled extraction task by ID",
    description="Get single scheduled extraction task details.",
)
async def get_task(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ScheduledExtractionTaskPublic:
    """Get scheduled extraction task by ID.

    Args:
        task_id: Task UUID
        session: Database session

    Returns:
        Task configuration

    Raises:
        HTTPException 404: Task not found
    """
    result = await session.execute(
        select(ScheduledExtractionTask).where(ScheduledExtractionTask.id == task_id)  # type: ignore[arg-type]
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled extraction task with ID '{task_id}' not found",
        )

    return ScheduledExtractionTaskPublic.model_validate(task)


@router.put(
    "/{task_id}",
    response_model=ScheduledExtractionTaskPublic,
    summary="Update scheduled extraction task",
    description="Update scheduled extraction task configuration.",
)
async def update_task(
    task_id: UUID,
    update_data: ScheduledExtractionTaskUpdate,
    session: AsyncSession = Depends(get_session),
) -> ScheduledExtractionTaskPublic:
    """Update scheduled extraction task.

    Args:
        task_id: Task UUID
        update_data: Fields to update
        session: Database session

    Returns:
        Updated task configuration

    Raises:
        HTTPException 404: Task or agent not found
        HTTPException 400: Invalid update data
    """
    # Find task
    result = await session.execute(
        select(ScheduledExtractionTask).where(ScheduledExtractionTask.id == task_id)  # type: ignore[arg-type]
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled extraction task with ID '{task_id}' not found",
        )

    # Track if is_active or cron_schedule changed
    was_active = task.is_active
    old_cron = task.cron_schedule

    # If updating agent_id, verify agent exists
    if update_data.agent_id is not None:
        agent_result = await session.execute(
            select(AgentConfig).where(AgentConfig.id == update_data.agent_id)  # type: ignore[arg-type]
        )
        agent = agent_result.scalar_one_or_none()
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID '{update_data.agent_id}' not found",
            )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(task, field, value)

    await session.commit()
    await session.refresh(task)

    logger.info(f"Updated scheduled extraction task '{task.name}' (ID: {task.id})")

    # Update scheduler based on changes
    try:
        schedule_changed = (
            task.cron_schedule != old_cron
            or task.is_active != was_active
            or "cron_schedule" in update_dict
            or "is_active" in update_dict
        )

        if schedule_changed:
            if task.is_active:
                await extraction_scheduler_service.schedule_task(task)
            else:
                await extraction_scheduler_service.unschedule_task(task.id)
    except Exception as e:
        logger.warning(f"Failed to update schedule for task {task.id}: {e}")

    return ScheduledExtractionTaskPublic.model_validate(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete scheduled extraction task",
    description="Delete scheduled extraction task.",
)
async def delete_task(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete scheduled extraction task.

    Args:
        task_id: Task UUID
        session: Database session

    Raises:
        HTTPException 404: Task not found
    """
    # Find task
    result = await session.execute(
        select(ScheduledExtractionTask).where(ScheduledExtractionTask.id == task_id)  # type: ignore[arg-type]
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled extraction task with ID '{task_id}' not found",
        )

    # Remove from scheduler first
    try:
        await extraction_scheduler_service.unschedule_task(task_id)
    except Exception as e:
        logger.warning(f"Failed to unschedule task {task_id}: {e}")

    await session.delete(task)
    await session.commit()

    logger.info(f"Deleted scheduled extraction task (ID: {task_id})")


@router.post(
    "/{task_id}/trigger",
    summary="Manually trigger scheduled extraction task",
    description="Manually trigger a scheduled extraction task to run immediately.",
)
async def trigger_task(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Manually trigger a scheduled extraction task.

    Args:
        task_id: Task UUID
        session: Database session

    Returns:
        Trigger result with status

    Raises:
        HTTPException 404: Task not found
    """
    result = await extraction_scheduler_service.trigger_task(session, task_id)

    if result.get("status") == "error" and result.get("reason") == "task_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheduled extraction task with ID '{task_id}' not found",
        )

    return result
