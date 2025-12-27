---
title: "API Layer"
created: 2025-12-27
tags:
  - архітектура
  - api
status: active
---

# API Layer

==2 підходи== до API комунікації.

## Service Class

```tsx
class AtomService {
  async listAtoms() { return fetch('/api/v1/atoms') }
}
export const atomService = new AtomService()
```

## Orval Generated

```bash
just api-sync  # Export → Generate
```

==388 типів== з OpenAPI schema.

## Пов'язане

- [[../typescript/orval]] — codegen
- [[../хуки/tanstack-query]] — fetching
