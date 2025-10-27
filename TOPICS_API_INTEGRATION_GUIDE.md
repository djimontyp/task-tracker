# Topics API Integration Guide for Frontend

**Version:** 1.0
**Last Updated:** 2025-10-27
**Status:** ✅ Production Ready

## Quick Start

```typescript
// Basic usage
const response = await fetch('/api/v1/topics?skip=0&limit=10');
const data: TopicListResponse = await response.json();

console.log(`Found ${data.total} topics`);
console.log(`Showing page ${data.page} (${data.items.length} items)`);
```

## TypeScript Types

```typescript
interface TopicPublic {
  id: number;
  name: string;
  description: string;
  icon: string;         // Heroicon name (e.g., "CodeBracketIcon")
  color: string;        // Hex color (e.g., "#8B5CF6")
  created_at: string;   // ISO 8601 timestamp
  updated_at: string;   // ISO 8601 timestamp
}

interface TopicListResponse {
  items: TopicPublic[];
  total: number;        // Total matching records (after search filter)
  page: number;         // Current page number (1-indexed)
  page_size: number;    // Requested page size
}

type SortOption =
  | "name_asc"        // Alphabetical A→Z
  | "name_desc"       // Alphabetical Z→A
  | "created_desc"    // Newest first (default)
  | "created_asc"     // Oldest first
  | "updated_desc";   // Recently updated first

interface TopicsQueryParams {
  skip?: number;        // Default: 0, min: 0
  limit?: number;       // Default: 100, range: 1-1000
  search?: string;      // Optional search query
  sort_by?: SortOption; // Default: "created_desc"
}
```

## Usage Examples

### 1. Basic Listing (with Pagination)

```typescript
async function getTopics(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize;
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: pageSize.toString(),
  });

  const response = await fetch(`/api/v1/topics?${params}`);
  return await response.json() as TopicListResponse;
}

// Usage
const data = await getTopics(1, 20); // Get first page, 20 items
```

### 2. Search with Cyrillic Support

```typescript
async function searchTopics(query: string, limit: number = 10) {
  const params = new URLSearchParams({
    search: query,  // URLSearchParams handles encoding automatically
    limit: limit.toString(),
  });

  const response = await fetch(`/api/v1/topics?${params}`);
  return await response.json() as TopicListResponse;
}

// Examples
await searchTopics("API");           // Search for "API"
await searchTopics("проект");        // Search with Cyrillic
await searchTopics("документація");  // Ukrainian text
```

### 3. Sorting

```typescript
async function getTopicsSorted(sortBy: SortOption, limit: number = 10) {
  const params = new URLSearchParams({
    sort_by: sortBy,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/v1/topics?${params}`);
  return await response.json() as TopicListResponse;
}

// Examples
await getTopicsSorted("name_asc");      // Alphabetical
await getTopicsSorted("created_desc");  // Newest first
await getTopicsSorted("updated_desc");  // Recently updated
```

### 4. Combined: Search + Sort + Pagination

```typescript
interface TopicsFilterOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: SortOption;
}

async function getFilteredTopics(options: TopicsFilterOptions = {}) {
  const {
    page = 1,
    pageSize = 10,
    search,
    sortBy = "created_desc",
  } = options;

  const skip = (page - 1) * pageSize;
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: pageSize.toString(),
    sort_by: sortBy,
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`/api/v1/topics?${params}`);
  return await response.json() as TopicListResponse;
}

// Usage
await getFilteredTopics({
  page: 2,
  pageSize: 20,
  search: "API",
  sortBy: "name_asc",
});
```

### 5. React Hook Example

```typescript
import { useState, useEffect } from 'react';

interface UseTopicsOptions {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: SortOption;
}

function useTopics(options: UseTopicsOptions) {
  const [data, setData] = useState<TopicListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);

      try {
        const { page, pageSize, search, sortBy = "created_desc" } = options;
        const skip = (page - 1) * pageSize;

        const params = new URLSearchParams({
          skip: skip.toString(),
          limit: pageSize.toString(),
          sort_by: sortBy,
        });

        if (search) {
          params.append('search', search);
        }

        const response = await fetch(`/api/v1/topics?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [options.page, options.pageSize, options.search, options.sortBy]);

  return { data, loading, error };
}

// Usage in component
function TopicsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created_desc");

  const { data, loading, error } = useTopics({
    page,
    pageSize: 20,
    search,
    sortBy,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <p>Total: {data.total} topics</p>
      <p>Page: {data.page}</p>

      {data.items.map(topic => (
        <div key={topic.id}>
          <h3>{topic.name}</h3>
          <p>{topic.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 6. TanStack Query (React Query) Example

```typescript
import { useQuery } from '@tanstack/react-query';

function useTopicsQuery(options: TopicsFilterOptions) {
  return useQuery({
    queryKey: ['topics', options],
    queryFn: () => getFilteredTopics(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
function TopicsTable() {
  const [filters, setFilters] = useState<TopicsFilterOptions>({
    page: 1,
    pageSize: 20,
    sortBy: "created_desc",
  });

  const { data, isLoading, error } = useTopicsQuery(filters);

  // ... render logic
}
```

## Common Patterns

### Infinite Scroll

```typescript
async function loadMoreTopics(
  currentItems: TopicPublic[],
  page: number,
  pageSize: number = 20
): Promise<{ items: TopicPublic[]; hasMore: boolean }> {
  const data = await getTopics(page, pageSize);

  return {
    items: [...currentItems, ...data.items],
    hasMore: data.items.length === pageSize, // Has more if full page
  };
}
```

### Debounced Search

```typescript
import { useState, useEffect } from 'react';

function useDebouncedSearch(delay: number = 300) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, delay);

    return () => clearTimeout(timer);
  }, [search, delay]);

  return { search, setSearch, debouncedSearch };
}

// Usage
function SearchableTopicsList() {
  const { search, setSearch, debouncedSearch } = useDebouncedSearch();
  const { data } = useTopics({
    page: 1,
    pageSize: 20,
    search: debouncedSearch, // Use debounced value for API
  });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search topics..."
      />
      {/* Render topics */}
    </div>
  );
}
```

### Empty State Handling

```typescript
function TopicsList({ data }: { data: TopicListResponse }) {
  if (data.total === 0) {
    return <EmptyState message="No topics found" />;
  }

  if (data.items.length === 0 && data.total > 0) {
    return <EmptyState message="No topics on this page" />;
  }

  return (
    <div>
      {data.items.map(topic => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </div>
  );
}
```

## Important Notes

### 1. URL Encoding (Cyrillic)
```typescript
// ✅ GOOD - URLSearchParams handles encoding
const params = new URLSearchParams({ search: "проект" });
fetch(`/api/v1/topics?${params}`);

// ✅ ALSO GOOD - Manual encoding
const encoded = encodeURIComponent("проект");
fetch(`/api/v1/topics?search=${encoded}`);

// ❌ BAD - No encoding (will fail)
fetch(`/api/v1/topics?search=проект`); // Invalid HTTP request
```

### 2. Pagination Math
```typescript
// Calculate skip from page number
const skip = (page - 1) * pageSize;

// Calculate total pages
const totalPages = Math.ceil(total / pageSize);

// Calculate current page from skip
const currentPage = Math.floor(skip / pageSize) + 1;
```

### 3. Default Behavior
```typescript
// These are equivalent
fetch('/api/v1/topics');
fetch('/api/v1/topics?skip=0&limit=100&sort_by=created_desc');
```

### 4. Invalid Sort Fallback
```typescript
// Invalid sort_by falls back to default (created_desc)
// No error thrown - graceful degradation
fetch('/api/v1/topics?sort_by=invalid'); // Uses created_desc
```

### 5. Case-Sensitive Sorting
```typescript
// name_asc and name_desc are case-sensitive (SQL default)
// "Agroserver" < "AgroServer" (lowercase 'g' < uppercase 'S')
// This is expected SQL behavior, not a bug
```

## Error Handling

```typescript
async function getTopicsSafe(options: TopicsFilterOptions) {
  try {
    const response = await fetch(`/api/v1/topics?${buildParams(options)}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: TopicListResponse = await response.json();

    // Validate response shape
    if (!Array.isArray(data.items) || typeof data.total !== 'number') {
      throw new Error('Invalid response format');
    }

    return { success: true, data } as const;
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error')
    } as const;
  }
}
```

## Performance Considerations

1. **Optimal Page Size:** 20-50 items for most use cases
2. **Large Datasets:** Use `limit=100` for initial load, then paginate
3. **Search Debouncing:** Wait 300ms after user stops typing
4. **Caching:** Cache results for 5 minutes (stale-while-revalidate)
5. **Prefetching:** Prefetch next page on scroll near bottom

## Testing Examples

```typescript
describe('Topics API', () => {
  it('should fetch topics with pagination', async () => {
    const data = await getTopics(1, 10);
    expect(data.items).toHaveLength(10);
    expect(data.page).toBe(1);
    expect(data.page_size).toBe(10);
  });

  it('should search topics with Cyrillic', async () => {
    const data = await searchTopics("проект");
    expect(data.total).toBeGreaterThan(0);
    expect(data.items[0].name).toContain("Проект");
  });

  it('should sort topics by name ascending', async () => {
    const data = await getTopicsSorted("name_asc");
    const names = data.items.map(t => t.name);
    expect(names).toEqual([...names].sort());
  });

  it('should handle empty results', async () => {
    const data = await searchTopics("nonexistent123");
    expect(data.total).toBe(0);
    expect(data.items).toEqual([]);
  });
});
```

## API Checklist for Frontend

Before deploying, ensure:

- [ ] URL encoding for Cyrillic search terms
- [ ] Pagination calculation: `skip = (page - 1) * pageSize`
- [ ] Default sort_by to "created_desc" if not specified
- [ ] Empty state handling (total === 0)
- [ ] Error handling for network failures
- [ ] Debouncing for search input (300ms recommended)
- [ ] Loading states during fetch
- [ ] TypeScript types match API contract
- [ ] Test with real API (not mocked)

---

## Support

**API Documentation:** `/Users/maks/PycharmProjects/task-tracker/BATCH_3_VALIDATION_RESULTS.md`
**Test Script:** `/Users/maks/PycharmProjects/task-tracker/backend/scripts/final_api_validation.sh`
**Backend Service:** `TopicCRUD` in `/Users/maks/PycharmProjects/task-tracker/backend/app/services/topic_crud.py`

For questions or issues, refer to the validation results document.

---

**Last Validated:** 2025-10-27 08:40 UTC
**Status:** ✅ All 23 tests passed
