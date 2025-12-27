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

- [ ] Перенести `SearchBar` до `shared/components/SearchBar/`
- [ ] Створити `SearchContainer` в `features/search/components/`
- [ ] Оновити `shared/layouts/MainLayout/Navbar.tsx` — видалити imports з features
- [ ] Оновити `shared/components/MobileSearch.tsx` — імпорт з shared
- [ ] Оновити `shared/layouts/MainLayout/useBreadcrumbs.ts` — видалити topicService
- [ ] Перенести `useServiceStatus` до `shared/hooks/`

## Phase 1: eslint-plugin-boundaries

- [ ] `npm install -D eslint-plugin-boundaries`
- [ ] Додати конфіг в `.eslintrc.cjs`
- [ ] Перевірити що всі порушення ловляться

## Phase 2: Виправити ESLint помилки

- [ ] Storybook imports (12) — `@storybook/react` → `@storybook/react-vite`
- [ ] Spacing (19) — `npm run lint:fix`
- [ ] Raw colors (10) — `bg-yellow-200` → `bg-semantic-warning/20`

## Phase 3: Z-index токени

- [ ] Створити `shared/tokens/zindex.ts`
- [ ] Замінити raw z-index на токени
- [ ] Додати ESLint правило

## Phase 4: Plop генератори

- [ ] Feature generator
- [ ] Component generator
- [ ] Hook generator

## Phase 5: Container/Presenter

- [ ] Виділити логіку з page компонентів
- [ ] Створити presenter компоненти

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
