# Messages Page Redesign - Wireframe & Rationale

**Problem:** Current 9-column table creates cognitive overload. Users cannot scan messages efficiently.

**Solution:** Master-detail pattern with condensed table + expandable side panel.

---

## Before (Current State)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Search...] [Source ▼] [Status ▼] [Classification ▼] [Importance ▼]                   [View ▼]     │
├──┬────────────┬─────────────────────────────────────┬────────┬─────────┬────────┬──────────┬───────┤
│☐ │Author      │Content                              │Source  │Status   │Import. │Class.    │Topic  │Actions│
├──┼────────────┼─────────────────────────────────────┼────────┼─────────┼────────┼──────────┼───────┤
│☐ │Developer U │Nice work on the last release! Dash..│TT Chat │Analyzed │   -    │ Noise    │  -    │  ⋮  │
│☐ │System Bot  │Working on Product Design - team fe..│Seed    │Analyzed │   -    │ Noise    │Prod...│  ⋮  │
│☐ │Developer U │Memory usage is growing continuously.│TT Chat │Analyzed │   -    │ Noise    │  -    │  ⋮  │
└──┴────────────┴─────────────────────────────────────┴────────┴─────────┴────────┴──────────┴───────┘
```

**Issues:**
- 9 columns = too much horizontal scanning
- Content truncated ("Dash...") = cannot assess value
- Importance always "-" = wasted column
- Actions hidden in "⋮" menu = extra clicks

---

## After (Proposed Design)

### Desktop View (>1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Messages (225 total)                                            [🔄 Refresh] [+ Ingest]             │
│                                                                                                       │
│ [🔍 Search by content, author, or source...]        [Source ▼] [Status ▼] [View ▼]                 │
├───────────────────────────────────────────────────────────────┬───────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │ MESSAGE DETAILS                       │
│ │ [D] Developer User              07:36    Telegram       │   │                                       │
│ │ Nice work on the last release! Dashboard looks much...  │   │ From: Developer User                  │
│ │ Analyzed • Noise                            [Archive]   │◄──┤ Source: Task Tracker Team Chat        │
│ └─────────────────────────────────────────────────────────┘   │ Received: Nov 2, 07:36                │
│ ┌─────────────────────────────────────────────────────────┐   │                                       │
│ │ [S] System Bot                  05:20    Seed Source    │   │ Content:                              │
│ │ Working on Product Design - team feedback. Should...    │   │ Nice work on the last release!        │
│ │ Analyzed • Noise • Product Design           [Archive]   │   │ Dashboard looks much better now.      │
│ └─────────────────────────────────────────────────────────┘   │                                       │
│ ┌─────────────────────────────────────────────────────────┐   │ Classification:                       │
│ │ [D] Developer User              04:36    Telegram       │   │ 🔴 Noise                             │
│ │ Memory usage is growing continuously in the worker...   │   │ Confidence: 87%                       │
│ │ Analyzed • Noise                            [Archive]   │   │ ℹ️ Low urgency, positive sentiment   │
│ └─────────────────────────────────────────────────────────┘   │                                       │
│ ┌─────────────────────────────────────────────────────────┐   │ Actions:                              │
│ │ [D] Developer User              01:36    Telegram       │   │ [Reclassify ▼] [Archive] [Delete]    │
│ │ Bug report: Task priorities are not saving correctly    │   │                                       │
│ │ Pending • Noise                             [Archive]   │   └───────────────────────────────────────┘
│ └─────────────────────────────────────────────────────────┘
│ ┌─────────────────────────────────────────────────────────┐
│ │ [S] System Bot                  01:15    Seed Source    │
│ │ Heads up: Backend API might need attention. the new...  │
│ │ Pending • Noise • Backend API               [Archive]   │
│ └─────────────────────────────────────────────────────────┘
│
│ Page 1 of 9 • 25 per page
└───────────────────────────────────────────────────────────────┴───────────────────────────────────────┘
```

**Key Changes:**
1. **Reduced to 5 visual elements per row:**
   - Author avatar + name
   - Timestamp
   - Source icon
   - Message preview (2 lines, ~80 chars)
   - Status badges + Quick action button

2. **Side panel shows full details:**
   - Expands when row clicked
   - Shows complete message text
   - Reveals AI reasoning (confidence score)
   - Provides all actions in one place

3. **Removed columns:**
   - ☐ Checkbox (show only when "Select mode" enabled)
   - Importance (always "-" - remove until useful)
   - Classification (moved to badge inline)
   - Actions menu (replaced with inline button)

4. **Added value:**
   - "225 total" count visible
   - Classification confidence (87%) - AI transparency!
   - AI reasoning explanation ("Low urgency, positive sentiment")

---

### Mobile View (<768px)

```
┌─────────────────────────────────────┐
│ Messages                       [≡]  │
├─────────────────────────────────────┤
│ [🔍 Search messages...]             │
│ [Filters ▼]                         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [D] Developer User   Telegram   │ │
│ │ 07:36                           │ │
│ │                                 │ │
│ │ Nice work on the last release!  │ │
│ │ Dashboard looks much better...  │ │
│ │                                 │ │
│ │ Analyzed • Noise       [⋮]      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [S] System Bot      Seed Source │ │
│ │ 05:20                           │ │
│ │                                 │ │
│ │ Working on Product Design -     │ │
│ │ team feedback. Should have...   │ │
│ │                                 │ │
│ │ Analyzed • Noise • Product...   │ │
│ │                          [⋮]    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [D] Developer User   Telegram   │ │
│ │ 04:36                           │ │
│ │                                 │ │
│ │ Memory usage is growing         │ │
│ │ continuously in the worker...   │ │
│ │                                 │ │
│ │ Analyzed • Noise       [⋮]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Page 1 of 9 • 25 per page          │
└─────────────────────────────────────┘
```

**Mobile Optimizations:**
- Card-based layout (stacked)
- Source + Author in header row
- Message preview 2-3 lines
- Actions in overflow menu "⋮"
- Tap card → Full-screen detail view (not side panel)

---

## Design Rationale

### Problem: Cognitive Load
**Before:** 9 columns × 25 rows = 225 data points to process
**After:** 5 elements × 25 rows = 125 data points (-44% reduction!)

### Solution: Progressive Disclosure
- **L1 (Scan):** See author, time, message preview, status → 2 seconds
- **L2 (Explore):** Click row → see full message + classification → 5 seconds
- **L3 (Act):** Click action button → archive/reclassify → 1 second

### User Benefit: Faster Triage
**User Goal:** "Find messages that need my attention"

**Current Flow:**
1. Scan 9-column table (15 seconds)
2. Click "⋮" menu to see actions (2 seconds per row)
3. Guess which messages are important (no context)
**Total Time:** 20+ seconds per screen

**New Flow:**
1. Scan condensed list (5 seconds)
2. Click interesting row (instant side panel)
3. See AI confidence + reasoning (informed decision)
**Total Time:** 8 seconds per screen (-60% faster!)

---

## AI Transparency Improvements

### New Feature: Confidence Scores

```
Classification:
🔴 Noise
Confidence: 87%
ℹ️ Low urgency, positive sentiment
```

**Why This Matters:**
- Users can trust (or question) AI decisions
- 87% confidence → "Probably correct, but check"
- 99% confidence → "Definitely correct, auto-archive"
- 45% confidence → "AI is unsure, needs human review"

### New Feature: Reasoning Explanation
AI classifies as "Noise" because:
- Low urgency words: "Nice", "better"
- Positive sentiment (not a problem)
- No actionable request detected

**User Benefit:** Learn the AI's logic, improve over time.

---

## Technical Implementation Notes

### Frontend Changes Needed
1. **New component:** `MessageDetailPanel.tsx`
   - Props: `message: Message`, `onClose: () => void`
   - Show full content, metadata, AI reasoning
   - Tailwind responsive: `hidden md:block` (hide on mobile)

2. **Update table:** `MessagesTable.tsx`
   - Remove columns: Importance, Actions menu, Checkbox (default)
   - Add: Inline [Archive] button
   - On row click: `setSelectedMessage(message)`

3. **Mobile view:** `MessageCard.tsx`
   - Card component for <768px breakpoint
   - Tap card → Navigate to `/messages/:id` (full-screen detail)

4. **API change:** Add `/api/messages/:id/reasoning` endpoint
   - Return: `{ confidence: 0.87, reasoning: "Low urgency...", factors: [...] }`

### Backend Changes Needed
1. **Expose confidence scores** in `/api/messages` response
   - Currently classification is binary (Noise/Signal)
   - Add: `classification_confidence: float (0.0-1.0)`
   - Add: `classification_reasoning: string`

2. **Store reasoning in database**
   - New column: `messages.classification_reasoning TEXT`
   - Populated by LLM during analysis

---

## Success Metrics

**Before Redesign:**
- Avg time to triage 25 messages: ~20 seconds
- User-reported confusion: "Too much info, can't focus"
- Mobile usage: 0% (table unusable)

**After Redesign (Target):**
- Avg time to triage 25 messages: <10 seconds (-50%)
- User-reported clarity: "Easy to scan, clear next actions"
- Mobile usage: 30%+ (card view usable)

**Measurement:**
- Track click-through rate on message rows
- Measure time from page load → first action taken
- Survey: "How confident are you in AI classifications?" (1-5 scale)

---

## Alternative Designs Considered

### Option A: Accordion List
```
▶ Developer User - Nice work on the last release! Dashboard looks...
▶ System Bot - Working on Product Design - team feedback. Should...
```
**Pros:** Even more compact
**Cons:** Requires extra click to see status badges

### Option B: Kanban Board
```
┌─────────────┬─────────────┬─────────────┐
│ Pending     │ Analyzed    │ Archived    │
├─────────────┼─────────────┼─────────────┤
│ [Card 1]    │ [Card 4]    │ [Card 7]    │
│ [Card 2]    │ [Card 5]    │ [Card 8]    │
│ [Card 3]    │ [Card 6]    │             │
└─────────────┴─────────────┴─────────────┘
```
**Pros:** Visual workflow, drag-and-drop
**Cons:** Doesn't scale to 225 messages

**Decision:** Master-detail (Option 1) balances density + detail best.

---

## Next Steps

1. **Validate wireframe:** Show to 3 users, gather feedback
2. **Build prototype:** HTML/CSS clickable demo (no backend)
3. **Test prototype:** 5-minute usability test ("Find the bug report")
4. **Implement frontend:** React components + responsive breakpoints
5. **Ship backend API:** Add confidence scores + reasoning
6. **A/B test:** 50% users see new design, measure metrics
7. **Iterate:** Adjust based on data

**ETA:** 2 weeks (1 week design + 1 week implementation)

---

**Questions? Feedback?** Share with `react-frontend-architect` for technical feasibility review.
