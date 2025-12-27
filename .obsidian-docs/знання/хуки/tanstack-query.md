---
title: "TanStack Query"
created: 2025-12-27
tags:
  - хуки
  - tanstack-query
  - api
  - caching
status: active
---

# TanStack Query

==Server state== — API дані, кешування.

> [!note] Коли TanStack
> API дані з caching, refetch, invalidation

## Конфіг

```tsx
QueryClient({
  staleTime: 5 * 60 * 1000,  // 5 min
  refetchOnWindowFocus: false,
  retry: 1
})
```

## Query Keys

```tsx
const dashboardKeys = {
  all: ['dashboard'],
  metrics: (period) => [...dashboardKeys.all, 'metrics', period],
  trends: (period) => [...dashboardKeys.all, 'trends', period],
}
```

## Query

```tsx
const { data, isLoading } = useQuery({
  queryKey: dashboardKeys.metrics('week'),
  queryFn: () => dashboardService.getMetrics('week')
})
```

## Mutation

```tsx
const mutation = useMutation({
  mutationFn: (data) => agentService.createAgent(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['agents'])
    toast.success('Created!')
  }
})
```

> [!tip] Invalidation
> `invalidateQueries` == автоматичний refetch

## Пов'язане

- [[state-management]] — split state
- [[zustand]] — client state
- [[api-layer]] — data fetching
