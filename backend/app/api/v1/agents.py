"""API endpoints for Agent Configuration management."""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select

from app.models import (
    AgentConfig,
    AgentConfigCreate,
    AgentConfigPublic,
    AgentConfigUpdate,
    LLMProvider,
)
from app.services.agent_service import (
    AgentTestService,
    TestAgentRequest,
    TestAgentResponse,
)
from ..deps import DatabaseDep

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


@router.get(
    "",
    response_model=List[AgentConfigPublic],
    summary="List all agents",
    response_description="List of agent configurations with optional filters",
)
async def list_agents(
    db: DatabaseDep,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    active_only: bool = Query(False, description="Filter for active agents only"),
    provider_id: Optional[UUID] = Query(None, description="Filter by provider ID"),
) -> List[AgentConfigPublic]:
    """
    Retrieve list of agent configurations with pagination and filters.

    Supports filtering by active status and provider association.
    Returns agents ordered by creation date (newest first).
    """
    query = select(AgentConfig).order_by(AgentConfig.created_at.desc())

    if active_only:
        query = query.where(AgentConfig.is_active == True)  # noqa: E712

    if provider_id:
        query = query.where(AgentConfig.provider_id == provider_id)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    agents = result.scalars().all()

    return [AgentConfigPublic.model_validate(agent) for agent in agents]


@router.get(
    "/{agent_id}",
    response_model=AgentConfigPublic,
    summary="Get agent by ID",
    response_description="Agent configuration details",
)
async def get_agent(agent_id: UUID, db: DatabaseDep) -> AgentConfigPublic:
    """
    Retrieve a specific agent configuration by UUID.

    Returns complete agent details including provider association,
    model configuration, and system prompt.
    """
    agent = await db.get(AgentConfig, agent_id)

    if not agent:
        raise HTTPException(
            status_code=404, detail=f"Agent with ID '{agent_id}' not found"
        )

    return AgentConfigPublic.model_validate(agent)


@router.post(
    "",
    response_model=AgentConfigPublic,
    summary="Create new agent",
    response_description="Created agent configuration",
    status_code=201,
)
async def create_agent(
    agent_data: AgentConfigCreate,
    db: DatabaseDep,
) -> AgentConfigPublic:
    """
    Create a new agent configuration.

    Validates that:
    - Agent name is unique
    - Associated provider exists
    - Temperature is within valid range (0.0-1.0)

    Returns the created agent with generated UUID.
    """
    # Check name uniqueness
    existing_result = await db.execute(
        select(AgentConfig).where(AgentConfig.name == agent_data.name)
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Agent with name '{agent_data.name}' already exists",
        )

    # Verify provider exists
    provider = await db.get(LLMProvider, agent_data.provider_id)
    if not provider:
        raise HTTPException(
            status_code=404,
            detail=f"Provider with ID '{agent_data.provider_id}' not found",
        )

    # Validate temperature range
    if agent_data.temperature is not None:
        if not (0.0 <= agent_data.temperature <= 1.0):
            raise HTTPException(
                status_code=400, detail="Temperature must be between 0.0 and 1.0"
            )

    # Create agent
    agent = AgentConfig(
        name=agent_data.name,
        description=agent_data.description,
        provider_id=agent_data.provider_id,
        model_name=agent_data.model_name,
        system_prompt=agent_data.system_prompt,
        temperature=agent_data.temperature,
        max_tokens=agent_data.max_tokens,
        is_active=agent_data.is_active,
    )

    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    logger.info(f"Created agent '{agent.name}' with ID {agent.id}")
    return AgentConfigPublic.model_validate(agent)


@router.put(
    "/{agent_id}",
    response_model=AgentConfigPublic,
    summary="Update agent",
    response_description="Updated agent configuration",
)
async def update_agent(
    agent_id: UUID,
    update_data: AgentConfigUpdate,
    db: DatabaseDep,
) -> AgentConfigPublic:
    """
    Update an existing agent configuration.

    Supports partial updates - only provided fields will be modified.
    Validates provider existence if provider_id is being updated.
    """
    agent = await db.get(AgentConfig, agent_id)

    if not agent:
        raise HTTPException(
            status_code=404, detail=f"Agent with ID '{agent_id}' not found"
        )

    # Get update dict excluding unset fields
    update_dict = update_data.model_dump(exclude_unset=True)

    # Validate name uniqueness if changing name
    if "name" in update_dict and update_dict["name"] != agent.name:
        existing_result = await db.execute(
            select(AgentConfig).where(AgentConfig.name == update_dict["name"])
        )
        existing = existing_result.scalar_one_or_none()

        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Agent with name '{update_dict['name']}' already exists",
            )

    # Verify new provider exists if changing provider
    if "provider_id" in update_dict:
        provider = await db.get(LLMProvider, update_dict["provider_id"])
        if not provider:
            raise HTTPException(
                status_code=404,
                detail=f"Provider with ID '{update_dict['provider_id']}' not found",
            )

    # Validate temperature range if updating
    if "temperature" in update_dict and update_dict["temperature"] is not None:
        if not (0.0 <= update_dict["temperature"] <= 1.0):
            raise HTTPException(
                status_code=400, detail="Temperature must be between 0.0 and 1.0"
            )

    # Apply updates
    for field, value in update_dict.items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)

    logger.info(f"Updated agent '{agent.name}' (ID: {agent.id})")
    return AgentConfigPublic.model_validate(agent)


@router.delete(
    "/{agent_id}",
    status_code=204,
    summary="Delete agent",
    response_description="Agent deleted successfully",
)
async def delete_agent(agent_id: UUID, db: DatabaseDep) -> None:
    """
    Delete an agent configuration.

    Note: Deletion is allowed even with active task assignments.
    Running agent instances continue until task completion.
    Cascades delete to agent_task_assignments due to FK constraint.
    """
    agent = await db.get(AgentConfig, agent_id)

    if not agent:
        raise HTTPException(
            status_code=404, detail=f"Agent with ID '{agent_id}' not found"
        )

    agent_name = agent.name
    await db.delete(agent)
    await db.commit()

    logger.info(f"Deleted agent '{agent_name}' (ID: {agent_id})")


@router.post(
    "/{agent_id}/test",
    response_model=TestAgentResponse,
    summary="Test agent with custom prompt",
    response_description="Agent test response with LLM output",
)
async def test_agent(
    agent_id: UUID,
    request: TestAgentRequest,
    db: DatabaseDep,
) -> TestAgentResponse:
    """
    Test an agent configuration with a custom prompt.

    Sends the provided prompt to the LLM using the agent's configuration
    (system prompt, model, temperature, etc.) and returns the response.

    Useful for validating agent behavior before deploying to production tasks.
    Requires the associated provider to be validated and active.
    """
    service = AgentTestService(db)

    try:
        result = await service.test_agent(agent_id, request.prompt)
        return result
    except ValueError as e:
        # Handle known validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Failed to test agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent test failed: {str(e)}")
