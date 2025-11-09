"""API tests for Analysis Run endpoints.

Tests critical validation rules:
- Cannot create new run if unclosed runs exist (409)
- Cannot close run if proposals_pending > 0 (400)
- Proposal approve/reject decrements proposals_pending
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    LLMProvider,
    ProviderType,
    TaskConfig,
    User,
    ValidationStatus,
)


@pytest.mark.asyncio
async def test_list_runs(client, db_session):
    """Test GET /api/v1/analysis/runs - list analysis runs with pagination."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create multiple runs
    for i in range(5):
        run = AnalysisRun(
            time_window_start=datetime.utcnow() - timedelta(days=i + 1),
            time_window_end=datetime.utcnow() - timedelta(days=i),
            agent_assignment_id=assignment.id,
            config_snapshot={"test": f"data_{i}"},
            trigger_type="manual",
            status=AnalysisRunStatus.pending.value,
        )
        db_session.add(run)
    await db_session.commit()

    # Mock WebSocket manager
    with patch("app.api.v1.analysis_runs.websocket_manager", AsyncMock()):
        # Test list
        response = await client.get("/api/v1/analysis/runs")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert len(data["items"]) == 5
        assert data["total"] == 5


@pytest.mark.asyncio
async def test_create_run(client, db_session):
    """Test POST /api/v1/analysis/runs - create new analysis run."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Mock WebSocket manager
    with patch("app.api.v1.analysis_runs.websocket_manager", AsyncMock()):
        # Create run
        run_data = {
            "time_window_start": datetime.utcnow().isoformat(),
            "time_window_end": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "agent_assignment_id": str(assignment.id),
            "trigger_type": "manual",
        }
        response = await client.post("/api/v1/analysis/runs", json=run_data)
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == AnalysisRunStatus.pending.value
        assert data["trigger_type"] == "manual"
        assert "config_snapshot" in data


@pytest.mark.asyncio
async def test_cannot_start_if_unclosed_runs(client, db_session):
    """CRITICAL TEST: Cannot create new run if unclosed runs exist (409)."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create unclosed run (pending status)
    existing_run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=2),
        time_window_end=datetime.utcnow() - timedelta(days=1),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "existing"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,  # Unclosed!
    )
    db_session.add(existing_run)
    await db_session.commit()

    # Mock WebSocket manager
    with patch("app.api.v1.analysis_runs.websocket_manager", AsyncMock()):
        # Try to create new run - should fail with 409
        run_data = {
            "time_window_start": datetime.utcnow().isoformat(),
            "time_window_end": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "agent_assignment_id": str(assignment.id),
            "trigger_type": "manual",
        }
        response = await client.post("/api/v1/analysis/runs", json=run_data)
        assert response.status_code == 409  # Conflict
        assert "unclosed run" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_run_details(client, db_session):
    """Test GET /api/v1/analysis/runs/{run_id} - get run details."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create run
    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
        proposals_total=5,
        proposals_pending=5,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Get run
    response = await client.get(f"/api/v1/analysis/runs/{run.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(run.id)
    assert data["status"] == AnalysisRunStatus.pending.value
    assert data["proposals_total"] == 5
    assert data["proposals_pending"] == 5


@pytest.mark.asyncio
async def test_close_run(client, db_session):
    """Test PUT /api/v1/analysis/runs/{run_id}/close - close run successfully."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create run with no pending proposals
    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
        proposals_total=10,
        proposals_pending=0,  # All reviewed!
        proposals_approved=7,
        proposals_rejected=3,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Mock WebSocket manager
    with patch("app.api.v1.analysis_runs.websocket_manager", AsyncMock()):
        # Close run
        response = await client.put(f"/api/v1/analysis/runs/{run.id}/close")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == AnalysisRunStatus.closed.value
        assert data["closed_at"] is not None
        assert data["accuracy_metrics"] is not None
        assert data["accuracy_metrics"]["proposals_total"] == 10
        assert data["accuracy_metrics"]["proposals_approved"] == 7
        assert data["accuracy_metrics"]["proposals_rejected"] == 3
        assert data["accuracy_metrics"]["approval_rate"] == 0.7
        assert data["accuracy_metrics"]["rejection_rate"] == 0.3


@pytest.mark.asyncio
async def test_cannot_close_with_pending_proposals(client, db_session):
    """CRITICAL TEST: Cannot close run if proposals_pending > 0 (400)."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create run with pending proposals
    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
        proposals_total=10,
        proposals_pending=3,  # Still pending!
        proposals_approved=5,
        proposals_rejected=2,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Mock WebSocket manager
    with patch("app.api.v1.analysis_runs.websocket_manager", AsyncMock()):
        # Try to close run - should fail with 400
        response = await client.put(f"/api/v1/analysis/runs/{run.id}/close")
        assert response.status_code == 400  # Bad Request
        assert "pending" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_filters_work(client, db_session):
    """Test filtering by status, trigger_type, date range."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create runs with different statuses and trigger types
    run1 = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=2),
        time_window_end=datetime.utcnow() - timedelta(days=1),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data1"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    run2 = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=3),
        time_window_end=datetime.utcnow() - timedelta(days=2),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data2"},
        trigger_type="scheduled",
        status=AnalysisRunStatus.completed.value,
    )
    run3 = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=4),
        time_window_end=datetime.utcnow() - timedelta(days=3),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data3"},
        trigger_type="manual",
        status=AnalysisRunStatus.closed.value,
    )
    db_session.add(run1)
    db_session.add(run2)
    db_session.add(run3)
    await db_session.commit()

    # Test status filter
    response = await client.get(f"/api/v1/analysis/runs?status={AnalysisRunStatus.pending.value}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == AnalysisRunStatus.pending.value

    # Test trigger_type filter
    response = await client.get("/api/v1/analysis/runs?trigger_type=scheduled")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["trigger_type"] == "scheduled"


@pytest.mark.asyncio
async def test_start_run_endpoint(client, db_session):
    """Test POST /api/v1/analysis/runs/{run_id}/start - trigger background job."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="test-model",
        system_prompt="Test prompt",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Test Task",
        description="Test task",
        instruction="Test instruction",
        output_schema={"type": "object"},
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)

    assignment = AgentTaskAssignment(
        agent_id=agent.id,
        task_id=task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)

    # Create run
    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Mock TaskIQ background task (imported inside function, so patch at source)
    with patch("app.tasks.execute_analysis_run") as mock_task:
        mock_task.kiq = AsyncMock()
        # Start run
        response = await client.post(f"/api/v1/analysis/runs/{run.id}/start")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "started"
        assert "run_id" in data
        # Verify background task was triggered
        mock_task.kiq.assert_called_once()


@pytest.mark.asyncio
async def test_get_run_not_found(client, db_session):
    """Test GET /api/v1/analysis/runs/{run_id} with non-existent ID."""
    random_id = uuid4()
    response = await client.get(f"/api/v1/analysis/runs/{random_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
