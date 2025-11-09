"""Tests for stats API endpoints."""

from datetime import datetime
from uuid import UUID

import pytest
from app.models import AnalysisRun, TaskProposal
from app.models.agent_config import AgentConfig
from app.models.agent_task_assignment import AgentTaskAssignment
from app.models.enums import AnalysisRunStatus, ProposalStatus, ProviderType
from app.models.llm_provider import LLMProvider
from app.models.task_config import TaskConfig
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_sidebar_counts_empty(client: AsyncClient):
    """Test sidebar counts with no data."""
    response = await client.get("/api/v1/sidebar-counts")
    assert response.status_code == 200

    data = response.json()
    assert "unclosed_runs" in data
    assert "pending_proposals" in data
    assert data["unclosed_runs"] == 0
    assert data["pending_proposals"] == 0


@pytest.mark.asyncio
async def test_sidebar_counts_with_data(client: AsyncClient, db_session):
    """Test sidebar counts with unclosed runs and pending proposals."""
    # Create FK dependencies: provider -> agent, task -> assignment
    test_assignment_id = UUID("123e4567-e89b-12d3-a456-426614174000")

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
    )
    db_session.add(provider)
    await db_session.flush()

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="llama3.2:latest",
        system_prompt="Test prompt",
    )
    db_session.add(agent)
    await db_session.flush()

    task = TaskConfig(
        name="Test Task",
        agent_task_name="test_task",
        schedule_expression="0 0 * * *",
    )
    db_session.add(task)
    await db_session.flush()

    assignment = AgentTaskAssignment(
        id=test_assignment_id,
        agent_id=agent.id,
        task_id=task.id,
    )
    db_session.add(assignment)
    await db_session.flush()

    # Create analysis runs with different statuses
    run_pending = AnalysisRun(
        time_window_start=datetime(2025, 10, 11, 0, 0, 0),
        time_window_end=datetime(2025, 10, 11, 23, 59, 59),
        agent_assignment_id=test_assignment_id,
        config_snapshot={},
        status=AnalysisRunStatus.pending.value,
        trigger_type="manual",
    )
    run_running = AnalysisRun(
        time_window_start=datetime(2025, 10, 10, 0, 0, 0),
        time_window_end=datetime(2025, 10, 10, 23, 59, 59),
        agent_assignment_id=test_assignment_id,
        config_snapshot={},
        status=AnalysisRunStatus.running.value,
        trigger_type="manual",
    )
    run_closed = AnalysisRun(
        time_window_start=datetime(2025, 10, 9, 0, 0, 0),
        time_window_end=datetime(2025, 10, 9, 23, 59, 59),
        agent_assignment_id=test_assignment_id,
        config_snapshot={},
        status=AnalysisRunStatus.closed.value,
        trigger_type="manual",
    )

    db_session.add_all([run_pending, run_running, run_closed])
    await db_session.commit()

    # Create proposals with different statuses
    proposal_pending1 = TaskProposal(
        analysis_run_id=run_pending.id,
        proposed_title="Task 1",
        proposed_description="Description 1",
        proposed_priority="medium",
        proposed_category="feature",
        source_message_ids=[1, 2],
        message_count=2,
        time_span_seconds=300,
        llm_recommendation="new_task",
        confidence=0.9,
        reasoning="Good task",
        status=ProposalStatus.pending.value,
    )
    proposal_pending2 = TaskProposal(
        analysis_run_id=run_running.id,
        proposed_title="Task 2",
        proposed_description="Description 2",
        proposed_priority="high",
        proposed_category="bug",
        source_message_ids=[3, 4],
        message_count=2,
        time_span_seconds=600,
        llm_recommendation="new_task",
        confidence=0.95,
        reasoning="Critical bug",
        status=ProposalStatus.pending.value,
    )
    proposal_approved = TaskProposal(
        analysis_run_id=run_closed.id,
        proposed_title="Task 3",
        proposed_description="Description 3",
        proposed_priority="low",
        proposed_category="improvement",
        source_message_ids=[5, 6],
        message_count=2,
        time_span_seconds=200,
        llm_recommendation="new_task",
        confidence=0.8,
        reasoning="Nice improvement",
        status=ProposalStatus.approved.value,
    )

    db_session.add_all([proposal_pending1, proposal_pending2, proposal_approved])
    await db_session.commit()

    # Test endpoint
    response = await client.get("/api/v1/sidebar-counts")
    assert response.status_code == 200

    data = response.json()
    assert data["unclosed_runs"] == 2  # pending + running (closed not counted)
    assert data["pending_proposals"] == 2  # only pending proposals


@pytest.mark.asyncio
async def test_sidebar_counts_only_closed_runs(client: AsyncClient, db_session):
    """Test that closed runs are not counted."""
    # Create FK dependencies: provider -> agent, task -> assignment
    test_assignment_id = UUID("123e4567-e89b-12d3-a456-426614174000")

    provider = LLMProvider(
        name="Test Provider",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
    )
    db_session.add(provider)
    await db_session.flush()

    agent = AgentConfig(
        name="Test Agent",
        provider_id=provider.id,
        model_name="llama3.2:latest",
        system_prompt="Test prompt",
    )
    db_session.add(agent)
    await db_session.flush()

    task = TaskConfig(
        name="Test Task",
        agent_task_name="test_task",
        schedule_expression="0 0 * * *",
    )
    db_session.add(task)
    await db_session.flush()

    assignment = AgentTaskAssignment(
        id=test_assignment_id,
        agent_id=agent.id,
        task_id=task.id,
    )
    db_session.add(assignment)
    await db_session.flush()

    run_closed = AnalysisRun(
        time_window_start=datetime(2025, 10, 11, 0, 0, 0),
        time_window_end=datetime(2025, 10, 11, 23, 59, 59),
        agent_assignment_id=test_assignment_id,
        config_snapshot={},
        status=AnalysisRunStatus.closed.value,
        trigger_type="manual",
    )
    db_session.add(run_closed)
    await db_session.commit()

    response = await client.get("/api/v1/sidebar-counts")
    assert response.status_code == 200

    data = response.json()
    assert data["unclosed_runs"] == 0
    assert data["pending_proposals"] == 0
