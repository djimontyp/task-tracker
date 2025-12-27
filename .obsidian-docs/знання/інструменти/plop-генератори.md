---
title: "Plop генератори"
created: 2025-12-27
updated: 2025-12-27
tags:
  - інструменти
  - plop
  - codegen
status: active
---

# Plop генератори

Автоматична генерація коду для консистентності.

## Команди

```bash
# Інтерактивний режим
npm run generate

# Конкретні генератори
npm run generate:feature       # Feature module
npm run generate:component     # Shared component
npm run generate:hook          # Custom hook
npm run generate:page          # Page component
npm run generate:store         # Zustand store
```

## Генератори

### Feature

Створює повний feature module:

```
src/features/{name}/
├── api/{name}Service.ts     # TanStack Query hooks
├── components/index.ts      # Components barrel
├── hooks/index.ts           # Hooks barrel
├── types/index.ts           # TypeScript interfaces
└── index.ts                 # Public API
```

### Component

Створює компонент з тестами та stories:

```
src/shared/components/{Name}/
├── index.tsx               # Component
├── {Name}.test.tsx         # Vitest tests
└── {Name}.stories.tsx      # Storybook
```

### Hook

Створює custom hook:

```
src/shared/hooks/
├── use{Name}.ts           # Hook
└── use{Name}.test.ts      # Tests
```

### Page

Створює page component:

```
src/pages/{Name}Page/
├── index.tsx              # Page
└── index.test.tsx         # Tests
```

### Store

Створює Zustand store:

```
src/features/{feature}/store/
├── {name}Store.ts         # Store with devtools
└── {name}Store.test.ts    # Tests
```

## Файли конфігурації

- `frontend/plopfile.mjs` — Plop config
- `frontend/plop-templates/` — Handlebars templates

## Приклади

```bash
# Створити feature "notifications"
npm run generate:feature -- "notifications" "Push notifications"

# Створити компонент "StatusBadge"
npm run generate:component -- "StatusBadge" "Status indicator"

# Створити hook "useClipboard"
npm run generate:hook -- "Clipboard" "Clipboard operations"
```

## Пов'язане

- [[шари-фронтенду]]
- [[storybook]]
- [[vitest]]
