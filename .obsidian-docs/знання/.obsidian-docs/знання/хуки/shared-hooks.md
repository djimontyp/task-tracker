---
title: "Shared Hooks"
created: 2025-12-27
tags:
  - хуки
  - react
status: active
---

# Shared Hooks

==Reusable hooks== в `shared/hooks/`.

## Список

| Хук | Призначення |
|-----|-------------|
| `useDebounce` | Затримка |
| `useMultiSelect` | Shift+Click |
| `useAutoSave` | Форми |
| `useKeyboardShortcut` | Hotkeys |
| `useMediaQuery` | Responsive |

## Приклад

```tsx
const debouncedValue = useDebounce(searchTerm, 300)
```

## Пов'язане

- [[feature-hooks]] — domain hooks
- [[zustand]] — state integration
