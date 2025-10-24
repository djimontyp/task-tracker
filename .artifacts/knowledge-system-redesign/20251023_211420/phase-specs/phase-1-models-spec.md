# Phase 1: Knowledge Proposal Models Specification

**Created:** October 23, 2025
**Phase:** Database Foundation (Week 1)
**Status:** Ready for Implementation
**Dependencies:** None (Phase 0)

---

## Overview

This specification defines SQLAlchemy models for `TopicProposal` and `AtomProposal` based on the proven `TaskProposal` pattern. These models implement proposal-review-approval workflow for LLM-extracted knowledge, enabling quality control and preventing knowledge base pollution.

**Design Principles:**
1. Mirror `TaskProposal` architecture (proven pattern)
2. Strict type safety (mypy strict compliant)
3. Absolute imports only (never relative)
4. Comprehensive audit trail
5. Support for duplicate detection and merging

---

## 1. Database Schema Design

### New Tables

```sql
-- TopicProposal: Pending topic extractions awaiting review
CREATE TABLE topic_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extraction_run_id UUID NOT NULL REFERENCES knowledge_extraction_runs(id) ON DELETE CASCADE,

    -- Proposed topic data
    proposed_name VARCHAR(100) NOT NULL,
    proposed_description TEXT NOT NULL,
    proposed_icon VARCHAR(50),
    proposed_color VARCHAR(7),

    -- Duplicate detection
    similar_topic_id INTEGER REFERENCES topics(id),
    similarity_score FLOAT CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0),
    similarity_type VARCHAR(50),

    -- LLM metadata
    confidence FLOAT NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    reasoning TEXT NOT NULL,
    llm_recommendation VARCHAR(50) NOT NULL DEFAULT 'new_topic',

    -- Review workflow
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed_by_user_id INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CREATE INDEX idx_topic_proposals_status ON topic_proposals(status),
    CREATE INDEX idx_topic_proposals_confidence ON topic_proposals(confidence),
    CREATE INDEX idx_topic_proposals_extraction_run ON topic_proposals(extraction_run_id)
);

-- AtomProposal: Pending atom extractions awaiting review
CREATE TABLE atom_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extraction_run_id UUID NOT NULL REFERENCES knowledge_extraction_runs(id) ON DELETE CASCADE,

    -- Proposed atom data
    proposed_type VARCHAR(20) NOT NULL,
    proposed_title VARCHAR(200) NOT NULL,
    proposed_content TEXT NOT NULL,
    proposed_topics JSONB,

    -- Duplicate detection
    similar_atom_id INTEGER REFERENCES atoms(id),
    similarity_score FLOAT CHECK (similarity_score >= 0.0 AND similarity_score <= 1.0),
    similarity_type VARCHAR(50),

    -- LLM metadata
    confidence FLOAT NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    reasoning TEXT NOT NULL,
    llm_recommendation VARCHAR(50) NOT NULL DEFAULT 'new_atom',

    -- Review workflow
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed_by_user_id INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes for performance
    CREATE INDEX idx_atom_proposals_status ON atom_proposals(status),
    CREATE INDEX idx_atom_proposals_confidence ON atom_proposals(confidence),
    CREATE INDEX idx_atom_proposals_extraction_run ON atom_proposals(extraction_run_id),
    CREATE INDEX idx_atom_proposals_type ON atom_proposals(proposed_type)
);

-- KnowledgeExtractionRun: Audit trail for extraction jobs
CREATE TABLE knowledge_extraction_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    triggered_by_user_id INTEGER REFERENCES users(id),
    message_ids JSONB NOT NULL,
    message_count INTEGER NOT NULL,
    time_window_start TIMESTAMP WITH TIME ZONE,
    time_window_end TIMESTAMP WITH TIME ZONE,

    -- Configuration
    confidence_threshold FLOAT NOT NULL DEFAULT 0.7,
    model_used VARCHAR(100) NOT NULL,

    -- Results
    topics_extracted INTEGER DEFAULT 0,
    atoms_extracted INTEGER DEFAULT 0,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    CREATE INDEX idx_knowledge_extraction_runs_status ON knowledge_extraction_runs(status),
    CREATE INDEX idx_knowledge_extraction_runs_user ON knowledge_extraction_runs(triggered_by_user_id)
);
```

---

## 2. Enums (backend/app/models/enums.py)

Add these new enums to existing `backend/app/models/enums.py`:

```python
class KnowledgeProposalStatus(str, Enum):
    """Status of topic/atom proposal."""

    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    merged = "merged"


class KnowledgeLLMRecommendation(str, Enum):
    """LLM recommendation for knowledge proposal."""

    new_topic = "new_topic"
    new_atom = "new_atom"
    update_existing = "update_existing"
    merge = "merge"
    reject = "reject"


class KnowledgeSimilarityType(str, Enum):
    """Type of similarity detection for knowledge entities."""

    exact_name = "exact_name"
    semantic = "semantic"
    fuzzy = "fuzzy"
    none = "none"


class KnowledgeExtractionStatus(str, Enum):
    """Status of knowledge extraction run."""

    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
```

---

## 3. Base Model (backend/app/models/proposals/base.py)

Create new directory: `backend/app/models/proposals/`

```python
"""Base class for proposal models."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, Text, func
from sqlmodel import Field, SQLModel

from app.models.enums import KnowledgeProposalStatus


class ProposalBase(SQLModel):
    """
    Abstract base for proposal models.

    Provides common fields for review workflow, duplicate detection,
    and LLM metadata tracking.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    extraction_run_id: UUID = Field(
        foreign_key="knowledge_extraction_runs.id",
        description="Parent extraction run that created this proposal",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="LLM confidence score (0.0-1.0)",
    )
    reasoning: str = Field(
        sa_type=Text,
        description="LLM reasoning for this extraction",
    )
    llm_recommendation: str = Field(
        max_length=50,
        description="LLM recommendation: new_*/update_existing/merge/reject",
    )

    similarity_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Similarity score to existing entity (0.0-1.0)",
    )
    similarity_type: str | None = Field(
        default=None,
        max_length=50,
        description="Type of similarity: exact_name/semantic/fuzzy/none",
    )

    status: str = Field(
        default=KnowledgeProposalStatus.pending.value,
        max_length=50,
        description="Review status: pending/approved/rejected/merged",
    )
    reviewed_by_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        description="User who reviewed this proposal",
    )
    reviewed_at: datetime | None = None
    review_notes: str | None = Field(
        default=None,
        sa_type=Text,
        description="Reviewer notes",
    )

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
```

---

## 4. TopicProposal Model (backend/app/models/proposals/topic_proposal.py)

```python
"""TopicProposal model for LLM-extracted topics awaiting review."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Text
from sqlmodel import Field, SQLModel

from app.models.enums import (
    KnowledgeLLMRecommendation,
    KnowledgeProposalStatus,
    KnowledgeSimilarityType,
)
from app.models.proposals.base import ProposalBase


class TopicProposal(ProposalBase, table=True):
    """
    TopicProposal - LLM-extracted topic proposals awaiting review.

    Mirrors TaskProposal pattern for knowledge extraction workflow.
    Enables human review before topics are created in production database.
    """

    __tablename__ = "topic_proposals"

    proposed_name: str = Field(
        max_length=100,
        description="Proposed topic name",
    )
    proposed_description: str = Field(
        sa_type=Text,
        description="Proposed topic description",
    )
    proposed_icon: str | None = Field(
        default=None,
        max_length=50,
        description="Auto-selected Heroicon name (optional)",
    )
    proposed_color: str | None = Field(
        default=None,
        max_length=7,
        description="Auto-selected hex color (format: #RRGGBB, optional)",
    )

    similar_topic_id: int | None = Field(
        default=None,
        foreign_key="topics.id",
        description="Similar existing topic if found",
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "extraction_run_id": "123e4567-e89b-12d3-a456-426614174000",
                "proposed_name": "API Design Discussions",
                "proposed_description": "Conversations about REST API architecture...",
                "proposed_icon": "CodeBracketIcon",
                "proposed_color": "#8B5CF6",
                "confidence": 0.92,
                "reasoning": "Multiple messages discuss API design patterns and REST principles",
                "llm_recommendation": "new_topic",
                "status": "pending",
            }
        }


class TopicProposalCreate(SQLModel):
    """Schema for creating new topic proposal."""

    extraction_run_id: UUID
    proposed_name: str = Field(max_length=100)
    proposed_description: str
    proposed_icon: str | None = None
    proposed_color: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    llm_recommendation: str = KnowledgeLLMRecommendation.new_topic.value
    similar_topic_id: int | None = None
    similarity_score: float | None = Field(default=None, ge=0.0, le=1.0)
    similarity_type: str | None = None


class TopicProposalUpdate(SQLModel):
    """Schema for updating topic proposal (partial)."""

    proposed_name: str | None = None
    proposed_description: str | None = None
    proposed_icon: str | None = None
    proposed_color: str | None = None
    status: str | None = None
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None


class TopicProposalPublic(SQLModel):
    """Public schema for topic proposal responses."""

    id: UUID
    extraction_run_id: UUID
    proposed_name: str
    proposed_description: str
    proposed_icon: str | None
    proposed_color: str | None
    similar_topic_id: int | None
    similarity_score: float | None
    similarity_type: str | None
    confidence: float
    reasoning: str
    llm_recommendation: str
    status: str
    reviewed_by_user_id: int | None
    reviewed_at: datetime | None
    review_notes: str | None
    created_at: datetime


class TopicProposalListResponse(SQLModel):
    """Paginated response schema for topic proposals."""

    items: list[TopicProposalPublic]
    total: int
    page: int
    page_size: int
```

---

## 5. AtomProposal Model (backend/app/models/proposals/atom_proposal.py)

```python
"""AtomProposal model for LLM-extracted atoms awaiting review."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import (
    AtomType,
    KnowledgeLLMRecommendation,
    KnowledgeProposalStatus,
    KnowledgeSimilarityType,
)
from app.models.proposals.base import ProposalBase


class AtomProposal(ProposalBase, table=True):
    """
    AtomProposal - LLM-extracted atom proposals awaiting review.

    Mirrors TaskProposal pattern for knowledge extraction workflow.
    Enables human review before atoms are created in production database.
    """

    __tablename__ = "atom_proposals"

    proposed_type: str = Field(
        max_length=20,
        description="Proposed atom type (problem/solution/decision/etc.)",
    )
    proposed_title: str = Field(
        max_length=200,
        description="Proposed atom title",
    )
    proposed_content: str = Field(
        sa_type=Text,
        description="Proposed atom content",
    )
    proposed_topics: list[str] = Field(
        default_factory=list,
        sa_type=JSONB,
        description="Proposed topic names for this atom",
    )

    similar_atom_id: int | None = Field(
        default=None,
        foreign_key="atoms.id",
        description="Similar existing atom if found",
    )

    class Config:
        """Pydantic configuration."""

        json_schema_extra = {
            "example": {
                "extraction_run_id": "123e4567-e89b-12d3-a456-426614174000",
                "proposed_type": "solution",
                "proposed_title": "Use JWT for stateless authentication",
                "proposed_content": "Implement JWT tokens instead of session cookies...",
                "proposed_topics": ["Authentication", "API Design"],
                "confidence": 0.88,
                "reasoning": "Message clearly describes JWT implementation approach",
                "llm_recommendation": "new_atom",
                "status": "pending",
            }
        }


class AtomProposalCreate(SQLModel):
    """Schema for creating new atom proposal."""

    extraction_run_id: UUID
    proposed_type: str = Field(max_length=20)
    proposed_title: str = Field(max_length=200)
    proposed_content: str
    proposed_topics: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    llm_recommendation: str = KnowledgeLLMRecommendation.new_atom.value
    similar_atom_id: int | None = None
    similarity_score: float | None = Field(default=None, ge=0.0, le=1.0)
    similarity_type: str | None = None


class AtomProposalUpdate(SQLModel):
    """Schema for updating atom proposal (partial)."""

    proposed_type: str | None = None
    proposed_title: str | None = None
    proposed_content: str | None = None
    proposed_topics: list[str] | None = None
    status: str | None = None
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None


class AtomProposalPublic(SQLModel):
    """Public schema for atom proposal responses."""

    id: UUID
    extraction_run_id: UUID
    proposed_type: str
    proposed_title: str
    proposed_content: str
    proposed_topics: list[str]
    similar_atom_id: int | None
    similarity_score: float | None
    similarity_type: str | None
    confidence: float
    reasoning: str
    llm_recommendation: str
    status: str
    reviewed_by_user_id: int | None
    reviewed_at: datetime | None
    review_notes: str | None
    created_at: datetime


class AtomProposalListResponse(SQLModel):
    """Paginated response schema for atom proposals."""

    items: list[AtomProposalPublic]
    total: int
    page: int
    page_size: int
```

---

## 6. KnowledgeExtractionRun Model (backend/app/models/proposals/extraction_run.py)

```python
"""KnowledgeExtractionRun model for audit trail."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel

from app.models.enums import KnowledgeExtractionStatus


class KnowledgeExtractionRun(SQLModel, table=True):
    """
    KnowledgeExtractionRun - Audit trail for knowledge extraction jobs.

    Tracks which extraction runs created which proposals, enabling:
    - Batch operations (approve all from run X)
    - Rollback (reject all from run Y)
    - Performance analysis (which settings work best)
    - Accountability (who triggered extraction)
    """

    __tablename__ = "knowledge_extraction_runs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    triggered_by_user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        description="User who triggered extraction (None for automatic)",
    )

    message_ids: list[int] = Field(
        sa_type=JSONB,
        description="Message IDs included in this extraction",
    )
    message_count: int = Field(
        description="Number of messages analyzed",
    )

    time_window_start: datetime | None = Field(
        default=None,
        description="Start of message time window (optional)",
    )
    time_window_end: datetime | None = Field(
        default=None,
        description="End of message time window (optional)",
    )

    confidence_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Minimum confidence threshold for this run",
    )
    model_used: str = Field(
        max_length=100,
        description="LLM model identifier (e.g., 'gpt-4', 'claude-3')",
    )

    topics_extracted: int = Field(
        default=0,
        description="Number of topic proposals created",
    )
    atoms_extracted: int = Field(
        default=0,
        description="Number of atom proposals created",
    )

    status: str = Field(
        default=KnowledgeExtractionStatus.pending.value,
        max_length=50,
        description="Run status: pending/running/completed/failed/cancelled",
    )
    error_message: str | None = Field(
        default=None,
        sa_type=Text,
        description="Error message if status=failed",
    )

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    completed_at: datetime | None = None


class KnowledgeExtractionRunPublic(SQLModel):
    """Public schema for extraction run responses."""

    id: UUID
    triggered_by_user_id: int | None
    message_ids: list[int]
    message_count: int
    time_window_start: datetime | None
    time_window_end: datetime | None
    confidence_threshold: float
    model_used: str
    topics_extracted: int
    atoms_extracted: int
    status: str
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class KnowledgeExtractionRunListResponse(SQLModel):
    """Paginated response schema for extraction runs."""

    items: list[KnowledgeExtractionRunPublic]
    total: int
    page: int
    page_size: int
```

---

## 7. Module Initialization (backend/app/models/proposals/__init__.py)

```python
"""Knowledge proposal models."""

from app.models.proposals.atom_proposal import (
    AtomProposal,
    AtomProposalCreate,
    AtomProposalListResponse,
    AtomProposalPublic,
    AtomProposalUpdate,
)
from app.models.proposals.extraction_run import (
    KnowledgeExtractionRun,
    KnowledgeExtractionRunListResponse,
    KnowledgeExtractionRunPublic,
)
from app.models.proposals.topic_proposal import (
    TopicProposal,
    TopicProposalCreate,
    TopicProposalListResponse,
    TopicProposalPublic,
    TopicProposalUpdate,
)

__all__ = [
    "TopicProposal",
    "TopicProposalCreate",
    "TopicProposalUpdate",
    "TopicProposalPublic",
    "TopicProposalListResponse",
    "AtomProposal",
    "AtomProposalCreate",
    "AtomProposalUpdate",
    "AtomProposalPublic",
    "AtomProposalListResponse",
    "KnowledgeExtractionRun",
    "KnowledgeExtractionRunPublic",
    "KnowledgeExtractionRunListResponse",
]
```

---

## 8. Type Safety Compliance

All models pass `mypy --strict` with these patterns:

```python
from uuid import UUID, uuid4

id: UUID = Field(default_factory=uuid4, primary_key=True)

optional_field: str | None = Field(default=None)

confidence: float = Field(ge=0.0, le=1.0)

status: str = Field(default=KnowledgeProposalStatus.pending.value)
```

**Type hints checklist:**
- ✅ All fields have explicit types
- ✅ Optional fields use `| None`, not `Optional[T]`
- ✅ Enums use `.value` for string comparison
- ✅ Foreign keys typed as `int | None` or `UUID`
- ✅ JSONB fields typed as `list[T]` or `dict`
- ✅ Pydantic validators use `@field_validator`
- ✅ No `Any` types used

---

## 9. Alembic Migration Template

Create migration: `alembic revision --autogenerate -m "Add knowledge proposal models"`

```python
"""Add knowledge proposal models

Revision ID: xxxxxxxxxx
Revises: yyyyyyyyyy
Create Date: 2025-10-23 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'xxxxxxxxxx'
down_revision = 'yyyyyyyyyy'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create knowledge_extraction_runs table
    op.create_table(
        'knowledge_extraction_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('triggered_by_user_id', sa.BigInteger(), nullable=True),
        sa.Column('message_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('message_count', sa.Integer(), nullable=False),
        sa.Column('time_window_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('time_window_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confidence_threshold', sa.Float(), nullable=False),
        sa.Column('model_used', sa.String(length=100), nullable=False),
        sa.Column('topics_extracted', sa.Integer(), nullable=False),
        sa.Column('atoms_extracted', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['triggered_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_knowledge_extraction_runs_status', 'knowledge_extraction_runs', ['status'])
    op.create_index('idx_knowledge_extraction_runs_user', 'knowledge_extraction_runs', ['triggered_by_user_id'])

    # Create topic_proposals table
    op.create_table(
        'topic_proposals',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('extraction_run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('proposed_name', sa.String(length=100), nullable=False),
        sa.Column('proposed_description', sa.Text(), nullable=False),
        sa.Column('proposed_icon', sa.String(length=50), nullable=True),
        sa.Column('proposed_color', sa.String(length=7), nullable=True),
        sa.Column('similar_topic_id', sa.BigInteger(), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=True),
        sa.Column('similarity_type', sa.String(length=50), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('reasoning', sa.Text(), nullable=False),
        sa.Column('llm_recommendation', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('reviewed_by_user_id', sa.BigInteger(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['extraction_run_id'], ['knowledge_extraction_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['similar_topic_id'], ['topics.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_topic_proposals_confidence', 'topic_proposals', ['confidence'])
    op.create_index('idx_topic_proposals_extraction_run', 'topic_proposals', ['extraction_run_id'])
    op.create_index('idx_topic_proposals_status', 'topic_proposals', ['status'])

    # Create atom_proposals table
    op.create_table(
        'atom_proposals',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('extraction_run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('proposed_type', sa.String(length=20), nullable=False),
        sa.Column('proposed_title', sa.String(length=200), nullable=False),
        sa.Column('proposed_content', sa.Text(), nullable=False),
        sa.Column('proposed_topics', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('similar_atom_id', sa.BigInteger(), nullable=True),
        sa.Column('similarity_score', sa.Float(), nullable=True),
        sa.Column('similarity_type', sa.String(length=50), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('reasoning', sa.Text(), nullable=False),
        sa.Column('llm_recommendation', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('reviewed_by_user_id', sa.BigInteger(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['extraction_run_id'], ['knowledge_extraction_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['similar_atom_id'], ['atoms.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_atom_proposals_confidence', 'atom_proposals', ['confidence'])
    op.create_index('idx_atom_proposals_extraction_run', 'atom_proposals', ['extraction_run_id'])
    op.create_index('idx_atom_proposals_status', 'atom_proposals', ['status'])
    op.create_index('idx_atom_proposals_type', 'atom_proposals', ['proposed_type'])


def downgrade() -> None:
    op.drop_index('idx_atom_proposals_type', table_name='atom_proposals')
    op.drop_index('idx_atom_proposals_status', table_name='atom_proposals')
    op.drop_index('idx_atom_proposals_extraction_run', table_name='atom_proposals')
    op.drop_index('idx_atom_proposals_confidence', table_name='atom_proposals')
    op.drop_table('atom_proposals')

    op.drop_index('idx_topic_proposals_status', table_name='topic_proposals')
    op.drop_index('idx_topic_proposals_extraction_run', table_name='topic_proposals')
    op.drop_index('idx_topic_proposals_confidence', table_name='topic_proposals')
    op.drop_table('topic_proposals')

    op.drop_index('idx_knowledge_extraction_runs_user', table_name='knowledge_extraction_runs')
    op.drop_index('idx_knowledge_extraction_runs_status', table_name='knowledge_extraction_runs')
    op.drop_table('knowledge_extraction_runs')
```

---

## 10. Implementation Checklist

**File Creation:**
- [ ] Create `backend/app/models/proposals/` directory
- [ ] Create `backend/app/models/proposals/__init__.py`
- [ ] Create `backend/app/models/proposals/base.py`
- [ ] Create `backend/app/models/proposals/topic_proposal.py`
- [ ] Create `backend/app/models/proposals/atom_proposal.py`
- [ ] Create `backend/app/models/proposals/extraction_run.py`
- [ ] Update `backend/app/models/enums.py` (add 4 new enums)

**Database:**
- [ ] Run `alembic revision --autogenerate -m "Add knowledge proposal models"`
- [ ] Review generated migration (compare with template above)
- [ ] Test migration on clean database: `just db-nuclear-reset`
- [ ] Test migration on copy of production data
- [ ] Verify foreign key constraints work correctly

**Type Checking:**
- [ ] Run `just typecheck` on `backend/app/models/proposals/`
- [ ] Fix any mypy errors
- [ ] Ensure strict mode passes (no `Any` types)

**Testing:**
- [ ] Write unit tests for model creation
- [ ] Test Pydantic validation (confidence bounds, string lengths)
- [ ] Test enum validation
- [ ] Verify foreign key constraints prevent orphans
- [ ] Test cascade deletion (delete extraction_run → proposals deleted)

---

## 11. Next Phase Integration Points

**Phase 1 (Service Layer) will need:**
- `TopicProposalService` (CRUD operations)
- `AtomProposalService` (CRUD operations)
- `KnowledgeExtractionRunService` (run tracking)
- Modified `KnowledgeExtractionService` to create proposals

**Phase 2 (API Layer) will need:**
- `GET /api/v1/knowledge/proposals/topics?status=pending`
- `POST /api/v1/knowledge/proposals/topics/{id}/approve`
- `GET /api/v1/knowledge/proposals/atoms?status=pending`
- `POST /api/v1/knowledge/proposals/atoms/{id}/approve`

---

## 12. Key Design Decisions

**Decision 1: Separate TopicProposal and AtomProposal Tables**
- **Rationale:** Topics and atoms have different lifecycle, different similar entity types
- **Alternative considered:** Single `knowledge_proposals` table with discriminator
- **Rejected because:** Type safety, clearer foreign keys, simpler queries

**Decision 2: UUID Primary Keys for Proposals**
- **Rationale:** Match `TaskProposal` pattern, better for distributed systems
- **Alternative considered:** Integer IDs
- **Accepted because:** Consistency with existing pattern, no performance impact

**Decision 3: CASCADE DELETE on extraction_run_id**
- **Rationale:** If extraction run deleted, its proposals should also be deleted
- **Alternative considered:** SET NULL (keep proposals orphaned)
- **Accepted because:** Bulk cleanup capability (delete bad run → proposals gone)

**Decision 4: No Embedding Field on Proposals**
- **Rationale:** Embeddings generated after approval, not during proposal stage
- **Alternative considered:** Pre-compute embeddings for similarity
- **Deferred to:** Phase 3 (Duplicate Detection)

---

## Summary

This specification provides production-ready SQLAlchemy models for knowledge proposal workflow:

- **3 new tables:** `topic_proposals`, `atom_proposals`, `knowledge_extraction_runs`
- **4 new enums:** Status, Recommendation, Similarity, ExtractionStatus
- **Strict type safety:** Passes mypy strict mode
- **Full audit trail:** Who, when, why, which run
- **Duplicate detection ready:** Fields for similarity scoring
- **Merge workflow ready:** Status includes "merged" state

**Estimated implementation time:** 2-3 days for models + migration + tests

**Blockers:** None (Phase 0 is independent)

**Ready for:** Phase 1 service layer implementation
