# Performance & Scaling Guide

**Last Updated:** October 26, 2025
**Status:** Complete
**Audience:** System Administrators

## Database Indexing

### Critical Indexes for Automation

```sql
-- Version lookup by approved status (badge updates)
CREATE INDEX idx_versions_approved
ON versions(approved)
WHERE entity_type IN ('topic', 'atom');

-- Approval rule lookup
CREATE INDEX idx_approval_rules_is_active
ON approval_rules(is_active)
WHERE is_active = true;

-- Pending version count
CREATE INDEX idx_versions_approved_created
ON versions(approved, created_at)
WHERE approved = false;

-- Automation audit log timestamp range queries
CREATE INDEX idx_automation_audit_created_at_desc
ON automation_audit_log(created_at DESC);

-- Rule evaluation by ID
CREATE INDEX idx_automation_audit_rule_id_created
ON automation_audit_log(rule_id, created_at DESC);

-- Scheduler job lookup
CREATE INDEX idx_apscheduler_jobs_next_run
ON apscheduler_jobs(next_run_time)
WHERE job_state != 'REMOVED';
```

### Verify Index Health

```bash
# Check missing indexes
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE tablename LIKE 'version%' OR tablename LIKE 'approval%'
   ORDER BY tablename, indexname;"

# Check index fragmentation
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT
     schemaname,
     tablename,
     indexname,
     ROUND(100 * (pg_relation_size(indexrelid) - pg_relation_size(relfilenode)) /
           pg_relation_size(indexrelid), 1) as fragmentation_pct
   FROM pg_stat_user_indexes
   WHERE indexname LIKE '%automation%' OR indexname LIKE '%version%'
   HAVING ROUND(100 * (pg_relation_size(indexrelid) - pg_relation_size(relfilenode)) /
           pg_relation_size(indexrelid), 1) > 10;"

# If fragmentation > 10%, rebuild index:
REINDEX INDEX idx_versions_approved;
```

## Caching Strategies

### In-Memory Approval Rule Cache

Cache active rule to avoid repeated database hits:

```python
# app/services/cache_service.py

class ApprovalRuleCache:
    def __init__(self):
        self._cache = None
        self._cached_at = None
        self._ttl_seconds = 300  # 5-minute TTL

    async def get_active_rule(self, db: AsyncSession):
        now = datetime.now()

        # Check cache validity
        if self._cache and self._cached_at:
            if (now - self._cached_at).seconds < self._ttl_seconds:
                return self._cache

        # Cache miss, fetch from DB
        rule = await db.execute(
            select(ApprovalRule).where(ApprovalRule.is_active == true)
        )
        self._cache = rule.scalars().first()
        self._cached_at = now

        return self._cache

    async def invalidate(self):
        """Called when rule is updated"""
        self._cache = None
        self._cached_at = None
```

### WebSocket Pending Count Cache

Cache pending count to reduce per-request queries:

```python
# Cache pending count, update only on approval/rejection
class PendingCountCache:
    def __init__(self):
        self._pending_count = None
        self._last_update = None

    async def get_pending_count(self, db: AsyncSession):
        # Return cached if <10 seconds old
        if self._pending_count is not None:
            if (datetime.now() - self._last_update).seconds < 10:
                return self._pending_count

        # Query count
        count = await db.execute(
            select(func.count(Version.id))
            .where(Version.approved == False)
        )
        self._pending_count = count.scalar()
        self._last_update = datetime.now()
        return self._pending_count
```

## Concurrent Job Limits

### Configuration

```yaml
# backend/.env

# Number of automation jobs that can run simultaneously
SCHEDULER_MAX_CONCURRENT_JOBS=3

# Maximum versions to process in single job
AUTOMATION_BATCH_SIZE=500

# Job timeout (seconds)
JOB_TIMEOUT_SECONDS=30

# Queue size before dropping jobs
QUEUE_MAX_SIZE=1000
```

### Preventing Overload

```python
# app/services/automation_service.py

async def run_automation(db: AsyncSession):
    # Check system load
    cpu_percent = psutil.cpu_percent()
    memory_percent = psutil.virtual_memory().percent

    # Skip if overloaded
    if cpu_percent > 80:
        logger.warning(f"CPU at {cpu_percent}%, skipping automation run")
        return

    if memory_percent > 85:
        logger.warning(f"Memory at {memory_percent}%, skipping automation run")
        return

    # Proceed with automation
```

### Rate Limiting

```python
# Prevent approval spam
APPROVALS_PER_MINUTE = 100
REJECTIONS_PER_MINUTE = 50

async def bulk_approve_versions(db: AsyncSession, version_ids: list[int]):
    # Count recent approvals
    recent = await count_recent_approvals(db, minutes=1)

    if recent >= APPROVALS_PER_MINUTE:
        raise RateLimitError(f"Rate limit: {recent}/{APPROVALS_PER_MINUTE} approvals/min")

    # Proceed
```

## High-Volume Optimization

### Batch Processing

Instead of single versions, process in batches:

```python
# Bad: Process 1 version at a time
for version_id in [1, 2, 3, 4, 5]:
    await approve_version(db, version_id)  # 5 DB transactions

# Good: Batch in single transaction
await bulk_approve_versions(db, [1, 2, 3, 4, 5])  # 1 DB transaction
```

**Impact:**
- 500 versions: 10x faster (500 transactions → 1 transaction)
- Database load: 90% reduction

### Async Processing

Use async/await for I/O:

```python
# Bad: Sequential
for version in versions:
    await db.refresh(version)  # Waits for each

# Good: Concurrent
await asyncio.gather(*[
    db.refresh(version) for version in versions
])  # All in parallel
```

### Query Optimization

```sql
-- Bad: N+1 query problem
SELECT * FROM versions WHERE approved = false;
-- Then for each version:
SELECT * FROM topics WHERE id = version.topic_id;

-- Good: Join
SELECT v.*, t.*
FROM versions v
JOIN topics t ON v.topic_id = t.id
WHERE v.approved = false;
```

## Monitoring Metrics

### Key Metrics to Track

```yaml
automation:
  job_duration_ms:
    target: p95 < 10ms
    alert: p95 > 30ms

  false_positive_rate:
    target: < 5%
    alert: > 10%

  pending_backlog:
    target: < 20 versions
    alert: > 50 versions

  rule_evaluation_time:
    target: < 5ms per rule
    alert: > 20ms

database:
  query_time:
    target: p95 < 100ms
    alert: p95 > 500ms

  connection_pool:
    target: 10-20 connections
    alert: > 30 connections

  index_fragmentation:
    target: < 10%
    alert: > 20%
```

### Grafana Dashboard (Example)

```json
{
  "dashboard": {
    "title": "Automation Performance",
    "panels": [
      {
        "title": "Job Execution Time",
        "query": "automation_job_duration_ms"
      },
      {
        "title": "Pending Versions Backlog",
        "query": "SELECT COUNT(*) FROM versions WHERE approved = false"
      },
      {
        "title": "False Positive Rate",
        "query": "automation_false_positive_rate_pct"
      },
      {
        "title": "Database Connection Pool",
        "query": "database_connection_pool_size"
      }
    ]
  }
}
```

### Prometheus Alerts

```yaml
groups:
  - name: automation
    rules:
      - alert: HighAutomationDuration
        expr: histogram_quantile(0.95, automation_job_duration_ms) > 30
        for: 5m
        annotations:
          summary: "Automation jobs taking >30ms"

      - alert: HighFalsePositiveRate
        expr: automation_false_positive_rate_pct > 10
        for: 1h
        annotations:
          summary: "False positive rate >10%"

      - alert: LargePendingBacklog
        expr: versions_pending_count > 50
        for: 30m
        annotations:
          summary: "50+ pending versions"
```

## Scaling Strategies

### Vertical Scaling (Bigger Server)

Increase:
- CPU cores (more concurrent jobs)
- RAM (larger batch sizes, better caching)
- Disk IOPS (faster database queries)

**When to use:** Initial scale-up to handle 2-3x volume

### Horizontal Scaling (Multiple Workers)

```yaml
# docker-compose.yml
services:
  worker-1:
    image: task-tracker-worker
    environment:
      WORKER_ID: 1

  worker-2:
    image: task-tracker-worker
    environment:
      WORKER_ID: 2

  # Load balancer (future)
  nginx:
    upstream workers {
      server worker-1:8000;
      server worker-2:8000;
    }
```

**Setup:**
- Each worker independent scheduler
- Shared PostgreSQL backend
- Uses database-level locking to prevent duplicate runs

**When to use:** Scale to 10x+ volume

### Database Scaling

```sql
-- Partition large tables by date
CREATE TABLE versions_partitioned (
    -- same columns as versions
) PARTITION BY RANGE (created_at);

CREATE TABLE versions_2025_q4 PARTITION OF versions_partitioned
    FOR VALUES FROM ('2025-10-01') TO ('2026-01-01');
```

**Benefits:**
- Queries on old data faster
- Easier to archive/delete
- Can distribute across disks

## Capacity Planning

### Current Capacity

```
Single worker can handle:
├─ 1,000 versions/day (small)
├─ 10,000 versions/day (medium)
└─ 100,000 versions/day (large, with optimization)
```

### Growth Projections

```
Month 1: 1,000 versions/day
Month 3: 5,000 versions/day (5x growth)
Month 6: 10,000 versions/day (10x growth)
Month 12: 25,000 versions/day (25x growth)
```

### Action Plan

| Volume | Month | Action |
|--------|-------|--------|
| <5K/day | 0-3 | Single worker, no changes |
| 5-15K/day | 3-6 | Add indexes, enable caching |
| 15-50K/day | 6-9 | 2x worker, database optimization |
| 50K+/day | 9+ | Horizontal scaling, partitioning |

---

**Related:** [Job Management](job-management.md) | [Audit Logs](audit-logs.md)
