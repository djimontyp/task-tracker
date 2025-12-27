---
title: "Frontend Transformation Plan"
created: 2025-12-27
tags:
  - план
  - frontend
  - архітектура
status: active
---

# Frontend Transformation Plan

## Phase 0: Виправлення порушень

- [x] Перенести `SearchBar` до `shared/components/SearchBar/` ✅ 2025-12-27
- [x] Створити `SearchContainer` в `features/search/components/` ✅ 2025-12-27
- [x] Оновити `shared/layouts/MainLayout/Navbar.tsx` — видалити imports з features ✅ 2025-12-27
- [x] Оновити `shared/components/MobileSearch.tsx` — імпорт з shared ✅ 2025-12-27
- [x] Оновити `shared/layouts/MainLayout/useBreadcrumbs.ts` — видалити topicService ✅ 2025-12-27
- [x] Перенести `useServiceStatus` до `shared/hooks/` ✅ 2025-12-27

## Phase 1: eslint-plugin-boundaries

- [x] `npm install -D eslint-plugin-boundaries` ✅ 2025-12-27
- [x] Додати конфіг в `.eslintrc.cjs` ✅ 2025-12-27
- [x] Виправити 6 boundary порушень (shared→features) ✅ 2025-12-27

## Phase 2: Виправити ESLint помилки

- [x] Storybook imports (12) — `@storybook/react` → `@storybook/react-vite` ✅ 2025-12-27
- [x] Spacing (19) — 4px grid ✅ 2025-12-27
- [x] Raw colors (10) — semantic tokens ✅ 2025-12-27

## Phase 3: Z-index токени

- [x] Створити `shared/tokens/zindex.ts` ✅ 2025-12-27
- [x] Замінити raw z-index на токени ✅ 2025-12-27
- [ ] Додати ESLint правило `no-raw-zindex`
  - **Файл:** `frontend/eslint-local-rules/no-raw-zindex.cjs`
  - **Regex:** `/z-\d+/` → заборонити
  - **Allow:** `z-dropdown`, `z-modal`, `z-toast` тощо
  - **Priority:** Low (токени вже використовуються)

## Phase 4: Plop генератори

- [x] Feature generator ✅ 2025-12-27
- [x] Component generator ✅ 2025-12-27
- [x] Hook generator ✅ 2025-12-27
- [x] Page generator ✅ 2025-12-27
- [x] Store generator ✅ 2025-12-27

## Phase 5: Container/Presenter

- [x] Виділити логіку з DashboardPage ✅ 2025-12-27
- [x] Створити DashboardPresenter компонент ✅ 2025-12-27
- [x] Додати Storybook stories (8 станів) ✅ 2025-12-27

## Phase 6: Visual Regression Tests

- [x] Dashboard visual tests (6 variants) ✅ 2025-12-27
- [x] Navbar visual tests (6 variants) ✅ 2025-12-27
- [x] npm scripts: `test:visual`, `test:visual:update` ✅ 2025-12-27
- [ ] SearchBar visual tests
  - **Файл:** `tests/e2e/visual/searchbar-visual.spec.ts`
  - **States:** empty, focused, with-query, with-results, loading
  - **Breakpoints:** mobile (375px), tablet (768px), desktop (1280px)
  - **Priority:** Medium

## Phase 7: Component Documentation (NEW)

- [ ] Storybook autodocs для всіх shared/components
- [ ] Приклади використання Design Tokens
- [ ] Accessibility annotations (a11y addon)
- [ ] Interaction tests (play functions)

---

## Команди

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test        # Unit tests
```

## Пов'язане

- [[../знання/архітектура/шари-фронтенду]]
- [[../знання/якість/eslint-правила]]
