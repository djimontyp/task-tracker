# Tasks: i18n Internationalization

**Input**: Design documents from `/specs/005-i18n/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in spec - test tasks NOT included.

**Organization**: Tasks grouped by user story for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths: `backend/` for Python, `frontend/` for TypeScript

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create base i18n infrastructure

- [X] T001 [P] Install frontend i18n dependencies: `cd frontend && npm install i18next react-i18next i18next-http-backend`
- [X] T002 [P] Install backend language detection: `cd backend && uv add langdetect`
- [X] T003 Create i18n configuration in `frontend/src/i18n/config.ts`
- [X] T004 Create TypeScript type declarations in `frontend/src/i18n/types.ts` (module augmentation)
- [X] T005 Initialize i18n in `frontend/src/index.tsx` (import config)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema changes and base translation files required by ALL user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Add `ui_language` field to User model in `backend/app/models/user.py`
- [X] T007 Add `language` field to ProjectConfig model in `backend/app/models/project_config.py`
- [X] T008 Create Alembic migration for i18n fields: `alembic revision --autogenerate -m "add i18n fields"`
- [X] T009 Apply migration: `alembic upgrade head`
- [X] T010 [P] Add `ui_language` to UserResponse schema in `backend/app/schemas/users.py`
- [X] T011 [P] Add `ui_language` to UserUpdateRequest schema in `backend/app/schemas/users.py`
- [X] T012 [P] Add `language` to ProjectConfig schemas in `backend/app/models/project_config.py` (Create/Update/Public)
- [X] T013 [P] Create base translation file `frontend/public/locales/uk/common.json` (actions, navigation, status, labels)
- [X] T014 [P] Create base translation file `frontend/public/locales/en/common.json` (same structure as uk)
- [X] T015 Add language state to Zustand store in `frontend/src/shared/store/uiStore.ts`
- [X] T016 Create `useLanguage` hook in `frontend/src/shared/hooks/useLanguage.ts`
- [X] T017 Run `just typecheck` to verify backend changes

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - UI Language Selection (Priority: P1)

**Goal**: User can select UI language in Settings and all UI switches instantly without reload

**Independent Test**: Open Settings > General, select language, verify entire UI switches in <100ms without page reload. Close browser, reopen - language persists.

### Implementation for User Story 1

- [X] T018 [P] [US1] Create translation file `frontend/public/locales/uk/settings.json` (tabs, general, language card)
- [X] T019 [P] [US1] Create translation file `frontend/public/locales/en/settings.json`
- [X] T020 [P] [US1] Create translation file `frontend/public/locales/uk/dashboard.json` (page title, metrics, charts)
- [X] T021 [P] [US1] Create translation file `frontend/public/locales/en/dashboard.json`
- [X] T022 [P] [US1] Create translation file `frontend/public/locales/uk/messages.json` (list, filters, modals)
- [X] T023 [P] [US1] Create translation file `frontend/public/locales/en/messages.json`
- [X] T024 [P] [US1] Create translation file `frontend/public/locales/uk/errors.json` (validation, API errors)
- [X] T025 [P] [US1] Create translation file `frontend/public/locales/en/errors.json`
- [X] T026 [US1] Add Language Card (RadioGroup) to `frontend/src/pages/SettingsPage/components/GeneralTab.tsx`
- [X] T027 [US1] Integrate `useTranslation` in SettingsPage components
- [X] T028 [US1] Add debounced backend sync for language preference in `frontend/src/shared/hooks/useLanguage.ts`
- [X] T029 [US1] Update PATCH `/api/v1/users/me` to accept `ui_language` in `backend/app/api/v1/users.py`
- [X] T030 [P] [US1] Create translation file `frontend/public/locales/uk/atoms.json` (type, status, actions, plurals)
- [X] T031 [P] [US1] Create translation file `frontend/public/locales/en/atoms.json`
- [X] T032 [P] [US1] Create translation file `frontend/public/locales/uk/topics.json` (list, detail, filters)
- [X] T033 [P] [US1] Create translation file `frontend/public/locales/en/topics.json`
- [X] T034 [US1] Integrate `useTranslation` in Sidebar navigation in `frontend/src/shared/components/Sidebar/`
- [X] T035 [US1] Integrate `useTranslation` in DashboardPage components
- [X] T036 [US1] Integrate `useTranslation` in MessagesPage components
- [X] T037 [US1] Integrate `useTranslation` in TopicsPage components
- [X] T038 [US1] Integrate `useTranslation` in AtomsPage components
- [X] T039 [US1] Verify language persists in localStorage after browser restart
- [X] T040 [US1] Run `cd frontend && npx tsc --noEmit` to verify frontend types

**Checkpoint**: User Story 1 complete - UI language switching works end-to-end

---

## Phase 4: User Story 2 - Project Language for AI Content (Priority: P2)

**Goal**: Admin can select project language, AI generates atoms/summaries in that language

**Independent Test**: Create project with language "uk", trigger AI extraction, verify atoms have Ukrainian content. Create project with "en", verify English output.

### Implementation for User Story 2

- [X] T041 [P] [US2] Add `prompt_variants` field to AgentConfig in `backend/app/llm/domain/models.py`
- [X] T042 [P] [US2] Create `get_system_prompt(language)` method in AgentConfig
- [X] T043 [US2] Update Classification agent prompts with Ukrainian variant in `backend/app/llm/`
- [X] T044 [US2] Update Extraction agent prompts with Ukrainian variant
- [X] T045 [US2] Update Analysis agent prompts with Ukrainian variant
- [X] T046 [US2] Create `get_extraction_prompt(language)` in `backend/app/services/knowledge/llm_agents.py`
- [X] T047 [US2] Add language selector to project creation form (if onboarding UI exists)
- [X] T048 [US2] Add `langdetect` validation for AI output in `backend/app/services/knowledge/`
- [X] T049 [US2] Implement retry logic with strengthened prompt if wrong language detected
- [X] T050 [US2] Run `just typecheck` to verify backend changes

**Checkpoint**: User Story 2 complete - AI generates content in project language

---

## Phase 5: User Story 3 - Source Messages in Original Language (Priority: P3)

**Goal**: Source messages display in original language without translation

**Independent Test**: Open atom detail with English source message in Ukrainian project, verify source displays in English (original).

### Implementation for User Story 3

- [X] T051 [P] [US3] Create translation file `frontend/public/locales/uk/validation.json` (language mismatch warning)
- [X] T052 [P] [US3] Create translation file `frontend/public/locales/en/validation.json`
- [X] T053 [US3] Add language mismatch badge component in `frontend/src/shared/components/LanguageMismatchBadge.tsx`
- [X] T054 [US3] Integrate badge in AtomDetail component when AI output language differs from project language
- [X] T055 [US3] Ensure source message modal displays original text without translation
- [X] T056 [US3] Run `cd frontend && npx tsc --noEmit` to verify frontend types

**Checkpoint**: User Story 3 complete - sources shown in original language

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T057 [P] Add Ukrainian pluralization rules verification (1/few/many forms in atoms.json)
- [X] T058 [P] Create Storybook story for Language Selector in `frontend/src/pages/SettingsPage/components/GeneralTab.stories.tsx`
- [X] T059 [P] Create Storybook story for LanguageMismatchBadge
- [X] T060 Verify all ~200 UI strings have translations (audit public/locales/)
- [X] T061 Run quickstart.md verification checklist
- [X] T062 Run `just lint` and `just typecheck` for final validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion (can parallel with US1)
- **User Story 3 (Phase 5)**: Depends on Foundational completion (can parallel with US1/US2)
- **Polish (Phase 6)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational - frontend-only, no AI changes
- **User Story 2 (P2)**: Independent after Foundational - backend AI prompts, minimal frontend
- **User Story 3 (P3)**: Independent after Foundational - display logic only

### Within Each Phase

- Translation files (marked [P]) can be created in parallel
- Model changes → Migration → Schema updates (sequential)
- Zustand store → Hook → Component integration (sequential)
- AI prompt variants → Service integration → Validation (sequential)

### Parallel Opportunities

**Phase 1 (Setup):**
```
T001 (npm install) || T002 (uv add)
```

**Phase 2 (Foundational):**
```
T006 + T007 (models) → T008 (migration) → T009 (apply)
T010 || T011 || T012 (schemas - parallel after models)
T013 || T014 (translation files - parallel)
```

**Phase 3 (US1 Translation Files):**
```
T018 || T019 || T020 || T021 || T022 || T023 || T024 || T025 || T030 || T031 || T032 || T033
```

**Phase 4 (US2):**
```
T041 || T042 (AgentConfig changes - parallel)
T043 || T044 || T045 (prompt variants - parallel after T041-T042)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational (T006-T017)
3. Complete Phase 3: User Story 1 (T018-T040)
4. **STOP and VALIDATE**: Test language switching in Settings
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready (~2-3 hours)
2. Add User Story 1 → Test independently → Deploy (MVP!) (~4-5 hours)
3. Add User Story 2 → Test AI output language → Deploy (~3-4 hours)
4. Add User Story 3 → Test source display → Deploy (~2 hours)
5. Polish → Final validation (~1-2 hours)

### Suggested MVP Scope

**Minimum Viable Product = User Story 1 only:**
- Language selector in Settings
- Instant UI switching
- Persistence in localStorage + backend

User Stories 2 & 3 can be delivered incrementally after MVP validation.

---

## Notes

- Ukrainian (uk) is default language - always test uk first
- Use ISO 639-1 codes: `uk` (not `ua`), `en`
- Ukrainian has 3 plural forms (one/few/many) - verify in atoms.json
- AI prompts: native language prompts preferred over English with instruction
- Source messages: NEVER translate - show original text
- Performance target: <100ms language switch
