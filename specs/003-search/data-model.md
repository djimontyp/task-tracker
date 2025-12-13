# Data Model: Keyword Search (003-search)

**Date**: 2025-12-13

## Overview

This feature extends existing FTS (Full-Text Search) to include Atoms. No new database tables required — only modifications to API response schemas.

## Existing Entities (No Changes)

### Message
**Table**: `messages`
**Searchable fields**: `content`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| content | TEXT | Message body (searchable) |
| sent_at | TIMESTAMP | When sent |
| author_id | INT | FK to users |
| topic_id | UUID | FK to topics (optional) |

### Atom
**Table**: `atoms`
**Searchable fields**: `title`, `content`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| type | VARCHAR(20) | problem, solution, decision, question, insight, pattern, requirement |
| title | VARCHAR(200) | Brief title (searchable) |
| content | TEXT | Full content (searchable) |
| user_approved | BOOLEAN | Approval status |
| archived | BOOLEAN | Archive status |

### Topic
**Table**: `topics`
**Searchable fields**: `name`, `description`

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Topic name (searchable) |
| description | TEXT | Description (searchable) |
| icon | VARCHAR | Icon identifier |
| color | VARCHAR | Hex color |

## API Response Schemas

### SearchResultsResponse (Extended)

```python
class SearchResultsResponse(BaseModel):
    """Search results response."""

    topics: list[TopicSearchResult]
    messages: list[MessageSearchResult]
    atoms: list[AtomSearchResult]  # NEW
    total_results: int
    query: str
```

### AtomSearchResult (New)

```python
class AtomSearchResult(BaseModel):
    """Search result for an atom."""

    id: uuid.UUID
    type: str = Field(description="Atom type: problem, solution, etc.")
    title: str
    content_snippet: str = Field(description="Content snippet with highlighted match (max 200 chars)")
    user_approved: bool
    rank: float = Field(description="Relevance rank score")
```

### TopicSearchResult (Existing)

```python
class TopicSearchResult(BaseModel):
    """Search result for a topic."""

    id: uuid.UUID
    name: str
    description: str | None
    match_snippet: str = Field(description="Highlighted match snippet")
    rank: float = Field(description="Relevance rank score")
```

### MessageSearchResult (Existing)

```python
class MessageSearchResult(BaseModel):
    """Search result for a message."""

    id: uuid.UUID
    content_snippet: str = Field(description="Content snippet with highlighted match (max 200 chars)")
    author: str
    timestamp: datetime
    topic: TopicBrief | None = Field(default=None, description="Linked topic if available")
    rank: float = Field(description="Relevance rank score")
```

### TopicBrief (Existing)

```python
class TopicBrief(BaseModel):
    """Brief topic information for message search results."""

    id: uuid.UUID
    name: str
```

## Frontend Types

### TypeScript Interfaces

```typescript
// Response from FTS endpoint
interface FTSSearchResultsResponse {
  topics: FTSTopicResult[]
  messages: FTSMessageResult[]
  atoms: FTSAtomResult[]  // NEW
  total_results: number
  query: string
}

interface FTSTopicResult {
  id: string  // UUID
  name: string
  description: string | null
  match_snippet: string  // HTML with <mark> tags
  rank: number
}

interface FTSMessageResult {
  id: string  // UUID
  content_snippet: string  // HTML with <mark> tags
  author: string
  timestamp: string  // ISO date
  topic: { id: string; name: string } | null
  rank: number
}

interface FTSAtomResult {
  id: string  // UUID
  type: AtomType
  title: string
  content_snippet: string  // HTML with <mark> tags
  user_approved: boolean
  rank: number
}

type AtomType =
  | 'problem'
  | 'solution'
  | 'decision'
  | 'question'
  | 'insight'
  | 'pattern'
  | 'requirement'
```

## Database Indexes

### Recommended FTS Indexes

For optimal FTS performance, ensure these indexes exist:

```sql
-- Topics (likely exists)
CREATE INDEX IF NOT EXISTS idx_topics_fts
ON topics USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description, '')));

-- Messages (likely exists)
CREATE INDEX IF NOT EXISTS idx_messages_fts
ON messages USING GIN (to_tsvector('simple', content));

-- Atoms (NEW - may need migration)
CREATE INDEX IF NOT EXISTS idx_atoms_fts
ON atoms USING GIN (to_tsvector('simple', title || ' ' || content));
```

## State Management

### Client-Side State

No persistent state required. Search uses TanStack Query with:

```typescript
const searchQueryKey = ['fts-search', query] as const

// Query options
{
  queryKey: searchQueryKey,
  queryFn: () => searchService.searchFTS(query, limit),
  enabled: query.trim().length >= 2,
  staleTime: 30_000,  // 30 seconds
}
```

### URL State

Search query preserved in URL for back navigation:
- Dropdown: No URL change (ephemeral)
- Full page: `/search?q={query}`

## Validation Rules

### Query Validation

| Rule | Value | Error Message |
|------|-------|---------------|
| Min length | 1 char | "Search query cannot be empty" |
| Max length | 256 chars | Query truncated silently (FR requirement) |
| Sanitization | Strip leading/trailing whitespace | N/A |
| Special chars | Escape single quotes for SQL | N/A (handled by parameterized queries) |

### Results Validation

| Constraint | Value |
|------------|-------|
| Max results per group (dropdown) | 5 |
| Max results per group (full page) | 10 (default) |
| Snippet max length | 200 chars |

## State Transitions

No state machine required — search is a stateless query operation.

## Relationships

```
Message ──────┐
              │
Atom ─────────┼──> SearchResult ──> SearchDropdown
              │
Topic ────────┘
```

Each entity is searched independently and results are merged/grouped in response.
