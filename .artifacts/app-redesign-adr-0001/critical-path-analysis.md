# Critical Path Analysis - ADR-0001 Implementation

**Purpose:** Identify minimum viable path and parallelization opportunities for 11-week epic

---

## Critical Path Visualization

```
START
  │
  ├─ Phase 1: Foundation (2 weeks) [CRITICAL - BLOCKS EVERYTHING]
  │   └─ Task 1.1 (useAdminMode hook) → CRITICAL
  │   └─ Task 1.2 (AdminPanel component) → CRITICAL
  │   └─ Task 1.3 (Keyboard shortcut) → HIGH
  │
  ├─ [Parallel Fork]
  │   ├─ Phase 2: Admin Panel Components (2 weeks)
  │   │   └─ Task 2.1 (BulkActionsToolbar) → CRITICAL
  │   │   └─ Task 2.6 (MetricsDashboard) → HIGH
  │   │
  │   └─ Phase 3: Message Inspect Modal (2 weeks)
  │       └─ Task 3.1 (Modal structure) → CRITICAL
  │       └─ Task 3.4 (LLM confidence) → HIGH
  │
  ├─ [Parallel Fork]
  │   ├─ Phase 4: Topics Enhancement (1.5 weeks)
  │   │   └─ Task 4.1-4.2 (Grid/List views) → CRITICAL
  │   │   └─ Task 4.8 (Graph visualization) → MEDIUM
  │   │
  │   └─ Phase 5: Analysis Runs + Proposals (1.5 weeks)
  │       └─ Task 5.1 (Admin tab) → CRITICAL
  │       └─ Task 5.5 (Proposal cards) → HIGH
  │
  └─ Phase 6: Export + API (2 weeks) [INTEGRATION - DEPENDS ON ALL]
      └─ Task 6.1 (Export page) → CRITICAL
      └─ Task 6.5 (Export API) → CRITICAL
      └─ Task 6.8 (API docs) → HIGH
│
END
```

---

## Blocking Tasks (MUST Complete First)

These tasks block significant downstream work:

### 1. Phase 1 Foundation (Blocks Everything)

**Task 1.1: useAdminMode() Hook**
- **Blocks:** All admin mode checks across the app
- **Impact:** Without this, cannot implement feature flag system
- **Timeline:** Week 1, Day 1-2
- **Risk:** HIGH - Must be solid foundation

**Task 1.2: AdminPanel Component**
- **Blocks:** All admin panel content (Phase 2-6)
- **Impact:** Without this, nowhere to place admin tools
- **Timeline:** Week 1, Day 3-5
- **Risk:** HIGH - Core infrastructure

**Task 1.3: Keyboard Shortcut Handler**
- **Blocks:** User workflow testing (Cmd+Shift+A)
- **Impact:** Without this, admin mode toggle is Settings-only (slow)
- **Timeline:** Week 1-2
- **Risk:** MEDIUM - Nice to have but not critical

---

### 2. Phase 2 Admin Panel Components

**Task 2.1: BulkActionsToolbar**
- **Blocks:** Phase 4 (Topic bulk ops), Phase 5 (Proposal bulk ops)
- **Impact:** Without this, cannot implement bulk operations anywhere
- **Timeline:** Week 3, Day 1-3
- **Risk:** MEDIUM - Phase 4/5 depend on this

**Task 2.6: MetricsDashboard**
- **Blocks:** Admin metric displays across app
- **Impact:** Without this, quality scores not visible
- **Timeline:** Week 3-4 (parallel to 2.1)
- **Risk:** LOW - Nice to have, not blocking

---

### 3. Phase 3 Message Inspect Modal

**Task 3.1: Modal Structure**
- **Blocks:** All message diagnostic features (3.4-3.12)
- **Impact:** Without this, no classification transparency
- **Timeline:** Week 3, Day 1-4
- **Risk:** MEDIUM - Independent of Phase 2

---

### 4. Phase 4 Topics Enhancement

**Task 4.1-4.2: Grid/List Views**
- **Blocks:** Task 4.3 (toggle), Task 4.6 (bulk select in views)
- **Impact:** Without this, Topics page has no consumer UI
- **Timeline:** Week 7, Day 1-3
- **Risk:** HIGH - Consumer UI depends on this

---

### 5. Phase 5 Analysis Runs + Proposals

**Task 5.1: Admin Tab in Topics**
- **Blocks:** All analysis/proposal refactoring (5.2-5.11)
- **Impact:** Without this, no place to put analysis runs
- **Timeline:** Week 7, Day 1-2
- **Risk:** MEDIUM - Can run parallel to Phase 4

---

### 6. Phase 6 Export + API

**Task 6.1: Export Page**
- **Blocks:** Export UI (6.2-6.4)
- **Impact:** Without this, no export functionality
- **Timeline:** Week 9, Day 1-4
- **Risk:** LOW - Final integration phase

**Task 6.5: Export API**
- **Blocks:** Export formatters (6.6-6.7)
- **Impact:** Without this, cannot download exports
- **Timeline:** Week 9 (parallel to 6.1)
- **Risk:** MEDIUM - Backend critical path

---

## Parallelization Opportunities

### Week 1-2: Phase 1 Only (No Parallelization)

**Critical Path:** Phase 1 must complete before anything else

**Work Streams:**
- Week 1: Infrastructure (Tasks 1.1-1.3)
- Week 2: Settings integration + Testing (Tasks 1.4-1.12)

**Team Allocation:**
- 2 frontend devs: AdminPanel component, keyboard shortcuts
- 1 designer: Visual mode indicator, help text

---

### Week 3-4: Phase 2 + Phase 3 (Parallel)

**Parallel Work Streams:**
1. **Stream A (Admin Panel Components):**
   - Task 2.1: BulkActionsToolbar (6h)
   - Task 2.2: Multi-select (4h)
   - Task 2.3-2.5: Bulk APIs (14h)
   - Task 2.6-2.10: MetricsDashboard (26h)

2. **Stream B (Message Inspect Modal):**
   - Task 3.1: Modal structure (8h)
   - Task 3.2: Tabs (4h)
   - Task 3.4-3.6: Classification details (18h)
   - Task 3.7-3.9: Atom extraction (18h)

**Why Parallel:**
- Both depend on Phase 1 (Admin Panel infrastructure)
- No dependencies between Phase 2 and Phase 3
- Different feature areas (bulk actions vs diagnostics)

**Team Allocation:**
- 2 frontend devs (Stream A): Bulk actions, metrics dashboard
- 2 frontend devs (Stream B): Modal, classification UI
- 2 backend devs: Bulk APIs (Stream A) + Message APIs (Stream B)

---

### Week 5-6: Phase 2 + Phase 3 Completion (Parallel)

**Stream A (Admin Panel):**
- Task 2.11-2.13: Prompt tuning (18h)
- Task 2.14-2.15: Admin badges (12h)

**Stream B (Message Inspect):**
- Task 3.10-3.12: Bulk edit (26h)

**Team Allocation:**
- 2 frontend devs (Stream A): Prompt tuning, badges
- 2 frontend devs (Stream B): Bulk edit, reassign topic
- 1 backend dev: Save changes API (Task 3.12)

---

### Week 7-8: Phase 4 + Phase 5 (Parallel)

**Parallel Work Streams:**
1. **Stream A (Topics Enhancement):**
   - Task 4.1-4.4: Consumer views (20h)
   - Task 4.5-4.7: Admin views (14h)
   - Task 4.8-4.10: Graph visualization (14h)

2. **Stream B (Analysis Runs + Proposals):**
   - Task 5.1-5.4: Analysis runs (22h)
   - Task 5.5-5.8: Proposals (20h)
   - Task 5.9-5.11: LLM transparency (18h)

**Why Parallel:**
- Both depend on Phase 2 (BulkActionsToolbar needed)
- No dependencies between Phase 4 and Phase 5
- Different feature areas (Topics vs Analysis)

**Team Allocation:**
- 2 frontend devs (Stream A): Grid/list views, graph
- 2 frontend devs (Stream B): Admin tab, proposals
- 1 backend dev: Export APIs (Task 4.11-4.13) + Analysis APIs (Task 5.3)

---

### Week 9: Phase 4 + Phase 5 Completion (Parallel)

**Stream A (Topics):**
- Task 4.11-4.13: Export (12h)

**Stream B (Analysis):**
- Final testing and polish

**Team Allocation:**
- 1 frontend dev (Stream A): Export button
- 2 backend devs (Stream A): Export APIs
- 1 frontend dev (Stream B): Testing, bug fixes

---

### Week 9-10: Phase 6 Export + API (Parallel Tracks)

**Parallel Work Streams:**
1. **Stream A (Export UI + Backend):**
   - Task 6.1-6.4: Export UI (24h)
   - Task 6.5-6.7: Export backend (18h)

2. **Stream B (API Documentation):**
   - Task 6.8-6.11: API docs (22h)

3. **Stream C (Settings Pages):**
   - Task 6.12-6.14: Settings pages (16h)

**Why Parallel:**
- Independent work streams
- No dependencies between export, docs, settings

**Team Allocation:**
- 2 frontend devs (Stream A): Export page
- 2 backend devs (Stream A): Export APIs
- 1 technical writer (Stream B): API docs
- 1 frontend dev (Stream C): Settings pages

---

### Week 11: Integration Testing & Polish

**Work:**
- E2E testing all phases
- Bug fixes
- Performance optimization
- Final demo preparation

**Team Allocation:**
- All hands: Testing, polish, demo prep

---

## Minimum Viable Slice (4 Weeks)

If timeline is compressed, focus on:

### MVP Scope (4 weeks)

**Phase 1: Foundation (2 weeks)** - FULL
- All tasks (1.1-1.12)
- Reason: Foundation cannot be compromised

**Phase 2: Admin Panel (1 week)** - REDUCED
- Keep: Task 2.1-2.5 (BulkActionsToolbar + APIs)
- Keep: Task 2.14-2.15 (AdminBadge)
- Cut: Task 2.6-2.10 (MetricsDashboard) → move to Phase 2 post-MVP
- Cut: Task 2.11-2.13 (PromptTuning) → move to Phase 2 post-MVP

**Phase 3: Message Inspect (1 week)** - REDUCED
- Keep: Task 3.1-3.6 (Modal + Classification details)
- Cut: Task 3.7-3.9 (Atom extraction) → nice to have
- Cut: Task 3.10-3.12 (Bulk edit) → can do in Phase 4

**Phase 4: Topics (skipped in MVP)** - DEFERRED
- Reason: Current Topics page works, enhancement not critical

**Phase 5: Analysis (skipped in MVP)** - DEFERRED
- Reason: Analysis Runs page works, refactor not critical

**Phase 6: Export (skipped in MVP)** - DEFERRED
- Reason: Basic export exists, can enhance later

**MVP Delivers:**
- ✅ Admin Mode toggle (Cmd+Shift+A)
- ✅ Bulk operations (approve, archive, delete)
- ✅ Message classification transparency (Inspect modal)
- ✅ Admin Panel infrastructure (ready for Phase 2 features)

**MVP Timeline:** 4 weeks (vs 11 weeks full scope)

---

## Risk Mitigation Strategies

### Risk 1: Phase 1 Delays (HIGH IMPACT)

**Scenario:** Phase 1 takes 3 weeks instead of 2
**Impact:** Entire project delayed by 1 week
**Mitigation:**
- Start Phase 1 with 3 devs (not 2)
- Daily standups to catch blockers early
- Pre-build useAdminMode() hook as spike before Phase 1 starts

### Risk 2: Phase 2/3 Not Truly Independent (MEDIUM IMPACT)

**Scenario:** Phase 3 needs something from Phase 2
**Impact:** Cannot parallelize, lose 2 weeks
**Mitigation:**
- Strict interface contracts before starting
- Shared component library (shadcn/ui)
- Mock bulk actions in Phase 3 if Phase 2 delayed

### Risk 3: Graph Visualization Complexity (Task 4.8)

**Scenario:** Task 4.8 takes 12h instead of 6h
**Impact:** Phase 4 delayed by 1-2 days
**Mitigation:**
- Use library (react-force-graph) not custom solution
- Simplify to basic nodes/edges (no fancy layouts)
- Make graph optional (can skip if delayed)

### Risk 4: Export API Performance (Task 6.5)

**Scenario:** Exporting 50 topics times out
**Impact:** Export unusable for large datasets
**Mitigation:**
- Implement async export (job queue)
- Send email when export ready
- Limit to 20 topics per request (not 50)

---

## Bottleneck Analysis

### Bottleneck 1: Phase 1 Completion

**Why Bottleneck:**
- Everything depends on Admin Panel infrastructure
- No parallel work possible

**Solution:**
- Prioritize Phase 1 (dedicate best devs)
- Pre-plan Phase 2/3 during Phase 1 (design work)

### Bottleneck 2: Backend Developer Availability

**Tasks Requiring Backend:**
- Phase 2: Tasks 2.3-2.5, 2.9 (bulk APIs, WebSocket)
- Phase 3: Task 3.12 (save changes API)
- Phase 4: Tasks 4.12-4.13 (export APIs)
- Phase 6: Tasks 6.5-6.7 (export backend)

**Solution:**
- 2 backend devs (not 1)
- Backend APIs defined upfront (OpenAPI spec)
- Frontend uses mocks until backend ready

### Bottleneck 3: Testing Phase (Week 11)

**Why Bottleneck:**
- All phases must be complete
- Cannot parallelize testing

**Solution:**
- Test each phase as completed (not just week 11)
- E2E tests written during phase development
- Dedicated QA engineer (not just devs)

---

## Team Allocation Recommendations

### Optimal Team (11 weeks)

**Frontend Developers:** 4
- Dev 1: Phase 1 → Phase 2 (Admin Panel)
- Dev 2: Phase 1 → Phase 3 (Message Inspect)
- Dev 3: Phase 4 (Topics)
- Dev 4: Phase 5 (Analysis) + Phase 6 (Export UI)

**Backend Developers:** 2
- Dev 1: Phase 2 (Bulk APIs) → Phase 4 (Export APIs)
- Dev 2: Phase 3 (Message APIs) → Phase 5 (Analysis APIs) → Phase 6 (Export backend)

**Designer/UX:** 1 (part-time)
- Wireframes (Phase 1)
- Design review (all phases)
- Usability testing (week 11)

**Technical Writer:** 1 (part-time)
- API documentation (Phase 6)

**Total:** 8 people (4 frontend, 2 backend, 1 designer, 1 writer)

---

### Minimum Team (MVP 4 weeks)

**Frontend Developers:** 2
- Dev 1: Phase 1 → Phase 2 (BulkActionsToolbar)
- Dev 2: Phase 1 → Phase 3 (Message Inspect)

**Backend Developers:** 1
- Dev 1: Phase 2 (Bulk APIs) → Phase 3 (Save API)

**Designer/UX:** 1 (part-time)
- Wireframes + design review

**Total:** 4 people (2 frontend, 1 backend, 1 designer)

---

## Success Criteria (When Can We Ship?)

### Phase-by-Phase Gates

**Phase 1 Complete:**
- [ ] Cmd+Shift+A toggles Admin Panel
- [ ] Admin Mode persists across sessions
- [ ] All Phase 1 tests passing (unit + E2E)

**Phase 2 Complete:**
- [ ] Can bulk select 10 topics → approve in one click
- [ ] Metrics dashboard shows real-time updates
- [ ] All Phase 2 tests passing

**Phase 3 Complete:**
- [ ] Click message → modal opens with classification
- [ ] LLM reasoning visible with confidence scores
- [ ] All Phase 3 tests passing

**Phase 4 Complete:**
- [ ] Grid/list toggle works on Topics page
- [ ] Graph visualizes topic relationships
- [ ] Export single topic as Markdown

**Phase 5 Complete:**
- [ ] Topics page has Admin tab
- [ ] Proposals inline in Topics (not separate page)
- [ ] Bulk approve proposals works

**Phase 6 Complete:**
- [ ] Export 5 topics as ZIP file
- [ ] API docs page shows all endpoints
- [ ] Admin Tools hidden for non-admin users

### Final Shipment Criteria (Week 11)

- [ ] All 6 phases complete
- [ ] 0 critical bugs, < 5 medium bugs
- [ ] Performance: page load < 2s, interaction < 100ms
- [ ] Accessibility: 0 axe violations (WCAG 2.1 AA)
- [ ] E2E tests: 100% passing
- [ ] Demo recorded (show all features)

---

**Last Updated:** 2025-11-02
**Reviewers:** product-designer, react-frontend-architect, fastapi-backend-expert
