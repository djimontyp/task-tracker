# Phase 1: Foundation - Task Breakdown

**Duration:** 2 weeks
**Goal:** Build Admin Panel infrastructure and feature flag system
**Dependencies:** None (foundation phase)

---

## Task Organization

**Total Tasks:** 12
**Estimated Time:** 80 hours (2 weeks × 40 hours)

---

## Infrastructure Tasks (4 tasks, 24 hours)

### Task 1.1: Create `useAdminMode()` Hook

**Estimated Time:** 4 hours
**Agent:** react-frontend-architect
**Priority:** Critical (blocks everything)

**Description:**
Create centralized hook for managing Admin Mode state with localStorage persistence.

**Implementation Details:**
```typescript
// frontend/src/hooks/useAdminMode.ts

import { useState, useEffect, useCallback } from 'react';

const ADMIN_MODE_KEY = 'taskTracker_adminMode';

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(ADMIN_MODE_KEY);
    return stored === 'true';
  });

  // Persist to localStorage on change
  useEffect(() => {
    localStorage.setItem(ADMIN_MODE_KEY, String(isAdminMode));
  }, [isAdminMode]);

  const toggleAdminMode = useCallback(() => {
    setIsAdminMode(prev => !prev);
  }, []);

  const enableAdminMode = useCallback(() => {
    setIsAdminMode(true);
  }, []);

  const disableAdminMode = useCallback(() => {
    setIsAdminMode(false);
  }, []);

  return {
    isAdminMode,
    toggleAdminMode,
    enableAdminMode,
    disableAdminMode,
  };
};
```

**Acceptance Criteria:**
- [ ] Hook returns `isAdminMode` boolean
- [ ] Hook provides `toggleAdminMode()`, `enableAdminMode()`, `disableAdminMode()` functions
- [ ] State persists across page refreshes (localStorage)
- [ ] Initial state reads from localStorage
- [ ] Hook is fully typed (TypeScript)

**Testing:**
- [ ] Unit test: Initial state defaults to `false`
- [ ] Unit test: Toggle changes state
- [ ] Unit test: State persists to localStorage
- [ ] Unit test: Hook reads from localStorage on mount

---

### Task 1.2: Create `<AdminPanel>` Base Component

**Estimated Time:** 8 hours
**Agent:** react-frontend-architect
**Priority:** Critical

**Description:**
Build collapsible Admin Panel component with smooth animations and accessibility.

**Implementation Details:**
```typescript
// frontend/src/components/AdminPanel/AdminPanel.tsx

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminPanelProps {
  visible: boolean;
  children: React.ReactNode;
  onToggle?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  visible,
  children,
  onToggle,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!visible) return null;

  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div
      className={cn(
        "border-t border-gray-200 bg-amber-50",
        "transition-all duration-300 ease-in-out"
      )}
      role="region"
      aria-label="Admin Panel"
    >
      <button
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between",
          "px-4 py-2 text-sm font-medium",
          "hover:bg-amber-100 focus:outline-none focus:ring-2",
          "focus:ring-amber-500 focus:ring-offset-2"
        )}
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2">
          <span className="text-amber-700">Admin Panel</span>
          <span className="text-xs text-gray-500">(Cmd+Shift+A to toggle)</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-3 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Panel shows only when `visible=true`
- [ ] Collapse/expand toggle with smooth animation (300ms)
- [ ] Amber background distinguishes admin content
- [ ] Keyboard accessible (focus management, ARIA labels)
- [ ] Shows hint text "(Cmd+Shift+A to toggle)"

**Testing:**
- [ ] Unit test: Panel hidden when `visible=false`
- [ ] Unit test: Panel visible when `visible=true`
- [ ] E2E test: Click toggle expands/collapses panel
- [ ] Accessibility test: Screen reader announces panel state

---

### Task 1.3: Add Keyboard Shortcut Handler

**Estimated Time:** 6 hours
**Agent:** react-frontend-architect
**Priority:** High

**Description:**
Implement global keyboard shortcut (Cmd+Shift+A) to toggle Admin Panel visibility.

**Implementation Details:**
```typescript
// frontend/src/hooks/useKeyboardShortcut.ts

import { useEffect } from 'react';

interface UseKeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
}

export const useKeyboardShortcut = ({
  key,
  ctrlKey = false,
  shiftKey = false,
  metaKey = false,
  callback,
}: UseKeyboardShortcutOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if all modifiers match
      const modifiersMatch =
        event.ctrlKey === ctrlKey &&
        event.shiftKey === shiftKey &&
        event.metaKey === metaKey;

      // Check if key matches (case insensitive)
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();

      if (modifiersMatch && keyMatches) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrlKey, shiftKey, metaKey, callback]);
};

// Usage in App.tsx or Layout.tsx
import { useAdminMode } from '@/hooks/useAdminMode';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export const App = () => {
  const { toggleAdminMode } = useAdminMode();

  useKeyboardShortcut({
    key: 'a',
    metaKey: true,  // Cmd on Mac, Ctrl on Windows/Linux
    shiftKey: true,
    callback: toggleAdminMode,
  });

  // ... rest of app
};
```

**Acceptance Criteria:**
- [ ] Cmd+Shift+A (Mac) or Ctrl+Shift+A (Windows/Linux) toggles Admin Mode
- [ ] Shortcut works from any page in the app
- [ ] Event.preventDefault() prevents default browser behavior
- [ ] Shortcut does not conflict with browser/system shortcuts
- [ ] Works with focus in input fields (optional: disable in inputs)

**Testing:**
- [ ] E2E test: Press Cmd+Shift+A → Admin Panel toggles
- [ ] E2E test: Shortcut works on all pages (Topics, Messages, Settings)
- [ ] E2E test: Shortcut does not trigger when typing in input field (if disabled)

---

### Task 1.4: Add Visual Mode Indicator

**Estimated Time:** 6 hours
**Agent:** ux-ui-design-expert
**Priority:** Medium

**Description:**
Create visual badge showing current mode (Admin/Consumer) for user awareness.

**Implementation Details:**
```typescript
// frontend/src/components/AdminBadge/AdminBadge.tsx

import { Badge } from '@/components/ui/badge';
import { Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminBadgeProps {
  isAdminMode: boolean;
  className?: string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({
  isAdminMode,
  className,
}) => {
  return (
    <Badge
      variant={isAdminMode ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1',
        isAdminMode && 'bg-amber-500 hover:bg-amber-600',
        className
      )}
    >
      {isAdminMode ? (
        <>
          <Shield className="h-3 w-3" />
          <span>Admin Mode</span>
        </>
      ) : (
        <>
          <User className="h-3 w-3" />
          <span>Consumer Mode</span>
        </>
      )}
    </Badge>
  );
};

// Usage in Header/Navbar
import { AdminBadge } from '@/components/AdminBadge';
import { useAdminMode } from '@/hooks/useAdminMode';

export const Navbar = () => {
  const { isAdminMode } = useAdminMode();

  return (
    <nav>
      {/* ... nav items ... */}
      <AdminBadge isAdminMode={isAdminMode} />
    </nav>
  );
};
```

**Acceptance Criteria:**
- [ ] Badge shows "Admin Mode" with shield icon when `isAdminMode=true`
- [ ] Badge shows "Consumer Mode" with user icon when `isAdminMode=false`
- [ ] Admin badge uses amber color scheme
- [ ] Consumer badge uses neutral color scheme
- [ ] Badge is visible in header/navbar on all pages

**Testing:**
- [ ] Visual test: Badge appears in navbar
- [ ] E2E test: Badge updates when Admin Mode toggled
- [ ] Accessibility test: Badge has descriptive text (not icon-only)

---

## Settings Integration Tasks (3 tasks, 18 hours)

### Task 1.5: Add Admin Mode Toggle to Settings

**Estimated Time:** 8 hours
**Agent:** react-frontend-architect
**Priority:** High

**Description:**
Add toggle switch to Settings page for enabling/disabling Admin Mode.

**Implementation Details:**
```typescript
// frontend/src/pages/Settings/AdminSection.tsx

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAdminMode } from '@/hooks/useAdminMode';

export const AdminSection = () => {
  const { isAdminMode, toggleAdminMode } = useAdminMode();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Admin Settings</h3>
        <p className="text-sm text-gray-500">
          Configure administrative features and diagnostics
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="admin-mode">Enable Admin Mode</Label>
          <p className="text-sm text-gray-500">
            Show admin tools, bulk operations, and diagnostic features
          </p>
        </div>
        <Switch
          id="admin-mode"
          checked={isAdminMode}
          onCheckedChange={toggleAdminMode}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          <strong>Keyboard shortcut:</strong> Press <kbd>Cmd+Shift+A</kbd> to
          quickly toggle Admin Mode from anywhere in the app.
        </p>
      </div>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Settings page has "Admin Settings" section
- [ ] Toggle switch controls Admin Mode state
- [ ] Help text explains what Admin Mode enables
- [ ] Keyboard shortcut hint displayed below toggle
- [ ] Toggle state syncs with keyboard shortcut (both update same state)

**Testing:**
- [ ] E2E test: Toggle switch in Settings enables Admin Mode
- [ ] E2E test: Keyboard shortcut syncs with Settings toggle
- [ ] E2E test: Settings page shows current Admin Mode state on load

---

### Task 1.6: Persist Toggle State Across Sessions

**Estimated Time:** 4 hours
**Agent:** react-frontend-architect
**Priority:** Medium

**Description:**
Ensure Admin Mode preference persists across browser sessions (already handled by `useAdminMode()` hook, verify integration).

**Implementation Details:**
- Verify `useAdminMode()` hook correctly reads/writes localStorage
- Test persistence across page refreshes, browser close/reopen
- Handle edge cases (localStorage disabled, private browsing)

**Acceptance Criteria:**
- [ ] Admin Mode state persists after page refresh
- [ ] Admin Mode state persists after browser close/reopen
- [ ] Gracefully handles localStorage unavailable (fallback to memory)
- [ ] No console errors if localStorage is blocked

**Testing:**
- [ ] E2E test: Enable Admin Mode → refresh page → still enabled
- [ ] E2E test: Enable Admin Mode → close browser → reopen → still enabled
- [ ] Unit test: Hook handles localStorage.setItem() failure gracefully

---

### Task 1.7: Add Help Text Explaining Admin Mode

**Estimated Time:** 6 hours
**Agent:** product-designer + documentation-expert
**Priority:** Low

**Description:**
Write clear, concise help text explaining what Admin Mode does and when to use it.

**Implementation Details:**

**Help Text Content:**
```markdown
## What is Admin Mode?

Admin Mode reveals advanced tools for system calibration and diagnostics:

- **Bulk Operations**: Select and modify multiple items at once
- **Classification Diagnostics**: Inspect AI confidence scores and reasoning
- **Metrics Dashboard**: View topic quality scores and noise analysis
- **Prompt Tuning**: Edit and test LLM prompts

**When to use Admin Mode:**
- Phase 1 (Calibration): Keep enabled to optimize AI models
- Phase 2 (Production): Disable for cleaner consumer interface

**Keyboard shortcut:** `Cmd+Shift+A` (Mac) or `Ctrl+Shift+A` (Windows/Linux)
```

**Acceptance Criteria:**
- [ ] Help text appears below Admin Mode toggle in Settings
- [ ] Text explains 4 key admin features (bulk, diagnostics, metrics, prompts)
- [ ] Text clarifies Phase 1 vs Phase 2 use cases
- [ ] Keyboard shortcut documented
- [ ] Text is concise (< 100 words)

**Testing:**
- [ ] Manual review: Help text is clear and accurate
- [ ] User testing: Non-technical user understands what Admin Mode does

---

## Styling & Animation Tasks (3 tasks, 18 hours)

### Task 1.8: Design Collapse/Expand Animation

**Estimated Time:** 6 hours
**Agent:** ux-ui-design-expert
**Priority:** Medium

**Description:**
Create smooth 300ms animation for Admin Panel collapse/expand with proper easing.

**Implementation Details:**
```typescript
// Animation using Tailwind + Radix UI primitives

// In AdminPanel.tsx, use Radix Collapsible primitive:
import * as Collapsible from '@radix-ui/react-collapsible';

export const AdminPanel = ({ visible, children }) => {
  if (!visible) return null;

  return (
    <Collapsible.Root defaultOpen={true}>
      <Collapsible.Trigger className="w-full ...">
        {/* Toggle button */}
      </Collapsible.Trigger>

      <Collapsible.Content
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2"
        )}
      >
        <div className="px-4 py-3">{children}</div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
```

**Acceptance Criteria:**
- [ ] Animation duration is 300ms
- [ ] Easing curve is smooth (ease-in-out)
- [ ] Panel slides in from top when expanding
- [ ] Panel slides out to top when collapsing
- [ ] No layout shift or flicker during animation

**Testing:**
- [ ] Visual test: Animation looks smooth (no jank)
- [ ] Performance test: Animation runs at 60fps
- [ ] E2E test: Animation completes before next interaction

---

### Task 1.9: Add Focus Management

**Estimated Time:** 8 hours
**Agent:** react-frontend-architect + ux-ui-design-expert
**Priority:** High (accessibility)

**Description:**
Manage keyboard focus when Admin Panel opens (focus first interactive element).

**Implementation Details:**
```typescript
import { useEffect, useRef } from 'react';

export const AdminPanel = ({ visible, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      // Focus first focusable element in panel
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [visible]);

  return (
    <div ref={panelRef} className="...">
      {/* Panel content */}
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] When Admin Panel opens, focus moves to first interactive element
- [ ] Tab order follows visual hierarchy (top to bottom, left to right)
- [ ] Focus indicator is visible (3px outline, high contrast)
- [ ] Shift+Tab moves focus backward correctly
- [ ] Escape key closes Admin Panel (if applicable)

**Testing:**
- [ ] Keyboard navigation test: Tab through all elements in panel
- [ ] Accessibility test: Focus order is logical
- [ ] E2E test: Open panel with keyboard → focus first element

---

### Task 1.10: Ensure Keyboard Accessibility (WCAG 2.1 AA)

**Estimated Time:** 4 hours
**Agent:** ux-ui-design-expert
**Priority:** High (accessibility)

**Description:**
Audit and fix all keyboard accessibility issues (WCAG 2.1 AA compliance).

**Implementation Details:**

**Checklist:**
- [ ] All interactive elements are keyboard accessible (Tab navigation)
- [ ] Focus indicators are visible (3px solid outline, 4.5:1 contrast)
- [ ] No keyboard traps (can Tab out of Admin Panel)
- [ ] Skip link available ("Skip to main content")
- [ ] ARIA labels for icon-only buttons
- [ ] Live regions announce Admin Mode changes to screen readers

**Example ARIA Implementation:**
```typescript
<div role="status" aria-live="polite" className="sr-only">
  {isAdminMode ? 'Admin Mode enabled' : 'Admin Mode disabled'}
</div>
```

**Acceptance Criteria:**
- [ ] Keyboard-only navigation works for all Admin Panel features
- [ ] Focus indicators meet 3:1 contrast ratio (WCAG 2.1 AA)
- [ ] Screen reader announces mode changes
- [ ] No keyboard traps detected
- [ ] Passes axe DevTools audit (0 violations)

**Testing:**
- [ ] Manual test: Navigate entire Admin Panel with keyboard only
- [ ] Screen reader test: NVDA/JAWS announces all elements correctly
- [ ] Automated test: axe-core audit passes

---

## Testing Tasks (2 tasks, 20 hours)

### Task 1.11: Unit Tests for `useAdminMode()` Hook

**Estimated Time:** 8 hours
**Agent:** pytest-test-master (adapted for frontend)
**Priority:** High

**Description:**
Write comprehensive unit tests for `useAdminMode()` hook.

**Implementation Details:**
```typescript
// frontend/src/hooks/__tests__/useAdminMode.test.ts

import { renderHook, act } from '@testing-library/react';
import { useAdminMode } from '../useAdminMode';

describe('useAdminMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes with false when localStorage is empty', () => {
    const { result } = renderHook(() => useAdminMode());
    expect(result.current.isAdminMode).toBe(false);
  });

  test('initializes with true when localStorage has "true"', () => {
    localStorage.setItem('taskTracker_adminMode', 'true');
    const { result } = renderHook(() => useAdminMode());
    expect(result.current.isAdminMode).toBe(true);
  });

  test('toggleAdminMode switches state', () => {
    const { result } = renderHook(() => useAdminMode());

    act(() => {
      result.current.toggleAdminMode();
    });

    expect(result.current.isAdminMode).toBe(true);
  });

  test('persists state to localStorage', () => {
    const { result } = renderHook(() => useAdminMode());

    act(() => {
      result.current.enableAdminMode();
    });

    expect(localStorage.getItem('taskTracker_adminMode')).toBe('true');
  });

  test('handles localStorage unavailable gracefully', () => {
    // Mock localStorage.setItem to throw error
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    const { result } = renderHook(() => useAdminMode());

    // Should not crash
    act(() => {
      result.current.toggleAdminMode();
    });

    expect(result.current.isAdminMode).toBe(true);

    setItemSpy.mockRestore();
  });
});
```

**Acceptance Criteria:**
- [ ] 100% code coverage for `useAdminMode()` hook
- [ ] Tests pass in CI/CD pipeline
- [ ] Edge cases handled (localStorage unavailable)
- [ ] Tests are fast (< 1 second total)

**Testing:**
- Run tests: `npm test useAdminMode.test.ts`

---

### Task 1.12: E2E Tests for Keyboard Shortcut Toggle

**Estimated Time:** 12 hours
**Agent:** pytest-test-master (adapted for Playwright/Cypress)
**Priority:** High

**Description:**
Write E2E tests for Cmd+Shift+A keyboard shortcut across all pages.

**Implementation Details:**
```typescript
// e2e/admin-mode.spec.ts (Playwright example)

import { test, expect } from '@playwright/test';

test.describe('Admin Mode Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
  });

  test('Cmd+Shift+A toggles Admin Panel on Topics page', async ({ page }) => {
    await page.goto('/topics');

    // Verify Admin Panel is hidden initially
    await expect(page.locator('[aria-label="Admin Panel"]')).not.toBeVisible();

    // Press Cmd+Shift+A
    await page.keyboard.press('Meta+Shift+A');

    // Verify Admin Panel is now visible
    await expect(page.locator('[aria-label="Admin Panel"]')).toBeVisible();

    // Press again to toggle off
    await page.keyboard.press('Meta+Shift+A');

    await expect(page.locator('[aria-label="Admin Panel"]')).not.toBeVisible();
  });

  test('Admin Mode persists across page refresh', async ({ page }) => {
    await page.goto('/topics');

    // Enable Admin Mode
    await page.keyboard.press('Meta+Shift+A');

    // Refresh page
    await page.reload();

    // Verify Admin Panel still visible
    await expect(page.locator('[aria-label="Admin Panel"]')).toBeVisible();
  });

  test('Settings toggle syncs with keyboard shortcut', async ({ page }) => {
    await page.goto('/settings');

    // Enable via Settings toggle
    await page.locator('#admin-mode').click();

    // Navigate to Topics
    await page.goto('/topics');

    // Verify Admin Panel visible (synced)
    await expect(page.locator('[aria-label="Admin Panel"]')).toBeVisible();

    // Press Cmd+Shift+A to toggle off
    await page.keyboard.press('Meta+Shift+A');

    // Go back to Settings
    await page.goto('/settings');

    // Verify toggle is now off (synced)
    await expect(page.locator('#admin-mode')).not.toBeChecked();
  });

  test('Admin Badge updates when mode toggles', async ({ page }) => {
    await page.goto('/topics');

    // Verify Consumer Mode badge
    await expect(page.locator('text=Consumer Mode')).toBeVisible();

    // Toggle Admin Mode
    await page.keyboard.press('Meta+Shift+A');

    // Verify Admin Mode badge
    await expect(page.locator('text=Admin Mode')).toBeVisible();
  });
});
```

**Acceptance Criteria:**
- [ ] E2E tests cover all pages (Topics, Messages, Settings)
- [ ] Tests verify persistence across page refresh
- [ ] Tests verify Settings toggle syncs with keyboard shortcut
- [ ] Tests pass in CI/CD pipeline
- [ ] Tests run in < 30 seconds

**Testing:**
- Run E2E tests: `npm run test:e2e`

---

## Phase 1 Summary

**Total Tasks:** 12
**Total Estimated Time:** 80 hours (2 weeks)

**Critical Path:**
1. Task 1.1 (useAdminMode hook) → Blocks everything
2. Task 1.2 (AdminPanel component) → Blocks UI work
3. Task 1.3 (Keyboard shortcut) → Blocks E2E tests
4. Tasks 1.11-1.12 (Tests) → Blocks phase completion

**Parallel Work Opportunities:**
- Tasks 1.5-1.7 (Settings integration) can run parallel to Task 1.4 (Badge)
- Tasks 1.8-1.10 (Styling/animation) can run parallel to Task 1.5 (Settings)

**Phase 1 Completion Criteria:**
- [ ] All 12 tasks complete
- [ ] All acceptance criteria met
- [ ] All tests passing (unit + E2E)
- [ ] Phase 1 demo: Cmd+Shift+A toggles Admin Panel on all pages

---

**Next Phase:** Phase 2 (Admin Panel Components) - starts after Phase 1 completes
