---
title: "Vitest"
created: 2025-12-27
tags:
  - тестування
  - vitest
  - unit-tests
status: active
---

# Vitest

==Unit тести== для компонентів та хуків.

> [!note] Статус
> 51 тестів, 96% pass

## Конфіг

```typescript
// vite.config.ts → test:
{
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/setupTests.ts'
}
```

## Команди

```bash
npm run test      # Watch mode
npm run test:run  # Single run
npm run test:ui   # UI dashboard
```

## Покриті

| Файл | Тестів |
|------|--------|
| SearchBar.test.tsx | 48 |
| useAdminMode.test.ts | 9 |
| useMultiSelect.test.ts | 18+ |

## Патерн

```tsx
// Router wrapper
const renderComponent = () => render(
  <MemoryRouter><Component /></MemoryRouter>
);

// Timers
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// Hooks
const { result } = renderHook(() => useAdminMode());
act(() => result.current.toggle());
```

## Assertion Messages

> [!warning] Обов'язково
> Завжди додавай пояснення

```tsx
// ✅ Добре
expect(input).toHaveValue('test', 'Input should have typed value');

// ❌ Погано
expect(input).toHaveValue('test');
```

## Пов'язане

- [[playwright]] — E2E тести
- [[storybook]] — component testing
- [[shared-hooks]] — що тестуємо
