# Card Components Audit Summary

**Generated:** 2026-01-03
**Beads Issue:** task-tracker-cnz
**Epic:** task-tracker-be6 (Card Readability & UX Architecture Overhaul)

---

## TL;DR

| Metric | Value |
|--------|-------|
| Production Card Files | 20 |
| Total Lines of Code | 3,604 |
| Cards with P0 Violations | 10 (50%) |
| Cards with P1 Violations | 17 (85%) |
| Estimated Fix Time | 28-32 hours |

---

## Top 5 Issues

### 1. Missing Tooltips on Truncated Content (P0)

**Impact:** Users cannot read full text when content is truncated.

- **Affected:** 17/20 cards (85%)
- **Total instances:** 31 truncations without tooltips
- **Pattern:** `truncate` / `line-clamp-*` used without `<Tooltip>` wrapper

**Example (AgentCard.tsx:83):**
```tsx
// CURRENT: Truncated, user cannot see full name
<h3 className="font-semibold text-lg truncate">{agent.name}</h3>

// REQUIRED: Tooltip shows full content on hover
<Tooltip content={agent.name}>
  <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
</Tooltip>
```

### 2. Touch Targets Under 44px (P0)

**Impact:** Mobile users struggle to tap buttons accurately.

- **Affected:** 2 cards (AgentCard, BotInfoCard)
- **Total instances:** 6 icon buttons
- **Pattern:** `size="icon"` defaults to 36px, needs explicit `h-11 w-11`

**Example (AgentCard.tsx:90-122):**
```tsx
// CURRENT: 36x36px touch target
<Button size="icon" variant="ghost">

// REQUIRED: 44x44px touch target
<Button size="icon" variant="ghost" className="h-11 w-11">
```

### 3. Font Size Too Small (P1)

**Impact:** Reduced readability, especially on mobile.

- **Affected:** 13 cards
- **Total instances:** ~28 problematic uses of `text-xs` on body content
- **Pattern:** `text-xs` (12px) used for data that should be `text-sm` (14px)

### 4. Low Contrast Text (P1)

**Impact:** WCAG AA failure (4.5:1 required for small text).

- **Affected:** 17 cards
- **Total instances:** 60 uses of `text-muted-foreground`
- **Issue:** Combined with `text-xs`, contrast ratio drops below 4.5:1

### 5. Non-Responsive Cards (P2)

**Impact:** Poor layout on mobile devices.

- **Affected:** 6 cards
- **Pattern:** No `sm:`, `md:`, `lg:` breakpoint classes

---

## Pattern Analysis

### Pattern A: Title + Actions in Header

**Count:** 7 cards
**Files:** AgentCard, ProjectCard, SourceCard, SettingsCard, CardWithStatus, BotInfoCard, HealthCards

**Current Implementation:**
```tsx
<div className="flex items-start justify-between">
  <h3 className="truncate">{title}</h3>
  <div className="flex gap-2">
    {/* 3-5 icon buttons */}
  </div>
</div>
```

**Issues:**
- Title competes with actions for space
- Actions don't collapse on mobile
- No tooltips on truncated titles

**Recommended Pattern:** Use `CardHeaderWithActions` component from `shared/ui`

---

### Pattern B: 2-Column Data Grid

**Count:** 8 cards
**Files:** AgentCard, ProjectCard, MessageCard, HealthCards, AtomCard, ScoringAccuracyCard, MetricCard, AutomationStatsCards

**Current Implementation:**
```tsx
<div className="grid grid-cols-2 gap-2">
  <div>
    <span className="text-muted-foreground">Label</span>
    <p className="text-xs">{value}</p>
  </div>
</div>
```

**Issues:**
- No responsive collapse to single column
- Labels use muted color with small font
- Values use text-xs

**Recommended Pattern:** Use `DataList` component with responsive props

---

### Pattern C: Expandable Content

**Count:** 2 cards
**Files:** AtomCard (version history dialog), SignalNoiseCard (expand/collapse)

**Current Implementation:** Custom useState + Dialog/Collapsible

**Recommended Pattern:** Extract to `ExpandableCard` variant

---

### Pattern D: Badge + Title Conflict

**Count:** 5 cards
**Files:** MessageCard, AtomCard, ProjectCard, TopicSearchCard, HealthCards

**Current Implementation:**
```tsx
<div className="flex items-center gap-2">
  <h3 className="truncate">{title}</h3>
  <Badge>{status}</Badge>
</div>
```

**Issues:**
- Badge takes space from title
- Title truncates too aggressively
- No tooltip on truncated title

**Recommended Pattern:** Move badge to separate row or use `CardHeaderWithBadge`

---

## Complexity Analysis

### Most Complex Cards (by score)

| File | Lines | Hooks | Props | Score |
|------|-------|-------|-------|-------|
| SignalNoiseCard.tsx | 459 | 4 | 15+ | 17 |
| CardActions.tsx | 446 | 0 | 10+ | 10 |
| SettingsCard.tsx | 351 | 2 | 8 | 9 |
| ProjectCard.tsx | 237 | 0 | 8 | 5 |
| CardWithStatus.tsx | 232 | 0 | 12 | 5 |

### Simplest Cards

| File | Lines | Hooks | Props | Score |
|------|-------|-------|-------|-------|
| BotInfoCard.tsx | 52 | 0 | 0 | 1 |
| WebVitalsCards.tsx | 56 | 0 | 2 | 1 |
| InstructionsCard.tsx | 56 | 0 | 0 | 1 |

---

## Recommendations for Phase 2

### Priority 1: Quick Wins (8h total)

1. **Add TruncatedText component** (2h)
   - Wraps text with Tooltip
   - Auto-detects truncation
   - Use across all cards

2. **Fix AgentCard touch targets** (1h)
   - Add `h-11 w-11` to all 5 icon buttons

3. **Fix MessageCard tooltips** (1.5h)
   - Wrap author name, badges with Tooltip

4. **Fix AtomCard** (1.5h)
   - Add tooltips to title, content
   - Add responsive classes

5. **Fix TopicSearchCard** (1h)
   - Add tooltips
   - Add responsive classes

### Priority 2: Pattern Extraction (8h total)

1. **Create CardHeaderWithActions** (3h)
   - Responsive action collapse
   - Title with tooltip
   - Badge slot

2. **Create DataList component** (2h)
   - Label/value pairs
   - Responsive 2-col to 1-col
   - Proper typography

3. **Update CardWithStatus** (3h)
   - Use new components
   - Add tooltips
   - Document as reference

### Priority 3: Complex Refactors (12h total)

1. **ProjectCard refactor** (4h)
   - Use DataList for all sections
   - Responsive grid
   - Action button sizes

2. **SignalNoiseCard refactor** (5h)
   - Simplify state management
   - Extract sub-components
   - Use patterns

3. **SettingsCard refactor** (3h)
   - Use CardHeaderWithActions
   - Proper responsive

---

## Files Reference

| Deliverable | Path |
|-------------|------|
| This summary | `.audit/audit-summary.md` |
| Detailed violations | `.audit/violations-detailed.md` |
| Inventory CSV | `.audit/card-inventory.csv` |
| Violations CSV | `.audit/wcag-violations.csv` |
| Complexity CSV | `.audit/card-complexity.csv` |
| Audit scripts | `scripts/audit/` |

---

## Next Steps

1. **Review this audit** with stakeholder
2. **Create Beads issues** for each Priority group
3. **Start Phase 2** with Quick Wins
4. **Update CLAUDE.md** with new card patterns

---

## Appendix: All Production Cards

| # | File | Lines | Feature | Violations |
|---|------|-------|---------|------------|
| 1 | AgentCard.tsx | 174 | agents | 19 |
| 2 | AgentCard.refactored.tsx | 215 | agents | NEW |
| 3 | AtomCard.tsx | 186 | atoms | 11 |
| 4 | AutomationStatsCards.tsx | 91 | automation | 4 |
| 5 | HealthCards.tsx | 124 | monitoring | 7 |
| 6 | ScoringAccuracyCard.tsx | 155 | monitoring | 8 |
| 7 | SignalNoiseCard.tsx | 459 | noise | 14 |
| 8 | WebVitalsCards.tsx | 56 | performance | 4 |
| 9 | ProjectCard.tsx | 237 | projects | 17 |
| 10 | MessageSearchCard.tsx | 114 | search | 8 |
| 11 | TopicSearchCard.tsx | 109 | search | 7 |
| 12 | MessageCard.tsx | 172 | pages | 12 |
| 13 | SettingsCard.tsx | 351 | pages | 8 |
| 14 | SourceCard.tsx | 78 | pages | 4 |
| 15 | TelegramCard.tsx | 87 | pages | 2 |
| 16 | BotInfoCard.tsx | 52 | pages | 3 |
| 17 | InstructionsCard.tsx | 56 | pages | 2 |
| 18 | MetricCard.tsx | 210 | shared | 5 |
| 19 | CardWithStatus.tsx | 232 | shared | 3 |
| 20 | CardActions.tsx | 446 | shared | 0 |
