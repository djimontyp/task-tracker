# Epic: ADR-0001 Unified Admin Approach Implementation

**Status:** In Progress
**Timeline:** 11 weeks (6 phases)
**Complexity:** Level 3 Epic (20/20 points)
**Owner:** Product Designer + react-frontend-architect + fastapi-backend-expert

---

## Executive Summary

This epic implements ADR-0001: Unified Admin Approach - a comprehensive app redesign that solves 4 critical pain points through a two-layer architecture (Consumer UI + Admin Panel). The system evolves from Phase 1 (calibration tool) to Phase 2 (consumer product) without requiring UI rework.

### Problem Context

**Current State:**
- Fragmented navigation (6 top-level sections: Messages, Topics, Atoms, Analysis, Proposals, Settings)
- Mixed Consumer + Admin concerns in single interface
- No clear evolution path from calibration tool (Phase 1) to consumer product (Phase 2)
- Outdated visual design patterns

**Impact:**
- Users struggle with cognitive overload (too many top-level sections)
- Administrative tools clutter main navigation for future consumer users
- Transition to Phase 2 would require complete UI rewrite (high risk)

### Solution Architecture

**Two-Layer System:**

1. **Consumer UI Layer (default):** Browse, search, export knowledge
   - Topics: Grid/list views, semantic relationships, export
   - Messages: Unified inbox, search, filters
   - Search: Hybrid (keyword + semantic vector)
   - Export: Markdown, JSON, API documentation

2. **Admin Panel Layer (toggle via Cmd+Shift+A):** Diagnostic and calibration tools
   - Classification diagnostics (Message Inspect modal)
   - Bulk operations (multi-select, batch actions)
   - Metrics dashboard (quality scores, noise analysis)
   - Prompt tuning interface (LLM reasoning transparency)

**Feature Flag Strategy:**
```typescript
// Phase 1 (current): localStorage-based
const isAdminMode = localStorage.getItem('adminMode') === 'true';

// Phase 2 (future): backend roles
const isAdminMode = user.role === 'admin' || user.role === 'owner';
```

**Transition Plan:**
- Phase 1: Admin Panel visible by default (calibration mode)
- Phase 2: Admin Panel hidden for regular users (consumer mode)
- Owner always retains admin access for diagnostics

### Key Milestones

| Phase | Duration | Deliverable | Verification |
|-------|----------|-------------|-------------|
| 1: Foundation | 2 weeks | Admin Panel infrastructure + feature flags | Cmd+Shift+A toggles panel |
| 2: Admin Panel | 2 weeks | Bulk actions, metrics, prompt tuning UI | Bulk select 10 topics → approve |
| 3: Message Inspect | 2 weeks | Classification diagnostics modal | View LLM reasoning for message |
| 4: Topics | 1.5 weeks | Enhanced topics with admin/consumer views | Grid/list toggle + quality score |
| 5: Analysis | 1.5 weeks | Analysis runs + proposals refactor | Proposals inline in Topics |
| 6: Export + API | 2 weeks | Export functionality + API docs | Export 5 topics as Markdown |

### Success Metrics

**Quantitative:**
- Reduce top-level navigation sections: 6 → 3 (50% simplification)
- Admin Panel toggle latency: < 100ms (instant feedback)
- Feature flag coverage: 100% of admin-only features
- Zero breaking changes during Phase 1 → Phase 2 transition

**Qualitative:**
- Users can browse knowledge without seeing admin complexity (Consumer UI)
- Admins can diagnose classification issues in < 2 clicks (Message Inspect)
- Transition to Phase 2 requires only feature flag toggle (no code rewrite)

### Critical Path

```
Phase 1 (Foundation)
   ↓
Phase 2 (Admin Panel) ←─ parallel with ─→ Phase 3 (Message Inspect)
   ↓
Phase 4 (Topics) ←─ parallel with ─→ Phase 5 (Analysis)
   ↓
Phase 6 (Export + API)
```

**Blockers:**
- Phase 1 must complete before any other phase (foundation dependency)
- Phase 4 + 5 depend on Phase 2 + 3 (admin components needed)
- Phase 6 depends on all previous phases (integrates everything)

**Parallelization Opportunities:**
- Phase 2 (Admin Panel) + Phase 3 (Message Inspect) can run in parallel (weeks 3-4)
- Phase 4 (Topics) + Phase 5 (Analysis) can run in parallel (weeks 7-8)
- Frontend (Consumer UI) + Backend (Admin APIs) can be developed in parallel

### Risk Mitigation

**Risk 1: Managing 2 UI Systems**
- **Mitigation:** Shared component pattern with `variant="admin"` vs `variant="consumer"` props
- **Example:** `<TopicCard variant={isAdminMode ? 'admin' : 'consumer'} />`

**Risk 2: Feature Flag Infrastructure Complexity**
- **Mitigation:** Centralized `useAdminMode()` hook, single source of truth
- **Example:** Replace localStorage with backend roles in single hook update

**Risk 3: Developer Cognitive Load**
- **Mitigation:** Clear documentation, component library with usage examples
- **Example:** Storybook stories for both Consumer + Admin variants

**Risk 4: Timeline Overrun**
- **Mitigation:** Each phase independently verifiable, can pause/resume between phases
- **Rollback Plan:** Feature flag allows instant rollback to current UI

---

## Phase-by-Phase Breakdown

### Phase 1: Foundation (2 weeks)

**Goal:** Build Admin Panel infrastructure and feature flag system

**Dependencies:** None (foundation phase)

**Deliverables:**
1. `<AdminPanel>` component with collapse/expand behavior
2. Keyboard shortcut handler (Cmd+Shift+A)
3. `useAdminMode()` hook with localStorage persistence
4. Settings page toggle for Admin Mode
5. Visual indicator showing current mode (Admin/Consumer badge)

**Acceptance Criteria:**
- ✅ Cmd+Shift+A toggles Admin Panel visibility
- ✅ Admin Mode persists across page refreshes (localStorage)
- ✅ Settings has "Enable Admin Mode" toggle
- ✅ Smooth animation (300ms transition) on panel open/close
- ✅ Keyboard focus management (focus first element in panel on open)

**Tasks:** See `/features/phase-1-foundation/tasks.md`

**Recommended Agents:**
- react-frontend-architect (component structure)
- ux-ui-design-expert (interaction design)

---

### Phase 2: Admin Panel Components (2 weeks)

**Goal:** Build reusable admin components (bulk actions, metrics, prompt tuning)

**Dependencies:** Phase 1 (Admin Panel infrastructure)

**Deliverables:**
1. `<BulkActionsToolbar>` with multi-select checkbox pattern
2. `<MetricsDashboard>` showing topic quality scores, noise stats
3. `<PromptTuningInterface>` for LLM prompt editing
4. `<AdminBadge>` for visual admin-only indicators
5. Bulk operations API endpoints (approve, archive, delete)

**Acceptance Criteria:**
- ✅ Select 10 topics → bulk approve in single API call
- ✅ Metrics dashboard shows real-time stats (WebSocket updates)
- ✅ Prompt tuning saves changes with validation
- ✅ Admin Badge appears only when `isAdminMode=true`
- ✅ Bulk actions show loading state and success/error feedback

**Tasks:** See `/features/phase-2-admin-panel/tasks.md`

**Recommended Agents:**
- react-frontend-architect (components)
- fastapi-backend-expert (bulk APIs)
- database-reliability-engineer (efficient bulk queries)

---

### Phase 3: Message Inspect Modal (2 weeks)

**Goal:** Build diagnostic modal for classification transparency

**Dependencies:** Phase 1 (Admin Panel infrastructure)

**Parallel Work:** Can run alongside Phase 2

**Deliverables:**
1. `<MessageInspectModal>` with classification details
2. LLM reasoning visibility (confidence scores, decision rationale)
3. Atom extraction review (entities, keywords, embeddings)
4. Bulk edit functionality (reassign topic, approve/reject)
5. Classification history timeline (show previous classifications)

**Acceptance Criteria:**
- ✅ Click message → modal opens with full classification details
- ✅ LLM reasoning shows confidence scores + decision tree
- ✅ Atom extraction shows all extracted entities with embeddings
- ✅ Can reassign message to different topic from modal
- ✅ Classification history shows timeline with diffs

**Tasks:** See `/features/phase-3-message-inspect/tasks.md`

**Recommended Agents:**
- react-frontend-architect (modal component)
- llm-prompt-engineer (reasoning visualization)
- product-designer (diagnostic UX patterns)

---

### Phase 4: Topics Enhancement (1.5 weeks)

**Goal:** Enhance Topics with Consumer UI + Admin features

**Dependencies:** Phase 2 (Admin Panel components)

**Parallel Work:** Can run alongside Phase 5

**Deliverables:**
1. Consumer view: Grid/list toggle with responsive cards
2. Admin view: Quality score metrics, bulk operations
3. Topic relationships graph (semantic connections)
4. Bulk operations integration (merge, archive, delete topics)
5. Export single topic (Markdown, JSON)

**Acceptance Criteria:**
- ✅ Grid/list view toggle persists preference (localStorage)
- ✅ Admin view shows quality score (0-100) for each topic
- ✅ Topic relationships visualized as interactive graph
- ✅ Bulk select 5 topics → merge into single topic
- ✅ Export topic with all atoms and messages (Markdown format)

**Tasks:** See `/features/phase-4-topics/tasks.md`

**Recommended Agents:**
- react-frontend-architect (views and graph visualization)
- fastapi-backend-expert (merge/export APIs)
- product-designer (grid/list patterns)

---

### Phase 5: Analysis Runs + Proposals (1.5 weeks)

**Goal:** Refactor Analysis Runs and Proposals into Topics admin context

**Dependencies:** Phase 2 (Admin Panel components)

**Parallel Work:** Can run alongside Phase 4

**Deliverables:**
1. Analysis Runs → Topics admin tab (contextual placement)
2. Proposals → inline cards within Topics (no separate page)
3. LLM reasoning transparency for proposals
4. Approve/reject proposals with bulk actions
5. Analysis run trigger from Topics page

**Acceptance Criteria:**
- ✅ Topics page has "Admin" tab showing analysis runs
- ✅ Proposals appear as inline cards within relevant topics
- ✅ Click proposal → see LLM reasoning for suggestion
- ✅ Bulk approve 10 proposals at once
- ✅ Trigger new analysis run from Topics page (admin only)

**Tasks:** See `/features/phase-5-analysis/tasks.md`

**Recommended Agents:**
- react-frontend-architect (tab refactoring)
- llm-prompt-engineer (reasoning transparency)
- fastapi-backend-expert (analysis trigger APIs)

---

### Phase 6: Export + API (2 weeks)

**Goal:** Build export functionality and API documentation

**Dependencies:** Phases 4 + 5 (all features must be complete)

**Deliverables:**
1. Export page with format options (Markdown, JSON, API)
2. Batch export (multiple topics at once)
3. API documentation (RESTful endpoints, examples)
4. Settings → Knowledge Sources (manage Telegram, future integrations)
5. Settings → Admin Tools (model configs, API keys, feature flags)

**Acceptance Criteria:**
- ✅ Export 5 topics as Markdown (single ZIP file)
- ✅ Export via API endpoint with authentication
- ✅ API docs show curl examples for all endpoints
- ✅ Knowledge Sources page lists Telegram (with future slots)
- ✅ Admin Tools hidden for non-admin users (feature flag)

**Tasks:** See `/features/phase-6-export/tasks.md`

**Recommended Agents:**
- react-frontend-architect (export UI)
- fastapi-backend-expert (export APIs, API docs)
- documentation-expert (API documentation)

---

## Pain Point Mapping

How each phase addresses the 4 critical pain points:

### 1. Fragmented Navigation (6 → 3 sections)

**Before:** Messages, Topics, Atoms, Analysis, Proposals, Settings
**After:** Topics, Search, Settings (with Admin Panel toggle)

| Phase | Contribution |
|-------|-------------|
| 1 | Foundation for collapsing admin sections into panel |
| 2 | Bulk actions move into Admin Panel (not top-level) |
| 3 | Message diagnostics in modal (not separate page) |
| 4 | Topics becomes primary hub (not one of many) |
| 5 | Analysis + Proposals integrated into Topics (not separate) |
| 6 | Export in Settings (not top-level) |

### 2. Mixed Consumer + Admin Tools

**Before:** Admin tools clutter main navigation
**After:** Admin Panel layer separates concerns

| Phase | Contribution |
|-------|-------------|
| 1 | Feature flag enables Consumer/Admin mode toggle |
| 2 | Admin-only components clearly separated |
| 3 | Diagnostic tools available only in Admin mode |
| 4 | Topic quality scores visible only to admins |
| 5 | Analysis runs hidden from consumers |
| 6 | Admin Tools section in Settings (admin-only) |

### 3. No Clarity About Phase 1 → Phase 2

**Before:** Unclear evolution path (rewrite risk)
**After:** Smooth transition via feature flag

| Phase | Contribution |
|-------|-------------|
| 1 | Feature flag foundation (localStorage → backend roles) |
| 2 | Consumer components built alongside admin |
| 3 | Modal pattern works for both phases |
| 4 | Grid/list views ready for consumer users |
| 5 | Proposals remain functional but hidden |
| 6 | API-first export for consumer integrations |

### 4. Visually Outdated UI

**Before:** Components look dated, missing modern patterns
**After:** Modern shadcn/ui patterns with accessibility

| Phase | Contribution |
|-------|-------------|
| 1 | Modern keyboard shortcuts (Cmd+Shift+A) |
| 2 | Shadcn/ui components (checkbox, badges, tooltips) |
| 3 | Modal with tabs, smooth transitions |
| 4 | Grid/list toggle, responsive cards |
| 5 | Inline proposals (no page navigation) |
| 6 | Modern export UI (drag-drop, preview) |

---

## Design Artifacts Checklist

### Phase 1: Foundation

**Wireframes Needed:**
- [ ] Admin Panel collapsed state (default)
- [ ] Admin Panel expanded state (with Cmd+Shift+A shortcut hint)
- [ ] Settings page with Admin Mode toggle
- [ ] Visual indicator (badge) showing current mode

**Component Specs:**
- [ ] `<AdminPanel>` anatomy (slots, props, variants)
- [ ] Keyboard shortcut system architecture
- [ ] `useAdminMode()` hook API

**Review/Approval:** product-designer (UX patterns), react-frontend-architect (feasibility)

**When Needed:** Before starting Phase 1 implementation (week 0)

---

### Phase 2: Admin Panel Components

**Wireframes Needed:**
- [ ] `<BulkActionsToolbar>` with multi-select pattern
- [ ] `<MetricsDashboard>` layout (cards, charts, stats)
- [ ] `<PromptTuningInterface>` editor UI
- [ ] `<AdminBadge>` visual treatment

**Component Specs:**
- [ ] Bulk selection state management (checkboxes, select all)
- [ ] Metrics card anatomy (metric name, value, trend, threshold)
- [ ] Prompt editor with validation and preview

**Review/Approval:** product-designer (accessibility), database-reliability-engineer (bulk query performance)

**When Needed:** Week 2 (before Phase 2 starts)

---

### Phase 3: Message Inspect Modal

**Wireframes Needed:**
- [ ] `<MessageInspectModal>` layout (tabs, content sections)
- [ ] Classification details view (confidence scores, reasoning)
- [ ] Atom extraction view (entities, keywords, embeddings)
- [ ] Classification history timeline

**Component Specs:**
- [ ] Modal anatomy (header, tabs, footer, actions)
- [ ] LLM reasoning visualization (decision tree, confidence bars)
- [ ] Embedding visualization (vector similarity, semantic distance)

**Review/Approval:** llm-prompt-engineer (reasoning transparency), product-designer (modal UX)

**When Needed:** Week 2 (parallel with Phase 2 design)

---

### Phase 4: Topics Enhancement

**Wireframes Needed:**
- [ ] Topics grid view (responsive cards, 1-4 columns)
- [ ] Topics list view (table with sortable columns)
- [ ] Topic relationships graph (nodes, edges, zoom/pan)
- [ ] Single topic export preview

**Component Specs:**
- [ ] `<TopicCard>` anatomy (Consumer vs Admin variants)
- [ ] Grid/list view toggle component
- [ ] Graph visualization library choice (D3, vis.js, or custom)

**Review/Approval:** product-designer (graph patterns), react-frontend-architect (performance with 100+ topics)

**When Needed:** Week 5 (after Phase 2 completes)

---

### Phase 5: Analysis Runs + Proposals

**Wireframes Needed:**
- [ ] Topics page with "Admin" tab
- [ ] Proposals as inline cards within Topics
- [ ] LLM reasoning display for proposals
- [ ] Bulk approve/reject proposals UI

**Component Specs:**
- [ ] Tab navigation within Topics page
- [ ] Proposal card anatomy (suggestion, reasoning, actions)
- [ ] Bulk approval confirmation modal

**Review/Approval:** llm-prompt-engineer (reasoning clarity), product-designer (inline vs modal patterns)

**When Needed:** Week 5 (parallel with Phase 4 design)

---

### Phase 6: Export + API

**Wireframes Needed:**
- [ ] Export page layout (format selection, preview, download)
- [ ] API documentation page (endpoints, examples, authentication)
- [ ] Settings → Knowledge Sources page
- [ ] Settings → Admin Tools page

**Component Specs:**
- [ ] Export format selector (radio buttons, preview)
- [ ] API documentation structure (sidebar navigation, code examples)
- [ ] Knowledge Sources card (Telegram + future slots)

**Review/Approval:** documentation-expert (API docs clarity), product-designer (export UX)

**When Needed:** Week 8 (after Phases 4 + 5 complete)

---

## Rollback Plan

If any phase encounters critical issues:

### Immediate Rollback (< 5 minutes)

**Feature Flag Revert:**
```typescript
// Set adminMode to false globally
localStorage.setItem('adminMode', 'false');
// OR in Settings: disable Admin Mode toggle
```

**Impact:** Users see only Consumer UI (current state), no admin features visible

### Phase-Specific Rollback

**Phase 1:** Remove keyboard shortcut listener, hide Admin Panel component
**Phase 2:** Remove Admin Panel components, hide bulk actions
**Phase 3:** Remove Message Inspect modal, revert to old message view
**Phase 4:** Revert Topics to current grid view, remove admin tab
**Phase 5:** Keep Analysis Runs + Proposals as separate pages
**Phase 6:** Remove Export page, keep old API docs

### Git Strategy

Each phase is a separate feature branch:
```
feature/adr-0001-phase-1-foundation
feature/adr-0001-phase-2-admin-panel
feature/adr-0001-phase-3-message-inspect
feature/adr-0001-phase-4-topics
feature/adr-0001-phase-5-analysis
feature/adr-0001-phase-6-export
```

Merge to `main` only after phase acceptance criteria verified.

---

## Next Actions

### Immediate (Day 1)

1. **Review this epic** with user (confirm understanding, prioritization)
2. **Create Phase 1 tasks** in `.artifacts/app-redesign-adr-0001/features/phase-1-foundation/tasks.md`
3. **Design Admin Panel wireframes** (ASCII art + HTML prototype)
4. **Setup feature flag infrastructure** (create `useAdminMode()` hook)

### Week 1 (Phase 1 Start)

1. **Delegate to react-frontend-architect:** Build `<AdminPanel>` component
2. **Delegate to ux-ui-design-expert:** Design keyboard shortcut system
3. **Create Settings toggle UI** for Admin Mode
4. **Write unit tests** for `useAdminMode()` hook

### Week 2 (Phase 1 Complete)

1. **Verify Phase 1 acceptance criteria** (Cmd+Shift+A toggle works)
2. **Design Phase 2 components** (wireframes for bulk actions, metrics)
3. **Plan Phase 2 + 3 parallel work streams** (identify frontend/backend split)

---

## References

- **ADR Document:** `/Users/maks/PycharmProjects/task-tracker/docs/architecture/adr/001-unified-admin-approach.md`
- **Research Proposal:** `.artifacts/product-designer-research/ia-restructuring-proposal.md` (1800+ lines)
- **Progress Tracking:** `.artifacts/app-redesign-adr-0001/progress.md`
- **Phase Tasks:** `.artifacts/app-redesign-adr-0001/features/phase-{N}-{name}/tasks.md`

---

**Epic Owner:** product-designer
**Created:** 2025-11-02
**Last Updated:** 2025-11-02
**Status:** Ready to begin Phase 1
