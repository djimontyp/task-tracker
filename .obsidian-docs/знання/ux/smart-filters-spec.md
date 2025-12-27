# Smart Filters Spec for MessagesPage

## Current State Analysis

### Existing Filters

The MessagesPage currently has:

1. **Signal Toggle Button** - single button that toggles between "Signal Only" and "Show All"
2. **Signal/Noise Ratio Badge** - displays percentage + counts
3. **DataTableFacetedFilter** - dropdown filters for:
   - Source (Telegram, etc.)
   - Status (Analyzed/Pending)
   - Classification (signal/weak_signal/noise)
4. **ImportanceScoreFilter** - slider popover for score range

### Problems with Current UX

1. Toggle button is binary - no quick access to "noise only" view
2. Counts are in a separate badge, not integrated with filter controls
3. Requires multiple clicks to switch between filter modes
4. No visual indication of active filter state in navigation

---

## Smart Filters Design

### Pattern: Tabs with Count Badges

```
+------------------+--------------------+------------------+
|   All (124)      |   Signals (47)     |   Noise (77)     |
+------------------+--------------------+------------------+
      [active]           [inactive]           [inactive]
```

### Visual Specifications

```
Tabs Container:
+------------------------------------------------------------------------+
|                                                                         |
|  +---------------+  +-------------------+  +-----------------+          |
|  |  All   (124)  |  |  Signals   (47)  |  |  Noise   (77)  |          |
|  +---------------+  +-------------------+  +-----------------+          |
|    [bg-muted]         [default]              [default]                  |
|                                                                         |
+------------------------------------------------------------------------+
         ^                   ^                    ^
         |                   |                    |
    bg-background       border-status-       border-muted
    shadow              connected/10         text-muted-foreground
```

### States

#### Default State
- "All" tab selected
- All messages displayed (no filter)
- Badge shows total count

#### Signals Active
```
Tab: bg-background shadow
Badge: bg-status-connected/10 text-status-connected border-status-connected
Icon: Signal (lucide)
```

#### Noise Active
```
Tab: bg-background shadow
Badge: bg-muted text-muted-foreground
Icon: Volume2 (lucide)
```

### Badge Component Pattern

```tsx
// Signal count badge
<Badge variant="secondary" className="ml-2 gap-1">
  <Signal className="h-3 w-3 text-status-connected" />
  {count}
</Badge>

// Noise count badge
<Badge variant="outline" className="ml-2 gap-1 text-muted-foreground">
  <Volume2 className="h-3 w-3" />
  {count}
</Badge>

// Total count badge
<Badge variant="secondary" className="ml-2">
  {total}
</Badge>
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Contrast >= 4.5:1 | Use semantic tokens only |
| Focus visible | `focus-visible:ring-2 focus-visible:ring-ring` |
| Keyboard navigation | Native Radix Tabs support |
| Screen reader | `aria-label` on tabs, count announced |

### Keyboard Navigation

```
Tab        - Move focus to tabs list
Arrow L/R  - Switch between tabs
Enter/Space - Activate tab (auto-activation preferred)
```

### ARIA Labels

```tsx
<Tabs aria-label="Filter messages by classification">
  <TabsList>
    <TabsTrigger
      value="all"
      aria-label="All messages, 124 total"
    >
      All <Badge>124</Badge>
    </TabsTrigger>
    <TabsTrigger
      value="signals"
      aria-label="Signal messages, 47 items"
    >
      <Signal className="h-4 w-4" />
      Signals <Badge>47</Badge>
    </TabsTrigger>
    <TabsTrigger
      value="noise"
      aria-label="Noise messages, 77 items"
    >
      <Volume2 className="h-4 w-4" />
      Noise <Badge>77</Badge>
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### Status Indicator Pattern

Always use icon + text, never color alone:

```
[Signal icon] Signals (47)    - icon indicates category
[Volume2 icon] Noise (77)     - icon indicates category
```

---

## Implementation Notes

### URL Params

```
/messages                  -> All (default)
/messages?filter=signals   -> Signals only
/messages?filter=noise     -> Noise only
```

### Hook: useFilterParams

```tsx
interface FilterParams {
  filter: 'all' | 'signals' | 'noise'
}

function useFilterParams(): {
  filterMode: FilterParams['filter']
  setFilterMode: (mode: FilterParams['filter']) => void
  counts: {
    all: number
    signals: number
    noise: number
  }
}
```

### Integration with Existing Filters

Smart Filters should:
1. **Replace** the current Signal Toggle Button
2. **Keep** the Signal/Noise Ratio Badge (informational)
3. **Keep** DataTableFacetedFilters (additional refinement)
4. **Keep** ImportanceScoreFilter (complementary)

### State Management

```tsx
// Sync with URL params
const [searchParams, setSearchParams] = useSearchParams()
const filterMode = searchParams.get('filter') || 'all'

// Sync with column filters (TanStack Table)
useEffect(() => {
  if (filterMode === 'signals') {
    setColumnFilters([{ id: 'noise_classification', value: ['signal'] }])
  } else if (filterMode === 'noise') {
    setColumnFilters([{ id: 'noise_classification', value: ['noise', 'weak_signal'] }])
  } else {
    setColumnFilters([])
  }
}, [filterMode])
```

### Counts Calculation

```tsx
const counts = useMemo(() => {
  const items = paginatedData?.items ?? []
  return {
    all: paginatedData?.total ?? 0,
    signals: items.filter(m => m.noise_classification === 'signal').length,
    noise: items.filter(m =>
      m.noise_classification === 'noise' ||
      m.noise_classification === 'weak_signal'
    ).length
  }
}, [paginatedData])
```

Note: For accurate total counts, server should return faceted counts.
Current implementation shows counts for visible page only.

---

## Component Structure

```
src/pages/MessagesPage/
+-- index.tsx
+-- SmartFilters.tsx           # NEW - Tabs component
+-- useFilterParams.ts         # NEW - URL sync hook
+-- MessageCard.tsx
+-- MessagesSummaryHeader.tsx
+-- importance-score-filter.tsx
+-- columns.tsx
```

### SmartFilters Component API

```tsx
interface SmartFiltersProps {
  counts: {
    all: number
    signals: number
    noise: number
  }
  activeFilter: 'all' | 'signals' | 'noise'
  onFilterChange: (filter: 'all' | 'signals' | 'noise') => void
}

export function SmartFilters({
  counts,
  activeFilter,
  onFilterChange
}: SmartFiltersProps)
```

---

## Wireframe

```
+------------------------------------------------------------------------+
| Good morning!  Today: [Signal 12 new] [Warning 5 need attention]       |
+------------------------------------------------------------------------+
|                                                                         |
| +------------------------------------------------------------------+   |
| |  [All (124)]  |  [Signal Signals (47)]  |  [Volume2 Noise (77)]  |   |
| +------------------------------------------------------------------+   |
|                                                                         |
| +------------------------------------------------------------------+   |
| | [Search...]  [Source v]  [Status v]  [Classification v]  [Imp v] |   |
| +------------------------------------------------------------------+   |
|                                                                         |
| +------------------------------------------------------------------+   |
| |                                                                    |   |
| |  Message Card 1                                                    |   |
| |  --------------------------------------------------------          |   |
| |  Message Card 2                                                    |   |
| |  --------------------------------------------------------          |   |
| |  Message Card 3                                                    |   |
| |                                                                    |   |
| +------------------------------------------------------------------+   |
|                                                                         |
| [< Prev]  Page 1 of 5  [Next >]                                        |
+------------------------------------------------------------------------+
```

---

## Touch Targets

All interactive elements >= 44px:

```tsx
<TabsTrigger className="h-11 px-4">
  ...
</TabsTrigger>
```

---

## Dark Mode Considerations

All colors use semantic tokens that adapt to theme:
- `bg-background` - adapts
- `text-foreground` - adapts
- `bg-muted` - adapts
- `text-muted-foreground` - adapts
- `bg-status-connected/10` - semantic, adapts

---

## Testing Checklist

- [ ] Tab through entire component with keyboard
- [ ] Verify focus ring visible on all tabs
- [ ] Screen reader announces counts correctly
- [ ] URL updates when switching tabs
- [ ] Back/Forward browser navigation works
- [ ] Counts update when data changes (WebSocket)
- [ ] Works on mobile (touch targets >= 44px)
- [ ] Dark mode contrast verified

---

## Localization Keys

Add to `public/locales/{lang}/messages.json`:

```json
{
  "smartFilters": {
    "all": "All",
    "signals": "Signals",
    "noise": "Noise",
    "ariaLabel": "Filter messages by classification",
    "allAriaLabel": "All messages, {{count}} total",
    "signalsAriaLabel": "Signal messages, {{count}} items",
    "noiseAriaLabel": "Noise messages, {{count}} items"
  }
}
```

---

## Migration Plan

1. Create `SmartFilters.tsx` component
2. Create `useFilterParams.ts` hook
3. Replace Signal Toggle Button with SmartFilters
4. Keep existing DataTableFacetedFilters below
5. Update localization files
6. Add Storybook story for SmartFilters
7. Add unit tests for useFilterParams hook
8. E2E test for URL sync behavior
