# Data Model: Background Task Monitoring System

**Feature**: 001-background-task-monitoring
**Date**: 2025-10-27

## Entity: TaskExecutionLog

**Description**: Records individual task execution attempts with status, timing, and error information for monitoring and debugging.

### Fields

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | Integer | No | Auto | Primary key |
| task_name | String(255) | No | - | Task function name (e.g., "extract_knowledge_from_messages_task") |
| status | Enum | No | "pending" | Execution status: pending, running, success, failed |
| task_id | String(255) | Yes | None | TaskIQ internal task ID for correlation |
| params | JSON | Yes | None | Task input parameters (JSON serialized) |
| started_at | DateTime(UTC) | Yes | None | Task execution start timestamp |
| completed_at | DateTime(UTC) | Yes | None | Task execution end timestamp |
| duration_ms | Integer | Yes | None | Execution duration in milliseconds (computed: completed_at - started_at) |
| error_message | Text | Yes | None | Error message if status=failed |
| error_traceback | Text | Yes | None | Full stack trace if status=failed |
| created_at | DateTime(UTC) | No | now() | Record creation timestamp |
| updated_at | DateTime(UTC) | No | now() | Record last update timestamp |

### Indexes

```sql
CREATE INDEX idx_task_logs_composite
  ON task_execution_logs(task_name, status, created_at DESC);

CREATE INDEX idx_task_logs_created_at
  ON task_execution_logs(created_at DESC);

CREATE INDEX idx_task_logs_task_name
  ON task_execution_logs(task_name);

CREATE INDEX idx_task_logs_status
  ON task_execution_logs(status);
```

**Index Rationale**:
- Composite index supports multi-column filters (task type + status + date)
- created_at DESC for newest-first sorting
- Individual indexes for single-column queries

### Constraints

- `task_name` must be non-empty
- `status` must be one of: pending, running, success, failed
- `completed_at` must be >= `started_at` (if both present)
- `duration_ms` must be >= 0 (if present)
- `started_at` required if status != "pending"
- `completed_at` required if status in ("success", "failed")

### State Transitions

```
pending → running → success
                 → failed

State: pending
- Trigger: Task queued in NATS
- Fields: created_at, task_name, params
- Nulls: started_at, completed_at, duration_ms, error_*

State: running
- Trigger: Worker picks up task
- Fields: started_at
- Nulls: completed_at, duration_ms, error_*

State: success
- Trigger: Task completes without exception
- Fields: completed_at, duration_ms
- Nulls: error_*

State: failed
- Trigger: Task raises exception
- Fields: completed_at, duration_ms, error_message, error_traceback
```

### SQLModel Definition

```python
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel, Column, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSON
import enum

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

class TaskExecutionLog(SQLModel, table=True):
    __tablename__ = "task_execution_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    task_name: str = Field(max_length=255, index=True)
    status: TaskStatus = Field(
        default=TaskStatus.PENDING,
        sa_column=Column(SQLEnum(TaskStatus))
    )
    task_id: Optional[str] = Field(default=None, max_length=255)
    params: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    duration_ms: Optional[int] = Field(default=None)
    error_message: Optional[str] = Field(default=None, sa_column=Column(Text))
    error_traceback: Optional[str] = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Validation Rules

**From Requirements**:
- FR-005: Must capture error details (message, stack trace, parameters) for failed tasks
- FR-010: Must display task execution duration for performance analysis
- FR-011: Must show task parameters for debugging
- FR-016: Must persist logs for at least 30 days (enforced by retention task)

**Business Logic Validation**:
```python
def validate_state_transition(current: TaskStatus, new: TaskStatus) -> bool:
    allowed = {
        TaskStatus.PENDING: [TaskStatus.RUNNING],
        TaskStatus.RUNNING: [TaskStatus.SUCCESS, TaskStatus.FAILED],
        TaskStatus.SUCCESS: [],
        TaskStatus.FAILED: []
    }
    return new in allowed.get(current, [])

def validate_completion(log: TaskExecutionLog) -> None:
    if log.status in (TaskStatus.SUCCESS, TaskStatus.FAILED):
        assert log.completed_at is not None, "completed_at required for terminal states"
        assert log.started_at is not None, "started_at required for terminal states"
        assert log.duration_ms is not None, "duration_ms required for terminal states"

    if log.status == TaskStatus.FAILED:
        assert log.error_message is not None, "error_message required for failed tasks"
```

---

## Relationship Diagram

```
TaskExecutionLog (new table)
  - No foreign keys to existing tables
  - Self-contained monitoring data
  - task_name references function name (string, not FK)

Future Extensions (not MVP):
  TaskExecutionLog.user_id → User.id (track which user triggered task)
  TaskExecutionLog.related_message_id → Message.id (link to message being processed)
```

**Rationale for No FKs**:
- Monitoring data should not couple to business entities
- Tasks may process multiple entities or no entities
- Simplifies retention/archival (no cascade delete issues)

---

## Query Patterns

### 1. Get Health Metrics (FR-001, FR-002)

```sql
SELECT
  task_name,
  status,
  COUNT(*) as count
FROM task_execution_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY task_name, status
ORDER BY task_name, status;
```

**Performance**: O(n) where n = logs in 24h window, typically <10k records, <50ms with index

### 2. Get Task History with Filters (FR-009)

```sql
SELECT
  id, task_name, status, started_at, completed_at, duration_ms, error_message
FROM task_execution_logs
WHERE
  task_name = $1  -- Optional filter
  AND status = $2  -- Optional filter
  AND created_at >= $3  -- Date range start
  AND created_at <= $4  -- Date range end
ORDER BY created_at DESC
LIMIT 50 OFFSET $5;
```

**Performance**: <100ms for 7-day range with filters (composite index used)

### 3. Get Performance Metrics (FR-013, FR-014)

```sql
-- Average execution time per task type
SELECT
  task_name,
  AVG(duration_ms) as avg_duration_ms,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
  COUNT(*) as total_count,
  ROUND(100.0 * COUNT(CASE WHEN status = 'success' THEN 1 END) / COUNT(*), 2) as success_rate
FROM task_execution_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY task_name
ORDER BY task_name;
```

**Performance**: O(n) aggregation, <100ms for 24h window

---

## Migration Script

```python
"""Add TaskExecutionLog model for monitoring

Revision ID: abc123def456
Create Date: 2025-10-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table(
        'task_execution_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_name', sa.String(length=255), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', name='taskstatus'), nullable=False),
        sa.Column('task_id', sa.String(length=255), nullable=True),
        sa.Column('params', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_traceback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_task_logs_composite', 'task_execution_logs', ['task_name', 'status', 'created_at'], postgresql_ops={'created_at': 'DESC'})
    op.create_index('idx_task_logs_created_at', 'task_execution_logs', ['created_at'], postgresql_ops={'created_at': 'DESC'})
    op.create_index('idx_task_logs_task_name', 'task_execution_logs', ['task_name'])
    op.create_index('idx_task_logs_status', 'task_execution_logs', ['status'])

def downgrade():
    op.drop_index('idx_task_logs_status', table_name='task_execution_logs')
    op.drop_index('idx_task_logs_task_name', table_name='task_execution_logs')
    op.drop_index('idx_task_logs_created_at', table_name='task_execution_logs')
    op.drop_index('idx_task_logs_composite', table_name='task_execution_logs')
    op.drop_table('task_execution_logs')
    op.execute('DROP TYPE taskstatus')
```

---

## Data Volume Estimates

**Assumptions**:
- 10 task types
- Average 1000 task executions per day
- 30-day retention

**Storage**:
- 1 row = ~1KB (with params + error traceback)
- 1000 tasks/day × 30 days = 30,000 rows
- 30,000 rows × 1KB = 30 MB

**Growth**:
- Linear with task volume
- At 10k tasks/day: 300k rows, 300 MB (still manageable)
- Indexes add ~30% overhead

**Cleanup**:
- Daily cleanup task removes logs >30 days old
- Keeps table size bounded to retention period
