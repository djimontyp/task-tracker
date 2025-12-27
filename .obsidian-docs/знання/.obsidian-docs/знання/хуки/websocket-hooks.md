---
title: "WebSocket Hooks"
created: 2025-12-27
tags:
  - хуки
  - websocket
status: active
---

# WebSocket Hooks

==Real-time== комунікація з backend.

## useWebSocket

```tsx
const { isConnected, send } = useWebSocket({
  topics: ['messages', 'analysis'],
  reconnect: true,
  maxReconnectAttempts: 5
})
```

## Features

| Feature | Опис |
|---------|------|
| Topics | Query params |
| Reconnect | Exponential backoff |
| Heartbeat | Ping/pong 45s |

## Flow

```
WebSocket → Topic → store.upsertMessage
                  → queryClient.invalidate
```

## Пов'язане

- [[feature-hooks]] — де визначено
- [[../typescript/type-guards]] — message validation
