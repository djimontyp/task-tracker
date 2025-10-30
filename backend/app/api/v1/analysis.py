"""Analysis runs API endpoints.

Provides endpoints for managing analysis runs and task proposals.
"""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_db_session
from app.models import AnalysisRunCreate, AnalysisRunPublic
from app.services.analysis_service import AnalysisRunCRUD, AnalysisRunValidator
from app.tasks import execute_analysis_run

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/runs", response_model=AnalysisRunPublic, status_code=201)
async def create_analysis_run(
    run_data: AnalysisRunCreate,
    db: AsyncSession = Depends(get_db_session),
) -> AnalysisRunPublic:
    """Create new analysis run.

    Validates that no unclosed runs exist before creating a new run.

    Args:
        run_data: Analysis run creation data
        db: Database session

    Returns:
        Created analysis run

    Raises:
        HTTPException 409: If unclosed runs exist
        HTTPException 400: If agent_assignment or project_config not found
    """
    # Validate no unclosed runs exist
    validator = AnalysisRunValidator(db)
    can_start, error = await validator.can_start_new_run()

    if not can_start:
        raise HTTPException(status_code=409, detail=error)

    # Create run
    crud = AnalysisRunCRUD(db)
    try:
        run = await crud.create(run_data.model_dump(exclude_unset=True))
        return run
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/runs/{run_id}/start", response_model=dict)
async def start_analysis_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Start analysis run execution via TaskIQ background job.

    Triggers the background job to process messages and create proposals.
    The job will:
    1. Fetch messages in time window
    2. Pre-filter messages
    3. Create batches
    4. Process each batch with LLM
    5. Save proposals
    6. Broadcast progress via WebSocket

    Args:
        run_id: Analysis run UUID
        db: Database session

    Returns:
        Status confirmation with run_id

    Raises:
        HTTPException 404: If run not found
    """
    # Verify run exists
    validator = AnalysisRunValidator(db)
    exists = await validator.validate_run_exists(run_id)

    if not exists:
        raise HTTPException(status_code=404, detail=f"Run with ID '{run_id}' not found")

    # Trigger TaskIQ background job
    await execute_analysis_run.kiq(str(run_id))

    return {
        "status": "started",
        "run_id": str(run_id),
        "message": "Analysis run job triggered successfully",
    }


@router.get("/runs", response_model=list[AnalysisRunPublic])
async def list_analysis_runs(
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
    trigger_type: str | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> list[AnalysisRunPublic]:
    """List analysis runs with pagination and filters.

    Args:
        skip: Number of records to skip
        limit: Maximum records to return
        status: Filter by status
        trigger_type: Filter by trigger type
        db: Database session

    Returns:
        List of analysis runs
    """
    crud = AnalysisRunCRUD(db)
    runs, _ = await crud.list(
        skip=skip,
        limit=limit,
        status=status,
        trigger_type=trigger_type,
    )
    return runs


@router.get("/runs/{run_id}", response_model=AnalysisRunPublic)
async def get_analysis_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db_session),
) -> AnalysisRunPublic:
    """Get specific analysis run by ID.

    Args:
        run_id: Analysis run UUID
        db: Database session

    Returns:
        Analysis run details

    Raises:
        HTTPException 404: If run not found
    """
    crud = AnalysisRunCRUD(db)
    run = await crud.get(run_id)

    if not run:
        raise HTTPException(status_code=404, detail=f"Run with ID '{run_id}' not found")

    return run


@router.post("/runs/{run_id}/close", response_model=AnalysisRunPublic)
async def close_analysis_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db_session),
) -> AnalysisRunPublic:
    """Close analysis run and calculate accuracy metrics.

    Validates that all proposals have been reviewed before closing.

    Args:
        run_id: Analysis run UUID
        db: Database session

    Returns:
        Updated analysis run with accuracy metrics

    Raises:
        HTTPException 404: If run not found
        HTTPException 400: If proposals still pending
    """
    # Validate can close
    validator = AnalysisRunValidator(db)
    can_close, error = await validator.can_close_run(run_id)

    if not can_close:
        raise HTTPException(status_code=400, detail=error)

    # Close run
    crud = AnalysisRunCRUD(db)
    run = await crud.close(run_id)

    if not run:
        raise HTTPException(status_code=404, detail=f"Run with ID '{run_id}' not found")

    return run
