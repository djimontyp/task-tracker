# Empty States & Loading Patterns - Quick Wins

## What to Fix First (Top 5)

### 1. Replace Manual Empty States in Dashboard

**Current (RecentTopics.tsx, lines 140-162):**
```tsx
// ❌ BAD: Manual HTML instead of component
<div className="text-center py-12 px-4 space-y-4">
  <div className="flex justify-center">
    <div className="rounded-full bg-muted p-6">
      <ChatBubbleLeftRightIcon className="h-12 w-12" />
    </div>
  </div>
  <h3 className="font-semibold text-lg">No topics yet</h3>
  <p className="text-muted-foreground">Topics are AI-extracted themes...</p>
  <Button onClick={() => navigate('/messages')}>
    Import Messages <ArrowRightIcon className="ml-2 h-4 w-4" />
  </Button>
</div>
```

**Fix (1 minute):**
```tsx
// ✅ GOOD: Use EmptyState component
<EmptyState
  icon={ChatBubbleLeftRightIcon}
  title="No topics yet"
  description="Topics are AI-extracted themes from your messages. Import messages to automatically generate topics."
  action={
    <Button onClick={() => navigate('/messages')}>
      Import Messages <ArrowRightIcon className="ml-2 h-4 w-4" />
    </Button>
  }
/>
```

**Benefits:**
- Removes 15 lines of code
- Consistent with design system
- Easier to maintain
- Improves DRY principle

---

### 2. Apply Same Fix to TrendingTopics.tsx

**Current (lines 126-140):** Same pattern, duplicate code

**Fix:** Replace with `EmptyState` component (1 minute)

**Result:** 10+ lines removed, 2 pages consistent

---

### 3. Add ARIA Attributes to Loading States

**Current (RecentTopics.tsx, line 118):**
```tsx
<div className="space-y-4 overflow-y-auto" role="feed">
  {isLoading ? (
    // Skeletons
  ) : ...}
</div>
```

**Fix (2 minutes):**
```tsx
<div
  className="space-y-4 overflow-y-auto"
  role="feed"
  aria-label="Recent topics"
  aria-busy={isLoading}  // ← Add this
>
```

**Apply to:**
- RecentTopics.tsx (line 118)
- TrendingTopics.tsx (line 72)
- Any other loading containers

**WCAG Impact:** Fixes 2.5.3 Level A violation

---

### 4. Create Error State for TrendingTopics

**Current:** Only success/empty states (lines 35-61 have error, but wrong approach)

**Better approach (3 minutes):**
```tsx
{isError ? (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <ArrowTrendingUpIcon className="h-5 w-5" />
        Trending Topics
      </CardTitle>
    </CardHeader>
    <CardContent>
      <EmptyState
        icon={ExclamationTriangleIcon}
        title="Failed to load"
        description="Unable to fetch trending topics. Please try again."
        action={<Button size="sm" onClick={() => refetch()}>Retry</Button>}
        variant="compact"
      />
    </CardContent>
  </Card>
) : ...}
```

**WCAG Impact:** Improves robustness (Principle 4.1.3)

---

### 5. Fix MessagesPage Skeleton Explosion

**Current (lines 418-453):** 15+ hardcoded Skeleton elements

**Quick Fix (10 minutes):**

Create `SkeletonDataTable.tsx`:
```tsx
interface SkeletonDataTableProps {
  columns?: number;
  rows?: number;
}

export function SkeletonDataTable({ columns = 6, rows = 5 }: SkeletonDataTableProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b">
        {[...Array(columns)].map(i => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {[...Array(rows)].map(i => (
        <div key={i} className="flex gap-4">
          {[...Array(columns)].map(j => (
            <Skeleton key={j} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

**Update MessagesPage (lines 420-453):**
```tsx
{isLoading ? (
  <SkeletonDataTable columns={6} rows={5} />
) : (
  // DataTable component
)}
```

**Benefits:**
- Removes 35+ lines of code
- Reusable across all DataTable pages
- Easier to maintain
- Responsive by default

---

## Copy Template for Empty States

Use this for consistency:

```
# No [Items]

[Context sentence explaining what this area is for and why it's empty]

[Action Button: "Create [Item]" or "Import [Items]"]
```

### Examples:

**No Messages**
- Context: "Messages from your Telegram will appear here once you connect your account."
- Action: "Configure Telegram"

**No Topics**
- Context: "Topics are AI-extracted themes from your messages. Import messages to automatically generate topics."
- Action: "Import Messages"

**No Agents**
- Context: "Create AI agents to automate task analysis and knowledge extraction."
- Action: "Create Agent"

**No Rules**
- Context: "Automation rules help you automatically manage messages and tasks. Create your first rule."
- Action: "Create Rule"

---

## Token Usage Template

### For Loading States:

```tsx
import { loading } from '@/shared/tokens';

{isLoading && (
  <div aria-busy="true" role="status">
    <Skeleton className={loading.skeleton.title} />
    <Skeleton className={loading.skeleton.text} />
    <Skeleton className={loading.skeleton.avatar} />
  </div>
)}
```

### For Empty States:

```tsx
import { emptyState } from '@/shared/tokens';

{items.length === 0 && (
  <div className={emptyState.container}>
    <div className={emptyState.icon}>
      <InboxIcon className="h-8 w-8" />
    </div>
    <h3 className={emptyState.title}>No items</h3>
    <p className={emptyState.description}>Your description here</p>
    <div className={emptyState.action}>
      <Button>Action</Button>
    </div>
  </div>
)}
```

---

## Checklist for Each Page

When adding/fixing empty + loading states:

- [ ] Loading state has `aria-busy="true"`
- [ ] Loading state has `role="status"`
- [ ] Empty state uses `EmptyState` component
- [ ] Empty state has icon (from HeroIcons)
- [ ] Empty state has clear title
- [ ] Empty state has description (1-2 sentences max)
- [ ] Empty state has action button (CTA)
- [ ] Error state implemented with retry
- [ ] Dark mode tested (toggle in settings)
- [ ] Mobile tested (375px width)
- [ ] Keyboard navigation works
- [ ] Screen reader announces state

---

## Before/After Examples

### Before: RecentTopics Loading

```tsx
{isLoading ? (
  <>
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="min-h-[80px]">
        <CardContent className="pt-4 pb-4">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-full mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </CardContent>
      </Card>
    ))}
  </>
) : ...}
```

### After: RecentTopics Loading

```tsx
{isLoading ? (
  <>
    {[...Array(3)].map((_, i) => (
      <SkeletonTopicCard key={i} />
    ))}
  </>
) : ...}
```

(Where `SkeletonTopicCard` mirrors actual `TopicCard` layout)

---

## Files to Create

1. `/frontend/src/shared/patterns/SkeletonDataTable.tsx` - Reusable table skeleton
2. `/frontend/src/shared/patterns/SkeletonTopicCard.tsx` - Topic card skeleton
3. `/frontend/src/shared/patterns/SkeletonMessageRow.tsx` - Message row skeleton
4. `/frontend/src/shared/patterns/ErrorState.tsx` - Unified error component
5. `/frontend/src/shared/patterns/README.md` - Pattern documentation

---

## Testing Checklist

After implementing fixes:

1. **Visual Testing**
   - [ ] Light mode: empty states look good
   - [ ] Dark mode: empty states look good
   - [ ] Mobile (375px): text readable, button clickable
   - [ ] Tablet (768px): spacing correct
   - [ ] Desktop (1920px): not stretched

2. **Accessibility Testing**
   - [ ] Tab order makes sense
   - [ ] Focus visible on all buttons
   - [ ] Screen reader announces "loading"
   - [ ] Screen reader announces "no items"
   - [ ] prefers-reduced-motion respected

3. **Browser Testing**
   - [ ] Chrome/Edge
   - [ ] Firefox
   - [ ] Safari

4. **Interaction Testing**
   - [ ] Loading -> Empty transition smooth
   - [ ] Empty -> Loaded transition smooth
   - [ ] Error -> Retry works
   - [ ] Navigation from empty state works

---

## Estimated Time Breakdown

| Task | Effort | Priority |
|------|--------|----------|
| Fix RecentTopics + TrendingTopics | 10 min | P1 |
| Add ARIA to loading containers | 20 min | P1 |
| Create SkeletonDataTable | 30 min | P1 |
| Update MessagesPage | 15 min | P1 |
| Add error states to 3 main pages | 45 min | P1 |
| **TOTAL PRIORITY 1** | **2 hours** | — |
| Create additional skeleton patterns | 1 hour | P2 |
| Fix remaining 7 pages | 3 hours | P2 |
| Accessibility audit | 1 hour | P2 |
| Testing + polish | 2 hours | P3 |
| **TOTAL** | **9 hours** | — |

---

**Last Updated:** 2025-12-05
**Next Review:** After implementation
