# Card Components - Detailed Violations Report

Generated: 2026-01-03

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Production Cards | 20 |
| Total Lines of Code | 3,604 |
| Cards with Violations | 17 (85%) |
| Total P0 Violations | 14 |
| Total P1 Violations | 48 |
| Total P2 Violations | 6 |

---

## P0 - Critical Violations (Blocking)

### 1. Missing Tooltips on Truncated Content

**Issue:** Cards use `truncate` or `line-clamp-*` without providing tooltips, making content unreadable.

| File | Line | Code | Truncation Type |
|------|------|------|-----------------|
| `features/agents/components/AgentCard.tsx` | 83 | `truncate` on h3 | Title |
| `features/agents/components/AgentCard.tsx` | 85 | `line-clamp-2` | Description |
| `features/agents/components/AgentCard.tsx` | 136 | `truncate` on model_name | Data |
| `features/agents/components/AgentCard.tsx` | 156 | `line-clamp-2` on system_prompt | Content |
| `pages/MessagesPage/MessageCard.tsx` | 103 | `truncate` on author name | Title |
| `pages/MessagesPage/MessageCard.tsx` | 120 | `line-clamp-3` | Content |
| `pages/MessagesPage/MessageCard.tsx` | 126,131,136 | `truncate` on badges | Metadata |
| `features/atoms/components/AtomCard.tsx` | 126 | `line-clamp-2` on title | Title |
| `features/atoms/components/AtomCard.tsx` | 127 | `line-clamp-3` on content | Content |
| `features/projects/components/ProjectCard.tsx` | 69 | `truncate` on h3 | Title |
| `features/projects/components/ProjectCard.tsx` | 75 | `line-clamp-2` | Description |
| `features/projects/components/ProjectCard.tsx` | 135 | `line-clamp-1` on glossary | Data |
| `features/search/components/TopicSearchCard.tsx` | 94 | `truncate` on h3 | Title |
| `features/search/components/TopicSearchCard.tsx` | 100 | `line-clamp-2` | Description |
| `pages/SettingsPage/components/SettingsCard.tsx` | 214 | `truncate` on title | Title |
| `pages/SettingsPage/components/SettingsCard.tsx` | 215 | `line-clamp-2` | Description |
| `pages/SettingsPage/components/SourceCard.tsx` | 61 | `truncate` on h3 | Title |
| `pages/SettingsPage/components/SourceCard.tsx` | 66 | `line-clamp-2` | Description |
| `shared/patterns/CardWithStatus.tsx` | 149 | `truncate` on h3 | Title |
| `shared/patterns/CardWithStatus.tsx` | 156 | `line-clamp-2` | Description |
| `features/monitoring/components/HealthCards.tsx` | 53 | `truncate` on CardTitle | Title |
| `pages/SettingsPage/.../BotInfoCard.tsx` | 31-32 | `truncate` on both lines | Title/Subtitle |

**Cards WITH Tooltip implementation:** 3 files (CardActions.tsx only)
**Cards WITHOUT Tooltip:** 17 files (85%)

---

### 2. Touch Target Violations (<44px)

**Issue:** Icon buttons use `size="icon"` without explicit `h-11 w-11` classes.

| File | Line | Current | Required |
|------|------|---------|----------|
| `features/agents/components/AgentCard.tsx` | 90-122 | 5 buttons `size="icon"` NO h-11 | h-11 w-11 |
| `pages/SettingsPage/.../BotInfoCard.tsx` | 36 | `size="icon"` NO h-11 | h-11 w-11 |
| `features/noise/components/SignalNoiseCard.tsx` | 410 | `size="icon"` WITH h-11 w-11 | OK |
| `shared/patterns/CardActions.tsx` | 136,320,393,417 | WITH h-11 w-11 | OK |

**Affected icon buttons in AgentCard:** 5 (Edit, Copy, Settings, Test, Delete)
**Pattern:** shadcn Button `size="icon"` defaults to 36x36px (h-9 w-9), not 44px

---

## P1 - High Priority Violations

### 1. Font Size Too Small (text-xs for body content)

**Issue:** Using `text-xs` (12px) for content that should be readable.

| File | Lines | Count | Context |
|------|-------|-------|---------|
| `features/agents/components/AgentCard.tsx` | 136,143,149,156 | 4 | Data fields |
| `pages/MessagesPage/MessageCard.tsx` | 44,138 | 2 | Error, timestamp |
| `features/atoms/components/AtomCard.tsx` | 56,119,139,145,151 | 5 | Various |
| `features/projects/components/ProjectCard.tsx` | 36,86,102,131,146,176,200 | 7 | Multiple sections |
| `features/search/components/TopicSearchCard.tsx` | 32,95 | 2 | Error, badge |
| `features/search/components/MessageSearchCard.tsx` | 32,94,97,101 | 4 | Various |
| `features/monitoring/components/ScoringAccuracyCard.tsx` | 112,146 | 2 | Grid, footer |
| `features/monitoring/components/HealthCards.tsx` | 26 | 1 | Error |
| `features/noise/components/SignalNoiseCard.tsx` | 117,123,181,234,250,273,284,330,387 | 9 | Multiple |
| `features/automation/components/AutomationStatsCards.tsx` | 69,83 | 2 | Labels |
| `features/performance/components/WebVitalsCards.tsx` | 39,45 | 2 | Threshold |
| `pages/SettingsPage/components/SettingsCard.tsx` | 153,233 | 2 | Error, status |
| `pages/SettingsPage/components/SourceCard.tsx` | 39 | 1 | Error |

**Total text-xs occurrences in Cards:** 43
**Acceptable uses (badges, labels):** ~15
**Problematic uses (body content):** ~28

---

### 2. Contrast Issues (text-muted-foreground)

**Issue:** `text-muted-foreground` combined with `text-xs` fails WCAG AA (4.5:1 required).

| File | Occurrences |
|------|-------------|
| `features/agents/components/AgentCard.tsx` | 6 |
| `pages/MessagesPage/MessageCard.tsx` | 5 |
| `features/atoms/components/AtomCard.tsx` | 3 |
| `features/projects/components/ProjectCard.tsx` | 6 |
| `features/search/components/TopicSearchCard.tsx` | 2 |
| `features/search/components/MessageSearchCard.tsx` | 2 |
| `features/monitoring/components/ScoringAccuracyCard.tsx` | 6 |
| `features/monitoring/components/HealthCards.tsx` | 5 |
| `features/noise/components/SignalNoiseCard.tsx` | 5 |
| `features/automation/components/AutomationStatsCards.tsx` | 2 |
| `features/performance/components/WebVitalsCards.tsx` | 3 |
| `pages/SettingsPage/components/SettingsCard.tsx` | 4 |
| `pages/SettingsPage/components/SourceCard.tsx` | 2 |
| `shared/components/MetricCard/MetricCard.tsx` | 5 |
| `shared/patterns/CardWithStatus.tsx` | 1 |
| `pages/SettingsPage/.../BotInfoCard.tsx` | 1 |
| `pages/SettingsPage/.../InstructionsCard.tsx` | 2 |

**Total `text-muted-foreground` in Cards:** 60 occurrences

---

## P2 - Medium Priority Violations

### 1. Non-Responsive Cards

**Issue:** Cards without responsive breakpoint classes (`sm:`, `md:`, `lg:`).

| File | Lines | Status |
|------|-------|--------|
| `features/atoms/components/AtomCard.tsx` | 186 | NO responsive classes |
| `features/search/components/TopicSearchCard.tsx` | 109 | NO responsive classes |
| `features/search/components/MessageSearchCard.tsx` | 114 | NO responsive classes |
| `pages/SettingsPage/components/SettingsCard.tsx` | 351 | HAS responsive |
| `pages/SettingsPage/plugins/TelegramSource/TelegramCard.tsx` | 87 | NO responsive classes |
| `pages/SettingsPage/.../BotInfoCard.tsx` | 52 | NO responsive classes |
| `pages/SettingsPage/.../InstructionsCard.tsx` | 56 | NO responsive classes |
| `shared/patterns/CardWithStatus.tsx` | 232 | HAS responsive |

**Cards WITH responsive:** 14 files
**Cards WITHOUT responsive:** 6 files

---

## Individual Card Analysis

### 1. AgentCard.tsx (174 lines)

**Location:** `frontend/src/features/agents/components/AgentCard.tsx`

**Violations:**
- P0: 5 icon buttons without h-11 w-11 (lines 90-122)
- P0: 4 truncations without tooltips (lines 83, 85, 136, 156)
- P1: 4 text-xs on body content (lines 136, 143, 149, 156)
- P1: 6 text-muted-foreground usages

**Scores:**
- Readability: 5/10 (truncated titles, small fonts)
- Layout: 7/10 (good structure, needs responsive)
- Accessibility: 4/10 (touch targets, tooltips missing)

**Migration Complexity:** MEDIUM
**Estimated Hours:** 3-4h

---

### 2. MessageCard.tsx (172 lines)

**Location:** `frontend/src/pages/MessagesPage/MessageCard.tsx`

**Violations:**
- P0: 5 truncations without tooltips (lines 103, 117, 126, 131, 136)
- P1: 2 text-xs on content (lines 44, 138)
- P1: 5 text-muted-foreground usages

**Scores:**
- Readability: 6/10 (line-clamp-3 OK, badges truncated)
- Layout: 8/10 (good responsive, flex-wrap)
- Accessibility: 5/10 (h-11 on action buttons OK)

**Migration Complexity:** LOW
**Estimated Hours:** 2h

---

### 3. AtomCard.tsx (186 lines)

**Location:** `frontend/src/features/atoms/components/AtomCard.tsx`

**Violations:**
- P0: 2 truncations without tooltips (lines 126, 127)
- P1: 5 text-xs usages
- P1: 3 text-muted-foreground usages
- P2: No responsive classes

**Scores:**
- Readability: 6/10 (line-clamp OK for content)
- Layout: 6/10 (no responsive)
- Accessibility: 6/10 (h-11 on View History button OK)

**Migration Complexity:** LOW
**Estimated Hours:** 2h

---

### 4. ProjectCard.tsx (237 lines)

**Location:** `frontend/src/features/projects/components/ProjectCard.tsx`

**Violations:**
- P0: 3 truncations without tooltips (lines 69, 75, 135)
- P1: 7 text-xs on body content
- P1: 6 text-muted-foreground usages
- P1: No h-11 on action buttons (lines 208-228)

**Scores:**
- Readability: 5/10 (too much text-xs)
- Layout: 7/10 (good responsive grid)
- Accessibility: 5/10 (buttons size="sm" not h-11)

**Migration Complexity:** HIGH (complex layout)
**Estimated Hours:** 4-5h

---

### 5. TopicSearchCard.tsx (109 lines)

**Location:** `frontend/src/features/search/components/TopicSearchCard.tsx`

**Violations:**
- P0: 2 truncations without tooltips (lines 94, 100)
- P1: 2 text-xs usages
- P1: 2 text-muted-foreground usages
- P2: No responsive classes

**Scores:**
- Readability: 7/10 (simple layout)
- Layout: 6/10 (no responsive)
- Accessibility: 7/10 (good keyboard support, aria-label)

**Migration Complexity:** LOW
**Estimated Hours:** 1.5h

---

## Summary Tables

### Violations by File (Top 10)

| File | P0 | P1 | P2 | Total |
|------|----|----|----|----|
| AgentCard.tsx | 9 | 10 | 0 | 19 |
| ProjectCard.tsx | 3 | 14 | 0 | 17 |
| SignalNoiseCard.tsx | 0 | 14 | 0 | 14 |
| MessageCard.tsx | 5 | 7 | 0 | 12 |
| HealthCards.tsx | 1 | 6 | 0 | 7 |
| AtomCard.tsx | 2 | 8 | 1 | 11 |
| ScoringAccuracyCard.tsx | 0 | 8 | 0 | 8 |
| SettingsCard.tsx | 2 | 6 | 0 | 8 |
| MetricCard.tsx | 0 | 5 | 0 | 5 |
| TopicSearchCard.tsx | 2 | 4 | 1 | 7 |

### Migration Priority Order

| Priority | File | Complexity | Hours |
|----------|------|------------|-------|
| 1 | AgentCard.tsx | MEDIUM | 3-4h |
| 2 | MessageCard.tsx | LOW | 2h |
| 3 | AtomCard.tsx | LOW | 2h |
| 4 | TopicSearchCard.tsx | LOW | 1.5h |
| 5 | ProjectCard.tsx | HIGH | 4-5h |
| 6 | SignalNoiseCard.tsx | HIGH | 5h |
| 7 | HealthCards.tsx | MEDIUM | 3h |
| 8 | ScoringAccuracyCard.tsx | MEDIUM | 2.5h |
| 9 | SettingsCard.tsx | HIGH | 4h |
| 10 | CardWithStatus.tsx | LOW | 1.5h |

**Total Estimated Hours:** 28-32h
