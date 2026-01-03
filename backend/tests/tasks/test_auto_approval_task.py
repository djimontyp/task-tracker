"""Tests for auto-approval scheduled task."""

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Atom, LLMProvider, ProviderType
from app.models.agent_config import AgentConfig
from app.models.scheduled_extraction_task import ScheduledExtractionTask


@pytest.fixture
async def sample_provider(db_session: AsyncSession) -> LLMProvider:
    provider = LLMProvider(
        id=uuid4(),
        name="Test Ollama",
        type=ProviderType.ollama,
        base_url="http://localhost:11434",
        is_active=True,
    )
    db_session.add(provider)
    await db_session.commit()
    await db_session.refresh(provider)
    return provider


@pytest.fixture
async def sample_agent(db_session: AsyncSession, sample_provider: LLMProvider) -> AgentConfig:
    agent = AgentConfig(
        id=uuid4(),
        name="test_extractor",
        provider_id=sample_provider.id,
        model_name="qwen2.5:14b",
        system_prompt="Extract knowledge",
        is_active=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest.fixture
async def extraction_task_auto_approve(
    db_session: AsyncSession, sample_agent: AgentConfig
) -> ScheduledExtractionTask:
    task = ScheduledExtractionTask(
        id=uuid4(),
        name="Auto-approve Test",
        cron_schedule="0 8 * * *",
        agent_id=sample_agent.id,
        is_active=True,
        auto_approve_enabled=True,
        confidence_threshold=0.8,
        allowed_atom_types=None,
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def extraction_task_type_filter(
    db_session: AsyncSession, sample_agent: AgentConfig
) -> ScheduledExtractionTask:
    task = ScheduledExtractionTask(
        id=uuid4(),
        name="Insight-only",
        cron_schedule="0 9 * * *",
        agent_id=sample_agent.id,
        is_active=True,
        auto_approve_enabled=True,
        confidence_threshold=0.85,
        allowed_atom_types=["insight", "decision"],
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    return task


@pytest.fixture
async def sample_atoms(db_session: AsyncSession) -> list[Atom]:
    atoms_data = [
        {"type": "problem", "title": "Problem 1", "content": "High", "confidence": 0.95, "user_approved": False},
        {"type": "insight", "title": "Insight 1", "content": "High", "confidence": 0.90, "user_approved": False},
        {"type": "decision", "title": "Decision 1", "content": "High", "confidence": 0.88, "user_approved": False},
        {"type": "problem", "title": "Problem 2", "content": "Low", "confidence": 0.75, "user_approved": False},
        {"type": "insight", "title": "Insight 2", "content": "Low", "confidence": 0.50, "user_approved": False},
        {"type": "problem", "title": "Problem 3", "content": "Approved", "confidence": 0.99, "user_approved": True},
        {"type": "insight", "title": "Insight 3", "content": "Archived", "confidence": 0.95, "user_approved": False, "archived": True},
        {"type": "question", "title": "Question 1", "content": "None", "confidence": None, "user_approved": False},
    ]
    atoms = []
    for data in atoms_data:
        atom = Atom(
            id=uuid4(),
            type=data["type"],
            title=data["title"],
            content=data["content"],
            confidence=data.get("confidence"),
            user_approved=data.get("user_approved", False),
            archived=data.get("archived", False),
        )
        db_session.add(atom)
        atoms.append(atom)
    await db_session.commit()
    for atom in atoms:
        await db_session.refresh(atom)
    return atoms


@pytest.mark.asyncio
async def test_auto_approval_high_confidence(
    db_session: AsyncSession,
    extraction_task_auto_approve: ScheduledExtractionTask,
    sample_atoms: list[Atom],
) -> None:
    from app.tasks.knowledge import _process_auto_approval_for_task
    approved = await _process_auto_approval_for_task(db=db_session, extraction_task=extraction_task_auto_approve)
    assert approved == 3, f"Expected 3 approved, got {approved}"
    await db_session.refresh(sample_atoms[0])
    await db_session.refresh(sample_atoms[1])
    await db_session.refresh(sample_atoms[2])
    assert sample_atoms[0].user_approved is True
    assert sample_atoms[1].user_approved is True
    assert sample_atoms[2].user_approved is True


@pytest.mark.asyncio
async def test_auto_approval_low_confidence_skipped(
    db_session: AsyncSession,
    extraction_task_auto_approve: ScheduledExtractionTask,
    sample_atoms: list[Atom],
) -> None:
    from app.tasks.knowledge import _process_auto_approval_for_task
    await _process_auto_approval_for_task(db=db_session, extraction_task=extraction_task_auto_approve)
    await db_session.refresh(sample_atoms[3])
    await db_session.refresh(sample_atoms[4])
    assert sample_atoms[3].user_approved is False
    assert sample_atoms[4].user_approved is False


@pytest.mark.asyncio
async def test_auto_approval_type_filter(
    db_session: AsyncSession,
    extraction_task_type_filter: ScheduledExtractionTask,
    sample_atoms: list[Atom],
) -> None:
    from app.tasks.knowledge import _process_auto_approval_for_task
    approved = await _process_auto_approval_for_task(db=db_session, extraction_task=extraction_task_type_filter)
    assert approved == 2, f"Expected 2 approved, got {approved}"
    await db_session.refresh(sample_atoms[0])
    await db_session.refresh(sample_atoms[1])
    await db_session.refresh(sample_atoms[2])
    assert sample_atoms[0].user_approved is False
    assert sample_atoms[1].user_approved is True
    assert sample_atoms[2].user_approved is True
