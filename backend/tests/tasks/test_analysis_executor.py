"""Tests for AnalysisExecutor background job methods.

Tests the execution logic for analysis runs:
- Start run
- Fetch messages
- Prefilter messages
- Create batches
- Save proposals
- Update progress
- Complete/fail run
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    LLMProvider,
    Message,
    ProjectConfig,
    ProviderType,
    SourceType,
    TaskConfig,
    User,
    ValidationStatus,
)
from app.models.legacy import Source
from app.services.analysis_service import AnalysisExecutor


@pytest.mark.asyncio
async def test_start_run(db_session):
    """Test AnalysisExecutor.start_run() - updates status to running."""
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

    # Mock WebSocket manager
    with patch("app.services.analysis_service.websocket_manager", AsyncMock()):
        # Start run
        executor = AnalysisExecutor(db_session)
        await executor.start_run(run.id)

    # Verify status updated
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.running.value
    assert run.started_at is not None


@pytest.mark.asyncio
async def test_fetch_messages(db_session):
    """Test AnalysisExecutor.fetch_messages() - queries messages in time window."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    source = Source(name="Test Source", type=SourceType.telegram, is_active=True)
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)

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

    # Create time window
    start = datetime.utcnow() - timedelta(hours=2)
    end = datetime.utcnow() - timedelta(hours=1)

    # Create run
    run = AnalysisRun(
        time_window_start=start,
        time_window_end=end,
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create messages (some in window, some outside)
    msg1 = Message(external_message_id="test-msg-1", content="In window", sent_at=start + timedelta(minutes=30), source_id=source.id, author_id=user.id)
    msg2 = Message(external_message_id="test-msg-2", content="Also in window", sent_at=start + timedelta(minutes=45), source_id=source.id, author_id=user.id)
    msg3 = Message(external_message_id="test-msg-3", content="Outside window", sent_at=end + timedelta(hours=1), source_id=source.id, author_id=user.id)
    db_session.add(msg1)
    db_session.add(msg2)
    db_session.add(msg3)
    await db_session.commit()

    # Fetch messages
    executor = AnalysisExecutor(db_session)
    messages = await executor.fetch_messages(run.id)

    # Verify correct messages fetched
    assert len(messages) == 2
    await db_session.refresh(run)
    assert run.total_messages_in_window == 2


@pytest.mark.asyncio
async def test_prefilter_messages(db_session):
    """Test AnalysisExecutor.prefilter_messages() - filters by keywords and length."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    source = Source(name="Test Source", type=SourceType.telegram, is_active=True)
    db_session.add(source)
    await db_session.commit()
    await db_session.refresh(source)

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

    # Create project with keywords
    project = ProjectConfig(
        name="Test Project",
        description="Project with keywords",
        keywords=["backend", "api"],
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

    # Create run with project
    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        project_config_id=project.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create messages with different characteristics
    messages = [
        Message(external_message_id="prefilter-msg-1", content="Fix backend API bug", sent_at=datetime.utcnow(), source_id=source.id, author_id=user.id),  # Has keyword
        Message(external_message_id="prefilter-msg-2", content="short", sent_at=datetime.utcnow(), source_id=source.id, author_id=user.id),  # Too short
        Message(external_message_id="prefilter-msg-3", content="Some random long message here", sent_at=datetime.utcnow(), source_id=source.id, author_id=user.id),  # No keyword, no @
        Message(external_message_id="prefilter-msg-4", content="@john please check backend", sent_at=datetime.utcnow(), source_id=source.id, author_id=user.id),  # Has @ mention
    ]
    for msg in messages:
        db_session.add(msg)
    await db_session.commit()

    # Prefilter messages
    executor = AnalysisExecutor(db_session)
    filtered = await executor.prefilter_messages(run.id, messages)

    # Verify filtering
    assert len(filtered) == 2  # Only messages with keyword or @mention
    await db_session.refresh(run)
    assert run.messages_after_prefilter == 2


@pytest.mark.asyncio
async def test_create_batches(db_session):
    """Test AnalysisExecutor.create_batches() - groups messages by time."""
    # Create messages with time gaps
    base_time = datetime.utcnow()
    messages = [Message(content=f"Message {i}", sent_at=base_time + timedelta(minutes=i)) for i in range(5)]
    # Add gap (>10 minutes)
    messages.extend([Message(content=f"Message {i}", sent_at=base_time + timedelta(minutes=20 + i)) for i in range(3)])

    executor = AnalysisExecutor(db_session)
    batches = await executor.create_batches(messages)

    # Verify batching
    assert len(batches) == 2  # Should have 2 batches due to time gap
    assert len(batches[0]) == 5
    assert len(batches[1]) == 3


@pytest.mark.asyncio
async def test_save_proposals(db_session):
    """Test AnalysisExecutor.save_proposals() - saves proposals and updates counts."""
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
        status=AnalysisRunStatus.running.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal data
    proposals = [
        {
            "proposed_title": "Task 1",
            "proposed_description": "Description 1",
            "source_message_ids": [1, 2],
            "message_count": 2,
            "time_span_seconds": 300,
            "llm_recommendation": "new_task",
            "confidence": 0.9,
            "reasoning": "Test reasoning",
        }
    ]

    # Mock WebSocket manager
    with patch("app.services.analysis_service.websocket_manager", AsyncMock()):
        # Save proposals
        executor = AnalysisExecutor(db_session)
        saved_count = await executor.save_proposals(run.id, proposals)

    # Verify
    assert saved_count == 1
    await db_session.refresh(run)
    assert run.proposals_total == 1
    assert run.proposals_pending == 1


@pytest.mark.asyncio
async def test_update_progress(db_session):
    """Test AnalysisExecutor.update_progress() - updates batches count."""
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
        status=AnalysisRunStatus.running.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Mock WebSocket manager
    with patch("app.services.analysis_service.websocket_manager", AsyncMock()):
        # Update progress
        executor = AnalysisExecutor(db_session)
        await executor.update_progress(run.id, current=3, total=10)

    # Verify
    await db_session.refresh(run)
    assert run.batches_created == 10


@pytest.mark.asyncio
async def test_complete_run(db_session):
    """Test AnalysisExecutor.complete_run() - marks run as completed."""
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
        status=AnalysisRunStatus.running.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Mock WebSocket manager
    with patch("app.services.analysis_service.websocket_manager", AsyncMock()):
        # Complete run
        executor = AnalysisExecutor(db_session)
        summary = await executor.complete_run(run.id)

    # Verify
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.completed.value
    assert run.completed_at is not None
    assert summary["status"] == AnalysisRunStatus.completed.value


@pytest.mark.asyncio
async def test_fail_run(db_session):
    """Test AnalysisExecutor.fail_run() - marks run as failed with error log."""
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
        status=AnalysisRunStatus.running.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Mock WebSocket manager
    with patch("app.services.analysis_service.websocket_manager", AsyncMock()):
        # Fail run
        executor = AnalysisExecutor(db_session)
        await executor.fail_run(run.id, "LLM connection timeout")

    # Verify
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.failed.value
    assert run.error_log is not None
    assert "timeout" in run.error_log["error"].lower()
