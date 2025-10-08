"""API router for Agent Configuration management.

Provides CRUD endpoints for managing agent configurations and their task assignments.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentConfigCreate,
    AgentConfigPublic,
    AgentConfigUpdate,
    AgentTaskAssignmentCreate,
    AgentTaskAssignmentPublic,
)
from app.services import AgentCRUD, AssignmentCRUD
from app.database import get_session

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.post(
    "",
    response_model=AgentConfigPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create agent",
    description="Create new agent configuration with prompts and model settings.",
)
async def create_agent(
    agent_data: AgentConfigCreate,
    session: AsyncSession = Depends(get_session),
) -> AgentConfigPublic:
    """Create new agent configuration.

    Args:
        agent_data: Agent configuration (name, provider_id, model, prompts)
        session: Database session

    Returns:
        Created agent configuration

    Raises:
        HTTPException 409: Agent name already exists
        HTTPException 404: Provider not found
        HTTPException 400: Invalid configuration
    """
    try:
        crud = AgentCRUD(session)
        agent = await crud.create(agent_data)
        return agent
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        if "not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "",
    response_model=List[AgentConfigPublic],
    summary="List all agents",
    description="Get list of all configured agents with pagination and filters.",
)
async def list_agents(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    provider_id: UUID | None = None,
    session: AsyncSession = Depends(get_session),
) -> List[AgentConfigPublic]:
    """List all agent configurations.

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        active_only: Filter for active agents only
        provider_id: Filter by provider ID
        session: Database session

    Returns:
        List of agent configurations
    """
    crud = AgentCRUD(session)
    agents = await crud.list(
        skip=skip,
        limit=limit,
        active_only=active_only,
        provider_id=provider_id,
    )
    return agents


@router.get(
    "/{agent_id}",
    response_model=AgentConfigPublic,
    summary="Get agent by ID",
    description="Get single agent configuration with provider details.",
)
async def get_agent(
    agent_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> AgentConfigPublic:
    """Get agent by ID.

    Args:
        agent_id: Agent UUID
        session: Database session

    Returns:
        Agent configuration

    Raises:
        HTTPException 404: Agent not found
    """
    crud = AgentCRUD(session)
    agent = await crud.get(agent_id)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    return agent


@router.put(
    "/{agent_id}",
    response_model=AgentConfigPublic,
    summary="Update agent",
    description="Update agent configuration. Doesn't affect running instances (per FR-011).",
)
async def update_agent(
    agent_id: UUID,
    update_data: AgentConfigUpdate,
    session: AsyncSession = Depends(get_session),
) -> AgentConfigPublic:
    """Update agent configuration.

    Args:
        agent_id: Agent UUID
        update_data: Fields to update
        session: Database session

    Returns:
        Updated agent configuration

    Raises:
        HTTPException 404: Agent or provider not found
        HTTPException 400: Invalid update data
    """
    try:
        crud = AgentCRUD(session)
        agent = await crud.update(agent_id, update_data)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID '{agent_id}' not found",
            )

        return agent
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete agent",
    description="Delete agent configuration. Running instances continue independently (per FR-033).",
)
async def delete_agent(
    agent_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete agent configuration.

    Per FR-033: Deletion allowed even with active task assignments.
    Running agent instances continue until task completion.

    Args:
        agent_id: Agent UUID
        session: Database session

    Raises:
        HTTPException 404: Agent not found
    """
    crud = AgentCRUD(session)
    deleted = await crud.delete(agent_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )


@router.post(
    "/{agent_id}/tasks",
    response_model=AgentTaskAssignmentPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Assign task to agent",
    description="Create agent-task assignment. System creates dedicated agent instance.",
)
async def assign_task(
    agent_id: UUID,
    assignment_data: AgentTaskAssignmentCreate,
    session: AsyncSession = Depends(get_session),
) -> AgentTaskAssignmentPublic:
    """Assign task to agent.

    Args:
        agent_id: Agent UUID
        assignment_data: Task assignment data (must include task_id)
        session: Database session

    Returns:
        Created assignment

    Raises:
        HTTPException 409: Assignment already exists
        HTTPException 404: Agent or task not found
        HTTPException 400: Invalid assignment data
    """
    # Override agent_id from path
    assignment_data.agent_id = agent_id

    try:
        crud = AssignmentCRUD(session)
        assignment = await crud.create(assignment_data)
        return assignment
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e),
            )
        if "not found" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e),
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/{agent_id}/tasks",
    response_model=List[AgentTaskAssignmentPublic],
    summary="List agent's tasks",
    description="Get all tasks assigned to this agent.",
)
async def get_agent_tasks(
    agent_id: UUID,
    active_only: bool = False,
    session: AsyncSession = Depends(get_session),
) -> List[AgentTaskAssignmentPublic]:
    """List tasks assigned to agent.

    Args:
        agent_id: Agent UUID
        active_only: Filter for active assignments only
        session: Database session

    Returns:
        List of task assignments (empty array if none)
    """
    crud = AssignmentCRUD(session)
    assignments = await crud.list_by_agent(agent_id, active_only=active_only)
    return assignments


@router.delete(
    "/{agent_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unassign task from agent",
    description="Remove agent-task assignment.",
)
async def unassign_task(
    agent_id: UUID,
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Remove task assignment from agent.

    Args:
        agent_id: Agent UUID
        task_id: Task UUID
        session: Database session

    Raises:
        HTTPException 404: Assignment not found
    """
    crud = AssignmentCRUD(session)

    # Find assignment by agent_id and task_id
    assignment = await crud.get_by_agent_and_task(agent_id, task_id)

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment between agent '{agent_id}' and task '{task_id}' not found",
        )

    await crud.delete(assignment.id)
