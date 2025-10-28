"""Validation logic for analysis runs.

Enforces business rules for analysis run lifecycle.
"""

import logging
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import AnalysisRun, AnalysisRunStatus

logger = logging.getLogger(__name__)


class AnalysisRunValidator:
    """Validator for analysis run business rules.

    Enforces critical validation rules:
    - Cannot create new run if unclosed runs exist
    - Cannot close run if proposals_pending > 0
    """

    def __init__(self, session: AsyncSession):
        """Initialize validator.

        Args:
            session: Async database session
        """
        self.session = session

    async def can_start_new_run(self) -> tuple[bool, str | None]:
        """Check if new analysis run can be started.

        Validates that no unclosed runs exist. A run is considered unclosed
        if its status is pending, running, completed, or reviewed (not closed).

        Returns:
            Tuple of (can_start, error_message)
            - (True, None) if new run can be started
            - (False, error_message) if validation fails

        Example:
            >>> validator = AnalysisRunValidator(session)
            >>> can_start, error = await validator.can_start_new_run()
            >>> if not can_start:
            >>>     raise HTTPException(409, error)
        """
        unclosed_statuses = [
            AnalysisRunStatus.pending.value,
            AnalysisRunStatus.running.value,
            AnalysisRunStatus.completed.value,
            AnalysisRunStatus.reviewed.value,
        ]

        result = await self.session.execute(
            select(AnalysisRun).where(AnalysisRun.status.in_(unclosed_statuses))  # type: ignore[attr-defined]
        )
        unclosed_runs = result.scalars().all()

        if unclosed_runs:
            run_ids = [str(run.id)[:8] for run in unclosed_runs[:3]]
            count = len(unclosed_runs)
            return (
                False,
                f"Cannot start new run: {count} unclosed run(s) exist. "
                f"Close existing runs first. Example IDs: {', '.join(run_ids)}...",
            )

        return True, None

    async def can_close_run(self, run_id: UUID) -> tuple[bool, str | None]:
        """Check if analysis run can be closed.

        Validates that all proposals have been reviewed (proposals_pending == 0).

        Args:
            run_id: Analysis run UUID

        Returns:
            Tuple of (can_close, error_message)
            - (True, None) if run can be closed
            - (False, error_message) if validation fails

        Example:
            >>> validator = AnalysisRunValidator(session)
            >>> can_close, error = await validator.can_close_run(run_id)
            >>> if not can_close:
            >>>     raise HTTPException(400, error)
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            return False, f"Run with ID '{run_id}' not found"

        if run.proposals_pending > 0:
            return (
                False,
                f"Cannot close run: {run.proposals_pending} proposal(s) still pending review. "
                f"Review all proposals before closing.",
            )

        return True, None

    async def validate_run_exists(self, run_id: UUID) -> bool:
        """Check if analysis run exists.

        Args:
            run_id: Analysis run UUID

        Returns:
            True if run exists, False otherwise
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        return result.scalar_one_or_none() is not None
