---
title: "State Management"
created: 2025-12-27
tags:
  - архітектура
  - state
status: active
---

# State Management

==Split state== — Zustand (client) + TanStack (server).

## Zustand (Client)

```tsx
// shared/store/uiStore.ts
{ sidebarOpen, theme, isAdminMode }
```

**Persist:** localStorage

## TanStack Query (Server)

```tsx
const { data } = useQuery({
  queryKey: ['atoms'],
  queryFn: () => atomService.listAtoms()
})
```

> [!tip] Чому split?
> Zustand — швидкий, TanStack — кешування

## Пов'язане

- [[../хуки/zustand]] — stores
- [[../хуки/tanstack-query]] — patterns
