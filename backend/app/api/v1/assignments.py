"""API endpoints for Agent-Task Assignment management.

Provides endpoints for listing and managing agent-task assignments
with detailed information from joined tables.
"""

import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models.agent_task_assignment import AgentTaskAssignmentWithDetails
from app.services import AssignmentCRUD

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.get(
    "",
    response_model=List[AgentTaskAssignmentWithDetails],
    summary="List all assignments with details",
    description="""
Get all agent-task assignments with detailed information from joined tables.

Returns assignment data enriched with:
- **agent_name**: Name of the assigned agent
- **task_name**: Name of the assigned task
- **provider_name**: Name of the LLM provider used by the agent
- **provider_type**: Type of the LLM provider (ollama/openai)

This endpoint performs optimized JOIN queries to fetch all related data
in a single database roundtrip for better performance.

Use filters and pagination to manage large datasets efficiently.
""",
)
async def list_all_assignments(
    active_only: bool = Query(
        False,
        description="Filter for active assignments only (is_active=true)",
    ),
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(
        100,
        ge=1,
        le=1000,
        description="Maximum number of records to return (max: 1000)",
    ),
    session: AsyncSession = Depends(get_session),
) -> List[AgentTaskAssignmentWithDetails]:
    """List all agent-task assignments with detailed information.

    Executes optimized JOIN queries to retrieve assignment data along with
    related agent, task, and provider information in a single database query.

    Args:
        active_only: If True, returns only active assignments (default: False)
        skip: Number of records to skip for pagination (default: 0)
        limit: Maximum number of records to return (default: 100, max: 1000)
        session: Database session (injected)

    Returns:
        List of assignments with detailed information including agent name,
        task name, provider name, and provider type.

    Examples:
        - GET /api/v1/assignments - Get all assignments
        - GET /api/v1/assignments?active_only=true - Get only active assignments
        - GET /api/v1/assignments?skip=10&limit=20 - Get assignments 11-30
    """
    crud = AssignmentCRUD(session)
    assignments = await crud.list_with_details(
        active_only=active_only,
        skip=skip,
        limit=limit,
    )
    logger.info(
        f"Retrieved {len(assignments)} assignments "
        f"(active_only={active_only}, skip={skip}, limit={limit})"
    )
    return assignments
