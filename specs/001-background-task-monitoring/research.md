# Research: Background Task Monitoring System

**Feature**: 001-background-task-monitoring
**Date**: 2025-10-27

## Research Questions

### 1. TaskIQ Middleware Patterns

**Question**: How to non-intrusively capture task execution lifecycle (start, success, failure, duration)?

**Decision**: Implement TaskIQ middleware using `@broker.task()` decorator with custom context manager

**Rationale**:
- TaskIQ provides middleware hooks that run before/after task execution
- Context manager pattern captures start/end timestamps automatically
- Exception handling built into middleware ensures errors are logged
- Zero changes required to existing task code
- Performance overhead minimal (<1ms per task)

**Implementation Pattern**:
```python
from taskiq import TaskiqMiddleware, TaskiqResult

class TaskLoggingMiddleware(TaskiqMiddleware):
    async def pre_execute(self, message):
        # Log task start, return start_time
        pass

    async def post_execute(self, message, result: TaskiqResult):
        # Log task end with status, duration, error if any
        pass
```

**Alternatives Considered**:
1. Manual logging in each task function
   - Rejected: 10 tasks × manual edits = high duplication, maintenance burden
   - Rejected: Easy to forget in future tasks
2. Decorator pattern on each task
   - Rejected: Still requires modification of existing tasks
   - Rejected: Middleware is more centralized

**References**:
- TaskIQ docs: https://taskiq-python.github.io/guide/middlewares.html
- Existing TaskIQ setup: `/backend/core/taskiq_config.py`

---

### 2. WebSocket Event Schema

**Question**: What message format for real-time task events to frontend?

**Decision**: Structured JSON with `type`, `task_name`, `status`, `timestamp`, `data` fields

**Rationale**:
- Type field enables frontend to filter/route events (task_started, task_completed, task_failed)
- task_name allows per-task-type filtering in UI
- status enum (pending/running/success/failed) matches database model
- timestamp supports event ordering and time-based filtering
- data field extensible for task-specific metadata (duration, error, params)

**Event Schema**:
```typescript
interface TaskEvent {
  type: 'task_started' | 'task_completed' | 'task_failed';
  task_name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  timestamp: string; // ISO 8601
  data: {
    task_id: number;
    duration_ms?: number;
    error_message?: string;
    params?: Record<string, any>;
  };
}
```

**Alternatives Considered**:
1. Plain text messages ("Task X started")
   - Rejected: No type safety, requires string parsing in frontend
2. Protocol Buffers (protobuf)
   - Rejected: Overkill for this scale, adds build complexity
3. Binary format (MessagePack)
   - Rejected: Harder to debug, no significant performance gain at this scale

**References**:
- Existing WebSocket manager: `/backend/app/services/websocket_manager.py`
- Frontend WebSocket service: `/frontend/src/services/websocketService.ts`

---

### 3. Database Indexing Strategy

**Question**: How to optimize task history queries for filters (task type, status, date range)?

**Decision**: Composite index on `(task_name, status, created_at DESC)` plus individual indexes

**Rationale**:
- UI query pattern: "Show failed knowledge extraction tasks from last 7 days"
- Composite index covers most common multi-column filters
- created_at DESC supports ORDER BY created_at DESC (newest first)
- Individual indexes on task_name and status for simpler queries
- PostgreSQL query planner chooses best index based on query

**Index Strategy**:
```sql
CREATE INDEX idx_task_logs_composite
  ON task_execution_logs(task_name, status, created_at DESC);

CREATE INDEX idx_task_logs_created_at
  ON task_execution_logs(created_at DESC);

CREATE INDEX idx_task_logs_task_name
  ON task_execution_logs(task_name);
```

**Alternatives Considered**:
1. Full-text search on error messages (pg_trgm, tsvector)
   - Deferred: Not MVP requirement, can add in Phase 2 if needed
2. Partitioning by created_at (monthly partitions)
   - Deferred: Beneficial at >10M records, not needed for initial 30-day retention

**Query Performance Estimates**:
- 1M records, filter by task_name + status + date range: <50ms (with index)
- 1M records, no filters, paginated (LIMIT 50): <20ms

**References**:
- PostgreSQL index docs: https://www.postgresql.org/docs/current/indexes-multicolumn.html
- Existing models with indexes: `/backend/app/models/message.py`

---

### 4. Data Retention Implementation

**Question**: How to automatically delete/archive task logs older than retention period (30 days)?

**Decision**: Python background task (TaskIQ scheduled task) for cleanup

**Rationale**:
- Leverages existing TaskIQ infrastructure (no new dependencies)
- Configurable via environment variable (TASK_LOG_RETENTION_DAYS=30)
- Can run daily at off-peak hours (3 AM)
- Supports both delete and archive strategies
- Easy to test and monitor (logs cleanup count)

**Implementation Pattern**:
```python
@broker.task(schedule=[{"cron": "0 3 * * *"}])  # 3 AM daily
async def cleanup_old_task_logs():
    retention_days = int(os.getenv("TASK_LOG_RETENTION_DAYS", "30"))
    cutoff = datetime.utcnow() - timedelta(days=retention_days)
    deleted = await db.execute(
        delete(TaskExecutionLog).where(TaskExecutionLog.created_at < cutoff)
    )
    logger.info(f"Cleaned up {deleted.rowcount} task logs older than {retention_days} days")
```

**Alternatives Considered**:
1. PostgreSQL pg_cron extension
   - Rejected: Requires superuser privileges, harder to configure in Docker
2. TTL check on every query
   - Rejected: Adds overhead to read operations, not suitable for high-traffic queries
3. Manual cleanup via admin UI
   - Rejected: Requires human intervention, not automated

**Archival Strategy** (optional, Phase 2):
- Export to S3/cold storage before delete
- Compressed CSV or Parquet format
- Queryable via separate reporting tool

**References**:
- TaskIQ scheduling: https://taskiq-python.github.io/guide/scheduling-tasks.html
- Existing scheduled tasks: `/backend/app/tasks.py` (scheduled_knowledge_extraction_task)

---

### 5. Frontend State Management

**Question**: How to manage monitoring data (API fetch + real-time updates)?

**Decision**: React Query for API data, local state (useState) for WebSocket live feed

**Rationale**:
- React Query already used in project for API data fetching
- Automatic caching, refetching, and stale-while-revalidate
- WebSocket events update local state, trigger UI re-render
- Separation of concerns: React Query = historical data, WebSocket = live updates
- No global state needed (Redux overkill for feature-local data)

**Data Flow**:
1. Dashboard mounts → React Query fetches `/api/v1/monitoring/metrics`
2. WebSocket connects → receives task events → updates live feed (local state)
3. User filters history → React Query fetches `/api/v1/monitoring/history?filters`
4. WebSocket event arrives → if matches filters, append to live feed

**State Structure**:
```typescript
// React Query (server state)
const { data: metrics } = useQuery('/api/v1/monitoring/metrics');
const { data: history } = useQuery(['/api/v1/monitoring/history', filters]);

// Local state (live feed)
const [liveEvents, setLiveEvents] = useState<TaskEvent[]>([]);

// WebSocket handler
useEffect(() => {
  ws.on('task_event', (event) => {
    setLiveEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50
  });
}, []);
```

**Alternatives Considered**:
1. Redux for all state
   - Rejected: Overkill for feature-scoped data, adds boilerplate
2. WebSocket for all data (no React Query)
   - Rejected: Loses caching, pagination, error handling benefits
3. Server-Sent Events (SSE) instead of WebSocket
   - Rejected: WebSocket already established in project, bidirectional not needed

**References**:
- React Query usage: `/frontend/src/hooks/useMessages.ts`
- WebSocket service: `/frontend/src/services/websocketService.ts`

---

## Summary

All research questions resolved. No blocking unknowns remain. Key decisions:

1. **TaskIQ Middleware**: Non-intrusive logging via middleware pattern
2. **WebSocket Events**: Structured JSON with type/task_name/status/data
3. **Database Indexes**: Composite + individual indexes for query optimization
4. **Data Retention**: Python scheduled task for automated cleanup
5. **Frontend State**: React Query + local state, no Redux needed

Ready for Phase 1 (Design & Contracts).
