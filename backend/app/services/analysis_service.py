"""Analysis Run service for validation and coordination.

Provides validation logic for analysis runs and coordination with proposals.
Includes AnalysisExecutor for background job execution.
"""

import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy import func
from sqlmodel import desc, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunCreate,
    AnalysisRunPublic,
    AnalysisRunStatus,
    AnalysisRunUpdate,
    LLMProvider,
    Message,
    ProjectConfig,
    TaskProposal,
)
from app.services.llm_proposal_service import LLMProposalService
from app.services.websocket_manager import websocket_manager

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
        # Query for unclosed runs
        unclosed_statuses = [
            AnalysisRunStatus.pending.value,
            AnalysisRunStatus.running.value,
            AnalysisRunStatus.completed.value,
            AnalysisRunStatus.reviewed.value,
        ]

        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.status.in_(unclosed_statuses)))
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


class AnalysisRunCRUD:
    """CRUD service for Analysis Run operations."""

    def __init__(self, session: AsyncSession):
        """Initialize CRUD service.

        Args:
            session: Async database session
        """
        self.session = session

    async def create(self, run_data: AnalysisRunCreate) -> AnalysisRunPublic:
        """Create new analysis run with config snapshot.

        Args:
            run_data: Analysis run creation data

        Returns:
            Created analysis run with public fields

        Raises:
            ValueError: If agent_assignment or project_config not found
        """
        # Verify agent assignment exists
        assignment_result = await self.session.execute(
            select(AgentTaskAssignment).where(AgentTaskAssignment.id == run_data.agent_assignment_id)
        )
        assignment = assignment_result.scalar_one_or_none()
        if not assignment:
            raise ValueError(f"Agent assignment with ID '{run_data.agent_assignment_id}' not found")

        # Build config snapshot
        config_snapshot = {
            "agent_assignment_id": str(run_data.agent_assignment_id),
            "time_window": {
                "start": run_data.time_window_start.isoformat(),
                "end": run_data.time_window_end.isoformat(),
            },
        }

        # Add project config to snapshot if provided
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

        # Create analysis run
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
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

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
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            return None

        # Get update dict excluding unset fields
        update_dict = update_data.model_dump(exclude_unset=True)

        # Apply updates
        for field, value in update_dict.items():
            setattr(run, field, value)

        await self.session.commit()
        await self.session.refresh(run)

        return AnalysisRunPublic.model_validate(run)

    async def close(self, run_id: UUID) -> AnalysisRunPublic | None:
        """Close analysis run and calculate accuracy metrics.

        Args:
            run_id: Analysis run UUID

        Returns:
            Updated analysis run if found, None otherwise
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            return None

        # Calculate accuracy metrics
        total_proposals = run.proposals_total
        accuracy_metrics = {
            "proposals_total": total_proposals,
            "proposals_approved": run.proposals_approved,
            "proposals_rejected": run.proposals_rejected,
            "approval_rate": (run.proposals_approved / total_proposals if total_proposals > 0 else 0.0),
            "rejection_rate": (run.proposals_rejected / total_proposals if total_proposals > 0 else 0.0),
        }

        # Update run
        run.status = AnalysisRunStatus.closed.value
        run.closed_at = datetime.utcnow()
        run.accuracy_metrics = accuracy_metrics

        await self.session.commit()
        await self.session.refresh(run)

        return AnalysisRunPublic.model_validate(run)


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

        # Update status and timestamp
        run.status = AnalysisRunStatus.running.value
        run.started_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(run)

        # Broadcast WebSocket event
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

        # Query messages in time window
        # Convert aware datetime to naive for comparison (DB uses naive timestamps)
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

        # Update count
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

        # Get project config if available
        project_config = None
        if run.project_config_id:
            project_result = await self.session.execute(
                select(ProjectConfig).where(ProjectConfig.id == run.project_config_id)
            )
            project_config = project_result.scalar_one_or_none()

        # Apply filters
        filtered = []
        for msg in messages:
            # Filter by length (skip very short messages)
            if len(msg.content.strip()) < 10:
                continue

            # Filter by keywords if project config available
            if project_config and project_config.keywords:
                has_keyword = any(keyword.lower() in msg.content.lower() for keyword in project_config.keywords)
                if not has_keyword:
                    # Check for @mentions as alternative
                    if "@" not in msg.content:
                        continue

            filtered.append(msg)

        # Update count
        run.messages_after_prefilter = len(filtered)
        await self.session.commit()

        logger.info(f"Run {run_id}: {len(filtered)}/{len(messages)} messages after pre-filter")

        return filtered

    async def create_batches(self, messages: list[Message]) -> list[list[Message]]:
        """Group messages into batches for LLM processing.

        Groups messages by time proximity (5-10min windows) with max 50 messages per batch.

        Args:
            messages: List of filtered messages

        Returns:
            List of message batches
        """
        if not messages:
            return []

        # Sort messages by time
        sorted_messages = sorted(messages, key=lambda m: m.sent_at)

        batches = []
        current_batch = [sorted_messages[0]]

        for msg in sorted_messages[1:]:
            time_diff = (msg.sent_at - current_batch[-1].sent_at).total_seconds()

            # Start new batch if:
            # 1. Time gap > 10 minutes
            # 2. Batch size >= 50
            if time_diff > 600 or len(current_batch) >= 50:
                batches.append(current_batch)
                current_batch = [msg]
            else:
                current_batch.append(msg)

        # Add last batch
        if current_batch:
            batches.append(current_batch)

        logger.info(f"Created {len(batches)} batches from {len(messages)} messages")

        return batches

    async def process_batch(self, run_id: UUID, batch: list[Message]) -> list[dict]:
        """Process message batch with LLM to generate proposals.

        Args:
            run_id: Analysis run UUID
            batch: List of messages in batch

        Returns:
            List of proposal dictionaries

        Raises:
            ValueError: If run not found or agent/provider invalid
        """
        result = await self.session.execute(select(AnalysisRun).where(AnalysisRun.id == run_id))
        run = result.scalar_one_or_none()

        if not run:
            raise ValueError(f"Run with ID '{run_id}' not found")

        # Get agent assignment
        assignment_result = await self.session.execute(
            select(AgentTaskAssignment).where(AgentTaskAssignment.id == run.agent_assignment_id)
        )
        assignment = assignment_result.scalar_one_or_none()

        if not assignment:
            raise ValueError(f"Agent assignment with ID '{run.agent_assignment_id}' not found")

        # Get agent config
        agent_result = await self.session.execute(select(AgentConfig).where(AgentConfig.id == assignment.agent_id))
        agent = agent_result.scalar_one_or_none()

        if not agent:
            raise ValueError(f"Agent with ID '{assignment.agent_id}' not found")

        # Get provider
        provider_result = await self.session.execute(select(LLMProvider).where(LLMProvider.id == agent.provider_id))
        provider = provider_result.scalar_one_or_none()

        if not provider:
            raise ValueError(f"Provider with ID '{agent.provider_id}' not found")

        # Get project config if available
        project_config = None
        if run.project_config_id:
            project_result = await self.session.execute(
                select(ProjectConfig).where(ProjectConfig.id == run.project_config_id)
            )
            project_config = project_result.scalar_one_or_none()

        # Create LLM service and generate proposals
        llm_service = LLMProposalService(agent, provider)
        proposals = await llm_service.generate_proposals(batch, project_config)

        logger.info(f"Run {run_id}: Generated {len(proposals)} proposals from batch")

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
            # Create proposal
            proposal = TaskProposal(
                analysis_run_id=run_id,
                **proposal_data,
            )

            self.session.add(proposal)
            saved_count += 1

        # Update run counts
        run.proposals_total += saved_count
        run.proposals_pending += saved_count

        await self.session.commit()

        # Broadcast WebSocket event
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

        # Update batches count
        run.batches_created = total

        await self.session.commit()

        # Broadcast WebSocket event
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

        # Update status and timestamp
        run.status = AnalysisRunStatus.completed.value
        run.completed_at = datetime.utcnow()

        await self.session.commit()
        await self.session.refresh(run)

        # Broadcast WebSocket event
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

        # Update status and error log
        run.status = AnalysisRunStatus.failed.value
        run.error_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "error": error,
        }

        await self.session.commit()
        await self.session.refresh(run)

        # Broadcast WebSocket event
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
