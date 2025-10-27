# Frontend Batch 4: Service Layer Integration

**Status:** ✅ Completed
**Duration:** ~15 хвилин
**Agent:** react-frontend-architect

---

## Зміни

**1. `/frontend/src/features/topics/types/index.ts` (lines 35-47)**
- Додано `TopicSortBy` type
- Додано `ListTopicsParams` interface

**2. `/frontend/src/features/topics/api/topicService.ts` (lines 6, 14-41)**
- Імпортовано `ListTopicsParams`
- Оновлено `listTopics()` з параметрами
- Query string побудова через URLSearchParams

---

## API Signature

```typescript
async listTopics(params?: ListTopicsParams): Promise<TopicListResponse>

interface ListTopicsParams {
  page?: number
  page_size?: number
  search?: string
  sort_by?: TopicSortBy
}
```

---

## Приклади

```typescript
// Backward compatible
await topicService.listTopics()

// З пагінацією
await topicService.listTopics({ page: 2, page_size: 24 })

// З пошуком
await topicService.listTopics({ search: 'React' })

// З сортуванням
await topicService.listTopics({ sort_by: 'name_asc' })

// Всі параметри
await topicService.listTopics({
  page: 3,
  page_size: 12,
  search: 'TypeScript',
  sort_by: 'created_desc'
})
```

---

## Validation ✅

- ✅ TypeScript типи додані
- ✅ Query string будується правильно
- ✅ Skip calculation: `(page - 1) * page_size`
- ✅ Backward compatibility збережена

---

## Next

➡️ **Batch 5 & 6 (parallel):** Search Bar + Sort Dropdown
