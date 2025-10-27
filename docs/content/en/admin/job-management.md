# Job Management Guide

**Last Updated:** October 26, 2025
**Status:** Complete
**Audience:** System Administrators

## APScheduler Internals

Task Tracker uses APScheduler (Advanced Python Scheduler) as the background task scheduler.

### Architecture Overview

```
┌─────────────┐
│  Database   │  PostgreSQL job store
│  (apscheduler_jobs table)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ APScheduler │  In-memory scheduler
│   Daemon    │  Executes scheduled tasks
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Worker     │  FastAPI Celery/TaskIQ worker
│  Process    │  Processes automation rules
└─────────────┘
```

### Job States

```
PENDING      → Waiting to be scheduled
SCHEDULED    → In schedule, waiting for time
EXECUTING    → Currently running
COMPLETED    → Finished successfully
FAILED       → Error during execution
PAUSED       → Manually paused by admin
REMOVED      → Deleted from schedule
```

### Job Store (Database)

Jobs are persisted in PostgreSQL table:

```sql
SELECT * FROM apscheduler_jobs;

-- Columns:
-- id: job identifier
-- func_ref: Python function path
-- args: Job arguments (JSON)
-- kwargs: Job keyword arguments (JSON)
-- next_run_time: When job runs next
-- job_state: PENDING/SCHEDULED/EXECUTED
-- misfire_grace_time: Grace period if server down
```

## Job Triggering

### Automatic Triggers

Jobs trigger automatically on schedule (cron expression).

**Example:**
```
Schedule: 0 9 * * *  (Daily 9 AM)
DB Entry: next_run_time = 2025-10-27 09:00:00 UTC
Scheduler: Monitors table, runs when now() >= next_run_time
```

### Manual Triggers

Admins can trigger jobs immediately:

**Via Dashboard (if available):**
```
Settings → Automation → Run Now button
```

**Via CLI:**
```bash
# Get job ID
docker exec task-tracker-api \
  psql -U postgres -d tasktracker -c \
  "SELECT id, func_ref FROM apscheduler_jobs WHERE func_ref LIKE '%automation%';"

# Trigger manually (if API endpoint exists)
curl -X POST http://localhost/api/v1/automation/trigger
```

**Via Database (last resort):**
```sql
-- Force next_run_time to now (triggers on next scheduler check)
UPDATE apscheduler_jobs
SET next_run_time = NOW()
WHERE func_ref = 'app.services.automation_service.run_automation';
```

## Job Execution Logs

### Where Logs Are Stored

**Option 1: Docker Logs (Recommended)**

```bash
docker logs task-tracker-worker --follow
```

Filter for automation:
```bash
docker logs task-tracker-worker | grep -i "automation\|schedule"
```

**Option 2: File Logs (if configured)**

```bash
tail -f /var/log/task-tracker/worker.log

# Or just automation logs
tail -f /var/log/task-tracker/automation.log | grep -v DEBUG
```

**Option 3: Database Audit Log**

```sql
SELECT * FROM automation_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 100;
```

### Reading Log Output

**Successful execution:**
```
2025-10-26 09:00:02 INFO Automation run started
2025-10-26 09:00:02 INFO Evaluating 47 pending versions
2025-10-26 09:00:03 INFO Rule 'High Confidence' matched 34 versions
2025-10-26 09:00:04 INFO Auto-approved 34 versions
2025-10-26 09:00:04 INFO WebSocket broadcast: pending_count_updated
2025-10-26 09:00:05 INFO Automation run completed (3.2s)
```

**Failed execution:**
```
2025-10-26 09:00:00 INFO Automation run started
2025-10-26 09:00:01 ERROR Database connection refused
2025-10-26 09:00:01 ERROR Automation run failed: psycopg2.OperationalError
2025-10-26 09:00:01 INFO Retrying in 60 seconds...
```

**Error recovery:**
```
2025-10-26 09:00:00 ERROR Previous run failed, attempting recovery
2025-10-26 09:00:02 INFO Database connection restored
2025-10-26 09:00:03 INFO Resuming failed job
2025-10-26 09:00:05 INFO Automation run completed (recovered)
```

## Error Recovery

### Common Failures

| Error | Cause | Recovery |
|-------|-------|----------|
| Database connection refused | PostgreSQL offline | Restart postgres |
| Job not found | Scheduler lost job in memory | Restart worker |
| Timeout (>30s) | Rule evaluation too slow | Optimize database indexes |
| Out of memory | Too many versions pending | Reduce batch size |

### Recovery Steps

**Step 1: Identify the problem**

```bash
docker logs task-tracker-worker --tail=50
```

**Step 2: Restart the affected service**

```bash
# Restart just the worker
docker compose restart worker

# Or full restart
docker compose down && docker compose up -d
```

**Step 3: Monitor recovery**

```bash
# Watch logs for successful run
docker logs task-tracker-worker --follow

# Check database for updated next_run_time
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT id, next_run_time FROM apscheduler_jobs LIMIT 1;"
```

**Step 4: Verify execution**

```bash
# Check audit log for recent entries
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT COUNT(*) as recent_runs FROM automation_audit_log
   WHERE created_at > NOW() - INTERVAL '10 minutes';"
```

## Concurrent Jobs Management

### Configuration

```yaml
# backend/.env
SCHEDULER_MAX_CONCURRENT_JOBS=5
JOB_TIMEOUT_SECONDS=30
JOB_RETRY_COUNT=3
JOB_RETRY_DELAY_SECONDS=60
```

### Preventing Job Overlap

If job takes >6 hours to complete, next instance tries to start:

**Solution: Mutex-like locking**

```python
# app/services/automation_service.py

async def run_automation(db: AsyncSession):
    # Check if already running
    running = await check_running_job("automation_run")
    if running:
        logger.info("Previous run still executing, skipping")
        return

    # Mark as running
    await mark_job_running("automation_run")

    try:
        # Do work
        pass
    finally:
        # Mark as complete
        await mark_job_complete("automation_run")
```

### Monitoring Current Jobs

```bash
# Check running jobs (via database)
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT id, func_ref, next_run_time, job_state
   FROM apscheduler_jobs WHERE job_state = 'EXECUTING';"
```

## Performance Tuning

### Database Indexes

Critical indexes for scheduler performance:

```sql
-- Job lookup by next_run_time
CREATE INDEX idx_apscheduler_jobs_next_run_time
ON apscheduler_jobs(next_run_time);

-- Automation audit log lookup
CREATE INDEX idx_automation_audit_log_created_at
ON automation_audit_log(created_at);

-- Version lookup by approved status
CREATE INDEX idx_versions_approved
ON versions(approved);

-- Approval rule lookup
CREATE INDEX idx_approval_rules_active
ON approval_rules(is_active);
```

**Verify indexes exist:**

```bash
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "\d apscheduler_jobs"  # Shows indexes on table
```

### Job Duration Monitoring

Track how long jobs take:

```sql
-- Average execution time per day
SELECT
  DATE(created_at) as date,
  COUNT(*) as executions,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) as max_seconds
FROM automation_audit_log
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

**Targets:**
- Average execution: 1-5 seconds
- Maximum execution: <30 seconds
- P95 (95th percentile): <10 seconds

**If too slow:**
1. Check pending version count (reduce batch size)
2. Add database indexes (see above)
3. Profile rule evaluation logic
4. Consider splitting into multiple smaller jobs

### Resource Limits

Set Docker limits for worker process:

```yaml
# docker-compose.yml
services:
  worker:
    deploy:
      resources:
        limits:
          cpus: '2'        # Max 2 CPU cores
          memory: 2G       # Max 2GB memory
        reservations:
          cpus: '1'        # Request 1 CPU core
          memory: 1G       # Request 1GB memory
```

## Health Checks

### Scheduler Health Endpoint

```bash
# Check if scheduler is responsive
curl http://localhost/api/v1/health/scheduler

# Expected response:
{
  "status": "healthy",
  "next_scheduled_run": "2025-10-27 09:00:00 UTC",
  "last_execution": "2025-10-26 09:00:02 UTC",
  "execution_time_ms": 3200,
  "pending_jobs": 1
}
```

### Database Connection Check

```bash
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT NOW();"  # Should return current timestamp
```

### Job Staleness Alert

Set up monitoring for jobs that haven't run:

```bash
# Script to check if job ran in last 24 hours
docker exec task-tracker-api psql -U postgres -d tasktracker -c \
  "SELECT
     id,
     next_run_time,
     NOW() - next_run_time as overdue_time
   FROM apscheduler_jobs
   WHERE next_run_time < NOW() - INTERVAL '1 hour';"

# If this returns rows, jobs are stale and need investigation
```

## Troubleshooting Checklist

**Job not running?**
- [ ] Worker service running? (`docker ps`)
- [ ] Database connection working? (`psql` test)
- [ ] Job scheduled in DB? (check apscheduler_jobs table)
- [ ] Cron expression valid? (test at crontab.guru)
- [ ] Server timezone correct? (check NOW() vs. expected time)
- [ ] Job timeout too short? (increase SCHEDULER_JOB_TIMEOUT)

**Job runs but nothing happens?**
- [ ] Audit log shows execution? (check automation_audit_log)
- [ ] Rule conditions matching? (check WITH preview)
- [ ] Database transaction committing? (check for locks)
- [ ] Error suppressed? (check logs for warnings)

**Job takes too long?**
- [ ] Pending version count? (reduce batch or run more frequently)
- [ ] Database indexes? (run ANALYZE)
- [ ] Rule evaluation efficient? (profile slow rules)
- [ ] Concurrent jobs? (check job_state in DB)

**High CPU/Memory usage?**
- [ ] Too many versions in batch? (split into multiple jobs)
- [ ] Memory leak? (restart worker, monitor over time)
- [ ] Inefficient query? (check slow_query_log)
- [ ] Resource limits too low? (increase docker limits)

---

**Related:** [Audit Logs Guide](audit-logs.md) | [Performance & Scaling](performance-scaling.md)
