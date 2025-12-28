# Testing Strategy

> "Якщо UI зламається — тест ПОВИНЕН впасти. Якщо тест не впав при поломці — тест поганий."

## Philosophy

**Core Principle**: Практичне тестування з фокусом на швидкий фідбек і запобігання регресіям.

**Не тестуємо для галочки** — кожен тест має виявляти реальні проблеми. Якщо тест не спіймав баг — він марний.

---

## Testing Pyramid

```
         ┌──────────────────┐
         │   E2E (Manual)   │  ← Critical user journeys
         │   Playwright     │     5-10 scenarios
         └──────────────────┘
               ↑
       ┌──────────────────────┐
       │   Component (Auto)   │  ← Storybook interactions
       │   Storybook Tests    │     280+ stories
       └──────────────────────┘
               ↑
         ┌────────────────────────┐
         │  Integration (Auto)    │  ← API contracts
         │  API + Frontend State  │     Contract tests
         └────────────────────────┘
               ↑
           ┌──────────────────────────┐
           │    Unit (Auto)            │  ← Business logic
           │  pytest + Vitest          │     996 backend + 51 frontend
           └──────────────────────────┘
```

**Trade-off**: Більше unit/component тестів → швидший feedback. Менше E2E → дешевше підтримка.

---

## Test Layers

### 1. Unit Tests (Фундамент)

**Backend: pytest (996 тестів, 80%+ coverage)**

**Що тестуємо:**
- ✅ Бізнес-логіка сервісів (KnowledgeOrchestrator, RuleEngineService)
- ✅ Utility функції (encryption, validation)
- ✅ Pydantic models (serialization, validation)
- ✅ Алгоритми (scoring, embeddings)

**Приклад структури:**
```
backend/tests/
├── unit/
│   ├── llm/application/
│   │   ├── test_provider_resolver.py
│   │   ├── test_llm_service.py
│   │   └── test_framework_registry.py
│   └── services/
├── background/
│   └── test_embedding_tasks.py
└── database/
    └── test_pgvector_setup.py
```

**Commands:**
```bash
just test                    # Run all tests
just test-atoms              # Run specific domain
pytest --cov=app --cov-report=term-missing  # Coverage
```

---

**Frontend: Vitest (51 тестів, 96% pass)**

**Що тестуємо:**
- ✅ Custom hooks (useKeyboardShortcut, useMultiSelect, useAdminMode)
- ✅ Utilities (iconMapping, token helpers)
- ✅ State management (store actions)
- ❌ NOT testing components here — використовуй Storybook!

**Приклад:**
```typescript
// ✅ GOOD — testing hook behavior
describe('useKeyboardShortcut', () => {
  it('should call callback when correct keys pressed', () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut({
      key: 'a', metaKey: true, callback
    }))

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a', metaKey: true
    }))

    expect(callback).toHaveBeenCalledTimes(1)
  })
})
```

**Приклад існуючих тестів:**
- `useKeyboardShortcut.test.ts` — 8 test cases (edge cases, cleanup)
- `useMultiSelect.test.ts` — bulk selection logic
- `useAdminMode.test.ts` — admin mode toggle

**Commands:**
```bash
cd frontend && npm run test:run     # Run once
cd frontend && npm run test         # Watch mode
```

**Coverage Goal**: 60% (current: ~30%)

---

### 2. Component Tests (Storybook-first)

**Storybook: 280+ stories (Visual + Interaction Tests)**

**Коли Storybook достатньо:**

| Зміна | Тест в Storybook? | Чому? |
|-------|-------------------|-------|
| Новий Button variant | ✅ YES | Візуальні зміни, немає API |
| HexColorPicker | ✅ YES | Самодостатній компонент |
| Badge з іконкою | ✅ YES | Design system compliance |
| EmptyState patterns | ✅ YES | Різні варіанти без state |
| FormField validation | ✅ YES | Контрольована форма |
| MetricCard layout | ✅ YES | Props-driven, no side effects |

**Коли Storybook НЕ достатньо:**

| Зміна | Потрібно ще | Чому? |
|-------|-------------|-------|
| TopicCard з real API | ⚠️ Integration Test | WebSocket updates, real data |
| SearchBar з query | ⚠️ Integration Test | TanStack Query, debounce |
| MessageCard з actions | ⚠️ E2E | Approve/reject mutations |
| DataTable з filters | ⚠️ Storybook + Integration | Storybook для UI, API для data |

**Структура:**
```
src/
├── shared/ui/
│   ├── button.tsx
│   └── button.stories.tsx          # 10+ variants (default, destructive...)
├── shared/patterns/
│   ├── CardWithStatus.tsx
│   └── CardWithStatus.stories.tsx  # All status states
└── features/topics/
    ├── HexColorPicker.tsx
    └── HexColorPicker.stories.tsx  # Color picker interactions
```

**Interaction Tests (Storybook):**
```tsx
export const WithInteraction: Story = {
  args: { onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    await userEvent.click(button)
    expect(args.onClick).toHaveBeenCalled()
  },
}
```

**Commands:**
```bash
just storybook                  # Start Storybook dev server
just storybook-test             # Run interaction tests
just story-check                # Coverage audit
```

**Coverage Goal**: All components (current: ~280 stories)

---

### 3. Integration Tests (API ↔ Frontend)

**Contract Testing (TypeScript types sync)**

**Workflow:**
```
Backend (FastAPI)
    ↓ export OpenAPI schema
contracts/openapi.json
    ↓ generate TypeScript types
Frontend (src/shared/api/)
```

**Commands:**
```bash
just api-export      # Export OpenAPI from backend
just api-generate    # Generate TS types
just api-sync        # Full sync (export + generate)
```

**Критичність**: Breaking changes = compile error (TypeScript fails).

**Приклад:**
```typescript
// Auto-generated from OpenAPI
interface Atom {
  id: string
  title: string
  content: string
  atom_type: 'TASK' | 'IDEA' | 'QUESTION' | 'DECISION' | 'INSIGHT'
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
}
```

**Якщо backend змінив поле → frontend не скомпілюється = швидке виявлення.**

---

**API Integration Tests (Backend)**

**Що тестуємо:**
- ✅ Endpoint responses (status codes, schemas)
- ✅ CRUD operations (create → read → update → delete)
- ✅ Authorization (permissions, roles)
- ✅ WebSocket events (message topics, payloads)

**Приклад:**
```python
def test_create_atom_returns_201(client):
    response = client.post("/api/v1/atoms", json={
        "title": "Test Atom",
        "content": "Test content",
        "atom_type": "TASK"
    })
    assert response.status_code == 201, f"Failed: {response.json()}"
    assert response.json()["title"] == "Test Atom"
```

**Coverage Goal**: 80%+ (backend API endpoints)

---

**State Integration Tests (Frontend)**

**Що тестуємо:**
- ⚠️ TanStack Query invalidation (WebSocket → refetch)
- ⚠️ Zustand store updates (actions → state changes)
- ⚠️ Complex forms з validation (react-hook-form + zod)

**Приклад:**
```typescript
it('should invalidate queries on WebSocket message', async () => {
  const queryClient = new QueryClient()
  const ws = mockWebSocket()

  // Simulate WebSocket message
  ws.send({ topic: 'topics', event: 'topic_created' })

  // Verify query invalidation
  const { result } = renderHook(() => useTopics(), {
    wrapper: createWrapper(queryClient)
  })

  await waitFor(() => {
    expect(result.current.isRefetching).toBe(true)
  })
})
```

**Coverage Goal**: Critical flows (Dashboard updates, Message feed)

---

### 4. E2E Tests (Critical User Journeys)

**Playwright: 13 specs (17 test files)**

**Що тестуємо:**
- ✅ Critical paths (Telegram → Topic → Atoms)
- ✅ Multi-page flows (Dashboard → Messages → Topic Detail)
- ✅ Admin workflows (Analysis Run → Review → Approve)
- ✅ Accessibility (keyboard navigation, ARIA labels)
- ✅ Visual regression (screenshot comparison)

**Test Structure:**
```
frontend/tests/e2e/
├── telegram-to-topic.spec.ts       # Full ingestion flow
├── analysis-run.spec.ts            # AI pipeline
├── dashboard.spec.ts               # Main page functionality
├── messages.spec.ts                # Message feed + filters
├── topics.spec.ts                  # Topics CRUD
├── accessibility.spec.ts           # Keyboard navigation
├── a11y/                           # Accessibility audits
│   ├── dashboard.a11y.spec.ts
│   ├── messages.a11y.spec.ts
│   ├── settings.a11y.spec.ts
│   └── topics.a11y.spec.ts
└── visual/                         # Screenshot tests
    ├── dashboard-visual.spec.ts
    ├── navbar-visual.spec.ts
    └── searchbar-visual.spec.ts
```

**Critical Paths (приклади):**

**1. Telegram Ingestion → Topic Assignment**
```typescript
test('Telegram message → AI extraction → Topic created', async ({ page }) => {
  // 1. Send Telegram webhook
  await sendTelegramMessage('/webhook/telegram', {
    message: { text: 'Bug in auth flow' }
  })

  // 2. Wait for extraction
  await page.goto('/messages')
  await expect(page.getByText('Bug in auth flow')).toBeVisible()

  // 3. Verify topic assignment
  await page.goto('/topics')
  await expect(page.getByText('Backend')).toBeVisible()
})
```

**2. Analysis Run → Proposal Review**
```typescript
test('Run analysis → Review proposals → Approve', async ({ page }) => {
  await page.goto('/analysis')
  await page.click('button:has-text("New Run")')

  // Wait for completion (WebSocket update)
  await expect(page.getByText('COMPLETED')).toBeVisible()

  // Review proposals
  await page.goto('/proposals')
  await page.getByRole('checkbox').first().click()
  await page.click('button:has-text("Approve Selected")')

  // Verify approval
  await expect(page.getByText('Approved')).toBeVisible()
})
```

**Commands:**
```bash
just e2e                    # Run all E2E tests (3 browsers)
just e2e-fast               # Chromium only (faster)
just e2e-ui                 # Playwright UI mode
just e2e-install            # Install browsers
```

**Responsive Testing:**
```typescript
test('Dashboard mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/dashboard')

  // Verify stacked layout
  const recentBox = await page.locator('text=Recent Topics').boundingBox()
  const trendingBox = await page.locator('text=Trending Topics').boundingBox()
  expect(trendingBox.y).toBeGreaterThan(recentBox.y)
})
```

**Coverage Goal**: 5-10 critical scenarios (current: 13 specs)

---

## When Storybook is Enough

### Decision Matrix

**Простий тест:**

```
Компонент має:
  ├─ Зовнішні залежності (API, WebSocket, Router)?
  │   YES → Integration/E2E test
  │   NO  → Storybook достатньо
  │
  ├─ Складну state машину (multi-step flow)?
  │   YES → E2E test
  │   NO  → Storybook достатньо
  │
  └─ Тільки візуальні варіації?
      YES → Storybook достатньо
```

### Storybook-first Development

**Workflow:**
1. **Design** → створюємо Storybook story
2. **Variants** → всі можливі стани (loading, error, empty, success)
3. **Interactions** → click, hover, focus (play function)
4. **Visual QA** → перевірка в різних темах (light/dark)
5. **Chromatic** (опціонально) → Visual regression

**Переваги:**
- ✅ Швидкий feedback (без запуску всього app)
- ✅ Ізоляція (без API, без auth, без router)
- ✅ Документація (живий каталог компонентів)
- ✅ Design review (designers перевіряють в Storybook)

**Обмеження:**
- ❌ Не тестує real API responses
- ❌ Не тестує WebSocket updates
- ❌ Не тестує multi-page flows
- ❌ Не тестує browser APIs (localStorage, geolocation)

---

## Practical Checklists

### ✅ New Feature Checklist

**Backend:**
- [ ] Unit tests для бізнес-логіки (services, utils)
- [ ] API integration tests (endpoints, status codes)
- [ ] Contract sync (`just api-sync`)
- [ ] TypeScript types згенеровані

**Frontend:**
- [ ] Storybook stories для нових компонентів
- [ ] Vitest unit tests для hooks/utils
- [ ] Integration test якщо WebSocket/complex state
- [ ] E2E test якщо critical path

**Перевірка:**
- [ ] `just typecheck` пройшов (backend + frontend)
- [ ] `just lint-strict` пройшов (frontend)
- [ ] Storybook stories відображаються коректно
- [ ] E2E tests пройшли (якщо є)

---

### ✅ Bug Fix Checklist

**Обов'язково:**
- [ ] Додати тест що відтворює баг (test fails спочатку)
- [ ] Виправити код
- [ ] Переконатись що тест тепер проходить
- [ ] Перевірити чи не зламали інші тести

**Assertion Messages:**
```python
# ✅ ПРАВИЛЬНО
assert response.status_code == 200, f"API error: {response.json()}"
assert len(atoms) == 3, f"Expected 3 atoms, got {len(atoms)}: {atoms}"

# ❌ НЕПРАВИЛЬНО
assert response.status_code == 200
assert len(atoms) == 3
```

**Якщо баг у UI:**
- [ ] Створити Storybook story з проблемним станом
- [ ] Додати Playwright test якщо multi-step flow

---

### ✅ Component Development Checklist

**Storybook-first:**
1. [ ] Створити `Component.stories.tsx`
2. [ ] Додати `tags: ['autodocs']`
3. [ ] Покрити всі варіанти:
   - [ ] Default state
   - [ ] Loading state
   - [ ] Error state
   - [ ] Empty state
   - [ ] Success state (з даними)
4. [ ] Interaction tests (clicks, hovers, keyboard)
5. [ ] Responsive (mobile + desktop breakpoints)
6. [ ] Accessibility (keyboard navigation, ARIA labels)
7. [ ] Dark mode (перевірити обидві теми)

**Required Providers:**
```typescript
// Якщо використовуєш:
// - useTheme → ThemeProvider
// - useLocation → MemoryRouter
// - useQuery → QueryClientProvider
// - useSidebar → SidebarProvider

const StoryWrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    <ThemeProvider>
      <MemoryRouter initialEntries={['/']}>
        {children}
      </MemoryRouter>
    </ThemeProvider>
  </QueryClientProvider>
)
```

**Coverage Audit:**
```bash
just story-check     # Show components without stories
```

---

### ✅ API Change Checklist

**Backend змінив schema:**
1. [ ] Оновити Pydantic models
2. [ ] Оновити API endpoints
3. [ ] Запустити `just api-export`
4. [ ] Перевірити `contracts/openapi.json`

**Frontend отримує зміни:**
1. [ ] Запустити `just api-generate`
2. [ ] Перевірити TypeScript errors
3. [ ] Оновити компоненти якщо breaking changes
4. [ ] Оновити Storybook stories з новими типами

**Verification:**
```bash
just typecheck           # Backend mypy
just front-typecheck     # Frontend tsc
just api-sync            # Full sync
```

---

## Coverage Goals

| Layer | Current | Target | Priority | Deadline |
|-------|---------|--------|----------|----------|
| **Backend Unit** | 80%+ | 80% | P0 | ✅ Done |
| **Backend API** | ~70% | 80% | P0 | Q1 2025 |
| **Frontend Unit** | ~30% | 60% | P1 | Q2 2025 |
| **Storybook** | 280 | All components | P1 | Q1 2025 |
| **E2E Critical** | 13 specs | 10 scenarios | P2 | Q2 2025 |
| **Visual Regression** | Manual | Chromatic | P3 | Future |

**P0 = Must have, P1 = Should have, P2 = Nice to have, P3 = Future**

---

## Testing Anti-Patterns

### ❌ ЗАБОРОНЕНО

**1. Саботаж тестів:**
```python
# ❌ НЕ РОБИ
@pytest.mark.skip("Test is flaky")
def test_important_feature():
    pass

# ❌ НЕ РОБИ
def test_always_passes():
    assert True  # тест нічого не перевіряє
```

**2. Тести без assertions:**
```typescript
// ❌ НЕ РОБИ
it('should render component', () => {
  render(<Button />)
  // Немає перевірок — тест марний
})

// ✅ ПРАВИЛЬНО
it('should render button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toHaveTextContent('Click me')
})
```

**3. Testing implementation details:**
```typescript
// ❌ НЕ РОБИ
it('should call handleClick when clicked', () => {
  const handleClick = vi.fn()
  render(<Button onClick={handleClick} />)
  // Тестуємо внутрішню імплементацію, а не результат
})

// ✅ ПРАВИЛЬНО
it('should increment counter when clicked', () => {
  render(<Counter />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

**4. Флaky tests (нестабільні):**
```typescript
// ❌ НЕ РОБИ
it('should load data', async () => {
  render(<DataList />)
  await new Promise(resolve => setTimeout(resolve, 1000))
  // Hardcoded timeouts = flaky
})

// ✅ ПРАВИЛЬНО
it('should load data', async () => {
  render(<DataList />)
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

**5. Змінювати assertion щоб тест пройшов:**
```python
# ❌ НЕ РОБИ
# Було:
assert response.status_code == 200
# Тест падає → змінюємо assertion:
assert response.status_code in [200, 201, 500]  # маскує проблему!

# ✅ ПРАВИЛЬНО
# Виправити код щоб повертав 200, а не змінювати assertion
```

---

## Testing Tools

### Backend
- **pytest** 8.3.4 — test runner
- **pytest-cov** — coverage reports
- **pytest-asyncio** — async test support
- **httpx** — async HTTP client for API tests
- **mypy** 1.17 — static type checking

### Frontend
- **Vitest** — unit test runner (Vite-native)
- **Playwright** — E2E testing (cross-browser)
- **Testing Library** 14.3.1 — component testing utilities
- **@storybook/test** — Storybook interaction tests
- **axe-core** (planned) — accessibility testing

---

## CI/CD Integration

**GitHub Actions Workflow (майбутнє):**

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    # Backend
    - name: Backend unit tests
      run: pytest --cov=app --cov-fail-under=80

    # Frontend
    - name: Frontend unit tests
      run: cd frontend && npm run test:run

    # Contract sync
    - name: Verify API contracts
      run: |
        just api-export
        just api-generate
        git diff --exit-code  # Fail if types out of sync

    # E2E (critical paths only)
    - name: E2E tests
      run: just e2e-fast  # Chromium only for CI

    # Storybook tests
    - name: Storybook interaction tests
      run: |
        just storybook-build
        just storybook-test-ci
```

**Pre-commit Hook:**
- ✅ Backend: mypy typecheck
- ✅ Frontend: ESLint + TypeScript
- ⚠️ Tests: Run changed tests only (швидко)

---

## Quick Reference

### Commands Cheatsheet

```bash
# Backend Tests
just test                    # Run all backend tests
just test-atoms              # Run specific domain tests
just typecheck               # mypy type checking

# Frontend Tests
cd frontend && npm run test:run        # Vitest unit tests
just front-typecheck                   # TypeScript check
just lint-strict                       # ESLint strict mode

# Storybook
just storybook                         # Start dev server
just storybook-test                    # Run interaction tests
just story-check                       # Coverage audit

# E2E
just e2e                               # All browsers
just e2e-fast                          # Chromium only
just e2e-ui                            # Playwright UI

# Contracts
just api-sync                          # Export + generate
```

---

## FAQ

### Q: Коли писати unit test, а коли Storybook story?

**A:**
- **Unit test** — для hooks, utilities, бізнес-логіки (чиста функція, без UI)
- **Storybook** — для компонентів, візуальних станів, UI взаємодій

**Приклад:**
```
useKeyboardShortcut hook → Vitest unit test
Button з variants → Storybook story
SearchBar з debounce → Storybook + Integration test
```

---

### Q: Чи треба тестувати КОЖЕН компонент в Storybook?

**A:** Так, але приоритизуй:

**P0 (критичні):**
- Shared UI components (button, input, card...)
- Business components (DataTable, MetricCard...)
- Feature components з кількома варіантами

**P1 (важливі):**
- Page-specific components
- Layout components

**P2 (nice to have):**
- One-off components
- Trivial wrappers

---

### Q: Якщо Storybook story працює, чи потрібен E2E test?

**A:** Залежить від flow:

**Storybook достатньо:**
- Компонент не залежить від API
- Немає multi-step flow
- Візуальні варіації

**Потрібен E2E:**
- Critical user journey (Telegram → Topic)
- Multi-page interaction
- Real-time updates (WebSocket)
- Авторизація/права доступу

---

### Q: Як тестувати WebSocket updates?

**A:** Комбінація:

**1. Backend unit test** — verify message payload
**2. Frontend integration test** — mock WebSocket, verify query invalidation
**3. E2E test** — real WebSocket, verify UI updates

**Приклад:**
```typescript
// Integration test
it('should refetch on WebSocket message', async () => {
  const queryClient = new QueryClient()
  mockWebSocket.send({ topic: 'topics', event: 'created' })

  await waitFor(() => {
    expect(queryClient.isFetching({ queryKey: ['topics'] })).toBe(true)
  })
})

// E2E test
test('Real-time topic creation', async ({ page }) => {
  await page.goto('/topics')

  // Trigger WebSocket event (from another tab or API call)
  await triggerTopicCreation()

  // Verify UI updates
  await expect(page.getByText('New Topic')).toBeVisible()
})
```

---

### Q: Як переконатись що тест не стане always-green?

**A:**
1. **Спочатку запусти тест БЕЗ імплементації** — він має провалитись
2. **Реалізуй код**
3. **Тест має пройти**
4. **Зламай код навмисно** — тест має провалитись знову

**Це TDD (Test-Driven Development) цикл: Red → Green → Refactor**

---

### Q: Чи можна skip flaky E2E tests?

**A:** НІ. Flaky test = поганий тест. Варіанти:

**1. Виправити тест:**
- Замінити `setTimeout` на `waitFor`
- Додати proper selectors (aria-label, data-testid)
- Зменшити залежності від timing

**2. Переписати як integration test:**
- Якщо E2E занадто складний — mock API

**3. Видалити тест:**
- Якщо тест не ловить реальні баги — він марний

**ЗАБОРОНЕНО: `@pytest.mark.skip` без плану виправлення!**

---

## Next Steps

**Short-term (Q1 2025):**
- [ ] Storybook coverage audit → 100% shared components
- [ ] Frontend unit tests → 60% coverage (hooks, utils)
- [ ] E2E critical paths → 10 scenarios

**Mid-term (Q2 2025):**
- [ ] CI/CD integration (GitHub Actions)
- [ ] Visual regression testing (Chromatic)
- [ ] Accessibility tests (axe-core in Playwright)

**Long-term (Q3+ 2025):**
- [ ] Performance tests (Lighthouse CI)
- [ ] Contract testing (Pact)
- [ ] Mutation testing (check test quality)

---

## Resources

**Documentation:**
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Storybook Test Runner](https://storybook.js.org/docs/writing-tests/test-runner)

**Internal:**
- `frontend/tests/e2e/` — E2E test examples
- `frontend/src/shared/ui/*.stories.tsx` — Storybook examples
- `backend/tests/` — Backend test structure

---

## Appendix: Test Examples

### Backend Unit Test (Service Layer)

```python
# tests/unit/services/test_knowledge_orchestrator.py
import pytest
from app.services.knowledge_orchestrator import KnowledgeOrchestrator

@pytest.fixture
def orchestrator():
    return KnowledgeOrchestrator()

def test_extract_keywords_from_message(orchestrator):
    message = "Bug in auth flow when user logs in"
    keywords = orchestrator.extract_keywords(message)

    assert "bug" in keywords, f"Expected 'bug' in {keywords}"
    assert "auth" in keywords, f"Expected 'auth' in {keywords}"
    assert len(keywords) >= 2, f"Expected at least 2 keywords, got {len(keywords)}"

def test_score_message_importance(orchestrator):
    high_importance = "CRITICAL: Production down"
    low_importance = "Updated README"

    high_score = orchestrator.score_message(high_importance)
    low_score = orchestrator.score_message(low_importance)

    assert high_score > 0.7, f"Expected high score > 0.7, got {high_score}"
    assert low_score < 0.3, f"Expected low score < 0.3, got {low_score}"
```

---

### Frontend Unit Test (Hook)

```typescript
// src/shared/hooks/useDebounce.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useDebounce } from './useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // Still old value

    // Fast-forward time
    vi.advanceTimersByTime(500)

    await waitFor(() => {
      expect(result.current).toBe('updated')
    })
  })
})
```

---

### Storybook Story with Interaction

```tsx
// src/shared/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { fn, expect, within, userEvent } from '@storybook/test'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: { onClick: fn() },
}
export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { children: 'Click me' },
}

export const WithInteraction: Story = {
  args: {
    children: 'Interactive Button',
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    // Click button
    await userEvent.click(button)

    // Verify onClick was called
    await expect(args.onClick).toHaveBeenCalledTimes(1)
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}
```

---

### E2E Test (Multi-page Flow)

```typescript
// tests/e2e/knowledge-discovery.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Knowledge Discovery Flow', () => {
  test('Telegram → Topic → Atom approval', async ({ page }) => {
    // 1. Start at dashboard
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // 2. Navigate to Messages
    await page.click('a[href="/messages"]')
    await page.waitForURL(/\/messages/)

    // 3. Verify message exists (seeded data)
    const messageCard = page.locator('[data-testid="message-card"]').first()
    await expect(messageCard).toBeVisible()

    // 4. Click topic link
    const topicLink = messageCard.locator('a[href*="/topics/"]')
    await topicLink.click()
    await page.waitForURL(/\/topics\//)

    // 5. Verify topic detail page
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // 6. Check atoms list
    const atomsList = page.locator('[aria-label="Atoms list"]')
    await expect(atomsList).toBeVisible()

    // 7. Approve first atom
    const firstAtom = atomsList.locator('[role="listitem"]').first()
    const approveButton = firstAtom.getByRole('button', { name: /approve/i })

    if (await approveButton.isVisible()) {
      await approveButton.click()

      // Verify success toast
      await expect(page.getByText(/approved/i)).toBeVisible()
    }
  })
})
```

---

**Version**: 1.0
**Last Updated**: 2025-12-28
**Maintainer**: QA Team
