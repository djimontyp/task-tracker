# Tasks: Background Task Monitoring System

**Feature**: 001-background-task-monitoring
**Branch**: `001-background-task-monitoring`
**Input**: Design documents from `/Users/maks/PycharmProjects/task-tracker/specs/001-background-task-monitoring/`

## Overview

This document provides a dependency-ordered, TDD-first task breakdown for implementing the Background Task Monitoring System. Tasks follow hexagonal architecture principles and Test-Driven Development: write failing tests first, then implement to make them pass.

**Total Tasks**: 32
**Estimated Completion**: Implementation phase

## Task Format

- `[ID]`: Sequential task number (T001, T002...)
- `[P]`: Parallel-safe (different files, no dependencies)
- **File paths**: Absolute paths from repository root
- **Dependencies**: Listed explicitly where applicable

---

## Phase 1: Database Foundation

### T001 Create TaskStatus enum in models
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/models/task_execution_log.py`
**Description**: Create TaskStatus enum with values: PENDING, RUNNING, SUCCESS, FAILED
**Dependencies**: None
**Acceptance**:
- Enum defined with 4 states
- Inherits from str and enum.Enum
- Matches data-model.md specification

---

### T002 Create TaskExecutionLog SQLModel
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/models/task_execution_log.py`
**Description**: Implement TaskExecutionLog model with all fields from data-model.md
**Dependencies**: T001
**Acceptance**:
- All 11 fields defined (id, task_name, status, task_id, params, started_at, completed_at, duration_ms, error_message, error_traceback, created_at, updated_at)
- Indexes configured: composite (task_name, status, created_at), individual (created_at, task_name, status)
- JSON type for params field
- Text type for error fields
- Follows SQLModel table=True pattern

---

### T003 Generate Alembic migration for task_execution_logs table
**Command**: `cd /Users/maks/PycharmProjects/task-tracker/backend && uv run alembic revision --autogenerate -m "Add TaskExecutionLog model for monitoring"`
**Description**: Create database migration with all indexes from data-model.md
**Dependencies**: T002
**Acceptance**:
- Migration file created in backend/alembic/versions/
- Creates task_execution_logs table with all columns
- Creates 4 indexes (composite, created_at, task_name, status)
- Includes downgrade() with proper cleanup
- Verify with: `just alembic-up`

---

## Phase 2: API Contracts & Schemas (TDD - Tests First)

### T004 [P] Create Pydantic monitoring schemas
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/schemas/monitoring.py`
**Description**: Define request/response schemas matching OpenAPI contracts
**Dependencies**: T001 (needs TaskStatus enum)
**Acceptance**:
- TaskMetrics model (8 fields: task_name, total_executions, pending, running, success, failed, avg_duration_ms, success_rate)
- MonitoringMetricsResponse model (time_window_hours, generated_at, metrics)
- TaskExecutionLogResponse model (matches TaskExecutionLog fields)
- TaskHistoryResponse model (pagination: total_count, page, page_size, total_pages, items)
- ErrorResponse model (error field)
- All fields have proper types and descriptions

---

### T005 [P] Contract test: GET /api/v1/monitoring/metrics - happy path
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/contract/test_monitoring_api.py`
**Description**: Test metrics endpoint returns 200 with valid schema
**Dependencies**: None (writes test that will fail)
**Acceptance**:
- Test function: `test_get_metrics_returns_200_with_valid_schema()`
- Asserts 200 status code
- Validates response matches MonitoringMetricsResponse schema
- Checks metrics array contains TaskMetrics objects
- Test MUST FAIL initially (endpoint not implemented yet)

---

### T006 [P] Contract test: GET /api/v1/monitoring/metrics - time_window parameter
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/contract/test_monitoring_api.py`
**Description**: Test metrics endpoint respects time_window query param
**Dependencies**: None (writes test that will fail)
**Acceptance**:
- Test function: `test_get_metrics_with_time_window_param()`
- Request with ?time_window=48
- Asserts response.time_window_hours == 48
- Test MUST FAIL initially

---

### T007 [P] Contract test: GET /api/v1/monitoring/history - happy path with pagination
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/contract/test_monitoring_api.py`
**Description**: Test history endpoint returns paginated results
**Dependencies**: None (writes test that will fail)
**Acceptance**:
- Test function: `test_get_history_returns_200_with_pagination()`
- Request with ?page=1&page_size=50
- Asserts 200 status code
- Validates response matches TaskHistoryResponse schema
- Checks pagination fields (total_count, page, page_size, total_pages)
- Test MUST FAIL initially

---

### T008 [P] Contract test: GET /api/v1/monitoring/history - filtering
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/contract/test_monitoring_api.py`
**Description**: Test history endpoint filters by task_name and status
**Dependencies**: None (writes test that will fail)
**Acceptance**:
- Test function: `test_get_history_with_filters()`
- Request with ?task_name=score_message_task&status=failed
- Asserts all returned items match filters
- Test MUST FAIL initially

---

### T009 [P] Contract test: GET /api/v1/monitoring/history - invalid date format returns 400
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/contract/test_monitoring_api.py`
**Description**: Test error handling for invalid date format
**Dependencies**: None (writes test that will fail)
**Acceptance**:
- Test function: `test_get_history_invalid_date_format_returns_400()`
- Request with ?start_date=invalid
- Asserts 400 status code
- Validates ErrorResponse schema
- Test MUST FAIL initially

---

## Phase 3: TaskIQ Middleware (TDD - Tests First)

### T010 [P] Integration test: middleware logs task start
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/integration/test_task_logging.py`
**Description**: Test middleware creates log record when task starts
**Dependencies**: T002 (needs TaskExecutionLog model)
**Acceptance**:
- Test function: `test_middleware_logs_task_start()`
- Creates mock task, triggers execution
- Asserts TaskExecutionLog record created with status=RUNNING
- Asserts started_at timestamp set
- Test MUST FAIL initially

---

### T011 [P] Integration test: middleware logs successful completion
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/integration/test_task_logging.py`
**Description**: Test middleware updates log on task success
**Dependencies**: T002
**Acceptance**:
- Test function: `test_middleware_logs_successful_completion()`
- Triggers task that completes successfully
- Asserts status=SUCCESS, completed_at set, duration_ms calculated
- Test MUST FAIL initially

---

### T012 [P] Integration test: middleware logs task failure with traceback
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/integration/test_task_logging.py`
**Description**: Test middleware captures errors with full stack trace
**Dependencies**: T002
**Acceptance**:
- Test function: `test_middleware_logs_task_failure_with_traceback()`
- Triggers task that raises exception
- Asserts status=FAILED, error_message and error_traceback populated
- Test MUST FAIL initially

---

### T013 [P] Integration test: WebSocket broadcasts task event
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/integration/test_task_logging.py`
**Description**: Test middleware broadcasts task status changes via WebSocket
**Dependencies**: T002
**Acceptance**:
- Test function: `test_websocket_broadcasts_task_event()`
- Mock WebSocket manager
- Trigger task status change
- Assert broadcast called with correct event structure (type, task_name, status, timestamp, data)
- Test MUST FAIL initially

---

## Phase 4: Core Implementation (Make Tests Pass)

### T014 Create TaskIQ logging middleware
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/middleware/taskiq_logging_middleware.py`
**Description**: Implement TaskiqMiddleware with pre_execute and post_execute hooks
**Dependencies**: T010-T013 (implements to pass integration tests)
**Acceptance**:
- Class: TaskLoggingMiddleware(TaskiqMiddleware)
- pre_execute(): Create TaskExecutionLog with status=RUNNING, started_at
- post_execute(): Update log with status (SUCCESS/FAILED), completed_at, duration_ms
- Exception handling captures error_message and error_traceback
- Integration tests T010-T012 now PASS

---

### T015 Create monitoring service
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/monitoring_service.py`
**Description**: Implement MonitoringService with get_metrics and get_history methods
**Dependencies**: T002, T004
**Acceptance**:
- Method: `get_metrics(time_window_hours: int) -> MonitoringMetricsResponse`
- Method: `get_history(task_name, status, start_date, end_date, page, page_size) -> TaskHistoryResponse`
- Uses SQLAlchemy async queries with proper indexing
- Calculates aggregates: avg_duration_ms, success_rate
- Implements pagination logic

---

### T016 Create monitoring API endpoints
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/monitoring.py`
**Description**: Implement FastAPI router with GET /metrics and GET /history endpoints
**Dependencies**: T015, T005-T009 (implements to pass contract tests)
**Acceptance**:
- Endpoint: GET /api/v1/monitoring/metrics with time_window query param
- Endpoint: GET /api/v1/monitoring/history with filters and pagination
- Input validation (400 for invalid params)
- Error handling (500 for server errors)
- Contract tests T005-T009 now PASS

---

### T017 Register monitoring endpoints in FastAPI app
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/main.py`
**Description**: Include monitoring router in FastAPI app
**Dependencies**: T016
**Acceptance**:
- Import monitoring router
- app.include_router(monitoring_router, prefix="/api/v1/monitoring", tags=["monitoring"])
- Verify with: `curl http://localhost:8000/api/v1/monitoring/metrics`

---

### T018 Register TaskIQ logging middleware in broker config
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/core/taskiq_config.py`
**Description**: Add TaskLoggingMiddleware to TaskIQ broker
**Dependencies**: T014
**Acceptance**:
- Import TaskLoggingMiddleware
- Add to broker middlewares list
- Verify all 10 existing task types now log execution (ingest_telegram_messages, embed_messages_batch, etc.)
- Integration test T013 now PASSES

---

### T019 Add task event broadcasts to WebSocket manager
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/app/services/websocket_manager.py`
**Description**: Add broadcast_task_event method for real-time updates
**Dependencies**: T014
**Acceptance**:
- Method: `broadcast_task_event(event_type, task_name, status, task_id, duration_ms, error_message, params)`
- Constructs event JSON: {type, task_name, status, timestamp, data}
- Broadcasts to all connected clients
- Called from TaskLoggingMiddleware on status changes
- Integration test T013 now PASSES

---

## Phase 5: Frontend Foundation

### T020 [P] Create frontend monitoring types
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/types/monitoring.ts`
**Description**: Define TypeScript interfaces matching backend schemas
**Dependencies**: None
**Acceptance**:
- Interface: TaskMetrics (8 fields)
- Interface: MonitoringMetricsResponse
- Interface: TaskExecutionLog (matches backend model)
- Interface: TaskHistoryResponse
- Interface: TaskEvent (WebSocket event schema)
- Enums: TaskStatus (pending, running, success, failed)

---

### T021 [P] Create monitoring API client
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/services/monitoringApi.ts`
**Description**: Implement API client using fetch with query params
**Dependencies**: T020
**Acceptance**:
- Function: `fetchMetrics(timeWindowHours?: number): Promise<MonitoringMetricsResponse>`
- Function: `fetchHistory(filters: HistoryFilters): Promise<TaskHistoryResponse>`
- Error handling with proper types
- Uses absolute paths: `/api/v1/monitoring/metrics`, `/api/v1/monitoring/history`

---

### T022 Add WebSocket task event handlers
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/services/websocketService.ts`
**Description**: Extend existing WebSocket service to handle task events
**Dependencies**: T020
**Acceptance**:
- Add event handler registration for 'task_event' type
- Parse TaskEvent messages
- Emit to subscribers (components)
- Reconnection logic already exists (no changes needed)

---

## Phase 6: Frontend Components

### T023 [P] Create HealthCards component
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/components/monitoring/HealthCards.tsx`
**Description**: Display status count cards for each task type
**Dependencies**: T020
**Acceptance**:
- Props: `metrics: TaskMetrics[]`
- Displays 10 cards (one per task type)
- Shows counts: pending, running, success, failed
- Shows avg_duration_ms and success_rate
- Color-coded by status (green=success, red=failed, yellow=running)
- Responsive grid layout

---

### T024 [P] Create LiveActivityFeed component
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/components/monitoring/LiveActivityFeed.tsx`
**Description**: Real-time task event feed (newest first)
**Dependencies**: T020
**Acceptance**:
- Props: `events: TaskEvent[]`
- Displays last 50 events
- Event format: "task_name status at HH:MM:SS (duration_ms if completed)"
- Auto-scrolls to top on new event
- Color-coded by status

---

### T025 [P] Create TaskHistoryTable component
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/components/monitoring/TaskHistoryTable.tsx`
**Description**: Searchable/filterable history table with pagination
**Dependencies**: T020
**Acceptance**:
- Props: `history: TaskHistoryResponse, onFilterChange, onPageChange`
- Columns: task_name, status, started_at, duration_ms, error_message (if failed)
- Filters: task_name dropdown, status dropdown, date range
- Pagination controls (prev/next, page numbers)
- Click row to expand error details (traceback)

---

### T026 Create MonitoringDashboard container component
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/components/monitoring/MonitoringDashboard.tsx`
**Description**: Main dashboard orchestrating all monitoring components
**Dependencies**: T021, T022, T023, T024, T025
**Acceptance**:
- Fetches metrics via React Query (useQuery)
- Fetches history with filters (useQuery with params)
- Subscribes to WebSocket task events (useEffect)
- Updates live feed state on events
- Passes data to HealthCards, LiveActivityFeed, TaskHistoryTable
- Handles loading/error states

---

### T027 Create MonitoringPage route
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/pages/MonitoringPage.tsx`
**Description**: Page component for /monitoring route
**Dependencies**: T026
**Acceptance**:
- Page title: "Background Task Monitoring"
- Renders MonitoringDashboard
- Page layout with header/footer (existing layout)

---

### T028 Add monitoring route to frontend router
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/src/App.tsx` (or routing config)
**Description**: Register /monitoring route
**Dependencies**: T027
**Acceptance**:
- Route path: `/monitoring`
- Component: MonitoringPage
- Accessible from navigation menu
- Verify: `curl http://localhost/monitoring` returns dashboard HTML

---

## Phase 7: Polish & Validation

### T029 [P] Create unit tests for monitoring service
**File**: `/Users/maks/PycharmProjects/task-tracker/backend/tests/unit/test_monitoring_service.py`
**Description**: Test service logic in isolation (mocked DB)
**Dependencies**: T015
**Acceptance**:
- Test: `test_calculate_avg_duration_excludes_failed_tasks()`
- Test: `test_success_rate_calculation()`
- Test: `test_pagination_logic()`
- Test: `test_date_range_filtering()`
- All tests PASS

---

### T030 [P] Create React component tests for MonitoringDashboard
**File**: `/Users/maks/PycharmProjects/task-tracker/frontend/tests/components/monitoring/MonitoringDashboard.test.tsx`
**Description**: Test dashboard component rendering and interactions
**Dependencies**: T026
**Acceptance**:
- Test: `test_renders_health_cards_with_metrics()`
- Test: `test_live_feed_updates_on_websocket_event()`
- Test: `test_history_filters_trigger_api_call()`
- Test: `test_pagination_changes_fetch_new_page()`
- All tests PASS with React Testing Library

---

### T031 Run all tests and verify passing
**Command**: `cd /Users/maks/PycharmProjects/task-tracker/backend && uv run pytest`
**Description**: Execute full test suite (contract + integration + unit)
**Dependencies**: All previous tasks
**Acceptance**:
- All contract tests PASS (T005-T009)
- All integration tests PASS (T010-T013)
- All unit tests PASS (T029)
- No test failures, 0 errors
- Coverage >80% for new code

---

### T032 Execute quickstart scenarios and validate
**File**: `/Users/maks/PycharmProjects/task-tracker/specs/001-background-task-monitoring/quickstart.md`
**Description**: Manually validate all 6 scenarios from quickstart.md
**Dependencies**: T031
**Acceptance**:
- Scenario 1: Health metrics display and update ✅
- Scenario 2: Live activity feed ✅
- Scenario 3: Failed task error investigation ✅
- Scenario 4: Task history filtering ✅
- Scenario 5: Performance metrics calculation ✅
- Scenario 6: WebSocket reconnection ✅
- Performance: Dashboard load <2s, WebSocket latency <100ms, queries <500ms
- All acceptance criteria met

---

## Task Dependencies

### Dependency Graph

```
T001 (TaskStatus enum)
  ↓
T002 (TaskExecutionLog model) ─→ T003 (migration)
  ↓
T004 [P] (Pydantic schemas)
  ↓
T005-T009 [P] (contract tests)  T010-T013 [P] (integration tests)
  ↓                                        ↓
T014 (TaskIQ middleware) ←──────────────────┘
  ↓
T015 (monitoring service)
  ↓
T016 (API endpoints)
  ↓
T017 (register endpoints)   T018 (register middleware)   T019 (WebSocket broadcasts)
  ↓                              ↓                             ↓
─────────────────────────────────────────────────────────────────
T020 [P] (frontend types)   T021 [P] (API client)   T022 (WebSocket handlers)
  ↓                              ↓                      ↓
T023-T025 [P] (components: HealthCards, LiveActivityFeed, TaskHistoryTable)
  ↓
T026 (MonitoringDashboard)
  ↓
T027 (MonitoringPage)
  ↓
T028 (router registration)
  ↓
T029 [P] (unit tests)   T030 [P] (component tests)
  ↓
T031 (run all tests)
  ↓
T032 (quickstart validation)
```

### Critical Path

T001 → T002 → T003 → T014 → T015 → T016 → T017 → T026 → T027 → T028 → T031 → T032

### Parallelizable Groups

**Group 1** (after T004): T005, T006, T007, T008, T009 (contract tests)
**Group 2** (after T002): T010, T011, T012, T013 (integration tests)
**Group 3** (after T020): T023, T024, T025 (frontend components)
**Group 4** (after T028): T029, T030 (polish tests)

---

## Parallel Execution Example

After completing T004 (Pydantic schemas), launch all 5 contract tests in parallel:

```bash
# Terminal 1: Metrics happy path
pytest backend/tests/contract/test_monitoring_api.py::test_get_metrics_returns_200_with_valid_schema

# Terminal 2: Metrics with time_window
pytest backend/tests/contract/test_monitoring_api.py::test_get_metrics_with_time_window_param

# Terminal 3: History happy path
pytest backend/tests/contract/test_monitoring_api.py::test_get_history_returns_200_with_pagination

# Terminal 4: History filtering
pytest backend/tests/contract/test_monitoring_api.py::test_get_history_with_filters

# Terminal 5: History error handling
pytest backend/tests/contract/test_monitoring_api.py::test_get_history_invalid_date_format_returns_400
```

All 5 tasks write to the same file, so they appear sequential in task list, but can be mentally executed together when using Test agent or similar.

---

## Validation Checklist

Before marking feature complete, verify:

- ✅ All contracts (monitoring-metrics.openapi.yaml, monitoring-history.openapi.yaml) have corresponding tests
- ✅ All entities from data-model.md (TaskExecutionLog) have SQLModel implementations
- ✅ All endpoints documented in contracts/ are implemented
- ✅ All tests are written BEFORE implementation (TDD)
- ✅ Parallel tasks [P] truly modify different files
- ✅ Each task specifies exact absolute file path
- ✅ No task modifies same file as another [P] task in same phase
- ✅ All 10 task types log execution (ingest_telegram_messages, embed_messages_batch, embed_atoms_batch, score_message, score_unscored_messages, extract_knowledge_from_messages, scheduled_knowledge_extraction, scheduled_auto_approval, scheduled_notification_alert, scheduled_daily_digest)

---

## Notes

- **TDD Enforcement**: Phases 2-3 (tests) MUST complete before Phase 4 (implementation)
- **Middleware Pattern**: Non-intrusive logging via TaskIQ middleware (research.md decision 1)
- **WebSocket Events**: Structured JSON with type/task_name/status/data (research.md decision 2)
- **Database Indexes**: Composite + individual for query optimization (research.md decision 3)
- **State Management**: React Query for API data, local state for WebSocket feed (research.md decision 5)
- **Performance Targets**: Dashboard <2s load, WebSocket <100ms latency, queries <500ms (NFR-001, NFR-002, NFR-003)
- **Constitution Compliance**: All principles verified in plan.md (no violations)

---

**Status**: Ready for execution via `/implement` command
**Next Steps**: Execute tasks sequentially following dependency graph, or launch parallel groups
