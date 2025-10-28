"""Utility functions and decorators for task retry logic with exponential backoff."""

import functools
from collections.abc import Callable
from typing import Any, TypeVar

from app.database import AsyncSessionLocal
from app.services.dead_letter_queue_service import DeadLetterQueueService
from loguru import logger
from tenacity import (
    RetryError,
    after_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

F = TypeVar("F", bound=Callable[..., Any])

RETRYABLE_EXCEPTIONS = (
    ConnectionError,
    TimeoutError,
    OSError,
)


def task_retry_with_dlq(
    max_attempts: int = 3,
    min_wait_seconds: int = 2,
    max_wait_seconds: int = 60,
    task_name: str | None = None,
) -> Callable[[F], F]:
    """Decorator to add retry logic with Dead Letter Queue recording for background tasks.

    Wraps a task with exponential backoff retry mechanism. On final failure after
    max_attempts, records the failure in Dead Letter Queue for manual inspection.

    Args:
        max_attempts: Maximum number of retry attempts (default: 3)
        min_wait_seconds: Minimum wait time between retries (default: 2s)
        max_wait_seconds: Maximum wait time between retries (default: 60s)
        task_name: Custom task name for DLQ (default: function __name__)

    Returns:
        Decorated function with retry and DLQ capabilities

    Example:
        ```python
        @task_retry_with_dlq(max_attempts=3, task_name="score_message")
        @nats_broker.task
        async def score_message_task(message_id: int) -> dict:
            # Task implementation
            pass
        ```

    Retry Behavior:
        - Attempt 1: Immediate execution
        - Attempt 2: Wait ~2 seconds
        - Attempt 3: Wait ~4 seconds
        - After max attempts: Record in DLQ and raise exception

    Retryable Errors:
        - ConnectionError (network, database, NATS)
        - TimeoutError (slow LLM responses, network timeouts)
        - OSError (file system, socket errors)

    Non-Retryable Errors:
        - ValueError (validation errors)
        - KeyError (missing data)
        - Any other exceptions (business logic errors)
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            actual_task_name = task_name or func.__name__
            attempt_count = 0

            async def attempt_task() -> Any:
                nonlocal attempt_count
                attempt_count += 1
                return await func(*args, **kwargs)

            retry_decorator = retry(
                stop=stop_after_attempt(max_attempts),
                wait=wait_exponential(multiplier=1, min=min_wait_seconds, max=max_wait_seconds),
                retry=retry_if_exception_type(RETRYABLE_EXCEPTIONS),
                after=after_log(logger, logger.level("WARNING").no),  # type: ignore[arg-type]
                reraise=True,
            )

            decorated_attempt = retry_decorator(attempt_task)

            try:
                return await decorated_attempt()
            except RetryError as e:
                original_error = e.last_attempt.exception()

                logger.error(
                    f"Task {actual_task_name} failed after {attempt_count} attempts. "
                    f"Recording in DLQ. Error: {original_error}"
                )

                task_args = {"args": args, "kwargs": kwargs}

                try:
                    async with AsyncSessionLocal() as db:
                        dlq_service = DeadLetterQueueService(db)
                        await dlq_service.record_failure(
                            task_name=actual_task_name,
                            task_args=task_args,
                            error=original_error,  # type: ignore[arg-type]
                            attempts=attempt_count,
                        )
                    logger.info(f"Recorded failed task {actual_task_name} in DLQ")
                except Exception as dlq_error:
                    logger.error(f"Failed to record task in DLQ: {dlq_error}", exc_info=True)

                raise original_error from e  # type: ignore[misc]

        return wrapper  # type: ignore[return-value]

    return decorator
