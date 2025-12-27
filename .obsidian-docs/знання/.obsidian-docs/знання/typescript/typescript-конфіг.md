---
title: "TypeScript Config"
created: 2025-12-27
tags:
  - typescript
  - config
status: active
---

# TypeScript Config

==Strict mode== активний, 0 errors.

## Основні опції

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "target": "ES2020"
}
```

## Path Aliases

| Alias | Path |
|-------|------|
| `@/*` | `./src/*` |
| `@features/*` | `./src/features/*` |

## Перевірка

```bash
npx tsc --noEmit
```

## Пов'язане

- [[orval]] — generated types
- [[type-guards]] — runtime validation
