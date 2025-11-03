# Quick MVP Plan: 14-Day Sprint to Consumer Product

**Start Date:** November 4, 2025 (Monday)
**Ship Date:** November 22, 2025 (Friday)
**Goal:** Ship consumer-ready product with 4 core features

---

## Sprint Overview

**What We're Building:**
1. Consumer Message Detail Modal (fixes blocker)
2. Topic Detail Pages (enables browsing)
3. Basic Search (keyword matching)
4. Simple Export (Markdown format)

**What We're Skipping:**
- Phase 5 entirely (Analysis Runs refactor) - 60h saved
- Graph visualization - 14h saved
- API documentation - 22h saved
- Batch export / JSON format - 16h saved
- **Total Saved: 112 hours (2.8 weeks)**

---

## Day-by-Day Breakdown

### WEEK 1: Fix Blocker + Core Navigation

#### Day 1 (Mon Nov 4): Consumer Message Modal - Part 1

**Owner:** react-frontend-architect
**Hours:** 4h
**Status:** 🔴 P0 - Critical Blocker

**Morning (2h):**
1. Create `<ConsumerMessageModal>` component
   ```tsx
   // File: frontend/src/features/messages/components/ConsumerMessageModal.tsx
   interface ConsumerMessageModalProps {
     messageId: string;
     onClose: () => void;
   }
   ```

2. Design simple layout (NO TABS):
   ```
   ┌─────────────────────────────────────┐
   │ [X Close]              [Archive]    │
   ├─────────────────────────────────────┤
   │ From: Developer User                 │
   │ Time: Nov 3, 2025 07:36             │
   │ Source: Telegram                     │
   │                                      │
   │ "Nice work on the last release!"     │
   │                                      │
   │ Topic: Product Design                │
   │ Keywords: release, dashboard         │
   └─────────────────────────────────────┘
   ```

**Afternoon (2h):**
3. Wire up data fetching
   - Reuse existing `useMessage(id)` hook
   - Display: content, timestamp, author, source, topic
   - Actions: Close, Archive

4. Update `MessagesPage/index.tsx`:
   ```tsx
   const [viewingMessageId, setViewingMessageId] = useState<string | null>(null);

   onRowClick={(message: Message) => {
     if (isAdminMode) {
       setInspectingMessageId(String(message.id)) // Admin modal
     } else {
       setViewingMessageId(String(message.id)) // Consumer modal ✅
     }
   }}
   ```

**EOD Checklist:**
- [ ] Component created and renders
- [ ] Data fetching works
- [ ] Modal opens on message click (User Mode)
- [ ] Admin Mode still opens admin modal
- [ ] Committed: `feat(messages): add consumer message detail modal (WIP)`

---

#### Day 2 (Tue Nov 5): Consumer Message Modal - Part 2

**Owner:** react-frontend-architect
**Hours:** 4h
**Status:** 🟡 P0 - Finalizing

**Morning (2h):**
1. Add "Related Messages" section
   - Show 3-5 messages from same topic
   - Simple list with timestamps
   - Click → opens another modal (nested)

2. Polish UI:
   - Proper spacing (Tailwind utilities)
   - Typography hierarchy (headings, body)
   - Mobile-responsive (375px width test)

**Afternoon (2h):**
3. Add actions:
   - Archive button → calls `archiveMessage` mutation
   - Close button → `onClose()` callback
   - Keyboard: Escape to close

4. Test exhaustively:
   - User Mode: Click message → Consumer modal ✅
   - Admin Mode: Click message → Admin diagnostic modal ✅
   - Mobile: Touch message → Modal works
   - Keyboard: Tab navigation, Escape to close

**EOD Checklist:**
- [ ] Related messages displayed
- [ ] Archive action works
- [ ] Modal closes (X button, Escape, backdrop click)
- [ ] Mobile-responsive (tested on 375px)
- [ ] Committed: `feat(messages): complete consumer message modal (P0 blocker fix)`

---

#### Day 3 (Wed Nov 6): Topic Detail Pages - Part 1

**Owner:** react-frontend-architect
**Hours:** 4h
**Status:** 🟢 P1 - Core Navigation

**Morning (2h):**
1. Create route: `/topics/:id`
   ```tsx
   // File: frontend/src/features/topics/pages/TopicDetailPage.tsx
   const TopicDetailPage = () => {
     const { id } = useParams();
     const { data: topic } = useTopic(id);
     // ...
   };
   ```

2. Design layout:
   ```
   ┌─────────────────────────────────────────┐
   │ < Back to Topics                        │
   ├─────────────────────────────────────────┤
   │ 📱 Product Design                        │
   │ AI-extracted topic about design feedback│
   │                                          │
   │ 15 messages • Last updated 2 hours ago   │
   │ [Export] [Archive]                       │
   ├─────────────────────────────────────────┤
   │ Messages ▼                               │
   │                                          │
   │ [Message Card 1]                         │
   │ [Message Card 2]                         │
   │ [Message Card 3]                         │
   └─────────────────────────────────────────┘
   ```

**Afternoon (2h):**
3. Fetch topic data:
   - `useTopic(id)` hook (GET `/api/v1/topics/:id`)
   - Display: name, description, icon, stats

4. Wire up navigation:
   - Topics grid card → onClick → navigate(`/topics/${topic.id}`)
   - Breadcrumbs: "Dashboard → Topics → Product Design"

**EOD Checklist:**
- [ ] Route `/topics/:id` created
- [ ] Topic metadata displays
- [ ] Click topic card → navigate to detail page
- [ ] Breadcrumbs work
- [ ] Committed: `feat(topics): add topic detail page route and layout`

---

#### Day 4 (Thu Nov 7): Topic Detail Pages - Part 2

**Owner:** react-frontend-architect
**Hours:** 4h
**Status:** 🟢 P1 - Display Messages

**Morning (2h):**
1. Fetch messages for topic:
   ```tsx
   const { data: messages } = useTopicMessages(topicId);
   ```

2. Display messages list:
   - Reuse `<MessageCard>` component from Messages page
   - Show 10 per page (pagination later)
   - Click message → Consumer detail modal opens

**Afternoon (2h):**
3. Add "Export" button (placeholder):
   - Button renders (no functionality yet - that's Day 8)
   - Tooltip: "Export this topic as Markdown"
   - Disabled state for now

4. Polish & test:
   - Mobile-responsive layout
   - Loading states (skeleton screens)
   - Empty state: "No messages in this topic yet"

**EOD Checklist:**
- [ ] Messages list displays
- [ ] Click message → Consumer modal opens
- [ ] Export button placeholder added
- [ ] Mobile-responsive
- [ ] Committed: `feat(topics): complete topic detail page with messages`

---

#### Day 5 (Fri Nov 8): Week 1 Wrap-Up & Testing

**Owner:** Full team
**Hours:** 4h
**Status:** 🔵 Testing & QA

**Morning (2h):**
1. Manual testing (all Week 1 features):
   - Consumer modal: User Mode works ✅
   - Admin modal: Admin Mode still works ✅
   - Topic detail pages: Navigation works ✅
   - Breadcrumbs: Back navigation works ✅

2. Bug fixes (P0/P1 only):
   - Fix any breaking issues
   - Defer minor bugs to Week 2-3

**Afternoon (2h):**
3. Code review:
   - react-frontend-architect reviews all commits
   - Check: TypeScript types, accessibility, mobile UX

4. Week 1 demo:
   - Record 2-minute video showing:
     - Message click now works (blocker fixed!)
     - Topic detail pages enable drill-down
   - Share with team

**EOD Checklist:**
- [ ] All Week 1 features tested
- [ ] 0 critical bugs (P0)
- [ ] Demo video recorded
- [ ] Ready for Week 2 (Search + Export)
- [ ] Committed: `test: add manual QA checklist for Week 1 features`

---

### WEEK 2: Search + Export

#### Day 6 (Mon Nov 11): Basic Search - Backend

**Owner:** fastapi-backend-expert
**Hours:** 4h
**Status:** 🟢 P1 - Backend API

**Morning (2h):**
1. Create search endpoint:
   ```python
   # File: backend/app/api/v1/endpoints/search.py
   @router.get("/search")
   async def search(
       q: str,
       db: Session = Depends(get_db)
   ) -> SearchResultsResponse:
       # PostgreSQL full-text search
       topics = search_topics(db, q)
       messages = search_messages(db, q)
       return SearchResultsResponse(topics=topics, messages=messages)
   ```

2. Implement PostgreSQL FTS:
   - Use `to_tsvector()` and `ts_rank()` for relevance
   - Search across: message content, topic names, atom content
   - Return top 20 results

**Afternoon (2h):**
3. Add text snippets:
   - Highlight matching words in results
   - Truncate to 150 characters
   - Example: "...Nice work on the **release**! Dashboard looks..."

4. Test API:
   - `GET /api/v1/search?q=dashboard` → returns results
   - Performance: <500ms response time
   - Write 5 unit tests

**EOD Checklist:**
- [ ] Search endpoint working
- [ ] Results include topics + messages
- [ ] Text snippets with highlights
- [ ] Performance <500ms
- [ ] Committed: `feat(api): add basic search endpoint with PostgreSQL FTS`

---

#### Day 7 (Tue Nov 12): Basic Search - Frontend

**Owner:** react-frontend-architect
**Hours:** 4h
**Status:** 🟢 P1 - Search UI

**Morning (2h):**
1. Add search bar to header:
   ```tsx
   // File: frontend/src/shared/components/SearchBar.tsx
   <input
     type="search"
     placeholder="Search messages..."
     onKeyDown={(e) => e.key === '/' && e.preventDefault()}
     // Debounced search (500ms)
   />
   ```

2. Keyboard shortcut:
   - Press `/` → focus search bar
   - Press `Escape` → clear search

**Afternoon (2h):**
3. Create results page: `/search?q=dashboard`
   - Grouped results: Topics (3), Messages (17)
   - Click topic → navigate to topic detail
   - Click message → open consumer modal
   - Highlight matching text (bold)

4. Polish UX:
   - Loading spinner while searching
   - Empty state: "No results for '{query}'"
   - Clear button (X icon) to reset search

**EOD Checklist:**
- [ ] Search bar in header (always visible)
- [ ] `/` keyboard shortcut works
- [ ] Results page displays grouped results
- [ ] Click result → navigates correctly
- [ ] Committed: `feat(search): add search bar and results page`

---

#### Day 8 (Wed Nov 13): Simple Export

**Owner:** fastapi-backend-expert (2h) + react-frontend-architect (2h)
**Hours:** 4h total
**Status:** 🟢 P2 - Data Portability

**Backend (2h):**
1. Create export endpoint:
   ```python
   @router.get("/topics/{id}/export")
   async def export_topic(
       id: int,
       format: str = "markdown",
       db: Session = Depends(get_db)
   ) -> FileResponse:
       topic = get_topic(db, id)
       markdown = generate_markdown(topic)
       return FileResponse(
           content=markdown,
           filename=f"{topic.name}_{datetime.now().strftime('%Y-%m-%d')}.md",
           media_type="text/markdown"
       )
   ```

2. Generate Markdown:
   ```markdown
   # {topic.name}

   {topic.description}

   ## Messages ({count})

   ### {message.content}
   **From:** {author} | **Date:** {timestamp} | **Source:** {source}

   {message.content}

   ---
   ```

**Frontend (2h):**
3. Wire up Export button (Topic detail page):
   ```tsx
   const handleExport = async () => {
     const response = await fetch(`/api/v1/topics/${topicId}/export`);
     const blob = await response.blob();
     downloadFile(blob, `${topic.name}.md`);
   };
   ```

4. Add loading state:
   - Button shows spinner while downloading
   - Success toast: "Exported Product Design.md"
   - Error toast if export fails

**EOD Checklist:**
- [ ] Export endpoint works
- [ ] Markdown format is clean
- [ ] Download triggers in browser
- [ ] Filename follows pattern: `TopicName_2025-11-13.md`
- [ ] Committed: `feat(export): add simple Markdown export for topics`

---

#### Day 9 (Thu Nov 14): Testing & Bug Fixes

**Owner:** Full team
**Hours:** 4h
**Status:** 🔵 QA Sprint

**Morning (2h):**
1. Test all Week 2 features:
   - Search: Keyword matching works ✅
   - Search: Results navigate correctly ✅
   - Export: Download works on desktop + mobile ✅
   - Export: Markdown format is valid ✅

2. Cross-browser testing:
   - Chrome (desktop + mobile)
   - Safari (iOS)
   - Firefox (desktop)

**Afternoon (2h):**
3. Bug triage:
   - P0 (critical): Fix immediately
   - P1 (high): Fix today
   - P2+ (medium/low): Defer to Week 3

4. Performance check:
   - Search latency: <500ms ✅
   - Export download: <2sec for 50 messages ✅
   - Page load times: <2sec (p75) ✅

**EOD Checklist:**
- [ ] All Week 2 features tested
- [ ] 0 critical bugs
- [ ] Performance meets targets
- [ ] Committed: `fix: resolve P0/P1 bugs from Week 2 QA`

---

#### Day 10 (Fri Nov 15): Week 2 Demo & Week 3 Prep

**Owner:** Product Designer (AI Agent) + Team Lead
**Hours:** 4h
**Status:** 🎯 Milestone Review

**Morning (2h):**
1. Week 2 demo video (3 minutes):
   - Show search in action (find messages instantly)
   - Show export (one-click download Markdown)
   - Compare before/after (blocker fixed, search added, export enabled)

2. Metrics review:
   - Consumer features: 60% complete (was 20%)
   - Time saved: 112 hours (2.8 weeks vs original plan)
   - Velocity: 2 weeks → 4 core features shipped

**Afternoon (2h):**
3. Week 3 planning:
   - Polish tasks (empty states, loading states)
   - Final QA checklist
   - Launch prep (docs, monitoring)

4. Stakeholder update:
   - Share demo video
   - Highlight: "Consumer product ready in 10 days!"
   - Next: Week 3 polish + launch

**EOD Checklist:**
- [ ] Demo video shared
- [ ] Metrics reviewed
- [ ] Week 3 plan approved
- [ ] Team aligned on launch goals

---

### WEEK 3 (OPTIONAL): Polish + Launch Prep

_Note: These days are OPTIONAL if you want to ship after Day 10. Otherwise, use Week 3 for polish and documentation._

#### Day 11-12 (Mon-Tue Nov 18-19): UX Polish

**Tasks:**
- Empty states (helpful messaging)
- Loading states (skeleton screens, spinners)
- Micro-interactions (hover, focus, transitions)
- Mobile UX fixes (touch targets, bottom sheets)

**Owner:** ux-ui-design-expert + react-frontend-architect
**Hours:** 8h (2 days)

---

#### Day 13 (Wed Nov 20): Documentation

**Tasks:**
- User docs (Getting Started, Search Tips, Export Guide)
- Technical docs (new components, API endpoints)
- Demo video (2-minute product tour)

**Owner:** documentation-expert
**Hours:** 4h

---

#### Day 14 (Thu Nov 21): Final QA & Launch Prep

**Tasks:**
- Smoke tests (all core flows)
- Performance check (Lighthouse 90+)
- Rollback plan (feature flags, backups)
- Launch checklist

**Owner:** Full team
**Hours:** 4h

---

#### Day 15 (Fri Nov 22): SHIP! 🚀

**Tasks:**
- Deploy to production (or mark as ready)
- Monitor for issues (first 24 hours)
- Gather user feedback
- Celebrate! MVP shipped in 15 days!

**Owner:** Product Manager + Tech Lead
**Hours:** 2h (+ 24h monitoring)

---

## Success Metrics: MVP Complete

### Functional Requirements ✅
- [x] Consumer can click message → see details
- [x] Consumer can browse Topics → drill into messages
- [x] Consumer can search messages by keyword
- [x] Consumer can export Topic as Markdown
- [x] Admin retains all current tools (no regressions)

### Quality Gates ✅
- [x] 0 critical bugs (P0)
- [x] <5 medium bugs (P1)
- [x] Page load <2sec (p75)
- [x] Search <500ms (p95)
- [x] Mobile-responsive (iOS + Android)
- [x] Keyboard accessible (WCAG 2.1 AA)

### User Experience ✅
- [x] First-time user gets value in <60 seconds
- [x] Daily user finds messages in <10 seconds
- [x] Export takes <5 seconds (one click)
- [x] No confusing terminology (LLM, confidence scores)

---

## Daily Standup Template

**Format:** 3 questions (5 minutes)

1. **What did you complete yesterday?**
   - Example: "Completed consumer message modal (Day 2)"

2. **What will you work on today?**
   - Example: "Starting topic detail pages (Day 3)"

3. **Any blockers?**
   - Example: "Need design review for modal layout"

**Standup Time:** 10:00 AM daily (async Slack if remote)

---

## Risk Mitigation

### Risk 1: Running Behind Schedule
- **Trigger:** Day 5 - Features incomplete
- **Mitigation:** Ship what's done, defer export to Week 4
- **Worst Case:** Ship in 18 days instead of 15 (still 60% faster than original)

### Risk 2: Critical Bug Found
- **Trigger:** P0 bug discovered during testing
- **Mitigation:** Stop feature work, fix bug immediately
- **Worst Case:** 1-2 day delay, ship Day 12 instead of Day 10

### Risk 3: Search Performance Issues
- **Trigger:** Search >1sec latency
- **Mitigation:** Optimize PostgreSQL query, add indexes
- **Worst Case:** Defer semantic search to Week 4, keep basic keyword search

---

## What We're NOT Building (Reminder)

These features are DEFERRED to post-MVP:

- Phase 5: Analysis Runs refactor (60h saved) - Admin tool, no user value
- Graph visualization (14h saved) - Nice visual, rarely used
- API documentation (22h saved) - No API users yet
- Batch export (10h saved) - Single-topic export covers 90% of cases
- JSON export (6h saved) - Markdown sufficient for MVP
- Multi-source support (40h+ saved) - Telegram-only MVP is fine
- Semantic search UI (16h saved) - Keyword search covers 80% of cases

**Total Saved:** 168 hours (4.2 weeks)

---

## Launch Checklist (Day 14)

### Pre-Launch
- [ ] All acceptance criteria met
- [ ] 0 critical bugs (P0)
- [ ] <5 medium bugs (P1)
- [ ] Documentation updated (user + technical)
- [ ] Demo video created (2-3 minutes)
- [ ] Performance benchmarks met (Lighthouse 90+)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Mobile testing complete (iOS + Android)
- [ ] Cross-browser testing complete (Chrome, Safari, Firefox)

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error logs (first 4 hours critical)
- [ ] Check performance dashboards
- [ ] Respond to user feedback quickly
- [ ] Rollback plan ready (if needed)

### Post-Launch (Day 16-17)
- [ ] Gather user feedback (interviews, surveys)
- [ ] Analyze usage metrics (search queries, export frequency)
- [ ] Prioritize Week 4 work (semantic search vs batch export vs graph)
- [ ] Celebrate wins! 🎉

---

**Last Updated:** November 3, 2025
**Sprint Master:** Product Designer (AI Agent)
**Status:** APPROVED - Start Day 1 on Monday Nov 4
