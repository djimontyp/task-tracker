# pgvector Diagnosis Summary - Quick Reference

## Critical Findings

### ❌ Root Cause: Missing Auto-Embedding Hook
**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py:1096`
**Issue:** `extract_knowledge_from_messages_task` creates Atoms/Messages but never queues embedding generation

### ❌ Secondary Issue: No Vector Indexes
**Impact:** Sequential scans on 237 messages = 500ms queries (should be <50ms with HNSW)
**Missing:**
- `messages_embedding_hnsw_idx` on messages.embedding
- `atoms_embedding_hnsw_idx` on atoms.embedding

### ✅ Infrastructure Status: FULLY OPERATIONAL
- EmbeddingService: Complete (OpenAI + Ollama)
- SemanticSearchService: Complete (cosine similarity)
- Background tasks: `embed_messages_batch_task`, `embed_atoms_batch_task` defined
- API endpoints: `/embeddings/*` fully functional

## Database State

| Entity | Total Rows | With Embeddings | Coverage |
|--------|------------|-----------------|----------|
| Messages | 237 | 0 | 0% |
| Atoms | 125 | 0 | 0% |
| Topics | N/A | N/A | No embedding column |

## Priority Fixes

### 1. Add Auto-Embedding Hook (Batch 3)
**File:** `backend/app/tasks.py:1096`
**Insert after:** `messages_updated = await service.update_messages(...)`
```python
# Extract IDs for embedding
atom_ids = [a.id for a in saved_atoms if a.id and not a.embedding]
message_ids_for_embedding = [m.id for m in messages if m.id and not m.embedding]

# Queue embedding tasks
if atom_ids:
    await embed_atoms_batch_task.kiq(atom_ids=atom_ids, provider_id=str(provider.id))
if message_ids_for_embedding:
    await embed_messages_batch_task.kiq(message_ids=message_ids_for_embedding, provider_id=str(provider.id))
```

### 2. Create Vector Indexes (Batch 2)
**Create migration:** `backend/alembic/versions/{timestamp}_add_vector_indexes.py`
```sql
-- Messages HNSW Index
CREATE INDEX CONCURRENTLY messages_embedding_hnsw_idx
ON messages USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Atoms HNSW Index
CREATE INDEX CONCURRENTLY atoms_embedding_hnsw_idx
ON atoms USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### 3. Backfill Existing Data (Batch 4)
```bash
# Create script: backend/scripts/backfill_embeddings.py
# Then run:
just services  # Start worker
uv run python backend/scripts/backfill_embeddings.py
```

## Expected Performance After Fixes

| Metric | Before | After |
|--------|--------|-------|
| Message embeddings | 0/237 (0%) | 237/237 (100%) |
| Atom embeddings | 0/125 (0%) | 125/125 (100%) |
| Query latency | N/A | <50ms |
| Index type | None | HNSW (m=16) |

## File References

**Models:**
- `backend/app/models/message.py:61` - Message.embedding
- `backend/app/models/atom.py:77` - Atom.embedding

**Services:**
- `backend/app/services/embedding_service.py` - Full implementation
- `backend/app/services/semantic_search_service.py` - Search logic

**Tasks:**
- `backend/app/tasks.py:732` - embed_messages_batch_task
- `backend/app/tasks.py:782` - embed_atoms_batch_task
- `backend/app/tasks.py:1009` - extract_knowledge_from_messages_task (NEEDS FIX)

**Migrations:**
- `backend/alembic/versions/d510922791ac_initial_migration.py:38` - Vector columns created

## Validation Commands

```bash
# Check embedding coverage
docker compose exec postgres psql -U postgres -d tasktracker -c "
  SELECT
    (SELECT COUNT(*) FROM messages WHERE embedding IS NOT NULL) as messages_with_embeddings,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM atoms WHERE embedding IS NOT NULL) as atoms_with_embeddings,
    (SELECT COUNT(*) FROM atoms) as total_atoms;
"

# Verify indexes exist
docker compose exec postgres psql -U postgres -d tasktracker -c "
  SELECT indexname FROM pg_indexes
  WHERE tablename IN ('messages', 'atoms')
    AND indexname LIKE '%embedding%';
"

# Test semantic search
curl -X POST http://localhost/api/v1/semantic_search/messages \
  -H "Content-Type: application/json" \
  -d '{"query": "bug fix", "limit": 5}'
```

## Next Actions

1. ✅ Diagnosis complete (Batch 1)
2. ⏭️ Create HNSW index migration (Batch 2)
3. ⏭️ Add auto-embedding hook in tasks.py (Batch 3)
4. ⏭️ Backfill 362 existing rows (Batch 3)
5. ⏭️ Validate semantic search (Batch 4)
