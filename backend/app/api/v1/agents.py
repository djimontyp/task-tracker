"""API endpoints for Agent Configuration management.

Provides CRUD endpoints for managing agent configurations, task assignments,
and agent testing functionality.
"""

import json
import logging
from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic_ai.exceptions import ModelHTTPError
from sqlalchemy.exc import IntegrityError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.schemas.agent import AgentTestRequest, AgentTestResponse
from app.api.v1.schemas.golden_set import (
    GoldenSetTestProgress,
    GoldenSetTestReport,
    GoldenSetTestRequest,
)
from app.schemas.agent_stats import AgentStats
from app.database import get_session
from app.models import (
    AgentConfigCreate,
    AgentConfigPublic,
    AgentConfigUpdate,
    AgentTaskAssignmentCreate,
    AgentTaskAssignmentPublic,
)
from app.services import AgentCRUD, AssignmentCRUD
from app.services.agent_service import AgentTestService
from app.services.agent_stats_service import AgentStatsService
from app.services.golden_set_service import GoldenSetTestService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


# ============================================================================
# CRUD Operations
# ============================================================================


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
        agent = await crud.create_agent(agent_data)
        logger.info(f"Created agent '{agent.name}' with ID {agent.id}")
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
    response_model=list[AgentConfigPublic],
    summary="List all agents",
    description="Get list of all configured agents with pagination and filters.",
)
async def list_agents(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    active_only: bool = Query(False, description="Filter for active agents only"),
    provider_id: UUID | None = Query(None, description="Filter by provider ID"),
    session: AsyncSession = Depends(get_session),
) -> list[AgentConfigPublic]:
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
    agents = await crud.list_agents(
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
    agent = await crud.get_agent(agent_id)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    return agent


@router.get(
    "/{agent_id}/stats",
    response_model=AgentStats,
    summary="Get agent statistics",
    description="Get real-time performance statistics for an agent (Vital Signs).",
)
async def get_agent_stats(
    agent_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> AgentStats:
    """Get agent statistics.

    Calculates:
    - Last Active (Recency)
    - Success Rate (Reliability)
    - 24h Load (Volume)
    - Avg Duration (Performance)

    Args:
        agent_id: Agent UUID
        session: Database session

    Returns:
        Agent statistics object
    
    Raises:
        HTTPException 404: Agent not found
    """
    # Verify agent exists first
    crud = AgentCRUD(session)
    agent = await crud.get_agent(agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )
        
    stats_service = AgentStatsService(session)
    return await stats_service.get_stats(agent_id)


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
        agent = await crud.update_agent(agent_id, update_data)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent with ID '{agent_id}' not found",
            )

        logger.info(f"Updated agent '{agent.name}' (ID: {agent.id})")
        return agent
    except IntegrityError as e:
        # Handle duplicate name constraint violation
        if "unique constraint" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Agent with name '{update_data.name}' already exists",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database integrity error",
        )
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
    deleted = await crud.delete_agent(agent_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID '{agent_id}' not found",
        )

    logger.info(f"Deleted agent (ID: {agent_id})")


# ============================================================================
# Task Assignment Operations
# ============================================================================


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
        assignment = await crud.create_assignment(assignment_data)
        logger.info(f"Assigned task '{assignment.task_id}' to agent '{agent_id}' (assignment ID: {assignment.id})")
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
    response_model=list[AgentTaskAssignmentPublic],
    summary="List agent's tasks",
    description="Get all tasks assigned to this agent.",
)
async def get_agent_tasks(
    agent_id: UUID,
    active_only: bool = Query(False, description="Filter for active assignments only"),
    session: AsyncSession = Depends(get_session),
) -> list[AgentTaskAssignmentPublic]:
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
    logger.info(f"Unassigned task '{task_id}' from agent '{agent_id}' (assignment ID: {assignment.id})")


# ============================================================================
# Agent Testing
# ============================================================================


@router.post(
    "/{agent_id}/test",
    response_model=AgentTestResponse,
    summary="Test agent with custom prompt",
    response_description="Agent test response with LLM output",
)
async def test_agent(
    agent_id: UUID,
    request: AgentTestRequest,
    session: AsyncSession = Depends(get_session),
) -> AgentTestResponse:
    """Test an agent configuration with a custom prompt.

    Sends the provided prompt to the LLM using the agent's configuration
    (system prompt, model, temperature, etc.) and returns the response.

    Useful for validating agent behavior before deploying to production tasks.
    Requires the associated provider to be validated and active.

    Args:
        agent_id: Agent UUID
        request: Test request with prompt
        session: Database session

    Returns:
        Test response with LLM output and execution metrics

    Raises:
        HTTPException 404: Agent not found
        HTTPException 400: Invalid prompt or provider configuration
        HTTPException 500: LLM execution failed
    """
    service = AgentTestService(session)

    try:
        result = await service.test_agent(agent_id, request.prompt)
        logger.info(f"Successfully tested agent '{agent_id}' (execution time: {result.elapsed_time:.2f}s)")
        return result
    except ValueError as e:
        # Handle known validation errors
        raise HTTPException(status_code=400, detail=str(e))
    except ModelHTTPError as e:
        # Handle model-specific HTTP errors (e.g., model doesn't support tools)
        error_body = getattr(e, "body", {}) or {}
        error_message = error_body.get("message", str(e)) if isinstance(error_body, dict) else str(e)
        model_name = getattr(e, "model_name", "unknown")

        if "does not support tools" in error_message:
            logger.warning(f"Model {model_name} does not support tools: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' does not support function calling (tools). "
                f"Please use a different model that supports tools, such as: "
                f"llama3.2, mistral, qwen2.5, or GPT models.",
            )

        # Re-raise other ModelHTTPError as 502 (bad gateway to upstream LLM)
        logger.error(f"LLM API error for agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"LLM API error: {error_message}",
        )
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Failed to test agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent test failed: {str(e)}")


@router.post(
    "/{agent_id}/golden-set-test",
    response_model=GoldenSetTestReport,
    summary="Run Golden Set test",
    description="Run agent against predefined test messages with ground truth labels.",
)
async def run_golden_set_test(
    agent_id: UUID,
    request: GoldenSetTestRequest,
    session: AsyncSession = Depends(get_session),
) -> GoldenSetTestReport:
    """Run Golden Set test against an agent.

    Tests the agent's scoring accuracy using predefined messages with
    ground truth labels. Returns detailed metrics including pass/fail
    rates and classification accuracy.

    Args:
        agent_id: Agent UUID to test
        request: Test configuration (mode: quick/medium)
        session: Database session

    Returns:
        Complete test report with metrics and failures

    Raises:
        HTTPException 404: Agent or provider not found
        HTTPException 400: Invalid configuration
        HTTPException 500: Test execution failed
    """
    service = GoldenSetTestService(session)

    try:
        report = await service.run_test(
            agent_id=agent_id,
            mode=request.mode,
            golden_set_path=request.golden_set_path,
        )
        logger.info(
            f"Golden Set test completed for agent '{agent_id}': "
            f"verdict={report.verdict}, pass={report.scoring_pass}/{report.total_messages}"
        )
        return report
    except FileNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        if "not found" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Golden Set test failed for agent {agent_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Golden Set test failed: {str(e)}")


@router.post(
    "/{agent_id}/golden-set-test-stream",
    summary="Run Golden Set test with streaming",
    description="Run agent test with real-time progress updates via SSE.",
    response_class=StreamingResponse,
)
async def run_golden_set_test_stream(
    agent_id: UUID,
    request: GoldenSetTestRequest,
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """Run Golden Set test with streaming progress updates.

    Returns Server-Sent Events (SSE) stream with progress updates
    for each message, followed by the final report.

    Event types:
    - progress: GoldenSetTestProgress for each scored message
    - complete: GoldenSetTestReport as final event
    - error: Error message if test fails

    Args:
        agent_id: Agent UUID to test
        request: Test configuration (mode: quick/medium)
        session: Database session

    Returns:
        SSE stream with progress and final report
    """
    service = GoldenSetTestService(session)

    async def generate_events() -> AsyncIterator[str]:
        """Generate SSE events for test progress."""
        try:
            async for item in service.run_test_streaming(
                agent_id=agent_id,
                mode=request.mode,
                golden_set_path=request.golden_set_path,
            ):
                if isinstance(item, GoldenSetTestProgress):
                    yield f"event: progress\ndata: {item.model_dump_json()}\n\n"
                elif isinstance(item, GoldenSetTestReport):
                    yield f"event: complete\ndata: {item.model_dump_json()}\n\n"
                    logger.info(
                        f"Golden Set streaming test completed for agent '{agent_id}': "
                        f"verdict={item.verdict}"
                    )
        except ValueError as e:
            error_data = json.dumps({"error": str(e)})
            yield f"event: error\ndata: {error_data}\n\n"
        except Exception as e:
            logger.error(f"Golden Set streaming test failed for agent {agent_id}: {e}", exc_info=True)
            error_data = json.dumps({"error": f"Test failed: {str(e)}"})
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
