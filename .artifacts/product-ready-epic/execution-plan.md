# Execution Plan - Production Ready v0.2

**Goal:** Production Readiness 7.0 → 8.5/10
**Source:** NEXT_SESSION_TODO.md + UX_AUDIT_REPORT.md

---

## Week 1: Critical UX Fixes

### Session 1.1: Navigation & Information Architecture
**Agent:** react-frontend-architect
**Tasks:**
- Fix duplicate Dashboard navigation (rename Data Management > Dashboard → "Overview")
- Implement consistent breadcrumbs (always show "Home > Section > Page", make clickable)
- Fix sidebar active state (auto-expand parent when child active)
- Add badge tooltips (contextual labels: "198 proposals awaiting review", "1 running analysis")
- Fix message content truncation (add hover tooltip, expand icon, "View full" button)
- Improve importance score display (color badges: Low/Medium/High, text labels)

### Session 1.2: Backend - BaseCRUD Foundation
**Agent:** fastapi-backend-expert
**Parallel to 1.1**
**Tasks:**
- Create generic BaseCRUD[T] class
- Implement standardized CRUD operations
- Refactor 3 services as POC (validation, testing)

### Session 1.3: Accessibility - WCAG AA Compliance
**Agent:** react-frontend-architect
**Tasks:**
- Implement complete keyboard navigation (tabindex, visible focus rings 2px blue)
- Add proper ARIA labels (aria-label, aria-describedby to buttons/badges/tables)
- Fix color contrast violations (ensure 4.5:1 ratio for text, 3:1 for large)

### Session 1.4: Code Quality - Print & Imports
**Agent:** codebase-cleaner
**Parallel to 1.2-1.3**
**Tasks:**
- Replace 50 print statements → logger.debug()/logger.info()
- Remove 14 relative imports (replace with absolute imports)

### Session 1.5: Empty States & Feedback
**Agent:** react-frontend-architect
**Tasks:**
- Improve empty state messaging (illustration, explanation, CTA for import)
- Make dashboard empty states actionable (clickable, "Get Started" button)
- Replace generic spinners with skeleton screens and progress indicators

---

## Week 2: Code & UX Improvements

### Session 2.1: Backend - Complete BaseCRUD Refactoring
**Agent:** fastapi-backend-expert
**Tasks:**
- Refactor remaining 6 CRUD services (complete -800 LOC)

### Session 2.2: Backend - Split Large Services
**Agent:** fastapi-backend-expert
**Tasks:**
- Split analysis_service.py → analysis_validator.py, analysis_crud.py, analysis_executor.py
- Split knowledge_extraction_service.py → llm_agents.py, knowledge_orchestrator.py
- Split versioning_service.py → topic_versioning.py, atom_versioning.py, diff_service.py

### Session 2.3: UX - Data Tables & Density
**Agent:** react-frontend-architect
**Parallel to 2.1-2.2**
**Tasks:**
- Optimize column widths (flex-grow content, shorten ID, first name only)
- Add fallback for empty message rows ("(Empty message)" placeholder)
- Reduce information density (hide ID/timestamp by default, add visibility toggle)
- Improve pagination controls (hide disabled buttons, add page input)
- Reduce dashboard information overload (progressive disclosure, visual hierarchy)

### Session 2.4: UX - Mobile Experience
**Agent:** react-frontend-architect
**Parallel to 2.1-2.2**
**Tasks:**
- Implement mobile-optimized navigation (slide-out menu, hamburger, icon-only view)
- Create mobile-friendly table views (card view, 2-3 key columns, swipe gestures)

### Session 2.5: UX - User Workflows & Actions
**Agent:** react-frontend-architect
**Parallel to 2.1-2.2**
**Tasks:**
- Add undo for approve/reject actions (toast with "Undo" button, 5s window)
- Clarify message review workflow (bulk actions, progress indicator, keyboard shortcuts)
- Create message import wizard (source selection, preview, progress steps)

---

## Week 3: Testing & Consistency

### Session 3.1: Backend Tests
**Agent:** pytest-test-master
**Tasks:**
- Fix failing backend tests (target: 72 → <5 failures, 98%+ pass rate)

### Session 3.2: E2E - Telegram to Topic
**Agent:** playwright-test-specialist
**After 1.1 complete**
**Tasks:**
- Test full flow: Webhook → scoring → knowledge extraction → UI verification

### Session 3.3: E2E - Analysis Run Lifecycle
**Agent:** playwright-test-specialist
**Tasks:**
- Test: Create run, state transitions, proposal generation, error handling

### Session 3.4: E2E - Accessibility Compliance
**Agent:** playwright-test-specialist
**After 1.3 complete**
**Tasks:**
- Test keyboard navigation, ARIA audit, color contrast, WCAG AA compliance

### Session 3.5: Design System - UX Consistency
**Agent:** react-frontend-architect
**Parallel to 3.1**
**Tasks:**
- Implement button hierarchy system (Primary/Secondary/Tertiary/Destructive)
- Enforce spacing scale (4px grid: 4, 8, 16, 24, 32, 48, 64)
- Standardize icon set and usage (single library, consistent stroke width)
- Create unified status color system (blue=pending, green=success, yellow=warning, red=error, grey=neutral)

### Session 3.6: UX - Final Polish
**Agent:** react-frontend-architect
**Parallel to 3.1**
**Tasks:**
- Add list view option for topics (toggle, improve search/filter)
- Make color picker more obvious (label/icon hint, prominent display)

---

## Week 4: Finalization & Integration

### Session 4.1: Backend - Models Organization
**Agent:** database-reliability-engineer
**Tasks:**
- Organize 25 models into 4 domains (/models/analysis/, /models/knowledge/, /models/automation/, /models/core/)

### Session 4.2: Backend - Legacy Audit
**Agent:** fastapi-backend-expert
**Tasks:**
- Audit legacy.py usage across 14 files
- Migrate unused models or delete (-184 LOC technical debt potential)

### Session 4.3: Frontend - Toast Consolidation
**Agent:** codebase-cleaner
**Parallel to 4.1-4.2**
**Tasks:**
- Migrate all 17 react-hot-toast usages → sonner
- Remove react-hot-toast dependency

### Session 4.4: Integration & QA
**Agent:** Manual QA / qa-automation-specialist
**Last step**
**Tasks:**
- Full test suite execution
- Manual QA across all workflows
- Performance check (page load <2s, TTI <3s)

---

## Critical Dependencies

1. **Session 1.3** (Accessibility) → **Session 3.4** (E2E Accessibility test)
2. **Session 1.1** (Navigation) → **Sessions 3.2, 3.3** (E2E flows depend on working nav)
3. **Sessions 1-3** (All implementations) → **Session 4.4** (Integration testing)

---

## Parallel Execution Streams

**Stream A (Frontend UX):**
Session 1.1 → 1.3 → 1.5 → 2.3 → 2.4 → 2.5 → 3.5 → 3.6

**Stream B (Backend Services):**
Session 1.2 → 2.1 → 2.2 → 4.1 → 4.2

**Stream C (Code Quality):**
Session 1.4 → 4.3

**Stream D (Testing):**
Session 3.1 || Session 3.2 → 3.3 → 3.4

---

## Execution Order

**Start with:** Session 1.1 (highest user visibility impact)
**Parallel:** Sessions 1.2, 1.4 can run alongside 1.1
**Week 1 completion:** 1.3 → 1.5 (finish critical fixes)
**Week 2 onward:** Follow all streams in parallel per schedule
**Final step:** Session 4.4 (integration testing after all streams complete)

---

## Key Metrics at Each Stage

- **After Week 1:** Navigation clarity resolved, WCAG AA compliance <50%, backend -800 LOC
- **After Week 2:** Mobile experience functional, table UX optimized, large services split
- **After Week 3:** Test pass rate >98%, 3 E2E tests passing, design system documented
- **After Week 4:** Production Readiness 8.5/10, zero critical issues, full QA sign-off
