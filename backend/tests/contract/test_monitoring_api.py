"""Contract tests for monitoring API endpoints.

These tests verify the monitoring endpoints match their OpenAPI contracts.
They follow TDD: written before implementation, should fail initially.
"""

from datetime import datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task_execution_log import TaskExecutionLog, TaskStatus


@pytest.mark.asyncio
async def test_get_metrics_returns_200_with_valid_schema(
    client: AsyncClient, db_session: AsyncSession
):
    """T005: Test metrics endpoint returns 200 with valid MonitoringMetricsResponse schema."""
    log = TaskExecutionLog(
        task_name="test_task",
        status=TaskStatus.SUCCESS,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_ms=100,
    )
    db_session.add(log)
    await db_session.commit()

    response = await client.get("/api/v1/monitoring/metrics")

    if response.status_code != 200:
        print(f"Error response: {response.json()}")
    assert response.status_code == 200
    data = response.json()

    assert "time_window_hours" in data
    assert "generated_at" in data
    assert "metrics" in data
    assert isinstance(data["metrics"], list)

    if data["metrics"]:
        metric = data["metrics"][0]
        assert "task_name" in metric
        assert "total_executions" in metric
        assert "pending" in metric
        assert "running" in metric
        assert "success" in metric
        assert "failed" in metric
        assert "avg_duration_ms" in metric
        assert "success_rate" in metric


@pytest.mark.asyncio
async def test_get_metrics_with_time_window_param(
    client: AsyncClient, db_session: AsyncSession
):
    """T006: Test metrics endpoint respects time_window query parameter."""
    log = TaskExecutionLog(
        task_name="windowed_task",
        status=TaskStatus.SUCCESS,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_ms=200,
    )
    db_session.add(log)
    await db_session.commit()

    response = await client.get("/api/v1/monitoring/metrics?time_window=48")

    assert response.status_code == 200
    data = response.json()
    assert data["time_window_hours"] == 48


@pytest.mark.asyncio
async def test_get_history_returns_200_with_pagination(
    client: AsyncClient, db_session: AsyncSession
):
    """T007: Test history endpoint returns paginated TaskHistoryResponse."""
    for i in range(5):
        log = TaskExecutionLog(
            task_name=f"paginated_task_{i}",
            status=TaskStatus.SUCCESS,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=150 + i,
        )
        db_session.add(log)
    await db_session.commit()

    response = await client.get("/api/v1/monitoring/history?page=1&page_size=50")

    assert response.status_code == 200
    data = response.json()

    assert "total_count" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert "items" in data

    assert data["page"] == 1
    assert data["page_size"] == 50
    assert isinstance(data["items"], list)
    assert data["total_count"] >= 5

    if data["items"]:
        item = data["items"][0]
        assert "id" in item
        assert "task_name" in item
        assert "status" in item
        assert "created_at" in item


@pytest.mark.asyncio
async def test_get_history_with_filters(client: AsyncClient, db_session: AsyncSession):
    """T008: Test history endpoint filters by task_name and status."""
    failed_log = TaskExecutionLog(
        task_name="score_message_task",
        status=TaskStatus.FAILED,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_ms=50,
        error_message="Test error",
    )
    success_log = TaskExecutionLog(
        task_name="score_message_task",
        status=TaskStatus.SUCCESS,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_ms=100,
    )
    other_task_log = TaskExecutionLog(
        task_name="other_task",
        status=TaskStatus.FAILED,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        duration_ms=75,
        error_message="Other error",
    )

    db_session.add_all([failed_log, success_log, other_task_log])
    await db_session.commit()

    response = await client.get(
        "/api/v1/monitoring/history?task_name=score_message_task&status=failed"
    )

    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    for item in data["items"]:
        assert item["task_name"] == "score_message_task"
        assert item["status"] == "failed"


@pytest.mark.asyncio
async def test_get_history_invalid_date_format_returns_400(client: AsyncClient):
    """T009: Test error handling for invalid date format returns 422 (FastAPI validation)."""
    response = await client.get("/api/v1/monitoring/history?start_date=invalid")

    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
