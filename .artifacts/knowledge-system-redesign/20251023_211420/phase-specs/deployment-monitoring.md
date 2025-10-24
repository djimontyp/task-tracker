# Deployment & Monitoring Strategy - Knowledge Proposal System

**Version:** 1.0
**Created:** October 23, 2025
**Status:** Ready for Implementation
**Lifecycle:** 6 weeks phased rollout

---

## Overview

Deployment strategy for Knowledge Proposal System following proven DevOps practices: containerized deployment, feature flags, gradual rollout, comprehensive monitoring, and automated rollback procedures.

**Goals:**
1. Zero-downtime deployment across all phases
2. Real-time monitoring of proposal workflow performance
3. Early detection of issues via alerting
4. Quick rollback capability (< 5 minutes)
5. Data integrity throughout deployment lifecycle

---

## 1. Deployment Phases

### Phase 0: Database Foundation (Week 1)

**Deployment Type:** Database Migration
**Risk Level:** HIGH
**Rollback Complexity:** MEDIUM

#### Pre-Deployment Checklist
```bash
# 1. Create backup of production database
docker compose exec postgres pg_dump -U postgres tasktracker > backup_pre_proposals_$(date +%Y%m%d_%H%M%S).sql

# 2. Test migration on copy of production data
docker compose exec postgres psql -U postgres -c "CREATE DATABASE tasktracker_test TEMPLATE tasktracker;"
uv run alembic upgrade head --sql > migration_preview.sql
cat migration_preview.sql  # Review all SQL statements

# 3. Validate migration can be rolled back
uv run alembic downgrade -1 --sql > rollback_preview.sql

# 4. Check database size and estimate migration time
docker compose exec postgres psql -U postgres tasktracker -c "SELECT pg_size_pretty(pg_database_size('tasktracker'));"
```

#### Deployment Steps
```bash
# 1. Enable maintenance mode (optional, if downtime needed)
# Set MAINTENANCE_MODE=true in .env

# 2. Stop worker to prevent processing during migration
docker compose stop worker

# 3. Run migration
uv run alembic upgrade head

# 4. Verify migration success
docker compose exec postgres psql -U postgres tasktracker -c "\dt proposals.*"

# 5. Restart worker
docker compose start worker

# 6. Monitor logs for errors
docker compose logs -f worker api
```

#### Rollback Procedure
```bash
# If migration fails or causes issues within 1 hour:
uv run alembic downgrade -1  # Revert last migration
docker compose restart worker api

# If data corruption detected:
docker compose stop postgres
docker compose down -v postgres
# Restore from backup
docker compose up -d postgres
docker compose exec -T postgres psql -U postgres tasktracker < backup_pre_proposals_TIMESTAMP.sql
docker compose up -d worker api
```

#### Success Criteria
- [ ] Migration completes without errors
- [ ] All tables created with correct schema
- [ ] Foreign keys and indexes in place
- [ ] Existing topics/atoms data intact
- [ ] API health check passes
- [ ] Worker processing messages normally

---

### Phase 1: Service Layer Refactor (Week 2)

**Deployment Type:** Application Code Update
**Risk Level:** MEDIUM
**Rollback Complexity:** LOW

#### Feature Flag Configuration

Add to `backend/app/config.py`:
```python
class Settings(BaseSettings):
    # Knowledge Proposal System Feature Flags
    KNOWLEDGE_PROPOSALS_ENABLED: bool = False
    KNOWLEDGE_PROPOSALS_AUTO_APPROVE_THRESHOLD: float = 0.95
    KNOWLEDGE_PROPOSALS_DUPLICATE_DETECTION_ENABLED: bool = False
    KNOWLEDGE_PROPOSALS_SIMILARITY_THRESHOLD: float = 0.85
    KNOWLEDGE_PROPOSALS_MAX_PENDING_PER_RUN: int = 100
    KNOWLEDGE_PROPOSALS_EXPIRATION_DAYS: int = 30
```

Environment variables in `.env`:
```bash
# Phase 1: Disabled by default
KNOWLEDGE_PROPOSALS_ENABLED=false

# Phase 2: Enable for staging
KNOWLEDGE_PROPOSALS_ENABLED=true  # staging only

# Phase 3: Enable for internal users (production)
KNOWLEDGE_PROPOSALS_ENABLED=true
KNOWLEDGE_PROPOSALS_AUTO_APPROVE_THRESHOLD=0.95

# Phase 4: Full rollout
KNOWLEDGE_PROPOSALS_ENABLED=true
KNOWLEDGE_PROPOSALS_DUPLICATE_DETECTION_ENABLED=true
KNOWLEDGE_PROPOSALS_AUTO_APPROVE_THRESHOLD=0.90
```

#### Deployment Steps
```bash
# 1. Build new images with updated code
docker compose build worker api

# 2. Deploy with feature flag disabled
echo "KNOWLEDGE_PROPOSALS_ENABLED=false" >> .env
docker compose up -d worker api

# 3. Verify services healthy
docker compose ps
curl -f http://localhost:8000/api/health

# 4. Run smoke tests
uv run pytest tests/services/test_knowledge_extraction_service.py -v

# 5. Enable feature flag for staging/testing
docker compose exec api bash -c "export KNOWLEDGE_PROPOSALS_ENABLED=true && python -c 'from app.config import get_settings; print(get_settings().KNOWLEDGE_PROPOSALS_ENABLED)'"
```

#### Rollback Procedure
```bash
# Instant rollback via feature flag
docker compose exec api sed -i 's/KNOWLEDGE_PROPOSALS_ENABLED=true/KNOWLEDGE_PROPOSALS_ENABLED=false/' /app/.env
docker compose restart api worker

# Or revert to previous image
docker compose pull api:previous_tag
docker compose up -d api worker
```

#### Success Criteria
- [ ] Services start successfully
- [ ] Feature flag toggles behavior correctly
- [ ] Old extraction flow still works when disabled
- [ ] New proposal flow works when enabled
- [ ] No performance degradation

---

### Phase 2: API Deployment (Week 3)

**Deployment Type:** API Endpoints Addition
**Risk Level:** LOW
**Rollback Complexity:** LOW

#### Blue-Green Deployment Strategy

```yaml
# docker-compose.prod.yml additions
services:
  api-blue:
    <<: *api-base
    container_name: task-tracker-api-blue
    environment:
      - DEPLOYMENT_SLOT=blue

  api-green:
    <<: *api-base
    container_name: task-tracker-api-green
    environment:
      - DEPLOYMENT_SLOT=green

  nginx:
    volumes:
      - ./nginx/upstream.conf:/etc/nginx/conf.d/upstream.conf
    # Nginx config switches between blue/green
```

Nginx upstream configuration:
```nginx
upstream api_backend {
    # Active slot (switch via config reload)
    server api-blue:8000;
    # server api-green:8000;
}

server {
    location /api/ {
        proxy_pass http://api_backend;
    }
}
```

#### Deployment Steps
```bash
# 1. Deploy green slot with new API endpoints
docker compose -f docker-compose.prod.yml up -d api-green

# 2. Wait for health check
until curl -f http://localhost:8001/api/health; do sleep 2; done

# 3. Run API integration tests against green slot
VITE_API_BASE_URL=http://localhost:8001 uv run pytest tests/api/v1/test_proposals.py -v

# 4. Switch nginx to green slot
sed -i 's/api-blue:8000/api-green:8000/' nginx/upstream.conf
docker compose exec nginx nginx -s reload

# 5. Monitor for errors (5 minutes)
docker compose logs -f api-green --tail=100

# 6. If stable, stop blue slot
docker compose stop api-blue
```

#### Rollback Procedure
```bash
# Instant rollback via nginx config
sed -i 's/api-green:8000/api-blue:8000/' nginx/upstream.conf
docker compose exec nginx nginx -s reload

# Blue slot still running, no downtime
```

#### Success Criteria
- [ ] All new endpoints return 200 for valid requests
- [ ] OpenAPI schema updated
- [ ] WebSocket events broadcasting correctly
- [ ] Response times < 200ms (p95)
- [ ] No 5xx errors in logs

---

### Phase 3: Duplicate Detection (Week 3-4)

**Deployment Type:** Service Enhancement
**Risk Level:** MEDIUM
**Rollback Complexity:** LOW (feature flag controlled)

#### Configuration
```bash
# Enable duplicate detection after testing
KNOWLEDGE_PROPOSALS_DUPLICATE_DETECTION_ENABLED=true
KNOWLEDGE_PROPOSALS_SIMILARITY_THRESHOLD=0.85

# Embedding API configuration
OPENAI_API_KEY=sk-...  # For embedding generation
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=100
EMBEDDING_CACHE_TTL=86400  # 24 hours
```

#### Deployment Steps
```bash
# 1. Pre-generate embeddings for existing entities (optional)
uv run python scripts/generate_embeddings.py --batch-size 100

# 2. Deploy with duplicate detection disabled initially
docker compose build worker api
docker compose up -d worker api

# 3. Enable for internal testing
docker compose exec api sed -i 's/DUPLICATE_DETECTION_ENABLED=false/DUPLICATE_DETECTION_ENABLED=true/' /app/.env
docker compose restart api

# 4. Monitor performance impact
# Check if similarity checks slow down proposal creation
```

#### Performance Benchmarks
```bash
# Baseline (before duplicate detection)
- Proposal creation time: < 500ms
- Extraction task duration: < 30s for 50 messages

# Target (with duplicate detection)
- Proposal creation time: < 1000ms
- Similarity check time: < 500ms
- Extraction task duration: < 45s for 50 messages
```

#### Success Criteria
- [ ] Similarity detection accuracy > 85%
- [ ] False positive rate < 5%
- [ ] No performance degradation > 50%
- [ ] Embedding cache working correctly

---

### Phase 4: Frontend Deployment (Week 4-5)

**Deployment Type:** Frontend Update
**Risk Level:** LOW
**Rollback Complexity:** VERY LOW

#### Build Process
```bash
# 1. Build production frontend
cd frontend
npm run build

# 2. Test production build locally
npm run preview

# 3. Build Docker image
docker compose build dashboard

# 4. Deploy via Docker Compose Watch (dev) or standard deploy (prod)
docker compose up -d dashboard
```

#### CDN/Cache Configuration
```nginx
# nginx/nginx.conf - Cache static assets
location /dashboard/assets/ {
    proxy_pass http://dashboard:3000/assets/;
    proxy_cache_valid 200 1d;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

#### Rollback Procedure
```bash
# Instant rollback to previous image
docker compose pull dashboard:previous_tag
docker compose up -d dashboard

# Or serve previous build from nginx directly
cp -r frontend/dist.backup /var/www/dashboard
```

#### Success Criteria
- [ ] UI loads without console errors
- [ ] WebSocket connection established
- [ ] Proposal cards render correctly
- [ ] Bulk actions work
- [ ] Mobile responsive design works
- [ ] Lighthouse score > 90

---

### Phase 5: Automation Deployment (Week 5-6)

**Deployment Type:** Background Jobs
**Risk Level:** MEDIUM
**Rollback Complexity:** LOW

#### TaskIQ Job Configuration
```python
# backend/app/tasks.py
from taskiq import TaskiqScheduler

scheduler = TaskiqScheduler(nats_broker)

@scheduler.task(cron="*/5 * * * *")  # Every 5 minutes
async def auto_review_high_confidence_proposals():
    if not settings.KNOWLEDGE_PROPOSALS_AUTO_APPROVE_ENABLED:
        return
    # Auto-approve logic here

@scheduler.task(cron="0 2 * * *")  # Daily at 2 AM
async def expire_old_proposals():
    if not settings.KNOWLEDGE_PROPOSALS_EXPIRATION_ENABLED:
        return
    # Expiration logic here
```

#### Deployment Steps
```bash
# 1. Deploy worker with new scheduled tasks
docker compose build worker
docker compose up -d worker

# 2. Verify scheduler running
docker compose logs worker | grep "Scheduler started"

# 3. Enable auto-approval gradually
# Start with very high threshold, lower over time
KNOWLEDGE_PROPOSALS_AUTO_APPROVE_THRESHOLD=0.98
docker compose restart worker

# 4. Monitor auto-approval decisions
docker compose logs -f worker | grep "Auto-approved"
```

#### Success Criteria
- [ ] Scheduled tasks execute on time
- [ ] Auto-approval rate matches expectations
- [ ] No failed task executions
- [ ] Audit trail records all decisions

---

## 2. Feature Flag Management

### Flag Lifecycle

```
DISABLED (default)
    → ENABLED_STAGING (week 3)
    → ENABLED_INTERNAL (week 4)
    → ENABLED_ALL_USERS (week 6)
    → FLAG_REMOVED (week 8)
```

### Runtime Flag Toggle

```python
# backend/app/services/feature_flags.py
class FeatureFlagService:
    async def is_enabled(self, flag: str, user_id: int | None = None) -> bool:
        if flag == "knowledge_proposals":
            if settings.KNOWLEDGE_PROPOSALS_ENABLED:
                if settings.KNOWLEDGE_PROPOSALS_INTERNAL_ONLY:
                    return user_id in await self.get_internal_users()
                return True
        return False
```

### Feature Flag Dashboard

```bash
# Check current flags via API
curl http://localhost:8000/api/v1/admin/feature-flags

# Toggle via admin UI or API
curl -X POST http://localhost:8000/api/v1/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "knowledge_proposals", "enabled": true}'
```

---

## 3. Monitoring Metrics

### Application Metrics (Prometheus Format)

```python
# backend/app/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Proposal Creation Metrics
proposal_creation_total = Counter(
    "knowledge_proposal_creation_total",
    "Total proposals created",
    ["entity_type", "status"]
)

proposal_creation_duration = Histogram(
    "knowledge_proposal_creation_duration_seconds",
    "Time to create proposal",
    ["entity_type"]
)

# Review Metrics
proposal_review_total = Counter(
    "knowledge_proposal_review_total",
    "Total proposals reviewed",
    ["action", "entity_type"]
)

proposal_approval_rate = Gauge(
    "knowledge_proposal_approval_rate",
    "Percentage of proposals approved",
    ["entity_type"]
)

# Duplicate Detection Metrics
similarity_check_duration = Histogram(
    "knowledge_similarity_check_duration_seconds",
    "Time to check for duplicates"
)

duplicates_detected_total = Counter(
    "knowledge_duplicates_detected_total",
    "Total duplicates detected",
    ["detection_type"]  # exact, semantic, fuzzy
)

# Extraction Run Metrics
extraction_run_duration = Histogram(
    "knowledge_extraction_run_duration_seconds",
    "Time to complete extraction run"
)

extraction_run_proposals_created = Histogram(
    "knowledge_extraction_run_proposals_created",
    "Number of proposals per extraction run"
)

# Auto-Approval Metrics
auto_approval_total = Counter(
    "knowledge_auto_approval_total",
    "Total auto-approved proposals",
    ["confidence_bucket"]  # 0.9-0.95, 0.95-1.0
)
```

### Database Metrics

```sql
-- Proposal queue depth
SELECT status, COUNT(*)
FROM topic_proposals
GROUP BY status;

SELECT status, COUNT(*)
FROM atom_proposals
GROUP BY status;

-- Average review time
SELECT
    AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))) as avg_review_time_seconds
FROM topic_proposals
WHERE status = 'approved'
    AND reviewed_at IS NOT NULL;

-- Approval rate by confidence
SELECT
    CASE
        WHEN confidence < 0.7 THEN '0.0-0.7'
        WHEN confidence < 0.85 THEN '0.7-0.85'
        WHEN confidence < 0.95 THEN '0.85-0.95'
        ELSE '0.95-1.0'
    END as confidence_bucket,
    COUNT(CASE WHEN status = 'approved' THEN 1 END)::float / COUNT(*) as approval_rate
FROM atom_proposals
GROUP BY confidence_bucket;

-- Duplicate detection accuracy
SELECT
    COUNT(CASE WHEN similar_entity_id IS NOT NULL THEN 1 END)::float / COUNT(*) as duplicate_rate
FROM topic_proposals;
```

### Grafana Dashboards

**Dashboard 1: Proposal System Health**
```yaml
Panels:
  - Total Proposals Created (24h) - Counter
  - Proposal Queue Depth - Gauge (by status)
  - Proposal Creation Rate - Graph (proposals/minute)
  - Average Review Time - Gauge (seconds)
  - Approval Rate - Gauge (percentage)
  - Auto-Approval Rate - Gauge (percentage)
```

**Dashboard 2: Performance Metrics**
```yaml
Panels:
  - Proposal Creation Duration - Histogram (p50, p95, p99)
  - Similarity Check Duration - Histogram
  - Extraction Run Duration - Graph
  - API Response Times - Histogram (/api/v1/knowledge/proposals/*)
  - WebSocket Event Latency - Graph
```

**Dashboard 3: Duplicate Detection**
```yaml
Panels:
  - Duplicates Detected (24h) - Counter (by type)
  - Similarity Check Performance - Graph (checks/sec)
  - Merge Operations - Counter
  - Duplicate Detection Accuracy - Gauge (manual review sample)
```

### Metrics Endpoints

```python
# backend/app/api/v1/metrics.py
from fastapi import APIRouter
from prometheus_client import generate_latest

router = APIRouter()

@router.get("/metrics")
async def prometheus_metrics():
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

Prometheus scrape configuration:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'tasktracker-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s

  - job_name: 'tasktracker-postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
    scrape_interval: 30s
```

---

## 4. Alerting Rules

### Critical Alerts (PagerDuty)

```yaml
# prometheus/alerts.yml
groups:
  - name: knowledge_proposals_critical
    interval: 1m
    rules:
      # Proposal creation failures
      - alert: ProposalCreationFailureRate
        expr: |
          rate(knowledge_proposal_creation_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
          component: knowledge_proposals
        annotations:
          summary: "High proposal creation failure rate"
          description: "{{ $value }} proposals failing per second"

      # Database connection issues
      - alert: ProposalDatabaseConnectionFailure
        expr: |
          up{job="tasktracker-postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Proposal database unreachable"

      # Worker processing stalled
      - alert: KnowledgeExtractionStalled
        expr: |
          time() - knowledge_extraction_last_run_timestamp_seconds > 600
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Knowledge extraction not running"
          description: "No extraction runs in last 10 minutes"

      # Queue depth explosion
      - alert: ProposalQueueBacklog
        expr: |
          knowledge_proposal_queue_depth{status="pending"} > 1000
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Proposal queue backlog critical"
          description: "{{ $value }} pending proposals in queue"
```

### Warning Alerts (Slack)

```yaml
  - name: knowledge_proposals_warnings
    interval: 5m
    rules:
      # Performance degradation
      - alert: ProposalCreationSlow
        expr: |
          histogram_quantile(0.95,
            rate(knowledge_proposal_creation_duration_seconds_bucket[5m])
          ) > 2.0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Proposal creation taking too long"
          description: "p95 duration: {{ $value }}s (threshold: 2s)"

      # Low approval rate (indicates LLM issues)
      - alert: LowProposalApprovalRate
        expr: |
          knowledge_proposal_approval_rate < 0.5
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Unusually low approval rate"
          description: "Only {{ $value | humanizePercentage }} proposals approved"

      # Duplicate detection not working
      - alert: DuplicateDetectionDisabled
        expr: |
          rate(knowledge_duplicates_detected_total[1h]) == 0
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "No duplicates detected recently"
          description: "Duplicate detection may be broken"

      # High review backlog
      - alert: ProposalReviewBacklog
        expr: |
          knowledge_proposal_queue_depth{status="pending"} > 500
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Proposal review backlog building up"
          description: "{{ $value }} proposals awaiting review"
```

### Alerting Channels

```yaml
# alertmanager.yml
route:
  receiver: 'slack-default'
  group_by: ['severity', 'component']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h

  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<PAGERDUTY_KEY>'

  - name: 'slack-warnings'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK>'
        channel: '#tasktracker-alerts'
        title: 'Knowledge Proposals Warning'

  - name: 'slack-default'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK>'
        channel: '#tasktracker-monitoring'
```

---

## 5. Performance Benchmarks

### Baseline Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Proposal Creation Time | < 1s (p95) | > 3s |
| Similarity Check Time | < 500ms (p95) | > 2s |
| API Response Time | < 200ms (p95) | > 1s |
| Extraction Run Duration | < 45s (50 messages) | > 2min |
| Database Query Time | < 100ms (p95) | > 500ms |
| WebSocket Event Latency | < 50ms (p95) | > 200ms |
| Memory Usage (API) | < 512MB | > 1GB |
| Memory Usage (Worker) | < 1GB | > 2GB |

### Load Testing Scenarios

```python
# tests/load/test_proposal_load.py
import asyncio
from locust import HttpUser, task, between

class ProposalLoadTest(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def list_proposals(self):
        self.client.get("/api/v1/knowledge/proposals?status=pending")

    @task(2)
    def approve_proposal(self):
        proposals = self.client.get("/api/v1/knowledge/proposals?limit=1").json()
        if proposals["items"]:
            proposal_id = proposals["items"][0]["id"]
            self.client.post(f"/api/v1/knowledge/proposals/{proposal_id}/approve")

    @task(1)
    def batch_approve(self):
        proposals = self.client.get(
            "/api/v1/knowledge/proposals?confidence_min=0.9&limit=10"
        ).json()
        proposal_ids = [p["id"] for p in proposals["items"]]
        self.client.post(
            "/api/v1/knowledge/proposals/batch/approve",
            json={"proposal_ids": proposal_ids}
        )
```

Run load tests:
```bash
# Test 50 concurrent users
locust -f tests/load/test_proposal_load.py --host=http://localhost:8000 --users 50 --spawn-rate 5

# Performance goals:
# - 95th percentile response time < 200ms
# - No failed requests
# - CPU usage < 80%
# - Memory usage stable (no leaks)
```

---

## 6. Database Backup Strategy

### Automated Backups

```bash
# Backup script: scripts/backup_database.sh
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/tasktracker_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U postgres tasktracker | gzip > "$BACKUP_FILE"

find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
aws s3 cp "$BACKUP_FILE" "s3://tasktracker-backups/postgres/" || echo "S3 upload failed"
```

Cron schedule:
```cron
# Backup every 6 hours
0 */6 * * * /usr/local/bin/backup_database.sh

# Daily full backup at 3 AM
0 3 * * * /usr/local/bin/backup_database.sh --full

# Weekly backup with WAL archiving
0 4 * * 0 /usr/local/bin/backup_database.sh --full --wal-archive
```

### Point-in-Time Recovery

```bash
# Enable WAL archiving in postgres config
docker compose exec postgres psql -U postgres -c "ALTER SYSTEM SET wal_level = replica;"
docker compose exec postgres psql -U postgres -c "ALTER SYSTEM SET archive_mode = on;"
docker compose exec postgres psql -U postgres -c "ALTER SYSTEM SET archive_command = 'test ! -f /var/lib/postgresql/wal_archive/%f && cp %p /var/lib/postgresql/wal_archive/%f';"
docker compose restart postgres
```

### Backup Verification

```bash
# Test restore weekly
restore_test.sh:
#!/bin/bash
docker compose exec postgres dropdb -U postgres tasktracker_restore_test || true
docker compose exec postgres createdb -U postgres tasktracker_restore_test
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U postgres tasktracker_restore_test
docker compose exec postgres psql -U postgres tasktracker_restore_test -c "SELECT COUNT(*) FROM topics;"
```

### Backup Retention Policy

```
Hourly backups:  Keep 24 (1 day)
Daily backups:   Keep 7 (1 week)
Weekly backups:  Keep 4 (1 month)
Monthly backups: Keep 12 (1 year)
```

---

## 7. Rollback Procedures

### Immediate Rollback (< 5 minutes)

**Scenario 1: Feature Flag Rollback**
```bash
# Step 1: Disable feature via environment variable
docker compose exec api sed -i 's/KNOWLEDGE_PROPOSALS_ENABLED=true/KNOWLEDGE_PROPOSALS_ENABLED=false/' /app/.env

# Step 2: Restart services
docker compose restart api worker

# Step 3: Verify old behavior restored
curl http://localhost:8000/api/v1/knowledge/topics
```

**Scenario 2: Code Rollback**
```bash
# Step 1: Pull previous image
docker compose pull api:v1.2.3 worker:v1.2.3

# Step 2: Update docker-compose.yml
sed -i 's/api:latest/api:v1.2.3/' docker-compose.yml
sed -i 's/worker:latest/worker:v1.2.3/' docker-compose.yml

# Step 3: Restart services
docker compose up -d api worker

# Step 4: Verify health
curl http://localhost:8000/api/health
```

**Scenario 3: Database Rollback**
```bash
# Step 1: Stop services writing to database
docker compose stop worker api

# Step 2: Revert migration
uv run alembic downgrade -1

# Step 3: Restart services
docker compose start worker api

# Step 4: Verify data integrity
docker compose exec postgres psql -U postgres tasktracker -c "SELECT COUNT(*) FROM topics;"
```

### Partial Rollback Strategies

**Rollback Auto-Approval Only:**
```bash
docker compose exec api sed -i 's/AUTO_APPROVE_ENABLED=true/AUTO_APPROVE_ENABLED=false/' /app/.env
docker compose restart worker
```

**Rollback Duplicate Detection Only:**
```bash
docker compose exec api sed -i 's/DUPLICATE_DETECTION_ENABLED=true/DUPLICATE_DETECTION_ENABLED=false/' /app/.env
docker compose restart api
```

### Rollback Decision Matrix

| Issue | Severity | Rollback Action | Timeline |
|-------|----------|----------------|----------|
| API error rate > 5% | CRITICAL | Full code rollback | < 5 min |
| Proposal creation failing | CRITICAL | Disable feature flag | < 2 min |
| Database migration corrupted data | CRITICAL | Database rollback + restore | < 15 min |
| Performance degraded 2x | HIGH | Code rollback or disable duplicate detection | < 10 min |
| Low approval rate (< 30%) | MEDIUM | Adjust threshold, no rollback | N/A |
| UI bugs (non-blocking) | LOW | Fix forward, no rollback | N/A |

### Post-Rollback Actions

1. **Incident Report:**
   - What triggered rollback?
   - What was rolled back?
   - Was data lost?
   - How long was system degraded?

2. **Root Cause Analysis:**
   - Why did the deployment fail?
   - What tests missed the issue?
   - How can we prevent recurrence?

3. **Re-Deployment Plan:**
   - Fix identified issues
   - Add tests to cover failure scenario
   - Schedule re-deployment (not immediate)

---

## 8. Health Checks

### Service Health Endpoints

```python
# backend/app/api/v1/health.py
from fastapi import APIRouter, status
from sqlalchemy import text
from app.db import get_session

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "api"}

@router.get("/health/detailed")
async def detailed_health_check():
    checks = {}

    # Database connectivity
    try:
        async with get_session() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok"}
    except Exception as e:
        checks["database"] = {"status": "error", "message": str(e)}

    # NATS connectivity
    try:
        from app.tasks import nats_broker
        if nats_broker.is_connected:
            checks["nats"] = {"status": "ok"}
        else:
            checks["nats"] = {"status": "disconnected"}
    except Exception as e:
        checks["nats"] = {"status": "error", "message": str(e)}

    # Proposal system
    if settings.KNOWLEDGE_PROPOSALS_ENABLED:
        try:
            async with get_session() as session:
                result = await session.execute(
                    text("SELECT COUNT(*) FROM topic_proposals WHERE status = 'pending'")
                )
                pending_count = result.scalar()
            checks["proposals"] = {
                "status": "ok",
                "pending_count": pending_count
            }
        except Exception as e:
            checks["proposals"] = {"status": "error", "message": str(e)}

    overall_status = "ok" if all(c.get("status") == "ok" for c in checks.values()) else "degraded"

    return {
        "status": overall_status,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }
```

### Docker Health Checks

```yaml
# docker-compose.yml updates
services:
  api:
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/api/health/detailed || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  worker:
    healthcheck:
      test: ["CMD-SHELL", "pgrep -f 'taskiq worker' && python -c 'from app.tasks import nats_broker; exit(0 if nats_broker.is_connected else 1)' || exit 1"]
      interval: 60s
      timeout: 10s
      retries: 3
      start_period: 60s

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d tasktracker && psql -U postgres -d tasktracker -c 'SELECT COUNT(*) FROM topics' || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 5
      start_period: 10s
```

---

## 9. Deployment Checklist

### Pre-Deployment (Day Before)

- [ ] Review all code changes in PR
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance tests completed
- [ ] Documentation updated
- [ ] Database backup completed
- [ ] Rollback plan reviewed
- [ ] Stakeholders notified
- [ ] Deployment window scheduled (off-peak)

### During Deployment

- [ ] Feature flags configured correctly
- [ ] Database migration applied successfully
- [ ] Services restarted without errors
- [ ] Health checks passing
- [ ] Monitoring dashboards showing normal metrics
- [ ] Smoke tests executed successfully
- [ ] No critical alerts triggered

### Post-Deployment (First Hour)

- [ ] Monitor error rates (< 1%)
- [ ] Monitor response times (within SLA)
- [ ] Check proposal creation flow
- [ ] Verify WebSocket events broadcasting
- [ ] Review logs for warnings/errors
- [ ] Verify database query performance
- [ ] Test rollback procedure (dry run)

### Post-Deployment (First Week)

- [ ] Daily metrics review
- [ ] User feedback collection
- [ ] Approval rate analysis
- [ ] Duplicate detection accuracy review
- [ ] Performance trending analysis
- [ ] Identify optimization opportunities

---

## 10. Incident Response

### Severity Levels

**SEV-1 (Critical):**
- Service completely down
- Data loss occurring
- Security breach

**Response:** Page on-call engineer immediately, begin incident management protocol.

**SEV-2 (High):**
- Significant performance degradation
- Feature partially broken
- High error rate (> 5%)

**Response:** Notify team within 15 minutes, investigate and fix within 2 hours.

**SEV-3 (Medium):**
- Minor performance issues
- Non-critical feature broken
- Elevated error rate (1-5%)

**Response:** Create ticket, fix within 24 hours.

**SEV-4 (Low):**
- Cosmetic issues
- Low impact bugs

**Response:** Create ticket, fix in next release.

### Incident Runbook

```markdown
# Incident: Proposal System Down

## Symptoms
- Proposal creation failing
- API returning 500 errors
- Worker not processing extractions

## Investigation Steps
1. Check service health: `docker compose ps`
2. Check logs: `docker compose logs api worker -f --tail=100`
3. Check database connectivity: `docker compose exec postgres psql -U postgres tasktracker -c "SELECT 1"`
4. Check NATS connectivity: `curl http://localhost:8222/healthz`
5. Check feature flag status: `grep KNOWLEDGE_PROPOSALS_ENABLED .env`

## Common Causes
- Database connection pool exhausted
- NATS broker disconnected
- Memory/CPU resource exhaustion
- Database migration failed

## Resolution Steps
1. Restart affected services: `docker compose restart api worker`
2. If database issue: Check connection limits, restart postgres
3. If NATS issue: Restart NATS broker
4. If resource issue: Scale up containers or add resource limits
5. If migration issue: Rollback migration and restore from backup

## Prevention
- Monitor connection pool metrics
- Set proper resource limits
- Test migrations on staging first
- Implement circuit breakers
```

---

## Summary

This deployment strategy provides:

1. **Phased Rollout:** 6-week gradual deployment minimizing risk
2. **Feature Flags:** Runtime control without redeployment
3. **Comprehensive Monitoring:** 15+ metrics tracked via Prometheus/Grafana
4. **Proactive Alerting:** Critical and warning alerts to Slack/PagerDuty
5. **Performance Benchmarks:** Clear SLA targets for all operations
6. **Automated Backups:** Hourly backups with point-in-time recovery
7. **Quick Rollback:** < 5 minute rollback procedures for all scenarios
8. **Health Checks:** Multi-layer health validation (API, DB, NATS, Worker)

**Key Success Factors:**
- Start with feature disabled, enable gradually
- Monitor metrics closely during rollout
- Quick rollback capability at all times
- Clear communication with stakeholders
- Automated testing at every stage

**Estimated Effort:**
- Setup: 2 days (monitoring, alerting, scripts)
- Per-phase deployment: 2-4 hours
- Total deployment time: 6 weeks (phased)

**Next Steps:**
1. Set up monitoring infrastructure (Prometheus + Grafana)
2. Configure alerting channels (Slack, PagerDuty)
3. Create deployment scripts and runbooks
4. Execute Phase 0 deployment

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Owner:** DevOps Team
**Review Frequency:** Weekly during rollout
