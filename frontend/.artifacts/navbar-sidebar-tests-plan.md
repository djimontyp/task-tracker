# Navbar-Sidebar Harmony E2E Tests - TDD Plan

**Created**: 2025-12-01
**Test File**: `tests/e2e/navbar-sidebar.spec.ts`
**Approach**: Test-Driven Development (tests written BEFORE fixes)

---

## Test Categories

### 1. Sidebar Toggle Functionality (✅ Should PASS)

| Test | Expected | Rationale |
|------|----------|-----------|
| `sidebar toggle button collapses and expands sidebar` | ✅ PASS | Basic functionality works |
| `sidebar logo icon remains visible when collapsed` | ✅ PASS | Icon visibility preserved |
| `sidebar logo text is hidden when collapsed` | ✅ PASS | Text hidden via `group-data-[collapsible=icon]:hidden` |

**Status**: These tests verify existing functionality that already works.

---

### 2. Logo Size Consistency (❌ EXPECTED TO FAIL)

| Test | Expected | Problem |
|------|----------|---------|
| `navbar and sidebar logos have consistent sizing` | ❌ FAIL | Navbar: `size-8 sm:size-9`, Sidebar: `size-8` → size mismatch on desktop |
| `navbar logo icon size matches sidebar icon size` | ❌ FAIL | Navbar: `size-4 sm:size-5`, Sidebar: `size-4` → icon size mismatch |

**Bug**: Navbar logo container and icon use responsive sizing (`sm:size-9`, `sm:size-5`), while sidebar uses fixed `size-8` and `size-4`.

**Expected Failure**:
```
Error: Expected sidebar logo width (32px) to match navbar logo width (36px)
Actual difference: 4px (> 1px tolerance)
```

**Fix Required**:
```diff
- <span className="flex size-8 sm:size-9 items-center...">
+ <span className="flex size-8 items-center...">
  <Radar className="size-4 sm:size-5" />
            ^^^^^^^^^^^^^^^ also needs fix
```

---

### 3. Smooth Transitions (❌ EXPECTED TO FAIL)

| Test | Expected | Problem |
|------|----------|---------|
| `sidebar collapse has smooth transition (not instant)` | ❌ FAIL | No transition duration detected on sidebar collapse |
| `sidebar logo text fades out smoothly (not instant)` | ❌ FAIL | Text uses `display: none` (instant), not opacity fade |
| `sidebar gap transitions smoothly from gap-3 to gap-0` | ❌ FAIL | Gap changes instantly, no CSS transition |

**Bug 1: No Collapse Transition**
```typescript
// Expected: transitionDuration !== '0s'
// Actual: transitionDuration = '0s' or empty
```

**Bug 2: Text Instant Hide**
```tsx
// Current: group-data-[collapsible=icon]:hidden (display:none - instant)
// Expected: opacity-0 transition-opacity duration-200
```

**Bug 3: Gap Instant Change**
```tsx
// Current: gap-3 → gap-0 (instant change)
// Expected: transition-[gap] duration-200
```

**Fix Required**:
```diff
// Sidebar component
- <Sidebar collapsible="icon">
+ <Sidebar collapsible="icon" className="transition-all duration-300">

// Logo text
- <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">
+ <span className="text-sm font-semibold transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">

// Gap container
- <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:gap-0">
+ <div className="flex w-full items-center gap-3 transition-[gap] duration-200 group-data-[collapsible=icon]:gap-0">
```

---

### 4. Visual Harmony (✅ Should PASS)

| Test | Expected | Rationale |
|------|----------|-----------|
| `navbar height matches sidebar header height` | ✅ PASS | Both use `h-14` |
| `navbar and sidebar both use same border color` | ✅ PASS | Both use `border-border` |
| `navbar logo and sidebar logo use same background styling` | ✅ PASS | Both use `bg-primary/10 border-primary/20` |

**Status**: Visual consistency in colors and heights already correct.

---

### 5. Responsive Behavior (✅ Should PASS)

| Test | Expected | Rationale |
|------|----------|-----------|
| `mobile viewport hides navbar logo text` | ✅ PASS | Uses `hidden sm:inline-block` |
| `desktop viewport shows navbar logo text` | ✅ PASS | Responsive classes work |
| `sidebar remains functional on mobile` | ✅ PASS | Mobile drawer pattern exists |

**Status**: Responsive behavior already implemented correctly.

---

### 6. Accessibility (✅ Should PASS)

| Test | Expected | Rationale |
|------|----------|-----------|
| `sidebar toggle has proper aria-label` | ✅ PASS | `aria-label="Toggle sidebar"` exists |
| `navbar logo has proper aria-label` | ✅ PASS | Contains "home" in aria-label |
| `sidebar navigation items are keyboard accessible` | ✅ PASS | Standard link/button elements |

**Status**: Accessibility already implemented.

---

## Expected Test Results Summary

**Total Tests**: 18

| Category | Pass | Fail | Total |
|----------|------|------|-------|
| Toggle Functionality | 3 | 0 | 3 |
| Logo Size Consistency | 0 | 2 | 2 |
| Smooth Transitions | 0 | 3 | 3 |
| Visual Harmony | 3 | 0 | 3 |
| Responsive Behavior | 3 | 0 | 3 |
| Accessibility | 3 | 0 | 3 |
| **TOTAL** | **12** | **5** | **17** |

**Expected Pass Rate**: 70.6% (12/17)
**Target Pass Rate**: 100% (after fixes)

---

## How to Run Tests

```bash
# Run all navbar-sidebar tests
cd frontend
npx playwright test navbar-sidebar.spec.ts

# Run specific test
npx playwright test navbar-sidebar.spec.ts -g "logo size consistency"

# Run with UI mode (visual debugging)
npx playwright test navbar-sidebar.spec.ts --ui

# Run on chromium only (faster)
npx playwright test navbar-sidebar.spec.ts --project=chromium
```

---

## TDD Workflow

**Phase 1: VERIFY FAILURES** (Current)
1. ✅ Run tests → verify expected failures
2. ✅ Document which tests fail and why
3. ✅ Confirm test assertions are correct

**Phase 2: FIX CODE** (Next)
1. Fix logo size mismatch (Navbar.tsx)
2. Add sidebar collapse transition (sidebar.tsx)
3. Add logo text fade transition (AppSidebar/index.tsx)
4. Add gap transition (AppSidebar/index.tsx)

**Phase 3: VERIFY PASSES**
1. Re-run tests → all should pass
2. Verify no visual regressions
3. Manual browser testing

---

## Files Requiring Changes

| File | Changes Needed |
|------|----------------|
| `frontend/src/shared/layouts/MainLayout/Navbar.tsx` | Remove `sm:size-9` and `sm:size-5` from logo |
| `frontend/src/shared/components/AppSidebar/index.tsx` | Add opacity transition to logo text, add gap transition |
| `frontend/src/shared/ui/sidebar.tsx` | Add collapse transition to sidebar root |

---

## Blocker Check

**API Dependencies**: ❌ None (purely frontend UI tests)
**Backend Endpoints**: ❌ None required
**Database Seeds**: ❌ None required
**External Services**: ❌ None required

**Status**: ✅ No blockers - ready to run tests immediately

---

## Next Steps

1. Run tests to verify failures: `npx playwright test navbar-sidebar.spec.ts`
2. Analyze failure output
3. Create bug report with screenshots
4. Implement fixes (separate task)
5. Re-run tests to verify 100% pass rate
