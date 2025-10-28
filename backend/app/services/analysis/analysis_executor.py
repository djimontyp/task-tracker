"""Analysis run execution orchestration.

Implements complete lifecycle of analysis run background jobs.
"""

import logging
from datetime import datetime
from uuid import UUID

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.config.ai_config import ai_config
from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    LLMProvider,
    Message,
    ProjectConfig,
    TaskProposal,
)
from app.services.llm_proposal_service import LLMProposalService
from app.services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class AnalysisExecutor:
    """Executor service for analysis run background jobs.

    Implements the complete lifecycle of an analysis run:
    1. start_run() - Update status to "running"
    2. fetch_messages() - Query messages in time window
    3. prefilter_messages() - Filter by keywords/length/@mentions
    4. create_batches() - Group messages into batches
    5. process_batch() - Call LLM, parse proposals
    6. save_proposals() - Save to DB, update counts
    7. update_progress() - Update progress, broadcast
    8. complete_run() - Set completed, broadcast
    9. fail_run() - Set failed, store error_log, broadcast
    """

    def __init__(self, session: AsyncSession):
        """Initialize executor.

        Args:
            session: Async database session
        """
        self.session = session

    async def start_run(self, run_id: UUID) -> None:
        """Update run status to "running" and set started_at timestamp.

        Broadcasts WebSocket event for real-time updates.

        Args:
            run_id: Analysis run UUID

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        run.status = AnalysisRunStatus.running.value
        run.started_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(run)

        await websocket_manager.broadcast(
            "analysis_runs",
            {
                "event": "run_started",
                "data": {
                    "id": str(run.id),
                    "status": run.status,
                    "started_at": run.started_at.isoformat(),
                },
            },
        )

        logger.info(f"Analysis run {run_id} started")

    async def fetch_messages(self, run_id: UUID) -> list[Message]:
        """Fetch messages in the run's time window.

        Args:
            run_id: Analysis run UUID

        Returns:
            List of messages in time window

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        start_naive = (
            run.time_window_start.replace(tzinfo=None) if run.time_window_start.tzinfo else run.time_window_start
        )
        end_naive = run.time_window_end.replace(tzinfo=None) if run.time_window_end.tzinfo else run.time_window_end

        messages_result = await self.session.execute(
            select(Message).where(
                Message.sent_at >= start_naive,
                Message.sent_at <= end_naive,
            )
        )
        messages = list(messages_result.scalars().all())

        run.total_messages_in_window = len(messages)
        await self.session.commit()

        logger.info(f"Run {run_id}: Fetched {len(messages)} messages")

        return messages

    async def prefilter_messages(self, run_id: UUID, messages: list[Message]) -> list[Message]:
        """Pre-filter messages by keywords, length, and @mentions.

        Filters out spam/noise messages (~30% should remain).

        Args:
            run_id: Analysis run UUID
            messages: List of messages to filter

        Returns:
            Filtered list of messages

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        project_config = None
        if run.project_config_id:
            project_result = await self.session.execute(
                select(ProjectConfig).where(ProjectConfig.id == run.project_config_id)
            )
            project_config = project_result.scalar_one_or_none()

        filtered = []
        for msg in messages:
            if len(msg.content.strip()) < 10:
                continue

            if project_config and project_config.keywords:
                has_keyword = any(keyword.lower() in msg.content.lower() for keyword in project_config.keywords)
                if not has_keyword and "@" not in msg.content:
                    continue

            filtered.append(msg)

        run.messages_after_prefilter = len(filtered)
        await self.session.commit()

        logger.info(f"Run {run_id}: {len(filtered)}/{len(messages)} messages after pre-filter")

        return filtered

    async def create_batches(self, messages: list[Message]) -> list[list[Message]]:
        """Group messages into batches for LLM processing.

        Groups messages by time proximity with configurable gap and max batch size.

        Args:
            messages: List of filtered messages

        Returns:
            List of message batches
        """
        if not messages:
            return []

        sorted_messages = sorted(messages, key=lambda m: m.sent_at)

        batches = []
        current_batch = [sorted_messages[0]]

        for msg in sorted_messages[1:]:
            time_diff = (msg.sent_at - current_batch[-1].sent_at).total_seconds()

            if (
                time_diff > ai_config.analysis.time_gap_seconds
                or len(current_batch) >= ai_config.analysis.max_batch_size
            ):
                batches.append(current_batch)
                current_batch = [msg]
            else:
                current_batch.append(msg)

        if current_batch:
            batches.append(current_batch)

        logger.info(f"Created {len(batches)} batches from {len(messages)} messages")

        return batches

    async def process_batch(self, run_id: UUID, batch: list[Message], use_rag: bool = False) -> list[dict]:
        """Process message batch with LLM to generate proposals.

        Args:
            run_id: Analysis run UUID
            batch: List of messages in batch
            use_rag: Enable RAG (Retrieval-Augmented Generation) for context-aware proposals

        Returns:
            List of proposal dictionaries

        Raises:
            ValueError: If run not found or agent/provider invalid
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        assignment_result = await self.session.execute(
            select(AgentTaskAssignment).where(AgentTaskAssignment.id == run.agent_assignment_id)
        )
        assignment = assignment_result.scalar_one_or_none()

        if not assignment:
            raise ValueError(f"Agent assignment with ID '{run.agent_assignment_id}' not found")

        agent_result = await self.session.execute(select(AgentConfig).where(AgentConfig.id == assignment.agent_id))
        agent = agent_result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent with ID '{assignment.agent_id}' not found")

        provider_result = await self.session.execute(select(LLMProvider).where(LLMProvider.id == agent.provider_id))
        provider = provider_result.scalar_one_or_none()

        if not provider:
            raise ValueError(f"Provider with ID '{agent.provider_id}' not found")

        project_config = None
        if run.project_config_id:
            project_result = await self.session.execute(
                select(ProjectConfig).where(ProjectConfig.id == run.project_config_id)
            )
            project_config = project_result.scalar_one_or_none()

        if use_rag:
            from app.services.embedding_service import EmbeddingService
            from app.services.rag_context_builder import RAGContextBuilder
            from app.services.semantic_search_service import SemanticSearchService

            embedding_service = EmbeddingService(provider)
            search_service = SemanticSearchService(embedding_service)
            rag_builder = RAGContextBuilder(embedding_service, search_service)

            llm_service = LLMProposalService(agent, provider, rag_builder)
            proposals = await llm_service.generate_proposals_with_rag(self.session, batch, project_config, use_rag=True)
        else:
            llm_service = LLMProposalService(agent, provider)
            proposals = await llm_service.generate_proposals(batch, project_config)

        logger.info(f"Run {run_id}: Generated {len(proposals)} proposals from batch (RAG: {use_rag})")

        return proposals

    async def save_proposals(self, run_id: UUID, proposals: list[dict]) -> int:
        """Save proposals to database and update run counts.

        Args:
            run_id: Analysis run UUID
            proposals: List of proposal dictionaries

        Returns:
            Number of proposals saved

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        saved_count = 0

        for proposal_data in proposals:
            proposal = TaskProposal(
                analysis_run_id=run_id,
                **proposal_data,
            )

            self.session.add(proposal)
            saved_count += 1

        run.proposals_total += saved_count
        run.proposals_pending += saved_count

        await self.session.commit()

        await websocket_manager.broadcast(
            "analysis_runs",
            {
                "event": "proposals_created",
                "data": {
                    "run_id": str(run_id),
                    "proposals_count": saved_count,
                    "proposals_total": run.proposals_total,
                    "proposals_pending": run.proposals_pending,
                },
            },
        )

        logger.info(f"Run {run_id}: Saved {saved_count} proposals")

        return saved_count

    async def update_progress(self, run_id: UUID, current: int, total: int) -> None:
        """Update run progress and broadcast via WebSocket.

        Args:
            run_id: Analysis run UUID
            current: Current batch number
            total: Total number of batches

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        run.batches_created = total

        await self.session.commit()

        await websocket_manager.broadcast(
            "analysis_runs",
            {
                "event": "progress_updated",
                "data": {
                    "run_id": str(run_id),
                    "current_batch": current,
                    "total_batches": total,
                    "progress_percent": int((current / total) * 100) if total > 0 else 0,
                },
            },
        )

        logger.debug(f"Run {run_id}: Progress {current}/{total}")

    async def complete_run(self, run_id: UUID) -> dict:
        """Mark run as completed and set completed_at timestamp.

        Broadcasts WebSocket event for real-time updates.

        Args:
            run_id: Analysis run UUID

        Returns:
            Summary dictionary with execution statistics

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        run.status = AnalysisRunStatus.completed.value
        run.completed_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(run)

        await websocket_manager.broadcast(
            "analysis_runs",
            {
                "event": "run_completed",
                "data": {
                    "id": str(run.id),
                    "status": run.status,
                    "completed_at": run.completed_at.isoformat(),
                    "proposals_total": run.proposals_total,
                    "proposals_pending": run.proposals_pending,
                    "batches_created": run.batches_created,
                },
            },
        )

        logger.info(
            f"Analysis run {run_id} completed: {run.proposals_total} proposals from {run.batches_created} batches"
        )

        return {
            "id": str(run.id),
            "status": run.status,
            "proposals_total": run.proposals_total,
            "batches_created": run.batches_created,
        }

    async def fail_run(self, run_id: UUID, error: str) -> None:
        """Mark run as failed and store error log.

        Broadcasts WebSocket event for real-time updates.

        Args:
            run_id: Analysis run UUID
            error: Error message/stack trace

        Raises:
            ValueError: If run not found
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        run.status = AnalysisRunStatus.failed.value
        run.error_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "error": error,
        }

        await self.session.commit()
        await self.session.refresh(run)

        await websocket_manager.broadcast(
            "analysis_runs",
            {
                "event": "run_failed",
                "data": {
                    "id": str(run.id),
                    "status": run.status,
                    "error": error,
                },
            },
        )

        logger.error(f"Analysis run {run_id} failed: {error}")
