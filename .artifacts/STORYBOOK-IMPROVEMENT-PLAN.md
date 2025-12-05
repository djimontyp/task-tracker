# Storybook Full Audit Report & Improvement Plan

**Date:** 2025-12-05
**Status:** CRITICAL - Build Broken

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Storybook Build** | FAILED | :x: Critical |
| **TypeScript** | 46+ errors | :x: Critical |
| **ESLint** | 46 errors + 30 warnings | :warning: Warning |
| **Total Components** | 164 | - |
| **Stories Coverage** | 46/164 (28%) | :warning: Low |
| **UI Coverage** | 27/33 (82%) | :white_check_mark: Good |
| **Shared Coverage** | 9/26 (35%) | :warning: Low |
| **Feature Coverage** | 4/60 (7%) | :x: Critical |

---

## Part 1: Critical Build Issues

### 1.1 Storybook Build Failure

**Error:**
```
Failed to resolve import "@storybook/blocks" from "./src/docs/Accessibility.mdx"
```

**Root Cause:** MDX documentation uses `@storybook/blocks` which is not installed or incorrectly configured.

**Fix:**
```bash
cd frontend
npm install @storybook/blocks
```

**Or** remove `@storybook/blocks` import from MDX files if using Storybook 10.x auto-docs.

### 1.2 TypeScript moduleResolution Errors

**Error:**
```
Cannot find module '@storybook/react'
Consider updating to 'node16', 'nodenext', or 'bundler'
```

**Root Cause:** `tsconfig.json` uses `moduleResolution: "ES2020"` which doesn't resolve `.d.ts` files from node_modules correctly for modern packages.

**Fix:** Update `frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

### 1.3 ESLint Storybook Import Errors

**Error:**
```
Do not import "@storybook/react" directly. Use @storybook/react-vite
```

**Affected files:** ALL 46 stories files

**Fix:** Change imports in all stories:
```diff
- import type { Meta, StoryObj } from '@storybook/react';
+ import type { Meta, StoryObj } from '@storybook/react-vite';
```

**Automation:**
```bash
cd frontend/src
find . -name "*.stories.tsx" -exec sed -i '' "s/@storybook\/react'/@storybook\/react-vite'/g" {} \;
```

### 1.4 Type Mismatches in Stories

| File | Error | Fix |
|------|-------|-----|
| `AtomCard.stories.tsx` | `"problem"` not in AtomType | Use valid AtomType: `"task"`, `"idea"`, etc. |
| `MessageCard.stories.tsx` | `message_id` doesn't exist | Use `id` field instead |
| `MessageCard.stories.tsx` | `"high_quality"` invalid | Use valid NoiseClassification |
| `MessageCard.stories.tsx` | `null` for optional numbers | Use `undefined` |
| `TopicCard.stories.tsx` | `keywords` doesn't exist | Remove or add to Topic type |

---

## Part 2: Coverage Analysis

### 2.1 Components WITHOUT Stories

#### Critical (Core Features) - 15 components

| Component | Location | Priority | Complexity |
|-----------|----------|----------|------------|
| `AgentCard` | features/agents/components | P0 | Medium |
| `AgentForm` | features/agents/components | P0 | High |
| `AgentList` | features/agents/components | P1 | Medium |
| `MessageInspectModal` | features/messages/components | P0 | High |
| `ConsumerMessageModal` | features/messages/components | P0 | High |
| `VersionDiffViewer` | features/knowledge/components | P1 | High |
| `KnowledgeExtractionPanel` | features/knowledge/components | P1 | High |
| `SearchBar` | features/search/components | P0 | Low |
| `ProjectCard` | features/projects/components | P1 | Medium |
| `ProjectForm` | features/projects/components | P1 | Medium |
| `ValidationStatus` | features/providers/components | P1 | Low |
| `OnboardingWizard` | features/onboarding/components | P2 | High |
| `MonitoringDashboard` | features/monitoring/components | P2 | High |
| `MetricsDashboard` | features/metrics/components | P2 | High |
| `HexColorPicker` | features/topics/components | P2 | Low |

#### Shared Components - 17 components

| Component | Location | Priority |
|-----------|----------|----------|
| `AdminPanel` | shared/components/AdminPanel | P1 |
| `BulkActionsToolbar` | shared/components/AdminPanel | P1 |
| `AdminFeatureBadge` | shared/components/AdminFeatureBadge | P2 |
| `AppSidebar` | shared/components/AppSidebar | P1 |
| `NavMain` | shared/components/AppSidebar | P2 |
| `NavNotifications` | shared/components/AppSidebar | P2 |
| `AutoSaveToggle` | shared/components | P2 |
| `ColorPickerPopover` | shared/components/ColorPickerPopover | P1 |
| `DataTableColumnHeader` | shared/components/DataTableColumnHeader | P1 |
| `DataTableFacetedFilter` | shared/components/DataTableFacetedFilter | P1 |
| `DataTableMobileCard` | shared/components/DataTableMobileCard | P1 |
| `MobileSearch` | shared/components | P2 |
| `NavUser` | shared/components | P2 |
| `TelegramIcon` | shared/components | P3 |
| `ThemeIcons` | shared/components | P3 |
| `ThemeProvider` | shared/components/ThemeProvider | P3 |
| `TrendChart` | shared/components/TrendChart | P1 |

#### UI Components - 6 components

| Component | Location | Priority | Notes |
|-----------|----------|----------|-------|
| `chart.tsx` | shared/ui | P1 | 368 LOC, Recharts wrapper |
| `sidebar.tsx` | shared/ui | P2 | Complex, context-based |
| `label.tsx` | shared/ui | P3 | Trivial |
| `navbar-icons.tsx` | shared/ui | P3 | SVG collection |
| `notification-badge.tsx` | shared/ui | P2 | Status indicator |
| `sonner.tsx` | shared/ui | P3 | Toast provider |

### 2.2 Stories WITH Issues

| File | Issue |
|------|-------|
| All 46 files | Wrong import `@storybook/react` |
| `AtomCard.stories.tsx` | Invalid AtomType |
| `MessageCard.stories.tsx` | Wrong field names, invalid enum values |
| `TopicCard.stories.tsx` | Non-existent field `keywords` |
| `ActivityHeatmap.stories.tsx` | Unused variables |

---

## Part 3: Consistency Analysis

### 3.1 Category Structure

**Current categories used:**
```
UI/
  Button, Badge, Card, Input, Select, etc.
UI/Forms/
  Checkbox, RadioGroup, Slider
UI/Navigation/
  Pagination
Shared/
  DataTable, MetricCard, PageHeader, etc.
Features/
  MessageCard, TopicCard
Design System/
  Tokens Usage
Design System/Patterns/
  CardWithStatus, ListItemWithAvatar, FormField, EmptyState
```

**Recommended structure:**
```
Design System/
  Introduction (MDX)
  Colors (MDX)
  Spacing (MDX)
  Tokens (MDX)
  Accessibility (MDX)
Design System/Tokens/
  ExampleTokenUsage

UI/
  Button, Badge, Card, etc.
UI/Forms/
  Input, Textarea, Checkbox, Select, etc.
UI/Overlays/
  Dialog, Sheet, Popover, Tooltip, etc.
UI/Data/
  Table, Skeleton, Progress, Chart
UI/Navigation/
  Breadcrumb, Pagination, Tabs

Patterns/
  CardWithStatus
  ListItemWithAvatar
  FormField
  EmptyState

Components/
  DataTable, MetricCard, PageHeader, etc.

Features/
  AgentCard, MessageCard, TopicCard, etc.
```

### 3.2 Checklist Results

| Check | Status | Notes |
|-------|--------|-------|
| `tags: ['autodocs']` | :white_check_mark: 46/46 | All stories have autodocs |
| Correct import | :x: 0/46 | All use wrong `@storybook/react` |
| Component description | :warning: ~70% | Most have descriptions |
| All variants covered | :warning: ~60% | Missing error/loading states |
| Interaction tests | :x: 0/46 | No play functions |

---

## Part 4: Improvement Plan

### Phase 1: Fix Build (Priority: CRITICAL)

**Time estimate:** 2-4 hours

1. **Install missing dependency:**
   ```bash
   cd frontend && npm install @storybook/blocks
   ```

2. **Fix TypeScript config:**
   ```json
   // tsconfig.json
   "moduleResolution": "bundler"
   ```

3. **Fix all imports (automated):**
   ```bash
   find src -name "*.stories.tsx" -exec sed -i '' "s/@storybook\/react'/@storybook\/react-vite'/g" {} \;
   ```

4. **Fix type errors in stories:**
   - `AtomCard.stories.tsx` - fix AtomType
   - `MessageCard.stories.tsx` - fix field names, enums
   - `TopicCard.stories.tsx` - remove `keywords` field

5. **Verify build:**
   ```bash
   npm run build-storybook
   npx tsc --noEmit
   npm run lint
   ```

### Phase 2: Quick Wins (Priority: HIGH)

**Time estimate:** 4-6 hours

Add stories for simple components:

| Component | Est. Time | Files |
|-----------|-----------|-------|
| SearchBar | 30 min | Low complexity |
| ValidationStatus | 30 min | Badge variants |
| HexColorPicker | 30 min | Color picker |
| ColorPickerPopover | 30 min | Popover demo |
| DataTableColumnHeader | 45 min | Sorting states |
| DataTableFacetedFilter | 45 min | Filter states |
| DataTableMobileCard | 45 min | Responsive |
| notification-badge | 30 min | Status variants |
| TrendChart | 1 hr | Chart variants |

### Phase 3: Core Features (Priority: HIGH)

**Time estimate:** 8-12 hours

| Component | Est. Time | Notes |
|-----------|-----------|-------|
| AgentCard | 1.5 hr | Provider configs |
| AgentForm | 2 hr | Form states |
| MessageInspectModal | 2 hr | Tab variants |
| ConsumerMessageModal | 1.5 hr | Modal states |
| ProjectCard | 1 hr | Card variants |
| ProjectForm | 1.5 hr | Form validation |
| AdminPanel | 1.5 hr | Admin states |

### Phase 4: Interaction Tests (Priority: MEDIUM)

**Time estimate:** 6-8 hours

Add `play` functions to existing stories:

```tsx
import { within, userEvent } from '@storybook/test';

export const Interactive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(canvas.getByText('Clicked')).toBeInTheDocument();
  },
};
```

**Priority components:**
1. Button (click)
2. Dialog (open/close)
3. Dropdown (select)
4. Form fields (input/validation)
5. DataTable (sort/filter)

### Phase 5: Visual Regression (Priority: LOW)

**Time estimate:** 4-6 hours

1. Setup Chromatic CI
2. Configure visual diff thresholds
3. Add to GitHub Actions workflow

---

## Summary

### Immediate Actions (Today)

1. :rotating_light: Fix `@storybook/blocks` import
2. :rotating_light: Fix `moduleResolution: "bundler"` in tsconfig
3. :rotating_light: Run sed script to fix all imports
4. :rotating_light: Fix type errors in 4 story files

### This Week

1. Verify Storybook builds successfully
2. Add stories for 9 simple components (Phase 2)
3. Add stories for 3 core feature components

### This Month

1. Complete Phase 3 (core features)
2. Add interaction tests to 10 key stories
3. Setup Chromatic for visual regression

---

## Files to Modify

### Critical (Build Fix)

- `frontend/tsconfig.json` - moduleResolution
- `frontend/package.json` - add @storybook/blocks
- All 46 `*.stories.tsx` files - import fix
- `src/features/atoms/components/AtomCard.stories.tsx` - type fix
- `src/pages/MessagesPage/MessageCard.stories.tsx` - type fix
- `src/pages/DashboardPage/TopicCard.stories.tsx` - type fix
- `src/docs/Accessibility.mdx` - check @storybook/blocks usage

### Stories to Create (Priority Order)

1. `src/features/search/components/SearchBar.stories.tsx`
2. `src/features/providers/components/ValidationStatus.stories.tsx`
3. `src/shared/components/DataTableColumnHeader/index.stories.tsx`
4. `src/shared/components/DataTableFacetedFilter/index.stories.tsx`
5. `src/shared/components/TrendChart/TrendChart.stories.tsx`
6. `src/features/agents/components/AgentCard.stories.tsx`
7. `src/features/messages/components/MessageInspectModal/MessageInspectModal.stories.tsx`

---

*Generated by Storybook Full Audit - 2025-12-05*
