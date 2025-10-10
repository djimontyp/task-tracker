"""API tests for TaskProposal endpoints.

Tests critical functionality:
- Approve/reject decrements proposals_pending
- List with filters
- Edit proposals
- Merge with existing tasks
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.models import (
    AnalysisRun,
    AnalysisRunStatus,
    AgentTaskAssignment,
    AgentConfig,
    TaskConfig,
    LLMProvider,
    User,
    TaskProposal,
    ProposalStatus,
    LLMRecommendation,
    TaskPriority,
    TaskCategory,
)


@pytest.mark.asyncio
async def test_list_proposals(client, db_session):
    """Test GET /api/proposals - list proposals with pagination."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposals
    for i in range(5):
        proposal = TaskProposal(
            analysis_run_id=run.id,
            proposed_title=f"Task {i}",
            proposed_description=f"Description {i}",
            source_message_ids=[i],
            message_count=1,
            time_span_seconds=60,
            llm_recommendation=LLMRecommendation.new_task.value,
            confidence=0.8 + (i * 0.02),
            reasoning=f"Reasoning {i}",
            status=ProposalStatus.pending.value,
        )
        db_session.add(proposal)
    await db_session.commit()

    # Test list
    response = await client.get("/api/proposals")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5


@pytest.mark.asyncio
async def test_filter_by_run_id(client, db_session):
    """Test filtering proposals by analysis run ID."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    # Create two runs
    run1 = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=2),
        time_window_end=datetime.utcnow() - timedelta(days=1),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data1"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
    )
    run2 = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data2"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
    )
    db_session.add(run1)
    db_session.add(run2)
    await db_session.commit()
    await db_session.refresh(run1)
    await db_session.refresh(run2)

    # Create proposals for run1
    for i in range(3):
        proposal = TaskProposal(
            analysis_run_id=run1.id,
            proposed_title=f"Run1 Task {i}",
            proposed_description=f"Description {i}",
            source_message_ids=[i],
            message_count=1,
            time_span_seconds=60,
            llm_recommendation=LLMRecommendation.new_task.value,
            confidence=0.85,
            reasoning=f"Reasoning {i}",
            status=ProposalStatus.pending.value,
        )
        db_session.add(proposal)

    # Create proposals for run2
    for i in range(2):
        proposal = TaskProposal(
            analysis_run_id=run2.id,
            proposed_title=f"Run2 Task {i}",
            proposed_description=f"Description {i}",
            source_message_ids=[i + 10],
            message_count=1,
            time_span_seconds=60,
            llm_recommendation=LLMRecommendation.new_task.value,
            confidence=0.90,
            reasoning=f"Reasoning {i}",
            status=ProposalStatus.pending.value,
        )
        db_session.add(proposal)
    await db_session.commit()

    # Filter by run1
    response = await client.get(f"/api/proposals?run_id={run1.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    for item in data:
        assert item["analysis_run_id"] == str(run1.id)


@pytest.mark.asyncio
async def test_get_proposal_with_details(client, db_session):
    """Test GET /api/proposals/{id} - get proposal with details."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal
    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Add authentication",
        proposed_description="Implement OAuth2 authentication",
        source_message_ids=[1, 2, 3],
        message_count=3,
        time_span_seconds=3600,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.95,
        reasoning="Users discussed authentication needs",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    # Get proposal
    response = await client.get(f"/api/proposals/{proposal.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(proposal.id)
    assert data["proposed_title"] == "Add authentication"
    assert data["source_message_ids"] == [1, 2, 3]
    assert data["confidence"] == 0.95


@pytest.mark.asyncio
async def test_approve_proposal(client, db_session):
    """CRITICAL TEST: Approve proposal decrements proposals_pending."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
        proposals_total=5,
        proposals_pending=5,
        proposals_approved=0,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal
    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Test proposal",
        proposed_description="Test description",
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.90,
        reasoning="Test reasoning",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    # Mock WebSocket manager
    with patch("app.api.v1.proposals.websocket_manager", AsyncMock()):
        # Approve proposal
        response = await client.put(f"/api/proposals/{proposal.id}/approve")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ProposalStatus.approved.value
        assert data["review_action"] == "approve"

    # Verify run counters updated
    await db_session.refresh(run)
    assert run.proposals_pending == 4  # Decremented!
    assert run.proposals_approved == 1  # Incremented!


@pytest.mark.asyncio
async def test_reject_proposal(client, db_session):
    """CRITICAL TEST: Reject proposal decrements proposals_pending."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
        proposals_total=5,
        proposals_pending=5,
        proposals_rejected=0,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal
    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Test proposal",
        proposed_description="Test description",
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.90,
        reasoning="Test reasoning",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    # Mock WebSocket manager
    with patch("app.api.v1.proposals.websocket_manager", AsyncMock()):
        # Reject proposal
        response = await client.put(
            f"/api/proposals/{proposal.id}/reject",
            json={"reason": "Not relevant to project goals"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ProposalStatus.rejected.value
        assert data["review_action"] == "reject"
        assert data["review_notes"] == "Not relevant to project goals"

    # Verify run counters updated
    await db_session.refresh(run)
    assert run.proposals_pending == 4  # Decremented!
    assert run.proposals_rejected == 1  # Incremented!


@pytest.mark.asyncio
async def test_merge_proposal(client, db_session):
    """Test merging proposal with existing task."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
        proposals_total=3,
        proposals_pending=3,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal
    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Similar task",
        proposed_description="Task similar to existing",
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.merge.value,
        confidence=0.92,
        reasoning="Similar to existing task",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    target_task_id = uuid4()

    # Mock WebSocket manager
    with patch("app.api.v1.proposals.websocket_manager", AsyncMock()):
        # Merge proposal
        response = await client.put(
            f"/api/proposals/{proposal.id}/merge",
            json={"target_task_id": str(target_task_id)}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == ProposalStatus.merged.value
        assert data["review_action"] == "merge"
        assert str(target_task_id) in data["review_notes"]

    # Verify run counter updated
    await db_session.refresh(run)
    assert run.proposals_pending == 2  # Decremented!


@pytest.mark.asyncio
async def test_edit_proposal(client, db_session):
    """Test editing pending proposal."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal
    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Original title",
        proposed_description="Original description",
        proposed_priority=TaskPriority.medium.value,
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.85,
        reasoning="Original reasoning",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    # Mock WebSocket manager
    with patch("app.api.v1.proposals.websocket_manager", AsyncMock()):
        # Edit proposal
        response = await client.put(
            f"/api/proposals/{proposal.id}",
            json={
                "proposed_title": "Updated title",
                "proposed_description": "Updated description",
                "proposed_priority": TaskPriority.high.value,
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["proposed_title"] == "Updated title"
        assert data["proposed_description"] == "Updated description"
        assert data["proposed_priority"] == TaskPriority.high.value


@pytest.mark.asyncio
async def test_filter_by_confidence(client, db_session):
    """Test filtering proposals by confidence range."""
    # Create dependencies
    user = User(first_name="Test", email="test@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Test Provider",
        provider_type="ollama",
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

    run = AnalysisRun(
        time_window_start=datetime.utcnow() - timedelta(days=1),
        time_window_end=datetime.utcnow(),
        agent_assignment_id=assignment.id,
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.completed.value,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposals with different confidence levels
    confidences = [0.70, 0.80, 0.85, 0.90, 0.95]
    for i, conf in enumerate(confidences):
        proposal = TaskProposal(
            analysis_run_id=run.id,
            proposed_title=f"Task {i}",
            proposed_description=f"Description {i}",
            source_message_ids=[i],
            message_count=1,
            time_span_seconds=60,
            llm_recommendation=LLMRecommendation.new_task.value,
            confidence=conf,
            reasoning=f"Reasoning {i}",
            status=ProposalStatus.pending.value,
        )
        db_session.add(proposal)
    await db_session.commit()

    # Filter by minimum confidence
    response = await client.get("/api/proposals?confidence_min=0.85")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3  # 0.85, 0.90, 0.95
    for item in data:
        assert item["confidence"] >= 0.85


@pytest.mark.asyncio
async def test_proposal_not_found(client, db_session):
    """Test GET /api/proposals/{id} with non-existent ID."""
    random_id = uuid4()
    response = await client.get(f"/api/proposals/{random_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
