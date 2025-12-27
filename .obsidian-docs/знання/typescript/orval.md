---
title: "Orval"
created: 2025-12-27
tags:
  - typescript
  - orval
  - openapi
  - codegen
status: active
---

# Orval

==OpenAPI → TypeScript== генератор типів.

> [!tip] Результат
> 388 типів, 26 сервісів

## Конфіг

```typescript
// orval.config.ts
{
  input: '../contracts/openapi.json',
  output: {
    target: './src/shared/api/generated',
    schemas: './src/shared/api/model',
    client: 'react-query'
  }
}
```

## Команда

```bash
just api-sync  # Export schema → Generate types
```

## Output

| Папка | Зміст |
|-------|-------|
| `shared/api/model/` | ==388 типів== |
| `shared/api/generated/` | 26 сервісів |

## Використання

```tsx
import { AtomResponse, CreateAtomRequest } from '@/shared/api/model'

const createAtom = async (data: CreateAtomRequest): Promise<AtomResponse> => {
  // ...
}
```

## Пов'язане

- [[api-layer]] — де використовується
- [[typescript-конфіг]] — base config
- [[tanstack-query]] — generated hooks
