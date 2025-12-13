# Research: Executive Summary Epic

**Date**: 2025-12-13
**Status**: Complete

## Research Questions

### 1. How to filter atoms by type and time period?

**Decision**: Use existing DashboardService pattern with SQLAlchemy date filtering

**Rationale**: DashboardService (`backend/app/services/dashboard_service.py`) already implements:
- Period detection (today/yesterday/auto)
- Date range filtering: `Atom.created_at >= start AND Atom.created_at < end`
- By-type aggregation with dict accumulation

**IMPORTANT - AtomType alignment with PRD:**

PRD defines 9 atom types (Частина 6.1):
- Core: `decision`, `problem`, `solution`, `question`
- Knowledge: `insight`, `idea`
- PM: `blocker`, `risk`, `requirement`

Current code has 7 types (missing: `blocker`, `idea`, `risk`; extra: `pattern`)

**Executive Summary filters by:**
- `decision` — key decisions made
- `blocker` — what blocks progress (NOT `problem`!)

`problem` ≠ `blocker`:
- `problem` = "API is slow at 1K requests" (identified issue)
- `blocker` = "Waiting for design from client" (blocks progress)

**Pattern from existing code**:
```python
base_query = select(Atom).where(
    Atom.created_at >= start,
    Atom.created_at < end,
)
# Filter by type - DECISION and BLOCKER per PRD
query = base_query.where(Atom.type.in_(["decision", "blocker"]))
# Filter by approval status
query = query.where(Atom.user_approved == True)
```

**Pre-requisite task**: Add missing atom types to `AtomType` enum before implementing Executive Summary.

**Alternatives considered**:
- Raw SQL with CTE - rejected (adds complexity without benefit)
- Elasticsearch - rejected (atoms count is low, PostgreSQL sufficient)

### 2. How to group atoms by topics?

**Decision**: JOIN through topic_atoms table, aggregate in Python

**Rationale**: Existing AtomCRUD.list_by_topic() shows the pattern:
```python
query = (
    select(Atom)
    .join(TopicAtom, TopicAtom.atom_id == Atom.id)
    .where(TopicAtom.topic_id == topic_id)
)
```

For Executive Summary, we need reverse - group atoms by topic:
```python
query = (
    select(Atom, Topic.name, Topic.icon, Topic.color)
    .join(TopicAtom, TopicAtom.atom_id == Atom.id)
    .join(Topic, Topic.id == TopicAtom.topic_id)
    .where(...)
)
# Group in Python: dict[topic_id, list[Atom]]
```

**Alternatives considered**:
- GROUP BY in SQL with JSON aggregation - rejected (complex, PostgreSQL JSON support varies)
- Multiple queries per topic - rejected (N+1 problem)

### 3. Export format: Markdown vs Plain Text?

**Decision**: Markdown format with copy-friendly structure

**Rationale**:
- Spec FR-007 says "текстовий формат" (text format)
- FR-009 says "форматування зберігається при копіюванні"
- Markdown renders well in Telegram, Slack, email
- CEO can paste into any chat with proper formatting

**Format structure**:
```markdown
# Executive Summary: 7-14 грудня 2025

## Статистика
- Рішень: 12
- Блокерів: 3
- Активних проєктів: 5

## Блокери (потребують уваги)

### 📁 Mobile App Development
- **[BLOCKER]** API latency exceeds 500ms threshold
  _Дата: 12 грудня | Джерело: #dev-mobile_

## Рішення

### 📁 Mobile App Development
- **[DECISION]** Adopted React Native for cross-platform
  _Дата: 10 грудня | Джерело: #architecture_
```

**Alternatives considered**:
- Plain text without formatting - rejected (loses structure on paste)
- PDF export - rejected (YAGNI for MVP, spec says "текстовий формат")
- JSON export - rejected (not human-readable)

### 4. Period selection: Fixed presets vs Custom date range?

**Decision**: Fixed presets only (7, 14, 30 days)

**Rationale**:
- Spec FR-010 explicitly lists: "7 днів, 14 днів, 30 днів"
- Custom date range adds complexity without clear user need
- CEO typically reviews weekly/bi-weekly

**Implementation**:
```typescript
type SummaryPeriod = 7 | 14 | 30;
const periods = [
  { value: 7, label: "Останній тиждень" },
  { value: 14, label: "Останні 2 тижні" },
  { value: 30, label: "Останній місяць" },
];
```

**Alternatives considered**:
- Date picker with custom range - rejected (adds UI complexity, not in spec)
- Additional presets (3 days, quarter) - rejected (YAGNI)

### 5. Blockers highlighting: Old blockers (>14 days)?

**Decision**: Visual distinction for blockers older than 14 days

**Rationale**:
- Spec edge case: "застарілі блокери як критичні (потребують уваги)"
- Business logic: blocker unresolved >2 weeks = escalation needed

**Implementation**:
- Badge variant: `critical` for >14 days old, `warning` for 7-14 days, `default` for <7 days
- Sort blockers first, then by age (oldest first within blockers)

### 6. API response structure for frontend consumption?

**Decision**: Single endpoint with nested structure by topic

**Rationale**:
- Reduces HTTP requests (1 instead of N per topic)
- Frontend can render immediately without additional fetches
- Consistent with existing dashboard/metrics pattern

**Response structure**:
```json
{
  "period_days": 7,
  "period_start": "2025-12-07T00:00:00Z",
  "period_end": "2025-12-14T00:00:00Z",
  "stats": {
    "decisions_count": 12,
    "blockers_count": 3,
    "active_topics_count": 5
  },
  "blockers": [
    {
      "id": "uuid",
      "type": "problem",
      "title": "...",
      "content": "...",
      "created_at": "...",
      "topic": { "id": "uuid", "name": "...", "icon": "...", "color": "..." },
      "is_stale": true,
      "days_old": 16
    }
  ],
  "decisions_by_topic": {
    "topic-uuid-1": {
      "topic": { "id": "uuid", "name": "...", "icon": "...", "color": "..." },
      "decisions": [...]
    }
  }
}
```

### 7. Cross-project view: How to handle "projects"?

**Decision**: Topics = Projects (no separate Project entity)

**Rationale**:
- Spec says "групувати по проєктах або топіках" (FR-004)
- Current system uses Topics as organizational units
- Adding separate "Project" entity violates YAGNI
- Topics already have icons and colors for visual distinction

**Note**: If future Project entity is added, refactor to group by project_id instead of topic_id.

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **PRE-REQ: AtomType sync** | Add blocker, idea, risk to enum | PRD defines 9 types, code has 7 |
| Filtering | SQLAlchemy date + type filter (decision, blocker) | Existing pattern in DashboardService |
| Grouping | JOIN + Python dict aggregation | Simple, avoids N+1 |
| Export format | Markdown | Copy-paste friendly, spec requirement |
| Period selection | Fixed presets (7/14/30) | Spec requirement, KISS |
| Blocker highlighting | >14 days = critical | Business rule from spec edge case |
| API structure | Single endpoint, nested response | Reduces round trips |
| Project concept | Use Topics | YAGNI, no separate entity |
| US-011 scope | Include in Epic 2 | PRD groups US-010 + US-011 together |

## Dependencies Identified

- `backend/app/services/dashboard_service.py` - pattern reference
- `backend/app/models/atom.py` - AtomType enum, AtomPublic schema
- `backend/app/models/topic.py` - TopicPublic schema
- `frontend/src/shared/ui/` - Badge, Card, Button components
- `frontend/src/shared/components/DataTable/` - for decisions list

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Slow query with large atom count | Low | Medium | Add index on created_at + type |
| Export timeout for 100+ atoms | Low | Low | Use streaming/background generation |
| Topic grouping misses orphan atoms | Medium | Low | Show "Uncategorized" section |

## Next Steps

1. Create data-model.md with detailed schemas
2. Create contracts/api.yaml with OpenAPI spec
3. Create quickstart.md with dev setup
