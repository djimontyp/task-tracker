# Task ID: 1

**Title:** Day 1: Migrate Primitives (~28 story files)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Migrate all shadcn/ui base components from UI/ to Primitives/ category. Consolidate variant stories using argTypes pattern instead of separate exports.

**Details:**

## Goals
- Create branch `refactor/storybook-restructure`
- Rename title prefix: `UI/*` → `Primitives/*`
- Consolidate variant stories (Default, Secondary, Destructive → argTypes select)
- Remove mock data noise stories

## Files to migrate (~28)
- button.stories.tsx
- badge.stories.tsx
- card.stories.tsx
- input.stories.tsx
- select.stories.tsx
- checkbox.stories.tsx
- switch.stories.tsx
- slider.stories.tsx
- dialog.stories.tsx
- sheet.stories.tsx
- popover.stories.tsx
- tooltip.stories.tsx
- tabs.stories.tsx
- alert.stories.tsx
- alert-dialog.stories.tsx
- avatar.stories.tsx
- progress.stories.tsx
- skeleton.stories.tsx
- separator.stories.tsx
- breadcrumb.stories.tsx
- pagination.stories.tsx
- table.stories.tsx
- command.stories.tsx
- dropdown-menu.stories.tsx
- collapsible.stories.tsx
- radio-group.stories.tsx
- textarea.stories.tsx
- notification-badge.stories.tsx

## Consolidation Pattern
```tsx
// BEFORE: 6 separate stories
export const Default, Secondary, Destructive...

// AFTER: argTypes + AllVariants
const meta = {
  argTypes: {
    variant: { control: 'select', options: [...] }
  }
};
export const Default: Story = {};
export const AllVariants: Story = { render: () => <Grid>...</Grid> };
```

## Expected Result
- ~40% reduction in story count for primitives
- All stories under Primitives/ category in sidebar

**Test Strategy:**

Run `npm run storybook` and verify: 1) All primitives under Primitives/ category 2) Controls panel works for variants 3) No console errors

## Subtasks

### 1.1. Create git branch refactor/storybook-restructure

**Status:** pending  
**Dependencies:** None  

Initialize new feature branch for Storybook restructuring work to isolate changes from main branch

**Details:**

Create and checkout new branch 'refactor/storybook-restructure' from current docs-product-pages branch. This branch will contain all Day 1 Primitives migration work. Verify branch creation with git status before proceeding.

### 1.2. Migrate button.stories.tsx as consolidation template

**Status:** pending  
**Dependencies:** 1.1  

Refactor button.stories.tsx to use argTypes pattern and rename title from 'UI/Button' to 'Primitives/Button'. This serves as the reference implementation for all other primitives.

**Details:**

Current button.stories.tsx (220 lines) has separate exports for Default, Secondary, Destructive, etc. Consolidate using argTypes with variant control. Keep AllVariants story as visual showcase. Update meta.title from 'UI/Button' to 'Primitives/Button'. File location: frontend/src/shared/ui/button.stories.tsx. Expected reduction: ~20-30% story count while maintaining coverage.

### 1.3. Migrate form primitives stories (8 files)

**Status:** pending  
**Dependencies:** 1.2  

Migrate input, select, checkbox, switch, slider, textarea, radio-group stories from UI/Forms/ to Primitives/ category with consolidated variants

**Details:**

Files to migrate:
- frontend/src/shared/ui/input.stories.tsx (UI/Forms/Input → Primitives/Input)
- frontend/src/shared/ui/select.stories.tsx (UI/Forms/Select → Primitives/Select)
- frontend/src/shared/ui/checkbox.stories.tsx (UI/Forms/Checkbox → Primitives/Checkbox)
- frontend/src/shared/ui/switch.stories.tsx (UI/Forms/Switch → Primitives/Switch)
- frontend/src/shared/ui/slider.stories.tsx (UI/Forms/Slider → Primitives/Slider)
- frontend/src/shared/ui/textarea.stories.tsx (UI/Forms/Textarea → Primitives/Textarea)
- frontend/src/shared/ui/radio-group.stories.tsx (UI/Forms/RadioGroup → Primitives/RadioGroup)
Follow button.stories.tsx consolidation pattern: add argTypes for variants, remove redundant separate exports, keep meaningful examples like disabled/loading states.

### 1.4. Migrate overlay primitives stories (7 files)

**Status:** pending  
**Dependencies:** 1.2  

Migrate dialog, sheet, popover, tooltip, alert-dialog, dropdown-menu, command stories from UI/ to Primitives/ with consolidated variants

**Details:**

Files to migrate:
- frontend/src/shared/ui/dialog.stories.tsx (UI/Dialog → Primitives/Dialog)
- frontend/src/shared/ui/sheet.stories.tsx (UI/Sheet → Primitives/Sheet)
- frontend/src/shared/ui/popover.stories.tsx (UI/Popover → Primitives/Popover)
- frontend/src/shared/ui/tooltip.stories.tsx (UI/Tooltip → Primitives/Tooltip)
- frontend/src/shared/ui/alert-dialog.stories.tsx (UI/AlertDialog → Primitives/AlertDialog)
- frontend/src/shared/ui/dropdown-menu.stories.tsx (UI/DropdownMenu → Primitives/DropdownMenu)
- frontend/src/shared/ui/command.stories.tsx (UI/Command → Primitives/Command)
These overlays require ThemeProvider and MemoryRouter wrappers in stories. Consolidate size/position variants using argTypes where applicable.

### 1.5. Migrate data/feedback primitives stories (7 files)

**Status:** pending  
**Dependencies:** 1.2  

Migrate badge, card, alert, avatar, progress, skeleton, table stories from UI/ to Primitives/ with variant consolidation

**Details:**

Files to migrate:
- frontend/src/shared/ui/badge.stories.tsx (UI/Badge → Primitives/Badge)
- frontend/src/shared/ui/card.stories.tsx (UI/Card → Primitives/Card)
- frontend/src/shared/ui/alert.stories.tsx (UI/Alert → Primitives/Alert)
- frontend/src/shared/ui/avatar.stories.tsx (UI/Avatar → Primitives/Avatar)
- frontend/src/shared/ui/progress.stories.tsx (UI/Progress → Primitives/Progress)
- frontend/src/shared/ui/skeleton.stories.tsx (UI/Skeleton → Primitives/Skeleton)
- frontend/src/shared/ui/table.stories.tsx (UI/Table → Primitives/Table)
Badge has multiple variants (default, secondary, destructive, outline) - perfect for argTypes consolidation. Table story has mock data - keep it minimal, remove noisy examples.

### 1.6. Migrate navigation primitives stories (6 files)

**Status:** pending  
**Dependencies:** 1.2  

Migrate tabs, breadcrumb, pagination, separator, collapsible, notification-badge stories from UI/Navigation or UI/Layout to Primitives/

**Details:**

Files to migrate:
- frontend/src/shared/ui/tabs.stories.tsx (UI/Navigation/Tabs → Primitives/Tabs)
- frontend/src/shared/ui/breadcrumb.stories.tsx (UI/Navigation/Breadcrumb → Primitives/Breadcrumb)
- frontend/src/shared/ui/pagination.stories.tsx (UI/Navigation/Pagination → Primitives/Pagination)
- frontend/src/shared/ui/separator.stories.tsx (UI/Layout/Separator → Primitives/Separator)
- frontend/src/shared/ui/collapsible.stories.tsx (UI/Layout/Collapsible → Primitives/Collapsible)
- frontend/src/shared/ui/notification-badge.stories.tsx (UI/NotificationBadge → Primitives/NotificationBadge)
Breadcrumb and Pagination may need MemoryRouter wrapper. Consolidate orientation/size variants using argTypes. After completion, verify no UI/ top-level category remains in Storybook sidebar.
