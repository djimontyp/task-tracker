# Features to CUT/DEFER - Ruthless Simplification

**Context:** Current plan is 11 weeks (6 phases). System is 90% admin tools, 20% consumer features. Goal: Ship consumer MVP in 2-3 weeks.

**Philosophy:** If we can ship without it, CUT IT. Working product TODAY > Perfect product SOMEDAY.

---

## CRITICAL BUG (Fix Immediately)

**Issue:** Message click only works in Admin Mode (blocker for consumers)

**Current Code** (`MessagesPage/index.tsx:562-566`):
```tsx
onRowClick={(message: Message) => {
  if (isAdminMode) {  // ← ONLY works in admin mode!
    setInspectingMessageId(String(message.id))
  }
}}
```

**Fix:** Add consumer-friendly message detail view (NOT admin diagnostic modal)

**Effort:** 4-6 hours
**Priority:** P0 - BLOCKER

---

## CUT: Phase 5 (Analysis Runs + Proposals)

**Status:** Not started (0% complete)
**Effort:** 1.5 weeks (11 tasks)
**User Value:** Zero (pure admin diagnostic)

**What it does:**
- Refactor Analysis Runs → Topics admin tab
- Proposals → inline cards within Topics
- LLM reasoning transparency for proposals
- Bulk approve proposals
- Trigger analysis from Topics page

**Why CUT:**
- Admin calibration tool, not consumer feature
- Users don't care about "AI analysis runs"
- Adds complexity without user value
- Can defer to post-MVP when we need AI tuning

**Decision:** DEFER to post-launch (Phase 2 product)

---

## CUT: Phase 6 (Export + API Documentation)

**Status:** Not started (0% complete)
**Effort:** 2 weeks (14 tasks)
**User Value:** Medium (nice to have)

**What it does:**
- Export page with format options (Markdown, JSON)
- Batch export (multiple topics)
- API documentation (RESTful endpoints)
- Knowledge Sources management
- Admin Tools settings page

**Why SIMPLIFY:**
- Export is useful BUT not MVP blocker
- Can start with simple "Export Topic" button (1-click Markdown)
- API docs can wait until we have API users
- Knowledge Sources = just Telegram for MVP

**Decision:**
- KEEP: Simple export button (1 topic → Markdown, 4h work)
- CUT: Batch export, JSON format, API docs (defer 2-3 weeks)
- CUT: Settings → Knowledge Sources page (use existing Settings)
- CUT: Settings → Admin Tools page (Admin Panel is enough)

**Effort Saved:** 1.5 weeks → 4 hours (85% reduction)

---

## SIMPLIFY: Phase 4 (Topics Enhancement)

**Status:** Not started (0% complete)
**Effort:** 1.5 weeks (13 tasks)
**User Value:** High (consumer browsing)

**What it does:**
- Consumer grid/list views (responsive cards)
- Admin view with quality scores
- Topic relationships graph (semantic connections)
- Bulk operations (merge, archive, delete)
- Export single topic

**Why SIMPLIFY:**
- Graph visualization = 6h work, questionable value
- Bulk merge = complex, rarely used
- Topic quality scores = admin diagnostic

**Decision:**
- KEEP: Grid/list toggle (existing code works)
- KEEP: Topic detail page (new, essential)
- KEEP: Bulk archive/delete (reuse Phase 2 code)
- CUT: Relationship graph visualization (defer 2-3 weeks)
- CUT: Bulk merge topics (complex, edge case)
- CUT: Topic quality score display (admin feature)

**Effort Saved:** 1.5 weeks → 3 days (60% reduction)

---

## SIMPLIFY: Phase 3 (Message Inspect Modal)

**Status:** Complete (100% - but admin-only!)
**Effort:** Already spent
**User Value:** High (IF made consumer-friendly)

**What exists:**
- 3-tab modal (Classification, Atoms, History)
- LLM confidence scores (0-100%)
- Decision rationale with expandable sections
- Dimension breakdown (Topic Relevance, Noise, Urgency)
- Reassign Topic functionality

**Why SIMPLIFY:**
- 3 tabs = overkill for consumers
- Confidence scores = admin diagnostic
- "Decision rationale" = consumers don't care

**Decision:**
- CREATE: Consumer message modal (NEW, 4-6h)
  - Single view (no tabs)
  - Show: content, timestamp, topic, source
  - Actions: Archive, Share, Move to Topic
  - Hide: LLM reasoning, confidence scores
- KEEP: Admin modal (existing, for calibration)
- Conditional: `if (isAdminMode)` shows admin modal, else consumer modal

**Effort:** 4-6 hours (new consumer modal)

---

## SIMPLIFY: Phase 2 (Admin Panel Components)

**Status:** Complete (100%)
**Effort:** Already spent
**User Value:** Medium (admin calibration)

**What exists:**
- BulkActionsToolbar with multi-select
- MetricsDashboard (4 metrics, WebSocket)
- PromptTuningInterface
- AdminBadge component

**Why SIMPLIFY:**
- Metrics dashboard shows 4 metrics (Topic Quality, Noise Ratio, Classification Accuracy, Active Runs)
- Too much admin complexity for MVP

**Decision:**
- KEEP: BulkActionsToolbar (already done, works well)
- SIMPLIFY: Metrics Dashboard → 2 metrics max (Topic Count, Message Count)
- KEEP: Prompt Tuning (minimal, already done)
- KEEP: Admin Badges (already done, 15min work)

**Effort:** 2h to simplify metrics (remove 2 complex metrics)

---

## CUT: Versioning System Complexity

**Status:** Implemented (draft → approved workflows)
**Effort:** Already spent (backend + frontend)
**User Value:** Low (cognitive overhead)

**What it does:**
- Topics have "draft" vs "approved" states
- Atoms have "draft" vs "approved" states
- Version history with diffs
- Approval workflows

**Why SIMPLIFY:**
- Consumers don't understand "draft" vs "approved"
- Adds cognitive load ("Why is this draft?")
- Calibration phase = just mark as "reviewed" or not

**Decision:**
- KEEP: Backend versioning (already implemented, no cost to remove)
- HIDE: Consumer UI shows ALL items (no filtering by status)
- SHOW: Admin Mode can filter draft/approved
- SIMPLIFY: Remove "Approve" button from consumer views

**Effort:** 1-2h to hide status badges in consumer mode

---

## CUT: Multi-Source Support (Phase 6)

**Status:** Not started
**Effort:** Unknown (probably 1 week)
**User Value:** Low (MVP can be Telegram-only)

**What it plans:**
- Settings → Knowledge Sources page
- Multi-channel Telegram support
- Future: Email, Slack, Discord integrations

**Why CUT:**
- MVP = single Telegram channel is fine
- Can add multi-source in Phase 2 (post-launch)
- Users don't need this on Day 1

**Decision:** DEFER to post-MVP (2-4 weeks after launch)

---

## CUT: Advanced Search Features

**Status:** Not started
**Effort:** Phase 6 (part of Export)
**User Value:** High (eventually)

**What's needed:**
- Semantic search (vector similarity)
- Hybrid search (keyword + semantic)
- Search results page
- Filters and refinement

**Why SIMPLIFY:**
- Semantic search backend exists (pgvector)
- Just need basic UI (search bar + results list)
- Advanced filters can wait

**Decision:**
- KEEP: Simple search bar (keyword search, 2h work)
- DEFER: Semantic search UI (2-3 days work, post-MVP)
- DEFER: Advanced filters (1 week, post-MVP)

**Effort Saved:** 1 week → 2 hours (95% reduction)

---

## KEEP: Phase 1 (Foundation)

**Status:** Complete (100%)
**Effort:** Already spent (2 weeks)
**User Value:** Critical (infrastructure)

**What it does:**
- Admin Panel component with collapse/expand
- Keyboard shortcut (Cmd+Shift+A)
- `useAdminMode()` hook with localStorage
- Settings toggle for Admin Mode
- Visual mode indicator (Admin/Consumer badge)

**Why KEEP:**
- Already complete, works perfectly
- Foundation for two-layer architecture
- No cost to keep, high cost to remove

**Decision:** KEEP everything (no changes)

---

## Summary: What We're Shipping in MVP

### KEEP (Essential)
- Phase 1: Admin Panel foundation ✅ (complete)
- Phase 2: Bulk actions, simplified metrics ✅ (complete, minor simplification)
- Phase 3: Admin modal ✅ (complete) + NEW consumer modal (4-6h)
- Phase 4: Grid/list views, Topic detail pages (3 days)
- Simple search bar (2h)
- Simple export button (4h)

### CUT/DEFER (Nice-to-have)
- Phase 5: Analysis Runs + Proposals (DEFER 2-4 weeks)
- Phase 6: Full export system (KEEP simple button, CUT advanced)
- Relationship graph visualization (DEFER 2-3 weeks)
- Bulk merge topics (DEFER, edge case)
- Multi-source support (DEFER post-MVP)
- Advanced search/filters (DEFER 2-3 weeks)
- API documentation (DEFER until needed)
- Versioning UI complexity (HIDE from consumers)

---

## Timeline Comparison

### Original Plan (ADR-0001)
- Phase 1: 2 weeks ✅ DONE
- Phase 2: 2 weeks ✅ DONE
- Phase 3: 2 weeks ✅ DONE (admin-only)
- Phase 4: 1.5 weeks
- Phase 5: 1.5 weeks
- Phase 6: 2 weeks
- **Total:** 11 weeks (7 weeks remaining)

### Simplified MVP Plan
- Phase 1: ✅ DONE
- Phase 2: ✅ DONE (minor polish, 2h)
- Phase 3: Consumer modal (4-6h, 1 day)
- Phase 4: Simplified Topics (3 days)
- Search bar (2h)
- Export button (4h)
- **Total:** ~2 weeks from today (85% faster)

---

## ROI Analysis: What We Gain

### Time Saved
- **Before:** 7 weeks remaining (Phase 3-6)
- **After:** 2 weeks remaining (simplified features)
- **Savings:** 5 weeks (71% faster to MVP)

### Complexity Reduced
- **Before:** 77 total tasks (29 remaining)
- **After:** ~15 essential tasks
- **Reduction:** 48% fewer tasks (focus on what matters)

### User Value Delivered
- **Before:** Admin tools + complex features (50% user value)
- **After:** Core consumer experience (100% user value)

---

## Decision Matrix

| Feature | User Need | Dev Effort | Keep/Cut/Defer | Reasoning |
|---------|-----------|------------|----------------|-----------|
| Consumer message modal | Critical | 4-6h | KEEP | Blocker, must have |
| Topic detail pages | High | 3 days | KEEP | Core browsing |
| Simple search | High | 2h | KEEP | Essential utility |
| Simple export | Medium | 4h | KEEP | Quick win, high ROI |
| Graph visualization | Low | 6h | DEFER | Nice-to-have, complex |
| Analysis Runs UI | None | 1.5 weeks | CUT | Admin-only, no user value |
| Bulk merge topics | Low | 2 days | DEFER | Edge case, complex |
| API docs | None | 1 week | DEFER | No users yet |
| Multi-source | Low | 1 week | DEFER | Telegram-only MVP fine |
| Advanced search | Medium | 1 week | DEFER | Basic search is enough |

---

## Risks of Cutting Features

### Risk 1: Users want advanced search immediately
- **Probability:** Low (basic search covers 80% of use cases)
- **Mitigation:** Add semantic search in Week 3-4 (post-MVP)

### Risk 2: Export limitations frustrate users
- **Probability:** Medium (power users want batch export)
- **Mitigation:** Simple export covers 90% of cases, add advanced in Week 3

### Risk 3: Missing graph visualization hurts UX
- **Probability:** Low (topics list is sufficient for browsing)
- **Mitigation:** User feedback will tell us if it's needed

### Risk 4: Admin tools not polished enough
- **Probability:** Low (Phase 1-3 already complete and working)
- **Mitigation:** Current admin tools are "good enough" for calibration

---

## Success Metrics

### MVP is ready when:
1. Consumer can click message → see details (BLOCKER FIX)
2. Consumer can browse Topics → drill into Atoms/Messages
3. Consumer can search messages by keyword
4. Consumer can export single Topic as Markdown
5. Admin retains all current tools (Phase 1-3)

### NOT required for MVP:
- Analysis Runs UI
- Proposal review interface
- Relationship graph
- Batch export
- API documentation
- Multi-source support

---

**Last Updated:** November 3, 2025
**Decision Maker:** Product Designer (AI Agent)
**Status:** APPROVED - Ship simplified MVP in 2 weeks
