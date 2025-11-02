# Phase 5: Analysis Runs + Proposals - Task Breakdown

**Duration:** 1.5 weeks
**Goal:** Refactor Analysis Runs and Proposals into Topics admin context
**Dependencies:** Phase 2 (Admin Panel components)
**Parallel Work:** Can run alongside Phase 4

---

## Task Organization

**Total Tasks:** 11
**Estimated Time:** 60 hours (1.5 weeks × 40 hours)

---

## Analysis Runs Refactor Tasks (4 tasks, 22 hours)

### Task 5.1: Create "Admin" Tab in Topics Page

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Critical

**Description:** Add admin tab to Topics page for analysis runs and proposals.

**Implementation:**
```tsx
// Topics page tabs: Overview | Atoms | Admin (admin-only)
// Admin tab shows:
//   - Analysis Runs section (list + trigger button)
//   - Proposals section (inline cards, see Task 5.5)
// Tab badge shows pending count (e.g., "Admin (5)")
```

**Acceptance:**
- [ ] Admin tab visible only when `isAdminMode=true`
- [ ] Tab badge shows pending analysis run count
- [ ] Tab content divided into Analysis Runs + Proposals sections
- [ ] Smooth tab switching (no layout shift)

---

### Task 5.2: Move Analysis Runs List to Admin Tab

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Migrate analysis runs from standalone page to Topics admin tab.

**Implementation:**
```tsx
// List of analysis runs with:
//   - Status (running, completed, failed)
//   - Timestamp (started, completed)
//   - Topic filter (show runs for current topic only)
//   - Progress bar for running tasks
// Click run → expand details (topics/atoms created)
```

**Acceptance:**
- [ ] Analysis runs list shows in admin tab
- [ ] Runs filtered by current topic (not global list)
- [ ] Status clearly indicated (icon + color)
- [ ] Progress bar for running tasks
- [ ] Click to expand run details

---

### Task 5.3: Add Trigger Analysis Run Button

**Time:** 6h | **Agent:** react-frontend-architect + fastapi-backend-expert | **Priority:** High

**Description:** Button to trigger new analysis run (admin-only).

**Implementation:**
```python
# POST /api/admin/analysis/trigger
# Body: { "topic_id": 5, "scope": "topic" }
# Response: { "run_id": 123, "status": "running" }

# Frontend: button shows loading spinner, disables during run
# Polling or WebSocket to track progress
```

**Acceptance:**
- [ ] Button labeled "Trigger Analysis Run"
- [ ] Confirmation modal ("This will analyze all messages in this topic")
- [ ] Loading state while running (button disabled)
- [ ] Success toast when run completes
- [ ] Error handling if run fails

---

### Task 5.4: Display Analysis Run Status

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Show status and progress of analysis runs.

**Implementation:**
```tsx
// Status badge with icon:
//   - Running: spinner icon, blue badge, progress bar
//   - Completed: checkmark icon, green badge
//   - Failed: X icon, red badge, error message
// Progress: "Processing message 45/200 (22%)"
```

**Acceptance:**
- [ ] Status badge matches run state
- [ ] Progress bar updates in real-time (WebSocket)
- [ ] Completed runs show summary (topics created, atoms created)
- [ ] Failed runs show error message

---

## Proposals Refactor Tasks (4 tasks, 20 hours)

### Task 5.5: Create Proposal Inline Cards

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Display proposals as inline cards within Topics (not separate page).

**Implementation:**
```tsx
// Card layout:
//   - Proposal type (new topic, merge, split)
//   - LLM suggestion (short summary)
//   - Confidence score (0-100%)
//   - Actions: Approve, Reject, View Details
// Appears in Admin tab of Topics page
// Sorted by confidence (highest first)
```

**Acceptance:**
- [ ] Proposals appear as cards in Admin tab
- [ ] Sorted by confidence (highest first)
- [ ] Card shows type, summary, confidence
- [ ] Actions: Approve, Reject, View Details

---

### Task 5.6: Display LLM Reasoning for Proposals

**Time:** 4h | **Agent:** llm-prompt-engineer | **Priority:** High

**Description:** Show LLM reasoning explaining why proposal was made.

**Implementation:**
```tsx
// Expandable section in proposal card:
//   - "Why this suggestion?" → LLM reasoning text
//   - "Supporting evidence:" → messages that support proposal
//   - "Confidence breakdown:" → scores by factor
```

**Acceptance:**
- [ ] Reasoning text clearly explains suggestion
- [ ] Supporting evidence shows relevant messages
- [ ] Confidence breakdown shows scoring factors
- [ ] Expandable/collapsible (default: collapsed)

---

### Task 5.7: Add Approve/Reject Actions per Proposal

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Individual approve/reject buttons for each proposal.

**Implementation:**
```tsx
// Approve button: green checkmark, no confirmation
// Reject button: red X, optional reason dropdown
// Actions:
//   - Approve → apply proposal (create topic, merge, etc.)
//   - Reject → hide proposal, log rejection reason
```

**Acceptance:**
- [ ] Approve button applies proposal immediately
- [ ] Reject button hides proposal (with undo option)
- [ ] Success toast after approve/reject
- [ ] Proposal disappears from list after action

---

### Task 5.8: Integrate Bulk Approve/Reject

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Use Phase 2 bulk actions for proposals.

**Implementation:**
```tsx
// Import <BulkActionsToolbar> from Phase 2
// Add checkbox to each proposal card
// Toolbar appears when proposals selected
// Actions: Approve All, Reject All
```

**Acceptance:**
- [ ] Checkboxes appear on proposal cards (admin mode)
- [ ] Toolbar shows when proposals selected
- [ ] Bulk approve applies all selected proposals
- [ ] Bulk reject hides all selected proposals
- [ ] Confirmation modal before bulk actions

---

## LLM Transparency Tasks (3 tasks, 18 hours)

### Task 5.9: Display Confidence Scores for Proposals

**Time:** 6h | **Agent:** llm-prompt-engineer + ux-ui-design-expert | **Priority:** High

**Description:** Show confidence score (0-100%) for each proposal.

**Implementation:**
```tsx
// Confidence badge in proposal card header
// Color: red (0-40), yellow (41-70), green (71-100)
// Tooltip: "85% confidence - High reliability"
// Sort proposals by confidence (highest first by default)
```

**Acceptance:**
- [ ] Confidence score visible on all proposals
- [ ] Color matches score range
- [ ] Tooltip explains confidence level
- [ ] Proposals sorted by confidence by default

---

### Task 5.10: Display Reasoning Text

**Time:** 6h | **Agent:** llm-prompt-engineer | **Priority:** Medium

**Description:** Show LLM reasoning for proposal (see Task 5.6).

**Implementation:**
```tsx
// Expandable "View Reasoning" section
// Structured format:
//   - Decision summary (1 sentence)
//   - Supporting factors (bullet list)
//   - Confidence breakdown (per factor)
```

**Acceptance:**
- [ ] Reasoning clearly explains suggestion
- [ ] Structured format (summary, factors, breakdown)
- [ ] Copyable (for debugging/reporting)
- [ ] Expandable/collapsible

---

### Task 5.11: Add Expandable Details

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Low

**Description:** Full LLM output available in expandable section.

**Implementation:**
```tsx
// "View Full Output" button in proposal card
// Opens accordion with:
//   - Raw LLM response (JSON or text)
//   - Prompt used (for debugging)
//   - Timestamp and model version
// Admin-only feature (for debugging)
```

**Acceptance:**
- [ ] "View Full Output" button in proposal card
- [ ] Shows raw LLM response + prompt
- [ ] Copyable (JSON formatted)
- [ ] Admin-only (hidden in consumer mode)

---

## Phase 5 Summary

**Total Tasks:** 11 (Analysis: 4, Proposals: 4, Transparency: 3)
**Total Time:** 60 hours (1.5 weeks)

**Critical Path:**
1. Task 5.1 (Admin tab) → Blocks all other tasks
2. Task 5.5 (Proposal cards) → Blocks Task 5.6-5.8 (proposal features)
3. Task 5.8 (Bulk actions) → Depends on Phase 2 completion

**Parallel Opportunities:**
- Analysis tasks (5.1-5.4) parallel to Proposals tasks (5.5-5.8)
- Transparency tasks (5.9-5.11) can start after Task 5.5 (cards)
- Entire Phase 5 can run parallel to Phase 4 (different features)

**Dependencies:**
- Phase 2 (needs <BulkActionsToolbar> for Task 5.8)
- Can run parallel to Phase 4

**Phase Completion Criteria:**
- [ ] All 11 tasks complete
- [ ] Topics page has Admin tab with analysis runs
- [ ] Proposals appear as inline cards (not separate page)
- [ ] Can trigger new analysis run from Topics page
- [ ] Bulk approve/reject proposals works

---

**Next:** Phase 6 (Export + API) - depends on Phase 4 + 5 completion
