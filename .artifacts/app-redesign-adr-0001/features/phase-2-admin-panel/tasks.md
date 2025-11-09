# Phase 2: Admin Panel Components - Task Breakdown

**Duration:** 2 weeks
**Goal:** Build reusable admin components (bulk actions, metrics, prompt tuning)
**Dependencies:** Phase 1 (Admin Panel infrastructure)

---

## Task Organization

**Total Tasks:** 15
**Estimated Time:** 80 hours (2 weeks × 40 hours)

**Parallel Work:** None (sequential within phase, but entire phase can run parallel to Phase 3)

---

## Bulk Actions Tasks (5 tasks, 24 hours)

### Task 2.1: Create `<BulkActionsToolbar>` Component

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Critical

**Description:** Build toolbar with multi-select checkbox pattern and action buttons.

**Implementation:**
```tsx
// Toolbar with "Select All", checkboxes, bulk action buttons (Approve, Archive, Delete)
// Shows count of selected items
// Disabled state when no items selected
```

**Acceptance:**
- [ ] Toolbar shows selected count (e.g., "5 selected")
- [ ] "Select All" checkbox selects all visible items
- [ ] Action buttons disabled when selection empty
- [ ] Clear selection button available

---

### Task 2.2: Multi-Select Checkbox Pattern

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Implement checkbox UI for bulk selection in lists/grids.

**Implementation:**
```tsx
// Checkbox appears on hover (or always visible in admin mode)
// Shift+Click to select range
// Checkbox state: unchecked, checked, indeterminate (partial selection)
```

**Acceptance:**
- [ ] Checkbox appears for each item in list/grid
- [ ] Shift+Click selects range between last selected and current
- [ ] Visual feedback on selected items (background highlight)
- [ ] Keyboard accessible (Space to toggle checkbox)

---

### Task 2.3: Bulk Approve API Endpoint

**Time:** 4h | **Agent:** fastapi-backend-expert | **Priority:** High

**Description:** Backend endpoint for approving multiple topics/atoms at once.

**Implementation:**
```python
# POST /api/admin/bulk/approve
# Body: { "entity_type": "topic", "ids": [1, 2, 3] }
# Response: { "success": 5, "failed": 0, "errors": [] }
```

**Acceptance:**
- [ ] Endpoint accepts array of IDs
- [ ] Approves all in single transaction (rollback on error)
- [ ] Returns success/failure count
- [ ] Rate limited (max 100 items per request)

---

### Task 2.4: Bulk Archive API Endpoint

**Time:** 4h | **Agent:** fastapi-backend-expert | **Priority:** Medium

**Acceptance:** Same as Task 2.3 but for archiving

---

### Task 2.5: Bulk Delete API Endpoint

**Time:** 6h | **Agent:** fastapi-backend-expert | **Priority:** Medium

**Description:** Delete endpoint with confirmation and cascade logic.

**Acceptance:**
- [ ] Soft delete (mark as deleted, not hard delete)
- [ ] Cascade rules (delete topic → archive atoms?)
- [ ] Confirmation required (cannot undo easily)
- [ ] Audit log entry created for each deletion

---

## Metrics Dashboard Tasks (5 tasks, 26 hours)

### Task 2.6: Create `<MetricsDashboard>` Component

**Time:** 8h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Dashboard showing key metrics (quality scores, noise stats).

**Implementation:**
```tsx
// Grid layout with metric cards
// Each card: metric name, current value, trend (up/down), threshold indicator
// Responsive (1 column mobile, 2-3 columns desktop)
```

**Acceptance:**
- [ ] Shows 4 key metrics: Topic Quality Score, Noise Ratio, Classification Accuracy, Active Analysis Runs
- [ ] Metric cards use shadcn Card component
- [ ] Trend indicators (↑↓ with color coding)
- [ ] Refreshes every 30 seconds (or real-time via WebSocket)

---

### Task 2.7: Topic Quality Score Display

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Show quality score (0-100) for each topic with color coding.

**Implementation:**
```tsx
// Score badge: red (0-40), yellow (41-70), green (71-100)
// Tooltip explains what score means
// Admin-only (hidden in consumer mode)
```

**Acceptance:**
- [ ] Quality score appears on topic cards (admin mode only)
- [ ] Color coding: red/yellow/green based on thresholds
- [ ] Tooltip shows score calculation factors
- [ ] Updates in real-time when topic changes

---

### Task 2.8: Noise Stats Display

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Show filtered message count and noise ratio.

**Implementation:**
```tsx
// Metric card showing:
// - Total messages received
// - Filtered as noise (count + percentage)
// - Chart showing trend over last 7 days
```

**Acceptance:**
- [ ] Shows total messages vs noise count
- [ ] Calculates noise ratio percentage
- [ ] Mini chart shows 7-day trend
- [ ] Click to see detailed noise analysis page

---

### Task 2.9: WebSocket Real-Time Updates

**Time:** 6h | **Agent:** fastapi-backend-expert + react-frontend-architect | **Priority:** High

**Description:** Push metric updates to dashboard via WebSocket.

**Implementation:**
```python
# Backend: Emit events on metric changes
# Frontend: Subscribe to "metrics:update" channel
# Update dashboard without page refresh
```

**Acceptance:**
- [ ] WebSocket connection established on dashboard mount
- [ ] Metrics update within 2 seconds of backend change
- [ ] Graceful reconnection on disconnect
- [ ] No memory leaks (cleanup on unmount)

---

### Task 2.10: Metric Threshold Indicators

**Time:** 4h | **Agent:** ux-ui-design-expert | **Priority:** Low

**Description:** Visual indicators when metrics exceed thresholds.

**Implementation:**
```tsx
// Red badge when metric is critical (e.g., quality score < 40)
// Pulsing animation to draw attention
// Dismissible notification explaining issue
```

**Acceptance:**
- [ ] Red indicator appears when threshold exceeded
- [ ] Notification explains what's wrong and how to fix
- [ ] Dismissible (but re-appears if still critical)
- [ ] Admin-only feature

---

## Prompt Tuning Tasks (3 tasks, 18 hours)

### Task 2.11: Create `<PromptTuningInterface>` Component

**Time:** 8h | **Agent:** react-frontend-architect + llm-prompt-engineer | **Priority:** Medium

**Description:** Editor for LLM prompts with validation and preview.

**Implementation:**
```tsx
// Textarea with syntax highlighting
// Character count (show limits: min 50, max 2000 chars)
// Preview button (test prompt with sample message)
// Save/Cancel actions
```

**Acceptance:**
- [ ] Textarea supports multi-line editing
- [ ] Character count displayed (current/max)
- [ ] Validation: min 50 chars, max 2000 chars
- [ ] Save button disabled if invalid
- [ ] Cancel button reverts changes

---

### Task 2.12: Prompt Validation

**Time:** 4h | **Agent:** llm-prompt-engineer | **Priority:** High

**Description:** Validate prompt syntax and structure before saving.

**Implementation:**
```python
# Backend validation:
# - Check for required placeholders (e.g., {message})
# - Validate JSON structure if structured output prompt
# - Check character limits
# - Return validation errors to frontend
```

**Acceptance:**
- [ ] Validates required placeholders present
- [ ] Checks character limits (50-2000)
- [ ] Returns clear error messages
- [ ] Frontend displays validation errors inline

---

### Task 2.13: Save/Cancel Actions with Confirmation

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Prompt save flow with confirmation and rollback.

**Implementation:**
```tsx
// Save button → Confirmation modal ("This will affect all new messages")
// Cancel button → Revert to last saved version
// Dirty state indicator (show unsaved changes badge)
```

**Acceptance:**
- [ ] Confirmation modal on save (warn about impact)
- [ ] Cancel reverts to last saved state
- [ ] Unsaved changes badge when prompt modified
- [ ] Prevent navigation away if unsaved (confirmation dialog)

---

## Admin Badge Tasks (2 tasks, 12 hours)

### Task 2.14: Create `<AdminBadge>` Component

**Time:** 6h | **Agent:** ux-ui-design-expert | **Priority:** Low

**Description:** Reusable badge component for marking admin-only features.

**Implementation:**
```tsx
// Small amber badge with "Admin Only" text
// Icon: Shield or Lock
// Tooltip explaining feature is admin-only
// Variants: inline, floating
```

**Acceptance:**
- [ ] Badge uses amber color (consistent with Admin Panel)
- [ ] Shows "Admin Only" text + icon
- [ ] Tooltip on hover
- [ ] Variants: inline (next to label), floating (top-right corner)

---

### Task 2.15: Apply Admin Badges Throughout App

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Low

**Description:** Add badges to all admin-only features for clarity.

**Implementation:**
```tsx
// Apply to:
// - Bulk Actions toolbar
// - Metrics dashboard
// - Prompt Tuning interface
// - Admin-only settings sections
// - Message Inspect modal (admin tabs)
```

**Acceptance:**
- [ ] Badges appear on all admin-only components
- [ ] Badges only visible when `isAdminMode=true`
- [ ] Consistent placement (top-right corner or inline)
- [ ] Screen reader announces "Admin only feature"

---

## Phase 2 Summary

**Total Tasks:** 15 (Bulk: 5, Metrics: 5, Prompts: 3, Badges: 2)
**Total Time:** 80 hours

**Critical Path:**
1. Task 2.1 (BulkActionsToolbar) → Blocks Task 2.2
2. Task 2.3-2.5 (Backend APIs) → Blocks bulk operation testing
3. Task 2.6 (MetricsDashboard) → Blocks metrics tasks
4. Task 2.9 (WebSocket) → Blocks real-time updates

**Parallel Opportunities:**
- Bulk Actions (2.1-2.5) parallel to Metrics Dashboard (2.6-2.10)
- Prompt Tuning (2.11-2.13) parallel to Admin Badges (2.14-2.15)

**Dependencies:**
- Phase 1 must be complete (Admin Panel infrastructure needed)

**Phase Completion Criteria:**
- [ ] All 15 tasks complete
- [ ] Can bulk select 10 topics → approve in single API call
- [ ] Metrics dashboard shows real-time updates
- [ ] Prompt tuning saves and validates correctly

---

**Next:** Phase 3 (Message Inspect Modal) - can run parallel to Phase 2
