# ADR-0001 Implementation Epic

**Comprehensive app redesign implementing Unified Admin Approach**

---

## Quick Navigation

- **[epic.md](./epic.md)** - Complete roadmap, phase breakdown, success metrics (main document)
- **[progress.md](./progress.md)** - Live tracking dashboard, weekly updates, metrics
- **[critical-path-analysis.md](./critical-path-analysis.md)** - Dependencies, parallelization, bottlenecks
- **[design-artifacts-checklist.md](./design-artifacts-checklist.md)** - Wireframes, specs, handoff requirements

**Phase Task Breakdowns:**
- [Phase 1: Foundation](./features/phase-1-foundation/tasks.md) (2 weeks, 12 tasks)
- [Phase 2: Admin Panel Components](./features/phase-2-admin-panel/tasks.md) (2 weeks, 15 tasks)
- [Phase 3: Message Inspect Modal](./features/phase-3-message-inspect/tasks.md) (2 weeks, 12 tasks)
- [Phase 4: Topics Enhancement](./features/phase-4-topics/tasks.md) (1.5 weeks, 13 tasks)
- [Phase 5: Analysis Runs + Proposals](./features/phase-5-analysis/tasks.md) (1.5 weeks, 11 tasks)
- [Phase 6: Export + API](./features/phase-6-export/tasks.md) (2 weeks, 14 tasks)

---

## Epic Overview

### Problem

Current app has 4 critical pain points:
1. **Fragmented navigation** - 6 top-level sections, unclear hierarchy
2. **Mixed Consumer + Admin tools** - Administrative functions clutter main navigation
3. **No clarity about Phase 1 → Phase 2** - Unclear evolution from calibration tool to consumer product
4. **Visually outdated UI** - Components look dated, missing modern patterns

### Solution

Implement **Unified Admin Approach** (ADR-0001):
- Two-layer architecture: Consumer UI (default) + Admin Panel (toggle via Cmd+Shift+A)
- Feature flag system: localStorage (Phase 1) → backend roles (Phase 2)
- Zero rework during Phase 1 → Phase 2 transition
- Modern shadcn/ui components throughout

### Timeline

**11 weeks total (6 phases)**
- Week 1-2: Phase 1 (Foundation)
- Week 3-4: Phase 2 (Admin Panel) + Phase 3 (Message Inspect) - PARALLEL
- Week 5-6: Phase 2/3 completion
- Week 7-8: Phase 4 (Topics) + Phase 5 (Analysis) - PARALLEL
- Week 9-10: Phase 6 (Export + API)
- Week 11: Integration testing, polish, demo

### Success Metrics

**Quantitative:**
- Reduce top-level navigation: 6 → 3 sections (50% simplification)
- Feature flag coverage: 100% of admin features
- Zero breaking changes during transition

**Qualitative:**
- Users browse knowledge without seeing admin complexity
- Admins diagnose issues in < 2 clicks
- Transition to Phase 2 requires only feature flag toggle

---

## How to Use This Epic

### For Project Managers

1. **Track Progress:** Check [progress.md](./progress.md) weekly
2. **Identify Blockers:** Review [critical-path-analysis.md](./critical-path-analysis.md)
3. **Allocate Resources:** See "Team Allocation" in critical path analysis
4. **Plan Sprints:** Each phase = 1-2 sprints

### For Developers

1. **Pick a Phase:** Start with [Phase 1 tasks](./features/phase-1-foundation/tasks.md)
2. **Read Task Details:** Each task has estimated time, agent, acceptance criteria
3. **Review Designs:** Check [design-artifacts-checklist.md](./design-artifacts-checklist.md) before coding
4. **Update Progress:** Mark tasks complete in [progress.md](./progress.md)

### For Designers

1. **Review Artifact Checklist:** [design-artifacts-checklist.md](./design-artifacts-checklist.md)
2. **Create Wireframes:** ASCII art or HTML/CSS prototypes (no Figma)
3. **Write Component Specs:** Document props, variants, Tailwind patterns
4. **Handoff to Devs:** Follow handoff format in checklist

### For User/Product Owner

1. **Review Epic:** Read [epic.md](./epic.md) executive summary
2. **Approve Phases:** Each phase has acceptance criteria to verify
3. **Provide Feedback:** Review design artifacts before implementation
4. **Final Demo:** Week 11 - see all features working together

---

## Current Status

**Epic Status:** Not Started (Week 0 - Planning Complete)
**Next Action:** Review epic.md with user, approve Phase 1 start
**Blockers:** None

**Phase Status:**
- Phase 1: Not Started (waiting for approval)
- Phase 2: Not Started (depends on Phase 1)
- Phase 3: Not Started (depends on Phase 1)
- Phase 4: Not Started (depends on Phase 2)
- Phase 5: Not Started (depends on Phase 2)
- Phase 6: Not Started (depends on Phase 4+5)

---

## Quick Start Guide

### Day 1 (Today)

1. **Review Epic:**
   - Read [epic.md](./epic.md) executive summary (10 min)
   - Understand problem context and solution approach
   - Verify timeline (11 weeks) is acceptable

2. **Approve Phase 1:**
   - Review [Phase 1 tasks](./features/phase-1-foundation/tasks.md)
   - Confirm task breakdown makes sense (12 tasks, 2 weeks)
   - Green light to start Phase 1 implementation

3. **Setup Design Work:**
   - Review [design-artifacts-checklist.md](./design-artifacts-checklist.md)
   - Assign wireframe creation (Admin Panel, Settings toggle)
   - Schedule design review (Week 0, before Phase 1 starts)

### Week 1 (Phase 1 Start)

1. **Delegate to react-frontend-architect:**
   - Task 1.1: Create `useAdminMode()` hook
   - Task 1.2: Create `<AdminPanel>` base component
   - Task 1.3: Add keyboard shortcut handler

2. **Delegate to ux-ui-design-expert:**
   - Task 1.4: Visual mode indicator (badge)
   - Task 1.8: Animation design
   - Task 1.9-1.10: Accessibility audit

3. **Monitor Progress:**
   - Daily standup (15 min)
   - Check [progress.md](./progress.md) for blockers
   - Update task completion status

### Week 2 (Phase 1 Complete)

1. **Verify Acceptance Criteria:**
   - [ ] Cmd+Shift+A toggles Admin Panel
   - [ ] Admin Mode persists across sessions
   - [ ] All Phase 1 tests passing

2. **Design Phase 2+3:**
   - Create wireframes for BulkActionsToolbar
   - Create wireframes for MessageInspectModal
   - Review designs with team

3. **Plan Phase 2+3 Parallel Work:**
   - Split team: 2 devs on Phase 2, 2 devs on Phase 3
   - Identify dependencies between phases
   - Setup parallel git branches

---

## Key Documents

### 1. epic.md (Main Roadmap)

**What:** Complete implementation plan for ADR-0001
**Audience:** Everyone (PM, devs, designers, user)
**Read Time:** 20 minutes
**Contains:**
- Executive summary (problem, solution, timeline)
- Phase-by-phase breakdown (goals, deliverables, acceptance criteria)
- Pain point mapping (how each phase addresses issues)
- Design artifacts requirements
- Rollback plan

---

### 2. progress.md (Tracking Dashboard)

**What:** Live status of all phases and tasks
**Audience:** PM, team leads, stakeholders
**Update Frequency:** Weekly (every Monday)
**Contains:**
- Phase status table (completion %, blockers)
- Task checklists (checked = complete)
- Acceptance criteria tracking
- Metrics dashboard (overall progress %)
- Pain point progress (6→3 sections, 0→100%)
- Weekly updates log

---

### 3. critical-path-analysis.md (Dependencies)

**What:** Identify blockers, parallelization opportunities, bottlenecks
**Audience:** PM, tech leads, architects
**Read Time:** 15 minutes
**Contains:**
- Critical path visualization (Gantt chart)
- Blocking tasks (must complete first)
- Parallelization opportunities (Phases 2+3, 4+5)
- Minimum viable slice (4 weeks MVP)
- Risk mitigation strategies
- Team allocation recommendations

---

### 4. design-artifacts-checklist.md (Design Deliverables)

**What:** All wireframes, specs, prototypes needed
**Audience:** Designers, frontend developers
**Update Frequency:** As artifacts are created
**Contains:**
- Wireframes (ASCII, HTML/CSS) for each phase
- Component specs (props, variants, Tailwind patterns)
- Storybook stories (development examples)
- Design system extensions (new shadcn/ui components)
- Review schedule (weekly design reviews)
- Handoff format (design → dev transition)

---

## Communication Plan

### Daily Standups (15 min)

**When:** Every day, 9:00 AM
**Attendees:** Entire team (4 frontend, 2 backend, 1 designer)
**Format:**
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

**Action Items:**
- PM updates [progress.md](./progress.md) after standup
- Blockers escalated to tech lead immediately

---

### Weekly Design Reviews (1 hour)

**When:** Every Monday, 2:00 PM
**Attendees:** product-designer, ux-ui-design-expert, react-frontend-architect, user
**Format:**
- Review completed wireframes from previous week
- Discuss feedback and iterate
- Approve designs for next week's implementation

**Deliverables:**
- Approved wireframes
- Updated [design-artifacts-checklist.md](./design-artifacts-checklist.md)

---

### Phase Demos (30 min)

**When:** End of each phase (Weeks 2, 4, 6, 8, 10)
**Attendees:** Entire team + user
**Format:**
- Live demo of phase deliverables
- Verify acceptance criteria
- Collect feedback
- Approve phase completion

**Deliverables:**
- Phase sign-off
- Updated [progress.md](./progress.md) (phase marked complete)

---

## Risk Management

### Top 5 Risks

**1. Phase 1 Delays (HIGH IMPACT)**
- **Risk:** Phase 1 takes 3 weeks instead of 2
- **Impact:** Entire project delayed by 1 week
- **Mitigation:** Start with 3 devs (not 2), daily standups

**2. Parallel Phases Not Independent (MEDIUM IMPACT)**
- **Risk:** Phase 3 needs something from Phase 2
- **Impact:** Cannot parallelize, lose 2 weeks
- **Mitigation:** Strict interface contracts, mock dependencies

**3. Graph Visualization Complexity (MEDIUM IMPACT)**
- **Risk:** Task 4.8 takes 12h instead of 6h
- **Impact:** Phase 4 delayed by 1-2 days
- **Mitigation:** Use library (react-force-graph), simplify if needed

**4. Export API Performance (MEDIUM IMPACT)**
- **Risk:** Exporting 50 topics times out
- **Impact:** Export unusable for large datasets
- **Mitigation:** Implement async export with job queue

**5. Scope Creep (LOW IMPACT)**
- **Risk:** New features requested mid-epic
- **Impact:** Timeline extends, team distracted
- **Mitigation:** Strict adherence to ADR-0001, defer new features to post-MVP

---

## Success Criteria

### Epic Complete When:

- [ ] All 6 phases complete (77 total tasks)
- [ ] All acceptance criteria met
- [ ] 0 critical bugs, < 5 medium bugs
- [ ] Performance: page load < 2s, interaction < 100ms
- [ ] Accessibility: 0 axe violations (WCAG 2.1 AA)
- [ ] E2E tests: 100% passing
- [ ] Final demo recorded (show all features)

### Phase 1 → Phase 2 Transition Ready When:

- [ ] Feature flag system complete (localStorage → backend roles)
- [ ] Admin Panel toggle works (Cmd+Shift+A)
- [ ] Consumer UI tested without admin features visible
- [ ] Documentation updated (how to hide Admin Panel)

---

## Resources

### Reference Documents

- **[ADR-0001](../../docs/architecture/adr/001-unified-admin-approach.md)** - Original decision document
- **[IA Research Proposal](../product-designer-research/ia-restructuring-proposal.md)** - 1800+ lines of research
- **[UX Audit Reports](../ux-audit/)** - Analysis of current IA

### Design System

- **shadcn/ui Documentation:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI Primitives:** https://www.radix-ui.com/

### Development

- **React 18 Docs:** https://react.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Playwright (E2E Testing):** https://playwright.dev/

---

## Contact

**Epic Owner:** product-designer
**Tech Lead:** react-frontend-architect
**Backend Lead:** fastapi-backend-expert
**PM:** User

**Questions?** Ask in Slack #adr-0001-implementation or tag @product-designer

---

**Created:** 2025-11-02
**Last Updated:** 2025-11-02
**Status:** Planning Complete, Ready to Start Phase 1
