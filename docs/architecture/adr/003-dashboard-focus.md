# ADR-003: Dashboard Focus — Actionable Items vs Statistics

**Date:** 2025-12-28
**Status:** Accepted
**Deciders:** maks, Claude
**Context Source:** Concept alignment session, user interview

## Context

The current Dashboard shows system statistics:
- Message counts
- Signal/noise ratio
- Activity heatmap (GitHub-style)
- Trend charts

**User feedback:**
> "Я зайшов, хочу побачити що там накапало за якийсь період. Побачив головні вектори — проблеми, рішення, інсайти. Далі переходжу до ознайомлення."

The user wants to see **actionable items**, not system metrics.

## Decision

Restructure Dashboard to focus on **"What's New Today"** instead of statistics.

### New Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRIMARY FOCUS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. GREETING + STATUS                                           │
│     "Good morning, Maks! 5 items need your attention"           │
│                                                                  │
│  2. TODAY'S FOCUS (Pending Atoms)                               │
│     - Top 3-5 atoms awaiting review                             │
│     - One-click approve/reject                                   │
│     - Link to full review page                                   │
│                                                                  │
│  3. NEW TODAY (Timeline)                                        │
│     - Atoms created today, sorted by time                       │
│     - Grouped by topic                                          │
│     - Quick preview with drill-down                             │
│                                                                  │
│  4. ACTIVE TOPICS                                               │
│     - Topics with recent activity                               │
│     - Visual cards with icons                                    │
│     - Click to explore                                          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     SECONDARY (Optional)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  5. QUICK STATS (Collapsed by default)                          │
│     - Problems: 3 (↑2)                                          │
│     - Decisions: 5 (↓1)                                         │
│     - Insights: 8 (→)                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What to Keep

| Component | Keep? | Reason |
|-----------|-------|--------|
| Greeting + Status | ✅ Yes | Personalization, quick summary |
| TodaysFocus | ✅ Yes (promote) | Primary action item |
| QuickStats | ✅ Yes (demote) | Useful but secondary |
| TopTopics | ✅ Yes | Navigation aid |

### What to Remove/Hide

| Component | Action | Reason |
|-----------|--------|--------|
| TrendChart | Remove | Statistics, not actionable |
| ActivityHeatmap | Remove | GitHub-style, not relevant |
| Signal/Noise ratio | Remove | System metric, not user value |
| Message counts | Remove | Raw data focus, wrong abstraction |

### What to Add

| Component | Purpose | Priority |
|-----------|---------|----------|
| NewTodayTimeline | Show today's atoms chronologically | P0 |
| PeriodSelector | Today / Yesterday / This Week | P1 |
| EmptyState | Guide when no data | P0 |

## Consequences

### Benefits

1. **User-focused:** Shows what matters to the user
2. **Actionable:** Every item leads to an action
3. **Fast scanning:** 30 seconds to understand current state
4. **Progressive disclosure:** Details available on drill-down

### Trade-offs

1. **Statistics hidden:** Users who want metrics need to go elsewhere
   - *Mitigation:* Add Analytics page for power users

2. **Less visual variety:** Fewer charts and graphs
   - *Mitigation:* Active Topics cards provide visual interest

3. **More API calls:** Need real-time data for TodaysFocus
   - *Mitigation:* Aggressive caching, WebSocket updates

## Implementation Plan

### Phase 1: Core Restructure
1. Add `GET /atoms?status=pending_review&limit=5` endpoint
2. Implement real TodaysFocus component (replace mock)
3. Remove TrendChart and ActivityHeatmap

### Phase 2: Timeline
1. Add NewTodayTimeline component
2. Implement `GET /atoms?created_after=today` endpoint
3. Group by time periods (morning, afternoon, evening)

### Phase 3: Polish
1. Add PeriodSelector
2. Improve empty states
3. Add skeleton loading
4. WebSocket integration for real-time updates

## Alternatives Considered

### Alternative A: Keep Statistics, Add Actionable Section

Add TodaysFocus above existing statistics.

**Rejected because:** Increases cognitive load. User still sees irrelevant data.

### Alternative B: Tabbed Dashboard (Actionable | Analytics)

Two tabs: "Today" for actionable, "Analytics" for statistics.

**Rejected because:** Adds complexity. Most users only need "Today".

### Alternative C: Customizable Dashboard

Let users choose widgets.

**Rejected because:** Over-engineering for current stage. Consider for v2.

## Related

- ADR-002: Entity Hierarchy
- PRD: Knowledge Discovery
- `.obsidian-docs/знання/концепції/user-journey.md`
