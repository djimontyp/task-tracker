# Test Coverage Plan - Pulse Radar

**Date:** 2025-11-30
**Status:** Planning Phase
**Goal:** Cover MVP features with comprehensive tests

---

## Current State

### Backend (881 tests) - GOOD
- Contract tests: agents, providers, tasks, topics
- API tests: atoms, embeddings, semantic_search, knowledge_extraction
- Service tests: 13 services covered
- Integration: LLM, vector operations, scenarios

### Frontend (5 unit + 3 E2E) - CRITICAL GAP
- Unit: AdminPanel, BulkActionsToolbar, useMultiSelect, useAdminMode, useKeyboardShortcut
- E2E: accessibility.spec.ts (comprehensive), analysis-run.spec.ts, telegram-to-topic.spec.ts

---

## Priority Matrix

### P0 - Critical (MVP Core Flow)
These tests MUST exist to prevent regressions in core functionality.

| Test | Type | Feature | Est. Time |
|------|------|---------|-----------|
| Health API | Backend | F019 | 30min |
| Dashboard E2E | E2E | F006 | 2h |
| Messages Flow E2E | E2E | F002 | 2h |
| Topics CRUD E2E | E2E | F004 | 1.5h |
| Settings Page E2E | E2E | F030 | 1h |

### P1 - High (MVP Supporting)
Important for stability, can be done after P0.

| Test | Type | Feature | Est. Time |
|------|------|---------|-----------|
| Webhook Integration | Backend | F001 | 1h |
| TopicsPage unit | Frontend | F004 | 1h |
| MessagesPage unit | Frontend | F002 | 1h |
| SettingsPage unit | Frontend | F030 | 1h |
| DataTable component | Frontend | Shared | 2h |

### P2 - Medium (Quality)
Nice to have, improves maintainability.

| Test | Type | Feature | Est. Time |
|------|------|---------|-----------|
| DashboardPage unit | Frontend | F006 | 1.5h |
| ActivityHeatmap unit | Frontend | F006 | 45min |
| TopicCard unit | Frontend | F004 | 30min |
| useWebSocket hook | Frontend | Shared | 1h |
| API services unit | Frontend | All | 2h |

### P3 - Low (Nice to Have)
Can be added incrementally.

| Test | Type | Feature | Est. Time |
|------|------|---------|-----------|
| AtomCard unit | Frontend | F005 | 30min |
| ValidationStatus unit | Frontend | F008 | 30min |
| Zustand stores | Frontend | All | 1.5h |
| Theme switching E2E | E2E | F031 | 45min |

---

## Implementation Plan

### Phase 1: Backend Gaps (Day 1)
```
[ ] tests/api/v1/test_health.py (F019)
[ ] tests/integration/test_webhook_full_flow.py (F001)
```

### Phase 2: E2E Core Flows (Day 1-2)
```
[ ] frontend/tests/e2e/dashboard.spec.ts (F006)
[ ] frontend/tests/e2e/messages.spec.ts (F002)
[ ] frontend/tests/e2e/topics.spec.ts (F004)
[ ] frontend/tests/e2e/settings.spec.ts (F030)
```

### Phase 3: Frontend Unit Tests (Day 2-3)
```
[ ] src/pages/MessagesPage/MessagesPage.test.tsx
[ ] src/pages/TopicsPage/TopicsPage.test.tsx
[ ] src/pages/SettingsPage/SettingsPage.test.tsx
[ ] src/shared/components/DataTable/DataTable.test.tsx
```

### Phase 4: Component Tests (Day 3-4)
```
[ ] src/features/topics/components/TopicCard.test.tsx
[ ] src/features/messages/hooks/useMessagesFeed.test.ts
[ ] src/shared/components/ActivityHeatmap/ActivityHeatmap.test.tsx
```

---

## Test Patterns

### Backend (pytest)
```python
# Contract test pattern
@pytest.mark.asyncio
async def test_health_returns_healthy(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Frontend Unit (Vitest + RTL)
```typescript
// Component test pattern
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('TopicCard', () => {
  it('renders topic name', () => {
    render(<TopicCard topic={mockTopic} />)
    expect(screen.getByText('Test Topic')).toBeInTheDocument()
  })
})
```

### E2E (Playwright)
```typescript
// E2E flow pattern
test.describe('Messages Page', () => {
  test('should display message list', async ({ page }) => {
    await page.goto('/messages')
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0)
  })
})
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Backend tests | 881 | 900+ |
| Frontend unit | 5 | 25+ |
| E2E specs | 3 | 8+ |
| MVP feature coverage | 60% | 100% |

---

## Risks & Mitigations

1. **Risk:** E2E tests flaky due to data dependency
   **Mitigation:** Use `just db-full-seed` before E2E runs, consider test fixtures

2. **Risk:** Frontend tests slow CI
   **Mitigation:** Parallelize Vitest, use `--shard` for Playwright

3. **Risk:** API changes break contract tests
   **Mitigation:** Run contract tests in CI on every PR

---

## Next Steps

1. Start with `test_health.py` (quick win, F019)
2. Create E2E spec for Dashboard (F006)
3. Add unit tests for DataTable (most reused component)
4. Iterate on remaining P0 items

---

*Generated: 2025-11-30*
*Source: `.artifacts/stabilization.json`*