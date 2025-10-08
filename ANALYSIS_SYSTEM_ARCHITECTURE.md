# 🏗️ **АРХІТЕКТУРА СИСТЕМИ АНАЛІЗУ ПОВІДОМЛЕНЬ**

---

## 📐 **1. HIGH-LEVEL ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TELEGRAM SOURCE                              │
│                    (messages stream incoming)                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MESSAGE STORAGE LAYER                           │
│  - SimpleMessage (raw storage)                                       │
│  - Metadata: timestamp, author, external_id                          │
│  - Status: pending_analysis / analyzed / spam                        │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   TRIGGER MECHANISM     │
                    │  - Manual (PM button)   │
                    │  - Scheduled (nightly)  │
                    │  - Custom window        │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ANALYSIS RUN ENGINE                            │
│                                                                      │
│  Input: Time Window (start/end) + LLM Config                        │
│  Output: Task Proposals                                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 1: PRE-FILTERING (Simple Rules)                   │      │
│  │  - Keyword detection                                      │      │
│  │  - @mention detection                                     │      │
│  │  - Length filter (< 10 chars = likely noise)             │      │
│  │  Output: ~70% filtered out                                │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   │                                                  │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 2: BATCH GROUPING (Smart Batching)                │      │
│  │  - Group by time proximity (5-10 min windows)            │      │
│  │  - Max batch size: 50 messages                            │      │
│  │  - Keep context: include surrounding messages             │      │
│  │  Output: N batches ready for LLM                          │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   │                                                  │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 3: LLM ANALYSIS (Deep Processing)                 │      │
│  │                                                            │      │
│  │  Sub-stage 3.1: PROJECT CLASSIFICATION                    │      │
│  │    Input: Batch + Project Descriptions                    │      │
│  │    Output: project_id or "unknown"                        │      │
│  │                                                            │      │
│  │  Sub-stage 3.2: TASK EXTRACTION                           │      │
│  │    Input: Batch + Project Context                         │      │
│  │    Output: Task proposals with details                    │      │
│  │                                                            │      │
│  │  Sub-stage 3.3: ACTION ITEMS DETECTION                    │      │
│  │    Input: Task description                                │      │
│  │    Output: Sub-tasks list                                 │      │
│  │                                                            │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   │                                                  │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 4: DUPLICATE DETECTION (Entity Resolution)         │      │
│  │  - Search existing approved tasks                         │      │
│  │  - Semantic similarity (embeddings)                       │      │
│  │  - Message overlap detection (exact match)                │      │
│  │  Output: similar_task_id + diff                           │      │
│  └────────────────┬─────────────────────────────────────────┘      │
│                   │                                                  │
│                   ▼                                                  │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  STAGE 5: PROPOSAL CREATION                               │      │
│  │  - Create TaskProposal records                            │      │
│  │  - Calculate confidence scores                            │      │
│  │  - Generate recommendations                               │      │
│  │  - Link to source messages                                │      │
│  └────────────────┬─────────────────────────────────────────┘      │
└───────────────────┼──────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PROPOSAL REVIEW QUEUE                            │
│                                                                      │
│  Auto-approve: confidence > 0.95 + no conflicts                     │
│  Manual review: confidence < 0.95 OR has similar tasks              │
│                                                                      │
│  PM Actions:                                                         │
│  - Approve as new task                                               │
│  - Merge with existing task (increment incident counter)            │
│  - Update existing task (create new version)                        │
│  - Split into multiple tasks                                        │
│  - Edit manually                                                     │
│  - Reject                                                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         TASK ENTITY LAYER                            │
│                                                                      │
│  TaskEntity (canonical task - дерево через self-reference)          │
│  ├── parent_task_id (для ієрархії sub-tasks)                        │
│  ├── current_version_id                                              │
│  ├── incident_counter (for recurring issues)                         │
│  ├── related_message_ids[]                                           │
│  └── version_history[]                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💾 **2. DATA MODEL (Core Entities)**

### **2.1 Message Storage**

```python
class SimpleMessage:
    """Raw message from Telegram - immutable"""
    id: int
    external_message_id: str  # Telegram message_id
    content: str
    author: str
    sent_at: datetime
    source_id: int  # FK to SimpleSource
    avatar_url: str | None

    # Analysis tracking
    analysis_status: AnalysisStatus  # pending/analyzed/spam/noise
    included_in_runs: List[UUID]  # які прогони обробили це повідомлення
    created_at: datetime
```

---

### **2.2 Analysis Run (окрема meta-сутність для координації)**

```python
class AnalysisRun:
    """
    Represents one analysis session - окрема координаційна сутність
    Використовується для:
    - Координації результатів роботи
    - Відстеження метрик аналізу
    - Послідовного процесу без накопичень
    """
    id: UUID

    # Time window
    time_window_start: datetime
    time_window_end: datetime

    # Configuration snapshot (versioning!)
    llm_config: Dict  # model, prompt_version, temperature, provider
    project_descriptions: Dict  # snapshot of project configs at run time
    glossary_version: str  # version of terminology dict

    # Execution & Lifecycle
    trigger_type: TriggerType  # manual/scheduled/custom
    triggered_by: str | None  # user_id if manual
    status: RunStatus  # pending → running → completed → reviewed → closed

    # Lifecycle timestamps
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    closed_at: datetime | None  # ✅ коли PM закрив (reviewed all proposals)

    # Proposals tracking
    proposals_total: int  # скільки створено
    proposals_approved: int  # скільки затверджено
    proposals_rejected: int  # скільки відхилено
    proposals_pending: int  # скільки ще на review

    # LLM usage statistics
    total_messages_in_window: int
    messages_after_prefilter: int
    batches_created: int
    llm_tokens_used: int
    cost_estimate: float

    # Results
    proposals: List[UUID]  # FK to TaskProposal
    tasks_created: List[UUID]  # FK to TaskEntity (створені з цього run)

    # 📊 METRICS - якість та точність (розраховується після closing)
    accuracy_metrics: AccuracyMetrics | None

    # Error handling
    errors: List[Dict]  # log of errors during run
```

**⚠️ CRITICAL NOTES:**

1. **Окрема сутність:** AnalysisRun є meta-інформацією про процес, не бізнес-даними
2. **Lifecycle management:** Має власний життєвий цикл з обов'язковим закриттям
3. **Metrics tracking:** Дозволяє відстежувати точність LLM та якість результатів
4. **Sequential processing:** Запобігає накопиченням unclosed runs

---

### **2.3 Accuracy Metrics**

```python
class AccuracyMetrics:
    """Метрики для оцінки якості аналізу після closing run"""

    # Approval rate
    total_proposals: int
    approved_count: int
    rejected_count: int
    approval_rate: float  # approved / total

    # Confidence distribution
    avg_confidence: float
    high_confidence_approved: int  # confidence > 0.9 AND approved
    low_confidence_rejected: int   # confidence < 0.7 AND rejected
    confidence_accuracy: float  # чи корелює confidence з approval?

    # Duplicate detection accuracy
    duplicates_found: int
    duplicates_correct: int  # PM confirmed merge
    duplicates_incorrect: int  # PM created separate task
    duplicate_detection_accuracy: float

    # Project classification accuracy
    projects_classified: int
    projects_correct: int  # PM didn't change project
    projects_changed: int  # PM manually changed project
    project_classification_accuracy: float

    # Time efficiency
    avg_time_per_proposal: float  # seconds
    total_processing_time: float

    # Cost efficiency
    cost_per_approved_task: float  # $ per approved task

    # PM workload
    manual_edits_count: int  # скільки proposals PM редагував
    quick_approvals: int  # approve without edits
```

---

### **2.4 Task Proposal**

```python
class TaskProposal:
    """Proposal for task creation/update - pending PM approval"""
    id: UUID
    analysis_run_id: UUID  # from which run

    # Proposed task data
    proposed_title: str
    proposed_description: str
    proposed_priority: TaskPriority  # critical/high/medium/low
    proposed_project_id: UUID | None
    proposed_category: TaskCategory  # bug/feature/improvement/question
    proposed_tags: List[str]
    proposed_parent_id: UUID | None  # ✅ якщо це має бути sub-task

    # Source tracking
    source_message_ids: List[int]  # які повідомлення → ця пропозиція
    message_count: int
    time_span: timedelta  # скільки часу між першим і останнім message

    # Extracted sub-tasks (action items)
    proposed_sub_tasks: List[Dict]  # [{"title": "...", "description": "..."}]

    # Duplicate detection
    similar_task_id: UUID | None  # якщо знайдено схожу існуючу таску
    similarity_score: float | None  # 0.0-1.0
    similarity_type: str | None  # "exact_messages" / "semantic" / "none"
    diff_summary: Dict | None  # що змінилось

    # LLM metadata
    llm_recommendation: RecommendationType  # new_task/update_existing/merge/reject
    confidence: float  # 0.0-1.0
    reasoning: str  # пояснення LLM чому така рекомендація

    # Project classification
    project_classification_confidence: float
    project_keywords_matched: List[str]

    # Review status
    status: ProposalStatus  # pending/approved/rejected/merged
    reviewed_by: str | None
    reviewed_at: datetime | None
    review_action: ReviewAction | None
    review_notes: str | None

    # Timestamps
    created_at: datetime
```

**⚠️ CRITICAL NOTES:**

1. **Message IDs tracking:** Ключовий механізм для виявлення повторних прогонів того самого вікна
2. **similarity_type = "exact_messages":** Якщо нова пропозиція має ТІ САМІ message_ids що й існуюча таска → це точно дублікат
3. **Reasoning field:** LLM має пояснювати свої рішення - важливо для PM review
4. **proposed_parent_id:** Підтримка створення sub-tasks в ієрархії

---

### **2.5 Task Entity (з self-reference для дерева)**

```python
class TaskEntity:
    """
    Canonical task - approved and active
    ✅ ВАЖЛИВО: SubTask = TaskEntity з parent_task_id (не окрема модель!)
    ✅ Дерево: тільки дерево, не граф (validation потрібен)
    """
    id: UUID

    # ✅ Self-referencing hierarchy (для sub-tasks)
    parent_task_id: UUID | None  # None = root task, else = sub-task

    # Current state (from latest approved version)
    title: str
    description: str
    priority: TaskPriority
    category: TaskCategory
    project_id: UUID | None
    tags: List[str]

    # Status tracking
    status: TaskStatus  # open/in_progress/completed/cancelled

    # **KEY FEATURE: Incident Counter** (тільки для root tasks)
    incident_counter: int  # скільки разів ця проблема повторювалась
    incident_history: List[Dict]  # [{"timestamp": ..., "run_id": ..., "message_ids": [...]}]

    # Source tracking
    related_message_ids: List[int]  # ВСІ повідомлення пов'язані з цією таскою
    original_message_ids: List[int]  # початкові повідомлення (з першої версії)

    # Versioning
    current_version_id: UUID  # FK to TaskVersion
    version_count: int

    # Creation tracking
    created_from_proposal: UUID  # перша пропозиція що створила таску
    created_from_run: UUID  # link to AnalysisRun
    created_at: datetime
    created_by: str

    # Update tracking
    last_updated_from_proposal: UUID | None
    last_updated_from_run: UUID | None
    updated_at: datetime
    updated_by: str

    # Merge tracking (якщо це результат злиття)
    merged_from_tasks: List[UUID]  # які таски були злиті в цю
    is_merged: bool

    # Validation
    @validates('parent_task_id')
    def validate_no_circular_reference(self, key, parent_id):
        """Перевірка що немає циклів в дереві"""
        if parent_id:
            validate_tree_structure(self.id, parent_id)
        return parent_id
```

**⚠️ CRITICAL FEATURES:**

1. **Self-reference:** `parent_task_id` дозволяє будувати дерево без окремої моделі SubTask
2. **Tree validation:** Обов'язкова перевірка на circular references
3. **Incident Counter:** Працює тільки для root tasks (parent_task_id = None)

**Example Tree:**
```
Task #456: "Нестабільність фамішного сервісу" (parent_task_id=None)
├─ Task #457: "Додати healthcheck" (parent_task_id=456)
│  ├─ Task #458: "Написати endpoint" (parent_task_id=457)
│  └─ Task #459: "Налаштувати моніторинг" (parent_task_id=457)
└─ Task #460: "Дослідити логи" (parent_task_id=456)
```

---

### **2.6 Task Version**

```python
class TaskVersion:
    """Version history of task - immutable snapshots"""
    id: UUID
    task_entity_id: UUID
    version_number: int

    # Version data (snapshot)
    title: str
    description: str
    priority: TaskPriority
    category: TaskCategory
    project_id: UUID | None
    tags: List[str]
    parent_task_id: UUID | None  # ✅ може змінитись в різних версіях

    # Source of this version
    created_from_proposal: UUID
    created_from_run: UUID
    source_time_window: DateRange  # з якого часового вікна дані

    # Versioning chain
    previous_version_id: UUID | None
    superseded_by_id: UUID | None
    is_current: bool

    # Change tracking
    changes_from_previous: Dict | None  # diff з попередньою версією
    change_reason: str  # "initial" / "llm_update" / "pm_manual_edit"

    # Metadata
    created_at: datetime
    created_by: str
```

---

### **2.7 Project Configuration**

```python
class ProjectConfig:
    """Project definitions - pre-configured by PM"""
    id: UUID
    name: str
    description: str

    # Classification keywords/phrases
    keywords: List[str]  # ["фамі", "фамішна черга", "монітор"]
    glossary: Dict[str, str]  # {"нігер нехай запише": "PM сказав AI нотувати"}

    # Components/modules
    components: List[Dict]  # [{"name": "family-queue", "keywords": [...]}]

    # Team
    default_assignees: List[str]
    pm_user_id: str

    # Settings
    is_active: bool
    priority_rules: Dict  # правила визначення пріоритету

    # Versioning
    version: str  # для tracking змін конфігурації
    created_at: datetime
    updated_at: datetime
```

---

## 🔄 **3. ANALYSIS RUN LIFECYCLE**

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

**⚠️ КРИТИЧНО:** Нові run-и можна запускати **тільки** коли всі попередні закриті (closed)!

---

## 🚫 **4. SEQUENTIAL PROCESSING (запобігання накопиченням)**

### **4.1 Validation Before Starting New Run**

```python
async def can_start_new_run() -> tuple[bool, str | None]:
    """
    Перевірка чи можна запускати новий run
    Запобігає накопиченню unclosed runs
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

    # Check for pending proposals across all runs
    pending_proposals = await db.execute(
        select(TaskProposal).where(
            TaskProposal.status == "pending_review"
        )
    )
    pending_count = len(pending_proposals.all())

    if pending_count > MAX_PENDING_PROPOSALS:  # e.g., 50
        return False, f"Too many pending proposals: {pending_count}"

    return True, None
```

### **4.2 Closing Run Process**

```python
async def close_analysis_run(run_id: UUID, pm_user_id: str):
    """
    Закриття аналізу після review всіх proposals
    """
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
    run.accuracy_metrics = metrics

    await db.commit()

    # 4. Notify PM
    await send_notification(
        pm_user_id,
        f"Analysis Run #{run_id} closed. "
        f"Accuracy: {metrics.approval_rate:.1%}"
    )
```

---

## 🌳 **5. TREE VALIDATION (тільки дерево, не граф)**

```python
class TaskTreeValidator:
    """Валідація дерева задач"""

    @staticmethod
    async def validate_no_circular_reference(task_id: UUID, new_parent_id: UUID):
        """
        Перевіряємо що new_parent не є нащадком task_id

        Приклад проблеми:
        Task 1 → parent = Task 2
        Task 2 → parent = Task 1  ❌ CIRCULAR!
        """
        # Йдемо вгору по дереву від new_parent
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
        """Отримати глибину задачі в дереві (0 = root)"""
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
    async def get_subtree(root_id: UUID, db: AsyncSession) -> List[TaskEntity]:
        """Отримати все піддерево (всі нащадки)"""
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

**Приклади запитів для роботи з деревом:**

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

## 📊 **6. METRICS CALCULATION**

```python
async def calculate_accuracy_metrics(run_id: UUID) -> AccuracyMetrics:
    """Розрахунок метрик після закриття run"""

    proposals = await db.execute(
        select(TaskProposal).where(TaskProposal.analysis_run_id == run_id)
    )

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

    return AccuracyMetrics(
        total_proposals=len(proposals),
        approved_count=len(approved),
        rejected_count=len(rejected),
        approval_rate=approval_rate,

        avg_confidence=sum(p.confidence for p in proposals) / len(proposals),
        high_confidence_approved=len(high_conf_approved),
        low_confidence_rejected=len(low_conf_rejected),
        confidence_accuracy=confidence_accuracy,

        duplicates_found=len(duplicates),
        duplicates_correct=len(duplicates_correct),
        duplicate_detection_accuracy=duplicate_accuracy,

        projects_classified=len([p for p in proposals if p.proposed_project_id]),
        projects_correct=len(approved) - len(projects_changed),
        project_classification_accuracy=project_accuracy,

        manual_edits_count=len(manual_edits),
        quick_approvals=len(approved) - len(manual_edits),

        # Cost
        cost_per_approved_task=run.cost_estimate / len(approved) if approved else 0
    )
```

---

## 📊 **7. UI FOR PM - RUN DASHBOARD**

```
┌────────────────────────────────────────────────────────────┐
│  Analysis Runs Dashboard                                    │
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

## ⚠️ **8. CRITICAL IMPLEMENTATION RULES**

### **8.1 Versioning & Immutability**

```
RULE 1: Messages are immutable
  - Never modify SimpleMessage records
  - Only update analysis_status field

RULE 2: AnalysisRun config is snapshot
  - Store complete LLM config at run time
  - Store project descriptions version
  - Store glossary version
  → If PM changes prompts, old runs show what was used

RULE 3: TaskProposal → TaskEntity conversion
  - TaskProposal is temporary (pending approval)
  - TaskEntity is permanent (canonical task)
  - Never delete TaskEntity, only mark as cancelled/merged

RULE 4: TaskVersion is immutable snapshot
  - Never modify TaskVersion records
  - Create new version for any change
  - Keep full version chain

RULE 5: Incident history is append-only
  - Never delete incidents
  - Only append new incidents
  - Each incident links to specific run + messages

RULE 6: Tree structure validation
  - ✅ Дерево: TaskEntity з parent_task_id (self-reference)
  - ❌ NO circular references (A → B → A)
  - ❌ NO cross-references (A є parent для B, B є parent для A)
  - ✅ Validation перед кожною зміною parent_task_id

RULE 7: AnalysisRun lifecycle must complete
  - ✅ Runs must be closed (не залишати в "completed")
  - ❌ Cannot start new run while unclosed runs exist
  - ✅ Metrics calculated only after closing
```

---

### **8.2 Message ID Tracking**

```
WHY CRITICAL:
  Message IDs are the SOURCE OF TRUTH for detecting:
  - Duplicate analysis of same window
  - Recurring issues
  - Related discussions

IMPLEMENTATION:
  1. TaskProposal.source_message_ids: List[int]
     - Exact list of message IDs that created this proposal

  2. TaskEntity.related_message_ids: List[int]
     - ALL messages ever linked to this task
     - Grows over time as incidents added

  3. TaskEntity.original_message_ids: List[int]
     - First messages that created initial version
     - Never changes (historical record)

QUERY PATTERN:
  # Find tasks containing specific messages
  SELECT * FROM task_entities
  WHERE message_id = ANY(related_message_ids)

  # Check if messages already in a task
  SELECT EXISTS(
    SELECT 1 FROM task_entities
    WHERE related_message_ids && ARRAY[1,2,3]
  )
```

---

### **8.3 Confidence Thresholds**

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
  - Different thresholds per project (some need stricter review)
```

---

## 📝 **9. CRITICAL CHECKLIST FOR IMPLEMENTATION**

```
BEFORE STARTING DEVELOPMENT:

☐ Define exact confidence thresholds with PM
  - What confidence = auto-approve?
  - What confidence = mandatory review?

☐ Prepare project configurations
  - Get list of all projects
  - Get keywords per project
  - Get glossary/terminology dict

☐ Design LLM prompts with PM feedback
  - Show PM example outputs
  - Iterate until prompts produce good results

☐ Set up cost monitoring
  - Track tokens per run
  - Alert if cost exceeds budget
  - Estimate monthly spend

☐ Prepare PM training
  - How to review proposals
  - How to handle conflicts
  - How to tune thresholds

☐ Establish rollback procedure
  - If LLM produces bad results
  - How to revert to previous run
  - How to re-run with fixed config

☐ Define success metrics
  - % of proposals approved without edits
  - Time saved vs manual processing
  - False positive/negative rates

☐ Implement tree validation
  - Circular reference detection
  - Max depth limits (optional)
  - Parent change validation

☐ Implement run lifecycle management
  - Closing procedure
  - Sequential processing validation
  - Metrics calculation

☐ Design PM dashboard
  - Run status overview
  - Metrics visualization
  - Pending proposals alert
```

---

## 🎯 **10. KEY ARCHITECTURAL DECISIONS SUMMARY**

1. ✅ **SubTask = TaskEntity** (self-reference через `parent_task_id`)
2. ✅ **Tree structure only** (не граф, validation обов'язкова)
3. ✅ **AnalysisRun = окрема meta-сутність** для координації та метрик
4. ✅ **Lifecycle з обов'язковим closing** для запобігання накопиченням
5. ✅ **Metrics після closing** для оцінки точності LLM
6. ✅ **Sequential processing** - новий run тільки після closing попереднього
7. ✅ **Message IDs = source of truth** для duplicate detection
8. ✅ **Immutability** всюди крім status полів
