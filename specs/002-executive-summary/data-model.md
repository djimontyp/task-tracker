# Data Model: Executive Summary Epic

**Date**: 2025-12-13
**Status**: Complete

## Overview

Executive Summary використовує **існуючі сутності** (Atom, Topic, TopicAtom) без створення нових таблиць. Нові schema classes потрібні лише для API responses.

## Existing Entities (Reference)

### Atom (backend/app/models/atom.py)

```python
class Atom(SQLModel, table=True):
    id: uuid.UUID              # Primary key
    type: str                  # AtomType enum value
    title: str                 # Brief summary (max 200)
    content: str               # Full content
    confidence: float | None   # AI confidence (0-1)
    user_approved: bool        # Approved for knowledge base
    archived: bool             # Soft delete / rejected
    archived_at: datetime | None
    meta: dict | None          # Additional metadata
    embedding: list[float] | None  # Vector for semantic search
    created_at: datetime
    updated_at: datetime

class AtomType(str, Enum):
    # PRD-defined types (Частина 6.1) - 9 types total
    # Core types
    decision = "decision"      # DECISION for Executive Summary
    problem = "problem"        # Identified issue/pain (NOT blocker!)
    solution = "solution"      # Solution to a problem
    question = "question"      # Open question
    # Knowledge types
    insight = "insight"        # Valuable conclusion
    idea = "idea"              # TODO: ADD - Proposal for consideration
    # PM types
    blocker = "blocker"        # TODO: ADD - BLOCKER for Executive Summary
    risk = "risk"              # TODO: ADD - Potential problem
    requirement = "requirement" # Product requirement
    # pattern = "pattern"      # TODO: DEPRECATE - not in PRD
```

**PRE-REQUISITE**: Before implementing Executive Summary, sync AtomType enum with PRD:
- Add: `blocker`, `idea`, `risk`
- Deprecate/remove: `pattern`

### Topic (backend/app/models/topic.py)

```python
class Topic(SQLModel, table=True):
    id: uuid.UUID
    name: str                  # Unique topic name
    description: str
    icon: str | None           # Lucide icon name
    color: str | None          # Hex color (#RRGGBB)
    embedding: list[float] | None
    created_at: datetime
    updated_at: datetime
```

### TopicAtom (backend/app/models/atom.py)

```python
class TopicAtom(SQLModel, table=True):
    topic_id: uuid.UUID        # FK to topics
    atom_id: uuid.UUID         # FK to atoms
    position: int | None       # Display order
    note: str | None           # Contextual note
    created_at: datetime
    updated_at: datetime
```

## New Schemas (API Response)

### ExecutiveSummaryStats

```python
class ExecutiveSummaryStats(BaseModel):
    """Aggregate statistics for the summary period."""

    decisions_count: int = Field(ge=0, description="Total DECISION atoms")
    blockers_count: int = Field(ge=0, description="Total BLOCKER atoms")
    active_topics_count: int = Field(ge=0, description="Topics with atoms in period")

    # Optional extended stats
    stale_blockers_count: int = Field(
        ge=0,
        default=0,
        description="Blockers older than 14 days"
    )
```

### TopicBrief

```python
class TopicBrief(BaseModel):
    """Minimal topic info for embedding in atom responses."""

    id: uuid.UUID
    name: str
    icon: str | None
    color: str | None
```

### ExecutiveSummaryAtom

```python
class ExecutiveSummaryAtom(BaseModel):
    """Atom with executive summary context."""

    id: uuid.UUID
    type: str                          # "decision" or "blocker"
    title: str
    content: str
    created_at: datetime

    # Topic association
    topic: TopicBrief | None

    # Executive summary specific
    days_old: int = Field(ge=0, description="Days since creation")
    is_stale: bool = Field(
        default=False,
        description="True if blocker and >14 days old"
    )

    # Source tracing
    source_message_id: uuid.UUID | None = Field(
        default=None,
        description="Original message ID if extracted from message"
    )
```

### TopicDecisions

```python
class TopicDecisions(BaseModel):
    """Decisions grouped under a topic."""

    topic: TopicBrief
    decisions: list[ExecutiveSummaryAtom]
    count: int = Field(ge=0)
```

### ExecutiveSummaryResponse

```python
class ExecutiveSummaryResponse(BaseModel):
    """Complete executive summary response."""

    # Period info
    period_days: int = Field(description="7, 14, or 30")
    period_start: datetime
    period_end: datetime
    period_label: str = Field(
        description="Human-readable period label",
        json_schema_extra={"example": "7 грудня - 14 грудня 2025"}
    )

    # Aggregate stats
    stats: ExecutiveSummaryStats

    # Blockers (flat list, sorted by severity)
    blockers: list[ExecutiveSummaryAtom] = Field(
        description="BLOCKER atoms sorted: stale first, then by date desc"
    )

    # Decisions grouped by topic
    decisions_by_topic: list[TopicDecisions] = Field(
        description="Decisions organized by topic"
    )

    # Uncategorized atoms (no topic association)
    uncategorized_decisions: list[ExecutiveSummaryAtom] = Field(
        default_factory=list,
        description="Decisions without topic"
    )

    # Metadata
    generated_at: datetime
```

### ExportFormat

```python
class ExportFormat(str, Enum):
    """Supported export formats."""

    markdown = "markdown"
    plain_text = "plain_text"
```

### ExportRequest

```python
class ExportRequest(BaseModel):
    """Export configuration."""

    period_days: int = Field(default=7, ge=7, le=30)
    format: ExportFormat = Field(default=ExportFormat.markdown)
    include_stats: bool = Field(default=True)
    include_blockers: bool = Field(default=True)
    include_decisions: bool = Field(default=True)
```

### ExportResponse

```python
class ExportResponse(BaseModel):
    """Export result."""

    content: str = Field(description="Formatted report content")
    format: ExportFormat
    filename: str = Field(
        description="Suggested filename",
        json_schema_extra={"example": "executive-summary-2025-12-14.md"}
    )
    generated_at: datetime
```

## Query Patterns

### Get Summary Data

```python
async def get_executive_summary(
    session: AsyncSession,
    period_days: int = 7,
) -> ExecutiveSummaryResponse:
    """
    Main query for executive summary.

    Steps:
    1. Calculate period boundaries
    2. Fetch DECISION and BLOCKER atoms (approved only)
    3. Join with topics via topic_atoms
    4. Group by topic in Python
    5. Calculate days_old and is_stale
    """
    now = datetime.utcnow()
    period_start = now - timedelta(days=period_days)

    # Fetch atoms with topics
    query = (
        select(Atom, Topic)
        .outerjoin(TopicAtom, TopicAtom.atom_id == Atom.id)
        .outerjoin(Topic, Topic.id == TopicAtom.topic_id)
        .where(
            Atom.created_at >= period_start,
            Atom.user_approved == True,
            Atom.archived == False,
            Atom.type.in_(["decision", "blocker"]),
        )
        .order_by(Atom.created_at.desc())
    )

    result = await session.execute(query)
    rows = result.all()

    # Group and transform...
```

### Get Atoms by Type for Period

```python
# Decisions
select(Atom).where(
    Atom.type == "decision",
    Atom.user_approved == True,
    Atom.archived == False,
    Atom.created_at >= period_start,
)

# Blockers
select(Atom).where(
    Atom.type == "blocker",
    Atom.user_approved == True,
    Atom.archived == False,
    Atom.created_at >= period_start,
)
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| period_days | Must be 7, 14, or 30 | "Period must be 7, 14, or 30 days" |
| export format | Must be valid enum | "Invalid format. Use: markdown, plain_text" |

## State Transitions

Executive Summary uses **read-only** access to atoms. No state transitions introduced.

Atom approval flow (external to this feature):
```
DRAFT → PENDING_REVIEW → APPROVED (visible in summary) / REJECTED (archived)
```

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    Executive Summary View                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────┐         ┌────────────┐         ┌─────────┐  │
│    │  Atom   │─────────│ TopicAtom  │─────────│  Topic  │  │
│    │(decision│   M:N   │ (junction) │   M:N   │(project)│  │
│    │ problem)│         │            │         │         │  │
│    └─────────┘         └────────────┘         └─────────┘  │
│         │                                          │        │
│         │ Filter:                                  │        │
│         │ - user_approved=true                     │        │
│         │ - archived=false                         │        │
│         │ - created_at >= period_start             │        │
│         │ - type IN (decision, problem)            │        │
│         │                                          │        │
│         ▼                                          ▼        │
│    ┌─────────────────────────────────────────────────────┐ │
│    │           ExecutiveSummaryResponse                  │ │
│    │  - blockers: [atom + topic]                         │ │
│    │  - decisions_by_topic: {topic: [atoms]}             │ │
│    │  - stats: {counts}                                  │ │
│    └─────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Types (TypeScript)

```typescript
// types/index.ts

export interface TopicBrief {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface ExecutiveSummaryAtom {
  id: string;
  type: 'decision' | 'blocker';
  title: string;
  content: string;
  created_at: string;
  topic: TopicBrief | null;
  days_old: number;
  is_stale: boolean;
  source_message_id: string | null;
}

export interface ExecutiveSummaryStats {
  decisions_count: number;
  blockers_count: number;
  active_topics_count: number;
  stale_blockers_count: number;
}

export interface TopicDecisions {
  topic: TopicBrief;
  decisions: ExecutiveSummaryAtom[];
  count: number;
}

export interface ExecutiveSummaryResponse {
  period_days: number;
  period_start: string;
  period_end: string;
  period_label: string;
  stats: ExecutiveSummaryStats;
  blockers: ExecutiveSummaryAtom[];
  decisions_by_topic: TopicDecisions[];
  uncategorized_decisions: ExecutiveSummaryAtom[];
  generated_at: string;
}

export type SummaryPeriod = 7 | 14 | 30;

export type ExportFormat = 'markdown' | 'plain_text';

export interface ExportResponse {
  content: string;
  format: ExportFormat;
  filename: string;
  generated_at: string;
}
```

## Database Indexes (Recommended)

No new indexes required. Existing indexes on Atom:
- `atoms_pkey` on `id`
- `ix_atoms_title` on `title`

Consider adding if performance issues:
```sql
CREATE INDEX ix_atoms_type_approved_created
ON atoms (type, user_approved, created_at DESC)
WHERE archived = false;
```

## Migration

**No database migration required** - using existing tables only.
