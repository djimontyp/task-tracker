---
title: "Токени spacing"
created: 2025-12-27
tags:
  - дизайн-система
  - spacing
status: active
---

# Токени spacing

==4px grid + 44px touch targets==

> [!danger] Заборонено
> `p-3`, `gap-5`, `m-7` — непарні значення

## Базові токени

| Token | Клас | Значення |
|-------|------|----------|
| `gap.sm` | gap-2 | 8px |
| `gap.md` | gap-4 | ==16px== |
| `gap.lg` | gap-6 | 24px |

## Touch targets

```typescript
import { touchTarget } from '@/shared/tokens'
<Button className={touchTarget.min}> // 44px
```

## Пов'язане

- [[токени-кольорів]] — semantic colors
- [[wcag]] — accessibility вимоги
