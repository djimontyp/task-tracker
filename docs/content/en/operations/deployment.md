# Deployment & Operations Guide

**Last Updated:** October 26, 2025
**Target Audience:** DevOps Engineers, SRE Teams
**Prerequisites:** Docker Compose 2.x, PostgreSQL client tools, uv package manager

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Deployment Procedures](#deployment-procedures)
3. [Monitoring & Observability](#monitoring--observability)
4. [Troubleshooting Runbook](#troubleshooting-runbook)
5. [Performance Tuning](#performance-tuning)
6. [Rollback Procedures](#rollback-procedures)

---

## System Architecture Overview

### Service Dependency Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                      LAYER 4: Gateway                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Nginx (Alpine)                                            │  │
│  │  Ports: 80 (HTTP), 443 (HTTPS)                             │  │
│  │  Routes: /api → api:8000, /dashboard → dashboard:3000      │  │
│  │  WebSocket: /ws → api:8000 (86400s timeout)                │  │
│  └──────────────────┬────────────────────┬────────────────────┘  │
└────────────────────┼────────────────────┼───────────────────────┘
                     │                    │
┌────────────────────┼────────────────────┼───────────────────────┐
│                    │  LAYER 3: Frontend │                       │
│  ┌─────────────────▼─────────────────┐  │                       │
│  │  Dashboard (React 18 + Vite)      │  │                       │
│  │  Port: 3000 (internal)            │  │                       │
│  │  Features: Real-time WebSocket    │  │                       │
│  │  Health: HTTP 200 on /            │  │                       │
│  └───────────────────────────────────┘  │                       │
└─────────────────────────────────────────┼───────────────────────┘
                                          │
┌─────────────────────────────────────────┼───────────────────────┐
│  LAYER 2: Application Services          │                       │
│  ┌──────────────────────────────────────▼──┐                    │
│  │  FastAPI Backend                        │                    │
│  │  Port: 8000 (internal + external)       │                    │
│  │  Workers: 4 Uvicorn processes            │                    │
│  │  Endpoints: /api/health, /ws            │                    │
│  └──────────────┬──────────────────────────┘                    │
│                 │                                                │
│  ┌──────────────▼──────────────────────────┐                    │
│  │  TaskIQ Worker                          │                    │
│  │  No external ports                       │                    │
│  │  Jobs: 10 background task types          │                    │
│  │  Health: pgrep -f 'taskiq worker'       │                    │
│  └──────────────┬──────────────────────────┘                    │
│                 │                                                │
└─────────────────┼────────────────────────────────────────────────┘
                  │
┌─────────────────┼────────────────────────────────────────────────┐
│  LAYER 1: Infrastructure                                         │
│  ┌──────────────▼─────────────┐  ┌───────────────────────────┐  │
│  │  PostgreSQL 15 + pgvector  │  │  NATS JetStream           │  │
│  │  Ports: 5432 → 5555 (host) │  │  Ports: 4222 (client)     │  │
│  │  Volume: postgres_data      │  │          8222 (monitoring)│  │
│  │  Health: pg_isready         │  │  Volume: nats_data        │  │
│  └────────────────────────────┘  └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Startup Sequence

| Order | Layer | Services | Dependencies | Wait Time |
|-------|-------|----------|--------------|-----------|
| 1 | Infrastructure | `postgres`, `nats` | None | 10-15s (health check) |
| 2 | Application | `worker`, `api` | postgres + nats healthy | 15-40s (migration + app start) |
| 3 | Frontend | `dashboard` | api healthy | 20s (Vite dev server) |
| 4 | Gateway | `nginx` | api + dashboard healthy | 10s (config load) |

**Total Cold Start Time:** 55-85 seconds from `docker compose up` to full availability

### Port Allocation

| Service | Internal Port | Host Port | Protocol | Purpose |
|---------|---------------|-----------|----------|---------|
| **postgres** | 5432 | 5555 | TCP | Database connections |
| **nats** | 4222 | 4222 | TCP | NATS client protocol |
| **nats** | 8222 | 8222 | HTTP | NATS monitoring (dev only) |
| **api** | 8000 | 8000 | HTTP/WS | API + WebSocket (direct) |
| **dashboard** | 3000 | 3000 | HTTP | Vite dev server (dev only) |
| **nginx** | 80 | 80 | HTTP | Public HTTP endpoint |
| **nginx** | 443 | 443 | HTTPS | Public HTTPS endpoint |

**Production Note:** Remove `8222` (NATS monitoring) and `3000` (dashboard dev) from external exposure.

### Resource Allocation

| Service | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
|---------|-----------|--------------|-------------|----------------|
| **postgres** | 2.0 cores | 2 GB | 0.5 cores | 512 MB |
| **nats** | 0.5 cores | 512 MB | 0.1 cores | 64 MB |
| **worker** | 2.0 cores | 2 GB | 0.5 cores | 512 MB |
| **api** | 1.0 cores | 1 GB | 0.25 cores | 256 MB |
| **dashboard** | 0.5 cores | 512 MB | 0.1 cores | 128 MB |
| **nginx** | 0.5 cores | 256 MB | 0.1 cores | 64 MB |

**Total Cluster Requirements:** 6.5 CPU cores, 6.25 GB RAM (limits) | 2.0 CPU cores, 1.5 GB RAM (reserves)

---

## Deployment Procedures

### Production Deployment Workflow

#### Pre-Deployment Checklist

| Step | Action | Verification Command | Expected Result |
|------|--------|---------------------|-----------------|
| 1 | Backup database | `docker exec task-tracker-postgres pg_dump -U postgres tasktracker > backup_$(date +%Y%m%d_%H%M%S).sql` | SQL dump file created |
| 2 | Review migrations | `uv run alembic history` | No merge conflicts |
| 3 | Test on staging | `just alembic-up` on staging | Migrations apply cleanly |
| 4 | Build images | `docker compose build --no-cache` | All services build successfully |
| 5 | Tag release | `git tag -a v1.0.0 -m "Release 1.0.0"` | Git tag created |
| 6 | Update .env | Review environment variables | Secrets rotated if needed |

#### Deployment Steps

| Step | Command | Expected Duration | Success Indicator |
|------|---------|-------------------|-------------------|
| 1 | `just services-stop` | 10-15s | All containers stopped |
| 2 | `git pull origin main` | 2-5s | Code updated |
| 3 | `just alembic-up` | 5-30s | "Running upgrade ... -> head" |
| 4 | `docker compose up -d postgres nats` | 10s | Health checks passing |
| 5 | Wait for infrastructure | 15s | `docker ps` shows healthy |
| 6 | `docker compose up -d worker api dashboard nginx` | 20-30s | All services healthy |
| 7 | Verify health | `curl http://localhost/api/health` | HTTP 200 with JSON response |

**Total Deployment Time:** 60-100 seconds

#### Post-Deployment Verification

| Check | Command | Expected Result | Remediation |
|-------|---------|-----------------|-------------|
| Service status | `docker compose ps` | All "Up" with "(healthy)" | Check logs for failed services |
| API health | `curl http://localhost/api/health` | `{"status": "ok", "timestamp": "..."}` | Restart api service |
| WebSocket | Browser DevTools → Network → WS | Connection established | Restart nginx service |
| Worker logs | `docker logs task-tracker-worker | tail -50` | No errors, job processing visible | Check NATS connection |
| Memory usage | `docker stats --no-stream` | Within resource limits | Increase limits or reduce batch sizes |
| Database migration | `uv run alembic current` | Shows latest revision | Roll back and reapply |

### Development Deployment

#### Standard Development Mode

| Command | Use Case | Features |
|---------|----------|----------|
| `just services-dev` | Full stack with live reload | Auto-restart on backend changes, Vite HMR on frontend |
| `just dev worker` | Worker only with live reload | Isolated worker development |
| `just rebuild api` | Force rebuild single service | After dependency changes |

**Live Reload Paths:**
- **Backend:** `backend/app/*`, `backend/core/*` → sync + restart
- **Frontend:** `frontend/src/*`, `frontend/public/*` → sync (Vite HMR)
- **Dependencies:** `pyproject.toml`, `package.json` → rebuild container

#### Database Migration Workflow

| Scenario | Command Sequence | Notes |
|----------|------------------|-------|
| **Apply pending migrations** | `just alembic-up` | Requires postgres running |
| **Create new migration** | `just alembic-auto -m "description"` | Auto-generates from model changes |
| **Fresh database** | `just db-migrate-fresh` | Start postgres + apply migrations |
| **Nuclear reset** | `just db-nuclear-reset` | **DESTRUCTIVE:** Removes volumes, reruns migrations |

**Migration Safety:**
- Always backup before migration
- Test on staging environment first
- Migrations are async-compatible (uses `asyncpg`)
- Database URL must use `postgresql+asyncpg://` scheme

### Service Health Verification

#### Health Check Configuration

| Service | Health Check Type | Endpoint/Command | Interval | Timeout | Retries | Start Period |
|---------|------------------|------------------|----------|---------|---------|--------------|
| **postgres** | Shell command | `pg_isready -U postgres -d tasktracker` | 10s | 5s | 5 | 10s |
| **nats** | Shell command | `nats-server --version` | 10s | 5s | 3 | 10s |
| **worker** | Process check | `pgrep -f 'taskiq worker'` | 30s | 10s | 3 | 40s |
| **api** | HTTP endpoint | `curl -f http://localhost:8000/api/health` | 5s | 3s | 3 | 15s |
| **dashboard** | HTTP endpoint | `node -e "require('http').get(...)"` | 5s | 3s | 3 | 20s |
| **nginx** | HTTP endpoint | `wget http://127.0.0.1/nginx-health` | 30s | 10s | 3 | 10s |

#### Manual Health Verification

| Service | Manual Check Command | Healthy Response |
|---------|---------------------|------------------|
| **postgres** | `docker exec task-tracker-postgres pg_isready -U postgres -d tasktracker` | `tasktracker - accepting connections` |
| **nats** | `curl http://localhost:8222/varz` | JSON with `"connections": N` |
| **worker** | `docker exec task-tracker-worker pgrep -f 'taskiq worker'` | Process ID number |
| **api** | `curl http://localhost:8000/api/health` | `{"status": "ok"}` |
| **nginx** | `curl http://localhost/nginx-health` | HTTP 200 OK |

---

## Monitoring & Observability

### Health Check Endpoints

| Endpoint | Service | Response Time | Purpose | Authentication |
|----------|---------|---------------|---------|----------------|
| `/` | api | <50ms | Root health check (app name + status) | None |
| `/api/health` | api | <100ms | Structured health response with timestamp | None |
| `/nginx-health` | nginx | <10ms | Nginx-specific health endpoint | None |
| `/varz` | nats:8222 | <50ms | NATS metrics (connections, messages, bytes) | None (dev only) |

### WebSocket Event Monitoring

**Connection Endpoint:** `ws://<host>/ws?topics=<comma-separated-topics>`

#### Available Topics

| Topic | Events | Broadcast Frequency | Use Case |
|-------|--------|---------------------|----------|
| `agents` | `created`, `updated`, `deleted` | On change | Agent configuration updates |
| `tasks` | `created`, `updated`, `status_changed` | On change | Task lifecycle tracking |
| `providers` | `created`, `updated`, `deleted`, `validated` | On change | LLM provider configuration |
| `analysis` | `run_started`, `run_progress`, `run_completed`, `run_failed` | During run | Analysis run monitoring |
| `proposals` | `created`, `approved`, `rejected` | On review | Task proposal workflow |
| `messages` | `message.updated`, `ingestion.*` | On ingestion | Message processing events |
| `experiments` | `experiment_started`, `experiment_progress`, `experiment_completed` | During experiment | Classification experiments |
| `knowledge` | `extraction_started`, `extraction_completed`, `topic_created`, `atom_created`, `version_created` | During extraction | Knowledge extraction pipeline |
| `noise_filtering` | `message_scored`, `batch_scored` | During scoring | Importance scoring events |

**Total Topics:** 9 core categories with 14+ distinct event types

#### Connection Monitoring

| Metric | Monitoring Method | Location |
|--------|------------------|----------|
| Active connections | API logs | `docker logs task-tracker-api | grep "WebSocket clients"` |
| Connection count per topic | WebSocket manager | Not exposed via API |
| Total unique connections | WebSocket manager | Not exposed via API |
| Disconnection events | API logs | `docker logs task-tracker-api | grep "WebSocket.*disconnect"` |

**Example Log Output:**
```
📡 Broadcasting message.updated to 3 WebSocket clients
```

### TaskIQ Background Job Monitoring

#### Job Types and Performance

| Task | Purpose | Default Batch Size | Typical Duration | Performance Notes |
|------|---------|---------------------|------------------|-------------------|
| `process_message` | Example task | N/A | <100ms | Test/demo job |
| `save_telegram_message` | Persist Telegram message | 1 | 200-500ms | Triggers avatar fetch |
| `ingest_telegram_messages_task` | Batch ingestion from chats | 100 | 10-30s | Limited by Telegram API |
| `execute_analysis_run` | Analysis run coordination | Sequential | 30-300s | Batch-dependent |
| `execute_classification_experiment` | Topic classification | Variable | 20-120s | Random sampling |
| `embed_messages_batch_task` | Message embedding | 100 | 5-15s | OpenAI/Ollama API latency |
| `embed_atoms_batch_task` | Atom embedding | 100 | 5-15s | OpenAI/Ollama API latency |
| `score_message_task` | Score single message | 1 | 100-300ms | Async importance calculation |
| `score_unscored_messages_task` | Batch scoring | 100 | 10-30s | Sequential processing |
| `extract_knowledge_from_messages_task` | LLM knowledge extraction | 10-50 | 30-90s | Larger batches = better context |

#### Job Monitoring Commands

| Monitoring Goal | Command | Interpretation |
|----------------|---------|----------------|
| Worker health | `docker exec task-tracker-worker pgrep -f 'taskiq worker'` | Returns PID if running |
| Job execution logs | `docker logs -f task-tracker-worker | grep "Starting"` | Shows job starts |
| Job completion | `docker logs task-tracker-worker | grep "completed"` | Success/failure stats |
| NATS queue depth | `curl http://localhost:8222/varz | jq '.in_msgs'` | Total messages processed |

**Example Worker Log:**
```
Starting batch embedding task: 150 messages with provider abc123
Batch embedding task completed: 148 success, 2 failed, 0 skipped
```

### Database Connection Monitoring

#### Connection Pool Configuration

| Parameter | Default Value | Source | Tuning Impact |
|-----------|---------------|--------|---------------|
| Pool Size | 5 | SQLAlchemy default | Increase for high concurrency |
| Max Overflow | 10 | SQLAlchemy default | Additional connections beyond pool |
| Pool Timeout | 30s | SQLAlchemy default | Wait time for connection |
| Pool Recycle | None | SQLAlchemy default | Enable for long-lived connections |

#### Active Connection Queries

| Query | Purpose | Expected Range |
|-------|---------|----------------|
| `SELECT count(*) FROM pg_stat_activity;` | Total connections | 5-15 (API + worker) |
| `SELECT pid, usename, application_name, state, query FROM pg_stat_activity WHERE state != 'idle';` | Active queries | 0-5 during load |
| `SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;` | Long-running queries | None exceeding 5s |

### Log Aggregation

#### Log Locations and Formats

| Service | Log Output | Format | Level Control |
|---------|-----------|--------|---------------|
| **Backend** | stdout/stderr | Loguru (colored with timestamps) | `LOG_LEVEL` env var |
| **Worker** | stdout/stderr | Loguru (colored with timestamps) | `LOG_LEVEL` env var |
| **Nginx** | `/var/log/nginx/access.log`, `/var/log/nginx/error.log` | Combined format | nginx.conf |
| **PostgreSQL** | stdout/stderr | PostgreSQL default | PostgreSQL config |
| **Dashboard** | stdout/stderr | Vite dev server | N/A |

#### Log Viewing Commands

| Purpose | Command | Output |
|---------|---------|--------|
| All services | `docker compose logs -f` | Interleaved logs from all containers |
| Specific service | `docker logs -f task-tracker-api` | Real-time logs for API |
| Last N lines | `docker logs --tail 100 task-tracker-worker` | Last 100 lines from worker |
| Filter by keyword | `docker logs task-tracker-api | grep "WebSocket"` | WebSocket-related logs only |
| Error logs only | `docker logs task-tracker-worker | grep "ERROR"` | Error-level logs |

**Log Levels (Backend):**
- Default: `INFO`
- Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- Set via: `LOG_LEVEL` or `LOGURU_LEVEL` environment variable

**Production Recommendation:** Integrate with Loki, ELK Stack, or CloudWatch Logs for centralized aggregation.

### Performance Metrics (Current State)

**No Built-In Metrics Collection** - Prometheus, StatsD, or OpenTelemetry integration not configured.

#### Available Data Sources

| Source | Metrics Available | Access Method |
|--------|------------------|---------------|
| **Nginx Access Logs** | Request latency, HTTP status codes, request rates | Parse logs in `/var/log/nginx/access.log` |
| **Docker Stats** | CPU, memory, network I/O per container | `docker stats <container>` |
| **PostgreSQL Stats** | Table sizes, index usage, query performance | `pg_stat_*` system views |
| **TaskIQ Logs** | Task execution times | Grep logs for `execution_time_ms` |

**Production Recommendation:** Implement Prometheus + Grafana for metrics collection and visualization.

---

## Troubleshooting Runbook

### Scenario 1: Services Won't Start After Deployment

**Symptoms:**
- `docker compose up -d` fails
- Containers exit immediately after start
- Health checks never pass

**Diagnostic Steps:**

| Step | Command | What to Check |
|------|---------|--------------|
| 1 | `docker compose ps` | Which services are failing |
| 2 | `docker compose logs postgres nats worker api dashboard nginx` | Error messages in logs |
| 3 | `sudo lsof -i :5555 -i :4222 -i :8000 -i :3000 -i :80` | Port conflicts |
| 4 | `ls -la .env` | .env file exists and readable |
| 5 | `docker compose config` | Compose file syntax errors |

**Common Causes and Resolutions:**

| Cause | Detection | Resolution |
|-------|-----------|------------|
| Port already in use | `lsof` shows process on port | Stop conflicting process or change ports |
| Missing .env file | `ls .env` fails | Copy `.env.example` to `.env` and configure |
| Database migration failed | API logs show migration error | Run `just alembic-up` manually |
| Docker daemon issue | `docker ps` fails | Restart Docker daemon |
| Volume permission error | Logs show "Permission denied" | Fix volume permissions or recreate volumes |

**Resolution Steps:**

1. Stop all services: `just services-stop`
2. Clean containers: `docker compose down`
3. Rebuild without cache: `docker compose build --no-cache`
4. Verify .env file exists and is valid
5. Start infrastructure first: `docker compose up -d postgres nats`
6. Wait for health checks (30s)
7. Apply migrations: `just alembic-up`
8. Start remaining services: `docker compose up -d worker api dashboard nginx`

### Scenario 2: WebSocket Connections Dropping Frequently

**Symptoms:**
- Frontend shows "reconnecting" state
- Real-time updates delayed or missing
- Browser console shows WebSocket errors

**Diagnostic Steps:**

| Step | Command | Expected Output |
|------|---------|----------------|
| 1 | Browser DevTools → Network → WS | Connection status (open/closed) |
| 2 | `docker logs task-tracker-api | grep "WebSocket"` | Connection/disconnection events |
| 3 | `docker logs task-tracker-nginx | grep "/ws"` | WebSocket proxy requests |
| 4 | `docker logs --since 10m task-tracker-api | grep -i "error\|exception"` | Recent API errors |

**Common Causes and Resolutions:**

| Cause | Detection | Resolution |
|-------|-----------|------------|
| Nginx timeout | Connections drop after 60s | Verify `/ws` location has `proxy_read_timeout 86400` |
| API restart | All connections lost simultaneously | Normal during deployment, frontend should reconnect |
| Client network issue | Intermittent disconnections | Check client network stability |
| Browser tab suspended | Disconnects when tab inactive | Implement heartbeat/ping mechanism |

**Resolution Steps:**

1. Verify Nginx configuration includes WebSocket timeout
2. Restart Nginx: `docker restart task-tracker-nginx`
3. Check API stability: `docker logs --since 10m task-tracker-api | grep -i error`
4. Verify frontend reconnection logic (max 5 attempts, exponential backoff)
5. Monitor connection count: `docker logs task-tracker-api | grep "connection_count"`

### Scenario 3: Background Jobs Not Processing

**Symptoms:**
- Tasks stuck in pending state
- Worker logs silent (no job execution)
- NATS unreachable

**Diagnostic Steps:**

| Step | Command | What to Check |
|------|---------|--------------|
| 1 | `docker ps --filter "name=worker"` | Worker container running |
| 2 | `docker logs --tail 100 task-tracker-worker` | Worker errors or crashes |
| 3 | `docker exec task-tracker-worker ping -c 3 nats` | NATS connectivity |
| 4 | `curl http://localhost:8222/varz` | NATS status and connections |
| 5 | `docker inspect task-tracker-worker | jq '.[0].State.OOMKilled'` | Out-of-memory kills |

**Common Causes and Resolutions:**

| Cause | Detection | Resolution |
|-------|-----------|------------|
| NATS broker down | `ping nats` fails | Restart NATS: `docker compose restart nats` |
| Worker crashed (OOM) | `OOMKilled: true` | Increase memory limit in `compose.yml` |
| Database connection exhausted | Logs show connection errors | Restart worker to reset pool |
| Task code error | Logs show exception trace | Fix code, rebuild: `just rebuild worker` |

**Resolution Steps:**

1. Restart NATS and worker: `docker compose restart nats worker`
2. Check for OOM kills: `docker inspect task-tracker-worker | jq '.[0].State.OOMKilled'`
3. If OOM killed, increase memory limit to 4GB in `compose.yml`
4. Verify NATS connectivity: `docker exec task-tracker-worker ping -c 3 nats`
5. Check worker logs for exceptions: `docker logs task-tracker-worker | grep "ERROR"`
6. If NATS data corrupted, remove volume: `docker volume rm task-tracker-nats-data` (recreates on restart)

### Scenario 4: Database Migration Failures

**Symptoms:**
- `just alembic-up` fails
- API won't start due to schema mismatch
- Alembic version conflicts

**Diagnostic Steps:**

| Step | Command | Expected Output |
|------|---------|----------------|
| 1 | `uv run alembic current` | Current migration revision |
| 2 | `uv run alembic history` | Migration history without conflicts |
| 3 | `uv run alembic heads` | Single head revision (no branches) |
| 4 | `docker logs task-tracker-postgres | grep "ERROR"` | Database errors during migration |

**Common Causes and Resolutions:**

| Cause | Detection | Resolution |
|-------|-----------|------------|
| Schema conflicts | Manual database changes | Stamp to current: `uv run alembic stamp head` |
| Multiple heads | `alembic heads` shows 2+ revisions | Merge heads: `uv run alembic merge heads` |
| Database locked | Migration hangs | Kill blocking queries via `pg_terminate_backend` |
| Migration depends on missing data | Migration fails with data error | Seed required data or fix migration |

**Resolution Steps:**

1. Identify current state: `uv run alembic current`
2. Check for multiple heads: `uv run alembic heads`
3. If multiple heads, merge: `uv run alembic merge heads`
4. If schema matches but version wrong: `uv run alembic stamp head`
5. Rollback failed migration: `uv run alembic downgrade -1`
6. Nuclear option (DESTRUCTIVE): `just db-nuclear-reset`

**Manual Backup Before Migration:**

Always backup before migration (automatic backup not configured):
```
docker exec task-tracker-postgres pg_dump -U postgres tasktracker > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Scenario 5: High Memory Usage / OOM Kills

**Symptoms:**
- Services restarting frequently
- Docker stats shows memory at limit
- `OOMKilled: true` in container inspect

**Diagnostic Steps:**

| Step | Command | What to Check |
|------|---------|--------------|
| 1 | `docker stats --no-stream` | Current memory usage per container |
| 2 | `docker ps -a | grep "Exited"` | Recently exited containers |
| 3 | `docker inspect <container> | jq '.[0].State.OOMKilled'` | OOM kill status |
| 4 | `docker inspect <container> | jq '.[0].HostConfig.Memory'` | Memory limits |

**Common Causes and Resolutions:**

| Cause | Detection | Resolution |
|-------|-----------|------------|
| Large batch processing | Worker memory spikes during jobs | Reduce batch sizes in task configuration |
| Memory leak | Memory grows over time | Profile code, restart service |
| Insufficient limits | Memory at 100% of limit | Increase limits in `compose.yml` |
| Too many concurrent tasks | Multiple heavy jobs running | Implement task queuing/rate limiting |

**Resolution Steps:**

1. Check current usage: `docker stats --no-stream`
2. Identify OOM-killed containers: `docker inspect task-tracker-worker | jq '.[0].State.OOMKilled'`
3. Increase memory limits in `compose.yml` (e.g., worker: 2GB → 4GB)
4. Reduce batch sizes (embedding: 100 → 50, scoring: 100 → 50)
5. Restart services: `docker compose down && docker compose up -d`
6. Monitor over time: `watch -n 5 'docker stats --no-stream task-tracker-worker'`

**Batch Size Tuning Locations:**

- Message embedding: `app/tasks.py` (batch_size parameter)
- Knowledge extraction: `app/tasks.py` (limit parameter)
- Message scoring: `app/tasks.py` (limit parameter)

---

## Performance Tuning

### Batch Size Recommendations

#### Current Configuration vs. Tuning Options

| Task | Current Batch Size | Low Memory (512MB) | Balanced (2GB) | High Throughput (4GB+) |
|------|-------------------|-------------------|----------------|------------------------|
| **Telegram ingestion** | 100 | 50 | 100 | 100 (API limit) |
| **Knowledge extraction** | 50 | 20 | 50 | 100 |
| **Embedding generation** | 100 | 50 | 100 | 500 |
| **Message scoring** | 100 | 50 | 100 | 500 |
| **Classification experiment** | Variable | Reduce by 50% | As configured | Increase by 2x |

**Tuning Principles:**
- Higher batches = faster throughput, higher memory usage
- Lower batches = slower throughput, lower memory usage, better error isolation
- OpenAI embedding limit: 2048 items per batch (increase safe to 500)
- Knowledge extraction: Larger batches improve LLM context quality

### Database Query Optimization

#### Performance Hotspots and Recommended Indexes

| Query Pattern | Current State | Recommended Index | Performance Impact |
|--------------|---------------|-------------------|-------------------|
| **Message filtering** (`WHERE topic_id IS NULL`) | Sequential scan | `CREATE INDEX idx_message_topic_id_sent_at ON message(topic_id, sent_at) WHERE topic_id IS NULL` | 10-100x faster |
| **Random sampling** (`ORDER BY random()`) | Full table scan | Use `TABLESAMPLE BERNOULLI(10)` instead | 50-500x faster |
| **Importance scoring lookback** (`WHERE importance_score IS NULL`) | Sequential scan | `CREATE INDEX idx_message_importance_score_sent_at ON message(importance_score, sent_at DESC)` | 10-100x faster |

#### Query Performance Monitoring

| Action | Command | Purpose |
|--------|---------|---------|
| Enable slow query logging | `ALTER DATABASE tasktracker SET log_min_duration_statement = 1000` | Log queries exceeding 1s |
| View slow queries | `SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10` | Identify optimization targets |
| Analyze query plan | `EXPLAIN ANALYZE <query>` | Understand query execution |

### Vector Search Performance (pgvector)

#### Index Configuration Options

| Index Type | Use Case | Memory Usage | Query Speed | Build Time |
|-----------|----------|--------------|-------------|------------|
| **HNSW** | High-speed approximate search | High (3-5x data size) | Fast (sub-200ms) | Fast |
| **IVFFlat** | Memory-constrained environments | Low (1-2x data size) | Moderate (200-500ms) | Moderate |

**Current Configuration:** HNSW with cosine similarity

#### Tuning Parameters

| Parameter | Default | Low Precision | Balanced | High Precision |
|-----------|---------|---------------|----------|----------------|
| `VECTOR_SIMILARITY_THRESHOLD` | 0.7 | 0.6 | 0.7 | 0.85 |
| `VECTOR_SEARCH_LIMIT` | 10 | 20 | 10 | 5 |
| `EMBEDDING_BATCH_SIZE` | 100 | 50 | 100 | 500 |

**Tuning Trade-offs:**
- Higher threshold = fewer results, higher quality matches
- Lower threshold = more results, lower quality matches
- Higher limit = more search results, slower queries
- Higher batch size = faster bulk embedding, higher API usage

### Resource Limit Tuning

#### When to Increase Limits

| Symptom | Service | Current Limit | Recommended Increase |
|---------|---------|---------------|---------------------|
| OOM kills during batch jobs | worker | 2GB RAM | 4GB RAM |
| Slow query performance | postgres | 2GB RAM | 4GB RAM |
| High CPU wait times | api | 1 CPU | 2 CPU |
| NATS queue backlog | nats | 512MB RAM | 1GB RAM |

#### When to Reduce Batch Sizes

| Symptom | Current Batch Size | Recommended Reduction | Trade-off |
|---------|-------------------|----------------------|-----------|
| Worker OOM during embedding | 100 | 50 | 2x slower throughput |
| API timeout on bulk operations | 100 | 50 | Longer total processing time |
| Database deadlocks | N/A | Add task queuing | Better concurrency control |

---

## Rollback Procedures

### Application Rollback

#### Standard Rollback Steps

| Step | Command | Duration | Verification |
|------|---------|----------|--------------|
| 1 | `just services-stop` | 10-15s | All containers stopped |
| 2 | `git checkout <previous-commit>` | 2s | Code reverted |
| 3 | `docker compose build --no-cache` | 2-5 min | Images rebuilt |
| 4 | `just services` | 60-100s | Services healthy |
| 5 | `docker ps --filter "name=task-tracker" --format "table {{.Names}}\t{{.Status}}"` | 2s | All services "Up (healthy)" |

**Total Rollback Time:** 4-7 minutes

### Database Rollback

#### Migration Rollback Steps

| Step | Command | Purpose | Safety Note |
|------|---------|---------|-------------|
| 1 | `uv run alembic current` | Identify current revision | None |
| 2 | `uv run alembic downgrade -1` | Rollback one revision | **DESTRUCTIVE** if migration drops data |
| 3 | `docker restart task-tracker-api task-tracker-worker` | Restart application services | Reconnects to database |

**Rollback Limitations:**
- Migrations that drop columns/tables cannot be fully reversed if data was present
- Always backup before migration
- Test rollback on staging first

### Data Recovery Scenarios

#### Scenario 1: Accidental Data Deletion

**Prevention:**
- Automated database backups not configured (manual backup required)
- Recommend: Enable PostgreSQL WAL archiving for point-in-time recovery

**Recovery Steps:**

| Step | Command | Recovery Time | Data Loss Window |
|------|---------|---------------|------------------|
| 1 | Stop services | `docker compose down` | N/A |
| 2 | Restore from backup | `docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup.sql` | 5-30 min | Since last backup |
| 3 | Restart services | `just services` | 60-100s | N/A |

#### Scenario 2: Database Corruption

**Symptoms:**
- `FATAL: database is corrupted`
- `ERROR: invalid page header`

**Recovery Steps:**

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `docker compose down` | Stop all services |
| 2 | `docker volume rm task-tracker-postgres-data` | Remove corrupted volume |
| 3 | `docker compose up -d postgres` | Start fresh postgres |
| 4 | `docker exec -i task-tracker-postgres psql -U postgres -c "CREATE DATABASE tasktracker"` | Create database |
| 5 | `docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup.sql` | Restore from backup |
| 6 | `just services` | Start all services |

**Recovery Time:** 10-45 minutes (depending on database size)

#### Scenario 3: Failed Background Job Recovery

**Symptoms:**
- Ingestion job stuck in "running" status
- Jobs not completing despite worker healthy

**Recovery Steps:**

| Step | Command | Purpose |
|------|---------|---------|
| 1 | Identify stuck jobs | `docker logs task-tracker-worker | grep "Ingestion job"` | Find job IDs |
| 2 | Reset job status | `docker exec -i task-tracker-postgres psql -U postgres tasktracker -c "UPDATE message_ingestion_job SET status = 'failed', error_log = '{\"error\": \"Manual reset\"}' WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour'"` | Mark old running jobs as failed |
| 3 | Restart worker | `docker restart task-tracker-worker` | Clear worker state |
| 4 | Retry via API | Trigger new ingestion job | Resume processing |

**No Data Loss:** Jobs can be safely retried (idempotent operations)

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Database backup completed: `pg_dump > backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Migration scripts reviewed: `uv run alembic history`
- [ ] Migrations tested on staging
- [ ] Docker images built: `docker compose build --no-cache`
- [ ] Git release tagged: `git tag -a v1.0.0 -m "Release 1.0.0"`
- [ ] Environment variables updated (.env file)
- [ ] Secrets rotated if needed
- [ ] Remove NATS monitoring port (8222) from external exposure

### Deployment

- [ ] Services stopped: `just services-stop`
- [ ] Code updated: `git pull origin main`
- [ ] Migrations applied: `just alembic-up`
- [ ] Infrastructure started: `docker compose up -d postgres nats`
- [ ] Infrastructure healthy (wait 30s): `docker compose ps`
- [ ] Application started: `docker compose up -d worker api dashboard nginx`
- [ ] API health verified: `curl http://localhost/api/health`

### Post-Deployment Verification

- [ ] Service status: `docker compose ps` (all healthy)
- [ ] API health: `curl http://localhost/api/health` (HTTP 200)
- [ ] WebSocket connection: Browser DevTools → Network → WS (connected)
- [ ] Worker logs: `docker logs task-tracker-worker | tail -50` (no errors)
- [ ] Memory usage: `docker stats --no-stream` (within limits)
- [ ] Background jobs processing (create test analysis run)
- [ ] Database migration: `uv run alembic current` (shows latest revision)
- [ ] Nginx access logs: `docker exec task-tracker-nginx tail -50 /var/log/nginx/access.log`

### Rollback Procedure (If Issues)

- [ ] Stop services: `just services-stop`
- [ ] Checkout previous version: `git checkout <previous-tag>`
- [ ] Rollback migration: `uv run alembic downgrade -1`
- [ ] Rebuild containers: `docker compose build --no-cache`
- [ ] Start services: `just services`
- [ ] Restore database if needed: `docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup.sql`

### Monitoring Setup (Production)

- [ ] Configure Prometheus scraping (recommended)
- [ ] Import Grafana dashboards (recommended)
- [ ] Setup alert rules for critical failures (recommended)
- [ ] Enable log aggregation (Loki/ELK) (recommended)
- [ ] Configure uptime monitoring (Pingdom/StatusCake) (recommended)
- [ ] Enable PostgreSQL WAL archiving (point-in-time recovery) (recommended)

---

## Related Documentation

- **Configuration Management:** See Agent 2B documentation (security, environment variables)
- **Frontend Architecture:** See `frontend/architecture.md`
- **API Documentation:** See `api/` directory
- **Background Tasks:** See `architecture/background-tasks.md`

---

*This deployment guide provides comprehensive operational procedures for DevOps and SRE teams. For security and configuration details, refer to the Configuration Management documentation.*
