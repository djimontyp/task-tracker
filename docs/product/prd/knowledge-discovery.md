# PRD: Knowledge Discovery

**Version:** 1.0
**Date:** 2025-12-28
**Status:** Draft
**Owner:** maks

## Overview

### Problem Statement

Knowledge workers receive 100+ messages daily across communication channels (Telegram, Slack). 80% is noise. Important information gets lost, decisions are forgotten, and insights are never captured.

### Solution

Pulse Radar automatically extracts structured knowledge (Atoms) from raw messages, organizes them into Topics, and presents actionable items to users through a focused Dashboard.

### Target Users

| Persona | Description | Primary Goals |
|---------|-------------|---------------|
| **Knowledge Worker** | Team member who consumes knowledge | See what's new, find relevant info |
| **Team Lead** | Manages team knowledge | Review & approve atoms, organize topics |
| **Admin** | System administrator | Configure AI, debug issues |

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                      DAILY WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. MORNING CHECK-IN (Dashboard)                                │
│     └── "What's new since yesterday?"                           │
│         ├── TodaysFocus: 5 atoms need review                    │
│         ├── New Today: 12 atoms extracted                       │
│         └── Active Topics: Frontend, Mobile, Backend            │
│                           │                                      │
│                           ▼                                      │
│  2. DRILL-DOWN (Topics → Atoms)                                 │
│     └── Click "Frontend" topic                                  │
│         ├── See 8 atoms in this topic                           │
│         ├── Filter by type: problems, decisions                 │
│         └── Read atom details                                   │
│                           │                                      │
│                           ▼                                      │
│  3. VALIDATION (Approve/Reject)                                 │
│     └── Review pending atoms                                    │
│         ├── Approve: correct extraction ✓                       │
│         ├── Reject: duplicate/irrelevant ✗                      │
│         └── Bulk actions for trusted sources                    │
│                           │                                      │
│                           ▼                                      │
│  4. SEARCH & EXPLORE                                            │
│     └── "What did we decide about authentication?"              │
│         ├── Semantic search across all atoms                    │
│         └── Results grouped by topic                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### F1: Dashboard — "What's New Today"

**Priority:** P0 (Must Have)

**Description:**
Dashboard is the entry point. Shows actionable items, not statistics.

**Components:**

| Component | Purpose | Data Source |
|-----------|---------|-------------|
| TodaysFocus | Pending atoms needing review | `GET /atoms?status=pending_review&limit=3` |
| NewToday | Atoms created today | `GET /atoms?created_after=today&limit=10` |
| ActiveTopics | Topics with recent activity | `GET /topics/recent?period=today` |
| QuickStats | Counts by atom type | `GET /dashboard/metrics` |

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🌅 Good morning, Maks!                                         │
│  5 items need your attention today                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TODAY'S FOCUS                                          [View All]│
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚠️ Problem   API timeout in production      [Approve][Reject]│
│  │ 💡 Decision  Switch to Redis for caching    [Approve][Reject]│
│  │ 🔍 Insight   User login patterns changed    [Approve][Reject]│
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  NEW TODAY                                              [View All]│
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 12:30  Decision  "Use JWT for mobile auth"    → Frontend │  │
│  │ 11:45  Problem   "Memory leak in worker"      → Backend  │  │
│  │ 10:20  Insight   "Users prefer dark mode"     → Mobile   │  │
│  │ 09:15  Question  "Which DB for analytics?"    → Backend  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ACTIVE TOPICS                                                   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 📱 Mobile  │ │ 🖥 Frontend│ │ ⚙️ Backend │ │ 🔒 Security│   │
│  │ 5 new     │ │ 3 new     │ │ 4 new     │ │ 1 new     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Dashboard loads in < 2 seconds
- [ ] TodaysFocus shows max 3-5 pending atoms
- [ ] One-click approve/reject from dashboard
- [ ] Period selector: today, yesterday, this week
- [ ] Empty state when no pending items

---

### F2: Topics Browse

**Priority:** P0 (Must Have)

**Description:**
Topics are organizational categories. Users browse topics to see related atoms.

**Components:**

| Component | Purpose |
|-----------|---------|
| TopicsGrid | Visual grid of all topics with icons |
| TopicDetail | Topic header + atoms list + messages |
| TopicFilters | Filter atoms by type within topic |

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Topics                                              [+ New Topic]│
├─────────────────────────────────────────────────────────────────┤
│  Search topics...                              [Grid] [List]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │     📱       │ │     🖥       │ │     ⚙️       │            │
│  │   Mobile     │ │   Frontend   │ │   Backend    │            │
│  │   15 atoms   │ │   23 atoms   │ │   18 atoms   │            │
│  │   Updated 2h │ │   Updated 1h │ │   Updated 3h │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │     🔒       │ │     🤖       │ │     📊       │            │
│  │   Security   │ │   AI/ML      │ │   Analytics  │            │
│  │   8 atoms    │ │   12 atoms   │ │   5 atoms    │            │
│  │   Updated 1d │ │   Updated 4h │ │   Updated 2d │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Topic Detail Page:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Topics                                                │
├─────────────────────────────────────────────────────────────────┤
│  📱 Mobile Development                                           │
│  Everything related to iOS and Android apps                      │
├─────────────────────────────────────────────────────────────────┤
│  [All] [Problems] [Decisions] [Insights] [Questions]            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⚠️ Problem                                    2 hours ago │  │
│  │ Memory leak in iOS background task                        │  │
│  │ The app crashes after 30 minutes in background...         │  │
│  │ Confidence: 85%                        [Approve] [Reject] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 💡 Decision                                   5 hours ago │  │
│  │ Use SwiftUI for new features                              │  │
│  │ Team agreed to migrate gradually from UIKit...            │  │
│  │ Confidence: 92%                             ✓ Approved    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Topics grid shows icon, name, atom count
- [ ] Click topic → see atoms within
- [ ] Filter atoms by type (tabs)
- [ ] Atoms sorted by date (newest first)
- [ ] Approve/reject atoms inline

---

### F3: Daily Review (Atoms Page)

**Priority:** P0 (Must Have)

**Description:**
Dedicated page for reviewing pending atoms. Primary workflow for knowledge validation.

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Daily Review                                    [Approve All]   │
├─────────────────────────────────────────────────────────────────┤
│  [All: 45] [Pending: 12] [Approved: 25] [Rejected: 8]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PROBLEMS (3)                                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ □ API timeout in production                 → Backend     │  │
│  │ □ Memory leak in iOS app                    → Mobile      │  │
│  │ □ Login button not clickable               → Frontend    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  DECISIONS (4)                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ □ Switch to Redis for caching               → Backend     │  │
│  │ □ Use SwiftUI for new features              → Mobile      │  │
│  │ □ Migrate to TypeScript strict mode         → Frontend    │  │
│  │ □ Add rate limiting to API                  → Security    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Selected: 3                    [Approve Selected] [Reject Selected]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Tabs for All/Pending/Approved/Rejected with counts
- [ ] Atoms grouped by type
- [ ] Multi-select with checkboxes
- [ ] Bulk approve/reject actions
- [ ] "Approve All" for quick processing
- [ ] Rejection requires reason

---

### F4: Semantic Search

**Priority:** P1 (Should Have)

**Description:**
Natural language search across all knowledge.

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 What did we decide about authentication?                    │
├─────────────────────────────────────────────────────────────────┤
│  Results for "authentication" (8 found)                         │
│  [All] [Decisions] [Problems] [Insights]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  💡 Decision • Security • 2 days ago                            │
│  Use JWT tokens for mobile authentication                        │
│  "...we decided to implement JWT for **authentication**..."     │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ⚠️ Problem • Backend • 1 week ago                              │
│  Authentication fails after password reset                       │
│  "...users report **authentication** errors after..."           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  🔍 Question • Security • 3 days ago                            │
│  Should we add 2FA to authentication?                            │
│  "...discussing adding 2FA to the **authentication** flow..."   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Search bar in navbar (global)
- [ ] Semantic search (not just keyword)
- [ ] Results ranked by relevance
- [ ] Highlighted matches in snippets
- [ ] Filter by atom type
- [ ] Click result → navigate to atom

---

### F5: Admin — Messages Debug (Hidden)

**Priority:** P2 (Nice to Have)

**Description:**
Admin-only access to raw messages for debugging extraction issues.

**Access:** Admin Panel → Messages Debug

**Acceptance Criteria:**
- [ ] Hidden from regular users
- [ ] Shows raw message with scoring factors
- [ ] Shows extraction history
- [ ] Can manually trigger re-extraction
- [ ] Filter by classification (signal/noise)

---

## Technical Requirements

### API Endpoints Needed

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /atoms?status=pending_review` | TodaysFocus | ⚠️ Need filter |
| `GET /atoms?created_after=date` | NewToday | ⚠️ Need filter |
| `GET /topics/recent` | ActiveTopics | ✅ Exists |
| `GET /dashboard/metrics` | QuickStats | ✅ Exists |
| `POST /atoms/bulk-approve` | Bulk approve | ✅ Exists |
| `GET /search?q=` | Semantic search | ✅ Exists |

### Frontend Components Needed

| Component | Location | Status |
|-----------|----------|--------|
| TodaysFocus | DashboardPage | ✅ Created (mock) |
| NewTodayTimeline | DashboardPage | ⚠️ Need API |
| TopicsGrid | TopicsPage | ✅ Exists |
| DailyReviewPage | AtomsPage | ⚠️ Refactor needed |
| SearchResults | SearchPage | ✅ Exists |

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time to first insight | < 30 seconds | Dashboard load + first atom view |
| Daily review completion | > 80% atoms reviewed | Pending → Approved/Rejected rate |
| Search success rate | > 70% find relevant | Search → click rate |
| User satisfaction | > 4/5 stars | In-app feedback |

---

## Out of Scope (v1)

- Multi-user collaboration
- Comments on atoms
- Custom atom types
- Integration with other tools (Notion, Jira)
- Mobile app
- Offline mode

---

## Timeline

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| **Phase 1** | Dashboard | TodaysFocus API, NewToday component |
| **Phase 2** | Topics | TopicDetail improvements |
| **Phase 3** | Daily Review | AtomsPage refactor, bulk actions |
| **Phase 4** | Search | Semantic search polish |

---

## Open Questions

1. **Auto-approval:** Should high-confidence atoms (>0.95) be auto-approved?
2. **Notifications:** Should we notify users when new atoms arrive?
3. **Atom relationships:** How to visualize links between atoms?
4. **Topic hierarchy:** Should topics have sub-topics?

---

## Related Documents

- [[.obsidian-docs/знання/концепції/entity-hierarchy]] — Data model
- [[.obsidian-docs/знання/концепції/user-journey]] — User flows
- [[.obsidian-docs/знання/концепції/user-stories]] — Detailed stories
- [[docs/architecture/adr/002-entity-hierarchy]] — Architecture decision
