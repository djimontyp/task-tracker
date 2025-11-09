# WCAG 2.1 AA Accessibility Implementation Tasks

**Session:** 20251029_accessibility
**Feature:** Feature 2 - UX/Accessibility (Product-Ready Epic)
**Estimated Effort:** 7.5 hours
**Complexity Score:** 10/20 (Level 2 - Multi-Agent Orchestration)

---

## Objective

Implement WCAG 2.1 AA compliance focusing on:
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons and status indicators
- Color contrast fixes (primary-on-accent)
- Screen reader support with aria-live regions

---

## Phase 1: High-Impact Card Navigation (2h)

### Task 1.1: TopicsPage Card Grid Keyboard Access (1.5h)
- **File:** `/dashboard/src/pages/TopicsPage/index.tsx` (lines 207-234)
- **Issue:** 24 clickable cards per page with NO keyboard access
- **Priority:** CRITICAL (Impact 9/10)
- **Implementation:**
  - Add `role="button"` to each card
  - Add `tabIndex={0}` for keyboard focus
  - Implement `onKeyDown` handler for Enter/Space keys
  - Add `aria-label` with descriptive topic name
  - Add visible focus indicator (`focus:ring-2 focus:ring-primary`)
- **Pattern:**
  ```typescript
  <Card
    role="button"
    tabIndex={0}
    onClick={handleNavigate}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavigate();
      }
    }}
    aria-label={`View ${topic.name} details`}
    className="cursor-pointer focus:ring-2 focus:ring-primary"
  >
  ```
- **Acceptance:**
  - [ ] Tab key navigates through cards
  - [ ] Enter/Space keys activate navigation
  - [ ] Focus indicator visible on focused card
  - [ ] Screen reader announces topic name

### Task 1.2: Search Input Accessibility (0.5h)
- **Files:** TopicsPage, MessagesPage search inputs
- **Issue:** Placeholder-only labels (no visible/associated label)
- **Implementation:**
  - Add `aria-label` to search inputs
  - Verify Input component from shadcn/ui supports labels
  - Alternative: Add visible label if design permits
- **Pattern:**
  ```typescript
  <Input
    aria-label="Search topics by name or description"
    placeholder="Search topics..."
  />
  ```
- **Acceptance:**
  - [ ] Screen reader announces input purpose
  - [ ] Input has accessible name in accessibility tree

---

## Phase 2: Icon-Only Buttons Bulk Fix (2h)

### Task 2.1: Create Reusable IconButton Component (0.5h)
- **Location:** `/dashboard/src/shared/components/IconButton/`
- **Purpose:** Enforce aria-label on all icon-only buttons
- **Implementation:**
  - TypeScript interface with mandatory `ariaLabel` prop
  - Include `<span className="sr-only">` for screen readers
  - Support button variants (primary, ghost, danger)
  - Export through index.ts
- **Pattern:**
  ```typescript
  interface IconButtonProps extends ButtonProps {
    ariaLabel: string; // REQUIRED
    icon: React.ComponentType<{ className?: string }>;
  }

  export const IconButton: React.FC<IconButtonProps> = ({
    ariaLabel,
    icon: Icon,
    ...props
  }) => (
    <Button aria-label={ariaLabel} {...props}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{ariaLabel}</span>
    </Button>
  );
  ```
- **Acceptance:**
  - [ ] TypeScript enforces ariaLabel requirement
  - [ ] Component reusable across codebase

### Task 2.2: Refactor Existing Icon Buttons (1.5h)
- **Target Files:**
  - TopicsPage (line 179 - XMarkIcon clear button)
  - AtomCard component (action buttons)
  - ColorPickerPopover (color selection buttons)
  - ProposalCard, ProjectCard, AgentCard (action buttons)
- **Count:** ~60 instances across codebase
- **Implementation:**
  - Replace inline button + icon with IconButton component
  - Add descriptive aria-label for each button
  - Verify no regression in styling
- **Example Labels:**
  - "Clear search" (XMarkIcon)
  - "Edit atom" (PencilIcon)
  - "Delete atom" (TrashIcon)
  - "Select color" (ColorPickerPopover)
- **Acceptance:**
  - [ ] All icon buttons have aria-label
  - [ ] Screen reader announces button purpose
  - [ ] No visual regressions

---

## Phase 3: Card Components Keyboard Support (2h)

### Task 3.1: Create AccessibleCard Wrapper (0.5h)
- **Location:** `/dashboard/src/shared/components/AccessibleCard/`
- **Purpose:** Reusable card pattern with keyboard support
- **Implementation:**
  - Extend shadcn/ui Card component
  - Add keyboard navigation by default
  - Support custom onClick handlers
  - Include focus management
- **Pattern:**
  ```typescript
  interface AccessibleCardProps extends CardProps {
    onClick?: () => void;
    ariaLabel: string;
    focusable?: boolean; // default true
  }

  export const AccessibleCard: React.FC<AccessibleCardProps> = ({
    onClick,
    ariaLabel,
    focusable = true,
    children,
    ...props
  }) => (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={focusable && onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={ariaLabel}
      className={cn(
        onClick && "cursor-pointer focus:ring-2 focus:ring-primary",
        props.className
      )}
      {...props}
    >
      {children}
    </Card>
  );
  ```
- **Acceptance:**
  - [ ] Reusable across all card components
  - [ ] Keyboard navigation works out-of-box

### Task 3.2: Refactor AtomCard Component (1h)
- **File:** `/dashboard/src/features/atoms/components/AtomCard.tsx`
- **Issue:** Clickable card without keyboard support
- **Implementation:**
  - Replace Card with AccessibleCard
  - Add aria-label with atom title
  - Verify approval status badges (defer to Phase 4)
  - Test keyboard navigation
- **Acceptance:**
  - [ ] AtomCard keyboard accessible
  - [ ] Tab navigation works
  - [ ] Enter/Space activates card

### Task 3.3: Refactor Other Card Components (0.5h)
- **Files:**
  - ProposalCard
  - ProjectCard
  - AgentCard
- **Implementation:**
  - Apply AccessibleCard pattern to all
  - Add descriptive aria-labels
  - Test keyboard navigation
- **Acceptance:**
  - [ ] All card components keyboard accessible
  - [ ] Consistent focus indicators

---

## Phase 4: Status Indicators & Dynamic Content (1h)

### Task 4.1: Badge Component ARIA Labels (0.5h)
- **File:** `/dashboard/src/shared/ui/badge.tsx` (shadcn/ui)
- **Issue:** Color-only status, no ARIA labels
- **Implementation:**
  - Add optional `ariaLabel` prop to Badge
  - For status badges, include status text + icon
  - Example: "Connection status: active"
- **Pattern:**
  ```typescript
  <Badge
    variant="success"
    aria-label="Connection status: active"
  >
    <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
    Active
  </Badge>
  ```
- **Acceptance:**
  - [ ] Status badges have descriptive labels
  - [ ] Screen reader announces status

### Task 4.2: Dynamic Content aria-live Regions (0.5h)
- **Files:**
  - AppSidebar count badges (WebSocket updates)
  - AtomCard version counts
  - NotificationBadge component
- **Issue:** No `aria-live` regions, screen readers miss updates
- **Implementation:**
  - Wrap dynamic content in `aria-live="polite"` containers
  - Add `aria-atomic="true"` for full region announcements
  - Test with screen reader to verify announcements
- **Pattern:**
  ```typescript
  <div aria-live="polite" aria-atomic="true">
    <NotificationBadge count={counts.pending_proposals} />
  </div>
  ```
- **Acceptance:**
  - [ ] Screen reader announces count updates
  - [ ] No excessive announcements (use polite, not assertive)

---

## Phase 5: Color Contrast & Validation (0.5h)

### Task 5.1: Fix Primary-on-Accent Contrast (0.25h)
- **File:** `/dashboard/src/index.css`
- **Issue:** Primary (#E4572E) on Accent (#F58549) = 2.1:1 contrast (FAILS WCAG AA 4.5:1)
- **Solution Options:**
  1. Darken accent color to increase contrast
  2. Avoid text-on-accent combinations
  3. Use neutral text color when on accent backgrounds
- **Implementation:**
  - Audit codebase for primary-on-accent usage
  - Apply option 2 or 3 (least disruptive)
  - Update CSS variables if needed
- **Acceptance:**
  - [ ] All text contrast ≥4.5:1
  - [ ] No WCAG AA violations

### Task 5.2: Validation & Testing (0.25h)
- **Activities:**
  - Run axe-core accessibility audit (if available via Playwright MCP)
  - Keyboard-only navigation test (no mouse)
  - Screen reader test (VoiceOver/NVDA)
  - TypeScript compilation check
- **Deliverables:**
  - `wcag-compliance-report.md` - Before/after comparison
  - `validation-checklist.md` - Testing procedures
- **Acceptance:**
  - [ ] axe-core audit passes (0 violations)
  - [ ] Keyboard navigation works for all components
  - [ ] Type checking passes

---

## Artifacts to Generate

**Location:** `.artifacts/product-ready-epic/features/feature-2-ux/sessions/20251029_accessibility/`

1. **README.md** - Session overview with summary
2. **accessibility-fixes.md** - Component-by-component changes log
3. **wcag-compliance-report.md** - Before/after audit results
4. **validation-checklist.md** - Testing procedures and results

---

## Testing Strategy

**Incremental Testing After Each Phase:**

1. **Phase 1:** Test TopicsPage keyboard navigation immediately
2. **Phase 2:** Verify icon buttons with screen reader after bulk refactor
3. **Phase 3:** Test all card components keyboard access
4. **Phase 4:** Verify aria-live announcements with screen reader
5. **Phase 5:** Run full accessibility audit

**Tools:**
- Browser DevTools Accessibility Inspector
- axe-core browser extension (or Playwright MCP if available)
- VoiceOver (macOS) or NVDA (Windows)
- Keyboard-only navigation (no mouse)

---

## Important Notes

- **Radix UI components** (Dialog, Dropdown, Select, Tabs) are already accessible - verify, don't re-implement
- **Focus indicators** already styled globally in index.css (lines 78-92) - use existing classes
- **Skip link** not required this session (defer to Sprint 3)
- **Mobile touch targets** defer to Sprint 2 (44x44px minimum)
- **Create reusable patterns** - AccessibleCard, IconButton - for consistency

---

## Dependencies

- React 18 + TypeScript (strict mode)
- Radix UI primitives (accessible by default)
- Tailwind CSS (focus:ring-2 focus:ring-primary)
- Heroicons for icons
- shadcn/ui component library

---

## Success Criteria

**Keyboard Navigation:**
- [ ] All interactive cards have role="button" + tabIndex={0}
- [ ] Enter and Space keys activate cards
- [ ] Focus indicators visible (ring-2 ring-primary)
- [ ] Search inputs have proper labels
- [ ] Tab order logical (top to bottom, left to right)

**ARIA Labels:**
- [ ] 100% icon-only buttons have aria-label + sr-only text
- [ ] Status badges have descriptive ARIA labels
- [ ] Dynamic content has aria-live regions
- [ ] Form inputs have associated labels (not just placeholders)

**Color Contrast:**
- [ ] Primary-on-accent text contrast ≥4.5:1 (AA standard)
- [ ] All text readable against backgrounds
- [ ] Focus indicators have sufficient contrast

**Testing:**
- [ ] Keyboard-only navigation works (no mouse)
- [ ] Screen reader announces all interactive elements
- [ ] axe-core accessibility audit passes (if available)
- [ ] Type checking passes (just typecheck)
