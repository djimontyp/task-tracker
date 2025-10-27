# Backend Batch 1: TopicCRUD Search & Sort Logic

**Status:** ✅ Completed
**Duration:** ~25 хвилин
**Agent:** fastapi-backend-expert

---

## Зміни в файлах

**Файл:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/topic_crud.py:65-136`

### Нова сигнатура методу

```python
async def list(
    self,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    sort_by: str | None = "created_desc",
) -> tuple[list[TopicPublic], int]:
```

---

## Реалізовані можливості

### 1. Search функціональність
- **Параметр:** `search: str | None = None`
- **Логіка:** Case-insensitive пошук через `ilike()`
- **Фільтр:** `WHERE name ILIKE %search% OR description ILIKE %search%`
- **Підтримка:** Кириличні символи (UTF-8) ✅
- **Preprocessing:** Автоматичний `strip()` пробілів

### 2. Dynamic Sorting (5 опцій)
- `"name_asc"` → ORDER BY name ASC
- `"name_desc"` → ORDER BY name DESC
- `"created_desc"` → ORDER BY created_at DESC (default)
- `"created_asc"` → ORDER BY created_at ASC
- `"updated_desc"` → ORDER BY updated_at DESC

### 3. Backward Compatibility
- ✅ Виклики без `search`/`sort_by` працюють
- ✅ Пагінація `skip`/`limit` не змінена
- ✅ Default: `created_desc` (як раніше)

---

## Enum для Frontend

```typescript
export enum TopicSortBy {
  NAME_ASC = "name_asc",
  NAME_DESC = "name_desc",
  CREATED_DESC = "created_desc", // default
  CREATED_ASC = "created_asc",
  UPDATED_DESC = "updated_desc",
}
```

---

## Технічні деталі для Batch 2

**API Endpoint update** (`backend/app/api/v1/topics.py`):

```python
async def list_topics(
    skip: int = 0,
    limit: int = 100,
    search: str | None = Query(None, description="Search by name or description"),
    sort_by: str | None = Query("created_desc", description="Sort: name_asc|name_desc|created_desc|created_asc|updated_desc"),
    session: AsyncSession = Depends(get_db),
):
    topics, total = await TopicCRUD(session).list(
        skip=skip,
        limit=limit,
        search=search,
        sort_by=sort_by,
    )
```

---

## Validation ✅

- ✅ mypy type checking passed
- ✅ ruff formatting passed
- ✅ Search фільтрація працює
- ✅ 5 sort варіантів реалізовані
- ✅ Backward compatibility збережена

---

## Приклади використання

```python
# Default
topics, total = await topic_crud.list()

# Search кириличним текстом
topics, total = await topic_crud.list(search="проект")

# Sort alphabetically
topics, total = await topic_crud.list(sort_by="name_asc")

# Комбінація
topics, total = await topic_crud.list(
    search="python",
    sort_by="updated_desc",
    skip=0,
    limit=20,
)
```

---

## Готово для наступного кроку

✅ Service layer готовий
➡️ **Next:** Batch 2 - API endpoint parameters
