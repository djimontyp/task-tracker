# AnalysisRun State Machine

## Overview

The AnalysisRun state machine coordinates the lifecycle of AI-driven analysis runs that process batches of Telegram messages and generate task proposals using LLM agents. Each run progresses through a defined sequence of states from creation to closure, with validation rules ensuring data consistency and complete proposal review before finalization.

**Key Characteristics**:
- 7-state lifecycle with 5 active states and 2 reserved for future features
- Single active run enforcement to prevent resource conflicts
- Mandatory proposal review completion before closure
- Comprehensive WebSocket event broadcasting for real-time UI updates
- Automatic accuracy metric calculation on closure

**Discrepancy Resolution**: Initial audit identified 7 states vs 4 states. Investigation confirms **7 states defined in `AnalysisRunStatus` enum** with 5 actively used in workflows and 2 unused but reserved.

---

## State Catalog

| State | Description | Status | Terminal |
|-------|-------------|--------|----------|
| `pending` | Run created, awaiting background job execution | Active | No |
| `running` | Background task processing messages and generating proposals | Active | No |
| `completed` | Execution finished successfully, all proposals generated | Active | No |
| `reviewed` | PM has reviewed all proposals (reserved, not implemented) | Unused | No |
| `closed` | PM closed run, accuracy metrics calculated and stored | Active | Yes |
| `failed` | Execution encountered critical error, logged in `error_log` | Active | Yes |
| `cancelled` | Run was cancelled by user (reserved, not implemented) | Unused | Yes |

**Active States**: 5 states with implemented workflows
**Unused States**: 2 states (`reviewed`, `cancelled`) defined in enum but not referenced in services or endpoints
**Terminal States**: 3 states with no outbound transitions (`closed`, `failed`, `cancelled`)

---

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> pending: POST /api/v1/analysis/runs

    pending --> running: POST /start<br/>TaskIQ: execute_analysis_run

    running --> completed: All batches processed<br/>AnalysisExecutor.complete_run()
    running --> failed: Exception in background task<br/>AnalysisExecutor.fail_run()

    completed --> closed: PUT /close<br/>Validation: proposals_pending == 0<br/>Calculate accuracy metrics

    closed --> [*]
    failed --> [*]

    note right of reviewed
        Reserved for future feature
        (PM manual review step)
    end note

    note right of cancelled
        Reserved for future feature
        (User-initiated cancellation)
    end note
```

**Success Path**: `pending` → `running` → `completed` → `closed`
**Error Path**: `running` → `failed`
**Future Extensions**: `completed` → `reviewed` → `closed`, cancellation from `pending`/`running`

---

## State Transitions

| From | To | Trigger | Service Method | Location |
|------|----|---------| ---------------|----------|
| - | `pending` | POST `/api/v1/analysis/runs` | `AnalysisRunCRUD.create()` | `analysis_service.py:129-205` |
| `pending` | `running` | POST `/api/v1/analysis/runs/{run_id}/start` | `AnalysisExecutor.start_run()` | `analysis_service.py:366-401` |
| `running` | `completed` | All batches processed successfully | `AnalysisExecutor.complete_run()` | `analysis_service.py:689-739` |
| `running` | `failed` | Exception during execution | `AnalysisExecutor.fail_run()` | `analysis_service.py:741-781` |
| `completed` | `closed` | PUT `/api/v1/analysis/runs/{run_id}/close` | `AnalysisRunCRUD.close()` | `analysis_service.py:309-340` |

**Timestamps Updated**:
- `created_at` → Set on creation (`pending`)
- `started_at` → Set when background job starts (`running`)
- `completed_at` → Set when execution finishes (`completed`)
- `closed_at` → Set when PM closes run (`closed`)

---

## Validation Rules

| Rule | Enforced By | HTTP Response | Business Logic |
|------|-------------|---------------|----------------|
| **Single Active Run** | `AnalysisRunValidator.can_start_new_run()` | `409 Conflict` | Cannot create new run if unclosed runs exist (`pending`, `running`, `completed`, `reviewed`). Returns list of conflicting run IDs. |
| **Complete Review Before Closure** | `AnalysisRunValidator.can_close_run()` | `400 Bad Request` | Cannot close run if `proposals_pending > 0`. Returns count of pending proposals requiring review. |

**Validation Locations**:
- Rule 1: `analysis_service.py:54-93` (creation endpoint guard)
- Rule 2: `analysis_service.py:95-127` (closure endpoint guard)

**Unclosed States** (Rule 1): `pending`, `running`, `completed`, `reviewed`
**Closed States** (allowed concurrent): `closed`, `failed`, `cancelled`

---

## API Endpoints

| Method | Endpoint | Purpose | State Change | Service |
|--------|----------|---------|--------------|---------|
| POST | `/api/v1/analysis/runs` | Create new analysis run with time window and filters | → `pending` | `AnalysisRunCRUD.create()` |
| GET | `/api/v1/analysis/runs` | List runs with pagination and status filters | - | `AnalysisRunCRUD.get_all()` |
| GET | `/api/v1/analysis/runs/{run_id}` | Get run details with proposal counts | - | `AnalysisRunCRUD.get()` |
| POST | `/api/v1/analysis/runs/{run_id}/start` | Trigger background job execution (TaskIQ) | `pending` → `running` | `AnalysisExecutor.start_run()` |
| PUT | `/api/v1/analysis/runs/{run_id}/close` | Close run and calculate accuracy metrics | `completed` → `closed` | `AnalysisRunCRUD.close()` |

**API Source**: `backend/app/api/v1/analysis_runs.py` (341 lines)
**Request Parameters**: `/start` accepts optional `?use_rag=true` for RAG-enhanced proposal generation
**Response Schema**: `AnalysisRunSchema` with state, timestamps, proposal counts, accuracy metrics

---

## Background Task Execution

**Task**: `execute_analysis_run(run_id: UUID, use_rag: bool = False)`
**Source**: `backend/app/tasks.py:410-521`
**Broker**: NATS (TaskIQ)

### 9-Step Workflow

| Step | Action | Service Method | Purpose |
|------|--------|----------------|---------|
| 1 | Start run | `AnalysisExecutor.start_run()` | Update status `pending` → `running`, set `started_at` |
| 2 | Fetch messages | `AnalysisExecutor.fetch_messages()` | Query messages in configured time window |
| 3 | Prefilter messages | `AnalysisExecutor.prefilter_messages()` | Apply keyword/length/@mention filters |
| 4 | Create batches | `AnalysisExecutor.create_batches()` | Group by time proximity (5-10min windows, max 50 messages) |
| 5 | Process batches | `AnalysisExecutor.process_batch()` | LLM generates task proposals (with optional RAG context) |
| 6 | Save proposals | `AnalysisExecutor.save_proposals()` | Store in DB, increment `proposals_total` and `proposals_pending` |
| 7 | Update progress | `AnalysisExecutor.update_progress()` | Broadcast WebSocket `progress_updated` event |
| 8 | Complete run | `AnalysisExecutor.complete_run()` | Update status `running` → `completed`, set `completed_at` |
| 9 | OR fail run | `AnalysisExecutor.fail_run()` | On exception: update status `running` → `failed`, store `error_log` |

**Error Handling**: Exceptions in steps 1-8 trigger `fail_run()` with error message stored in `error_log` JSON field. TaskIQ job marked as failed.

**RAG Enhancement**: When `use_rag=true`, step 5 uses `LLMProposalService.generate_proposals_with_rag()` to enrich LLM context with semantically similar past proposals via vector search.

---

## WebSocket Events

| Event | State Transition | Channel | Payload |
|-------|------------------|---------|---------|
| `run_created` | → `pending` | `analysis` | Run ID, time window, filters |
| `run_started` | `pending` → `running` | `analysis_runs` | Run ID, started timestamp |
| `progress_updated` | During `running` | `analysis_runs` | Batch progress, messages processed |
| `proposals_created` | During `running` | `analysis_runs` | New proposal IDs, confidence scores |
| `run_completed` | `running` → `completed` | `analysis_runs` | Run ID, completed timestamp, proposal counts |
| `run_failed` | `running` → `failed` | `analysis_runs` | Run ID, error message |
| `run_closed` | `completed` → `closed` | `analysis` | Run ID, accuracy metrics |

**Broadcasting Service**: `websocket_manager.broadcast()` used in all state transition methods
**Real-time Updates**: Dashboard subscribes to channels for live progress tracking

---

## Service Architecture

### AnalysisRunValidator

**Purpose**: Business rule validation for state transitions
**Location**: `backend/app/services/analysis_service.py:47-127`

**Methods**:
- `can_start_new_run()` → Enforce single active run rule
- `can_close_run(run_id)` → Validate all proposals reviewed before closure

**Usage**: Called by CRUD service before state-changing operations

---

### AnalysisRunCRUD

**Purpose**: Database operations for analysis runs
**Location**: `backend/app/services/analysis_service.py:129-363`

**Methods**:
- `create()` → Create run in `pending` state
- `get()` / `get_all()` → Query runs with filters
- `close()` → Transition `completed` → `closed`, calculate accuracy metrics

**Accuracy Metrics Calculation**:
```
approval_rate = proposals_approved / proposals_total
rejection_rate = proposals_rejected / proposals_total
```

Stored in `accuracy_metrics` JSONB field on closure.

---

### AnalysisExecutor

**Purpose**: Background job execution orchestration
**Location**: `backend/app/services/analysis_service.py:366-781`

**Methods**:
- `start_run()` → Transition `pending` → `running`, trigger TaskIQ job
- `complete_run()` → Transition `running` → `completed`
- `fail_run()` → Transition `running` → `failed`, log error
- `fetch_messages()` → Query messages in time window
- `prefilter_messages()` → Apply noise filters
- `create_batches()` → Group messages by time proximity
- `process_batch()` → LLM proposal generation
- `save_proposals()` → Persist proposals, update counts
- `update_progress()` → Broadcast WebSocket events

**Dependencies**: `LLMProposalService`, `EmbeddingService`, `SemanticSearchService` (for RAG)

---

## Proposal Lifecycle Integration

**Tracking Fields**:
- `proposals_total` → Incremented when proposals saved
- `proposals_approved` → Incremented when PM approves proposal
- `proposals_rejected` → Incremented when PM rejects proposal
- `proposals_pending` → Calculated as `total - approved - rejected`

**Update Flow**:
1. `save_proposals()` → Increments `proposals_total` and `proposals_pending`
2. PM reviews proposals → `ProposalService.approve()` or `reject()` updates counts
3. `close()` → Validates `proposals_pending == 0`, calculates accuracy metrics

**Accuracy Metrics** (stored in `accuracy_metrics` JSONB on closure):
- `proposals_total` → Total proposals generated
- `approval_rate` → Percentage approved by PM
- `rejection_rate` → Percentage rejected by PM

---

## Implementation Files

| File | Lines | Description |
|------|-------|-------------|
| `backend/app/models/analysis_run.py` | 212 | SQLAlchemy model with state, timestamps, metrics |
| `backend/app/models/enums.py` | 78 | `AnalysisRunStatus` enum (7 states) |
| `backend/app/services/analysis_service.py` | 781 | Validator, CRUD, Executor services |
| `backend/app/api/v1/analysis_runs.py` | 341 | FastAPI endpoints |
| `backend/app/tasks.py` | 521 | TaskIQ background task |

---

## See Also

- [Background Tasks System](./background-tasks.md) - TaskIQ and NATS architecture
- [LLM Architecture](./llm-architecture.md) - Pydantic-AI agents and RAG system
- [Backend Services](./backend-services.md) - Complete service catalog
