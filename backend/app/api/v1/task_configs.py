"""API endpoints for Task Configuration management.

Provides CRUD endpoints for managing task configurations with Pydantic schemas.
Task configurations define structured output formats for AI agents.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import TaskConfigCreate, TaskConfigPublic, TaskConfigUpdate
from app.services import TaskCRUD

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/task-configs", tags=["task-configs"])


@router.post(
    "",
    response_model=TaskConfigPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create task configuration",
    description="Create new task configuration with Pydantic schema for structured outputs.",
)
async def create_task_config(
    task_data: TaskConfigCreate,
    session: AsyncSession = Depends(get_session),
) -> TaskConfigPublic:
    """Create new task configuration.

    Args:
        task_data: Task configuration (name, description, response_schema)
        session: Database session

    Returns:
        Created task configuration

    Raises:
        HTTPException 409: Task name already exists
        HTTPException 400: Invalid schema or configuration
    """
    try:
        crud = TaskCRUD(session)
        task = await crud.create(task_data.model_dump(exclude_unset=True))
        logger.info(f"Created task config '{task.name}' with ID {task.id}")
        return task
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        if "Invalid response schema" in str(e) or "schema" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=list[TaskConfigPublic],
    summary="List all task configurations",
    description="Get list of all configured task configurations with pagination.",
)
async def list_task_configs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    active_only: bool = Query(False, description="Filter for active tasks only"),
    session: AsyncSession = Depends(get_session),
) -> list[TaskConfigPublic]:
    """List all task configurations.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        active_only: Filter for active tasks only
        session: Database session

    Returns:
        List of task configurations with Pydantic schemas
    """
    crud = TaskCRUD(session)
    tasks = await crud.list(skip=skip, limit=limit, active_only=active_only)
    return tasks


@router.get(
    "/{task_id}",
    response_model=TaskConfigPublic,
    summary="Get task configuration by ID",
    description="Get single task configuration with Pydantic schema details.",
)
async def get_task_config(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> TaskConfigPublic:
    """Get task configuration by ID.

    Args:
        task_id: Task UUID
        session: Database session

    Returns:
        Task configuration with schema details

    Raises:
        HTTPException 404: Task not found
    """
    crud = TaskCRUD(session)
    task = await crud.get(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found",
        )

    return task


@router.put(
    "/{task_id}",
    response_model=TaskConfigPublic,
    summary="Update task configuration",
    description="Update task configuration. Running instances use assignment-time schema.",
)
async def update_task_config(
    task_id: UUID,
    update_data: TaskConfigUpdate,
    session: AsyncSession = Depends(get_session),
) -> TaskConfigPublic:
    """Update task configuration.

    Args:
        task_id: Task UUID
        update_data: Fields to update
        session: Database session

    Returns:
        Updated task configuration

    Raises:
        HTTPException 404: Task not found
        HTTPException 400: Invalid schema or update data
    """
    try:
        crud = TaskCRUD(session)
        task = await crud.update(task_id, update_data)

        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID '{task_id}' not found",
            )

        logger.info(f"Updated task config '{task.name}' (ID: {task.id})")
        return task
    except ValueError as e:
        if "Invalid response schema" in str(e) or "schema" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete task configuration",
    description="Delete task configuration. Cascades to agent_task_assignments.",
)
async def delete_task_config(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete task configuration.

    Args:
        task_id: Task UUID
        session: Database session

    Raises:
        HTTPException 404: Task not found
    """
    crud = TaskCRUD(session)
    deleted = await crud.delete(task_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID '{task_id}' not found",
        )

    logger.info(f"Deleted task config (ID: {task_id})")
