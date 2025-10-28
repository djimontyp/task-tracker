"""CRUD operations for Analysis Run.

Handles database operations and persistence for analysis runs.
"""

import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import func
from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunCreate,
    AnalysisRunPublic,
    AnalysisRunStatus,
    AnalysisRunUpdate,
    ProjectConfig,
)
from app.services.base_crud import BaseCRUD

logger = logging.getLogger(__name__)


class AnalysisRunCRUD:
    """CRUD service for Analysis Run operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session
        self._base_crud = BaseCRUD(AnalysisRun, session)

    async def create(self, run_data: AnalysisRunCreate) -> AnalysisRunPublic:
        """Create new analysis run with config snapshot.

        Args:
            run_data: Analysis run creation data

        Returns:
            Created analysis run with public fields

        Raises:
            ValueError: If agent_assignment or project_config not found
        """
        assignment_result = await self.session.execute(
            select(AgentTaskAssignment).where(AgentTaskAssignment.id == run_data.agent_assignment_id)
        )
        assignment = assignment_result.scalar_one_or_none()
        if not assignment:
            raise ValueError(f"Agent assignment with ID '{run_data.agent_assignment_id}' not found")

        config_snapshot = {
            "agent_assignment_id": str(run_data.agent_assignment_id),
            "time_window": {
                "start": run_data.time_window_start.isoformat(),
                "end": run_data.time_window_end.isoformat(),
            },
        }

        if run_data.project_config_id:
            project_result = await self.session.execute(
                select(ProjectConfig).where(ProjectConfig.id == run_data.project_config_id)
            )
            project = project_result.scalar_one_or_none()
            if not project:
                raise ValueError(f"Project config with ID '{run_data.project_config_id}' not found")
            config_snapshot["project_config"] = {
                "id": str(project.id),
                "name": project.name,
                "version": project.version,
                "keywords": project.keywords,
            }

        run = AnalysisRun(
            time_window_start=run_data.time_window_start,
            time_window_end=run_data.time_window_end,
            agent_assignment_id=run_data.agent_assignment_id,
            project_config_id=run_data.project_config_id,
            config_snapshot=config_snapshot,
            trigger_type=run_data.trigger_type,
            triggered_by_user_id=run_data.triggered_by_user_id,
            status=AnalysisRunStatus.pending.value,
        )

        self.session.add(run)
        await self.session.commit()
        await self.session.refresh(run)

        return AnalysisRunPublic.model_validate(run)

    async def get(self, run_id: UUID) -> AnalysisRunPublic | None:
        """Get analysis run by ID.

        Args:
            run_id: Analysis run UUID

        Returns:
            Analysis run if found, None otherwise
        """
        run = await self._base_crud.get(run_id)

        if run:
            return AnalysisRunPublic.model_validate(run)
        return None

    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        status: str | None = None,
        trigger_type: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple[list[AnalysisRunPublic], int]:
        """List analysis runs with pagination and filters.

        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status
            trigger_type: Filter by trigger type
            start_date: Filter by created_at >= start_date
            end_date: Filter by created_at <= end_date

        Returns:
            Tuple of paginated runs and total count sorted by created_at DESC
        """
        filters = []

        if status:
            filters.append(AnalysisRun.status == status)
        if trigger_type:
            filters.append(AnalysisRun.trigger_type == trigger_type)
        if start_date:
            filters.append(AnalysisRun.created_at >= start_date)
        if end_date:
            filters.append(AnalysisRun.created_at <= end_date)

        query = select(AnalysisRun)
        count_query = select(func.count()).select_from(AnalysisRun)

        for condition in filters:
            query = query.where(condition)
            count_query = count_query.where(condition)

        query = query.order_by(desc(AnalysisRun.created_at)).offset(skip).limit(limit)

        result = await self.session.execute(query)
        runs = result.scalars().all()

        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        return [AnalysisRunPublic.model_validate(r) for r in runs], total

    async def update(
        self,
        run_id: UUID,
        update_data: AnalysisRunUpdate,
    ) -> AnalysisRunPublic | None:
        """Update analysis run.

        Args:
            run_id: Analysis run UUID
            update_data: Fields to update

        Returns:
            Updated analysis run if found, None otherwise
        """
        run = await self._base_crud.get(run_id)

        if not run:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        updated_run = await self._base_crud.update(run, update_dict)

        return AnalysisRunPublic.model_validate(updated_run)

    async def close(self, run_id: UUID) -> AnalysisRunPublic | None:
        """Close analysis run and calculate accuracy metrics.

        Args:
            run_id: Analysis run UUID

        Returns:
            Updated analysis run if found, None otherwise
        """
        run = await self._base_crud.get(run_id)

        if not run:
            return None

        total_proposals = run.proposals_total
        accuracy_metrics = {
            "proposals_total": total_proposals,
            "proposals_approved": run.proposals_approved,
            "proposals_rejected": run.proposals_rejected,
            "approval_rate": (run.proposals_approved / total_proposals if total_proposals > 0 else 0.0),
            "rejection_rate": (run.proposals_rejected / total_proposals if total_proposals > 0 else 0.0),
        }

        run.status = AnalysisRunStatus.closed.value
        run.closed_at = datetime.utcnow()
        run.accuracy_metrics = accuracy_metrics

        await self.session.commit()
        await self.session.refresh(run)

        return AnalysisRunPublic.model_validate(run)
