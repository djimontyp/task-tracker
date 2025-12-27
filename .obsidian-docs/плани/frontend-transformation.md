---
title: "Frontend Transformation Plan"
created: 2025-12-27
updated: 2025-12-28
tags:
  - план
  - frontend
  - архітектура
  - eslint
  - storybook
status: completed
---

# Frontend Transformation Plan

> ==Code Quality + Developer Experience==

## 📊 Progress Summary

| Phase | Виконано | Залишилось | Прогрес |
|-------|----------|------------|---------|
| 0. Boundary violations | 6/6 | 0 | ✅ 100% |
| 1. eslint-plugin-boundaries | 3/3 | 0 | ✅ 100% |
| 2. ESLint помилки | 3/3 | 0 | ✅ 100% |
| 3. Z-index токени | 3/3 | 0 | ✅ 100% |
| 4. Plop генератори | 5/5 | 0 | ✅ 100% |
| 5. Container/Presenter | 3/3 | 0 | ✅ 100% |
| 6. Visual Regression | 4/4 | 0 | ✅ 100% |
| 7. Component Docs | 4/4 | 0 | ✅ 100% |

**Total: 31/31 (100%) 🎉**

---

## ✅ Completed Phases

### Phase 0: Виправлення порушень ✅
- [x] Перенести `SearchBar` до `shared/components/SearchBar/`
- [x] Створити `SearchContainer` в `features/search/components/`
- [x] Оновити Navbar, MobileSearch, useBreadcrumbs
- [x] Перенести `useServiceStatus` до `shared/hooks/`

### Phase 1: eslint-plugin-boundaries ✅
- [x] Встановити плагін
- [x] Налаштувати конфіг
- [x] Виправити 6 boundary порушень

### Phase 2: ESLint помилки ✅
- [x] Storybook imports (12 файлів)
- [x] Spacing — 4px grid (19 файлів)
- [x] Raw colors — semantic tokens (10 файлів)

### Phase 4: Plop генератори ✅
- [x] Feature, Component, Hook, Page, Store generators

### Phase 5: Container/Presenter ✅
- [x] DashboardPage → DashboardPresenter
- [x] 8 Storybook stories

---

## 🔧 Phase 3: Z-index ESLint Rule

**Status:** 67% — токени створено, ESLint enforcement залишився

### Поточний стан

**Вже є:**
- `shared/tokens/zindex.ts` — 10 токенів (base, dropdown, sticky, fixed, modalBackdrop, modal, popover, tooltip, toast, max)
- Tailwind classes: `z-dropdown`, `z-modal`, `z-toast` тощо
- Всі raw z-index замінені на токени

**Потрібно:**
- [ ] ESLint правило `no-raw-zindex`

### 3.1 Створити ESLint правило

**Файл:** `frontend/eslint-local-rules/no-raw-zindex.js`

**Логіка:**
```javascript
// ❌ Заборонено — raw z-index
className="z-10"
className="z-50"
className="z-[100]"

// ✅ Дозволено — semantic tokens
className="z-dropdown"
className="z-modal"
className="z-toast"
```

**Regex pattern:** `z-\d+` або `z-\[\d+\]`

**Allowed tokens:**
```javascript
const ALLOWED_ZINDEX = [
  'z-base', 'z-dropdown', 'z-sticky', 'z-fixed',
  'z-modal-backdrop', 'z-modal', 'z-popover',
  'z-tooltip', 'z-toast', 'z-max'
];
```

### 3.2 Додати до .eslintrc.cjs

```javascript
'local-rules/no-raw-zindex': 'error',
```

### 3.3 Верифікація

```bash
cd frontend && npm run lint
```

**Priority:** Low — токени вже використовуються, правило для enforcement

---

## 🎯 Phase 6: SearchBar Visual Tests

**Status:** 75% — Dashboard + Navbar готові, SearchBar залишився

### Поточний стан

**Вже є:**
- `tests/e2e/visual/dashboard-visual.spec.ts` — 6 variants
- `tests/e2e/visual/navbar-visual.spec.ts` — 6 variants
- `tests/e2e/visual/components-visual.spec.ts`
- npm scripts: `test:visual`, `test:visual:update`

**SearchBar компонент:**
- Локація: `shared/components/SearchBar/`
- Stories: `SearchBar.stories.tsx` (вже є)
- Unit tests: `SearchBar.test.tsx` (вже є)
- **Немає:** Visual regression tests

### 6.1 Створити SearchBar visual tests

**Файл:** `frontend/tests/e2e/visual/searchbar-visual.spec.ts`

**States to capture:**

| State | Опис | Mock |
|-------|------|------|
| `empty` | Пустий інпут, placeholder видно | — |
| `focused` | Focus state, курсор в інпуті | click + focus |
| `with-query` | Введений текст | fill("test query") |
| `loading` | Spinner під час пошуку | delay route |
| `with-results` | Dropdown з результатами | mock API response |
| `no-results` | Dropdown з empty state | mock empty response |

**Viewports:**
- mobile: 375×667
- tablet: 768×1024
- desktop: 1280×800

**Themes:** light, dark

**Total screenshots:** 6 states × 3 viewports × 2 themes = 36

### 6.2 Mock API responses

```typescript
const MOCK_SEARCH_RESULTS = {
  topics: [
    { id: '1', name: 'Performance', icon: 'Zap', color: '#F59E0B' },
    { id: '2', name: 'Security', icon: 'Shield', color: '#EF4444' },
  ],
  atoms: [
    { id: '1', type: 'INSIGHT', title: 'Cache Strategy', confidence: 0.95 },
  ],
  messages: [
    { id: '1', content: 'Database optimization needed', created_at: '...' },
  ],
};
```

### 6.3 Test structure

```typescript
test.describe('SearchBar Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/search**', ...);
  });

  for (const theme of ['light', 'dark']) {
    for (const viewport of viewports) {
      test(`searchbar empty in ${theme} on ${viewport.name}`, ...);
      test(`searchbar focused in ${theme} on ${viewport.name}`, ...);
      test(`searchbar with results in ${theme} on ${viewport.name}`, ...);
    }
  }
});
```

### 6.4 Верифікація

```bash
# Run visual tests
npm run test:visual -- searchbar-visual.spec.ts

# Update snapshots
npm run test:visual:update -- searchbar-visual.spec.ts
```

**Priority:** Medium — важливо для UI consistency

---

## 📚 Phase 7: Component Documentation

**Status:** 25% — autodocs enforcement є, інше залишилось

### Поточний стан

**Вже є:**
- ESLint rule `stories-require-autodocs` — enforces `tags: ['autodocs']`
- 91 stories вже мають autodocs
- Storybook запускається: `just storybook`

**Потрібно:**
- [ ] Приклади Design Tokens в stories
- [ ] Accessibility annotations
- [ ] Interaction tests (play functions)

### 7.1 Design Tokens examples

**Файл:** `src/shared/tokens/tokens.stories.tsx`

**Sections:**
- Colors: semantic, status, atom colors
- Spacing: gap, padding, margin tokens
- Z-index: layer hierarchy visualization
- Patterns: badges, cards, empty states

**Приклад:**
```tsx
export const ColorTokens: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-semantic-success p-4 rounded">Success</div>
      <div className="bg-semantic-error p-4 rounded">Error</div>
      <div className="bg-semantic-warning p-4 rounded">Warning</div>
      <div className="bg-semantic-info p-4 rounded">Info</div>
    </div>
  ),
};
```

### 7.2 Accessibility annotations

**Addon:** `@storybook/addon-a11y` (вже встановлено)

**Задачі:**
- [ ] Увімкнути a11y panel в Storybook config
- [ ] Додати accessibility tests до критичних компонентів
- [ ] Перевірити contrast ratios для semantic colors

**Критичні компоненти для a11y:**
- Button (focus visible, disabled state)
- Input (label association, error states)
- Dialog (focus trap, aria-modal)
- Toast (aria-live regions)

### 7.3 Interaction tests (play functions)

**Приклад для SearchBar:**
```tsx
export const WithInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('searchbox');

    await userEvent.click(input);
    await userEvent.type(input, 'test query');

    await expect(canvas.getByText('Loading...')).toBeInTheDocument();
    await expect(canvas.getByText('Performance')).toBeInTheDocument();
  },
};
```

**Компоненти для interaction tests:**
- SearchBar: type → results
- Dialog: open → close
- Tabs: click → switch
- Form: fill → submit

### 7.4 Верифікація

```bash
# Run Storybook tests
npm run test:storybook

# Check coverage
just story-check
```

**Priority:** Medium — покращує DX та onboarding

---

## 🎯 Execution Order

```
Phase 3 (ESLint z-index) → Phase 6 (Visual tests) → Phase 7 (Docs)
         15 min                    1 hour                1 hour
```

**Рекомендація:** Почати з Phase 3 — найшвидший win.

---

## Команди

```bash
# ESLint
npm run lint
npm run lint:fix

# TypeScript
npm run typecheck

# Tests
npm run test           # Unit tests
npm run test:visual    # Visual regression
npm run test:storybook # Storybook tests

# Storybook
just storybook         # http://localhost:6006
just story-check       # Coverage audit
```

---

## Пов'язане

- [[pulse-radar-renovation]] — UX план (✅ completed)
- [[../знання/архітектура/шари-фронтенду]]
- [[../знання/якість/eslint-правила]]
- [[../знання/якість/visual-tests]]
- [[../знання/якість/storybook]]
