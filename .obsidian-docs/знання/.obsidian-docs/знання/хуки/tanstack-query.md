---
title: "TanStack Query"
created: 2025-12-27
tags:
  - хуки
  - tanstack
status: active
---

# TanStack Query

==Server state== — API дані, кешування.

## Query

```tsx
const { data } = useQuery({
  queryKey: ['atoms'],
  queryFn: () => atomService.listAtoms()
})
```

## Mutation

```tsx
const mutation = useMutation({
  mutationFn: (data) => service.create(data),
  onSuccess: () => queryClient.invalidateQueries(['atoms'])
})
```

> [!tip] Invalidation
> `invalidateQueries` == автоматичний refetch

## Пов'язане

- [[zustand]] — client state
- [[../архітектура/api-layer]] — fetching
