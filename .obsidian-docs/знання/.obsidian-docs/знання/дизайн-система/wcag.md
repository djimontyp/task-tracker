---
title: "WCAG Accessibility"
created: 2025-12-27
tags:
  - дизайн-система
  - wcag
status: active
---

# WCAG Accessibility

==WCAG 2.1 AA== compliance.

## Чекліст

| Аспект | Вимога |
|--------|--------|
| Контраст | 4.5:1+ |
| Touch | ≥44px |
| Icons | aria-label |

> [!warning] SC 1.4.1
> Колір ==не єдиний== спосіб передачі інформації

## Тестування

```bash
npm run test:a11y
```

## Пов'язане

- [[токени-spacing]] — touch targets
- [[../якість/playwright]] — a11y тести
