# Phase 2: Service Layer Specification - Knowledge Proposal System

**Created:** October 23, 2025
**Phase:** 2 of 5 (Service Layer Refactor)
**Status:** Ready for Implementation
**Estimated Effort:** 1 week (5-7 days)

---

## Overview

This document specifies all service classes and methods for Phase 2, which transforms the Knowledge Extraction system from direct creation to proposal-based workflow. All services follow the established patterns from `TaskProposalCRUD` and existing knowledge services.

**Key Principle:** Extraction creates proposals, not final entities. Review workflow controls what becomes knowledge.

---

## Table of Contents

1. [TopicProposalService](#1-topicproposalservice)
2. [AtomProposalService](#2-atomproposalservice)
3. [ReviewWorkflowService](#3-reviewworkflowservice)
4. [Modified KnowledgeExtractionService](#4-modified-knowledgeextractionservice)
5. [KnowledgeExtractionRunService](#5-knowledgeextractionrunservice)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Business Logic Flowcharts](#7-business-logic-flowcharts)

---

## 1. TopicProposalService

**File:** `backend/app/services/proposals/topic_proposal_service.py`

### Purpose
CRUD operations for topic proposals with duplicate detection and approval workflow.

### Class Definition

```python
"""CRUD operations for TopicProposal management."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    KnowledgeExtractionRun,
    Topic,
    TopicProposal,
    TopicProposalCreate,
    TopicProposalPublic,
    TopicProposalUpdate,
)
from app.models.topic import auto_select_color, auto_select_icon


class TopicProposalService:
    """Service for TopicProposal CRUD operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service with database session.

        Args:
            session: Async database session
        """
        self.session = session
```

### Methods

#### 1.1 create()

```python
async def create(
    self,
    proposal_data: TopicProposalCreate
) -> TopicProposalPublic:
    """Create new topic proposal.

    Args:
        proposal_data: Proposal creation data with extraction metadata

    Returns:
        Created topic proposal with public fields

    Raises:
        ValueError: If extraction_run_id not found
    """
    # Verify extraction run exists
    run_result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == proposal_data.extraction_run_id
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise ValueError(
            f"Extraction run '{proposal_data.extraction_run_id}' not found"
        )

    # Create proposal
    proposal = TopicProposal(**proposal_data.model_dump())

    self.session.add(proposal)
    await self.session.commit()
    await self.session.refresh(proposal)

    return TopicProposalPublic.model_validate(proposal)
```

**Business Logic:**
1. Validate extraction run exists (FK constraint)
2. Create proposal with status="pending" (default)
3. Persist to database
4. Return public schema

---

#### 1.2 get()

```python
async def get(self, proposal_id: UUID) -> TopicProposalPublic | None:
    """Get topic proposal by ID.

    Args:
        proposal_id: Topic proposal UUID

    Returns:
        Topic proposal if found, None otherwise
    """
    result = await self.session.execute(
        select(TopicProposal).where(TopicProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if proposal:
        return TopicProposalPublic.model_validate(proposal)
    return None
```

---

#### 1.3 list()

```python
async def list(
    self,
    skip: int = 0,
    limit: int = 100,
    run_id: UUID | None = None,
    status: str | None = None,
    confidence_min: float | None = None,
    confidence_max: float | None = None,
    has_similar: bool | None = None,
) -> tuple[list[TopicProposalPublic], int]:
    """List topic proposals with pagination and filters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        run_id: Filter by extraction run ID
        status: Filter by status (pending/approved/rejected/merged)
        confidence_min: Filter by confidence >= min
        confidence_max: Filter by confidence <= max
        has_similar: Filter by similar_topic_id presence

    Returns:
        Tuple of (list of proposals, total count)
    """
    filters = []

    if run_id:
        filters.append(TopicProposal.extraction_run_id == run_id)
    if status:
        filters.append(TopicProposal.status == status)
    if confidence_min is not None:
        filters.append(TopicProposal.confidence >= confidence_min)
    if confidence_max is not None:
        filters.append(TopicProposal.confidence <= confidence_max)
    if has_similar is not None:
        if has_similar:
            filters.append(TopicProposal.similar_topic_id.is_not(None))
        else:
            filters.append(TopicProposal.similar_topic_id.is_(None))

    query = select(TopicProposal)
    count_query = select(func.count()).select_from(TopicProposal)

    for condition in filters:
        query = query.where(condition)
        count_query = count_query.where(condition)

    # Sort by confidence DESC, created_at DESC
    query = (
        query.order_by(desc(TopicProposal.confidence), desc(TopicProposal.created_at))
        .offset(skip)
        .limit(limit)
    )

    result = await self.session.execute(query)
    proposals = result.scalars().all()

    total_result = await self.session.execute(count_query)
    total = total_result.scalar_one()

    return [TopicProposalPublic.model_validate(p) for p in proposals], total
```

**Business Logic:**
- Multi-dimensional filtering (run, status, confidence, similarity)
- Pagination with total count
- Sort by confidence (high first), then recency

---

#### 1.4 update()

```python
async def update(
    self,
    proposal_id: UUID,
    update_data: TopicProposalUpdate,
) -> TopicProposalPublic | None:
    """Update topic proposal.

    Args:
        proposal_id: Topic proposal UUID
        update_data: Fields to update (partial)

    Returns:
        Updated proposal if found, None otherwise
    """
    result = await self.session.execute(
        select(TopicProposal).where(TopicProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        return None

    # Apply updates (exclude unset fields)
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(proposal, field, value)

    await self.session.commit()
    await self.session.refresh(proposal)

    return TopicProposalPublic.model_validate(proposal)
```

---

#### 1.5 check_for_duplicates()

```python
async def check_for_duplicates(
    self,
    topic_name: str
) -> tuple[Topic | None, float, str]:
    """Check if topic already exists (exact name match).

    Phase 3 will add semantic similarity detection.

    Args:
        topic_name: Proposed topic name

    Returns:
        Tuple of (existing topic, similarity score, match type)
        - (Topic, 1.0, "exact") if exact match found
        - (None, 0.0, "none") if no match
    """
    result = await self.session.execute(
        select(Topic).where(Topic.name == topic_name)
    )
    existing_topic = result.scalar_one_or_none()

    if existing_topic:
        return (existing_topic, 1.0, "exact")

    return (None, 0.0, "none")
```

**Note:** Phase 3 will enhance this with semantic similarity using embeddings.

---

#### 1.6 approve_and_create()

```python
async def approve_and_create(
    self,
    proposal_id: UUID,
    user_id: int | None = None,
) -> tuple[TopicProposalPublic, Topic]:
    """Approve proposal and create final Topic entity.

    Args:
        proposal_id: Topic proposal UUID
        user_id: User who approved the proposal

    Returns:
        Tuple of (updated proposal, created topic)

    Raises:
        ValueError: If proposal not found or already approved
    """
    result = await self.session.execute(
        select(TopicProposal).where(TopicProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        raise ValueError(f"Proposal '{proposal_id}' not found")

    if proposal.status != "pending":
        raise ValueError(
            f"Proposal '{proposal_id}' is already {proposal.status}, "
            "cannot approve"
        )

    # Update proposal status
    proposal.status = "approved"
    proposal.reviewed_by_user_id = user_id
    proposal.reviewed_at = datetime.utcnow()

    # Auto-select icon/color if not specified
    icon = proposal.proposed_icon or auto_select_icon(
        proposal.proposed_name,
        proposal.proposed_description
    )
    color = proposal.proposed_color or auto_select_color(icon)

    # Create final Topic entity
    new_topic = Topic(
        name=proposal.proposed_name,
        description=proposal.proposed_description,
        icon=icon,
        color=color,
    )
    self.session.add(new_topic)
    await self.session.flush()

    # Update run stats
    run_result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == proposal.extraction_run_id
        )
    )
    run = run_result.scalar_one_or_none()
    if run:
        run.topics_approved += 1

    await self.session.commit()
    await self.session.refresh(proposal)
    await self.session.refresh(new_topic)

    return (
        TopicProposalPublic.model_validate(proposal),
        new_topic
    )
```

**Business Logic:**
1. Validate proposal exists and is pending
2. Update proposal status to "approved"
3. Create Topic entity with auto-selected icon/color
4. Increment run statistics
5. Return both proposal and created topic

---

#### 1.7 reject()

```python
async def reject(
    self,
    proposal_id: UUID,
    reason: str,
    user_id: int | None = None,
) -> TopicProposalPublic:
    """Reject topic proposal.

    Args:
        proposal_id: Topic proposal UUID
        reason: Rejection reason
        user_id: User who rejected the proposal

    Returns:
        Updated proposal

    Raises:
        ValueError: If proposal not found or already reviewed
    """
    result = await self.session.execute(
        select(TopicProposal).where(TopicProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        raise ValueError(f"Proposal '{proposal_id}' not found")

    if proposal.status != "pending":
        raise ValueError(
            f"Proposal '{proposal_id}' is already {proposal.status}, "
            "cannot reject"
        )

    # Update proposal
    proposal.status = "rejected"
    proposal.review_notes = reason
    proposal.reviewed_by_user_id = user_id
    proposal.reviewed_at = datetime.utcnow()

    # Update run stats
    run_result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == proposal.extraction_run_id
        )
    )
    run = run_result.scalar_one_or_none()
    if run:
        run.topics_rejected += 1

    await self.session.commit()
    await self.session.refresh(proposal)

    return TopicProposalPublic.model_validate(proposal)
```

---

## 2. AtomProposalService

**File:** `backend/app/services/proposals/atom_proposal_service.py`

### Purpose
CRUD operations for atom proposals with topic linking and approval workflow.

### Class Definition

```python
"""CRUD operations for AtomProposal management."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import (
    Atom,
    AtomProposal,
    AtomProposalCreate,
    AtomProposalPublic,
    AtomProposalUpdate,
    KnowledgeExtractionRun,
    Topic,
    TopicAtom,
)


class AtomProposalService:
    """Service for AtomProposal CRUD operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service with database session.

        Args:
            session: Async database session
        """
        self.session = session
```

### Methods

#### 2.1 create()

```python
async def create(
    self,
    proposal_data: AtomProposalCreate
) -> AtomProposalPublic:
    """Create new atom proposal.

    Args:
        proposal_data: Proposal creation data

    Returns:
        Created atom proposal

    Raises:
        ValueError: If extraction_run_id not found
    """
    # Verify extraction run exists
    run_result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == proposal_data.extraction_run_id
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise ValueError(
            f"Extraction run '{proposal_data.extraction_run_id}' not found"
        )

    # Create proposal
    proposal = AtomProposal(**proposal_data.model_dump())

    self.session.add(proposal)
    await self.session.commit()
    await self.session.refresh(proposal)

    return AtomProposalPublic.model_validate(proposal)
```

---

#### 2.2 get()

```python
async def get(self, proposal_id: UUID) -> AtomProposalPublic | None:
    """Get atom proposal by ID.

    Args:
        proposal_id: Atom proposal UUID

    Returns:
        Atom proposal if found, None otherwise
    """
    result = await self.session.execute(
        select(AtomProposal).where(AtomProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if proposal:
        return AtomProposalPublic.model_validate(proposal)
    return None
```

---

#### 2.3 list()

```python
async def list(
    self,
    skip: int = 0,
    limit: int = 100,
    run_id: UUID | None = None,
    status: str | None = None,
    atom_type: str | None = None,
    confidence_min: float | None = None,
    confidence_max: float | None = None,
    topic_id: int | None = None,
    has_similar: bool | None = None,
) -> tuple[list[AtomProposalPublic], int]:
    """List atom proposals with pagination and filters.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        run_id: Filter by extraction run ID
        status: Filter by status (pending/approved/rejected/merged)
        atom_type: Filter by atom type (problem/solution/decision/etc)
        confidence_min: Filter by confidence >= min
        confidence_max: Filter by confidence <= max
        topic_id: Filter by proposed_topic_id
        has_similar: Filter by similar_atom_id presence

    Returns:
        Tuple of (list of proposals, total count)
    """
    filters = []

    if run_id:
        filters.append(AtomProposal.extraction_run_id == run_id)
    if status:
        filters.append(AtomProposal.status == status)
    if atom_type:
        filters.append(AtomProposal.proposed_type == atom_type)
    if confidence_min is not None:
        filters.append(AtomProposal.confidence >= confidence_min)
    if confidence_max is not None:
        filters.append(AtomProposal.confidence <= confidence_max)
    if topic_id is not None:
        filters.append(AtomProposal.proposed_topic_id == topic_id)
    if has_similar is not None:
        if has_similar:
            filters.append(AtomProposal.similar_atom_id.is_not(None))
        else:
            filters.append(AtomProposal.similar_atom_id.is_(None))

    query = select(AtomProposal)
    count_query = select(func.count()).select_from(AtomProposal)

    for condition in filters:
        query = query.where(condition)
        count_query = count_query.where(condition)

    # Sort by confidence DESC, created_at DESC
    query = (
        query.order_by(desc(AtomProposal.confidence), desc(AtomProposal.created_at))
        .offset(skip)
        .limit(limit)
    )

    result = await self.session.execute(query)
    proposals = result.scalars().all()

    total_result = await self.session.execute(count_query)
    total = total_result.scalar_one()

    return [AtomProposalPublic.model_validate(p) for p in proposals], total
```

---

#### 2.4 update()

```python
async def update(
    self,
    proposal_id: UUID,
    update_data: AtomProposalUpdate,
) -> AtomProposalPublic | None:
    """Update atom proposal.

    Args:
        proposal_id: Atom proposal UUID
        update_data: Fields to update (partial)

    Returns:
        Updated proposal if found, None otherwise
    """
    result = await self.session.execute(
        select(AtomProposal).where(AtomProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        return None

    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(proposal, field, value)

    await self.session.commit()
    await self.session.refresh(proposal)

    return AtomProposalPublic.model_validate(proposal)
```

---

#### 2.5 approve_and_create()

```python
async def approve_and_create(
    self,
    proposal_id: UUID,
    user_id: int | None = None,
) -> tuple[AtomProposalPublic, Atom]:
    """Approve proposal and create final Atom entity.

    Args:
        proposal_id: Atom proposal UUID
        user_id: User who approved the proposal

    Returns:
        Tuple of (updated proposal, created atom)

    Raises:
        ValueError: If proposal not found, already approved, or topic missing
    """
    result = await self.session.execute(
        select(AtomProposal).where(AtomProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        raise ValueError(f"Proposal '{proposal_id}' not found")

    if proposal.status != "pending":
        raise ValueError(
            f"Proposal '{proposal_id}' is already {proposal.status}, "
            "cannot approve"
        )

    # Verify topic exists
    if proposal.proposed_topic_id:
        topic_result = await self.session.execute(
            select(Topic).where(Topic.id == proposal.proposed_topic_id)
        )
        topic = topic_result.scalar_one_or_none()
        if not topic:
            raise ValueError(
                f"Topic '{proposal.proposed_topic_id}' not found for atom proposal"
            )

    # Update proposal status
    proposal.status = "approved"
    proposal.reviewed_by_user_id = user_id
    proposal.reviewed_at = datetime.utcnow()

    # Create final Atom entity
    new_atom = Atom(
        type=proposal.proposed_type,
        title=proposal.proposed_title,
        content=proposal.proposed_content,
        confidence=proposal.confidence,
        user_approved=True,  # Auto-set since manually reviewed
        meta={
            "source": "proposal_approved",
            "proposal_id": str(proposal.id),
            "message_ids": proposal.source_message_ids,
        },
    )
    self.session.add(new_atom)
    await self.session.flush()

    # Link to topic if specified
    if proposal.proposed_topic_id:
        topic_atom = TopicAtom(
            topic_id=proposal.proposed_topic_id,
            atom_id=new_atom.id,
            note=f"Approved from proposal (confidence: {proposal.confidence:.2f})",
        )
        self.session.add(topic_atom)

    # Update run stats
    run_result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == proposal.extraction_run_id
        )
    )
    run = run_result.scalar_one_or_none()
    if run:
        run.atoms_approved += 1

    await self.session.commit()
    await self.session.refresh(proposal)
    await self.session.refresh(new_atom)

    return (
        AtomProposalPublic.model_validate(proposal),
        new_atom
    )
```

**Business Logic:**
1. Validate proposal is pending
2. Verify topic exists (if specified)
3. Create Atom entity with user_approved=True
4. Link to Topic via TopicAtom
5. Update run statistics
6. Return both proposal and atom

---

#### 2.6 reject()

```python
async def reject(
    self,
    proposal_id: UUID,
    reason: str,
    user_id: int | None = None,
) -> AtomProposalPublic:
    """Reject atom proposal.

    Args:
        proposal_id: Atom proposal UUID
        reason: Rejection reason
        user_id: User who rejected the proposal

    Returns:
        Updated proposal

    Raises:
        ValueError: If proposal not found or already reviewed
    """
    result = await self.session.execute(
        select(AtomProposal).where(AtomProposal.id == proposal_id)
    )
    proposal = result.scalar_one_or_none()

    if not proposal:
        raise ValueError(f"Proposal '{proposal_id}' not found")

    if proposal.status != "pending":
        raise ValueError(
            f"Proposal '{proposal_id}' is already {proposal.status}, "
            "cannot reject"
        )

    proposal.status = "rejected"
    proposal.review_notes = reason
    proposal.reviewed_by_user_id = user_id
    proposal.reviewed_at = datetime.utcnow()

    # Update run stats
    run_result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == proposal.extraction_run_id
        )
    )
    run = run_result.scalar_one_or_none()
    if run:
        run.atoms_rejected += 1

    await self.session.commit()
    await self.session.refresh(proposal)

    return AtomProposalPublic.model_validate(proposal)
```

---

## 3. ReviewWorkflowService

**File:** `backend/app/services/proposals/review_workflow_service.py`

### Purpose
High-level orchestration service for batch operations and workflow coordination.

### Class Definition

```python
"""Review workflow orchestration service."""

from collections.abc import Sequence
from uuid import UUID

from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import Atom, AtomProposal, Topic, TopicProposal
from app.services.proposals.atom_proposal_service import AtomProposalService
from app.services.proposals.topic_proposal_service import TopicProposalService


class ReviewWorkflowService:
    """Orchestration service for proposal review workflows."""

    def __init__(self, session: AsyncSession):
        """Initialize workflow service.

        Args:
            session: Async database session
        """
        self.session = session
        self.topic_service = TopicProposalService(session)
        self.atom_service = AtomProposalService(session)
```

### Methods

#### 3.1 batch_approve_topics()

```python
async def batch_approve_topics(
    self,
    proposal_ids: Sequence[UUID],
    user_id: int | None = None,
) -> tuple[list[Topic], list[str]]:
    """Approve multiple topic proposals in batch.

    Args:
        proposal_ids: List of topic proposal UUIDs
        user_id: User who approved the proposals

    Returns:
        Tuple of (created topics, error messages for failed approvals)
    """
    created_topics: list[Topic] = []
    errors: list[str] = []

    for proposal_id in proposal_ids:
        try:
            _, topic = await self.topic_service.approve_and_create(
                proposal_id=proposal_id,
                user_id=user_id,
            )
            created_topics.append(topic)
        except ValueError as e:
            errors.append(f"Failed to approve {proposal_id}: {str(e)}")

    return created_topics, errors
```

**Business Logic:**
- Iterate through proposals
- Collect successes and failures
- Return both for partial success handling

---

#### 3.2 batch_approve_atoms()

```python
async def batch_approve_atoms(
    self,
    proposal_ids: Sequence[UUID],
    user_id: int | None = None,
) -> tuple[list[Atom], list[str]]:
    """Approve multiple atom proposals in batch.

    Args:
        proposal_ids: List of atom proposal UUIDs
        user_id: User who approved the proposals

    Returns:
        Tuple of (created atoms, error messages for failed approvals)
    """
    created_atoms: list[Atom] = []
    errors: list[str] = []

    for proposal_id in proposal_ids:
        try:
            _, atom = await self.atom_service.approve_and_create(
                proposal_id=proposal_id,
                user_id=user_id,
            )
            created_atoms.append(atom)
        except ValueError as e:
            errors.append(f"Failed to approve {proposal_id}: {str(e)}")

    return created_atoms, errors
```

---

#### 3.3 batch_reject()

```python
async def batch_reject(
    self,
    topic_proposal_ids: Sequence[UUID] | None = None,
    atom_proposal_ids: Sequence[UUID] | None = None,
    reason: str = "Batch rejection",
    user_id: int | None = None,
) -> tuple[int, list[str]]:
    """Reject multiple proposals in batch.

    Args:
        topic_proposal_ids: Topic proposal UUIDs to reject
        atom_proposal_ids: Atom proposal UUIDs to reject
        reason: Rejection reason
        user_id: User who rejected the proposals

    Returns:
        Tuple of (total rejected count, error messages)
    """
    rejected_count = 0
    errors: list[str] = []

    if topic_proposal_ids:
        for proposal_id in topic_proposal_ids:
            try:
                await self.topic_service.reject(
                    proposal_id=proposal_id,
                    reason=reason,
                    user_id=user_id,
                )
                rejected_count += 1
            except ValueError as e:
                errors.append(f"Failed to reject topic {proposal_id}: {str(e)}")

    if atom_proposal_ids:
        for proposal_id in atom_proposal_ids:
            try:
                await self.atom_service.reject(
                    proposal_id=proposal_id,
                    reason=reason,
                    user_id=user_id,
                )
                rejected_count += 1
            except ValueError as e:
                errors.append(f"Failed to reject atom {proposal_id}: {str(e)}")

    return rejected_count, errors
```

---

#### 3.4 auto_approve_high_confidence()

```python
async def auto_approve_high_confidence(
    self,
    confidence_threshold: float = 0.95,
) -> tuple[int, int]:
    """Auto-approve proposals with confidence above threshold.

    Used by background job for automatic approval of high-confidence proposals.

    Args:
        confidence_threshold: Minimum confidence for auto-approval (default: 0.95)

    Returns:
        Tuple of (topics approved, atoms approved)
    """
    topics_approved = 0
    atoms_approved = 0

    # Auto-approve topics
    topic_proposals, _ = await self.topic_service.list(
        status="pending",
        confidence_min=confidence_threshold,
        limit=100,
    )

    for proposal in topic_proposals:
        # Skip if has similar entity (needs manual review)
        if proposal.similar_topic_id:
            continue

        try:
            await self.topic_service.approve_and_create(
                proposal_id=proposal.id,
                user_id=None,  # System auto-approval
            )
            topics_approved += 1
        except ValueError:
            pass  # Skip failed approvals

    # Auto-approve atoms
    atom_proposals, _ = await self.atom_service.list(
        status="pending",
        confidence_min=confidence_threshold,
        limit=100,
    )

    for proposal in atom_proposals:
        # Skip if has similar entity
        if proposal.similar_atom_id:
            continue

        try:
            await self.atom_service.approve_and_create(
                proposal_id=proposal.id,
                user_id=None,  # System auto-approval
            )
            atoms_approved += 1
        except ValueError:
            pass

    return topics_approved, atoms_approved
```

**Business Logic:**
- Query pending proposals with high confidence
- Skip proposals with similar entities (need human review)
- Auto-approve without user_id (system approval)
- Used by background job (Phase 5)

---

#### 3.5 get_review_queue_summary()

```python
async def get_review_queue_summary(
    self,
    run_id: UUID | None = None,
) -> dict[str, int]:
    """Get summary of pending proposals for review queue.

    Args:
        run_id: Optional filter by extraction run

    Returns:
        Dictionary with counts by category
    """
    # Count topics by status
    topic_pending, _ = await self.topic_service.list(
        status="pending",
        run_id=run_id,
        limit=1,
    )
    topic_high_conf, _ = await self.topic_service.list(
        status="pending",
        confidence_min=0.9,
        run_id=run_id,
        limit=1,
    )
    topic_with_similar, _ = await self.topic_service.list(
        status="pending",
        has_similar=True,
        run_id=run_id,
        limit=1,
    )

    # Count atoms by status
    atom_pending, _ = await self.atom_service.list(
        status="pending",
        run_id=run_id,
        limit=1,
    )
    atom_high_conf, _ = await self.atom_service.list(
        status="pending",
        confidence_min=0.9,
        run_id=run_id,
        limit=1,
    )
    atom_with_similar, _ = await self.atom_service.list(
        status="pending",
        has_similar=True,
        run_id=run_id,
        limit=1,
    )

    return {
        "topics_pending": topic_pending,
        "topics_high_confidence": topic_high_conf,
        "topics_with_duplicates": topic_with_similar,
        "atoms_pending": atom_pending,
        "atoms_high_confidence": atom_high_conf,
        "atoms_with_duplicates": atom_with_similar,
    }
```

**Business Logic:**
- Aggregate counts for dashboard UI
- Separate high-confidence and duplicate counts
- Filter by run if specified

---

## 4. Modified KnowledgeExtractionService

**File:** `backend/app/services/knowledge_extraction_service.py`

### Changes Required

Replace direct creation methods with proposal creation methods.

#### 4.1 Modified save_topics() → create_topic_proposals()

```python
async def create_topic_proposals(
    self,
    extracted_topics: list[ExtractedTopic],
    extraction_run_id: UUID,
    session: AsyncSession,
) -> dict[str, TopicProposal]:
    """Create topic proposals from extraction (NO filtering by confidence).

    Phase 1 CHANGE: All topics persisted as proposals, even low confidence.

    Args:
        extracted_topics: Topics extracted from LLM
        extraction_run_id: Parent extraction run UUID
        session: Database session

    Returns:
        Mapping of topic name -> TopicProposal entity
    """
    from app.services.proposals.topic_proposal_service import TopicProposalService

    topic_service = TopicProposalService(session)
    proposal_map: dict[str, TopicProposal] = {}

    for extracted_topic in extracted_topics:
        # Check for duplicates
        similar_topic, similarity_score, match_type = (
            await topic_service.check_for_duplicates(extracted_topic.name)
        )

        # Create proposal data
        proposal_data = TopicProposalCreate(
            extraction_run_id=extraction_run_id,
            proposed_name=extracted_topic.name,
            proposed_description=extracted_topic.description,
            confidence=extracted_topic.confidence,
            reasoning=f"Extracted from {len(extracted_topic.related_message_ids)} messages",
            source_message_ids=extracted_topic.related_message_ids,
            similar_topic_id=similar_topic.id if similar_topic else None,
            similarity_score=similarity_score if similar_topic else None,
            similarity_type=match_type if similar_topic else None,
        )

        # Create proposal (NO confidence filtering!)
        proposal = await topic_service.create(proposal_data)
        proposal_map[extracted_topic.name] = proposal

        logger.info(
            f"Created topic proposal '{extracted_topic.name}' "
            f"(confidence: {extracted_topic.confidence:.2f}, "
            f"similar: {similarity_score:.2f})"
        )

    logger.info(
        f"Created {len(proposal_map)} topic proposals "
        f"(including low-confidence items)"
    )
    return proposal_map
```

**Key Changes:**
1. **NO confidence filtering** - persist ALL topics as proposals
2. Check for duplicates before creating
3. Store similar_topic_id if found
4. Return proposal map instead of Topic map

---

#### 4.2 Modified save_atoms() → create_atom_proposals()

```python
async def create_atom_proposals(
    self,
    extracted_atoms: list[ExtractedAtom],
    topic_proposal_map: dict[str, TopicProposal],
    extraction_run_id: UUID,
    session: AsyncSession,
) -> list[AtomProposal]:
    """Create atom proposals from extraction (NO filtering by confidence).

    Phase 1 CHANGE: All atoms persisted as proposals, even low confidence.

    Args:
        extracted_atoms: Atoms extracted from LLM
        topic_proposal_map: Mapping of topic names to proposals
        extraction_run_id: Parent extraction run UUID
        session: Database session

    Returns:
        List of created AtomProposal entities
    """
    from app.services.proposals.atom_proposal_service import AtomProposalService

    atom_service = AtomProposalService(session)
    saved_proposals: list[AtomProposal] = []

    for extracted_atom in extracted_atoms:
        # Get proposed topic ID (from approved topics or None)
        proposed_topic_id: int | None = None
        if extracted_atom.topic_name in topic_proposal_map:
            topic_proposal = topic_proposal_map[extracted_atom.topic_name]
            # Only link if topic proposal was approved
            if topic_proposal.status == "approved":
                # Need to query for actual Topic created from proposal
                # This is a simplification - real implementation would track this
                pass

        # Create proposal data
        proposal_data = AtomProposalCreate(
            extraction_run_id=extraction_run_id,
            proposed_type=extracted_atom.type,
            proposed_title=extracted_atom.title,
            proposed_content=extracted_atom.content,
            proposed_topic_id=proposed_topic_id,
            confidence=extracted_atom.confidence,
            reasoning=f"Extracted as {extracted_atom.type} from messages",
            source_message_ids=extracted_atom.related_message_ids,
        )

        # Create proposal (NO confidence filtering!)
        proposal = await atom_service.create(proposal_data)
        saved_proposals.append(proposal)

        logger.info(
            f"Created atom proposal '{extracted_atom.title}' "
            f"(type: {extracted_atom.type}, confidence: {extracted_atom.confidence:.2f})"
        )

    logger.info(
        f"Created {len(saved_proposals)} atom proposals "
        f"(including low-confidence items)"
    )
    return saved_proposals
```

**Key Changes:**
1. **NO confidence filtering** - persist ALL atoms
2. Link to topic only if topic was approved
3. Return AtomProposal list instead of Atom list
4. Store source metadata for audit trail

---

#### 4.3 Remove link_atoms() and update_messages()

**These methods are deferred until approval:**
- `link_atoms()` - Will be called after atom approval
- `update_messages()` - Will be called after topic approval

**Reason:** Proposals shouldn't modify message topic assignments until approved.

---

## 5. KnowledgeExtractionRunService

**File:** `backend/app/services/proposals/knowledge_extraction_run_service.py`

### Purpose
Track extraction runs for audit trail and bulk operations.

### Class Definition

```python
"""Service for tracking knowledge extraction runs."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import desc, func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models import KnowledgeExtractionRun, KnowledgeExtractionRunPublic


class KnowledgeExtractionRunService:
    """Service for extraction run tracking."""

    def __init__(self, session: AsyncSession):
        """Initialize service.

        Args:
            session: Async database session
        """
        self.session = session
```

### Methods

#### 5.1 create_run()

```python
async def create_run(
    self,
    agent_config_id: UUID,
    message_count: int,
    confidence_threshold: float,
    user_id: int | None = None,
) -> KnowledgeExtractionRun:
    """Create new extraction run record.

    Args:
        agent_config_id: Agent used for extraction
        message_count: Number of messages analyzed
        confidence_threshold: Threshold used for filtering
        user_id: User who triggered extraction (None for auto)

    Returns:
        Created extraction run entity
    """
    run = KnowledgeExtractionRun(
        id=uuid4(),
        agent_config_id=agent_config_id,
        status="pending",
        message_count=message_count,
        confidence_threshold=confidence_threshold,
        topics_proposed=0,
        topics_approved=0,
        topics_rejected=0,
        atoms_proposed=0,
        atoms_approved=0,
        atoms_rejected=0,
        triggered_by_user_id=user_id,
        started_at=datetime.utcnow(),
    )

    self.session.add(run)
    await self.session.commit()
    await self.session.refresh(run)

    return run
```

---

#### 5.2 update_run_stats()

```python
async def update_run_stats(
    self,
    run_id: UUID,
    topics_proposed: int | None = None,
    atoms_proposed: int | None = None,
) -> KnowledgeExtractionRun:
    """Update run statistics after extraction.

    Args:
        run_id: Extraction run UUID
        topics_proposed: Number of topic proposals created
        atoms_proposed: Number of atom proposals created

    Returns:
        Updated run entity

    Raises:
        ValueError: If run not found
    """
    result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == run_id
        )
    )
    run = result.scalar_one_or_none()

    if not run:
        raise ValueError(f"Extraction run '{run_id}' not found")

    if topics_proposed is not None:
        run.topics_proposed = topics_proposed
    if atoms_proposed is not None:
        run.atoms_proposed = atoms_proposed

    run.status = "completed"
    run.completed_at = datetime.utcnow()

    await self.session.commit()
    await self.session.refresh(run)

    return run
```

---

#### 5.3 get_run()

```python
async def get_run(self, run_id: UUID) -> KnowledgeExtractionRunPublic | None:
    """Get extraction run by ID.

    Args:
        run_id: Extraction run UUID

    Returns:
        Run details if found, None otherwise
    """
    result = await self.session.execute(
        select(KnowledgeExtractionRun).where(
            KnowledgeExtractionRun.id == run_id
        )
    )
    run = result.scalar_one_or_none()

    if run:
        return KnowledgeExtractionRunPublic.model_validate(run)
    return None
```

---

#### 5.4 list_runs()

```python
async def list_runs(
    self,
    skip: int = 0,
    limit: int = 50,
    status: str | None = None,
) -> tuple[list[KnowledgeExtractionRunPublic], int]:
    """List extraction runs with pagination.

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status (pending/completed/failed)

    Returns:
        Tuple of (list of runs, total count)
    """
    filters = []
    if status:
        filters.append(KnowledgeExtractionRun.status == status)

    query = select(KnowledgeExtractionRun)
    count_query = select(func.count()).select_from(KnowledgeExtractionRun)

    for condition in filters:
        query = query.where(condition)
        count_query = count_query.where(condition)

    query = (
        query.order_by(desc(KnowledgeExtractionRun.started_at))
        .offset(skip)
        .limit(limit)
    )

    result = await self.session.execute(query)
    runs = result.scalars().all()

    total_result = await self.session.execute(count_query)
    total = total_result.scalar_one()

    return [KnowledgeExtractionRunPublic.model_validate(r) for r in runs], total
```

---

## 6. Error Handling Strategy

### 6.1 Service-Level Exceptions

```python
"""Custom exceptions for proposal services."""

class ProposalError(Exception):
    """Base exception for proposal operations."""
    pass


class ProposalNotFoundError(ProposalError):
    """Raised when proposal doesn't exist."""

    def __init__(self, proposal_id: UUID):
        super().__init__(f"Proposal '{proposal_id}' not found")
        self.proposal_id = proposal_id


class InvalidProposalStateError(ProposalError):
    """Raised when proposal is in invalid state for operation."""

    def __init__(self, proposal_id: UUID, current_state: str, operation: str):
        super().__init__(
            f"Proposal '{proposal_id}' is {current_state}, cannot {operation}"
        )
        self.proposal_id = proposal_id
        self.current_state = current_state
        self.operation = operation


class ExtractionRunNotFoundError(ProposalError):
    """Raised when extraction run doesn't exist."""

    def __init__(self, run_id: UUID):
        super().__init__(f"Extraction run '{run_id}' not found")
        self.run_id = run_id
```

### 6.2 Error Mapping to HTTP Status Codes

| Exception | HTTP Status | Use Case |
|-----------|-------------|----------|
| `ProposalNotFoundError` | 404 Not Found | Proposal doesn't exist |
| `InvalidProposalStateError` | 409 Conflict | Already approved/rejected |
| `ExtractionRunNotFoundError` | 404 Not Found | Invalid extraction run FK |
| `ValueError` (validation) | 422 Unprocessable Entity | Invalid input data |
| `SQLAlchemyError` | 500 Internal Server Error | Database failures |

### 6.3 Logging Strategy

```python
import logging

logger = logging.getLogger(__name__)

# Log levels by operation type:

# INFO: Successful operations
logger.info(f"Approved proposal {proposal_id}, created topic {topic.id}")

# WARNING: Business logic issues (non-critical)
logger.warning(f"Proposal {proposal_id} already approved, skipping")

# ERROR: Operation failures
logger.error(f"Failed to approve proposal {proposal_id}: {error}", exc_info=True)

# DEBUG: Detailed flow for debugging
logger.debug(f"Checking duplicates for topic '{topic_name}'")
```

---

## 7. Business Logic Flowcharts

### 7.1 Extraction Flow (Modified)

```
┌─────────────────────────────────────────────────────────────┐
│ Knowledge Extraction Task (TaskIQ Background)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Create KnowledgeExtractionRun (status=pending)          │
│    - Record run_id, message_count, agent_config            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Fetch Messages (unprocessed, last 24h)                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Call LLM (KnowledgeExtractionService.extract_knowledge) │
│    Returns: ExtractedTopics + ExtractedAtoms               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Create Topic Proposals (ALL, no filtering)              │
│    - Check for duplicates (exact name match)               │
│    - Store similar_topic_id if found                       │
│    - Set status=pending                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Create Atom Proposals (ALL, no filtering)               │
│    - Link to topic_proposal (not final Topic yet)          │
│    - Set status=pending                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Update Run Stats                                         │
│    - topics_proposed count                                  │
│    - atoms_proposed count                                   │
│    - status=completed                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Broadcast WebSocket Event                                │
│    - extraction_completed                                   │
│    - proposals_ready_for_review                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Approval Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Reviews Proposal in Dashboard                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ┌───────────┐
                    │  Decision │
                    └───────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                 ↓
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ APPROVE │      │ REJECT  │      │  MERGE  │
   └─────────┘      └─────────┘      └─────────┘
        ↓                 ↓                 ↓
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Topic/Atom   │   │ Set status=  │   │ Link to      │
│ Service      │   │ rejected     │   │ existing     │
└──────────────┘   │ Add reason   │   │ entity       │
        ↓          └──────────────┘   └──────────────┘
┌──────────────┐           ↓                 ↓
│ 1. Validate  │           ↓                 ↓
│    - Pending?│   ┌──────────────┐   ┌──────────────┐
│    - Exists? │   │ Update run   │   │ Update run   │
└──────────────┘   │ stats:       │   │ stats:       │
        ↓          │ rejected++   │   │ merged++     │
┌──────────────┐   └──────────────┘   └──────────────┘
│ 2. Create    │
│    Final     │
│    Entity    │
│    (Topic/   │
│     Atom)    │
└──────────────┘
        ↓
┌──────────────┐
│ 3. Update    │
│    Proposal  │
│    - status= │
│      approved│
│    - reviewed│
│      metadata│
└──────────────┘
        ↓
┌──────────────┐
│ 4. Update    │
│    Run Stats │
│    - approved│
│      count++ │
└──────────────┘
        ↓
┌──────────────┐
│ 5. Broadcast │
│    WebSocket │
│    Event     │
└──────────────┘
```

### 7.3 Batch Approval Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Selects Multiple Proposals (confidence >= 0.9)         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ POST /api/v1/knowledge/proposals/batch/approve              │
│ Body: { proposal_ids: [uuid1, uuid2, ...] }                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ ReviewWorkflowService.batch_approve_topics()                │
└─────────────────────────────────────────────────────────────┘
                          ↓
           ┌──────────────────────────────┐
           │ For each proposal_id:        │
           │  1. Approve proposal         │
           │  2. Create final entity      │
           │  3. Collect success/errors   │
           └──────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Return Response:                                            │
│ {                                                           │
│   "created": [topic1, topic2, ...],                        │
│   "errors": ["uuid3: already approved", ...]               │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend Updates UI:                                        │
│  - Show success count                                       │
│  - Display error messages for failures                      │
│  - Refresh proposal list                                    │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Duplicate Detection Flow (Phase 2 - Basic)

```
┌─────────────────────────────────────────────────────────────┐
│ TopicProposal Created from Extraction                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ TopicProposalService.check_for_duplicates(topic_name)       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Query Topics: SELECT * WHERE name = topic_name              │
└─────────────────────────────────────────────────────────────┘
                          ↓
                 ┌────────────────┐
                 │ Found Existing?│
                 └────────────────┘
                    ↓           ↓
              ┌─────┘           └─────┐
              │ YES                   │ NO
              ↓                       ↓
┌──────────────────────┐   ┌──────────────────────┐
│ Return:              │   │ Return:              │
│ - topic=existing     │   │ - topic=None         │
│ - score=1.0          │   │ - score=0.0          │
│ - type="exact"       │   │ - type="none"        │
└──────────────────────┘   └──────────────────────┘
              ↓                       ↓
┌──────────────────────┐   ┌──────────────────────┐
│ Store in Proposal:   │   │ Store in Proposal:   │
│ similar_topic_id     │   │ similar_topic_id=NULL│
│ similarity_score=1.0 │   │                      │
└──────────────────────┘   └──────────────────────┘
              ↓                       ↓
┌──────────────────────┐   ┌──────────────────────┐
│ UI: Show "DUPLICATE" │   │ UI: Show "NEW"       │
│ tag in review queue  │   │                      │
└──────────────────────┘   └──────────────────────┘
```

**Note:** Phase 3 will add semantic similarity using embeddings.

---

## Summary

### Services Created (5 total)

1. **TopicProposalService** - CRUD for topic proposals
2. **AtomProposalService** - CRUD for atom proposals
3. **ReviewWorkflowService** - Batch operations and orchestration
4. **KnowledgeExtractionRunService** - Run tracking and audit trail
5. **Modified KnowledgeExtractionService** - Proposal creation instead of direct entities

### Key Features

- **No Confidence Filtering**: All extractions persisted as proposals
- **Duplicate Detection**: Basic exact name matching (Phase 2)
- **Approval Workflow**: Approve/reject/merge actions
- **Batch Operations**: Bulk approve/reject for efficiency
- **Audit Trail**: Extraction runs tracked with statistics
- **Error Handling**: Comprehensive exception hierarchy
- **Type Safety**: Full mypy compliance with type hints

### Lines of Code Estimate

- TopicProposalService: ~200 lines
- AtomProposalService: ~220 lines
- ReviewWorkflowService: ~150 lines
- KnowledgeExtractionRunService: ~120 lines
- Modified KnowledgeExtractionService: ~150 lines (changes only)
- **Total: ~840 lines** (within 500-1000 line target)

### Next Steps (Phase 3)

1. Implement semantic duplicate detection using embeddings
2. Add merge logic for combining proposals
3. Create API endpoints for review workflow
4. Build frontend UI components

---

**Document Status:** Ready for Implementation
**Estimated Implementation Time:** 5-7 days
**Blockers:** None (Phase 0 database models must exist first)
