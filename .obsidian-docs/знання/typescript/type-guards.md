---
title: "Type Guards"
created: 2025-12-27
tags:
  - typescript
  - type-guards
  - runtime
status: active
---

# Type Guards

==Runtime validation== для unknown даних.

> [!note] Коли потрібно
> WebSocket, API responses, localStorage

## Приклад

```tsx
const isMessageData = (value: unknown): value is Message => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id !== 'undefined' &&
    typeof candidate.content === 'string'
  )
}
```

## Використання

```tsx
// WebSocket handler
onMessage: (data: unknown) => {
  if (isMessageData(data)) {
    // data тепер typed як Message
    store.upsertMessage(data)
  }
}
```

## Проблеми

> [!warning] 11 місць з `any`
> Потребують type guards

| Файл | Причина |
|------|---------|
| knowledge/types | VersionChange |
| atoms/types | meta: Record<string, any> |
| WebSocket hooks | onMessage callback |

## Рішення

```tsx
// ❌ Погано
meta: Record<string, any>

// ✅ Добре
type JsonValue = string | number | boolean | null | JsonValue[]
meta: Record<string, JsonValue>
```

## Пов'язане

- [[websocket-hooks]] — основне використання
- [[orval]] — generated types
- [[typescript-конфіг]] — strict mode
