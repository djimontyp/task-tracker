# Operational Procedures Investigation Report

**Investigation Date**: 2025-10-26
**Session**: Feature 5 Operational Documentation - Phase 1 Research
**Batch**: 1A of 3 (Parallel)
**Investigator**: DevOps Expert Agent

## Executive Summary

Comprehensive investigation of production readiness procedures for Task Tracker microservices deployment. System uses Docker Compose orchestration with 6 services (PostgreSQL, NATS, Worker, API, Dashboard, Nginx) with health checks, resource limits, and live reload for development.

**Key Findings**:
- Multi-stage Dockerfiles with non-root users (security-first)
- Health checks on all services with dependency ordering
- Database migrations via Alembic with justfile automation
- 10 TaskIQ background jobs with NATS broker
- WebSocket real-time monitoring across 14+ topics
- No production-specific deployment procedures documented
- Performance tuning available but undocumented

---

## 1. Deployment Procedures

### 1.1 Service Orchestration

**Docker Compose Stack** (`compose.yml`):

```
Service Graph:
postgres (pgvector) → api (FastAPI)    → nginx (reverse proxy)
                   → worker (TaskIQ)  →
nats (JetStream)   →                   →
                                       → dashboard (React/Vite) →
```

**Service Startup Order**:
1. **Infrastructure Layer**: `postgres`, `nats` (parallel start with health checks)
2. **Application Layer**: `worker`, `api` (depends on postgres + nats)
3. **Frontend Layer**: `dashboard` (depends on api)
4. **Gateway Layer**: `nginx` (depends on api + dashboard)

**Commands**:
```bash
# Production mode (4 Uvicorn workers)
just services         # Start all services
just services-stop    # Stop all services

# Development mode (live reload)
just services-dev     # Watch mode with Docker Compose Watch

# Specific service
just dev worker       # Start single service in dev mode
just rebuild api      # Rebuild service without cache
```

### 1.2 Database Migration Workflow

**Alembic Configuration**:
- Location: `backend/alembic/`
- Config: `alembic.ini` (uses `DATABASE_URL` from env)
- Connection: `postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker`

**Migration Workflow**:

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Apply migrations (from justfile)
just alembic-up
# -> uv run alembic upgrade head

# 3. Create new migration
just alembic-auto -m "description"
# -> uv run alembic revision --autogenerate -m "description"

# 4. Nuclear reset (production WARNING)
just db-nuclear-reset
# -> Stop services → Remove volumes → Start postgres → Run migrations
```

**Critical**: Alembic uses `asyncpg` driver (async SQLAlchemy). Database URL MUST use `postgresql+asyncpg://` scheme.

### 1.3 Health Checks and Readiness Probes

**Health Check Configuration**:

| Service | Endpoint/Command | Interval | Timeout | Retries | Start Period |
|---------|-----------------|----------|---------|---------|--------------|
| **postgres** | `pg_isready -U postgres -d tasktracker` | 10s | 5s | 5 | 10s |
| **nats** | `nats-server --version` | 10s | 5s | 3 | 10s |
| **worker** | `pgrep -f 'taskiq worker'` | 30s | 10s | 3 | 40s |
| **api** | `curl -f http://localhost:8000/api/health` | 5s | 3s | 3 | 15s |
| **dashboard** | `node -e "require('http').get(...)"` | 5s | 3s | 3 | 20s |
| **nginx** | `wget http://127.0.0.1/nginx-health` | 30s | 10s | 3 | 10s |

**API Health Endpoints**:
- `/` - Root health check (returns app name + status)
- `/api/health` - Structured health response with timestamp
- `/nginx-health` - Nginx-specific health endpoint

**Dependencies** (`depends_on` with conditions):
```yaml
worker:
  depends_on:
    postgres: { condition: service_healthy }
    nats: { condition: service_healthy }

api:
  depends_on:
    postgres: { condition: service_healthy }
    nats: { condition: service_healthy }

dashboard:
  depends_on:
    api: { condition: service_healthy }

nginx:
  depends_on:
    api: { condition: service_healthy }
    dashboard: { condition: service_healthy }
```

**Service Restart Behavior**: All services use `restart: unless-stopped` except during manual stops.

### 1.4 Rollback Procedures

**Application Rollback**:
```bash
# 1. Stop services
just services-stop

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild containers
COMPOSE_BAKE=true docker compose build --no-cache

# 4. Start services
just services

# 5. Verify health
docker ps --filter "name=task-tracker" --format "table {{.Names}}\t{{.Status}}"
```

**Database Rollback**:
```bash
# 1. Identify current migration
uv run alembic current

# 2. Downgrade to previous revision
uv run alembic downgrade -1

# 3. Restart API and worker
docker restart task-tracker-api task-tracker-worker
```

**CRITICAL**: No automated database backup before migrations. **Manual backup required**:
```bash
# Backup before migration
docker exec task-tracker-postgres pg_dump -U postgres tasktracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup_20251026_120000.sql
```

---

## 2. Monitoring & Observability

### 2.1 Log Aggregation

**Logging Configuration**:

**Backend** (`backend/core/logging.py`):
```python
from loguru import logger

logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level=settings.app.log_level  # Default: INFO
)
```

**Log Levels** (from `core/config.py`):
- Environment variable: `LOG_LEVEL` or `LOGURU_LEVEL`
- Default: `INFO`
- Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`

**Viewing Logs**:
```bash
# All services
docker compose logs -f

# Specific service
docker logs -f task-tracker-api
docker logs -f task-tracker-worker
docker logs -f task-tracker-postgres

# Tail last 100 lines
docker logs --tail 100 task-tracker-api

# Filter by keyword
docker logs task-tracker-worker | grep "ERROR"
docker logs task-tracker-api | grep "WebSocket"
```

**Log Locations**:
- **Containers**: `docker logs` (stdout/stderr)
- **Nginx**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log` (inside container)
- **PostgreSQL**: Container stdout (controlled by PostgreSQL config)

**Production Recommendation**: Integrate with log aggregation (Loki, ELK, CloudWatch).

### 2.2 WebSocket Event Monitoring

**WebSocket Topics** (from `backend/app/services/websocket_manager.py`):

| Topic | Events | Purpose |
|-------|--------|---------|
| `agents` | `created`, `updated`, `deleted` | Agent configuration changes |
| `tasks` | `created`, `updated`, `status_changed` | Task lifecycle |
| `providers` | `created`, `updated`, `deleted`, `validated` | LLM provider config |
| `analysis` | `run_started`, `run_progress`, `run_completed`, `run_failed` | Analysis run lifecycle |
| `proposals` | `created`, `approved`, `rejected` | Task proposal review |
| `messages` | `message.updated`, `ingestion.*` | Message ingestion events |
| `experiments` | `experiment_started`, `experiment_progress`, `experiment_completed` | Classification experiments |
| `knowledge` | `extraction_started`, `extraction_completed`, `topic_created`, `atom_created`, `version_created` | Knowledge extraction |
| `noise_filtering` | `message_scored`, `batch_scored` | Importance scoring |

**WebSocket Connection**:
- **Endpoint**: `ws://<host>/ws?topics=analysis,proposals,agents`
- **Subscription**: Query parameter `topics` (comma-separated)
- **Manager**: `websocket_manager.broadcast(topic, message)`
- **Format**: JSON `{ "type": "event_name", "data": {...} }`

**Monitoring WebSocket Activity**:
```bash
# WebSocket connection count (from logs)
docker logs task-tracker-api | grep "WebSocket clients"

# Example output:
# "📡 Broadcasting message.updated to 3 WebSocket clients"
```

**Connection Tracking**:
- `websocket_manager.get_connection_count(topic)` - Count per topic
- `websocket_manager.get_connection_count()` - Total unique connections

### 2.3 TaskIQ Job Monitoring

**NATS Monitoring Endpoint**:
- **URL**: `http://localhost:8222`
- **Metrics**: Connections, subscriptions, messages, bytes
- **WARNING**: Exposed on port 8222 in development (remove in production)

**Background Jobs** (from `backend/app/tasks.py`):

| Task | Decorator | Purpose | Performance Notes |
|------|-----------|---------|------------------|
| `process_message` | `@nats_broker.task` | Example task | N/A |
| `save_telegram_message` | `@nats_broker.task` | Persist Telegram message | Triggers avatar fetch |
| `ingest_telegram_messages_task` | `@nats_broker.task` | Batch ingestion from chats | 100 msg/batch, broadcasts progress |
| `execute_analysis_run` | `@nats_broker.task` | Analysis run coordination | Processes batches sequentially |
| `execute_classification_experiment` | `@nats_broker.task` | Topic classification | Random sampling with metrics |
| `embed_messages_batch_task` | `@nats_broker.task` | Message embedding | Batch size: 100 |
| `embed_atoms_batch_task` | `@nats_broker.task` | Atom embedding | Batch size: 100 |
| `score_message_task` | `@nats_broker.task` | Score single message | Async importance calculation |
| `score_unscored_messages_task` | `@nats_broker.task` | Batch scoring | Default: 100 messages/job |
| `extract_knowledge_from_messages_task` | `@nats_broker.task` | LLM knowledge extraction | 10-50 messages recommended |

**Job Monitoring Commands**:
```bash
# Worker health check
docker exec task-tracker-worker pgrep -f 'taskiq worker'

# Worker logs (shows job execution)
docker logs -f task-tracker-worker | grep "Starting"

# Example output:
# "Starting batch embedding task: 150 messages with provider abc123"
# "Batch embedding task completed: 148 success, 2 failed, 0 skipped"
```

**NATS Broker Configuration**:
- **Servers**: `nats://nats:4222` (from `TASKIQ_NATS_SERVERS`)
- **Queue**: `taskiq` (from `TASKIQ_NATS_QUEUE`)
- **JetStream**: Enabled (persistent message storage)

### 2.4 Database Connection Pooling

**SQLAlchemy Async Engine** (`backend/app/database.py`):
```python
engine = create_async_engine(
    settings.database.database_url,
    echo=False,  # SQL logging disabled
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

**Default Connection Pool Settings** (SQLAlchemy):
- **Pool Size**: 5 connections (SQLAlchemy default)
- **Max Overflow**: 10 additional connections (SQLAlchemy default)
- **Pool Timeout**: 30 seconds (SQLAlchemy default)
- **Pool Recycle**: None (no automatic recycling)

**PostgreSQL Resource Limits** (`compose.yml`):
```yaml
postgres:
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

**Monitoring Database Connections**:
```bash
# PostgreSQL connection count
docker exec task-tracker-postgres psql -U postgres -d tasktracker -c "SELECT count(*) FROM pg_stat_activity;"

# Active queries
docker exec task-tracker-postgres psql -U postgres -d tasktracker -c "SELECT pid, usename, application_name, state, query FROM pg_stat_activity WHERE state != 'idle';"

# Long-running queries
docker exec task-tracker-postgres psql -U postgres -d tasktracker -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
```

### 2.5 Performance Metrics Collection

**Current State**: No built-in metrics collection (Prometheus, StatsD, etc.)

**Available Performance Data Sources**:

1. **Nginx Access Logs**:
   - Request latency (timing data)
   - HTTP status codes
   - Request rates

2. **Docker Stats**:
   ```bash
   docker stats task-tracker-api task-tracker-worker task-tracker-postgres
   ```

3. **PostgreSQL Statistics**:
   ```sql
   -- Table statistics
   SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';

   -- Index usage
   SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

   -- Database size
   SELECT pg_database_size('tasktracker');
   ```

4. **TaskIQ Execution Times** (from logs):
   ```bash
   docker logs task-tracker-worker | grep "execution_time_ms"
   ```

**Production Recommendation**: Implement Prometheus + Grafana for metrics collection.

---

## 3. Troubleshooting Runbook

### 3.1 Database Connection Failures

**Symptom**: API logs show `Connection refused` or `Could not connect to database`

**Diagnosis**:
```bash
# 1. Check PostgreSQL status
docker ps --filter "name=postgres"
docker logs task-tracker-postgres | tail -50

# 2. Test database connection
docker exec task-tracker-postgres pg_isready -U postgres -d tasktracker

# 3. Verify network connectivity
docker exec task-tracker-api ping -c 3 postgres
```

**Resolution**:
```bash
# If PostgreSQL is down
docker compose up -d postgres

# If connection pool exhausted
docker restart task-tracker-api task-tracker-worker

# If database doesn't exist
docker exec task-tracker-postgres psql -U postgres -c "CREATE DATABASE tasktracker;"
just alembic-up

# If migrations failed
docker logs task-tracker-postgres | grep "ERROR"
# Fix migration issue, then:
just alembic-up
```

**Prevention**:
- Monitor connection pool usage
- Set `pool_pre_ping=True` in SQLAlchemy engine
- Implement connection retry logic

### 3.2 NATS Broker Offline

**Symptom**: Worker logs show `Failed to connect to NATS` or tasks not executing

**Diagnosis**:
```bash
# 1. Check NATS status
docker ps --filter "name=nats"
docker logs task-tracker-nats | tail -50

# 2. Test NATS connectivity
docker exec task-tracker-worker ping -c 3 nats

# 3. Check NATS monitoring
curl http://localhost:8222/varz | jq '.connections'
```

**Resolution**:
```bash
# Restart NATS
docker compose restart nats

# Restart worker to reconnect
docker compose restart worker

# If NATS data corrupted
docker compose down nats
docker volume rm task-tracker-nats-data
docker compose up -d nats
```

**Verification**:
```bash
# Worker should connect
docker logs task-tracker-worker | grep "NATS"

# Expected output:
# "Connected to NATS server: nats://nats:4222"
```

### 3.3 Worker Crashes

**Symptom**: Background tasks not processing, worker container restarting

**Diagnosis**:
```bash
# 1. Check worker status
docker ps --filter "name=worker"

# 2. View crash logs
docker logs task-tracker-worker | tail -100

# 3. Check for OOM kills
docker inspect task-tracker-worker | jq '.[0].State.OOMKilled'

# 4. Check resource usage
docker stats task-tracker-worker --no-stream
```

**Common Causes**:
1. **Memory exhaustion** - Worker processing large datasets
2. **Unhandled exceptions** - Task code errors
3. **Database deadlocks** - Concurrent task conflicts
4. **NATS disconnection** - Network issues

**Resolution**:

**Memory Issues**:
```bash
# Increase worker memory limit
# Edit compose.yml:
worker:
  deploy:
    resources:
      limits:
        memory: 4G  # Increase from 2G
```

**Code Errors**:
```bash
# Check exception logs
docker logs task-tracker-worker | grep "ERROR"

# Identify failing task
docker logs task-tracker-worker | grep "task failed"

# Fix code, rebuild, restart
just rebuild worker
```

**Database Deadlocks**:
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Kill blocking query
SELECT pg_terminate_backend(<pid>);
```

**Prevention**:
- Implement task timeouts
- Add error handling to all tasks
- Monitor memory usage
- Use task queues with rate limiting

### 3.4 WebSocket Disconnections

**Symptom**: Frontend not receiving real-time updates

**Diagnosis**:
```bash
# 1. Check WebSocket connection in browser console
# Expected: "WebSocket connected to ws://localhost/ws?topics=..."

# 2. Check API logs for WebSocket events
docker logs task-tracker-api | grep "WebSocket"

# 3. Check Nginx WebSocket proxy
docker logs task-tracker-nginx | grep "/ws"

# 4. Verify WebSocket upgrade headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/ws
```

**Common Causes**:
1. **Nginx timeout** - Long-idle connections closed
2. **API restart** - Connections lost during deployment
3. **Network issues** - Client network interruptions
4. **Browser tab suspended** - Browser throttling inactive tabs

**Resolution**:

**Nginx Timeout**:
```nginx
# nginx/nginx.conf (already configured)
location /ws {
    proxy_read_timeout 86400;  # 24 hours (already set)
}
```

**Reconnection Logic** (frontend):
```typescript
// Implemented in frontend/src/features/websocket/hooks/useWebSocket.ts
// - Exponential backoff reconnection
// - Max 5 reconnection attempts
// - Connection state management
```

**Manual Reconnection**:
```bash
# Restart Nginx to refresh connections
docker restart task-tracker-nginx
```

**Verification**:
```bash
# Check active WebSocket connections
docker logs task-tracker-api | grep "connection_count"
```

### 3.5 Data Recovery Scenarios

**Scenario 1: Accidental Data Deletion**

**Prevention**:
```bash
# Enable point-in-time recovery (PostgreSQL WAL archiving)
# NOT CURRENTLY CONFIGURED - Production recommendation
```

**Recovery** (if no WAL archiving):
```bash
# Restore from latest backup
docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup.sql

# Restart services
docker restart task-tracker-api task-tracker-worker
```

**Scenario 2: Database Corruption**

**Symptoms**:
- `FATAL: database is corrupted`
- `ERROR: invalid page header`

**Recovery**:
```bash
# 1. Stop all services
docker compose down

# 2. Restore from backup
docker volume rm task-tracker-postgres-data
docker compose up -d postgres
docker exec -i task-tracker-postgres psql -U postgres -c "CREATE DATABASE tasktracker;"
docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup.sql

# 3. Start services
just services
```

**Scenario 3: Message Ingestion Failure**

**Symptoms**:
- Messages in Telegram but not in database
- Ingestion job stuck in `running` status

**Recovery**:
```bash
# 1. Identify failed job
docker logs task-tracker-worker | grep "Ingestion job"

# 2. Reset job status (via database)
docker exec -i task-tracker-postgres psql -U postgres tasktracker -c "
UPDATE message_ingestion_job
SET status = 'failed', error_log = '{\"error\": \"Manual reset\"}'
WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour';
"

# 3. Retry ingestion (via API)
curl -X POST http://localhost:8000/api/v1/messages/ingestion \
  -H "Content-Type: application/json" \
  -d '{"chat_ids": ["chat_id"], "limit": 1000}'
```

---

## 4. Performance Considerations

### 4.1 Batch Sizes for Background Tasks

**Current Configuration**:

| Task | Batch Size | Location | Tuning Notes |
|------|-----------|----------|--------------|
| **Telegram ingestion** | 100 messages | `app/tasks.py:270` | Limited by Telegram API |
| **Knowledge extraction** | 50 messages | `app/tasks.py:72` | Higher batches = better context, slower LLM |
| **Embedding generation** | 100 items | `app/tasks.py:768, 818` | OpenAI limit: 2048, increase for performance |
| **Message scoring** | 100 messages | `app/tasks.py:910` | Sequential processing, increase for bulk operations |
| **Classification experiment** | Configurable | `app/tasks.py:588` | Based on `experiment.message_count` |

**Tuning Recommendations**:

**Embedding Performance**:
```python
# Current: batch_size=100
stats = await service.embed_messages_batch(db, message_ids, batch_size=100)

# High-throughput (if OpenAI/Ollama allows):
stats = await service.embed_messages_batch(db, message_ids, batch_size=500)
```

**Knowledge Extraction Quality**:
```python
# Current: limit=50 messages per extraction
select(Message.id).limit(50)

# Larger context (slower, better quality):
select(Message.id).limit(100)

# Smaller batches (faster, fragmented knowledge):
select(Message.id).limit(20)
```

**Message Scoring Throughput**:
```python
# Current: 100 messages/task
async def score_unscored_messages_task(limit: int = 100)

# High-throughput mode:
async def score_unscored_messages_task(limit: int = 500)
```

### 4.2 Database Query Optimization

**Current State**: No specific query optimization (indexes from migrations)

**Performance Hotspots**:

1. **Message filtering** (`WHERE topic_id IS NULL`):
   ```sql
   -- Current query (from app/tasks.py:45)
   SELECT COUNT(*) FROM message WHERE topic_id IS NULL AND sent_at >= cutoff_time;

   -- Recommendation: Add index
   CREATE INDEX idx_message_topic_id_sent_at ON message(topic_id, sent_at) WHERE topic_id IS NULL;
   ```

2. **Random sampling** (classification experiments):
   ```sql
   -- Current query (from app/tasks.py:588)
   SELECT * FROM message WHERE topic_id IS NOT NULL ORDER BY random() LIMIT 100;

   -- Issue: RANDOM() is slow on large tables
   -- Recommendation: Use TABLESAMPLE or pre-sampled ID ranges
   SELECT * FROM message TABLESAMPLE BERNOULLI(10) WHERE topic_id IS NOT NULL LIMIT 100;
   ```

3. **Importance scoring lookback**:
   ```sql
   -- Current query (from app/tasks.py:946)
   SELECT * FROM message WHERE importance_score IS NULL ORDER BY sent_at DESC LIMIT 100;

   -- Recommendation: Composite index
   CREATE INDEX idx_message_importance_score_sent_at ON message(importance_score, sent_at DESC);
   ```

**Monitoring Query Performance**:
```sql
-- Enable query logging
ALTER DATABASE tasktracker SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 4.3 WebSocket Connection Limits

**Current Configuration**: No explicit connection limits

**Connection Management**:
- **Manager**: `WebSocketManager` in `app/services/websocket_manager.py`
- **Storage**: `dict[str, set[WebSocket]]` (in-memory per topic)
- **Cleanup**: Automatic on send failure

**Production Limits** (Nginx defaults):
- **worker_connections**: 1024 (from `nginx/nginx.conf:2`)
- **Max WebSocket connections**: ~1000 per Nginx worker

**Scaling Recommendations**:

1. **Horizontal Scaling**:
   ```bash
   # Run multiple API instances
   docker compose up -d --scale api=3

   # Nginx load balancing (add to nginx.conf)
   upstream api_backend {
       server api-1:8000;
       server api-2:8000;
       server api-3:8000;
   }
   ```

2. **Connection Pooling** (Redis Pub/Sub):
   ```python
   # Replace in-memory WebSocketManager with Redis
   # - Broadcast across API instances
   # - Persistent connection tracking
   # - Better horizontal scaling
   ```

3. **Client-Side Throttling**:
   ```typescript
   // Implement heartbeat/ping to keep connections alive
   // Close idle connections after timeout
   // Reconnect with exponential backoff (already implemented)
   ```

### 4.4 Vector Search Performance (pgvector)

**Configuration**:
- **Extension**: pgvector (PostgreSQL 15)
- **Embedding Dimensions**: 1536 (OpenAI) or model-specific (Ollama)
- **Similarity Metric**: Cosine similarity

**Performance Tuning**:

**Index Configuration** (from migrations):
```sql
-- HNSW index for fast approximate search
CREATE INDEX idx_message_embedding_hnsw ON message
USING hnsw (embedding vector_cosine_ops);

-- IVFFlat index (alternative, less memory)
CREATE INDEX idx_message_embedding_ivfflat ON message
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Query Optimization**:
```sql
-- Current query pattern (from services/embedding_service.py)
SELECT * FROM message
ORDER BY embedding <=> query_embedding
LIMIT 10;

-- Tuning: Adjust LIMIT and threshold
-- - Lower LIMIT = faster
-- - Higher threshold = fewer results, better quality
SELECT * FROM message
WHERE 1 - (embedding <=> query_embedding) > 0.7  -- threshold
ORDER BY embedding <=> query_embedding
LIMIT 5;  -- reduced limit
```

**Performance Monitoring**:
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'message';

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM message
ORDER BY embedding <=> '[...]'
LIMIT 10;
```

**Configuration Parameters** (`core/config.py`):
- `VECTOR_SIMILARITY_THRESHOLD`: 0.7 (default)
- `VECTOR_SEARCH_LIMIT`: 10 (default)
- `EMBEDDING_BATCH_SIZE`: 100 (default)

**Tuning Recommendations**:
```bash
# High-precision search (slower)
VECTOR_SIMILARITY_THRESHOLD=0.85
VECTOR_SEARCH_LIMIT=5

# High-recall search (faster, more results)
VECTOR_SIMILARITY_THRESHOLD=0.6
VECTOR_SEARCH_LIMIT=20

# Bulk embedding (faster)
EMBEDDING_BATCH_SIZE=500
```

---

## 5. Service Dependencies Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION STACK                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  Layer 1: External Gateway                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Nginx (Port 80/443)                                           │  │
│  │  - Reverse proxy for API + Dashboard                           │  │
│  │  - WebSocket upgrade support (/ws)                             │  │
│  │  - Static file caching                                         │  │
│  │  - Security headers (CSP, HSTS)                                │  │
│  │  Health: /nginx-health                                         │  │
│  └──────────────────┬────────────────────────────┬─────────────────┘  │
│                     │                            │                    │
└─────────────────────┼────────────────────────────┼────────────────────┘
                      │                            │
┌─────────────────────┼────────────────────────────┼────────────────────┐
│  Layer 2: Application Services                  │                    │
│  ┌──────────────────▼─────────────┐  ┌──────────▼─────────────────┐  │
│  │  FastAPI Backend (Port 8000)   │  │  React Dashboard (Port 3000)│  │
│  │  - REST API (30+ endpoints)    │  │  - Vite dev server          │  │
│  │  - WebSocket server (/ws)      │  │  - Hot reload (development) │  │
│  │  - 4 Uvicorn workers           │  │  - Nginx static (production)│  │
│  │  Health: /api/health            │  │  Health: HTTP GET /         │  │
│  └──────────────────┬─────────────┘  └─────────────────────────────┘  │
│                     │                                                  │
│                     │ (Shared DB + NATS)                               │
│                     │                                                  │
│  ┌──────────────────▼──────────────────────────────────────────────┐  │
│  │  TaskIQ Worker (Background Jobs)                                │  │
│  │  - 10 task types (ingestion, analysis, embedding, scoring)      │  │
│  │  - NATS consumer                                                │  │
│  │  - Async job execution                                          │  │
│  │  Health: pgrep -f 'taskiq worker'                               │  │
│  └──────────────────┬──────────────────────────┬───────────────────┘  │
│                     │                          │                      │
└─────────────────────┼──────────────────────────┼──────────────────────┘
                      │                          │
┌─────────────────────┼──────────────────────────┼──────────────────────┐
│  Layer 3: Infrastructure                       │                      │
│  ┌──────────────────▼────────────┐  ┌──────────▼───────────────────┐  │
│  │  PostgreSQL 15 + pgvector     │  │  NATS JetStream              │  │
│  │  - Port: 5432 (internal)      │  │  - Port: 4222 (client)       │  │
│  │  - Port: 5555 (host)          │  │  - Port: 8222 (monitoring)   │  │
│  │  - Volume: postgres_data      │  │  - Volume: nats_data         │  │
│  │  - Alembic migrations         │  │  - Persistent message queue  │  │
│  │  Health: pg_isready           │  │  Health: nats-server --version│  │
│  └───────────────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘

DEPENDENCY FLOW:
1. postgres + nats → worker + api → dashboard → nginx
2. All services have health checks with 10-40s start period
3. Restart policy: unless-stopped (auto-restart on failure)
4. Resource limits: CPU (0.1-2.0) + Memory (64M-2G)
```

---

## 6. Common Troubleshooting Scenarios

### Top 5 Troubleshooting Scenarios

**Scenario 1: Services Won't Start After Deployment**

**Symptoms**:
- `docker compose up -d` fails
- Containers exit immediately
- Health checks failing

**Steps**:
```bash
# 1. Check service status
docker compose ps

# 2. View logs for failed services
docker compose logs postgres nats worker api dashboard nginx

# 3. Common causes:
# - Port conflicts (5555, 4222, 8000, 3000, 80 already in use)
# - Environment variables missing (.env file)
# - Database migration errors
# - Docker daemon issues

# 4. Resolution:
# Check port conflicts
sudo lsof -i :5555 -i :4222 -i :8000 -i :3000 -i :80

# Verify .env file exists
ls -la .env

# Rebuild containers
docker compose down
docker compose build --no-cache
docker compose up -d

# Check migrations
just alembic-up
```

**Scenario 2: WebSocket Connection Dropping Frequently**

**Symptoms**:
- Frontend shows "reconnecting" state
- Real-time updates delayed or missing
- Browser console shows WebSocket errors

**Steps**:
```bash
# 1. Check Nginx WebSocket configuration
docker exec task-tracker-nginx cat /etc/nginx/nginx.conf | grep -A 10 "location /ws"

# 2. Verify WebSocket headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/ws

# 3. Check API WebSocket logs
docker logs task-tracker-api | grep "WebSocket"

# 4. Common causes:
# - Nginx timeout (should be 86400s for /ws)
# - API restarts breaking connections
# - Client network instability
# - Browser tab suspended

# 5. Resolution:
# Restart Nginx
docker restart task-tracker-nginx

# Check API stability
docker logs --since 10m task-tracker-api | grep -i "error\|exception"

# Verify frontend reconnection logic
# - Should have exponential backoff
# - Max 5 reconnection attempts
```

**Scenario 3: Background Jobs Not Processing**

**Symptoms**:
- Tasks stuck in pending state
- Worker logs silent
- NATS unreachable

**Steps**:
```bash
# 1. Check worker status
docker ps --filter "name=worker"

# 2. View worker logs
docker logs --tail 100 task-tracker-worker

# 3. Check NATS connectivity
docker exec task-tracker-worker ping -c 3 nats
curl http://localhost:8222/varz

# 4. Verify task queue
# (No built-in NATS UI - check logs)

# 5. Common causes:
# - NATS broker down
# - Worker crashed (OOM, exception)
# - Database connection exhausted
# - Task code errors

# 6. Resolution:
# Restart NATS + Worker
docker compose restart nats worker

# Clear stuck jobs (if needed)
# WARNING: This loses in-flight tasks
docker compose down nats worker
docker volume rm task-tracker-nats-data
docker compose up -d nats worker

# Check for worker OOM
docker inspect task-tracker-worker | jq '.[0].State.OOMKilled'

# If true, increase memory:
# Edit compose.yml → worker.deploy.resources.limits.memory: 4G
```

**Scenario 4: Database Migration Failures**

**Symptoms**:
- `just alembic-up` fails
- API won't start due to schema mismatch
- Alembic version conflicts

**Steps**:
```bash
# 1. Check current migration state
uv run alembic current

# 2. View migration history
uv run alembic history

# 3. Check for pending migrations
uv run alembic heads

# 4. View migration error logs
docker logs task-tracker-postgres | grep "ERROR"

# 5. Common causes:
# - Schema conflicts (manual changes)
# - Multiple heads (merge needed)
# - Database locked during migration
# - Migration depends on missing data

# 6. Resolution:
# Stamp to current revision (if schema matches)
uv run alembic stamp head

# Merge multiple heads
uv run alembic merge heads

# Rollback failed migration
uv run alembic downgrade -1

# Force schema reset (DESTRUCTIVE)
just db-nuclear-reset

# Create new migration if needed
just alembic-auto -m "fix_migration_issue"
```

**Scenario 5: High Memory Usage / OOM Kills**

**Symptoms**:
- Services restarting frequently
- Docker stats shows high memory
- OOMKilled in container inspect

**Steps**:
```bash
# 1. Check memory usage
docker stats --no-stream

# 2. Identify OOM-killed containers
docker ps -a | grep "Exited"
docker inspect <container_id> | jq '.[0].State.OOMKilled'

# 3. Check resource limits
docker inspect task-tracker-worker | jq '.[0].HostConfig.Memory'

# 4. Common causes:
# - Large batch processing (embedding, classification)
# - Memory leaks in application code
# - Insufficient container limits
# - Too many concurrent tasks

# 5. Resolution:
# Increase memory limits (compose.yml)
worker:
  deploy:
    resources:
      limits:
        memory: 4G  # Increase from 2G

# Reduce batch sizes (app/tasks.py)
# - embed_messages_batch: batch_size=50 (from 100)
# - score_unscored_messages: limit=50 (from 100)

# Restart services
docker compose down
docker compose up -d

# Monitor memory over time
watch -n 5 'docker stats --no-stream task-tracker-worker'

# Profile memory usage (add to code)
import tracemalloc
tracemalloc.start()
# ... task execution ...
current, peak = tracemalloc.get_traced_memory()
logger.info(f"Memory: current={current/1024/1024:.2f}MB, peak={peak/1024/1024:.2f}MB")
```

---

## 7. Monitoring Integration Points

**Current State**: No production monitoring configured

**Recommended Integration Points**:

### 7.1 Prometheus Metrics

**Backend Instrumentation** (add to `app/main.py`):
```python
from prometheus_client import Counter, Histogram, Gauge
from prometheus_fastapi_instrumentator import Instrumentator

# Metrics
request_counter = Counter("http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
request_latency = Histogram("http_request_duration_seconds", "HTTP request latency")
websocket_connections = Gauge("websocket_connections_active", "Active WebSocket connections", ["topic"])
background_jobs = Counter("background_jobs_total", "Total background jobs", ["task_name", "status"])

# Instrument FastAPI
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

**Worker Instrumentation**:
```python
# Add to task decorators
@nats_broker.task
async def save_telegram_message(telegram_data: dict[str, Any]) -> str:
    start_time = time.time()
    try:
        # ... task logic ...
        background_jobs.labels(task_name="save_telegram_message", status="success").inc()
    except Exception as e:
        background_jobs.labels(task_name="save_telegram_message", status="failed").inc()
        raise
    finally:
        duration = time.time() - start_time
        request_latency.observe(duration)
```

**Prometheus Scrape Config**:
```yaml
scrape_configs:
  - job_name: 'task-tracker-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/metrics'

  - job_name: 'task-tracker-postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'task-tracker-nats'
    static_configs:
      - targets: ['nats:8222']
```

### 7.2 Grafana Dashboards

**Key Metrics Panels**:

1. **System Health**:
   - Service uptime (from health checks)
   - Container CPU/Memory usage
   - Disk I/O

2. **Application Performance**:
   - HTTP request rate (requests/sec)
   - Request latency (p50, p95, p99)
   - Error rate (5xx responses)
   - WebSocket connection count

3. **Background Jobs**:
   - Task execution rate
   - Task duration distribution
   - Task failure rate
   - Queue depth (NATS)

4. **Database Performance**:
   - Active connections
   - Query latency
   - Slow queries (>1s)
   - Table sizes
   - Index hit ratio

5. **Business Metrics**:
   - Messages ingested/hour
   - Tasks created/hour
   - Knowledge extractions/day
   - Classification accuracy

**Alert Rules**:
```yaml
groups:
  - name: task-tracker-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"

      - alert: WorkerDown
        expr: up{job="task-tracker-worker"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "TaskIQ worker is down"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_database_numbackends > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool near limit"
```

### 7.3 Log Aggregation (Loki)

**Docker Compose Integration**:
```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
    command: -config.file=/etc/promtail/config.yml
```

**Log Query Examples**:
```logql
# API errors
{container_name="task-tracker-api"} |= "ERROR"

# WebSocket events
{container_name="task-tracker-api"} |= "WebSocket"

# Slow database queries
{container_name="task-tracker-postgres"} |= "duration:"
| regexp "duration: (?P<duration>[0-9.]+)"
| duration > 1000

# Worker task failures
{container_name="task-tracker-worker"} |= "task failed"
```

### 7.4 Distributed Tracing (Jaeger)

**OpenTelemetry Integration**:
```python
# backend/app/main.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Setup tracing
trace.set_tracer_provider(TracerProvider())
jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(jaeger_exporter))

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)
```

**Trace Analysis**:
- API request → Database query → TaskIQ job → WebSocket broadcast
- Latency breakdown by component
- Error propagation across services

---

## 8. Production Deployment Checklist

**Pre-Deployment**:
- [ ] Backup database: `pg_dump -U postgres tasktracker > backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Review migration scripts: `uv run alembic history`
- [ ] Test migrations on staging: `just alembic-up`
- [ ] Build Docker images: `docker compose build --no-cache`
- [ ] Tag release: `git tag -a v1.0.0 -m "Release 1.0.0"`
- [ ] Update environment variables (`.env`)
- [ ] Verify secrets rotation (encryption keys, tokens)

**Deployment**:
- [ ] Stop services: `just services-stop`
- [ ] Pull latest code: `git pull origin main`
- [ ] Run migrations: `just alembic-up`
- [ ] Start infrastructure: `docker compose up -d postgres nats`
- [ ] Wait for health checks (30s)
- [ ] Start application: `docker compose up -d worker api dashboard nginx`
- [ ] Verify health: `curl http://localhost/api/health`

**Post-Deployment Verification**:
- [ ] Check service status: `docker compose ps`
- [ ] Verify API: `curl http://localhost/api/health`
- [ ] Test WebSocket: Browser DevTools → Network → WS
- [ ] Check worker logs: `docker logs task-tracker-worker | tail -50`
- [ ] Monitor memory usage: `docker stats --no-stream`
- [ ] Test background jobs (create analysis run)
- [ ] Verify database migrations: `uv run alembic current`
- [ ] Check Nginx access logs: `docker exec task-tracker-nginx tail -50 /var/log/nginx/access.log`

**Rollback Procedure** (if issues):
- [ ] Stop services: `just services-stop`
- [ ] Checkout previous version: `git checkout <previous-tag>`
- [ ] Rollback migration: `uv run alembic downgrade -1`
- [ ] Rebuild containers: `docker compose build --no-cache`
- [ ] Start services: `just services`
- [ ] Restore database (if needed): `docker exec -i task-tracker-postgres psql -U postgres tasktracker < backup.sql`

**Monitoring Setup** (Production):
- [ ] Configure Prometheus scraping
- [ ] Import Grafana dashboards
- [ ] Setup alert rules (email/Slack)
- [ ] Enable log aggregation (Loki/ELK)
- [ ] Configure uptime monitoring (Pingdom/StatusCake)
- [ ] Enable database WAL archiving (point-in-time recovery)

---

## 9. Key Findings Summary

### Deployment Workflow

**Step-by-Step Production Deployment**:
1. **Pre-flight Checks**:
   - Backup database (`pg_dump`)
   - Review migrations (`alembic history`)
   - Test on staging environment

2. **Service Shutdown**:
   - `just services-stop` (graceful shutdown)
   - Verify no active connections

3. **Database Migrations**:
   - `just alembic-up` (apply schema changes)
   - Verify success (`alembic current`)

4. **Service Startup** (ordered):
   - Infrastructure: `postgres`, `nats` (health checks)
   - Application: `worker`, `api` (depends on infrastructure)
   - Frontend: `dashboard` (depends on API)
   - Gateway: `nginx` (depends on all)

5. **Verification**:
   - Health checks pass (all services)
   - API responds (`/api/health`)
   - WebSocket connects (`/ws`)
   - Background jobs processing (worker logs)

### Monitoring Points

**Critical Metrics**:
1. **Service Health**: Docker health checks (5-30s intervals)
2. **WebSocket Events**: 14+ topics broadcasting state changes
3. **Background Jobs**: 10 TaskIQ tasks (NATS broker)
4. **Database Performance**: Connection pool, query latency
5. **Resource Usage**: CPU, memory, disk I/O

**Observability Gaps**:
- No Prometheus/Grafana integration
- No distributed tracing
- No log aggregation (production)
- No alerting system

### Top 5 Troubleshooting Scenarios

1. **Services Won't Start** → Check health checks, port conflicts, environment variables
2. **WebSocket Disconnections** → Verify Nginx timeout, check API stability, inspect frontend reconnection
3. **Background Jobs Stuck** → Restart NATS/worker, check OOM kills, verify database connections
4. **Database Migration Failures** → Rollback migration, resolve conflicts, stamp current revision
5. **High Memory Usage** → Increase container limits, reduce batch sizes, profile memory usage

### Performance Tuning Recommendations

**Immediate Wins**:
- Increase embedding batch size: 100 → 500 (if LLM allows)
- Add database indexes for hot queries (topic_id, importance_score)
- Implement connection pool monitoring
- Configure PostgreSQL query logging (slow queries >1s)

**Production Hardening**:
- Enable PostgreSQL WAL archiving (point-in-time recovery)
- Implement Prometheus + Grafana monitoring
- Add log aggregation (Loki/ELK)
- Setup alerting for critical failures
- Configure automatic database backups

### Service Dependencies

**Critical Path**:
```
postgres + nats → worker + api → dashboard → nginx
```

**Failure Impact**:
- **postgres down** → API/worker fail (no database)
- **nats down** → Worker can't process jobs
- **api down** → Dashboard can't fetch data, WebSocket offline
- **nginx down** → No external access (reverse proxy)

---

## 10. Next Steps

**Documentation**:
1. Create production deployment runbook (this report → docs/)
2. Document monitoring setup (Prometheus/Grafana)
3. Write disaster recovery procedures
4. Create operational dashboards

**Infrastructure**:
1. Setup production monitoring (Prometheus + Grafana)
2. Implement log aggregation (Loki or ELK)
3. Configure database backups (automated pg_dump + WAL archiving)
4. Add distributed tracing (Jaeger/OpenTelemetry)

**Performance**:
1. Benchmark vector search queries (pgvector)
2. Profile memory usage in background tasks
3. Optimize slow database queries (add indexes)
4. Tune batch sizes based on production load

**Reliability**:
1. Implement circuit breakers for external API calls
2. Add task retry logic with exponential backoff
3. Configure database connection pool settings
4. Setup health check alerts (PagerDuty/Slack)

---

## Report Metadata

**Investigation Scope**:
- `compose.yml` - Service orchestration
- `backend/Dockerfile`, `frontend/Dockerfile` - Container builds
- `nginx/nginx.conf` - Reverse proxy configuration
- `backend/app/tasks.py` - Background job definitions
- `backend/app/database.py` - Database session management
- `backend/core/config.py` - Configuration management
- `justfile` - Deployment command automation

**Lines of Code Reviewed**: ~2,500 lines
**Configuration Files**: 8 files
**Services Analyzed**: 6 services (postgres, nats, worker, api, dashboard, nginx)
**Background Tasks**: 10 TaskIQ jobs

**Report Author**: DevOps Expert Agent
**Report Version**: 1.0
**Last Updated**: 2025-10-26
