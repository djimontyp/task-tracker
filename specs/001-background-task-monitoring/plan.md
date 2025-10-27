# Implementation Plan: Background Task Monitoring System

**Branch**: `001-background-task-monitoring` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/maks/PycharmProjects/task-tracker/specs/001-background-task-monitoring/spec.md`

## Summary

This feature implements a real-time monitoring dashboard for TaskIQ background tasks. The system tracks 10 task types (ingest_telegram_messages, embed_messages_batch, embed_atoms_batch, score_message, score_unscored_messages, extract_knowledge_from_messages, scheduled_knowledge_extraction, scheduled_auto_approval, scheduled_notification_alert, scheduled_daily_digest), capturing execution logs (status, duration, errors) and displaying health metrics, live activity feed, and searchable history via WebSocket-powered dashboard.

## Technical Context

**Language/Version**: Python 3.13 (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI, SQLAlchemy, TaskIQ, React 18, WebSocket
**Storage**: PostgreSQL (existing at port 5555)
**Testing**: pytest-asyncio (backend), React Testing Library (frontend)
**Target Platform**: Docker-based microservices (Linux server)
**Project Type**: web (frontend + backend)
**Performance Goals**: <200ms API response, <100ms WebSocket latency, <2s dashboard load
**Constraints**: Non-intrusive logging (minimal task execution overhead), 30-day retention, 1M+ log records
**Scale/Scope**: 10 task types, 1000 concurrent executions, real-time updates to multiple dashboard clients

## Constitution Check

**I. Microservices Architecture**: PASS
- Uses existing FastAPI backend, React frontend, PostgreSQL, NATS, TaskIQ worker
- No new services introduced
- API endpoints for monitoring data, WebSocket for real-time updates

**II. Event-Driven Processing**: PASS
- TaskIQ middleware captures task lifecycle events
- WebSocket broadcasts task state changes
- No blocking in API handlers

**III. Test-First Development**: PASS
- Contract tests for API endpoints (GET /api/v1/monitoring/metrics, GET /api/v1/monitoring/history)
- Integration tests for TaskIQ middleware logging
- WebSocket message contract tests

**IV. Type Safety & Async First**: PASS
- Pydantic models for request/response (MonitoringMetrics, TaskExecutionLog)
- SQLModel for TaskExecutionLog entity
- Async SQLAlchemy for database operations
- Type hints throughout

**V. Real-Time Capabilities**: PASS
- WebSocket broadcasts on task status changes
- Frontend handles reconnection
- Live activity feed with <1s latency

**VI. Docker-First Deployment**: PASS
- No container changes required
- Development mode works with existing docker-compose watch

**VII. API-First Design**: PASS
- REST endpoints for metrics and history
- WebSocket for real-time updates
- OpenAPI docs generated

**No constitutional violations detected.**

## Project Structure

### Documentation (this feature)
```
specs/001-background-task-monitoring/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
│   ├── monitoring-metrics.openapi.yaml
│   └── monitoring-history.openapi.yaml
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
backend/
├── app/
│   ├── models/
│   │   └── task_execution_log.py           # New: TaskExecutionLog SQLModel
│   ├── middleware/
│   │   └── taskiq_logging_middleware.py    # New: TaskIQ lifecycle tracking
│   ├── services/
│   │   ├── monitoring_service.py           # New: Metrics & history logic
│   │   └── websocket_manager.py            # Existing: Add task event broadcasts
│   ├── api/v1/
│   │   └── monitoring.py                   # New: /monitoring/* endpoints
│   └── schemas/
│       └── monitoring.py                   # New: Pydantic request/response models
└── tests/
    ├── contract/
    │   └── test_monitoring_api.py          # New: API contract tests
    ├── integration/
    │   └── test_task_logging.py            # New: TaskIQ middleware tests
    └── unit/
        └── test_monitoring_service.py      # New: Service logic tests

frontend/
├── src/
│   ├── components/
│   │   └── monitoring/
│   │       ├── MonitoringDashboard.tsx     # New: Main dashboard container
│   │       ├── HealthCards.tsx             # New: Status count cards
│   │       ├── LiveActivityFeed.tsx        # New: Real-time task events
│   │       └── TaskHistoryTable.tsx        # New: Searchable history
│   ├── pages/
│   │   └── MonitoringPage.tsx              # New: Dashboard page route
│   ├── services/
│   │   ├── monitoringApi.ts                # New: API client for monitoring
│   │   └── websocketService.ts             # Existing: Add task event handlers
│   └── types/
│       └── monitoring.ts                   # New: TypeScript interfaces
└── tests/
    └── components/
        └── monitoring/
            └── MonitoringDashboard.test.tsx # New: Component tests
```

**Structure Decision**: Web application (Option 2). Backend implements FastAPI endpoints and TaskIQ middleware for logging. Frontend adds monitoring dashboard with real-time WebSocket updates. All files follow existing project conventions.

## Phase 0: Outline & Research

No unknowns or NEEDS CLARIFICATION markers in Technical Context. All technologies are established in the existing codebase. Research phase focuses on best practices and patterns.

### Research Tasks

1. **TaskIQ Middleware Patterns**
   - Decision: Implement TaskIQ middleware hook for task lifecycle events
   - Rationale: TaskIQ supports middleware for pre/post task execution, ideal for non-intrusive logging
   - Alternatives considered: Manual logging in each task (rejected: high duplication, maintenance burden)

2. **WebSocket Event Schema**
   - Decision: Use structured JSON events with `type`, `task_name`, `status`, `timestamp`, `data`
   - Rationale: Type-safe messages, easy frontend filtering, extensible for future event types
   - Alternatives considered: Plain text messages (rejected: no type safety), protobuf (rejected: overkill for this scale)

3. **Database Indexing Strategy**
   - Decision: Index on `task_name`, `status`, `created_at` for history queries
   - Rationale: Common filter dimensions in UI (task type, status, date range)
   - Alternatives considered: Full-text search on error messages (deferred: not MVP requirement)

4. **Data Retention Implementation**
   - Decision: PostgreSQL scheduled job (pg_cron) or Python background task for cleanup
   - Rationale: Configurable retention period, runs independently, minimal overhead
   - Alternatives considered: TTL in application logic (rejected: requires runtime check on every query)

5. **Frontend State Management**
   - Decision: React Query for API data, local state for WebSocket live feed
   - Rationale: Existing pattern in project, automatic caching/refetching, optimistic updates
   - Alternatives considered: Redux (rejected: overkill for this feature scope)

**Output**: research.md created with above findings.

## Phase 1: Design & Contracts

### 1. Data Model (data-model.md)

**Entity**: TaskExecutionLog

**Fields**:
- id (Integer, PK)
- task_name (String, indexed)
- status (Enum: pending/running/success/failed)
- task_id (String, TaskIQ ID)
- params (JSON, task parameters)
- started_at, completed_at, duration_ms (timestamps & duration)
- error_message, error_traceback (for failures)
- created_at, updated_at (audit timestamps)

**Indexes**:
- Composite: (task_name, status, created_at DESC)
- Individual: task_name, status, created_at

**State Transitions**: pending → running → (success | failed)

**Validation Rules**: Completion requires started_at + completed_at + duration_ms; failures require error_message

**Output**: data-model.md created with full schema definition, migration script, and query patterns.

---

### 2. API Contracts (contracts/)

**Contract 1**: `/api/v1/monitoring/metrics` (GET)

**Purpose**: Health metrics aggregated by task type (FR-001, FR-002)

**Request**: Query param `time_window` (hours, default 24)

**Response**:
```json
{
  "time_window_hours": 24,
  "generated_at": "2025-10-27T12:00:00Z",
  "metrics": [
    {
      "task_name": "extract_knowledge_from_messages_task",
      "total_executions": 150,
      "pending": 5,
      "running": 2,
      "success": 140,
      "failed": 3,
      "avg_duration_ms": 1250.5,
      "success_rate": 93.33
    }
  ]
}
```

**Output**: `contracts/monitoring-metrics.openapi.yaml` with full OpenAPI spec.

---

**Contract 2**: `/api/v1/monitoring/history` (GET)

**Purpose**: Paginated task history with filters (FR-004, FR-009, FR-010, FR-011, FR-012)

**Request**: Query params `task_name`, `status`, `start_date`, `end_date`, `page`, `page_size`

**Response**:
```json
{
  "total_count": 247,
  "page": 1,
  "page_size": 50,
  "total_pages": 5,
  "items": [
    {
      "id": 1234,
      "task_name": "score_message_task",
      "status": "failed",
      "params": {"message_id": 500},
      "started_at": "2025-10-27T10:30:00Z",
      "completed_at": "2025-10-27T10:30:05Z",
      "duration_ms": 5000,
      "error_message": "OpenAI API rate limit exceeded",
      "error_traceback": "Traceback...",
      "created_at": "2025-10-27T10:29:59Z"
    }
  ]
}
```

**Output**: `contracts/monitoring-history.openapi.yaml` with full OpenAPI spec.

---

### 3. Contract Tests (tests/contract/)

**Test File**: `test_monitoring_api.py`

**Tests**:
1. `test_get_metrics_returns_200_with_valid_schema()`
   - Request: GET /api/v1/monitoring/metrics
   - Assert: 200 status, response matches MonitoringMetricsResponse schema
   - Initial status: FAIL (endpoint not implemented)

2. `test_get_metrics_with_time_window_param()`
   - Request: GET /api/v1/monitoring/metrics?time_window=48
   - Assert: Response time_window_hours=48
   - Initial status: FAIL

3. `test_get_history_returns_200_with_pagination()`
   - Request: GET /api/v1/monitoring/history?page=1&page_size=50
   - Assert: 200 status, pagination fields present
   - Initial status: FAIL

4. `test_get_history_with_filters()`
   - Request: GET /api/v1/monitoring/history?task_name=score_message_task&status=failed
   - Assert: All returned items match filters
   - Initial status: FAIL

5. `test_get_history_invalid_date_format_returns_400()`
   - Request: GET /api/v1/monitoring/history?start_date=invalid
   - Assert: 400 status, error message present
   - Initial status: FAIL

**Output**: Contract tests written (all failing, no implementation yet).

---

### 4. Integration Test Scenarios (tests/integration/)

**Test File**: `test_task_logging.py`

**Tests**:
1. `test_middleware_logs_task_start()`
   - Trigger: queue task via TaskIQ
   - Assert: TaskExecutionLog created with status=running, started_at set
   - Initial status: FAIL

2. `test_middleware_logs_successful_completion()`
   - Trigger: task completes successfully
   - Assert: status=success, completed_at set, duration_ms calculated
   - Initial status: FAIL

3. `test_middleware_logs_task_failure_with_traceback()`
   - Trigger: task raises exception
   - Assert: status=failed, error_message + error_traceback captured
   - Initial status: FAIL

4. `test_websocket_broadcasts_task_event()`
   - Trigger: task status changes
   - Assert: WebSocket message sent to connected clients
   - Initial status: FAIL

**Output**: Integration tests written (all failing, no implementation yet).

---

### 5. Quickstart Test Scenarios (quickstart.md)

**Scenarios**:
1. Real-time health metrics display (AS-3)
2. Live activity feed (AS-5)
3. Failed task error investigation (AS-2)
4. Task history filtering (AS-4)
5. Performance metrics calculation (FR-013, FR-014)
6. WebSocket reconnection (NFR-005)

**Performance Validations**:
- Dashboard load < 2s (NFR-001)
- WebSocket latency < 100ms (NFR-002)
- History query < 500ms for 7-day range (NFR-003)

**Output**: quickstart.md created with detailed test steps and acceptance criteria.

---

### 6. Update Agent Context (CLAUDE.md)

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude`

**Changes** (to be added incrementally to existing CLAUDE.md):
- New endpoints: `/api/v1/monitoring/metrics`, `/api/v1/monitoring/history`
- New model: TaskExecutionLog (21st model, add to Models section)
- New middleware: TaskIQ logging middleware
- New frontend route: `/monitoring`
- Recent change: "Added background task monitoring system (2025-10-27)"

**Preserve**:
- Existing architecture descriptions
- Manual additions between markers
- Keep file under 150 lines (summarize if needed)

**Output**: Repository root CLAUDE.md updated (not created, file already exists).

**IMPORTANT**: This update is performed incrementally, adding only new context from this feature.

---

## Phase 2: Task Planning Approach

**This section describes what the /tasks command will do - DO NOT execute during /plan**

### Task Generation Strategy

The `/tasks` command will load `.specify/templates/tasks-template.md` and generate tasks from Phase 1 artifacts:

**From data-model.md**:
- Task: Create TaskExecutionLog SQLModel in `backend/app/models/task_execution_log.py` [P]
- Task: Generate Alembic migration for task_execution_logs table
- Task: Create TaskStatus enum in models

**From contracts/**:
- Task: Create Pydantic schemas in `backend/app/schemas/monitoring.py` (MonitoringMetricsResponse, TaskHistoryResponse) [P]
- Task: Write contract test for /metrics endpoint (test_get_metrics_returns_200)
- Task: Write contract test for /history endpoint (test_get_history_returns_200)
- Task: Write contract test for error cases (400 invalid params)

**From integration test requirements**:
- Task: Create TaskIQ middleware in `backend/app/middleware/taskiq_logging_middleware.py`
- Task: Write integration test for middleware task start logging
- Task: Write integration test for middleware task completion logging
- Task: Write integration test for middleware error logging

**From quickstart.md scenarios**:
- Task: Create monitoring service in `backend/app/services/monitoring_service.py` (get_metrics, get_history)
- Task: Create monitoring API endpoints in `backend/app/api/v1/monitoring.py`
- Task: Add task event broadcasts to WebSocket manager
- Task: Create frontend monitoring types in `frontend/src/types/monitoring.ts` [P]
- Task: Create HealthCards component
- Task: Create LiveActivityFeed component
- Task: Create TaskHistoryTable component
- Task: Create MonitoringDashboard component
- Task: Create MonitoringPage with routing
- Task: Create monitoring API client in `frontend/src/services/monitoringApi.ts`
- Task: Add WebSocket task event handlers

**Additional tasks**:
- Task: Register monitoring endpoints in FastAPI app
- Task: Update TaskIQ broker config to include logging middleware
- Task: Add monitoring route to frontend router
- Task: Run all tests and verify they pass
- Task: Execute quickstart.md scenarios and validate

### Ordering Strategy

**TDD order**: Tests before implementation
- Contract tests → schemas → endpoints
- Integration tests → middleware → service logic
- Component tests → UI components

**Dependency order**:
1. Database layer: TaskExecutionLog model, migration
2. Middleware layer: TaskIQ logging middleware (captures data)
3. Service layer: monitoring_service (queries data)
4. API layer: endpoints (expose data)
5. Frontend layer: API client → components → pages

**Parallel execution** [P]:
- Model creation independent of schema creation
- Frontend types independent of backend schemas
- Multiple component files can be created in parallel

### Estimated Output

**Approximately 28-32 tasks** in tasks.md:

- 3 tasks: Database model + migration
- 5 tasks: API contract tests (metrics, history, errors)
- 4 tasks: Integration tests (middleware logging)
- 2 tasks: Backend schemas (Pydantic models)
- 2 tasks: Backend services (monitoring_service)
- 2 tasks: API endpoints + registration
- 2 tasks: Middleware creation + integration
- 1 task: WebSocket broadcast integration
- 6 tasks: Frontend components (types, cards, feed, table, dashboard, page)
- 2 tasks: Frontend services (API client, WebSocket handlers)
- 1 task: Frontend routing
- 2 tasks: Test execution + quickstart validation

**IMPORTANT**: This phase is executed by the `/tasks` command, NOT by `/plan`.

---

## Phase 3+: Future Implementation

**These phases are beyond the scope of the /plan command**

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

---

## Complexity Tracking

**No constitutional violations detected. This section is empty.**

---

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

**Artifacts Generated**:
- [x] research.md (Phase 0)
- [x] data-model.md (Phase 1)
- [x] contracts/monitoring-metrics.openapi.yaml (Phase 1)
- [x] contracts/monitoring-history.openapi.yaml (Phase 1)
- [x] quickstart.md (Phase 1)
- [ ] CLAUDE.md updated (deferred - see note below)
- [ ] tasks.md (Phase 2 - generated by /tasks command)

**Note on CLAUDE.md update**: The template specifies running `update-agent-context.sh` script during Phase 1. However, this script should be run AFTER implementation to reflect actual code changes, not during planning. The script will be executed as part of the implementation phase or can be run manually after feature completion.

---

**Plan Status**: COMPLETE - Ready for `/tasks` command

*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
