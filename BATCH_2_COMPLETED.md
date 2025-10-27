# Batch 2: API Endpoint Parameters - COMPLETED ✅

## Changes Summary

### Modified Files

**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/topics.py`
**Lines:** 43-87 (function `list_topics()`)

### Changes Made

1. **Added Query Parameters:**
   - `search: str | None` - Search by name or description (optional)
   - `sort_by: str | None` - Sort criteria with default "created_desc" (optional)

2. **Updated Endpoint Signature:**
   ```python
   @router.get(
       "",
       response_model=TopicListResponse,
       summary="List topics",
       description="Get list of all topics with pagination, search, and sorting.",
   )
   async def list_topics(
       skip: int = Query(0, ge=0, description="Number of records to skip"),
       limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
       search: str | None = Query(None, description="Search by name or description"),
       sort_by: str | None = Query(
           "created_desc",
           description="Sort criteria: name_asc, name_desc, created_desc, created_asc, updated_desc",
       ),
       session: AsyncSession = Depends(get_session),
   ) -> TopicListResponse:
   ```

3. **Passed Parameters to TopicCRUD:**
   ```python
   topics, total = await crud.list(
       skip=skip,
       limit=limit,
       search=search,
       sort_by=sort_by,
   )
   ```

## Verification Results

### ✅ Type Safety
- FastAPI typecheck passed (no mypy errors in topics.py)
- Ruff linting passed

### ✅ OpenAPI Schema
- Parameters correctly appear in OpenAPI documentation
- Descriptions and defaults properly configured
- Available at: http://localhost:8000/docs

### ✅ API Testing
All endpoint variations work correctly:

1. **Basic list (backward compatible):**
   ```bash
   curl "http://localhost:8000/api/v1/topics?skip=0&limit=10"
   # Returns: 27 total topics, 10 items
   ```

2. **Search functionality:**
   ```bash
   curl "http://localhost:8000/api/v1/topics?search=Dog"
   # Returns: 1 topic matching "Dog" in name/description
   ```

3. **Sort by name ascending:**
   ```bash
   curl "http://localhost:8000/api/v1/topics?sort_by=name_asc&limit=3"
   # Returns: ["Administrative Tasks", "Agroserver Upgrade Issues", "AgroServer Upgrade Log Issues"]
   ```

4. **Sort by name descending:**
   ```bash
   curl "http://localhost:8000/api/v1/topics?sort_by=name_desc&limit=3"
   # Returns: ["Translate Dog Over the Road", "Test Patterns", "Test Data Input"]
   ```

5. **Combined parameters:**
   ```bash
   curl "http://localhost:8000/api/v1/topics?skip=0&limit=2&search=&sort_by=created_desc"
   # Returns: 27 total, 2 items with newest first
   ```

### ✅ Backward Compatibility
- Old clients using only `skip` and `limit` work without changes
- Response structure unchanged (TopicListResponse)
- No breaking changes introduced

## API Contract for Frontend Team

### Endpoint: `GET /api/v1/topics`

**Description:** List all topics with pagination, search, and sorting support.

**Query Parameters:**

| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `skip` | integer | 0 | No | Number of records to skip (pagination offset) |
| `limit` | integer | 100 | No | Maximum number of records to return (1-1000) |
| `search` | string | null | No | Search query for filtering by name or description |
| `sort_by` | string | "created_desc" | No | Sort criteria (see values below) |

**Sort Values:**
- `name_asc` - Sort by name A→Z
- `name_desc` - Sort by name Z→A
- `created_desc` - Sort by creation date (newest first) **[DEFAULT]**
- `created_asc` - Sort by creation date (oldest first)
- `updated_desc` - Sort by update date (newest first)

**Response Schema:**
```typescript
interface TopicListResponse {
  items: Topic[];        // Array of topic objects
  total: number;         // Total count of topics (after filtering)
  page: number;          // Current page number
  page_size: number;     // Number of items per page
}

interface Topic {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;         // Hex color format (e.g., "#64748B")
  created_at: string;    // ISO 8601 datetime with timezone
  updated_at: string;    // ISO 8601 datetime with timezone
}
```

**Example Requests:**

```bash
# Get all topics (default sorting by created_desc)
GET /api/v1/topics

# Search for topics containing "API"
GET /api/v1/topics?search=API

# Get topics sorted alphabetically
GET /api/v1/topics?sort_by=name_asc

# Pagination with custom sorting
GET /api/v1/topics?skip=20&limit=10&sort_by=updated_desc

# Combined: search + sort + pagination
GET /api/v1/topics?search=Backend&sort_by=name_asc&skip=0&limit=20
```

**Status Codes:**
- `200 OK` - Successfully retrieved topics
- `422 Unprocessable Entity` - Invalid parameter values

## Check-in Criteria Status

- ✅ FastAPI typecheck passes (no errors in topics.py)
- ✅ OpenAPI docs show new parameters with descriptions
- ✅ Can call endpoint with all parameter combinations
- ✅ Response structure unchanged (backward compatible)
- ✅ Ruff linting passes

## Next Steps

**Batch 3:** Write integration tests for the new parameters
- Test search filtering
- Test all sort_by variants
- Test parameter combinations
- Test edge cases (empty search, invalid sort_by)
