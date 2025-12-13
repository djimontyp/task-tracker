# Quickstart: Keyword Search (003-search)

**Date**: 2025-12-13

## Prerequisites

- Docker Compose running (`just services-dev`)
- Database seeded (`just db-full-seed`)
- Frontend dev server (`http://localhost`)

## Quick Verification

### 1. Test Backend FTS Endpoint

```bash
# Search for "authentication"
curl "http://localhost/api/v1/search?q=authentication&limit=5" | jq

# Expected response structure:
# {
#   "topics": [...],
#   "messages": [...],
#   "atoms": [...],  # NEW - should be present after implementation
#   "total_results": N,
#   "query": "authentication"
# }
```

### 2. Test Frontend Search

1. Open `http://localhost/dashboard`
2. Press `/` or click search bar in header
3. Type "authentication"
4. **Expected**: Dropdown appears with grouped results (Messages, Atoms)
5. Click any result → navigates to source page

### 3. Verify Keyboard Navigation

1. Focus search bar (press `/`)
2. Type query
3. Use `↓`/`↑` to navigate results
4. Press `Enter` to select
5. Press `Esc` to close dropdown

## Development Workflow

### Backend Changes

```bash
# Location: backend/app/api/v1/search.py

# Run typecheck after changes
just typecheck

# Run tests
cd backend && uv run pytest tests/api/test_search.py -v
```

### Frontend Changes

```bash
# Location: frontend/src/features/search/

# TypeScript check
cd frontend && npx tsc --noEmit

# Run component tests
npm run test -- SearchBar

# Run Storybook for visual testing
npm run storybook
```

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `backend/app/api/v1/search.py` | FTS endpoint (modify) |
| `backend/tests/api/test_search.py` | API tests (create) |

### Frontend

| File | Purpose |
|------|---------|
| `frontend/src/features/search/api/searchService.ts` | API client (modify) |
| `frontend/src/features/search/components/SearchBar.tsx` | Search input (modify) |
| `frontend/src/features/search/components/SearchDropdown.tsx` | Results dropdown (create) |
| `frontend/src/features/search/types/index.ts` | TypeScript types (modify) |

## API Usage

### Frontend Service

```typescript
import { searchService } from '@/features/search'

// FTS search (keyword-based)
const results = await searchService.searchFTS('authentication', 5)

// Results structure
console.log(results.messages)  // MessageSearchResult[]
console.log(results.atoms)     // AtomSearchResult[]
console.log(results.topics)    // TopicSearchResult[]
```

### TanStack Query Hook

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['fts-search', query],
  queryFn: () => searchService.searchFTS(query, 5),
  enabled: query.trim().length >= 2,
  staleTime: 30_000,
})
```

## Component Structure

```tsx
// SearchBar.tsx
<div className="relative">
  <Input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search... (/)"
  />

  <Popover open={showDropdown}>
    <PopoverContent>
      <Command>
        <CommandList>
          <CommandGroup heading={`Messages (${messages.length})`}>
            {messages.map(m => <CommandItem key={m.id} />)}
          </CommandGroup>
          <CommandGroup heading={`Atoms (${atoms.length})`}>
            {atoms.map(a => <CommandItem key={a.id} />)}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
```

## Testing Checklist

- [ ] FTS returns topics, messages, AND atoms
- [ ] Dropdown shows grouped results
- [ ] Keyboard navigation works (↓↑ Enter Esc)
- [ ] Click result navigates to correct page
- [ ] "Show all" links to `/search?q=...`
- [ ] Empty state shows helpful message
- [ ] Loading spinner during search
- [ ] Debounce prevents excessive API calls
- [ ] Mobile search works via Sheet

## Common Issues

### No Atoms in Results

Check FTS index exists:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'atoms';
-- Should include idx_atoms_fts
```

### Slow Search

1. Check index usage: `EXPLAIN ANALYZE` on search query
2. Verify `to_tsvector` index exists for searched columns

### Dropdown Not Showing

1. Check `query.length >= 2` (minimum query length)
2. Verify API response is not empty
3. Check Popover `open` state

## Next Steps After Implementation

1. Run `/speckit.tasks` to generate task breakdown
2. Implement backend changes first (API)
3. Then frontend (SearchDropdown component)
4. Add tests
5. Update Storybook stories
