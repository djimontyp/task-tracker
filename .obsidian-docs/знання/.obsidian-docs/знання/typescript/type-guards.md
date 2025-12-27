---
title: "Type Guards"
created: 2025-12-27
tags:
  - typescript
  - runtime
status: active
---

# Type Guards

==Runtime validation== для unknown даних.

## Приклад

```tsx
const isMessage = (v: unknown): v is Message => {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return typeof c.content === 'string'
}
```

## Використання

```tsx
if (isMessageData(data)) {
  store.upsertMessage(data)  // typed!
}
```

> [!warning] 11 місць з any
> Потребують type guards

## Пов'язане

- [[../хуки/websocket-hooks]] — основне використання
- [[orval]] — generated types
