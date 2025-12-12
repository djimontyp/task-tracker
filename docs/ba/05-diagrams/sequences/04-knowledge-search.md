# Sequence: Knowledge Search (Semantic)

**Flow:** Knowledge Search
**Actor:** Developer
**Related Use Case:** UC-020
**Related User Flow:** [Knowledge Search](../flows/README.md#flow-4-knowledge-search)

---

## Participants

| Component | Technology | Role |
|-----------|------------|------|
| Browser | React SPA | User interface |
| API | FastAPI | REST endpoints |
| SemanticSearchService | Python | Search orchestration |
| EmbeddingService | Python | Vector generation |
| OpenAI | External API | Embeddings model |
| pgvector | PostgreSQL ext | Vector similarity |

---

## Sequence Diagram

```
┌─────────┐       ┌─────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────┐       ┌─────────┐
│ Browser │       │   API   │       │SemanticSearch   │       │EmbeddingService │       │ OpenAI  │       │pgvector │
└────┬────┘       └────┬────┘       └────────┬────────┘       └────────┬────────┘       └────┬────┘       └────┬────┘
     │                 │                     │                         │                     │                 │
     │  [1] User types "postgresql migration"│                         │                     │                 │
     │  (300ms debounce)                     │                         │                     │                 │
     │                 │                     │                         │                     │                 │
     │  GET /api/v1/search/messages          │                         │                     │                 │
     │  ?query=postgresql%20migration        │                         │                     │                 │
     │  &provider_id=uuid-openai             │                         │                     │                 │
     │  &limit=10                            │                         │                     │                 │
     │────────────────►│                     │                         │                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │  [2] Validate provider exists                 │                     │                 │
     │                 │  SELECT * FROM llm_providers                  │                     │                 │
     │                 │  WHERE id = uuid-openai                       │                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │  [3] search_messages(query, provider_id, limit=10)                  │                 │
     │                 │────────────────────►│                         │                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │  [4] embed_text(query)  │                     │                 │
     │                 │                     │────────────────────────►│                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │                         │  [5] POST /v1/embeddings             │
     │                 │                     │                         │  {                  │                 │
     │                 │                     │                         │    model: "text-embedding-3-small",  │
     │                 │                     │                         │    input: "postgresql migration"     │
     │                 │                     │                         │  }                  │                 │
     │                 │                     │                         │─────────────────────►                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │                         │                     │  ~200ms         │
     │                 │                     │                         │                     │                 │
     │                 │                     │                         │◄─────────────────────                 │
     │                 │                     │                         │  {                  │                 │
     │                 │                     │                         │    embedding: [0.023, -0.041, ...]   │
     │                 │                     │                         │    (1536 dimensions)│                 │
     │                 │                     │                         │  }                  │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │◄────────────────────────│                     │                 │
     │                 │                     │  query_vector[1536]     │                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │  [6] Vector similarity search                 │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │  SELECT                 │                     │                 │
     │                 │                     │    m.id, m.content, m.sent_at,                │                 │
     │                 │                     │    1 - (m.embedding <-> query_vec) as similarity                │
     │                 │                     │  FROM messages m        │                     │                 │
     │                 │                     │  WHERE m.embedding IS NOT NULL                │                 │
     │                 │                     │  ORDER BY m.embedding <-> query_vec           │                 │
     │                 │                     │  LIMIT 10               │                     │                 │
     │                 │                     │─────────────────────────────────────────────────────────────────►
     │                 │                     │                         │                     │                 │
     │                 │                     │                         │                     │      ~50ms      │
     │                 │                     │                         │                     │                 │
     │                 │                     │◄─────────────────────────────────────────────────────────────────
     │                 │                     │  [                      │                     │                 │
     │                 │                     │    {id: "msg-1", content: "...", similarity: 0.92},             │
     │                 │                     │    {id: "msg-2", content: "...", similarity: 0.87},             │
     │                 │                     │    ...                  │                     │                 │
     │                 │                     │  ]                      │                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │  [7] Filter by threshold│                     │                 │
     │                 │                     │  WHERE similarity >= 0.7│                     │                 │
     │                 │                     │                         │                     │                 │
     │                 │                     │  [8] Enrich with related atoms               │                 │
     │                 │                     │  SELECT * FROM atoms    │                     │                 │
     │                 │                     │  WHERE message_id IN (...)                    │                 │
     │                 │                     │                         │                     │                 │
     │                 │◄────────────────────│                         │                     │                 │
     │                 │  SearchResults      │                         │                     │                 │
     │                 │                     │                         │                     │                 │
     │◄────────────────│                     │                         │                     │                 │
     │  (200) {        │                     │                         │                     │                 │
     │    query: "postgresql migration",    │                         │                     │                 │
     │    results: [   │                     │                         │                     │                 │
     │      {          │                     │                         │                     │                 │
     │        message: {...},                │                         │                     │                 │
     │        similarity: 0.92,              │                         │                     │                 │
     │        atoms: [...]                   │                         │                     │                 │
     │      },         │                     │                         │                     │                 │
     │      ...        │                     │                         │                     │                 │
     │    ],           │                     │                         │                     │                 │
     │    total: 8     │                     │                         │                     │                 │
     │  }              │                     │                         │                     │                 │
     │                 │                     │                         │                     │                 │
     │  [9] Render search results            │                         │                     │                 │
     │  - Highlight matching terms           │                         │                     │                 │
     │  - Show similarity score              │                         │                     │                 │
     │  - Link to related atoms              │                         │                     │                 │
     │                 │                     │                         │                     │                 │
     ▼                 ▼                     ▼                         ▼                     ▼                 ▼
```

---

## Alternative: Atom Search

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Browser │       │   API   │       │pgvector │
└────┬────┘       └────┬────┘       └────┬────┘
     │                 │                 │
     │  GET /api/v1/search/atoms         │
     │  ?query=database%20decision       │
     │────────────────►│                 │
     │                 │                 │
     │                 │  SELECT * FROM atoms
     │                 │  ORDER BY embedding <-> query_vec
     │                 │  WHERE user_approved = true
     │                 │  LIMIT 10       │
     │                 │────────────────►│
     │                 │◄────────────────│
     │                 │                 │
     │◄────────────────│                 │
     │  (200) AtomSearchResults          │
     │                 │                 │
     ▼                 ▼                 ▼
```

---

## Data Flow

### Request: GET /api/v1/search/messages

**Query Parameters:**
```
query: string         (required) - Natural language query
provider_id: UUID     (required) - LLM provider for embeddings
limit: int            (default: 10, max: 100)
threshold: float      (default: 0.7, range: 0.0-1.0)
include_atoms: bool   (default: true)
```

### Response: SearchResults

```json
{
  "query": "postgresql migration",
  "provider": "openai",
  "model": "text-embedding-3-small",
  "threshold": 0.7,
  "results": [
    {
      "message": {
        "id": "msg-uuid-1",
        "content": "We decided to migrate from MySQL to PostgreSQL...",
        "sent_at": "2025-01-10T14:30:00Z",
        "author": "@john",
        "source": "#engineering"
      },
      "similarity": 0.92,
      "atoms": [
        {
          "id": "atom-uuid-1",
          "type": "decision",
          "title": "Migrate to PostgreSQL 15",
          "user_approved": true
        }
      ]
    },
    {
      "message": {
        "id": "msg-uuid-2",
        "content": "PostgreSQL has better JSON support and pgvector...",
        "sent_at": "2025-01-08T10:15:00Z",
        "author": "@mary",
        "source": "#backend"
      },
      "similarity": 0.87,
      "atoms": []
    }
  ],
  "total": 8,
  "execution_time_ms": 312
}
```

---

## Business Rules Applied

| Rule | Description |
|------|-------------|
| BR-030 | Semantic search requires provider with embedding capability |
| BR-031 | Default threshold 0.7 filters low-relevance results |
| BR-032 | Messages without embeddings are excluded |
| BR-033 | Similarity = 1 - cosine_distance |

---

## Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| OpenAI API | 100-300ms | Network latency |
| pgvector query | 20-100ms | With HNSW index |
| Total response | < 500ms | End-to-end |

---

## pgvector Configuration

```sql
-- Create vector column
ALTER TABLE messages ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_messages_embedding_hnsw
ON messages USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Operator: <-> is cosine distance
-- Lower distance = higher similarity
-- similarity = 1 - distance
```

---

## Error Handling

```
[Error: Provider not found]
     │
     │  (404) {error: "LLM provider uuid-x not found"}
     │
[Error: OpenAI API failed]
     │
     │  Retry with backoff (3 attempts)
     │  Fallback to Ollama if configured
     │  (503) {error: "Embedding service unavailable"}
     │
[Error: No results above threshold]
     │
     │  (200) {results: [], total: 0, suggestion: "Try broader terms"}
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     EMBEDDING CACHE                          │
│                                                              │
│  Key: hash(query + provider_id)                             │
│  TTL: 1 hour                                                 │
│  Storage: Redis                                              │
│                                                              │
│  On cache hit: skip OpenAI call, use cached vector          │
│  On cache miss: call OpenAI, store result                   │
│                                                              │
│  Benefit: Repeated queries ~10x faster                      │
└─────────────────────────────────────────────────────────────┘
```

---

**Next:** [User Invitation Sequence](05-user-invitation.md)
