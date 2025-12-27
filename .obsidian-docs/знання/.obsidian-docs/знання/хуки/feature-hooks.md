---
title: "Feature Hooks"
created: 2025-12-27
tags:
  - хуки
  - features
status: active
---

# Feature Hooks

==Domain-specific hooks== всередині features.

## useWebSocket

```tsx
const { isConnected, send } = useWebSocket({
  topics: ['messages'],
  onMessage: (data) => { ... }
})
```

## useMessagesFeed

```tsx
const { messages, refresh } = useMessagesFeed({ limit: 50 })
```

## useFTSSearch

```tsx
const { data, isDebouncing } = useFTSSearch(query, limit)
```

## Пов'язане

- [[shared-hooks]] — reusable
- [[websocket-hooks]] — деталі WS
