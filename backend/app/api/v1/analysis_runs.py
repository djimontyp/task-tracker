"""API endpoints for Analysis Run management.

Provides endpoints for creating, listing, and managing AI analysis runs
with validation rules and WebSocket event broadcasting.
"""

import logging
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import AnalysisRunCreate, AnalysisRunListResponse, AnalysisRunPublic
from app.services import AnalysisRunCRUD, AnalysisRunValidator, websocket_manager
from app.services.websocket_manager import WebSocketManager
from app.services.metrics_broadcaster import metrics_broadcaster

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/runs", tags=["analysis"])


def get_ws_manager() -> WebSocketManager:
    """Dependency for getting WebSocket manager."""
    return websocket_manager


@router.get(
    "",
    response_model=AnalysisRunListResponse,
    summary="List analysis runs",
    description="Get list of all analysis runs with pagination and filters.",
)
async def list_runs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    status: str | None = Query(None, description="Filter by status"),
    trigger_type: str | None = Query(None, description="Filter by trigger type"),
    start_date: datetime | None = Query(None, description="Filter by created_at >= start_date (ISO 8601)"),
    end_date: datetime | None = Query(None, description="Filter by created_at <= end_date (ISO 8601)"),
    session: AsyncSession = Depends(get_session),
) -> AnalysisRunListResponse:
    """List all analysis runs with pagination and filters.

    Supports filtering by status, trigger type, and date range.
    Results are sorted by created_at in descending order (newest first).

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        status: Filter by run status (e.g., pending, running, completed, closed)
        trigger_type: Filter by trigger type (e.g., manual, scheduled)
        start_date: Filter runs created on or after this date
        end_date: Filter runs created on or before this date
        session: Database session

    Returns:
        List of analysis runs with proposal counts and metrics
    """
    crud = AnalysisRunCRUD(session)
    runs, total = await crud.list(
        skip=skip,
        limit=limit,
        status=status,
        trigger_type=trigger_type,
        start_date=start_date,
        end_date=end_date,
    )
    page = (skip // limit) + 1 if limit else 1
    return AnalysisRunListResponse(
        items=runs,
        total=total,
        page=page,
        page_size=limit,
    )


@router.post(
    "",
    response_model=AnalysisRunPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create analysis run",
    description="Create new analysis run with validation (no unclosed runs allowed).",
)
async def create_run(
    run_data: AnalysisRunCreate,
    session: AsyncSession = Depends(get_session),
    ws_manager: WebSocketManager = Depends(get_ws_manager),
) -> AnalysisRunPublic:
    """Create new analysis run with config snapshot.

    Validates that no unclosed runs exist before creating a new one.
    An unclosed run is one with status: pending/running/completed/reviewed.

    Captures configuration snapshot for reproducibility, including:
    - Agent assignment details
    - Project configuration (if provided)
    - Time window settings

    Broadcasts WebSocket event on successful creation.

    Args:
        run_data: Run configuration (time_window, agent_assignment_id, etc.)
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Created analysis run with status="pending"

    Raises:
        HTTPException 409: Unclosed runs exist (must close them first)
        HTTPException 404: Agent assignment or project config not found
        HTTPException 400: Invalid run configuration
    """
    # Validate: no unclosed runs
    validator = AnalysisRunValidator(session)
    can_start, error = await validator.can_start_new_run()
    if not can_start:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error,
        )

    # Create run
    try:
        crud = AnalysisRunCRUD(session)
        run = await crud.create(run_data.model_dump(exclude_unset=True))
        logger.info(
            f"Created analysis run {run.id} for time window {run_data.time_window_start} to {run_data.time_window_end}"
        )

        # Broadcast WebSocket event
        await ws_manager.broadcast(
            "analysis",
            {
                "topic": "analysis",
                "event": "run_created",
                "data": {
                    "id": str(run.id),
                    "status": run.status,
                    "trigger_type": run.trigger_type,
                    "time_window_start": run.time_window_start.isoformat(),
                    "time_window_end": run.time_window_end.isoformat(),
                },
            },
        )

        # Broadcast metrics update
        await metrics_broadcaster.broadcast_on_analysis_run_change(session)

        return run
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


@router.get(
    "/{run_id}",
    response_model=AnalysisRunPublic,
    summary="Get analysis run by ID",
    description="Get single analysis run with full details including config snapshot.",
)
async def get_run(
    run_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> AnalysisRunPublic:
    """Get analysis run by ID.

    Returns complete run details including:
    - Configuration snapshot
    - Proposal counts (total, approved, rejected, pending)
    - LLM usage metrics (tokens, cost)
    - Accuracy metrics (if closed)

    Args:
        run_id: Analysis run UUID
        session: Database session

    Returns:
        Analysis run with all details

    Raises:
        HTTPException 404: Run not found
    """
    crud = AnalysisRunCRUD(session)
    run = await crud.get(run_id)

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run with ID '{run_id}' not found",
        )

    return run


@router.put(
    "/{run_id}/close",
    response_model=AnalysisRunPublic,
    summary="Close analysis run",
    description="Close run and calculate accuracy metrics (requires proposals_pending == 0).",
)
async def close_run(
    run_id: UUID,
    session: AsyncSession = Depends(get_session),
    ws_manager: WebSocketManager = Depends(get_ws_manager),
) -> AnalysisRunPublic:
    """Close analysis run and calculate accuracy metrics.

    Validates that all proposals have been reviewed (proposals_pending == 0).
    Calculates accuracy metrics including approval/rejection rates.

    Sets status to "closed" and records closed_at timestamp.
    Broadcasts WebSocket event on successful closure.

    Args:
        run_id: Analysis run UUID
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Updated analysis run with status="closed" and accuracy_metrics

    Raises:
        HTTPException 404: Run not found
        HTTPException 400: Proposals still pending review
    """
    # Validate: proposals_pending == 0
    validator = AnalysisRunValidator(session)
    can_close, error = await validator.can_close_run(run_id)
    if not can_close:
        if "not found" in str(error):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    # Close run
    crud = AnalysisRunCRUD(session)
    run = await crud.close(run_id)

    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run with ID '{run_id}' not found",
        )

    logger.info(f"Closed analysis run {run_id} with accuracy: {run.accuracy_metrics}")

    # Broadcast WebSocket event
    await ws_manager.broadcast(
        "analysis",
        {
            "topic": "analysis",
            "event": "run_closed",
            "data": {
                "id": str(run.id),
                "status": run.status,
                "accuracy_metrics": run.accuracy_metrics,
            },
        },
    )

    # Broadcast metrics update
    await metrics_broadcaster.broadcast_on_analysis_run_change(session)

    return run


@router.post(
    "/{run_id}/start",
    summary="Start analysis run",
    description="Trigger background job to execute analysis run (TaskIQ) with optional RAG support.",
)
async def start_run(
    run_id: UUID,
    use_rag: bool = Query(
        False,
        description="Enable RAG (Retrieval-Augmented Generation) for context-aware proposal generation",
    ),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Trigger background job to execute analysis run.

    Enqueues TaskIQ job for background processing of the analysis run.
    The job will:
    1. Fetch messages in time window
    2. Apply prefiltering
    3. Send to LLM for task extraction (with optional RAG context)
    4. Create task proposals
    5. Update run metrics

    RAG (Retrieval-Augmented Generation) enhances proposal quality by:
    - Retrieving similar past proposals
    - Finding relevant knowledge base items
    - Including related historical messages
    - Providing context to avoid duplicate proposals

    Args:
        run_id: Analysis run UUID
        use_rag: Enable RAG for enhanced context-aware proposals
        session: Database session

    Returns:
        Status message confirming job submission

    Raises:
        HTTPException 404: Run not found

    Example:
        >>> POST /api/v1/analysis/runs/{run_id}/start?use_rag=true
        >>> # Returns: {"status": "started", "use_rag": true, ...}
    """
    # Validate run exists
    validator = AnalysisRunValidator(session)
    exists = await validator.validate_run_exists(run_id)
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis run with ID '{run_id}' not found",
        )

    # Trigger TaskIQ background job
    from app.tasks import execute_analysis_run

    await execute_analysis_run.kiq(str(run_id), use_rag=use_rag)

    logger.info(f"Triggered analysis run {run_id} via TaskIQ background job (RAG: {use_rag})")

    return {
        "status": "started",
        "message": "Analysis run job submitted for background processing",
        "run_id": str(run_id),
        "use_rag": use_rag,
    }
