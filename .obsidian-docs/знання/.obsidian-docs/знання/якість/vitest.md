---
title: "Vitest"
created: 2025-12-27
tags:
  - тестування
  - vitest
status: active
---

# Vitest

==Unit тести== для компонентів та хуків.

> [!note] Статус
> 51 тестів, 96% pass

## Команди

```bash
npm run test      # Watch
npm run test:run  # Single run
```

## Патерн

```tsx
const { result } = renderHook(() => useAdminMode());
act(() => result.current.toggle());
```

> [!warning] Assertion Messages
> Завжди додавай пояснення до expect()

## Пов'язане

- [[playwright]] — E2E тести
- [[../хуки/shared-hooks]] — що тестуємо
