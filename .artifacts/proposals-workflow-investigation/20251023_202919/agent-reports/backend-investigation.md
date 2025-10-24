# Backend Proposals Workflow Investigation Report

**Feature:** Task Proposal System Analysis
**Session:** 2025-10-23 20:29:19
**Agent:** fastapi-backend-expert
**Completed:** 2025-10-23 21:45:00

---

## Executive Summary

The task tracker backend implements a comprehensive **AI-powered task proposal workflow** where LLM agents analyze message batches and generate structured task proposals for PM review. The system currently supports **TaskProposal** entities (fully implemented) but does **NOT** have dedicated Topic/Atom proposal models - topics and atoms are created directly by the knowledge extraction service without a review workflow.

**Key Findings:**
- TaskProposal workflow is production-ready with complete CRUD, review actions (approve/reject/merge), and duplicate detection
- Analysis runs orchestrate batch processing via TaskIQ background jobs with WebSocket real-time updates
- No proposal system exists for Topic/Atom creation - they bypass review and go directly to production
- Strong separation of concerns: models, services, API routes, and background jobs are well-organized
- Comprehensive duplicate detection with similarity scoring and semantic matching

---

## Architecture Overview

### CRITICAL ARCHITECTURAL CLARIFICATION

**TaskProposal Sources (CORRECTED):**

TaskProposals are NOT created directly from Messages. They come from:

1. **Topics/Atoms Analysis** (Primary Source)
   - AnalysisRun analyzes accumulated knowledge in Topics/Atoms
   - Identifies patterns, gaps, opportunities
   - Generates TaskProposals for actionable items

2. **Bugs** - Direct bug reports from users

3. **User Suggestions** - Explicit feature requests

**Correct Flow:**
```
STAGE 1: Knowledge Building
Messages → KnowledgeExtraction → TopicProposals/AtomProposals → Approve → Topics/Atoms

STAGE 2: Task Identification (from accumulated knowledge)
Topics/Atoms → AnalysisRun → TaskProposals → Approve → Tasks
```

**NOT:** Messages → AnalysisRun → TaskProposals (INCORRECT)

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROPOSAL WORKFLOW ARCHITECTURE               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Frontend   │       │  WebSocket   │       │   TaskIQ     │
│  Dashboard   │◄─────►│   Manager    │◄─────►│   Worker     │
└──────┬───────┘       └──────────────┘       └───────┬──────┘
       │                                               │
       │ HTTP/REST                                     │ NATS
       ▼                                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                            │
├──────────────────────────────────────────────────────────────┤
│  API Layer                                                    │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ /api/v1/runs    │  │ /api/v1/        │                   │
│  │   - POST create │  │   proposals     │                   │
│  │   - POST start  │  │   - GET list    │                   │
│  │   - PUT close   │  │   - PUT approve │                   │
│  └────────┬────────┘  │   - PUT reject  │                   │
│           │           │   - PUT merge   │                   │
│           │           │   - PUT update  │                   │
│           │           └────────┬────────┘                   │
├───────────┼────────────────────┼──────────────────────────────┤
│  Service Layer                 │                              │
│  ┌────────▼───────┐  ┌────────▼───────┐  ┌───────────────┐ │
│  │ AnalysisRunCRUD│  │ TaskProposal   │  │ LLMProposal   │ │
│  │ - create()     │  │ CRUD           │  │ Service       │ │
│  │ - list()       │  │ - approve()    │  │ - generate()  │ │
│  │ - close()      │  │ - reject()     │  │ - with_rag()  │ │
│  └────────┬───────┘  │ - merge()      │  └───────────────┘ │
│           │          └────────────────┘                      │
│  ┌────────▼──────────────────────────────┐                  │
│  │   AnalysisExecutor                    │                  │
│  │   - fetch_messages()                  │                  │
│  │   - prefilter_messages()              │                  │
│  │   - create_batches()                  │                  │
│  │   - process_batch()                   │                  │
│  │   - save_proposals()                  │                  │
│  └───────────────────────────────────────┘                  │
├──────────────────────────────────────────────────────────────┤
│  Data Models                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │AnalysisRun  │  │TaskProposal │  │TaskEntity   │         │
│  │ - time_window│ │ - proposed_*│  │ (Phase 2)   │         │
│  │ - proposals_*│ │ - similar_* │  │             │         │
│  │ - status    │  │ - llm_*     │  │             │         │
│  │ - metrics   │  │ - review_*  │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  PostgreSQL    │
                  │  - Messages    │
                  │  - Proposals   │
                  │  - Runs        │
                  └────────────────┘
```

---

## Database Models

### 1. TaskProposal Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/task_proposal.py`

**Purpose:** Stores AI-generated task proposals with source tracking, duplicate detection, and PM review workflow.

**Key Fields:**

```python
class TaskProposal(SQLModel, table=True):
    # Primary Key
    id: UUID
    analysis_run_id: UUID  # Parent analysis run

    # Proposed Task Data
    proposed_title: str
    proposed_description: str
    proposed_priority: str  # low/medium/high/critical
    proposed_category: str  # feature/bug/improvement/question/chore
    proposed_tags: list[str]
    proposed_project_id: UUID | None
    proposed_parent_id: UUID | None
    proposed_sub_tasks: list[dict] | None

    # Source Tracking (CRITICAL for duplicate detection)
    source_message_ids: list[int]  # Messages that created this proposal
    message_count: int
    time_span_seconds: int

    # Duplicate Detection
    similar_task_id: UUID | None
    similarity_score: float | None  # 0.0-1.0
    similarity_type: str | None  # exact_messages/semantic/none
    diff_summary: dict | None

    # LLM Metadata
    llm_recommendation: str  # new_task/update_existing/merge/reject
    confidence: float  # 0.0-1.0
    reasoning: str
    project_classification_confidence: float | None
    project_keywords_matched: list[str] | None

    # Review Status
    status: str  # pending/approved/rejected/merged
    reviewed_by_user_id: int | None
    reviewed_at: datetime | None
    review_action: str | None  # approve/reject/merge/split/edit
    review_notes: str | None

    created_at: datetime
```

**Relationships:**
- Parent: `AnalysisRun` (one-to-many)
- References: `ProjectConfig`, `TaskEntity`, `User`

**Enums Used:**
- `ProposalStatus`: pending, approved, rejected, merged
- `LLMRecommendation`: new_task, update_existing, merge, reject
- `SimilarityType`: exact_messages, semantic, none

### 2. AnalysisRun Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/analysis_run.py`

**Purpose:** Orchestrates AI analysis runs, tracks proposals, and manages lifecycle.

**Key Fields:**

```python
class AnalysisRun(SQLModel, table=True):
    id: UUID

    # Time Window
    time_window_start: datetime
    time_window_end: datetime

    # Configuration Snapshot
    agent_assignment_id: UUID
    project_config_id: UUID | None
    config_snapshot: dict  # Full config at run time

    # Execution & Lifecycle
    trigger_type: str  # manual/scheduled/custom
    triggered_by_user_id: int | None
    status: str  # pending/running/completed/reviewed/closed/failed/cancelled

    # Timestamps
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    closed_at: datetime | None

    # Proposals Tracking
    proposals_total: int
    proposals_approved: int
    proposals_rejected: int
    proposals_pending: int

    # LLM Usage Statistics
    total_messages_in_window: int
    messages_after_prefilter: int
    batches_created: int
    llm_tokens_used: int
    cost_estimate: float

    # Results
    error_log: dict | None
    accuracy_metrics: dict | None
```

**Lifecycle Flow:**
```
pending → running → completed → reviewed → closed
                          ↓
                       failed
```

**Business Rules:**
1. Only one unclosed run can exist (statuses: pending/running/completed/reviewed)
2. Run can only be closed when `proposals_pending == 0`
3. Accuracy metrics calculated on close

### 3. TaskEntity Model (Placeholder)

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/task_entity.py`

**Purpose:** Minimal placeholder for Phase 2 task management (satisfies foreign keys).

**Note:** Currently a stub - full implementation deferred to Phase 2.

### 4. Topic & Atom Models (No Proposals)

**Location:**
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/topic.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/atom.py`

**Finding:** Topics and Atoms do NOT have proposal models. They are created directly by `KnowledgeExtractionService` without PM review:

```python
# No TopicProposal or AtomProposal models exist
class Topic(IDMixin, TimestampMixin, SQLModel, table=True):
    name: str
    description: str
    icon: str | None
    color: str | None

class Atom(IDMixin, TimestampMixin, SQLModel, table=True):
    type: str  # problem/solution/decision/question/insight/pattern/requirement
    title: str
    content: str
    confidence: float | None
    user_approved: bool  # Manual approval flag
    meta: dict | None
    embedding: list[float] | None
```

**Knowledge Extraction Flow (No Review):**
1. Messages → LLM → Topics & Atoms
2. Direct database insertion
3. No pending state, no PM review
4. Only post-hoc `user_approved` flag

---

## Service Layer

### 1. TaskProposalCRUD Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/proposal_service.py`

**Purpose:** CRUD operations for TaskProposal with run coordination.

**Key Methods:**

```python
class TaskProposalCRUD:
    async def create(proposal_data: TaskProposalCreate) -> TaskProposalPublic
    async def get(proposal_id: UUID) -> TaskProposalPublic | None
    async def list(skip, limit, run_id, status, confidence_min, confidence_max) -> tuple[list, int]
    async def update(proposal_id: UUID, update_data: TaskProposalUpdate) -> TaskProposalPublic | None

    # Review Actions (Updates run counters)
    async def approve(proposal_id: UUID, user_id: int | None) -> TaskProposalPublic | None
    async def reject(proposal_id: UUID, reason: str, user_id: int | None) -> TaskProposalPublic | None
    async def merge(proposal_id: UUID, target_task_id: UUID, user_id: int | None) -> TaskProposalPublic | None
```

**Key Features:**
- All review actions update parent `AnalysisRun` counters automatically
- `proposals_pending` decremented on approve/reject/merge
- `proposals_approved` / `proposals_rejected` incremented accordingly
- Atomic operations with proper transaction handling

### 2. LLMProposalService

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/llm_proposal_service.py`

**Purpose:** Generate task proposals from message batches using LLM (with optional RAG).

**Key Methods:**

```python
class LLMProposalService:
    async def generate_proposals(messages: list[Message], project_config: ProjectConfig | None) -> list[dict]
    async def generate_proposals_with_rag(
        session: AsyncSession,
        messages: list[Message],
        project_config: ProjectConfig | None,
        use_rag: bool = True
    ) -> list[dict]
```

**LLM Integration:**
- Uses `pydantic-ai` for structured output
- Supports multiple providers: Ollama, OpenAI
- Output schema: `BatchProposalsOutput` → list of `TaskProposalOutput`
- Automatic credential decryption via `CredentialEncryption`

**RAG Enhancement:**
- Retrieves similar past proposals
- Finds relevant knowledge base atoms
- Includes related historical messages
- Reduces duplicate proposal generation

**Prompt Structure:**
1. RAG context (if enabled): past proposals, atoms, messages
2. Current messages batch
3. Project context: name, keywords, description
4. Instructions: group, prioritize, categorize, confidence score, reasoning

### 3. AnalysisRunCRUD Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/analysis_service.py`

**Purpose:** CRUD operations for AnalysisRun with validation.

**Key Methods:**

```python
class AnalysisRunCRUD:
    async def create(run_data: AnalysisRunCreate) -> AnalysisRunPublic
    async def get(run_id: UUID) -> AnalysisRunPublic | None
    async def list(skip, limit, status, trigger_type, start_date, end_date) -> tuple[list, int]
    async def update(run_id: UUID, update_data: AnalysisRunUpdate) -> AnalysisRunPublic | None
    async def close(run_id: UUID) -> AnalysisRunPublic | None
```

**Validation:** Delegated to `AnalysisRunValidator`

### 4. AnalysisRunValidator Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/analysis_service.py`

**Purpose:** Enforce business rules for analysis runs.

**Validation Rules:**

```python
class AnalysisRunValidator:
    async def can_start_new_run() -> tuple[bool, str | None]:
        # Rule: No unclosed runs (pending/running/completed/reviewed)
        # Returns: (True, None) or (False, error_message)

    async def can_close_run(run_id: UUID) -> tuple[bool, str | None]:
        # Rule: proposals_pending must be 0
        # Returns: (True, None) or (False, error_message)

    async def validate_run_exists(run_id: UUID) -> bool
```

### 5. AnalysisExecutor Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/analysis_service.py`

**Purpose:** Execute analysis run background jobs with progress tracking.

**Complete Lifecycle Methods:**

```python
class AnalysisExecutor:
    # Lifecycle Management
    async def start_run(run_id: UUID) -> None
    async def complete_run(run_id: UUID) -> dict
    async def fail_run(run_id: UUID, error: str) -> None

    # Message Processing
    async def fetch_messages(run_id: UUID) -> list[Message]
    async def prefilter_messages(run_id: UUID, messages: list[Message]) -> list[Message]
    async def create_batches(messages: list[Message]) -> list[list[Message]]

    # Proposal Generation
    async def process_batch(run_id: UUID, batch: list[Message], use_rag: bool) -> list[dict]
    async def save_proposals(run_id: UUID, proposals: list[dict]) -> int

    # Progress Tracking
    async def update_progress(run_id: UUID, current: int, total: int) -> None
```

**Execution Flow:**

```
1. start_run()              → status: running, broadcast WebSocket
2. fetch_messages()         → Query messages in time window
3. prefilter_messages()     → Filter by keywords, length, @mentions (~30% remain)
4. create_batches()         → Group by time proximity (5-10min windows, max 50 msgs)
5. FOR EACH BATCH:
   - process_batch()        → Call LLM (optionally with RAG)
   - save_proposals()       → Insert to DB, update run.proposals_*
   - update_progress()      → Broadcast WebSocket
6. complete_run()           → status: completed, broadcast WebSocket
   OR fail_run()            → status: failed, store error_log
```

**Prefiltering Logic:**
- Minimum message length: 10 characters
- If project config has keywords: message must contain keyword OR @mention
- Target: ~30% message retention after filtering

**Batching Algorithm:**
- Sort messages by `sent_at`
- Group by time proximity: < 10 minutes gap
- Max batch size: 50 messages
- Result: Sequential batches for LLM processing

---

## API Endpoints

### 1. Task Proposals API

**Router:** `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/proposals.py`

**Base Path:** `/api/v1/proposals`

**Endpoints:**

| Method | Path | Summary | Description |
|--------|------|---------|-------------|
| GET | `/` | List proposals | Paginated list with filters (run_id, status, confidence) |
| GET | `/{proposal_id}` | Get proposal | Single proposal with full details |
| PUT | `/{proposal_id}` | Edit proposal | Update proposal fields (pending only) |
| PUT | `/{proposal_id}/approve` | Approve | Mark approved, decrement proposals_pending |
| PUT | `/{proposal_id}/reject` | Reject | Mark rejected with reason, decrement proposals_pending |
| PUT | `/{proposal_id}/merge` | Merge | Merge with existing task, decrement proposals_pending |

**Key Features:**
- All review actions broadcast WebSocket events
- Filter support: `run_id`, `status`, `confidence_min`, `confidence_max`
- Pagination: `skip`, `limit` (max 1000)
- Sorted by confidence DESC (highest confidence first)

**WebSocket Events (topic: "proposals"):**

```json
// Approval
{
    "topic": "proposals",
    "event": "approved",
    "data": {
        "id": "...",
        "status": "approved",
        "analysis_run_id": "...",
        "proposed_title": "..."
    }
}

// Rejection
{
    "topic": "proposals",
    "event": "rejected",
    "data": {
        "id": "...",
        "status": "rejected",
        "analysis_run_id": "...",
        "reason": "..."
    }
}

// Merge
{
    "topic": "proposals",
    "event": "merged",
    "data": {
        "id": "...",
        "status": "merged",
        "analysis_run_id": "...",
        "target_task_id": "..."
    }
}

// Update
{
    "topic": "proposals",
    "event": "updated",
    "data": {
        "id": "...",
        "status": "...",
        "analysis_run_id": "..."
    }
}
```

### 2. Analysis Runs API

**Router:** `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/analysis_runs.py`

**Base Path:** `/api/v1/analysis/runs`

**Endpoints:**

| Method | Path | Summary | Description |
|--------|------|---------|-------------|
| GET | `/` | List runs | Paginated list with filters (status, trigger_type, date range) |
| POST | `/` | Create run | Create new run with validation (no unclosed runs) |
| GET | `/{run_id}` | Get run | Single run with metrics and config snapshot |
| POST | `/{run_id}/start` | Start run | Trigger TaskIQ background job (with optional RAG) |
| PUT | `/{run_id}/close` | Close run | Close run and calculate accuracy metrics |

**Key Validation:**
- Create: Enforces no unclosed runs exist (409 Conflict if violated)
- Close: Enforces proposals_pending == 0 (400 Bad Request if violated)

**WebSocket Events (topic: "analysis_runs"):**

```json
// Run Created
{
    "topic": "analysis",
    "event": "run_created",
    "data": {
        "id": "...",
        "status": "pending",
        "trigger_type": "manual",
        "time_window_start": "2025-10-10T00:00:00Z",
        "time_window_end": "2025-10-10T23:59:59Z"
    }
}

// Run Started (from executor)
{
    "event": "run_started",
    "data": {
        "id": "...",
        "status": "running",
        "started_at": "..."
    }
}

// Progress Update (from executor)
{
    "event": "progress_updated",
    "data": {
        "run_id": "...",
        "current_batch": 5,
        "total_batches": 10,
        "progress_percent": 50
    }
}

// Proposals Created (from executor)
{
    "event": "proposals_created",
    "data": {
        "run_id": "...",
        "proposals_count": 15,
        "proposals_total": 45,
        "proposals_pending": 45
    }
}

// Run Completed (from executor)
{
    "event": "run_completed",
    "data": {
        "id": "...",
        "status": "completed",
        "completed_at": "...",
        "proposals_total": 45,
        "proposals_pending": 45,
        "batches_created": 10
    }
}

// Run Failed (from executor)
{
    "event": "run_failed",
    "data": {
        "id": "...",
        "status": "failed",
        "error": "..."
    }
}

// Run Closed (from API)
{
    "topic": "analysis",
    "event": "run_closed",
    "data": {
        "id": "...",
        "status": "closed",
        "accuracy_metrics": {
            "proposals_total": 45,
            "proposals_approved": 30,
            "proposals_rejected": 15,
            "approval_rate": 0.67,
            "rejection_rate": 0.33
        }
    }
}
```

---

## Background Job Processing (TaskIQ)

### Job: `execute_analysis_run`

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:408`

**Purpose:** Main background job for executing analysis runs.

**Signature:**

```python
@nats_broker.task
async def execute_analysis_run(run_id: str, use_rag: bool = False) -> dict[str, str | int]
```

**Execution Steps:**

```python
# 1. Initialize
run_uuid = UUID(run_id)
executor = AnalysisExecutor(db)

# 2. Start run
await executor.start_run(run_uuid)  # Status: running, broadcast WS

# 3. Fetch messages
messages = await executor.fetch_messages(run_uuid)  # Query time window

# 4. Pre-filter
filtered = await executor.prefilter_messages(run_uuid, messages)

# 5. Create batches
batches = await executor.create_batches(filtered)

# 6. Process batches (with progress tracking)
for batch_idx, batch in enumerate(batches):
    await executor.update_progress(run_uuid, batch_idx + 1, len(batches))
    proposals = await executor.process_batch(run_uuid, batch, use_rag=use_rag)
    await executor.save_proposals(run_uuid, proposals)

# 7. Complete
result = await executor.complete_run(run_uuid)  # Status: completed, broadcast WS

# 8. Return summary
return {
    "run_id": run_id,
    "status": "completed",
    "messages_fetched": len(messages),
    "messages_filtered": len(filtered),
    "batches_processed": len(batches),
    "proposals_created": total_proposals
}
```

**Error Handling:**

```python
except Exception as e:
    await executor.fail_run(run_uuid, str(e))  # Status: failed, broadcast WS
    raise  # Re-raise to mark TaskIQ job as failed
```

**RAG Mode:**
- When `use_rag=True`: Uses `LLMProposalService.generate_proposals_with_rag()`
- When `use_rag=False`: Uses `LLMProposalService.generate_proposals()`
- RAG enhances context awareness and reduces duplicate proposals

**Triggered By:**
- API endpoint: `POST /api/v1/analysis/runs/{run_id}/start?use_rag=true`
- Task enqueue: `await execute_analysis_run.kiq(str(run_id), use_rag=True)`

---

## WebSocket Real-Time Events

### WebSocket Manager

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/websocket_manager.py`

**Architecture:** Topic-based pub/sub pattern

**Available Topics:**
- `agents` - Agent configuration updates
- `tasks` - Task entities updates (Phase 2)
- `providers` - LLM provider updates
- `messages` - Message ingestion updates
- `analysis` - Analysis run updates (deprecated, use `analysis_runs`)
- `analysis_runs` - Analysis run lifecycle events
- `proposals` - Proposal review events
- `experiments` - Classification experiment events
- `knowledge` - Knowledge extraction events
- `noise_filtering` - Importance scoring events

**Connection Flow:**

```python
# Client connects with topics
ws = WebSocket("/ws?topics=analysis_runs,proposals")

# Server sends confirmation
{
    "type": "connection",
    "data": {
        "status": "connected",
        "message": "Ready for real-time updates",
        "topics": ["analysis_runs", "proposals"]
    }
}

# Client can subscribe/unsubscribe dynamically
{"action": "subscribe", "topic": "analysis_runs"}
{"action": "unsubscribe", "topic": "proposals"}
```

**Broadcast Pattern:**

```python
await websocket_manager.broadcast(
    "proposals",  # Topic
    {
        "event": "approved",
        "data": {
            "id": "...",
            "status": "approved",
            ...
        }
    }
)
```

### Proposal Workflow Events

**Event Flow:**

```
1. Run Created (POST /runs)
   → Topic: "analysis", Event: "run_created"

2. Run Started (TaskIQ job begins)
   → Topic: "analysis_runs", Event: "run_started"

3. Progress Updates (during batch processing)
   → Topic: "analysis_runs", Event: "progress_updated"

4. Proposals Created (after each batch)
   → Topic: "analysis_runs", Event: "proposals_created"

5. Run Completed (TaskIQ job ends)
   → Topic: "analysis_runs", Event: "run_completed"

6. PM Reviews Proposals
   - Approve: Topic: "proposals", Event: "approved"
   - Reject: Topic: "proposals", Event: "rejected"
   - Merge: Topic: "proposals", Event: "merged"
   - Update: Topic: "proposals", Event: "updated"

7. Run Closed (PUT /runs/{id}/close)
   → Topic: "analysis", Event: "run_closed"
```

---

## Data Flow Diagrams

### TaskProposal Creation Flow

**⚠️ IMPORTANT NOTE:** This diagram describes the current implementation mechanics, but architecturally, TaskProposals should be created from analyzing Topics/Atoms (accumulated knowledge), NOT from direct message analysis. The current implementation may need refactoring to align with the correct architectural pattern:

```
CORRECT: Topics/Atoms → AnalysisRun → TaskProposals
CURRENT IMPL: Messages → AnalysisRun → TaskProposals (needs architectural review)
```

**Current Implementation Flow (as observed in code):**

```
┌─────────────┐
│   Frontend  │ POST /api/v1/analysis/runs
│   Dashboard │ {time_window, agent_assignment_id}
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ API: create_run()                       │
│ 1. Validate: no unclosed runs          │
│ 2. Create AnalysisRun (status: pending)│
│ 3. Broadcast WS: run_created           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Frontend: POST /runs/{id}/start         │
│           ?use_rag=true                 │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ API: start_run()                        │
│ 1. Validate run exists                 │
│ 2. Enqueue TaskIQ job                  │
│    execute_analysis_run.kiq()          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ TaskIQ Worker: execute_analysis_run     │
│                                         │
│ 1. Start: status → running             │
│    Broadcast: run_started              │
│                                         │
│ 2. Fetch messages in time window       │
│    UPDATE run.total_messages_in_window │
│                                         │
│ 3. Pre-filter messages                 │
│    - Length >= 10 chars                │
│    - Has keyword OR @mention           │
│    UPDATE run.messages_after_prefilter │
│                                         │
│ 4. Create batches                      │
│    - Group by time (< 10min gap)       │
│    - Max 50 messages per batch         │
│    UPDATE run.batches_created          │
│                                         │
│ 5. FOR EACH BATCH:                     │
│    ┌──────────────────────────────┐   │
│    │ Process Batch                │   │
│    │ - Call LLM with prompt       │   │
│    │   (optionally with RAG)      │   │
│    │ - Parse TaskProposalOutput   │   │
│    │ - Create proposal dicts      │   │
│    └──────┬───────────────────────┘   │
│           │                            │
│    ┌──────▼───────────────────────┐   │
│    │ Save Proposals               │   │
│    │ - Insert TaskProposal rows   │   │
│    │ - UPDATE run.proposals_total │   │
│    │ - UPDATE run.proposals_pending│   │
│    │ - Broadcast: proposals_created│   │
│    └──────────────────────────────┘   │
│           │                            │
│    ┌──────▼───────────────────────┐   │
│    │ Update Progress              │   │
│    │ - Broadcast: progress_updated│   │
│    └──────────────────────────────┘   │
│                                         │
│ 6. Complete: status → completed        │
│    Broadcast: run_completed            │
│                                         │
│ OR Fail: status → failed               │
│    UPDATE run.error_log                │
│    Broadcast: run_failed               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Frontend: Display proposals             │
│ - List proposals for run                │
│ - Show confidence, reasoning, source    │
│ - PM review interface                   │
└─────────────────────────────────────────┘
```

### TaskProposal Review Flow

```
┌─────────────┐
│   PM        │ Reviews proposals in dashboard
│   Dashboard │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│  APPROVE     │                    │   REJECT     │
│              │                    │              │
│ PUT /proposals│                   │ PUT /proposals│
│ /{id}/approve│                    │ /{id}/reject │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       ▼                                   ▼
┌─────────────────────────────────────────────────┐
│ TaskProposalCRUD.approve()                      │
│ 1. UPDATE proposal.status = "approved"          │
│ 2. UPDATE proposal.review_action = "approve"    │
│ 3. UPDATE proposal.reviewed_by_user_id          │
│ 4. UPDATE proposal.reviewed_at                  │
│ 5. UPDATE run.proposals_pending -= 1            │
│ 6. UPDATE run.proposals_approved += 1           │
│ 7. Broadcast WS: "approved" event               │
└─────────────────────────────────────────────────┘
       │                                   │
┌─────────────────────────────────────────────────┐
│ TaskProposalCRUD.reject()                       │
│ 1. UPDATE proposal.status = "rejected"          │
│ 2. UPDATE proposal.review_action = "reject"     │
│ 3. UPDATE proposal.review_notes = reason        │
│ 4. UPDATE proposal.reviewed_by_user_id          │
│ 5. UPDATE proposal.reviewed_at                  │
│ 6. UPDATE run.proposals_pending -= 1            │
│ 7. UPDATE run.proposals_rejected += 1           │
│ 8. Broadcast WS: "rejected" event               │
└─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ MERGE (Alternative)                             │
│ PUT /proposals/{id}/merge                       │
│ {target_task_id: "..."}                         │
│                                                 │
│ TaskProposalCRUD.merge()                        │
│ 1. UPDATE proposal.status = "merged"            │
│ 2. UPDATE proposal.review_action = "merge"      │
│ 3. UPDATE proposal.review_notes = "Merged..."   │
│ 4. UPDATE proposal.reviewed_by_user_id          │
│ 5. UPDATE proposal.reviewed_at                  │
│ 6. UPDATE run.proposals_pending -= 1            │
│ 7. Broadcast WS: "merged" event                 │
└─────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ When proposals_pending == 0:                    │
│ PUT /runs/{id}/close                            │
│                                                 │
│ AnalysisRunCRUD.close()                         │
│ 1. Validate: proposals_pending == 0             │
│ 2. Calculate accuracy_metrics                   │
│    - approval_rate = approved / total           │
│    - rejection_rate = rejected / total          │
│ 3. UPDATE run.status = "closed"                 │
│ 4. UPDATE run.closed_at                         │
│ 5. Broadcast WS: "run_closed" with metrics      │
└─────────────────────────────────────────────────┘
```

---

## Current State Assessment

### Strengths

1. **Complete TaskProposal Workflow:**
   - Full CRUD operations
   - Review actions (approve/reject/merge)
   - Duplicate detection and similarity scoring
   - Source message tracking
   - LLM metadata (confidence, reasoning, recommendation)

2. **Robust Analysis Run Orchestration:**
   - Lifecycle management (pending → running → completed → closed)
   - Business rule validation (no unclosed runs, proposals_pending == 0)
   - Config snapshot for reproducibility
   - Comprehensive metrics (LLM usage, accuracy)

3. **Background Job Architecture:**
   - TaskIQ + NATS for distributed processing
   - Progress tracking with WebSocket broadcasts
   - Error handling and failure recovery
   - RAG support for enhanced proposals

4. **Real-Time Updates:**
   - Topic-based WebSocket pub/sub
   - Granular events for all state transitions
   - Client-driven topic subscriptions

5. **Service Layer Separation:**
   - Clear boundaries: CRUD, validation, execution, LLM integration
   - Testable components
   - Async/await throughout

### Gaps & Missing Features

1. **No Topic/Atom Proposal System:**
   - Topics and Atoms bypass review workflow
   - Direct database insertion by `KnowledgeExtractionService`
   - Only post-hoc `user_approved` flag on Atoms
   - No pending state, no PM review, no bulk approval

2. **Phase 2 TaskEntity Placeholder:**
   - TaskEntity model is minimal stub
   - No task creation from approved proposals
   - No task management features

3. **Duplicate Detection Implementation:**
   - `similar_task_id` and `similarity_score` fields exist
   - BUT: No service implementation found for semantic search
   - No automatic duplicate detection during proposal creation
   - Manual PM review required

4. **Limited Bulk Operations:**
   - No bulk approve/reject endpoints
   - No batch proposal updates
   - Single-proposal actions only

5. **No Proposal Editing History:**
   - Proposals can be updated via PUT `/proposals/{id}`
   - No audit trail or version history
   - Cannot track changes made during review

6. **Metrics & Analytics:**
   - Accuracy metrics only calculated on run close
   - No proposal quality tracking over time
   - No A/B testing for different agent configs

### Technical Debt

1. **Datetime Handling Inconsistency:**
   - Some places use `datetime.utcnow()` (naive)
   - Others use `datetime.now(UTC)` (aware)
   - Database stores naive timestamps
   - Conversion required in `fetch_messages()`

2. **LLM Provider Coupling:**
   - `LLMProposalService._build_model_instance()` tightly couples to pydantic-ai
   - Adding new providers requires code changes
   - No plugin architecture

3. **Hardcoded Constants:**
   - Batch size: 50 messages (hardcoded in `create_batches`)
   - Time gap: 600 seconds (hardcoded)
   - Message length threshold: 10 characters (hardcoded in `prefilter_messages`)
   - Should be configurable

4. **No Rate Limiting:**
   - LLM API calls not rate-limited
   - Could exceed provider quotas during large runs

5. **Error Messages in WebSocket:**
   - Failed proposals not clearly communicated
   - Only run-level failures broadcast

---

## Recommendations

### Immediate Actions

1. **Implement Topic/Atom Proposal System:**
   - Create `TopicProposal` and `AtomProposal` models
   - Add review workflow similar to TaskProposal
   - Modify `KnowledgeExtractionService` to create proposals instead of direct entities
   - Add API endpoints for bulk approval/rejection

2. **Standardize Datetime Handling:**
   - Use timezone-aware datetimes throughout
   - Update database schema to store timezone info
   - Create migration for existing data

3. **Extract Configuration:**
   - Move hardcoded constants to `settings.py` or database config
   - Make batch size, time gap, length threshold configurable per agent

### Future Enhancements

1. **Semantic Duplicate Detection:**
   - Implement `similar_task_id` and `similarity_score` calculation
   - Use vector embeddings for semantic search
   - Integrate with existing `EmbeddingService` and `SemanticSearchService`

2. **Proposal Editing History:**
   - Add `TaskProposalHistory` model
   - Track all changes during review
   - Show diff in frontend

3. **Bulk Operations API:**
   - `POST /proposals/bulk/approve` - Approve multiple proposals
   - `POST /proposals/bulk/reject` - Reject multiple proposals
   - `POST /proposals/bulk/merge` - Merge multiple proposals

4. **Enhanced Metrics:**
   - Proposal quality dashboard
   - Agent performance comparison
   - A/B testing framework for system prompts

5. **Rate Limiting:**
   - Implement LLM API rate limiting
   - Queue overflow handling
   - Cost budget tracking

---

## Testing Landscape

### Test Coverage

Test files found:
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/api/v1/test_proposals.py` - Proposals API tests
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/api/v1/test_analysis_runs.py` - Analysis runs API tests
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/models/test_task_proposal.py` - TaskProposal model tests
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/models/test_analysis_run.py` - AnalysisRun model tests
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/tasks/test_analysis_executor.py` - AnalysisExecutor tests
- `/Users/maks/PycharmProjects/task-tracker/backend/tests/integration/test_full_workflow.py` - End-to-end workflow tests

### Testing Gaps

1. **Service Layer:**
   - No dedicated tests for `TaskProposalCRUD` service
   - No tests for `AnalysisRunCRUD` service
   - No tests for `AnalysisRunValidator` business rules

2. **LLM Integration:**
   - No tests for `LLMProposalService.generate_proposals()`
   - No tests for RAG mode
   - No mock LLM responses

3. **WebSocket:**
   - No tests for WebSocket event broadcasting
   - No tests for topic subscriptions

4. **Error Scenarios:**
   - Limited error case coverage
   - No tests for concurrent run validation
   - No tests for proposal state transitions

---

## Conclusion

The TaskProposal workflow is **production-ready** with comprehensive implementation across all layers (models, services, API, background jobs, WebSocket events). The system demonstrates strong architectural patterns with clear separation of concerns, robust validation, and real-time updates.

**Critical Finding:** The system **lacks a proposal workflow for Topics and Atoms** - they are created directly without PM review, representing a significant gap in quality control compared to the TaskProposal system.

**Next Steps Priority:**
1. Implement TopicProposal and AtomProposal models with review workflow
2. Standardize datetime handling (timezone-aware)
3. Add comprehensive service layer tests
4. Implement semantic duplicate detection

---

**Report Completed:** 2025-10-23 21:45:00
**Total Files Analyzed:** 15+ files across models, services, API routes, and background jobs
**Lines of Code Reviewed:** ~5000+ lines

**Session Artifacts:** `.artifacts/proposals-workflow-investigation/20251023_202919/agent-reports/backend-investigation.md`