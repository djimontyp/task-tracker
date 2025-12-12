# Task ID: 2

**Title:** Day 2: Migrate Patterns (~16 story files)

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Migrate composite/reusable components from Shared/, Components/, Design System/Patterns/ to unified Patterns/ category.

**Details:**

## Goals
- Rename title prefix: `Shared/*`, `Components/*`, `Design System/Patterns/*` → `Patterns/*`
- Add composition examples where missing
- Consolidate overlapping components

## Files to migrate (~16)
- CardWithStatus.stories.tsx
- EmptyState.stories.tsx
- FormField.stories.tsx
- ListItemWithAvatar.stories.tsx
- DataTable/index.stories.tsx
- DataTableColumnHeader/index.stories.tsx
- DataTableFacetedFilter/index.stories.tsx
- DataTableMobileCard/index.stories.tsx
- DataTablePagination/index.stories.tsx
- DataTableToolbar/index.stories.tsx
- MetricCard/MetricCard.stories.tsx
- TrendChart/TrendChart.stories.tsx
- ActivityHeatmap/ActivityHeatmap.stories.tsx
- PageHeader.stories.tsx
- SaveStatusIndicator.stories.tsx
- TooltipIconButton/TooltipIconButton.stories.tsx
- ColorPickerPopover/ColorPickerPopover.stories.tsx
- AdminBadge/AdminBadge.stories.tsx
- Logo/Logo.stories.tsx
- ExampleTokenUsage.stories.tsx

## Naming Changes
- `Shared/DataTable` → `Patterns/DataTable`
- `Components/TrendChart` → `Patterns/TrendChart`
- `Design System/Patterns/EmptyState` → `Patterns/EmptyState`

## Expected Result
- All reusable composite components under Patterns/
- Clear separation from atomic Primitives/

**Test Strategy:**

Run `npm run storybook` and verify: 1) All patterns under Patterns/ category 2) DataTable stories work correctly 3) No broken imports

## Subtasks

### 2.1. Migrate Design System patterns to Patterns/ category

**Status:** pending  
**Dependencies:** None  

Rename story titles for CardWithStatus, EmptyState, FormField, and ListItemWithAvatar from 'Design System/Patterns/*' to 'Patterns/*' prefix.

**Details:**

Update the `title` field in the meta object for 4 story files:

1. `frontend/src/shared/patterns/CardWithStatus.stories.tsx`: Change title from 'Design System/Patterns/CardWithStatus' to 'Patterns/CardWithStatus'
2. `frontend/src/shared/patterns/EmptyState.stories.tsx`: Change title from 'Design System/Patterns/EmptyState' to 'Patterns/EmptyState'
3. `frontend/src/shared/patterns/FormField.stories.tsx`: Change title from 'Design System/Patterns/FormField' to 'Patterns/FormField'
4. `frontend/src/shared/patterns/ListItemWithAvatar.stories.tsx`: Change title from 'Design System/Patterns/ListItemWithAvatar' to 'Patterns/ListItemWithAvatar'

Each file already has good composition examples and documentation. Just update the title field and verify no imports break.

### 2.2. Migrate DataTable family to Patterns/DataTable/

**Status:** pending  
**Dependencies:** 2.1  

Migrate 6 DataTable-related stories from 'Shared/' and 'Components/' to 'Patterns/DataTable/' category with proper sub-organization.

**Details:**

Update title fields for 6 DataTable story files:

1. `frontend/src/shared/components/DataTable/index.stories.tsx`: 'Shared/DataTable' → 'Patterns/DataTable/DataTable'
2. `frontend/src/shared/components/DataTableToolbar/index.stories.tsx`: 'Shared/DataTableToolbar' → 'Patterns/DataTable/Toolbar'
3. `frontend/src/shared/components/DataTablePagination/index.stories.tsx`: 'Shared/DataTablePagination' → 'Patterns/DataTable/Pagination'
4. `frontend/src/shared/components/DataTableColumnHeader/index.stories.tsx`: 'Components/DataTableColumnHeader' → 'Patterns/DataTable/ColumnHeader'
5. `frontend/src/shared/components/DataTableFacetedFilter/index.stories.tsx`: 'Components/DataTableFacetedFilter' → 'Patterns/DataTable/FacetedFilter'
6. `frontend/src/shared/components/DataTableMobileCard/index.stories.tsx`: 'Components/DataTableMobileCard' → 'Patterns/DataTable/MobileCard'

This creates a nested structure under Patterns/DataTable/ grouping all related components.

### 2.3. Migrate visualization and layout patterns

**Status:** pending  
**Dependencies:** 2.2  

Migrate MetricCard, TrendChart, ActivityHeatmap, and PageHeader from 'Shared/'/'Components/' to 'Patterns/' category.

**Details:**

Update title fields for 4 visualization/layout story files:

1. `frontend/src/shared/components/MetricCard/MetricCard.stories.tsx`: 'Shared/MetricCard' → 'Patterns/MetricCard'
2. `frontend/src/shared/components/TrendChart/TrendChart.stories.tsx`: 'Components/TrendChart' → 'Patterns/TrendChart'
3. `frontend/src/shared/components/ActivityHeatmap/ActivityHeatmap.stories.tsx`: 'Shared/ActivityHeatmap' → 'Patterns/ActivityHeatmap'
4. `frontend/src/shared/components/PageHeader.stories.tsx`: 'Shared/PageHeader' → 'Patterns/PageHeader'

These are composite components used across multiple features for data visualization and page layout. MetricCard has 15+ variants showcasing different metric types.

### 2.4. Migrate utility patterns and design tokens example

**Status:** pending  
**Dependencies:** 2.3  

Migrate remaining utility components (SaveStatusIndicator, TooltipIconButton, ColorPickerPopover, AdminBadge, Logo, ExampleTokenUsage) to Patterns/ category.

**Details:**

Update title fields for 6 utility pattern story files:

1. `frontend/src/shared/components/SaveStatusIndicator.stories.tsx`: 'Shared/SaveStatusIndicator' → 'Patterns/SaveStatusIndicator'
2. `frontend/src/shared/components/TooltipIconButton/TooltipIconButton.stories.tsx`: 'Components/TooltipIconButton' → 'Patterns/TooltipIconButton'
3. `frontend/src/shared/components/ColorPickerPopover/ColorPickerPopover.stories.tsx`: 'Components/ColorPickerPopover' → 'Patterns/ColorPickerPopover'
4. `frontend/src/shared/components/AdminBadge/AdminBadge.stories.tsx`: 'Shared/AdminBadge' → 'Patterns/AdminBadge'
5. `frontend/src/shared/components/Logo/Logo.stories.tsx`: 'Shared/Logo' → 'Patterns/Logo'
6. `frontend/src/shared/components/ExampleTokenUsage.stories.tsx`: 'Design System/Tokens Usage' → 'Patterns/DesignTokensExample'

These are smaller utility components and the design tokens showcase. ExampleTokenUsage demonstrates semantic color tokens and spacing patterns.
