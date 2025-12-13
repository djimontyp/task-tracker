# Research: Keyword Search (003-search)

**Date**: 2025-12-13
**Status**: Complete

## Existing Implementation Analysis

### Backend Search APIs

| Endpoint | Type | Entities | Status |
|----------|------|----------|--------|
| `GET /api/v1/search` | FTS | Topics, Messages | Exists |
| `GET /api/v1/search/messages` | Semantic | Messages | Exists |
| `GET /api/v1/search/atoms` | Semantic | Atoms | Exists |
| `GET /api/v1/search/topics` | Semantic | Topics | Exists |

**Finding**: FTS endpoint (`/api/v1/search`) covers Topics + Messages but **not Atoms**.

### Backend FTS Implementation

**File**: `backend/app/api/v1/search.py`

```python
# Current search uses PostgreSQL to_tsvector/to_tsquery
# Topics: name + description
# Messages: content
# Atoms: NOT INCLUDED
```

**Decision**: Extend existing FTS endpoint to include Atoms (title + content).

### Frontend Search Components

| Component | Location | Current Behavior |
|-----------|----------|------------------|
| `SearchBar` | `features/search/components/SearchBar.tsx` | Navigates to `/search?q=...` |
| `SearchPage` | `pages/SearchPage/index.tsx` | Uses **semantic search** (not FTS!) |
| `MobileSearch` | `shared/components/MobileSearch.tsx` | Sheet with SearchBar |

**Finding**: Current SearchPage uses semantic search with Ollama provider. Spec requires **keyword (FTS)** search with inline dropdown.

### Available UI Components

| Component | Package | Use Case |
|-----------|---------|----------|
| `Command` | cmdk via shadcn | Command palette with search |
| `Popover` | @radix-ui/react-popover | Dropdown positioning |
| `CommandDialog` | cmdk + Dialog | Modal search |

**Decision**: Use `Popover` + `Command` for inline search dropdown (not CommandDialog which is modal).

## Technology Decisions

### 1. Search Type: FTS vs Semantic

| Aspect | FTS (PostgreSQL) | Semantic (pgvector) |
|--------|------------------|---------------------|
| Speed | ~10-50ms | ~100-500ms (embedding generation) |
| Dependencies | PostgreSQL only | LLM Provider required |
| Matching | Exact + partial keywords | Conceptual similarity |
| Spec requirement | ✅ "keyword search" | ❌ Out of scope (US-021) |

**Decision**: Use FTS for this feature. Semantic search remains available on `/search` page for advanced use.

### 2. Dropdown Implementation

**Option A: Popover + Command** (Recommended)
- Pros: Keyboard navigation, grouped results, accessible
- Cons: Slightly more complex

**Option B: Custom dropdown**
- Pros: Full control
- Cons: Must implement keyboard nav, a11y

**Decision**: Use Popover + Command for built-in keyboard navigation and accessibility.

### 3. Result Highlighting

PostgreSQL `ts_headline` function already returns HTML with `<mark>` tags:
```sql
ts_headline('simple', content, to_tsquery('simple', :query),
            'MaxWords=50, MinWords=20, StartSel=<mark>, StopSel=</mark>')
```

**Decision**: Use existing `ts_headline` output, render safely with `dangerouslySetInnerHTML` + sanitization.

### 4. Debounce Strategy

**Spec**: 300ms debounce (FR-007)

**Implementation**:
- Frontend: `useDebounce` hook (already exists at `shared/hooks/useDebounce`)
- Backend: No server-side debounce needed

### 5. Results Limit

**Spec**: 5 results per group in dropdown, "Show all" link to full page

**Implementation**:
- Add `limit` query param to FTS endpoint (default 10, dropdown uses 5)
- "Show all" links to `/search?q=...` for full results

## API Contract Changes

### Extended FTS Response

```typescript
interface SearchResultsResponse {
  topics: TopicSearchResult[]
  messages: MessageSearchResult[]
  atoms: AtomSearchResult[]  // NEW
  total_results: number
  query: string
}

interface AtomSearchResult {
  id: string  // UUID
  type: string  // problem, solution, decision, etc.
  title: string
  content_snippet: string  // ts_headline output
  rank: float
}
```

### Endpoint Changes

```
GET /api/v1/search?q={query}&limit={limit}

Response:
- topics: TopicSearchResult[] (max `limit`)
- messages: MessageSearchResult[] (max `limit`)
- atoms: AtomSearchResult[] (max `limit`)  // NEW
- total_results: number
- query: string
```

## Component Architecture

```
SearchBar
├── Input (trigger)
├── Popover
│   └── Command
│       ├── CommandInput (hidden, controlled by outer Input)
│       ├── CommandList
│       │   ├── CommandGroup heading="Messages (N)"
│       │   │   ├── CommandItem × 5
│       │   │   └── "Show all" link
│       │   ├── CommandSeparator
│       │   ├── CommandGroup heading="Atoms (N)"
│       │   │   ├── CommandItem × 5
│       │   │   └── "Show all" link
│       │   └── CommandEmpty (no results)
│       └── Loading state (Spinner)
└── Keyboard shortcuts (/ to focus, Esc to close)
```

## Alternatives Considered

### 1. Replace SearchPage with FTS only
**Rejected**: Semantic search is valuable for cross-language queries (spec mentions Ukrainian support).

### 2. Use CommandDialog (modal) instead of Popover
**Rejected**: Spec requires "inline dropdown/popover" without page navigation.

### 3. Client-side search (no API)
**Rejected**: Not scalable, data is in PostgreSQL.

## Performance Considerations

1. **Index requirement**: `to_tsvector` indexes should exist on:
   - `topics.name`, `topics.description`
   - `messages.content`
   - `atoms.title`, `atoms.content` (NEW)

2. **Query optimization**: Use ILIKE fallback for short queries (< 3 chars) where FTS is less effective.

3. **Caching**: TanStack Query with 30s staleTime for search results.

## Testing Strategy

### Backend
- Unit tests for FTS query builder
- Integration tests for Atoms search
- Edge cases: special characters, SQL injection, empty results

### Frontend
- Component tests: SearchBar dropdown rendering
- Integration tests: API mocking with MSW
- E2E: Full search flow with Playwright

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| FTS or Semantic? | FTS for keyword search (spec requirement) |
| Dropdown component? | Popover + Command (cmdk) |
| Atoms in search? | Yes, extend FTS endpoint |
| Keep SearchPage? | Yes, for "Show all" and semantic search |
