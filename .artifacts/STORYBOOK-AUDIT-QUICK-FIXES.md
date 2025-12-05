# Storybook Audit - Quick Fixes Guide

**Date**: 2025-12-05
**Estimated Time**: 4 hours for all quick fixes
**Difficulty**: Low - straightforward spacing and consistency updates

---

## Fix #1: Input Icon Padding (10 minutes)

### Problem
Input icons use `pl-10`/`pr-10` (10px) which breaks the 4px spacing grid.

### Affected Files
- `frontend/src/shared/ui/input.stories.tsx` (lines 108-109, 127-128)
- `frontend/src/shared/ui/input.tsx` (example code if exists)

### Current Code (WRONG)
```tsx
// Line 108-109
<SearchIcon className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
<Input id="search" type="search" placeholder="Search..." className="pl-10" />

// Line 127-128
<Input id="email-icon" type="email" placeholder="name@example.com" className="pr-10" />
<Mail className="absolute right-4 top-2.5 h-4 w-4 text-muted-foreground" />
```

### Fixed Code (RIGHT)
```tsx
// Option A: Use pl-12 (48px = 32px default input padding + 16px for icon + 0px extra)
<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
<Input id="search" type="search" placeholder="Search..." className="pl-12" />

// Option B: Adjust icon position to left-3 (12px)
// Keep pl-10 but left-3 instead of left-4
// RECOMMENDED: Use Option A (pl-12 is cleaner)
```

### Steps to Fix
1. Open `frontend/src/shared/ui/input.stories.tsx`
2. Find line 108 (`WithLeadingIcon` story)
3. Change `className="pl-10"` → `className="pl-12"`
4. Also adjust icon positioning: `left-4` → `left-3` for better centering
5. Repeat for line 127 in `WithTrailingIcon`
6. Test in Storybook at http://localhost:6006/?path=/story/ui-forms-input--with-leading-icon

### Validation
- [ ] Icon appears properly aligned inside input
- [ ] No overlapping with text
- [ ] Spacing is 4px-grid aligned (12px = 3 × 4px)

---

## Fix #2: Badge Gap Spacing (10 minutes)

### Problem
Badge status components use `gap-2.5` (10px) instead of standard `gap-2` (8px) or `gap-3` (12px).

### Affected Files
- `frontend/src/shared/ui/badge.stories.tsx` (lines 75, 100, 109, 120, 124, 128, 132)

### Current Code (WRONG)
```tsx
// Multiple occurrences
<Badge variant="outline" className="gap-2.5 border-status-connected text-status-connected">
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>
```

### Fixed Code (RIGHT)
```tsx
// Change all gap-2.5 to gap-2 (8px is adequate for icon + text)
<Badge variant="outline" className="gap-2 border-status-connected text-status-connected">
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>
```

### Steps to Fix
1. Open `frontend/src/shared/ui/badge.stories.tsx`
2. Find all occurrences of `gap-2.5` (should be 7 total)
   - Line 75: StatusConnected
   - Line 100: StatusValidating
   - Line 109: StatusPending
   - Line 120, 124, 128, 132: AllStatuses story
3. Replace all `gap-2.5` → `gap-2`
4. Test in Storybook at http://localhost:6006/?path=/story/ui-badge--all-statuses

### Validation
- [ ] Icon and text have proper spacing
- [ ] Spacing looks consistent with other gap-2 elements
- [ ] No visual regression in light/dark modes

---

## Fix #3: Button Icon Sizes (30 minutes)

### Problem
Button stories mix `h-4 w-4` (16px) and `h-5 w-5` (20px) icons inconsistently.

### Affected Files
- `frontend/src/shared/ui/button.stories.tsx` (lines 116, 132, 143, 193-194)
- `frontend/src/shared/ui/button.tsx` (JSDoc)

### Current Code (INCONSISTENT)
```tsx
// Line 116 - IconButton uses h-5 w-5
<Trash2 className="h-5 w-5" />

// Line 132 - WithIcon uses h-4 w-4
<Plus className="h-4 w-4" />

// Line 143 - WithIconRight uses h-4 w-4
<Send className="h-4 w-4" />

// Line 193 - AllSizes IconButton uses h-5 w-5
<Settings className="h-5 w-5" />
```

### Fixed Code (CONSISTENT)
```tsx
// Standardize to h-4 w-4 for all button icons
// Rationale: h-4 (16px) is standard icon size for default/sm/lg buttons
// Use h-5 (20px) only for large button variants if needed

// Updated code:
// Line 116
<Trash2 className="h-4 w-4" />

// Line 193
<Settings className="h-4 w-4" />

// Add documentation to button.tsx JSDoc:
// "Icon buttons: Use h-4 w-4 (16px) for default sizing. Use h-5 w-5 (20px) for lg variant only."
```

### Steps to Fix
1. Open `frontend/src/shared/ui/button.stories.tsx`
2. Replace `h-5 w-5` with `h-4 w-4` in:
   - Line 116 (IconButton)
   - Line 193 (AllSizes)
3. Open `frontend/src/shared/ui/button.tsx`
4. Add to Button JSDoc (after line 5):
   ```tsx
   /**
    * ...existing docs...
    *
    * ## Icon Sizing
    * - Always use h-4 w-4 (16px) for button icons
    * - Use h-5 w-5 (20px) only in large button (size="lg") variants
    * - Icon buttons (size="icon") use h-5 w-5 internally
    */
   ```
5. Test in Storybook at http://localhost:6006/?path=/story/ui-button--all-variants

### Validation
- [ ] All button icon sizes consistent
- [ ] Icon buttons (h-11 w-11) still work properly
- [ ] Visual alignment looks good across variants

---

## Fix #4: Create Loading States Pattern Story (60 minutes)

### Problem
Loading states are documented only in Button, not shown as a cohesive pattern for forms and data displays.

### New File to Create
- `frontend/src/shared/components/LoadingStates.stories.tsx`

### Code to Add
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { DataTable } from './DataTable';

const meta: Meta = {
  title: 'Patterns/Loading States',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Standard loading patterns across the application.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Button Loading State
 *
 * Shows spinner + disabled state during async operations.
 * Always update button text (e.g., "Saving..." vs "Save")
 */
export const ButtonLoading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button loading>Saving...</Button>
      <Button variant="outline">Normal</Button>
    </div>
  ),
};

/**
 * Form Submission Loading
 *
 * Shows loading state while form submits. Disable all fields.
 */
export const FormLoading: Story = {
  render: () => (
    <form className="space-y-4 w-64">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" disabled placeholder="Loading..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" disabled placeholder="Loading..." />
      </div>
      <Button className="w-full" loading>
        Signing in...
      </Button>
    </form>
  ),
};

/**
 * Skeleton Loading for Cards
 *
 * Use Skeleton components to show loading shape.
 * Match final layout exactly.
 */
export const SkeletonCardLoading: Story = {
  render: () => (
    <div className="border rounded-lg p-6 space-y-4">
      {/* Title skeleton */}
      <Skeleton className="h-6 w-48" />

      {/* Description skeleton */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />

      {/* Content skeleton */}
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Action skeleton */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  ),
};

/**
 * Skeleton Loading for Table
 *
 * Show multiple row skeletons to indicate table data loading.
 */
export const SkeletonTableLoading: Story = {
  render: () => (
    <div className="space-y-3 border rounded-lg p-4">
      {/* Header skeleton */}
      <div className="flex gap-4 pb-4 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Row skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  ),
};

/**
 * Inline Loading Spinner
 *
 * For small async operations within a component.
 * Keep spinner compact (h-4 w-4).
 */
export const InlineLoading: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span>Processing your request</span>
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>

      <div className="flex items-center gap-2">
        <span>Refreshing data</span>
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
      </div>
    </div>
  ),
};

/**
 * Progressive Loading
 *
 * Show incrementally as data loads. First show skeleton,
 * then swap to real content.
 */
export const ProgressiveLoading: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-4">Step 1: Skeleton (loading)</h3>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4">Step 2: Content loaded</h3>
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Title</h4>
          <p className="text-sm text-muted-foreground">Content is now visible</p>
        </div>
      </div>
    </div>
  ),
};
```

### Steps to Implement
1. Create new file: `frontend/src/shared/components/LoadingStates.stories.tsx`
2. Copy code above
3. Run Storybook and verify stories render
4. Test in browser at http://localhost:6006/?path=/docs/patterns-loading-states--docs

### Components to Reference
- Button with `loading` prop
- Skeleton component
- Loader2 and RefreshCw icons from lucide-react
- Spinners via `animate-spin`

---

## Verification Checklist

After applying all fixes:

### Fix #1 - Input Padding
- [ ] Input with leading icon renders correctly
- [ ] Icon alignment looks centered
- [ ] No text overlap
- [ ] Spacing follows 4px grid (12px)
- [ ] Works in dark mode

### Fix #2 - Badge Gaps
- [ ] All status badges use `gap-2`
- [ ] Icon + text spacing looks consistent
- [ ] Fits in "AllStatuses" story
- [ ] Works in dark mode

### Fix #3 - Button Icons
- [ ] All button icons are h-4 w-4
- [ ] AllVariants story looks consistent
- [ ] AllSizes story looks consistent
- [ ] JSDoc updated with icon sizing rules

### Fix #4 - Loading States
- [ ] LoadingStates.stories.tsx file created
- [ ] All 6 stories render without errors
- [ ] Spinner animations work
- [ ] Skeleton placeholders look realistic

### Overall
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No ESLint errors: `npm run lint`
- [ ] Storybook builds: `npm run build-storybook`
- [ ] All stories visible in Storybook UI

---

## Storybook URLs for Testing

After fixes, test each at these URLs:

```
# Fix #1 - Input Padding
http://localhost:6006/?path=/story/ui-forms-input--with-leading-icon

# Fix #2 - Badge Gaps
http://localhost:6006/?path=/story/ui-badge--all-statuses

# Fix #3 - Button Icons
http://localhost:6006/?path=/story/ui-button--all-variants
http://localhost:6006/?path=/story/ui-button--all-sizes

# Fix #4 - Loading States
http://localhost:6006/?path=/docs/patterns-loading-states--docs
```

---

## Commands to Run

```bash
# Start Storybook for testing
cd frontend && npm run storybook

# After fixes, validate TypeScript
npm run typecheck

# Validate ESLint (Design System rules)
npm run lint

# Build Storybook to verify production build
npm run build-storybook
```

---

## Time Breakdown

| Fix | Task | Estimated | Actual |
|-----|------|-----------|--------|
| #1 | Fix input padding | 10 min | ___ |
| #2 | Fix badge gaps | 10 min | ___ |
| #3 | Standardize button icons | 30 min | ___ |
| #4 | Create loading states | 60 min | ___ |
| **Total** | | **110 min (1.8 hrs)** | ___ |

---

## Notes for PR Review

When submitting PR with these fixes:

1. **Title**: "fix(storybook): align spacing and icon sizing to design system"
2. **Description**: Include this checklist showing all fixes applied
3. **Screenshots**: Include before/after of Fixed stories in both light and dark modes
4. **Testing**: "Tested in Storybook, verified all stories render correctly"

---

## Follow-Up Tasks (Next Sprint)

After quick fixes are done, schedule these for next sprint:
- [ ] Create form validation pattern story (1.5 hours)
- [ ] Create empty state patterns story (1 hour)
- [ ] Add dark mode Playwright tests (1 hour)
- [ ] Enhance DataTable mobile rendering (1.5 hours)

---

**Questions or issues?** Check the full audit report: `.artifacts/STORYBOOK-VISUAL-AUDIT.md`
