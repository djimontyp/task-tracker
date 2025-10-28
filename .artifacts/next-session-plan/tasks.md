# Next Session Plan: Refactoring + Testing Sprint

**Session Goal:** Підготувати backend до production через рефакторинг та комплексне тестування
**Estimated Effort:** 34-38 годин
**Target Completion:** 2-3 робочі дні (при паралельній делегації)

---

## Phase 1: Backend Refactoring (20 год)

### 1.1 Create BaseCRUD Class (8 год)

**Context:** 9 CRUD сервісів мають ~800 LOC дублювання

**Tasks:**

#### Task 1.1.1: Design BaseCRUD interface
- **Domain:** Backend architecture
- **Estimate:** 1 год
- **Agent:** architecture-guardian
- **Dependencies:** None
- **Acceptance:**
  - Generic BaseCRUD[T] class designed
  - Type-safe create/read/update/delete/list methods
  - Supports SQLModel generics
  - Handles common patterns (pagination, filtering, soft delete)
- **Output:** `backend/app/services/base_crud.py` specification

#### Task 1.1.2: Implement BaseCRUD core
- **Domain:** Backend implementation
- **Estimate:** 2 год
- **Agent:** fastapi-backend-expert
- **Dependencies:** 1.1.1
- **Acceptance:**
  - `BaseCRUD[T: SQLModel]` implemented
  - Async methods: create, get, update, delete, list
  - Pagination support (skip, limit)
  - Type checking passes (`just typecheck`)
- **Output:** `backend/app/services/base_crud.py`

#### Task 1.1.3: Refactor agent_crud to use BaseCRUD
- **Domain:** Backend refactoring
- **Estimate:** 1 год
- **Agent:** fastapi-backend-expert
- **Dependencies:** 1.1.2
- **Acceptance:**
  - `AgentCRUD` extends `BaseCRUD[AgentConfig]`
  - All tests pass
  - LOC reduced by ~90 lines
- **Output:** Updated `backend/app/services/agent_crud.py`

#### Task 1.1.4: Refactor remaining 8 CRUD services
- **Domain:** Backend refactoring
- **Estimate:** 3 год
- **Agent:** fastapi-backend-expert
- **Dependencies:** 1.1.3 (pattern proven)
- **Services:**
  - task_crud → BaseCRUD[TaskConfig]
  - provider_crud → BaseCRUD[LLMProvider]
  - atom_crud → BaseCRUD[Atom]
  - topic_crud → BaseCRUD[Topic]
  - assignment_crud → BaseCRUD[AgentTaskAssignment]
  - proposal_service → BaseCRUD[TaskProposal]
  - analysis_service → BaseCRUD[AnalysisRun]
  - project_service → BaseCRUD[Project]
- **Acceptance:**
  - All 8 services refactored
  - All tests pass (`just test`)
  - Type checking passes
  - **Target LOC reduction:** -700 to -800 lines
- **Output:** 8 updated service files

#### Task 1.1.5: Create BaseCRUD tests
- **Domain:** Testing
- **Estimate:** 1 год
- **Agent:** pytest-test-master
- **Dependencies:** 1.1.4
- **Acceptance:**
  - Test generic CRUD operations
  - Test pagination behavior
  - Test error handling (not found, duplicate)
  - All tests pass
- **Output:** `backend/tests/services/test_base_crud.py`

---

### 1.2 Split Large Services (12 год)

**Context:** 3 god files need modularization

#### Task 1.2.1: Split analysis_service.py (780 LOC → 3 files)
- **Domain:** Backend refactoring
- **Estimate:** 4 год
- **Agent:** fastapi-backend-expert
- **Dependencies:** None (independent from BaseCRUD)
- **Plan:**
  - Extract `AnalysisRunValidator` → `backend/app/services/analysis/validator.py`
  - Extract CRUD → `backend/app/services/analysis/crud.py` (will use BaseCRUD after 1.1)
  - Extract executor → `backend/app/services/analysis/executor.py`
  - Keep main service as orchestrator
- **Acceptance:**
  - 3 focused modules created
  - All imports updated (4 API files)
  - Tests pass
  - Type checking passes
- **Output:**
  - `backend/app/services/analysis/validator.py`
  - `backend/app/services/analysis/crud.py`
  - `backend/app/services/analysis/executor.py`
  - `backend/app/services/analysis/__init__.py`

#### Task 1.2.2: Split knowledge_extraction_service.py (675 LOC → 3 files)
- **Domain:** Backend refactoring
- **Estimate:** 4 год
- **Agent:** fastapi-backend-expert
- **Dependencies:** None
- **Plan:**
  - Extract Pydantic AI agents → `backend/app/services/knowledge/agents.py`
  - Extract orchestration → `backend/app/services/knowledge/orchestrator.py`
  - Keep schemas separate
- **Acceptance:**
  - 3 focused modules
  - All imports updated
  - Tests pass
- **Output:**
  - `backend/app/services/knowledge/agents.py`
  - `backend/app/services/knowledge/orchestrator.py`
  - `backend/app/services/knowledge/__init__.py`

#### Task 1.2.3: Split versioning_service.py (653 LOC → 4 files)
- **Domain:** Backend refactoring
- **Estimate:** 4 год
- **Agent:** fastapi-backend-expert
- **Dependencies:** None
- **Plan:**
  - Extract topic versioning → `backend/app/services/versioning/topic.py`
  - Extract atom versioning → `backend/app/services/versioning/atom.py`
  - Extract diff service → `backend/app/services/versioning/diff.py`
  - Keep main service as coordinator
- **Acceptance:**
  - 4 focused modules
  - All imports updated
  - Tests pass
- **Output:**
  - `backend/app/services/versioning/topic.py`
  - `backend/app/services/versioning/atom.py`
  - `backend/app/services/versioning/diff.py`
  - `backend/app/services/versioning/__init__.py`

---

## Phase 2: Complete Backend Testing (8-10 год)

**Context:** 72 тести залишилось після нашої сесії (було 134)

### 2.1 Fix Remaining Contract Tests (~20 тестів, 2 год)

#### Task 2.1.1: Fix agent contract tests
- **Domain:** Testing
- **Estimate:** 1 год
- **Agent:** pytest-test-master
- **Dependencies:** Phase 1 (якщо BaseCRUD змінює API)
- **Issues:**
  - API path mismatches
  - Response structure changes after BaseCRUD
- **Files:**
  - `test_agent_tasks_get.py`
  - `test_agent_tasks_post.py`
  - `test_agents_delete.py`
  - `test_agents_get.py`
  - `test_agents_post.py`
  - `test_agents_put.py`
- **Acceptance:** All agent contract tests pass

#### Task 2.1.2: Fix monitoring contract tests
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master
- **Dependencies:** None
- **Files:**
  - `test_monitoring_api.py` (3 tests)
- **Acceptance:** Monitoring endpoint tests pass

#### Task 2.1.3: Fix remaining provider/task contract tests
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master
- **Dependencies:** None
- **Files:**
  - `test_providers_get.py` (response format)
  - `test_tasks_get.py` (3 tests)
  - `test_tasks_put.py` (3 tests - 405 errors)
- **Acceptance:** All contract tests pass or documented as expected failures

---

### 2.2 Fix API Tests (~30 тестів, 3-4 год)

#### Task 2.2.1: Fix knowledge extraction API tests
- **Domain:** Testing
- **Estimate:** 2 год
- **Agent:** pytest-test-master + fastapi-backend-expert
- **Dependencies:** 1.2.2 (knowledge service split)
- **Issues:**
  - NameError: `agent_config` undefined (16 tests)
  - Request validation errors
- **Files:**
  - `test_knowledge_extraction.py` (15 tests)
- **Acceptance:** All knowledge extraction API tests pass

#### Task 2.2.2: Fix embeddings API tests
- **Domain:** Testing
- **Estimate:** 1 год
- **Agent:** pytest-test-master
- **Dependencies:** None
- **Files:**
  - `test_embeddings.py` (6 tests - 422 validation errors)
- **Acceptance:** Embeddings API tests pass

#### Task 2.2.3: Fix projects/proposals/stats tests
- **Domain:** Testing
- **Estimate:** 1 год
- **Agent:** pytest-test-master
- **Dependencies:** 1.1.4 (BaseCRUD may affect queries)
- **Files:**
  - `test_projects.py` (3 tests - count mismatches)
  - `test_proposals.py` (3 tests - count mismatches)
  - `test_stats.py` (2 tests - DateTime constraints)
- **Acceptance:** Count assertions pass, DateTime issues resolved

---

### 2.3 Fix Background Task Tests (~7 тестів, 2 год)

#### Task 2.3.1: Fix embedding background tasks
- **Domain:** Testing
- **Estimate:** 1.5 год
- **Agent:** pytest-test-master + fastapi-backend-expert
- **Dependencies:** None
- **Files:**
  - `test_embedding_tasks.py` (6 tests)
- **Issues:**
  - TaskIQ mocking issues
  - Batch task handling
- **Acceptance:** All embedding task tests pass

#### Task 2.3.2: Fix retry mechanism test
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master
- **Dependencies:** None
- **Files:**
  - `test_retry_mechanism.py` (1 test - DLQ filtering)
- **Acceptance:** DLQ filtering test passes

---

### 2.4 Verification & Coverage (1-2 год)

#### Task 2.4.1: Run full test suite verification
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master
- **Dependencies:** ALL Phase 2 tasks
- **Commands:**
  ```bash
  just test
  just typecheck
  ```
- **Acceptance:**
  - **Target:** 0-5 failing tests (98%+ pass rate)
  - Type checking passes
  - Coverage report generated

#### Task 2.4.2: Generate coverage report
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master
- **Dependencies:** 2.4.1
- **Commands:**
  ```bash
  uv run pytest --cov=app --cov-report=html --cov-report=term
  ```
- **Acceptance:**
  - Coverage ≥75% overall
  - Critical paths (auth, tasks, knowledge) ≥85%
  - HTML report in `htmlcov/`

#### Task 2.4.3: Document remaining known issues
- **Domain:** Documentation
- **Estimate:** 30 хв
- **Agent:** documentation-expert
- **Dependencies:** 2.4.1
- **Acceptance:**
  - List of any remaining failing tests (<5)
  - Root cause analysis
  - Workaround or fix plan
- **Output:** `.artifacts/testing/known-issues.md`

---

## Phase 3: E2E Playwright Tests (6-8 год)

**Context:** Playwright infrastructure ready, 3 stub tests need implementation

### 3.1 Implement Telegram → Topic E2E Test (2-3 год)

#### Task 3.1.1: Setup E2E test data and fixtures
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master
- **Dependencies:** Phase 2 complete (stable backend)
- **Acceptance:**
  - Test user created
  - Test Telegram webhook payload prepared
  - LLM mocks configured
- **Output:** `tests/e2e/fixtures/telegram_fixtures.ts`

#### Task 3.1.2: Implement webhook → scoring → extraction flow
- **Domain:** E2E Testing
- **Estimate:** 1.5 год
- **Agent:** Playwright specialist (or fastapi-backend-expert with Playwright)
- **Dependencies:** 3.1.1
- **Test Flow:**
  1. Navigate to dashboard
  2. Send webhook POST with Telegram message
  3. Wait for scoring task completion (polling/WebSocket)
  4. Verify message scored correctly (importance level)
  5. Wait for knowledge extraction task
  6. Verify Topic/Atom created in database
  7. Verify Topic visible in dashboard UI
- **Acceptance:**
  - Test passes for Ukrainian message
  - Test passes for English message
  - Both flows complete in <10 seconds
- **Output:** `tests/e2e/telegram-to-topic.spec.ts` (implemented)

#### Task 3.1.3: Add visual regression checks
- **Domain:** E2E Testing
- **Estimate:** 30 хв
- **Agent:** Playwright specialist
- **Dependencies:** 3.1.2
- **Acceptance:**
  - Screenshot comparison for dashboard
  - Topic card rendering verified
  - Atom list rendering verified
- **Output:** Visual regression baseline images

---

### 3.2 Implement Analysis Run Lifecycle Test (2-3 год)

#### Task 3.2.1: Create analysis run via API
- **Domain:** E2E Testing
- **Estimate:** 1 год
- **Agent:** Playwright specialist
- **Dependencies:** Phase 2 complete
- **Test Flow:**
  1. Login to dashboard
  2. Navigate to Analysis page
  3. Click "Create Analysis Run"
  4. Fill form (trigger type, message filters)
  5. Submit form
  6. Verify run created with status=pending
- **Acceptance:**
  - Run appears in analysis list
  - Status badge shows "pending"
- **Output:** First half of `tests/e2e/analysis-run.spec.ts`

#### Task 3.2.2: Monitor state transitions via WebSocket
- **Domain:** E2E Testing
- **Estimate:** 1 год
- **Agent:** Playwright specialist
- **Dependencies:** 3.2.1
- **Test Flow:**
  1. Subscribe to WebSocket updates for run
  2. Trigger run execution (via API or UI)
  3. Assert state transitions: pending → running → completed
  4. Verify status badge updates in real-time
  5. Verify proposal count increases
- **Acceptance:**
  - All state transitions observed
  - WebSocket updates received
  - No console errors
- **Output:** Complete `tests/e2e/analysis-run.spec.ts`

#### Task 3.2.3: Test error states (cancelled, failed)
- **Domain:** E2E Testing
- **Estimate:** 30 хв
- **Agent:** Playwright specialist
- **Dependencies:** 3.2.2
- **Test Flow:**
  1. Create run with invalid config (trigger failure)
  2. Verify status=failed
  3. Create run and cancel it manually
  4. Verify status=cancelled
- **Acceptance:**
  - Error states handled gracefully
  - Error messages displayed in UI
- **Output:** Error handling tests in `analysis-run.spec.ts`

---

### 3.3 Implement Accessibility Compliance Test (2 год)

#### Task 3.3.1: Keyboard navigation tests
- **Domain:** E2E Testing (Accessibility)
- **Estimate:** 1 год
- **Agent:** ux-ui-design-expert + Playwright
- **Dependencies:** None (can run in parallel)
- **Test Flow:**
  1. Navigate dashboard using only Tab key
  2. Verify focus order logical (top→bottom, left→right)
  3. Test Enter/Space on buttons/links
  4. Test Escape on modals/dropdowns
  5. Verify skip-to-content link
- **Acceptance:**
  - All interactive elements reachable via keyboard
  - Focus visible on all elements
  - Keyboard shortcuts work (Esc, Enter, Space, Arrow keys)
- **Output:** `tests/e2e/accessibility.spec.ts` (keyboard tests)

#### Task 3.3.2: ARIA and semantic HTML audit
- **Domain:** E2E Testing (Accessibility)
- **Estimate:** 30 хв
- **Agent:** ux-ui-design-expert
- **Dependencies:** None
- **Test Checks:**
  - All buttons have `aria-label` or visible text
  - All form inputs have associated `<label>` or `aria-labelledby`
  - Landmarks: `<nav>`, `<main>`, `<aside>` present
  - Headings hierarchy correct (h1 → h2 → h3, no skips)
- **Acceptance:**
  - WCAG 2.1 AA compliance verified
  - No accessibility violations in axe-core scan
- **Output:** Accessibility audit tests

#### Task 3.3.3: Color contrast verification
- **Domain:** E2E Testing (Accessibility)
- **Estimate:** 30 хв
- **Agent:** ux-ui-design-expert
- **Dependencies:** None
- **Test Checks:**
  - Text contrast ≥4.5:1 (normal text)
  - Large text contrast ≥3:1 (18pt+ or 14pt+ bold)
  - Interactive elements contrast ≥3:1
  - Focus indicators contrast ≥3:1
- **Tools:** axe-core, Pa11y
- **Acceptance:**
  - All contrast checks pass WCAG AA
  - No contrast violations reported
- **Output:** Color contrast tests in `accessibility.spec.ts`

---

## Phase 4: Final Verification & Documentation (2 год)

### 4.1 Integration Smoke Tests

#### Task 4.1.1: Run full integration smoke test
- **Domain:** Testing
- **Estimate:** 30 хв
- **Agent:** pytest-test-master + Playwright
- **Dependencies:** Phase 1, 2, 3 complete
- **Test Flow:**
  1. Start all services (`just services-dev`)
  2. Run backend tests (`just test`)
  3. Run E2E tests (`npm run test:e2e`)
  4. Verify no regressions from refactoring
- **Acceptance:**
  - Backend tests: 98%+ pass rate
  - E2E tests: 3/3 passing
  - Services healthy (no crashes)

---

### 4.2 Documentation & Handoff

#### Task 4.2.1: Update NEXT_SESSION_TODO.md
- **Domain:** Documentation
- **Estimate:** 30 хв
- **Agent:** documentation-expert
- **Dependencies:** 4.1.1
- **Acceptance:**
  - Mark Phase 1, 2, 3 as completed
  - Update production readiness score (6/10 → 7.5/10)
  - Document next priorities (CI/CD, production deployment)
- **Output:** Updated `NEXT_SESSION_TODO.md`

#### Task 4.2.2: Create session summary report
- **Domain:** Documentation
- **Estimate:** 1 год
- **Agent:** documentation-expert
- **Dependencies:** 4.1.1
- **Content:**
  - Refactoring achievements (LOC reduced, services modularized)
  - Testing achievements (pass rate improvement, E2E coverage)
  - Code quality metrics (type safety, test coverage)
  - Next steps (production deployment ready)
- **Acceptance:**
  - Comprehensive report (500-1000 words)
  - Metrics dashboard included
  - Recommendations for production
- **Output:** `.artifacts/session-{date}-refactoring-testing-sprint.md`

---

## Execution Strategy

### Parallel Execution Opportunities

**Parallel Track 1: Refactoring (Phase 1)**
- Task 1.1.1 → 1.1.2 → 1.1.3 → 1.1.4 → 1.1.5 (sequential)
- Task 1.2.1, 1.2.2, 1.2.3 can run in parallel (independent)

**Parallel Track 2: Backend Testing (Phase 2)**
- Start after Phase 1.1 completes (BaseCRUD stable)
- Track 2.1, 2.2, 2.3 can partially overlap

**Parallel Track 3: E2E Testing (Phase 3)**
- Start after Phase 2 completes (backend stable)
- Task 3.1, 3.2, 3.3 can run in parallel (independent)

**Optimal Execution:**
```
Day 1 (8-10h):
  Morning: 1.1.1 → 1.1.2 → 1.1.3 (BaseCRUD foundation)
  Afternoon: 1.1.4 (parallel refactoring of 8 services)
  Evening: 1.1.5 + Start 1.2.1, 1.2.2, 1.2.3 in parallel

Day 2 (8-10h):
  Morning: Finish 1.2.x + Start 2.1, 2.2, 2.3 in parallel
  Afternoon: Continue Phase 2 testing
  Evening: 2.4 verification + Start Phase 3

Day 3 (8-10h):
  Morning: 3.1, 3.2, 3.3 in parallel (E2E tests)
  Afternoon: 4.1 integration smoke tests
  Evening: 4.2 documentation
```

---

## Agent Assignment

| Phase | Primary Agent | Support Agents |
|-------|---------------|----------------|
| 1.1 BaseCRUD | fastapi-backend-expert | architecture-guardian, pytest-test-master |
| 1.2 Split Services | fastapi-backend-expert | - |
| 2.1-2.3 Backend Tests | pytest-test-master | fastapi-backend-expert, database-reliability-engineer |
| 2.4 Verification | pytest-test-master | - |
| 3.1-3.3 E2E Tests | Playwright specialist | ux-ui-design-expert |
| 4.1-4.2 Finalization | documentation-expert | pytest-test-master |

---

## Success Metrics

### Phase 1 Success Criteria:
- ✅ BaseCRUD implemented and tested
- ✅ 9 services refactored (-700 to -800 LOC)
- ✅ 3 large services split (analysis, knowledge, versioning)
- ✅ Type checking passes
- ✅ All tests pass

### Phase 2 Success Criteria:
- ✅ Backend test pass rate: 92.3% → 98%+
- ✅ Failing tests: 72 → <5
- ✅ Test coverage: ≥75% overall, ≥85% critical paths
- ✅ Type checking: 0 errors

### Phase 3 Success Criteria:
- ✅ 3 E2E tests implemented and passing
- ✅ WCAG 2.1 AA compliance verified
- ✅ Visual regression baselines created
- ✅ No console errors in E2E runs

### Overall Success:
- ✅ Production Readiness: 6/10 → 7.5/10
- ✅ Code Quality: Improved maintainability, reduced duplication
- ✅ Test Confidence: Comprehensive backend + E2E coverage
- ✅ Ready for CI/CD setup and production deployment

---

## Risk Mitigation

**Risk 1: BaseCRUD breaks existing tests**
- Mitigation: Implement incrementally (one service at a time)
- Rollback: Keep old CRUD services until all tests pass

**Risk 2: Large service splits introduce regressions**
- Mitigation: Keep backward-compatible imports via `__init__.py`
- Verification: Run tests after each split

**Risk 3: E2E tests flaky due to async timing**
- Mitigation: Use Playwright's auto-waiting features
- Add explicit waits for TaskIQ background tasks

**Risk 4: Time overrun**
- Mitigation: Prioritize Phase 1 + 2 over Phase 3
- Fallback: Complete BaseCRUD + backend tests, defer E2E to next session

---

## Notes

- Phase 1 and 2 are **higher priority** than Phase 3 (E2E tests nice-to-have but not blocking)
- BaseCRUD pattern proven effective in other projects (Django, Rails, Laravel)
- After this sprint, project ready for production deployment prep (CI/CD, Hostinger)
- Estimated **production readiness after completion: 7.5/10** (up from 6/10)
