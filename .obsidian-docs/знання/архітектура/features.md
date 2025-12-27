---
title: "Features"
created: 2025-12-27
tags:
  - архітектура
  - features
  - modules
status: active
---

# Features

==18 ізольованих domain modules== — бізнес-логіка.

## Структура модуля

```
features/{name}/
├── api/           # {name}Service.ts
├── components/    # UI компоненти
├── types/         # TypeScript
├── hooks/         # (optional)
├── store/         # (optional) Zustand
└── index.ts       # Public API
```

## Основні features

| Feature | Компоненти | Store |
|---------|------------|-------|
| atoms | 10 | - |
| messages | 5 | ✅ |
| agents | 11 | - |
| automation | 15+ | ✅ |
| websocket | 2 | - |
| search | 5 | - |

## Public API

```tsx
// features/atoms/index.ts
export { atomService } from './api/atomService'
export * from './types'
// Компоненти НЕ експортуються
```

> [!warning] Ізоляція
> Features ==не імпортують== одне одного

## Пов'язане

- [[шари-фронтенду]] — архітектура
- [[shared-layer]] — reusable код
- [[zustand]] — feature stores
