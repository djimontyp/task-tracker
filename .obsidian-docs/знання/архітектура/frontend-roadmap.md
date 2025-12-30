---
title: Frontend Systematic Roadmap
type: roadmap
status: active
created: 2025-12-29
tags: [frontend, architecture, eslint, dx]
---

# Frontend Systematic Roadmap

> Трансформація фронтенду з "творчості" на "інженерію"

## 3 Рівні Захисту

1. **Лінтери (The Police)** - Б'ють по руках за порушення
2. **Генератори (The Factory)** - Створюють код правильно з початку
3. **Процес (The Law)** - Storybook → Component → Integration

## Phase FE-1: Architectural Boundaries

**eslint-plugin-boundaries:**
```
shared     → can be imported anywhere
entities   → only shared
features   → entities + shared (not other features)
pages      → can import all
```

**Beads:** `task-tracker-8ua`, `task-tracker-b34`

## Phase FE-2: Extended Design System Policing

| Rule | Ban | Allow |
|------|-----|-------|
| Strict Padding | `p-[13px]` | `p-4` (multiples of 4) |
| Z-Index Tokens | `z-50`, `z-[9999]` | `z-modal`, `z-tooltip` |
| Font Tokens | `font-['Arial']` | `font-sans`, `font-mono` |

**Beads:** `task-tracker-j33`

## Phase FE-3: Component Generators

```bash
npm run generate component MyComponent
```

Creates:
```
/MyComponent
  ├── index.tsx         # Component
  ├── index.stories.tsx # Storybook
  └── index.test.tsx    # Unit test
```

**Beads:** `task-tracker-rpv`

## Phase FE-4: Data Layer Isolation

- All API calls in custom hooks (`useMetrics`, `useUpdateUser`)
- UI components accept only props
- No `shared/api` imports in UI

**Beads:** `task-tracker-erw`

## Visual Regression Testing

```bash
npm run test:visual        # Check
npm run test:visual:update # Update baseline
npx playwright show-report # View diff
```

**Coverage:**
- Dashboard (7 snapshots: Desktop/Tablet/Mobile × Light/Dark + Empty)
- Settings page
- Messages page
- Storybook components

**Beads:** `task-tracker-3ai`

## Links

- [[frontend-mental-model]] - Core philosophy
- [[design-tokens]] - Token system
- [[vitest]] - Testing patterns
