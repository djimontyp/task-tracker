# Feature Prioritization Matrix - Ruthless Decisions

**Date:** November 3, 2025
**Method:** User Value × Dev Effort × Priority Score

---

## Prioritization Framework

**Formula:** `Priority Score = (User Value / Dev Effort) × Urgency Multiplier`

**User Value Scale (0-10):**
- 10: Critical blocker - can't ship without it
- 7-9: High value - users notice immediately
- 4-6: Medium value - nice to have
- 1-3: Low value - users won't miss it
- 0: Zero value - internal or admin-only

**Dev Effort Scale (hours):**
- 1-4h: Trivial
- 4-8h: Small
- 1-2 days: Medium
- 3-5 days: Large
- 1+ weeks: Very Large

**Urgency Multiplier:**
- 3x: Blocker (ship-stopper)
- 2x: Launch requirement
- 1x: Post-launch enhancement
- 0.5x: Future consideration

**Decision Thresholds:**
- Priority Score ≥20: **KEEP** (must-have)
- Priority Score 10-19: **DEFER** (post-MVP)
- Priority Score <10: **CUT** (low ROI)

---

## CONSUMER FEATURES (Focus Area)

### Message Detail View (Consumer-Friendly)

| Attribute | Value |
|-----------|-------|
| User Value | 10/10 (CRITICAL - blocker) |
| Dev Effort | 6h (small) |
| Urgency | 3x (blocker) |
| **Priority Score** | **(10/6) × 3 = 5.0** |
| **Decision** | **KEEP - P0** |

**Rationale:**
- Current state: Message click does NOTHING in User Mode (broken UX)
- Impact: Users cannot view message details (core functionality)
- Risk: High - product unusable without this
- ROI: Extremely high (6h work unlocks entire product)

**Implementation:**
- Simple modal: content + timestamp + topic + actions
- Reuse existing `<Modal>` primitives from shadcn/ui
- Conditional rendering: `isAdminMode ? <AdminModal> : <ConsumerModal>`

---

### Topic Detail Pages (Drill-Down)

| Attribute | Value |
|-----------|-------|
| User Value | 9/10 (high - core browsing) |
| Dev Effort | 16h (2 days) |
| Urgency | 2x (launch requirement) |
| **Priority Score** | **(9/16) × 2 = 1.125** |
| **Decision** | **KEEP - P1** |

**Rationale:**
- Users need to drill into topics to see messages
- Current Topics page shows cards only (no detail view)
- Alternative: Messages page (but less intuitive)
- ROI: High (2 days work for core navigation)

**Implementation:**
- Route: `/topics/:id`
- Shows: Topic metadata, list of atoms, list of messages
- Click message → Consumer detail modal
- Breadcrumbs: Dashboard → Topics → Topic Detail

---

### Basic Search (Keyword)

| Attribute | Value |
|-----------|-------|
| User Value | 8/10 (high - essential utility) |
| Dev Effort | 8h (1 day) |
| Urgency | 2x (launch requirement) |
| **Priority Score** | **(8/8) × 2 = 2.0** |
| **Decision** | **KEEP - P1** |

**Rationale:**
- Users need to find messages quickly
- Browsing alone is insufficient for large datasets
- PostgreSQL full-text search exists (easy backend)
- ROI: Very high (1 day work for core feature)

**Implementation:**
- Search bar in header (always visible)
- Endpoint: `GET /api/v1/search?q={query}`
- Results page: grouped by Topics, Atoms, Messages
- Keyboard shortcut: `/` to focus search

---

### Simple Export (Markdown, Single Topic)

| Attribute | Value |
|-----------|-------|
| User Value | 7/10 (medium-high - data portability) |
| Dev Effort | 6h (small) |
| Urgency | 2x (launch requirement) |
| **Priority Score** | **(7/6) × 2 = 2.33** |
| **Decision** | **KEEP - P2** |

**Rationale:**
- Trust signal: "Can I get my data out?"
- Common user request for knowledge tools
- Differentiator vs competitors (many don't offer export)
- ROI: High (6h work for trust + portability)

**Implementation:**
- Button in Topic detail page: "Export"
- Endpoint: `GET /api/v1/topics/:id/export?format=markdown`
- Instant download (no preview, no format selection)
- Filename: `{topic_name}_{date}.md`

---

## ADMIN FEATURES (Already Complete)

### Admin Mode Toggle (Cmd+Shift+A)

| Attribute | Value |
|-----------|-------|
| User Value | 8/10 (high - foundation) |
| Dev Effort | ✅ **DONE** (Phase 1) |
| Urgency | N/A (complete) |
| **Priority Score** | N/A |
| **Decision** | **KEEP - Complete** |

**Status:** ✅ Complete (Phase 1)
**Why Keep:** Foundation for two-layer architecture (Consumer + Admin)

---

### Bulk Operations (Select + Actions)

| Attribute | Value |
|-----------|-------|
| User Value | 6/10 (admin-only, useful) |
| Dev Effort | ✅ **DONE** (Phase 2) |
| Urgency | N/A (complete) |
| **Priority Score** | N/A |
| **Decision** | **KEEP - Complete** |

**Status:** ✅ Complete (Phase 2)
**Why Keep:** Time-saver for admin cleanup, already works

---

### Metrics Dashboard (Real-Time)

| Attribute | Value |
|-----------|-------|
| User Value | 7/10 (admin monitoring) |
| Dev Effort | ✅ **DONE** (Phase 2) |
| Urgency | N/A (complete) |
| **Priority Score** | N/A |
| **Decision** | **SIMPLIFY - Remove 2 metrics** |

**Status:** ✅ Complete (Phase 2), needs minor simplification
**Action:** Remove "Classification Accuracy" and "Active Runs" (admin overkill)
**Effort:** 2h to simplify

---

### Message Inspect Modal (Admin Diagnostics)

| Attribute | Value |
|-----------|-------|
| User Value | 7/10 (admin calibration) |
| Dev Effort | ✅ **DONE** (Phase 3) |
| Urgency | N/A (complete) |
| **Priority Score** | N/A |
| **Decision** | **KEEP - Complete** |

**Status:** ✅ Complete (Phase 3)
**Why Keep:** Admin needs LLM reasoning transparency for calibration

---

## FEATURES TO CUT

### Phase 5: Analysis Runs + Proposals Refactor

| Attribute | Value |
|-----------|-------|
| User Value | 0/10 (zero - admin internal tool) |
| Dev Effort | 60h (1.5 weeks) |
| Urgency | 0.5x (future consideration) |
| **Priority Score** | **(0/60) × 0.5 = 0** |
| **Decision** | **CUT ENTIRELY** |

**Rationale:**
- **Zero consumer value** - users never see this
- **Admin tools already work** - existing Analysis Runs page functions
- **Refactoring busywork** - moving features to tabs doesn't improve functionality
- **System already calibrated** - 92.3% accuracy, minimal intervention needed
- **ROI: Negative** - 60h spent on internal plumbing

**What Stays:** Existing Analysis Runs and Proposals pages (keep as-is)

---

### Graph Visualization (Topic Relationships)

| Attribute | Value |
|-----------|-------|
| User Value | 3/10 (low - nice visual) |
| Dev Effort | 14h (complex) |
| Urgency | 0.5x (future consideration) |
| **Priority Score** | **(3/14) × 0.5 = 0.107** |
| **Decision** | **CUT - Defer to Post-MVP** |

**Rationale:**
- **High complexity, low ROI** - Force-directed graphs look cool but rarely used
- **Alternative exists** - "Related Topics" list is simpler and clearer
- **Performance concerns** - 100+ nodes = laggy on mobile
- **Library dependency** - react-force-graph or vis.js adds bundle size

**Alternative:** Show "Related Topics: DevOps (85%), Backend API (72%)" as simple list

---

### API Documentation (RESTful Endpoints)

| Attribute | Value |
|-----------|-------|
| User Value | 2/10 (low - no users yet) |
| Dev Effort | 22h (large) |
| Urgency | 0.5x (future) |
| **Priority Score** | **(2/22) × 0.5 = 0.045** |
| **Decision** | **CUT - Defer to Phase 2** |

**Rationale:**
- **No users requesting API** - MVP is UI-focused
- **FastAPI auto-docs exist** - `/api/docs` endpoint works
- **Post-product-market-fit** - build after validating product
- **ROI: Low** - 22h for docs nobody reads

**Alternative:** Link to FastAPI auto-generated docs at http://localhost:8000/docs

---

### Batch Export (Multiple Topics)

| Attribute | Value |
|-----------|-------|
| User Value | 4/10 (medium - power users) |
| Dev Effort | 10h (medium) |
| Urgency | 1x (post-launch) |
| **Priority Score** | **(4/10) × 1 = 0.4** |
| **Decision** | **DEFER - Week 4** |

**Rationale:**
- **Single-topic export covers 90% of cases**
- **Batch is edge case** - most users export one topic at a time
- **Adds UI complexity** - topic selection, ZIP file handling
- **ROI: Medium** - can add later if users request

**MVP:** Single-topic export only (6h work vs 16h for full system)

---

### JSON Export Format

| Attribute | Value |
|-----------|-------|
| User Value | 3/10 (low - niche use case) |
| Dev Effort | 6h (small) |
| Urgency | 1x (post-launch) |
| **Priority Score** | **(3/6) × 1 = 0.5** |
| **Decision** | **DEFER - Week 4** |

**Rationale:**
- **Markdown sufficient for MVP** - human-readable primary use case
- **API can provide JSON** - if users need machine-readable data
- **No requests yet** - nobody asking for JSON export
- **ROI: Low** - can add later if needed

**MVP:** Markdown only (simpler UX, no format selector)

---

### Topic Merge Operation (Bulk Admin)

| Attribute | Value |
|-----------|-------|
| User Value | 2/10 (low - rare edge case) |
| Dev Effort | 8h (complex logic) |
| Urgency | 0.5x (future) |
| **Priority Score** | **(2/8) × 0.5 = 0.125** |
| **Decision** | **CUT - Edge Case** |

**Rationale:**
- **Rarely used** - AI generates good topics, merging is rare
- **Better solution** - Adjust prompt tuning to prevent duplicates
- **Complex logic** - Redirecting atoms, preserving relationships
- **Bulk delete exists** - Can delete duplicates, let AI recreate

**Alternative:** Admin can delete duplicate topics, re-run analysis

---

### Admin Quality Score Badges (Per-Topic)

| Attribute | Value |
|-----------|-------|
| User Value | 3/10 (low - redundant) |
| Dev Effort | 4h (small) |
| Urgency | 0.5x (future) |
| **Priority Score** | **(3/4) × 0.5 = 0.375** |
| **Decision** | **CUT - Redundant** |

**Rationale:**
- **Metrics Dashboard already exists** - Topic Quality: 85/100 shown
- **Redundant information** - per-topic scores not needed daily
- **Visual clutter** - Admin badge + quality badge = too many badges
- **ROI: Low** - admin rarely needs granular quality scores

**Alternative:** Metrics dashboard shows aggregate quality (sufficient)

---

### Grid + List Views (Topics Page)

| Attribute | Value |
|-----------|-------|
| User Value | 5/10 (medium - nice-to-have) |
| Dev Effort | 20h (both views + toggle) |
| Urgency | 1x (post-launch) |
| **Priority Score** | **(5/20) × 1 = 0.25** |
| **Decision** | **SIMPLIFY - Grid Only** |

**Rationale:**
- **Grid is better for consumers** - visual, scannable, modern
- **List view for power users** - low priority for MVP
- **Toggle adds complexity** - preference storage, state management
- **ROI: Low** - one view sufficient for launch

**MVP:** Grid view only (14h vs 20h for both views)

---

## FEATURES TO DEFER (Post-MVP)

### Semantic Search (Vector Similarity)

| Attribute | Value |
|-----------|-------|
| User Value | 7/10 (high - better search) |
| Dev Effort | 16h (medium - pgvector UI) |
| Urgency | 1x (post-launch enhancement) |
| **Priority Score** | **(7/16) × 1 = 0.4375** |
| **Decision** | **DEFER - Week 4** |

**Rationale:**
- **Backend exists** - pgvector embeddings generated
- **Keyword search covers 80% of cases** - semantic is enhancement
- **Can add later** - not blocking MVP
- **ROI: Medium** - nice improvement but not critical

**MVP:** Keyword search (PostgreSQL FTS) - 8h work
**Week 4:** Add semantic search UI - 16h work

---

### Multi-Source Support (Slack, Email)

| Attribute | Value |
|-----------|-------|
| User Value | 6/10 (medium - future integrations) |
| Dev Effort | 40h+ (1 week per source) |
| Urgency | 0.5x (Phase 2 product) |
| **Priority Score** | **(6/40) × 0.5 = 0.075** |
| **Decision** | **DEFER - Post-MVP** |

**Rationale:**
- **Telegram-only MVP is fine** - validates product-market fit first
- **Large effort** - each source needs custom integration
- **Low urgency** - users aren't requesting this yet
- **ROI: Low for MVP** - can add after validating Telegram works

**Phase 2:** Add Slack, Discord, Email (4-6 weeks post-MVP)

---

## PRIORITY RANKING (What to Build When)

### Week 1: Critical Path (Must-Haves)

1. **Consumer Message Detail Modal** (6h) - Priority Score: 5.0 ✅
   - P0 - Blocker, ship-stopper
   - Fixes: Message click does nothing in User Mode

2. **Topic Detail Pages** (16h) - Priority Score: 1.125
   - P1 - Core navigation
   - Enables: Drill-down browsing

### Week 2: Core Features (High Value)

3. **Basic Search** (8h) - Priority Score: 2.0
   - P1 - Essential utility
   - Enables: Finding messages quickly

4. **Simple Export** (6h) - Priority Score: 2.33
   - P2 - Trust signal
   - Enables: Data portability

### Week 3: Polish + Launch

5. **UX Polish** (16h) - Priority Score: N/A
   - Empty states, loading states, micro-interactions
   - Mobile UX fixes

6. **Documentation** (8h) - Priority Score: N/A
   - User guides, technical docs, demo video

### Post-MVP (Week 4-6): Enhancements

7. **Semantic Search** (16h) - Deferred
8. **Batch Export** (10h) - Deferred
9. **Relationship Graph** (14h) - Deferred
10. **Multi-Source Support** (40h+) - Deferred

---

## DECISION MATRIX SUMMARY

| Feature | User Value | Dev Effort | Priority Score | Decision | Week |
|---------|------------|------------|----------------|----------|------|
| Consumer Message Modal | 10 | 6h | 5.0 | **KEEP** | 1 |
| Topic Detail Pages | 9 | 16h | 1.125 | **KEEP** | 1 |
| Basic Search | 8 | 8h | 2.0 | **KEEP** | 2 |
| Simple Export | 7 | 6h | 2.33 | **KEEP** | 2 |
| Semantic Search | 7 | 16h | 0.44 | **DEFER** | 4 |
| Batch Export | 4 | 10h | 0.4 | **DEFER** | 4 |
| Graph Visualization | 3 | 14h | 0.11 | **CUT** | - |
| JSON Export | 3 | 6h | 0.5 | **DEFER** | 4 |
| Multi-Source | 6 | 40h | 0.08 | **DEFER** | Post-MVP |
| API Documentation | 2 | 22h | 0.05 | **CUT** | - |
| Phase 5 Refactor | 0 | 60h | 0 | **CUT** | - |
| Topic Merge | 2 | 8h | 0.13 | **CUT** | - |
| Quality Score Badges | 3 | 4h | 0.38 | **CUT** | - |
| Grid + List Views | 5 | 20h | 0.25 | **SIMPLIFY** | 1 |

---

## ROI ANALYSIS: Time Savings

### Original Plan (ADR-0001 Phases 4-6)
- **Phase 4:** 13 tasks, 60h (1.5 weeks)
- **Phase 5:** 11 tasks, 60h (1.5 weeks)
- **Phase 6:** 14 tasks, 80h (2 weeks)
- **Total:** 38 tasks, 200h (5 weeks)

### Simplified MVP Plan
- **Week 1:** Consumer modal + Topic details (22h)
- **Week 2:** Search + Export (14h)
- **Week 3:** Polish + Docs (24h)
- **Total:** 60h (1.5 weeks of dev time, 3 weeks calendar)

### Savings
- **Time:** 200h → 60h (70% reduction)
- **Weeks:** 5 weeks → 1.5 weeks dev time (3 weeks calendar)
- **Tasks:** 38 tasks → 6 core tasks (84% reduction)
- **Focus:** 80% consumer value (vs 40% in original plan)

---

## Success Criteria Mapping

### MVP Complete When:
1. ✅ Consumer Message Modal works (fixes blocker)
2. ✅ Topic Detail Pages enable drill-down browsing
3. ✅ Basic Search lets users find messages instantly
4. ✅ Simple Export provides data portability
5. ✅ Admin tools remain functional (no regressions)

### NOT Required for MVP:
- ❌ Analysis Runs refactor (admin internal tool)
- ❌ Relationship graph (nice visual, rarely used)
- ❌ API documentation (no API users yet)
- ❌ Batch export (edge case, can add later)
- ❌ JSON export (Markdown sufficient)
- ❌ Multi-source support (Telegram-only fine)
- ❌ Semantic search (keyword covers 80% of cases)

---

**Last Updated:** November 3, 2025
**Decision Framework:** Evidence-based prioritization (User Value / Dev Effort × Urgency)
**Status:** APPROVED - Execute Week 1 immediately
