"""Tests for retry mechanism with exponential backoff and Dead Letter Queue."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.models.failed_task import FailedTask, FailedTaskStatus
from app.services.dead_letter_queue_service import DeadLetterQueueService


@pytest.mark.asyncio
async def test_record_failure_in_dlq() -> None:
    """Test recording a failed task in Dead Letter Queue."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    error = ValueError("Test error message")
    task_name = "test_task"
    task_args = {"message_id": 123}
    attempts = 3

    with (
        patch.object(mock_session, "add") as mock_add,
        patch.object(mock_session, "commit", new_callable=AsyncMock) as mock_commit,
        patch.object(mock_session, "refresh", new_callable=AsyncMock) as mock_refresh,
    ):
        failed_task = await service.record_failure(
            task_name=task_name,
            task_args=task_args,
            error=error,
            attempts=attempts,
        )

        assert failed_task.task_name == task_name
        assert failed_task.task_args == task_args
        assert failed_task.error_message == str(error)
        assert failed_task.attempts == attempts
        assert failed_task.status == FailedTaskStatus.failed

        mock_add.assert_called_once()
        mock_commit.assert_awaited_once()
        mock_refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_failed_tasks_with_filters() -> None:
    """Test retrieving failed tasks with status filter."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    mock_failed_task = FailedTask(
        id=1,
        task_name="score_message",
        task_args={"message_id": 123},
        error_message="Connection timeout",
        error_traceback="Traceback...",
        attempts=3,
        status=FailedTaskStatus.failed,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    # Mock the count query result (use MagicMock for result.scalar() since it's synchronous)
    mock_count_result = MagicMock()
    mock_count_result.scalar.return_value = 1

    # Mock the scalars result with proper chaining (use MagicMock for sync methods)
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_failed_task]

    # Use MagicMock for result.scalars() since it's a synchronous method
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars

    # First call returns count, second call returns data
    mock_session.execute.side_effect = [mock_count_result, mock_result]

    tasks, count = await service.get_failed_tasks(
        status=FailedTaskStatus.failed,
        limit=10,
        offset=0,
    )

    assert len(tasks) == 1
    assert count == 1
    assert tasks[0].task_name == "score_message"
    assert tasks[0].status == FailedTaskStatus.failed


@pytest.mark.asyncio
async def test_mark_task_as_abandoned() -> None:
    """Test marking a failed task as abandoned."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    mock_failed_task = FailedTask(
        id=1,
        task_name="test_task",
        task_args={},
        error_message="Error",
        error_traceback="Traceback...",
        attempts=3,
        status=FailedTaskStatus.failed,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    with (
        patch.object(service, "get_failed_task", return_value=mock_failed_task),
        patch.object(mock_session, "commit", new_callable=AsyncMock) as mock_commit,
        patch.object(mock_session, "refresh", new_callable=AsyncMock) as mock_refresh,
    ):
        result = await service.mark_abandoned(1)

        assert result is not None
        assert result.status == FailedTaskStatus.abandoned
        mock_commit.assert_awaited_once()
        mock_refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_mark_task_not_found() -> None:
    """Test marking non-existent task returns None."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    with patch.object(service, "get_failed_task", return_value=None):
        result = await service.mark_abandoned(999)
        assert result is None


@pytest.mark.asyncio
async def test_increment_attempts() -> None:
    """Test incrementing retry attempts counter."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    mock_failed_task = FailedTask(
        id=1,
        task_name="test_task",
        task_args={},
        error_message="Error",
        error_traceback="Traceback...",
        attempts=1,
        status=FailedTaskStatus.failed,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    with (
        patch.object(service, "get_failed_task", return_value=mock_failed_task),
        patch.object(mock_session, "commit", new_callable=AsyncMock) as mock_commit,
        patch.object(mock_session, "refresh", new_callable=AsyncMock) as mock_refresh,
    ):
        result = await service.increment_attempts(1)

        assert result is not None
        assert result.attempts == 2
        mock_commit.assert_awaited_once()
        mock_refresh.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_failed_task() -> None:
    """Test deleting a failed task from DLQ."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    mock_failed_task = FailedTask(
        id=1,
        task_name="test_task",
        task_args={},
        error_message="Error",
        error_traceback="Traceback...",
        attempts=3,
        status=FailedTaskStatus.abandoned,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    with (
        patch.object(service, "get_failed_task", return_value=mock_failed_task),
        patch.object(mock_session, "delete") as mock_delete,
        patch.object(mock_session, "commit", new_callable=AsyncMock) as mock_commit,
    ):
        result = await service.delete_failed_task(1)

        assert result is True
        mock_delete.assert_called_once_with(mock_failed_task)
        mock_commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_task_not_found() -> None:
    """Test deleting non-existent task returns False."""
    mock_session = AsyncMock()
    service = DeadLetterQueueService(mock_session)

    with patch.object(service, "get_failed_task", return_value=None):
        result = await service.delete_failed_task(999)
        assert result is False
