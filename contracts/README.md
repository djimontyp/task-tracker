# API Contracts

Централізований репозиторій контрактів між backend (FastAPI) та frontend (React/TypeScript).

## Файли

| Файл | Опис |
|------|------|
| `openapi.json` | OpenAPI 3.0 schema експортована з FastAPI |

## Команди

```bash
# Експорт схеми з backend
just api-export

# Генерація TypeScript типів
just api-generate

# Повна синхронізація (export + generate)
just api-sync
```

## Workflow

```
Backend (Pydantic) → openapi.json → Orval → TypeScript types + hooks
```

1. **Зміни в backend** — оновити Pydantic schemas
2. **`just api-sync`** — оновити контракти
3. **Commit** — зміни в `contracts/` + `frontend/src/shared/api/`

## Згенеровані файли

```
frontend/src/shared/api/
├── model/     # TypeScript types (interfaces)
└── hooks/     # TanStack Query hooks (useQuery, useMutation)
```
