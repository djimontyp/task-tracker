---
title: "State Management"
created: 2025-12-27
tags:
  - архітектура
  - zustand
  - tanstack-query
  - state
status: active
---

# State Management

==Split state== — Zustand (client) + TanStack Query (server).

## Zustand (Client State)

UI налаштування, теми, sidebar:

```tsx
// shared/store/uiStore.ts
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark' | 'system',
  isAdminMode: boolean,
  language: 'uk' | 'en'
}
```

**Persist:** localStorage `ui-settings`

## TanStack Query (Server State)

API дані, кешування:

```tsx
const { data } = useQuery({
  queryKey: ['atoms'],
  queryFn: () => atomService.listAtoms()
})
```

> [!tip] Чому split?
> - ==Zustand== — швидкий доступ, persistence
> - ==TanStack== — кешування, invalidation, refetch

## Query Keys

```tsx
const dashboardKeys = {
  all: ['dashboard'],
  metrics: (period) => [...dashboardKeys.all, 'metrics', period],
}
```

## Mutations

```tsx
const mutation = useMutation({
  mutationFn: (data) => agentService.createAgent(data),
  onSuccess: () => queryClient.invalidateQueries(['agents'])
})
```

## Пов'язане

- [[zustand]] — feature stores
- [[tanstack-query]] — patterns
- [[features]] — де використовується
