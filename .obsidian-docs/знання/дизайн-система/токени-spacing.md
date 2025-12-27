---
title: "Токени spacing"
created: 2025-12-27
tags:
  - дизайн-система
  - tokens
  - spacing
  - wcag
status: active
---

# Токени spacing

==4px grid + 44px touch targets== — консистентність та [[wcag|WCAG]] compliance.

> [!danger] Заборонено
> `p-3`, `gap-5`, `m-7` — непарні значення. [[eslint|ESLint]] auto-fix округлює.

## Базові токени

| Token | Клас | Значення |
|-------|------|----------|
| `gap.sm` | gap-2 | 8px |
| `gap.md` | gap-4 | ==16px== (default) |
| `gap.lg` | gap-6 | 24px |

## Touch targets

```typescript
import { touchTarget } from '@/shared/tokens'

<Button className={touchTarget.min}> // h-11 w-11 = 44px
```

> [!note] WCAG 2.1 SC 2.5.5
> Мінімум 44×44px для інтерактивних елементів

## Імпорт

```typescript
import { gap, padding } from '@/shared/tokens'

<div className={gap.md}>
<Card className={padding.card.default}> // p-6
```

## Пов'язане

- [[токени-кольорів]] — semantic colors
- [[wcag]] — accessibility вимоги
- [[eslint]] — правило `no-odd-spacing`
