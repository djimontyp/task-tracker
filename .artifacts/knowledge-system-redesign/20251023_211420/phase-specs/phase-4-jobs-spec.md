# Phase 4: Background Jobs Specification
# Knowledge Proposal System - TaskIQ Automation

**Created:** October 23, 2025
**Phase:** 4 (Automation & Polish)
**Status:** Ready for Implementation
**Dependencies:** Phase 0-3 (Database, Services, API, Duplicate Detection)

---

## Overview

This specification defines all background jobs for automating the Knowledge Proposal System workflow. Jobs handle auto-approval of high-confidence proposals, deduplication scanning, proposal expiration, and cleanup tasks.

**Architecture Pattern:** TaskIQ + NATS broker with retry policies, cron scheduling, and WebSocket notifications.

---

## Job Summary

| Job | Schedule | Purpose | Priority |
|-----|----------|---------|----------|
| `auto_review_proposals_task` | Every 5 minutes | Auto-approve high-confidence proposals | Critical |
| `deduplication_scan_task` | Every 30 minutes | Find and flag duplicate knowledge | High |
| `expire_stale_proposals_task` | Daily at 02:00 | Auto-reject proposals older than 30 days | Medium |
| `cleanup_orphaned_extractions_task` | Weekly (Sunday 03:00) | Remove extraction runs with no proposals | Low |
| `proposal_metrics_update_task` | Every 15 minutes | Update real-time approval statistics | Medium |

---

## Configuration Settings

Add to `backend/core/config.py`:

```python
# Knowledge Proposal Automation Settings
knowledge_auto_approval_enabled: bool = Field(
    default=True,
    validation_alias=AliasChoices("KNOWLEDGE_AUTO_APPROVAL_ENABLED", "knowledge_auto_approval_enabled"),
)
knowledge_auto_approval_confidence_threshold: float = Field(
    default=0.95,
    ge=0.0,
    le=1.0,
    validation_alias=AliasChoices(
        "KNOWLEDGE_AUTO_APPROVAL_CONFIDENCE_THRESHOLD",
        "knowledge_auto_approval_confidence_threshold"
    ),
)
knowledge_dedup_similarity_threshold: float = Field(
    default=0.85,
    ge=0.0,
    le=1.0,
    validation_alias=AliasChoices(
        "KNOWLEDGE_DEDUP_SIMILARITY_THRESHOLD",
        "knowledge_dedup_similarity_threshold"
    ),
)
knowledge_proposal_expiration_days: int = Field(
    default=30,
    ge=1,
    le=365,
    validation_alias=AliasChoices(
        "KNOWLEDGE_PROPOSAL_EXPIRATION_DAYS",
        "knowledge_proposal_expiration_days"
    ),
)
knowledge_auto_approval_batch_size: int = Field(
    default=50,
    ge=1,
    le=500,
    validation_alias=AliasChoices(
        "KNOWLEDGE_AUTO_APPROVAL_BATCH_SIZE",
        "knowledge_auto_approval_batch_size"
    ),
)
knowledge_dedup_batch_size: int = Field(
    default=100,
    ge=10,
    le=1000,
    validation_alias=AliasChoices(
        "KNOWLEDGE_DEDUP_BATCH_SIZE",
        "knowledge_dedup_batch_size"
    ),
)
```

---

## Job 1: Auto-Review High-Confidence Proposals

### Task Definition

```python
@nats_broker.task(
    task_name="auto_review_proposals",
    retry_on_error=True,
    max_retries=3,
)
async def auto_review_proposals_task() -> dict[str, int]:
    """Auto-approve high-confidence knowledge proposals.

    Reviews pending TopicProposals and AtomProposals with confidence >= threshold
    and no detected duplicates. Creates final Topic/Atom entities and updates
    proposal status to 'approved'.

    Runs: Every 5 minutes
    Retry: 3 attempts with exponential backoff (5s, 25s, 125s)

    Returns:
        Statistics dictionary:
            - topics_approved: Number of topics auto-approved
            - atoms_approved: Number of atoms auto-approved
            - topics_skipped: Skipped due to duplicates/low confidence
            - atoms_skipped: Skipped due to duplicates/low confidence
            - errors: Number of approval failures

    Business Rules:
        1. Only process proposals with status='pending'
        2. Confidence must be >= configured threshold (default 0.95)
        3. Skip if similar_entity_id is set (duplicate detected)
        4. Skip if similar_topic_id/similar_atom_id is set
        5. Set reviewed_by_user_id to system user (id=1)
        6. Broadcast WebSocket events for each approval
        7. Log all decisions to audit trail

    Error Handling:
        - Individual proposal failures don't abort batch
        - Failed proposals remain in 'pending' status
        - Errors logged with proposal_id context
        - WebSocket notification sent on errors
    """
```

### Implementation Outline

```python
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select

from app.database import get_db_session_context
from app.models import AtomProposal, TopicProposal, ProposalStatus
from app.services.proposals import TopicProposalService, AtomProposalService
from app.services.websocket_manager import websocket_manager
from core.config import settings
from core.taskiq_config import nats_broker
from loguru import logger

SYSTEM_USER_ID = 1


@nats_broker.task(task_name="auto_review_proposals", retry_on_error=True, max_retries=3)
async def auto_review_proposals_task() -> dict[str, int]:
    if not settings.knowledge_auto_approval_enabled:
        logger.info("Auto-approval disabled via config")
        return {"topics_approved": 0, "atoms_approved": 0, "topics_skipped": 0, "atoms_skipped": 0, "errors": 0}

    db_context = get_db_session_context()
    db = await anext(db_context)

    threshold = settings.knowledge_auto_approval_confidence_threshold
    batch_size = settings.knowledge_auto_approval_batch_size

    topic_service = TopicProposalService(db)
    atom_service = AtomProposalService(db)

    stats = {
        "topics_approved": 0,
        "atoms_approved": 0,
        "topics_skipped": 0,
        "atoms_skipped": 0,
        "errors": 0,
    }

    try:
        # Process Topic Proposals
        topic_stmt = (
            select(TopicProposal)
            .where(
                TopicProposal.status == ProposalStatus.pending.value,
                TopicProposal.confidence >= threshold,
                TopicProposal.similar_entity_id.is_(None),
            )
            .limit(batch_size)
        )

        topic_result = await db.execute(topic_stmt)
        topic_proposals = list(topic_result.scalars().all())

        logger.info(f"Auto-review: Found {len(topic_proposals)} topic proposals eligible for approval")

        for proposal in topic_proposals:
            try:
                await topic_service.approve_proposal(
                    proposal_id=proposal.id,
                    reviewed_by_user_id=SYSTEM_USER_ID,
                    review_notes=f"Auto-approved: confidence {proposal.confidence:.2%}",
                )
                stats["topics_approved"] += 1

                await websocket_manager.broadcast(
                    "knowledge_proposals",
                    {
                        "type": "proposal.auto_approved",
                        "entity_type": "topic",
                        "data": {
                            "proposal_id": str(proposal.id),
                            "name": proposal.proposed_name,
                            "confidence": proposal.confidence,
                        },
                    },
                )

            except Exception as e:
                logger.error(f"Failed to auto-approve topic proposal {proposal.id}: {e}")
                stats["errors"] += 1

        # Process Atom Proposals
        atom_stmt = (
            select(AtomProposal)
            .where(
                AtomProposal.status == ProposalStatus.pending.value,
                AtomProposal.confidence >= threshold,
                AtomProposal.similar_entity_id.is_(None),
            )
            .limit(batch_size)
        )

        atom_result = await db.execute(atom_stmt)
        atom_proposals = list(atom_result.scalars().all())

        logger.info(f"Auto-review: Found {len(atom_proposals)} atom proposals eligible for approval")

        for proposal in atom_proposals:
            try:
                await atom_service.approve_proposal(
                    proposal_id=proposal.id,
                    reviewed_by_user_id=SYSTEM_USER_ID,
                    review_notes=f"Auto-approved: confidence {proposal.confidence:.2%}",
                )
                stats["atoms_approved"] += 1

                await websocket_manager.broadcast(
                    "knowledge_proposals",
                    {
                        "type": "proposal.auto_approved",
                        "entity_type": "atom",
                        "data": {
                            "proposal_id": str(proposal.id),
                            "title": proposal.proposed_title,
                            "confidence": proposal.confidence,
                        },
                    },
                )

            except Exception as e:
                logger.error(f"Failed to auto-approve atom proposal {proposal.id}: {e}")
                stats["errors"] += 1

        logger.info(
            f"Auto-review completed: {stats['topics_approved']} topics, "
            f"{stats['atoms_approved']} atoms approved, {stats['errors']} errors"
        )

        return stats

    except Exception as e:
        logger.error(f"Auto-review task failed: {e}", exc_info=True)
        raise
```

### Cron Schedule

```python
# Add to worker startup (backend/main_worker.py)
from taskiq import TaskiqScheduler, CronSpec

scheduler.register_task(
    auto_review_proposals_task,
    cron=CronSpec("*/5 * * * *"),  # Every 5 minutes
    task_name="auto_review_proposals_scheduled",
)
```

---

## Job 2: Deduplication Scan

### Task Definition

```python
@nats_broker.task(
    task_name="deduplication_scan",
    retry_on_error=True,
    max_retries=2,
)
async def deduplication_scan_task() -> dict[str, int]:
    """Scan for duplicate Topics and Atoms using semantic similarity.

    Identifies existing knowledge entities that are semantically similar
    to pending proposals. Flags proposals with similar_entity_id and
    similarity_score for manual review.

    Runs: Every 30 minutes
    Retry: 2 attempts with exponential backoff (10s, 50s)

    Returns:
        Statistics dictionary:
            - proposals_scanned: Total proposals processed
            - duplicates_found: Proposals flagged as duplicates
            - embeddings_generated: New embeddings created
            - errors: Scan failures

    Algorithm:
        1. Fetch pending proposals without similar_entity_id
        2. Generate embeddings if missing
        3. Vector search for similar entities (threshold 0.85)
        4. Update proposal with similarity metadata
        5. Don't auto-reject - flag for manual merge decision

    Performance:
        - Batch size: 100 proposals per run
        - Embedding caching: Yes
        - Vector search limit: 5 candidates per proposal
        - Timeout: 5 minutes
    """
```

### Implementation Outline

```python
@nats_broker.task(task_name="deduplication_scan", retry_on_error=True, max_retries=2, timeout=300)
async def deduplication_scan_task() -> dict[str, int]:
    from app.services.similarity_service import SimilarityService

    db_context = get_db_session_context()
    db = await anext(db_context)

    batch_size = settings.knowledge_dedup_batch_size
    threshold = settings.knowledge_dedup_similarity_threshold

    similarity_service = SimilarityService(db)

    stats = {
        "proposals_scanned": 0,
        "duplicates_found": 0,
        "embeddings_generated": 0,
        "errors": 0,
    }

    try:
        # Scan Topic Proposals
        topic_stmt = (
            select(TopicProposal)
            .where(
                TopicProposal.status == ProposalStatus.pending.value,
                TopicProposal.similar_entity_id.is_(None),
            )
            .limit(batch_size)
        )

        topic_result = await db.execute(topic_stmt)
        topic_proposals = list(topic_result.scalars().all())

        for proposal in topic_proposals:
            try:
                similar_entity, score, sim_type = await similarity_service.find_similar_topic(
                    name=proposal.proposed_name,
                    description=proposal.proposed_description,
                    threshold=threshold,
                )

                if similar_entity and score >= threshold:
                    proposal.similar_entity_id = similar_entity.id
                    proposal.similarity_score = score
                    proposal.similarity_type = sim_type

                    stats["duplicates_found"] += 1

                    await websocket_manager.broadcast(
                        "knowledge_proposals",
                        {
                            "type": "proposal.duplicate_detected",
                            "entity_type": "topic",
                            "data": {
                                "proposal_id": str(proposal.id),
                                "similar_entity_id": str(similar_entity.id),
                                "similarity_score": score,
                            },
                        },
                    )

                stats["proposals_scanned"] += 1

            except Exception as e:
                logger.error(f"Dedup scan failed for topic proposal {proposal.id}: {e}")
                stats["errors"] += 1

        await db.commit()

        # Scan Atom Proposals (similar logic)
        atom_stmt = (
            select(AtomProposal)
            .where(
                AtomProposal.status == ProposalStatus.pending.value,
                AtomProposal.similar_entity_id.is_(None),
            )
            .limit(batch_size)
        )

        atom_result = await db.execute(atom_stmt)
        atom_proposals = list(atom_result.scalars().all())

        for proposal in atom_proposals:
            try:
                similar_entity, score, sim_type = await similarity_service.find_similar_atom(
                    title=proposal.proposed_title,
                    content=proposal.proposed_content,
                    threshold=threshold,
                )

                if similar_entity and score >= threshold:
                    proposal.similar_entity_id = similar_entity.id
                    proposal.similarity_score = score
                    proposal.similarity_type = sim_type

                    stats["duplicates_found"] += 1

                    await websocket_manager.broadcast(
                        "knowledge_proposals",
                        {
                            "type": "proposal.duplicate_detected",
                            "entity_type": "atom",
                            "data": {
                                "proposal_id": str(proposal.id),
                                "similar_entity_id": str(similar_entity.id),
                                "similarity_score": score,
                            },
                        },
                    )

                stats["proposals_scanned"] += 1

            except Exception as e:
                logger.error(f"Dedup scan failed for atom proposal {proposal.id}: {e}")
                stats["errors"] += 1

        await db.commit()

        logger.info(
            f"Deduplication scan: {stats['proposals_scanned']} scanned, "
            f"{stats['duplicates_found']} duplicates found, {stats['errors']} errors"
        )

        return stats

    except Exception as e:
        logger.error(f"Deduplication scan task failed: {e}", exc_info=True)
        raise


scheduler.register_task(
    deduplication_scan_task,
    cron=CronSpec("*/30 * * * *"),  # Every 30 minutes
    task_name="deduplication_scan_scheduled",
)
```

---

## Job 3: Expire Stale Proposals

### Task Definition

```python
@nats_broker.task(
    task_name="expire_stale_proposals",
    retry_on_error=True,
    max_retries=2,
)
async def expire_stale_proposals_task() -> dict[str, int]:
    """Auto-reject proposals older than configured expiration threshold.

    Prevents review queue from accumulating stale proposals that are
    no longer relevant. Proposals are marked as 'rejected' with reason.

    Runs: Daily at 02:00 UTC
    Retry: 2 attempts with exponential backoff

    Returns:
        Statistics dictionary:
            - topics_expired: Topic proposals auto-rejected
            - atoms_expired: Atom proposals auto-rejected
            - total_expired: Total proposals expired

    Business Rules:
        1. Only expire proposals with status='pending'
        2. Age calculated from created_at timestamp
        3. Expiration threshold: 30 days (configurable)
        4. Set status to 'rejected'
        5. Set review_notes: "Auto-rejected: expired after X days"
        6. Broadcast WebSocket notification
        7. Don't delete - keep for audit trail
    """
```

### Implementation Outline

```python
@nats_broker.task(task_name="expire_stale_proposals", retry_on_error=True, max_retries=2)
async def expire_stale_proposals_task() -> dict[str, int]:
    from datetime import timedelta

    db_context = get_db_session_context()
    db = await anext(db_context)

    expiration_days = settings.knowledge_proposal_expiration_days
    cutoff_date = datetime.now(UTC) - timedelta(days=expiration_days)

    stats = {
        "topics_expired": 0,
        "atoms_expired": 0,
        "total_expired": 0,
    }

    try:
        # Expire Topic Proposals
        topic_stmt = (
            select(TopicProposal)
            .where(
                TopicProposal.status == ProposalStatus.pending.value,
                TopicProposal.created_at < cutoff_date,
            )
        )

        topic_result = await db.execute(topic_stmt)
        topic_proposals = list(topic_result.scalars().all())

        for proposal in topic_proposals:
            proposal.status = ProposalStatus.rejected.value
            proposal.reviewed_by_user_id = SYSTEM_USER_ID
            proposal.reviewed_at = datetime.now(UTC)
            proposal.review_notes = f"Auto-rejected: expired after {expiration_days} days"

            stats["topics_expired"] += 1

        # Expire Atom Proposals
        atom_stmt = (
            select(AtomProposal)
            .where(
                AtomProposal.status == ProposalStatus.pending.value,
                AtomProposal.created_at < cutoff_date,
            )
        )

        atom_result = await db.execute(atom_stmt)
        atom_proposals = list(atom_result.scalars().all())

        for proposal in atom_proposals:
            proposal.status = ProposalStatus.rejected.value
            proposal.reviewed_by_user_id = SYSTEM_USER_ID
            proposal.reviewed_at = datetime.now(UTC)
            proposal.review_notes = f"Auto-rejected: expired after {expiration_days} days"

            stats["atoms_expired"] += 1

        await db.commit()

        stats["total_expired"] = stats["topics_expired"] + stats["atoms_expired"]

        if stats["total_expired"] > 0:
            await websocket_manager.broadcast(
                "knowledge_proposals",
                {
                    "type": "proposals.expired",
                    "data": {
                        "topics_expired": stats["topics_expired"],
                        "atoms_expired": stats["atoms_expired"],
                        "total_expired": stats["total_expired"],
                    },
                },
            )

        logger.info(
            f"Proposal expiration: {stats['topics_expired']} topics, "
            f"{stats['atoms_expired']} atoms expired"
        )

        return stats

    except Exception as e:
        logger.error(f"Expire stale proposals task failed: {e}", exc_info=True)
        raise


scheduler.register_task(
    expire_stale_proposals_task,
    cron=CronSpec("0 2 * * *"),  # Daily at 02:00 UTC
    task_name="expire_stale_proposals_scheduled",
)
```

---

## Job 4: Cleanup Orphaned Extractions

### Task Definition

```python
@nats_broker.task(
    task_name="cleanup_orphaned_extractions",
    retry_on_error=True,
    max_retries=1,
)
async def cleanup_orphaned_extractions_task() -> dict[str, int]:
    """Remove KnowledgeExtractionRun records with zero proposals.

    Cleans up failed or empty extraction runs to prevent database bloat.
    Only deletes runs older than 7 days with no associated proposals.

    Runs: Weekly on Sunday at 03:00 UTC
    Retry: 1 attempt (cleanup is idempotent)

    Returns:
        Statistics dictionary:
            - runs_deleted: Number of extraction runs removed
            - age_threshold_days: Minimum age for deletion

    Safety Rules:
        1. Only delete runs with zero TopicProposals AND zero AtomProposals
        2. Minimum age: 7 days
        3. Cascade delete any orphaned relationships
        4. Log all deletions for audit
    """
```

### Implementation Outline

```python
@nats_broker.task(task_name="cleanup_orphaned_extractions", retry_on_error=True, max_retries=1)
async def cleanup_orphaned_extractions_task() -> dict[str, int]:
    from datetime import timedelta
    from sqlalchemy import and_, func

    from app.models import KnowledgeExtractionRun

    db_context = get_db_session_context()
    db = await anext(db_context)

    age_threshold_days = 7
    cutoff_date = datetime.now(UTC) - timedelta(days=age_threshold_days)

    stats = {
        "runs_deleted": 0,
        "age_threshold_days": age_threshold_days,
    }

    try:
        # Find extraction runs with zero proposals
        stmt = (
            select(KnowledgeExtractionRun)
            .outerjoin(TopicProposal, TopicProposal.extraction_run_id == KnowledgeExtractionRun.id)
            .outerjoin(AtomProposal, AtomProposal.extraction_run_id == KnowledgeExtractionRun.id)
            .where(
                KnowledgeExtractionRun.created_at < cutoff_date,
            )
            .group_by(KnowledgeExtractionRun.id)
            .having(
                and_(
                    func.count(TopicProposal.id) == 0,
                    func.count(AtomProposal.id) == 0,
                )
            )
        )

        result = await db.execute(stmt)
        orphaned_runs = list(result.scalars().all())

        for run in orphaned_runs:
            logger.info(f"Deleting orphaned extraction run {run.id} (created {run.created_at})")
            await db.delete(run)
            stats["runs_deleted"] += 1

        await db.commit()

        logger.info(f"Cleanup: Deleted {stats['runs_deleted']} orphaned extraction runs")

        return stats

    except Exception as e:
        logger.error(f"Cleanup orphaned extractions task failed: {e}", exc_info=True)
        raise


scheduler.register_task(
    cleanup_orphaned_extractions_task,
    cron=CronSpec("0 3 * * 0"),  # Sunday at 03:00 UTC
    task_name="cleanup_orphaned_extractions_scheduled",
)
```

---

## Job 5: Proposal Metrics Update

### Task Definition

```python
@nats_broker.task(
    task_name="proposal_metrics_update",
    retry_on_error=False,  # Metrics are non-critical
    max_retries=0,
)
async def proposal_metrics_update_task() -> dict[str, int | float]:
    """Calculate and broadcast real-time proposal statistics.

    Aggregates proposal metrics for dashboard display:
    - Approval rate
    - Average confidence scores
    - Pending queue size
    - Auto-approval success rate

    Runs: Every 15 minutes
    Retry: None (metrics update is non-critical)

    Returns:
        Metrics dictionary with current statistics

    Broadcast:
        WebSocket event 'proposals.metrics_updated' with full stats
    """
```

### Implementation Outline

```python
@nats_broker.task(task_name="proposal_metrics_update", retry_on_error=False)
async def proposal_metrics_update_task() -> dict[str, int | float]:
    from sqlalchemy import func

    db_context = get_db_session_context()
    db = await anext(db_context)

    try:
        # Calculate topic proposal metrics
        topic_stats_stmt = (
            select(
                TopicProposal.status,
                func.count(TopicProposal.id).label("count"),
                func.avg(TopicProposal.confidence).label("avg_confidence"),
            )
            .group_by(TopicProposal.status)
        )

        topic_result = await db.execute(topic_stats_stmt)
        topic_stats = {row.status: {"count": row.count, "avg_confidence": row.avg_confidence} for row in topic_result}

        # Calculate atom proposal metrics
        atom_stats_stmt = (
            select(
                AtomProposal.status,
                func.count(AtomProposal.id).label("count"),
                func.avg(AtomProposal.confidence).label("avg_confidence"),
            )
            .group_by(AtomProposal.status)
        )

        atom_result = await db.execute(atom_stats_stmt)
        atom_stats = {row.status: {"count": row.count, "avg_confidence": row.avg_confidence} for row in atom_result}

        # Calculate approval rate
        total_topics = sum(s["count"] for s in topic_stats.values())
        approved_topics = topic_stats.get("approved", {}).get("count", 0)
        topic_approval_rate = approved_topics / total_topics if total_topics > 0 else 0.0

        total_atoms = sum(s["count"] for s in atom_stats.values())
        approved_atoms = atom_stats.get("approved", {}).get("count", 0)
        atom_approval_rate = approved_atoms / total_atoms if total_atoms > 0 else 0.0

        metrics = {
            "topic_proposals": {
                "pending": topic_stats.get("pending", {}).get("count", 0),
                "approved": approved_topics,
                "rejected": topic_stats.get("rejected", {}).get("count", 0),
                "merged": topic_stats.get("merged", {}).get("count", 0),
                "approval_rate": topic_approval_rate,
                "avg_confidence": topic_stats.get("pending", {}).get("avg_confidence", 0.0),
            },
            "atom_proposals": {
                "pending": atom_stats.get("pending", {}).get("count", 0),
                "approved": approved_atoms,
                "rejected": atom_stats.get("rejected", {}).get("count", 0),
                "merged": atom_stats.get("merged", {}).get("count", 0),
                "approval_rate": atom_approval_rate,
                "avg_confidence": atom_stats.get("pending", {}).get("avg_confidence", 0.0),
            },
            "updated_at": datetime.now(UTC).isoformat(),
        }

        await websocket_manager.broadcast(
            "knowledge_proposals",
            {
                "type": "proposals.metrics_updated",
                "data": metrics,
            },
        )

        logger.debug(f"Proposal metrics updated: {metrics}")

        return metrics

    except Exception as e:
        logger.error(f"Proposal metrics update failed: {e}", exc_info=True)
        return {}


scheduler.register_task(
    proposal_metrics_update_task,
    cron=CronSpec("*/15 * * * *"),  # Every 15 minutes
    task_name="proposal_metrics_update_scheduled",
)
```

---

## Retry Policies

### Global Retry Configuration

```python
# backend/core/taskiq_config.py

from taskiq import RetryPolicy, LinearRetryPolicy, ExponentialRetryPolicy

# Exponential backoff for critical jobs
critical_retry_policy = ExponentialRetryPolicy(
    min_retry_delay=5.0,      # 5 seconds initial
    max_retry_delay=300.0,    # 5 minutes maximum
    multiplier=5.0,           # 5x backoff
    max_retries=3,
)

# Linear backoff for medium-priority jobs
standard_retry_policy = LinearRetryPolicy(
    retry_delay=10.0,         # 10 seconds between retries
    max_retries=2,
)

# No retry for non-critical jobs
no_retry_policy = RetryPolicy(max_retries=0)
```

### Job-Specific Retry Policies

| Job | Policy | Max Retries | Delays |
|-----|--------|-------------|--------|
| `auto_review_proposals_task` | Exponential | 3 | 5s, 25s, 125s |
| `deduplication_scan_task` | Linear | 2 | 10s, 10s |
| `expire_stale_proposals_task` | Linear | 2 | 10s, 10s |
| `cleanup_orphaned_extractions_task` | Linear | 1 | 10s |
| `proposal_metrics_update_task` | None | 0 | N/A |

---

## Error Handling & Notifications

### Error Categories

1. **Transient Errors** (retry):
   - Database connection timeout
   - NATS connection lost
   - LLM API rate limit
   - WebSocket broadcast failure

2. **Permanent Errors** (log and skip):
   - Invalid proposal data (corrupted)
   - Missing foreign key references
   - Schema validation failures

3. **Critical Errors** (alert):
   - Database unavailable after retries
   - NATS broker down
   - Systemic failures affecting multiple proposals

### Notification Strategy

```python
async def send_job_error_notification(
    job_name: str,
    error: Exception,
    context: dict,
    severity: str = "error",
) -> None:
    """Send error notification via WebSocket and logging.

    Args:
        job_name: Name of failed job
        error: Exception that occurred
        context: Additional context (proposal_id, batch_size, etc.)
        severity: error/critical
    """
    logger.error(
        f"Job {job_name} failed: {error}",
        extra={"job_name": job_name, "context": context, "severity": severity},
        exc_info=True,
    )

    await websocket_manager.broadcast(
        "system_notifications",
        {
            "type": "job.error",
            "severity": severity,
            "data": {
                "job_name": job_name,
                "error_message": str(error),
                "context": context,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        },
    )
```

### Logging Standards

```python
# Before job starts
logger.info(f"Job {job_name} started: processing {count} proposals")

# Progress updates
logger.debug(f"Job {job_name}: processed {current}/{total} ({percentage}%)")

# Individual item errors
logger.error(f"Job {job_name}: failed to process proposal {proposal_id}: {error}")

# Job completion
logger.info(f"Job {job_name} completed: {stats}")

# Critical failures
logger.critical(f"Job {job_name} CRITICAL FAILURE: {error}", exc_info=True)
```

---

## Job Dependencies

### Dependency Graph

```
extract_knowledge_from_messages_task (Phase 1)
    ↓
    └─ Creates TopicProposal + AtomProposal records
        ↓
        ├─ deduplication_scan_task (finds duplicates)
        │   ↓
        │   └─ auto_review_proposals_task (auto-approves)
        │       ↓
        │       └─ proposal_metrics_update_task (updates stats)
        ↓
        └─ expire_stale_proposals_task (rejects old proposals)
            ↓
            └─ cleanup_orphaned_extractions_task (removes empty runs)
```

### Execution Order Constraints

1. **Deduplication before Auto-Review**: Ensure `deduplication_scan_task` runs before `auto_review_proposals_task` to avoid approving duplicates
2. **Metrics after Actions**: `proposal_metrics_update_task` should run after approval/rejection jobs complete
3. **Cleanup after Expiration**: `cleanup_orphaned_extractions_task` runs after `expire_stale_proposals_task`

**Schedule Coordination:**
- Auto-review: minute 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
- Deduplication: minute 0, 30 (runs before next auto-review cycle)
- Metrics: minute 0, 15, 30, 45 (after auto-review)

---

## Monitoring & Observability

### Health Check Endpoint

```python
# Add to backend/app/api/v1/system.py

@router.get("/jobs/health")
async def get_jobs_health() -> dict:
    """Check health of background jobs."""
    from core.taskiq_config import nats_broker

    health = {
        "broker_connected": await nats_broker.is_connected(),
        "jobs": {
            "auto_review_proposals": {"last_run": None, "status": "unknown"},
            "deduplication_scan": {"last_run": None, "status": "unknown"},
            "expire_stale_proposals": {"last_run": None, "status": "unknown"},
            "cleanup_orphaned_extractions": {"last_run": None, "status": "unknown"},
            "proposal_metrics_update": {"last_run": None, "status": "unknown"},
        },
    }

    return health
```

### Metrics to Track

1. **Job Execution Metrics:**
   - Run count per hour/day
   - Average execution time
   - Success/failure rate
   - Retry count

2. **Proposal Metrics:**
   - Auto-approval rate (target: 50%+)
   - Duplicate detection rate (target: 85%+ accuracy)
   - Average queue age (target: < 1 hour for high-confidence)
   - Expiration rate (target: < 10%)

3. **System Metrics:**
   - NATS broker latency
   - Database connection pool usage
   - WebSocket broadcast latency

---

## Testing Strategy

### Unit Tests

```python
# backend/tests/tasks/test_auto_review_proposals.py

async def test_auto_review_approves_high_confidence():
    """Test auto-approval of proposals above threshold."""

async def test_auto_review_skips_duplicates():
    """Test proposals with similar_entity_id are skipped."""

async def test_auto_review_respects_config_disabled():
    """Test job exits early when auto-approval disabled."""
```

### Integration Tests

```python
# backend/tests/integration/test_proposal_workflow.py

async def test_full_proposal_lifecycle():
    """Test extraction → dedup → auto-review → metrics."""
```

### Load Tests

- 1000 pending proposals (auto-review batch processing)
- 10,000 existing entities (deduplication performance)
- Concurrent job execution (NATS queue handling)

---

## Deployment Checklist

- [ ] Add configuration settings to `backend/core/config.py`
- [ ] Implement all 5 background jobs in `backend/app/tasks.py`
- [ ] Add cron schedules to worker startup
- [ ] Create unit tests (90%+ coverage)
- [ ] Create integration tests
- [ ] Add health check endpoint
- [ ] Update documentation
- [ ] Set up monitoring dashboard
- [ ] Test in staging environment
- [ ] Verify retry policies work correctly
- [ ] Verify WebSocket notifications broadcast
- [ ] Load test with 1000+ proposals
- [ ] Deploy to production with feature flag

---

## Success Metrics (Post-Deployment)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Auto-approval rate | 50%+ | Proposals auto-approved / Total proposals |
| Duplicate detection accuracy | 85%+ | Correct flags / Total scanned |
| Average queue age (high-confidence) | < 1 hour | Time to auto-approval |
| Job failure rate | < 1% | Failed executions / Total runs |
| Proposal expiration rate | < 10% | Expired / Total created |

---

**Document Status:** Ready for Implementation
**Estimated Effort:** 3-4 days
**Dependencies:** Phase 0-3 complete
**Next Phase:** Frontend Review UI (Phase 4b)
