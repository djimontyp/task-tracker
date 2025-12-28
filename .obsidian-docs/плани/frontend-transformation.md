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

## ✅ Phase 3: Z-index ESLint Rule

**Status:** ✅ 100% DONE (2025-12-28)

### Реалізовано

- [x] `shared/tokens/zindex.ts` — 10 токенів (base, dropdown, sticky, fixed, modalBackdrop, modal, popover, tooltip, toast, max)
- [x] Tailwind classes: `z-dropdown`, `z-modal`, `z-toast` тощо
- [x] Всі raw z-index замінені на токени
- [x] ESLint правило `no-raw-zindex` ✅ 2025-12-28:
  - **Файл:** `frontend/eslint-local-rules/no-raw-zindex.js`
  - **Конфіг:** `'local-rules/no-raw-zindex': 'error'`
  - **Autofix:** підтримується
  - **Stories/tests:** вимкнено

**Правило блокує:**
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

---

## ✅ Phase 6: SearchBar Visual Tests

**Status:** ✅ 100% DONE (2025-12-28)

### Реалізовано

- [x] `tests/e2e/visual/dashboard-visual.spec.ts` — 6 variants
- [x] `tests/e2e/visual/navbar-visual.spec.ts` — 6 variants
- [x] `tests/e2e/visual/components-visual.spec.ts`
- [x] npm scripts: `test:visual`, `test:visual:update`
- [x] `tests/e2e/visual/searchbar-visual.spec.ts` ✅ 2025-12-28:
  - **States:** empty, focused, with-query, loading, with-results, no-results
  - **Viewports:** mobile (375×667), tablet (768×1024), desktop (1280×800)
  - **Themes:** light, dark
  - **Total screenshots:** 36

**Верифікація:**
```bash
npm run test:visual -- searchbar-visual.spec.ts
```

---

## ✅ Phase 7: Component Documentation

**Status:** ✅ 100% DONE (2025-12-28)

### Реалізовано

- [x] ESLint rule `stories-require-autodocs` — enforces `tags: ['autodocs']`
- [x] 280+ stories з autodocs
- [x] Storybook запускається: `just storybook`
- [x] Design Tokens stories ✅ 2025-12-28:
  - **Файл:** `src/shared/tokens/tokens.stories.tsx`
  - **Sections:** Colors, Spacing, Z-index, Patterns
- [x] Accessibility annotations:
  - **Addon:** `@storybook/addon-a11y` (встановлено)
  - **Компоненти перевірені:** Button, Input, Dialog, Toast
- [x] Interaction tests (play functions):
  - **SearchBar:** type → results
  - **Dialog:** open → close
  - **Tabs:** click → switch

**Верифікація:**
```bash
npm run test:storybook
just story-check
```

---

## 🎯 Завершено!

Усі фази виконані:
1. ~~Phase 0: Boundary violations~~ ✅
2. ~~Phase 1: eslint-plugin-boundaries~~ ✅
3. ~~Phase 2: ESLint помилки~~ ✅
4. ~~Phase 3: Z-index ESLint rule~~ ✅ 2025-12-28
5. ~~Phase 4: Plop генератори~~ ✅
6. ~~Phase 5: Container/Presenter~~ ✅
7. ~~Phase 6: SearchBar visual tests~~ ✅ 2025-12-28
8. ~~Phase 7: Component docs~~ ✅ 2025-12-28

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
