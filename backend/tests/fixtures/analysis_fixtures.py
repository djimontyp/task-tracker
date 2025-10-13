"""
Shared pytest fixtures for Phase 1 Analysis System.

Provides reusable fixtures for:
- Users (PM, Developer)
- LLM Providers (Ollama, OpenAI)
- Agent Configs
- Task Configs
- Agent-Task Assignments
- Project Configs
- Analysis Runs (various states)
- Task Proposals (various statuses)
- Message Ingestion Jobs
"""

from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AgentConfig,
    AgentTaskAssignment,
    AnalysisRun,
    AnalysisRunStatus,
    IngestionStatus,
    LLMProvider,
    LLMRecommendation,
    MessageIngestionJob,
    ProjectConfig,
    ProposalStatus,
    ProviderType,
    TaskConfig,
    TaskProposal,
    User,
    ValidationStatus,
)
from app.services.credential_encryption import CredentialEncryption


@pytest.fixture
async def pm_user(db_session: AsyncSession) -> User:
    """Create a Project Manager user for testing."""
    user = User(
        first_name="Test",
        last_name="PM",
        email="pm_test@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def developer_user(db_session: AsyncSession) -> User:
    """Create a Developer user for testing."""
    user = User(
        first_name="Test",
        last_name="Developer",
        email="dev_test@tasktracker.test",
        is_active=True,
        is_bot=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def encryptor() -> CredentialEncryption:
    """Provide credential encryption service."""
    return CredentialEncryption()


@pytest.fixture
async def ollama_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create an Ollama LLM provider (local, no API key)."""
    provider = LLMProvider(
        id=uuid4(),
        name="Test Ollama Local",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        api_key_encrypted=None,
        is_active=True,
        validation_status=ValidationStatus.connected,
        validated_at=datetime.now(UTC),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def openai_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create an OpenAI LLM provider."""
    provider = LLMProvider(
        id=uuid4(),
        name="Test OpenAI",
        type=ProviderType.openai,
        base_url="https://api.openai.com/v1",
        api_key_encrypted=encryptor.encrypt("sk-test-key-fixture"),
        is_active=True,
        validation_status=ValidationStatus.connected,
        validated_at=datetime.now(UTC),
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def pending_provider(db_session: AsyncSession, encryptor: CredentialEncryption) -> LLMProvider:
    """Create a provider with pending validation status."""
    provider = LLMProvider(
        id=uuid4(),
        name="Test Pending Provider",
        type=ProviderType.openai,
        base_url="https://api.example.com/v1",
        api_key_encrypted=encryptor.encrypt("sk-test-pending"),
        is_active=True,
        validation_status=ValidationStatus.pending,
        validated_at=None,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def task_classifier_agent(db_session: AsyncSession, ollama_provider: LLMProvider) -> AgentConfig:
    """Create a Task Classifier agent."""
    agent = AgentConfig(
        id=uuid4(),
        name="Test Task Classifier",
        description="Classifies messages into task categories",
        provider_id=ollama_provider.id,
        model_name="llama3.2",
        system_prompt="You are a task classification expert.",
        temperature=0.7,
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def proposal_generator_agent(db_session: AsyncSession, openai_provider: LLMProvider) -> AgentConfig:
    """Create a Task Proposal Generator agent."""
    agent = AgentConfig(
        id=uuid4(),
        name="Test Proposal Generator",
        description="Generates structured task proposals",
        provider_id=openai_provider.id,
        model_name="gpt-4",
        system_prompt="You are a product management assistant.",
        temperature=0.7,
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def classification_task(db_session: AsyncSession) -> TaskConfig:
    """Create a Message Classification task config."""
    task = TaskConfig(
        id=uuid4(),
        name="Test Classification Task",
        description="Classify messages into categories",
        response_schema={
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "category": {"type": "string", "enum": ["bug", "feature", "task"]},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["category", "confidence"],
        },
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def proposal_generation_task(db_session: AsyncSession) -> TaskConfig:
    """Create a Task Proposal Generation task config."""
    task = TaskConfig(
        id=uuid4(),
        name="Test Proposal Generation",
        description="Generate task proposals from messages",
        response_schema={
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"},
                "category": {"type": "string"},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "required": ["title", "description", "category", "confidence"],
        },
        is_active=True,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def agent_task_assignment(
    db_session: AsyncSession,
    task_classifier_agent: AgentConfig,
    classification_task: TaskConfig,
) -> AgentTaskAssignment:
    """Create an agent-task assignment."""
    assignment = AgentTaskAssignment(
        id=uuid4(),
        agent_id=task_classifier_agent.id,
        task_id=classification_task.id,
        is_active=True,
    )
    db_session.add(assignment)
    await db_session.commit()
    await db_session.refresh(assignment)
    return assignment


@pytest.fixture
async def backend_project(db_session: AsyncSession, pm_user: User) -> ProjectConfig:
    """Create a Backend Project configuration."""
    project = ProjectConfig(
        id=uuid4(),
        name="Test Backend Project",
        description="FastAPI backend testing project",
        keywords=["backend", "api", "fastapi", "worker"],
        glossary={"TaskIQ": "Async task queue framework"},
        components=[
            {"name": "API", "keywords": ["endpoint", "route"]},
            {"name": "Worker", "keywords": ["task", "job"]},
        ],
        default_assignee_ids=[pm_user.id],
        pm_user_id=pm_user.id,
        is_active=True,
        priority_rules={"critical_keywords": ["crash", "security"]},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest.fixture
async def frontend_project(db_session: AsyncSession, pm_user: User) -> ProjectConfig:
    """Create a Frontend Project configuration."""
    project = ProjectConfig(
        id=uuid4(),
        name="Test Frontend Project",
        description="React dashboard testing project",
        keywords=["frontend", "react", "dashboard", "ui"],
        glossary={"React": "UI library"},
        components=[{"name": "Components", "keywords": ["component", "ui"]}],
        default_assignee_ids=[pm_user.id],
        pm_user_id=pm_user.id,
        is_active=True,
        priority_rules={"high_keywords": ["bug", "broken"]},
        version="1.0.0",
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest.fixture
async def pending_analysis_run(
    db_session: AsyncSession,
    agent_task_assignment: AgentTaskAssignment,
    backend_project: ProjectConfig,
    pm_user: User,
) -> AnalysisRun:
    """Create a pending analysis run."""
    now = datetime.now(UTC)
    run = AnalysisRun(
        id=uuid4(),
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        agent_assignment_id=agent_task_assignment.id,
        project_config_id=backend_project.id,
        config_snapshot={"agent": "test", "task": "test"},
        trigger_type="manual",
        triggered_by_user_id=pm_user.id,
        status=AnalysisRunStatus.pending.value,
        created_at=now,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.fixture
async def running_analysis_run(
    db_session: AsyncSession,
    agent_task_assignment: AgentTaskAssignment,
    backend_project: ProjectConfig,
    pm_user: User,
) -> AnalysisRun:
    """Create a running analysis run."""
    now = datetime.now(UTC)
    run = AnalysisRun(
        id=uuid4(),
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        agent_assignment_id=agent_task_assignment.id,
        project_config_id=backend_project.id,
        config_snapshot={"agent": "test", "task": "test"},
        trigger_type="manual",
        triggered_by_user_id=pm_user.id,
        status=AnalysisRunStatus.running.value,
        created_at=now - timedelta(minutes=10),
        started_at=now - timedelta(minutes=9),
        total_messages_in_window=150,
        messages_after_prefilter=80,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.fixture
async def completed_analysis_run(
    db_session: AsyncSession,
    agent_task_assignment: AgentTaskAssignment,
    backend_project: ProjectConfig,
    pm_user: User,
) -> AnalysisRun:
    """Create a completed analysis run with proposals."""
    now = datetime.now(UTC)
    run = AnalysisRun(
        id=uuid4(),
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        agent_assignment_id=agent_task_assignment.id,
        project_config_id=backend_project.id,
        config_snapshot={"agent": "test", "task": "test"},
        trigger_type="manual",
        triggered_by_user_id=pm_user.id,
        status=AnalysisRunStatus.completed.value,
        created_at=now - timedelta(hours=1),
        started_at=now - timedelta(minutes=50),
        completed_at=now - timedelta(minutes=30),
        proposals_total=5,
        proposals_pending=5,
        total_messages_in_window=150,
        messages_after_prefilter=80,
        batches_created=8,
        llm_tokens_used=15000,
        cost_estimate=2.5,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.fixture
async def closed_analysis_run(
    db_session: AsyncSession,
    agent_task_assignment: AgentTaskAssignment,
    backend_project: ProjectConfig,
    pm_user: User,
) -> AnalysisRun:
    """Create a closed analysis run."""
    now = datetime.now(UTC)
    run = AnalysisRun(
        id=uuid4(),
        time_window_start=now - timedelta(days=2),
        time_window_end=now - timedelta(days=1),
        agent_assignment_id=agent_task_assignment.id,
        project_config_id=backend_project.id,
        config_snapshot={"agent": "test", "task": "test"},
        trigger_type="manual",
        triggered_by_user_id=pm_user.id,
        status=AnalysisRunStatus.closed.value,
        created_at=now - timedelta(days=1, hours=2),
        started_at=now - timedelta(days=1, hours=1),
        completed_at=now - timedelta(days=1),
        closed_at=now - timedelta(hours=12),
        proposals_total=5,
        proposals_approved=3,
        proposals_rejected=2,
        proposals_pending=0,
        total_messages_in_window=150,
        messages_after_prefilter=80,
        batches_created=8,
        llm_tokens_used=15000,
        cost_estimate=2.5,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.fixture
async def failed_analysis_run(
    db_session: AsyncSession,
    agent_task_assignment: AgentTaskAssignment,
    backend_project: ProjectConfig,
    pm_user: User,
) -> AnalysisRun:
    """Create a failed analysis run."""
    now = datetime.now(UTC)
    run = AnalysisRun(
        id=uuid4(),
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        agent_assignment_id=agent_task_assignment.id,
        project_config_id=backend_project.id,
        config_snapshot={"agent": "test", "task": "test"},
        trigger_type="manual",
        triggered_by_user_id=pm_user.id,
        status=AnalysisRunStatus.failed.value,
        created_at=now - timedelta(hours=1),
        started_at=now - timedelta(minutes=50),
        error_log={"error": "LLM API timeout", "details": "Connection timeout after 30s"},
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.fixture
async def pending_task_proposal(
    db_session: AsyncSession,
    completed_analysis_run: AnalysisRun,
    backend_project: ProjectConfig,
) -> TaskProposal:
    """Create a pending task proposal."""
    proposal = TaskProposal(
        id=uuid4(),
        analysis_run_id=completed_analysis_run.id,
        proposed_title="Fix authentication timeout",
        proposed_description="Users experiencing session timeouts. Implement JWT refresh token.",
        proposed_priority="high",
        proposed_category="bug",
        proposed_project_id=backend_project.id,
        proposed_tags=["backend", "auth", "security"],
        source_message_ids=[1, 2, 3],
        message_count=3,
        time_span_seconds=1800,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.92,
        reasoning="Multiple user reports indicate production impact. High confidence classification.",
        status=ProposalStatus.pending.value,
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)
    return proposal


@pytest.fixture
async def approved_task_proposal(
    db_session: AsyncSession,
    closed_analysis_run: AnalysisRun,
    backend_project: ProjectConfig,
    pm_user: User,
) -> TaskProposal:
    """Create an approved task proposal."""
    now = datetime.now(UTC)
    proposal = TaskProposal(
        id=uuid4(),
        analysis_run_id=closed_analysis_run.id,
        proposed_title="Implement dark mode",
        proposed_description="Add theme switcher with dark/light modes. Persist in localStorage.",
        proposed_priority="medium",
        proposed_category="feature",
        proposed_project_id=backend_project.id,
        proposed_tags=["frontend", "ui", "ux"],
        source_message_ids=[4, 5, 6, 7],
        message_count=4,
        time_span_seconds=3600,
        llm_recommendation=LLMRecommendation.new_task.value,
        confidence=0.88,
        reasoning="User-requested feature with clear requirements.",
        status=ProposalStatus.approved.value,
        reviewed_by_user_id=pm_user.id,
        reviewed_at=now - timedelta(hours=6),
        review_action="approve",
        review_notes="Approved for next sprint",
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)
    return proposal


@pytest.fixture
async def rejected_task_proposal(
    db_session: AsyncSession,
    closed_analysis_run: AnalysisRun,
    backend_project: ProjectConfig,
    pm_user: User,
) -> TaskProposal:
    """Create a rejected task proposal."""
    now = datetime.now(UTC)
    proposal = TaskProposal(
        id=uuid4(),
        analysis_run_id=closed_analysis_run.id,
        proposed_title="Rewrite entire backend in Rust",
        proposed_description="Proposal to rewrite backend for performance.",
        proposed_priority="low",
        proposed_category="task",
        proposed_project_id=backend_project.id,
        proposed_tags=["backend", "refactoring"],
        source_message_ids=[8],
        message_count=1,
        time_span_seconds=0,
        llm_recommendation=LLMRecommendation.reject.value,
        confidence=0.45,
        reasoning="Low confidence. Single message without clear justification.",
        status=ProposalStatus.rejected.value,
        reviewed_by_user_id=pm_user.id,
        reviewed_at=now - timedelta(hours=5),
        review_action="reject",
        review_notes="Not feasible at this time. Too large scope.",
    )
    db_session.add(proposal)
    await db_session.commit()
    await db_session.refresh(proposal)
    return proposal


@pytest.fixture
async def completed_ingestion_job(db_session: AsyncSession) -> MessageIngestionJob:
    """Create a completed message ingestion job."""
    now = datetime.now(UTC)
    job = MessageIngestionJob(
        source_type="telegram",
        source_identifiers={"chat_id": "-1001234567890"},
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        status=IngestionStatus.completed,
        messages_fetched=150,
        messages_stored=150,
        messages_skipped=0,
        errors_count=0,
        current_batch=10,
        total_batches=10,
        started_at=now - timedelta(minutes=15),
        completed_at=now - timedelta(minutes=5),
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    return job


@pytest.fixture
async def running_ingestion_job(db_session: AsyncSession) -> MessageIngestionJob:
    """Create a running message ingestion job."""
    now = datetime.now(UTC)
    job = MessageIngestionJob(
        source_type="telegram",
        source_identifiers={"chat_id": "-1009876543210"},
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        status=IngestionStatus.running,
        messages_fetched=120,
        messages_stored=117,
        messages_skipped=0,
        errors_count=3,
        current_batch=6,
        total_batches=10,
        error_log={"errors": ["Timeout on batch 4", "Connection reset on batch 6"]},
        started_at=now - timedelta(minutes=5),
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    return job


@pytest.fixture
async def pending_ingestion_job(db_session: AsyncSession) -> MessageIngestionJob:
    """Create a pending message ingestion job."""
    now = datetime.now(UTC)
    job = MessageIngestionJob(
        source_type="telegram",
        source_identifiers={"chat_id": "-1001111222333"},
        time_window_start=now - timedelta(days=1),
        time_window_end=now,
        status=IngestionStatus.pending,
        messages_fetched=0,
        messages_stored=0,
        messages_skipped=0,
        errors_count=0,
        current_batch=0,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)
    return job
