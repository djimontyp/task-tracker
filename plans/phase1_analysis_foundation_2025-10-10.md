# Phase 1: Analysis Foundation - Implementation Plan

> **Created**: 2025-10-10
> **Status**: Planning Complete, Ready for Execution
> **Estimated Duration**: 30-42 hours (1-2 weeks)
> **Architecture Reference**: ANALYSIS_SYSTEM_ARCHITECTURE.md (Phase 1)

---

## 🎯 **Phase 1 Goals**

Enable PM to:
- ✅ Manually trigger analysis runs for specific time windows
- ✅ AI processes messages and generates task proposals
- ✅ Review proposals (approve/reject/merge with existing tasks)
- ✅ Close analysis runs and view accuracy metrics
- ✅ System prevents starting new runs until previous runs are closed

---

## 📋 **Task Overview**

```
EXECUTION ORDER (Sequential dependencies):
1. Database Models          ⏱️  4-6 hours   [BLOCKING]
2. API Endpoints            ⏱️  6-8 hours   [BLOCKING]
3. Background Jobs          ⏱️  4-6 hours   [PARALLEL with 4]
4. Frontend Pages           ⏱️  8-10 hours  [PARALLEL with 3]
5. Tests                    ⏱️  4-6 hours   [AFTER 1-4]
6. Documentation            ⏱️  2-3 hours   [AFTER 1-5]
7. Architecture Review      ⏱️  2-3 hours   [FINAL]

Total: 30-42 hours
```

---

## 🔧 **TASK 1: Database Models**

**Agent**: `fastapi-backend-expert`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 4-6 hours
**Dependencies**: None (foundation task)
**Blocks**: All other tasks

### **Scope**

Create 3 new models + extend 1 existing model:
1. `AnalysisRun` - coordinates AI analysis runs
2. `TaskProposal` - AI-generated task proposals
3. `ProjectConfig` - classification project configurations
4. Extend `Message` model with analysis tracking fields

### **Implementation Details**

#### **1.1 AnalysisRun Model**

**File**: `backend/app/models/analysis_run.py`

**Key Requirements**:
- Extend `MessageIngestionJob` lifecycle pattern (pending→running→completed→reviewed→closed)
- Store config snapshot for reproducibility
- Track proposals and metrics
- Support manual, scheduled, and custom triggers

**Required Fields**:
```python
# Identity
id: UUID

# Time window
time_window_start: datetime
time_window_end: datetime

# Configuration snapshot (versioning!)
agent_assignment_id: UUID = Field(foreign_key="agent_task_assignments.id")
project_config_id: UUID | None = Field(foreign_key="project_configs.id")
config_snapshot: dict = Field(sa_type=JSONB)  # Full config at run time

# Execution & Lifecycle
trigger_type: str  # manual/scheduled/custom
triggered_by_user_id: int | None = Field(foreign_key="users.id")
status: str  # pending/running/completed/reviewed/closed/failed/cancelled

# Lifecycle timestamps
created_at: datetime
started_at: datetime | None
completed_at: datetime | None
closed_at: datetime | None  # When PM closed

# Proposals tracking
proposals_total: int = 0
proposals_approved: int = 0
proposals_rejected: int = 0
proposals_pending: int = 0

# LLM usage statistics
total_messages_in_window: int = 0
messages_after_prefilter: int = 0
batches_created: int = 0
llm_tokens_used: int = 0
cost_estimate: float = 0.0

# Results
error_log: dict | None = Field(sa_type=JSONB)
accuracy_metrics: dict | None = Field(sa_type=JSONB)  # Calculated after closing
```

**Enum**:
```python
class AnalysisRunStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    reviewed = "reviewed"
    closed = "closed"
    failed = "failed"
    cancelled = "cancelled"
```

**Checkpoints**:
- [ ] File created: `backend/app/models/analysis_run.py`
- [ ] Model inherits from `IDMixin, TimestampMixin, SQLModel`
- [ ] All required fields present with correct types
- [ ] Foreign keys defined: `agent_task_assignments`, `project_configs`, `users`
- [ ] JSONB fields: `config_snapshot`, `error_log`, `accuracy_metrics`
- [ ] `AnalysisRunStatus` enum created in `backend/app/models/enums.py`
- [ ] Model imports without errors: `from backend.app.models.analysis_run import AnalysisRun`
- [ ] Pydantic schemas created: `AnalysisRunCreate`, `AnalysisRunUpdate`, `AnalysisRunPublic`

---

#### **1.2 TaskProposal Model**

**File**: `backend/app/models/task_proposal.py`

**Key Requirements**:
- Track source message IDs for duplicate detection
- Store LLM reasoning and confidence
- Support similarity detection
- Enable PM review workflow

**Required Fields**:
```python
# Identity
id: UUID
analysis_run_id: UUID = Field(foreign_key="analysis_runs.id")

# Proposed task data
proposed_title: str
proposed_description: str = Field(sa_type=Text)
proposed_priority: TaskPriority  # low/medium/high/critical
proposed_category: TaskCategory  # bug/feature/improvement/question/chore
proposed_project_id: UUID | None = Field(foreign_key="project_configs.id")
proposed_tags: list[str] = Field(sa_type=JSONB)
proposed_parent_id: UUID | None = Field(
    foreign_key="task_entities.id",
    description="Parent task if this should be sub-task"
)

# Source tracking (CRITICAL for duplicate detection!)
source_message_ids: list[int] = Field(
    sa_type=JSONB,
    description="Message IDs that created this proposal"
)
message_count: int
time_span_seconds: int  # seconds between first and last message

# Extracted sub-tasks
proposed_sub_tasks: list[dict] | None = Field(sa_type=JSONB)

# Duplicate detection
similar_task_id: UUID | None = Field(foreign_key="task_entities.id")
similarity_score: float | None = Field(ge=0.0, le=1.0)
similarity_type: str | None  # exact_messages/semantic/none
diff_summary: dict | None = Field(sa_type=JSONB)

# LLM metadata
llm_recommendation: str  # new_task/update_existing/merge/reject
confidence: float = Field(ge=0.0, le=1.0)
reasoning: str = Field(sa_type=Text)

# Project classification
project_classification_confidence: float | None
project_keywords_matched: list[str] | None = Field(sa_type=JSONB)

# Review status
status: str  # pending/approved/rejected/merged
reviewed_by_user_id: int | None = Field(foreign_key="users.id")
reviewed_at: datetime | None
review_action: str | None  # approve/reject/merge/split/edit
review_notes: str | None = Field(sa_type=Text)

# Timestamps
created_at: datetime
```

**Enums**:
```python
class ProposalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    merged = "merged"

class LLMRecommendation(str, Enum):
    new_task = "new_task"
    update_existing = "update_existing"
    merge = "merge"
    reject = "reject"

class SimilarityType(str, Enum):
    exact_messages = "exact_messages"
    semantic = "semantic"
    none = "none"
```

**Checkpoints**:
- [ ] File created: `backend/app/models/task_proposal.py`
- [ ] All required fields present
- [ ] `source_message_ids` is `list[int]` with JSONB type
- [ ] Foreign keys: `analysis_runs`, `project_configs`, `task_entities`, `users`
- [ ] Enums created in `backend/app/models/enums.py`
- [ ] Model imports without errors
- [ ] Pydantic schemas created: `TaskProposalCreate`, `TaskProposalUpdate`, `TaskProposalPublic`

---

#### **1.3 ProjectConfig Model**

**File**: `backend/app/models/project_config.py`

**Key Requirements**:
- Store project classification keywords
- Support domain glossary
- Track components and team
- Version management

**Required Fields**:
```python
# Identity
id: UUID
name: str = Field(unique=True, index=True)
description: str = Field(sa_type=Text)

# Classification keywords/phrases
keywords: list[str] = Field(
    sa_type=JSONB,
    description="Keywords for project detection"
)
glossary: dict = Field(
    sa_type=JSONB,
    description="Domain-specific terminology"
)

# Components/modules
components: list[dict] = Field(
    sa_type=JSONB,
    description="[{name, keywords}]"
)

# Team
default_assignee_ids: list[int] = Field(sa_type=JSONB)
pm_user_id: int = Field(foreign_key="users.id")

# Settings
is_active: bool = True
priority_rules: dict = Field(
    sa_type=JSONB,
    description="Rules for priority assignment"
)

# Versioning
version: str  # semantic version (1.0.0)
created_at: datetime
updated_at: datetime
```

**Checkpoints**:
- [ ] File created: `backend/app/models/project_config.py`
- [ ] All required fields present
- [ ] `keywords` validation: non-empty list
- [ ] JSONB fields: `keywords`, `glossary`, `components`, `priority_rules`, `default_assignee_ids`
- [ ] Foreign key: `users` (pm_user_id)
- [ ] Unique constraint on `name`
- [ ] Model imports without errors
- [ ] Pydantic schemas created: `ProjectConfigCreate`, `ProjectConfigUpdate`, `ProjectConfigPublic`

---

#### **1.4 Message Model Extensions**

**File**: `backend/app/models/message.py` (existing file)

**Changes**:
```python
# Add new fields:
analysis_status: str | None = Field(
    default="pending",
    description="Analysis processing status"
)  # pending/analyzed/spam/noise

included_in_runs: list[str] | None = Field(
    default=None,
    sa_type=JSONB,
    description="UUIDs of AnalysisRuns that processed this message"
)
```

**Enum**:
```python
class AnalysisStatus(str, Enum):
    pending = "pending"
    analyzed = "analyzed"
    spam = "spam"
    noise = "noise"
```

**Checkpoints**:
- [ ] `analysis_status` field added with default="pending"
- [ ] `included_in_runs` field added as `list[str]` (JSONB)
- [ ] `AnalysisStatus` enum added to `backend/app/models/enums.py`
- [ ] Alembic migration created for schema changes
- [ ] Migration runs successfully: `alembic upgrade head`
- [ ] Existing messages get default values

---

#### **1.5 Alembic Migration**

**Commands**:
```bash
# Generate migration
uv run alembic revision --autogenerate -m "Add Phase 1 analysis models"

# Review migration file
# Ensure foreign keys, indexes, and constraints are correct

# Apply migration
uv run alembic upgrade head
```

**Checkpoints**:
- [ ] Migration file created in `backend/alembic/versions/`
- [ ] Migration contains:
  - [ ] CREATE TABLE analysis_runs
  - [ ] CREATE TABLE task_proposals
  - [ ] CREATE TABLE project_configs
  - [ ] ALTER TABLE messages ADD COLUMN analysis_status
  - [ ] ALTER TABLE messages ADD COLUMN included_in_runs
  - [ ] All foreign key constraints
  - [ ] Indexes for performance (run status, proposal status)
- [ ] Migration runs without errors
- [ ] Tables created in PostgreSQL
- [ ] Can query tables: `SELECT * FROM analysis_runs LIMIT 1;`
- [ ] Downgrade works: `alembic downgrade -1` then `alembic upgrade head`

---

### **Validation Checklist (Task 1 Complete)**

- [ ] All 3 new models created and importable
- [ ] Message model extended successfully
- [ ] All enums added to `enums.py`
- [ ] All Pydantic schemas created
- [ ] Alembic migration runs cleanly
- [ ] Database tables exist with correct schema
- [ ] Foreign keys work (can create related records)
- [ ] JSONB fields accept dict/list data
- [ ] No import errors in Python REPL:
  ```python
  from backend.app.models.analysis_run import AnalysisRun
  from backend.app.models.task_proposal import TaskProposal
  from backend.app.models.project_config import ProjectConfig
  from backend.app.models.message import Message
  ```

---

## 🌐 **TASK 2: API Endpoints**

**Agent**: `fastapi-backend-expert`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 6-8 hours
**Dependencies**: Task 1 (Database Models)
**Blocks**: Tasks 3, 4

### **Scope**

Implement REST API endpoints for:
1. AnalysisRun management (CRUD + lifecycle)
2. TaskProposal management (CRUD + review actions)
3. ProjectConfig management (CRUD)

### **Implementation Details**

#### **2.1 AnalysisRun API Endpoints**

**File**: `backend/app/api/v1/analysis_runs.py`

**Pattern Reference**: Follow `backend/app/api/v1/agents.py` patterns

**Endpoints**:

1. **GET /api/analysis/runs** - List analysis runs
   ```python
   @router.get("/runs", response_model=list[AnalysisRunPublic])
   async def list_analysis_runs(
       skip: int = 0,
       limit: int = 100,
       status: AnalysisRunStatus | None = None,
       trigger_type: str | None = None,
       start_date: datetime | None = None,
       end_date: datetime | None = None,
       db: AsyncSession = Depends(get_db)
   ):
       """List analysis runs with filters."""
   ```
   - Checkpoints:
     - [ ] Pagination works (skip, limit)
     - [ ] Status filter works
     - [ ] Trigger type filter works
     - [ ] Date range filter works
     - [ ] Returns sorted by created_at DESC
     - [ ] Includes proposals counts

2. **POST /api/analysis/runs** - Create new run
   ```python
   @router.post("/runs", response_model=AnalysisRunPublic)
   async def create_analysis_run(
       run_data: AnalysisRunCreate,
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Create new analysis run."""
       # CRITICAL VALIDATION:
       # 1. Check no unclosed runs exist
       # 2. Validate time window
       # 3. Validate agent_assignment_id exists
       # 4. Create config_snapshot
       # 5. Broadcast WebSocket event
   ```
   - Checkpoints:
     - [ ] Validates no unclosed runs (status IN pending/running/completed/reviewed)
     - [ ] Returns 409 Conflict if unclosed runs exist with helpful message
     - [ ] Creates config_snapshot from agent_assignment + project_config
     - [ ] Sets status to "pending"
     - [ ] Broadcasts WebSocket: `{"topic": "analysis", "event": "run_created", "data": {...}}`
     - [ ] Returns created run with ID

3. **GET /api/analysis/runs/{run_id}** - Get run details
   ```python
   @router.get("/runs/{run_id}", response_model=AnalysisRunDetail)
   async def get_analysis_run(
       run_id: UUID,
       db: AsyncSession = Depends(get_db)
   ):
       """Get analysis run details with proposals."""
   ```
   - Checkpoints:
     - [ ] Returns 404 if not found
     - [ ] Includes full config_snapshot
     - [ ] Includes proposals list (paginated if many)
     - [ ] Includes accuracy_metrics if closed
     - [ ] Includes error_log if failed

4. **PUT /api/analysis/runs/{run_id}/close** - Close run
   ```python
   @router.put("/runs/{run_id}/close", response_model=AnalysisRunPublic)
   async def close_analysis_run(
       run_id: UUID,
       pm_user_id: int,  # From auth when implemented
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Close analysis run and calculate metrics."""
       # CRITICAL VALIDATION:
       # 1. Validate proposals_pending = 0
       # 2. Calculate accuracy_metrics
       # 3. Set closed_at timestamp
       # 4. Broadcast WebSocket event
   ```
   - Checkpoints:
     - [ ] Returns 400 if proposals_pending > 0
     - [ ] Calculates accuracy_metrics (approval_rate, confidence_accuracy, etc.)
     - [ ] Sets status to "closed"
     - [ ] Sets closed_at timestamp
     - [ ] Broadcasts WebSocket: `{"topic": "analysis", "event": "run_closed", "data": {...}}`

5. **DELETE /api/analysis/runs/{run_id}** - Cancel run
   ```python
   @router.delete("/runs/{run_id}")
   async def cancel_analysis_run(
       run_id: UUID,
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Cancel pending run."""
   ```
   - Checkpoints:
     - [ ] Only works if status = "pending"
     - [ ] Returns 409 if run already started
     - [ ] Sets status to "cancelled"
     - [ ] Broadcasts WebSocket event

**Validation Service**:
```python
# backend/app/services/analysis_service.py
class AnalysisRunValidator:
    @staticmethod
    async def can_start_new_run(db: AsyncSession) -> tuple[bool, str | None]:
        """Check if new run can be started."""
        # Query unclosed runs
        unclosed = await db.execute(
            select(AnalysisRun).where(
                AnalysisRun.status.in_([
                    "pending", "running", "completed", "reviewed"
                ])
            )
        )
        unclosed_count = len(unclosed.scalars().all())

        if unclosed_count > 0:
            return False, f"Cannot start: {unclosed_count} runs not closed yet"

        return True, None
```

**Checkpoints (2.1 Complete)**:
- [ ] All 5 endpoints implemented
- [ ] FastAPI /docs shows endpoints with correct schemas
- [ ] Validation: cannot start run if unclosed runs exist
- [ ] WebSocket events broadcast correctly
- [ ] Error handling: 404, 400, 409 with helpful messages
- [ ] Pydantic schemas: `AnalysisRunCreate`, `AnalysisRunPublic`, `AnalysisRunDetail`
- [ ] Service layer: `AnalysisRunValidator` implemented

---

#### **2.2 TaskProposal API Endpoints**

**File**: `backend/app/api/v1/proposals.py`

**Endpoints**:

1. **GET /api/proposals** - List proposals
   ```python
   @router.get("", response_model=list[TaskProposalPublic])
   async def list_proposals(
       skip: int = 0,
       limit: int = 100,
       run_id: UUID | None = None,
       status: ProposalStatus | None = None,
       confidence_min: float | None = None,
       confidence_max: float | None = None,
       db: AsyncSession = Depends(get_db)
   ):
       """List task proposals with filters."""
   ```
   - Checkpoints:
     - [ ] Pagination works
     - [ ] Filter by run_id
     - [ ] Filter by status
     - [ ] Filter by confidence range
     - [ ] Returns sorted by confidence DESC (pending first)
     - [ ] Includes source_message_ids

2. **GET /api/proposals/{proposal_id}** - Get proposal details
   ```python
   @router.get("/{proposal_id}", response_model=TaskProposalDetail)
   async def get_proposal(
       proposal_id: UUID,
       db: AsyncSession = Depends(get_db)
   ):
       """Get proposal with source messages."""
   ```
   - Checkpoints:
     - [ ] Returns 404 if not found
     - [ ] Includes full source messages (joined query)
     - [ ] Includes similar_task if exists
     - [ ] Includes LLM reasoning

3. **PUT /api/proposals/{proposal_id}/approve** - Approve proposal
   ```python
   @router.put("/{proposal_id}/approve", response_model=TaskProposalPublic)
   async def approve_proposal(
       proposal_id: UUID,
       approved_by_user_id: int,  # From auth
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Approve proposal (creates TaskEntity in Phase 2)."""
       # 1. Set status = "approved"
       # 2. Set reviewed_by_user_id, reviewed_at
       # 3. Decrement run.proposals_pending
       # 4. Broadcast WebSocket event
       # NOTE: TaskEntity creation is Phase 2
   ```
   - Checkpoints:
     - [ ] Sets status to "approved"
     - [ ] Decrements `analysis_run.proposals_pending`
     - [ ] Broadcasts WebSocket: `{"topic": "proposals", "event": "approved", "data": {...}}`
     - [ ] Returns updated proposal

4. **PUT /api/proposals/{proposal_id}/reject** - Reject proposal
   ```python
   @router.put("/{proposal_id}/reject", response_model=TaskProposalPublic)
   async def reject_proposal(
       proposal_id: UUID,
       rejection: ProposalRejection,  # {reason: str}
       rejected_by_user_id: int,  # From auth
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Reject proposal with reason."""
   ```
   - Checkpoints:
     - [ ] Sets status to "rejected"
     - [ ] Stores rejection reason in review_notes
     - [ ] Decrements `analysis_run.proposals_pending`
     - [ ] Broadcasts WebSocket event

5. **PUT /api/proposals/{proposal_id}/merge** - Merge with existing task
   ```python
   @router.put("/{proposal_id}/merge", response_model=TaskProposalPublic)
   async def merge_proposal(
       proposal_id: UUID,
       merge_data: ProposalMerge,  # {target_task_id: UUID}
       merged_by_user_id: int,  # From auth
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Merge proposal with existing task."""
       # NOTE: TaskEntity update is Phase 2
   ```
   - Checkpoints:
     - [ ] Sets status to "merged"
     - [ ] Stores target_task_id in review_notes
     - [ ] Decrements `analysis_run.proposals_pending`
     - [ ] Broadcasts WebSocket event

6. **PUT /api/proposals/{proposal_id}** - Edit proposal
   ```python
   @router.put("/{proposal_id}", response_model=TaskProposalPublic)
   async def update_proposal(
       proposal_id: UUID,
       proposal_update: TaskProposalUpdate,
       db: AsyncSession = Depends(get_db)
   ):
       """Edit proposal before approval."""
   ```
   - Checkpoints:
     - [ ] Only works if status = "pending"
     - [ ] Updates proposed_title, description, priority, category, tags
     - [ ] Logs edit in review_notes
     - [ ] Broadcasts WebSocket event

**Checkpoints (2.2 Complete)**:
- [ ] All 6 endpoints implemented
- [ ] FastAPI /docs shows endpoints
- [ ] Approval/rejection decrements proposals_pending
- [ ] WebSocket events work
- [ ] Pydantic schemas: `TaskProposalPublic`, `TaskProposalDetail`, `ProposalRejection`, `ProposalMerge`

---

#### **2.3 ProjectConfig API Endpoints**

**File**: `backend/app/api/v1/projects.py`

**Pattern Reference**: Follow `backend/app/api/v1/providers.py` CRUD pattern

**Endpoints**:

1. **GET /api/projects** - List projects
   ```python
   @router.get("", response_model=list[ProjectConfigPublic])
   async def list_projects(
       skip: int = 0,
       limit: int = 100,
       is_active: bool | None = None,
       db: AsyncSession = Depends(get_db)
   ):
       """List project configurations."""
   ```

2. **POST /api/projects** - Create project
   ```python
   @router.post("", response_model=ProjectConfigPublic)
   async def create_project(
       project_data: ProjectConfigCreate,
       db: AsyncSession = Depends(get_db),
       ws_manager: WebSocketManager = Depends(get_ws_manager)
   ):
       """Create new project configuration."""
       # Validate keywords non-empty
   ```

3. **GET /api/projects/{project_id}** - Get project
4. **PUT /api/projects/{project_id}** - Update project
5. **DELETE /api/projects/{project_id}** - Deactivate project

**Checkpoints (2.3 Complete)**:
- [ ] All CRUD endpoints implemented
- [ ] Keywords validation: non-empty list required
- [ ] Version field increments on updates
- [ ] WebSocket events work
- [ ] Pydantic schemas: `ProjectConfigCreate`, `ProjectConfigUpdate`, `ProjectConfigPublic`

---

### **Integration with Existing Code**

**Router Registration**:
```python
# backend/app/main.py
from backend.app.api.v1 import analysis_runs, proposals, projects

app.include_router(analysis_runs.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(proposals.router, prefix="/api/proposals", tags=["proposals"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
```

**Checkpoints**:
- [ ] Routers registered in main.py
- [ ] FastAPI /docs shows all new endpoints
- [ ] Can access: http://localhost:8000/api/analysis/runs
- [ ] OpenAPI schema correct

---

### **Validation Checklist (Task 2 Complete)**

- [ ] All 14 endpoints implemented (5 runs + 6 proposals + 3 projects)
- [ ] FastAPI /docs shows all endpoints with correct request/response schemas
- [ ] Critical validation: cannot start run if unclosed runs exist (tested manually)
- [ ] WebSocket broadcasts work for all events
- [ ] Error responses (404, 400, 409) have helpful messages
- [ ] All Pydantic schemas created and validated
- [ ] Service layer: `AnalysisRunValidator` working
- [ ] Manual API test successful:
  ```bash
  # Test create run
  curl -X POST http://localhost:8000/api/analysis/runs -H "Content-Type: application/json" -d '{...}'

  # Test validation
  curl -X POST http://localhost:8000/api/analysis/runs -H "Content-Type: application/json" -d '{...}'
  # Should return 409 if unclosed run exists
  ```

---

## ⚙️ **TASK 3: Background Jobs**

**Agent**: `fastapi-backend-expert`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 4-6 hours
**Dependencies**: Tasks 1, 2
**Parallel with**: Task 4

### **Scope**

Implement TaskIQ background jobs for:
1. Analysis run executor (main job)
2. Proposal creation from message batches
3. Progress tracking and updates

### **Implementation Details**

#### **3.1 Analysis Run Executor Job**

**File**: `backend/app/tasks/analysis_tasks.py`

**Pattern Reference**: Follow `backend/app/tasks/message_ingestion.py` (if exists) or create new

**Job Structure**:
```python
from taskiq import TaskiqDepends
from backend.app.core.taskiq_broker import broker
from backend.app.services.analysis_service import AnalysisExecutor

@broker.task
async def execute_analysis_run(
    run_id: str,  # UUID as string
    db: AsyncSession = TaskiqDepends(get_db)
):
    """Execute analysis run: process messages and create proposals."""

    executor = AnalysisExecutor(db)

    try:
        # 1. Update status to "running"
        await executor.start_run(run_id)

        # 2. Fetch messages in time window
        messages = await executor.fetch_messages(run_id)

        # 3. Pre-filter messages (keywords, length, @mentions)
        filtered = await executor.prefilter_messages(messages)

        # 4. Group into batches
        batches = await executor.create_batches(filtered)

        # 5. Process each batch
        for batch_idx, batch in enumerate(batches):
            # Update progress
            await executor.update_progress(run_id, batch_idx + 1, len(batches))

            # Create proposals from batch
            proposals = await executor.process_batch(run_id, batch)

            # Save proposals
            await executor.save_proposals(run_id, proposals)

        # 6. Update status to "completed"
        await executor.complete_run(run_id)

    except Exception as e:
        # Handle errors
        await executor.fail_run(run_id, str(e))
        raise
```

**Checkpoints**:
- [ ] Job registered in TaskIQ broker
- [ ] Job accepts run_id parameter
- [ ] Lifecycle management:
  - [ ] Sets status to "running" on start
  - [ ] Updates progress during execution
  - [ ] Sets status to "completed" on success
  - [ ] Sets status to "failed" on error with error_log
- [ ] WebSocket events broadcasted:
  - [ ] run_started
  - [ ] run_progress (each batch)
  - [ ] run_completed
  - [ ] run_failed (if error)
- [ ] Worker can execute job: `docker logs task-tracker-worker` shows processing

---

#### **3.2 Analysis Executor Service**

**File**: `backend/app/services/analysis_service.py`

**Class**: `AnalysisExecutor`

**Methods**:

1. **start_run(run_id)**
   - Update status to "running"
   - Set started_at timestamp
   - Broadcast WebSocket event

2. **fetch_messages(run_id)**
   - Query messages in time window
   - Apply source filters if configured
   - Return message list

3. **prefilter_messages(messages)**
   - Filter by keywords (if project_config has keywords)
   - Filter by length (< 10 chars = noise)
   - Filter by @mentions (if relevant)
   - Return filtered list (~30% remaining)

4. **create_batches(messages)**
   - Group by time proximity (5-10 min windows)
   - Max batch size: 50 messages
   - Keep context: surrounding messages
   - Return list of batches

5. **process_batch(run_id, batch)**
   - Get agent_assignment config
   - Call LLM with batch + prompt
   - Parse LLM response into proposals
   - Return list of TaskProposal objects

6. **save_proposals(run_id, proposals)**
   - Save proposals to database
   - Update run.proposals_total
   - Update run.proposals_pending
   - Broadcast WebSocket event for each proposal

7. **update_progress(run_id, current_batch, total_batches)**
   - Update run.current_batch, run.total_batches
   - Broadcast WebSocket progress event

8. **complete_run(run_id)**
   - Set status to "completed"
   - Set completed_at timestamp
   - Broadcast WebSocket event

9. **fail_run(run_id, error_message)**
   - Set status to "failed"
   - Store error in error_log
   - Broadcast WebSocket event

**Checkpoints**:
- [ ] All 9 methods implemented
- [ ] Each method handles database transactions properly
- [ ] WebSocket manager injected and used
- [ ] Error handling in each method
- [ ] LLM integration works (uses pydantic-ai)

---

#### **3.3 LLM Integration for Proposal Creation**

**File**: `backend/app/services/llm_proposal_service.py`

**Purpose**: Call LLM to analyze message batch and generate proposals

**Implementation**:
```python
from pydantic_ai import Agent
from backend.app.models.agent_config import AgentConfig
from backend.app.models.task_config import TaskConfig

class LLMProposalService:
    def __init__(self, agent_config: AgentConfig, task_config: TaskConfig):
        self.agent_config = agent_config
        self.task_config = task_config

    async def generate_proposals(
        self,
        messages: list[Message],
        project_config: ProjectConfig | None
    ) -> list[dict]:
        """Generate task proposals from message batch using LLM."""

        # Build prompt
        prompt = self._build_prompt(messages, project_config)

        # Create pydantic-ai agent
        agent = Agent(
            model=self.agent_config.model_name,
            system_prompt=self.agent_config.system_prompt,
        )

        # Call LLM
        result = await agent.run(prompt)

        # Parse result into proposals
        proposals = self._parse_proposals(result, messages)

        return proposals

    def _build_prompt(self, messages, project_config):
        """Build LLM prompt from messages and context."""
        # Include:
        # - Message content
        # - Time context
        # - Project keywords (if available)
        # - Instructions to extract tasks
        pass

    def _parse_proposals(self, llm_result, messages):
        """Parse LLM output into proposal dicts."""
        # Extract:
        # - proposed_title, description
        # - proposed_priority, category
        # - confidence score
        # - reasoning
        # - source_message_ids
        pass
```

**Checkpoints**:
- [ ] Service class created
- [ ] Connects to LLM via pydantic-ai
- [ ] Uses AgentConfig for model/prompt
- [ ] Uses TaskConfig for response schema
- [ ] Returns structured proposals
- [ ] Handles LLM errors gracefully

---

#### **3.4 Job Triggering**

**Manual Trigger** (via API endpoint):
```python
# In backend/app/api/v1/analysis_runs.py
@router.post("/runs/{run_id}/start")
async def start_analysis_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Start analysis run job."""
    # Trigger TaskIQ job
    await execute_analysis_run.kiq(str(run_id))
    return {"status": "started"}
```

**Scheduled Trigger** (Phase 2):
```python
# Future: Scheduled nightly runs
@broker.schedule(cron="0 2 * * *")  # 2 AM daily
async def nightly_analysis():
    """Run analysis nightly."""
    # Create run for yesterday
    # Trigger execute_analysis_run
    pass
```

**Checkpoints**:
- [ ] Manual trigger endpoint works
- [ ] Can trigger job via POST /api/analysis/runs/{run_id}/start
- [ ] Worker picks up and executes job
- [ ] Job logs visible: `docker logs task-tracker-worker`

---

### **Testing Background Jobs**

**Manual Test Steps**:
1. Create analysis run via API
2. Trigger job manually: POST /api/analysis/runs/{run_id}/start
3. Watch worker logs: `docker logs -f task-tracker-worker`
4. Check progress updates in API: GET /api/analysis/runs/{run_id}
5. Verify proposals created: GET /api/proposals?run_id={run_id}
6. Verify WebSocket events received in frontend

**Checkpoints**:
- [ ] Job executes without errors
- [ ] Progress updates visible in real-time
- [ ] Proposals created in database
- [ ] WebSocket events received
- [ ] Error handling works (test with invalid data)

---

### **Validation Checklist (Task 3 Complete)**

- [ ] TaskIQ job registered and visible
- [ ] AnalysisExecutor service implements all 9 methods
- [ ] LLMProposalService integrates with pydantic-ai
- [ ] Manual trigger endpoint works
- [ ] Worker executes job successfully
- [ ] Progress tracking works
- [ ] Proposals created in database
- [ ] WebSocket events broadcast correctly
- [ ] Error handling tested (job fails gracefully)
- [ ] Can monitor job execution: `docker logs task-tracker-worker`

---

## 🎨 **TASK 4: Frontend Pages**

**Agent**: `react-frontend-architect`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 8-10 hours
**Dependencies**: Task 2 (API Endpoints)
**Parallel with**: Task 3

### **Scope**

Implement 3 frontend pages with real API integration:
1. AnalysisRunsPage (upgrade from mock to real)
2. ProposalsPage (new page)
3. ProjectsPage (new page)

### **Implementation Details**

#### **4.1 AnalysisRunsPage - Real Implementation**

**Location**: `frontend/src/pages/AnalysisRunsPage/`

**Current State**: 🔄 Functional UI with mock data

**Changes Required**:

1. **Remove mock data**:
   - Delete mock data imports
   - Remove hardcoded runs array

2. **API Integration**:
   ```typescript
   // frontend/src/features/analysis/api/analysisService.ts
   export const analysisService = {
     listRuns: async (params?: {
       status?: string;
       triggerType?: string;
       startDate?: string;
       endDate?: string;
     }): Promise<AnalysisRun[]> => {
       const response = await fetch('/api/analysis/runs?' + new URLSearchParams(params));
       return response.json();
     },

     getRunDetails: async (runId: string): Promise<AnalysisRunDetail> => {
       const response = await fetch(`/api/analysis/runs/${runId}`);
       return response.json();
     },

     createRun: async (data: CreateAnalysisRun): Promise<AnalysisRun> => {
       const response = await fetch('/api/analysis/runs', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data),
       });
       if (!response.ok) {
         const error = await response.json();
         throw new Error(error.detail || 'Failed to create run');
       }
       return response.json();
     },

     closeRun: async (runId: string): Promise<AnalysisRun> => {
       const response = await fetch(`/api/analysis/runs/${runId}/close`, {
         method: 'PUT',
       });
       return response.json();
     },

     startRun: async (runId: string): Promise<void> => {
       await fetch(`/api/analysis/runs/${runId}/start`, { method: 'POST' });
     },
   };
   ```

3. **WebSocket Integration**:
   ```typescript
   // In AnalysisRunsPage component
   useEffect(() => {
     const ws = new WebSocket(`ws://localhost/ws?topics=analysis,proposals`);

     ws.onmessage = (event) => {
       const message = JSON.parse(event.data);

       if (message.topic === 'analysis') {
         switch (message.event) {
           case 'run_created':
             // Add new run to list
             setRuns(prev => [message.data, ...prev]);
             break;
           case 'run_progress':
             // Update run progress
             updateRunProgress(message.data);
             break;
           case 'run_completed':
             // Update run status
             updateRunStatus(message.data.id, 'completed');
             break;
         }
       }
     };

     return () => ws.close();
   }, []);
   ```

4. **Components to Create**:

   **RunList.tsx**:
   ```typescript
   interface RunListProps {
     runs: AnalysisRun[];
     onRunClick: (runId: string) => void;
   }

   export const RunList: React.FC<RunListProps> = ({ runs, onRunClick }) => {
     return (
       <div className="run-list">
         {runs.map(run => (
           <RunCard key={run.id} run={run} onClick={() => onRunClick(run.id)} />
         ))}
       </div>
     );
   };
   ```

   **RunCard.tsx**:
   ```typescript
   export const RunCard: React.FC<{ run: AnalysisRun }> = ({ run }) => {
     return (
       <div className="run-card">
         <div className="run-header">
           <StatusBadge status={run.status} />
           <span className="run-id">Run #{run.id.slice(0, 8)}</span>
         </div>

         <div className="run-details">
           <div className="time-window">
             {formatDate(run.time_window_start)} → {formatDate(run.time_window_end)}
           </div>

           {run.status === 'running' && (
             <ProgressBar
               current={run.current_batch}
               total={run.total_batches}
             />
           )}

           {run.status === 'completed' && (
             <div className="proposals-summary">
               <ProposalCounter
                 total={run.proposals_total}
                 approved={run.proposals_approved}
                 rejected={run.proposals_rejected}
                 pending={run.proposals_pending}
               />
             </div>
           )}
         </div>

         <div className="run-actions">
           {run.proposals_pending > 0 ? (
             <button onClick={() => navigate(`/proposals?run_id=${run.id}`)}>
               Review Pending ({run.proposals_pending})
             </button>
           ) : (
             <button disabled>Close Run</button>
           )}
         </div>
       </div>
     );
   };
   ```

   **CreateRunModal.tsx**:
   ```typescript
   export const CreateRunModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
     const [formData, setFormData] = useState({
       time_window_start: '',
       time_window_end: '',
       agent_assignment_id: '',
       project_config_id: null,
       trigger_type: 'manual',
     });

     const handleSubmit = async () => {
       try {
         await analysisService.createRun(formData);
         toast.success('Analysis run created');
         onClose();
       } catch (error) {
         toast.error(error.message);
       }
     };

     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <h2>Create Analysis Run</h2>
         <form onSubmit={handleSubmit}>
           <DateRangePicker
             start={formData.time_window_start}
             end={formData.time_window_end}
             onChange={(start, end) => setFormData({ ...formData, time_window_start: start, time_window_end: end })}
           />

           <AgentAssignmentSelector
             value={formData.agent_assignment_id}
             onChange={(id) => setFormData({ ...formData, agent_assignment_id: id })}
           />

           <ProjectSelector
             value={formData.project_config_id}
             onChange={(id) => setFormData({ ...formData, project_config_id: id })}
           />

           <button type="submit">Create Run</button>
         </form>
       </Modal>
     );
   };
   ```

**Checkpoints**:
- [ ] Mock data removed
- [ ] API service created: `analysisService.ts`
- [ ] TanStack Query hooks for data fetching
- [ ] WebSocket connection for real-time updates
- [ ] Components created: RunList, RunCard, CreateRunModal
- [ ] Status badges with correct colors (pending=gray, running=blue, completed=yellow, closed=green)
- [ ] Progress bar shows batch progress
- [ ] Proposals counter displays total/approved/rejected/pending
- [ ] "Start New Run" button opens modal
- [ ] Modal validates: cannot create if unclosed runs exist
- [ ] "Review Pending" button navigates to proposals page with filter
- [ ] "Close Run" button works (only if proposals_pending = 0)
- [ ] Real-time updates work (new runs appear, progress updates)
- [ ] Error handling with toast notifications
- [ ] Loading states displayed
- [ ] Responsive design works

---

#### **4.2 ProposalsPage - New Implementation**

**Location**: `frontend/src/pages/ProposalsPage/`

**Current State**: ⏳ Placeholder page

**Components to Create**:

1. **ProposalList.tsx**:
   ```typescript
   export const ProposalList: React.FC = () => {
     const { runId } = useSearchParams();
     const { data: proposals, isLoading } = useQuery({
       queryKey: ['proposals', runId],
       queryFn: () => proposalService.listProposals({ run_id: runId }),
     });

     return (
       <div className="proposal-list">
         <ProposalFilters />
         {proposals.map(proposal => (
           <ProposalCard key={proposal.id} proposal={proposal} />
         ))}
       </div>
     );
   };
   ```

2. **ProposalCard.tsx**:
   ```typescript
   export const ProposalCard: React.FC<{ proposal: TaskProposal }> = ({ proposal }) => {
     const [expanded, setExpanded] = useState(false);

     return (
       <div className="proposal-card">
         <div className="proposal-header">
           <h3>{proposal.proposed_title}</h3>
           <ConfidenceBadge confidence={proposal.confidence} />
         </div>

         <div className="proposal-body">
           <p>{proposal.proposed_description}</p>

           <div className="proposal-meta">
             <PriorityBadge priority={proposal.proposed_priority} />
             <CategoryBadge category={proposal.proposed_category} />
             <span>{proposal.message_count} messages</span>
           </div>

           {proposal.similar_task_id && (
             <div className="duplicate-warning">
               ⚠️ Similar to existing task (similarity: {(proposal.similarity_score * 100).toFixed(0)}%)
               <button onClick={() => viewTask(proposal.similar_task_id)}>View Task</button>
             </div>
           )}

           <div className="llm-metadata">
             <span>Recommendation: {proposal.llm_recommendation}</span>
             <button onClick={() => setExpanded(!expanded)}>
               {expanded ? 'Hide' : 'Show'} LLM Reasoning
             </button>
           </div>

           {expanded && (
             <div className="llm-reasoning">
               <p>{proposal.reasoning}</p>
             </div>
           )}
         </div>

         <div className="proposal-actions">
           <button onClick={() => approveProposal(proposal.id)} className="approve">
             Approve
           </button>
           <button onClick={() => openRejectDialog(proposal.id)} className="reject">
             Reject
           </button>
           {proposal.similar_task_id && (
             <button onClick={() => openMergeDialog(proposal.id)} className="merge">
               Merge
             </button>
           )}
           <button onClick={() => openEditDialog(proposal.id)} className="edit">
             Edit
           </button>
         </div>

         <SourceMessagesPanel
           messageIds={proposal.source_message_ids}
           collapsed={!expanded}
         />
       </div>
     );
   };
   ```

3. **RejectProposalDialog.tsx**:
   ```typescript
   export const RejectProposalDialog: React.FC<{
     proposalId: string;
     isOpen: boolean;
     onClose: () => void;
   }> = ({ proposalId, isOpen, onClose }) => {
     const [reason, setReason] = useState('');

     const handleReject = async () => {
       await proposalService.rejectProposal(proposalId, { reason });
       toast.success('Proposal rejected');
       onClose();
     };

     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <h2>Reject Proposal</h2>
         <textarea
           value={reason}
           onChange={(e) => setReason(e.target.value)}
           placeholder="Why are you rejecting this proposal?"
           rows={4}
         />
         <button onClick={handleReject} disabled={!reason}>
           Reject
         </button>
       </Modal>
     );
   };
   ```

4. **SourceMessagesPanel.tsx**:
   ```typescript
   export const SourceMessagesPanel: React.FC<{
     messageIds: number[];
     collapsed: boolean;
   }> = ({ messageIds, collapsed }) => {
     const { data: messages } = useQuery({
       queryKey: ['messages', messageIds],
       queryFn: () => messageService.getMessagesByIds(messageIds),
       enabled: !collapsed,
     });

     if (collapsed) return null;

     return (
       <div className="source-messages">
         <h4>Source Messages ({messageIds.length})</h4>
         {messages.map(msg => (
           <MessageCard key={msg.id} message={msg} compact />
         ))}
       </div>
     );
   };
   ```

**API Service**:
```typescript
// frontend/src/features/proposals/api/proposalService.ts
export const proposalService = {
  listProposals: async (filters?: {
    run_id?: string;
    status?: string;
    confidence_min?: number;
    confidence_max?: number;
  }): Promise<TaskProposal[]> => {
    const response = await fetch('/api/proposals?' + new URLSearchParams(filters));
    return response.json();
  },

  getProposal: async (proposalId: string): Promise<TaskProposalDetail> => {
    const response = await fetch(`/api/proposals/${proposalId}`);
    return response.json();
  },

  approveProposal: async (proposalId: string): Promise<TaskProposal> => {
    const response = await fetch(`/api/proposals/${proposalId}/approve`, {
      method: 'PUT',
    });
    return response.json();
  },

  rejectProposal: async (proposalId: string, data: { reason: string }): Promise<TaskProposal> => {
    const response = await fetch(`/api/proposals/${proposalId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  mergeProposal: async (proposalId: string, data: { target_task_id: string }): Promise<TaskProposal> => {
    const response = await fetch(`/api/proposals/${proposalId}/merge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  editProposal: async (proposalId: string, data: Partial<TaskProposal>): Promise<TaskProposal> => {
    const response = await fetch(`/api/proposals/${proposalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```

**Checkpoints**:
- [ ] ProposalsPage component created
- [ ] API service created: `proposalService.ts`
- [ ] Components created: ProposalList, ProposalCard, RejectDialog, SourceMessagesPanel
- [ ] Filters work: by run_id, status, confidence
- [ ] Proposal card displays all fields correctly
- [ ] Confidence badge with visual indicator (< 0.7 = red, 0.7-0.9 = yellow, > 0.9 = green)
- [ ] Similar task warning shown if duplicate detected
- [ ] LLM reasoning expandable
- [ ] Actions work: approve, reject, merge, edit
- [ ] Source messages panel loads and displays messages
- [ ] WebSocket updates for proposal status changes
- [ ] Batch actions (select multiple) work
- [ ] Toast notifications on success/error
- [ ] Loading states displayed
- [ ] Responsive design

---

#### **4.3 ProjectsPage - New Implementation**

**Location**: `frontend/src/pages/ProjectsPage/`

**Current State**: ⏳ Placeholder page

**Components to Create**:

1. **ProjectList.tsx**:
   ```typescript
   export const ProjectList: React.FC = () => {
     const { data: projects, isLoading } = useQuery({
       queryKey: ['projects'],
       queryFn: () => projectService.listProjects(),
     });

     return (
       <div className="project-list">
         <button onClick={() => openCreateDialog()}>Create Project</button>
         {projects.map(project => (
           <ProjectCard key={project.id} project={project} />
         ))}
       </div>
     );
   };
   ```

2. **ProjectCard.tsx**:
   ```typescript
   export const ProjectCard: React.FC<{ project: ProjectConfig }> = ({ project }) => {
     return (
       <div className="project-card">
         <div className="project-header">
           <h3>{project.name}</h3>
           <span className="version">v{project.version}</span>
         </div>

         <p>{project.description}</p>

         <div className="project-keywords">
           <h4>Keywords:</h4>
           <div className="keyword-list">
             {project.keywords.map(keyword => (
               <span key={keyword} className="keyword-tag">{keyword}</span>
             ))}
           </div>
         </div>

         <div className="project-components">
           <h4>Components:</h4>
           <ul>
             {project.components.map(comp => (
               <li key={comp.name}>
                 {comp.name}: {comp.keywords.join(', ')}
               </li>
             ))}
           </ul>
         </div>

         <div className="project-team">
           <span>PM: {project.pm_user_id}</span>
           <span>Assignees: {project.default_assignee_ids.length}</span>
         </div>

         <div className="project-actions">
           <button onClick={() => openEditDialog(project)}>Edit</button>
           <button onClick={() => deleteProject(project.id)}>Delete</button>
         </div>
       </div>
     );
   };
   ```

3. **ProjectForm.tsx**:
   ```typescript
   export const ProjectForm: React.FC<{
     project?: ProjectConfig;
     isOpen: boolean;
     onClose: () => void;
   }> = ({ project, isOpen, onClose }) => {
     const [formData, setFormData] = useState(project || {
       name: '',
       description: '',
       keywords: [],
       components: [],
       pm_user_id: null,
       default_assignee_ids: [],
     });

     const handleSubmit = async () => {
       if (project) {
         await projectService.updateProject(project.id, formData);
       } else {
         await projectService.createProject(formData);
       }
       toast.success('Project saved');
       onClose();
     };

     return (
       <Modal isOpen={isOpen} onClose={onClose}>
         <h2>{project ? 'Edit' : 'Create'} Project</h2>
         <form onSubmit={handleSubmit}>
           <input
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             placeholder="Project Name"
             required
           />

           <textarea
             value={formData.description}
             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
             placeholder="Description"
           />

           <KeywordsEditor
             keywords={formData.keywords}
             onChange={(keywords) => setFormData({ ...formData, keywords })}
           />

           <ComponentsEditor
             components={formData.components}
             onChange={(components) => setFormData({ ...formData, components })}
           />

           <UserSelector
             label="Project Manager"
             value={formData.pm_user_id}
             onChange={(id) => setFormData({ ...formData, pm_user_id: id })}
           />

           <button type="submit">Save</button>
         </form>
       </Modal>
     );
   };
   ```

4. **KeywordsEditor.tsx**:
   ```typescript
   export const KeywordsEditor: React.FC<{
     keywords: string[];
     onChange: (keywords: string[]) => void;
   }> = ({ keywords, onChange }) => {
     const [input, setInput] = useState('');

     const addKeyword = () => {
       if (input && !keywords.includes(input)) {
         onChange([...keywords, input]);
         setInput('');
       }
     };

     const removeKeyword = (keyword: string) => {
       onChange(keywords.filter(k => k !== keyword));
     };

     return (
       <div className="keywords-editor">
         <label>Keywords (required):</label>
         <div className="keyword-input">
           <input
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
             placeholder="Add keyword"
           />
           <button onClick={addKeyword}>Add</button>
         </div>
         <div className="keyword-tags">
           {keywords.map(keyword => (
             <span key={keyword} className="keyword-tag">
               {keyword}
               <button onClick={() => removeKeyword(keyword)}>×</button>
             </span>
           ))}
         </div>
         {keywords.length === 0 && (
           <span className="validation-error">At least one keyword required</span>
         )}
       </div>
     );
   };
   ```

**API Service**:
```typescript
// frontend/src/features/projects/api/projectService.ts
export const projectService = {
  listProjects: async (): Promise<ProjectConfig[]> => {
    const response = await fetch('/api/projects');
    return response.json();
  },

  getProject: async (projectId: string): Promise<ProjectConfig> => {
    const response = await fetch(`/api/projects/${projectId}`);
    return response.json();
  },

  createProject: async (data: CreateProjectConfig): Promise<ProjectConfig> => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateProject: async (projectId: string, data: Partial<ProjectConfig>): Promise<ProjectConfig> => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
  },
};
```

**Checkpoints**:
- [ ] ProjectsPage component created
- [ ] API service created: `projectService.ts`
- [ ] Components created: ProjectList, ProjectCard, ProjectForm, KeywordsEditor, ComponentsEditor
- [ ] Project card displays all fields
- [ ] Keywords editor works (add/remove)
- [ ] Components editor works
- [ ] User selector for PM
- [ ] Form validation: keywords non-empty
- [ ] Create/edit/delete actions work
- [ ] Version field increments on update
- [ ] WebSocket updates for changes
- [ ] Toast notifications
- [ ] Loading states
- [ ] Responsive design

---

### **Validation Checklist (Task 4 Complete)**

- [ ] All 3 pages implemented and accessible via navigation
- [ ] AnalysisRunsPage shows real data from API
- [ ] ProposalsPage displays proposals with all fields
- [ ] ProjectsPage CRUD operations work
- [ ] WebSocket real-time updates work for all pages
- [ ] All API calls use proper error handling
- [ ] Loading states displayed during data fetching
- [ ] Toast notifications for success/error
- [ ] Responsive design works on all screen sizes
- [ ] Navigation between pages works
- [ ] URL parameters work (e.g., /proposals?run_id=xxx)
- [ ] No console errors
- [ ] TypeScript compilation successful: `npm run build`

---

## ✅ **TASK 5: Tests**

**Agent**: `pytest-test-master`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 4-6 hours
**Dependencies**: Tasks 1-4
**Blocks**: Tasks 6, 7

### **Scope**

Create comprehensive test suite for Phase 1:
1. Model tests
2. API endpoint tests
3. Background job tests
4. Integration tests

### **Implementation Details**

#### **5.1 Model Tests**

**File**: `backend/tests/models/test_analysis_run.py`

```python
import pytest
from backend.app.models.analysis_run import AnalysisRun, AnalysisRunStatus
from backend.app.models.enums import ProviderType

@pytest.mark.asyncio
async def test_create_analysis_run(db_session):
    """Test creating analysis run."""
    run = AnalysisRun(
        time_window_start=datetime(2025, 10, 1),
        time_window_end=datetime(2025, 10, 2),
        agent_assignment_id=uuid4(),
        config_snapshot={"test": "data"},
        trigger_type="manual",
        status=AnalysisRunStatus.pending,
    )
    db_session.add(run)
    await db_session.commit()

    assert run.id is not None
    assert run.status == AnalysisRunStatus.pending
    assert run.proposals_total == 0

@pytest.mark.asyncio
async def test_lifecycle_transitions(db_session):
    """Test run lifecycle transitions."""
    run = AnalysisRun(...)
    db_session.add(run)
    await db_session.commit()

    # pending → running
    run.status = AnalysisRunStatus.running
    run.started_at = datetime.utcnow()
    await db_session.commit()

    # running → completed
    run.status = AnalysisRunStatus.completed
    run.completed_at = datetime.utcnow()
    await db_session.commit()

    # completed → closed
    run.status = AnalysisRunStatus.closed
    run.closed_at = datetime.utcnow()
    await db_session.commit()

    assert run.started_at is not None
    assert run.completed_at is not None
    assert run.closed_at is not None

@pytest.mark.asyncio
async def test_config_snapshot_jsonb(db_session):
    """Test JSONB config_snapshot field."""
    config = {
        "agent": {"name": "test", "model": "llama3"},
        "task": {"schema": {...}},
        "project": {"keywords": ["bug", "error"]}
    }
    run = AnalysisRun(..., config_snapshot=config)
    db_session.add(run)
    await db_session.commit()

    # Reload from DB
    loaded_run = await db_session.get(AnalysisRun, run.id)
    assert loaded_run.config_snapshot == config
```

**Checkpoints**:
- [ ] test_create_analysis_run passes
- [ ] test_lifecycle_transitions passes
- [ ] test_config_snapshot_jsonb passes
- [ ] test_foreign_key_relationships passes
- [ ] test_accuracy_metrics_jsonb passes

**File**: `backend/tests/models/test_task_proposal.py`

```python
@pytest.mark.asyncio
async def test_create_proposal(db_session):
    """Test creating task proposal."""
    proposal = TaskProposal(
        analysis_run_id=uuid4(),
        proposed_title="Bug in auth",
        proposed_description="Users can't login",
        source_message_ids=[1, 2, 3],
        message_count=3,
        llm_recommendation="new_task",
        confidence=0.95,
        reasoning="Clear bug report with steps to reproduce",
        status=ProposalStatus.pending,
    )
    db_session.add(proposal)
    await db_session.commit()

    assert proposal.id is not None
    assert len(proposal.source_message_ids) == 3

@pytest.mark.asyncio
async def test_duplicate_detection_fields(db_session):
    """Test duplicate detection fields."""
    proposal = TaskProposal(
        ...,
        similar_task_id=uuid4(),
        similarity_score=0.87,
        similarity_type="semantic",
        diff_summary={"changes": ["priority differs"]}
    )
    db_session.add(proposal)
    await db_session.commit()

    assert proposal.similar_task_id is not None
    assert proposal.similarity_score == 0.87
```

**Checkpoints**:
- [ ] test_create_proposal passes
- [ ] test_source_message_ids_jsonb passes
- [ ] test_duplicate_detection_fields passes
- [ ] test_review_workflow passes

**File**: `backend/tests/models/test_project_config.py`

**Checkpoints**:
- [ ] test_create_project_config passes
- [ ] test_keywords_validation passes
- [ ] test_jsonb_fields passes
- [ ] test_versioning passes

---

#### **5.2 API Endpoint Tests**

**File**: `backend/tests/api/test_analysis_runs.py`

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_runs(client: AsyncClient):
    """Test GET /api/analysis/runs."""
    response = await client.get("/api/analysis/runs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_run(client: AsyncClient, db_session):
    """Test POST /api/analysis/runs."""
    # Create prerequisites
    agent_assignment = await create_agent_assignment(db_session)

    data = {
        "time_window_start": "2025-10-01T00:00:00Z",
        "time_window_end": "2025-10-02T00:00:00Z",
        "agent_assignment_id": str(agent_assignment.id),
        "trigger_type": "manual",
    }

    response = await client.post("/api/analysis/runs", json=data)
    assert response.status_code == 200
    run = response.json()
    assert run["status"] == "pending"
    assert run["proposals_total"] == 0

@pytest.mark.asyncio
async def test_cannot_start_if_unclosed_runs(client: AsyncClient, db_session):
    """Test validation: cannot start run if unclosed runs exist."""
    # Create unclosed run
    existing_run = AnalysisRun(..., status=AnalysisRunStatus.completed)
    db_session.add(existing_run)
    await db_session.commit()

    # Try to create new run
    data = {...}
    response = await client.post("/api/analysis/runs", json=data)
    assert response.status_code == 409
    assert "not closed yet" in response.json()["detail"]

@pytest.mark.asyncio
async def test_close_run(client: AsyncClient, db_session):
    """Test PUT /api/analysis/runs/{id}/close."""
    # Create completed run with no pending proposals
    run = AnalysisRun(..., status=AnalysisRunStatus.completed, proposals_pending=0)
    db_session.add(run)
    await db_session.commit()

    response = await client.put(f"/api/analysis/runs/{run.id}/close")
    assert response.status_code == 200
    closed_run = response.json()
    assert closed_run["status"] == "closed"
    assert "accuracy_metrics" in closed_run

@pytest.mark.asyncio
async def test_cannot_close_with_pending_proposals(client: AsyncClient, db_session):
    """Test validation: cannot close if proposals_pending > 0."""
    run = AnalysisRun(..., proposals_pending=5)
    db_session.add(run)
    await db_session.commit()

    response = await client.put(f"/api/analysis/runs/{run.id}/close")
    assert response.status_code == 400
    assert "proposals still pending" in response.json()["detail"]
```

**Checkpoints**:
- [ ] test_list_runs passes
- [ ] test_create_run passes
- [ ] test_cannot_start_if_unclosed_runs passes (CRITICAL)
- [ ] test_get_run_details passes
- [ ] test_close_run passes
- [ ] test_cannot_close_with_pending_proposals passes (CRITICAL)
- [ ] test_cancel_pending_run passes
- [ ] test_filters_work (status, date range) passes

**File**: `backend/tests/api/test_proposals.py`

```python
@pytest.mark.asyncio
async def test_list_proposals(client: AsyncClient):
    """Test GET /api/proposals."""
    response = await client.get("/api/proposals")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_filter_by_run_id(client: AsyncClient, db_session):
    """Test filtering proposals by run_id."""
    run_id = uuid4()
    proposal1 = TaskProposal(..., analysis_run_id=run_id)
    proposal2 = TaskProposal(..., analysis_run_id=uuid4())
    db_session.add_all([proposal1, proposal2])
    await db_session.commit()

    response = await client.get(f"/api/proposals?run_id={run_id}")
    proposals = response.json()
    assert len(proposals) == 1
    assert proposals[0]["analysis_run_id"] == str(run_id)

@pytest.mark.asyncio
async def test_approve_proposal(client: AsyncClient, db_session):
    """Test PUT /api/proposals/{id}/approve."""
    run = AnalysisRun(..., proposals_pending=1)
    proposal = TaskProposal(..., analysis_run_id=run.id, status=ProposalStatus.pending)
    db_session.add_all([run, proposal])
    await db_session.commit()

    response = await client.put(f"/api/proposals/{proposal.id}/approve")
    assert response.status_code == 200

    # Check proposal updated
    updated_proposal = response.json()
    assert updated_proposal["status"] == "approved"

    # Check run.proposals_pending decremented
    await db_session.refresh(run)
    assert run.proposals_pending == 0

@pytest.mark.asyncio
async def test_reject_proposal(client: AsyncClient, db_session):
    """Test PUT /api/proposals/{id}/reject."""
    run = AnalysisRun(..., proposals_pending=1)
    proposal = TaskProposal(..., analysis_run_id=run.id)
    db_session.add_all([run, proposal])
    await db_session.commit()

    response = await client.put(
        f"/api/proposals/{proposal.id}/reject",
        json={"reason": "Not a real bug"}
    )
    assert response.status_code == 200

    updated_proposal = response.json()
    assert updated_proposal["status"] == "rejected"
    assert "Not a real bug" in updated_proposal["review_notes"]

    await db_session.refresh(run)
    assert run.proposals_pending == 0
```

**Checkpoints**:
- [ ] test_list_proposals passes
- [ ] test_filter_by_run_id passes
- [ ] test_filter_by_confidence passes
- [ ] test_get_proposal_with_messages passes
- [ ] test_approve_proposal passes (CRITICAL)
- [ ] test_reject_proposal passes
- [ ] test_merge_proposal passes
- [ ] test_edit_proposal passes
- [ ] test_proposals_pending_decrements (CRITICAL)

**File**: `backend/tests/api/test_projects.py`

**Checkpoints**:
- [ ] test_list_projects passes
- [ ] test_create_project passes
- [ ] test_keywords_validation passes
- [ ] test_update_project passes
- [ ] test_version_increments passes
- [ ] test_delete_project passes

---

#### **5.3 Background Job Tests**

**File**: `backend/tests/tasks/test_analysis_tasks.py`

```python
import pytest
from backend.app.tasks.analysis_tasks import execute_analysis_run

@pytest.mark.asyncio
async def test_job_registration():
    """Test job is registered in broker."""
    assert execute_analysis_run.task_name in broker.tasks

@pytest.mark.asyncio
async def test_execute_analysis_run(db_session, mock_llm):
    """Test full analysis run execution."""
    # Create run
    run = AnalysisRun(..., status=AnalysisRunStatus.pending)
    db_session.add(run)
    await db_session.commit()

    # Create messages in time window
    messages = [
        Message(..., sent_at=run.time_window_start + timedelta(minutes=i))
        for i in range(10)
    ]
    db_session.add_all(messages)
    await db_session.commit()

    # Execute job
    await execute_analysis_run(str(run.id), db_session)

    # Check run updated
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.completed
    assert run.proposals_total > 0

    # Check proposals created
    proposals = await db_session.execute(
        select(TaskProposal).where(TaskProposal.analysis_run_id == run.id)
    )
    assert len(proposals.scalars().all()) > 0

@pytest.mark.asyncio
async def test_progress_updates(db_session):
    """Test progress tracking during execution."""
    run = AnalysisRun(...)
    db_session.add(run)
    await db_session.commit()

    executor = AnalysisExecutor(db_session)

    # Start run
    await executor.start_run(str(run.id))
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.running
    assert run.started_at is not None

    # Update progress
    await executor.update_progress(str(run.id), 2, 5)
    await db_session.refresh(run)
    assert run.current_batch == 2
    assert run.total_batches == 5

    # Complete run
    await executor.complete_run(str(run.id))
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.completed
    assert run.completed_at is not None

@pytest.mark.asyncio
async def test_error_handling(db_session, mock_llm_error):
    """Test job fails gracefully on error."""
    run = AnalysisRun(...)
    db_session.add(run)
    await db_session.commit()

    # Mock LLM to raise error
    mock_llm_error.side_effect = Exception("LLM API error")

    # Execute job (should fail)
    with pytest.raises(Exception):
        await execute_analysis_run(str(run.id), db_session)

    # Check run marked as failed
    await db_session.refresh(run)
    assert run.status == AnalysisRunStatus.failed
    assert "LLM API error" in run.error_log["error"]
```

**Checkpoints**:
- [ ] test_job_registration passes
- [ ] test_execute_analysis_run passes
- [ ] test_progress_updates passes
- [ ] test_error_handling passes
- [ ] test_prefilter_messages passes
- [ ] test_create_batches passes
- [ ] test_llm_integration passes

---

#### **5.4 Integration Tests**

**File**: `backend/tests/integration/test_full_workflow.py`

```python
@pytest.mark.asyncio
async def test_full_analysis_workflow(client: AsyncClient, db_session):
    """Test complete workflow: create run → execute → review → close."""

    # 1. Create analysis run
    data = {...}
    response = await client.post("/api/analysis/runs", json=data)
    assert response.status_code == 200
    run = response.json()
    run_id = run["id"]

    # 2. Start run (trigger job)
    response = await client.post(f"/api/analysis/runs/{run_id}/start")
    assert response.status_code == 200

    # Wait for job to complete (in test, execute synchronously)
    await execute_analysis_run(run_id, db_session)

    # 3. Check run completed
    response = await client.get(f"/api/analysis/runs/{run_id}")
    run = response.json()
    assert run["status"] == "completed"
    assert run["proposals_total"] > 0

    # 4. Get proposals
    response = await client.get(f"/api/proposals?run_id={run_id}")
    proposals = response.json()
    assert len(proposals) > 0

    # 5. Approve all proposals
    for proposal in proposals:
        await client.put(f"/api/proposals/{proposal['id']}/approve")

    # 6. Close run
    response = await client.put(f"/api/analysis/runs/{run_id}/close")
    assert response.status_code == 200
    closed_run = response.json()
    assert closed_run["status"] == "closed"
    assert "accuracy_metrics" in closed_run

    # 7. Verify can start new run now
    response = await client.post("/api/analysis/runs", json=data)
    assert response.status_code == 200
```

**Checkpoints**:
- [ ] test_full_analysis_workflow passes
- [ ] test_lifecycle_enforcement passes
- [ ] test_websocket_events passes

---

### **Test Coverage Requirements**

```bash
# Run tests with coverage
pytest backend/tests/ --cov=backend/app --cov-report=html --cov-report=term

# Coverage targets
- Overall coverage: > 80%
- Critical paths: 100%
  - AnalysisRun lifecycle
  - Proposal approval/rejection
  - Cannot start run validation
  - Cannot close run validation
```

**Checkpoints**:
- [ ] Overall test coverage > 80%
- [ ] All critical paths have 100% coverage
- [ ] All tests pass: `pytest backend/tests/`
- [ ] No test warnings or deprecations
- [ ] Test execution time < 30 seconds
- [ ] Coverage report generated: `backend/htmlcov/index.html`

---

### **Validation Checklist (Task 5 Complete)**

- [ ] All model tests pass (3 files, 15+ tests)
- [ ] All API tests pass (3 files, 25+ tests)
- [ ] All background job tests pass (1 file, 7+ tests)
- [ ] Integration tests pass (1 file, 3+ tests)
- [ ] Overall coverage > 80%
- [ ] Critical paths 100% covered
- [ ] No test failures
- [ ] Test suite runs in < 30 seconds
- [ ] Coverage report generated and reviewed

---

## 📚 **TASK 6: Documentation**

**Agent**: `documentation-expert`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 2-3 hours
**Dependencies**: Tasks 1-5
**Blocks**: Task 7

### **Scope**

Update documentation to reflect Phase 1 implementation:
1. ANALYSIS_SYSTEM_ARCHITECTURE.md
2. backend/CLAUDE.md
3. frontend/CLAUDE.md
4. README.md (if needed)

### **Files to Update**

#### **6.1 ANALYSIS_SYSTEM_ARCHITECTURE.md**

**Changes**:

1. Update Phase 1 status:
   ```markdown
   ### Phase 1: Analysis Foundation ✅ IMPLEMENTED
   ```

2. Update model statuses:
   ```markdown
   DATABASE MODELS (11/12 - 92% Complete):
   ├─ AnalysisRun                  ✅ Full implementation with lifecycle
   ├─ TaskProposal                 ✅ Full implementation with duplicate detection
   ├─ ProjectConfig                ✅ Full implementation with versioning
   ├─ Message (extended)           ✅ analysis_status, included_in_runs fields added
   ```

3. Update API endpoints:
   ```markdown
   BACKEND API ENDPOINTS (13/12 - 108% Complete):
   ├─ /api/analysis/runs           ✅ CRUD + lifecycle management
   ├─ /api/proposals               ✅ CRUD + review actions
   ├─ /api/projects                ✅ CRUD + versioning
   ```

4. Update frontend pages:
   ```markdown
   FRONTEND PAGES (10/12 - 83% Complete):
   ├─ AnalysisRunsPage             ✅ Real data, WebSocket updates
   ├─ ProposalsPage                ✅ Review interface, batch actions
   ├─ ProjectsPage                 ✅ CRUD interface
   ```

5. Update progress metrics:
   ```markdown
   | Component | Status | Progress | Notes |
   |-----------|--------|---------|-------|
   | **Analysis Models** | ✅ Complete | 100% | AnalysisRun, TaskProposal, ProjectConfig |
   | **Analysis API** | ✅ Complete | 100% | Full CRUD + lifecycle management |
   | **Analysis UI** | ✅ Complete | 100% | Real-time updates, review workflow |
   ```

6. Add implementation details section:
   ```markdown
   ### Phase 1 Implementation Details (2025-10-10)

   **Implemented**:
   - AnalysisRun model with lifecycle (pending→running→completed→reviewed→closed)
   - TaskProposal model with duplicate detection
   - ProjectConfig model with keyword-based classification
   - Full REST API with validation
   - Background job execution with TaskIQ
   - Real-time UI updates via WebSocket
   - Comprehensive test suite (80%+ coverage)

   **Key Features**:
   - Cannot start run if unclosed runs exist (enforced)
   - Cannot close run if proposals pending (enforced)
   - Config snapshot for reproducibility
   - Accuracy metrics calculated on close
   - Source message IDs for duplicate detection
   ```

7. Update roadmap:
   ```markdown
   ### Phase 2: Task Entity System (NEXT)
   - TaskEntity model (self-referencing tree)
   - TaskVersion model (immutable snapshots)
   - Tree validation logic
   - Incident counter tracking
   ```

**Checkpoints**:
- [ ] All statuses updated (⏳ → ✅)
- [ ] Progress metrics accurate
- [ ] Implementation details added
- [ ] Roadmap updated for Phase 2
- [ ] Change log entry added with date
- [ ] No broken references
- [ ] Markdown formatting correct

---

#### **6.2 backend/CLAUDE.md**

**Changes**:

1. Add Phase 1 API endpoints:
   ```markdown
   ### Analysis Management API (Phase 1)
   GET    /api/analysis/runs       # List analysis runs
   POST   /api/analysis/runs       # Create run (validates no unclosed runs)
   GET    /api/analysis/runs/{id}  # Get run details
   PUT    /api/analysis/runs/{id}/close # Close run (calculates metrics)
   DELETE /api/analysis/runs/{id}  # Cancel pending run
   POST   /api/analysis/runs/{id}/start # Trigger background job

   GET    /api/proposals            # List proposals (filter by run_id, status, confidence)
   GET    /api/proposals/{id}       # Get proposal with source messages
   PUT    /api/proposals/{id}/approve # Approve proposal
   PUT    /api/proposals/{id}/reject  # Reject with reason
   PUT    /api/proposals/{id}/merge   # Merge with existing task
   PUT    /api/proposals/{id}        # Edit proposal

   GET    /api/projects             # List project configs
   POST   /api/projects             # Create project
   GET    /api/projects/{id}        # Get project
   PUT    /api/projects/{id}        # Update project
   DELETE /api/projects/{id}        # Deactivate project
   ```

2. Add background jobs section:
   ```markdown
   ### Background Jobs (TaskIQ)

   **Analysis Run Executor**:
   - File: `backend/app/tasks/analysis_tasks.py`
   - Job: `execute_analysis_run(run_id)`
   - Lifecycle: pending → running → completed/failed
   - Progress tracking with WebSocket updates

   **Services**:
   - `AnalysisExecutor`: Main execution logic
   - `LLMProposalService`: LLM integration for proposal generation
   ```

3. Add models documentation:
   ```markdown
   ### Phase 1 Models

   **AnalysisRun**: Coordinates AI analysis runs
   - Time window selection
   - Config snapshot for reproducibility
   - Lifecycle management (7 states)
   - Proposals tracking
   - Metrics calculation on close

   **TaskProposal**: AI-generated task proposals
   - Source message IDs (duplicate detection)
   - LLM metadata (recommendation, confidence, reasoning)
   - Similarity detection
   - Review workflow (approve/reject/merge)

   **ProjectConfig**: Classification project configurations
   - Keywords for project detection
   - Domain glossary
   - Components list
   - Versioning
   ```

**Checkpoints**:
- [ ] All new endpoints documented
- [ ] Background jobs section added
- [ ] Models documented with key features
- [ ] Code examples included where helpful
- [ ] Markdown formatting correct

---

#### **6.3 frontend/CLAUDE.md**

**Changes**:

1. Update page statuses:
   ```markdown
   AI ANALYSIS
   ├─ Analysis Runs (/analysis)     ✅ Real data, lifecycle management
   └─ Task Proposals (/proposals)   ✅ Review interface, batch actions

   AI CONFIGURATION
   ├─ Projects (/projects)          ✅ CRUD interface, keyword editor
   ```

2. Add page documentation:
   ```markdown
   ### Analysis Management Pages (Phase 1)

   **AnalysisRunsPage** (`/analysis`):
   - Real-time run list with WebSocket updates
   - Create new run with time window selection
   - Progress tracking during execution
   - Lifecycle enforcement (cannot start if unclosed runs)
   - Proposals summary (total/approved/rejected/pending)
   - Close run action (validates all proposals reviewed)

   **ProposalsPage** (`/proposals`):
   - Proposal review interface
   - Filters: run_id, status, confidence
   - Proposal actions: approve, reject, merge, edit
   - Source messages panel (expandable)
   - LLM reasoning display
   - Duplicate detection warnings
   - Batch actions (select multiple)

   **ProjectsPage** (`/projects`):
   - Project configuration CRUD
   - Keywords editor (add/remove)
   - Components editor
   - Team management (PM, assignees)
   - Versioning display
   ```

3. Add WebSocket events:
   ```markdown
   ### WebSocket Events (Phase 1)

   **Topics**: `analysis`, `proposals`, `projects`

   **Events**:
   - `analysis.run_created`: New run created
   - `analysis.run_started`: Run started execution
   - `analysis.run_progress`: Batch progress update
   - `analysis.run_completed`: Run completed
   - `analysis.run_closed`: Run closed with metrics
   - `proposals.created`: New proposal created
   - `proposals.approved`: Proposal approved
   - `proposals.rejected`: Proposal rejected
   ```

**Checkpoints**:
- [ ] Page statuses updated
- [ ] All 3 pages documented
- [ ] WebSocket events documented
- [ ] Component structure included
- [ ] Markdown formatting correct

---

#### **6.4 README.md (Optional)**

**Changes** (if needed):

1. Add Phase 1 to features:
   ```markdown
   ## Features

   - ✅ AI-powered message analysis
   - ✅ Automated task proposal generation
   - ✅ Project-based classification
   - ✅ PM review workflow
   - ✅ Real-time WebSocket updates
   ```

**Checkpoints**:
- [ ] Features section updated (if applicable)
- [ ] Architecture overview mentions Phase 1 (if applicable)

---

### **Validation Checklist (Task 6 Complete)**

- [ ] ANALYSIS_SYSTEM_ARCHITECTURE.md updated and accurate
- [ ] backend/CLAUDE.md updated with new endpoints/models
- [ ] frontend/CLAUDE.md updated with new pages
- [ ] README.md updated (if needed)
- [ ] All model statuses reflect reality
- [ ] All progress metrics accurate
- [ ] Change log entry added with date: 2025-10-10
- [ ] No broken links or references
- [ ] Markdown formatting correct (no linting errors)
- [ ] Documentation reviewed for clarity and completeness

---

## 🔍 **TASK 7: Architecture Review**

**Agent**: `architecture-guardian`
**Autonomy**: ✅ Fully Autonomous
**Duration**: 2-3 hours
**Dependencies**: Tasks 1-6
**Final Validation**

### **Scope**

Comprehensive architectural review of Phase 1 implementation:
1. Database schema compliance
2. API patterns consistency
3. Code structure and organization
4. Security review
5. Performance review
6. Testing adequacy

### **Review Areas**

#### **7.1 Database Schema Compliance**

**Checks**:
- [ ] All foreign keys defined correctly
- [ ] Indexes created for performance (status fields, foreign keys)
- [ ] JSONB fields used appropriately (config_snapshot, source_message_ids, etc.)
- [ ] No circular reference possibilities
- [ ] Unique constraints where needed (e.g., project name)
- [ ] Enums match backend/app/models/enums.py
- [ ] Migration is reversible (downgrade works)
- [ ] All relationships work (can query joined data)

**SQL Validation Queries**:
```sql
-- Check foreign keys exist
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name IN ('analysis_runs', 'task_proposals', 'project_configs');

-- Check indexes exist
SELECT * FROM pg_indexes
WHERE tablename IN ('analysis_runs', 'task_proposals', 'project_configs');

-- Check JSONB fields
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analysis_runs' AND data_type = 'jsonb';
```

**Recommendations**:
- Document any missing indexes
- Suggest composite indexes if needed
- Flag any performance concerns

---

#### **7.2 API Patterns Consistency**

**Checks**:
- [ ] Follows existing patterns from /api/agents, /api/providers
- [ ] Pydantic schemas consistent (Create, Update, Public)
- [ ] Error handling consistent (404, 400, 409 with helpful messages)
- [ ] WebSocket events follow conventions
- [ ] Pagination implemented (skip, limit)
- [ ] Filters implemented properly
- [ ] Async/await used throughout
- [ ] Database sessions handled correctly (no leaks)
- [ ] Response models match OpenAPI schema

**Code Patterns to Validate**:
```python
# Pattern 1: List endpoint
@router.get("", response_model=list[ModelPublic])
async def list_items(
    skip: int = 0,
    limit: int = 100,
    filter_field: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    ...

# Pattern 2: Create endpoint
@router.post("", response_model=ModelPublic)
async def create_item(
    item_data: ModelCreate,
    db: AsyncSession = Depends(get_db),
    ws_manager: WebSocketManager = Depends(get_ws_manager)
):
    # Validation
    # Create
    # Broadcast WebSocket
    # Return

# Pattern 3: Error handling
if not item:
    raise HTTPException(status_code=404, detail=f"Item {id} not found")
```

**Recommendations**:
- Flag inconsistencies with existing patterns
- Suggest refactoring if needed
- Document any intentional deviations

---

#### **7.3 Code Structure and Organization**

**Checks**:
- [ ] Models in `backend/app/models/`
- [ ] API endpoints in `backend/app/api/v1/`
- [ ] Services in `backend/app/services/`
- [ ] Background jobs in `backend/app/tasks/`
- [ ] Tests in `backend/tests/` with proper structure
- [ ] No business logic in API endpoints (delegated to services)
- [ ] Imports clean (no circular imports)
- [ ] Type hints throughout
- [ ] Docstrings for all public functions/classes

**File Structure Validation**:
```
backend/app/
├── models/
│   ├── analysis_run.py ✅
│   ├── task_proposal.py ✅
│   ├── project_config.py ✅
│   └── enums.py (updated) ✅
├── api/v1/
│   ├── analysis_runs.py ✅
│   ├── proposals.py ✅
│   └── projects.py ✅
├── services/
│   ├── analysis_service.py ✅
│   └── llm_proposal_service.py ✅
├── tasks/
│   └── analysis_tasks.py ✅
└── tests/
    ├── models/
    ├── api/
    ├── tasks/
    └── integration/
```

**Recommendations**:
- Flag misplaced files
- Suggest better organization if needed
- Document naming conventions

---

#### **7.4 Security Review**

**Checks**:
- [ ] No sensitive data in logs (API keys, user data)
- [ ] Validation on all inputs (Pydantic models)
- [ ] SQL injection protected (using SQLAlchemy ORM)
- [ ] No hardcoded secrets
- [ ] Authorization checks (if auth implemented)
- [ ] CORS configured properly
- [ ] WebSocket connections validated
- [ ] File uploads validated (if applicable)

**Code Review Points**:
```python
# ❌ BAD: Logging sensitive data
logger.info(f"Creating run with config: {config_snapshot}")

# ✅ GOOD: Sanitized logging
logger.info(f"Creating run for time window {start} - {end}")

# ❌ BAD: SQL injection risk
query = f"SELECT * FROM analysis_runs WHERE id = {run_id}"

# ✅ GOOD: ORM with parameterized queries
query = select(AnalysisRun).where(AnalysisRun.id == run_id)
```

**Recommendations**:
- Flag security concerns
- Suggest fixes for vulnerabilities
- Document security assumptions

---

#### **7.5 Performance Review**

**Checks**:
- [ ] Proper async/await usage (no blocking calls)
- [ ] Database queries optimized (no N+1 queries)
- [ ] Batch operations where appropriate
- [ ] Indexes on frequently queried fields
- [ ] Pagination implemented for large result sets
- [ ] WebSocket events don't block (fire-and-forget)
- [ ] Background jobs don't lock database
- [ ] JSONB queries efficient

**Performance Patterns**:
```python
# ❌ BAD: N+1 query
for proposal in proposals:
    run = await db.get(AnalysisRun, proposal.analysis_run_id)

# ✅ GOOD: Join query
proposals = await db.execute(
    select(TaskProposal)
    .options(selectinload(TaskProposal.analysis_run))
    .where(...)
)

# ❌ BAD: Loading all messages
messages = await db.execute(select(Message))

# ✅ GOOD: Pagination
messages = await db.execute(
    select(Message).limit(limit).offset(skip)
)
```

**Recommendations**:
- Flag performance bottlenecks
- Suggest optimizations
- Document expected query times

---

#### **7.6 Testing Adequacy**

**Checks**:
- [ ] Critical paths have 100% coverage
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] Integration tests cover full workflow
- [ ] Async tests work correctly
- [ ] Database fixtures clean up properly
- [ ] Mock external services (LLM calls)
- [ ] Test execution time reasonable (< 30s)

**Coverage Analysis**:
```bash
# Critical paths requiring 100% coverage:
- AnalysisRun lifecycle transitions
- Cannot start run if unclosed runs exist
- Cannot close run if proposals pending
- Proposal approval/rejection decrements proposals_pending
- Config snapshot creation
- Accuracy metrics calculation
```

**Recommendations**:
- Flag missing tests for critical paths
- Suggest additional test cases
- Document test coverage gaps

---

### **Review Deliverable**

**Format**: Markdown report

**Template**:
```markdown
# Phase 1 Architecture Review - 2025-10-10

## Executive Summary
- Overall Status: ✅ PASSED / ⚠️ PASSED WITH RECOMMENDATIONS / ❌ FAILED
- Critical Issues: [count]
- Recommendations: [count]
- Architecture Compliance: [percentage]

## 1. Database Schema Compliance
- Status: ✅/⚠️/❌
- Issues: [list]
- Recommendations: [list]

## 2. API Patterns Consistency
- Status: ✅/⚠️/❌
- Issues: [list]
- Recommendations: [list]

## 3. Code Structure and Organization
- Status: ✅/⚠️/❌
- Issues: [list]
- Recommendations: [list]

## 4. Security Review
- Status: ✅/⚠️/❌
- Issues: [list]
- Recommendations: [list]

## 5. Performance Review
- Status: ✅/⚠️/❌
- Issues: [list]
- Recommendations: [list]

## 6. Testing Adequacy
- Status: ✅/⚠️/❌
- Coverage: [percentage]
- Missing Tests: [list]
- Recommendations: [list]

## Technical Debt
[List any technical debt incurred during Phase 1]

## Next Steps
[Recommendations for Phase 2 or immediate improvements]

## Sign-off
- Reviewer: architecture-guardian
- Date: 2025-10-10
- Approved for Production: ✅/❌
```

**Checkpoints**:
- [ ] All 6 review areas completed
- [ ] All issues documented
- [ ] All recommendations provided
- [ ] Overall status determined
- [ ] Review report generated
- [ ] Technical debt documented
- [ ] Sign-off decision made

---

### **Validation Checklist (Task 7 Complete)**

- [ ] Database schema review completed
- [ ] API patterns review completed
- [ ] Code structure review completed
- [ ] Security review completed
- [ ] Performance review completed
- [ ] Testing review completed
- [ ] Review report generated and saved
- [ ] All critical issues addressed or documented as technical debt
- [ ] Sign-off decision made (approved for production or needs fixes)

---

## 🎯 **Phase 1 Success Criteria**

**All criteria MUST be met before Phase 1 is considered complete:**

### **Functional Requirements**
- [ ] PM can create analysis runs with time window selection
- [ ] System validates no unclosed runs exist before allowing new run
- [ ] Background job executes analysis run successfully
- [ ] AI generates task proposals from message batches
- [ ] PM can review proposals (approve/reject/merge/edit)
- [ ] Proposal actions update run.proposals_pending correctly
- [ ] System validates all proposals reviewed before allowing close
- [ ] Closing run calculates accuracy metrics
- [ ] PM can view run history and metrics
- [ ] Real-time updates work via WebSocket

### **Technical Requirements**
- [ ] All 3 database models created and migrated
- [ ] All 14 API endpoints implemented and tested
- [ ] Background job registered and executable
- [ ] All 3 frontend pages functional with real data
- [ ] Test coverage > 80% overall, 100% for critical paths
- [ ] Documentation updated and accurate
- [ ] Architecture review passed
- [ ] No critical security issues
- [ ] No critical performance issues

### **User Experience Requirements**
- [ ] UI responsive and intuitive
- [ ] Error messages helpful and actionable
- [ ] Loading states displayed appropriately
- [ ] WebSocket updates appear in real-time
- [ ] Forms validate inputs properly
- [ ] Success/error notifications shown

---

## 📊 **Execution Strategy**

### **Sequential Execution (Dependencies)**

```
Task 1: Database Models (MUST BE FIRST)
    ↓
Task 2: API Endpoints (NEEDS Task 1)
    ↓
Task 3: Background Jobs ──┐
Task 4: Frontend Pages ───┴── (PARALLEL, both need Task 2)
    ↓
Task 5: Tests (NEEDS Tasks 1-4)
    ↓
Task 6: Documentation (NEEDS Tasks 1-5)
    ↓
Task 7: Architecture Review (NEEDS Tasks 1-6)
```

### **Sub-Agent Assignments**

| Task | Agent | Autonomy | Duration |
|------|-------|----------|----------|
| 1. Database Models | `fastapi-backend-expert` | ✅ Fully Autonomous | 4-6 hours |
| 2. API Endpoints | `fastapi-backend-expert` | ✅ Fully Autonomous | 6-8 hours |
| 3. Background Jobs | `fastapi-backend-expert` | ✅ Fully Autonomous | 4-6 hours |
| 4. Frontend Pages | `react-frontend-architect` | ✅ Fully Autonomous | 8-10 hours |
| 5. Tests | `pytest-test-master` | ✅ Fully Autonomous | 4-6 hours |
| 6. Documentation | `documentation-expert` | ✅ Fully Autonomous | 2-3 hours |
| 7. Architecture Review | `architecture-guardian` | ✅ Fully Autonomous | 2-3 hours |

### **Parallel Execution Opportunities**

- **After Task 2 completes**: Launch Task 3 and Task 4 in parallel
- **During Task 5**: Tests can be written incrementally as each task completes
- **During Task 6**: Documentation can start early for completed tasks

### **Risk Mitigation**

**High-Risk Areas**:
1. **Task 1 (Database Models)** - Foundation for everything
   - Mitigation: Extra validation, test migrations thoroughly
2. **Task 2 (Validation Logic)** - Critical business rules
   - Mitigation: Comprehensive tests for "cannot start if unclosed" and "cannot close if pending"
3. **Task 3 (Background Jobs)** - Can fail silently
   - Mitigation: Robust error handling, detailed logging, WebSocket events
4. **Task 4 (WebSocket Integration)** - Real-time updates can be flaky
   - Mitigation: Thorough testing, fallback to polling if needed

---

## 📝 **Deliverables**

### **Code Deliverables**
1. 3 new database models + migration
2. 14 API endpoints across 3 routers
3. Background job + executor service
4. 3 frontend pages with components
5. 50+ tests with > 80% coverage
6. Updated documentation (4 files)
7. Architecture review report

### **Documentation Deliverables**
1. ANALYSIS_SYSTEM_ARCHITECTURE.md (updated)
2. backend/CLAUDE.md (updated)
3. frontend/CLAUDE.md (updated)
4. README.md (updated if needed)
5. Architecture review report (new)

### **Validation Deliverables**
1. All tests passing
2. Coverage report (> 80%)
3. Architecture review sign-off
4. Manual testing results

---

## 🚀 **Ready to Execute**

This plan is **READY FOR AUTONOMOUS EXECUTION**.

Each task has:
- ✅ Clear scope and requirements
- ✅ Detailed implementation steps
- ✅ Comprehensive checkpoints
- ✅ Assigned sub-agent
- ✅ Defined dependencies
- ✅ Success criteria

**Next Steps**:
1. Review and approve this plan
2. Execute Task 1 (Database Models) via `fastapi-backend-expert`
3. Upon Task 1 completion, execute Task 2 (API Endpoints)
4. Continue sequential execution per dependency chain
5. Launch Tasks 3 & 4 in parallel after Task 2
6. Complete validation tasks (5, 6, 7) sequentially
7. Verify all success criteria met
8. Phase 1 COMPLETE! 🎉

---

**Plan Created**: 2025-10-10
**Plan Status**: ✅ Ready for Execution
**Estimated Completion**: 1-2 weeks (30-42 hours)