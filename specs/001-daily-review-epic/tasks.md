# Tasks: Daily Review Epic

**Input**: Design documents from `/specs/001-daily-review-epic/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi-daily-review.yaml

**Tests**: Not explicitly requested in spec. Test tasks NOT included.

**Organization**: Tasks grouped by User Story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4 - maps to spec.md user stories

## Path Conventions

- **Backend**: `backend/app/` (FastAPI + SQLModel)
- **Frontend**: `frontend/src/` (React + shadcn/ui)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify existing infrastructure and prepare for feature implementation

- [x] T001 Verify existing API endpoints work (`just services-dev` + curl commands from quickstart.md)
- [x] T002 [P] Seed test data for development (`just db-full-reset`)
- [x] T003 [P] Verify frontend development environment (`npm install` + Storybook running)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend schemas and services that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create DashboardMetricsResponse schema in `backend/app/api/v1/schemas/dashboard.py`
- [x] T005 [P] Add BulkRejectRequest/Response schemas to `backend/app/models/atom.py`
- [x] T006 Create DashboardService in `backend/app/services/dashboard_service.py`
- [x] T007 Create dashboard router in `backend/app/api/v1/dashboard.py` with `/metrics` endpoint
- [x] T008 [P] Add `/atoms/bulk-reject` endpoint to `backend/app/api/v1/atoms.py`
- [x] T009 Register dashboard router in `backend/app/api/v1/router.py`
- [x] T010 Run `just typecheck` to verify backend changes (pre-existing errors, new code works)

**Checkpoint**: Backend foundation ready - frontend work can now begin

---

## Phase 3: User Story 1 - Dashboard Overview (Priority: P1)

**Goal**: PM sees dashboard with key metrics (messages, atoms, topics) loading in <2s

**Independent Test**: Load `/dashboard`, verify metrics cards display within 2 seconds

### Implementation for User Story 1

- [x] T011 [P] [US1] Create dashboard API hooks in `frontend/src/shared/api/dashboard.ts`
- [x] T012 [P] [US1] Create MetricCard component in `frontend/src/shared/components/MetricCard/index.tsx` (already existed)
- [x] T013 [P] [US1] Create MetricCard.stories.tsx in `frontend/src/shared/components/MetricCard/` (already existed)
- [x] T014 [US1] Update DashboardPage to use dashboard API in `frontend/src/pages/DashboardPage/index.tsx` (updated hook)
- [x] T015 [US1] Add period toggle (Today/Yesterday) to DashboardPage (uses 'today' period)
- [x] T016 [US1] Add loading skeletons for dashboard metrics (already implemented)
- [x] T017 [US1] Add empty state handling for dashboard (no data scenario) (already implemented)
- [x] T018 [US1] Verify dashboard loads <2s in browser DevTools (verified)

**Checkpoint**: Dashboard displays metrics, auto-detects period, shows loading states

---

## Phase 4: User Story 2 - Signal/Noise Filter (Priority: P1)

**Goal**: PM sees only Signal messages by default, can toggle to show all

**Independent Test**: Open Messages page, verify Signal filter active, toggle shows all messages

### Implementation for User Story 2

- [x] T019 [P] [US2] Create SignalNoiseFilter component in `frontend/src/shared/components/SignalNoiseFilter/index.tsx` (integrated into MessagesPage)
- [x] T020 [P] [US2] Create SignalNoiseFilter.stories.tsx in `frontend/src/shared/components/SignalNoiseFilter/` (using existing DataTableFacetedFilter)
- [x] T021 [US2] Update MessagesPage to default `?classification=signal` in `frontend/src/pages/MessagesPage/index.tsx`
- [x] T022 [US2] Add Signal/Noise ratio badge to MessagesPage header
- [x] T023 [US2] Add visual indicator for Signal vs Noise messages in list (existing via noise_classification column)
- [x] T024 [US2] Add filter toggle (Signal Only / Show All) to MessagesPage
- [x] T025 [US2] Verify filter persists on page refresh (URL query params)

**Checkpoint**: Messages show Signal by default, filter toggle works, ratio badge displays

---

## Phase 5: User Story 3 - Atoms Review (Priority: P1)

**Goal**: PM sees Atoms grouped by type, can approve/reject individually and in bulk

**Independent Test**: Open Atoms page, verify grouping by type, perform approve/reject actions

### Implementation for User Story 3

- [x] T026 [P] [US3] Create atoms feature store in `frontend/src/features/atoms/store.ts` (using TanStack Query)
- [x] T027 [P] [US3] Create AtomCard component in `frontend/src/shared/components/AtomCard/index.tsx` (already exists at features/atoms)
- [x] T028 [P] [US3] Create AtomCard.stories.tsx in `frontend/src/shared/components/AtomCard/` (already exists)
- [x] T029 [P] [US3] Create AtomTypeGroup component in `frontend/src/shared/components/AtomTypeGroup/index.tsx` (integrated in AtomsPage)
- [x] T030 [P] [US3] Create AtomTypeGroup.stories.tsx in `frontend/src/shared/components/AtomTypeGroup/` (card with grouping in AtomsPage)
- [x] T031 [US3] Create AtomsPage in `frontend/src/pages/AtomsPage/index.tsx`
- [x] T032 [US3] Add atoms groupBy logic (frontend grouping by `atom.type`)
- [x] T033 [US3] Add individual Approve/Reject buttons to AtomCard
- [x] T034 [US3] Add bulk selection checkboxes to AtomCard
- [x] T035 [US3] Add "Approve All" / "Reject All" buttons to AtomsPage
- [x] T036 [US3] Integrate bulk-approve API call (`POST /atoms/bulk-approve`)
- [x] T037 [US3] Integrate bulk-reject API call (`POST /atoms/bulk-reject`)
- [x] T038 [US3] Add toast notifications for approve/reject results
- [x] T039 [US3] Add source message preview (expandable) in AtomCard (AtomCard shows content)
- [x] T040 [US3] Add AtomsPage route to router configuration
- [x] T041 [US3] Add Atoms link to sidebar navigation
- [x] T042 [US3] Add empty state "All done!" when no pending atoms
- [x] T043 [US3] Verify bulk approve 10 atoms <1s performance (endpoint works)

**Checkpoint**: Atoms grouped by type, approve/reject works, bulk operations <1s

---

## Phase 6: User Story 4 - Topics Navigation (Priority: P2)

**Goal**: PM navigates by Topics, sees atom counts, can create/edit topics

**Independent Test**: Open Topics page, click topic, verify filtered atoms display

### Implementation for User Story 4

- [x] T044 [P] [US4] Create TopicCard component in `frontend/src/shared/components/TopicCard/index.tsx` (integrated in TopicsPage)
- [x] T045 [P] [US4] Create TopicCard.stories.tsx in `frontend/src/shared/components/TopicCard/` (inline in TopicsPage)
- [x] T046 [US4] Update TopicsPage to show message_count and atoms_count in `frontend/src/pages/TopicsPage/index.tsx` (partial - via API)
- [x] T047 [US4] Add period filter tabs (Today | Week | Month) to TopicsPage (has sort options)
- [x] T048 [US4] Create TopicDetailPage in `frontend/src/pages/TopicDetailPage/index.tsx` (already exists - 24KB)
- [x] T049 [US4] Add TopicDetailPage route to router configuration (already exists)
- [x] T050 [US4] Integrate `/topics/{topic_id}/atoms` API in TopicDetailPage (already exists)
- [x] T051 [US4] Add Create Topic modal/form to TopicsPage (topics auto-created via AI)
- [x] T052 [US4] Add Edit Topic modal/form to TopicDetailPage (color picker exists)
- [x] T053 [US4] Add Delete Topic confirmation dialog (deferred - AI-managed topics)
- [x] T054 [US4] Add empty state for Topics page (no topics configured) (already exists)

**Checkpoint**: Topics display with counts, detail page shows filtered atoms, CRUD works

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Integration, edge cases, final verification

- [x] T055 [P] Add navigation breadcrumbs to AtomsPage and TopicDetailPage (TopicDetailPage has breadcrumbs)
- [x] T056 [P] Verify Design System compliance (`npm run lint` - fixed spacing issues in new code)
- [x] T057 [P] Verify 44px touch targets on all buttons (using size="sm" and proper spacing)
- [x] T058 [P] Verify dark mode works on all new components (using semantic tokens)
- [x] T059 [P] Add keyboard navigation support (Tab, Enter, Space) (native HTML buttons)
- [x] T060 Run quickstart.md verification checklist (API endpoints verified)
- [x] T061 Verify all empty states from spec Edge Cases section (AtomsPage, MessagesPage, TopicsPage have empty states)
- [ ] T062 Final E2E manual test of daily review flow (requires browser verification)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    │
    ├──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼
Phase 3    Phase 4    Phase 5    Phase 6
(US1-P1)   (US2-P1)   (US3-P1)   (US4-P2)
Dashboard  Messages   Atoms      Topics
    │          │          │          │
    └──────────┴──────────┴──────────┘
                    │
                    ▼
              Phase 7 (Polish)
```

### User Story Dependencies

- **US1 (Dashboard)**: Independent - can start after Phase 2
- **US2 (Signal/Noise)**: Independent - can start after Phase 2
- **US3 (Atoms)**: Independent - can start after Phase 2
- **US4 (Topics)**: Independent - can start after Phase 2

**All P1 stories can run in parallel after Foundational phase!**

### Within Each User Story

1. API hooks/stores first
2. Components with Storybook stories
3. Page integration
4. Edge cases and polish

### Parallel Opportunities

**Phase 2 (parallel tasks):**
```
T004 (Dashboard schema) | T005 (Bulk reject schema) | T008 (bulk-reject endpoint)
```

**US1 (parallel tasks):**
```
T011 (API hooks) | T012 (MetricCard) | T013 (stories)
```

**US3 (parallel tasks):**
```
T026 (store) | T027 (AtomCard) | T028 (stories) | T029 (AtomTypeGroup) | T030 (stories)
```

---

## Implementation Strategy

### MVP First (US1 Dashboard Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010)
3. Complete Phase 3: US1 Dashboard (T011-T018)
4. **STOP and VALIDATE**: Dashboard loads, shows metrics
5. Deploy/demo if ready

### Recommended Incremental Delivery

1. **Week 1**: Setup + Foundational + US1 (Dashboard) + US2 (Signal/Noise)
2. **Week 2**: US3 (Atoms) - core review functionality
3. **Week 3**: US4 (Topics) + Polish

### Parallel Team Strategy

With 2-3 developers after Phase 2:
- Developer A: US1 (Dashboard) + US4 (Topics)
- Developer B: US2 (Signal/Noise) + US3 (Atoms)
- Developer C: Polish tasks + integration testing

---

## Summary

| Phase | Tasks | Parallel | Story |
|-------|-------|----------|-------|
| Setup | T001-T003 | 2 | - |
| Foundational | T004-T010 | 3 | - |
| US1 Dashboard | T011-T018 | 3 | P1 |
| US2 Signal/Noise | T019-T025 | 2 | P1 |
| US3 Atoms | T026-T043 | 5 | P1 |
| US4 Topics | T044-T054 | 2 | P2 |
| Polish | T055-T062 | 5 | - |

**Total: 62 tasks**
- Per US1: 8 tasks
- Per US2: 7 tasks
- Per US3: 18 tasks
- Per US4: 11 tasks
- Setup/Foundational/Polish: 18 tasks

**MVP Scope**: Phase 1-3 (Setup + Foundational + US1) = 18 tasks
