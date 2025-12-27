---
title: "Zustand"
created: 2025-12-27
tags:
  - хуки
  - zustand
status: active
---

# Zustand

==Client state== management.

## uiStore

```tsx
{ sidebarOpen, theme, isAdminMode, language }
```

**Persist:** localStorage

## messagesStore

```tsx
{
  messages: MessageList[],
  upsertMessage(msg),
  hydrate(messages[])
}
```

## Створення

```tsx
const useStore = create(
  persist((set) => ({
    value: true,
    toggle: () => set((s) => ({ value: !s.value }))
  }))
)
```

## Пов'язане

- [[../архітектура/state-management]] — split state
- [[tanstack-query]] — server state
