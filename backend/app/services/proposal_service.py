"""TaskProposal service for CRUD operations.

Provides database operations for task proposals with run coordination.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy import func
from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AnalysisRun,
    TaskProposal,
    TaskProposalCreate,
    TaskProposalPublic,
    TaskProposalUpdate,
)


class TaskProposalCRUD:
    """CRUD service for TaskProposal operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session

    async def create(self, proposal_data: TaskProposalCreate) -> TaskProposalPublic:
        """Create new task proposal.

        Args:
            proposal_data: Proposal creation data

        Returns:
            Created task proposal with public fields

        Raises:
            ValueError: If analysis_run not found
        """
        # Verify analysis run exists
        run_result = await self.session.execute(
            select(AnalysisRun).where(AnalysisRun.id == proposal_data.analysis_run_id)
        )
        run = run_result.scalar_one_or_none()
        if not run:
            raise ValueError(
                f"Analysis run with ID '{proposal_data.analysis_run_id}' not found"
            )

        # Create proposal
        proposal = TaskProposal(**proposal_data.model_dump())

        self.session.add(proposal)
        await self.session.commit()
        await self.session.refresh(proposal)

        return TaskProposalPublic.model_validate(proposal)

    async def get(self, proposal_id: UUID) -> Optional[TaskProposalPublic]:
        """Get task proposal by ID.

        Args:
            proposal_id: Task proposal UUID

        Returns:
            Task proposal if found, None otherwise
        """
        result = await self.session.execute(
            select(TaskProposal).where(TaskProposal.id == proposal_id)
        )
        proposal = result.scalar_one_or_none()

        if proposal:
            return TaskProposalPublic.model_validate(proposal)
        return None

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        run_id: Optional[UUID] = None,
        status: Optional[str] = None,
        confidence_min: Optional[float] = None,
        confidence_max: Optional[float] = None,
    ) -> tuple[list[TaskProposalPublic], int]:
        """List task proposals with pagination and filters.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            run_id: Filter by analysis run ID
            status: Filter by proposal status
            confidence_min: Filter by confidence >= min
            confidence_max: Filter by confidence <= max

        Returns:
            List of task proposals sorted by confidence DESC
        """
        filters = []

        if run_id:
            filters.append(TaskProposal.analysis_run_id == run_id)
        if status:
            filters.append(TaskProposal.status == status)
        if confidence_min is not None:
            filters.append(TaskProposal.confidence >= confidence_min)
        if confidence_max is not None:
            filters.append(TaskProposal.confidence <= confidence_max)

        query = select(TaskProposal)
        count_query = select(func.count()).select_from(TaskProposal)

        for condition in filters:
            query = query.where(condition)
            count_query = count_query.where(condition)

        # Sort by confidence DESC and apply pagination
        query = query.order_by(desc(TaskProposal.confidence)).offset(skip).limit(limit)

        result = await self.session.execute(query)
        proposals = result.scalars().all()

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        return [TaskProposalPublic.model_validate(p) for p in proposals], total

    async def update(
        self,
        proposal_id: UUID,
        update_data: TaskProposalUpdate,
    ) -> Optional[TaskProposalPublic]:
        """Update task proposal.

        Args:
            proposal_id: Task proposal UUID
            update_data: Fields to update

        Returns:
            Updated task proposal if found, None otherwise
        """
        result = await self.session.execute(
            select(TaskProposal).where(TaskProposal.id == proposal_id)
        )
        proposal = result.scalar_one_or_none()

        if not proposal:
            return None

        # Get update dict excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)

        # Apply updates
        for field, value in update_dict.items():
            setattr(proposal, field, value)

        await self.session.commit()
        await self.session.refresh(proposal)

        return TaskProposalPublic.model_validate(proposal)

    async def approve(
        self,
        proposal_id: UUID,
        user_id: Optional[int] = None,
    ) -> Optional[TaskProposalPublic]:
        """Approve task proposal and decrement run.proposals_pending.

        Args:
            proposal_id: Task proposal UUID
            user_id: User who approved the proposal

        Returns:
            Updated task proposal if found, None otherwise
        """
        result = await self.session.execute(
            select(TaskProposal).where(TaskProposal.id == proposal_id)
        )
        proposal = result.scalar_one_or_none()

        if not proposal:
            return None

        # Update proposal
        proposal.status = "approved"
        proposal.review_action = "approve"
        proposal.reviewed_by_user_id = user_id
        proposal.reviewed_at = datetime.utcnow()

        # Decrement run.proposals_pending and increment run.proposals_approved
        run_result = await self.session.execute(
            select(AnalysisRun).where(AnalysisRun.id == proposal.analysis_run_id)
        )
        run = run_result.scalar_one_or_none()
        if run:
            run.proposals_pending = max(0, run.proposals_pending - 1)
            run.proposals_approved += 1

        await self.session.commit()
        await self.session.refresh(proposal)

        return TaskProposalPublic.model_validate(proposal)

    async def reject(
        self,
        proposal_id: UUID,
        reason: str,
        user_id: Optional[int] = None,
    ) -> Optional[TaskProposalPublic]:
        """Reject task proposal and decrement run.proposals_pending.

        Args:
            proposal_id: Task proposal UUID
            reason: Rejection reason
            user_id: User who rejected the proposal

        Returns:
            Updated task proposal if found, None otherwise
        """
        result = await self.session.execute(
            select(TaskProposal).where(TaskProposal.id == proposal_id)
        )
        proposal = result.scalar_one_or_none()

        if not proposal:
            return None

        # Update proposal
        proposal.status = "rejected"
        proposal.review_action = "reject"
        proposal.review_notes = reason
        proposal.reviewed_by_user_id = user_id
        proposal.reviewed_at = datetime.utcnow()

        # Decrement run.proposals_pending and increment run.proposals_rejected
        run_result = await self.session.execute(
            select(AnalysisRun).where(AnalysisRun.id == proposal.analysis_run_id)
        )
        run = run_result.scalar_one_or_none()
        if run:
            run.proposals_pending = max(0, run.proposals_pending - 1)
            run.proposals_rejected += 1

        await self.session.commit()
        await self.session.refresh(proposal)

        return TaskProposalPublic.model_validate(proposal)

    async def merge(
        self,
        proposal_id: UUID,
        target_task_id: UUID,
        user_id: Optional[int] = None,
    ) -> Optional[TaskProposalPublic]:
        """Merge proposal with existing task and decrement run.proposals_pending.

        Args:
            proposal_id: Task proposal UUID
            target_task_id: Target task UUID to merge with
            user_id: User who merged the proposal

        Returns:
            Updated task proposal if found, None otherwise
        """
        result = await self.session.execute(
            select(TaskProposal).where(TaskProposal.id == proposal_id)
        )
        proposal = result.scalar_one_or_none()

        if not proposal:
            return None

        # Update proposal
        proposal.status = "merged"
        proposal.review_action = "merge"
        proposal.review_notes = f"Merged with task {target_task_id}"
        proposal.reviewed_by_user_id = user_id
        proposal.reviewed_at = datetime.utcnow()

        # Decrement run.proposals_pending
        run_result = await self.session.execute(
            select(AnalysisRun).where(AnalysisRun.id == proposal.analysis_run_id)
        )
        run = run_result.scalar_one_or_none()
        if run:
            run.proposals_pending = max(0, run.proposals_pending - 1)

        await self.session.commit()
        await self.session.refresh(proposal)

        return TaskProposalPublic.model_validate(proposal)
