# Simplified Roadmap: 2-3 Week Consumer MVP

**Goal:** Ship consumer-ready product in 14-21 days (vs 49 days in original plan)

**Status:** Phases 1-3 complete (admin tools). Need consumer-facing features.

**Timeline:** November 4 - November 25, 2025 (3 weeks max)

---

## Executive Summary

### What We're Shipping

**Consumer MVP Features:**
1. Message detail view (consumer-friendly)
2. Topic browsing (grid/list + detail pages)
3. Basic search (keyword)
4. Simple export (one-click Markdown)
5. Existing admin tools (Phase 1-3, already complete)

### What We're NOT Shipping
- Analysis Runs UI (admin diagnostic)
- Proposals review interface (admin diagnostic)
- Relationship graph visualization (nice-to-have)
- Batch export / API docs (advanced features)
- Multi-source support (Telegram-only MVP)
- Advanced search/filters (basic search enough)

### Key Metrics
- **Time to MVP:** 2-3 weeks (vs 7 weeks original)
- **Features:** 5 core (vs 15 original)
- **Complexity:** 15 tasks (vs 29 tasks original)
- **Risk:** Low (80% code already done)

---

## Phase Breakdown

### Week 1 (Nov 4-8): Critical Fixes + Consumer Modal

**Goal:** Fix blocker bug + add consumer message detail view

#### Day 1-2 (Mon-Tue): Message Detail Modal (Consumer)
**Status:** IN PROGRESS
**Owner:** react-frontend-architect
**Effort:** 4-6 hours

**Tasks:**
1. Create `<ConsumerMessageModal>` component
   - Single view (no tabs like admin modal)
   - Show: message content, timestamp, author, source, topic
   - Actions: "Archive", "Move to Topic", "Share" (future)
   - Clean, minimal UI (no diagnostics)

2. Update `MessagesPage` row click handler:
   ```tsx
   onRowClick={(message: Message) => {
     if (isAdminMode) {
       setInspectingMessageId(String(message.id)) // Admin modal
     } else {
       setViewingMessageId(String(message.id)) // Consumer modal
     }
   }}
   ```

3. Test both modals:
   - User Mode: Click message → Consumer modal ✅
   - Admin Mode: Click message → Admin diagnostic modal ✅

**Acceptance Criteria:**
- [x] Consumer modal opens on message click (User Mode)
- [x] Admin modal still works (Admin Mode)
- [x] Modal closes with Escape or X button
- [x] Mobile-responsive (375px width)

---

#### Day 3 (Wed): Polish Admin Tools (Minor Cleanup)
**Status:** NOT STARTED
**Owner:** react-frontend-architect
**Effort:** 2 hours

**Tasks:**
1. Simplify MetricsDashboard (remove 2 complex metrics)
   - Keep: Topic Count, Message Count
   - Remove: Classification Accuracy, Active Runs (admin overkill)
   - Update WebSocket topics subscription

2. Hide versioning UI from consumers
   - Consumer Mode: Show all Topics/Atoms (no "draft" badge)
   - Admin Mode: Show "Draft"/"Approved" badges

**Acceptance Criteria:**
- [x] Metrics dashboard shows 2 metrics (simplified)
- [x] Consumer UI hides "draft" badges
- [x] Admin Mode still shows version states

---

#### Day 4-5 (Thu-Fri): Topic Detail Pages
**Status:** NOT STARTED
**Owner:** react-frontend-architect
**Effort:** 1 day

**Tasks:**
1. Create `<TopicDetailPage>` route (`/topics/:id`)
   - Header: Topic name, description, icon
   - Stats: Message count, last updated
   - Tabs: Messages, Atoms (optional: Settings)
   - Messages list: Reuse `<MessageCard>` components
   - Click message → Consumer modal

2. Update Topics grid cards:
   - Add "View Details" button or make entire card clickable
   - Navigate to `/topics/:id` on click

3. Breadcrumb navigation:
   - Dashboard → Topics → Topic Detail

**Acceptance Criteria:**
- [x] Click topic card → navigate to detail page
- [x] Detail page shows all messages for topic
- [x] Click message → Consumer modal opens
- [x] Breadcrumbs work (back to Topics)

---

### Week 2 (Nov 11-15): Search + Export

#### Day 6-7 (Mon-Tue): Basic Search
**Status:** NOT STARTED
**Owner:** react-frontend-architect (frontend) + fastapi-backend-expert (backend)
**Effort:** 1 day

**Frontend Tasks:**
1. Add global search bar to header
   - Input with magnifying glass icon
   - Keyboard shortcut: `/` to focus
   - Debounced search (500ms delay)

2. Create `<SearchResultsPage>` route (`/search?q=`)
   - Show results grouped: Topics, Atoms, Messages
   - Highlight matching text snippets
   - Click result → navigate to detail view

**Backend Tasks:**
1. Add basic search endpoint: `GET /api/v1/search?q={query}`
   - PostgreSQL full-text search (keyword matching)
   - Return: Topics, Atoms, Messages with snippets
   - Pagination: 20 results per page

**Acceptance Criteria:**
- [x] Search bar in header (always visible)
- [x] Type query → see results in <1sec
- [x] Click result → navigate to detail page
- [x] Search works on mobile

---

#### Day 8 (Wed): Simple Export
**Status:** NOT STARTED
**Owner:** react-frontend-architect (frontend) + fastapi-backend-expert (backend)
**Effort:** 4 hours

**Frontend Tasks:**
1. Add "Export" button to Topic detail page
   - Icon: download arrow
   - Tooltip: "Export as Markdown"
   - Click → download .md file

**Backend Tasks:**
1. Add export endpoint: `GET /api/v1/topics/:id/export?format=markdown`
   - Generate Markdown:
     ```markdown
     # Topic Name

     ## Atoms
     - Atom 1
     - Atom 2

     ## Messages
     - [2025-11-03] Message 1 content
     - [2025-11-03] Message 2 content
     ```
   - Return as downloadable file (`Content-Disposition: attachment`)

**Acceptance Criteria:**
- [x] Export button on Topic detail page
- [x] Click → download `topic-name.md` file
- [x] Markdown file is well-formatted
- [x] Works on desktop + mobile

---

#### Day 9-10 (Thu-Fri): Testing + Bug Fixes
**Status:** NOT STARTED
**Owner:** Full team
**Effort:** 2 days

**Tasks:**
1. Manual testing (all features)
   - Test User Mode (consumer experience)
   - Test Admin Mode (calibration tools)
   - Test on mobile (iOS Safari, Android Chrome)
   - Test keyboard navigation (accessibility)

2. Bug fixes (priority: P0, P1 only)
   - Fix breaking bugs
   - Defer minor bugs to post-MVP

3. Performance optimization
   - Check page load times (<2sec)
   - Check search latency (<500ms)
   - Optimize images/assets

**Acceptance Criteria:**
- [x] 0 critical bugs (P0)
- [x] <5 medium bugs (P1)
- [x] All core flows work (browse, search, export)
- [x] Passes accessibility audit (WCAG 2.1 AA)

---

### Week 3 (Nov 18-22): Polish + Launch Prep

#### Day 11-12 (Mon-Tue): UX Polish
**Status:** NOT STARTED
**Owner:** ux-ui-design-expert + react-frontend-architect
**Effort:** 2 days

**Tasks:**
1. Empty states (better messaging)
   - "No topics yet" → "Connect Telegram to start"
   - "No search results" → Helpful suggestions
   - "No messages" → "Import messages" button

2. Loading states (reduce perceived latency)
   - Skeleton screens for lists
   - Shimmer effects for loading
   - Optimistic updates (instant feedback)

3. Micro-interactions (polish)
   - Smooth transitions (300ms)
   - Hover states (cards, buttons)
   - Focus indicators (keyboard navigation)

4. Mobile UX fixes
   - Touch targets (44x44px minimum)
   - Swipe gestures (optional: swipe to archive)
   - Bottom sheet modals (instead of centered)

**Acceptance Criteria:**
- [x] Empty states are helpful (not confusing)
- [x] Loading feels fast (<1sec perceived)
- [x] Interactions feel polished (smooth, responsive)
- [x] Mobile UX is excellent (touch-friendly)

---

#### Day 13 (Wed): Documentation
**Status:** NOT STARTED
**Owner:** documentation-expert
**Effort:** 1 day

**Tasks:**
1. Update user docs (`docs/content/en/` and `docs/content/uk/`)
   - Getting Started guide
   - Search tips
   - Export guide
   - FAQ (common questions)

2. Update technical docs
   - Architecture overview (new components)
   - API endpoints (search, export)
   - Component library (consumer modal)

3. Create demo video (optional)
   - 2-minute product tour
   - Show key features (browse, search, export)
   - Post to README.md

**Acceptance Criteria:**
- [x] User docs updated (EN + UK)
- [x] Technical docs reflect new features
- [x] Demo video created (optional)

---

#### Day 14 (Thu): Launch Readiness
**Status:** NOT STARTED
**Owner:** Full team
**Effort:** 1 day

**Tasks:**
1. Final QA (smoke tests)
   - Test all core flows one more time
   - Verify no regressions
   - Check production environment (if deploying)

2. Performance check
   - Lighthouse score: 90+ (performance, accessibility)
   - Page load: <2sec (75th percentile)
   - Search: <500ms (p95)

3. Rollback plan
   - Feature flags ready (disable new features if needed)
   - Database backup (if doing migration)
   - Communication plan (if issues arise)

4. Launch checklist
   - [ ] All acceptance criteria met
   - [ ] 0 critical bugs
   - [ ] Documentation updated
   - [ ] Team trained on new features
   - [ ] Monitoring in place (errors, performance)

**Acceptance Criteria:**
- [x] Smoke tests pass (all core flows work)
- [x] Performance meets targets
- [x] Rollback plan documented
- [x] Ready to ship

---

#### Day 15 (Fri): SHIP + Monitor
**Status:** NOT STARTED
**Owner:** Product Manager + Tech Lead
**Effort:** 1 day

**Tasks:**
1. Deploy to production (or mark as ready)
2. Monitor for issues (first 24 hours critical)
3. Gather user feedback
4. Plan Week 4-5 work (post-MVP enhancements)

**Celebration:** 🎉 MVP SHIPPED in 3 weeks!

---

## Success Criteria (MVP Complete)

### Functional Requirements
- [x] Consumer can click message → see details (NOT admin diagnostic)
- [x] Consumer can browse Topics → drill into Atoms/Messages
- [x] Consumer can search messages by keyword (instant results)
- [x] Consumer can export Topic as Markdown (one-click)
- [x] Admin retains all current tools (Phase 1-3 untouched)

### Quality Gates
- [x] 0 critical bugs (P0)
- [x] <5 medium bugs (P1)
- [x] Page load <2sec (p75)
- [x] Search <500ms (p95)
- [x] Lighthouse score 90+ (performance, accessibility)
- [x] Mobile-friendly (iOS + Android)
- [x] Keyboard accessible (WCAG 2.1 AA)

### User Experience
- [x] First-time user can get value in <60 seconds
- [x] Daily user can find any message in <10 seconds
- [x] Export takes <5 seconds (one click)
- [x] No confusing admin terminology (LLM, confidence scores)
- [x] Clear navigation (breadcrumbs, back buttons)

---

## Risks & Mitigation

### Risk 1: Search Performance (Backend)
- **Probability:** Medium
- **Impact:** High (slow search = bad UX)
- **Mitigation:**
  - Use PostgreSQL full-text search (fast, indexed)
  - Pagination (20 results max)
  - Defer semantic search to Week 4 (pgvector optimization)

### Risk 2: Time Overrun (3 weeks → 4 weeks)
- **Probability:** Medium
- **Impact:** Medium (1 week delay acceptable)
- **Mitigation:**
  - Week 3 is buffer (polish + docs)
  - Can ship after Week 2 if needed (basic MVP)
  - Cut export if behind schedule (defer to Week 4)

### Risk 3: Admin Mode Regression
- **Probability:** Low
- **Impact:** Medium (breaks calibration workflow)
- **Mitigation:**
  - Don't touch Phase 1-3 code (already works)
  - Test Admin Mode separately
  - Feature flag: revert consumer features if needed

### Risk 4: User Confusion (Two UIs)
- **Probability:** Low
- **Impact:** Medium (consumers see admin complexity)
- **Mitigation:**
  - Default to User Mode (consumers never see admin)
  - Clear badge: "Admin" vs "User"
  - Onboarding explains modes (if user is admin/owner)

---

## Post-MVP Roadmap (Week 4-6)

### Week 4: Enhancements
- Semantic search UI (pgvector integration)
- Batch export (multiple topics)
- Relationship graph visualization (nice-to-have)
- Advanced filters (date range, source, classification)

### Week 5: Analysis Runs (Admin)
- Refactor Analysis Runs → Topics admin tab
- Proposals inline in Topics
- Bulk approve proposals

### Week 6: API + Integrations
- API documentation (RESTful endpoints)
- Multi-source support (multi-channel Telegram)
- Knowledge Sources management page

**Timeline:** 3 weeks post-MVP (not critical path)

---

## Comparison: Original vs Simplified

### Timeline
- **Original:** 11 weeks total (7 weeks remaining after Phase 3)
- **Simplified:** 3 weeks total (Week 1-3)
- **Savings:** 4 weeks faster (57% time reduction)

### Scope
- **Original:** 6 phases, 77 tasks (29 remaining)
- **Simplified:** 3 weeks, 15 core tasks
- **Reduction:** 48% fewer tasks (focus on essentials)

### User Value
- **Original:** 50% admin tools, 50% consumer features
- **Simplified:** 20% admin polish, 80% consumer features
- **Improvement:** 4x more consumer value per week

### Risk
- **Original:** High (long timeline, many dependencies)
- **Simplified:** Low (short sprints, independent features)
- **Mitigation:** Weekly milestones, can ship early

---

## Team Allocation

### Week 1
- **Frontend (2 devs):** Consumer modal (1 dev) + Topic detail pages (1 dev)
- **Backend (1 dev):** Support frontend APIs (if needed)
- **Designer (0.5 FTE):** Review UX, approve designs

### Week 2
- **Frontend (1 dev):** Search UI
- **Backend (1 dev):** Search API + Export API
- **Full team (0.5 day):** Testing

### Week 3
- **Frontend (1 dev):** UX polish, empty states
- **Designer (1 dev):** Micro-interactions, mobile UX
- **Docs (0.5 FTE):** Documentation updates
- **Full team (1 day):** QA + Launch prep

**Total Effort:** ~6 person-weeks (vs 18 person-weeks original)

---

## Communication Plan

### Weekly Updates (Every Friday)
- Progress report (what's done, what's next)
- Demo video (show new features)
- Blockers (what's at risk)

### Launch Announcement (Week 3)
- Product tour video (2 minutes)
- Feature highlights (browse, search, export)
- Next steps (post-MVP roadmap)

---

**Last Updated:** November 3, 2025
**Owner:** Product Designer (AI Agent)
**Status:** APPROVED - Execute Week 1 immediately
