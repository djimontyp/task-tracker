---
title: "WCAG Accessibility"
created: 2025-12-27
tags:
  - дизайн-система
  - wcag
  - a11y
  - accessibility
status: active
---

# WCAG Accessibility

==WCAG 2.1 AA== compliance для [[дизайн-система|дизайн-системи]].

## Чекліст

| Аспект | Вимога | Реалізація |
|--------|--------|------------|
| Контраст | 4.5:1+ | [[css-variables]] |
| Focus | visible ring | 3px offset |
| Touch | ≥44px | [[токени-spacing\|touchTarget.min]] |
| Icons | aria-label | обов'язково |

## Touch Targets

> [!danger] Мінімум 44×44px
> SC 2.5.5 — інтерактивні елементи

```tsx
import { touchTarget } from '@/shared/tokens'

<Button className={touchTarget.min}> // h-11 w-11
```

## Focus Visible

```tsx
import { focus } from '@/shared/tokens'

<Button className={focus.ring}>
// → focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

## Статуси — не тільки колір

> [!warning] SC 1.4.1
> Колір ==не єдиний== спосіб передачі інформації

```tsx
// ❌ Тільки колір
<span className="bg-green-500" />

// ✅ Icon + text
<Badge className={badges.status.connected}>
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>
```

## Тестування

```bash
npm run test:a11y        # Playwright + axe-core
npm run test:a11y:report # HTML звіт
```

## Пов'язане

- [[токени-spacing]] — touch targets
- [[css-variables]] — контраст
- [[playwright]] — a11y тести
