"""Tests for TaskProposal model."""
import pytest
from datetime import datetime
from uuid import uuid4

from sqlmodel import select

from app.models import (
    TaskProposal,
    ProposalStatus,
    LLMRecommendation,
    SimilarityType,
    TaskPriority,
    TaskCategory,
    AnalysisRun,
    AnalysisRunStatus,
    AgentTaskAssignment,
    AgentConfig,
    TaskConfig,
    LLMProvider,
    User,
)


@pytest.mark.asyncio
async def test_create_proposal(db_session):
    """Test creating task proposal with required fields."""
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

    # Create proposal
    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Add user authentication",
        proposed_description="Implement OAuth2 authentication for users",
        proposed_priority=TaskPriority.high.value,
        proposed_category=TaskCategory.feature.value,
        source_message_ids=[1, 2, 3],
        message_count=3,
        time_span_seconds=3600,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.95,
        reasoning="Users discussed authentication needs in chat",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    # Assertions
    assert proposal.id is not None
    assert proposal.analysis_run_id == run.id
    assert proposal.proposed_title == "Add user authentication"
    assert proposal.proposed_priority == TaskPriority.high.value
    assert proposal.proposed_category == TaskCategory.feature.value
    assert proposal.source_message_ids == [1, 2, 3]
    assert proposal.message_count == 3
    assert proposal.confidence == 0.95
    assert proposal.status == ProposalStatus.pending.value
    assert proposal.created_at is not None


@pytest.mark.asyncio
async def test_source_message_ids_jsonb(db_session):
    """Test source_message_ids as JSONB list[int]."""
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

    # Test with large list of message IDs
    message_ids = list(range(1, 101))  # 100 message IDs

    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Complex task from many messages",
        proposed_description="Task derived from extensive discussion",
        source_message_ids=message_ids,
        message_count=len(message_ids),
        time_span_seconds=86400,  # 24 hours
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.88,
        reasoning="Long discussion with multiple participants",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    assert proposal.source_message_ids == message_ids
    assert len(proposal.source_message_ids) == 100
    assert proposal.message_count == 100


@pytest.mark.asyncio
async def test_duplicate_detection_fields(db_session):
    """Test similar_task_id, similarity_score, diff_summary fields."""
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

    # Create proposal with duplicate detection info
    similar_task_id = uuid4()
    diff_summary = {
        "title_diff": "Minor wording changes",
        "description_diff": "Added mention of OAuth2 provider",
        "priority_changed": False,
        "category_same": True,
    }

    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Add user authentication",
        proposed_description="Implement OAuth2 authentication",
        source_message_ids=[1, 2, 3],
        message_count=3,
        time_span_seconds=3600,
        similar_task_id=similar_task_id,
        similarity_score=0.87,
        similarity_type=SimilarityType.semantic.value,
        diff_summary=diff_summary,
        llm_recommendation=LLMRecommendation.update_existing.value,
        confidence=0.92,
        reasoning="Very similar to existing task but with OAuth2 specifics",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    assert proposal.similar_task_id == similar_task_id
    assert proposal.similarity_score == 0.87
    assert proposal.similarity_type == SimilarityType.semantic.value
    assert proposal.diff_summary == diff_summary
    assert proposal.llm_recommendation == LLMRecommendation.update_existing.value


@pytest.mark.asyncio
async def test_proposed_tags_jsonb(db_session):
    """Test proposed_tags as JSONB list."""
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

    tags = ["authentication", "oauth2", "security", "backend", "api"]

    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Add OAuth2",
        proposed_description="Implement OAuth2",
        proposed_tags=tags,
        source_message_ids=[1, 2],
        message_count=2,
        time_span_seconds=1800,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.90,
        reasoning="Clear authentication requirement",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    assert proposal.proposed_tags == tags
    assert len(proposal.proposed_tags) == 5
    assert "security" in proposal.proposed_tags


@pytest.mark.asyncio
async def test_proposed_sub_tasks_jsonb(db_session):
    """Test proposed_sub_tasks as JSONB list of dicts."""
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

    sub_tasks = [
        {"title": "Set up OAuth2 provider", "priority": "high"},
        {"title": "Create user authentication endpoints", "priority": "high"},
        {"title": "Add JWT token handling", "priority": "medium"},
        {"title": "Write authentication tests", "priority": "medium"},
    ]

    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Implement OAuth2 authentication",
        proposed_description="Full OAuth2 implementation",
        proposed_sub_tasks=sub_tasks,
        source_message_ids=[1, 2, 3, 4],
        message_count=4,
        time_span_seconds=7200,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.93,
        reasoning="Complex task with clear sub-components",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    assert proposal.proposed_sub_tasks == sub_tasks
    assert len(proposal.proposed_sub_tasks) == 4
    assert proposal.proposed_sub_tasks[0]["title"] == "Set up OAuth2 provider"


@pytest.mark.asyncio
async def test_project_classification_fields(db_session):
    """Test project classification confidence and keywords."""
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

    matched_keywords = ["backend", "api", "authentication"]

    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Add API authentication",
        proposed_description="Implement API auth",
        source_message_ids=[1, 2],
        message_count=2,
        time_span_seconds=1800,
        project_classification_confidence=0.89,
        project_keywords_matched=matched_keywords,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.91,
        reasoning="Backend API task",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    assert proposal.project_classification_confidence == 0.89
    assert proposal.project_keywords_matched == matched_keywords
    assert len(proposal.project_keywords_matched) == 3


@pytest.mark.asyncio
async def test_review_workflow(db_session):
    """Test proposal review status and fields."""
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

    proposal = TaskProposal(
        analysis_run_id=run.id,
        proposed_title="Test task",
        proposed_description="Test description",
        source_message_ids=[1],
        message_count=1,
        time_span_seconds=60,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.85,
        reasoning="Test",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)

    # Initial state
    assert proposal.status == ProposalStatus.pending.value
    assert proposal.reviewed_by_user_id is None
    assert proposal.reviewed_at is None

    # Approve proposal
    proposal.status = ProposalStatus.approved.value
    proposal.review_action = "approve"
    proposal.reviewed_by_user_id = user.id
    proposal.reviewed_at = datetime.utcnow()
    proposal.review_notes = "Good task, approved"
    await db_session.commit()
    await db_session.refresh(proposal)

    assert proposal.status == ProposalStatus.approved.value
    assert proposal.review_action == "approve"
    assert proposal.reviewed_by_user_id == user.id
    assert proposal.reviewed_at is not None
    assert proposal.review_notes == "Good task, approved"
