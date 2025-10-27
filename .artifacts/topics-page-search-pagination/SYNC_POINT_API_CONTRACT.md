# SYNC POINT: API Contract для Frontend Team

**Timestamp:** 2025-10-27
**From:** Backend Phase 1 (completed ✅)
**To:** Frontend Phase 2 (starting)

---

## API Endpoint Specification

**URL:** `GET /api/v1/topics`

**Base URL:** `http://localhost:8000` (dev) або `http://localhost/api` (через Nginx proxy)

---

## Query Parameters

```typescript
interface TopicsQueryParams {
  skip?: number;      // Default: 0, min: 0
  limit?: number;     // Default: 100, range: 1-1000
  search?: string;    // Optional, UTF-8/Cyrillic supported, case-insensitive
  sort_by?: TopicSortBy; // Default: "created_desc"
}

type TopicSortBy =
  | "name_asc"        // Alphabetical A→Z
  | "name_desc"       // Alphabetical Z→A
  | "created_desc"    // Newest first (default)
  | "created_asc"     // Oldest first
  | "updated_desc";   // Recently updated first
```

---

## Response Structure

```typescript
interface TopicListResponse {
  items: TopicPublic[];
  total: number;        // Total matching records
  page: number;         // Current page (1-indexed)
  page_size: number;    // Requested page size
}

interface TopicPublic {
  id: number;
  name: string;
  description: string;
  icon?: string;
  color?: string;       // Hex format: "#RRGGBB"
  created_at: string;   // ISO 8601
  updated_at: string;   // ISO 8601
}
```

---

## Frontend Implementation Requirements

### 1. Service Layer Update

**File:** `frontend/src/features/topics/api/topicService.ts`

**Add interface:**
```typescript
interface ListTopicsParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: TopicSortBy;
}
```

**Update method:**
```typescript
async listTopics(params?: ListTopicsParams): Promise<TopicListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.page) {
    const skip = (params.page - 1) * (params.page_size || 24);
    queryParams.append('skip', skip.toString());
  }
  if (params?.page_size) queryParams.append('limit', params.page_size.toString());

  const response = await fetch(`/api/v1/topics?${queryParams}`);
  return response.json();
}
```

---

### 2. State Management (TanStack Query)

**Query Key Pattern:**
```typescript
['topics', { page: number, search: string, sort_by: string }]
```

**Example:**
```typescript
const { data: topics, isLoading } = useQuery({
  queryKey: ['topics', { page: currentPage, search: searchQuery, sort_by: sortBy }],
  queryFn: () => topicService.listTopics({
    page: currentPage,
    page_size: 24,
    search: searchQuery,
    sort_by: sortBy,
  }),
});
```

---

### 3. UI Components Needed

#### Search Bar
- Input з debouncing 300ms
- Placeholder: "Пошук топіків за назвою чи описом..."
- Іконка пошуку
- Clear button
- Показувати "Found X topics"

#### Sort Dropdown
- shadcn Select компонент
- 5 опцій (label + value):
  ```typescript
  const sortOptions = [
    { label: "Спочатку нові", value: "created_desc" },
    { label: "Спочатку старі", value: "created_asc" },
    { label: "Назва А-Я", value: "name_asc" },
    { label: "Назва Я-А", value: "name_desc" },
    { label: "Недавно оновлені", value: "updated_desc" },
  ];
  ```

#### Pagination Controls
- shadcn Pagination компонент
- Previous/Next buttons
- Page numbers (1, 2, 3, ..., N)
- "Showing X-Y of Z topics"
- pageSize = 24 (2 rows × 12 columns)

---

## Validation Checklist

✅ **Backend готовий:**
- Search працює з кириличними символами
- 5 sort опцій працюють коректно
- Pagination протестована на 60+ топіках
- API contract стабільний

**Frontend має реалізувати:**
- [ ] Service layer з параметрами
- [ ] Search bar з debouncing
- [ ] Sort dropdown
- [ ] Pagination controls
- [ ] State management (TanStack Query)

---

## Test Data

**Available for testing:** 60 topics (включаючи кириличні назви)

**Test scenarios:**
1. Search "API" → 4 results
2. Search "проект" → 1 result (Cyrillic)
3. Sort name_asc → A→Z order
4. Pagination → 24 per page

---

## API Health

```bash
# Check API status
curl http://localhost:8000/api/v1/topics

# Test search
curl "http://localhost:8000/api/v1/topics?search=API"

# Test sort
curl "http://localhost:8000/api/v1/topics?sort_by=name_asc"

# Combined
curl "http://localhost:8000/api/v1/topics?search=test&sort_by=name_asc&skip=0&limit=10"
```

---

## Notes

1. **URL Encoding:** Кириличні символи потребують encodeURIComponent() в JavaScript
2. **Debouncing:** Обов'язковий для search input (300ms recommended)
3. **Query Key:** Включає всі параметри для правильного кешування
4. **Reset Pagination:** При зміні search/sort скидати page на 1

---

## Ready to Proceed

✅ Backend API tested and production-ready
➡️ Frontend Phase 2 can start implementation
