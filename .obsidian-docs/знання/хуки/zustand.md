---
title: "Zustand"
created: 2025-12-27
tags:
  - хуки
  - zustand
  - state
status: active
---

# Zustand

==Client state== management.

> [!note] Коли Zustand
> UI налаштування, theme, sidebar — ==не API дані==

## uiStore (shared)

```tsx
// shared/store/uiStore.ts
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark' | 'system',
  isAdminMode: boolean,
  language: 'uk' | 'en',
  expandedGroups: Record<string, boolean>
}
```

**Persist:** localStorage `ui-settings`

## messagesStore (feature)

```tsx
// features/messages/store
{
  messages: MessageList[],
  statusByExternalId: Record<string, 'persisted' | 'pending'>,
  isHydrated: boolean
}
```

**Actions:**
- `hydrate(messages[])` — bulk init
- `upsertMessage(msg)` — add/update

## Створення store

```tsx
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }))
    }),
    { name: 'ui-settings' }
  )
)
```

## Пов'язане

- [[state-management]] — split state
- [[tanstack-query]] — server state
- [[feature-hooks]] — де використовується
