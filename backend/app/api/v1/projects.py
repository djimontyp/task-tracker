"""API endpoints for ProjectConfig management.

Provides CRUD endpoints for project classification configurations
with keyword management and version tracking.
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import (
    ProjectConfigCreate,
    ProjectConfigListResponse,
    ProjectConfigPublic,
    ProjectConfigUpdate,
)
from app.services import ProjectConfigCRUD, websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/projects", tags=["projects"])


def get_ws_manager():
    """Dependency for getting WebSocket manager."""
    return websocket_manager


@router.get(
    "",
    response_model=ProjectConfigListResponse,
    summary="List project configurations",
    description="Get list of all project configurations with pagination and filters.",
)
async def list_projects(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    is_active: Optional[bool] = Query(
        None, description="Filter by active status (null = all)"
    ),
    session: AsyncSession = Depends(get_session),
) -> ProjectConfigListResponse:
    """List all project configurations with pagination and filters.

    Returns project configurations with keywords, glossary, components,
    and team settings for AI-driven classification.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        is_active: Filter by active status (None returns all projects)
        session: Database session

    Returns:
        List of project configurations with version info
    """
    crud = ProjectConfigCRUD(session)
    projects, total = await crud.list(
        skip=skip,
        limit=limit,
        is_active=is_active,
    )
    page = (skip // limit) + 1 if limit else 1
    return ProjectConfigListResponse(
        items=projects,
        total=total,
        page=page,
        page_size=limit,
    )


@router.post(
    "",
    response_model=ProjectConfigPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create project configuration",
    description="Create new project configuration with keywords and settings.",
)
async def create_project(
    project_data: ProjectConfigCreate,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> ProjectConfigPublic:
    """Create new project configuration.

    Project configurations define:
    - Classification keywords for AI detection
    - Domain-specific glossary
    - Component/module structure
    - Default team assignments
    - Priority rules

    Initial version is set to "1.0.0" (semantic versioning).
    Broadcasts WebSocket event on successful creation.

    Args:
        project_data: Project configuration data
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Created project configuration

    Raises:
        HTTPException 409: Project name already exists
        HTTPException 400: Keywords empty or invalid configuration
    """
    try:
        crud = ProjectConfigCRUD(session)
        project = await crud.create(project_data)
        logger.info(f"Created project config '{project.name}' with ID {project.id}")

        # Broadcast WebSocket event
        await ws_manager.broadcast(
            "projects",
            {
                "topic": "projects",
                "event": "created",
                "data": {
                    "id": str(project.id),
                    "name": project.name,
                    "version": project.version,
                    "is_active": project.is_active,
                },
            },
        )

        return project
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{project_id}",
    response_model=ProjectConfigPublic,
    summary="Get project configuration by ID",
    description="Get single project configuration with full details.",
)
async def get_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ProjectConfigPublic:
    """Get project configuration by ID.

    Returns complete project configuration including:
    - Classification keywords
    - Domain glossary
    - Components/modules
    - Team settings
    - Priority rules
    - Version history

    Args:
        project_id: Project configuration UUID
        session: Database session

    Returns:
        Project configuration with all details

    Raises:
        HTTPException 404: Project not found
    """
    crud = ProjectConfigCRUD(session)
    project = await crud.get(project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project configuration with ID '{project_id}' not found",
        )

    return project


@router.put(
    "/{project_id}",
    response_model=ProjectConfigPublic,
    summary="Update project configuration",
    description="Update project configuration with automatic version increment.",
)
async def update_project(
    project_id: UUID,
    update_data: ProjectConfigUpdate,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> ProjectConfigPublic:
    """Update project configuration with version tracking.

    Updates configuration fields and automatically increments version:
    - Minor version bump for config changes (keywords, glossary, etc.)
    - Updates updated_at timestamp

    Broadcasts WebSocket event on successful update.

    Args:
        project_id: Project configuration UUID
        update_data: Fields to update (partial)
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Updated project configuration with new version

    Raises:
        HTTPException 404: Project not found
        HTTPException 400: Invalid update data
    """
    try:
        crud = ProjectConfigCRUD(session)
        project = await crud.update(project_id, update_data)

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project configuration with ID '{project_id}' not found",
            )

        logger.info(
            f"Updated project config '{project.name}' (ID: {project.id}, version: {project.version})"
        )

        # Broadcast WebSocket event
        await ws_manager.broadcast(
            "projects",
            {
                "topic": "projects",
                "event": "updated",
                "data": {
                    "id": str(project.id),
                    "name": project.name,
                    "version": project.version,
                    "is_active": project.is_active,
                },
            },
        )

        return project
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete project configuration",
    description="Delete project configuration (may fail if referenced by runs).",
)
async def delete_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> None:
    """Delete project configuration.

    Args:
        project_id: Project configuration UUID
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Raises:
        HTTPException 404: Project not found
        HTTPException 409: Project referenced by analysis runs (FK constraint)

    Note:
        Deletion may fail if project is referenced by existing analysis runs
        due to foreign key constraints. Consider soft-delete (is_active=False)
        for production use.
    """
    crud = ProjectConfigCRUD(session)

    try:
        deleted = await crud.delete(project_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project configuration with ID '{project_id}' not found",
            )

        logger.info(f"Deleted project config (ID: {project_id})")

        # Broadcast WebSocket event
        await ws_manager.broadcast(
            "projects",
            {
                "topic": "projects",
                "event": "deleted",
                "data": {
                    "id": str(project_id),
                },
            },
        )
    except Exception as e:
        # Foreign key constraint violation
        if "foreign key" in str(e).lower() or "violates" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete project - it is referenced by analysis runs",
            )
        raise
