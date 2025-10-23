# Frontend Proposals Workflow Investigation Report

**Feature:** Task Proposals Workflow Frontend
**Session:** 20251023_202919
**Agent:** React Frontend Architect
**Completed:** 2025-10-23 20:29:19

---

## Executive Summary

Цей звіт містить детальний аналіз frontend implementation системи task proposals у проекті Task Tracker. Система дозволяє користувачам переглядати, фільтрувати, схвалювати та відхиляти AI-generated task proposals, які створюються Analysis Runs.

**Поточний стан:** ✅ Система повністю функціональна з базовим UI та real-time WebSocket updates

**Архітектура:** Feature-based architecture з використанням React 18, TypeScript, TanStack Query, та WebSocket для real-time оновлень

**Scope обмеження:** Наразі реалізовані **тільки Task Proposals**. Topic/Atom proposals не виявлено у frontend.

### Ключові знахідки

**Implemented:**
- ✅ Task Proposals CRUD operations через API
- ✅ Real-time WebSocket updates для proposals
- ✅ Review workflow (Approve/Reject з обов'язковим reason)
- ✅ Advanced filtering (status, confidence levels, search)
- ✅ Card-based UI з expandable reasoning/sources
- ✅ Sidebar notification badges для pending proposals
- ✅ Integration з Analysis Runs page

**Missing:**
- ❌ Bulk operations (approve/reject multiple proposals)
- ❌ Edit proposal functionality (onEdit callback defined but not implemented)
- ❌ Merge proposals workflow (API exists, UI missing)
- ❌ Topic/Atom proposals (не знайдено у frontend)
- ❌ Proposal detail page (всі деталі в card)
- ❌ Proposal history/audit trail
- ❌ Export/Import proposals

---

## System Architecture

### High-Level Data Flow

```
User Interaction
       ↓
ProposalsPage (Container)
       ↓
TanStack Query (Data Layer)
       ↓
ProposalService (API Client)
       ↓
Backend API (/api/v1/analysis/proposals)
       ↓
WebSocket Updates (Real-time)
       ↓
Query Invalidation → UI Refresh
```

### Feature Structure

```
frontend/src/
├── features/proposals/              # Proposals feature module
│   ├── api/
│   │   └── proposalService.ts       # API service class
│   ├── components/
│   │   ├── ProposalCard.tsx         # Main card component
│   │   ├── RejectProposalDialog.tsx # Rejection modal
│   │   └── index.ts                 # Component exports
│   └── types/
│       └── index.ts                 # TypeScript interfaces
├── pages/
│   └── ProposalsPage/
│       └── index.tsx                # Main proposals page
└── shared/
    ├── config/api.ts                # API endpoints configuration
    └── components/AppSidebar.tsx    # Navigation with badges
```

---

## Component Inventory

### 1. ProposalsPage (`/pages/ProposalsPage/index.tsx`)

**Type:** Container/Smart Component

**Purpose:** Головна сторінка для перегляду та управління task proposals

**Key Features:**
- List view з grid layout (1/2/3 columns responsive)
- Filtering: status (all/pending/approved/rejected/merged), confidence (low/medium/high)
- Search: full-text через title, description, category, tags, reasoning
- TanStack Query для data fetching з automatic caching
- Real-time updates через query invalidation

**State Management:**
```typescript
// Local state
const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
const [statusFilter, setStatusFilter] = useState<string>('all')
const [confidenceFilter, setConfidenceFilter] = useState<string>('all')
const [searchQuery, setSearchQuery] = useState('')

// TanStack Query state
const { data, isLoading, error } = useQuery<ProposalListResponse>({
  queryKey: ['proposals', statusFilter, confidenceFilter],
  queryFn: async () => {...}
})
```

**User Actions:**
- `handleApprove(proposalId)` → approveMutation.mutate
- `handleReject(proposalId)` → opens RejectProposalDialog
- `handleConfirmReject(reason)` → rejectMutation.mutate

**Props:** None (page component)

**Accessibility:**
- Loading spinner з aria-live="polite"
- Error messages з descriptive text
- Filter controls з labels

**Issues:**
- No pagination (fetches all at once)
- Client-side filtering після backend fetch (неефективно)
- No URL state management (filters reset on navigation)
- No loading skeleton (just spinner)

---

### 2. ProposalCard (`/features/proposals/components/ProposalCard.tsx`)

**Type:** Presentational Component

**Purpose:** Відображає окремий proposal з усіма деталями у card format

**Props Interface:**
```typescript
interface ProposalCardProps {
  proposal: TaskProposal
  onApprove?: (proposalId: string) => void
  onReject?: (proposalId: string) => void
  onEdit?: (proposalId: string) => void    // ⚠️ Not implemented in page
  isLoading?: boolean
}
```

**Visual Structure:**
```
┌─────────────────────────────────────────┐
│ [Status] [Priority] [Confidence] [⚠️]   │
│ Proposal Title                 ID: xxx  │
├─────────────────────────────────────────┤
│ Description text...                     │
│                                         │
│ Category: feature                       │
│ Tags: tag1, tag2, tag3                  │
│ Matched Keywords: keyword1, keyword2    │
│ Source messages: 5                      │
├─────────────────────────────────────────┤
│ ▼ LLM Reasoning (expandable)            │
│ ▼ Source Messages (5) (expandable)     │
├─────────────────────────────────────────┤
│ Review Notes: ...                       │
│ Created: 2025-10-23 15:30              │
│ Reviewed: 2025-10-23 16:45             │
├─────────────────────────────────────────┤
│ [✓ Approve] [Edit] [✗ Reject]          │
└─────────────────────────────────────────┘
```

**Key Features:**
- Expandable sections (reasoning, source messages)
- Status/Priority/Confidence badges з color coding
- Similar task warning badge
- Conditional rendering (actions only for pending)
- Mobile-responsive layout

**State Management:**
```typescript
const [showReasoning, setShowReasoning] = useState(false)
const [showSources, setShowSources] = useState(false)
```

**Accessibility:**
- aria-expanded на expandable buttons
- aria-label з descriptive text
- Semantic HTML (button, not div)

**Issues:**
- No keyboard navigation для expand/collapse
- No focus management
- Long reasoning text може зламати layout
- Source messages показані як IDs (no rich data)

---

### 3. RejectProposalDialog (`/features/proposals/components/RejectProposalDialog.tsx`)

**Type:** Modal Component

**Purpose:** Збирає rejection reason від користувача

**Props Interface:**
```typescript
interface RejectProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  isLoading?: boolean
}
```

**Validation:**
- Required field (reason.trim() must not be empty)
- Min 1 character
- Clears on confirm

**UX Flow:**
```
User clicks [Reject] → Dialog opens → User enters reason →
[Reject Proposal] → API call → Success toast → Dialog closes → List refreshes
```

**Accessibility:**
- Dialog role з focus trap
- Label for textarea
- Disabled state while loading
- Keyboard navigation (Escape closes)

**Issues:**
- No character count/limit
- No validation message shown to user
- Placeholder text може бути більш descriptive

---

### 4. proposalService (`/features/proposals/api/proposalService.ts`)

**Type:** API Service Class

**Purpose:** Централізовані API calls для proposals

**Methods:**

```typescript
class ProposalService {
  async listProposals(params?: ProposalFilters): Promise<ProposalListResponse>
  async getProposal(proposalId: string): Promise<TaskProposal>
  async approveProposal(proposalId: string, data?: ApproveProposalRequest): Promise<TaskProposal>
  async rejectProposal(proposalId: string, data: RejectProposalRequest): Promise<TaskProposal>
  async mergeProposal(proposalId: string, data: MergeProposalRequest): Promise<TaskProposal>  // ⚠️ Not used
  async updateProposal(proposalId: string, data: UpdateProposalRequest): Promise<TaskProposal>  // ⚠️ Not used
}
```

**API Endpoints:**
```typescript
// From @/shared/config/api.ts
proposals: '/api/v1/analysis/proposals'
proposal: (proposalId: string) => `/api/v1/analysis/proposals/${proposalId}`
```

**Error Handling:**
- Axios interceptors у apiClient
- Errors propagated до React Query
- Toast notifications у mutation callbacks

**Issues:**
- No retry logic
- No request cancellation
- No optimistic updates
- mergeProposal та updateProposal не використовуються

---

## Type System

### Core Types (`/features/proposals/types/index.ts`)

```typescript
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'merged'

export interface TaskProposal {
  // Identity
  id: string
  analysis_run_id: string

  // Proposed task data
  proposed_title: string
  proposed_description: string
  proposed_priority: string
  proposed_category: string
  proposed_project_id: string | null
  proposed_tags: string[]
  proposed_parent_id: string | null
  proposed_sub_tasks: Record<string, unknown>[] | null

  // Source tracking
  source_message_ids: number[]
  message_count: number
  time_span_seconds: number

  // Duplicate detection
  similar_task_id: string | null
  similarity_score: number | null
  similarity_type: string | null
  diff_summary: Record<string, unknown> | null

  // LLM metadata
  llm_recommendation: string
  confidence: number
  reasoning: string
  project_classification_confidence: number | null
  project_keywords_matched: string[] | null

  // Review workflow
  status: ProposalStatus
  reviewed_by_user_id: number | null
  reviewed_at: string | null
  review_action: string | null
  review_notes: string | null
  created_at: string
}

export interface ProposalListResponse {
  items: TaskProposal[]
  total: number
  page: number
  page_size: number
}

export interface ProposalFilters {
  run_id?: string
  status?: string
  confidence_min?: number
  confidence_max?: number
  skip?: number
  limit?: number
}
```

**Type Safety:**
- ✅ All props have interfaces
- ✅ Strict TypeScript mode
- ✅ No `any` types
- ⚠️ `Record<string, unknown>` для sub_tasks та diff_summary (could be more specific)

---

## User Workflows

### 1. View Proposals

**Entry Points:**
- Sidebar: "Task Proposals" (badge shows pending count)
- Dashboard: "Proposals to Review" metric card
- Analysis Runs: "Proposals" column з counts

**Flow:**
```
Navigate to /proposals
    ↓
Loading state (spinner)
    ↓
Proposals list з grid layout
    ↓
Apply filters (status, confidence)
    ↓
Search proposals
    ↓
Expand LLM reasoning/sources
    ↓
Review proposal details
```

**Filter Workflow:**
- Status: All / Pending / Approved / Rejected / Merged
- Confidence: All / Low (<70%) / Medium (70-90%) / High (>90%)
- Search: Real-time client-side filtering

**Empty States:**
- No proposals: "Create an analysis run to generate task proposals"
- No results after filter: "Try adjusting your filters"

---

### 2. Approve Proposal

**Trigger:** User clicks [Approve] button on ProposalCard

**Flow:**
```
Click [Approve]
    ↓
approveMutation.mutate(proposalId)
    ↓
PUT /api/v1/analysis/proposals/{id}/approve
    ↓
Success:
  - Toast: "Proposal approved successfully"
  - Invalidate queries: ['proposals']
  - Card updates status → 'approved'
  - Proposal disappears якщо filter = 'pending'
    ↓
Error:
  - Toast: error message
  - Proposal remains unchanged
```

**Backend Side Effects:**
- Status → 'approved'
- reviewed_at → current timestamp
- review_action → 'approve'
- analysis_run.proposals_pending -= 1
- analysis_run.proposals_approved += 1
- WebSocket broadcast: `proposals.proposal_approved`

**UX Observations:**
- ✅ Instant feedback через toast
- ✅ Optimistic UI (query invalidation)
- ❌ No confirmation dialog (можна approve випадково)
- ❌ No undo functionality

---

### 3. Reject Proposal

**Trigger:** User clicks [Reject] button on ProposalCard

**Flow:**
```
Click [Reject]
    ↓
Open RejectProposalDialog
    ↓
User enters rejection reason (required)
    ↓
Click [Reject Proposal]
    ↓
rejectMutation.mutate({ proposalId, reason })
    ↓
PUT /api/v1/analysis/proposals/{id}/reject
    ↓
Success:
  - Toast: "Proposal rejected"
  - Dialog closes
  - Invalidate queries: ['proposals']
  - Card updates status → 'rejected'
    ↓
Error:
  - Toast: error message
  - Dialog remains open
```

**Backend Side Effects:**
- Status → 'rejected'
- review_notes → reason
- reviewed_at → current timestamp
- review_action → 'reject'
- analysis_run.proposals_pending -= 1
- analysis_run.proposals_rejected += 1
- WebSocket broadcast: `proposals.proposal_rejected`

**UX Observations:**
- ✅ Required reason (good for AI feedback loop)
- ✅ Modal prevents accidental rejection
- ✅ Clear feedback
- ❌ No categories/tags для rejection reasons (could improve AI learning)

---

### 4. Edit Proposal (NOT IMPLEMENTED)

**Status:** ⚠️ Callback defined, але не підключено

**Potential Flow:**
```
Click [Edit]
    ↓
Open EditProposalDialog
    ↓
User edits:
  - Title
  - Description
  - Priority
  - Category
  - Tags
  - Project assignment
    ↓
Click [Save]
    ↓
PUT /api/v1/analysis/proposals/{id}
    ↓
Success: Update UI
```

**API Support:** ✅ `updateProposal()` exists in service

**Missing:**
- EditProposalDialog component
- Form validation
- onChange handler integration

---

### 5. Merge Proposal (NOT IMPLEMENTED)

**Status:** ⚠️ API exists, але немає UI

**Potential Flow:**
```
Click [Merge with existing task]
    ↓
Open MergeProposalDialog
    ↓
Search/Select target task
    ↓
Click [Merge]
    ↓
PUT /api/v1/analysis/proposals/{id}/merge
    ↓
Success: Proposal merged
```

**API Support:** ✅ `mergeProposal()` exists in service

**Use Case:** Коли proposal дублює existing task

**Missing:**
- MergeProposalDialog component
- Task search/select functionality
- Merge preview/confirmation

---

## Real-Time Integration

### WebSocket Implementation

**Locations:**
1. **ProposalsPage:** Not using WebSocket (relies on TanStack Query polling)
2. **AnalysisRunsPage:** Dedicated WebSocket connection
3. **AppSidebar:** WebSocket для sidebar counts

**AnalysisRunsPage WebSocket:**
```typescript
useEffect(() => {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost/ws'
  const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals`)

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if (message.topic === 'analysis') {
      switch (message.event) {
        case 'run_created':
        case 'run_progress':
        case 'run_completed':
        case 'run_failed':
          queryClient.invalidateQueries({ queryKey: ['analysis-runs'] })
          break
      }
    }
  }

  return () => ws.close()
}, [queryClient])
```

**AppSidebar WebSocket:**
```typescript
useEffect(() => {
  const ws = new WebSocket(`${wsUrl}?topics=analysis,proposals,noise_filtering`)

  ws.onmessage = (event) => {
    const { topic, event: eventType } = JSON.parse(event.data)

    if (topic === 'proposals' &&
        ['proposal_created', 'proposal_approved', 'proposal_rejected'].includes(eventType)
    ) {
      queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
    }
  }
}, [queryClient])
```

**Events:**
- `proposals.proposal_created` → New proposal added
- `proposals.proposal_approved` → Proposal approved
- `proposals.proposal_rejected` → Proposal rejected
- `analysis.run_completed` → Run finished (proposals ready)

**Issues:**
- ❌ ProposalsPage не має direct WebSocket connection
- ❌ Залежить від query invalidation з інших компонентів
- ❌ No granular updates (full list refetch)
- ❌ No optimistic updates

---

## State Management Patterns

### TanStack Query Usage

**Query Keys Strategy:**
```typescript
// ProposalsPage
['proposals', statusFilter, confidenceFilter]

// Sidebar
['sidebar-counts']

// Analysis Runs
['analysis-runs']
```

**Invalidation Strategy:**
```typescript
// After approve/reject
queryClient.invalidateQueries({ queryKey: ['proposals'] })

// WebSocket events trigger
queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] })
```

**Caching:**
- Default staleTime: 0 (always refetch)
- Default cacheTime: 5 minutes
- No custom cache configuration

**Mutations:**
```typescript
const approveMutation = useMutation({
  mutationFn: (proposalId: string) => proposalService.approveProposal(proposalId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['proposals'] })
    toast.success('Proposal approved successfully')
  },
  onError: (error: Error) => {
    toast.error(error.message || 'Failed to approve proposal')
  },
})
```

**Issues:**
- No optimistic updates (UI waits for backend)
- No selective invalidation (refetches entire list)
- No pagination (fetches all proposals)
- No prefetching

---

## Integration Points

### 1. Analysis Runs Integration

**Connection:**
- Each proposal має `analysis_run_id`
- RunCard shows proposals statistics:
  - `proposals_total`
  - `proposals_approved`
  - `proposals_rejected`
  - `proposals_pending`

**Navigation:**
- From Analysis Runs → Filter proposals by run_id (⚠️ not implemented in UI)

**WebSocket Coordination:**
- run_completed → triggers sidebar update → shows pending proposals badge

---

### 2. Dashboard Integration

**Metric Card:**
```typescript
<MetricCard
  title="Proposals to Review"
  value={sidebarCounts?.pending_proposals || 0}
  subtitle="awaiting review"
  icon={DocumentCheckIcon}
  iconColor="text-amber-600"
  onClick={() => navigate('/proposals')}
/>
```

**Real-time Updates:**
- WebSocket invalidates sidebar-counts
- Dashboard refreshes metric
- Badge shows notification

---

### 3. Sidebar Navigation

**Badge Display:**
```typescript
if (item.path === '/proposals' && counts) {
  badgeCount = counts.pending_proposals
  badgeTooltip = badgeCount === 1
    ? '1 proposal awaiting review'
    : `${badgeCount} proposals awaiting review`
}
```

**Visual Indicator:**
- Badge shows only if pending_proposals > 0
- Color: amber (warning)
- Positioned absolutely on menu item

---

## Current Limitations & Gaps

### Missing Features

1. **Bulk Operations**
   - ❌ Select multiple proposals
   - ❌ Approve/reject in batch
   - ❌ Bulk status change

2. **Edit Functionality**
   - ❌ Edit proposal dialog
   - ❌ Field validation
   - ❌ Save/cancel workflow

3. **Merge Workflow**
   - ❌ Merge dialog
   - ❌ Task search/selection
   - ❌ Merge preview

4. **Advanced Filtering**
   - ❌ Filter by analysis_run_id (API supports, UI doesn't)
   - ❌ Filter by date range
   - ❌ Filter by similar_task presence
   - ❌ Sort options (currently hardcoded by confidence desc)

5. **Pagination**
   - ❌ No pagination controls
   - ❌ Fetches all proposals at once
   - ❌ Performance issue для large datasets

6. **Detail View**
   - ❌ No dedicated detail page
   - ❌ All details в card (може бути crowded)
   - ❌ No drill-down до source messages

7. **History/Audit Trail**
   - ❌ No proposal change history
   - ❌ No review timeline
   - ❌ No user activity log

8. **Export/Import**
   - ❌ No CSV export
   - ❌ No bulk import
   - ❌ No reporting

### UX Issues

1. **Performance**
   - Client-side filtering після backend fetch
   - No virtual scrolling для long lists
   - No lazy loading

2. **Accessibility**
   - Missing keyboard shortcuts
   - No focus management
   - No screen reader announcements для dynamic updates

3. **Mobile Experience**
   - Cards стають вузькими на mobile
   - Expandable sections важко відкривати
   - No swipe gestures

4. **Error Handling**
   - Generic error messages
   - No retry buttons
   - No error recovery guidance

### Missing Proposal Types

**Найвагоміша знахідка:** У frontend є **тільки Task Proposals**

**Not Found:**
- ❌ Topic Proposals
- ❌ Atom Proposals
- ❌ Any other proposal types

**Backend Confirmation:**
```python
# backend/app/models/task_proposal.py
class TaskProposal(SQLModel, table=True):
    __tablename__ = "task_proposals"
```

**Only one proposal model exists**

---

## Performance Observations

### Current Behavior

**Initial Load:**
- Fetches all proposals (no pagination)
- Client-side filtering
- No skeleton/loading states (just spinner)

**Filter Changes:**
- Triggers new API call (good)
- Loses scroll position
- No loading indicator during refetch

**Search:**
- Real-time client-side filtering
- Performant для < 100 proposals
- May lag з великою кількістю

**WebSocket Updates:**
- Invalidates entire query
- Refetches full list
- Could be more granular

### Recommendations

1. **Implement Pagination**
   - Backend supports skip/limit
   - Add pagination controls
   - Use cursor-based pagination

2. **Optimize Filtering**
   - Keep server-side filtering
   - Add debounced search
   - Cache filter results

3. **Virtual Scrolling**
   - Use react-window або react-virtualized
   - Render only visible cards
   - Improve scroll performance

4. **Granular Updates**
   - Update individual proposals via WebSocket
   - No need для full refetch
   - Use `queryClient.setQueryData()`

---

## Code Quality Assessment

### Strengths

✅ **Type Safety**
- All components typed
- No `any` types
- Strict TypeScript mode

✅ **Component Structure**
- Clear separation of concerns
- Reusable components
- Props interfaces defined

✅ **API Service**
- Centralized API calls
- Consistent error handling
- Type-safe responses

✅ **Accessibility Basics**
- Semantic HTML
- ARIA attributes
- Keyboard navigation (partial)

### Weaknesses

❌ **Code Duplication**
- WebSocket setup repeated у multiple pages
- Could extract useWebSocketQuery hook

❌ **Magic Numbers**
- Hardcoded confidence thresholds (0.7, 0.9)
- No constants file

❌ **No Tests**
- No unit tests
- No integration tests
- No E2E tests

❌ **Comments**
- Minimal inline comments
- No JSDoc for complex functions

---

## Recommendations

### Immediate (High Priority)

1. **Implement Edit Workflow**
   - Create EditProposalDialog
   - Connect onEdit callback
   - Add form validation

2. **Add Pagination**
   - Implement pagination controls
   - Server-side pagination
   - Preserve scroll position

3. **Improve WebSocket Integration**
   - Add WebSocket to ProposalsPage
   - Granular updates
   - Better error handling

4. **Bulk Operations**
   - Multi-select functionality
   - Batch approve/reject
   - Confirmation dialog

### Short-term (Medium Priority)

5. **Merge Workflow**
   - Create MergeProposalDialog
   - Task search component
   - Merge preview

6. **Detail Page**
   - Dedicated /proposals/:id route
   - Full proposal details
   - Source messages drill-down

7. **Advanced Filtering**
   - Filter by run_id
   - Date range picker
   - Sort controls

8. **Loading States**
   - Skeleton components
   - Loading indicators
   - Progressive loading

### Long-term (Low Priority)

9. **Performance Optimizations**
   - Virtual scrolling
   - Optimistic updates
   - Prefetching

10. **Accessibility Improvements**
    - Keyboard shortcuts
    - Focus management
    - Screen reader support

11. **Testing**
    - Unit tests (components)
    - Integration tests (workflows)
    - E2E tests (user journeys)

12. **Export/Reporting**
    - CSV export
    - PDF reports
    - Analytics dashboard

---

## Topic/Atom Proposals Investigation

**Research Question:** Чи існують Topic/Atom proposals у системі?

### Findings

**Backend:**
```bash
$ grep -r "topic.*proposal\|atom.*proposal" backend/
# No results found
```

**Frontend:**
```bash
$ find frontend/src -name "*proposal*"
features/proposals/api/proposalService.ts
features/proposals/components/ProposalCard.tsx
features/proposals/components/RejectProposalDialog.tsx
features/proposals/types/index.ts
pages/ProposalsPage/index.tsx
```

**Database Models:**
```python
# backend/app/models/
- task_proposal.py   ✅ Exists
- topic.py           ✅ Exists (no proposals)
- atom.py            ✅ Exists (no proposals)
```

**Conclusion:** ❌ Topic/Atom proposals НЕ реалізовані

**Potential Future Feature:**
- Topics та Atoms мають manual creation через UI
- Could benefit from AI-generated proposals
- Similar workflow до Task Proposals
- Would require:
  - New backend models (TopicProposal, AtomProposal)
  - New API endpoints
  - New frontend components
  - Shared proposal workflow patterns

---

## Screenshots & UI Examples

### ProposalsPage Layout

```
┌──────────────────────────────────────────────────────┐
│ Task Proposals                                       │
│ Review and approve AI-generated task proposals       │
├──────────────────────────────────────────────────────┤
│ [Search...              ] [Status ▼] [Confidence ▼] │
│ 🔽 Showing 12 of 45 proposals                        │
├──────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │Proposal 1│ │Proposal 2│ │Proposal 3│              │
│ │[Pending] │ │[Approved]│ │[Pending] │              │
│ │High 95%  │ │Medium 82%│ │Low 65%   │              │
│ │          │ │          │ │          │              │
│ │[Approve] │ │          │ │[Approve] │              │
│ │[Reject]  │ │          │ │[Reject]  │              │
│ └──────────┘ └──────────┘ └──────────┘              │
│                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │Proposal 4│ │Proposal 5│ │Proposal 6│              │
│ └──────────┘ └──────────┘ └──────────┘              │
└──────────────────────────────────────────────────────┘
```

### ProposalCard Expanded

```
┌───────────────────────────────────────────────────┐
│ [Pending] [High] [95%] [⚠️ Similar Task]          │
│ Implement user authentication                     │
│                                    ID: 3f8a9b2d   │
├───────────────────────────────────────────────────┤
│ Add OAuth2 authentication flow with Google       │
│ and GitHub providers. Include refresh tokens.    │
│                                                   │
│ Category: feature                                 │
│ Tags: auth, security, oauth                       │
│ Matched Keywords: authentication, login           │
│ Source messages: 8                                │
├───────────────────────────────────────────────────┤
│ ▲ LLM Reasoning                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │ Based on 8 messages discussing auth needs,  │   │
│ │ users want social login. High confidence    │   │
│ │ (95%) due to explicit requirements and      │   │
│ │ multiple stakeholder agreement.             │   │
│ └─────────────────────────────────────────────┘   │
│                                                   │
│ ▼ Source Messages (8)                             │
├───────────────────────────────────────────────────┤
│ Created: Oct 23, 2025 15:30                       │
├───────────────────────────────────────────────────┤
│ [✓ Approve] [Edit] [✗ Reject]                     │
└───────────────────────────────────────────────────┘
```

---

## Appendix

### API Endpoints Used

```typescript
// GET /api/v1/analysis/proposals
// Query params: skip, limit, run_id, status, confidence_min, confidence_max
listProposals(params?: ProposalFilters): Promise<ProposalListResponse>

// GET /api/v1/analysis/proposals/{id}
getProposal(proposalId: string): Promise<TaskProposal>

// PUT /api/v1/analysis/proposals/{id}/approve
approveProposal(proposalId: string, data?: ApproveProposalRequest): Promise<TaskProposal>

// PUT /api/v1/analysis/proposals/{id}/reject
rejectProposal(proposalId: string, data: RejectProposalRequest): Promise<TaskProposal>

// PUT /api/v1/analysis/proposals/{id}/merge (NOT USED)
mergeProposal(proposalId: string, data: MergeProposalRequest): Promise<TaskProposal>

// PUT /api/v1/analysis/proposals/{id} (NOT USED)
updateProposal(proposalId: string, data: UpdateProposalRequest): Promise<TaskProposal>

// GET /api/v1/sidebar-counts
// Returns: { unclosed_runs: number, pending_proposals: number }
```

### WebSocket Events

```typescript
// Subscribed topics
topics=analysis,proposals,noise_filtering

// Received events
{
  topic: 'proposals',
  event: 'proposal_created' | 'proposal_approved' | 'proposal_rejected',
  data: { proposal_id: string, ... }
}

{
  topic: 'analysis',
  event: 'run_completed' | 'run_failed',
  data: { run_id: string, proposals_total: number, ... }
}
```

### File Locations Reference

```
Frontend Implementation:
├── features/proposals/
│   ├── api/proposalService.ts           (232 LOC)
│   ├── components/ProposalCard.tsx      (216 LOC)
│   ├── components/RejectProposalDialog.tsx (86 LOC)
│   └── types/index.ts                   (75 LOC)
├── pages/ProposalsPage/index.tsx        (233 LOC)
├── shared/config/api.ts                 (lines 65-67)
└── shared/components/AppSidebar.tsx     (lines 187-192)

Backend Reference:
├── backend/app/models/task_proposal.py
├── backend/app/api/v1/proposals.py
└── backend/app/ws/router.py
```

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "@heroicons/react": "^2.x",
    "react-hot-toast": "^2.x",
    "axios": "^1.x"
  }
}
```

---

## Conclusion

Frontend implementation системи Task Proposals є **функціональною та добре структурованою**, але має простір для покращень:

**Сильні сторони:**
- ✅ Clean architecture з feature-based structure
- ✅ Type-safe з TypeScript
- ✅ Real-time updates через WebSocket
- ✅ Good separation of concerns

**Основні недоліки:**
- ❌ Missing Edit та Merge workflows
- ❌ No pagination (performance bottleneck)
- ❌ Limited accessibility
- ❌ No tests

**Найбільша знахідка:**
- 🔍 **Тільки Task Proposals реалізовані** — Topic/Atom proposals не існують у системі

**Рекомендації для розвитку:**
1. Додати Edit/Merge workflows
2. Implement pagination
3. Improve WebSocket integration
4. Add bulk operations
5. Write tests

---

*Report generated by React Frontend Architect on 2025-10-23 20:29:19*

*Session artifacts: `.artifacts/proposals-workflow-investigation/20251023_202919/`*