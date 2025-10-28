"""Integration tests for TaskIQ logging middleware.

These tests verify the middleware correctly logs task execution lifecycle events.
They follow TDD: written before implementation, should fail initially.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.models.task_execution_log import TaskExecutionLog, TaskStatus
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from taskiq import TaskiqMessage, TaskiqResult


@pytest.mark.asyncio
async def test_middleware_logs_task_start(db_session: AsyncSession):
    """T010: Test middleware creates log record when task starts."""
    from app.middleware.taskiq_logging_middleware import TaskLoggingMiddleware

    middleware = TaskLoggingMiddleware()

    message = TaskiqMessage(
        task_name="test_task",
        task_id="test_id_123",
        args=[],
        kwargs={"param1": "value1"},
        labels={},
    )

    with patch("app.middleware.taskiq_logging_middleware.AsyncSessionLocal") as mock_session:
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = db_session
        mock_context.__aexit__.return_value = None
        mock_session.return_value = mock_context

        await middleware.pre_execute(message)

    result = await db_session.execute(select(TaskExecutionLog).where(TaskExecutionLog.task_name == "test_task"))
    log = result.scalar_one_or_none()

    assert log is not None
    assert log.task_name == "test_task"
    assert log.status == TaskStatus.RUNNING
    assert log.started_at is not None
    assert log.task_id == "test_id_123"
    assert log.params == {"param1": "value1"}


@pytest.mark.asyncio
async def test_middleware_logs_successful_completion(db_session: AsyncSession):
    """T011: Test middleware updates log on task success."""
    from app.middleware.taskiq_logging_middleware import TaskLoggingMiddleware

    middleware = TaskLoggingMiddleware()

    message = TaskiqMessage(
        task_name="success_task",
        task_id="success_123",
        args=[],
        kwargs={},
        labels={},
    )

    with patch("app.middleware.taskiq_logging_middleware.AsyncSessionLocal") as mock_session:
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = db_session
        mock_context.__aexit__.return_value = None
        mock_session.return_value = mock_context

        await middleware.pre_execute(message)

        result_obj = TaskiqResult(
            is_err=False,
            return_value={"status": "completed"},
            execution_time=1.25,
            log=None,
        )

        await middleware.post_execute(message, result_obj)

    result = await db_session.execute(select(TaskExecutionLog).where(TaskExecutionLog.task_name == "success_task"))
    log = result.scalar_one_or_none()

    assert log is not None
    assert log.status == TaskStatus.SUCCESS
    assert log.completed_at is not None
    assert log.duration_ms is not None
    assert log.duration_ms >= 0
    assert log.error_message is None
    assert log.error_traceback is None


@pytest.mark.asyncio
async def test_middleware_logs_task_failure_with_traceback(db_session: AsyncSession):
    """T012: Test middleware captures errors with full stack trace."""
    from app.middleware.taskiq_logging_middleware import TaskLoggingMiddleware

    middleware = TaskLoggingMiddleware()

    message = TaskiqMessage(
        task_name="failed_task",
        task_id="failed_123",
        args=[],
        kwargs={},
        labels={},
    )

    with patch("app.middleware.taskiq_logging_middleware.AsyncSessionLocal") as mock_session:
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = db_session
        mock_context.__aexit__.return_value = None
        mock_session.return_value = mock_context

        await middleware.pre_execute(message)

        test_error = ValueError("Test error message")
        result_obj = TaskiqResult(
            is_err=True,
            return_value=None,
            error=test_error,
            execution_time=0.5,
            log="Error occurred during execution",
        )

        await middleware.post_execute(message, result_obj)

    result = await db_session.execute(select(TaskExecutionLog).where(TaskExecutionLog.task_name == "failed_task"))
    log = result.scalar_one_or_none()

    assert log is not None
    assert log.status == TaskStatus.FAILED
    assert log.completed_at is not None
    assert log.error_message is not None
    assert "Test error message" in log.error_message
    assert log.error_traceback is not None


@pytest.mark.asyncio
async def test_websocket_broadcasts_task_event(db_session: AsyncSession):
    """T013: Test middleware broadcasts task status changes via WebSocket."""
    from app.middleware.taskiq_logging_middleware import TaskLoggingMiddleware

    middleware = TaskLoggingMiddleware()
    mock_ws_manager = MagicMock()
    mock_ws_manager.broadcast_task_event = AsyncMock()

    message = TaskiqMessage(
        task_name="broadcast_task",
        task_id="broadcast_123",
        args=[],
        kwargs={"test": "param"},
        labels={},
    )

    with patch("app.middleware.taskiq_logging_middleware.AsyncSessionLocal") as mock_session:
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = db_session
        mock_context.__aexit__.return_value = None
        mock_session.return_value = mock_context

        with patch("app.middleware.taskiq_logging_middleware.websocket_manager", mock_ws_manager):
            await middleware.pre_execute(message)

            mock_ws_manager.broadcast_task_event.assert_called_once()
            call_kwargs = mock_ws_manager.broadcast_task_event.call_args.kwargs

            assert call_kwargs["event_type"] == "task_started"
            assert call_kwargs["task_name"] == "broadcast_task"
            assert call_kwargs["status"] == TaskStatus.RUNNING
            assert call_kwargs["task_id"] == "broadcast_123"
            assert call_kwargs["params"] == {"test": "param"}

            result_obj = TaskiqResult(
                is_err=False,
                return_value={"result": "success"},
                execution_time=1.0,
                log=None,
            )

            await middleware.post_execute(message, result_obj)

            assert mock_ws_manager.broadcast_task_event.call_count == 2
            second_call_kwargs = mock_ws_manager.broadcast_task_event.call_args.kwargs

            assert second_call_kwargs["event_type"] == "task_completed"
            assert second_call_kwargs["status"] == TaskStatus.SUCCESS
