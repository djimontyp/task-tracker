---
title: "Playwright"
created: 2025-12-27
tags:
  - тестування
  - playwright
  - e2e
  - accessibility
status: active
---

# Playwright

==E2E тести== + [[wcag|accessibility]] перевірка.

> [!note] Статус
> 49 тестів на 5 браузерах

## Браузери

- chromium (Desktop Chrome)
- firefox
- webkit (Safari)
- mobile-chrome (Pixel 5)
- mobile-safari (iPhone 12)

## Команди

```bash
npm run test:e2e      # Усі браузери
npm run test:e2e:ui   # Playwright UI
npm run test:a11y     # Accessibility
npm run test:visual   # Snapshots
```

## Test Files

| Файл | Сценарії |
|------|----------|
| dashboard.spec.ts | 8+ |
| messages.spec.ts | 5+ |
| accessibility.spec.ts | 4+ |

## Accessibility Helpers

```tsx
// helpers/checkA11y.ts
await checkA11y(page, { failOnImpact: 'serious' })
await checkTouchTargets(page, 'button', 44)
await checkFocusVisibility(page)
```

> [!tip] axe-core
> Інтегровано через `@axe-core/playwright`

## Пов'язане

- [[vitest]] — unit тести
- [[wcag]] — accessibility вимоги
- [[storybook]] — component isolation
