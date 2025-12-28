---
type: plan
created: 2025-12-28
status: draft
priority: P1
tags:
  - extraction
  - rag
  - batching
  - architecture
---

# Extraction Pipeline Improvements

> **Мета:** Покращити якість extraction через RAG context, batching, та cost optimization.
> **Дослідження:** 2025-12-28, 3 агенти проаналізували код та best practices.

## Поточний стан

### Що працює добре

| Компонент | Файл | Статус |
|-----------|------|--------|
| Threshold batching | `tasks/ingestion.py:18-82` | ✅ 10 msg → batch 50 |
| Embedding batch | `tasks/knowledge.py:18-103` | ✅ 100 per chunk |
| RAGContextBuilder | `services/rag_context_builder.py` | ✅ Написано, тести є |
| SemanticSearchService | `services/semantic_search_service.py` | ✅ pgvector working |
| KnowledgeOrchestrator | `services/knowledge/knowledge_orchestrator.py` | ✅ Versioning |

### Конфігурація

```python
# ai_config.py
knowledge_extraction:
  message_threshold: 10      # trigger extraction after N messages
  batch_size: 50             # messages per extraction
  lookback_hours: 24         # window for unprocessed messages
  confidence_threshold: 0.7  # min confidence to save atom

message_scoring:
  noise_threshold: 0.25
  signal_threshold: 0.65

embedding:
  batch_size: 100
  openai_model: "text-embedding-3-small"  # 1536 dims
  ollama_model: "nomic-embed-text"        # 768 dims → padded to 1536
```

---

## Критичний Gap: RAG не інтегрований

### Проблема

RAGContextBuilder **існує але не використовується**:

```python
# KnowledgeOrchestrator._build_prompt() - ЗАРАЗ
prompt = f"""Analyze the following {len(messages)} messages...
Messages:
{messages_text}  # ← ТІЛЬКИ raw messages, БЕЗ контексту!
```

LLM не бачить:
- Схожих попередніх atoms
- Історичних рішень
- Контексту проекту/каналу

### Наслідки

1. **Дублікати** — LLM витягує те саме що вже є
2. **Немає зв'язків** — нові atoms не лінкуються до існуючих
3. **Втрата контексту** — без historical knowledge качество падає

---

## Виявлені Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | RAG не викликається в extraction | Критично | P0 |
| 2 | Embeddings генеруються ПІСЛЯ extraction | RAG неможливий | P0 |
| 3 | Немає thread/conversation grouping | Flat list в LLM | P1 |
| 4 | Немає retry для failed tasks | Silent failures | P1 |
| 5 | Немає deduplication | Дублікати atoms | P1 |
| 6 | Single language per batch | Degraded output | P2 |
| 7 | No feedback loop (extraction → scoring) | No improvement | P2 |

---

## План покращень

### Phase 1: Activate RAG (P0)

**Мета:** LLM отримує контекст з existing knowledge.

- [ ] Генерувати embeddings для messages **ДО** extraction (не після)
- [ ] Викликати `RAGContextBuilder.build_context()` перед extraction
- [ ] Inject `RAGContextBuilder.format_context()` в prompt
- [ ] Тестувати з mock data

**Зміни у файлах:**
- `tasks/knowledge.py` — embed before extract
- `services/knowledge/knowledge_orchestrator.py` — inject RAG context
- `services/rag_context_builder.py` — verify/fix integration

### Phase 2: Improve Batching (P1)

**Мета:** Групувати messages логічно, не просто по threshold.

- [ ] Thread detection (reply_to_message_id, time gaps)
- [ ] Group by channel before batching
- [ ] Language pre-filtering (uk/en separate batches)
- [ ] Conversation boundary detection (600s gap = new thread)

**Зміни у файлах:**
- `tasks/ingestion.py` — add grouping logic
- New: `services/thread_detector.py`

### Phase 3: Reliability (P1)

**Мета:** Failed tasks retry, no silent failures.

- [ ] Add retry with exponential backoff (max 3 attempts)
- [ ] Dead letter queue for permanently failed
- [ ] Alert on repeated failures
- [ ] Deduplication before save (vector similarity > 0.9)

**Зміни у файлах:**
- `tasks/knowledge.py` — add retry logic
- `services/knowledge/knowledge_orchestrator.py` — dedup check

### Phase 4: Cost Optimization (P2)

**Мета:** Cheap model for filtering, quality model for extraction.

- [ ] Two-tier model selection
- [ ] Tier 1: llama3.2:3b for classification (fast, free)
- [ ] Tier 2: llama3.1:8b for extraction (quality)
- [ ] Fallback to OpenAI if local fails

**Зміни у файлах:**
- New: `services/model_selector.py`
- `config/ai_config.py` — add tier configs

---

## Архітектура після покращень

```
┌─────────────────────────────────────────────────────────────────┐
│  Telegram Webhook                                                │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Message Buffer + Grouping                                       │
│  • Thread detection (reply chains, time gaps)                   │
│  • Language filtering (uk/en separate)                          │
│  • Channel grouping                                             │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Pre-Embedding (NEW!)                                            │
│  • Generate embeddings BEFORE extraction                        │
│  • Enable RAG lookup                                            │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Tier 1: Classification (cheap model)                           │
│  • Signal/Noise filter                                          │
│  • Basic categorization                                         │
│  • llama3.2:3b (local, fast)                                    │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  RAG Context Builder (ACTIVATED!)                                │
│  • Similar existing atoms (pgvector)                            │
│  • Related messages (last 24h)                                  │
│  • Channel/project metadata                                     │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Tier 2: Extraction (quality model)                             │
│  • Full context: messages + RAG                                 │
│  • Extract atoms WITH relationships                             │
│  • llama3.1:8b or OpenAI fallback                               │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  Deduplication + Save                                            │
│  • Check vector similarity > 0.9                                │
│  • Link to existing atoms (continues, updates)                  │
│  • Versioning for updates                                       │
└──────────────────────────────────┬──────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│  WebSocket Broadcast                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hardware Considerations

**M1 Pro 32GB (primary):**

| Model | Use | Speed |
|-------|-----|-------|
| llama3.2:3b | Classification | <1 sec |
| nomic-embed-text | Embeddings | Fast |
| llama3.1:8b | Extraction | 5-15 sec/batch |

**4070Ti 16GB (backup):**

| Model | Use | Speed |
|-------|-----|-------|
| qwen2.5:14b | Better extraction | Faster |

---

## Тестові сценарії

### Test 1: RAG Integration

```python
def test_extraction_uses_rag_context():
    # Given: existing atoms in DB with embeddings
    # When: new message batch extracted
    # Then: RAGContextBuilder.build_context called
    # And: context injected in prompt
```

### Test 2: Deduplication

```python
def test_duplicate_atom_not_created():
    # Given: atom "Use Redis for cache" exists
    # When: message "We decided on Redis for caching"
    # Then: no new atom, linked to existing
```

### Test 3: Thread Grouping

```python
def test_messages_grouped_by_thread():
    # Given: 5 messages with reply_to chains
    # When: batch extraction triggered
    # Then: messages in same thread processed together
```

---

## Метрики успіху

| Metric | Before | Target |
|--------|--------|--------|
| Duplicate atoms | Unknown | <5% |
| RAG context usage | 0% | 100% |
| Failed extractions | Silent | 0 (with retry) |
| Atom relationships | None | >30% linked |

---

## Next Steps

1. **Перевірити core flow** — план `core-flow-verification.md`
2. **Після core працює** — почати Phase 1 (RAG activation)
3. **Ітеративно** — Phase 2-4 по мірі стабілізації

---

## Файли для зміни

| Файл | Зміни |
|------|-------|
| `tasks/knowledge.py` | Pre-embed, retry logic |
| `tasks/ingestion.py` | Thread grouping |
| `services/knowledge/knowledge_orchestrator.py` | RAG injection, dedup |
| `services/rag_context_builder.py` | Verify/fix |
| `config/ai_config.py` | Tier configs |
| New: `services/thread_detector.py` | Thread detection |
| New: `services/model_selector.py` | Two-tier selection |

---

**Estimated effort:** 2-3 тижні для всіх phases

**Залежність:** Спочатку core-flow-verification, потім improvements
