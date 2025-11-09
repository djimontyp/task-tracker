"""Integration tests for full analysis workflow.

Tests end-to-end workflows:
- Create run → execute → review proposals → close
- Lifecycle enforcement (cannot skip states)
- WebSocket event broadcasting (mocked)
- Complete approval/rejection workflow
"""

from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
from uuid import UUID

import pytest
from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    LLMProvider,
    LLMRecommendation,
    ProposalStatus,
    ProviderType,
    TaskConfig,
    User,
    ValidationStatus,
)


@pytest.mark.asyncio
async def test_full_analysis_workflow(client, db_session):
    """INTEGRATION TEST: Complete workflow from create to close.

    Workflow:
    1. Create project config
    2. Create analysis run (no unclosed runs)
    3. Create proposals (simulating LLM output)
    4. Review proposals (approve/reject)
    5. Close run (all proposals reviewed)
    """
    # Setup: Create all dependencies
    user = User(first_name="PM", email="pm@example.com")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    provider = LLMProvider(
        name="Ollama",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
        validation_status=ValidationStatus.pending,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)

    agent = AgentConfig(
        name="Task Analyzer",
        provider_id=provider.id,
        model_name="llama3",
        system_prompt="Analyze messages and extract tasks",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)

    task = TaskConfig(
        name="Task Extraction",
        description="Extract tasks from messages",
        instruction="Analyze and extract",
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

    # Mock WebSocket manager for all operations
    ws_mock = AsyncMock()

    # Step 1: Create project config
    with patch("app.api.v1.projects.websocket_manager", ws_mock):
        project_data = {
            "name": "Backend Project",
            "description": "Backend services",
            "keywords": ["backend", "api", "fastapi"],
            "glossary": {},
            "components": [],
            "default_assignee_ids": [user.id],
            "pm_user_id": user.id,
            "is_active": True,
            "priority_rules": {},
            "version": "1.0.0",
        }
        response = await client.post("/api/v1/projects", json=project_data)
        assert response.status_code == 201
        project_id = response.json()["id"]

    # Step 2: Create analysis run
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        run_data = {
            "time_window_start": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "time_window_end": datetime.utcnow().isoformat(),
            "agent_assignment_id": str(assignment.id),
            "project_config_id": project_id,
            "trigger_type": "manual",
            "triggered_by_user_id": user.id,
        }
        response = await client.post("/api/v1/analysis/runs", json=run_data)
        assert response.status_code == 201
        run_id = response.json()["id"]
        assert response.json()["status"] == AnalysisRunStatus.pending.value

    # Step 3: Simulate LLM creating proposals
    # (In real workflow, this would be done by TaskIQ job)
    from app.services import TaskProposalCRUD

    crud = TaskProposalCRUD(db_session)
    proposal_ids = []

    for i in range(5):
        proposal_data = {
            "analysis_run_id": run_id,
            "proposed_title": f"Task {i + 1}",
            "proposed_description": f"Description for task {i + 1}",
            "source_message_ids": [i * 10, i * 10 + 1, i * 10 + 2],
            "message_count": 3,
            "time_span_seconds": 1800,
            "llm_recommendation": LLMRecommendation.new_task.value,
            "confidence": 0.85 + (i * 0.02),
            "reasoning": f"Extracted from discussion about feature {i + 1}",
        }

        # Create proposal directly via service
        from app.models import TaskProposalCreate

        proposal = await crud.create(TaskProposalCreate(**proposal_data))
        proposal_ids.append(str(proposal.id))

    # Update run counts manually (would be done by executor)
    from app.models import AnalysisRunUpdate
    from app.services import AnalysisRunCRUD

    run_crud = AnalysisRunCRUD(db_session)
    await run_crud.update(
        UUID(run_id),
        AnalysisRunUpdate(
            status=AnalysisRunStatus.completed.value,
            completed_at=datetime.utcnow(),
            proposals_total=5,
            proposals_pending=5,
        ),
    )

    # Step 4: Review proposals
    with patch("app.api.v1.proposals.websocket_manager", ws_mock):
        # Approve 3 proposals
        for proposal_id in proposal_ids[:3]:
            response = await client.put(f"/api/v1/analysis/proposals/{proposal_id}/approve")
            assert response.status_code == 200
            assert response.json()["status"] == ProposalStatus.approved.value

        # Reject 2 proposals
        for proposal_id in proposal_ids[3:]:
            response = await client.put(
                f"/api/v1/analysis/proposals/{proposal_id}/reject", json={"reason": "Not relevant to current sprint"}
            )
            assert response.status_code == 200
            assert response.json()["status"] == ProposalStatus.rejected.value

    # Step 5: Verify run state after review
    response = await client.get(f"/api/v1/analysis/runs/{run_id}")
    assert response.status_code == 200
    run_data = response.json()
    assert run_data["proposals_total"] == 5
    assert run_data["proposals_pending"] == 0  # All reviewed!
    assert run_data["proposals_approved"] == 3
    assert run_data["proposals_rejected"] == 2

    # Step 6: Close run
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        response = await client.put(f"/api/v1/analysis/runs/{run_id}/close")
        assert response.status_code == 200
        closed_data = response.json()
        assert closed_data["status"] == AnalysisRunStatus.closed.value
        assert closed_data["closed_at"] is not None

        # Verify accuracy metrics
        metrics = closed_data["accuracy_metrics"]
        assert metrics["proposals_total"] == 5
        assert metrics["proposals_approved"] == 3
        assert metrics["proposals_rejected"] == 2
        assert metrics["approval_rate"] == 0.6
        assert metrics["rejection_rate"] == 0.4


@pytest.mark.asyncio
async def test_lifecycle_enforcement(client, db_session):
    """INTEGRATION TEST: Cannot skip lifecycle states.

    Tests:
    - Cannot create new run if unclosed run exists
    - Cannot close run with pending proposals
    """
    # Setup
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

    ws_mock = AsyncMock()

    # Create first run (unclosed)
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        run_data = {
            "time_window_start": (datetime.utcnow() - timedelta(days=2)).isoformat(),
            "time_window_end": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "agent_assignment_id": str(assignment.id),
            "trigger_type": "manual",
        }
        response = await client.post("/api/v1/analysis/runs", json=run_data)
        assert response.status_code == 201
        run1_id = response.json()["id"]

    # Try to create second run - should fail (409)
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        run_data2 = {
            "time_window_start": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "time_window_end": datetime.utcnow().isoformat(),
            "agent_assignment_id": str(assignment.id),
            "trigger_type": "manual",
        }
        response = await client.post("/api/v1/analysis/runs", json=run_data2)
        assert response.status_code == 409
        assert "unclosed" in response.json()["detail"].lower()

    # Update first run to have pending proposals
    from app.models import AnalysisRunUpdate
    from app.services import AnalysisRunCRUD

    run_crud = AnalysisRunCRUD(db_session)
    await run_crud.update(
        UUID(run1_id),
        AnalysisRunUpdate(
            status=AnalysisRunStatus.completed.value,
            proposals_total=3,
            proposals_pending=3,  # Still pending!
        ),
    )

    # Try to close run - should fail (400)
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        response = await client.put(f"/api/v1/analysis/runs/{run1_id}/close")
        assert response.status_code == 400
        assert "pending" in response.json()["detail"].lower()

    # Mark all proposals as reviewed
    await run_crud.update(
        UUID(run1_id),
        AnalysisRunUpdate(
            proposals_pending=0,
            proposals_approved=2,
            proposals_rejected=1,
        ),
    )

    # Now close should succeed
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        response = await client.put(f"/api/v1/analysis/runs/{run1_id}/close")
        assert response.status_code == 200
        assert response.json()["status"] == AnalysisRunStatus.closed.value


@pytest.mark.asyncio
async def test_websocket_events_broadcast(client, db_session):
    """INTEGRATION TEST: Verify WebSocket events are broadcast.

    Tests that WebSocket manager is called for:
    - Run created
    - Run closed
    - Proposal approved
    - Proposal rejected
    """
    # Setup
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

    ws_mock = AsyncMock()

    # Create run - verify broadcast called
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        run_data = {
            "time_window_start": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            "time_window_end": datetime.utcnow().isoformat(),
            "agent_assignment_id": str(assignment.id),
            "trigger_type": "manual",
        }
        response = await client.post("/api/v1/analysis/runs", json=run_data)
        assert response.status_code == 201
        run_id = response.json()["id"]

        # Verify WebSocket broadcast was called
        assert ws_mock.broadcast.called
        call_args = ws_mock.broadcast.call_args
        assert call_args[0][0] == "analysis"  # topic
        assert call_args[0][1]["event"] == "run_created"

    # Create proposal
    from app.models import TaskProposalCreate
    from app.services import TaskProposalCRUD

    crud = TaskProposalCRUD(db_session)
    proposal_data = TaskProposalCreate(
        analysis_run_id=run_id,
        proposed_title="Test Task",
        proposed_description="Test description",
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.9,
        reasoning="Test reasoning",
    )
    proposal = await crud.create(proposal_data)

    # Update run
    from app.models import AnalysisRunUpdate
    from app.services import AnalysisRunCRUD

    run_crud = AnalysisRunCRUD(db_session)
    await run_crud.update(
        UUID(run_id),
        AnalysisRunUpdate(
            status=AnalysisRunStatus.completed.value,
            proposals_total=1,
            proposals_pending=1,
        ),
    )

    ws_mock.reset_mock()

    # Approve proposal - verify broadcast
    with patch("app.api.v1.proposals.websocket_manager", ws_mock):
        response = await client.put(f"/api/v1/analysis/proposals/{proposal.id}/approve")
        assert response.status_code == 200

        # Verify broadcast called
        assert ws_mock.broadcast.called
        call_args = ws_mock.broadcast.call_args
        assert call_args[0][0] == "proposals"
        assert call_args[0][1]["event"] == "approved"

    ws_mock.reset_mock()

    # Close run - verify broadcast
    with patch("app.api.v1.analysis_runs.websocket_manager", ws_mock):
        response = await client.put(f"/api/v1/analysis/runs/{run_id}/close")
        assert response.status_code == 200

        # Verify broadcast called
        assert ws_mock.broadcast.called
        call_args = ws_mock.broadcast.call_args
        assert call_args[0][0] == "analysis"
        assert call_args[0][1]["event"] == "run_closed"


@pytest.mark.asyncio
async def test_proposal_edit_before_review(client, db_session):
    """INTEGRATION TEST: PM can edit proposal before approval.

    Tests:
    - Edit pending proposal
    - Approve edited proposal
    - Verify changes persisted
    """
    # Setup
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
        status=AnalysisRunStatus.completed.value,
        proposals_total=1,
        proposals_pending=1,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)

    # Create proposal
    from app.models import TaskProposalCreate
    from app.services import TaskProposalCRUD

    crud = TaskProposalCRUD(db_session)
    proposal_data = TaskProposalCreate(
        analysis_run_id=run.id,
        proposed_title="Original Title",
        proposed_description="Original description",
        proposed_priority="medium",
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.85,
        reasoning="Original reasoning",
    )
    proposal = await crud.create(proposal_data)

    ws_mock = AsyncMock()

    # Edit proposal
    with patch("app.api.v1.proposals.websocket_manager", ws_mock):
        edit_data = {
            "proposed_title": "Improved Title",
            "proposed_description": "Improved description with more details",
            "proposed_priority": "high",
        }
        response = await client.put(f"/api/v1/analysis/proposals/{proposal.id}", json=edit_data)
        assert response.status_code == 200
        assert response.json()["proposed_title"] == "Improved Title"
        assert response.json()["proposed_priority"] == "high"

    # Approve edited proposal
    with patch("app.api.v1.proposals.websocket_manager", ws_mock):
        response = await client.put(f"/api/v1/analysis/proposals/{proposal.id}/approve")
        assert response.status_code == 200
        approved_data = response.json()
        assert approved_data["status"] == ProposalStatus.approved.value
        assert approved_data["proposed_title"] == "Improved Title"
        assert approved_data["proposed_description"] == "Improved description with more details"
