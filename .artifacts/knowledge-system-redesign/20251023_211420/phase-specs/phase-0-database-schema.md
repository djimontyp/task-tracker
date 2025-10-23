# Phase 0: Database Schema Specification

**Created:** October 23, 2025
**Status:** Ready for Implementation
**Phase:** Database Foundation

---

## Overview

Complete database schema for Knowledge Proposal System following the proven TaskProposal pattern. This schema transforms knowledge extraction from direct creation to proposal-review-approval workflow.

---

## Schema Design Principles

1. **Follow TaskProposal Pattern**: Mirror the successful task proposal architecture
2. **Type Safety**: Use enums for all status and type fields
3. **Audit Trail**: Track all review actions and extraction runs
4. **Performance**: Strategic indexes for common query patterns
5. **Data Integrity**: Foreign keys with proper cascade behavior
6. **Versioning**: Support for revision history and rollback

---

## New Tables

### 1. knowledge_extraction_runs

Tracks each extraction run for audit trail and traceability (similar to `analysis_runs`).

```sql
CREATE TABLE knowledge_extraction_runs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Time window for extraction
    time_window_start TIMESTAMPTZ NOT NULL,
    time_window_end TIMESTAMPTZ NOT NULL,

    -- Configuration snapshot (for reproducibility)
    config_snapshot JSONB NOT NULL,
    llm_provider_id UUID REFERENCES llm_providers(id) ON DELETE SET NULL,
    model_name VARCHAR(100),

    -- Trigger metadata
    trigger_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'batch'
    triggered_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,

    -- Execution lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
        -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Processing statistics
    messages_analyzed INT NOT NULL DEFAULT 0,
    topic_proposals_created INT NOT NULL DEFAULT 0,
    atom_proposals_created INT NOT NULL DEFAULT 0,

    -- LLM usage tracking
    llm_tokens_used INT NOT NULL DEFAULT 0,
    cost_estimate DECIMAL(10, 4) NOT NULL DEFAULT 0.0,

    -- Results
    error_log JSONB,
    extraction_summary JSONB
        -- {
        --   "topics_by_confidence": {"high": 5, "medium": 3, "low": 2},
        --   "atoms_by_type": {"insight": 10, "problem": 5},
        --   "duplicates_found": 3,
        --   "processing_time_seconds": 45.2
        -- }
);

-- Indexes for common queries
CREATE INDEX idx_knowledge_extraction_runs_status
    ON knowledge_extraction_runs(status);
CREATE INDEX idx_knowledge_extraction_runs_created_at
    ON knowledge_extraction_runs(created_at DESC);
CREATE INDEX idx_knowledge_extraction_runs_triggered_by
    ON knowledge_extraction_runs(triggered_by_user_id);
```

### 2. topic_proposals

Proposed topics awaiting review (mirrors TaskProposal structure).

```sql
CREATE TABLE topic_proposals (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent extraction run
    extraction_run_id UUID NOT NULL
        REFERENCES knowledge_extraction_runs(id) ON DELETE CASCADE,

    -- Proposed topic data
    proposed_name VARCHAR(100) NOT NULL,
    proposed_description TEXT NOT NULL,
    proposed_icon VARCHAR(50),
    proposed_color VARCHAR(7),

    -- Source tracking for duplicate detection
    source_message_ids JSONB NOT NULL,
        -- [12345, 12346, 12347]
    message_count INT NOT NULL,

    -- Duplicate detection
    similar_topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,
    similarity_score DECIMAL(5, 4),
        -- 0.0000 to 1.0000
    similarity_type VARCHAR(50),
        -- 'exact_name', 'semantic', 'fuzzy', 'none'
    diff_summary JSONB,
        -- {
        --   "name_difference": "Finance vs Budget",
        --   "description_overlap": 0.85,
        --   "suggested_action": "merge"
        -- }

    -- LLM metadata
    llm_recommendation VARCHAR(50) NOT NULL DEFAULT 'new_topic',
        -- 'new_topic', 'merge_existing', 'reject'
    confidence DECIMAL(5, 4) NOT NULL,
        -- 0.0000 to 1.0000
    reasoning TEXT NOT NULL,
        -- LLM explanation for this proposal
    extraction_context JSONB,
        -- {
        --   "keywords_found": ["budget", "finance", "spending"],
        --   "message_themes": ["personal finance", "tracking expenses"]
        -- }

    -- Review workflow
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
        -- 'pending', 'approved', 'rejected', 'merged'
    reviewed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_action VARCHAR(50),
        -- 'approve', 'reject', 'merge', 'edit'
    review_notes TEXT,

    -- Link to created entity (after approval)
    created_topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,
    merged_into_topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_topic_proposals_status ON topic_proposals(status);
CREATE INDEX idx_topic_proposals_confidence ON topic_proposals(confidence DESC);
CREATE INDEX idx_topic_proposals_extraction_run
    ON topic_proposals(extraction_run_id);
CREATE INDEX idx_topic_proposals_created_at
    ON topic_proposals(created_at DESC);
CREATE INDEX idx_topic_proposals_reviewed_by
    ON topic_proposals(reviewed_by_user_id);
CREATE INDEX idx_topic_proposals_similar_topic
    ON topic_proposals(similar_topic_id);

-- Composite index for review queue
CREATE INDEX idx_topic_proposals_review_queue
    ON topic_proposals(status, confidence DESC, created_at DESC);
```

### 3. atom_proposals

Proposed atoms awaiting review (mirrors topic_proposals).

```sql
CREATE TABLE atom_proposals (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent extraction run
    extraction_run_id UUID NOT NULL
        REFERENCES knowledge_extraction_runs(id) ON DELETE CASCADE,

    -- Proposed atom data
    proposed_type VARCHAR(20) NOT NULL,
        -- 'problem', 'solution', 'decision', 'question', 'insight', 'pattern', 'requirement'
    proposed_title VARCHAR(200) NOT NULL,
    proposed_content TEXT NOT NULL,
    proposed_meta JSONB,

    -- Topic assignment proposal
    proposed_topic_id BIGINT REFERENCES topics(id) ON DELETE SET NULL,
    proposed_topic_note TEXT,

    -- Source tracking
    source_message_ids JSONB NOT NULL,
    message_count INT NOT NULL,

    -- Duplicate detection
    similar_atom_id BIGINT REFERENCES atoms(id) ON DELETE SET NULL,
    similarity_score DECIMAL(5, 4),
    similarity_type VARCHAR(50),
    diff_summary JSONB,

    -- LLM metadata
    llm_recommendation VARCHAR(50) NOT NULL DEFAULT 'new_atom',
    confidence DECIMAL(5, 4) NOT NULL,
    reasoning TEXT NOT NULL,
    extraction_context JSONB,

    -- Relationship proposals (links to other atoms)
    proposed_links JSONB,
        -- [
        --   {"to_atom_id": 123, "link_type": "solves", "strength": 0.9},
        --   {"to_atom_id": 456, "link_type": "continues", "strength": 0.7}
        -- ]

    -- Review workflow
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_action VARCHAR(50),
    review_notes TEXT,

    -- Link to created entity (after approval)
    created_atom_id BIGINT REFERENCES atoms(id) ON DELETE SET NULL,
    merged_into_atom_id BIGINT REFERENCES atoms(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_atom_proposals_status ON atom_proposals(status);
CREATE INDEX idx_atom_proposals_confidence ON atom_proposals(confidence DESC);
CREATE INDEX idx_atom_proposals_type ON atom_proposals(proposed_type);
CREATE INDEX idx_atom_proposals_extraction_run
    ON atom_proposals(extraction_run_id);
CREATE INDEX idx_atom_proposals_created_at
    ON atom_proposals(created_at DESC);
CREATE INDEX idx_atom_proposals_reviewed_by
    ON atom_proposals(reviewed_by_user_id);
CREATE INDEX idx_atom_proposals_similar_atom
    ON atom_proposals(similar_atom_id);
CREATE INDEX idx_atom_proposals_proposed_topic
    ON atom_proposals(proposed_topic_id);

-- Composite index for review queue
CREATE INDEX idx_atom_proposals_review_queue
    ON atom_proposals(status, confidence DESC, created_at DESC);
```

### 4. topic_revisions

Version history for topics (enables rollback and audit trail).

```sql
CREATE TABLE topic_revisions (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Topic being versioned
    topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,

    -- Snapshot of topic data at this revision
    revision_number INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),

    -- Change metadata
    change_type VARCHAR(50) NOT NULL,
        -- 'created', 'updated', 'merged_from_proposal', 'manual_edit'
    changed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_reason TEXT,

    -- Link to proposal if created from one
    source_proposal_id UUID REFERENCES topic_proposals(id) ON DELETE SET NULL,

    -- Diff from previous revision
    changes JSONB
        -- {
        --   "name": {"old": "Finance", "new": "Personal Finance"},
        --   "description": {"old": "...", "new": "..."}
        -- }
);

-- Indexes
CREATE INDEX idx_topic_revisions_topic_id
    ON topic_revisions(topic_id, revision_number DESC);
CREATE INDEX idx_topic_revisions_changed_at
    ON topic_revisions(changed_at DESC);
CREATE UNIQUE INDEX idx_topic_revisions_unique
    ON topic_revisions(topic_id, revision_number);
```

### 5. atom_revisions

Version history for atoms.

```sql
CREATE TABLE atom_revisions (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Atom being versioned
    atom_id BIGINT NOT NULL REFERENCES atoms(id) ON DELETE CASCADE,

    -- Snapshot of atom data at this revision
    revision_number INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    confidence DECIMAL(5, 4),
    user_approved BOOLEAN NOT NULL,
    meta JSONB,

    -- Change metadata
    change_type VARCHAR(50) NOT NULL,
    changed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    change_reason TEXT,

    -- Link to proposal if created from one
    source_proposal_id UUID REFERENCES atom_proposals(id) ON DELETE SET NULL,

    -- Diff from previous revision
    changes JSONB
);

-- Indexes
CREATE INDEX idx_atom_revisions_atom_id
    ON atom_revisions(atom_id, revision_number DESC);
CREATE INDEX idx_atom_revisions_changed_at
    ON atom_revisions(changed_at DESC);
CREATE UNIQUE INDEX idx_atom_revisions_unique
    ON atom_revisions(atom_id, revision_number);
```

---

## Enums Addition

Add to `backend/app/models/enums.py`:

```python
class KnowledgeProposalStatus(str, Enum):
    """Status of knowledge proposals (topics/atoms)."""

    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    merged = "merged"


class KnowledgeLLMRecommendation(str, Enum):
    """LLM recommendation for knowledge proposals."""

    new_topic = "new_topic"
    new_atom = "new_atom"
    merge_existing = "merge_existing"
    reject = "reject"


class KnowledgeSimilarityType(str, Enum):
    """Type of similarity detection for knowledge entities."""

    exact_name = "exact_name"
    semantic = "semantic"
    fuzzy = "fuzzy"
    none = "none"


class ExtractionRunStatus(str, Enum):
    """Status of knowledge extraction run."""

    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"
```

---

## Alembic Migration (Upgrade)

File: `backend/alembic/versions/XXXXX_add_knowledge_proposal_system.py`

```python
"""add knowledge proposal system

Revision ID: XXXXX
Revises: 4c301ba5595c
Create Date: 2025-10-23 21:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "XXXXX"
down_revision: Union[str, None] = "4c301ba5595c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add knowledge proposal system tables."""

    # 1. knowledge_extraction_runs
    op.create_table(
        "knowledge_extraction_runs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("time_window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("time_window_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("config_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("llm_provider_id", sa.Uuid(), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("trigger_type", sa.String(length=50), nullable=False),
        sa.Column("triggered_by_user_id", sa.BigInteger(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("messages_analyzed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("topic_proposals_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("atom_proposals_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("llm_tokens_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost_estimate", sa.Numeric(10, 4), nullable=False, server_default="0.0"),
        sa.Column("error_log", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("extraction_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["llm_provider_id"], ["llm_providers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["triggered_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_knowledge_extraction_runs_status", "knowledge_extraction_runs", ["status"])
    op.create_index("idx_knowledge_extraction_runs_created_at", "knowledge_extraction_runs", [sa.text("created_at DESC")])
    op.create_index("idx_knowledge_extraction_runs_triggered_by", "knowledge_extraction_runs", ["triggered_by_user_id"])

    # 2. topic_proposals
    op.create_table(
        "topic_proposals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("extraction_run_id", sa.Uuid(), nullable=False),
        sa.Column("proposed_name", sa.String(length=100), nullable=False),
        sa.Column("proposed_description", sa.Text(), nullable=False),
        sa.Column("proposed_icon", sa.String(length=50), nullable=True),
        sa.Column("proposed_color", sa.String(length=7), nullable=True),
        sa.Column("source_message_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("message_count", sa.Integer(), nullable=False),
        sa.Column("similar_topic_id", sa.BigInteger(), nullable=True),
        sa.Column("similarity_score", sa.Numeric(5, 4), nullable=True),
        sa.Column("similarity_type", sa.String(length=50), nullable=True),
        sa.Column("diff_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("llm_recommendation", sa.String(length=50), nullable=False, server_default="new_topic"),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=False),
        sa.Column("reasoning", sa.Text(), nullable=False),
        sa.Column("extraction_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_action", sa.String(length=50), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("created_topic_id", sa.BigInteger(), nullable=True),
        sa.Column("merged_into_topic_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["extraction_run_id"], ["knowledge_extraction_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["similar_topic_id"], ["topics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_topic_id"], ["topics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["merged_into_topic_id"], ["topics.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_topic_proposals_status", "topic_proposals", ["status"])
    op.create_index("idx_topic_proposals_confidence", "topic_proposals", [sa.text("confidence DESC")])
    op.create_index("idx_topic_proposals_extraction_run", "topic_proposals", ["extraction_run_id"])
    op.create_index("idx_topic_proposals_created_at", "topic_proposals", [sa.text("created_at DESC")])
    op.create_index("idx_topic_proposals_reviewed_by", "topic_proposals", ["reviewed_by_user_id"])
    op.create_index("idx_topic_proposals_similar_topic", "topic_proposals", ["similar_topic_id"])
    op.create_index("idx_topic_proposals_review_queue", "topic_proposals", ["status", sa.text("confidence DESC"), sa.text("created_at DESC")])

    # 3. atom_proposals
    op.create_table(
        "atom_proposals",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("extraction_run_id", sa.Uuid(), nullable=False),
        sa.Column("proposed_type", sa.String(length=20), nullable=False),
        sa.Column("proposed_title", sa.String(length=200), nullable=False),
        sa.Column("proposed_content", sa.Text(), nullable=False),
        sa.Column("proposed_meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("proposed_topic_id", sa.BigInteger(), nullable=True),
        sa.Column("proposed_topic_note", sa.Text(), nullable=True),
        sa.Column("source_message_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("message_count", sa.Integer(), nullable=False),
        sa.Column("similar_atom_id", sa.BigInteger(), nullable=True),
        sa.Column("similarity_score", sa.Numeric(5, 4), nullable=True),
        sa.Column("similarity_type", sa.String(length=50), nullable=True),
        sa.Column("diff_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("llm_recommendation", sa.String(length=50), nullable=False, server_default="new_atom"),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=False),
        sa.Column("reasoning", sa.Text(), nullable=False),
        sa.Column("extraction_context", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("proposed_links", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_action", sa.String(length=50), nullable=True),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("created_atom_id", sa.BigInteger(), nullable=True),
        sa.Column("merged_into_atom_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["extraction_run_id"], ["knowledge_extraction_runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proposed_topic_id"], ["topics.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["similar_atom_id"], ["atoms.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_atom_id"], ["atoms.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["merged_into_atom_id"], ["atoms.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_atom_proposals_status", "atom_proposals", ["status"])
    op.create_index("idx_atom_proposals_confidence", "atom_proposals", [sa.text("confidence DESC")])
    op.create_index("idx_atom_proposals_type", "atom_proposals", ["proposed_type"])
    op.create_index("idx_atom_proposals_extraction_run", "atom_proposals", ["extraction_run_id"])
    op.create_index("idx_atom_proposals_created_at", "atom_proposals", [sa.text("created_at DESC")])
    op.create_index("idx_atom_proposals_reviewed_by", "atom_proposals", ["reviewed_by_user_id"])
    op.create_index("idx_atom_proposals_similar_atom", "atom_proposals", ["similar_atom_id"])
    op.create_index("idx_atom_proposals_proposed_topic", "atom_proposals", ["proposed_topic_id"])
    op.create_index("idx_atom_proposals_review_queue", "atom_proposals", ["status", sa.text("confidence DESC"), sa.text("created_at DESC")])

    # 4. topic_revisions
    op.create_table(
        "topic_revisions",
        sa.Column("id", sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column("topic_id", sa.BigInteger(), nullable=False),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(length=50), nullable=True),
        sa.Column("color", sa.String(length=7), nullable=True),
        sa.Column("change_type", sa.String(length=50), nullable=False),
        sa.Column("changed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("change_reason", sa.Text(), nullable=True),
        sa.Column("source_proposal_id", sa.Uuid(), nullable=True),
        sa.Column("changes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_proposal_id"], ["topic_proposals.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_topic_revisions_topic_id", "topic_revisions", ["topic_id", sa.text("revision_number DESC")])
    op.create_index("idx_topic_revisions_changed_at", "topic_revisions", [sa.text("changed_at DESC")])
    op.create_index("idx_topic_revisions_unique", "topic_revisions", ["topic_id", "revision_number"], unique=True)

    # 5. atom_revisions
    op.create_table(
        "atom_revisions",
        sa.Column("id", sa.BigInteger(), nullable=False, autoincrement=True),
        sa.Column("atom_id", sa.BigInteger(), nullable=False),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Numeric(5, 4), nullable=True),
        sa.Column("user_approved", sa.Boolean(), nullable=False),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("change_type", sa.String(length=50), nullable=False),
        sa.Column("changed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("change_reason", sa.Text(), nullable=True),
        sa.Column("source_proposal_id", sa.Uuid(), nullable=True),
        sa.Column("changes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["atom_id"], ["atoms.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_proposal_id"], ["atom_proposals.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_atom_revisions_atom_id", "atom_revisions", ["atom_id", sa.text("revision_number DESC")])
    op.create_index("idx_atom_revisions_changed_at", "atom_revisions", [sa.text("changed_at DESC")])
    op.create_index("idx_atom_revisions_unique", "atom_revisions", ["atom_id", "revision_number"], unique=True)


def downgrade() -> None:
    """Remove knowledge proposal system tables."""

    op.drop_index("idx_atom_revisions_unique", table_name="atom_revisions")
    op.drop_index("idx_atom_revisions_changed_at", table_name="atom_revisions")
    op.drop_index("idx_atom_revisions_atom_id", table_name="atom_revisions")
    op.drop_table("atom_revisions")

    op.drop_index("idx_topic_revisions_unique", table_name="topic_revisions")
    op.drop_index("idx_topic_revisions_changed_at", table_name="topic_revisions")
    op.drop_index("idx_topic_revisions_topic_id", table_name="topic_revisions")
    op.drop_table("topic_revisions")

    op.drop_index("idx_atom_proposals_review_queue", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_proposed_topic", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_similar_atom", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_reviewed_by", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_created_at", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_extraction_run", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_type", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_confidence", table_name="atom_proposals")
    op.drop_index("idx_atom_proposals_status", table_name="atom_proposals")
    op.drop_table("atom_proposals")

    op.drop_index("idx_topic_proposals_review_queue", table_name="topic_proposals")
    op.drop_index("idx_topic_proposals_similar_topic", table_name="topic_proposals")
    op.drop_index("idx_topic_proposals_reviewed_by", table_name="topic_proposals")
    op.drop_index("idx_topic_proposals_created_at", table_name="topic_proposals")
    op.drop_index("idx_topic_proposals_extraction_run", table_name="topic_proposals")
    op.drop_index("idx_topic_proposals_confidence", table_name="topic_proposals")
    op.drop_index("idx_topic_proposals_status", table_name="topic_proposals")
    op.drop_table("topic_proposals")

    op.drop_index("idx_knowledge_extraction_runs_triggered_by", table_name="knowledge_extraction_runs")
    op.drop_index("idx_knowledge_extraction_runs_created_at", table_name="knowledge_extraction_runs")
    op.drop_index("idx_knowledge_extraction_runs_status", table_name="knowledge_extraction_runs")
    op.drop_table("knowledge_extraction_runs")
```

---

## Data Migration Strategy

### Existing Topics & Atoms Migration

Convert existing entities to "auto-approved" proposals for audit trail:

```python
# File: backend/scripts/migrate_knowledge_to_proposals.py

async def migrate_existing_knowledge_to_proposals():
    """
    Migrate existing Topics and Atoms to proposal system.
    Creates historical extraction run and approved proposals.
    """

    # 1. Create historical extraction run
    historical_run = KnowledgeExtractionRun(
        time_window_start=datetime(2025, 1, 1, tzinfo=UTC),
        time_window_end=datetime.now(UTC),
        config_snapshot={"migrated": True, "version": "pre-proposal-system"},
        trigger_type="migration",
        status="completed",
        started_at=datetime.now(UTC),
        completed_at=datetime.now(UTC),
    )
    session.add(historical_run)
    await session.flush()

    # 2. Migrate Topics
    topics = await session.exec(select(Topic)).all()
    for topic in topics:
        proposal = TopicProposal(
            extraction_run_id=historical_run.id,
            proposed_name=topic.name,
            proposed_description=topic.description,
            proposed_icon=topic.icon,
            proposed_color=topic.color,
            source_message_ids=[],  # Unknown for migrated data
            message_count=0,
            llm_recommendation="new_topic",
            confidence=1.0,  # Assume valid since in production
            reasoning="Migrated from pre-proposal system",
            status="approved",
            reviewed_at=topic.created_at,
            review_action="approve",
            review_notes="Auto-approved during migration",
            created_topic_id=topic.id,
        )
        session.add(proposal)

        # Create initial revision
        revision = TopicRevision(
            topic_id=topic.id,
            revision_number=1,
            name=topic.name,
            description=topic.description,
            icon=topic.icon,
            color=topic.color,
            change_type="created",
            changed_at=topic.created_at,
            source_proposal_id=proposal.id,
        )
        session.add(revision)

    # 3. Migrate Atoms
    atoms = await session.exec(select(Atom)).all()
    for atom in atoms:
        proposal = AtomProposal(
            extraction_run_id=historical_run.id,
            proposed_type=atom.type,
            proposed_title=atom.title,
            proposed_content=atom.content,
            proposed_meta=atom.meta,
            source_message_ids=[],
            message_count=0,
            llm_recommendation="new_atom",
            confidence=atom.confidence or 1.0,
            reasoning="Migrated from pre-proposal system",
            status="approved",
            reviewed_at=atom.created_at,
            review_action="approve",
            review_notes="Auto-approved during migration",
            created_atom_id=atom.id,
        )
        session.add(proposal)

        # Create initial revision
        revision = AtomRevision(
            atom_id=atom.id,
            revision_number=1,
            type=atom.type,
            title=atom.title,
            content=atom.content,
            confidence=atom.confidence,
            user_approved=atom.user_approved,
            meta=atom.meta,
            change_type="created",
            changed_at=atom.created_at,
            source_proposal_id=proposal.id,
        )
        session.add(revision)

    await session.commit()

    print(f"Migrated {len(topics)} topics and {len(atoms)} atoms")
```

---

## Testing Checklist

- [ ] Migration runs cleanly on fresh database
- [ ] Migration runs cleanly on copy of production data
- [ ] All foreign key constraints working correctly
- [ ] Cascade deletes work as expected
- [ ] All indexes created successfully
- [ ] Query performance acceptable for review queue (< 100ms for 1000 proposals)
- [ ] Downgrade migration works without data loss
- [ ] Data migration script completes successfully
- [ ] All models pass `mypy` strict type checking
- [ ] Enum values match database constraints

---

## Performance Expectations

- **Review Queue Query** (status=pending, ordered by confidence): < 100ms for 10,000 proposals
- **Similarity Search Query**: < 500ms with proper indexing
- **Insertion**: < 50ms per proposal
- **Revision Creation**: < 30ms per revision

---

## Next Steps (Phase 1)

1. Create SQLModel models in `backend/app/models/proposals/`
2. Add Pydantic schemas for API validation
3. Implement proposal services layer
4. Write unit tests for models and services

---

**Estimated Migration Time:** 5-10 seconds for 1000 existing topics/atoms
**Disk Space Required:** ~500KB per 1000 proposals (with indexes)
**Rollback Safety:** Full rollback supported via downgrade migration
