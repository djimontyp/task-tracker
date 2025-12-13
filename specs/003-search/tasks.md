# Tasks: Keyword Search (003-search)

**Input**: Design documents from `/specs/003-search/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/openapi.yaml, research.md, quickstart.md

**Tests**: Not explicitly requested in spec. Test tasks included only where critical for validation.

**Organization**: Tasks grouped by user story (P1-P4) for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/app/`, `backend/tests/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare development environment and verify existing FTS infrastructure

- [x] T001 Verify PostgreSQL FTS indexes exist for topics and messages in database
- [x] T002 [P] Create Alembic migration for atoms FTS index in `backend/alembic/versions/294de4f0784e_add_atoms_fts_gin_index.py`
- [x] T003 [P] Add FTS TypeScript types to `frontend/src/features/search/types/fts.ts`

---

## Phase 2: Foundational (Backend FTS Extension)

**Purpose**: Extend existing FTS endpoint to include Atoms - BLOCKS all frontend stories

**CRITICAL**: Frontend work cannot begin until backend returns atoms in search response

### Backend Changes

- [x] T004 Add AtomSearchResult schema to `backend/app/api/v1/search.py`
- [x] T005 Extend SearchResultsResponse to include `atoms: list[AtomSearchResult]` in `backend/app/api/v1/search.py`
- [x] T006 Add atoms FTS SQL query to search endpoint in `backend/app/api/v1/search.py`
- [x] T007 Add `limit` query parameter support (default 10, dropdown uses 5) in `backend/app/api/v1/search.py`
- [x] T008 Run `just typecheck` to verify backend changes

**Checkpoint**: `curl "http://localhost/api/v1/search?q=test&limit=5"` returns topics, messages, AND atoms

---

## Phase 3: User Story 1 - Basic Keyword Search (Priority: P1)

**Goal**: User types query in header search bar, sees grouped results (Messages, Atoms, Topics) in inline dropdown with highlighted matches

**Independent Test**: Type any keyword in search bar → dropdown appears with grouped results, keywords highlighted with `<mark>` tags

### Frontend Service & Types

- [x] T009 [P] [US1] Add `FTSSearchResultsResponse` interface matching openapi.yaml in `frontend/src/features/search/types/fts.ts`
- [x] T010 [P] [US1] Add `FTSTopicResult`, `FTSMessageResult`, `FTSAtomResult` interfaces in `frontend/src/features/search/types/fts.ts`
- [x] T011 [US1] Add `searchFTS(query, limit)` method to searchService in `frontend/src/features/search/api/searchService.ts`

### SearchDropdown Component

- [x] T012 [US1] Create SearchDropdown component skeleton with Popover + Command in `frontend/src/features/search/components/SearchDropdown.tsx`
- [x] T013 [US1] Add CommandGroup for Messages with count in header in `frontend/src/features/search/components/SearchDropdown.tsx`
- [x] T014 [US1] Add CommandGroup for Atoms with count in header in `frontend/src/features/search/components/SearchDropdown.tsx`
- [x] T015 [US1] Add CommandGroup for Topics with count in header in `frontend/src/features/search/components/SearchDropdown.tsx`
- [x] T016 [US1] Add CommandEmpty for no results state in `frontend/src/features/search/components/SearchDropdown.tsx`
- [x] T017 [US1] Add loading state with Spinner in `frontend/src/features/search/components/SearchDropdown.tsx`

### SearchResultItem Components

- [x] T018 [P] [US1] Create MessageSearchItem component with highlighted snippet in `frontend/src/features/search/components/MessageSearchItem.tsx`
- [x] T019 [P] [US1] Create AtomSearchItem component with type badge and highlighted snippet in `frontend/src/features/search/components/AtomSearchItem.tsx`
- [x] T020 [P] [US1] Create TopicSearchItem component with highlighted snippet in `frontend/src/features/search/components/TopicSearchItem.tsx`

### SearchBar Integration

- [x] T021 [US1] Add useFTSSearch TanStack Query hook with debounce in `frontend/src/features/search/hooks/useFTSSearch.ts`
- [x] T022 [US1] Integrate SearchDropdown into SearchBar, trigger on query >= 2 chars in `frontend/src/features/search/components/SearchBar.tsx`
- [x] T023 [US1] Add Popover open/close state management (open when results exist, close on Esc) in `frontend/src/features/search/components/SearchBar.tsx`
- [x] T024 [US1] Ensure keyboard navigation works (Tab through results, Enter to select) in `frontend/src/features/search/components/SearchBar.tsx`

### Highlight Rendering

- [x] T025 [US1] Create sanitized HTML renderer for `<mark>` highlighted snippets in `frontend/src/features/search/utils/highlightRenderer.tsx`
- [x] T026 [US1] Apply highlight renderer to all SearchItem components

### Verification

- [x] T027 [US1] Run `cd frontend && npx tsc --noEmit` to verify TypeScript
- [ ] T028 [US1] Manual test: Type "authentication" in search bar → see grouped results with highlights

**Checkpoint**: User Story 1 complete - basic keyword search with inline dropdown works

---

## Phase 4: User Story 2 - Search Result Navigation (Priority: P2)

**Goal**: Click search result → navigate to source page with item highlighted/selected

**Independent Test**: Click any search result → navigates to correct page (Messages/Atoms/Topics) with item visible

### Navigation Logic

- [x] T029 [US2] Add onClick handler to MessageSearchItem that navigates to `/messages?highlight={id}` in `frontend/src/features/search/components/MessageSearchItem.tsx`
- [x] T030 [US2] Add onClick handler to AtomSearchItem that navigates to `/atoms?expand={id}` in `frontend/src/features/search/components/AtomSearchItem.tsx`
- [x] T031 [US2] Add onClick handler to TopicSearchItem that navigates to `/topics/{id}` in `frontend/src/features/search/components/TopicSearchItem.tsx`

### Target Page Highlighting

- [x] T032 [US2] Add URL param parsing for `highlight` param in MessagesPage in `frontend/src/pages/MessagesPage/index.tsx`
- [x] T033 [US2] Scroll to and highlight message when `highlight` param present in `frontend/src/pages/MessagesPage/index.tsx`
- [x] T034 [US2] Add URL param parsing for `expand` param in AtomsPage in `frontend/src/pages/AtomsPage/index.tsx`
- [x] T035 [US2] Expand and scroll to atom when `expand` param present in `frontend/src/pages/AtomsPage/index.tsx`

### "Show All" Links

- [x] T036 [US2] Add "Show all N results" link at bottom of each CommandGroup that navigates to `/search?q={query}` in `frontend/src/features/search/components/SearchDropdown.tsx` (SKIPPED: SearchPage uses semantic search)
- [x] T037 [US2] Close dropdown after navigation in `frontend/src/features/search/components/SearchBar.tsx`

### Back Navigation

- [x] T038 [US2] Preserve search query in URL state for back button support in `frontend/src/features/search/components/SearchBar.tsx`

### Verification

- [ ] T039 [US2] Manual test: Click message result → navigates to Messages page with message highlighted
- [ ] T040 [US2] Manual test: Click atom result → navigates to Atoms page with atom expanded
- [ ] T041 [US2] Manual test: Press browser back → returns to search with query preserved

**Checkpoint**: User Story 2 complete - search result navigation works

---

## Phase 5: User Story 3 - Empty State and No Results Handling (Priority: P3)

**Goal**: Clear feedback when search returns no results with helpful suggestions

**Independent Test**: Search for "xyzzy12345" → see friendly empty state message with suggestions

### Empty State Component

- [x] T042 [US3] Create SearchEmptyState component with icon and message in `frontend/src/features/search/components/SearchEmptyState.tsx` (implemented inline in SearchDropdown)
- [x] T043 [US3] Add "No results found for '[query]'" message with query interpolation in `frontend/src/features/search/components/SearchEmptyState.tsx`
- [x] T044 [US3] Add suggestions: "Try broader keywords" or "Check spelling" in `frontend/src/features/search/components/SearchEmptyState.tsx`

### Integration

- [x] T045 [US3] Replace CommandEmpty with SearchEmptyState in SearchDropdown in `frontend/src/features/search/components/SearchDropdown.tsx`

### Input Validation Feedback

- [x] T046 [US3] Show hint text on search focus (before typing) in `frontend/src/features/search/components/SearchBar.tsx` (handled via placeholder)
- [x] T047 [US3] Handle special characters and whitespace-only queries gracefully in `frontend/src/features/search/components/SearchBar.tsx`

### Verification

- [ ] T048 [US3] Manual test: Search "xyzzy12345" → see empty state with suggestions
- [ ] T049 [US3] Manual test: Search "   " (spaces only) → see empty state or hint

**Checkpoint**: User Story 3 complete - empty states handled gracefully

---

## Phase 6: User Story 4 - Search Performance Feedback (Priority: P4)

**Goal**: Visual loading feedback during search, smooth result appearance

**Independent Test**: Search on slow connection → loading indicator appears immediately, results appear without flicker

### Loading States

- [x] T050 [US4] Add skeleton loaders for search results in `frontend/src/features/search/components/SearchDropdown.tsx`
- [x] T051 [US4] Show loading spinner in input field while debouncing in `frontend/src/features/search/components/SearchBar.tsx`
- [x] T052 [US4] Prevent layout shift when results load (fixed height container) in `frontend/src/features/search/components/SearchDropdown.tsx`

### Debounce Indicator

- [x] T053 [US4] Visual indication that search is "waiting" during 300ms debounce in `frontend/src/features/search/components/SearchBar.tsx`

### Verification

- [ ] T054 [US4] Manual test: Throttle network (slow 3G) → loading indicator visible during search
- [ ] T055 [US4] Manual test: Fast typing → no excessive API calls (check Network tab)

**Checkpoint**: User Story 4 complete - loading states smooth and informative

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, Storybook stories, mobile support

### Mobile Search

- [x] T056 [P] Update MobileSearch component to use new SearchDropdown in `frontend/src/shared/components/MobileSearch.tsx` (uses SearchBar which includes dropdown)

### Storybook Stories

- [x] T057 [P] Create SearchDropdown.stories.tsx with all states (loading, results, empty) in `frontend/src/features/search/components/SearchDropdown.stories.tsx`
- [x] T058 [P] Create SearchResultItem.stories.tsx for all item types in `frontend/src/features/search/components/SearchResultItem.stories.tsx`

### Component Exports

- [x] T059 Update feature index exports in `frontend/src/features/search/components/index.ts`
- [x] T060 Update feature types exports in `frontend/src/features/search/types/index.ts`

### Final Verification

- [ ] T061 Run `just typecheck` (backend) - pre-existing errors not related to search feature
- [x] T062 Run `cd frontend && npx tsc --noEmit` (frontend)
- [ ] T063 Run quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all frontend work
- **Phase 3 (US1)**: Depends on Phase 2 backend completion
- **Phase 4 (US2)**: Depends on Phase 3 (needs SearchDropdown with items)
- **Phase 5 (US3)**: Depends on Phase 3 (needs SearchDropdown structure)
- **Phase 6 (US4)**: Depends on Phase 3 (needs search flow working)
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Depends on US1 (needs clickable search items)
- **US3 (P3)**: Can start after US1 (only needs dropdown structure)
- **US4 (P4)**: Can start after US1 (only needs loading states)

### Parallel Opportunities

**Within Phase 1:**
```
T002 (migration) || T003 (types) - different stacks
```

**Within US1:**
```
T009 || T010 - different type definitions
T018 || T019 || T020 - different components
```

**Within Phase 7:**
```
T056 || T057 || T058 - independent files
```

---

## Parallel Example: Phase 3 (US1) Launch

```bash
# Launch type definitions in parallel:
Task: "Add FTSSearchResultsResponse interface in frontend/src/features/search/types/fts.ts"
Task: "Add FTSTopicResult, FTSMessageResult, FTSAtomResult interfaces in frontend/src/features/search/types/fts.ts"

# Then launch SearchItem components in parallel:
Task: "Create MessageSearchItem component in frontend/src/features/search/components/MessageSearchItem.tsx"
Task: "Create AtomSearchItem component in frontend/src/features/search/components/AtomSearchItem.tsx"
Task: "Create TopicSearchItem component in frontend/src/features/search/components/TopicSearchItem.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (1 hour)
2. Complete Phase 2: Foundational backend (2 hours)
3. Complete Phase 3: User Story 1 - Basic Search (4 hours)
4. **STOP and VALIDATE**: Test search dropdown independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → API returns atoms in search
2. Add US1 → Test dropdown → Deploy (MVP!)
3. Add US2 → Test navigation → Deploy
4. Add US3 → Test empty states → Deploy
5. Add US4 → Test loading states → Deploy
6. Polish phase → Storybook, mobile

### Key Files Changed

**Backend (2 files):**
- `backend/app/api/v1/search.py` - extend FTS
- `backend/alembic/versions/xxx_add_atoms_fts_index.py` - new migration

**Frontend (10+ files):**
- `frontend/src/features/search/types/fts.ts` - new file
- `frontend/src/features/search/api/searchService.ts` - add FTS method
- `frontend/src/features/search/components/SearchBar.tsx` - integrate dropdown
- `frontend/src/features/search/components/SearchDropdown.tsx` - new file
- `frontend/src/features/search/components/MessageSearchItem.tsx` - new file
- `frontend/src/features/search/components/AtomSearchItem.tsx` - new file
- `frontend/src/features/search/components/TopicSearchItem.tsx` - new file
- `frontend/src/features/search/components/SearchEmptyState.tsx` - new file
- `frontend/src/features/search/hooks/useFTSSearch.ts` - new file
- `frontend/src/features/search/utils/highlightRenderer.tsx` - new file

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify Phase 2 backend completion before starting Phase 3
- Use `just typecheck` after every Python change
- Use `npx tsc --noEmit` after every TypeScript change
- shadcn Command component provides keyboard navigation out of the box
- `ts_headline` already returns `<mark>` tags - render with sanitization
