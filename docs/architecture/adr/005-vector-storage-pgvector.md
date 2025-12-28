# ADR-005: Vector Storage - pgvector vs Dedicated Vector Database

**Status:** Accepted
**Date:** 2025-12-28
**Decision makers:** Team

## Context

Pulse Radar requires vector storage for:

1. **Semantic search** - Find similar messages and atoms using cosine similarity
2. **RAG context building** - Retrieve relevant context for LLM prompts
3. **Duplicate detection** - Identify near-duplicate messages using high similarity threshold
4. **Embedding storage** - Store 1536-dimensional vectors from OpenAI text-embedding-3-small

Current system characteristics:
- Expected scale: 10K-100K messages in first year
- Embedding dimensions: 1536 (OpenAI) or 768 (Ollama, padded to 1536)
- Query patterns: similarity search with configurable threshold
- Co-located data: messages, atoms, topics with their embeddings

```python
# Message model with vector embedding
embedding: list[float] | None = Field(
    default=None,
    sa_column=Column(Vector(1536)),
    description="Vector embedding for semantic search"
)
```

## Decision

We chose **pgvector** extension in PostgreSQL rather than a dedicated vector database.

```python
# SemanticSearchService using pgvector cosine distance operator
sql = """
    SELECT
        m.*,
        1 - (m.embedding <=> $1::vector) / 2 AS similarity
    FROM messages m
    WHERE
        m.embedding IS NOT NULL
        AND (1 - (m.embedding <=> $1::vector) / 2) >= $2
    ORDER BY m.embedding <=> $1::vector
    LIMIT $3
"""
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **pgvector** | No additional infrastructure, ACID transactions with entities, familiar PostgreSQL, good performance up to 1M vectors | Slower than specialized DBs at scale, limited index types (IVFFlat, HNSW) |
| **Pinecone** | Managed service, excellent scale, production-ready | Vendor lock-in, additional cost, network latency, data split across systems |
| **Weaviate** | Open source, rich features, GraphQL API | Additional infrastructure, learning curve, overkill for current needs |
| **Milvus** | High performance, cloud-native | Complex deployment, heavy resource usage, Kubernetes preferred |
| **Qdrant** | Good performance, simple API, Rust-based | Additional service to manage, data synchronization overhead |
| **Chroma** | Easy to use, Python-native | Limited scale, in-memory focus, less production-proven |

## Detailed Comparison

### Operational Complexity

| Solution | Infrastructure | Data Sync | Transactions |
|----------|---------------|-----------|--------------|
| pgvector | PostgreSQL only | N/A (same DB) | Full ACID |
| Pinecone | Managed cloud | Required | Eventually consistent |
| Weaviate | Docker/K8s | Required | Limited |
| Qdrant | Docker/K8s | Required | Limited |

For Pulse Radar, pgvector eliminates the "dual-write problem" - we don't need to sync embeddings between PostgreSQL and a separate vector store.

### Performance at Scale

| Solution | 100K vectors | 1M vectors | 10M vectors |
|----------|--------------|------------|-------------|
| pgvector (HNSW) | Excellent | Good | Acceptable |
| pgvector (IVFFlat) | Good | Acceptable | Slow |
| Pinecone | Excellent | Excellent | Excellent |
| Qdrant | Excellent | Excellent | Excellent |

Pulse Radar's expected scale (10K-100K messages) is well within pgvector's optimal range.

### Cost Analysis

| Solution | Infrastructure | Managed Service | Estimated Monthly |
|----------|---------------|-----------------|-------------------|
| pgvector | PostgreSQL only | $0 (self-hosted) | $0-50 |
| Pinecone | External | $70+ starter | $70-500 |
| Weaviate | Docker container | $0 (self-hosted) | $20-100 |
| Qdrant | Docker container | $0 (self-hosted) | $20-100 |

### Query Patterns

pgvector supports all Pulse Radar query patterns:

```python
# Semantic search with threshold
await service.search_messages(session, "bug in production", limit=5)

# Find similar items
await service.find_similar_messages(session, message_id=123)

# Duplicate detection (high threshold)
await service.find_duplicates(session, message_id=123, threshold=0.95)

# RAG context building
similar_atoms = await service.search_atoms(session, query)
```

## Consequences

**Positive:**

- Zero additional infrastructure - uses existing PostgreSQL
- ACID transactions - embedding updates are atomic with entity updates
- Simplified backup/restore - single database to manage
- No data synchronization - embeddings co-located with entities
- Familiar tooling - standard PostgreSQL monitoring, pgAdmin, etc.
- Cost-effective - no additional service costs
- SQLModel/SQLAlchemy integration via `pgvector.sqlalchemy`

**Negative:**

- Scale ceiling - performance degrades beyond ~5M vectors without careful tuning
- Limited index options - only IVFFlat and HNSW (vs. specialized DBs with more algorithms)
- No managed filtering - must implement filtering in SQL (vs. native metadata filtering in Pinecone)
- Version dependency - requires pgvector extension (0.4+) installation

**Mitigations:**

- Use HNSW index for better query performance: `CREATE INDEX ON messages USING hnsw (embedding vector_cosine_ops)`
- Monitor query performance as scale grows
- If scaling beyond 1M vectors, consider hybrid approach (pgvector for recent data, Qdrant for archive)

## Implementation Details

### PostgreSQL Configuration

```yaml
# docker-compose.yml
postgres:
  image: pgvector/pgvector:pg15
  environment:
    POSTGRES_DB: tasktracker
```

### Database Migration

```python
# Alembic migration
def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.add_column('messages',
        sa.Column('embedding', Vector(1536), nullable=True))
```

### Model Definition

```python
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column

class Message(SQLModel, table=True):
    embedding: list[float] | None = Field(
        default=None,
        sa_column=Column(Vector(1536)),
        description="Vector embedding for semantic search"
    )
```

### Embedding Service

```python
class EmbeddingService:
    async def _validate_embedding(self, embedding: list[float]) -> list[float]:
        """Validate and pad embeddings to 1536 dimensions."""
        if self.provider.type == ProviderType.ollama:
            # Ollama (768 dims) padded to match OpenAI (1536 dims)
            if len(embedding) < 1536:
                return embedding + [0.0] * (1536 - len(embedding))
        return embedding
```

### Search Implementation

```python
class SemanticSearchService:
    async def search_messages(self, session, query, limit=10, threshold=0.7):
        # Generate query embedding
        query_embedding = await self.embedding_service.generate_embedding(query)

        # pgvector cosine distance: <=> operator
        # Similarity = 1 - (distance / 2), maps 0-2 distance to 0-1 similarity
        sql = """
            SELECT m.*, 1 - (m.embedding <=> $1::vector) / 2 AS similarity
            FROM messages m
            WHERE m.embedding IS NOT NULL
              AND (1 - (m.embedding <=> $1::vector) / 2) >= $2
            ORDER BY m.embedding <=> $1::vector
            LIMIT $3
        """
        return await driver_conn.fetch(sql, str(query_embedding), threshold, limit)
```

## Scale Considerations

### When to Reconsider

Consider migrating to a dedicated vector DB if:
- Vector count exceeds 5M with query latency requirements < 50ms
- Need for advanced filtering (metadata, hybrid search)
- Multiple embedding models with different dimensions
- Global distribution requirements

### Upgrade Path

1. **Phase 1 (current):** pgvector for all vector operations
2. **Phase 2 (if needed):** Hybrid - pgvector for hot data, Qdrant for cold storage
3. **Phase 3 (if needed):** Full migration to Qdrant with PostgreSQL as source of truth

## References

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [pgvector Performance Guide](https://github.com/pgvector/pgvector#indexing)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [Pulse Radar EmbeddingService](../../../backend/app/services/embedding_service.py)
- [Pulse Radar SemanticSearchService](../../../backend/app/services/semantic_search_service.py)
- [Choosing a Vector Database](https://www.pinecone.io/learn/vector-database/)
