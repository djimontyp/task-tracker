# Design System Audit — Prioritized Action Plan

**Generated:** 2025-12-05
**Total Effort:** ~21 hours (3 developer-days)
**Goal:** 100% WCAG 2.1 AA + 90% Design System Compliance

---

## Phase 0: Critical Fixes (TODAY) — 1 hour

### Task 0.1: Fix WCAG aria-label Violations ⏱️ 8 min
**Priority:** 🔴 CRITICAL
**Impact:** Accessibility compliance

```tsx
// JobsTable.tsx:123
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" aria-label="Job actions">

// RulePerformanceTable.tsx:94
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="icon" aria-label="Rule actions">

// RuleConditionInput.tsx:119
<Button variant="ghost" size="icon" aria-label="Remove condition">

// TopicsPage/index.tsx:196
<Button variant="ghost" size="icon" aria-label="Clear search">
```

**Verify:** `grep -r "aria-label" frontend/src | wc -l` (should increase by 4)

---

### Task 0.2: Fix Dark Mode Contrast ⏱️ 15 min
**Priority:** 🔴 CRITICAL
**Impact:** Readability in dark mode

**File:** `frontend/src/index.css`

Add to `.dark` scope:
```css
.dark {
  /* Atom colors - add 14% lightness for dark mode */
  --atom-problem: 0 84% 74%;      /* was 60% */
  --atom-solution: 142 76% 50%;   /* was 36% */
  --atom-decision: 262 83% 68%;   /* was 58% */
  --atom-idea: 48 96% 63%;        /* was 53% */
  --atom-task: 221 83% 63%;       /* was 53% */
  --atom-insight: 326 78% 70%;    /* was 60% */
  --atom-question: 25 95% 63%;    /* was 53% */

  /* Status colors */
  --status-connected: 142 76% 50%;
  --status-error: 0 84% 74%;
}
```

**Verify:** Check contrast ratio ≥ 4.5:1 in dark mode

---

### Task 0.3: Fix Button Touch Targets ⏱️ 30 min
**Priority:** 🔴 CRITICAL
**Impact:** Mobile usability

**Files to update:**

```tsx
// DataTablePagination/index.tsx
- <Button variant="outline" size="icon" className="h-8 w-8">
+ <Button variant="outline" size="icon" className="h-11 w-11">

// JobsTable.tsx, RulePerformanceTable.tsx
- <Button variant="ghost" size="icon">
+ <Button variant="ghost" size="icon" className="h-11 w-11">

// MessagesPage/columns.tsx, TopicsPage/columns.tsx
- <Button variant="ghost" size="icon">
+ <Button variant="ghost" size="icon" className="h-11 w-11">
```

**Verify:** All table action buttons ≥ 44×44px

---

## Phase 1: High Priority (Sprint 1) — 12 hours

### Task 1.1: Unify Focus Ring ⏱️ 1 hour
**Priority:** 🟡 HIGH

**Target:** All form controls use same focus style:
```css
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

**Files:**
- `input.tsx` — change `ring-1` → `ring-2`, add `ring-offset-2`
- `select.tsx` — change `focus:` → `focus-visible:`
- `textarea.tsx` — verify matches

---

### Task 1.2: Add Base Badge Gap ⏱️ 10 min + 30 min verify
**Priority:** 🟡 HIGH

**File:** `frontend/src/shared/ui/badge.tsx`

```tsx
const badgeVariants = cva(
- "inline-flex items-center rounded-md border px-2.5 py-0.5...",
+ "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5...",
```

**Verify:** Check 50 files using Badge don't break

---

### Task 1.3: FormField Pattern Migration ⏱️ 6 hours
**Priority:** 🟡 HIGH

**Target Files:**
1. `RuleBuilderForm.tsx` (8 fields) — 2 hours
2. `CreateEditJobDialog.tsx` (4 fields) — 1 hour
3. `GeneralTab.tsx` (2 fields) — 30 min
4. `ProvidersTab.tsx` (3 fields) — 45 min
5. `PromptTuningTab.tsx` (2 fields) — 30 min
6. Other forms — 1.25 hours

**Pattern:**
```tsx
// Before
<Label>Name</Label>
<Input value={name} onChange={...} />
{error && <p className="text-destructive">{error}</p>}

// After
<FormField label="Name" error={error} required>
  <Input value={name} onChange={...} />
</FormField>
```

---

### Task 1.4: MessageInspectModal Tabs ⏱️ 2 hours
**Priority:** 🟡 HIGH

**File:** `frontend/src/features/messages/components/MessageInspectModal/MessageInspectModal.tsx`

Replace custom tab implementation with global `<Tabs>` component:
```tsx
// Before - custom buttons with border-b-2
<Button variant="ghost" className={cn("rounded-none border-b-2", active && "border-primary")}>

// After - shadcn Tabs
<Tabs defaultValue="classification">
  <TabsList>
    <TabsTrigger value="classification">Classification</TabsTrigger>
    <TabsTrigger value="atoms">Atoms</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="classification">...</TabsContent>
</Tabs>
```

---

### Task 1.5: TypeScript Tokens Migration ⏱️ 2 hours
**Priority:** 🟡 HIGH

**Import in all Automation components:**
```tsx
import { gap, padding, semantic, status } from '@/shared/tokens';

// Before
<div className="space-y-4 mb-4">

// After
<div className={cn(gap.md, "mb-4")}>
```

**Files:** 15 automation components

---

## Phase 2: Medium Priority (Sprint 2) — 7 hours

### Task 2.1: Empty States Pattern ⏱️ 3 hours

Add `<EmptyState>` to pages:
- [ ] MessagesPage (filtered empty)
- [ ] TopicsPage (no topics)
- [ ] AgentsPage (no agents)
- [ ] ProjectsPage (no projects)
- [ ] VersionsPage (no versions)
- [ ] SearchPage (no results)

---

### Task 2.2: Fix Atom Color Duplicates ⏱️ 30 min

**File:** `frontend/src/index.css`

```css
/* Change Insight and Pattern to be distinct */
--atom-insight: 326 78% 60%;    /* Pink */
--atom-pattern: 280 65% 60%;    /* Purple - NEW distinct color */

/* Change Decision and Requirement to be distinct */
--atom-decision: 262 83% 58%;   /* Violet */
--atom-requirement: 200 80% 50%; /* Cyan - NEW distinct color */
```

---

### Task 2.3: SourceCard WCAG Fix ⏱️ 30 min

**File:** `frontend/src/pages/SettingsPage/components/SourceCard.tsx`

Add icon to status indicator:
```tsx
// Before - color only
<div className={cn("h-2 w-2 rounded-full", connected ? "bg-green-500" : "bg-gray-300")} />

// After - icon + text
<Badge className={badges.status[connected ? 'connected' : 'pending']}>
  {connected ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
  {connected ? 'Connected' : 'Pending'}
</Badge>
```

---

### Task 2.4: Page Layout Padding ⏱️ 30 min

**Files:**
- `AgentsPage/index.tsx` — remove redundant `px-4 md:px-4`
- `TopicDetailPage/index.tsx` — remove fixed `p-6`, use MainLayout padding

---

### Task 2.5: Typography Scale ⏱️ 2 hours

**File:** `frontend/tailwind.config.js`

Add custom fontSize to match design spec:
```js
fontSize: {
  'xs': ['12px', { lineHeight: '1.43' }],
  'sm': ['13px', { lineHeight: '1.43' }],
  'base': ['14px', { lineHeight: '1.43' }],
  'lg': ['16px', { lineHeight: '1.43' }],
  'xl': ['18px', { lineHeight: '1.33' }],
  '2xl': ['20px', { lineHeight: '1.3' }],
  '3xl': ['24px', { lineHeight: '1.25' }],
}
```

---

### Task 2.6: Logo Animation ⏱️ 10 min

**File:** `frontend/src/shared/components/AppSidebar/index.tsx`

```tsx
// Add transition to logo container
<div className="transition-all duration-200 ease-linear">
  <Logo />
</div>
```

---

## Phase 3: Low Priority (Backlog) — 45 min

- [ ] Remove unused `xs:` breakpoint or document why kept
- [ ] Add 4th chart color to palette
- [ ] Clean redundant breakpoints (`md:space-y-6` where `sm:space-y-6` exists)
- [ ] Evaluate `link` Button variant usage (only 1 file)

---

## Verification Checklist

After all phases:

```bash
# TypeScript
cd frontend && npx tsc --noEmit

# ESLint (Design System rules)
npm run lint

# Unit Tests
npm run test:run

# E2E Tests
npx playwright test

# Accessibility
npx playwright test tests/e2e/a11y/

# Visual Regression (manual)
npm run storybook
# Check all components in light + dark mode
```

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| WCAG 2.1 AA | 91% | **100%** |
| Touch Targets ≥44px | 70% | **100%** |
| Design Token Usage | 30% | **90%** |
| FormField Pattern | 10% | **80%** |
| Dark Mode Contrast | 60% | **100%** |
| Focus Ring Consistency | 33% | **100%** |

---

## Timeline

| Phase | Duration | Owner | Due |
|-------|----------|-------|-----|
| Phase 0 | 1 hour | Any dev | Today |
| Phase 1 | 12 hours | Frontend team | End of Sprint 1 |
| Phase 2 | 7 hours | Frontend team | End of Sprint 2 |
| Phase 3 | 45 min | Cleanup sprint | Backlog |

---

*Action Plan generated from 15 comprehensive audit reports*
