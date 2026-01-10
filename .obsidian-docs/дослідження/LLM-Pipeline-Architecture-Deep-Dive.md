# LLM Pipeline Architecture: Deep Dive & Optimization Strategy

> **Epic:** Глибокий аналіз LLM-частини Pulse Radar з рекомендаціями щодо масштабування
> **Status:** Дослідження завершено
> **Created:** 2026-01-09
> **Author:** LLM Engineer (L1)

---

## Executive Summary

Цей документ містить глибокий аналіз LLM-pipeline Pulse Radar з фокусом на:
- Поточна архітектура та її сильні/слабкі сторони
- RAG vs CAG стратегії для knowledge extraction
- Оптимізація витрат та ресурсів
- Масштабування при зростанні навантаження
- Рекомендації для динамічних агентів та scheduled tasks

**Ключові висновки:**
1. Поточна архітектура **добре спроектована** для MVP, але потребує оптимізації для scale
2. **Hybrid RAG+CAG** є оптимальною стратегією для нашого юзкейсу
3. **Batching + Smart Routing** може знизити витрати на 60-80%
4. Локальна RTX 4070Ti Super достатня для 1-3K повідомлень/день
5. **Qwen3** — найкращий вибір для локального inference (Apache 2.0, 36T tokens training)
6. **Gemini 3 Flash** — найкращий cost/quality для cloud ($0.50/1M input)

**Реальне навантаження MVP:**
- 1 Telegram чат: ~500 msgs/day
- По компанії: 1-3K msgs/day
- Initial training: 6K historical messages (1 month)
- Target: <$50/month cloud budget

---

## Частина 1: Аналіз Поточної Архітектури

### 1.1 Загальний Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PULSE RADAR LLM PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐      ┌─────────────────┐      ┌─────────────────────┐      │
│  │  TELEGRAM   │─────▶│ save_message()  │─────▶│ score_message_task  │      │
│  │  Webhook    │      │  (sync)         │      │  (TaskIQ async)     │      │
│  └─────────────┘      └─────────────────┘      └──────────┬──────────┘      │
│                                                            │                 │
│                                                            ▼                 │
│                              ┌─────────────────────────────────────────┐     │
│                              │  ImportanceScorer (AI or Heuristic)    │     │
│                              │  • importance_score: 0.0-1.0           │     │
│                              │  • classification: signal/noise        │     │
│                              │  ◄─── ADR-003: AI Scoring preferred    │     │
│                              └──────────────────┬──────────────────────┘     │
│                                                 │                            │
│                    ┌────────────────────────────┼────────────────────────┐   │
│                    ▼                            ▼                        ▼   │
│           ┌───────────────┐         ┌───────────────────┐    ┌──────────┐   │
│           │ NOISE (<0.3)  │         │ WEAK (0.3-0.6)   │    │ SIGNAL   │   │
│           │ Skip extract  │         │ Queue for batch   │    │ (>0.6)   │   │
│           └───────────────┘         └───────────────────┘    └────┬─────┘   │
│                                                                    │         │
│                                                                    ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │        queue_knowledge_extraction_if_needed()                        │    │
│  │        • unprocessed >= 10? (configurable)                          │    │
│  │        • AgentConfig "knowledge_extractor" active?                  │    │
│  └─────────────────────────────────────────────────────────┬───────────┘    │
│                                                             │                │
│                                                             ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    KnowledgeOrchestrator                             │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  1. Build RAG Context                                        │    │    │
│  │  │     • similar_proposals (pgvector cosine)                    │    │    │
│  │  │     • relevant_atoms (approved knowledge)                    │    │    │
│  │  │     • related_messages (history)                             │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  2. Inject CAG Context (if ProjectConfig)                    │    │    │
│  │  │     • keywords, glossary, components                         │    │    │
│  │  │     • priority_rules                                         │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────────────────────────┐    │    │
│  │  │  3. LLM Extraction (Pydantic AI)                             │    │    │
│  │  │     • output_type=KnowledgeExtractionOutput                  │    │    │
│  │  │     • output_retries=5                                       │    │    │
│  │  │     • Language validation (langdetect)                       │    │    │
│  │  └─────────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                             │                │
│                                                             ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Post-Processing                                   │    │
│  │  • save_topics() → semantic dedup (0.85 threshold)                  │    │
│  │  • save_atoms() → version-pending-approval (>0.95 = version)        │    │
│  │  • link_atoms() → AtomLink relationships                            │    │
│  │  • embed_atoms_batch_task.kiq() → pgvector                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Ключові Компоненти

| Компонент | Файл | Відповідальність | Оцінка |
|-----------|------|------------------|--------|
| **LLM Agents** | `llm_agents.py` | System prompts (EN/UK), model building | ✅ Добре |
| **KnowledgeOrchestrator** | `knowledge_orchestrator.py` | Головна логіка extraction | ✅ Добре, але монолітний |
| **RAGContextBuilder** | `rag_context_builder.py` | Semantic context injection | ⚠️ Потребує оптимізації |
| **SemanticSearchService** | `semantic_search_service.py` | pgvector search | ✅ Добре |
| **EmbeddingService** | `embedding_service.py` | OpenAI/Ollama embeddings | ✅ Добре |
| **TaskIQ Workers** | `tasks/knowledge.py` | Background jobs | ✅ Добре |
| **ai_config** | `config/ai_config.py` | Thresholds | ✅ Добре структуровано |

### 1.3 Сильні Сторони Поточної Архітектури

1. **Hexagonal Architecture (Ports & Adapters)**
   - `ports.py` визначає чіткі протоколи: `LLMAgent`, `ModelFactory`, `LLMFramework`
   - Легко змінити framework (Pydantic AI → LangChain) без зміни бізнес-логіки

2. **Pydantic AI з Structured Output**
   - `output_type=KnowledgeExtractionOutput` гарантує валідний JSON
   - `output_retries=5` обробляє нестабільність локальних моделей
   - `PromptedOutput` для Ollama (краще ніж tool-based)

3. **Hybrid RAG+CAG**
   - RAG: семантичний пошук existing knowledge
   - CAG: статичний project context (keywords, glossary)
   - Об'єднання дає найкращу якість

4. **Semantic Deduplication**
   - Topics: >0.85 similarity → reuse existing
   - Atoms: >0.95 → create version, 0.85-0.95 → similar_to flag

5. **Async Background Processing**
   - TaskIQ + NATS JetStream
   - Не блокує webhook response
   - WebSocket events для real-time UI updates

### 1.4 Слабкі Сторони / Технічний Борг

| Проблема | Severity | Опис | Рекомендація |
|----------|----------|------|--------------|
| **Монолітний Orchestrator** | Medium | 1000+ рядків в одному класі | Розбити на менші сервіси |
| **N+1 Queries в RAG** | High | Кожен message → окремий embedding lookup | Batch queries |
| **Немає Caching** | High | Кожен extraction → fresh RAG context | Redis/in-memory cache |
| **Single Model Routing** | Medium | Всі tasks → один model | Smart routing по complexity |
| **Немає Cost Tracking** | Medium | Не рахуються токени | Add token counting |
| **Test vs Production Gap** | High | Test endpoint не використовує structured output | Уніфікувати flows |

---

## Частина 2: RAG vs CAG Стратегія

### 2.1 Визначення

| Стратегія | Повна назва | Принцип |
|-----------|-------------|---------|
| **RAG** | Retrieval-Augmented Generation | Динамічний пошук по vector DB |
| **CAG** | Context-Augmented Generation | Статичний preloaded context |

### 2.2 Поточна Імплементація

**RAG (RAGContextBuilder):**
```python
# rag_context_builder.py
async def build_context(session, messages, top_k=5):
    # 1. Combine message texts
    combined_text = " ".join([msg.content for msg in messages])[:1000]

    # 2. Generate query embedding
    query_embedding = await embedding_service.generate_embedding(combined_text)

    # 3. Search similar content
    similar_proposals = []  # TODO: task_proposals table doesn't exist
    relevant_atoms = await find_relevant_atoms(session, query_embedding, top_k)
    related_messages = await find_related_messages(session, query_embedding, top_k)

    return RAGContext(similar_proposals, relevant_atoms, related_messages, summary)
```

**CAG (ProjectConfig injection):**
```python
# knowledge_orchestrator.py
def _build_prompt(messages, rag_context=""):
    project_context_section = ""
    if self.project_config:
        # Static context: keywords, glossary, components, priority_rules
        project_context_section = f"""
## Project Context: {self.project_config.name}
**Keywords:** {", ".join(self.project_config.keywords)}
**Glossary:** {format_glossary(self.project_config.glossary)}
**Components:** {format_components(self.project_config.components)}
"""

    # Combine: Project (CAG) + RAG + Messages
    prompt = f"{project_context_section}{rag_context}\n\n## Messages\n{messages_text}"
```

### 2.3 Коли Використовувати Що?

| Сценарій | Рекомендація | Обґрунтування |
|----------|--------------|---------------|
| **Cold Start** (немає history) | CAG only | Немає даних для RAG |
| **Перші 100 atoms** | CAG + minimal RAG | RAG ще не ефективний |
| **>500 atoms** | Full RAG + CAG | Достатньо даних для similarity |
| **Specific domain** | Heavy CAG | Glossary/keywords критичні |
| **Cross-domain** | Heavy RAG | Потрібен широкий context |

### 2.4 Оптимізація RAG для Pulse Radar

**Проблема:** Поточний RAG робить 3 окремі query:
1. `find_similar_proposals()` — NOT IMPLEMENTED
2. `find_relevant_atoms()` — SELECT * FROM atoms WHERE...
3. `find_related_messages()` — SELECT * FROM messages WHERE...

**Рішення: Batched Multi-Table Query**

```sql
-- Один запит замість трьох
WITH query_vector AS (
    SELECT $1::vector AS vec
),
atom_matches AS (
    SELECT
        'atom' AS type,
        a.id,
        a.title,
        a.content,
        1 - (a.embedding <=> q.vec) / 2 AS similarity
    FROM atoms a, query_vector q
    WHERE a.embedding IS NOT NULL
      AND a.user_approved = true
      AND 1 - (a.embedding <=> q.vec) / 2 >= 0.65
    ORDER BY similarity DESC
    LIMIT 5
),
message_matches AS (
    SELECT
        'message' AS type,
        m.id,
        '' AS title,
        m.content,
        1 - (m.embedding <=> q.vec) / 2 AS similarity
    FROM messages m, query_vector q
    WHERE m.embedding IS NOT NULL
      AND m.id != ALL($2)  -- exclude current batch
      AND 1 - (m.embedding <=> q.vec) / 2 >= 0.65
    ORDER BY similarity DESC
    LIMIT 5
)
SELECT * FROM atom_matches
UNION ALL
SELECT * FROM message_matches
ORDER BY similarity DESC;
```

**Очікуване покращення:** 3x менше DB round-trips

### 2.5 CAG Optimization: Precomputed Project Embeddings

**Ідея:** Зберігати embedding для project context, порівнювати з batch embedding для релевантності.

```python
class ProjectContextService:
    """Precomputed project context for faster CAG."""

    async def get_relevant_projects(
        self,
        batch_embedding: list[float],
        threshold: float = 0.7,
        limit: int = 3
    ) -> list[ProjectConfig]:
        """Find projects most relevant to current batch."""
        # Project embeddings stored in DB
        similar = await search_projects_by_vector(batch_embedding, threshold, limit)
        return [p.config for p in similar]
```

**Переваги:**
- Автоматичний вибір project context
- Multi-project extraction (cross-domain)
- Немає manual project assignment

---

## Частина 3: Оптимізація Витрат

### 3.1 Поточна Модель Витрат

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT COST MODEL                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1 Message Ingestion:                                           │
│     ├─ Scoring (AI): ~200 tokens/msg = $0.0002 (GPT-4o-mini)   │
│     └─ Embedding: ~100 tokens/msg = $0.00001 (ada-002)          │
│                                                                  │
│  1 Extraction Batch (50 msgs):                                  │
│     ├─ RAG Context: ~500 tokens                                 │
│     ├─ Messages: ~5000 tokens                                   │
│     ├─ System Prompt: ~800 tokens                               │
│     └─ Output: ~2000 tokens                                     │
│     ─────────────────────────────                               │
│     Total: ~8300 tokens = $0.025 (GPT-4o) / $0.004 (GPT-4o-mini)│
│                                                                  │
│  Daily (1000 msgs, 20 batches):                                 │
│     ├─ Scoring: $0.20                                           │
│     ├─ Embeddings: $0.01                                        │
│     └─ Extraction: $0.50 (GPT-4o) / $0.08 (GPT-4o-mini)        │
│     ─────────────────────────────                               │
│     Total: $0.71/day (GPT-4o) / $0.29/day (GPT-4o-mini)        │
│                                                                  │
│  Monthly (30K msgs):                                            │
│     $21/month (GPT-4o) / $8.70/month (GPT-4o-mini)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Актуальні Моделі (Січень 2026)

#### Cloud Models — Pricing Comparison

| Model | Provider | Input/1M | Output/1M | Context | Best For |
|-------|----------|----------|-----------|---------|----------|
| **Gemini 3 Flash** | Google | $0.50 | $3.00 | 1M | Daily extraction (best cost/quality) |
| **Gemini 2.5 Flash** | Google | $0.30 | $2.50 | 1M | Budget scoring |
| **GPT-4.1 mini** | OpenAI | $1.00 | $4.00 | 1M | Instruction following |
| **o4-mini** | OpenAI | $1.10 | $4.40 | 200K | Math/coding reasoning |
| **Claude Haiku 3.5** | Anthropic | $0.80 | $4.00 | 200K | High-volume simple tasks |
| **Claude Haiku 4.5** | Anthropic | $1.00 | $5.00 | 200K | Better reasoning |

> **Рекомендація для Pulse Radar:**
> - **Scoring:** Gemini 2.5 Flash ($0.30/1M) — найдешевший з хорошою якістю
> - **Extraction:** Gemini 3 Flash ($0.50/1M) — 78% on SWE-bench, 3x faster than 2.5 Pro
> - **Executive Summary:** Claude Haiku 4.5 — кращий для Ukrainian text

#### Local Models (RTX 4070Ti Super 16GB)

| Model | Params | VRAM (Q4) | Speed | Benchmark | License |
|-------|--------|-----------|-------|-----------|---------|
| **Qwen3:0.6B** | 0.6B | ~1GB | 100+ tok/s | Entry level | Apache 2.0 |
| **Qwen3:4B** | 4B | ~3GB | 60 tok/s | = Qwen2.5:7B | Apache 2.0 |
| **Qwen3:8B** | 8B | ~6GB | 45 tok/s | = Qwen2.5:14B | Apache 2.0 |
| **Qwen3:14B** | 14B | ~10GB | 25 tok/s | = Qwen2.5:32B | Apache 2.0 |
| **Qwen3:32B** | 32B | ~16GB | 12 tok/s | = Qwen2.5:72B | Apache 2.0 |
| **DeepSeek-V3:7B** | 7B | ~6GB | 40 tok/s | Reasoning | MIT |
| **Llama4:8B** | 8B | ~7GB | 45 tok/s | General | Llama License |

> **Qwen3 переваги:**
> - Trained on 36T tokens (2x more than Qwen2.5)
> - 119 languages (including Ukrainian!)
> - Hybrid thinking: can toggle reasoning on/off
> - Qwen3-8B performs like Qwen2.5-14B
> - Apache 2.0 = commercial use allowed

#### Рекомендована конфігурація для 4070Ti Super

```
┌─────────────────────────────────────────────────────────────────┐
│            RTX 4070Ti Super 16GB — Model Strategy               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCORING (parallel, fast):                                      │
│  └── Qwen3:4B (Q4_K_M) — 3GB VRAM, 60 tok/s                    │
│                                                                  │
│  EXTRACTION (sequential, quality):                              │
│  └── Qwen3:14B (Q4_K_M) — 10GB VRAM, 25 tok/s                  │
│                                                                  │
│  EMBEDDINGS (batched):                                          │
│  └── mxbai-embed-large — 1GB VRAM, 1024 dims                   │
│                                                                  │
│  Memory Budget:                                                  │
│  ├── Scoring: 3GB                                               │
│  ├── Extraction: 10GB                                           │
│  ├── Embeddings: 1GB                                            │
│  ├── System overhead: 1GB                                       │
│  └── Buffer: 1GB                                                │
│  ─────────────────────                                          │
│  Total: 16GB ✓                                                  │
│                                                                  │
│  ⚠️ Не запускати scoring + extraction одночасно!               │
│  TaskIQ worker повинен мати queue concurrency = 1              │
│  для extraction tasks                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### GPU Memory Management

**Проблема:** Декілька одночасних LLM tasks можуть вичерпати VRAM

**Рішення 1: TaskIQ Queue Separation**
```python
# Окремі черги з різним concurrency
scoring_broker = NATSBroker(queue="scoring", max_concurrent=4)  # Small model, parallel OK
extraction_broker = NATSBroker(queue="extraction", max_concurrent=1)  # Large model, sequential
embedding_broker = NATSBroker(queue="embedding", max_concurrent=2)  # Small, can batch
```

**Рішення 2: Ollama Auto-Offload**
```bash
# Ollama автоматично offload на CPU якщо VRAM не вистачає
# Можна контролювати через env:
OLLAMA_NUM_GPU=999       # Use all GPU layers (default)
OLLAMA_NUM_GPU=0         # Force CPU only
OLLAMA_NUM_PARALLEL=2    # Max concurrent requests per model
```

**Рішення 3: Model Hot-Swap**
```python
class ModelManager:
    """Unload inactive models to free VRAM."""

    async def ensure_model_loaded(self, model_name: str) -> None:
        # Ollama auto-unloads after 5 min idle (default)
        # For immediate unload:
        await self.client.post("/api/generate", json={
            "model": "qwen3:14b",
            "keep_alive": "0"  # Unload immediately after response
        })

    async def preload_model(self, model_name: str) -> None:
        # Preload before batch
        await self.client.post("/api/generate", json={
            "model": model_name,
            "prompt": "",  # Empty prompt just loads model
            "keep_alive": "10m"
        })
```

### 3.3 Реальні Розрахунки для MVP

#### Сценарій: Initial Training (6K historical messages)

```
┌─────────────────────────────────────────────────────────────────┐
│              6K HISTORICAL MESSAGES — TOKEN BUDGET               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Assumptions:                                                    │
│  • Average message: 50 tokens (Ukrainian Telegram)               │
│  • System prompt: 800 tokens                                     │
│  • RAG context: 500 tokens                                       │
│  • Output per batch: 2000 tokens                                │
│  • Batch size: 50 messages                                       │
│                                                                  │
│  1. SCORING (6000 messages × 1 call each):                      │
│     Input: 6000 × (50 + 200 prompt) = 1.5M tokens               │
│     Output: 6000 × 50 = 300K tokens                             │
│                                                                  │
│  2. EXTRACTION (120 batches × 50 msgs):                         │
│     Input: 120 × (50×50 + 800 + 500) = 420K tokens              │
│     Output: 120 × 2000 = 240K tokens                            │
│                                                                  │
│  3. EMBEDDINGS (6000 messages + ~500 atoms):                    │
│     Input: 6500 × 50 = 325K tokens                              │
│                                                                  │
│  TOTAL:                                                          │
│  ├── Scoring: 1.8M tokens                                       │
│  ├── Extraction: 660K tokens                                    │
│  └── Embeddings: 325K tokens                                    │
│  ─────────────────────                                          │
│  Grand Total: ~2.8M tokens                                       │
│                                                                  │
│  COST (Cloud):                                                   │
│  ├── Gemini 2.5 Flash (scoring): $0.30×1.8 + $2.50×0.3 = $1.29 │
│  ├── Gemini 3 Flash (extract): $0.50×0.42 + $3×0.24 = $0.93    │
│  └── Embeddings (text-embedding-3-small): ~$0.05               │
│  ─────────────────────                                          │
│  Total: ~$2.30 for initial training                             │
│                                                                  │
│  TIME (Local RTX 4070Ti):                                       │
│  ├── Scoring: 1.8M / 60 tok/s = 8.3 hours (Qwen3:4B)           │
│  ├── Extraction: 660K / 25 tok/s = 7.3 hours (Qwen3:14B)       │
│  └── Embeddings: 325K / 100 tok/s = 0.9 hours                  │
│  ─────────────────────                                          │
│  Total: ~17 hours (можна за ніч)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Сценарій: Daily Operations (500-3000 msgs/day)

```
┌─────────────────────────────────────────────────────────────────┐
│              DAILY COST COMPARISON                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scenario A: 500 msgs/day (1 active chat)                       │
│  ─────────────────────────────────────────                      │
│  • Scoring: 500 × 250 = 125K tokens                             │
│  • Extraction: 10 batches × 5500 = 55K tokens                   │
│  • Embeddings: 500 × 50 = 25K tokens                            │
│  • Total: 205K tokens/day                                        │
│                                                                  │
│  Cloud (Gemini): $0.06/day = $1.80/month                        │
│  Local (Qwen3): ~1 hour GPU time = ~$0.02/day electricity       │
│                                                                  │
│  Scenario B: 1500 msgs/day (multiple chats)                     │
│  ─────────────────────────────────────────                      │
│  • Total: ~615K tokens/day                                       │
│                                                                  │
│  Cloud (Gemini): $0.18/day = $5.40/month                        │
│  Local (Qwen3): ~3 hours GPU time = ~$0.05/day                  │
│                                                                  │
│  Scenario C: 3000 msgs/day (enterprise)                         │
│  ─────────────────────────────────────────                      │
│  • Total: ~1.23M tokens/day                                      │
│                                                                  │
│  Cloud (Gemini): $0.37/day = $11.10/month                       │
│  Local (Qwen3): ~6 hours GPU time = ~$0.10/day                  │
│  ⚠️ Local потребує постійної роботи GPU протягом дня            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Рекомендація: Hybrid Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│              HYBRID STRATEGY FOR MVP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Development/Testing:                                            │
│  └── 100% Local (Qwen3:14B) — безкоштовно, вчимося              │
│                                                                  │
│  MVP Production (<$50/month budget):                            │
│  ├── Scoring: Local Qwen3:4B (free)                             │
│  ├── Extraction: Local Qwen3:14B (free)                         │
│  ├── Executive Summary: Cloud Gemini 3 Flash ($0.50/report)     │
│  └── Fallback: Cloud якщо local down                            │
│                                                                  │
│  Growth (>3K msgs/day):                                          │
│  ├── Scoring: Cloud Gemini 2.5 Flash (cheapest, parallel)       │
│  ├── Extraction: Cloud Gemini 3 Flash (best quality)            │
│  └── Local: тільки для dev/testing                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Cost Optimization Strategies

#### Strategy 1: Smart Model Routing

```python
class ModelRouter:
    """Route requests to appropriate model based on complexity."""

    ROUTING_RULES = {
        "scoring": {
            "simple": "qwen2.5:7b",      # Short messages (<50 chars)
            "complex": "deepseek-r1:7b",  # Long messages with context
        },
        "extraction": {
            "small_batch": "qwen2.5:14b",     # <20 messages
            "large_batch": "deepseek-r1:14b", # 20-50 messages
            "priority": "gpt-4o",              # Executive reports
        }
    }

    async def select_model(self, task_type: str, context: dict) -> str:
        rules = self.ROUTING_RULES[task_type]

        if task_type == "scoring":
            return rules["simple"] if len(context["text"]) < 50 else rules["complex"]

        if task_type == "extraction":
            msg_count = context["message_count"]
            if context.get("priority") == "executive":
                return rules["priority"]
            return rules["small_batch"] if msg_count < 20 else rules["large_batch"]
```

**Очікувана економія:** 40-60% на scoring tasks

#### Strategy 2: Batch Aggregation

**Поточний підхід:** Trigger extraction при 10+ unprocessed messages

**Оптимізований підхід:**
```python
class SmartBatchAggregator:
    """Aggregate messages into optimal batches."""

    async def should_trigger_extraction(self) -> bool:
        unprocessed = await self.count_unprocessed()

        # Time-based trigger (don't wait too long)
        oldest_age = await self.get_oldest_unprocessed_age()
        if oldest_age > timedelta(hours=4) and unprocessed >= 5:
            return True

        # Volume-based trigger
        if unprocessed >= 50:  # Full batch
            return True

        # Smart trigger: enough signals
        signal_count = await self.count_unprocessed_signals()
        if signal_count >= 10:  # 10 high-value messages
            return True

        return False
```

**Переваги:**
- Менше extraction calls (більші batches)
- Prioritize signals over noise
- Time-bound freshness

#### Strategy 3: Semantic Caching

```python
class SemanticCache:
    """Cache similar extraction results to avoid duplicate LLM calls."""

    def __init__(self, similarity_threshold: float = 0.95):
        self.cache: dict[str, CacheEntry] = {}
        self.threshold = similarity_threshold

    async def get_or_extract(
        self,
        messages: list[Message],
        extractor: KnowledgeOrchestrator
    ) -> KnowledgeExtractionOutput:
        # Generate batch signature
        batch_embedding = await self.embed_batch(messages)

        # Check cache for similar batch
        for key, entry in self.cache.items():
            similarity = cosine_similarity(batch_embedding, entry.embedding)
            if similarity >= self.threshold:
                logger.info(f"Cache hit! Similarity: {similarity:.3f}")
                return entry.result

        # Cache miss - extract and store
        result = await extractor.extract_knowledge(messages)
        self.cache[self._key(messages)] = CacheEntry(
            embedding=batch_embedding,
            result=result,
            created_at=datetime.now()
        )
        return result
```

**Use case:** Repeated similar discussions (e.g., standup updates)

#### Strategy 4: Progressive Enhancement

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROGRESSIVE ENHANCEMENT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1: Fast Classification (всі messages)                   │
│  └── Qwen2.5:7B, ~200 tokens, ~0.5s                            │
│                                                                  │
│  Level 2: Signal Enrichment (тільки signals)                   │
│  └── DeepSeek-R1:14B, ~500 tokens, ~2s                         │
│                                                                  │
│  Level 3: Deep Extraction (scheduled batches)                   │
│  └── GPT-4o, ~3000 tokens, ~10s                                │
│                                                                  │
│  Level 4: Executive Summary (weekly)                            │
│  └── Claude Sonnet, ~5000 tokens, ~15s                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Принцип:** Cheap models for filtering, expensive for high-value tasks

---

## Частина 4: Масштабування

### 4.1 Scaling Dimensions

| Dimension | Current Limit | Bottleneck | Solution |
|-----------|---------------|------------|----------|
| **Messages/day** | ~5K | Single worker | Horizontal workers |
| **Extraction batch** | 50 msgs | Context window | Chunking + merge |
| **Vector search** | ~100K vectors | pgvector index | HNSW + partitioning |
| **Concurrent users** | ~10 | WebSocket connections | Redis pub/sub |

### 4.2 Horizontal Scaling Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCALED ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────────────────────────────────────┐        │
│  │  Telegram   │────▶│              NATS JetStream                 │        │
│  │  Webhook    │     │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │        │
│  └─────────────┘     │  │ Stream: │  │ Stream: │  │ Stream: │     │        │
│                      │  │ scoring │  │ extract │  │ embed   │     │        │
│  ┌─────────────┐     │  └────┬────┘  └────┬────┘  └────┬────┘     │        │
│  │   Slack     │────▶│       │            │            │          │        │
│  │   Webhook   │     └───────┼────────────┼────────────┼──────────┘        │
│  └─────────────┘             │            │            │                    │
│                              ▼            ▼            ▼                    │
│  ┌─────────────┐     ┌─────────────┐ ┌─────────┐ ┌─────────────┐           │
│  │   Email     │────▶│  Worker 1   │ │ Worker 2│ │  Worker 3   │           │
│  │   Parser    │     │  (Scoring)  │ │ (Score) │ │ (Extraction)│           │
│  └─────────────┘     └──────┬──────┘ └────┬────┘ └──────┬──────┘           │
│                              │            │            │                    │
│                              ▼            ▼            ▼                    │
│                      ┌─────────────────────────────────────────┐           │
│                      │           PostgreSQL + pgvector          │           │
│                      │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │           │
│                      │  │messages │  │ atoms   │  │ topics  │  │           │
│                      │  │(part.)  │  │         │  │         │  │           │
│                      │  └─────────┘  └─────────┘  └─────────┘  │           │
│                      └─────────────────────────────────────────┘           │
│                                         │                                   │
│                                         ▼                                   │
│                      ┌─────────────────────────────────────────┐           │
│                      │              Redis                       │           │
│                      │  ┌──────────┐  ┌───────────┐            │           │
│                      │  │  Cache   │  │  Pub/Sub  │            │           │
│                      │  │ (RAG ctx)│  │(WebSocket)│            │           │
│                      │  └──────────┘  └───────────┘            │           │
│                      └─────────────────────────────────────────┘           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 pgvector Optimization for Millions of Vectors

**Поточний стан:**
- Index type: `ivfflat` (default)
- Dimensions: 1536 (OpenAI) / 768 (Ollama, padded)
- Estimated vectors: <10K

**Scaling Plan:**

| Scale | Vectors | Index | Config | Expected Latency |
|-------|---------|-------|--------|------------------|
| MVP | <10K | ivfflat | lists=100 | <10ms |
| Growth | 10K-100K | HNSW | m=16, ef=64 | <20ms |
| Scale | 100K-1M | HNSW + Partition | m=32, ef=128, monthly partitions | <50ms |
| Enterprise | >1M | Pinecone/Qdrant | Dedicated vector DB | <100ms |

**Migration script for HNSW:**
```sql
-- Create HNSW index (slower build, faster query)
CREATE INDEX CONCURRENTLY idx_atoms_embedding_hnsw
ON atoms USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Drop old ivfflat index
DROP INDEX IF EXISTS idx_atoms_embedding;
```

### 4.4 Multi-Source Ingestion

**Поточні джерела:** Telegram only

**Planned джерела:**
1. Slack (webhook + bot)
2. Email (IMAP/POP3 polling)
3. Discord (bot)
4. API (custom integrations)

**Unified Message Format:**
```python
class UnifiedMessage(BaseModel):
    """Source-agnostic message format."""

    id: UUID
    source: Literal["telegram", "slack", "email", "discord", "api"]
    source_id: str  # Original ID in source system
    source_channel_id: str | None
    source_thread_id: str | None

    content: str
    content_type: Literal["text", "file", "image", "mixed"]

    author_id: str
    author_name: str
    author_metadata: dict  # Source-specific fields

    sent_at: datetime
    received_at: datetime

    # Computed fields
    importance_score: float | None = None
    classification: str | None = None
    embedding: list[float] | None = None
```

**Ingestion Strategy:**
```
┌────────────────────────────────────────────────────────────────┐
│  Source Adapters                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Telegram │ │  Slack   │ │  Email   │ │  Discord │          │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │            │            │            │                  │
│       └────────────┼────────────┼────────────┘                  │
│                    │            │                               │
│                    ▼            ▼                               │
│          ┌─────────────────────────────┐                        │
│          │    UnifiedMessage Parser    │                        │
│          │    (normalize to schema)    │                        │
│          └────────────┬────────────────┘                        │
│                       │                                         │
│                       ▼                                         │
│          ┌─────────────────────────────┐                        │
│          │    NATS: ingest.messages    │                        │
│          └─────────────────────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Частина 5: Динамічні Агенти та Scheduled Tasks

### 5.1 Системні vs Кастомні Агенти

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AGENT TAXONOMY                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SYSTEM AGENTS (Built-in, hardcoded logic)                                  │
│  ─────────────────────────────────────────                                  │
│  Не можуть бути видалені або суттєво змінені користувачем                  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ ImportanceScorer│  │ KnowledgeExtract│  │ EmbeddingAgent  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Hardcoded     │  │ • Structured    │  │ • Batch process │             │
│  │   prompt        │  │   output schema │  │ • pgvector      │             │
│  │ • 0.0-1.0 score │  │ • Topics+Atoms  │  │ • 1024/1536 dim │             │
│  │ • signal/noise  │  │ • Language      │  │                 │             │
│  │                 │  │   validation    │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  Користувач може змінити: model_name, temperature, provider                 │
│  Користувач НЕ може змінити: system_prompt, output_type                    │
│                                                                              │
│  CUSTOM AGENTS (User-defined)                                               │
│  ─────────────────────────────                                              │
│  Створюються користувачем для специфічних задач                            │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ WeeklySummary   │  │ TopicClassifier │  │ PriorityRouter  │             │
│  │                 │  │                 │  │                 │             │
│  │ • Custom prompt │  │ • Custom prompt │  │ • Custom prompt │             │
│  │ • Free-form out │  │ • Maps to exist │  │ • Routes msgs   │             │
│  │ • Scheduled     │  │   topics        │  │   to channels   │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                              │
│  Користувач може: створювати, видаляти, повністю кастомізувати             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### System Agents Registry

| Agent | Task Type | Editable Fields | Locked Fields |
|-------|-----------|-----------------|---------------|
| **ImportanceScorer** | `score_message` | model, temp, provider | prompt, output schema |
| **KnowledgeExtractor** | `extract_knowledge` | model, temp, provider | prompt, output schema |
| **EmbeddingAgent** | `embed_*` | model, batch_size, provider | dimensions |
| **TopicLinker** | `link_topics` | threshold, model | logic |

```python
class AgentType(Enum):
    SYSTEM = "system"    # Built-in, limited editing
    CUSTOM = "custom"    # User-created, full control

class AgentConfig(SQLModel, table=True):
    id: UUID
    name: str
    agent_type: AgentType = AgentType.CUSTOM  # NEW FIELD
    description: str
    model_name: str
    system_prompt: str
    temperature: float = 0.3
    max_tokens: int = 4096
    provider_id: UUID
    is_active: bool = True

    # For system agents - prevents user from breaking core pipeline
    is_system_prompt_locked: bool = False
    is_output_schema_locked: bool = False
```

### 5.2 Project Auto-Detection

**Проблема:** Повідомлення з різних чатів можуть стосуватися різних проєктів. Як автоматично визначити, який project context застосувати?

**Рішення: Semantic Project Matching**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROJECT AUTO-DETECTION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: Source-based matching (fast, no LLM)                               │
│  ────────────────────────────────────────────                               │
│  • Telegram chat_id → mapped to project_id                                  │
│  • If explicit mapping exists → use it, skip semantic check                 │
│                                                                              │
│  Step 2: Semantic matching (if no explicit mapping)                         │
│  ────────────────────────────────────────────────                           │
│  • Generate embedding for message batch                                     │
│  • Compare with project embeddings (precomputed from keywords+glossary)     │
│  • If similarity > 0.75 → auto-assign project context                       │
│  • If multiple projects match → use all matching (multi-project context)    │
│  • If no match → proceed without project context                            │
│                                                                              │
│  Step 3: Project Permissions Check                                          │
│  ────────────────────────────────                                           │
│  • Project.allow_auto_assign: bool — чи можна автоматично прив'язувати     │
│  • Project.allowed_sources: list[str] — whitelist chat_ids (optional)      │
│  • Project.blocked_sources: list[str] — blacklist chat_ids (optional)      │
│                                                                              │
│  Step 4: Non-overlapping rule (messages belong to ONE project)              │
│  ────────────────────────────────────────────────                           │
│  • Message.project_id = single UUID (not array)                             │
│  • If message matches multiple ALLOWED projects → highest similarity wins   │
│  • User can manually reassign via UI (override auto-detection)              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Імплементація:**

```python
class ProjectMatcher:
    """Auto-detect project for incoming messages."""

    async def detect_project(
        self,
        messages: list[Message],
        source_channel_id: str | None = None
    ) -> Project | None:
        # Step 1: Explicit source mapping
        if source_channel_id:
            mapping = await self.get_channel_project_mapping(source_channel_id)
            if mapping:
                return mapping.project

        # Step 2: Semantic matching
        batch_text = " ".join([m.content for m in messages])[:2000]
        batch_embedding = await self.embedding_service.generate(batch_text)

        projects = await self.get_all_active_projects_with_embeddings()

        best_match: tuple[Project, float] | None = None
        for project in projects:
            # Step 3: Permission check
            if not self._is_project_allowed(project, source_channel_id):
                continue

            similarity = cosine_similarity(batch_embedding, project.embedding)
            if similarity > 0.75:
                if best_match is None or similarity > best_match[1]:
                    best_match = (project, similarity)

        if best_match:
            logger.info(f"Auto-detected project: {best_match[0].name} (sim={best_match[1]:.2f})")
            return best_match[0]

        return None  # No project context

    def _is_project_allowed(
        self,
        project: Project,
        source_channel_id: str | None
    ) -> bool:
        """Check if project allows auto-assignment from this source."""
        # Project disabled auto-assignment entirely
        if not project.allow_auto_assign:
            return False

        # Check blacklist first (takes priority)
        if project.blocked_sources and source_channel_id in project.blocked_sources:
            return False

        # Check whitelist (if defined, source must be in it)
        if project.allowed_sources:
            return source_channel_id in project.allowed_sources

        # No restrictions = allowed
        return True

    async def ensure_non_overlapping(
        self,
        message: Message,
        detected_project: Project
    ) -> None:
        """Ensure message belongs to only one project."""
        message.project_id = detected_project.id
```

**Project Model Extension:**

```python
class Project(SQLModel, table=True):
    id: UUID
    name: str
    # ... existing fields ...

    # Auto-assignment permissions
    allow_auto_assign: bool = True           # Can messages be auto-assigned?
    allowed_sources: list[str] | None = None  # Whitelist of chat_ids (None = all)
    blocked_sources: list[str] | None = None  # Blacklist of chat_ids

    # Precomputed embedding for semantic matching
    embedding: list[float] | None = None
```

**Use Cases:**

| Scenario | allow_auto_assign | allowed_sources | blocked_sources |
|----------|-------------------|-----------------|-----------------|
| Open project (default) | `True` | `None` | `None` |
| Private project (manual only) | `False` | — | — |
| Team-specific | `True` | `["chat_123", "chat_456"]` | `None` |
| Exclude spam channels | `True` | `None` | `["chat_spam"]` |

**UI Integration:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Message Card                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📝 "Треба пофіксити баг в мобільному додатку..."              │
│                                                                  │
│  [Auto-detected: Mobile App 📱] (0.87 similarity)               │
│                                    ▼                             │
│                             [Reassign to...]                     │
│                             ├── Backend API                      │
│                             ├── Frontend Web                     │
│                             └── None (no project)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Поточна Модель Агентів

```python
# AgentConfig model
class AgentConfig(SQLModel, table=True):
    id: UUID
    name: str                    # "knowledge_extractor"
    description: str
    model_name: str              # "deepseek-r1:14b"
    system_prompt: str           # Custom instructions
    temperature: float = 0.3
    max_tokens: int = 4096
    provider_id: UUID            # Link to LLMProvider
    is_active: bool = True

    # Task assignment (not used yet)
    task_types: list[str] = []   # ["extraction", "scoring", "summary"]
```

### 5.2 Рекомендована Архітектура Agent Orchestration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT ORCHESTRATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Agent Registry                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Scorer      │  │ Extractor   │  │ Summarizer  │  │ Classifier  │  │  │
│  │  │ Agent       │  │ Agent       │  │ Agent       │  │ Agent       │  │  │
│  │  │             │  │             │  │             │  │             │  │  │
│  │  │ qwen:7b     │  │ deepseek:14b│  │ gpt-4o      │  │ qwen:7b     │  │  │
│  │  │ temp=0.1    │  │ temp=0.3    │  │ temp=0.7    │  │ temp=0.1    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                         │                                    │
│                                         ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Task Router                                      │  │
│  │                                                                        │  │
│  │  match task.type:                                                     │  │
│  │    "score_message" → Scorer Agent                                     │  │
│  │    "extract_knowledge" → Extractor Agent                              │  │
│  │    "generate_summary" → Summarizer Agent                              │  │
│  │    "classify_topic" → Classifier Agent                                │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                         │                                    │
│                                         ▼                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       Execution Engine                                 │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Rate Limiter                                 │  │  │
│  │  │  • Per-provider limits (OpenAI: 10K TPM, Ollama: unlimited)    │  │  │
│  │  │  • Queue overflow → backpressure                               │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Cost Controller                              │  │  │
│  │  │  • Daily budget per agent                                       │  │  │
│  │  │  • Alert at 80%, pause at 100%                                 │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Retry Handler                                │  │  │
│  │  │  • Exponential backoff                                         │  │  │
│  │  │  • Fallback to cheaper model after 3 failures                  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Scheduled Tasks Design

**Поточна реалізація:**
```python
# ScheduledExtractionTask model
class ScheduledExtractionTask(SQLModel, table=True):
    id: UUID
    name: str
    cron_schedule: str           # "0 9 * * *" (daily 9am)
    agent_id: UUID              # Which agent to use
    channel_ids: list[str] = []  # Filter by channels
    min_score: float | None      # Filter by importance
    lookback_hours: int = 24     # Time window
    auto_approve_enabled: bool = False
    confidence_threshold: float = 0.8
    allowed_atom_types: list[str] = []
    is_active: bool = True
    last_run_at: datetime | None
```

**Рекомендації для Scheduled Tasks:**

#### 5.5.1 Frequency Guidelines

| Task Type | Recommended Frequency | Rationale |
|-----------|----------------------|-----------|
| **Scoring** | Real-time (on arrival) | Critical for filtering |
| **Extraction** | Every 4-6 hours | Balance freshness vs cost |
| **Daily Summary** | Once at EOD | Aggregate insights |
| **Weekly Report** | Friday 17:00 | Executive consumption |
| **History Archival** | Weekly (Sunday) | Move old data to archive |

#### 5.5.2 History Archival Strategy

**Проблема:** Messages накопичуються, але старі рідко потрібні для daily operations

**Рішення: Tiered Storage**

```
┌─────────────────────────────────────────────────────────────────┐
│                    MESSAGE LIFECYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOT (Active, in main tables)                                   │
│  ───────────────────────────                                    │
│  • Age: < 30 days                                               │
│  • Full content + embedding                                     │
│  • Used for RAG context                                         │
│  • Fast queries                                                 │
│                                                                  │
│  WARM (Archive, partitioned tables)                             │
│  ────────────────────────────────                               │
│  • Age: 30-180 days                                             │
│  • Full content + embedding                                     │
│  • Used for historical search                                   │
│  • Slower queries, but available                                │
│                                                                  │
│  COLD (Compressed archive)                                      │
│  ─────────────────────────                                      │
│  • Age: > 180 days                                              │
│  • Content only, no embedding                                   │
│  • Re-embed on demand if needed                                 │
│  • Minimal storage cost                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```python
class ArchivalService:
    """Move old messages to archive tables."""

    async def archive_old_messages(self) -> ArchivalResult:
        # Move 30-180 day old messages to archive partition
        hot_to_warm = await self.move_to_warm_archive(
            older_than=timedelta(days=30),
            newer_than=timedelta(days=180)
        )

        # Compress >180 day messages (drop embeddings)
        warm_to_cold = await self.move_to_cold_archive(
            older_than=timedelta(days=180)
        )

        return ArchivalResult(
            moved_to_warm=hot_to_warm,
            moved_to_cold=warm_to_cold,
            storage_saved_mb=self.calculate_savings()
        )

# Scheduled task (Sunday 3 AM)
@broker.task(schedule=CronSchedule("0 3 * * 0"))
async def weekly_archive_task():
    service = ArchivalService(session)
    result = await service.archive_old_messages()
    logger.info(f"Archived: {result.moved_to_warm} warm, {result.moved_to_cold} cold")
```

**Future Use Cases for Archived Data:**
- Training fine-tuned models on historical patterns
- Long-term trend analysis
- Compliance/audit requirements
- Re-processing with improved LLM later

#### 5.3.2 Task Prioritization

```python
class TaskPriority(Enum):
    CRITICAL = 1  # User-triggered, blocking
    HIGH = 2      # Real-time scoring
    NORMAL = 3    # Scheduled extraction
    LOW = 4       # Background cleanup
    BATCH = 5     # Non-urgent bulk operations

class PriorityQueue:
    """NATS streams with priority ordering."""

    QUEUES = {
        TaskPriority.CRITICAL: "tasks.critical",
        TaskPriority.HIGH: "tasks.high",
        TaskPriority.NORMAL: "tasks.normal",
        TaskPriority.LOW: "tasks.low",
        TaskPriority.BATCH: "tasks.batch",
    }
```

#### 5.5.4 User Task Limits (POST-MVP)

> ⏸️ **Deferred:** Не потрібно для single-user MVP. Імплементувати коли буде multi-tenant.

**Проблема:** Юзер може створити багато scheduled tasks → перевантаження

**Рішення: Tiered Limits (для майбутнього)**

| User Tier | Max Scheduled Tasks | Max Daily Runs | Max Tokens/Day |
|-----------|--------------------:|---------------:|--------------:|
| Free | 2 | 10 | 50K |
| Pro | 10 | 100 | 500K |
| Enterprise | Unlimited | Unlimited | Custom |

**Для MVP:** Немає лімітів, один користувач = admin з повним доступом.

### 5.4 Agent Testing Best Practices

**Проблема з поточним Test Endpoint:**
- Не використовує `output_type` (structured output)
- Не використовує hardcoded prompts
- Результат не репрезентує production

**Рекомендація: Unified Test Flow**

```python
class AgentTestService:
    """Test agent with production-like behavior."""

    async def test_agent(
        self,
        agent_id: UUID,
        test_messages: list[str],
        mode: Literal["quick", "full"] = "quick"
    ) -> AgentTestResult:
        agent = await self.get_agent(agent_id)

        if mode == "quick":
            # Simple text output for quick feedback
            result = await self._run_quick_test(agent, test_messages)
        else:
            # Full structured output like production
            result = await self._run_full_test(agent, test_messages)

        return AgentTestResult(
            success=result.success,
            output=result.output,
            tokens_used=result.tokens,
            latency_ms=result.latency,
            warnings=result.warnings,  # e.g., "Model returned markdown-wrapped JSON"
        )

    async def _run_full_test(self, agent, messages):
        """Mirror production KnowledgeOrchestrator flow."""
        # Use same prompts, output_type, retries as production
        orchestrator = KnowledgeOrchestrator(
            agent_config=agent,
            provider=agent.provider,
            language="uk"
        )
        return await orchestrator.extract_knowledge(messages)
```

---

## Частина 6: Рекомендації та Action Items

### 6.1 Immediate Actions (This Sprint)

| # | Action | Effort | Impact | Owner |
|---|--------|--------|--------|-------|
| 1 | Fix Test Endpoint to use structured output | 2h | HIGH | L1 |
| 2 | Add token counting to extraction runs | 2h | MEDIUM | L1 |
| 3 | Implement batched RAG query (single SQL) | 4h | HIGH | L1 |
| 4 | Add HNSW index to atoms table | 1h | MEDIUM | L1 |

### 6.2 Short-term (Next 2 Sprints)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 5 | Implement Smart Model Routing | 8h | HIGH |
| 6 | Add Redis caching for RAG context | 6h | HIGH |
| 7 | Create AgentTestService with full/quick modes | 4h | MEDIUM |
| 8 | Implement task priority queues in NATS | 4h | MEDIUM |

### 6.3 Medium-term (Next Quarter)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 9 | Multi-source ingestion (Slack adapter) | 2 weeks | HIGH |
| 10 | Progressive Enhancement pipeline | 1 week | HIGH |
| 11 | User tier limits for scheduled tasks | 1 week | MEDIUM |
| 12 | Semantic caching for duplicate batches | 1 week | MEDIUM |

### 6.4 Long-term Considerations

1. **Vector DB Migration:** При >1M vectors розглянути Pinecone/Qdrant
2. **Kubernetes Scaling:** Horizontal worker scaling з HPA
3. **Fine-tuned Models:** Domain-specific scoring model (LoRA)
4. **Feedback Loop:** Auto-adjust thresholds based on user feedback

---

## Частина 7: Моніторинг та Observability

### 7.1 Ключові Метрики

```python
class LLMMetrics:
    """Metrics to track for LLM pipeline health."""

    # Latency
    scoring_latency_p50: float      # Target: <500ms
    scoring_latency_p99: float      # Target: <2s
    extraction_latency_p50: float   # Target: <10s
    extraction_latency_p99: float   # Target: <30s

    # Quality
    extraction_retry_rate: float    # Target: <10%
    language_mismatch_rate: float   # Target: <5%
    empty_extraction_rate: float    # Target: <20%

    # Cost
    tokens_per_message: float       # Baseline tracking
    cost_per_extraction: float      # Budget monitoring

    # Throughput
    messages_scored_per_hour: int
    extractions_per_hour: int
    queue_depth: int                # Alert if >100
```

### 7.2 Alerting Rules

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| `extraction_latency_p99` | >30s | >60s | Check model load |
| `extraction_retry_rate` | >20% | >50% | Check model quality |
| `queue_depth` | >50 | >100 | Scale workers |
| `cost_per_day` | >80% budget | >100% budget | Pause non-critical |

---

## Висновки

Поточна архітектура LLM pipeline в Pulse Radar є **solid foundation** для MVP, але потребує оптимізації для:

1. **Cost Efficiency:** Smart routing + batching може знизити витрати на 60-80%
2. **Scalability:** HNSW indexes + partitioning для millions of vectors
3. **Quality:** Unified test flow + structured output consistency
4. **Observability:** Token tracking + alerting for budget control

Локальна RTX 4070Ti Super є **достатньою** для робочих навантажень до 10K messages/day при правильному routing (cheap models for scoring, capable models for extraction).

**Наступний крок:** Імплементувати Action Items 1-4 з секції 6.1.

---

## References

### Зовнішні джерела — LLM Orchestration

- [LLM Orchestration in 2025: Frameworks + Best Practices](https://orq.ai/blog/llm-orchestration)
- [LLM Cost Optimization: Complete Guide](https://ai.koombea.com/blog/llm-cost-optimization)
- [Batch Processing for LLM Cost Savings](https://www.prompts.ai/en/blog/batch-processing-for-llm-cost-savings)
- [How Task Scheduling Optimizes LLM Workflows](https://latitude-blog.ghost.io/blog/how-task-scheduling-optimizes-llm-workflows/)

### Зовнішні джерела — Models

- [Qwen3: Think Deeper, Act Faster](https://qwenlm.github.io/blog/qwen3/) — Qwen3 official blog
- [Gemini 3 Flash Introduction](https://blog.google/products/gemini/gemini-3-flash/) — Google blog
- [OpenAI o3 and o4-mini Introduction](https://openai.com/index/introducing-o3-and-o4-mini/)
- [Claude Haiku 4.5](https://www.anthropic.com/claude/haiku) — Anthropic
- [Best Open-Source LLMs 2026](https://www.bentoml.com/blog/navigating-the-world-of-open-source-large-language-models)

### Зовнішні джерела — Pydantic AI

- [Pydantic AI Output Documentation](https://ai.pydantic.dev/output/)
- [Pydantic AI Agents Documentation](https://ai.pydantic.dev/agents/)
- [Pydantic AI Tools Advanced](https://ai.pydantic.dev/tools-advanced/)

### Внутрішні документи

- [[llm-extraction-pipeline]] — Попереднє дослідження
- [[knowledge-pipeline-roadmap]] — Product roadmap
- [[ADR-003-ai-importance-scoring]] — AI Scoring рішення
- [[Ideal_Knowledge_Architecture]] — Semantic Architecture

---

---

## Частина 8: Testing Strategy — Golden Set з Claude Ground Truth

### 8.1 Підхід: Claude як Еталон

```
┌─────────────────────────────────────────────────────────────────┐
│              GOLDEN SET CREATION WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Select Real Messages                                   │
│  ────────────────────────────                                   │
│  • Export 50-100 real messages from production DB               │
│  • Stratified sample: різні автори, часи, довжини               │
│  • Include edge cases: emoji, суржик, технічний сленг           │
│                                                                  │
│  Step 2: Claude Annotation (Ground Truth)                       │
│  ─────────────────────────────────────────                      │
│  • Прогнати через Claude Sonnet/Opus                            │
│  • Отримати: score, classification, atoms, topics               │
│  • Human review: виправити очевидні помилки Claude              │
│  • Зберегти як JSON fixtures                                    │
│                                                                  │
│  Step 3: Define Tolerance Bands                                 │
│  ──────────────────────────────                                 │
│  • Score: ±0.15 (acceptable), ±0.25 (warning)                   │
│  • Classification: exact match required                         │
│  • Atoms: fuzzy title match (>0.8 similarity)                   │
│  • Topics: semantic match (embedding similarity >0.85)          │
│                                                                  │
│  Step 4: Automated Comparison                                   │
│  ─────────────────────────────                                  │
│  • Run local model on same messages                             │
│  • Compare with tolerance bands                                  │
│  • Generate quality report                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Golden Set Format

```python
# tests/fixtures/golden_set.json
{
  "version": "1.0",
  "created_by": "claude-sonnet-4",
  "created_at": "2026-01-09",
  "human_reviewed": true,

  "messages": [
    {
      "id": "msg_001",
      "content": "Знайшов критичний баг - при логіні з Google OAuth токен не оновлюється і через годину юзера викидає",
      "metadata": {
        "author": "dev_senior",
        "chat": "backend-team",
        "length_chars": 95
      },

      "ground_truth": {
        "importance_score": 0.92,
        "score_confidence": "high",  // high/medium/low
        "classification": "signal",

        "expected_atoms": [
          {
            "type": "problem",
            "title": "Google OAuth токен не оновлюється",
            "confidence": "high",
            "key_phrases": ["OAuth", "токен", "оновлюється"]
          }
        ],

        "expected_topics": ["Authentication", "Backend"],

        "notes": "Критичний баг з чітким описом симптому"
      },

      "tolerance": {
        "score_band": 0.15,      // ±0.15 = pass
        "score_warning": 0.25,   // ±0.25 = warning, >0.25 = fail
        "atom_title_similarity": 0.75,
        "must_have_atom_type": "problem"
      }
    },

    {
      "id": "msg_002",
      "content": "ок",
      "ground_truth": {
        "importance_score": 0.08,
        "score_confidence": "high",
        "classification": "noise",
        "expected_atoms": [],
        "expected_topics": []
      },
      "tolerance": {
        "score_band": 0.10,  // Noise should be very clear
        "must_be_below": 0.25
      }
    },

    {
      "id": "msg_003",
      "content": "може завтра подивлюсь на це питання",
      "ground_truth": {
        "importance_score": 0.35,
        "score_confidence": "medium",  // Borderline case
        "classification": "weak",
        "expected_atoms": [],
        "notes": "Можливий signal якщо контекст відомий"
      },
      "tolerance": {
        "score_band": 0.20,  // Wider tolerance for borderline
        "classification_alternatives": ["noise", "weak"]  // Both acceptable
      }
    }
  ],

  "extraction_batches": [
    {
      "id": "batch_001",
      "message_ids": ["msg_001", "msg_005", "msg_007"],
      "ground_truth": {
        "expected_topics_count": {"min": 1, "max": 3},
        "expected_atoms_count": {"min": 2, "max": 5},
        "must_have_topic": "Backend",
        "must_have_atom_type": "problem"
      }
    }
  ]
}
```

### 8.3 Tolerance Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│              TOLERANCE BANDS BY CONFIDENCE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HIGH CONFIDENCE (Claude was certain)                           │
│  ─────────────────────────────────────                          │
│  • Score tolerance: ±0.15                                       │
│  • Classification: exact match                                  │
│  • Atom type: exact match                                       │
│  • Examples: pure noise ("ок"), clear bugs, decisions           │
│                                                                  │
│  MEDIUM CONFIDENCE (borderline cases)                           │
│  ────────────────────────────────────                           │
│  • Score tolerance: ±0.25                                       │
│  • Classification: allow alternatives                           │
│  • Atom: fuzzy match on key phrases                             │
│  • Examples: "подивлюсь пізніше", implicit signals              │
│                                                                  │
│  LOW CONFIDENCE (subjective)                                    │
│  ──────────────────────────                                     │
│  • Score tolerance: ±0.35                                       │
│  • Classification: any non-noise acceptable                     │
│  • Atom: presence/absence only                                  │
│  • Examples: context-dependent, sarcasm, jargon                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Comparison Metrics

```python
class GoldenSetEvaluator:
    """Compare model output against Claude ground truth."""

    def evaluate_scoring(
        self,
        golden: GoldenMessage,
        actual_score: float
    ) -> ScoringResult:
        expected = golden.ground_truth.importance_score
        diff = abs(actual_score - expected)
        tolerance = golden.tolerance.score_band
        warning = golden.tolerance.score_warning

        if diff <= tolerance:
            return ScoringResult(status="pass", diff=diff)
        elif diff <= warning:
            return ScoringResult(status="warning", diff=diff)
        else:
            return ScoringResult(status="fail", diff=diff)

    def evaluate_classification(
        self,
        golden: GoldenMessage,
        actual_class: str
    ) -> ClassificationResult:
        expected = golden.ground_truth.classification
        alternatives = golden.tolerance.classification_alternatives or []

        if actual_class == expected:
            return ClassificationResult(status="exact_match")
        elif actual_class in alternatives:
            return ClassificationResult(status="acceptable_alternative")
        else:
            return ClassificationResult(status="fail", expected=expected, actual=actual_class)

    def evaluate_atoms(
        self,
        golden: GoldenMessage,
        actual_atoms: list[Atom]
    ) -> AtomResult:
        expected_atoms = golden.ground_truth.expected_atoms

        # Check must-have atom types
        if golden.tolerance.must_have_atom_type:
            has_required = any(
                a.atom_type == golden.tolerance.must_have_atom_type
                for a in actual_atoms
            )
            if not has_required:
                return AtomResult(status="fail", reason="missing_required_type")

        # Fuzzy match on titles
        matches = []
        for expected in expected_atoms:
            best_match = max(
                (self._title_similarity(expected.title, a.title) for a in actual_atoms),
                default=0
            )
            matches.append(best_match >= golden.tolerance.atom_title_similarity)

        match_rate = sum(matches) / len(matches) if matches else 1.0

        if match_rate >= 0.8:
            return AtomResult(status="pass", match_rate=match_rate)
        elif match_rate >= 0.5:
            return AtomResult(status="warning", match_rate=match_rate)
        else:
            return AtomResult(status="fail", match_rate=match_rate)

    def _title_similarity(self, a: str, b: str) -> float:
        """Fuzzy string similarity using key phrases."""
        # Simple: check if key words present
        a_words = set(a.lower().split())
        b_words = set(b.lower().split())

        if not a_words:
            return 0.0

        overlap = len(a_words & b_words)
        return overlap / len(a_words)
```

### 8.5 Quality Report

```
┌─────────────────────────────────────────────────────────────────┐
│              QUALITY REPORT: qwen3:14b                           │
│              Golden Set v1.0 (50 messages)                       │
│              Run: 2026-01-09 14:35                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SCORING                                                         │
│  ────────                                                        │
│  ✅ Pass:    42/50 (84%)                                        │
│  ⚠️ Warning:  5/50 (10%)                                        │
│  ❌ Fail:     3/50 (6%)                                         │
│                                                                  │
│  Avg deviation: 0.12 (target: <0.15)                            │
│  Max deviation: 0.31 (msg_023: expected 0.85, got 0.54)         │
│                                                                  │
│  CLASSIFICATION                                                  │
│  ──────────────                                                  │
│  ✅ Exact match:    45/50 (90%)                                 │
│  ⚠️ Alternative:     3/50 (6%)                                  │
│  ❌ Mismatch:        2/50 (4%)                                  │
│                                                                  │
│  Confusion matrix:                                               │
│              Predicted                                           │
│           noise  weak  signal                                    │
│  Actual  ┌─────┬─────┬──────┐                                   │
│   noise  │  14 │  1  │  0   │                                   │
│   weak   │   1 │  8  │  1   │                                   │
│   signal │   0 │  1  │  24  │                                   │
│          └─────┴─────┴──────┘                                   │
│                                                                  │
│  EXTRACTION (10 batch tests)                                    │
│  ───────────────────────────                                    │
│  Topics found:  ✅ 9/10 batches had expected topics             │
│  Atoms created: ✅ 23/28 expected atoms matched (82%)           │
│  Extra atoms:   ⚠️ 5 unexpected atoms (review needed)           │
│                                                                  │
│  VERDICT: ✅ ACCEPTABLE (threshold: 80% pass rate)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.6 Testing Tiers (Updated)

```
┌─────────────────────────────────────────────────────────────────┐
│              TESTING TIERS (with Golden Set)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🏃 QUICK (5 хв) — для кожної зміни prompt/model                │
│  ─────────────────────────────────────────────                  │
│  • 30 повідомлень з Golden Set                                  │
│  • Тільки scoring + classification                              │
│  • Pass threshold: 80%                                          │
│  • No embeddings, no extraction                                 │
│                                                                  │
│  🚶 MEDIUM (30 хв) — після successful quick test                │
│  ─────────────────────────────────────────────                  │
│  • 50 повідомлень (full Golden Set)                            │
│  • Scoring + Classification + Extraction                        │
│  • Pass threshold: 75% scoring, 70% extraction                  │
│  • Includes atom matching                                       │
│                                                                  │
│  🏋️ FULL (2-4 год) — перед release / major change              │
│  ─────────────────────────────────────────────                  │
│  • Golden Set + 500 random messages                             │
│  • Full pipeline з embeddings + dedup                          │
│  • Statistical analysis: variance, outliers                     │
│  • Human spot-check 20 random outputs                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.7 Golden Set Creation Process

```bash
# Step 1: Export sample from DB
just db-export-sample --count 100 --output tests/fixtures/raw_sample.json

# Step 2: Prepare for Claude annotation
# (I'll help annotate when you provide the messages)

# Step 3: Validate annotations
just validate-golden-set tests/fixtures/golden_set.json

# Step 4: Run tests
just test-llm-quick   # 5 min
just test-llm-medium  # 30 min
```

---

*Document version: 2.1*
*Last updated: 2026-01-09*
*Changes: Added Testing Strategy section with Golden Set approach, tolerance bands, Claude ground truth workflow*
