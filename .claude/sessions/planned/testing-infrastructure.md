# Session: Testing Infrastructure

**Status**: 📅 Planned
**Created**: 2025-10-31
**Last Updated**: 2025-10-31
**Estimated**: 15-20h
**Priority**: 🟡 Medium

## Context

| What | State |
|------|-------|
| Goal | Improve test coverage and reliability |
| Approach | Fix backend tests + add E2E Playwright tests |
| Progress | 0/4 tasks |
| Next | Fix remaining 72 failing backend tests |
| Blocker | None (can run parallel to other work) |

## Tasks

### Backend Tests (8-10h)
- [ ] Fix remaining backend tests - 8-10h
  - **Current state**: 72 failing tests (from 134 after recent session)
  - **Target**: <5 failing, 98%+ pass rate
  - **Focus areas**:
    - Contract tests (API response schemas)
    - API endpoint tests (CRUD operations)
    - Background task tests (TaskIQ workers)
    - Service layer tests (business logic)
  - **Files**: `tests/` directory (all test files)
  - **Approach**:
    1. Group failures by category (contract/API/task/service)
    2. Fix highest-impact failures first
    3. Update fixtures if schema changed
    4. Run `just test` to verify

### E2E Playwright Tests (7-10h)
- [ ] Telegram → Topic E2E test - 2-3h
  - **Scenario**: End-to-end flow from webhook to UI
  - **Steps**:
    1. Simulate Telegram webhook (POST to `/webhook/telegram`)
    2. Verify message saved to database
    3. Trigger scoring task (background)
    4. Trigger knowledge extraction (background)
    5. Wait for topic/atom creation
    6. Verify appears in Dashboard UI
  - **Files**: `tests/e2e/telegram-to-topic.spec.ts`
  - **Coverage**: Webhook → Background tasks → Database → UI

- [ ] Analysis Run Lifecycle E2E test - 2-3h
  - **Scenario**: Analysis run state machine
  - **Steps**:
    1. Create analysis run via API
    2. Verify state: pending → running → completed
    3. Generate proposals
    4. Approve/reject proposals
    5. Verify state transitions in UI
    6. Test error handling (failed state)
  - **Files**: `tests/e2e/analysis-run.spec.ts`
  - **Coverage**: API → State machine → Background tasks → UI

- [ ] Accessibility Compliance E2E test - 2h
  - **Scenario**: WCAG 2.1 AA compliance verification
  - **Tests**:
    1. Keyboard navigation (Tab, Enter, Space, Arrows)
    2. ARIA labels audit (axe-core)
    3. Color contrast verification (WCAG checker)
    4. Focus indicators visible
    5. Screen reader announcements
  - **Files**: `tests/e2e/accessibility.spec.ts`
  - **Coverage**: Full app accessibility audit
  - **Tools**: Playwright + axe-core + WCAG contrast checker

- [ ] E2E test infrastructure - 1h
  - **Setup**:
    - Playwright config
    - Test database seeding
    - Mock Telegram API
    - Cleanup utilities
  - **Files**:
    - `playwright.config.ts`
    - `tests/e2e/setup.ts`
    - `tests/e2e/fixtures/`
  - **Impact**: Reusable test infrastructure

## Next Actions

1. **Backend test fixing** (8-10h)
   - Triage 72 failing tests
   - Group by category
   - Fix high-priority failures
   - Target: <5 failures

2. **E2E test suite** (7-10h)
   - Set up Playwright infrastructure
   - Implement 3 critical E2E tests
   - Integrate with CI/CD

## Success Criteria

- ✅ Backend tests: 72 failing → <5 failing
- ✅ Test pass rate: 92.3% → 98%+
- ✅ 3 E2E tests passing (Telegram→Topic, Analysis Run, Accessibility)
- ✅ No console errors during E2E tests
- ✅ Coverage ≥75% overall, ≥85% critical paths

## Completion Target

**Estimated completion**: 15-20 hours
**Blocking dependencies**: None
**Can be parallelized**: Yes (backend tests + E2E can run separately)

## Test Coverage Goals

### Before
- Backend pass rate: 92.3% (72 failures)
- E2E tests: 0
- Accessibility tests: 0

### After
- Backend pass rate: 98%+ (<5 failures)
- E2E tests: 3 critical paths
- Accessibility: Automated WCAG audit

## Infrastructure Requirements

**Playwright setup**:
- Browser automation (Chromium)
- Test database with seed data
- Mock Telegram API endpoints
- Cleanup between tests

**Tools**:
- Playwright (E2E)
- axe-core (accessibility)
- pytest (backend)
- coverage.py (coverage reports)

---

*Migrated from NEXT_SESSION_TODO.md on 2025-10-31*
