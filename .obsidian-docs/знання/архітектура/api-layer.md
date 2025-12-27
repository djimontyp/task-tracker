---
title: "API Layer"
created: 2025-12-27
tags:
  - архітектура
  - api
  - orval
status: active
---

# API Layer

==2 підходи== до API комунікації.

## 1. Service Class (features)

```tsx
class AtomService {
  async listAtoms() {
    return fetch('/api/v1/atoms')
  }
}
export const atomService = new AtomService()
```

Використовується в [[features]] для domain-specific API.

## 2. Axios + Generated (shared)

```tsx
import { apiClient } from '@/shared/api'
const data = await apiClient.get('/atoms')
```

## OpenAPI → TypeScript

> [!note] Orval
> Генерує ==388 типів== з OpenAPI schema

```bash
just api-sync  # Export → Generate
```

**Output:**
- `shared/api/model/` — 388 типів
- `shared/api/generated/` — 26 сервісів

## Error Pattern

```tsx
if (!response.ok) {
  const error = await response.json().catch(() => ({}))
  if (response.status === 409) throw new Error('Already exists')
  throw new Error(error.detail || 'Failed')
}
```

## Пов'язане

- [[orval]] — type generation
- [[features]] — service classes
- [[tanstack-query]] — data fetching
