"""Tests for ExtractionSchedulerService.

Tests the cron scheduling integration with TaskIQ for ScheduledExtractionTask.
"""

import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.agent_config import AgentConfig
from app.models.llm_provider import LLMProvider
from app.models.scheduled_extraction_task import ScheduledExtractionTask


@pytest.fixture
def mock_schedule_source() -> MagicMock:
    """Mock NATSKeyValueScheduleSource."""
    mock = MagicMock()
    mock.startup = AsyncMock()
    mock.shutdown = AsyncMock()
    mock.add_schedule = AsyncMock()
    mock.delete_schedule = AsyncMock()
    mock.get_schedules = AsyncMock(return_value=[])
    return mock


@pytest.fixture
def extraction_scheduler(mock_schedule_source: MagicMock) -> AsyncGenerator:
    """Create ExtractionSchedulerService with mocked NATS."""
    from app.services.extraction_scheduler_service import ExtractionSchedulerService

    service = ExtractionSchedulerService()
    service._schedule_source = mock_schedule_source
    service._started = True
    yield service


@pytest.fixture
async def agent_config(db_session: AsyncSession) -> AgentConfig:
    """Create test agent config."""
    # First create a provider
    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    # Then create agent
    agent = AgentConfig(
        name="test_extractor",
        description="Test knowledge extractor",
        system_prompt="Extract knowledge from messages.",
        model="llama3.2",
        provider_id=provider.id,
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def scheduled_task(
    db_session: AsyncSession,
    agent_config: AgentConfig,
) -> ScheduledExtractionTask:
    """Create test scheduled extraction task."""
    task = ScheduledExtractionTask(
        name="Test Extraction Task",
        cron_schedule="0 9 * * *",
        agent_id=agent_config.id,
        is_active=True,
        lookback_hours=24,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


class TestExtractionSchedulerService:
    """Test suite for ExtractionSchedulerService."""

    def test_make_schedule_id(self, extraction_scheduler: MagicMock) -> None:
        """Test schedule ID generation."""
        task_id = uuid.uuid4()
        schedule_id = extraction_scheduler._make_schedule_id(task_id)
        assert schedule_id == f"extraction_task_{task_id}"

    def test_parse_task_id_from_schedule(self, extraction_scheduler: MagicMock) -> None:
        """Test extracting task ID from schedule ID."""
        task_id = uuid.uuid4()
        schedule_id = f"extraction_task_{task_id}"

        parsed_id = extraction_scheduler._parse_task_id_from_schedule(schedule_id)
        assert parsed_id == task_id

    def test_parse_task_id_invalid_prefix(self, extraction_scheduler: MagicMock) -> None:
        """Test parsing with invalid prefix returns None."""
        result = extraction_scheduler._parse_task_id_from_schedule("other_prefix_123")
        assert result is None

    @pytest.mark.asyncio
    async def test_schedule_task(
        self,
        extraction_scheduler: MagicMock,
        scheduled_task: ScheduledExtractionTask,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test scheduling a single task."""
        result = await extraction_scheduler.schedule_task(scheduled_task)

        assert result is True
        mock_schedule_source.add_schedule.assert_called_once()
        call_args = mock_schedule_source.add_schedule.call_args[0][0]
        assert call_args.task_name == "run_scheduled_extraction"
        assert call_args.cron == "0 9 * * *"
        assert call_args.kwargs["scheduled_task_id"] == str(scheduled_task.id)

    @pytest.mark.asyncio
    async def test_schedule_inactive_task(
        self,
        extraction_scheduler: MagicMock,
        scheduled_task: ScheduledExtractionTask,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test scheduling an inactive task returns False."""
        scheduled_task.is_active = False

        result = await extraction_scheduler.schedule_task(scheduled_task)

        assert result is False
        mock_schedule_source.add_schedule.assert_not_called()

    @pytest.mark.asyncio
    async def test_unschedule_task(
        self,
        extraction_scheduler: MagicMock,
        scheduled_task: ScheduledExtractionTask,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test unscheduling a task."""
        result = await extraction_scheduler.unschedule_task(scheduled_task.id)

        assert result is True
        expected_schedule_id = f"extraction_task_{scheduled_task.id}"
        mock_schedule_source.delete_schedule.assert_called_once_with(expected_schedule_id)

    @pytest.mark.asyncio
    async def test_sync_scheduled_tasks_adds_missing(
        self,
        db_session: AsyncSession,
        extraction_scheduler: MagicMock,
        scheduled_task: ScheduledExtractionTask,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test sync adds schedules for active tasks not in NATS."""
        mock_schedule_source.get_schedules.return_value = []

        stats = await extraction_scheduler.sync_scheduled_tasks(db_session)

        assert stats["added"] >= 1
        assert stats["errors"] == 0
        mock_schedule_source.add_schedule.assert_called()

    @pytest.mark.asyncio
    async def test_sync_scheduled_tasks_removes_stale(
        self,
        db_session: AsyncSession,
        extraction_scheduler: MagicMock,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test sync removes schedules for deleted tasks."""
        # Simulate a schedule that exists in NATS but not in DB
        stale_schedule = MagicMock()
        stale_schedule.schedule_id = "extraction_task_00000000-0000-0000-0000-000000000000"
        mock_schedule_source.get_schedules.return_value = [stale_schedule]

        stats = await extraction_scheduler.sync_scheduled_tasks(db_session)

        assert stats["removed"] >= 1
        mock_schedule_source.delete_schedule.assert_called_with(stale_schedule.schedule_id)

    @pytest.mark.asyncio
    async def test_get_scheduled_task_ids(
        self,
        extraction_scheduler: MagicMock,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test getting list of scheduled task IDs."""
        task_id = uuid.uuid4()
        schedule = MagicMock()
        schedule.schedule_id = f"extraction_task_{task_id}"
        mock_schedule_source.get_schedules.return_value = [schedule]

        task_ids = await extraction_scheduler.get_scheduled_task_ids()

        assert len(task_ids) == 1
        assert task_ids[0] == task_id

    @pytest.mark.asyncio
    async def test_startup(self, mock_schedule_source: MagicMock) -> None:
        """Test service startup initializes NATS connection."""
        from app.services.extraction_scheduler_service import ExtractionSchedulerService

        with patch("app.services.extraction_scheduler_service.NATSKeyValueScheduleSource") as mock_class:
            mock_class.return_value = mock_schedule_source

            service = ExtractionSchedulerService()
            await service.startup()

            assert service._started is True
            mock_schedule_source.startup.assert_called_once()

    @pytest.mark.asyncio
    async def test_shutdown(
        self,
        extraction_scheduler: MagicMock,
        mock_schedule_source: MagicMock,
    ) -> None:
        """Test service shutdown closes NATS connection."""
        await extraction_scheduler.shutdown()

        mock_schedule_source.shutdown.assert_called_once()
        assert extraction_scheduler._started is False


class TestRunScheduledExtraction:
    """Test suite for run_scheduled_extraction task."""

    @pytest.mark.asyncio
    async def test_task_not_found(self) -> None:
        """Test handling of non-existent task."""
        from app.tasks.knowledge import run_scheduled_extraction

        with patch("app.tasks.knowledge.AsyncSessionLocal") as mock_session_local:
            mock_session = AsyncMock()
            mock_session.get.return_value = None
            mock_session_local.return_value.__aenter__.return_value = mock_session

            result = await run_scheduled_extraction(str(uuid.uuid4()))

            assert result["status"] == "error"
            assert result["reason"] == "task_not_found"

    @pytest.mark.asyncio
    async def test_inactive_task_skipped(
        self,
        db_session: AsyncSession,
        scheduled_task: ScheduledExtractionTask,
    ) -> None:
        """Test inactive tasks are skipped."""
        from app.tasks.knowledge import run_scheduled_extraction

        scheduled_task.is_active = False
        await db_session.commit()

        with patch("app.tasks.knowledge.AsyncSessionLocal") as mock_session_local:
            mock_session = AsyncMock()
            mock_session.get.return_value = scheduled_task
            mock_session_local.return_value.__aenter__.return_value = mock_session

            result = await run_scheduled_extraction(str(scheduled_task.id))

            assert result["status"] == "skipped"
            assert result["reason"] == "task_inactive"
