---
title: "Playwright"
created: 2025-12-27
tags:
  - тестування
  - playwright
status: active
---

# Playwright

==E2E тести== + accessibility перевірка.

> [!note] Статус
> 49 тестів, 5 браузерів

## Команди

```bash
npm run test:e2e
npm run test:a11y
```

## A11y Helpers

```tsx
await checkA11y(page, { failOnImpact: 'serious' })
await checkTouchTargets(page, 'button', 44)
```

## Пов'язане

- [[vitest]] — unit тести
- [[../дизайн-система/wcag]] — accessibility
