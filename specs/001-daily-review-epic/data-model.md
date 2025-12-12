# Data Model: Daily Review Epic

**Branch**: `001-daily-review-epic` | **Date**: 2025-12-13

## Overview

Daily Review Epic використовує переважно існуючі моделі з мінімальними доповненнями. Нові схеми потрібні тільки для Dashboard API responses.

---

## Existing Entities (No Changes)

### Message

**Location**: `backend/app/models/message.py`

```
┌─────────────────────────────────────────────────────────────┐
│ Message                                                      │
├─────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                               │
│ external_message_id: str                                    │
│ content: str                                                │
│ sent_at: datetime                                           │
│ source_id: int (FK → sources)                               │
│ author_id: int (FK → users)                                 │
│ topic_id: UUID (FK → topics, nullable)                      │
│ ─────────────────────────────────────────────────────────── │
│ noise_classification: str (signal/noise/spam/low/high)     │
│ importance_score: float (0.0-1.0)                           │
│ noise_factors: JSONB                                        │
│ ─────────────────────────────────────────────────────────── │
│ classification: str (nullable)                              │
│ confidence: float (0.0-1.0)                                 │
│ analyzed: bool                                              │
│ analysis_status: str (pending/analyzed/spam/noise)          │
│ ─────────────────────────────────────────────────────────── │
│ status: str (pending/approved/rejected)                     │
│ approved_at: datetime (nullable)                            │
│ rejected_at: datetime (nullable)                            │
│ rejection_reason: str (nullable)                            │
│ ─────────────────────────────────────────────────────────── │
│ created_at: datetime                                        │
│ updated_at: datetime                                        │
└─────────────────────────────────────────────────────────────┘
```

**Used Fields for Daily Review**:
- `noise_classification` — for Signal/Noise filter (FR-007, FR-008)
- `importance_score` — for importance badge display
- `topic_id` — for Topics navigation
- `sent_at` — for time-based filtering

---

### Atom

**Location**: `backend/app/models/atom.py`

```
┌─────────────────────────────────────────────────────────────┐
│ Atom                                                         │
├─────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                               │
│ type: str (problem/solution/decision/question/insight/      │
│            pattern/requirement)                              │
│ title: str (max 200)                                        │
│ content: str                                                │
│ ─────────────────────────────────────────────────────────── │
│ confidence: float (0.0-1.0, nullable)                       │
│ user_approved: bool (default: false)                        │
│ archived: bool (default: false)                             │
│ archived_at: datetime (nullable)                            │
│ ─────────────────────────────────────────────────────────── │
│ meta: JSONB (nullable)                                      │
│ embedding: Vector(1536) (nullable)                          │
│ ─────────────────────────────────────────────────────────── │
│ created_at: datetime                                        │
│ updated_at: datetime                                        │
└─────────────────────────────────────────────────────────────┘
```

**Used Fields for Daily Review**:
- `type` — for grouping atoms by type (FR-012)
- `user_approved` — for approve/reject actions (FR-014, FR-015)
- `created_at` — for "today's atoms" filter

**Note**: Spec mentions TASK, IDEA, BLOCKER, RISK types — these are NOT in current enum. Using existing 7 types for MVP.

---

### Topic

**Location**: `backend/app/models/topic.py`

```
┌─────────────────────────────────────────────────────────────┐
│ Topic                                                        │
├─────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                               │
│ name: str (unique, max 100)                                 │
│ description: str                                            │
│ icon: str (Heroicon name, max 50, nullable)                 │
│ color: str (hex #RRGGBB, max 7, nullable)                   │
│ ─────────────────────────────────────────────────────────── │
│ embedding: Vector(1536) (nullable)                          │
│ ─────────────────────────────────────────────────────────── │
│ created_at: datetime                                        │
│ updated_at: datetime                                        │
└─────────────────────────────────────────────────────────────┘
```

**Relationships**:
- `TopicAtom` (M2M): topic_id, atom_id, position, note
- `Message.topic_id` (FK): one topic per message

---

### TopicAtom (Junction Table)

**Location**: `backend/app/models/atom.py`

```
┌─────────────────────────────────────────────────────────────┐
│ TopicAtom                                                    │
├─────────────────────────────────────────────────────────────┤
│ topic_id: UUID (PK, FK → topics)                            │
│ atom_id: UUID (PK, FK → atoms)                              │
│ position: int (nullable)                                    │
│ note: str (nullable)                                        │
│ ─────────────────────────────────────────────────────────── │
│ created_at: datetime                                        │
│ updated_at: datetime                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Existing Enums

### NoiseClassification

**Location**: `backend/app/models/enums.py:116-123`

```python
class NoiseClassification(str, Enum):
    signal = "signal"
    noise = "noise"
    spam = "spam"
    low_quality = "low_quality"
    high_quality = "high_quality"
```

**Usage**: Message.noise_classification, API filter parameter

---

### AtomType

**Location**: `backend/app/models/atom.py:15-24`

```python
class AtomType(str, Enum):
    problem = "problem"
    solution = "solution"
    decision = "decision"
    question = "question"
    insight = "insight"
    pattern = "pattern"
    requirement = "requirement"
```

**Usage**: Atom.type, grouping in UI

---

## New Schemas (API Responses)

### DashboardMetricsResponse

**Location**: NEW `backend/app/api/v1/schemas/dashboard.py`

```python
class MessageStats(BaseModel):
    """Message statistics for dashboard."""
    total: int
    signal_count: int
    noise_count: int
    signal_ratio: float  # signal_count / total

class AtomStats(BaseModel):
    """Atom statistics by type and status."""
    total: int
    pending_review: int  # user_approved = false, archived = false
    approved: int        # user_approved = true
    by_type: dict[str, int]  # {problem: 5, decision: 3, ...}

class TopicStats(BaseModel):
    """Topic activity summary."""
    total: int
    active_today: int    # topics with messages today

class TrendData(BaseModel):
    """Comparison with previous period."""
    current: int
    previous: int
    change_percent: float
    direction: Literal["up", "down", "neutral"]

class DashboardMetricsResponse(BaseModel):
    """Complete dashboard metrics response."""
    period: Literal["today", "yesterday"]
    period_label: str  # "Дані за сьогодні" | "Дані за вчора"
    messages: MessageStats
    atoms: AtomStats
    topics: TopicStats
    trends: dict[str, TrendData]  # messages, atoms, topics
    generated_at: datetime
```

---

### BulkRejectRequest/Response

**Location**: NEW `backend/app/models/atom.py` (extend existing)

```python
class BulkRejectRequest(SQLModel):
    """Request schema for bulk rejecting atoms."""
    atom_ids: list[str] = Field(
        min_length=1,
        description="List of atom IDs to reject (UUID strings)",
    )

class BulkRejectResponse(SQLModel):
    """Response schema for bulk reject operation."""
    rejected_count: int = Field(
        description="Number of atoms successfully rejected",
    )
    failed_ids: list[str] = Field(
        default_factory=list,
        description="List of atom IDs that failed to reject",
    )
    errors: list[str] = Field(
        default_factory=list,
        description="Error messages for failed rejections",
    )
```

---

## Entity Relationships Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Source    │     │     User     │     │    Topic     │
│              │     │              │     │              │
│ id: int (PK) │     │ id: int (PK) │     │ id: UUID(PK) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1                  │ 1                  │ M
       │                    │                    │
       ▼ N                  ▼ N                  ▼
┌──────────────────────────────────────────────────────────┐
│                        Message                            │
│                                                           │
│ id: UUID (PK)                                            │
│ source_id: int (FK) ─────────────────────────────────────┤
│ author_id: int (FK) ─────────────────────────────────────┤
│ topic_id: UUID (FK, nullable) ───────────────────────────┤
│ noise_classification: str                                │
│ importance_score: float                                  │
└──────────────────────────────────────────────────────────┘

┌──────────────┐           ┌──────────────┐
│    Topic     │ M       M │     Atom     │
│              │◄─────────►│              │
│ id: UUID(PK) │           │ id: UUID(PK) │
└──────────────┘           └──────────────┘
       │                          │
       │                          │
       ▼                          ▼
┌──────────────────────────────────────────┐
│              TopicAtom (M2M)              │
│                                           │
│ topic_id: UUID (PK, FK)                  │
│ atom_id: UUID (PK, FK)                   │
│ position: int                            │
│ note: str                                │
└──────────────────────────────────────────┘
```

---

## Validation Rules

### Message

| Field | Rule |
|-------|------|
| noise_classification | Must be valid NoiseClassification enum value |
| importance_score | Must be 0.0-1.0 |

### Atom

| Field | Rule |
|-------|------|
| type | Must be valid AtomType enum value |
| title | 1-200 characters |
| content | Required, non-empty |
| user_approved | Cannot be true if archived = true |

### Topic

| Field | Rule |
|-------|------|
| name | 1-100 characters, unique |
| description | Required, non-empty |
| color | Valid hex format #RRGGBB or Tailwind name (auto-converted) |

---

## State Transitions

### Atom Review Status

```
┌─────────────┐
│   DRAFT     │ (user_approved=false, archived=false)
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  APPROVED   │     │  REJECTED   │
│             │     │ (archived)  │
└─────────────┘     └─────────────┘
```

**Note**: Spec mentions PENDING_REVIEW status — in current model this is `user_approved=false AND archived=false`.

### Message Classification

```
┌─────────────┐
│   PENDING   │ (noise_classification=null)
└──────┬──────┘
       │ AI Classification
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SIGNAL    │     │    NOISE    │     │    SPAM     │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## Summary

| Entity | Status | Changes Needed |
|--------|--------|----------------|
| Message | EXISTING | None |
| Atom | EXISTING | None |
| Topic | EXISTING | None |
| TopicAtom | EXISTING | None |
| NoiseClassification | EXISTING | None |
| AtomType | EXISTING | None |
| DashboardMetricsResponse | NEW | Create schema |
| BulkRejectRequest/Response | NEW | Add to atom.py |

**Total New Code**:
- 1 new schema file: `backend/app/api/v1/schemas/dashboard.py`
- 2 new Pydantic models in existing `atom.py`
