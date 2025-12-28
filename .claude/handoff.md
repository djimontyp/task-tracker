# Handoff: Pulse Radar

**Гілка:** `006-knowledge-discovery`
**Оновлено:** 2025-12-28 18:30

---

## Що зроблено

### 1. Core Flow Verification ✅

```
Telegram webhook → Message → AI parsing → Atoms/Topics → UI
       ✅            ✅          ✅           ✅        ✅
```

- 4 Atoms, 4 Topics, 2 Links створено через LLM
- UUID serialization bug виправлено

### 2. Unified Scoring Config ✅ (Calibrated)

| Параметр | Старе | Нове | Причина |
|----------|-------|------|---------|
| noise_threshold | 0.25 | **0.30** | "Ок", "👍" (score ~0.28) мають бути noise |
| signal_threshold | 0.65 | **0.60** | "Критичний баг" (score 0.63) має бути signal |

**Результат:** 2 noise, 1 signal, 20 weak_signal

### 3. RAG Integration ✅ (NEW!)

**Phase 1: Activate RAG** — завершено!

```
БУЛО:
  save_msg → score → extract → embed (занадто пізно!)
                        ↓
                    RAG ❌ порожній

СТАЛО:
  save_msg → score → embed → extract
                        ↓      ↓
                      готові   RAG ✅ знаходить схожі
```

**Зміни:**

| Файл | Що зроблено |
|------|-------------|
| `scoring.py` | Додано embedding після scoring для RAG-ready search |
| `knowledge.py` | Видалено дублювання embed_messages, додано RAGContextBuilder |
| `knowledge_orchestrator.py` | Inject RAG context у extract_knowledge() |

**Як працює:**
1. Message scored → одразу embed for RAG
2. При extraction → RAGContextBuilder.build_context() шукає:
   - Similar proposals (past approved)
   - Relevant atoms (knowledge base)
   - Related messages (history)
3. Context inject у LLM prompt перед extraction

---

## Що далі

### Phase 2: Improve Batching (P1)

- [ ] Thread detection (reply_to_message_id, time gaps)
- [ ] Group by channel before batching
- [ ] Language pre-filtering (uk/en separate batches)

### Phase 3: Reliability (P1)

- [ ] Add retry with exponential backoff
- [ ] Dead letter queue for failed tasks
- [ ] Deduplication before save (vector similarity > 0.9)

### Phase 4: Cost Optimization (P2)

- [ ] Two-tier model selection (cheap for classification, quality for extraction)

---

## Швидкий старт

```bash
# Сервіси вже running:
docker ps | grep task-tracker

# Якщо не running:
just services

# Перевірити RAG в логах:
docker logs -f task-tracker-worker 2>&1 | grep -i "rag\|context"

# Trigger extraction manually:
curl -X POST http://localhost/api/v1/analysis/extract \
  -H "Content-Type: application/json" \
  -d '{"period_type": "last_24h"}'
```

---

## Ключові файли

| Файл | Що |
|------|-----|
| `backend/app/tasks/scoring.py` | Embed після scoring |
| `backend/app/tasks/knowledge.py` | RAGContextBuilder integration |
| `backend/app/services/knowledge/knowledge_orchestrator.py` | RAG injection у prompt |
| `backend/app/services/rag_context_builder.py` | Semantic context builder |
| `backend/app/config/ai_config.py` | Thresholds (0.30/0.60) |
| `.obsidian-docs/плани/extraction-pipeline-improvements.md` | Full roadmap |

---

## Тестування

### E2E тести (8 tests, all pass)

```bash
cd frontend && npx playwright test tests/e2e/knowledge-extraction.spec.ts --project=chromium
```

### Worker logs

```bash
docker logs -f task-tracker-worker 2>&1 | grep -i "rag\|context"

# Має бути:
# "Building RAG context for extraction..."
# "RAG context built: X proposals, Y atoms, Z messages"
```

---

## Commits

| Hash | Description |
|------|-------------|
| `4ca13e7` | feat(extraction): activate RAG context in knowledge extraction pipeline |
| `5289ff4` | fix(rag): use asyncpg raw connection for pgvector queries |
