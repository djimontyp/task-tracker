---
title: "Feature Hooks"
created: 2025-12-27
tags:
  - хуки
  - features
  - react
status: active
---

# Feature Hooks

==Domain-specific hooks== всередині [[features]].

## WebSocket

**useWebSocket** (359 LOC)

```tsx
const { isConnected, send } = useWebSocket({
  topics: ['messages', 'analysis'],
  onMessage: (data) => { ... },
  reconnect: true,
  maxReconnectAttempts: 5
})
```

> [!tip] Features
> - Topic subscriptions
> - Exponential backoff
> - Ping/pong heartbeat (45s)

## Messages

**useMessagesFeed**

```tsx
const { messages, period, setPeriod, refresh } = useMessagesFeed({
  limit: 50
})
```

**Pattern:**
1. Fetch via API
2. Subscribe to WebSocket
3. [[type-guards|Type guard]] validation
4. [[zustand|Store]] update

## Search

**useFTSSearch**

```tsx
const { data, isDebouncing, isQueryTooShort } = useFTSSearch(query, limit)
```

- [[shared-hooks|Debounce]] 300ms
- Min 2 chars

## Пов'язане

- [[shared-hooks]] — reusable
- [[websocket-hooks]] — деталі
- [[zustand]] — store integration
