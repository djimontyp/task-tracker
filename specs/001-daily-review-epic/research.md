# Research: Daily Review Epic

**Branch**: `001-daily-review-epic` | **Date**: 2025-12-13

## Overview

Дослідження технічного контексту для імплементації Daily Review Epic. Всі ключові питання вирішені на основі аналізу існуючого коду.

---

## Research Findings

### 1. Dashboard Metrics Endpoint

**Question**: Як отримати агреговані метрики для Dashboard?

**Decision**: Створити новий endpoint `GET /api/v1/dashboard/metrics`

**Rationale**:
- Існуючий `/api/v1/stats/activity` повертає raw data points, а не агреговані метрики
- `/api/v1/stats/sidebar-counts` повертає тільки unclosed_runs та pending_proposals (обидва = 0 після cleanup)
- Потрібен новий endpoint що агрегує: messages count, atoms count by type/status, active topics count

**Existing Code Analysis**:
```python
# backend/app/api/v1/stats.py - лише activity та sidebar-counts
# Message model має: noise_classification (signal/noise/spam), importance_score (0-1)
# Atom model має: type (7 types), user_approved (bool), archived (bool)
# Topic model має: зв'язки через topic_atoms та message.topic_id
```

**Implementation Approach**:
- Новий сервіс `DashboardService` з методами агрегації
- Endpoint повертає `DashboardMetricsResponse` з counts та trends

**Alternatives Rejected**:
- Множинні запити з frontend: повільно, більше round-trips
- Розширення stats.py: порушує SRP, stats для heatmap/activity

---

### 2. Signal/Noise Filter

**Question**: Як реалізувати фільтр Signal/Noise в Messages?

**Decision**: Використати існуюче поле `noise_classification` з enum `NoiseClassification`

**Rationale**:
- Поле `noise_classification` вже є в `Message` model
- Enum має значення: `signal`, `noise`, `spam`, `low_quality`, `high_quality`
- API вже підтримує фільтр: `GET /messages?classification=signal`

**Existing Code Analysis**:
```python
# backend/app/models/message.py:80-84
noise_classification: str | None = Field(
    default=None,
    max_length=50,
    description="Noise classification type (signal/noise/spam/low_quality/high_quality)",
)

# backend/app/api/v1/messages.py:137-139
classification: list[str] | None = Query(
    None, description="Filter by noise classification..."
)
```

**Frontend Implementation**:
- Default filter: `?classification=signal`
- Toggle для "Show All": без параметра classification
- Badge з Signal/Noise ratio у header

**Alternatives Rejected**:
- Нове поле is_signal: дублювання, денормалізація
- Frontend-side filtering: неефективно для великих списків

---

### 3. Atoms Grouping by Type

**Question**: Як групувати Atoms по типу в UI?

**Decision**: Використати `AtomType` enum та frontend groupBy

**Rationale**:
- Backend вже має endpoint `GET /atoms` з pagination
- AtomType enum: `problem`, `solution`, `decision`, `question`, `insight`, `pattern`, `requirement`
- Специфікація вимагає 9 типів, але enum має 7 — використаємо наявні

**Existing Code Analysis**:
```python
# backend/app/models/atom.py:15-24
class AtomType(str, Enum):
    problem = "problem"
    solution = "solution"
    decision = "decision"
    question = "question"
    insight = "insight"
    pattern = "pattern"
    requirement = "requirement"
```

**Note**: Spec згадує TASK, IDEA, BLOCKER, RISK — ці типи відсутні в enum. Використовуємо наявні 7 типів для MVP.

**Frontend Implementation**:
- Fetch atoms з API
- Group by `atom.type` на frontend
- Кожна група: collapsible section з count badge

**Alternatives Rejected**:
- Backend groupBy endpoint: over-engineering для MVP
- Separate requests per type: N+1 problem

---

### 4. Bulk Approve/Reject Atoms

**Question**: Як реалізувати пакетні операції approve/reject?

**Decision**: Використати існуючий endpoint `POST /atoms/bulk-approve`

**Rationale**:
- Endpoint вже існує та повністю функціональний
- Partial success strategy: повертає approved_count, failed_ids, errors
- Idempotent: безпечно для re-approving

**Existing Code Analysis**:
```python
# backend/app/api/v1/atoms.py:201-251
@router.post("/bulk-approve", response_model=BulkApproveResponse)
async def bulk_approve_atoms(request: BulkApproveRequest, ...):
    """Bulk approve multiple atoms in a single operation."""

# backend/app/models/atom.py:382-404
class BulkApproveRequest(SQLModel):
    atom_ids: list[str] = Field(min_length=1, ...)

class BulkApproveResponse(SQLModel):
    approved_count: int
    failed_ids: list[str]
    errors: list[str]
```

**Missing Functionality**:
- `POST /atoms/bulk-reject` — потрібно створити (аналогічно bulk-archive)
- Або використати `PATCH /atoms/{id}` з `user_approved=False` для reject

**Frontend Implementation**:
- Checkboxes для вибору atoms
- "Approve All" button → POST /atoms/bulk-approve
- Toast notification з результатом

**Alternatives Rejected**:
- Individual requests: повільно для 10+ atoms
- Optimistic updates: ризик inconsistency

---

### 5. Topics Navigation

**Question**: Як реалізувати навігацію по Topics з кількостями?

**Decision**: Використати існуючий endpoint `GET /topics/recent`

**Rationale**:
- Endpoint повертає `RecentTopicsResponse` з metrics
- Кожен topic має: `message_count`, `atoms_count`, `last_message_at`
- Підтримує фільтрацію по періоду: today, yesterday, week, month

**Existing Code Analysis**:
```python
# backend/app/api/v1/topics.py:110-147
@router.get("/recent", response_model=RecentTopicsResponse)
async def get_recent_topics(
    period: TimePeriod | None = Query(None, ...),
    start_date: datetime | None = Query(None, ...),
    ...
):

# backend/app/models/topic.py:324-335
class RecentTopicItem(SQLModel):
    id: uuid.UUID
    name: str
    icon: str | None
    color: str | None
    last_message_at: str
    message_count: int
    atoms_count: int
```

**Frontend Implementation**:
- TopicCard component з icon, name, counts
- Click → navigate to TopicDetailPage
- Filter tabs: Today | This Week | This Month

**Alternatives Rejected**:
- Custom aggregation endpoint: вже є /recent
- Client-side counting: неточно, зайві запити

---

### 6. Dashboard Period Toggle (Today/Yesterday)

**Question**: Як реалізувати автоматичне переключення на "вчора" коли немає даних за сьогодні?

**Decision**: Реалізувати логіку на backend в DashboardService

**Rationale**:
- FR-005: "Система ПОВИННА автоматично перемикатись на "вчора" коли немає даних за сьогодні (до полудня)"
- Backend знає про дані та час, frontend просто відображає

**Implementation Approach**:
```python
class DashboardService:
    async def get_metrics(self, period: str = "auto") -> DashboardMetrics:
        if period == "auto":
            today_count = await self._count_messages_today()
            if today_count == 0 and datetime.now().hour < 12:
                period = "yesterday"
            else:
                period = "today"
        return await self._aggregate_metrics(period)
```

**Frontend Implementation**:
- Dashboard receives `period` in response
- UI shows "Дані за сьогодні" або "Дані за вчора" badge
- Manual toggle: Today | Yesterday

**Alternatives Rejected**:
- Frontend-only logic: зайвий запит для перевірки
- Always show both: захаращує UI

---

### 7. Empty States

**Question**: Як обробляти empty states для різних сценаріїв?

**Decision**: Використати EmptyState pattern component з Design System

**Rationale**:
- Existing pattern: `frontend/src/shared/patterns/EmptyState.tsx`
- Variants: default, card, compact, inline
- Підтримує icon, title, description, action button

**Existing Code Analysis**:
```tsx
// frontend/src/shared/patterns/EmptyState.tsx
<EmptyState
  icon={InboxIcon}
  title="No messages yet"
  description="Messages will appear here"
  action={<Button>Add first message</Button>}
/>
```

**Scenarios per Spec**:
| Scenario | Icon | Title | Action |
|----------|------|-------|--------|
| No messages today/yesterday | InboxIcon | "Ще немає активності" | — |
| No atoms to review | CheckCircleIcon | "Все готово!" | — |
| No topics configured | FolderIcon | "Створіть перший топік" | "Створити топік" |
| AI extraction failed | AlertTriangleIcon | "Помилка екстракції" | "Повторити" |

**Alternatives Rejected**:
- Custom empty states: порушує DRY
- Hiding sections: погано для UX

---

## Summary of Decisions

| Area | Decision | Existing/New |
|------|----------|--------------|
| Dashboard Metrics | New endpoint `/dashboard/metrics` | NEW |
| Signal/Noise Filter | Use `noise_classification` field | EXISTING |
| Atoms Grouping | Frontend groupBy with `AtomType` | EXISTING |
| Bulk Approve | Use `POST /atoms/bulk-approve` | EXISTING |
| Bulk Reject | Create `POST /atoms/bulk-reject` | NEW |
| Topics Navigation | Use `GET /topics/recent` | EXISTING |
| Period Toggle | Backend auto-detection | NEW |
| Empty States | EmptyState pattern component | EXISTING |

## Open Questions Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved:
- ✅ API endpoints identified (existing + 2 new)
- ✅ Model fields confirmed (noise_classification, AtomType, user_approved)
- ✅ Frontend patterns established (Design System, tokens, patterns)
- ✅ Performance approach defined (single aggregated endpoint)

---

**Next Step**: Phase 1 — Create data-model.md and contracts/
