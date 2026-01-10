"""Service for calculating agent performance statistics."""

from datetime import datetime, timedelta, UTC
from typing import cast
from uuid import UUID

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_extraction_run import KnowledgeExtractionRun, ExtractionStatus
from app.schemas.agent_stats import AgentStats


class AgentStatsService:
    """Service for agent statistics aggregation."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_stats(self, agent_config_id: UUID) -> AgentStats:
        """Calculate statistics for a specific agent.
        
        Metrics are calculated based on `knowledge_extraction_run` history.
        - last_run: Most recent completed or failed run.
        - success_rate: (completed / (completed + failed)) * 100
        - 24h metrics: Based on runs started in the last 24 hours.
        """
        
        # 1. Get Last Run
        # We look for the most recent run that finished (completed or failed)
        last_run_stmt = (
            select(KnowledgeExtractionRun.completed_at)
            .where(
                KnowledgeExtractionRun.agent_config_id == agent_config_id,
                KnowledgeExtractionRun.status.in_([ExtractionStatus.completed, ExtractionStatus.failed])
            )
            .order_by(desc(KnowledgeExtractionRun.completed_at))
            .limit(1)
        )
        last_run_result = await self.session.execute(last_run_stmt)
        last_run_at = last_run_result.scalar_one_or_none()

        # 2. Daily Stats (24h window)
        now = datetime.now(UTC)
        window_24h = now - timedelta(hours=24)
        
        # Subquery for 24h runs to avoid multiple scans if possible, 
        # but for clean SQLalchemy stats we'll do aggregate queries.
        
        from sqlalchemy import or_

        # Count total runs in 24h
        count_24h_stmt = (
            select(func.count())
            .select_from(KnowledgeExtractionRun)
            .where(
                KnowledgeExtractionRun.agent_config_id == agent_config_id,
                KnowledgeExtractionRun.started_at >= window_24h,
                or_(
                    KnowledgeExtractionRun.task_id != "manual_test",
                    KnowledgeExtractionRun.task_id.is_(None)
                )
            )
        )
        total_runs_24h = (await self.session.execute(count_24h_stmt)).scalar() or 0

        # Sum atoms in 24h
        atoms_24h_stmt = (
            select(func.sum(KnowledgeExtractionRun.atoms_created))
            .where(
                KnowledgeExtractionRun.agent_config_id == agent_config_id,
                KnowledgeExtractionRun.started_at >= window_24h,
                KnowledgeExtractionRun.status == ExtractionStatus.completed,
                or_(
                    KnowledgeExtractionRun.task_id != "manual_test",
                    KnowledgeExtractionRun.task_id.is_(None)
                )
            )
        )
        atoms_created_24h = (await self.session.execute(atoms_24h_stmt)).scalar() or 0

        # 3. Global Stats (Success Rate & Duration)
        # We calculate this over ALL time or a larger window (e.g. 7 days)?
        # For stability, let's take ALL time for now, or maybe last 100 runs?
        # Let's do last 100 runs to be responsive to recent changes.
        
        stats_window_stmt = (
            select(
                KnowledgeExtractionRun.status,
                KnowledgeExtractionRun.started_at,
                KnowledgeExtractionRun.completed_at
            )
            .where(
                KnowledgeExtractionRun.agent_config_id == agent_config_id,
                KnowledgeExtractionRun.status.in_([ExtractionStatus.completed, ExtractionStatus.failed]),
                or_(
                    KnowledgeExtractionRun.task_id != "manual_test",
                    KnowledgeExtractionRun.task_id.is_(None)
                )
            )
            .order_by(desc(KnowledgeExtractionRun.started_at))
            .limit(100)
        )
        recent_runs = (await self.session.execute(stats_window_stmt)).all()
        
        success_count = 0
        total_finished = 0
        total_duration = 0.0
        duration_count = 0
        
        for run in recent_runs:
            total_finished += 1
            if run.status == ExtractionStatus.completed:
                success_count += 1
                
                # Calculate duration
                if run.started_at and run.completed_at:
                    duration = (run.completed_at - run.started_at).total_seconds()
                    if duration > 0:
                        total_duration += duration
                        duration_count += 1

        success_rate = (success_count / total_finished * 100.0) if total_finished > 0 else 0.0
        avg_duration = (total_duration / duration_count) if duration_count > 0 else 0.0

        return AgentStats(
            last_run_at=last_run_at,
            success_rate=round(success_rate, 1),
            total_runs_24h=total_runs_24h,
            avg_duration_sec=round(avg_duration, 2),
            atoms_created_24h=int(atoms_created_24h or 0)
        )
