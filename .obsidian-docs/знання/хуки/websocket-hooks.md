---
title: "WebSocket Hooks"
created: 2025-12-27
tags:
  - хуки
  - websocket
  - real-time
status: active
---

# WebSocket Hooks

==Real-time== комунікація з backend.

## useWebSocket

```tsx
const { isConnected, connectionState, send } = useWebSocket({
  topics: ['messages', 'analysis'],
  onMessage: (data) => { ... },
  reconnect: true,
  maxReconnectAttempts: 5
})
```

## Features

| Feature | Опис |
|---------|------|
| Topics | Query params subscription |
| Reconnect | Exponential backoff |
| Heartbeat | Ping/pong 45s |
| Replay | Messages on reconnect |

## Topics

| Topic | Events |
|-------|--------|
| messages | message.updated, ingestion.* |
| analysis | extraction.*, topic/atom_created |
| monitoring | task_started/completed/failed |

## Flow

```
WebSocket → Topic → useMessagesFeed → store.upsertMessage
                                    → queryClient.invalidate
```

## useServiceStatus

```tsx
const { status } = useServiceStatus()
// Estados: idle → checking → ok/error
```

> [!tip] Combo
> WebSocket + health check endpoint

## Пов'язане

- [[feature-hooks]] — де визначено
- [[type-guards]] — message validation
- [[zustand]] — store update
