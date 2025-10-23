# Migration Strategy: Knowledge Proposal System

**Document Version:** 1.0
**Created:** October 23, 2025
**Status:** Ready for Review
**Target:** Zero-Downtime Migration from Direct Creation to Proposal Workflow

---

## Executive Summary

This document specifies the migration strategy for transitioning the existing Topics/Atoms knowledge extraction system from **direct creation** to a **proposal-review-approval** workflow. The migration must be **zero-downtime**, preserve all existing data, and provide clear rollback paths at every step.

**Key Principles:**
1. **No Data Loss:** All existing Topics/Atoms preserved and converted to approved proposals
2. **Zero Downtime:** System remains operational throughout migration
3. **Gradual Rollout:** Feature flags enable controlled deployment
4. **Fast Rollback:** < 5 minutes to revert if issues arise
5. **Audit Trail:** Complete tracking of migration actions

---

## 1. Migration Phases Overview

```
Phase 0: Preparation (Pre-deployment)
   ↓
Phase 1: Database Schema Addition (Zero-downtime deployment)
   ↓
Phase 2: Dual-Write Mode (Shadow proposals + direct creation)
   ↓
Phase 3: Data Backfill (Convert existing to proposals)
   ↓
Phase 4: Full Cutover (Proposal-only mode)
   ↓
Phase 5: Cleanup (Remove old code paths)
```

**Timeline:** 2 weeks from start to full cutover
**Rollback Windows:** Available at end of each phase

---

## 2. Phase 0: Preparation (Week 0)

### 2.1 Pre-Migration Audit

**Action Items:**
1. **Inventory Existing Data**
   ```sql
   SELECT
     (SELECT COUNT(*) FROM topics) as topic_count,
     (SELECT COUNT(*) FROM atoms) as atom_count,
     (SELECT COUNT(*) FROM topic_atoms) as relationship_count;
   ```

2. **Identify Data Quality Issues**
   - Find duplicate topics by name similarity
   - Find orphaned atoms (no topic relationships)
   - Check for invalid foreign keys
   - Verify embedding data integrity

3. **Performance Baseline**
   - Current extraction run time (median, p95, p99)
   - Database query performance for topics/atoms endpoints
   - Frontend page load times for knowledge views

4. **Create Data Snapshot**
   ```bash
   # Backup production database
   pg_dump -h $DB_HOST -U postgres -d tasktracker \
     --table=topics --table=atoms --table=topic_atoms \
     --table=atom_links > migration_backup_$(date +%Y%m%d).sql
   ```

### 2.2 Environment Setup

**Configuration Changes:**
```python
# backend/app/config.py
class Settings(BaseSettings):
    # Migration feature flags
    knowledge_proposals_enabled: bool = False
    knowledge_proposals_dual_write: bool = False
    knowledge_proposals_auto_approve_migrated: bool = True

    # Migration safety limits
    migration_batch_size: int = 100
    migration_rate_limit_per_second: int = 10
```

**Monitoring Setup:**
- Add metrics for proposal creation rate
- Add alerts for migration failure rate > 1%
- Add dashboard for migration progress tracking

### 2.3 Testing Infrastructure

**Test Database Preparation:**
1. Clone production database to staging
2. Run migration scripts on staging
3. Verify data integrity post-migration
4. Measure migration performance (time per 1000 records)

**Rollback Testing:**
1. Execute migration on test DB
2. Execute rollback script
3. Verify data matches pre-migration snapshot
4. Document rollback time (target: < 5 minutes)

**Deliverables:**
- [ ] Data inventory report
- [ ] Performance baseline metrics
- [ ] Database backup verified
- [ ] Migration scripts tested on staging
- [ ] Rollback procedure documented and tested

---

## 3. Phase 1: Database Schema Addition (Week 1, Day 1-2)

### 3.1 Schema Changes

**New Tables:**
```sql
-- Knowledge extraction run tracking
CREATE TABLE knowledge_extraction_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    message_ids JSONB NOT NULL,
    message_count INTEGER NOT NULL,
    time_span_seconds INTEGER,
    settings JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_by_user_id BIGINT REFERENCES users(id)
);

-- Topic proposals
CREATE TABLE topic_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extraction_run_id UUID REFERENCES knowledge_extraction_runs(id) ON DELETE CASCADE,

    -- Proposed data
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    confidence FLOAT NOT NULL,
    reasoning TEXT,

    -- Duplicate detection
    similar_topic_id BIGINT REFERENCES topics(id),
    similarity_score FLOAT,
    similarity_type VARCHAR(50),

    -- Review metadata
    reviewed_by_user_id BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_action VARCHAR(50),
    review_notes TEXT,

    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT valid_similarity CHECK (similarity_score IS NULL OR (similarity_score >= 0 AND similarity_score <= 1))
);

-- Atom proposals
CREATE TABLE atom_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extraction_run_id UUID REFERENCES knowledge_extraction_runs(id) ON DELETE CASCADE,

    -- Proposed data
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    meta JSONB,

    -- Related topics (for context)
    proposed_topic_ids JSONB,

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    confidence FLOAT NOT NULL,
    reasoning TEXT,

    -- Duplicate detection
    similar_atom_id BIGINT REFERENCES atoms(id),
    similarity_score FLOAT,
    similarity_type VARCHAR(50),

    -- Review metadata
    reviewed_by_user_id BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_action VARCHAR(50),
    review_notes TEXT,

    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    CONSTRAINT valid_confidence CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT valid_similarity CHECK (similarity_score IS NULL OR (similarity_score >= 0 AND similarity_score <= 1))
);

-- Performance indexes
CREATE INDEX idx_topic_proposals_status ON topic_proposals(status);
CREATE INDEX idx_topic_proposals_confidence ON topic_proposals(confidence DESC);
CREATE INDEX idx_topic_proposals_run ON topic_proposals(extraction_run_id);
CREATE INDEX idx_atom_proposals_status ON atom_proposals(status);
CREATE INDEX idx_atom_proposals_confidence ON atom_proposals(confidence DESC);
CREATE INDEX idx_atom_proposals_run ON atom_proposals(extraction_run_id);
CREATE INDEX idx_knowledge_runs_status ON knowledge_extraction_runs(status);
```

**Existing Table Modifications:**
```sql
-- Add migration tracking to existing tables
ALTER TABLE topics ADD COLUMN IF NOT EXISTS migrated_from_proposal_id UUID REFERENCES topic_proposals(id);
ALTER TABLE topics ADD COLUMN IF NOT EXISTS migration_timestamp TIMESTAMP WITH TIME ZONE;

ALTER TABLE atoms ADD COLUMN IF NOT EXISTS migrated_from_proposal_id UUID REFERENCES atom_proposals(id);
ALTER TABLE atoms ADD COLUMN IF NOT EXISTS migration_timestamp TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_topics_migration ON topics(migrated_from_proposal_id) WHERE migrated_from_proposal_id IS NOT NULL;
CREATE INDEX idx_atoms_migration ON atoms(migrated_from_proposal_id) WHERE migrated_from_proposal_id IS NOT NULL;
```

### 3.2 Deployment Procedure

**Step 1: Schema Migration (5-10 minutes)**
```bash
# Deploy during low-traffic window (e.g., 2-4 AM UTC)
cd backend
uv run alembic upgrade head

# Verify migration succeeded
uv run alembic current
```

**Step 2: Verify Schema Integrity**
```sql
-- Check all tables created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('topic_proposals', 'atom_proposals', 'knowledge_extraction_runs');

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%proposal%';
```

**Step 3: Deploy Application Code**
```bash
# Deploy new code with feature flags OFF
# KNOWLEDGE_PROPOSALS_ENABLED=false
# KNOWLEDGE_PROPOSALS_DUAL_WRITE=false
docker compose up -d api worker
```

**Rollback Plan (Phase 1):**
```bash
# If schema migration fails:
cd backend
uv run alembic downgrade -1

# If application fails to start:
git revert <commit-hash>
docker compose up -d api worker
```

**Validation:**
- [ ] All tables exist
- [ ] All indexes created
- [ ] No application errors in logs
- [ ] API health check passes
- [ ] Existing extraction still works (direct creation mode)

---

## 4. Phase 2: Dual-Write Mode (Week 1, Day 3-5)

### 4.1 Implementation Strategy

**Concept:** Write to BOTH proposal tables AND final tables simultaneously. This allows:
- Validation that proposal logic works correctly
- Zero user impact (they still see direct creation)
- Data comparison (proposals vs final entities)
- Safe testing in production

**Code Changes:**
```python
# backend/app/services/knowledge_extraction_service.py

async def save_topics(
    self,
    extracted_topics: list[ExtractedTopic],
    session: AsyncSession,
    run_id: UUID,  # NEW: track extraction run
    confidence_threshold: float = 0.7
) -> dict[str, Topic]:
    topic_map: dict[str, Topic] = {}

    for extracted_topic in extracted_topics:
        # NEW: Create proposal FIRST (even for low confidence)
        if settings.knowledge_proposals_dual_write:
            proposal = TopicProposal(
                extraction_run_id=run_id,
                name=extracted_topic.name,
                description=extracted_topic.description,
                icon=extracted_topic.icon,
                color=extracted_topic.color,
                confidence=extracted_topic.confidence,
                reasoning=extracted_topic.reasoning,
                status="pending" if extracted_topic.confidence < confidence_threshold else "auto_approved"
            )
            session.add(proposal)
            await session.flush()  # Get proposal.id

        # OLD: Still create directly (for now)
        if extracted_topic.confidence >= confidence_threshold:
            existing = await session.execute(
                select(Topic).where(Topic.name == extracted_topic.name)
            )
            existing_topic = existing.scalar_one_or_none()

            if not existing_topic:
                new_topic = Topic(...)
                if settings.knowledge_proposals_dual_write:
                    new_topic.migrated_from_proposal_id = proposal.id
                session.add(new_topic)
                await session.flush()
                topic_map[name] = new_topic
            else:
                topic_map[name] = existing_topic

    return topic_map
```

### 4.2 Monitoring & Validation

**Metrics to Track:**
```python
# Add prometheus metrics
from prometheus_client import Counter, Histogram

proposal_creation_total = Counter(
    'knowledge_proposal_created_total',
    'Total proposals created',
    ['entity_type', 'status']
)

proposal_creation_duration = Histogram(
    'knowledge_proposal_creation_duration_seconds',
    'Time to create proposal',
    ['entity_type']
)
```

**Validation Queries:**
```sql
-- Compare dual-write consistency
SELECT
    COUNT(*) as mismatch_count
FROM topics t
LEFT JOIN topic_proposals tp ON t.migrated_from_proposal_id = tp.id
WHERE tp.id IS NULL
  AND t.migration_timestamp > NOW() - INTERVAL '1 day';

-- Check proposal vs final entity counts
SELECT
    (SELECT COUNT(*) FROM topic_proposals WHERE created_at > NOW() - INTERVAL '1 hour') as proposals,
    (SELECT COUNT(*) FROM topics WHERE created_at > NOW() - INTERVAL '1 hour') as final_topics;
```

### 4.3 Deployment

**Step 1: Enable Dual-Write**
```bash
# Update environment variable
export KNOWLEDGE_PROPOSALS_DUAL_WRITE=true

# Rolling restart (zero downtime)
docker compose up -d api worker
```

**Step 2: Trigger Test Extraction**
```bash
# Use internal messages to test
curl -X POST http://localhost:8000/api/v1/knowledge/extract \
  -H "Content-Type: application/json" \
  -d '{"message_ids": [1,2,3], "user_id": 1}'
```

**Step 3: Verify Dual-Write**
```sql
-- Check both tables populated
SELECT tp.id, tp.name, t.id, t.name
FROM topic_proposals tp
LEFT JOIN topics t ON t.migrated_from_proposal_id = tp.id
WHERE tp.created_at > NOW() - INTERVAL '5 minutes';
```

**Rollback Plan (Phase 2):**
```bash
# Disable dual-write immediately
export KNOWLEDGE_PROPOSALS_DUAL_WRITE=false
docker compose up -d api worker

# Clean up proposals created during testing
psql -d tasktracker -c "DELETE FROM knowledge_extraction_runs WHERE created_at > NOW() - INTERVAL '1 day';"
```

**Validation:**
- [ ] Proposals created for all extractions
- [ ] Final entities still created (backwards compatible)
- [ ] Low-confidence items now saved as proposals
- [ ] No performance degradation (< 10% slower)
- [ ] No errors in application logs

---

## 5. Phase 3: Data Backfill (Week 1, Day 6-7)

### 5.1 Backfill Strategy

**Goal:** Convert all existing Topics and Atoms into "approved" proposals to establish version history baseline.

**Why Backfill:**
- Future updates can reference original proposal
- Consistent data model (everything has a proposal)
- Enables "undo" capability for existing knowledge

**Approach:**
- Process in small batches (100 records at a time)
- Rate-limited (10 batches/second max)
- Idempotent (safe to re-run)
- Monitored (progress tracking)

### 5.2 Backfill Script

```python
# backend/scripts/backfill_knowledge_proposals.py

import asyncio
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db import get_async_session
from app.models import Topic, Atom, TopicProposal, AtomProposal, KnowledgeExtractionRun
from app.config import settings

BATCH_SIZE = 100
RATE_LIMIT_DELAY = 0.1  # 100ms between batches = 10 batches/second


async def create_migration_run(session: AsyncSession) -> KnowledgeExtractionRun:
    """Create a special extraction run for migration tracking."""
    run = KnowledgeExtractionRun(
        id=uuid4(),
        status="completed",
        message_ids=[],
        message_count=0,
        settings={"migration": True, "backfill_timestamp": datetime.now(timezone.utc).isoformat()},
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        created_by_user_id=None  # System migration
    )
    session.add(run)
    await session.flush()
    return run


async def backfill_topics(session: AsyncSession, run_id: uuid4, batch_size: int = BATCH_SIZE):
    """Convert existing topics to approved proposals."""
    offset = 0
    total_migrated = 0

    while True:
        # Fetch batch of unmigrated topics
        result = await session.execute(
            select(Topic)
            .where(Topic.migrated_from_proposal_id.is_(None))
            .order_by(Topic.created_at)
            .limit(batch_size)
            .offset(offset)
        )
        topics = result.scalars().all()

        if not topics:
            break

        for topic in topics:
            # Create approved proposal
            proposal = TopicProposal(
                id=uuid4(),
                extraction_run_id=run_id,
                name=topic.name,
                description=topic.description,
                icon=topic.icon,
                color=topic.color,
                status="approved",
                confidence=1.0,  # Assume existing data is valid
                reasoning="Migrated from existing production data",
                reviewed_by_user_id=None,  # System migration
                reviewed_at=topic.created_at,
                review_action="auto_approve_migration",
                review_notes="Backfilled during migration to proposal system"
            )
            session.add(proposal)
            await session.flush()

            # Link topic to proposal
            topic.migrated_from_proposal_id = proposal.id
            topic.migration_timestamp = datetime.now(timezone.utc)
            session.add(topic)

            total_migrated += 1

        await session.commit()
        print(f"Migrated {len(topics)} topics (total: {total_migrated})")

        # Rate limiting
        await asyncio.sleep(RATE_LIMIT_DELAY)
        offset += batch_size

    return total_migrated


async def backfill_atoms(session: AsyncSession, run_id: uuid4, batch_size: int = BATCH_SIZE):
    """Convert existing atoms to approved proposals."""
    offset = 0
    total_migrated = 0

    while True:
        result = await session.execute(
            select(Atom)
            .where(Atom.migrated_from_proposal_id.is_(None))
            .order_by(Atom.created_at)
            .limit(batch_size)
            .offset(offset)
        )
        atoms = result.scalars().all()

        if not atoms:
            break

        for atom in atoms:
            proposal = AtomProposal(
                id=uuid4(),
                extraction_run_id=run_id,
                type=atom.type,
                title=atom.title,
                content=atom.content,
                meta=atom.meta,
                status="approved",
                confidence=atom.confidence or 1.0,
                reasoning="Migrated from existing production data",
                reviewed_by_user_id=None,
                reviewed_at=atom.created_at,
                review_action="auto_approve_migration",
                review_notes="Backfilled during migration to proposal system"
            )
            session.add(proposal)
            await session.flush()

            atom.migrated_from_proposal_id = proposal.id
            atom.migration_timestamp = datetime.now(timezone.utc)
            session.add(atom)

            total_migrated += 1

        await session.commit()
        print(f"Migrated {len(atoms)} atoms (total: {total_migrated})")

        await asyncio.sleep(RATE_LIMIT_DELAY)
        offset += batch_size

    return total_migrated


async def main():
    """Execute backfill migration."""
    print("Starting knowledge data backfill migration...")

    async for session in get_async_session():
        # Create migration tracking run
        migration_run = await create_migration_run(session)
        await session.commit()
        print(f"Created migration run: {migration_run.id}")

        # Backfill topics
        print("\nBackfilling topics...")
        topic_count = await backfill_topics(session, migration_run.id)
        print(f"✓ Migrated {topic_count} topics")

        # Backfill atoms
        print("\nBackfilling atoms...")
        atom_count = await backfill_atoms(session, migration_run.id)
        print(f"✓ Migrated {atom_count} atoms")

        print(f"\n✅ Migration complete! Total: {topic_count} topics, {atom_count} atoms")
        break


if __name__ == "__main__":
    asyncio.run(main())
```

### 5.3 Execution Plan

**Pre-Flight Checks:**
```bash
# 1. Verify script on staging database first
export DATABASE_URL="postgresql://postgres@localhost:5432/tasktracker_staging"
uv run python backend/scripts/backfill_knowledge_proposals.py --dry-run

# 2. Check production data volume
psql -d tasktracker -c "SELECT COUNT(*) FROM topics WHERE migrated_from_proposal_id IS NULL;"
psql -d tasktracker -c "SELECT COUNT(*) FROM atoms WHERE migrated_from_proposal_id IS NULL;"
```

**Production Execution:**
```bash
# Execute during low-traffic window
export DATABASE_URL="postgresql://postgres@localhost:5555/tasktracker"
uv run python backend/scripts/backfill_knowledge_proposals.py

# Monitor progress in separate terminal
watch -n 5 'psql -d tasktracker -c "SELECT COUNT(*) FROM topics WHERE migrated_from_proposal_id IS NOT NULL;"'
```

**Validation Queries:**
```sql
-- Verify all entities migrated
SELECT
    (SELECT COUNT(*) FROM topics WHERE migrated_from_proposal_id IS NULL) as unmigrated_topics,
    (SELECT COUNT(*) FROM atoms WHERE migrated_from_proposal_id IS NULL) as unmigrated_atoms;

-- Check proposal counts match
SELECT
    (SELECT COUNT(*) FROM topic_proposals WHERE status='approved') as approved_topic_proposals,
    (SELECT COUNT(*) FROM topics) as total_topics;
```

**Rollback Plan (Phase 3):**
```sql
-- Remove backfilled proposals
DELETE FROM topic_proposals WHERE review_action = 'auto_approve_migration';
DELETE FROM atom_proposals WHERE review_action = 'auto_approve_migration';

-- Clear migration tracking
UPDATE topics SET migrated_from_proposal_id = NULL, migration_timestamp = NULL;
UPDATE atoms SET migrated_from_proposal_id = NULL, migration_timestamp = NULL;
```

**Validation:**
- [ ] 100% of topics have `migrated_from_proposal_id`
- [ ] 100% of atoms have `migrated_from_proposal_id`
- [ ] All backfilled proposals have `status='approved'`
- [ ] Migration completed in < 1 hour (for 10k records)
- [ ] No errors during backfill

---

## 6. Phase 4: Full Cutover (Week 2, Day 1-3)

### 6.1 Cutover Strategy

**Goal:** Switch from dual-write mode to proposal-only mode. Stop creating final entities directly.

**Stages:**
1. **Internal Beta** (Day 1): Enable for admin users only
2. **Gradual Rollout** (Day 2): 50% of extractions use proposal-only mode
3. **Full Cutover** (Day 3): 100% proposal-only mode

### 6.2 Code Changes

```python
# backend/app/services/knowledge_extraction_service.py

async def save_topics(
    self,
    extracted_topics: list[ExtractedTopic],
    session: AsyncSession,
    run_id: UUID,
    confidence_threshold: float = 0.7
) -> dict[str, TopicProposal]:  # Return proposals, not final entities
    """
    Create topic proposals (proposal-only mode).

    High-confidence proposals (>= threshold) are auto-approved if configured.
    Low-confidence proposals require manual review.
    """
    proposals: dict[str, TopicProposal] = {}

    for extracted_topic in extracted_topics:
        # Check for duplicates
        similar_topic = await self._find_similar_topic(extracted_topic.name, session)

        # Determine status
        if extracted_topic.confidence >= confidence_threshold:
            if settings.knowledge_proposals_auto_approve_high_confidence:
                status = "auto_approved"
                reviewed_at = datetime.now(timezone.utc)
            else:
                status = "pending"
                reviewed_at = None
        else:
            status = "pending"
            reviewed_at = None

        # Create proposal
        proposal = TopicProposal(
            extraction_run_id=run_id,
            name=extracted_topic.name,
            description=extracted_topic.description,
            icon=extracted_topic.icon or auto_select_icon(extracted_topic.name),
            color=extracted_topic.color or auto_select_color(extracted_topic.icon),
            confidence=extracted_topic.confidence,
            reasoning=extracted_topic.reasoning,
            status=status,
            similar_topic_id=similar_topic.id if similar_topic else None,
            similarity_score=similar_topic.score if similar_topic else None,
            similarity_type=similar_topic.type if similar_topic else "none",
            reviewed_at=reviewed_at
        )
        session.add(proposal)
        await session.flush()

        # Auto-approve creates final entity
        if status == "auto_approved":
            final_topic = await self._create_topic_from_proposal(proposal, session)
            logger.info(f"Auto-approved topic proposal {proposal.id} -> {final_topic.id}")

        proposals[extracted_topic.name] = proposal

    return proposals
```

### 6.3 Feature Flag Configuration

**Stage 1: Internal Beta (10% traffic)**
```bash
# Enable for admin users
export KNOWLEDGE_PROPOSALS_ENABLED=true
export KNOWLEDGE_PROPOSALS_AUTO_APPROVE_HIGH_CONFIDENCE=false  # Manual review for testing
export KNOWLEDGE_PROPOSALS_CUTOVER_PERCENTAGE=10
```

**Stage 2: Gradual Rollout (50% traffic)**
```bash
export KNOWLEDGE_PROPOSALS_CUTOVER_PERCENTAGE=50
export KNOWLEDGE_PROPOSALS_AUTO_APPROVE_HIGH_CONFIDENCE=true
export KNOWLEDGE_PROPOSALS_AUTO_APPROVE_THRESHOLD=0.95
```

**Stage 3: Full Cutover (100% traffic)**
```bash
export KNOWLEDGE_PROPOSALS_CUTOVER_PERCENTAGE=100
export KNOWLEDGE_PROPOSALS_DUAL_WRITE=false  # Stop dual-write
```

### 6.4 Monitoring & Validation

**Key Metrics:**
- Proposal creation rate (should match previous extraction rate)
- Auto-approval rate (target: 50-70%)
- Manual review queue depth (should not grow unbounded)
- Time to review proposal (target: < 30 seconds)
- API error rate (should remain < 1%)

**Dashboard Queries:**
```sql
-- Proposal status distribution
SELECT status, COUNT(*)
FROM topic_proposals
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Auto-approval effectiveness
SELECT
    COUNT(*) FILTER (WHERE status = 'auto_approved') * 100.0 / COUNT(*) as auto_approval_rate
FROM topic_proposals
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Review queue backlog
SELECT COUNT(*) as pending_review
FROM topic_proposals
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';
```

**Rollback Plan (Phase 4):**
```bash
# Immediate rollback to dual-write mode
export KNOWLEDGE_PROPOSALS_CUTOVER_PERCENTAGE=0
export KNOWLEDGE_PROPOSALS_DUAL_WRITE=true
docker compose restart api worker

# If critical: Full rollback to direct creation
export KNOWLEDGE_PROPOSALS_ENABLED=false
docker compose restart api worker
```

**Validation:**
- [ ] Proposals created for all extractions
- [ ] Auto-approval works for high-confidence items
- [ ] Review queue UI accessible and functional
- [ ] No user-facing errors reported
- [ ] Performance within acceptable range (< 20% slower)

---

## 7. Feature Flag Implementation

### 7.1 Configuration Schema

```python
# backend/app/config.py

class Settings(BaseSettings):
    """Application settings with migration feature flags."""

    # --- MIGRATION FEATURE FLAGS ---

    # Master switch: Enable proposal system
    knowledge_proposals_enabled: bool = Field(
        default=False,
        description="Enable knowledge proposal system (master switch)"
    )

    # Dual-write mode: Write to both proposals and final tables
    knowledge_proposals_dual_write: bool = Field(
        default=False,
        description="Write to both proposal and final tables (migration phase)"
    )

    # Gradual rollout: Percentage of extractions using proposal mode
    knowledge_proposals_cutover_percentage: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Percentage of extractions using proposal mode (0-100)"
    )

    # Auto-approval settings
    knowledge_proposals_auto_approve_high_confidence: bool = Field(
        default=True,
        description="Auto-approve high-confidence proposals"
    )

    knowledge_proposals_auto_approve_threshold: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for auto-approval (0.0-1.0)"
    )

    # Migration safety limits
    migration_batch_size: int = Field(default=100, description="Backfill batch size")
    migration_rate_limit_per_second: int = Field(default=10, description="Backfill rate limit")
```

### 7.2 Usage in Code

```python
# backend/app/services/knowledge_extraction_service.py

async def extract_knowledge(
    self,
    message_ids: list[int],
    user_id: int,
    session: AsyncSession
) -> dict:
    """
    Extract knowledge from messages.

    Routes to proposal mode or direct mode based on feature flags.
    """
    # Check if proposal mode enabled
    if not settings.knowledge_proposals_enabled:
        # Legacy path: direct creation
        return await self._extract_direct(message_ids, user_id, session)

    # Check cutover percentage (gradual rollout)
    import random
    use_proposal_mode = random.randint(1, 100) <= settings.knowledge_proposals_cutover_percentage

    if use_proposal_mode:
        # New path: proposal creation
        return await self._extract_via_proposals(message_ids, user_id, session)
    else:
        # Legacy path during migration
        if settings.knowledge_proposals_dual_write:
            # Write to both (validation mode)
            return await self._extract_dual_write(message_ids, user_id, session)
        else:
            return await self._extract_direct(message_ids, user_id, session)
```

### 7.3 Runtime Configuration Changes

**Hot reload via environment variables:**
```bash
# Change settings without restart (if using config reload endpoint)
curl -X POST http://localhost:8000/api/v1/admin/config/reload \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"knowledge_proposals_cutover_percentage": 50}'
```

**Database-backed feature flags (future enhancement):**
```sql
-- Store flags in database for instant updates
CREATE TABLE feature_flags (
    name VARCHAR(100) PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT false,
    config JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 8. Rollback Plan

### 8.1 Rollback Decision Matrix

| Issue | Severity | Rollback Action | Time to Execute |
|-------|----------|-----------------|-----------------|
| Database migration fails | CRITICAL | Alembic downgrade | < 5 minutes |
| Application won't start | CRITICAL | Git revert + redeploy | < 5 minutes |
| High error rate (> 5%) | HIGH | Disable proposals via flag | < 1 minute |
| Performance degradation (> 50%) | HIGH | Reduce cutover % to 10% | < 1 minute |
| Data inconsistency detected | HIGH | Enable dual-write, investigate | < 2 minutes |
| Review queue overflow (> 1000) | MEDIUM | Increase auto-approval threshold | < 1 minute |
| User reports confusion | LOW | Document, add UI guidance | N/A |

### 8.2 Fast Rollback Procedures

**Instant Rollback (< 1 minute):**
```bash
# Disable proposals immediately via feature flag
export KNOWLEDGE_PROPOSALS_ENABLED=false
docker compose restart api worker

# OR use API if available
curl -X POST http://localhost:8000/api/v1/admin/config/set \
  -d '{"knowledge_proposals_enabled": false}'
```

**Partial Rollback (< 2 minutes):**
```bash
# Keep proposals enabled but reduce traffic
export KNOWLEDGE_PROPOSALS_CUTOVER_PERCENTAGE=10
export KNOWLEDGE_PROPOSALS_DUAL_WRITE=true  # Re-enable dual-write
docker compose restart api worker
```

**Full Database Rollback (< 10 minutes):**
```bash
# 1. Stop applications
docker compose down api worker

# 2. Restore database from backup
pg_restore -h localhost -U postgres -d tasktracker -c migration_backup_20251023.sql

# 3. Downgrade schema
cd backend
uv run alembic downgrade -1

# 4. Deploy old code
git revert <migration-commit-hash>
docker compose up -d api worker
```

### 8.3 Rollback Testing

**Pre-deployment requirement:**
```bash
# Test rollback procedure on staging
1. Deploy migration to staging
2. Create test proposals
3. Execute rollback procedure
4. Verify data integrity
5. Measure rollback time
6. Document any issues
```

**Rollback Validation Checklist:**
- [ ] All services start successfully
- [ ] Database queries execute without errors
- [ ] Existing Topics/Atoms still accessible
- [ ] No data loss detected
- [ ] API returns expected responses
- [ ] Frontend renders correctly

---

## 9. Validation Steps

### 9.1 Data Integrity Validation

**Post-Migration Checks:**
```sql
-- Check 1: All topics have proposals
SELECT COUNT(*) FROM topics WHERE migrated_from_proposal_id IS NULL;
-- Expected: 0

-- Check 2: All atoms have proposals
SELECT COUNT(*) FROM atoms WHERE migrated_from_proposal_id IS NULL;
-- Expected: 0

-- Check 3: Proposal counts match entity counts
SELECT
    (SELECT COUNT(*) FROM topic_proposals WHERE status='approved') as proposals,
    (SELECT COUNT(*) FROM topics) as entities;
-- Expected: proposals >= entities (may have pending proposals)

-- Check 4: No orphaned proposals
SELECT COUNT(*)
FROM topic_proposals tp
LEFT JOIN knowledge_extraction_runs ker ON tp.extraction_run_id = ker.id
WHERE ker.id IS NULL;
-- Expected: 0

-- Check 5: Foreign key integrity
SELECT COUNT(*)
FROM atoms a
LEFT JOIN topic_atoms ta ON a.id = ta.atom_id
WHERE ta.topic_id IS NULL;
-- Expected: 0 or known orphan count
```

### 9.2 Functional Validation

**Test Scenarios:**
1. **New Extraction Creates Proposals**
   ```bash
   curl -X POST http://localhost:8000/api/v1/knowledge/extract \
     -H "Content-Type: application/json" \
     -d '{"message_ids": [100, 101], "user_id": 1}'

   # Verify proposals created (not final entities)
   psql -d tasktracker -c "SELECT * FROM topic_proposals ORDER BY created_at DESC LIMIT 5;"
   ```

2. **Auto-Approval Works**
   ```sql
   -- Create high-confidence proposal manually
   INSERT INTO topic_proposals (id, extraction_run_id, name, description, confidence, status)
   VALUES (gen_random_uuid(), (SELECT id FROM knowledge_extraction_runs LIMIT 1),
           'Test Topic', 'Description', 0.98, 'pending');

   -- Trigger auto-approval job
   -- Check status changed to 'auto_approved' and final topic created
   ```

3. **Manual Approval Creates Entity**
   ```bash
   # Get pending proposal ID
   PROPOSAL_ID=$(psql -d tasktracker -t -c "SELECT id FROM topic_proposals WHERE status='pending' LIMIT 1;")

   # Approve via API
   curl -X POST "http://localhost:8000/api/v1/knowledge/proposals/$PROPOSAL_ID/approve" \
     -H "Authorization: Bearer $TOKEN"

   # Verify final topic created
   psql -d tasktracker -c "SELECT * FROM topics WHERE migrated_from_proposal_id='$PROPOSAL_ID';"
   ```

4. **Duplicate Detection Flags Similar**
   ```bash
   # Extract knowledge that should find duplicates
   curl -X POST http://localhost:8000/api/v1/knowledge/extract \
     -d '{"message_ids": [200, 201], "user_id": 1}'

   # Check similarity fields populated
   psql -d tasktracker -c "SELECT name, similar_topic_id, similarity_score FROM topic_proposals WHERE similar_topic_id IS NOT NULL;"
   ```

### 9.3 Performance Validation

**Benchmark Queries:**
```sql
-- Query 1: Proposal list (should be < 100ms)
EXPLAIN ANALYZE
SELECT * FROM topic_proposals
WHERE status = 'pending'
ORDER BY confidence DESC
LIMIT 50;

-- Query 2: Extraction run history (should be < 200ms)
EXPLAIN ANALYZE
SELECT ker.*, COUNT(tp.id) as proposal_count
FROM knowledge_extraction_runs ker
LEFT JOIN topic_proposals tp ON tp.extraction_run_id = ker.id
GROUP BY ker.id
ORDER BY ker.created_at DESC
LIMIT 20;

-- Query 3: Find similar proposals (should be < 500ms)
EXPLAIN ANALYZE
SELECT * FROM topic_proposals
WHERE status = 'pending'
  AND similar_topic_id IS NOT NULL
  AND similarity_score > 0.85
LIMIT 10;
```

**Load Testing:**
```bash
# Simulate 50 concurrent extractions
for i in {1..50}; do
  curl -X POST http://localhost:8000/api/v1/knowledge/extract \
    -d '{"message_ids": [1,2,3], "user_id": 1}' &
done
wait

# Check response times (p95 should be < 2s)
# Check database connection pool (should not exhaust)
# Check error rate (should be 0%)
```

---

## 10. Risk Mitigation

### 10.1 Data Loss Prevention

**Risks:**
- Database migration fails mid-way
- Backfill script crashes
- Duplicate proposals created

**Mitigations:**
1. **Transactional Migrations:**
   ```sql
   BEGIN TRANSACTION;
   -- All migration DDL here
   COMMIT;
   -- If any statement fails, entire transaction rolls back
   ```

2. **Backup Before Migration:**
   ```bash
   # Automated backup before any migration
   pg_dump -Fc -h $DB_HOST -U postgres -d tasktracker > backup_$(date +%Y%m%d_%H%M%S).dump
   ```

3. **Idempotent Scripts:**
   ```python
   # All scripts check existing state before writing
   existing = await session.get(TopicProposal, proposal_id)
   if not existing:
       session.add(proposal)
   ```

### 10.2 Performance Degradation

**Risks:**
- New tables slow down queries
- Duplicate detection adds latency
- Review queue grows unbounded

**Mitigations:**
1. **Database Indexing:**
   ```sql
   -- Critical indexes for proposal queries
   CREATE INDEX CONCURRENTLY idx_proposals_status_confidence
   ON topic_proposals(status, confidence DESC);

   CREATE INDEX CONCURRENTLY idx_proposals_run_created
   ON topic_proposals(extraction_run_id, created_at DESC);
   ```

2. **Query Optimization:**
   ```python
   # Use selectinload to avoid N+1 queries
   stmt = (
       select(TopicProposal)
       .options(selectinload(TopicProposal.extraction_run))
       .where(TopicProposal.status == "pending")
       .limit(50)
   )
   ```

3. **Rate Limiting:**
   ```python
   # Prevent review queue overflow
   MAX_PENDING_PROPOSALS = 1000

   async def create_proposal(...):
       pending_count = await count_pending_proposals()
       if pending_count >= MAX_PENDING_PROPOSALS:
           raise TooManyPendingProposalsError(
               f"Review queue full ({pending_count}/{MAX_PENDING_PROPOSALS}). "
               f"Please review existing proposals before creating new ones."
           )
   ```

### 10.3 User Confusion

**Risks:**
- Users don't understand proposal workflow
- Review UI is confusing
- Auto-approval feels unpredictable

**Mitigations:**
1. **Onboarding Guide:**
   - Tooltip tour on first visit to review dashboard
   - Clear explanation of confidence scores
   - Visual indicators for auto-approved vs manual

2. **Transparency:**
   - Show LLM reasoning for each proposal
   - Display confidence score prominently
   - Explain why duplicates were flagged

3. **Smart Defaults:**
   - Auto-approve 0.95+ by default (can be changed)
   - Sort by confidence (highest first)
   - Highlight proposals needing attention

### 10.4 Migration Failure Recovery

**Scenario: Backfill script crashes at 50% completion**

**Recovery Steps:**
1. Check script progress:
   ```sql
   SELECT COUNT(*) FROM topics WHERE migrated_from_proposal_id IS NOT NULL;
   SELECT COUNT(*) FROM topics;
   ```

2. Re-run script (idempotent):
   ```bash
   # Script skips already-migrated records
   uv run python backend/scripts/backfill_knowledge_proposals.py
   ```

3. Verify completion:
   ```sql
   SELECT COUNT(*) FROM topics WHERE migrated_from_proposal_id IS NULL;
   -- Should be 0
   ```

**Scenario: Duplicate proposals created for same entity**

**Recovery Steps:**
1. Identify duplicates:
   ```sql
   SELECT name, COUNT(*)
   FROM topic_proposals
   GROUP BY name
   HAVING COUNT(*) > 1;
   ```

2. Merge or delete duplicates:
   ```sql
   -- Keep oldest, mark newer as rejected
   WITH ranked AS (
     SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
     FROM topic_proposals
   )
   UPDATE topic_proposals
   SET status = 'rejected', review_notes = 'Duplicate proposal'
   WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
   ```

---

## 11. Post-Migration Validation

### 11.1 Success Criteria

**Data Integrity:**
- [ ] 100% of topics have `migrated_from_proposal_id`
- [ ] 100% of atoms have `migrated_from_proposal_id`
- [ ] 0 orphaned proposals (missing extraction run FK)
- [ ] 0 data loss (topic/atom counts unchanged)

**Functional:**
- [ ] New extractions create proposals (not direct entities)
- [ ] High-confidence proposals auto-approve correctly
- [ ] Manual approval creates final entities
- [ ] Duplicate detection flags similar proposals
- [ ] Review UI loads in < 2 seconds

**Performance:**
- [ ] Extraction time < 20% slower than baseline
- [ ] Proposal list query < 100ms (p95)
- [ ] API error rate < 1%
- [ ] No database connection pool exhaustion

**User Experience:**
- [ ] Review dashboard accessible and functional
- [ ] No user-reported errors
- [ ] Positive feedback on proposal workflow
- [ ] Auto-approval rate 50-70% (indicates good LLM accuracy)

### 11.2 Monitoring Dashboard

**Key Metrics:**
```sql
-- Metric 1: Proposal status distribution
SELECT
    status,
    COUNT(*) as count,
    ROUND(AVG(confidence), 2) as avg_confidence
FROM topic_proposals
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Metric 2: Review velocity
SELECT
    DATE(reviewed_at) as review_date,
    COUNT(*) as proposals_reviewed,
    AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))) as avg_review_time_seconds
FROM topic_proposals
WHERE reviewed_at IS NOT NULL
  AND reviewed_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(reviewed_at);

-- Metric 3: Duplicate detection effectiveness
SELECT
    COUNT(*) FILTER (WHERE similar_topic_id IS NOT NULL) * 100.0 / COUNT(*) as duplicate_detection_rate,
    AVG(similarity_score) FILTER (WHERE similar_topic_id IS NOT NULL) as avg_similarity_score
FROM topic_proposals
WHERE created_at > NOW() - INTERVAL '7 days';

-- Metric 4: Auto-approval accuracy (approved proposals that weren't later rejected)
SELECT
    COUNT(*) FILTER (WHERE review_action = 'auto_approve' AND status != 'rejected') * 100.0 /
    COUNT(*) FILTER (WHERE review_action = 'auto_approve') as auto_approval_accuracy
FROM topic_proposals
WHERE created_at > NOW() - INTERVAL '7 days';
```

### 11.3 Post-Migration Cleanup

**After 2 Weeks of Stable Operation:**

1. **Remove Dual-Write Code:**
   ```bash
   git branch -D feature/dual-write-mode
   # Delete dual-write logic from codebase
   ```

2. **Archive Old Extraction Data:**
   ```sql
   -- Move old extraction metadata to archive table (optional)
   CREATE TABLE knowledge_extraction_archive AS
   SELECT * FROM knowledge_extraction_runs
   WHERE created_at < NOW() - INTERVAL '30 days';
   ```

3. **Optimize Indexes:**
   ```sql
   -- Remove unused indexes
   DROP INDEX IF EXISTS idx_old_extraction_index;

   -- Analyze tables for query planner
   ANALYZE topic_proposals;
   ANALYZE atom_proposals;
   ANALYZE knowledge_extraction_runs;
   ```

4. **Update Documentation:**
   - Mark old extraction workflow as deprecated
   - Update API docs to reflect proposal workflow
   - Add troubleshooting guide for common issues

---

## 12. Timeline Summary

| Phase | Duration | Key Milestones | Rollback Available |
|-------|----------|----------------|-------------------|
| **Phase 0: Preparation** | 2-3 days | Data audit, backups, testing | N/A |
| **Phase 1: Schema Addition** | 2 hours | Tables created, indexes added | ✓ (< 5 min) |
| **Phase 2: Dual-Write** | 3 days | Both tables populated, validation | ✓ (< 1 min) |
| **Phase 3: Backfill** | 1 day | Existing data migrated | ✓ (< 10 min) |
| **Phase 4: Cutover** | 3 days | Gradual rollout to 100% | ✓ (< 1 min) |
| **Phase 5: Cleanup** | After 2 weeks | Remove old code, optimize | Manual |

**Total Migration Time:** 1.5-2 weeks from start to full cutover
**Fastest Rollback:** < 1 minute (feature flag toggle)
**Full Rollback:** < 10 minutes (database restore)

---

## 13. Appendix

### A. Database Schema ERD

```
┌─────────────────────────────┐
│ knowledge_extraction_runs   │
├─────────────────────────────┤
│ id (UUID, PK)               │
│ status                      │
│ message_ids (JSONB)         │
│ settings (JSONB)            │
│ started_at                  │
│ completed_at                │
└─────────────────────────────┘
         ▲
         │
         │ extraction_run_id (FK)
         │
┌────────┴─────────────────────┐
│                              │
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ topic_proposals             │ │ atom_proposals              │
├─────────────────────────────┤ ├─────────────────────────────┤
│ id (UUID, PK)               │ │ id (UUID, PK)               │
│ extraction_run_id (FK)      │ │ extraction_run_id (FK)      │
│ name                        │ │ type                        │
│ description                 │ │ title                       │
│ icon, color                 │ │ content                     │
│ status                      │ │ status                      │
│ confidence                  │ │ confidence                  │
│ reasoning                   │ │ reasoning                   │
│ similar_topic_id (FK)       │ │ similar_atom_id (FK)        │
│ similarity_score            │ │ similarity_score            │
│ reviewed_by_user_id (FK)    │ │ reviewed_by_user_id (FK)    │
│ reviewed_at                 │ │ reviewed_at                 │
└─────────────────────────────┘ └─────────────────────────────┘
         │                              │
         │ migrated_from_proposal_id    │
         ▼                              ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│ topics (existing)           │ │ atoms (existing)            │
├─────────────────────────────┤ ├─────────────────────────────┤
│ id (INT, PK)                │ │ id (INT, PK)                │
│ name                        │ │ type                        │
│ description                 │ │ title                       │
│ migrated_from_proposal_id   │ │ migrated_from_proposal_id   │
│ migration_timestamp         │ │ migration_timestamp         │
└─────────────────────────────┘ └─────────────────────────────┘
```

### B. Configuration Reference

```python
# Complete migration configuration
KNOWLEDGE_PROPOSALS_ENABLED=true
KNOWLEDGE_PROPOSALS_DUAL_WRITE=false
KNOWLEDGE_PROPOSALS_CUTOVER_PERCENTAGE=100
KNOWLEDGE_PROPOSALS_AUTO_APPROVE_HIGH_CONFIDENCE=true
KNOWLEDGE_PROPOSALS_AUTO_APPROVE_THRESHOLD=0.95
MIGRATION_BATCH_SIZE=100
MIGRATION_RATE_LIMIT_PER_SECOND=10
```

### C. Useful SQL Queries

```sql
-- Find proposals pending review > 24 hours
SELECT id, name, confidence, created_at
FROM topic_proposals
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY confidence DESC;

-- Count proposals by extraction run
SELECT ker.id, ker.started_at, COUNT(tp.id) as proposal_count
FROM knowledge_extraction_runs ker
LEFT JOIN topic_proposals tp ON tp.extraction_run_id = ker.id
GROUP BY ker.id
ORDER BY ker.started_at DESC
LIMIT 20;

-- Find high-confidence proposals not auto-approved (investigate why)
SELECT id, name, confidence, status, created_at
FROM topic_proposals
WHERE confidence >= 0.95
  AND status != 'auto_approved'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

**Document Status:** Ready for Implementation
**Last Updated:** October 23, 2025
**Approved By:** [Pending Review]
**Next Review:** After Phase 1 completion
