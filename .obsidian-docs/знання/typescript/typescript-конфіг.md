---
title: "TypeScript Config"
created: 2025-12-27
tags:
  - typescript
  - config
  - strict
status: active
---

# TypeScript Config

==Strict mode== активний, 0 errors.

> [!note] Файл
> `tsconfig.json`

## Основні опції

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "target": "ES2020",
    "module": "ESNext"
  }
}
```

## Path Aliases

```tsx
import { Button } from '@/shared/ui'
import { atomService } from '@features/atoms'
```

| Alias | Path |
|-------|------|
| `@/*` | `./src/*` |
| `@features/*` | `./src/features/*` |
| `@shared/*` | `./src/shared/*` |
| `@pages/*` | `./src/pages/*` |

## Перевірка

```bash
npx tsc --noEmit  # Type check
```

> [!warning] Pre-commit
> [[pre-commit]] блокує commit при TS errors

## Пов'язане

- [[orval]] — generated types
- [[type-guards]] — runtime validation
- [[pre-commit]] — автоматична перевірка
