# Tasks: Executive Summary Epic

**Input**: Design documents from `/specs/002-executive-summary/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: Not explicitly requested - tests omitted. Add manually if TDD approach desired.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/` for source, `backend/tests/` for tests
- **Frontend**: `frontend/src/` for source, `frontend/tests/` for tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, PRE-REQUISITE tasks that block feature implementation

- [X] T001 [P] Add `blocker` type to AtomType enum in backend/app/models/atom.py
- [X] T002 [P] Add `idea` type to AtomType enum in backend/app/models/atom.py
- [X] T003 [P] Add `risk` type to AtomType enum in backend/app/models/atom.py
- [X] T004 Remove or deprecate `pattern` type from AtomType enum in backend/app/models/atom.py
- [X] T005 Create feature directory structure: `frontend/src/pages/ExecutiveSummaryPage/`, `frontend/src/features/executive-summary/`
- [X] T006 Create API schemas file backend/app/api/v1/schemas/executive_summary.py (empty placeholder)
- [X] T007 Create service file backend/app/services/executive_summary_service.py (empty placeholder)
- [X] T008 Create API router file backend/app/api/v1/executive_summary.py (empty placeholder)

**Checkpoint**: AtomType enum synced with PRD, file structure ready

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend schemas and service infrastructure that ALL user stories depend on

- [X] T009 Implement TopicBrief schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T010 Implement ExecutiveSummaryStats schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T011 Implement ExecutiveSummaryAtom schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T012 Implement TopicDecisions schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T013 Implement ExecutiveSummaryResponse schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T014 Implement ExportFormat enum in backend/app/api/v1/schemas/executive_summary.py
- [X] T015 Implement ExportRequest schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T016 Implement ExportResponse schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T017 Implement ExecutiveSummaryStatsResponse schema in backend/app/api/v1/schemas/executive_summary.py
- [X] T018 Run `just typecheck` to verify backend schemas compile correctly

**Checkpoint**: All backend schemas defined and type-checked

---

## Phase 3: User Story 1 - Weekly Decisions Summary (Priority: P1)

**Goal**: CEO can see weekly summary of DECISION and BLOCKER atoms grouped by topics

**Independent Test**: Open Executive Summary page, verify DECISION and BLOCKER atoms displayed for last 7 days, grouped by topics

### Implementation for User Story 1

#### Backend (Service + API)

- [X] T019 [US1] Implement `_calculate_period_boundaries()` helper in backend/app/services/executive_summary_service.py
- [X] T020 [US1] Implement `_calculate_days_old()` helper in backend/app/services/executive_summary_service.py
- [X] T021 [US1] Implement `_is_stale_blocker()` helper (>14 days) in backend/app/services/executive_summary_service.py
- [X] T022 [US1] Implement `_format_period_label()` helper (Ukrainian date format) in backend/app/services/executive_summary_service.py
- [X] T023 [US1] Implement main `get_executive_summary()` method in backend/app/services/executive_summary_service.py
- [X] T024 [US1] Implement `GET /executive-summary` endpoint in backend/app/api/v1/executive_summary.py
- [X] T025 [US1] Register executive_summary router in backend/app/api/v1/router.py
- [X] T026 [US1] Run `just typecheck` to verify backend implementation

#### Frontend (Types + API Client)

- [X] T027 [P] [US1] Create TypeScript types in frontend/src/features/executive-summary/types/index.ts
- [X] T028 [P] [US1] Create API service `getExecutiveSummary()` in frontend/src/features/executive-summary/api/executiveSummaryService.ts
- [X] T029 [US1] Create `useExecutiveSummary` hook in frontend/src/pages/ExecutiveSummaryPage/hooks/useExecutiveSummary.ts

#### Frontend (UI Components)

- [X] T030 [P] [US1] Create BlockersList component in frontend/src/pages/ExecutiveSummaryPage/components/BlockersList.tsx
- [X] T031 [P] [US1] Create DecisionsList component in frontend/src/pages/ExecutiveSummaryPage/components/DecisionsList.tsx
- [X] T032 [P] [US1] Create SummaryStats component in frontend/src/pages/ExecutiveSummaryPage/components/SummaryStats.tsx
- [X] T033 [US1] Create ExecutiveSummaryPage main component in frontend/src/pages/ExecutiveSummaryPage/index.tsx
- [X] T034 [US1] Add route `/executive-summary` in frontend/src/app/routes.tsx
- [X] T035 [US1] Add navigation item "Executive Summary" to AppSidebar in frontend/src/shared/components/AppSidebar/index.tsx
- [X] T036 [US1] Run `npx tsc --noEmit` in frontend/ to verify no TypeScript errors
- [X] T037 [US1] Manual browser verification: open http://localhost/executive-summary

**Checkpoint**: US1 complete - CEO can view weekly summary with decisions and blockers

---

## Phase 4: User Story 2 - Export Report (Priority: P2)

**Goal**: CEO can export summary as Markdown file for sharing

**Independent Test**: Click "Export" button, verify Markdown file downloads with correct content structure

### Implementation for User Story 2

#### Backend

- [X] T038 [US2] Implement `_format_markdown_report()` helper in backend/app/services/executive_summary_service.py
- [X] T039 [US2] Implement `_format_plain_text_report()` helper in backend/app/services/executive_summary_service.py
- [X] T040 [US2] Implement `export_summary()` method in backend/app/services/executive_summary_service.py
- [X] T041 [US2] Implement `POST /executive-summary/export` endpoint in backend/app/api/v1/executive_summary.py
- [X] T042 [US2] Run `just typecheck` to verify export implementation

#### Frontend

- [X] T043 [P] [US2] Add `exportSummary()` to API service in frontend/src/features/executive-summary/api/executiveSummaryService.ts
- [X] T044 [US2] Create ExportButton component in frontend/src/pages/ExecutiveSummaryPage/components/ExportButton.tsx
- [X] T045 [US2] Integrate ExportButton into ExecutiveSummaryPage in frontend/src/pages/ExecutiveSummaryPage/index.tsx
- [X] T046 [US2] Run `npx tsc --noEmit` in frontend/ to verify no TypeScript errors
- [X] T047 [US2] Manual browser verification: export Markdown file, verify content structure

**Checkpoint**: US2 complete - CEO can export summary as Markdown

---

## Phase 5: User Story 3 - Period Selection (Priority: P2)

**Goal**: CEO can choose period (7, 14, 30 days) for summary

**Independent Test**: Change period selector, verify summary updates with correct date range

### Implementation for User Story 3

#### Frontend

- [X] T048 [P] [US3] Create SummaryPeriodSelector component in frontend/src/pages/ExecutiveSummaryPage/components/SummaryPeriodSelector.tsx
- [X] T049 [US3] Add period state management to useExecutiveSummary hook in frontend/src/pages/ExecutiveSummaryPage/hooks/useExecutiveSummary.ts
- [X] T050 [US3] Integrate SummaryPeriodSelector into ExecutiveSummaryPage in frontend/src/pages/ExecutiveSummaryPage/index.tsx
- [X] T051 [US3] Persist period selection to localStorage (session preference) in useExecutiveSummary hook
- [X] T052 [US3] Run `npx tsc --noEmit` in frontend/ to verify no TypeScript errors
- [X] T053 [US3] Manual browser verification: change period, verify summary updates, refresh page verifies persistence

**Checkpoint**: US3 complete - CEO can select and persist period preference

---

## Phase 6: User Story 4 - Cross-Project View (Priority: P3)

**Goal**: CEO can see all projects with metrics and filter by specific project

**Independent Test**: View all topics with metrics, click on topic to filter summary

### Implementation for User Story 4

#### Backend

- [X] T054 [US4] Implement `get_summary_stats()` method (lightweight stats-only) in backend/app/services/executive_summary_service.py
- [X] T055 [US4] Implement `GET /executive-summary/stats` endpoint in backend/app/api/v1/executive_summary.py
- [X] T056 [US4] Add optional `topic_id` filter parameter to `get_executive_summary()` in backend/app/services/executive_summary_service.py
- [X] T057 [US4] Run `just typecheck` to verify stats implementation

#### Frontend

- [X] T058 [P] [US4] Add `getSummaryStats()` to API service in frontend/src/features/executive-summary/api/executiveSummaryService.ts
- [ ] T059 [P] [US4] Create ProjectMetrics component in frontend/src/pages/ExecutiveSummaryPage/components/ProjectMetrics.tsx (deferred to post-MVP)
- [X] T060 [US4] Add topic filter state to useExecutiveSummary hook
- [ ] T061 [US4] Integrate ProjectMetrics into ExecutiveSummaryPage with clickable topic filtering (deferred to post-MVP)
- [X] T062 [US4] Run `npx tsc --noEmit` in frontend/ to verify no TypeScript errors
- [ ] T063 [US4] Manual browser verification: view metrics for all topics, click topic to filter

**Checkpoint**: US4 complete - CEO can view cross-project metrics and filter by topic

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Empty states, edge cases, performance, documentation

- [X] T064 [P] Add empty state for "no atoms in period" in ExecutiveSummaryPage
- [X] T065 [P] Add loading skeleton states in ExecutiveSummaryPage components
- [X] T066 [P] Add error boundary and error states in ExecutiveSummaryPage
- [X] T067 Implement stale blocker highlighting (>14 days = critical badge) in BlockersList component
- [ ] T068 Add pagination or "Show more" for large summaries (>20 items) in DecisionsList/BlockersList (deferred to post-MVP)
- [X] T069 Run full frontend lint check: `cd frontend && npm run lint`
- [X] T070 Run backend typecheck: `just typecheck`
- [X] T071 Verify quickstart.md test scenarios work end-to-end
- [X] T072 Update CLAUDE.md with new feature if needed (not needed - already documented)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - MUST complete first (PRE-REQUISITE: AtomType sync)
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - Core feature, MVP
- **User Story 2 (Phase 4)**: Depends on Phase 3 backend service being complete
- **User Story 3 (Phase 5)**: Depends on Phase 3 frontend being complete
- **User Story 4 (Phase 6)**: Depends on Phase 3 being complete
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation only - **MVP SCOPE**
- **User Story 2 (P2)**: US1 backend service exists (reuses `get_executive_summary()`)
- **User Story 3 (P2)**: US1 frontend exists (adds period selector to existing page)
- **User Story 4 (P3)**: US1 complete (extends with stats endpoint and topic filter)

### Within Each User Story

- Backend schemas before service
- Service before API endpoint
- API endpoint before frontend API client
- Frontend types before components
- Components before page integration
- Page integration before route registration

### Parallel Opportunities

**Phase 1 (Setup):**
```
T001, T002, T003 in parallel (different enum values)
```

**Phase 3 (US1) - Backend complete, then Frontend:**
```
Backend: T019-T022 in parallel (helpers) → T023 (main method) → T024-T025 (API)
Frontend: T027, T028 in parallel (types, API) → T029 (hook)
Frontend: T030, T031, T032 in parallel (components) → T033 (page)
```

**Phase 4 (US2):**
```
Backend: T038, T039 in parallel (formatters) → T040-T041 (service, API)
Frontend: T043 (API) → T044-T045 (component, integration)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T008) - **Critical: AtomType sync**
2. Complete Phase 2: Foundational (T009-T018) - Backend schemas
3. Complete Phase 3: User Story 1 (T019-T037)
4. **STOP and VALIDATE**: Test at http://localhost/dashboard/executive-summary
5. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Backend schemas ready
2. Add User Story 1 → Test → Deploy (MVP!)
3. Add User Story 2 → Test → Deploy (Export feature)
4. Add User Story 3 → Test → Deploy (Period selection)
5. Add User Story 4 → Test → Deploy (Cross-project view)
6. Polish → Test → Final release

### Recommended Approach

**Single developer:**
- Phase 1 → Phase 2 → Phase 3 (MVP) → validate → Phase 4 → Phase 5 → Phase 6 → Phase 7

**Two developers:**
- Dev A: Phase 1 → Phase 2 → Backend all phases
- Dev B: Wait for Phase 2 → Frontend all phases

---

## Notes

- PRE-REQUISITE: AtomType enum MUST be synced before any feature work (T001-T004)
- [P] tasks = different files, no dependencies on incomplete tasks
- [US#] label maps task to specific user story
- Each user story independently completable and testable
- Commit after each task or logical group
- Run typecheck after each phase

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 72 |
| **Phase 1 (Setup)** | 8 |
| **Phase 2 (Foundational)** | 10 |
| **Phase 3 (US1 - MVP)** | 19 |
| **Phase 4 (US2 - Export)** | 10 |
| **Phase 5 (US3 - Period)** | 6 |
| **Phase 6 (US4 - Cross-Project)** | 10 |
| **Phase 7 (Polish)** | 9 |
| **Parallel Tasks** | 18 |
| **MVP Scope** | T001-T037 (37 tasks) |
