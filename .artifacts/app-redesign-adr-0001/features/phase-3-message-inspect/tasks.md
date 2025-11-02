# Phase 3: Message Inspect Modal - Task Breakdown

**Duration:** 2 weeks
**Goal:** Build diagnostic modal for classification transparency
**Dependencies:** Phase 1 (Admin Panel infrastructure)
**Parallel Work:** Can run alongside Phase 2

---

## Task Organization

**Total Tasks:** 12
**Estimated Time:** 80 hours (2 weeks × 40 hours)

---

## Modal Structure Tasks (3 tasks, 18 hours)

### Task 3.1: Create `<MessageInspectModal>` Component

**Time:** 8h | **Agent:** react-frontend-architect | **Priority:** Critical

**Description:** Base modal with tabs (Classification, Atoms, History).

**Implementation:**
```tsx
// shadcn Dialog component
// Tab navigation: Classification | Atoms | History
// Header: message preview, timestamp, source
// Footer: Close button, Reassign topic button
// Keyboard: Escape to close, Arrow keys for tabs
```

**Acceptance:**
- [ ] Modal opens on message click (admin mode only)
- [ ] 3 tabs: Classification, Atoms, History
- [ ] Responsive (full screen mobile, 80% width desktop)
- [ ] Keyboard accessible (Tab navigation, Escape to close)
- [ ] Smooth open/close animation (300ms)

---

### Task 3.2: Tab Navigation Implementation

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Tab switching with keyboard support and URL persistence.

**Implementation:**
```tsx
// shadcn Tabs component
// Arrow keys switch tabs
// URL updates on tab change (/messages/123?tab=atoms)
// Default tab based on context (e.g., clicked from atoms view → atoms tab)
```

**Acceptance:**
- [ ] Tabs switch on click
- [ ] Left/Right arrow keys switch tabs
- [ ] Active tab highlighted
- [ ] URL reflects current tab (shareable link)

---

### Task 3.3: Close/Cancel Actions

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Handle modal close with unsaved changes confirmation.

**Implementation:**
```tsx
// Escape key closes modal
// Click outside modal closes (with confirmation if dirty)
// Close button in header
// Dirty state detection (unsaved reassignment)
```

**Acceptance:**
- [ ] Escape key closes modal
- [ ] Click outside closes (with confirmation if changes)
- [ ] Close button in header
- [ ] Confirmation modal if unsaved changes

---

## Classification Details Tasks (3 tasks, 18 hours)

### Task 3.4: Display LLM Confidence Scores

**Time:** 6h | **Agent:** llm-prompt-engineer + react-frontend-architect | **Priority:** High

**Description:** Visualize classification confidence (0-100%).

**Implementation:**
```tsx
// Progress bar showing confidence (0-100%)
// Color coding: red (0-40), yellow (41-70), green (71-100)
// Breakdown by classification type:
//   - Topic relevance: 85%
//   - Noise score: 12%
//   - Urgency: 67%
```

**Acceptance:**
- [ ] Shows overall confidence score (0-100%)
- [ ] Color-coded progress bar
- [ ] Breakdown by classification dimensions
- [ ] Tooltip explains what each score means

---

### Task 3.5: Display Decision Rationale

**Time:** 6h | **Agent:** llm-prompt-engineer | **Priority:** High

**Description:** Show LLM reasoning for classification decision.

**Implementation:**
```tsx
// Expandable section with LLM reasoning text
// Structured output:
//   - "Why this topic?" → explanation
//   - "Why not noise?" → explanation
//   - "Key indicators:" → bullet list
```

**Acceptance:**
- [ ] Reasoning text displayed clearly
- [ ] Structured sections (why topic, why not noise, indicators)
- [ ] Expandable/collapsible (default: expanded)
- [ ] Copyable (copy button for debugging)

---

### Task 3.6: Visualize Confidence with Color-Coded Bars

**Time:** 6h | **Agent:** ux-ui-design-expert | **Priority:** Medium

**Description:** Design clear confidence visualization.

**Implementation:**
```tsx
// Horizontal progress bars (shadcn Progress component)
// Red (0-40): "Low confidence"
// Yellow (41-70): "Medium confidence"
// Green (71-100): "High confidence"
// Threshold lines at 40 and 70
```

**Acceptance:**
- [ ] Progress bar uses appropriate color
- [ ] Threshold lines visible
- [ ] Label shows percentage + confidence level
- [ ] Accessible (screen reader announces confidence)

---

## Atom Extraction Tasks (3 tasks, 18 hours)

### Task 3.7: Display Extracted Entities

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Show all entities extracted from message.

**Implementation:**
```tsx
// List of entities grouped by type:
//   - People: ["John Doe", "Jane Smith"]
//   - Places: ["San Francisco", "Office"]
//   - Organizations: ["Acme Corp"]
//   - Concepts: ["API design", "React hooks"]
// Each entity clickable → search for similar
```

**Acceptance:**
- [ ] Entities grouped by type (people, places, organizations, concepts)
- [ ] Each entity displayed as badge
- [ ] Click entity → search for similar messages
- [ ] Empty state if no entities extracted

---

### Task 3.8: Display Keywords with Relevance Scores

**Time:** 6h | **Agent:** llm-prompt-engineer + react-frontend-architect | **Priority:** Medium

**Description:** Show extracted keywords with relevance scores.

**Implementation:**
```tsx
// List of keywords sorted by relevance (0-100)
// Visual: larger font size for higher relevance
// Hover: show relevance score percentage
// Click: search for messages with same keyword
```

**Acceptance:**
- [ ] Keywords sorted by relevance (highest first)
- [ ] Font size varies by relevance (visual hierarchy)
- [ ] Hover shows exact relevance score
- [ ] Click keyword → search messages

---

### Task 3.9: Display Embeddings Visualization

**Time:** 6h | **Agent:** react-frontend-architect + vector-database-expert | **Priority:** Low

**Description:** Visualize embedding vector and semantic similarity.

**Implementation:**
```tsx
// 2D projection of 1536-dimensional vector (PCA or t-SNE)
// Show similar messages as nearby points
// Hover point → preview message
// Click point → open message in new modal
```

**Acceptance:**
- [ ] 2D scatter plot shows message position
- [ ] Nearby points represent similar messages (top 10)
- [ ] Hover shows message preview
- [ ] Click opens message in new modal
- [ ] Note: This is advanced, may be Phase 2 feature

---

## Bulk Edit Tasks (3 tasks, 26 hours)

### Task 3.10: Add Reassign Topic Dropdown

**Time:** 8h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Dropdown to reassign message to different topic.

**Implementation:**
```tsx
// shadcn Select component
// List all topics (searchable if > 20 topics)
// Shows current topic with "(Current)" label
// Confirmation before reassigning
```

**Acceptance:**
- [ ] Dropdown lists all topics
- [ ] Current topic marked "(Current)"
- [ ] Search filter if > 20 topics
- [ ] Confirmation modal before reassign

---

### Task 3.11: Add Approve/Reject Actions

**Time:** 8h | **Agent:** react-frontend-architect + fastapi-backend-expert | **Priority:** Medium

**Description:** Quick approve/reject buttons for classification.

**Implementation:**
```tsx
// Approve button (green checkmark)
// Reject button (red X)
// Reject → show reason dropdown (wrong topic, noise, duplicate)
// Backend: update message status, retrain model with feedback
```

**Acceptance:**
- [ ] Approve button marks message as correct classification
- [ ] Reject button requires reason selection
- [ ] Backend logs feedback for model retraining
- [ ] Success toast notification

---

### Task 3.12: Save Changes API Call

**Time:** 10h | **Agent:** fastapi-backend-expert | **Priority:** High

**Description:** Backend endpoint for saving modal changes.

**Implementation:**
```python
# PUT /api/admin/messages/{id}
# Body: {
#   "topic_id": 5,  # reassign
#   "status": "approved",  # or "rejected"
#   "rejection_reason": "wrong_topic"
# }
# Response: updated message + affected atoms/topics
```

**Acceptance:**
- [ ] Endpoint updates message topic
- [ ] Updates message status (approved/rejected)
- [ ] Logs admin action for audit trail
- [ ] Returns updated message + cascade effects
- [ ] WebSocket broadcasts update to other users

---

## Phase 3 Summary

**Total Tasks:** 12 (Modal: 3, Classification: 3, Atoms: 3, Bulk Edit: 3)
**Total Time:** 80 hours

**Critical Path:**
1. Task 3.1 (Modal structure) → Blocks all other tasks
2. Task 3.2 (Tabs) → Blocks tab-specific tasks
3. Task 3.12 (Save API) → Blocks bulk edit testing

**Parallel Opportunities:**
- Classification tasks (3.4-3.6) parallel to Atom tasks (3.7-3.9)
- Bulk Edit tasks (3.10-3.12) can start after modal structure (3.1) complete
- Entire Phase 3 can run parallel to Phase 2 (different features)

**Dependencies:**
- Phase 1 (Admin Panel infrastructure)
- Can run parallel to Phase 2

**Phase Completion Criteria:**
- [ ] All 12 tasks complete
- [ ] Click message → modal opens with classification details
- [ ] LLM reasoning visible with confidence scores
- [ ] Can reassign message to different topic
- [ ] Classification history timeline works

---

**Next:** Phase 4 (Topics Enhancement) - depends on Phase 2 + 3 completion
