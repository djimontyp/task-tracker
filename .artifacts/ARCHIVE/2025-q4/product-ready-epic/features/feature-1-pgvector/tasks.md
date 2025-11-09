# Feature 1: Core LLM Infrastructure (pgvector Fix)

**Priority**: P0 🔴 BLOCKER
**Estimated Effort**: 6-8 hours
**Status**: 🔄 In Progress
**Started**: 2025-10-27

---

## Goal

Fix pgvector from D- (20/100) to working semantic search:
- Generate embeddings for all Atoms/Messages (currently 0, all NULL)
- Create HNSW vector indexes (currently 0, using sequential scan)
- Activate auto-embedding pipeline (currently inactive)
- Achieve query latency <50ms (currently 500ms+)

**Success Criteria**:
- ✅ All Atoms have embeddings (no NULL values)
- ✅ HNSW indexes created on vector columns
- ✅ Auto-embedding triggers on new Atom/Message creation
- ✅ Semantic search returns relevant results
- ✅ Query latency <50ms

---

## Batches (Sequential Pipeline)

### Batch 1: pgvector State Diagnosis
**Agent**: vector-search-engineer
**Duration**: 15-20 min
**Status**: ⏳ Pending

**Scope**:
1. Investigate why embeddings are NULL (all 0 rows have embeddings)
2. Find broken auto-generation pipeline
3. Identify missing triggers or background tasks
4. Document current vector_search_service.py implementation

**Context**:
- Audit report: `.v01-production/audits/llm/vector-search-report.md`
- Database: PostgreSQL with pgvector extension installed
- Models: backend/app/models/ (Atom, Message, Topic likely have vector columns)

**What NOT to do**:
- Don't fix yet, only diagnose
- Don't create indexes (Batch 2)
- Don't modify code (Batch 3)

**Output**:
- Root cause analysis (why 0 embeddings)
- File references (vector_search_service.py:line, models:line)
- Broken pipeline location
- Recommendations for fix

---

### Batch 2: Create HNSW Vector Indexes
**Agent**: database-reliability-engineer
**Duration**: 20-25 min
**Status**: ⏳ Pending
**Depends on**: Batch 1 (needs to know which columns)

**Scope**:
1. Create HNSW indexes on vector columns (Atom.embedding, Message.embedding, etc.)
2. Generate Alembic migration
3. Apply migration to database
4. Validate indexes created (pg_indexes query)

**Context from Batch 1**:
- {Will receive: which tables/columns have vector fields}
- {Will receive: current index status}

**What NOT to do**:
- Don't generate embeddings yet (Batch 3)
- Don't modify application code (Batch 3)

**Output**:
- Alembic migration file path
- Index names created
- pg_indexes confirmation
- Performance improvement estimate

---

### Batch 3: Fix Auto-Embedding Generation Pipeline
**Agent**: vector-search-engineer + fastapi-backend-expert (parallel-coordinator decides)
**Duration**: 25-30 min
**Status**: ⏳ Pending
**Depends on**: Batch 1 (root cause), Batch 2 (indexes ready)

**Scope**:
1. Fix auto-embedding generation on Atom/Message creation
2. Backfill existing NULL embeddings (batch process)
3. Add background task or model hook to generate embeddings
4. Test embedding generation works

**Context from Batch 1 & 2**:
- {Will receive: broken pipeline location}
- {Will receive: indexes ready for use}
- LLM API: OpenAI text-embedding-ada-002 (configured in .env)

**What NOT to do**:
- Don't write tests yet (Batch 4)
- Don't optimize performance (focus on working first)

**Output**:
- Fixed pipeline code (file:line references)
- Backfill script/task executed
- Count of embeddings generated
- Confirmation: no more NULL embeddings

---

### Batch 4: Validation & Testing
**Agent**: pytest-test-master
**Duration**: 15-20 min
**Status**: ⏳ Pending
**Depends on**: Batch 3 (pipeline working)

**Scope**:
1. Write tests for semantic search (query similar Atoms/Topics)
2. Measure query performance (should be <50ms)
3. Test auto-embedding on new Atom creation
4. Validate HNSW indexes being used (EXPLAIN ANALYZE)

**Context from Batch 3**:
- {Will receive: embedding generation code location}
- {Will receive: example embeddings to test with}

**What NOT to do**:
- Don't fix code issues (should already work from Batch 3)
- Only report if tests fail

**Output**:
- Test file path (tests/test_vector_search.py or similar)
- Test results (all pass)
- Query performance metrics (avg latency)
- EXPLAIN ANALYZE output (confirms index usage)

---

## Integration Points

**Output for other features**:
- Feature 3 (consistency): Working semantic search for Topic similarity
- Feature 4 (tests): Vector search tests added to suite

**Dependencies**:
- PostgreSQL pgvector extension (already installed)
- OpenAI API key (already in .env)
- TaskIQ background worker (for batch embedding generation)

---

## Session Tracking

**Session directory**: `.artifacts/product-ready-epic/features/feature-1-pgvector/sessions/{timestamp}/`

**Checkpointing**:
- After each batch completion
- coordination-state.json updated
- batch-progress.json tracks status

**Resume command**:
```
/resume @.artifacts/product-ready-epic/features/feature-1-pgvector/
```

---

## Notes

- Sequential pipeline (cannot parallelize batches)
- Medium-sized batches (15-30 min) for quality control
- Frequent check-ins after each batch
- Validation before proceeding to next batch
