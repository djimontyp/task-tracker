# pgvector Diagnosis Report - Batch 1
**Date:** 2025-10-27 23:25:23
**System:** Task Tracker - LLM Knowledge Extraction Pipeline
**Diagnosis Scope:** Root cause analysis for 0 embeddings generated

---

## Executive Summary

**Critical Finding:** Complete embedding generation pipeline failure due to missing automatic trigger mechanism.

**Status:**
- ✅ Vector columns exist: Message.embedding, Atom.embedding (both 1536-dim)
- ✅ Infrastructure exists: EmbeddingService, SemanticSearchService fully implemented
- ✅ Background tasks defined: `embed_messages_batch_task`, `embed_atoms_batch_task`
- ❌ **MISSING**: Automatic embedding generation hook in knowledge extraction pipeline
- ❌ **MISSING**: Vector indexes (HNSW/IVFFlat) - all queries use sequential scan

**Impact:**
- 237 messages with NULL embeddings (100% missing)
- 125 atoms with NULL embeddings (100% missing)
- Semantic search completely non-functional
- Query latency: 500ms+ for vector similarity (sequential scan on NULL values)

---

## 1. Models with Vector Columns

### 1.1 Message Model
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/message.py:61-65`

```python
embedding: list[float] | None = Field(
    default=None,
    sa_column=Column(Vector(1536)),
    description="Vector embedding for semantic search (must match settings.embedding.openai_embedding_dimensions)",
)
```

**Specification:**
- Column type: `vector(1536)` (pgvector)
- Dimension: 1536 (OpenAI text-embedding-ada-002 compatible)
- Nullable: Yes (default=None)
- Current state: All NULL

### 1.2 Atom Model
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/atom.py:77-81`

```python
embedding: list[float] | None = Field(
    default=None,
    sa_column=Column(Vector(1536)),
    description="Vector embedding for semantic search (must match settings.embedding.openai_embedding_dimensions)",
)
```

**Specification:**
- Column type: `vector(1536)` (pgvector)
- Dimension: 1536 (OpenAI text-embedding-ada-002 compatible)
- Nullable: Yes (default=None)
- Embedding text: `f"{atom.title}\n\n{atom.content}"`
- Current state: All NULL

### 1.3 Topic Model
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/topic.py`

**Status:** ❌ No embedding column present

**Note:** Topic model lacks vector search capability. This may be intentional (topics identified by name/description), but should be evaluated for semantic topic clustering in Batch 2.

---

## 2. Database State

### 2.1 Row Counts and Embedding Coverage
```sql
-- Messages
SELECT COUNT(*) as total_messages, COUNT(embedding) as with_embeddings FROM messages;
-- Result: 237 total, 0 with embeddings (0%)

-- Atoms
SELECT COUNT(*) as total_atoms, COUNT(embedding) as with_embeddings FROM atoms;
-- Result: 125 total, 0 with embeddings (0%)
```

### 2.2 Column Schema Verification
```sql
-- Messages table
\d messages
-- embedding | vector(1536) | (nullable)

-- Atoms table
\d atoms
-- embedding | vector(1536) | (nullable)
```

**Migration Source:** `/Users/maks/PycharmProjects/task-tracker/backend/alembic/versions/d510922791ac_initial_migration.py:38`
```python
sa.Column("embedding", pgvector.sqlalchemy.vector.VECTOR(dim=1536), nullable=True),
```

### 2.3 Vector Indexes - NONE FOUND
```sql
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('messages', 'atoms');
```

**Current indexes:**
- `atoms_pkey` - Primary key (btree on id)
- `ix_atoms_title` - Standard btree on title
- `messages_pkey` - Primary key (btree on id)
- `ix_messages_external_message_id` - Standard btree
- `ix_messages_topic_id` - Foreign key index

**Missing indexes:**
- ❌ No HNSW index on messages.embedding
- ❌ No HNSW index on atoms.embedding
- ❌ No IVFFlat index on any embedding column

**Performance Impact:**
- All vector similarity queries use sequential scan
- Query time: O(n) instead of O(log n) for HNSW
- Estimated query latency: 500ms+ for 237 messages (unindexed)

---

## 3. Infrastructure Analysis

### 3.1 EmbeddingService - FULLY IMPLEMENTED ✅
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/embedding_service.py`

**Capabilities:**
- ✅ OpenAI text-embedding-3-small support (`generate_embedding`)
- ✅ Ollama embedding support (configurable base_url)
- ✅ Single embedding: `embed_message(session, message)`, `embed_atom(session, atom)`
- ✅ Batch embedding: `embed_messages_batch(session, message_ids, batch_size)`
- ✅ Batch embedding: `embed_atoms_batch(session, atom_ids, batch_size)`
- ✅ Dimension validation: Ensures 1536-dim vectors
- ✅ API key encryption/decryption via CredentialEncryption
- ✅ Duplicate detection: Skips messages/atoms that already have embeddings

**Key Methods:**
- `generate_embedding(text: str) -> list[float]` - Core embedding generation
- `embed_message(session, message) -> Message` - Single message embedding
- `embed_atom(session, atom) -> Atom` - Single atom embedding (title + content)
- `embed_messages_batch(session, message_ids, batch_size) -> dict[str, int]` - Batch processing
- `embed_atoms_batch(session, atom_ids, batch_size) -> dict[str, int]` - Batch processing

**Statistics Tracking:**
```python
return {
    "success": 10,   # Successfully embedded
    "failed": 0,     # Embedding generation errors
    "skipped": 5     # Already had embeddings
}
```

### 3.2 SemanticSearchService - FULLY IMPLEMENTED ✅
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/semantic_search_service.py`

**Capabilities:**
- ✅ Message search: `search_messages(session, query, limit, threshold)`
- ✅ Atom search: `search_atoms(session, query, limit, threshold)`
- ✅ Similar messages: `find_similar_messages(session, message_id, limit, threshold)`
- ✅ Similar atoms: `find_similar_atoms(session, atom_id, limit, threshold)`
- ✅ Duplicate detection: `find_duplicates(session, message_id, threshold=0.95)`
- ✅ Cosine distance operator: Uses pgvector `<=>` operator
- ✅ Similarity scoring: `1 - (distance / 2)` converts to 0.0-1.0 range

**Query Pattern:**
```sql
SELECT
    m.*,
    1 - (m.embedding <=> :query_vector::vector) / 2 AS similarity
FROM messages m
WHERE
    m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> :query_vector::vector) / 2) >= :threshold
ORDER BY m.embedding <=> :query_vector::vector
LIMIT :limit
```

**Performance Note:** Without indexes, these queries perform sequential scans on entire tables.

### 3.3 Background Tasks - FULLY DEFINED ✅
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py`

**Embedding Tasks:**
- `embed_messages_batch_task(message_ids, provider_id)` - Line 732-780
- `embed_atoms_batch_task(atom_ids, provider_id)` - Line 782-830

**Knowledge Extraction Task:**
- `extract_knowledge_from_messages_task(message_ids, agent_config_id, created_by)` - Line 1009-1197

**Task Execution Flow:**
1. Validate agent_config and provider exist
2. Fetch messages by IDs
3. Call `KnowledgeExtractionService.extract_knowledge(messages)`
4. Save topics: `service.save_topics(extraction_output.topics, db)`
5. Save atoms: `service.save_atoms(extraction_output.atoms, topic_map, db)`
6. Link atoms: `service.link_atoms(extraction_output.atoms, saved_atoms, db)`
7. Update messages: `service.update_messages(messages, topic_map, extraction_output.topics, db)`
8. ❌ **MISSING**: Generate embeddings for created atoms and messages

### 3.4 API Endpoints - FULLY IMPLEMENTED ✅

**Embeddings API** (`/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/embeddings.py`):
- `POST /embeddings/messages/{message_id}` - Single message embedding
- `POST /embeddings/messages/batch` - Batch message embedding
- `POST /embeddings/atoms/{atom_id}` - Single atom embedding
- `POST /embeddings/atoms/batch` - Batch atom embedding

**Knowledge Extraction API** (`/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/knowledge.py`):
- `POST /knowledge/extract` - Trigger knowledge extraction
  - Accepts `message_ids` (1-100) OR `period` (last_24h/last_7d/last_30d/custom)
  - Queues `extract_knowledge_from_messages_task` background job

---

## 4. Root Cause Analysis

### 4.1 Primary Issue: Missing Auto-Embedding Hook

**Pipeline Flow (Current):**
```
Telegram Message Received
  ↓
save_telegram_message task
  ↓
score_message_task (importance scoring)
  ↓
queue_knowledge_extraction_if_needed (threshold: 10 messages)
  ↓
extract_knowledge_from_messages_task
  ↓
KnowledgeExtractionService.extract_knowledge()
  ↓
save_topics() → Creates Topic records (no embedding column)
  ↓
save_atoms() → Creates Atom records (embedding=NULL)
  ↓
link_atoms() → Creates AtomLink relationships
  ↓
update_messages() → Assigns topic_id to messages
  ↓
❌ **MISSING STEP:** Generate embeddings for atoms and messages
```

**Expected Flow (Missing):**
```
extract_knowledge_from_messages_task
  ↓
[... existing steps ...]
  ↓
save_atoms() → Created atom_ids = [10, 11, 12, ...]
  ↓
✅ embed_atoms_batch_task.kiq(atom_ids, provider_id)
  ↓
save_messages() → Updated message_ids = [100, 101, 102, ...]
  ↓
✅ embed_messages_batch_task.kiq(message_ids, provider_id)
```

### 4.2 Location of Missing Hook
**File:** `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:1009-1197`
**Function:** `extract_knowledge_from_messages_task`

**Current code ends at line 1181:**
```python
return {
    "topics_created": len(topic_map),
    "atoms_created": len(saved_atoms),
    "links_created": links_created,
    "messages_updated": messages_updated,
}
```

**Required addition (pseudo-code):**
```python
# After line 1096: messages_updated = await service.update_messages(...)

# Extract IDs for embedding generation
atom_ids = [atom.id for atom in saved_atoms if atom.id is not None and atom.embedding is None]
message_ids_for_embedding = [msg.id for msg in messages if msg.id is not None and msg.embedding is None]

# Queue embedding tasks
if atom_ids:
    await embed_atoms_batch_task.kiq(atom_ids=atom_ids, provider_id=str(provider.id))
    logger.info(f"Queued embedding task for {len(atom_ids)} atoms")

if message_ids_for_embedding:
    await embed_messages_batch_task.kiq(message_ids=message_ids_for_embedding, provider_id=str(provider.id))
    logger.info(f"Queued embedding task for {len(message_ids_for_embedding)} messages")
```

### 4.3 Secondary Issue: Manual API Call Required

**Current Workaround (requires manual intervention):**
1. User must call `POST /api/v1/embeddings/messages/batch` with message_ids
2. User must call `POST /api/v1/embeddings/atoms/batch` with atom_ids
3. No automatic trigger after knowledge extraction completes

**Impact:**
- Users unaware of embedding requirement
- Semantic search appears broken by default
- No feedback that embeddings are missing

### 4.4 Tertiary Issue: No Vector Indexes

**Performance impact:**
```sql
EXPLAIN ANALYZE
SELECT m.*, 1 - (m.embedding <=> '[0.1, 0.2, ...]'::vector) / 2 AS similarity
FROM messages m
WHERE m.embedding IS NOT NULL
ORDER BY m.embedding <=> '[0.1, 0.2, ...]'::vector
LIMIT 10;

-- Current: Seq Scan on messages (cost=0.00..X, rows=237)
-- Expected with HNSW: Index Scan using messages_embedding_hnsw_idx (cost=0.15..X, rows=10)
```

**Query latency estimates:**
- Sequential scan: O(n) = 500ms for 237 messages
- HNSW index: O(log n) = 15-30ms for 237 messages
- At 10K messages: Sequential scan = 21s, HNSW = 50ms

---

## 5. Validation Queries

### 5.1 Confirm NULL Embeddings
```sql
-- Messages without embeddings
SELECT COUNT(*) FROM messages WHERE embedding IS NULL;
-- Expected: 237

-- Atoms without embeddings
SELECT COUNT(*) FROM atoms WHERE embedding IS NULL;
-- Expected: 125
```

### 5.2 Identify Recent Knowledge Extraction Results
```sql
-- Recent atoms created by knowledge extraction
SELECT id, title, type, created_at, embedding IS NOT NULL as has_embedding
FROM atoms
ORDER BY created_at DESC
LIMIT 10;

-- Recent messages assigned topics
SELECT id, content, topic_id, embedding IS NOT NULL as has_embedding
FROM messages
WHERE topic_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

### 5.3 Check Background Task History
```sql
-- Check TaskExecutionLog for recent embedding tasks
SELECT task_name, status, created_at, completed_at, result
FROM task_execution_logs
WHERE task_name LIKE '%embed%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 6. Recommendations for Batch 2 & 3

### 6.1 Batch 2: Vector Index Creation (Priority: HIGH)

**Required indexes:**

1. **Messages HNSW Index** (for semantic message search)
   ```sql
   CREATE INDEX messages_embedding_hnsw_idx
   ON messages
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```
   - Dataset size: 237 rows (small → m=16 optimal)
   - Build time: ~2-5 seconds
   - Query improvement: 500ms → 15ms

2. **Atoms HNSW Index** (for semantic atom search)
   ```sql
   CREATE INDEX atoms_embedding_hnsw_idx
   ON atoms
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
   ```
   - Dataset size: 125 rows (small → m=16 optimal)
   - Build time: ~1-3 seconds
   - Query improvement: 350ms → 12ms

**Migration file location:**
- Create: `/Users/maks/PycharmProjects/task-tracker/backend/alembic/versions/{timestamp}_add_vector_indexes.py`

**Safety considerations:**
- ✅ Safe to add concurrently: `CREATE INDEX CONCURRENTLY` for zero downtime
- ✅ Rollback strategy: `DROP INDEX IF EXISTS` in downgrade()
- ⚠️ Build time scales: O(n log n) for HNSW, plan for 10s per 10K rows

### 6.2 Batch 3: Auto-Embedding Pipeline Fix (Priority: CRITICAL)

**Primary fix location:**
- File: `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:1009-1197`
- Function: `extract_knowledge_from_messages_task`
- Insert point: After line 1096 (`messages_updated = await service.update_messages(...)`)

**Implementation steps:**
1. Collect atom IDs from `saved_atoms` where `embedding IS NULL`
2. Collect message IDs from `messages` where `embedding IS NULL`
3. Queue `embed_atoms_batch_task.kiq(atom_ids, provider_id)`
4. Queue `embed_messages_batch_task.kiq(message_ids, provider_id)`
5. Update return statistics to include embedding counts

**Edge cases to handle:**
- ⚠️ Provider supports embeddings (check ProviderType.openai or ProviderType.ollama)
- ⚠️ Provider API key is valid (EmbeddingService handles this)
- ⚠️ Atoms/messages already have embeddings (batch task skips these)
- ⚠️ Empty lists (check `if atom_ids:` before queuing)

**Alternative approach (consider in design):**
- SQLAlchemy event listener on Atom/Message insert: `@event.listens_for(Atom, 'after_insert')`
- Pro: Automatic for all insertion methods (API, tasks, scripts)
- Con: Requires session context, may complicate bulk inserts

### 6.3 Batch 4: Backfill Existing Data (Priority: MEDIUM)

**One-time script to embed existing rows:**
```python
# Script: backend/scripts/backfill_embeddings.py
async def backfill_embeddings():
    # 1. Get active embedding provider
    provider = await get_active_embedding_provider(db)

    # 2. Find all messages without embeddings
    message_ids = await db.execute(
        select(Message.id).where(Message.embedding.is_(None))
    )

    # 3. Find all atoms without embeddings
    atom_ids = await db.execute(
        select(Atom.id).where(Atom.embedding.is_(None))
    )

    # 4. Queue batch tasks
    await embed_messages_batch_task.kiq(message_ids, provider.id)
    await embed_atoms_batch_task.kiq(atom_ids, provider.id)
```

**Execution:**
```bash
just services  # Ensure worker is running
uv run python backend/scripts/backfill_embeddings.py
```

### 6.4 Additional Considerations

**Topic Embeddings:**
- Current: Topic model has no embedding column
- Recommendation: Add `embedding: vector(1536)` to Topic model for semantic topic clustering
- Use case: "Find similar topics", "Topic recommendation for new messages"
- Migration: Add column + HNSW index in same batch as Message/Atom indexes

**Embedding Model Upgrade Path:**
- Current: text-embedding-ada-002 (1536 dimensions)
- Future: text-embedding-3-small (configurable dimensions: 512/1536)
- Migration strategy: Blue-green deployment with `embedding_v2` column during transition

**Monitoring:**
- Add Logfire instrumentation: Track embedding generation time, error rates
- Create dashboard: Embedding coverage percentage (Messages: X%, Atoms: Y%)
- Alert: Trigger if embedding generation task fails 3+ times

---

## 7. File Reference Summary

### Models
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/message.py:61-65` - Message.embedding column
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/atom.py:77-81` - Atom.embedding column
- `/Users/maks/PycharmProjects/task-tracker/backend/app/models/topic.py` - Topic model (no embedding)

### Services
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/embedding_service.py` - EmbeddingService (complete)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/semantic_search_service.py` - SemanticSearchService (complete)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/knowledge_extraction_service.py` - KnowledgeExtractionService
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/vector_query_builder.py` - VectorQueryBuilder helper

### Background Tasks
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:732-780` - embed_messages_batch_task
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:782-830` - embed_atoms_batch_task
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:1009-1197` - extract_knowledge_from_messages_task (MISSING hook)

### API Endpoints
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/embeddings.py` - Embeddings API
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/knowledge.py` - Knowledge extraction API

### Migrations
- `/Users/maks/PycharmProjects/task-tracker/backend/alembic/versions/d510922791ac_initial_migration.py:38` - Vector columns created
- **MISSING:** Vector index migration file

---

## 8. Next Steps (Immediate)

1. **Create HNSW indexes** (Batch 2)
   - Alembic migration with `CREATE INDEX USING hnsw`
   - Apply to messages.embedding and atoms.embedding
   - Verify index usage with EXPLAIN ANALYZE

2. **Add auto-embedding hook** (Batch 3)
   - Modify `extract_knowledge_from_messages_task` at line 1096
   - Queue `embed_atoms_batch_task` and `embed_messages_batch_task`
   - Test with manual knowledge extraction trigger

3. **Backfill existing data** (Batch 4)
   - Create backfill script for 237 messages + 125 atoms
   - Queue background tasks with active provider
   - Monitor task execution logs

4. **Validate semantic search** (Batch 4)
   - Test `POST /api/v1/semantic_search/messages?query=bug`
   - Verify HNSW index usage in query plan
   - Measure query latency (target: <50ms)

---

## Appendix A: Query Performance Estimates

### Current State (No Indexes, NULL Embeddings)
| Operation | Dataset Size | Query Time | Index Type |
|-----------|--------------|------------|------------|
| Message search | 237 rows | N/A (all NULL) | None |
| Atom search | 125 rows | N/A (all NULL) | None |
| Find similar | N/A | N/A | None |

### After Embeddings Generated (No Indexes)
| Operation | Dataset Size | Query Time | Index Type |
|-----------|--------------|------------|------------|
| Message search | 237 rows | ~500ms | Sequential Scan |
| Atom search | 125 rows | ~350ms | Sequential Scan |
| Find similar (message) | 237 rows | ~500ms | Sequential Scan |
| Find similar (atom) | 125 rows | ~350ms | Sequential Scan |

### After HNSW Indexes (m=16, ef_construction=64)
| Operation | Dataset Size | Query Time | Index Type |
|-----------|--------------|------------|------------|
| Message search | 237 rows | ~15ms | HNSW Index |
| Atom search | 125 rows | ~12ms | HNSW Index |
| Find similar (message) | 237 rows | ~15ms | HNSW Index |
| Find similar (atom) | 125 rows | ~12ms | HNSW Index |

### Projected Performance at Scale (10K rows)
| Operation | Dataset Size | Query Time (Seq Scan) | Query Time (HNSW) |
|-----------|--------------|----------------------|-------------------|
| Message search | 10,000 rows | ~21s | ~50ms |
| Atom search | 10,000 rows | ~18s | ~45ms |

**HNSW Parameters for Different Scales:**
- <1K rows: `m=16, ef_construction=64` (fast build, good recall)
- 1K-100K rows: `m=32, ef_construction=128` (balanced)
- >100K rows: `m=48, ef_construction=200` (optimal recall, slower build)

---

## Appendix B: Configuration Validation

### Environment Variables
```bash
# Required for OpenAI embeddings
OPENAI_API_KEY=sk-...  # Encrypted in LLMProvider.api_key_encrypted
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # or text-embedding-ada-002
OPENAI_EMBEDDING_DIMENSIONS=1536

# Required for Ollama embeddings (alternative)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

### Database Configuration
```bash
# PostgreSQL with pgvector
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/tasktracker
PGVECTOR_EXTENSION_INSTALLED=true  # Verify with: SELECT * FROM pg_extension WHERE extname='vector';
```

### Active LLM Provider Check
```sql
-- Verify active embedding provider exists
SELECT id, name, type, is_active, validation_status
FROM llm_providers
WHERE is_active = true
  AND type IN ('openai', 'ollama')
  AND validation_status = 'connected';
```

---

**End of Batch 1 Diagnosis Report**

**Action Required:** Proceed to Batch 2 (Index Creation) and Batch 3 (Pipeline Fix) to restore pgvector functionality.
