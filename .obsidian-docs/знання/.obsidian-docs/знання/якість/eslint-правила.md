---
title: "ESLint Local Rules"
created: 2025-12-27
tags:
  - eslint
  - дизайн-система
status: active
---

# ESLint Local Rules

==5 кастомних правил== для Design System.

## no-raw-tailwind-colors (error)

> [!danger] Блокує commit
> `bg-red-500`, `text-green-600`

## no-odd-spacing (error)

> [!danger] Auto-fix
> `p-3`, `gap-5` → `p-4`, `gap-6`

## no-heroicons (error)

```tsx
// ❌ import { X } from '@heroicons/react'
// ✅ import { X } from 'lucide-react'
```

## stories-require-autodocs (warn)

`tags: ['autodocs']` обов'язково.

## Пов'язане

- [[eslint-конфіг]] — базова конфігурація
- [[pre-commit]] — блокує commit
