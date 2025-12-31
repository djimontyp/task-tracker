---
title: "WebSocket + TanStack Query Invalidation"
created: 2025-12-31
source:
  type: bugfix
  ref: "task-tracker-mv1"
tags:
  - паттерн
  - frontend
  - websocket
  - tanstack-query
  - auto-captured
status: active
---

# WebSocket + TanStack Query Invalidation

> Захоплено з [[2025-12-31]] — P0.2 Race Condition Fix

## Проблема

WebSocket отримує real-time events і напряму мутує Zustand store. Це створює race condition:

```
WebSocket event → upsertMessage() → Zustand updated
                                          ↓
API response → hydrate() → Zustand overwritten ← CONFLICT!
```

Користувач бачить "мигання" даних або втрачає нові повідомлення.

## Рішення

Замість прямої мутації store — інвалідувати TanStack Query cache:

```typescript
const queryClient = useQueryClient()

const handleMessageEvent = useCallback((payload) => {
  if (type === 'message.new') {
    // НЕ мутуємо store напряму!
    // queryClient.invalidateQueries triggers background refetch
    queryClient.invalidateQueries({ queryKey: ['messages'] })
  }
}, [queryClient])
```

## Чому працює

```
WebSocket event → invalidateQueries() → Background refetch
                                              ↓
                          API returns fresh data from PostgreSQL
                                              ↓
                          TanStack Query updates cache
                                              ↓
                          React re-renders with new data
```

**Single Source of Truth** — PostgreSQL, не Zustand.

## Коли використовувати

- Real-time updates через WebSocket
- Дані мають canonical state на сервері
- Потрібна консистентність між tabs/users
- Optimistic updates не критичні (можна почекати ~100ms refetch)

## Коли НЕ використовувати

- Offline-first apps (потрібен optimistic update)
- High-frequency updates (>10/sec) — занадто багато refetches
- Local-only state (не синхронізується з сервером)

## Приклад

```typescript
// features/messages/hooks/useMessagesFeed.ts

import { useQueryClient } from '@tanstack/react-query'

export const useMessagesFeed = () => {
  const queryClient = useQueryClient()

  const handleMessageEvent = useCallback(
    (payload: unknown) => {
      const { type, data } = payload as MessageEventPayload

      if (type === 'message.new' || type === 'message.updated') {
        // Invalidate triggers background refetch
        queryClient.invalidateQueries({ queryKey: ['messages'] })
      }
    },
    [queryClient]
  )

  useWebSocket({
    topics: ['messages'],
    onMessage: handleMessageEvent,
  })
}
```

## Пов'язане

- [[TanStack Query]] — server state management
- [[WebSocket Integration]] — real-time architecture
- [[Zustand vs TanStack Query]] — коли що використовувати
