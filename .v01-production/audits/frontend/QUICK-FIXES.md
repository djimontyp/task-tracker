# Quick Fixes - Copy-Paste Ready

**For developers:** Code snippets ready to apply immediately

---

## 1. Color Contrast Fix (5 minutes)

**File:** `/frontend/src/index.css`

**Line 19:** Change this:
```css
--muted-foreground: 0 0% 20%; /* ❌ 3.2:1 contrast */
```

To this:
```css
--muted-foreground: 0 0% 35%; /* ✅ 4.7:1 contrast (WCAG AA) */
```

**Test:** Open Dashboard → inspect muted text → Chrome DevTools → Check contrast ratio

---

## 2. Touch Targets (1 hour)

**File:** `/frontend/src/shared/ui/button.tsx`

**Lines 25-30:** Replace with:

```tsx
size: {
  default: "h-[44px] px-4 text-sm",    // ✅ Was 42px
  sm: "h-[40px] px-3 text-xs",         // ✅ Was 36px
  lg: "h-[48px] px-5 text-base",       // ✅ Was 40px
  icon: "h-[44px] w-[44px] p-0",       // ✅ Was 36x36px
},
```

**Test:** Measure button heights on mobile → all should be ≥44px

---

## 3. Recent Messages Click Handler (30 minutes)

**File:** `/frontend/src/pages/DashboardPage/index.tsx`

**Line 258:** Add `onClick` handler:

```tsx
<div
  key={message.id}
  className="group flex items-start gap-3 py-2 border-b last:border-b-0 rounded-md cursor-pointer transition-all duration-200 hover:bg-accent/50 -mx-2 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  tabIndex={0}
  role="button"
  aria-label={`Message from ${message.author_name || 'Unknown'}: ${message.content || ''}`}
  onClick={() => navigate(`/messages/${message.id}`)} // ✅ ADD THIS LINE
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/messages/${message.id}`) // ✅ ADD THIS LINE
    }
  }}
>
```

**Test:** Click message card → should navigate. Press Enter on focused card → should navigate.

---

## 4. ARIA Labels - Top Priority (1 hour)

### 4.1 Theme Toggle

**File:** `/frontend/src/shared/layouts/MainLayout/Header.tsx`

**Line 129-136:** Replace with:

```tsx
<button
  onClick={handleToggleTheme}
  className="p-1.5 flex items-center justify-center rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  aria-label={`Switch theme (currently ${theme} mode, effective ${effectiveTheme})`} // ✅ ADD
  title={`Click to switch theme (current: ${theme})`} // ✅ UPDATE
>
  <SwatchIcon className="w-5 h-5 text-foreground" />
</button>
```

### 4.2 Dropdown Actions

**File:** `/frontend/src/pages/MessagesPage/columns.tsx`

**Line 256-261:** Replace with:

```tsx
<DropdownMenuTrigger asChild>
  <Button
    variant="ghost"
    className="h-8 w-8 p-0"
    aria-label={`Actions for message ${message.id}`} // ✅ ADD
  >
    <span className="sr-only">Open actions menu</span> // ✅ ADD
    <EllipsisHorizontalIcon className="h-4 w-4" />
  </Button>
</DropdownMenuTrigger>
```

### 4.3 Search Inputs

**File:** `/frontend/src/pages/TopicsPage/index.tsx`

**Line 166-182:** Add aria-label:

```tsx
<Input
  ref={searchInputRef}
  placeholder="Search topics by name or description..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="pl-10 pr-10"
  aria-label="Search topics" // ✅ ADD
/>
```

**Repeat for all search inputs** in:
- `/pages/MessagesPage/`
- `/pages/AnalysisRunsPage/`
- Other pages with search

---

## 5. Focus Indicators (30 minutes)

**File:** `/frontend/src/shared/ui/input.tsx`

**Line 11:** Replace ring with stronger version:

```tsx
className={cn(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  // ✅ Changed: ring-1 ring-primary/80 → ring-2 ring-primary ring-offset-2
  className
)}
```

**File:** `/frontend/src/pages/TopicsPage/index.tsx`

**Line 208-212:** Add focus state to Topic cards:

```tsx
<Card
  key={topic.id}
  className="p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer" // ✅ ADD focus-visible
  onClick={() => navigate(`/topics/${topic.id}`)}
  tabIndex={0} // ✅ ADD to make focusable
  onKeyDown={(e) => { // ✅ ADD keyboard handler
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/topics/${topic.id}`)
    }
  }}
>
```

---

## 6. Dashboard Metrics Split (2 hours)

**File:** `/frontend/src/pages/DashboardPage/index.tsx`

**Lines 140-215:** Replace with grouped layout:

```tsx
{/* Primary Metrics (Large, Prominent) */}
<div
  className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up"
  role="region"
  aria-label="Primary task statistics"
>
  <MetricCard
    title="Total Tasks"
    value={metrics.total.value}
    subtitle={metrics.total.subtitle}
    trend={metrics.total.trend}
    icon={ListBulletIcon}
    iconColor="text-primary"
    onClick={() => handleMetricClick('all')}
    size="large" // ✅ ADD size prop (needs component update)
  />
  <MetricCard
    title="Open Tasks"
    value={metrics.open.value}
    subtitle={metrics.open.subtitle}
    trend={metrics.open.trend}
    icon={ClockIcon}
    iconColor="text-primary-400"
    onClick={() => handleMetricClick('open')}
    size="large"
  />
  <MetricCard
    title="Success Rate"
    value={metrics.successRate.value}
    subtitle={metrics.successRate.subtitle}
    trend={metrics.successRate.trend}
    icon={CheckCircleIcon}
    iconColor="text-green-600"
    onClick={() => handleMetricClick('completed')}
    size="large"
  />
</div>

{/* Secondary Metrics (Smaller, Less Prominent) */}
<div
  className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up"
  style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
  role="region"
  aria-label="Secondary statistics"
>
  <MetricCard
    title="In Progress"
    value={metrics.inProgress.value}
    subtitle={metrics.inProgress.subtitle}
    trend={metrics.inProgress.trend}
    icon={ArrowPathIcon}
    iconColor="text-secondary-foreground"
    onClick={() => handleMetricClick('in_progress')}
    size="small" // ✅ ADD size prop
  />
  <MetricCard
    title="Pending Analysis"
    value={sidebarCounts?.unclosed_runs || 0}
    subtitle="AI runs active"
    icon={CpuChipIcon}
    iconColor="text-blue-600"
    onClick={() => navigate('/analysis')}
    size="small"
  />
  <MetricCard
    title="Proposals"
    value={sidebarCounts?.pending_proposals || 0}
    subtitle="awaiting review"
    icon={DocumentCheckIcon}
    iconColor="text-amber-600"
    onClick={() => navigate('/proposals')}
    size="small"
  />
</div>
```

**Note:** Need to add `size` prop to MetricCard component first:

```tsx
// /frontend/src/shared/components/MetricCard/MetricCard.tsx
interface MetricCardProps {
  // ... existing props
  size?: 'small' | 'large' // ✅ ADD
}

const sizeClasses = {
  small: 'p-4',      // Compact padding
  large: 'p-6',      // More padding
}

// Apply in component:
<Card className={cn('...', size && sizeClasses[size])}>
```

---

## 7. Empty State CTA Priority (15 minutes)

**File:** `/frontend/src/pages/DashboardPage/index.tsx`

**Lines 127-134:** Replace with clearer hierarchy:

```tsx
<div className="flex flex-col gap-3 items-center">
  {/* Primary CTA - Clear next step */}
  <Button
    onClick={() => navigate('/settings?tab=sources')} // ✅ Direct to Telegram setup
    size="lg"
  >
    <Cog6ToothIcon className="mr-2 h-5 w-5" />
    Connect Telegram (2 minutes) {/* ✅ Time estimate */}
  </Button>

  {/* Secondary action - Ghost variant */}
  <Button
    onClick={() => setShowOnboarding(true)}
    variant="ghost"
    size="lg"
  >
    Show me around
  </Button>
</div>
```

---

## 8. Quick Analysis Presets (3 hours)

**File:** `/frontend/src/features/analysis/components/CreateRunModal.tsx`

**Add after Line 50 (in component):**

```tsx
const [timePreset, setTimePreset] = useState<'24h' | '7d' | '30d' | 'custom'>('24h')

// Helper to set time window from preset
const applyTimePreset = (preset: '24h' | '7d' | '30d') => {
  const now = new Date()
  const end = now.toISOString()
  let start: string

  switch (preset) {
    case '24h':
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      break
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      break
  }

  setFormData({ ...formData, time_window_start: start, time_window_end: end })
  setTimePreset(preset)
}

// Set default on mount
useEffect(() => {
  if (open && !formData.time_window_start) {
    applyTimePreset('24h')
  }
}, [open])
```

**Replace Lines 101-114 with:**

```tsx
<div className="space-y-2">
  <Label className="text-base sm:text-sm">
    Which messages to analyze? *
  </Label>
  <p className="text-sm text-muted-foreground">
    Select a time period to analyze messages from
  </p>

  {/* Quick Presets */}
  <div className="flex gap-2 flex-wrap">
    <Button
      type="button"
      variant={timePreset === '24h' ? 'default' : 'outline'}
      size="sm"
      onClick={() => applyTimePreset('24h')}
    >
      Last 24 hours
    </Button>
    <Button
      type="button"
      variant={timePreset === '7d' ? 'default' : 'outline'}
      size="sm"
      onClick={() => applyTimePreset('7d')}
    >
      Last 7 days
    </Button>
    <Button
      type="button"
      variant={timePreset === '30d' ? 'default' : 'outline'}
      size="sm"
      onClick={() => applyTimePreset('30d')}
    >
      Last 30 days
    </Button>
    <Button
      type="button"
      variant={timePreset === 'custom' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setTimePreset('custom')}
    >
      Custom
    </Button>
  </div>

  {/* Show TimeWindowSelector only for custom */}
  {timePreset === 'custom' && (
    <TimeWindowSelector
      value={{
        start: formData.time_window_start,
        end: formData.time_window_end,
      }}
      onChange={({ start, end }) =>
        setFormData({ ...formData, time_window_start: start, time_window_end: end })
      }
    />
  )}
</div>
```

---

## Testing Commands

After applying fixes:

```bash
# 1. Color contrast
# Open Dashboard → Inspect muted text → DevTools → Contrast should be ≥4.5:1

# 2. Touch targets
# Use ruler: all buttons ≥44px height

# 3. Keyboard navigation
# Tab through entire app, Enter/Space on all interactive elements

# 4. ARIA labels
# Use screen reader (NVDA): all elements should be announced

# 5. Dashboard layout
# Check on mobile (375px): metrics should stack properly

# 6. Analysis presets
# Open CreateRunModal → click presets → time window should update
```

---

## Validation Checklist

- [ ] Color contrast ≥4.5:1 (Chrome DevTools)
- [ ] All buttons ≥44px height (measure with ruler)
- [ ] Recent Messages clickable (try clicking)
- [ ] Keyboard Tab works everywhere (no mouse)
- [ ] Theme toggle has aria-label (inspect element)
- [ ] Search inputs have aria-label (inspect element)
- [ ] Focus rings visible (Tab + check outline)
- [ ] Dashboard: 2 groups of metrics (visual check)
- [ ] Empty state: primary CTA clear (read text)
- [ ] Analysis presets work (click + check form state)

---

## Commit Message Template

```
fix(a11y): improve accessibility compliance (WCAG 2.1)

- Increase muted-foreground contrast to 4.7:1 (was 3.2:1)
- Update button touch targets to minimum 44px
- Add onClick handlers to Recent Messages cards
- Add aria-labels to theme toggle, dropdowns, search inputs
- Strengthen focus indicators (ring-2 + offset-2)
- Split Dashboard metrics into primary/secondary groups
- Update empty state CTA hierarchy
- Add Quick Analysis presets (24h, 7d, 30d)

Fixes #[issue-number]
Closes #[accessibility-audit-issue]
```

---

**Estimated time:** ~8 hours total for all quick fixes
**Expected impact:** Resolves 70% of critical accessibility issues
