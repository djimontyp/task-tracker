# Backend Batch 2: API Endpoint Parameters

**Status:** ✅ Completed
**Duration:** ~15 хвилин
**Agent:** fastapi-backend-expert

---

## Зміни

**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/topics.py:49-87`

**Added Parameters:**
```python
async def list_topics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None, description="Search by name or description"),
    sort_by: str | None = Query("created_desc", description="Sort criteria: name_asc, name_desc, created_desc, created_asc, updated_desc"),
    session: AsyncSession = Depends(get_session),
) -> TopicListResponse:
```

---

## API Contract for Frontend

**Endpoint:** `GET /api/v1/topics`

**Query Parameters:**
- `skip?: number` (default: 0)
- `limit?: number` (default: 100, max: 1000)
- `search?: string` - Filter by name/description
- `sort_by?: "name_asc" | "name_desc" | "created_desc" | "created_asc" | "updated_desc"` (default: "created_desc")

**Response:** `TopicListResponse` (unchanged structure)

---

## Verification ✅

- ✅ Mypy type checking passed
- ✅ Ruff linting passed
- ✅ OpenAPI docs show new parameters
- ✅ All parameter combinations tested
- ✅ Backward compatibility confirmed

---

## Test Results

| Test Case | Result | Details |
|-----------|--------|---------|
| Basic list | ✅ | 27 topics |
| Search "Dog" | ✅ | 1 topic found |
| Sort name_asc | ✅ | A→Z |
| Sort name_desc | ✅ | Z→A |
| Combined | ✅ | Works together |
| Backward compat | ✅ | Old calls work |

---

## cURL Examples

```bash
# Search
curl "http://localhost:8000/api/v1/topics?search=API"

# Sort
curl "http://localhost:8000/api/v1/topics?sort_by=name_asc"

# Combined
curl "http://localhost:8000/api/v1/topics?search=Backend&sort_by=name_asc&limit=10"
```

---

## Next

➡️ **Batch 3:** Backend testing (кириличний пошук, великі датасети)
