# NEXT ACTIONS - ADR-0001 Implementation

**Quick reference for starting Phase 1 immediately**

---

## Immediate Actions (Today - Day 0)

### 1. User Review & Approval (30 minutes)

**Action:** Review epic with user to confirm understanding and get approval

**Documents to Review:**
- [README.md](./README.md) - Quick overview (5 min read)
- [epic.md](./epic.md) - Executive summary section (10 min read)
- [Phase 1 tasks](./features/phase-1-foundation/tasks.md) - First 2 weeks plan (10 min read)

**Questions to Answer:**
- [ ] Is 11-week timeline acceptable?
- [ ] Is Phase 1 → Phase 2 transition strategy clear?
- [ ] Are success metrics appropriate?
- [ ] Any concerns about 6-phase approach?

**Approval Decision:**
- [ ] ✅ APPROVED - Proceed to Phase 1 immediately
- [ ] ⚠️ NEEDS CHANGES - Iterate on epic before starting
- [ ] ❌ REJECTED - Re-evaluate approach

---

### 2. Create Phase 1 Wireframes (2 hours)

**Owner:** product-designer
**Deliverables:** 4 wireframes (see checklist below)

**Wireframes Needed:**
1. **Admin Panel - Collapsed State** (30 min)
   ```
   ┌─────────────────────────────────────┐
   │ ☰  Pulse Radar    🔍 ⚙️  [Admin] │
   ├─────────────────────────────────────┤
   │                                     │
   │ Topics Content Here                 │
   │                                     │
   ├─────────────────────────────────────┤
   │ ▼ Admin Panel (Cmd+Shift+A)        │
   └─────────────────────────────────────┘
   ```

2. **Admin Panel - Expanded State** (30 min)
   ```
   ┌─────────────────────────────────────┐
   │ ☰  Pulse Radar    🔍 ⚙️  [Admin] │
   ├─────────────────────────────────────┤
   │                                     │
   │ Topics Content Here                 │
   │                                     │
   ├─────────────────────────────────────┤
   │ ▲ Admin Panel (Cmd+Shift+A)        │
   │ ┌─────────────────────────────────┐ │
   │ │ Admin tools will appear here    │ │
   │ │ (populated in Phase 2-6)        │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
   ```

3. **Settings Page - Admin Mode Toggle** (30 min)
   - Create HTML/CSS prototype
   - Show toggle switch (on/off states)
   - Help text below toggle
   - Keyboard shortcut hint

4. **Visual Mode Indicator Badge** (30 min)
   - Admin Mode badge (amber, shield icon)
   - Consumer Mode badge (neutral, user icon)
   - Placement in navbar

**Output:** Add wireframes to [design-artifacts-checklist.md](./design-artifacts-checklist.md)

---

### 3. Setup Feature Flag Infrastructure (2 hours)

**Owner:** react-frontend-architect
**Deliverable:** `useAdminMode()` hook (Task 1.1)

**Implementation:**

```typescript
// frontend/src/hooks/useAdminMode.ts

import { useState, useEffect, useCallback } from 'react';

const ADMIN_MODE_KEY = 'taskTracker_adminMode';

export const useAdminMode = () => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    const stored = localStorage.getItem(ADMIN_MODE_KEY);
    return stored === 'true';
  });

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

**Testing:**

```typescript
// frontend/src/hooks/__tests__/useAdminMode.test.ts

import { renderHook, act } from '@testing-library/react';
import { useAdminMode } from '../useAdminMode';

describe('useAdminMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes with false by default', () => {
    const { result } = renderHook(() => useAdminMode());
    expect(result.current.isAdminMode).toBe(false);
  });

  test('toggleAdminMode switches state', () => {
    const { result } = renderHook(() => useAdminMode());
    act(() => result.current.toggleAdminMode());
    expect(result.current.isAdminMode).toBe(true);
  });

  test('persists to localStorage', () => {
    const { result } = renderHook(() => useAdminMode());
    act(() => result.current.enableAdminMode());
    expect(localStorage.getItem('taskTracker_adminMode')).toBe('true');
  });
});
```

**Acceptance:**
- [ ] Hook implemented and typed (TypeScript)
- [ ] Tests passing (100% coverage)
- [ ] Committed to feature branch: `feature/adr-0001-phase-1-foundation`

---

### 4. Create Git Branch & Project Setup (15 minutes)

**Owner:** Tech lead (react-frontend-architect)

**Commands:**

```bash
# Ensure on latest main
git checkout main
git pull origin main

# Create Phase 1 branch
git checkout -b feature/adr-0001-phase-1-foundation

# Verify branch
git branch

# Push branch to remote
git push -u origin feature/adr-0001-phase-1-foundation
```

**Project Structure:**

```
frontend/src/
├── hooks/
│   ├── useAdminMode.ts          # Task 1.1 (create today)
│   ├── useKeyboardShortcut.ts   # Task 1.3 (week 1)
│   └── __tests__/
│       └── useAdminMode.test.ts # Task 1.11 (create today)
├── components/
│   ├── AdminPanel/
│   │   ├── AdminPanel.tsx       # Task 1.2 (week 1)
│   │   └── AdminPanel.test.tsx  # Task 1.12 (week 2)
│   └── AdminBadge/
│       └── AdminBadge.tsx       # Task 1.4 (week 1)
└── pages/
    └── Settings/
        └── AdminSection.tsx     # Task 1.5 (week 1-2)
```

**Create Directories:**

```bash
cd frontend/src
mkdir -p hooks/__tests__
mkdir -p components/AdminPanel
mkdir -p components/AdminBadge
```

**Acceptance:**
- [ ] Branch created and pushed
- [ ] Directory structure ready
- [ ] Team has access to branch

---

## Week 1 Actions (Days 1-5)

### Monday (Day 1)

**Morning:**
- [ ] Team standup: announce Phase 1 start
- [ ] Assign tasks to developers (see allocation below)
- [ ] Review wireframes (if ready from Day 0)

**Afternoon:**
- [ ] Task 1.1: Implement `useAdminMode()` hook (2h - react-frontend-architect)
- [ ] Task 1.1: Write unit tests (1h - react-frontend-architect)
- [ ] Task 1.2: Start `<AdminPanel>` component (4h - react-frontend-architect)

**End of Day:**
- [ ] Standup: share progress, identify blockers
- [ ] Update [progress.md](./progress.md): mark Task 1.1 complete

---

### Tuesday (Day 2)

**Morning:**
- [ ] Team standup
- [ ] Task 1.2: Complete `<AdminPanel>` component (4h - react-frontend-architect)

**Afternoon:**
- [ ] Task 1.3: Implement `useKeyboardShortcut()` hook (3h - react-frontend-architect)
- [ ] Task 1.4: Design visual mode indicator badge (3h - ux-ui-design-expert)

**End of Day:**
- [ ] Standup: share progress
- [ ] Update progress.md: mark Task 1.2 complete

---

### Wednesday (Day 3)

**Morning:**
- [ ] Team standup
- [ ] Task 1.3: Complete keyboard shortcut integration (3h - react-frontend-architect)

**Afternoon:**
- [ ] Task 1.5: Start Settings Admin Section (4h - react-frontend-architect)
- [ ] Task 1.8: Design collapse/expand animation (3h - ux-ui-design-expert)

**End of Day:**
- [ ] Mid-week design review (1h)
- [ ] Update progress.md: mark Task 1.3 complete

---

### Thursday (Day 4)

**Morning:**
- [ ] Team standup
- [ ] Task 1.5: Complete Settings integration (4h - react-frontend-architect)

**Afternoon:**
- [ ] Task 1.9: Implement focus management (4h - react-frontend-architect)
- [ ] Task 1.10: Start accessibility audit (2h - ux-ui-design-expert)

**End of Day:**
- [ ] Standup: share progress
- [ ] Update progress.md: mark Task 1.5 complete

---

### Friday (Day 5)

**Morning:**
- [ ] Team standup
- [ ] Task 1.10: Complete accessibility audit (2h - ux-ui-design-expert)
- [ ] Task 1.11: Write unit tests for all hooks (3h - react-frontend-architect)

**Afternoon:**
- [ ] Weekly retrospective (1h)
- [ ] Demo Week 1 progress (30 min)
- [ ] Plan Week 2 work (30 min)

**End of Day:**
- [ ] Update progress.md: Week 1 summary
- [ ] Prepare for Week 2 (Tasks 1.6-1.7, 1.12)

---

## Week 2 Actions (Days 6-10)

### Focus: Complete Phase 1, E2E Testing

**Monday (Day 6):**
- [ ] Task 1.6: Verify toggle state persistence (4h)
- [ ] Task 1.7: Write help text for Admin Mode (3h)
- [ ] Task 1.12: Start E2E tests (4h)

**Tuesday-Thursday (Days 7-9):**
- [ ] Task 1.12: Complete E2E tests (20h total across 3 days)
- [ ] Bug fixes from testing
- [ ] Polish animations and interactions

**Friday (Day 10):**
- [ ] Phase 1 demo (1h)
- [ ] Verify all acceptance criteria (1h)
- [ ] Retrospective (1h)
- [ ] Plan Phase 2+3 parallel work (1h)

---

## Team Allocation (Week 1-2)

### Frontend Developers (2 devs)

**Dev 1 (react-frontend-architect):**
- Week 1: Tasks 1.1-1.3, 1.5, 1.9 (infrastructure, hooks, components)
- Week 2: Task 1.12 (E2E tests)

**Dev 2 (frontend-dev-2):**
- Week 1: Assist with Task 1.2 (AdminPanel), Task 1.4 (badge)
- Week 2: Tasks 1.6-1.7 (persistence, help text)

### Designer (ux-ui-design-expert)

**Week 1:**
- Day 0: Wireframes (Tasks 1.1-1.4 designs)
- Days 1-5: Tasks 1.4, 1.8, 1.10 (badge, animation, accessibility)

**Week 2:**
- Days 6-10: Design Phase 2+3 wireframes (parallel work prep)

---

## Success Criteria (End of Week 2)

### Functional Requirements

- [ ] **Task 1.1:** `useAdminMode()` hook works (toggle, persist, restore)
- [ ] **Task 1.2:** `<AdminPanel>` collapses/expands smoothly (300ms animation)
- [ ] **Task 1.3:** Cmd+Shift+A keyboard shortcut toggles panel
- [ ] **Task 1.4:** Badge shows current mode (Admin/Consumer) in navbar
- [ ] **Task 1.5:** Settings has Admin Mode toggle switch
- [ ] **Task 1.6:** Admin Mode persists across page refreshes
- [ ] **Task 1.7:** Help text explains what Admin Mode does
- [ ] **Task 1.8:** Animation is smooth (no jank, 60fps)
- [ ] **Task 1.9:** Focus management works (first element focused on open)
- [ ] **Task 1.10:** Passes WCAG 2.1 AA audit (0 axe violations)
- [ ] **Tasks 1.11-1.12:** All tests passing (unit + E2E)

### Quality Gates

- [ ] **Code Coverage:** 90%+ for Phase 1 code
- [ ] **Performance:** Panel toggle < 100ms interaction time
- [ ] **Accessibility:** 0 axe violations, keyboard-only navigation works
- [ ] **Browser Compatibility:** Tested in Chrome, Firefox, Safari
- [ ] **Mobile:** Works on iOS and Android (touch + keyboard)

### Documentation

- [ ] **Component Specs:** AdminPanel, AdminBadge documented in Storybook
- [ ] **Hook API:** useAdminMode() documented with examples
- [ ] **Handoff Doc:** Design → dev handoff complete for Phase 2

---

## Blockers & Escalation

### Known Risks

**Risk 1: localStorage Not Available (Private Browsing)**
- **Impact:** Admin Mode toggle won't persist
- **Mitigation:** Fallback to in-memory state, show warning message
- **Owner:** react-frontend-architect

**Risk 2: Keyboard Shortcut Conflicts**
- **Impact:** Cmd+Shift+A may conflict with browser/OS shortcuts
- **Mitigation:** Test on all platforms, provide alternative shortcut
- **Owner:** ux-ui-design-expert

**Risk 3: Animation Performance on Mobile**
- **Impact:** 300ms animation may lag on low-end devices
- **Mitigation:** Reduce animation duration to 200ms if needed, test on old devices
- **Owner:** react-frontend-architect

### Escalation Path

**If blocked on Task:**
1. Try to resolve within 2 hours (ask team for help)
2. If still blocked, escalate to tech lead (react-frontend-architect)
3. If critical, escalate to PM/user for prioritization decision

**If Phase 1 Delays:**
- **< 2 days delay:** Continue, adjust Week 2 plan
- **2-4 days delay:** Consider cutting Task 1.4 (badge) or Task 1.7 (help text) - nice to have
- **> 4 days delay:** Escalate to PM, discuss MVP scope reduction

---

## Quick Commands

### Development

```bash
# Start dev server
just services-dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Type checking
just typecheck

# Format code
just fmt
```

### Git Workflow

```bash
# Commit Task 1.1 completion
git add frontend/src/hooks/useAdminMode.ts
git commit -m "feat(phase-1): implement useAdminMode hook (Task 1.1)"

# Push to remote
git push origin feature/adr-0001-phase-1-foundation

# Create PR (end of Week 2)
gh pr create --title "Phase 1: Foundation (ADR-0001)" \
  --body "$(cat <<EOF
## Phase 1 Complete

Implements Admin Panel infrastructure and feature flag system.

### Acceptance Criteria
- [x] Cmd+Shift+A toggles Admin Panel
- [x] Admin Mode persists across sessions
- [x] Settings has toggle switch
- [x] All tests passing (12/12)

### Demo
[Link to Loom video]
EOF
)"
```

---

## Phase 1 → Phase 2 Handoff

### Week 2 Friday (Phase 1 Complete)

**Checklist:**

1. **Merge Phase 1 PR:**
   - [ ] All tests passing
   - [ ] Code reviewed by react-frontend-architect
   - [ ] Approved by product-designer (UX)
   - [ ] Merge to main

2. **Tag Release:**
   ```bash
   git tag -a v0.1.0-adr-0001-phase-1 -m "Phase 1: Foundation complete"
   git push origin v0.1.0-adr-0001-phase-1
   ```

3. **Update Progress:**
   - [ ] Mark Phase 1 complete in [progress.md](./progress.md)
   - [ ] Update pain point progress (0% → 10%)
   - [ ] Add Week 2 summary to progress.md

4. **Prepare Phase 2+3:**
   - [ ] Create branches: `feature/adr-0001-phase-2`, `feature/adr-0001-phase-3`
   - [ ] Assign tasks to developers (2 devs each phase)
   - [ ] Review Phase 2+3 wireframes with team

5. **Celebrate:**
   - [ ] Ship Phase 1 demo video to user
   - [ ] Team celebration (virtual coffee, shoutouts)

---

## Contact & Help

**Questions About:**
- **Epic Structure:** Read [README.md](./README.md) or ask @product-designer
- **Phase 1 Tasks:** Read [Phase 1 tasks](./features/phase-1-foundation/tasks.md) or ask @react-frontend-architect
- **Design Artifacts:** Read [design-artifacts-checklist.md](./design-artifacts-checklist.md) or ask @ux-ui-design-expert
- **Technical Blockers:** Escalate to tech lead immediately

**Slack Channels:**
- #adr-0001-implementation - Main discussion
- #design - Design reviews
- #dev - Technical questions

---

**Ready to Start?**

✅ All documents reviewed?
✅ User approval received?
✅ Team allocated?
✅ Git branch created?

**→ GO BUILD PHASE 1! 🚀**

---

**Created:** 2025-11-02
**Last Updated:** 2025-11-02
**Status:** READY TO START
