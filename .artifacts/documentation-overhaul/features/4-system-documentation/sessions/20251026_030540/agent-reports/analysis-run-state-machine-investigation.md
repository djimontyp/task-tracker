# AnalysisRun State Machine Investigation Report

**Batch**: 1C of 4 (Parallel)
**Investigation Date**: 2025-10-26
**Session**: Feature 4 System Documentation - Phase 1 Research
**Status**: ✅ Complete

---

## Executive Summary

**ACTUAL STATE COUNT: 7 states** (resolves audit discrepancy)

The AnalysisRun state machine implements a **7-state lifecycle** for coordinating AI-driven analysis runs that process message batches and generate task proposals. The discrepancy in the audit (7 vs 4 states) is **RESOLVED**: the model has **7 states defined in the enum**, not 4.

---

## State Enumeration (COMPLETE)

**Source**: `/Users/maks/PycharmProjects/task-tracker/backend/app/models/enums.py` (lines 69-78)

```python
class AnalysisRunStatus(str, Enum):
    """Status of analysis run."""

    pending = "pending"        # 1. Created, awaiting execution
    running = "running"        # 2. Background job executing
    completed = "completed"    # 3. Execution finished successfully
    reviewed = "reviewed"      # 4. PM has reviewed proposals (UNUSED in current implementation)
    closed = "closed"          # 5. PM closed run, accuracy metrics calculated
    failed = "failed"          # 6. Execution encountered critical error
    cancelled = "cancelled"    # 7. Run was cancelled (UNUSED in current implementation)
```

**All 7 states enumerated**, resolving the audit discrepancy.

---

## State Transition Diagram

```
┌─────────┐
│ pending │ ◄── (Created via API: POST /api/v1/analysis/runs)
└────┬────┘
     │
     │ Trigger: POST /api/v1/analysis/runs/{run_id}/start
     │ Service: AnalysisExecutor.start_run()
     │ TaskIQ: execute_analysis_run.kiq()
     ▼
┌─────────┐
│ running │ ◄── (Background job processing)
└────┬────┘
     │
     ├────► ❌ failed  (Exception in execute_analysis_run)
     │      Service: AnalysisExecutor.fail_run()
     │      Stores error_log
     │
     └────► ✅ completed (All batches processed successfully)
            Service: AnalysisExecutor.complete_run()
            │
            │ Trigger: PUT /api/v1/analysis/runs/{run_id}/close
            │ Validation: proposals_pending == 0
            │ Service: AnalysisRunCRUD.close()
            ▼
         ┌────────┐
         │ closed │ ◄── (Final state: accuracy metrics calculated)
         └────────┘
```

**UNUSED STATES** (defined but not implemented in workflows):
- `reviewed`: Not referenced in any service/endpoint
- `cancelled`: Not referenced in any service/endpoint

---

## State Transitions Detailed

### 1. `pending` → `running`
**Trigger**: POST `/api/v1/analysis/runs/{run_id}/start`
**Service**: `AnalysisExecutor.start_run(run_id)`
**Location**: `backend/app/services/analysis_service.py:366-401`
**TaskIQ**: `execute_analysis_run.kiq(run_id, use_rag)`
**Actions**:
- Updates `status = AnalysisRunStatus.running.value`
- Sets `started_at = datetime.utcnow()`
- Broadcasts WebSocket event: `analysis_runs` → `run_started`

**Code**:
```python
run.status = AnalysisRunStatus.running.value
run.started_at = datetime.utcnow()
await self.session.commit()
await websocket_manager.broadcast("analysis_runs", {"event": "run_started", ...})
```

---

### 2. `running` → `completed`
**Trigger**: All batches processed successfully
**Service**: `AnalysisExecutor.complete_run(run_id)`
**Location**: `backend/app/services/analysis_service.py:689-739`
**Actions**:
- Updates `status = AnalysisRunStatus.completed.value`
- Sets `completed_at = datetime.utcnow()`
- Broadcasts WebSocket event: `analysis_runs` → `run_completed`

**Code**:
```python
run.status = AnalysisRunStatus.completed.value
run.completed_at = datetime.utcnow()
await websocket_manager.broadcast("analysis_runs", {"event": "run_completed", ...})
```

---

### 3. `running` → `failed`
**Trigger**: Exception during `execute_analysis_run` task
**Service**: `AnalysisExecutor.fail_run(run_id, error)`
**Location**: `backend/app/services/analysis_service.py:741-781`
**Actions**:
- Updates `status = AnalysisRunStatus.failed.value`
- Stores `error_log = {"timestamp": ..., "error": error}`
- Broadcasts WebSocket event: `analysis_runs` → `run_failed`

**Code**:
```python
run.status = AnalysisRunStatus.failed.value
run.error_log = {"timestamp": datetime.utcnow().isoformat(), "error": error}
await websocket_manager.broadcast("analysis_runs", {"event": "run_failed", ...})
```

---

### 4. `completed` → `closed`
**Trigger**: PUT `/api/v1/analysis/runs/{run_id}/close`
**Validation**: `proposals_pending == 0` (via `AnalysisRunValidator.can_close_run()`)
**Service**: `AnalysisRunCRUD.close(run_id)`
**Location**: `backend/app/services/analysis_service.py:309-340`
**Actions**:
- Validates all proposals reviewed (no pending)
- Updates `status = AnalysisRunStatus.closed.value`
- Sets `closed_at = datetime.utcnow()`
- Calculates `accuracy_metrics` (approval_rate, rejection_rate)
- Broadcasts WebSocket event: `analysis` → `run_closed`

**Code**:
```python
run.status = AnalysisRunStatus.closed.value
run.closed_at = datetime.utcnow()
run.accuracy_metrics = {
    "proposals_total": total_proposals,
    "approval_rate": (approved / total if total > 0 else 0.0),
    "rejection_rate": (rejected / total if total > 0 else 0.0),
}
```

---

## Validation Rules (Business Logic)

### Rule 1: Single Active Run (Creation Validation)
**Source**: `AnalysisRunValidator.can_start_new_run()`
**Location**: `backend/app/services/analysis_service.py:54-93`
**Rule**: Cannot create new run if unclosed runs exist
**Unclosed states**: `pending`, `running`, `completed`, `reviewed`
**HTTP Response**: `409 Conflict` with error message listing unclosed run IDs

**Implementation**:
```python
unclosed_statuses = [
    AnalysisRunStatus.pending.value,
    AnalysisRunStatus.running.value,
    AnalysisRunStatus.completed.value,
    AnalysisRunStatus.reviewed.value,
]
# Query for unclosed runs and reject if any exist
```

### Rule 2: Complete Review Before Closure
**Source**: `AnalysisRunValidator.can_close_run(run_id)`
**Location**: `backend/app/services/analysis_service.py:95-127`
**Rule**: Cannot close run if `proposals_pending > 0`
**HTTP Response**: `400 Bad Request` with pending count

**Implementation**:
```python
if run.proposals_pending > 0:
    return (False, f"Cannot close run: {run.proposals_pending} proposal(s) still pending review")
```

---

## Analysis Execution Workflow (Background Job)

**Task**: `execute_analysis_run(run_id, use_rag)`
**Source**: `backend/app/tasks.py:410-521`
**Broker**: NATS (TaskIQ)

### Workflow Steps:
1. **Start Run** → `AnalysisExecutor.start_run()` → `pending` → `running`
2. **Fetch Messages** → `AnalysisExecutor.fetch_messages()` → Query messages in time window
3. **Prefilter Messages** → `AnalysisExecutor.prefilter_messages()` → Keyword/length/@mention filtering
4. **Create Batches** → `AnalysisExecutor.create_batches()` → Group by time proximity (5-10min, max 50 msgs)
5. **Process Batches** → `AnalysisExecutor.process_batch()` → LLM generates proposals (with optional RAG)
6. **Save Proposals** → `AnalysisExecutor.save_proposals()` → Store in DB, update counts
7. **Update Progress** → `AnalysisExecutor.update_progress()` → Broadcast WebSocket events
8. **Complete Run** → `AnalysisExecutor.complete_run()` → `running` → `completed`
9. **OR Fail Run** → `AnalysisExecutor.fail_run()` → `running` → `failed` (on exception)

### Error Handling:
```python
try:
    # Steps 1-8
    result = await executor.complete_run(run_uuid)
except Exception as e:
    await executor.fail_run(run_uuid, str(e))
    raise  # Mark TaskIQ job as failed
```

---

## Services/Endpoints Cataloged

### API Endpoints (`backend/app/api/v1/analysis_runs.py`)
| Endpoint | Method | Description | State Transition |
|----------|--------|-------------|------------------|
| `/api/v1/analysis/runs` | GET | List analysis runs with filters | - |
| `/api/v1/analysis/runs` | POST | Create new run | → `pending` |
| `/api/v1/analysis/runs/{run_id}` | GET | Get run details | - |
| `/api/v1/analysis/runs/{run_id}/start` | POST | Trigger background job | `pending` → `running` |
| `/api/v1/analysis/runs/{run_id}/close` | PUT | Close run with metrics | `completed` → `closed` |

### Services (`backend/app/services/analysis_service.py`)
| Service | Purpose | State Management |
|---------|---------|------------------|
| `AnalysisRunValidator` | Business rule validation | Validates state transitions |
| `AnalysisRunCRUD` | Database operations | Creates `pending`, updates to `closed` |
| `AnalysisExecutor` | Background job execution | Manages `running` → `completed`/`failed` |

### Background Tasks (`backend/app/tasks.py`)
| Task | Description | States Changed |
|------|-------------|----------------|
| `execute_analysis_run` | Main analysis orchestrator | `pending` → `running` → `completed`/`failed` |

---

## Discrepancy Resolution

**Original Audit Claim**: "7 states vs 4 states"
**Investigation Result**: **7 states are CORRECT**

**Evidence**:
1. **Enum Definition**: 7 states defined in `AnalysisRunStatus` enum (lines 69-78)
2. **Active States**: 5 states actively used (`pending`, `running`, `completed`, `closed`, `failed`)
3. **Inactive States**: 2 states defined but unused (`reviewed`, `cancelled`)

**Conclusion**: The audit identified 7 states correctly. The "4 states" reference was likely:
- An outdated count from earlier development
- A count of *actively used* states excluding terminal states
- Confusion with a different model's state machine

**Current Implementation**: **7 states (5 active + 2 unused but defined)**

---

## State Machine Characteristics

### Terminal States (No Outbound Transitions)
- `closed` - Final success state (PM-confirmed accuracy metrics)
- `failed` - Final error state (execution error logged)
- `cancelled` - Defined but unused (no implementation)

### Lifecycle Timestamps
| Field | Set When | State |
|-------|----------|-------|
| `created_at` | Run creation | `pending` |
| `started_at` | Job starts | `running` |
| `completed_at` | Job finishes | `completed` |
| `closed_at` | PM closes run | `closed` |

### WebSocket Events Broadcast
| Event | State Transition | Channel |
|-------|------------------|---------|
| `run_created` | → `pending` | `analysis` |
| `run_started` | `pending` → `running` | `analysis_runs` |
| `progress_updated` | During `running` | `analysis_runs` |
| `proposals_created` | During `running` | `analysis_runs` |
| `run_completed` | `running` → `completed` | `analysis_runs` |
| `run_failed` | `running` → `failed` | `analysis_runs` |
| `run_closed` | `completed` → `closed` | `analysis` |

---

## Implementation Notes

### RAG (Retrieval-Augmented Generation) Support
**Feature**: Optional context-aware proposal generation
**Trigger**: `use_rag=true` query parameter on `/start` endpoint
**Implementation**: `AnalysisExecutor.process_batch(use_rag=True)`
**Services Used**:
- `EmbeddingService` - Generate message embeddings
- `SemanticSearchService` - Find similar past proposals
- `RAGContextBuilder` - Build enriched context
- `LLMProposalService.generate_proposals_with_rag()` - Enhanced LLM call

### Proposal Lifecycle Integration
**Tracking**: `proposals_total`, `proposals_approved`, `proposals_rejected`, `proposals_pending`
**Update Flow**:
1. `save_proposals()` → Increments `proposals_total`, `proposals_pending`
2. PM reviews proposals → Updates counts via ProposalService
3. `close()` → Validates `proposals_pending == 0`, calculates accuracy metrics

---

## Files Investigated

### Models
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/analysis_run.py` (212 lines)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/enums.py` (lines 69-78)

### Services
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/analysis_service.py` (781 lines)

### API
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/analysis_runs.py` (341 lines)

### Background Tasks
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py` (lines 410-521)

---

## Recommendations for Documentation

1. **Document Unused States**: Clarify that `reviewed` and `cancelled` are reserved for future features
2. **State Diagram**: Create visual state machine diagram in docs
3. **Error Recovery**: Document retry/recovery strategies for `failed` state
4. **RAG Feature**: Explain RAG enhancement in separate architecture doc
5. **WebSocket Events**: Document all real-time events for frontend integration

---

## Summary Statistics

- **Total States**: 7
- **Active States**: 5 (`pending`, `running`, `completed`, `closed`, `failed`)
- **Unused States**: 2 (`reviewed`, `cancelled`)
- **Terminal States**: 3 (`closed`, `failed`, `cancelled`)
- **Validation Rules**: 2 (single active run, complete review before closure)
- **WebSocket Events**: 7 distinct event types
- **API Endpoints**: 5 (2 state-changing)
- **Background Tasks**: 1 orchestrator (`execute_analysis_run`)

---

**Investigation Complete** ✅
**Discrepancy Resolved**: 7 states confirmed (not 4)
**Next Steps**: Use findings to create comprehensive system documentation
