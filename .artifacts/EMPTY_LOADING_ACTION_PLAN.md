# Empty States & Loading Patterns - Action Plan

## Complete File-by-File Change List

### Phase 1: Critical Fixes (2 hours)

#### 1. `/frontend/src/pages/DashboardPage/RecentTopics.tsx`

**Lines to change:** 140-162

**Current:**
```tsx
} : (
  <div className="text-center py-12 px-4 space-y-4">
    <div className="flex justify-center">
      <div className="rounded-full bg-muted p-6">
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="font-semibold text-lg text-foreground">No topics yet</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Topics are AI-extracted themes from your messages. Import messages to automatically generate topics.
      </p>
    </div>
    <Button
      variant="default"
      onClick={() => navigate('/messages')}
      className="mt-4"
      aria-label="Navigate to Messages page to import messages"
    >
      Import Messages
      <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
    </Button>
  </div>
)}
```

**Change to:**
```tsx
) : (
  <EmptyState
    icon={ChatBubbleLeftRightIcon}
    title="No topics yet"
    description="Topics are AI-extracted themes from your messages. Import messages to automatically generate topics."
    action={
      <Button
        variant="default"
        onClick={() => navigate('/messages')}
      >
        Import Messages
        <ArrowRightIcon className="ml-2 h-4 w-4" />
      </Button>
    }
  />
)}
```

**Impact:**
- ✅ Removes 18 lines
- ✅ Uses design system
- ✅ Consistent with other empty states

**Testing:**
```bash
# Visual check at http://localhost/dashboard
# No messages state (appears when data is empty)
```

---

#### 2. `/frontend/src/pages/DashboardPage/TrendingTopics.tsx`

**Lines to change:** 126-140

**Current:**
```tsx
) : (
  <div className="text-center py-8 space-y-4">
    <div className="flex justify-center">
      <div className="rounded-full bg-muted p-4">
        <FireIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
    </div>
    <div className="space-y-2">
      <h3 className="font-medium text-sm text-foreground">No trending topics</h3>
      <p className="text-muted-foreground text-xs max-w-xs mx-auto">
        Topics will appear here once you have message activity
      </p>
    </div>
  </div>
)}
```

**Change to:**
```tsx
) : (
  <EmptyState
    icon={FireIcon}
    title="No trending topics"
    description="Topics will appear here once you have message activity"
    variant="compact"
  />
)}
```

**Also update error state (lines 35-61):**

From:
```tsx
if (isError) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowTrendingUpIcon className="h-5 w-5" aria-hidden="true" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 space-y-4">
          <div className="text-sm text-muted-foreground">
            Failed to load trending topics
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            aria-label="Retry loading trending topics"
          >
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

To:
```tsx
if (isError) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowTrendingUpIcon className="h-5 w-5" aria-hidden="true" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <EmptyState
          icon={ExclamationTriangleIcon}
          title="Failed to load"
          description="Unable to fetch trending topics. Please try again."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
          variant="compact"
        />
      </CardContent>
    </Card>
  )
}
```

**Impact:**
- ✅ Removes 30+ lines
- ✅ Unifies empty + error states
- ✅ Uses consistent patterns

---

#### 3. Add ARIA to RecentTopics Loading Container

**File:** `/frontend/src/pages/DashboardPage/RecentTopics.tsx`

**Line 118:** Update div attributes

**From:**
```tsx
<div className="space-y-4 overflow-y-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] pr-2 sm:pr-2" role="feed" aria-label="Recent topics" aria-busy={isLoading}>
```

**To:** (no change needed - already has `aria-busy={isLoading}` ✅)

**But verify TrendingTopics has same attributes:**

**File:** `/frontend/src/pages/DashboardPage/TrendingTopics.tsx`

**Line 72:** Update div attributes

**From:**
```tsx
<div className="space-y-2" role="list" aria-label="Trending topics" aria-busy={isLoading}>
```

**Status:** Already correct ✅

---

#### 4. Create Skeleton Components

**Create new file:** `/frontend/src/shared/patterns/SkeletonDataTable.tsx`

```typescript
import { Skeleton } from '@/shared/ui/skeleton'
import { cn } from '@/shared/lib/utils'

interface SkeletonDataTableProps {
  /**
   * Number of columns to simulate
   * @default 6
   */
  columns?: number

  /**
   * Number of rows to simulate
   * @default 5
   */
  rows?: number

  /**
   * Additional className for the container
   */
  className?: string
}

/**
 * Skeleton loader for data tables
 * Provides consistent loading state that mirrors actual table structure
 *
 * @example
 * {isLoading ? <SkeletonDataTable columns={4} rows={3} /> : <DataTable ... />}
 */
export function SkeletonDataTable({
  columns = 6,
  rows = 5,
  className
}: SkeletonDataTableProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-busy="true" aria-label="Loading table data">
      {/* Header Row */}
      <div className="flex gap-4 pb-4 border-b">
        {[...Array(columns)].map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1 rounded-sm" />
        ))}
      </div>

      {/* Data Rows */}
      {[...Array(rows)].map((_, rowIdx) => (
        <div key={`row-${rowIdx}`} className="flex gap-4">
          {[...Array(columns)].map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              className="h-10 flex-1 rounded-sm"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Create new file:** `/frontend/src/shared/patterns/ErrorState.tsx`

```typescript
import { ReactNode, ComponentType } from 'react'
import { cn } from '@/shared/lib/utils'
import { emptyState } from '@/shared/tokens'

export interface ErrorStateProps {
  /** Icon component (from @heroicons/react) */
  icon?: ComponentType<{ className?: string }>

  /** Error title */
  title?: string

  /** Error description/message */
  description?: string

  /** Action button or retry handler */
  action?: ReactNode

  /** Additional className */
  className?: string
}

/**
 * Error state display with consistent styling
 * Used when data fetching fails with option to retry
 *
 * @example
 * {isError ? (
 *   <ErrorState
 *     icon={ExclamationTriangleIcon}
 *     title="Failed to load"
 *     description="Unable to fetch data. Please try again."
 *     action={<Button onClick={() => refetch()}>Retry</Button>}
 *   />
 * ) : ...}
 */
export function ErrorState({
  icon: IconComponent,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn(emptyState.container, className)}>
      {IconComponent && (
        <div className={emptyState.icon}>
          <IconComponent className="h-8 w-8 text-destructive" />
        </div>
      )}
      <h3 className={emptyState.title}>{title}</h3>
      {description && (
        <p className={emptyState.description}>{description}</p>
      )}
      {action && <div className={emptyState.action}>{action}</div>}
    </div>
  )
}
```

**Update:** `/frontend/src/shared/patterns/index.ts`

Add exports:
```typescript
export { EmptyState, IllustratedEmptyState, LoadingEmptyState } from './EmptyState'
export type { EmptyStateProps, EmptyStateVariant, IllustratedEmptyStateProps } from './EmptyState'

export { SkeletonDataTable } from './SkeletonDataTable'
export type { SkeletonDataTableProps } from './SkeletonDataTable'

export { ErrorState } from './ErrorState'
export type { ErrorStateProps } from './ErrorState'
```

---

#### 5. Update MessagesPage Loading State

**File:** `/frontend/src/pages/MessagesPage/index.tsx`

**Lines 418-453:** Replace with

**Before:** 35+ lines of manual skeletons

**After:**
```tsx
if (isLoading) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <SkeletonDataTable columns={6} rows={5} />
    </div>
  )
}
```

**Also add:** Error state after loading check

**Add near line 415:**
```tsx
if (isError) {
  return (
    <ErrorState
      icon={ExclamationTriangleIcon}
      title="Failed to load messages"
      description="Unable to fetch messages. Please check your connection and try again."
      action={
        <Button variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      }
    />
  )
}
```

**Also add:** Empty state when data is empty

**Find the DataTable rendering and wrap with:**
```tsx
{paginatedData?.items.length === 0 ? (
  <EmptyState
    icon={ChatBubbleLeftIcon}
    title="No messages"
    description="Messages from your Telegram will appear here once you configure your account in Settings."
    action={
      <Button onClick={() => navigate('/settings')}>
        Configure Telegram
      </Button>
    }
  />
) : (
  <DataTable ... />
)}
```

---

### Phase 2: Additional Pages (3 hours)

#### Apply same pattern to:

1. **TopicsPage** (`/frontend/src/pages/TopicsPage/index.tsx`)
   - Lines 138-145: Add error state
   - Add empty state when `topics.items.length === 0`

2. **TopicDetailPage** (`/frontend/src/pages/TopicDetailPage/index.tsx`)
   - Lines 539-541: Add empty state for atoms
   - Lines 564-566: Add empty state for messages
   - Add error handling for each query

3. **ProjectsPage** (`/frontend/src/pages/ProjectsPage/index.tsx`)
   - Add error state
   - Add empty state

4. **AgentTasksPage** (`/frontend/src/pages/AgentTasksPage/index.tsx`)
   - Add error state
   - Verify empty state exists

5. **NoiseFilteringDashboard** (`/frontend/src/pages/NoiseFilteringDashboard/index.tsx`)
   - Add error state
   - Add empty state

6. **SearchPage** (`/frontend/src/pages/SearchPage/index.tsx`)
   - Add loading state with proper skeletons
   - Add error states for topics and messages
   - Add empty states when no results

7. **VersionsPage** (`/frontend/src/pages/VersionsPage/index.tsx`)
   - Add error states
   - Add empty states

---

### Phase 3: Enhance Skeleton Component (1 hour)

**File:** `/frontend/src/shared/ui/skeleton.tsx`

**Current:** Single skeleton, no variants

**Update to:**

```typescript
import { cn } from "@/shared/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant for different skeleton shapes
   * @default 'text'
   */
  variant?: 'text' | 'title' | 'avatar' | 'card' | 'button' | 'line'
}

function Skeleton({
  className,
  variant = 'text',
  ...props
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
    button: 'h-10 w-24 rounded-md',
    line: 'h-3 w-full',
  }

  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonProps }
```

**Note:** Keep `animate-pulse` but ensure dark mode contrast is good

---

## Verification Checklist

After all changes:

```bash
# 1. Type checking
npm run typecheck

# 2. ESLint check
npm run lint

# 3. Build check
npm run build

# 4. Visual inspection
npm run dev
# Visit each affected page and verify:
#   - Loading states show skeleton loaders
#   - Empty states show proper UI with CTA
#   - Error states show with retry button
#   - Dark mode works
#   - Mobile responsive (375px)

# 5. Accessibility check
npx playwright test frontend/tests/e2e/

# 6. Manual screen reader test (NVDA/JAWS)
#   - Verify aria-busy is announced
#   - Verify empty state is announced
#   - Verify error state is announced
```

---

## Import Updates Needed

**In each modified file, ensure imports include:**

```typescript
import { EmptyState } from '@/shared/patterns'
import { ErrorState } from '@/shared/patterns'
import { SkeletonDataTable } from '@/shared/patterns'
import { ExclamationTriangleIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
```

---

## Summary of Changes

| File | Type | Lines Changed | Impact |
|------|------|---------------|--------|
| RecentTopics.tsx | Update | 23 lines | Remove duplicate code |
| TrendingTopics.tsx | Update | 30+ lines | Unify patterns |
| MessagesPage/index.tsx | Update | 35+ lines | Use SkeletonDataTable |
| SkeletonDataTable.tsx | Create | 40 lines | New reusable pattern |
| ErrorState.tsx | Create | 45 lines | New error pattern |
| patterns/index.ts | Update | 5 lines | Export new patterns |
| skeleton.tsx | Update | 25 lines | Add variants |
| 7 more pages | Update | ~200 lines | Add error + empty states |
| **TOTAL** | — | **~450 lines** | **High quality improvement** |

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feat/empty-loading-patterns

# Phase 1 commit
git add frontend/src/pages/DashboardPage/
git add frontend/src/shared/patterns/
git add frontend/src/shared/ui/skeleton.tsx
git commit -m "feat(ui): unify empty & loading states

- Replace manual empty states with EmptyState component
- Create SkeletonDataTable and ErrorState patterns
- Enhance Skeleton with variants
- Add ARIA attributes to loading containers
- Improves WCAG 2.1 AA compliance"

# Phase 2 commit (after additional pages)
git commit -m "feat(pages): add error & empty states to all pages

- MessagesPage: skeleton table + error handling
- TopicsPage: error + empty states
- TopicDetailPage: empty states for atoms/messages
- ProjectsPage: error + empty states
- AgentTasksPage: error handling
- NoiseFilteringDashboard: error + empty states
- SearchPage: complete state handling
- VersionsPage: error + empty states"

# Push and create PR
git push origin feat/empty-loading-patterns
```

---

## Estimated Completion

- Phase 1: 2 hours
- Phase 2: 3 hours
- Phase 3: 1 hour
- Testing & QA: 2 hours
- **Total: 8 hours**

---

**Last Updated:** 2025-12-05
**Status:** Ready for implementation
