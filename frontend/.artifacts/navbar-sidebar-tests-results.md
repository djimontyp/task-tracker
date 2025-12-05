# Navbar-Sidebar E2E Tests - TDD Results

**Run Date**: 2025-12-01
**Test File**: `tests/e2e/navbar-sidebar.spec.ts`
**Command**: `npx playwright test navbar-sidebar.spec.ts --project=chromium`

---

## Executive Summary

**Total Tests**: 17
**Passed**: 10 ✅
**Failed**: 7 ❌
**Pass Rate**: 58.8%

**Status**: ✅ TDD validation successful — tests correctly identified UX bugs

---

## Test Results by Category

### 1. Sidebar Toggle Functionality (❌ 1/3 FAILED)

| Test | Result | Details |
|------|--------|---------|
| `sidebar toggle button collapses and expands sidebar` | ❌ FAIL | `data-state` attribute missing on sidebar |
| `sidebar logo icon remains visible when collapsed` | ✅ PASS | Icon visibility preserved |
| `sidebar logo text is hidden when collapsed` | ❌ FAIL | Cannot verify — `data-state` missing |

**Root Cause**: Sidebar component doesn't expose `data-state` attribute for E2E testing.

**Fix Required**:
```tsx
// frontend/src/shared/ui/sidebar.tsx
<SidebarPrimitive.Root
  data-state={state}  // Add this
  {...props}
>
```

---

### 2. Logo Size Consistency (❌ 2/2 FAILED - Expected)

| Test | Result | Actual Difference |
|------|--------|-------------------|
| `navbar and sidebar logos have consistent sizing` | ❌ FAIL | **4px difference** (navbar 36px vs sidebar 32px) |
| `navbar logo icon size matches sidebar icon size` | ❌ FAIL | **4px difference** (navbar 20px vs sidebar 16px) |

**Root Cause**: Navbar uses responsive sizing `sm:size-9` and `sm:size-5`, sidebar uses fixed `size-8` and `size-4`.

**Evidence**:
```
Expected: <= 1px tolerance
Received: 4px difference
```

**Fix Required**:
```diff
// frontend/src/shared/layouts/MainLayout/Navbar.tsx (line 95)
- <span className="flex size-8 sm:size-9 items-center...">
+ <span className="flex size-8 items-center...">
-   <Radar className="size-4 sm:size-5" />
+   <Radar className="size-4" />
```

**Status**: ✅ **TDD SUCCESS** — test correctly identified visual inconsistency

---

### 3. Smooth Transitions (❌ 2/3 FAILED - Expected)

| Test | Result | Details |
|------|--------|---------|
| `sidebar collapse has smooth transition (not instant)` | ❌ FAIL | `transitionDuration: "0s"` (instant collapse) |
| `sidebar logo text fades out smoothly (not instant)` | ✅ PASS | Test passed (needs verification) |
| `sidebar gap transitions smoothly from gap-3 to gap-0` | ❌ FAIL | Selector too broad (12 matches) |

**Root Cause (Test #1)**: Sidebar has no collapse transition.

**Evidence**:
```
Expected: transitionDuration !== "0s"
Received: transitionDuration = "0s"
```

**Fix Required**:
```diff
// frontend/src/shared/ui/sidebar.tsx
- <div className="flex h-full w-full flex-col bg-sidebar...">
+ <div className="flex h-full w-full flex-col bg-sidebar transition-all duration-300...">
```

**Root Cause (Test #3)**: CSS selector `.flex.w-full.items-center` matches 12 elements (too generic).

**Fix Required**:
```diff
// Test selector needs to be more specific
- const logoContainer = sidebar.locator('.flex.w-full.items-center')
+ const logoContainer = sidebar.locator('[data-sidebar="header"] .flex.w-full.items-center')
```

**Status**: ✅ **TDD SUCCESS** — test #1 correctly identified missing transition

---

### 4. Visual Harmony (✅ 3/3 PASSED)

| Test | Result | Details |
|------|--------|---------|
| `navbar height matches sidebar header height` | ✅ PASS | Both use `h-14` |
| `navbar and sidebar both use same border color` | ✅ PASS | Both use `border-border` |
| `navbar logo and sidebar logo use same background styling` | ✅ PASS | Both use `bg-primary/10 border-primary/20` |

**Status**: ✅ Visual consistency already correct

---

### 5. Responsive Behavior (❌ 1/3 FAILED)

| Test | Result | Details |
|------|--------|---------|
| `mobile viewport hides navbar logo text` | ✅ PASS | `hidden sm:inline-block` works |
| `desktop viewport shows navbar logo text` | ✅ PASS | Responsive classes work |
| `sidebar remains functional on mobile (via mobile mode)` | ❌ FAIL | Toggle button not found on mobile |

**Root Cause**: Mobile viewport might not render toggle button correctly.

**Needs Investigation**: Check MainLayout mobile sidebar behavior.

---

### 6. Accessibility (✅ 3/3 PASSED)

| Test | Result | Details |
|------|--------|---------|
| `sidebar toggle has proper aria-label` | ✅ PASS | `aria-label="Toggle sidebar"` exists |
| `navbar logo has proper aria-label` | ✅ PASS | Contains "home" in aria-label |
| `sidebar navigation items are keyboard accessible` | ✅ PASS | Standard link/button elements |

**Status**: ✅ Accessibility already implemented

---

## Critical Bugs Identified (TDD Success)

### 🔴 Bug #1: Logo Size Mismatch (CONFIRMED)

**Severity**: High (UX inconsistency)
**Location**: `frontend/src/shared/layouts/MainLayout/Navbar.tsx:95-96`

**Issue**: Navbar logo container is 36px (sm:size-9) vs sidebar 32px (size-8).

**Visual Impact**: Logos "jump" in size when comparing navbar to sidebar.

**Fix**:
```diff
- <span className="flex size-8 sm:size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
-   <Radar className="size-4 sm:size-5" />
+ <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
+   <Radar className="size-4" />
```

**Test Evidence**: 4px difference measured in E2E test

---

### 🔴 Bug #2: Instant Collapse (No Transition) (CONFIRMED)

**Severity**: Medium (UX polish)
**Location**: `frontend/src/shared/ui/sidebar.tsx`

**Issue**: Sidebar collapses instantly (`transitionDuration: 0s`), no smooth animation.

**Visual Impact**: Jarring instant collapse, not polished.

**Fix**:
```diff
- <div className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg...">
+ <div className="transition-all duration-300 flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg...">
```

**Test Evidence**: E2E test detected `transitionDuration = "0s"`

---

## Test Infrastructure Issues (Non-Critical)

### Issue #1: Missing `data-state` Attribute

**Impact**: Cannot verify sidebar state in E2E tests

**Location**: `frontend/src/shared/ui/sidebar.tsx`

**Fix**:
```tsx
<SidebarPrimitive.Root
  ref={ref}
  data-state={state}  // Add this for E2E
  className="..."
  {...props}
>
```

---

### Issue #2: Overly Generic CSS Selector

**Test**: `sidebar gap transitions smoothly from gap-3 to gap-0`

**Problem**: `.flex.w-full.items-center` matches 12 elements

**Fix**:
```diff
- const logoContainer = sidebar.locator('.flex.w-full.items-center')
+ const logoContainer = sidebar.locator('[data-sidebar-header]').locator('.flex')
```

**Alternative**: Add `data-testid="sidebar-logo-container"` to logo div

---

### Issue #3: Mobile Sidebar Toggle Not Found

**Test**: `sidebar remains functional on mobile (via mobile mode)`

**Problem**: `getByRole('button', { name: 'Toggle sidebar' })` not found on mobile

**Needs Investigation**:
1. Check if MainLayout renders different toggle on mobile
2. Verify mobile breakpoint behavior
3. Check if mobile uses drawer pattern instead

---

## TDD Validation Summary

| Category | TDD Goal | Result |
|----------|----------|--------|
| **Size Mismatch** | Should FAIL | ✅ FAILED (4px diff detected) |
| **Instant Collapse** | Should FAIL | ✅ FAILED (0s transition detected) |
| **Visual Harmony** | Should PASS | ✅ PASSED (colors/heights match) |
| **Accessibility** | Should PASS | ✅ PASSED (aria-labels correct) |

**TDD Status**: ✅ **SUCCESS** — Tests correctly identified real UX bugs before fixes

---

## Next Steps

### Phase 1: Fix Critical Bugs (Immediate)

1. ✅ Fix logo size mismatch (Navbar.tsx)
   - Remove `sm:size-9` and `sm:size-5`
   - Use fixed `size-8` and `size-4` to match sidebar

2. ✅ Add sidebar collapse transition (sidebar.tsx)
   - Add `transition-all duration-300` to root div

3. ⚠️ Add `data-state` attribute (sidebar.tsx)
   - Enable E2E state verification

### Phase 2: Fix Test Issues (Optional)

4. ⚠️ Fix gap transition test selector
   - Use more specific selector or add `data-testid`

5. ⚠️ Investigate mobile toggle issue
   - Check MainLayout mobile rendering

### Phase 3: Re-run Tests

6. Run tests again: `npx playwright test navbar-sidebar.spec.ts`
7. Expected result: **15/17 passing** (after fixes)
8. Remaining failures should be test infrastructure issues only

---

## Files Requiring Changes

| Priority | File | Changes |
|----------|------|---------|
| 🔴 **High** | `frontend/src/shared/layouts/MainLayout/Navbar.tsx` | Remove responsive sizing (lines 95-96) |
| 🔴 **High** | `frontend/src/shared/ui/sidebar.tsx` | Add transition-all duration-300 |
| 🟡 **Medium** | `frontend/src/shared/ui/sidebar.tsx` | Add data-state attribute |
| 🟡 **Medium** | `tests/e2e/navbar-sidebar.spec.ts` | Fix gap transition selector (line 178) |
| 🟢 **Low** | `tests/e2e/navbar-sidebar.spec.ts` | Investigate mobile toggle (line 290) |

---

## Screenshots

Test failure screenshots saved to:
```
test-results/navbar-sidebar-*/test-failed-*.png
```

**Key Evidence**:
- Logo size mismatch: `test-failed-1.png` (4px difference visible)
- Instant collapse: `test-failed-1.png` (sidebar state)

---

## Conclusion

✅ **TDD approach successful!**

Tests correctly identified:
1. **Logo size mismatch** (4px difference)
2. **Missing collapse transition** (instant jump)
3. **Visual harmony** (already correct ✅)
4. **Accessibility** (already correct ✅)

**Next**: Implement fixes and re-run tests to verify 100% pass rate.
