# Design Tokens Audit Report

> **Generated:** 2025-12-05
> **Total violations:** 100+
> **Severity:** High — breaks dark mode, inconsistent UI

## Summary

| Category | Count | Impact |
|----------|-------|--------|
| Raw color classes | 85+ | 🔴 Breaks dark mode |
| Inconsistent spacing | 30+ | 🟡 Visual inconsistency |
| Status without icons | 15+ | 🟡 Accessibility (WCAG 1.4.1) |

---

## 🔴 Critical: Raw Color Violations

### Files with most violations:

| File | Violations | Priority |
|------|------------|----------|
| `pages/AutoApprovalSettingsPage/index.tsx` | 15 | 🔴 High |
| `pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx` | 10 | 🔴 High |
| `pages/VersionsPage/index.tsx` | 10 | 🔴 High |
| `pages/TopicDetailPage/index.tsx` | 8 | 🔴 High |
| `features/topics/components/HexColorPicker.tsx` | 12 | 🟡 Medium |
| `features/monitoring/components/*.tsx` | 10 | 🔴 High |
| `pages/SettingsPage/components/SourceCard.tsx` | 5 | 🔴 High |
| `shared/components/SaveStatusIndicator.tsx` | 5 | 🔴 High |
| `shared/components/AdminPanel/AdminPanel.tsx` | 6 | 🟡 Medium |

---

## Detailed Violations by File

### 1. `pages/AutoApprovalSettingsPage/index.tsx`

```tsx
// Line 87, 99, 116, 127, 135, 146
text-gray-600, text-gray-500, text-gray-400
→ REPLACE WITH: text-muted-foreground

// Line 110, 195
bg-gray-200 dark:bg-gray-700
→ REPLACE WITH: bg-border (or bg-muted)

// Line 152-153
bg-yellow-50 dark:bg-yellow-900/20, text-yellow-800 dark:text-yellow-200
→ REPLACE WITH: bg-semantic-warning/10, text-semantic-warning

// Line 174
bg-green-500
→ REPLACE WITH: bg-semantic-success

// Line 223-225
border-blue-200 bg-blue-50, text-blue-900, text-blue-800
→ REPLACE WITH: border-semantic-info/30 bg-semantic-info/10, text-semantic-info
```

### 2. `pages/VersionsPage/index.tsx`

```tsx
// Line 160-164 - Status badges
bg-yellow-50 text-yellow-700 border-yellow-300  // Pending
bg-green-50 text-green-700 border-green-300     // Approved
bg-red-50 text-red-700 border-red-300           // Rejected

→ REPLACE WITH:
bg-status-pending/10 text-status-pending border-status-pending/30
bg-status-connected/10 text-status-connected border-status-connected/30
bg-status-error/10 text-status-error border-status-error/30

// Line 178, 190, 237, 272, 277, 282
text-gray-400, text-gray-500, text-gray-600
→ REPLACE WITH: text-muted-foreground
```

### 3. `pages/TopicDetailPage/index.tsx`

```tsx
// Line 242
text-blue-600 dark:text-blue-400
→ REPLACE WITH: text-semantic-info

// Line 249
text-green-600 dark:text-green-400
→ REPLACE WITH: text-semantic-success

// Line 258
text-red-600 dark:text-red-400
→ REPLACE WITH: text-semantic-error (or text-destructive)

// Line 265-266
text-amber-600 dark:text-amber-400, bg-amber-600 dark:bg-amber-400
→ REPLACE WITH: text-semantic-warning, bg-semantic-warning

// Line 363
bg-amber-500 hover:bg-amber-600
→ REPLACE WITH: bg-semantic-warning hover:bg-semantic-warning/90

// Line 463, 491
border-amber-300 dark:border-amber-700
→ REPLACE WITH: border-semantic-warning
```

### 4. `shared/components/SaveStatusIndicator.tsx`

```tsx
// Line 32 - Saving state
text-blue-600 dark:text-blue-400
→ REPLACE WITH: text-semantic-info

// Line 39 - Saved state
text-green-600 dark:text-green-400
→ REPLACE WITH: text-semantic-success

// Line 46 - Error state
text-red-600 dark:text-red-400
→ REPLACE WITH: text-semantic-error

// Line 53-54 - Unsaved state
text-amber-600 dark:text-amber-400, bg-amber-600 dark:bg-amber-400
→ REPLACE WITH: text-semantic-warning, bg-semantic-warning
```

### 5. `pages/SettingsPage/components/SourceCard.tsx`

```tsx
// Line 16-18 - Status dot colors
active: 'bg-green-500'
inactive: 'bg-gray-400'
'not-configured': 'bg-yellow-500'

→ REPLACE WITH:
active: 'bg-status-connected'
inactive: 'bg-muted-foreground'
'not-configured': 'bg-status-pending'

// Line 46 - Complex conditional classes
→ REFACTOR to use CVA or separate status components
```

### 6. `features/monitoring/components/HealthCards.tsx`

```tsx
// Line 91-93
text-green-600 → text-semantic-success
text-yellow-600 → text-semantic-warning
text-red-600 → text-semantic-error
```

### 7. `features/monitoring/components/MonitoringDashboard.tsx`

```tsx
// Line 65-68 - Status indicator
bg-green-500 → bg-status-connected
bg-yellow-500 → bg-status-validating
bg-red-500 → bg-status-error
```

### 8. `pages/SettingsPage/plugins/TelegramSource/TelegramSettingsSheet.tsx`

```tsx
// Line 99
bg-green-600 hover:bg-green-600 border-green-600
→ REPLACE WITH: bg-status-connected hover:bg-status-connected/90 border-status-connected

// Line 102
bg-gray-400
→ REPLACE WITH: bg-muted-foreground

// Line 202-203
border-green-500 → border-semantic-success
border-red-500 → border-semantic-error

// Line 212, 218
text-green-600 → text-semantic-success
text-red-600 → text-semantic-error

// Line 262
text-red-600 hover:text-red-700 hover:bg-red-50
→ REPLACE WITH: text-destructive hover:text-destructive/90 hover:bg-destructive/10
```

### 9. `features/automation/components/AutomationStatsCards.tsx`

```tsx
// Line 33, 40, 47
text-blue-600 → text-semantic-info
text-yellow-600 → text-semantic-warning
text-green-600 → text-semantic-success
```

### 10. `pages/AutomationDashboardPage/AutomationDashboardPage.tsx`

```tsx
// Line 43, 45-46
text-green-600 dark:text-green-400 → text-status-connected
bg-green-400, bg-green-500 → bg-status-connected
```

---

## 🟡 Medium: Gray Scale Issues

These files use raw gray colors instead of semantic tokens:

| Pattern | Replace With |
|---------|--------------|
| `text-gray-400` | `text-muted-foreground/70` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-700` | `text-foreground` |
| `bg-gray-50` | `bg-muted` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-200` | `bg-border` |
| `border-gray-200` | `border-border` |
| `border-gray-300` | `border-input` |

---

## Quick Fix Script

Run ESLint to find all violations:

```bash
cd frontend && npm install && npm run lint
```

Or use grep to find specific patterns:

```bash
# Find all raw colors
grep -rn "bg-\(red\|green\|blue\|yellow\|amber\|gray\)-[0-9]" src/

# Find all text colors
grep -rn "text-\(red\|green\|blue\|yellow\|amber\|gray\)-[0-9]" src/
```

---

## Recommended Fix Order

1. **High Priority** (breaks dark mode):
   - `SaveStatusIndicator.tsx` — used everywhere
   - `SourceCard.tsx` — settings page
   - `TelegramSettingsSheet.tsx` — settings page

2. **Medium Priority** (visual inconsistency):
   - `VersionsPage/index.tsx`
   - `TopicDetailPage/index.tsx`
   - `AutoApprovalSettingsPage/index.tsx`

3. **Low Priority** (admin/internal):
   - `AdminPanel.tsx`
   - `HexColorPicker.tsx`

---

## Available Semantic Tokens

Reference: `frontend/tailwind.config.js`

### Status Colors
- `status-connected` (green)
- `status-validating` (yellow)
- `status-pending` (gray)
- `status-error` (red)

### Semantic Colors
- `semantic-success`
- `semantic-warning`
- `semantic-error`
- `semantic-info`

### Base Colors
- `primary` / `primary-foreground`
- `secondary` / `secondary-foreground`
- `muted` / `muted-foreground`
- `accent` / `accent-foreground`
- `destructive` / `destructive-foreground`
- `background` / `foreground`
- `border`
- `input`
- `ring`

### Atom Types
- `atom-problem`
- `atom-solution`
- `atom-decision`
- `atom-question`
- `atom-insight`
- `atom-pattern`
- `atom-requirement`

---

## Next Steps

1. ✅ ESLint rule created (`local-rules/no-raw-tailwind-colors`)
2. ✅ CLAUDE.md updated with forbidden patterns
3. ⏳ Fix violations file by file
4. ⏳ Change ESLint from `warn` to `error` after cleanup
5. ⏳ Add to CI pipeline
