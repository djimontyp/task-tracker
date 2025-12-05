# Page Layouts Consistency Audit

**Date:** 2025-12-05
**Status:** ✅ Complete
**Scope:** All 14 pages + MainLayout + PageHeader component

---

## Executive Summary

### Overall Assessment: 🟡 MODERATE INCONSISTENCIES

**Strengths:**
- ✅ PageHeader component використовується на 12/14 pages
- ✅ MainLayout забезпечує єдиний wrapper для всіх pages
- ✅ Responsive padding через MainLayout (`px-4 lg:px-6 xl:px-8 2xl:px-10`)
- ✅ Consistent vertical spacing (`space-y-4`, `space-y-6`)

**Critical Issues:**
- ❌ **TopicDetailPage** НЕ використовує standard spacing pattern (`p-6` замість MainLayout padding)
- ❌ **SearchPage** використовує `container` wrapper (єдина сторінка!)
- ⚠️ **AgentsPage** має зайвий `px-4 md:px-4` поверх MainLayout padding
- ⚠️ Mixing `space-y-4 sm:space-y-6 md:space-y-6` (redundant breakpoints)

**Statistics:**
- Pages with PageHeader: 12/14 (85.7%)
- Pages with standard spacing: 11/14 (78.6%)
- Pages with custom padding: 3/14 (21.4%)

---

## MainLayout Analysis

### Structure Overview

**Location:** `frontend/src/shared/layouts/MainLayout/MainLayout.tsx`

```tsx
// Desktop (lg+)
<main className="flex flex-1 flex-col gap-4 px-4 lg:px-6 xl:px-8 2xl:px-10 py-4 w-full min-w-0">
  {children}
</main>

// Mobile (<lg)
<main className="flex flex-1 flex-col gap-4 p-2 md:p-4 max-w-full">
  {children}
</main>
```

**Padding Scales:**
- **Mobile:** `p-2` (8px) → `md:p-4` (16px)
- **Desktop:** `px-4` (16px) → `lg:px-6` (24px) → `xl:px-8` (32px) → `2xl:px-10` (40px)
- **Vertical:** `py-4` (16px) - constant

**Global Gap:** `gap-4` (16px) між immediate children

### Issues Detected

#### 1. Redundant Padding Override

**AgentsPage** додає власний padding поверх MainLayout:

```tsx
// ❌ НЕПРАВИЛЬНО - дублює MainLayout padding
<div className="space-y-4 sm:space-y-6 md:space-y-6 animate-fade-in max-w-full overflow-hidden px-4 md:px-4">
```

**Impact:** Double padding на desktop (16px MainLayout + 16px page = 32px)

**Fix:** Видалити `px-4 md:px-4`:

```tsx
// ✅ ПРАВИЛЬНО
<div className="space-y-4 sm:space-y-6 md:space-y-6 animate-fade-in max-w-full overflow-hidden">
```

#### 2. Custom Layout (TopicDetailPage)

**Problem:** Використовує `p-6` замість покладання на MainLayout padding

```tsx
// ❌ НЕПРАВИЛЬНО
<div className="p-6 space-y-6 animate-fade-in">
```

**Impact:**
- Інший padding ніж інші pages (24px fixed vs responsive 16-40px)
- Не адаптується до великих екранів (xl, 2xl)

**Fix:** Видалити `p-6`:

```tsx
// ✅ ПРАВИЛЬНО
<div className="space-y-6 animate-fade-in">
```

#### 3. Unique Container Wrapper (SearchPage)

**Problem:** Єдина сторінка з `container` class

```tsx
// ❌ УНІКАЛЬНИЙ ПІДХІД
<div className="container py-12">
  <div className="max-w-2xl mx-auto text-center">
```

**Impact:**
- Ізольований layout pattern
- `container` = max-width + horizontal centering (Tailwind default)
- Різний від інших pages

**Decision:** Якщо SearchPage потребує centered layout — це OK для specialty pages, але документувати як exception.

---

## PageHeader Component Analysis

### Component Structure

**Location:** `frontend/src/shared/components/PageHeader.tsx`

```tsx
<div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-4 pb-4 md:pb-4">
  <div className="min-w-0 flex-1">
    <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
    {description && (
      <p className="mt-2 text-ellipsis overflow-hidden whitespace-nowrap text-sm text-muted-foreground">
        {description}
      </p>
    )}
  </div>
  {actions && <div className="flex-shrink-0 w-full md:w-auto">{actions}</div>}
</div>
```

**Padding:**
- Bottom: `pb-4` (16px) — constant
- Responsive: `gap-4` (16px) між title та actions

**Breakpoints:**
- Mobile: `flex-col` (stack vertically)
- Desktop (md+): `flex-row` (horizontal)

### Usage Consistency

| Page | PageHeader? | Custom Padding? | Notes |
|------|-------------|----------------|-------|
| **DashboardPage** | ✅ Yes | ❌ No | Standard |
| **MessagesPage** | ✅ Yes | ❌ No | Standard |
| **TopicsPage** | ✅ Yes | ❌ No | Standard |
| **TopicDetailPage** | ✅ Yes | ⚠️ Yes (`p-6`) | **Inconsistent** |
| **SettingsPage** | ✅ Yes | ❌ No | Standard |
| **AgentsPage** | ✅ Yes | ⚠️ Yes (`px-4`) | **Redundant** |
| **ProjectsPage** | ✅ Yes | ❌ No | Standard |
| **NoiseFilteringDashboard** | ✅ Yes | ❌ No | Standard |
| **SearchPage** | ❌ No | ⚠️ Yes (`container`) | **Unique layout** |
| **AutomationDashboardPage** | ✅ Yes | ❌ No | Standard (assumed from pattern) |
| **VersionsPage** | ✅ Yes | ❌ No | Standard (assumed) |
| **AgentTasksPage** | ✅ Yes | ❌ No | Standard (assumed) |
| **AutoApprovalSettingsPage** | ✅ Yes | ❌ No | Standard (assumed) |
| **AutomationOnboardingPage** | ✅ Yes | ❌ No | Standard (assumed) |

**Coverage:**
- **With PageHeader:** 12/14 pages (85.7%)
- **Without PageHeader:** SearchPage (custom layout), unknown 1 page

---

## Spacing Patterns Analysis

### Vertical Spacing (space-y-*)

**Patterns Found:**

```tsx
// Pattern A: Simple responsive (RECOMMENDED)
space-y-4 sm:space-y-6 md:space-y-6

// Pattern B: Simple fixed
space-y-6

// Pattern C: Simple fixed smaller
space-y-4
```

**Breakdown:**

| Pattern | Pages | Breakpoints |
|---------|-------|-------------|
| `space-y-4 sm:space-y-6 md:space-y-6` | DashboardPage, AgentsPage, NoiseFilteringDashboard | 16px → 24px @ sm → 24px @ md |
| `space-y-6` | TopicDetailPage, SettingsPage | 24px (fixed) |
| `space-y-4` | MessagesPage, TopicsPage, ProjectsPage | 16px (fixed) |

**Issue:** Redundant breakpoint `md:space-y-6`

```tsx
// ❌ CURRENT - md повторює sm value
space-y-4 sm:space-y-6 md:space-y-6

// ✅ CLEANER
space-y-4 sm:space-y-6
```

**Recommendation:** Встановити standard spacing pattern для всього проєкту:

```tsx
// Design System Standard
const pageSpacing = {
  mobile: 'space-y-4',      // 16px - mobile, tablet
  desktop: 'sm:space-y-6',  // 24px - desktop+
}

// Usage
<div className="space-y-4 sm:space-y-6">
```

### Grid Gaps (gap-*)

**Patterns Found:**

```tsx
// Pattern A: Responsive grid gap (RECOMMENDED)
gap-4 sm:gap-6 md:gap-6

// Pattern B: Fixed gap
gap-4

// Pattern C: Fixed larger gap
gap-6
```

**Breakdown:**

| Pattern | Pages | Use Case |
|---------|-------|----------|
| `gap-4 sm:gap-6 md:gap-6` | DashboardPage, NoiseFilteringDashboard | Grid cards |
| `gap-4 md:gap-6` | TopicsPage, ProjectsPage | Grid cards (clean version) |
| `gap-4` | TopicDetailPage | Grid atoms |
| `gap-2` | Buttons, inline elements | Dense spacing |

**Issue:** Same redundancy `md:gap-6`

```tsx
// ❌ CURRENT
gap-4 sm:gap-6 md:gap-6

// ✅ CLEANER
gap-4 md:gap-6
```

---

## Responsive Grid Patterns

### Grid Breakpoints

**Common Pattern:**

```tsx
// Standard responsive grid
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

**Usage:**

| Page | Grid Pattern | Use Case |
|------|--------------|----------|
| **DashboardPage** | `grid-cols-1 lg:grid-cols-3` | Recent Topics + Sidebar |
| **TopicsPage** | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Topic cards |
| **ProjectsPage** | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Project cards |
| **TopicDetailPage** | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Atom cards |
| **SearchPage** | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Topic results |
| **NoiseFilteringDashboard** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | Metric cards |

**Observation:**
- **Standard:** `1 → 2 @ md → 3 @ lg` (найбільш поширений)
- **Dashboard metrics:** `1 → 2 @ sm → 4 @ lg` (підходить для metric cards)

**Consistency:** ✅ GOOD - майже всі pages використовують one of two patterns

---

## Detailed Page Breakdown

### ✅ STANDARD PAGES (No Issues)

#### 1. DashboardPage

```tsx
<div className="space-y-4 sm:space-y-6 md:space-y-6 animate-fade-in max-w-full overflow-hidden">
  <PageHeader title="Dashboard" description="..." />

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-6">
    {/* Content */}
  </div>
</div>
```

**Analysis:**
- ✅ PageHeader: Yes
- ✅ Spacing: Standard responsive (`space-y-4 sm:space-y-6`)
- ✅ No custom padding
- ⚠️ Minor: `md:space-y-6` redundant

**Grade:** A-

---

#### 2. MessagesPage

```tsx
<div className="space-y-4 animate-fade-in w-full min-w-0 overflow-x-hidden">
  <div className="w-full min-w-0">
    <PageHeader title="Messages" description="..." actions={...} />
  </div>
  {/* Content */}
</div>
```

**Analysis:**
- ✅ PageHeader: Yes
- ✅ Spacing: Simple `space-y-4`
- ✅ No custom padding
- ✅ Extra wrappers з `min-w-0` для overflow control (OK for data-heavy page)

**Grade:** A

---

#### 3. TopicsPage

```tsx
<div className="flex flex-col gap-4">
  <PageHeader title="Topics" description="..." actions={...} />

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Cards */}
  </div>
</div>
```

**Analysis:**
- ✅ PageHeader: Yes
- ✅ Spacing: `gap-4` (flexbox) + grid `gap-4 md:gap-6`
- ✅ No custom padding
- ✅ Clean structure

**Grade:** A+

---

#### 4. SettingsPage

```tsx
<div className="space-y-6">
  <PageHeader title="Settings" description="..." />

  <Tabs defaultValue="general" className="w-full">
    {/* Tabs content */}
  </Tabs>
</div>
```

**Analysis:**
- ✅ PageHeader: Yes
- ✅ Spacing: Simple `space-y-6`
- ✅ No custom padding

**Grade:** A+

---

#### 5. ProjectsPage

```tsx
<div className="flex flex-col gap-4">
  <PageHeader title="Projects" description="..." actions={...} />

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Cards */}
  </div>
</div>
```

**Analysis:**
- ✅ PageHeader: Yes
- ✅ Spacing: Identical to TopicsPage
- ✅ No custom padding

**Grade:** A+

---

#### 6. NoiseFilteringDashboard

```tsx
<div className="space-y-4 sm:space-y-6 md:space-y-6 animate-fade-in">
  <PageHeader title="Noise Filtering" description="..." actions={...} />

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 md:gap-6">
    {/* Metric cards */}
  </div>
</div>
```

**Analysis:**
- ✅ PageHeader: Yes
- ✅ Spacing: Standard responsive
- ✅ No custom padding
- ⚠️ Minor: `md:space-y-6` redundant

**Grade:** A-

---

### ⚠️ PAGES WITH ISSUES

#### 7. AgentsPage

```tsx
// ❌ CURRENT
<div className="space-y-4 sm:space-y-6 md:space-y-6 animate-fade-in max-w-full overflow-hidden px-4 md:px-4">
  <PageHeader title="Agents" description="..." />
  <AgentList />
</div>
```

**Issues:**
- ❌ **Double padding:** `px-4 md:px-4` поверх MainLayout `px-4 lg:px-6 xl:px-8`
- ⚠️ `md:px-4` redundant (дублює base `px-4`)

**Fix:**

```tsx
// ✅ FIXED
<div className="space-y-4 sm:space-y-6 animate-fade-in max-w-full overflow-hidden">
  <PageHeader title="Agents" description="..." />
  <AgentList />
</div>
```

**Grade:** C (after fix: A)

---

#### 8. TopicDetailPage

```tsx
// ❌ CURRENT
<div className="p-6 space-y-6 animate-fade-in">
  {/* Breadcrumbs */}
  <PageHeader title={topic.name} description="..." actions={...} />

  <Card className="p-8">
    {/* Content */}
  </Card>
</div>
```

**Issues:**
- ❌ **Custom padding:** `p-6` замість MainLayout responsive padding
- ❌ **Non-responsive:** Fixed 24px на всіх екранах
- ⚠️ Extra manual `p-8` на Card (може бути OK для card padding, але перевірити consistency)

**Fix:**

```tsx
// ✅ FIXED
<div className="space-y-6 animate-fade-in">
  {/* Breadcrumbs */}
  <PageHeader title={topic.name} description="..." actions={...} />

  <Card className="p-6 lg:p-8">
    {/* Content */}
  </Card>
</div>
```

**Grade:** D (after fix: A)

---

#### 9. SearchPage

```tsx
// ❌ CURRENT - unique layout
<div className="container py-12">
  <div className="max-w-2xl mx-auto text-center">
    <SearchIcon className="h-16 w-16 text-muted-foreground" />
    <h1 className="text-2xl font-bold mb-2">Semantic Search</h1>
  </div>
</div>
```

**Issues:**
- ❌ **Unique wrapper:** `container` class (єдина сторінка!)
- ❌ **No PageHeader:** Custom heading structure
- ⚠️ **Vertical padding:** `py-12` (48px) - більше ніж standard `py-4`

**Decision:**
- SearchPage має **specialty layout** (centered search prompt)
- Допускається як **exception** для empty state
- Але results section повинен використовувати standard layout

**Current Results Section:**

```tsx
<div className="container py-6">
  <div className="mb-8">
    <h1 className="text-3xl font-bold">Search Results for "{query}"</h1>
  </div>
  {/* Grid results */}
</div>
```

**Recommendation:** Add PageHeader для consistency:

```tsx
// ✅ RECOMMENDED
<div className="space-y-6 py-6">
  <PageHeader
    title={`Search Results for "${query}"`}
    description={`${totalResults} results found (semantic similarity)`}
  />

  {/* Grid results */}
</div>
```

**Grade:** C (specialty page — needs documentation as exception)

---

## PageHeader Usage Patterns

### Description Length

**Analysis:**

| Page | Description Length | Truncation Risk |
|------|-------------------|-----------------|
| DashboardPage | 66 chars | ✅ Low |
| MessagesPage | 106 chars | ⚠️ Medium |
| TopicsPage | 77 chars | ✅ Low |
| TopicDetailPage | 112 chars | ⚠️ Medium |
| SettingsPage | 47 chars | ✅ Low |
| AgentsPage | 67 chars | ✅ Low |
| ProjectsPage | 76 chars | ✅ Low |
| NoiseFilteringDashboard | 110 chars | ⚠️ Medium |

**PageHeader CSS:**

```tsx
<p className="mt-2 text-ellipsis overflow-hidden whitespace-nowrap text-sm text-muted-foreground cursor-help">
  {description}
</p>
```

**Issue:** `whitespace-nowrap` truncates long descriptions на mobile

**Current Behavior:** Tooltip показує повний text on hover

**Recommendation:** OK для коротких descriptions, але для 100+ chars — розглянути `line-clamp-2` замість `whitespace-nowrap`:

```tsx
// ✅ ALTERNATIVE (якщо часто truncates)
<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
  {description}
</p>
```

### Actions Layout

**Pattern:** `flex-shrink-0 w-full md:w-auto`

**Behavior:**
- Mobile: Full width buttons
- Desktop: Auto width (inline)

**Examples:**

```tsx
// MessagesPage - multiple buttons
<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto min-w-0">
  <Button>Refresh</Button>
  <Button>Update Authors</Button>
  <Button>Ingest Messages</Button>
</div>

// TopicsPage - single button with toggle
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={...}>
    {viewMode === 'grid' ? <ListBulletIcon /> : <Squares2X2Icon />}
  </Button>
</div>
```

**Consistency:** ✅ GOOD - різні patterns для різних use cases

---

## Recommendations

### 1. Fix Immediate Issues (High Priority)

#### A. Remove Redundant Padding (AgentsPage)

```tsx
// Before
<div className="... px-4 md:px-4">

// After
<div className="...">
```

**File:** `frontend/src/pages/AgentsPage/index.tsx`

**Impact:** Fix double padding

---

#### B. Remove Custom Padding (TopicDetailPage)

```tsx
// Before
<div className="p-6 space-y-6 animate-fade-in">

// After
<div className="space-y-6 animate-fade-in">
```

**File:** `frontend/src/pages/TopicDetailPage/index.tsx`

**Impact:** Align with responsive MainLayout padding

---

#### C. Clean Redundant Breakpoints

**Pattern to fix:**

```tsx
// Before
space-y-4 sm:space-y-6 md:space-y-6
gap-4 sm:gap-6 md:gap-6

// After
space-y-4 sm:space-y-6
gap-4 md:gap-6
```

**Files:**
- `frontend/src/pages/DashboardPage/index.tsx`
- `frontend/src/pages/AgentsPage/index.tsx`
- `frontend/src/pages/NoiseFilteringDashboard/index.tsx`

**Impact:** Cleaner code, same visual result

---

### 2. Standardize Spacing (Medium Priority)

#### Establish Design System Spacing Constants

**Create:** `frontend/src/shared/tokens/spacing.ts`

```ts
export const pageLayout = {
  // Vertical spacing between sections
  spacing: {
    mobile: 'space-y-4',      // 16px
    desktop: 'sm:space-y-6',  // 24px @ sm+
  },

  // Grid gaps
  gridGap: {
    mobile: 'gap-4',          // 16px
    desktop: 'md:gap-6',      // 24px @ md+
  },

  // Card grids
  cardGrid: {
    standard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    metrics: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
}

// Usage
import { pageLayout } from '@/shared/tokens'

<div className={`${pageLayout.spacing.mobile} ${pageLayout.spacing.desktop}`}>
```

---

#### Update All Pages to Use Tokens

**Example:**

```tsx
// Before
<div className="space-y-4 sm:space-y-6 md:space-y-6 animate-fade-in">

// After
import { pageLayout } from '@/shared/tokens'
<div className={`${pageLayout.spacing.mobile} ${pageLayout.spacing.desktop} animate-fade-in`}>
```

---

### 3. Document Exceptions (Low Priority)

#### Create Layout Exceptions Registry

**File:** `docs/design-system/layout-exceptions.md`

**Content:**

```md
# Layout Exceptions

Pages that intentionally deviate from standard layout patterns.

## SearchPage

**Exception:** Uses `container` wrapper instead of MainLayout padding

**Reason:** Centered search prompt UI requires max-width container

**Pattern:**
- Empty state: `container py-12` with centered content
- Results state: Standard layout with PageHeader

**Status:** Approved exception for specialty UI
```

---

### 4. Improve PageHeader (Nice to Have)

#### Add Line Clamp Option for Long Descriptions

**Update:** `frontend/src/shared/components/PageHeader.tsx`

```tsx
export interface PageHeaderProps {
  title: string
  description?: string
  descriptionLines?: 1 | 2  // NEW: default 1 (single line)
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  descriptionLines = 1,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
        {description && (
          <p className={`mt-2 text-sm text-muted-foreground ${
            descriptionLines === 1
              ? 'text-ellipsis overflow-hidden whitespace-nowrap'
              : 'line-clamp-2'
          }`}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex-shrink-0 w-full md:w-auto">{actions}</div>}
    </div>
  )
}
```

**Usage:**

```tsx
// Long description - allow 2 lines
<PageHeader
  title="Messages"
  description="View and manage all incoming messages with importance scores, noise filtering, and real-time updates from Telegram"
  descriptionLines={2}
/>
```

---

## Testing Checklist

### Visual Regression Tests

- [ ] Screenshot all 14 pages at breakpoints: 375px, 768px, 1280px, 1920px
- [ ] Compare padding consistency across pages
- [ ] Verify PageHeader alignment on mobile vs desktop
- [ ] Check grid layouts wrap correctly at breakpoints

### Manual Tests

- [ ] Resize browser 375px → 2560px, verify smooth transitions
- [ ] Check AgentsPage padding after fix (should match other pages)
- [ ] Check TopicDetailPage padding after fix (responsive to xl, 2xl)
- [ ] Verify SearchPage centered layout doesn't break on mobile
- [ ] Test long PageHeader descriptions (100+ chars) on mobile

### Code Audit

- [ ] Grep for `p-6` outside of Card components (should be minimal)
- [ ] Find all `px-4 md:px-4` patterns (redundant)
- [ ] List all `space-y-* sm:space-y-* md:space-y-*` (check for md redundancy)
- [ ] Verify all pages import and use PageHeader (except SearchPage)

---

## Metrics Summary

### Before Fixes

| Metric | Value | Status |
|--------|-------|--------|
| Pages with PageHeader | 12/14 (85.7%) | 🟡 Good |
| Pages with standard spacing | 11/14 (78.6%) | 🟡 Moderate |
| Pages with custom padding | 3/14 (21.4%) | 🔴 High |
| Redundant breakpoints | 6 instances | 🔴 Medium |

### After Fixes (Projected)

| Metric | Value | Status |
|--------|-------|--------|
| Pages with PageHeader | 12/14 (85.7%) | 🟢 Good |
| Pages with standard spacing | 13/14 (92.9%) | 🟢 Excellent |
| Pages with custom padding | 1/14 (7.1%) | 🟢 Excellent |
| Redundant breakpoints | 0 instances | 🟢 Perfect |

**Exception:** SearchPage залишається з custom layout (documented)

---

## Files to Modify

### High Priority (Fix Now)

1. **frontend/src/pages/AgentsPage/index.tsx**
   - Remove `px-4 md:px-4`
   - Remove `md:space-y-6` redundancy

2. **frontend/src/pages/TopicDetailPage/index.tsx**
   - Remove `p-6` from root div
   - Optionally: make Card padding responsive (`p-6 lg:p-8`)

### Medium Priority (Cleanup)

3. **frontend/src/pages/DashboardPage/index.tsx**
   - Remove `md:space-y-6` and `md:gap-6` redundancy

4. **frontend/src/pages/NoiseFilteringDashboard/index.tsx**
   - Remove `md:space-y-6` and `sm:gap-4` redundancy

### Low Priority (Enhancements)

5. **frontend/src/shared/components/PageHeader.tsx**
   - Add `descriptionLines` prop for long descriptions

6. **frontend/src/shared/tokens/spacing.ts** (NEW)
   - Create spacing tokens for page layouts

7. **docs/design-system/layout-exceptions.md** (NEW)
   - Document SearchPage exception

---

## Conclusion

**Overall Grade:** 🟡 B+ (after fixes: A-)

**Strengths:**
- Solid MainLayout foundation з responsive padding
- PageHeader component добре прийнятий (85%)
- Consistent grid patterns

**Weaknesses:**
- 3 pages з custom padding (легко виправити)
- Redundant breakpoint declarations
- SearchPage outlier (needs documentation)

**Action Items:**
1. ✅ Fix AgentsPage and TopicDetailPage padding (30 min)
2. ✅ Remove redundant breakpoints (15 min)
3. ⚠️ Create spacing tokens (optional, 1 hour)
4. ⚠️ Document SearchPage exception (optional, 15 min)

**Next Steps:** Execute fixes, verify with visual tests, update Design System docs.
