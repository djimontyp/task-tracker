# 🎯 Vector Database + Topics Integration - Implementation Plan

**Start Date:** 2025-10-16
**Estimated Duration:** 3-4 days
**Status:** 🟡 In Progress

---

## 📊 Overall Progress

- [ ] Фаза 1: Message-Topic Relationship (2-3 години)
- [ ] Фаза 2: pgvector Integration (1-2 дні)
- [ ] Фаза 3: Comprehensive Testing (1 день)
- [ ] Фаза 4: Architecture Review & Cleanup (3-4 години)

---

## 🔄 Фаза 1: Message-Topic Relationship

**Агент:** `fastapi-backend-expert`
**Час:** 2-3 години
**Статус:** 🟡 In Progress

### Завдання:

- [ ] **1.1** Реалізувати `GET /api/v1/topics/{id}/messages` endpoint
  - [ ] Query implementation: `SELECT * FROM messages WHERE topic_id = ? ORDER BY sent_at DESC`
  - [ ] Додати пагінацію (skip, limit)
  - [ ] Додати сортування (sent_at DESC)
  - [ ] Response model: `list[MessageResponse]`

- [ ] **1.2** Розширити `GET /api/v1/messages` для фільтрації по topics
  - [ ] Додати `topic_id: int | None` query параметр
  - [ ] Інтегрувати в існуючий фільтр

- [ ] **1.3** Створити service методи
  - [ ] `MessageCRUD.list_by_topic(topic_id, skip, limit)`
  - [ ] Перевірити що relationship працює
  - [ ] Додати error handling (404 if topic not found)

- [ ] **1.4** Quality Assurance
  - [ ] Запустити `just typecheck` - mypy clean
  - [ ] Тести для endpoint
  - [ ] API docs оновлені

**MCP інструменти:**
- `mcp__postgres-mcp__execute_sql` - тестування queries
- `mcp__context7__get-library-docs` - FastAPI/SQLModel docs
- `mcp__ide__getDiagnostics` - type checking

**Виходи:**
- ✅ Working API endpoint
- ✅ Type-safe code
- ✅ Tests pass

---

## 🧠 Фаза 2: pgvector Integration

### 📦 Крок 2.1: Infrastructure Setup

**Агент:** `devops-expert`
**Час:** 2-3 години
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **2.1.1** Модифікувати `compose.yml`
  - [ ] Змінити postgres image на `pgvector/pgvector:pg15`
  - [ ] Або використати `ankane/pgvector:latest`
  - [ ] Тестувати build: `docker compose build postgres`

- [ ] **2.1.2** Створити init script
  - [ ] Файл: `postgres/init-scripts/01-enable-pgvector.sql`
  - [ ] Вміст: `CREATE EXTENSION IF NOT EXISTS vector;`
  - [ ] Додати executable permissions

- [ ] **2.1.3** Оновити volume mounts
  - [ ] Додати в compose.yml:
    ```yaml
    volumes:
      - ./postgres/init-scripts:/docker-entrypoint-initdb.d
    ```

- [ ] **2.1.4** Тестування
  - [ ] `just services-stop`
  - [ ] `docker volume rm task-tracker-postgres-data`
  - [ ] `just services`
  - [ ] Перевірити що extension активна: `SELECT * FROM pg_extension WHERE extname = 'vector';`

**MCP інструменти:**
- `mcp__context7__get-library-docs` - pgvector documentation

**Виходи:**
- ✅ pgvector-enabled PostgreSQL container
- ✅ Extension автоматично активується

---

### 🗄️ Крок 2.2: Database Migrations

**Агент:** `fastapi-backend-expert`
**Час:** 3-4 години
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **2.2.1** Додати dependencies
  - [ ] `uv add pgvector`
  - [ ] `uv add sqlalchemy-pgvector` (якщо потрібно)
  - [ ] Перевірити compatibility з SQLModel

- [ ] **2.2.2** Створити Alembic migration
  - [ ] `uv run alembic revision --autogenerate -m "add_vector_embeddings"`
  - [ ] Додати vector columns:
    ```python
    from pgvector.sqlalchemy import Vector

    op.add_column('messages',
        sa.Column('embedding', Vector(1536), nullable=True))
    op.add_column('atoms',
        sa.Column('embedding', Vector(1536), nullable=True))
    ```

- [ ] **2.2.3** Створити indexes
  - [ ] IVFFlat index для messages:
    ```python
    op.execute("""
        CREATE INDEX messages_embedding_idx
        ON messages USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)
    ```
  - [ ] IVFFlat index для atoms:
    ```python
    op.execute("""
        CREATE INDEX atoms_embedding_idx
        ON atoms USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
    """)
    ```

- [ ] **2.2.4** Розширити SQLModel models
  - [ ] `backend/app/models/message.py`:
    ```python
    from pgvector.sqlalchemy import Vector
    from sqlalchemy import Column

    embedding: list[float] | None = Field(
        default=None,
        sa_column=Column(Vector(1536))
    )
    ```
  - [ ] Аналогічно для `atom.py`

- [ ] **2.2.5** Запустити migration
  - [ ] `uv run alembic upgrade head`
  - [ ] Перевірити schema: `mcp__postgres-mcp__get_object_details`

- [ ] **2.2.6** Quality checks
  - [ ] `just typecheck` passes
  - [ ] `just fmt` applied
  - [ ] Database schema validated

**MCP інструменти:**
- `mcp__postgres-mcp__get_object_details` - schema validation
- `mcp__context7__get-library-docs` - pgvector SQLAlchemy integration
- `mcp__ide__getDiagnostics` - type errors

**Виходи:**
- ✅ Vector columns in messages/atoms
- ✅ IVFFlat indexes created
- ✅ Type-safe SQLModel integration

---

### 🤖 Крок 2.3: Embedding Service

**Агент:** `fastapi-backend-expert`
**Час:** 4-6 годин
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **2.3.1** Створити service файл
  - [ ] Файл: `backend/app/services/embedding_service.py`
  - [ ] Class: `EmbeddingService`
  - [ ] Підтримка OpenAI та Ollama providers

- [ ] **2.3.2** Implement core methods
  - [ ] `async def generate_embedding(text: str, provider: str) -> list[float]`
    - OpenAI: `text-embedding-3-small` (1536 dims)
    - Ollama: llama3 with embeddings
  - [ ] `async def embed_message(message: Message) -> Message`
  - [ ] `async def embed_atom(atom: Atom) -> Atom`

- [ ] **2.3.3** Інтеграція з LLMProvider
  - [ ] Використати `CredentialEncryption` для API keys
  - [ ] Підтримка різних embedding models
  - [ ] Error handling and retry logic

- [ ] **2.3.4** Background task для batch embedding
  - [ ] Файл: `backend/app/tasks.py` (оновити)
  - [ ] Task: `embed_messages_batch(message_ids: list[int])`
  - [ ] Process 100 messages at once
  - [ ] Progress tracking через WebSocket

- [ ] **2.3.5** API endpoints
  - [ ] `POST /api/v1/embeddings/messages/{id}/generate` - single message
  - [ ] `POST /api/v1/embeddings/messages/batch` - batch generation
  - [ ] `POST /api/v1/embeddings/atoms/{id}/generate` - single atom

- [ ] **2.3.6** Tests
  - [ ] Unit tests для embedding generation
  - [ ] Integration tests з OpenAI/Ollama
  - [ ] Mock tests для API calls

**MCP інструменти:**
- `mcp__context7__get-library-docs` - OpenAI embeddings API
- `mcp__postgres-mcp__execute_sql` - test vector updates

**Виходи:**
- ✅ Embedding generation service
- ✅ Background task for batch processing
- ✅ Provider-agnostic architecture
- ✅ Tests pass

---

### 🔍 Крок 2.4: Semantic Search API

**Агент:** `fastapi-backend-expert`
**Час:** 4-5 годин
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **2.4.1** Створити service
  - [ ] Файл: `backend/app/services/semantic_search_service.py`
  - [ ] Class: `SemanticSearchService`

- [ ] **2.4.2** Implement search methods
  - [ ] `async def search_messages(query: str, limit: int, threshold: float)`
    ```sql
    SELECT *, embedding <=> $1 AS distance
    FROM messages
    WHERE embedding IS NOT NULL
    ORDER BY distance
    LIMIT $2
    ```
  - [ ] `async def find_similar_messages(message_id: int, limit: int)`
  - [ ] `async def search_atoms(query: str, limit: int, threshold: float)`
  - [ ] `async def find_duplicates(message: Message, threshold: float = 0.95)`

- [ ] **2.4.3** Створити API endpoints
  - [ ] `GET /api/v1/messages/search/semantic`
    - Query params: `query: str`, `limit: int = 10`, `threshold: float = 0.7`
    - Response: `list[MessageResponse]` with similarity scores
  - [ ] `GET /api/v1/messages/{id}/similar`
    - Query params: `limit: int = 10`
    - Response: similar messages
  - [ ] `GET /api/v1/atoms/search/semantic`
    - Similar to messages

- [ ] **2.4.4** Оптимізація queries
  - [ ] Use `mcp__postgres-mcp__explain_query` для аналізу
  - [ ] Optimize index parameters (lists count)
  - [ ] Benchmark performance

- [ ] **2.4.5** Response schemas
  - [ ] `SemanticSearchResult`:
    ```python
    class SemanticSearchResult(BaseModel):
        item: MessageResponse | AtomPublic
        similarity_score: float
        distance: float
    ```

- [ ] **2.4.6** Tests
  - [ ] Test semantic search accuracy
  - [ ] Test similarity thresholds
  - [ ] Test duplicate detection

**MCP інструменти:**
- `mcp__postgres-mcp__explain_query` - query optimization
- `mcp__postgres-mcp__analyze_query_indexes` - index usage
- `mcp__context7__get-library-docs` - pgvector operators

**Виходи:**
- ✅ Semantic search endpoints
- ✅ Similarity detection
- ✅ Optimized queries (<200ms)

---

### 🎯 Крок 2.5: RAG Pipeline Integration

**Агент:** `fastapi-backend-expert`
**Час:** 6-8 годин
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **2.5.1** Створити RAG context builder
  - [ ] Файл: `backend/app/services/rag_context_builder.py`
  - [ ] Class: `RAGContextBuilder`

- [ ] **2.5.2** Implement context methods
  - [ ] `async def build_context(messages: list[Message], top_k: int = 5)`
    - Retrieve similar past proposals
    - Retrieve relevant atoms
    - Format as structured context
  - [ ] `async def find_relevant_atoms(query_embedding: list[float], top_k: int)`
  - [ ] `async def find_similar_proposals(query_embedding: list[float], top_k: int)`

- [ ] **2.5.3** Розширити LLMProposalService
  - [ ] Додати метод: `async def generate_proposals_with_rag(...)`
  - [ ] Integration flow:
    1. Generate embedding for batch context
    2. Retrieve similar past proposals/atoms
    3. Inject context into LLM prompt
    4. Generate proposals with context

- [ ] **2.5.4** Модифікувати prompts
  - [ ] Додати RAG context section:
    ```python
    prompt = f"""
    ## Relevant Past Context
    {rag_context}

    ## Current Messages to Analyze
    {messages_text}

    ## Instructions
    Consider the past context when generating proposals...
    """
    ```

- [ ] **2.5.5** Update AnalysisRun flow
  - [ ] Додати опцію `use_rag: bool` в AnalysisRun config
  - [ ] Background task integration
  - [ ] Track RAG usage in metrics

- [ ] **2.5.6** API endpoints
  - [ ] Опціональний query param: `?use_rag=true` для analysis runs

- [ ] **2.5.7** Tests
  - [ ] Test RAG context building
  - [ ] Test proposal generation with/without RAG
  - [ ] Compare accuracy metrics

**MCP інструменти:**
- `mcp__context7__get-library-docs` - Pydantic-AI RAG patterns
- `mcp__postgres-mcp__get_top_queries` - performance monitoring

**Виходи:**
- ✅ RAG pipeline implemented
- ✅ Context-aware proposal generation
- ✅ Improved accuracy metrics

---

## ✅ Фаза 3: Comprehensive Testing

**Агент:** `pytest-test-master`
**Час:** 1 день (8 годин)
**Статус:** ⚪ Pending

### Завдання:

- [ ] **3.1** Unit Tests
  - [ ] `tests/unit/test_embedding_service.py`
    - Test embedding generation (OpenAI, Ollama)
    - Test error handling
    - Test batch processing
  - [ ] `tests/unit/test_semantic_search.py`
    - Test search accuracy
    - Test similarity calculations
    - Test threshold filtering
  - [ ] `tests/unit/test_rag_context_builder.py`
    - Test context building
    - Test relevance scoring

- [ ] **3.2** Integration Tests
  - [ ] `tests/integration/test_message_topic_relationship.py`
    - Test GET /topics/{id}/messages
    - Test filtering by topic_id
  - [ ] `tests/integration/test_vector_operations.py`
    - Test vector storage/retrieval
    - Test index usage
  - [ ] `tests/integration/test_rag_pipeline.py`
    - End-to-end RAG flow
    - Test with real LLM providers

- [ ] **3.3** API Tests
  - [ ] `tests/api/test_semantic_search_endpoints.py`
    - Test all semantic search endpoints
    - Test response schemas
    - Test error cases
  - [ ] `tests/api/test_embedding_endpoints.py`
    - Test embedding generation endpoints
    - Test batch operations

- [ ] **3.4** Performance Tests
  - [ ] Benchmark embedding generation (<500ms/message)
  - [ ] Benchmark semantic search (<200ms for 10k messages)
  - [ ] Load testing with 1000+ concurrent requests

- [ ] **3.5** Coverage Report
  - [ ] Run `just test-all`
  - [ ] Verify coverage ≥ 90%
  - [ ] Generate coverage report

**MCP інструменти:**
- `mcp__postgres-mcp__get_top_queries` - query performance
- `mcp__context7__get-library-docs` - pytest patterns

**Виходи:**
- ✅ 90%+ test coverage
- ✅ All tests pass
- ✅ Performance benchmarks documented

---

## 🏗️ Фаза 4: Architecture Review & Cleanup

### 📐 Крок 4.1: Architecture Review

**Агент:** `architecture-guardian`
**Час:** 2-3 години
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **4.1.1** Review all changes
  - [ ] Database schema changes
  - [ ] Service architecture
  - [ ] API design consistency
  - [ ] Error handling patterns

- [ ] **4.1.2** Validate patterns
  - [ ] Dependency injection
  - [ ] Async/await usage
  - [ ] Type safety (mypy strict)
  - [ ] Resource management

- [ ] **4.1.3** Performance review
  - [ ] Index usage
  - [ ] Query optimization
  - [ ] Memory management
  - [ ] Connection pooling

- [ ] **4.1.4** Security review
  - [ ] API key encryption
  - [ ] Input validation
  - [ ] SQL injection prevention
  - [ ] Rate limiting

- [ ] **4.1.5** Generate report
  - [ ] Файл: `VECTOR_DB_ARCHITECTURE_REVIEW.md`
  - [ ] Issues found
  - [ ] Recommendations

**Виходи:**
- ✅ Architecture review report
- ✅ All critical issues addressed

---

### 🧹 Крок 4.2: Code Cleanup

**Агент:** `codebase-cleaner`
**Час:** 1-2 години
**Статус:** ⚪ Pending

#### Завдання:

- [ ] **4.2.1** Remove dead code
  - [ ] Unused imports
  - [ ] Unused functions
  - [ ] Commented-out code blocks

- [ ] **4.2.2** Optimize imports
  - [ ] Run `just fmt` на всіх змінених файлах
  - [ ] Absolute imports only
  - [ ] Sorted imports (ruff)

- [ ] **4.2.3** Remove unnecessary comments
  - [ ] Structural comments (obvious code)
  - [ ] Keep complex logic explanations
  - [ ] Keep business rules documentation

- [ ] **4.2.4** Modernize patterns
  - [ ] Update to latest library patterns
  - [ ] Improve type hints
  - [ ] Optimize async patterns

- [ ] **4.2.5** Final quality checks
  - [ ] `just typecheck` - clean
  - [ ] `just fmt-check` - clean
  - [ ] `just test-all` - pass

**MCP інструменти:**
- `mcp__ide__getDiagnostics` - find issues
- `mcp__context7__get-library-docs` - modern patterns

**Виходи:**
- ✅ Clean, production-ready code
- ✅ All quality checks pass
- ✅ Ready for review

---

## 📊 Success Metrics

### Functionality
- [ ] ✅ Message-Topic relationship працює
- [ ] ✅ Semantic search для messages (<200ms)
- [ ] ✅ Semantic search для atoms
- [ ] ✅ Duplicate detection (>95% accuracy)
- [ ] ✅ RAG pipeline integrated
- [ ] ✅ Context-aware proposals

### Performance
- [ ] Embedding generation: <500ms per message
- [ ] Semantic search: <200ms for 10k messages
- [ ] Vector index size: reasonable (<20% of table size)
- [ ] API response times: <300ms p95

### Quality
- [ ] Test coverage: ≥90%
- [ ] `just typecheck` passes
- [ ] `just fmt-check` passes
- [ ] No mypy errors (strict mode)
- [ ] All tests pass

### Architecture
- [ ] Type-safe code (mypy strict)
- [ ] Proper dependency injection
- [ ] Async patterns followed
- [ ] Error handling comprehensive
- [ ] Documentation complete

---

## 🚀 Execution Order

### Sprint 1 (Day 1)
1. **Паралельно:**
   - Agent 1: `fastapi-backend-expert` → Фаза 1 (Message-Topic)
   - Agent 2: `devops-expert` → Фаза 2.1 (pgvector setup)

2. **Послідовно:**
   - Agent 1: Фаза 2.2 → Фаза 2.3 (Migrations + Embedding Service)

### Sprint 2 (Day 2)
3. **Послідовно:**
   - Agent 1: Фаза 2.4 → Фаза 2.5 (Semantic Search + RAG)

### Sprint 3 (Day 3)
4. **Паралельно:**
   - Agent 1: `pytest-test-master` → Фаза 3 (Testing)
   - Agent 2: `fastapi-backend-expert` → Finalize integrations

### Sprint 4 (Day 4)
5. **Послідовно:**
   - Agent 1: `architecture-guardian` → Фаза 4.1 (Review)
   - Agent 2: `codebase-cleaner` → Фаза 4.2 (Cleanup)

---

## 📝 Notes & Decisions

### Design Decisions
- **Vector dimensions:** 1536 (OpenAI text-embedding-3-small)
- **Index type:** IVFFlat with cosine distance
- **Similarity operator:** `<=>` (cosine distance)
- **Batch size:** 100 messages per batch
- **RAG top_k:** 5 similar items

### Known Limitations
- IVFFlat requires training data (min 1000 vectors for optimal performance)
- Embedding generation requires external API (OpenAI or local Ollama)
- Vector storage increases DB size (~6KB per message)

### Future Enhancements
- [ ] HNSW index for better performance (PostgreSQL 16+)
- [ ] Multi-language embedding support
- [ ] Embedding model fine-tuning on domain data
- [ ] Hybrid search (semantic + keyword)
- [ ] Clustering visualization

---

## 🔗 Related Documents
- `ANALYSIS_SYSTEM_ARCHITECTURE.md` - Overall system architecture
- `TECH_PLAN.md` - Technical roadmap
- `README.md` - Project overview

---

**Last Updated:** 2025-10-16
**Updated By:** AI Assistant
**Version:** 1.0
