# 🏗️ **АРХІТЕКТУРА СИСТЕМИ АНАЛІЗУ ПОВІДОМЛЕНЬ**

> **Статус**: В розробці | **Остання актуалізація**: 2025-10-09

---

## 📋 **ПОТОЧНИЙ СТАН ПРОЄКТУ**

### ✅ **Реалізовано (Foundation)**

```
DATABASE MODELS:
├─ User, TelegramProfile         ✅ Користувачі та профілі
├─ Source                         ✅ Джерела повідомлень (legacy)
├─ Message                        ✅ Базова модель з AI classification
├─ Task (legacy)                  ✅ Legacy таски (буде замінено на TaskEntity)
├─ MessageIngestionJob            ✅ Прототип AnalysisRun (foundation)
├─ LLMProvider                    ✅ Провайдери LLM (Ollama, OpenAI)
├─ AgentConfig                    ✅ Конфігурація AI агентів
├─ TaskConfig                     ✅ Конфігурація задач з Pydantic схемами
└─ AgentTaskAssignment            ✅ Прив'язка агентів до задач

FRONTEND STRUCTURE:
├─ WORKSPACE
│  ├─ DashboardPage              ✅ Головна панель
│  ├─ MessagesPage               ✅ Список повідомлень
│  ├─ TopicsPage                 ✅ Research topics
│  └─ TasksPage                  ⏳ TaskEntity results (placeholder)
│
├─ AI ANALYSIS
│  ├─ AnalysisRunsPage           ⏳ Analysis runs (placeholder)
│  └─ ProposalsPage              ⏳ Task proposals (placeholder)
│
├─ AI CONFIGURATION
│  ├─ AgentsPage                 ✅ AI agents management
│  ├─ AgentTasksPage             ✅ Task configs з schemas
│  ├─ ProvidersPage              ✅ LLM providers
│  └─ ProjectsPage               ⏳ Project classification (placeholder)
│
└─ INSIGHTS
   └─ AnalyticsPage              ⏳ Analytics (placeholder)

BACKEND INFRASTRUCTURE:
├─ FastAPI REST API              ✅ Endpoints для CRUD операцій
├─ TaskIQ + NATS                 ✅ Background job processing
├─ Async SQLAlchemy              ✅ Database integration
├─ Pydantic-AI integration       ✅ Structured AI outputs
└─ Docker services               ✅ PostgreSQL, NATS, Worker
```

### 🔄 **Наступні кроки (Roadmap)**

```
PHASE 1: Analysis Foundation (NEXT)
├─ AnalysisRun model            ⏳ Координація аналізу
├─ TaskProposal model           ⏳ AI-generated proposals
├─ ProjectConfig model          ⏳ Classification projects
└─ Analysis Run API endpoints   ⏳ CRUD for runs

PHASE 2: Task Entity System
├─ TaskEntity model             ⏳ Canonical task з self-reference
├─ TaskVersion model            ⏳ Version history
├─ AccuracyMetrics model        ⏳ Quality metrics
└─ Tree validation logic        ⏳ Circular reference detection

PHASE 3: LLM Analysis Pipeline
├─ Pre-filtering stage          ⏳ Simple rules
├─ Batch grouping               ⏳ Smart batching
├─ Project classification       ⏳ LLM-based classification
├─ Task extraction              ⏳ Task proposals generation
└─ Duplicate detection          ⏳ Semantic similarity

PHASE 4: PM Review Interface
├─ Proposal review UI           ⏳ Review queue
├─ Run lifecycle management     ⏳ Close/reopen runs
├─ Metrics visualization        ⏳ Accuracy tracking
└─ Batch approval actions       ⏳ Bulk operations
```

---

## 📐 **1. HIGH-LEVEL ARCHITECTURE (Target State)**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TELEGRAM / OTHER SOURCES                          │
│              (messages stream incoming via webhook)                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   MESSAGE INGESTION LAYER ✅                         │
│                                                                      │
│  MessageIngestionJob (реалізовано)                                  │
│  ├─ source_type, source_identifiers                                 │
│  ├─ time_window (start/end)                                         │
│  ├─ status: pending → running → completed → failed                  │
│  └─ metrics: fetched, stored, skipped, errors                       │
│                                                                      │
│  ↓ Result: Messages stored in DB                                    │
│                                                                      │
│  Message (реалізовано)                                              │
│  ├─ content, author_id, source_id, sent_at                          │
│  ├─ classification, confidence (базова AI класифікація)             │
│  └─ analyzed: bool                                                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   TRIGGER MECHANISM     │
                    │  ⏳ Planned:             │
                    │  - Manual (PM button)   │
                    │  - Scheduled (nightly)  │
                    │  - Custom time window   │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ANALYSIS RUN ENGINE ⏳                            │
│                                                                      │
│  Input: Time Window + Agent/Task Assignment                         │
│  Output: Task Proposals                                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 1: PRE-FILTERING ⏳                                │      │
│  │  - Keyword detection                                      │      │
│  │  - @mention detection                                     │      │
│  │  - Length filter (< 10 chars = noise)                    │      │
│  │  Output: ~70% filtered out                                │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 2: BATCH GROUPING ⏳                               │      │
│  │  - Group by time proximity (5-10 min windows)            │      │
│  │  - Max batch size: 50 messages                            │      │
│  │  - Keep context: surrounding messages                     │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 3: LLM ANALYSIS ⏳                                 │      │
│  │                                                            │      │
│  │  Uses: AgentConfig + TaskConfig + LLMProvider ✅          │      │
│  │                                                            │      │
│  │  Sub-stage 3.1: PROJECT CLASSIFICATION                    │      │
│  │    Input: Batch + ProjectConfig                           │      │
│  │    Output: project_id or "unknown"                        │      │
│  │                                                            │      │
│  │  Sub-stage 3.2: TASK EXTRACTION                           │      │
│  │    Input: Batch + Project Context                         │      │
│  │    Output: Task proposals with details                    │      │
│  │                                                            │      │
│  │  Sub-stage 3.3: ACTION ITEMS DETECTION                    │      │
│  │    Input: Task description                                │      │
│  │    Output: Sub-tasks list                                 │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 4: DUPLICATE DETECTION ⏳                          │      │
│  │  - Search existing TaskEntity                             │      │
│  │  - Semantic similarity (embeddings)                       │      │
│  │  - Message overlap detection                              │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 5: PROPOSAL CREATION ⏳                            │      │
│  │  - Create TaskProposal records                            │      │
│  │  - Calculate confidence scores                            │      │
│  │  - Link to source messages                                │      │
│  └────────────────┬─────────────────────────────────────────┘      │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  PROPOSAL REVIEW QUEUE ⏳                            │
│                                                                      │
│  PM Actions:                                                         │
│  - Approve as new TaskEntity                                        │
│  - Merge with existing task (increment incident counter)            │
│  - Update existing task (create new TaskVersion)                    │
│  - Split into multiple tasks                                        │
│  - Edit manually before approval                                    │
│  - Reject                                                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TASK ENTITY LAYER ⏳                            │
│                                                                      │
│  TaskEntity (canonical task - дерево через self-reference)          │
│  ├── parent_task_id (для ієрархії sub-tasks)                        │
│  ├── current_version_id → TaskVersion                               │
│  ├── incident_counter (for recurring issues)                        │
│  ├── related_message_ids[] (ALL messages)                           │
│  └── version_history[] (all TaskVersion records)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💾 **2. DATA MODEL (Current + Planned)**

### **2.1 Message Storage ✅ (Реалізовано)**

```python
class Message(IDMixin, TimestampMixin, SQLModel, table=True):
    """Message table - stores incoming messages from various sources.

    ✅ РЕАЛІЗОВАНО: Базова модель з AI класифікацією
    """
    __tablename__ = "messages"

    # Message identification
    external_message_id: str = Field(index=True, max_length=100)
    content: str = Field(sa_type=Text)
    sent_at: datetime

    # Core relationships
    source_id: int = Field(foreign_key="sources.id")
    author_id: int = Field(foreign_key="users.id")

    # Platform-specific profiles
    telegram_profile_id: int | None = Field(
        default=None, foreign_key="telegram_profiles.id"
    )

    # Cached fields
    avatar_url: str | None = None

    # AI classification ✅ (базова класифікація реалізована)
    classification: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    analyzed: bool = Field(default=False)

    # ⏳ PLANNED: додати поля для analysis tracking
    # analysis_status: AnalysisStatus  # pending/analyzed/spam/noise
    # included_in_runs: List[UUID]  # які прогони обробили це повідомлення
```

**Відмінності від плану:**
- ✅ Основна структура реалізована
- ⏳ Потрібно додати `analysis_status` enum
- ⏳ Потрібно додати `included_in_runs` для tracking

---

### **2.2 Message Ingestion ✅ (Реалізовано як прототип AnalysisRun)**

```python
class MessageIngestionJob(IDMixin, TimestampMixin, SQLModel, table=True):
    """
    Tracks message ingestion jobs from external sources.

    ✅ РЕАЛІЗОВАНО: Foundation для майбутнього AnalysisRun
    Схожий lifecycle pattern: pending → running → completed → failed
    """
    __tablename__ = "message_ingestion_jobs"

    # Source configuration
    source_type: str = Field(max_length=50)
    source_identifiers: dict = Field(sa_type=JSONB)

    # Time window
    time_window_start: datetime | None
    time_window_end: datetime | None

    # Status tracking
    status: IngestionStatus  # pending/running/completed/failed/cancelled
    messages_fetched: int = 0
    messages_stored: int = 0
    messages_skipped: int = 0
    errors_count: int = 0

    # Progress tracking
    current_batch: int = 0
    total_batches: int | None = None

    # Results and errors
    error_log: dict | None = Field(sa_type=JSONB)

    # Lifecycle timestamps
    started_at: datetime | None
    completed_at: datetime | None
```

**Використання як Foundation:**
- ✅ Вже має lifecycle: pending → running → completed → failed
- ✅ Вже має time window concept
- ✅ Вже має progress tracking
- ⏳ Можна розширити до AnalysisRun або використати як pattern

---

### **2.3 LLM Infrastructure ✅ (Реалізовано)**

#### **LLMProvider Model ✅**

```python
class LLMProvider(SQLModel, table=True):
    """LLM Provider configuration - supports Ollama, OpenAI, etc."""
    __tablename__ = "llm_providers"

    id: UUID
    name: str = Field(unique=True, index=True)
    type: ProviderType  # ollama / openai

    # Connection
    base_url: str | None  # e.g., http://localhost:11434
    api_key_encrypted: bytes | None  # Fernet-encrypted

    # Status
    is_active: bool = True
    validation_status: ValidationStatus  # pending/validating/connected/error
    validation_error: str | None
    validated_at: datetime | None

    # Timestamps
    created_at: datetime
    updated_at: datetime
```

#### **AgentConfig Model ✅**

```python
class AgentConfig(SQLModel, table=True):
    """Agent Configuration - defines AI agent with prompt and model."""
    __tablename__ = "agent_configs"

    id: UUID
    name: str = Field(unique=True, index=True)
    description: str | None

    # LLM Configuration
    provider_id: UUID = Field(foreign_key="llm_providers.id")
    model_name: str  # e.g., 'llama3', 'gpt-4'
    system_prompt: str

    # Agent Behavior
    temperature: float = 0.7
    max_tokens: int | None

    is_active: bool = True
    created_at: datetime
    updated_at: datetime
```

#### **TaskConfig Model ✅**

```python
class TaskConfig(SQLModel, table=True):
    """Task Configuration - defines task with Pydantic schema."""
    __tablename__ = "task_configs"

    id: UUID
    name: str = Field(unique=True, index=True)
    description: str | None

    # Pydantic Schema (JSON Schema format)
    response_schema: dict = Field(sa_type=JSONB)

    is_active: bool = True
    created_at: datetime
    updated_at: datetime
```

#### **AgentTaskAssignment Model ✅**

```python
class AgentTaskAssignment(SQLModel, table=True):
    """Links agent to task - creates independent agent instance."""
    __tablename__ = "agent_task_assignments"

    id: UUID
    agent_id: UUID = Field(foreign_key="agent_configs.id")
    task_id: UUID = Field(foreign_key="task_configs.id")

    is_active: bool = True
    assigned_at: datetime

    # Constraint: unique (agent_id, task_id)
```

**Як це використовується:**
```
LLMProvider (Ollama Local)
    ↓
AgentConfig (Message Classifier)
    ↓ (via AgentTaskAssignment)
TaskConfig (Classify Message) → response_schema: {category, confidence}
    ↓
Result: Structured AI output matching schema
```

---

### **2.4 AnalysisRun ⏳ (Planned - наступний крок)**

```python
class AnalysisRun(SQLModel, table=True):
    """
    Analysis Run - координація AI-аналізу повідомлень

    ⏳ PLANNED: Розширити MessageIngestionJob pattern
    Lifecycle: pending → running → completed → reviewed → closed
    """
    __tablename__ = "analysis_runs"

    id: UUID

    # Time window
    time_window_start: datetime
    time_window_end: datetime

    # Configuration snapshot (versioning!)
    agent_assignment_id: UUID = Field(
        foreign_key="agent_task_assignments.id",
        description="Which agent+task was used"
    )
    project_config_id: UUID | None = Field(
        foreign_key="project_configs.id",
        description="Project classification config"
    )
    config_snapshot: dict = Field(
        sa_type=JSONB,
        description="Full config at run time (for reproducibility)"
    )

    # Execution & Lifecycle
    trigger_type: str  # manual/scheduled/custom
    triggered_by_user_id: int | None = Field(foreign_key="users.id")
    status: str  # pending/running/completed/reviewed/closed/failed/cancelled

    # Lifecycle timestamps
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    closed_at: datetime | None  # ✅ коли PM закрив

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

    # 📊 METRICS - розраховується після closing
    accuracy_metrics: dict | None = Field(
        sa_type=JSONB,
        description="AccuracyMetrics після closing"
    )
```

**⚠️ CRITICAL NOTES:**

1. **Базується на MessageIngestionJob pattern** - lifecycle схожий
2. **Snapshot config** - зберігає конфігурацію на момент запуску
3. **Lifecycle management** - обов'язкове закриття перед новим run
4. **Metrics after closing** - якість LLM оцінюється post-factum

---

### **2.5 TaskProposal ⏳ (Planned)**

```python
class TaskProposal(SQLModel, table=True):
    """AI-generated task proposal - pending PM approval."""
    __tablename__ = "task_proposals"

    id: UUID
    analysis_run_id: UUID = Field(foreign_key="analysis_runs.id")

    # Proposed task data
    proposed_title: str
    proposed_description: str = Field(sa_type=Text)
    proposed_priority: TaskPriority
    proposed_category: TaskCategory
    proposed_project_id: UUID | None = Field(foreign_key="project_configs.id")
    proposed_tags: list[str] = Field(sa_type=JSONB)
    proposed_parent_id: UUID | None = Field(
        foreign_key="task_entities.id",
        description="Parent task if this should be sub-task"
    )

    # Source tracking
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
    review_action: str | None
    review_notes: str | None = Field(sa_type=Text)

    # Timestamps
    created_at: datetime
```

**⚠️ KEY FEATURES:**

1. **Message IDs tracking** - source of truth для duplicate detection
2. **similarity_type = "exact_messages"** - якщо ті самі message_ids → дублікат
3. **reasoning field** - LLM пояснює свої рішення
4. **proposed_parent_id** - підтримка створення sub-tasks

---

### **2.6 TaskEntity ⏳ (Planned - замість legacy Task)**

```python
class TaskEntity(SQLModel, table=True):
    """
    Canonical task - approved and active.

    ✅ Self-referencing hierarchy для sub-tasks (дерево, не граф)
    ⏳ PLANNED: Замінить legacy Task model
    """
    __tablename__ = "task_entities"

    id: UUID

    # ✅ Self-referencing hierarchy
    parent_task_id: UUID | None = Field(
        default=None,
        foreign_key="task_entities.id",
        description="None = root task, else = sub-task"
    )

    # Current state (from latest TaskVersion)
    title: str
    description: str = Field(sa_type=Text)
    priority: TaskPriority
    category: TaskCategory
    project_id: UUID | None = Field(foreign_key="project_configs.id")
    tags: list[str] = Field(sa_type=JSONB)

    # Status tracking
    status: TaskStatus  # open/in_progress/completed/cancelled

    # **KEY FEATURE: Incident Counter** (тільки для root tasks)
    incident_counter: int = Field(
        default=0,
        description="How many times this issue repeated"
    )
    incident_history: list[dict] = Field(
        sa_type=JSONB,
        default_factory=list,
        description="[{timestamp, run_id, message_ids}]"
    )

    # Source tracking
    related_message_ids: list[int] = Field(
        sa_type=JSONB,
        default_factory=list,
        description="ALL messages linked to this task"
    )
    original_message_ids: list[int] = Field(
        sa_type=JSONB,
        description="Initial messages from first version"
    )

    # Versioning
    current_version_id: UUID = Field(foreign_key="task_versions.id")
    version_count: int = 0

    # Creation tracking
    created_from_proposal_id: UUID = Field(foreign_key="task_proposals.id")
    created_from_run_id: UUID = Field(foreign_key="analysis_runs.id")
    created_by_user_id: int = Field(foreign_key="users.id")
    created_at: datetime

    # Update tracking
    last_updated_from_proposal_id: UUID | None
    last_updated_from_run_id: UUID | None
    updated_by_user_id: int | None = Field(foreign_key="users.id")
    updated_at: datetime

    # Merge tracking
    merged_from_task_ids: list[UUID] | None = Field(sa_type=JSONB)
    is_merged: bool = False

    # ⚠️ Validation: tree structure only, no circular references
    # Implemented via application logic (pre-save hook)
```

**⚠️ CRITICAL FEATURES:**

1. **Self-reference** via `parent_task_id` - дерево без окремої моделі SubTask
2. **Tree validation required** - circular references must be prevented
3. **Incident Counter** - тільки для root tasks (parent_task_id = None)

**Example Tree:**
```
Task #456: "Нестабільність фамішного сервісу" (parent_task_id=None)
├─ Task #457: "Додати healthcheck" (parent_task_id=456)
│  ├─ Task #458: "Написати endpoint" (parent_task_id=457)
│  └─ Task #459: "Налаштувати моніторинг" (parent_task_id=457)
└─ Task #460: "Дослідити логи" (parent_task_id=456)
```

---

### **2.7 TaskVersion ⏳ (Planned)**

```python
class TaskVersion(SQLModel, table=True):
    """Version history of TaskEntity - immutable snapshots."""
    __tablename__ = "task_versions"

    id: UUID
    task_entity_id: UUID = Field(foreign_key="task_entities.id")
    version_number: int

    # Version data (snapshot)
    title: str
    description: str = Field(sa_type=Text)
    priority: TaskPriority
    category: TaskCategory
    project_id: UUID | None
    tags: list[str] = Field(sa_type=JSONB)
    parent_task_id: UUID | None  # ✅ може змінитись в різних версіях

    # Source of this version
    created_from_proposal_id: UUID = Field(foreign_key="task_proposals.id")
    created_from_run_id: UUID = Field(foreign_key="analysis_runs.id")
    source_time_window_start: datetime
    source_time_window_end: datetime

    # Versioning chain
    previous_version_id: UUID | None = Field(foreign_key="task_versions.id")
    superseded_by_id: UUID | None = Field(foreign_key="task_versions.id")
    is_current: bool = True

    # Change tracking
    changes_from_previous: dict | None = Field(
        sa_type=JSONB,
        description="Diff from previous version"
    )
    change_reason: str  # initial/llm_update/pm_manual_edit

    # Metadata
    created_by_user_id: int = Field(foreign_key="users.id")
    created_at: datetime
```

---

### **2.8 ProjectConfig ⏳ (Planned)**

```python
class ProjectConfig(SQLModel, table=True):
    """Project definitions for message classification."""
    __tablename__ = "project_configs"

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

---

## 🔄 **3. ANALYSIS RUN LIFECYCLE**

### **3.1 Status Flow**

```
┌─────────────────────────────────────────────────────────────┐
│  LIFECYCLE OF ANALYSIS RUN (з обов'язковим закриттям)       │
└─────────────────────────────────────────────────────────────┘

1. PENDING (створено, чекає запуску)
   ├─ created_at: set
   ├─ status: "pending"
   ├─ proposals_pending: 0
   └─ Action: Can be cancelled or started

2. RUNNING (виконується)
   ├─ started_at: set
   ├─ status: "running"
   ├─ Processing messages → creating proposals
   └─ Can fail → FAILED

3. COMPLETED (успішно завершено)
   ├─ completed_at: set
   ├─ status: "completed"
   ├─ All proposals created
   ├─ proposals_pending > 0 (є на review)
   └─ ⚠️ Waiting for PM review (CANNOT start new run!)

4. REVIEWED (PM переглянув всі proposals)
   ├─ proposals_pending = 0
   ├─ All proposals: approved/rejected
   ├─ Ready for final metrics calculation
   └─ Can be closed

5. CLOSED (завершено і закрито) ✅
   ├─ closed_at: set
   ├─ status: "closed"
   ├─ accuracy_metrics: calculated
   ├─ No pending proposals
   └─ ✅ Run finished, can start new run

❌ FAILED (помилка під час виконання)
   ├─ status: "failed"
   ├─ errors: [...] logged
   └─ Can retry (створює новий run)

❌ CANCELLED (скасовано PM)
   ├─ status: "cancelled"
   └─ No proposals created
```

**⚠️ КРИТИЧНО:** Нові run-и можна запускати **тільки** коли всі попередні закриті!

---

### **3.2 Validation Before Starting New Run**

```python
async def can_start_new_run() -> tuple[bool, str | None]:
    """
    Перевірка чи можна запускати новий run.
    Запобігає накопиченню unclosed runs.
    """
    # Check for unclosed runs
    unclosed = await db.execute(
        select(AnalysisRun).where(
            AnalysisRun.status.in_(["pending", "running", "completed", "reviewed"])
        )
    )
    unclosed_count = len(unclosed.all())

    if unclosed_count > 0:
        return False, f"Cannot start: {unclosed_count} runs not closed yet"

    # Check for pending proposals
    pending_proposals = await db.execute(
        select(TaskProposal).where(TaskProposal.status == "pending")
    )
    pending_count = len(pending_proposals.all())

    if pending_count > MAX_PENDING_PROPOSALS:  # e.g., 50
        return False, f"Too many pending proposals: {pending_count}"

    return True, None
```

---

### **3.3 Closing Run Process**

```python
async def close_analysis_run(run_id: UUID, pm_user_id: int):
    """Закриття аналізу після review всіх proposals."""
    run = await db.get(AnalysisRun, run_id)

    # 1. Validate: всі proposals reviewed
    if run.proposals_pending > 0:
        raise ValueError(
            f"Cannot close: {run.proposals_pending} proposals still pending"
        )

    # 2. Calculate final metrics
    metrics = await calculate_accuracy_metrics(run_id)

    # 3. Update run
    run.status = "closed"
    run.closed_at = datetime.now()
    run.accuracy_metrics = metrics  # dict with AccuracyMetrics

    await db.commit()

    # 4. Notify PM
    await send_notification(
        pm_user_id,
        f"Analysis Run #{run_id} closed. "
        f"Accuracy: {metrics['approval_rate']:.1%}"
    )
```

---

## 🌳 **4. TREE VALIDATION (тільки дерево, не граф)**

### **4.1 Validation Logic**

```python
class TaskTreeValidator:
    """Валідація дерева задач."""

    @staticmethod
    async def validate_no_circular_reference(
        task_id: UUID,
        new_parent_id: UUID,
        db: AsyncSession
    ):
        """
        Перевіряємо що new_parent не є нащадком task_id.

        Приклад проблеми:
        Task 1 → parent = Task 2
        Task 2 → parent = Task 1  ❌ CIRCULAR!
        """
        current_id = new_parent_id
        visited = set()

        while current_id:
            if current_id == task_id:
                raise ValueError("Circular reference detected!")

            if current_id in visited:
                raise ValueError("Circular reference in existing tree!")

            visited.add(current_id)

            # Отримуємо parent поточної таски
            parent_task = await db.get(TaskEntity, current_id)
            current_id = parent_task.parent_task_id if parent_task else None

    @staticmethod
    async def get_tree_depth(task_id: UUID, db: AsyncSession) -> int:
        """Отримати глибину задачі в дереві (0 = root)."""
        task = await db.get(TaskEntity, task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        depth = 0
        current_id = task.parent_task_id

        while current_id:
            depth += 1
            parent = await db.get(TaskEntity, current_id)
            current_id = parent.parent_task_id if parent else None

        return depth

    @staticmethod
    async def get_subtree(root_id: UUID, db: AsyncSession) -> list[TaskEntity]:
        """Отримати все піддерево (всі нащадки)."""
        result = []

        # Get direct children
        children = await db.execute(
            select(TaskEntity).where(TaskEntity.parent_task_id == root_id)
        )

        for child in children.scalars().all():
            result.append(child)
            # Recursively get children of children
            subtree = await TaskTreeValidator.get_subtree(child.id, db)
            result.extend(subtree)

        return result
```

---

### **4.2 Query Examples**

```python
# Отримати всі sub-tasks таски
subtasks = await db.execute(
    select(TaskEntity).where(TaskEntity.parent_task_id == task_id)
)

# Отримати root tasks (без parent)
root_tasks = await db.execute(
    select(TaskEntity).where(TaskEntity.parent_task_id == None)
)

# Отримати всю ієрархію (recursive CTE)
WITH RECURSIVE task_tree AS (
    -- Base case: root task
    SELECT * FROM task_entities WHERE id = :task_id
    UNION ALL
    -- Recursive case: children
    SELECT te.* FROM task_entities te
    JOIN task_tree tt ON te.parent_task_id = tt.id
)
SELECT * FROM task_tree;
```

---

## 📊 **5. METRICS CALCULATION**

```python
async def calculate_accuracy_metrics(run_id: UUID) -> dict:
    """Розрахунок метрик після закриття run."""

    proposals = await db.execute(
        select(TaskProposal).where(TaskProposal.analysis_run_id == run_id)
    )
    proposals = proposals.scalars().all()

    approved = [p for p in proposals if p.status == "approved"]
    rejected = [p for p in proposals if p.status == "rejected"]

    # Approval rate
    approval_rate = len(approved) / len(proposals) if proposals else 0

    # Confidence correlation
    high_conf_approved = [p for p in approved if p.confidence > 0.9]
    low_conf_rejected = [p for p in rejected if p.confidence < 0.7]
    confidence_accuracy = (
        len(high_conf_approved) + len(low_conf_rejected)
    ) / len(proposals) if proposals else 0

    # Duplicate detection
    duplicates = [p for p in proposals if p.similar_task_id is not None]
    duplicates_correct = [
        p for p in duplicates
        if p.review_action in ["merge", "update_existing"]
    ]
    duplicate_accuracy = (
        len(duplicates_correct) / len(duplicates) if duplicates else 1.0
    )

    # Project classification
    projects_changed = [
        p for p in approved
        if p.review_notes and "project changed" in p.review_notes
    ]
    project_accuracy = (
        1 - len(projects_changed) / len(approved) if approved else 1.0
    )

    # Manual edits
    manual_edits = [
        p for p in approved
        if p.review_notes and "edited" in p.review_notes
    ]

    run = await db.get(AnalysisRun, run_id)

    return {
        # Approval rate
        "total_proposals": len(proposals),
        "approved_count": len(approved),
        "rejected_count": len(rejected),
        "approval_rate": approval_rate,

        # Confidence distribution
        "avg_confidence": sum(p.confidence for p in proposals) / len(proposals),
        "high_confidence_approved": len(high_conf_approved),
        "low_confidence_rejected": len(low_conf_rejected),
        "confidence_accuracy": confidence_accuracy,

        # Duplicate detection
        "duplicates_found": len(duplicates),
        "duplicates_correct": len(duplicates_correct),
        "duplicate_detection_accuracy": duplicate_accuracy,

        # Project classification
        "projects_classified": len([p for p in proposals if p.proposed_project_id]),
        "projects_correct": len(approved) - len(projects_changed),
        "project_classification_accuracy": project_accuracy,

        # PM workload
        "manual_edits_count": len(manual_edits),
        "quick_approvals": len(approved) - len(manual_edits),

        # Cost
        "cost_per_approved_task": run.cost_estimate / len(approved) if approved else 0,
    }
```

---

## 📊 **6. UI FOR PM - RUN DASHBOARD**

```
┌────────────────────────────────────────────────────────────┐
│  Analysis Runs Dashboard                   /analysis       │
│                                                             │
│  Active Runs:                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🟢 Run #025 [RUNNING]                                 │ │
│  │    Window: 2025-10-06 00:00 → 23:59                   │ │
│  │    Progress: Processing batch 3/5                      │ │
│  │    [View Progress]                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🟡 Run #024 [COMPLETED - Waiting Review]             │ │
│  │    Window: 2025-10-05 00:00 → 23:59                   │ │
│  │    Proposals: 12 total                                 │ │
│  │      ✅ Approved: 5                                    │ │
│  │      ❌ Rejected: 2                                    │ │
│  │      ⏳ Pending: 5 ← NEEDS REVIEW                     │ │
│  │                                                        │ │
│  │    [Review Pending (5)] [Close Run] (disabled)        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Recent Closed Runs:                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✅ Run #023 [CLOSED]                                  │ │
│  │    Window: 2025-10-04                                  │ │
│  │    Closed: 2 hours ago                                 │ │
│  │                                                        │ │
│  │    📊 Metrics:                                         │ │
│  │    ├─ Proposals: 8 total                              │ │
│  │    ├─ Approved: 7 (87.5%)                             │ │
│  │    ├─ Rejected: 1 (12.5%)                             │ │
│  │    ├─ Avg Confidence: 0.89                            │ │
│  │    ├─ Confidence Accuracy: 92%                        │ │
│  │    ├─ Duplicate Detection: 100% (2/2 correct)         │ │
│  │    ├─ Project Classification: 85% (1 manual change)   │ │
│  │    ├─ Quick Approvals: 6/7 (no edits)                │ │
│  │    ├─ Cost: $3.20 ($0.46 per approved task)          │ │
│  │    └─ Time: 2m 15s                                     │ │
│  │                                                        │ │
│  │    [View Details] [Export Report]                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️  Warning: Cannot start new run                         │
│     Reason: Run #024 has 5 pending proposals              │
│     Action: Please review pending proposals first          │
│                                                             │
│  [Start New Run] (disabled)                                │
└────────────────────────────────────────────────────────────┘
```

---

## ⚠️ **7. CRITICAL IMPLEMENTATION RULES**

### **7.1 Versioning & Immutability**

```
RULE 1: Messages are immutable
  ✅ РЕАЛІЗОВАНО: Message model не має update endpoints
  - Only update analysis_status, classification, confidence fields

RULE 2: AnalysisRun config is snapshot
  ⏳ PLANNED: config_snapshot field in AnalysisRun
  - Store complete agent+task+provider config at run time
  - Store project config version
  → If PM changes config, old runs show what was used

RULE 3: TaskProposal → TaskEntity conversion
  ⏳ PLANNED
  - TaskProposal is temporary (pending approval)
  - TaskEntity is permanent (canonical task)
  - Never delete TaskEntity, only mark as cancelled/merged

RULE 4: TaskVersion is immutable snapshot
  ⏳ PLANNED
  - Never modify TaskVersion records
  - Create new version for any change
  - Keep full version chain

RULE 5: Incident history is append-only
  ⏳ PLANNED
  - Never delete incidents
  - Only append new incidents
  - Each incident links to specific run + messages

RULE 6: Tree structure validation
  ⏳ PLANNED
  - ✅ Дерево: TaskEntity з parent_task_id (self-reference)
  - ❌ NO circular references (A → B → A)
  - ✅ Validation перед кожною зміною parent_task_id

RULE 7: AnalysisRun lifecycle must complete
  ⏳ PLANNED
  - ✅ Runs must be closed (не залишати в "completed")
  - ❌ Cannot start new run while unclosed runs exist
  - ✅ Metrics calculated only after closing
```

---

### **7.2 Message ID Tracking**

```
WHY CRITICAL:
  Message IDs are the SOURCE OF TRUTH for detecting:
  - Duplicate analysis of same window
  - Recurring issues
  - Related discussions

CURRENT STATE:
  ✅ Message.id exists
  ⏳ Need to add message_ids tracking in proposals/tasks

PLANNED IMPLEMENTATION:
  1. TaskProposal.source_message_ids: list[int]
     - Exact list of message IDs that created this proposal

  2. TaskEntity.related_message_ids: list[int]
     - ALL messages ever linked to this task
     - Grows over time as incidents added

  3. TaskEntity.original_message_ids: list[int]
     - First messages that created initial version
     - Never changes (historical record)

QUERY PATTERN:
  # Find tasks containing specific messages
  SELECT * FROM task_entities
  WHERE :message_id = ANY(related_message_ids)

  # Check if messages already in a task
  SELECT EXISTS(
    SELECT 1 FROM task_entities
    WHERE related_message_ids && ARRAY[1,2,3]
  )
```

---

### **7.3 Confidence Thresholds**

```
DEFINE CLEAR THRESHOLDS:

High Confidence (> 0.95):
  - Can consider auto-approve
  - Minimal PM review needed
  - Example: Явний баг з точним описом

Medium Confidence (0.75 - 0.95):
  - Requires PM review
  - Show in review queue
  - Example: Можливий баг, але не впевнений

Low Confidence (< 0.75):
  - Mandatory detailed review
  - Highlight for PM attention
  - Example: Неясно чи це таска чи discussion

THRESHOLD TUNING:
  - Track approval/reject rates per confidence bucket
  - Adjust thresholds based on PM feedback
  - Different thresholds per project

CURRENT STATE:
  ✅ Message.confidence field exists (basic classification)
  ⏳ Need to implement in TaskProposal and analysis pipeline
```

---

## 📝 **8. IMPLEMENTATION ROADMAP**

### **Phase 1: Analysis Foundation (NEXT STEPS)**

```
✅ Prerequisites (DONE):
├─ Message model with basic classification
├─ MessageIngestionJob (lifecycle pattern)
├─ LLMProvider + AgentConfig + TaskConfig
└─ Frontend pages structure

⏳ Phase 1 Tasks:
├─ [ ] Create AnalysisRun model (extend MessageIngestionJob pattern)
├─ [ ] Create TaskProposal model
├─ [ ] Create ProjectConfig model
├─ [ ] Add analysis_status enum to Message
├─ [ ] Add included_in_runs field to Message
├─ [ ] Implement AnalysisRun API endpoints
├─ [ ] Implement ProjectConfig API endpoints
├─ [ ] Update AnalysisRunsPage to display real runs
└─ [ ] Update ProposalsPage to display real proposals
```

### **Phase 2: Task Entity System**

```
⏳ Phase 2 Tasks:
├─ [ ] Create TaskEntity model (self-referencing)
├─ [ ] Create TaskVersion model
├─ [ ] Implement tree validation logic
├─ [ ] Add TaskTreeValidator utility
├─ [ ] Migrate existing Task data to TaskEntity
├─ [ ] Implement TaskEntity API endpoints
├─ [ ] Update TasksPage to display TaskEntity
└─ [ ] Add incident counter tracking
```

### **Phase 3: LLM Analysis Pipeline**

```
⏳ Phase 3 Tasks:
├─ [ ] Implement Stage 1: Pre-filtering
├─ [ ] Implement Stage 2: Batch grouping
├─ [ ] Implement Stage 3.1: Project classification
├─ [ ] Implement Stage 3.2: Task extraction
├─ [ ] Implement Stage 3.3: Action items detection
├─ [ ] Implement Stage 4: Duplicate detection
├─ [ ] Implement Stage 5: Proposal creation
├─ [ ] Add TaskIQ background jobs for analysis
└─ [ ] Add progress tracking for runs
```

### **Phase 4: PM Review Interface**

```
⏳ Phase 4 Tasks:
├─ [ ] Implement proposal review UI
├─ [ ] Add batch approval actions
├─ [ ] Implement run lifecycle management
├─ [ ] Add metrics visualization
├─ [ ] Implement close run workflow
├─ [ ] Add accuracy metrics calculation
├─ [ ] Add export reports functionality
└─ [ ] Add notifications for PM
```

---

## 🎯 **9. KEY ARCHITECTURAL DECISIONS**

1. ✅ **LLM Infrastructure Ready** - AgentConfig + TaskConfig + LLMProvider реалізовано
2. ✅ **Message Storage Ready** - Message model з базовою класифікацією
3. ✅ **Lifecycle Pattern Established** - MessageIngestionJob як template для AnalysisRun
4. ⏳ **SubTask = TaskEntity** - self-reference через `parent_task_id` (planned)
5. ⏳ **Tree structure only** - не граф, validation обов'язкова (planned)
6. ⏳ **AnalysisRun = окрема meta-сутність** - для координації та метрик (planned)
7. ⏳ **Sequential processing** - новий run тільки після closing попереднього (planned)
8. ⏳ **Message IDs = source of truth** - для duplicate detection (planned)
9. ✅ **Immutability** - Messages вже immutable, розширити на інші моделі

---

## 📚 **10. REFERENCES**

### **Database Models Location**
- Current models: `backend/app/models/`
- Legacy models: `backend/app/models/legacy.py`
- Enums: `backend/app/models/enums.py`

### **Frontend Pages**
- Dashboard: `frontend/src/pages/DashboardPage/`
- Messages: `frontend/src/pages/MessagesPage/`
- Analysis Runs: `frontend/src/pages/AnalysisRunsPage/`
- Proposals: `frontend/src/pages/ProposalsPage/`
- Agents: `frontend/src/pages/AgentsPage/`
- Providers: `frontend/src/pages/ProvidersPage/`

### **API Documentation**
- Backend: See `backend/CLAUDE.md`
- Frontend: See `frontend/CLAUDE.md`

---

**Last Updated**: 2025-10-09
**Status**: Foundation Complete, Analysis Pipeline In Planning