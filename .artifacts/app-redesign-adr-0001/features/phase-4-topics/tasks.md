# Phase 4: Topics Enhancement - Task Breakdown

**Duration:** 1.5 weeks
**Goal:** Enhance Topics with Consumer UI + Admin features
**Dependencies:** Phase 2 (Admin Panel components)
**Parallel Work:** Can run alongside Phase 5

---

## Task Organization

**Total Tasks:** 13
**Estimated Time:** 60 hours (1.5 weeks × 40 hours)

---

## Consumer View Tasks (4 tasks, 20 hours)

### Task 4.1: Create Grid View Layout

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Critical

**Description:** Responsive grid layout for topic cards (1-4 columns).

**Implementation:**
```tsx
// CSS Grid with responsive breakpoints:
// - Mobile (< 640px): 1 column
// - Tablet (640-1024px): 2 columns
// - Desktop (1024-1536px): 3 columns
// - Wide (> 1536px): 4 columns
// Gap: 1rem (16px)
```

**Acceptance:**
- [ ] Grid responds to screen size (1-4 columns)
- [ ] Cards have equal height in each row
- [ ] Gap spacing consistent (16px)
- [ ] Smooth transition on resize

---

### Task 4.2: Create List View Layout

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Table layout with sortable columns.

**Implementation:**
```tsx
// shadcn Table component
// Columns: Name | Atom Count | Last Updated | Quality Score (admin) | Actions
// Sortable: click column header to sort
// Row hover: highlight background
// Click row → navigate to topic detail
```

**Acceptance:**
- [ ] Table shows all topics
- [ ] Columns sortable (click header)
- [ ] Row hover effect
- [ ] Quality Score column only visible in admin mode
- [ ] Mobile: horizontal scroll for table

---

### Task 4.3: Grid/List Toggle Component

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Toggle button to switch between grid and list views.

**Implementation:**
```tsx
// Toggle button with icons (grid icon | list icon)
// Active view highlighted
// Keyboard: G for grid, L for list
// Position: top-right of topics page header
```

**Acceptance:**
- [ ] Toggle switches between grid/list views
- [ ] Active view visually highlighted
- [ ] Keyboard shortcuts (G/L) work
- [ ] Icon changes to reflect current view

---

### Task 4.4: Persist View Preference

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** Low

**Description:** Save user's preferred view (grid/list) to localStorage.

**Implementation:**
```tsx
// Hook: useViewPreference('topics', 'grid')
// Persists to localStorage: 'topics_view_preference'
// Restores on page load
// Phase 2: sync to backend user preferences
```

**Acceptance:**
- [ ] View preference persists across page refreshes
- [ ] Defaults to grid view if no preference stored
- [ ] No flicker on page load (immediate restore)

---

## Admin View Tasks (3 tasks, 14 hours)

### Task 4.5: Add Quality Score Display

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Show topic quality score (0-100) with color coding.

**Implementation:**
```tsx
// Badge in top-right corner of topic card (admin mode only)
// Color: red (0-40), yellow (41-70), green (71-100)
// Tooltip: "Quality Score: 85/100 - High quality topic"
// Click to see quality breakdown
```

**Acceptance:**
- [ ] Quality score badge visible only in admin mode
- [ ] Color matches score range
- [ ] Tooltip shows score + quality level
- [ ] Click opens quality details modal

---

### Task 4.6: Integrate Bulk Operations

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** High

**Description:** Add bulk select and actions from Phase 2 components.

**Implementation:**
```tsx
// Import <BulkActionsToolbar> from Phase 2
// Add checkbox to each topic card/row
// Toolbar appears when items selected
// Actions: Approve, Archive, Delete, Merge
```

**Acceptance:**
- [ ] Checkboxes appear on topic cards (admin mode)
- [ ] Toolbar shows when items selected
- [ ] "Select All" works in both grid and list views
- [ ] Bulk actions work (approve, archive, delete)

---

### Task 4.7: Admin-Only Actions (Merge, Delete)

**Time:** 4h | **Agent:** fastapi-backend-expert + react-frontend-architect | **Priority:** Medium

**Description:** Add merge and delete actions for topics.

**Implementation:**
```python
# POST /api/admin/topics/merge
# Body: { "source_ids": [1, 2, 3], "target_id": 4 }
# Result: merge topics 1,2,3 into topic 4, redirect atoms

# DELETE /api/admin/topics/{id}
# Soft delete topic, cascade to atoms (archive them)
```

**Acceptance:**
- [ ] Merge: combines multiple topics into one
- [ ] Merge: redirects all atoms to target topic
- [ ] Delete: soft deletes topic (recoverable)
- [ ] Delete: cascades to atoms (archives them)
- [ ] Confirmation modal before destructive actions

---

## Topic Relationships Tasks (3 tasks, 14 hours)

### Task 4.8: Create Graph Visualization Component

**Time:** 6h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Interactive graph showing topic semantic connections.

**Implementation:**
```tsx
// Library: react-force-graph or vis.js
// Nodes: topics (size = atom count)
// Edges: semantic similarity (thickness = strength)
// Interactions: hover to highlight, click to navigate
// Zoom/pan controls
```

**Acceptance:**
- [ ] Graph renders all topics as nodes
- [ ] Edges show semantic connections
- [ ] Node size reflects atom count
- [ ] Edge thickness reflects similarity strength
- [ ] Hover shows topic preview
- [ ] Click navigates to topic detail

---

### Task 4.9: Display Semantic Connections

**Time:** 4h | **Agent:** vector-database-expert + react-frontend-architect | **Priority:** Medium

**Description:** Calculate and display semantic similarity between topics.

**Implementation:**
```python
# Backend: compute cosine similarity between topic embeddings
# Return top 10 most similar topics per topic
# Similarity score: 0-100 (0 = unrelated, 100 = identical)
```

**Acceptance:**
- [ ] Backend returns top 10 similar topics
- [ ] Frontend displays as edges in graph
- [ ] Similarity score visible on hover
- [ ] Only show connections > 50 similarity (reduce clutter)

---

### Task 4.10: Zoom/Pan/Filter Controls

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** Low

**Description:** Add controls for graph navigation and filtering.

**Implementation:**
```tsx
// Controls:
// - Zoom in/out buttons (+ -)
// - Reset view button (fit all nodes)
// - Filter by minimum similarity (slider 0-100)
// - Search to highlight specific topic
```

**Acceptance:**
- [ ] Zoom controls work smoothly
- [ ] Reset button fits all nodes in view
- [ ] Filter slider hides weak connections
- [ ] Search highlights matching topic node

---

## Export Tasks (3 tasks, 12 hours)

### Task 4.11: Add Export Single Topic Button

**Time:** 4h | **Agent:** react-frontend-architect | **Priority:** Medium

**Description:** Button to export single topic (Markdown or JSON).

**Implementation:**
```tsx
// Export button in topic detail page header
// Dropdown: Markdown | JSON
// Downloads file immediately
// Filename: {topic_name}_{timestamp}.{md|json}
```

**Acceptance:**
- [ ] Export button visible in topic detail
- [ ] Dropdown allows format selection
- [ ] Download starts immediately
- [ ] Filename follows convention

---

### Task 4.12: Generate Markdown Format Export

**Time:** 4h | **Agent:** fastapi-backend-expert | **Priority:** High

**Description:** Backend generates Markdown export for topic.

**Implementation:**
```python
# GET /api/topics/{id}/export?format=markdown
# Response: Markdown file with:
# - Topic name and description
# - All atoms (with messages nested)
# - Semantic relationships (links to related topics)
```

**Acceptance:**
- [ ] Markdown includes topic metadata
- [ ] All atoms included with messages
- [ ] Related topics linked (clickable if viewing in app)
- [ ] Valid Markdown syntax (parseable)

---

### Task 4.13: Generate JSON Format Export

**Time:** 4h | **Agent:** fastapi-backend-expert | **Priority:** Medium

**Description:** Backend generates JSON export for topic.

**Implementation:**
```python
# GET /api/topics/{id}/export?format=json
# Response: JSON with full topic data structure
# Schema: { id, name, description, atoms[], relationships[] }
```

**Acceptance:**
- [ ] JSON includes all topic data
- [ ] Nested structure (topic → atoms → messages)
- [ ] Relationships included (topic IDs + similarity scores)
- [ ] Valid JSON (parseable)

---

## Phase 4 Summary

**Total Tasks:** 13 (Consumer View: 4, Admin View: 3, Graph: 3, Export: 3)
**Total Time:** 60 hours (1.5 weeks)

**Critical Path:**
1. Task 4.1-4.2 (Grid/List views) → Blocks Task 4.3 (Toggle)
2. Task 4.8 (Graph component) → Blocks Task 4.9-4.10 (Graph features)
3. Task 4.12-4.13 (Export APIs) → Blocks Task 4.11 (Export button)

**Parallel Opportunities:**
- Consumer View (4.1-4.4) parallel to Admin View (4.5-4.7)
- Graph tasks (4.8-4.10) parallel to Export tasks (4.11-4.13)
- Entire Phase 4 can run parallel to Phase 5 (different features)

**Dependencies:**
- Phase 2 (needs <BulkActionsToolbar> for Task 4.6)
- Can run parallel to Phase 5

**Phase Completion Criteria:**
- [ ] All 13 tasks complete
- [ ] Grid/list toggle persists preference
- [ ] Admin view shows quality scores
- [ ] Graph visualizes topic relationships
- [ ] Export single topic as Markdown/JSON works

---

**Next:** Phase 5 (Analysis Runs + Proposals) - can run parallel to Phase 4
