"""Tests for AnalysisRun model."""

from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    LLMProvider,
    ProjectConfig,
    ProviderType,
    TaskConfig,
    User,
)


@pytest.mark.asyncio
async def test_create_analysis_run(db_session):
    """Test creating analysis run with required fields."""
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
        description="Test task description",
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

    # Create analysis run
    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Assertions
    assert run.id is not None
    assert run.status == AnalysisRunStatus.pending.value
    assert run.proposals_total == 0
    assert run.proposals_pending == 0
    assert run.proposals_approved == 0
    assert run.proposals_rejected == 0
    assert run.trigger_type == "manual"
    assert run.config_snapshot == {"test": "data"}
    assert run.created_at is not None
    assert run.started_at is None
    assert run.completed_at is None
    assert run.closed_at is None


@pytest.mark.asyncio
async def test_lifecycle_transitions(db_session):
    """Test run lifecycle transitions: pending -> running -> completed -> closed."""
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
        description="Test task description",
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

    # Create run in pending state
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

    assert run.status == AnalysisRunStatus.pending.value
    assert run.started_at is None

    # Transition to running
    run.status = AnalysisRunStatus.running.value
    run.started_at = datetime.utcnow()
    await db_session.commit()
    await db_session.refresh(run)

    assert run.status == AnalysisRunStatus.running.value
    assert run.started_at is not None
    assert run.completed_at is None

    # Transition to completed
    run.status = AnalysisRunStatus.completed.value
    run.completed_at = datetime.utcnow()
    run.proposals_total = 5
    run.proposals_pending = 5
    await db_session.commit()
    await db_session.refresh(run)

    assert run.status == AnalysisRunStatus.completed.value
    assert run.completed_at is not None
    assert run.closed_at is None
    assert run.proposals_total == 5

    # Transition to closed (after all proposals reviewed)
    run.proposals_pending = 0
    run.proposals_approved = 3
    run.proposals_rejected = 2
    run.status = AnalysisRunStatus.closed.value
    run.closed_at = datetime.utcnow()
    run.accuracy_metrics = {
        "proposals_total": 5,
        "proposals_approved": 3,
        "proposals_rejected": 2,
        "approval_rate": 0.6,
        "rejection_rate": 0.4,
    }
    await db_session.commit()
    await db_session.refresh(run)

    assert run.status == AnalysisRunStatus.closed.value
    assert run.closed_at is not None
    assert run.proposals_pending == 0
    assert run.accuracy_metrics is not None
    assert run.accuracy_metrics["approval_rate"] == 0.6


@pytest.mark.asyncio
async def test_config_snapshot_jsonb(db_session):
    """Test JSONB config_snapshot field stores complex data."""
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
        description="Test task description",
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

    # Complex config snapshot
    complex_snapshot = {
        "agent_assignment_id": str(assignment.id),
        "time_window": {
            "start": "2025-10-01T00:00:00Z",
            "end": "2025-10-02T00:00:00Z",
        },
        "project_config": {
            "id": str(uuid4()),
            "name": "Test Project",
            "version": "1.0.0",
            "keywords": ["test", "example", "demo"],
        },
        "settings": {
            "batch_size": 50,
            "timeout": 300,
            "nested": {
                "deep": {
                    "value": 42,
                }
            },
        },
    }

    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=assignment.id,
        config_snapshot=complex_snapshot,
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Verify snapshot stored correctly
    assert run.config_snapshot == complex_snapshot
    assert run.config_snapshot["settings"]["batch_size"] == 50
    assert run.config_snapshot["settings"]["nested"]["deep"]["value"] == 42
    assert run.config_snapshot["project_config"]["keywords"] == ["test", "example", "demo"]


@pytest.mark.asyncio
async def test_run_with_project_config(db_session):
    """Test creating run with optional project_config_id."""
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
        description="Test task description",
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

    project = ProjectConfig(
        name="Test Project",
        description="Test project description",
        keywords=["test", "project"],
        glossary={},
        components=[],
        default_assignee_ids=[],
        pm_user_id=user.id,
        is_active=True,
        priority_rules={},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)

    # Create run with project config
    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=assignment.id,
        project_config_id=project.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    assert run.project_config_id == project.id
    assert run.project_config_id is not None


@pytest.mark.asyncio
async def test_proposals_counting(db_session):
    """Test proposal counting fields update correctly."""
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
        description="Test task description",
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

    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Initial state
    assert run.proposals_total == 0
    assert run.proposals_pending == 0
    assert run.proposals_approved == 0
    assert run.proposals_rejected == 0

    # Update counts
    run.proposals_total = 10
    run.proposals_pending = 10
    await db_session.commit()
    await db_session.refresh(run)

    assert run.proposals_total == 10
    assert run.proposals_pending == 10

    # Approve some
    run.proposals_pending = 7
    run.proposals_approved = 3
    await db_session.commit()
    await db_session.refresh(run)

    assert run.proposals_pending == 7
    assert run.proposals_approved == 3
    assert run.proposals_total == 10

    # Reject some
    run.proposals_pending = 5
    run.proposals_rejected = 2
    await db_session.commit()
    await db_session.refresh(run)

    assert run.proposals_pending == 5
    assert run.proposals_approved == 3
    assert run.proposals_rejected == 2


@pytest.mark.asyncio
async def test_llm_usage_tracking(db_session):
    """Test LLM usage statistics tracking."""
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
        description="Test task description",
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

    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Update LLM usage stats
    run.total_messages_in_window = 1000
    run.messages_after_prefilter = 300
    run.batches_created = 6
    run.llm_tokens_used = 15000
    run.cost_estimate = 0.15
    await db_session.commit()
    await db_session.refresh(run)

    assert run.total_messages_in_window == 1000
    assert run.messages_after_prefilter == 300
    assert run.batches_created == 6
    assert run.llm_tokens_used == 15000
    assert run.cost_estimate == 0.15


@pytest.mark.asyncio
async def test_error_log_jsonb(db_session):
    """Test error_log JSONB field for failure tracking."""
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
        description="Test task description",
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

    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Simulate failure
    run.status = AnalysisRunStatus.failed.value
    run.error_log = {
        "timestamp": "2025-10-10T12:00:00Z",
        "error": "LLM provider connection timeout",
        "traceback": "Traceback (most recent call last)...",
        "batch_number": 3,
    }
    await db_session.commit()
    await db_session.refresh(run)

    assert run.status == AnalysisRunStatus.failed.value
    assert run.error_log is not None
    assert run.error_log["error"] == "LLM provider connection timeout"
    assert run.error_log["batch_number"] == 3
