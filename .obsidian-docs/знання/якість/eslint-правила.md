---
title: "ESLint Local Rules"
created: 2025-12-27
tags:
  - eslint
  - дизайн-система
  - local-rules
status: active
---

# ESLint Local Rules

==5 кастомних правил== для [[дизайн-система|Design System]] enforcement.

## no-raw-tailwind-colors (error)

> [!danger] Блокує commit
> `bg-red-500`, `text-green-600`, `bg-[#FF5733]`

**Маппінг:**

| ❌ Raw | ✅ Semantic |
|--------|-------------|
| `green-*` | `semantic-success`, `status-connected` |
| `red-*` | `semantic-error`, `destructive` |
| `yellow-*` | `semantic-warning` |

**Виняток:** `HexColorPicker.tsx`

## no-odd-spacing (error)

> [!danger] Auto-fix округлює
> `p-1`, `p-3`, `p-5`, `gap-7`

**Дозволено:** 0, 0.5, 1.5, 2, 4, 6, 8, 10, 12...

**Whitelist:** `left-1/2`, `top-1/2` (transform)

## no-heroicons (error)

```tsx
// ❌ Заборонено
import { X } from '@heroicons/react/...'

// ✅ Тільки lucide
import { X } from 'lucide-react'
```

## no-raw-page-wrapper (warn)

```tsx
// ❌ Raw
className="container mx-auto"

// ✅ Компонент
<PageWrapper variant="centered">
```

## stories-require-autodocs (warn)

```tsx
// ✅ Обов'язково
tags: ['autodocs']
```

**Auto-fix:** ✅

## Пов'язане

- [[eslint-конфіг]] — базова конфігурація
- [[pre-commit]] — блокує commit
- [[токени-кольорів]] — semantic tokens
