---
name: api-contracts
description: Sync API contracts between FastAPI backend and React frontend. Triggers on "sync api", "update contracts", "generate types", "оновити контракти", "згенерувати типи", or when backend schemas change.
---

# API Contracts

Автоматична синхронізація типів між FastAPI backend та React frontend через OpenAPI schema.

## Overview

```
Backend (Pydantic) → openapi.json → Orval → TypeScript types + hooks
```

## Commands

```bash
# Повна синхронізація (рекомендовано)
just api-sync

# Окремі кроки
just api-export    # Експорт OpenAPI з FastAPI
just api-generate  # Генерація TypeScript з OpenAPI
```

## When to Use

Викликай `just api-sync` коли:
- Змінені Pydantic schemas в backend
- Додані/видалені API endpoints
- Змінені response/request models
- Перед commit після backend змін

## Workflow

### 1. Backend зміни

Після модифікації `backend/app/schemas/*.py`:

```bash
just api-sync
```

### 2. Перевірка

Перевір згенеровані файли:

```bash
# TypeScript types
ls frontend/src/shared/api/model/

# React Query hooks
ls frontend/src/shared/api/generated/
```

### 3. Використання в коді

```typescript
// Імпорт згенерованих типів
import type { TopicPublic, AtomCreate } from '@/shared/api/model'

// Імпорт згенерованих hooks
import { useListTopicsApiV1TopicsGet } from '@/shared/api/generated/topics/topics'

// Використання hook
const { data, isLoading } = useListTopicsApiV1TopicsGet({ limit: 10 })
```

## File Structure

```
contracts/
└── openapi.json              # OpenAPI schema (source of truth)

frontend/src/shared/api/
├── model/                    # TypeScript interfaces
│   ├── topicPublic.ts
│   ├── atomCreate.ts
│   └── ...
├── generated/                # React Query hooks
│   ├── topics/topics.ts
│   ├── atoms/atoms.ts
│   └── ...
└── lib/api/
    └── mutator.ts            # Axios wrapper for orval
```

## Configuration

**Orval config:** `frontend/orval.config.ts`

```typescript
export default defineConfig({
  api: {
    input: '../contracts/openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/shared/api/generated',
      schemas: './src/shared/api/model',
      client: 'react-query',
    },
  },
})
```

## Troubleshooting

### Import errors after generation

```bash
# Перегенерувати з чистого стану
cd frontend && rm -rf src/shared/api/generated src/shared/api/model
just api-sync
```

### Backend changes not reflected

```bash
# Перевірити що схема оновлена
cat contracts/openapi.json | jq '.paths | keys | length'

# Порівняти з runtime
curl http://localhost/api/v1/openapi.json | jq '.paths | keys | length'
```

### TypeScript errors

```bash
cd frontend && npx tsc --noEmit
```

## Notes

- Згенеровані файли комітяться в git
- Hooks використовують `customInstance` з `lib/api/mutator.ts`
- Query keys автоматично генеруються з endpoint paths
