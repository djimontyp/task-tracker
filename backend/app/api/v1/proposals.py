"""API endpoints for TaskProposal management.

Provides endpoints for reviewing, approving, rejecting, and merging
AI-generated task proposals with WebSocket event broadcasting.
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.models import (
    TaskProposalListResponse,
    TaskProposalPublic,
    TaskProposalUpdate,
)
from app.services import TaskProposalCRUD, websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/proposals", tags=["proposals"])


def get_ws_manager():
    """Dependency for getting WebSocket manager."""
    return websocket_manager


# Request schemas
class RejectProposalRequest(BaseModel):
    """Request schema for rejecting a proposal."""

    reason: str = Field(..., min_length=1, description="Rejection reason")


class MergeProposalRequest(BaseModel):
    """Request schema for merging a proposal."""

    target_task_id: UUID = Field(..., description="Target task UUID to merge with")


@router.get(
    "",
    response_model=TaskProposalListResponse,
    summary="List task proposals",
    description="Get list of all task proposals with pagination and filters.",
)
async def list_proposals(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    run_id: UUID | None = Query(None, description="Filter by analysis run ID"),
    status: str | None = Query(None, description="Filter by status (pending, approved, rejected, merged)"),
    confidence_min: float | None = Query(None, ge=0.0, le=1.0, description="Filter by confidence >= min"),
    confidence_max: float | None = Query(None, ge=0.0, le=1.0, description="Filter by confidence <= max"),
    session: AsyncSession = Depends(get_session),
) -> TaskProposalListResponse:
    """List all task proposals with pagination and filters.

    Supports filtering by analysis run, status, and confidence range.
    Results are sorted by confidence in descending order (highest confidence first).

    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        run_id: Filter by analysis run UUID
        status: Filter by proposal status
        confidence_min: Filter proposals with confidence >= min
        confidence_max: Filter proposals with confidence <= max
        session: Database session

    Returns:
        List of task proposals with source messages and LLM reasoning
    """
    crud = TaskProposalCRUD(session)
    proposals, total = await crud.list(
        skip=skip,
        limit=limit,
        run_id=run_id,
        status=status,
        confidence_min=confidence_min,
        confidence_max=confidence_max,
    )
    page = (skip // limit) + 1 if limit else 1
    return TaskProposalListResponse(
        items=proposals,
        total=total,
        page=page,
        page_size=limit,
    )


@router.get(
    "/{proposal_id}",
    response_model=TaskProposalPublic,
    summary="Get proposal by ID",
    description="Get single task proposal with full details including source messages.",
)
async def get_proposal(
    proposal_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> TaskProposalPublic:
    """Get task proposal by ID.

    Returns complete proposal details including:
    - Proposed task data (title, description, priority, category, tags)
    - Source message IDs for traceability
    - Similar task detection results
    - LLM metadata (recommendation, confidence, reasoning)
    - Review status and notes

    Args:
        proposal_id: Task proposal UUID
        session: Database session

    Returns:
        Task proposal with all details

    Raises:
        HTTPException 404: Proposal not found
    """
    crud = TaskProposalCRUD(session)
    proposal = await crud.get(proposal_id)

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task proposal with ID '{proposal_id}' not found",
        )

    return proposal


@router.put(
    "/{proposal_id}/approve",
    response_model=TaskProposalPublic,
    summary="Approve proposal",
    description="Approve task proposal and decrement run.proposals_pending.",
)
async def approve_proposal(
    proposal_id: UUID,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> TaskProposalPublic:
    """Approve task proposal for implementation.

    Sets status to "approved" and records review timestamp.
    Decrements parent run's proposals_pending counter.
    Increments parent run's proposals_approved counter.

    Broadcasts WebSocket event on successful approval.

    Args:
        proposal_id: Task proposal UUID
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Updated task proposal with status="approved"

    Raises:
        HTTPException 404: Proposal not found

    Note:
        Approved proposals should be converted to TaskEntity records
        in Phase 2 implementation.
    """
    crud = TaskProposalCRUD(session)
    proposal = await crud.approve(proposal_id)

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task proposal with ID '{proposal_id}' not found",
        )

    logger.info(f"Approved task proposal {proposal_id}")

    # Broadcast WebSocket event
    await ws_manager.broadcast(
        "proposals",
        {
            "topic": "proposals",
            "event": "approved",
            "data": {
                "id": str(proposal.id),
                "status": proposal.status,
                "analysis_run_id": str(proposal.analysis_run_id),
                "proposed_title": proposal.proposed_title,
            },
        },
    )

    return proposal


@router.put(
    "/{proposal_id}/reject",
    response_model=TaskProposalPublic,
    summary="Reject proposal",
    description="Reject task proposal with reason and decrement run.proposals_pending.",
)
async def reject_proposal(
    proposal_id: UUID,
    reject_request: RejectProposalRequest,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> TaskProposalPublic:
    """Reject task proposal with rejection reason.

    Sets status to "rejected" and stores rejection reason in review_notes.
    Decrements parent run's proposals_pending counter.
    Increments parent run's proposals_rejected counter.

    Broadcasts WebSocket event on successful rejection.

    Args:
        proposal_id: Task proposal UUID
        reject_request: Rejection reason (required)
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Updated task proposal with status="rejected"

    Raises:
        HTTPException 404: Proposal not found
        HTTPException 400: Missing or invalid rejection reason
    """
    if not reject_request.reason or len(reject_request.reason.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required and cannot be empty",
        )

    crud = TaskProposalCRUD(session)
    proposal = await crud.reject(proposal_id, reject_request.reason)

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task proposal with ID '{proposal_id}' not found",
        )

    logger.info(f"Rejected task proposal {proposal_id}: {reject_request.reason}")

    # Broadcast WebSocket event
    await ws_manager.broadcast(
        "proposals",
        {
            "topic": "proposals",
            "event": "rejected",
            "data": {
                "id": str(proposal.id),
                "status": proposal.status,
                "analysis_run_id": str(proposal.analysis_run_id),
                "reason": reject_request.reason,
            },
        },
    )

    return proposal


@router.put(
    "/{proposal_id}/merge",
    response_model=TaskProposalPublic,
    summary="Merge proposal",
    description="Merge proposal with existing task and decrement run.proposals_pending.",
)
async def merge_proposal(
    proposal_id: UUID,
    merge_request: MergeProposalRequest,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> TaskProposalPublic:
    """Merge proposal with existing task.

    Sets status to "merged" and stores target task ID in review_notes.
    Decrements parent run's proposals_pending counter.

    Broadcasts WebSocket event on successful merge.

    Args:
        proposal_id: Task proposal UUID
        merge_request: Target task UUID to merge with
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Updated task proposal with status="merged"

    Raises:
        HTTPException 404: Proposal not found

    Note:
        Phase 2 implementation should validate target_task_id exists
        and update the TaskEntity record with proposal data.
    """
    crud = TaskProposalCRUD(session)
    proposal = await crud.merge(proposal_id, merge_request.target_task_id)

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task proposal with ID '{proposal_id}' not found",
        )

    logger.info(f"Merged task proposal {proposal_id} with task {merge_request.target_task_id}")

    # Broadcast WebSocket event
    await ws_manager.broadcast(
        "proposals",
        {
            "topic": "proposals",
            "event": "merged",
            "data": {
                "id": str(proposal.id),
                "status": proposal.status,
                "analysis_run_id": str(proposal.analysis_run_id),
                "target_task_id": str(merge_request.target_task_id),
            },
        },
    )

    return proposal


@router.put(
    "/{proposal_id}",
    response_model=TaskProposalPublic,
    summary="Edit proposal",
    description="Update proposal fields (only if status=pending).",
)
async def update_proposal(
    proposal_id: UUID,
    update_data: TaskProposalUpdate,
    session: AsyncSession = Depends(get_session),
    ws_manager=Depends(get_ws_manager),
) -> TaskProposalPublic:
    """Update task proposal fields.

    Allows editing proposal data before approval/rejection.
    Updates are typically allowed only for proposals with status="pending".

    Editable fields:
    - proposed_title
    - proposed_description
    - proposed_priority
    - proposed_category
    - proposed_tags

    Broadcasts WebSocket event on successful update.

    Args:
        proposal_id: Task proposal UUID
        update_data: Fields to update (partial)
        session: Database session
        ws_manager: WebSocket manager for broadcasting events

    Returns:
        Updated task proposal

    Raises:
        HTTPException 404: Proposal not found

    Note:
        Consider adding status validation to prevent editing
        approved/rejected proposals in production.
    """
    crud = TaskProposalCRUD(session)

    # Get current proposal to check status
    current_proposal = await crud.get(proposal_id)
    if not current_proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task proposal with ID '{proposal_id}' not found",
        )

    # Optional: Validate status is pending
    if current_proposal.status != "pending":
        logger.warning(
            f"Editing proposal {proposal_id} with status={current_proposal.status} "
            f"(typically only pending proposals should be edited)"
        )

    # Update proposal
    proposal = await crud.update(proposal_id, update_data)

    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task proposal with ID '{proposal_id}' not found",
        )

    logger.info(f"Updated task proposal {proposal_id}")

    # Broadcast WebSocket event
    await ws_manager.broadcast(
        "proposals",
        {
            "topic": "proposals",
            "event": "updated",
            "data": {
                "id": str(proposal.id),
                "status": proposal.status,
                "analysis_run_id": str(proposal.analysis_run_id),
            },
        },
    )

    return proposal
