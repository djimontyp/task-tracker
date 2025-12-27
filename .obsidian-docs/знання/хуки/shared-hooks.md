---
title: "Shared Hooks"
created: 2025-12-27
tags:
  - хуки
  - react
  - shared
status: active
---

# Shared Hooks

==Reusable hooks== в `shared/hooks/`.

## Список

| Хук | Призначення |
|-----|-------------|
| `useDebounce` | Затримка (500ms) |
| `useMultiSelect` | Shift+Click виділення |
| `useAutoSave` | Форми з debounce |
| `useAdminMode` | Toggle адмін-режиму |
| `useKeyboardShortcut` | Глобальні shortcuts |
| `useMediaQuery` | Responsive detection |
| `useLanguage` | i18n управління |
| `useIsMobile` | Mobile detection |

## Приклад: useDebounce

```tsx
const debouncedValue = useDebounce(searchTerm, 300)

useEffect(() => {
  if (debouncedValue) {
    search(debouncedValue)
  }
}, [debouncedValue])
```

## Приклад: useKeyboardShortcut

```tsx
useKeyboardShortcut('mod+k', () => {
  openCommandPalette()
})
```

> [!tip] mod
> `mod` = Cmd на Mac, Ctrl на Windows

## Тести

[[vitest]] покриває:
- useAdminMode (9 тестів)
- useMultiSelect (18+ тестів)
- useKeyboardShortcut (15+ тестів)

## Пов'язане

- [[feature-hooks]] — domain hooks
- [[zustand]] — state integration
- [[vitest]] — тестування
