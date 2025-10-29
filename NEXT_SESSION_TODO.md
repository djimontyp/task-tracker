# NEXT_SESSION_TODO

**Updated:** 2025-10-29
**Current Status:** Production Readiness 7/10 → Target: 8.5/10
**Total Estimated Effort:** ~80-90 hours (3-4 weeks with parallel delegation)

---

## Overview

This session focuses on three parallel work streams:
1. **UX/UI Critical Fixes** (Sprint 1) - Navigation, accessibility, empty states
2. **Backend Code Quality** - Service refactoring, test completion
3. **E2E Testing** - Playwright implementation for critical user flows

---

## 🔴 SPRINT 1: UX/UI Critical Fixes (25 hours)

Focus: Navigation confusion, accessibility violations, empty state messaging

### Information Architecture (5 hours)
- [ ] **[Dashboard] Fix duplicate "Dashboard" navigation** (Effort: 2h)
  - **Problem:** Two "Dashboard" entries in sidebar (Data Management + Automation)
  - **Solution:** Rename Data Management > Dashboard to "Overview"
  - **Files:** `dashboard/src/shared/components/AppSidebar.tsx`, navigation config

- [ ] **[Breadcrumbs] Implement consistent breadcrumb hierarchy** (Effort: 1h)
  - **Problem:** Inconsistent breadcrumbs across pages, missing parent context
  - **Solution:** Always show "Home > Section > Page", make parents clickable
  - **Files:** Breadcrumb component, all page layouts

- [ ] **[Sidebar] Fix active state and parent expansion** (Effort: 1.5h)
  - **Problem:** Active state doesn't auto-expand parent sections
  - **Solution:** Auto-expand parent section when child active, highlight both
  - **Files:** `AppSidebar.tsx`, navigation state management

- [ ] **[Badges] Add tooltips and context to notification badges** (Effort: 0.5h)
  - **Problem:** "198" and "1" badges lack context
  - **Solution:** Add tooltips: "198 proposals awaiting review", "1 running analysis"
  - **Files:** Sidebar badge components

### Visual Hierarchy (5.5 hours)
- [ ] **[Messages Table] Fix message content truncation** (Effort: 2h)
  - **Problem:** Long messages truncated without tooltip or expand option
  - **Solution:** Add hover tooltip, expand/collapse icon, "View full" button
  - **Files:** Messages table cell renderer, tooltip component

- [ ] **[Messages Table] Improve importance score display** (Effort: 1.5h)
  - **Problem:** Percentages (75%, 41%) without legend or clear meaning
  - **Solution:** Add legend, use color badges (Low/Medium/High), text labels
  - **Files:** Messages table importance column component

- [ ] **[Status Badges] Create unified status color system** (Effort: 1h)
  - **Problem:** Inconsistent status colors (Pending, Analyzed, Signal, Noise)
  - **Solution:** Blue=pending, Green=success, Yellow=warning, Red=error, Grey=neutral
  - **Files:** Status badge component, design tokens, CSS variables

- [ ] **[Extract Knowledge Button] Move to contextual location** (Effort: 1h)
  - **Problem:** Large orange button in sidebar creates visual clutter
  - **Solution:** Show on Messages/Topics pages when relevant, make smaller in sidebar
  - **Files:** Sidebar component, Messages page layout

### Accessibility (7.5 hours)
- [ ] **[Keyboard Nav] Implement complete keyboard navigation** (Effort: 4h)
  - **Problem:** Many elements not keyboard accessible, no focus indicators
  - **Solution:** Add tabindex, visible focus rings (2px blue outline), keyboard shortcuts
  - **Files:** All interactive components, focus styles, keyboard event handlers

- [ ] **[ARIA] Add proper ARIA labels to all elements** (Effort: 3h)
  - **Problem:** Icons, tables, status badges lack ARIA labels
  - **Solution:** Add aria-label to buttons, aria-describedby to badges, proper table semantics
  - **Files:** All components with icons/tables/interactive elements

- [ ] **[Contrast] Fix color contrast violations** (Effort: 0.5h)
  - **Problem:** Grey badges, light metadata text don't meet WCAG 4.5:1 ratio
  - **Solution:** Darken text, increase font weight, verify with contrast checker
  - **Files:** Color tokens, badge components, text styles

### Empty States & Feedback (4 hours)
- [ ] **[Recent Topics] Improve empty state messaging** (Effort: 2h)
  - **Problem:** "No topics for this period" unhelpful, no guidance
  - **Solution:** Add illustration, explain topics, provide CTA to import messages
  - **Files:** Recent Topics widget, empty state component

- [ ] **[Dashboard Cards] Make empty state actionable** (Effort: 1h)
  - **Problem:** "Import messages to start tracking" not clickable, no guidance
  - **Solution:** Make clickable, add "Get Started" button, show step hints
  - **Files:** Dashboard stat cards, empty state handling

- [ ] **[Loading States] Replace spinners with skeleton screens** (Effort: 1h)
  - **Problem:** Generic spinners don't indicate what's loading
  - **Solution:** Use skeleton screens matching layout, progress bars for long operations
  - **Files:** Loading components, page loaders, skeleton components

### User Workflows (2 hours)
- [ ] **[Messages] Clarify message review workflow** (Effort: 2h)
  - **Problem:** Unclear what to do with pending messages, no bulk actions
  - **Solution:** Add workflow guide, bulk action toolbar, progress indicator, keyboard shortcuts
  - **Files:** Messages page, bulk action toolbar, keyboard shortcuts

---

## 🟡 SPRINT 2: UX/UI Improvements (18 hours)

Focus: Data table optimization, mobile experience, user flows

### Data Tables & Content (5 hours)
- [ ] **[Messages Table] Optimize column widths and density** (Effort: 2h)
  - **Problem:** Content column too narrow, ID/Author take too much space
  - **Solution:** Make Content flex-grow, shorten ID to number only, add column visibility controls
  - **Files:** Data table column configuration, column visibility toggle

- [ ] **[Empty Content] Add fallback for empty message rows** (Effort: 1h)
  - **Problem:** Some rows show completely empty content with no indication
  - **Solution:** Show "(Empty message)" placeholder, add icon, allow hiding
  - **Files:** Message table row renderer, empty state handling

- [ ] **[Messages Table] Reduce information density** (Effort: 1h)
  - **Problem:** 10 columns too dense, hard to scan for information
  - **Solution:** Hide ID/timestamp by default, add column visibility toggle, consider card view
  - **Files:** Messages table configuration, view toggle

- [ ] **[Pagination] Improve pagination controls** (Effort: 0.5h)
  - **Problem:** Disabled buttons shown greyed out, no quick page jump
  - **Solution:** Hide disabled buttons, add page number input field
  - **Files:** Pagination component

- [ ] **[Dashboard] Reduce information overload** (Effort: 1.5h)
  - **Problem:** 6 stat cards + widgets all visible, overwhelming for new users
  - **Solution:** Progressive disclosure, collapse empty widgets, visual hierarchy
  - **Files:** Dashboard layout, widget components

### Mobile & Responsive (7 hours)
- [ ] **[Sidebar] Implement mobile-optimized navigation** (Effort: 4h)
  - **Problem:** Sidebar not usable on mobile devices
  - **Solution:** Slide-out menu with hamburger, icon-only view, bottom nav alternative
  - **Files:** Sidebar component, mobile layout, responsive breakpoints

- [ ] **[Tables] Create mobile-friendly table views** (Effort: 3h)
  - **Problem:** Data tables unusable on mobile (10+ columns, small text)
  - **Solution:** Card view for mobile, show 2-3 key columns, swipe gestures for actions
  - **Files:** Table component, mobile card view, responsive utilities

### User Flows & Actions (4 hours)
- [ ] **[Proposals] Add undo for approve/reject actions** (Effort: 2h)
  - **Problem:** No confirmation or undo for critical actions
  - **Solution:** Toast with "Undo" button (5s window), confirmation for high-priority items
  - **Files:** Proposal action handlers, undo manager, toast notifications

- [ ] **[Import] Clarify message import flow** (Effort: 2h)
  - **Problem:** "Ingest Messages" doesn't explain sources, format, or process
  - **Solution:** Create wizard with source selection, preview, import steps, documentation links
  - **Files:** Ingestion modal, onboarding flow, help documentation

### Design System & Consistency (2 hours)
- [ ] **[Buttons] Implement button hierarchy system** (Effort: 1h)
  - **Problem:** Inconsistent button styles across app
  - **Solution:** Primary (orange), Secondary (outlined), Tertiary (text), Destructive (red)
  - **Files:** Button component library, component documentation

- [ ] **[Spacing] Enforce consistent spacing scale** (Effort: 1h)
  - **Problem:** Spacing varies across pages and components
  - **Solution:** Use 4px grid (4, 8, 16, 24, 32, 48, 64), create layout wrappers
  - **Files:** Layout components, spacing utilities, CSS variables

---

## 🟢 SPRINT 3: UX/UI Polish (7 hours)

Focus: Refinements, consistency improvements, cognitive load reduction

- [ ] **[Icons] Standardize icon set and usage** (Effort: 1.5h)
  - **Problem:** Mixed icon styles, some meanings unclear
  - **Solution:** Single library (Lucide/Heroicons), consistent stroke width, document meanings
  - **Files:** Icon imports, icon component, design documentation

- [ ] **[Topics] Add list view option for topics** (Effort: 1.5h)
  - **Problem:** Card grid hard to scan with 24 cards per page
  - **Solution:** Add list/card toggle, improve search/filter, group by category
  - **Files:** Topics page, card/list view toggle, topic card component

- [ ] **[Touch Targets] Increase touch target sizes** (Effort: 2h)
  - **Problem:** Buttons, checkboxes, pagination too small for touch (need 44x44px min)
  - **Solution:** Increase button sizes, add padding to expand hit areas
  - **Files:** Button components, table row components, touch target styles

- [ ] **[Topics] Make color picker more obvious** (Effort: 1h)
  - **Problem:** Color picker dots not obviously clickable
  - **Solution:** Add label or icon hint, make picker more prominent
  - **Files:** Topic card component, color picker component

- [ ] **[Sidebar] Fix active state consistency** (Effort: 1h)
  - **Problem:** Parent sections don't expand when child is active
  - **Solution:** Auto-expand, highlight parent section
  - **Files:** AppSidebar.tsx, navigation state

---

## 🔧 Backend Code Quality (20-25 hours)

### Service Refactoring
- [ ] **Create BaseCRUD class** (Effort: 8h)
  - **Problem:** 9 CRUD services with duplication (~800 LOC)
  - **Solution:** Generic `BaseCRUD[T]` class, refactor 9 services
  - **Impact:** -800 LOC, standardized patterns, easier testing

- [ ] **Split analysis_service.py** (Effort: 5h)
  - **Problem:** 780 LOC monolithic service
  - **Solution:** Split into: `analysis_validator.py`, `analysis_crud.py`, `analysis_executor.py`
  - **Files:** `backend/app/services/analysis/`

- [ ] **Split knowledge_extraction_service.py** (Effort: 4h)
  - **Problem:** 675 LOC monolithic service
  - **Solution:** Split into: `llm_agents.py`, `knowledge_orchestrator.py`
  - **Files:** `backend/app/services/knowledge/`

- [ ] **Split versioning_service.py** (Effort: 3h)
  - **Problem:** 653 LOC with multiple concerns
  - **Solution:** Split into: `topic_versioning.py`, `atom_versioning.py`, `diff_service.py`
  - **Files:** `backend/app/services/versioning/`

### Code Quality
- [ ] **Replace print → logger** (Effort: 1h)
  - **Problem:** 50 print statements in codebase
  - **Solution:** Replace with `logger.debug()` or `logger.info()`
  - **Files:** `importance_scorer.py`, `tasks.py`, `llm_service.py`, +11 more

- [ ] **Consolidate toast libraries** (Effort: 0.5h)
  - **Problem:** Both `sonner` and `react-hot-toast` imported (17 files vs 23 files)
  - **Solution:** Keep `sonner`, migrate 17 files, remove `react-hot-toast`
  - **Files:** Frontend components using toast

- [ ] **Organize models by domains** (Effort: 4h)
  - **Problem:** 25 models in flat `/backend/app/models/` directory
  - **Solution:** Create: `/models/analysis/`, `/models/knowledge/`, `/models/automation/`, `/models/core/`
  - **Impact:** Clear domain boundaries, easier navigation

- [ ] **Remove relative imports** (Effort: 0.5h)
  - **Problem:** 14 occurrences of `from ..` or `from .`
  - **Solution:** Replace with absolute imports `from app.models import ...`

- [ ] **Audit legacy.py** (Effort: 6h)
  - **Problem:** Legacy models (Source, TaskEntity) in 14 files
  - **Solution:** Determine usage, migrate to new models or delete
  - **Impact:** -184 LOC technical debt if unused

---

## 🧪 Testing Infrastructure (15-20 hours)

### Backend Tests
- [ ] **Fix remaining backend tests** (Effort: 8-10h)
  - **Current:** 72 failing tests (from 134 after recent session)
  - **Target:** <5 failing, 98%+ pass rate
  - **Focus areas:** Contract tests, API tests, background task tests
  - **Files:** `tests/` directory (all test files)

### E2E Playwright Tests
- [ ] **Telegram → Topic E2E test** (Effort: 2-3h)
  - **Test:** Webhook simulation, scoring, knowledge extraction, UI verification
  - **Files:** `tests/e2e/telegram-to-topic.spec.ts`

- [ ] **Analysis Run Lifecycle E2E test** (Effort: 2-3h)
  - **Test:** Create run, state transitions, proposal generation, error handling
  - **Files:** `tests/e2e/analysis-run.spec.ts`

- [ ] **Accessibility Compliance E2E test** (Effort: 2h)
  - **Test:** Keyboard navigation, ARIA audit, color contrast, WCAG AA compliance
  - **Files:** `tests/e2e/accessibility.spec.ts`

---

## 📊 Priority Breakdown

| Priority | Category | Hours | Sprint |
|----------|----------|-------|--------|
| 🔴 HIGH | UX Critical (Sprint 1) | 25h | Week 1 |
| 🟡 MEDIUM | UX Improvements (Sprint 2) | 18h | Week 2 |
| 🟢 LOW | UX Polish (Sprint 3) | 7h | Week 3 |
| 🔧 BACKEND | Code Quality | 20-25h | Parallel |
| 🧪 TESTING | E2E Tests | 15-20h | Parallel |

**Total Effort:** ~80-90 hours (3-4 weeks with parallel delegation)

---

## Execution Strategy

### Parallel Tracks
1. **UX/UI Frontend** - React Frontend Architect (Sprints 1-3)
2. **Backend Refactoring** - FastAPI Backend Expert (Services, tests)
3. **E2E Testing** - Playwright Specialist (Test infrastructure)
4. **Code Quality** - Codebase Cleaner (Polish, consolidation)

### Recommended Sequence
**Week 1:** Sprint 1 (critical UX) + Backend refactoring start
**Week 2:** Sprint 2 (UX improvements) + Backend tests complete
**Week 3:** Sprint 3 (UX polish) + E2E tests complete
**Week 4:** Buffer for refinements, integration testing

---

## Success Criteria

### UX Improvements
- ✅ WCAG 2.1 AA compliance (100% keyboard accessible, proper ARIA)
- ✅ Navigation confusion resolved (single "Dashboard", consistent breadcrumbs)
- ✅ Empty states provide guidance (CTAs, explanations, illustrations)
- ✅ Mobile experience functional (sidebar + table views work on 375px width)

### Code Quality
- ✅ Type checking passes (`just typecheck`)
- ✅ Test pass rate: 92.3% → 98%+
- ✅ Test failures: 72 → <5
- ✅ Code duplication: -800 LOC (BaseCRUD)

### Testing
- ✅ 3 E2E tests passing (Telegram→Topic, Analysis Run, Accessibility)
- ✅ No console errors during E2E tests
- ✅ Coverage report ≥75% overall, ≥85% critical paths

---

## Next Steps

1. Review this TODO with team
2. Prioritize by business goals
3. Create detailed designs for Sprint 1 items
4. Begin parallel delegation of work streams
5. Weekly sync on progress and blockers

**Production Readiness Target:** 7.5/10 → 8.5/10
**Estimated Completion:** 3-4 weeks with parallel delegation
