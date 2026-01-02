# Architecture

**Backend:** FastAPI → Service → Model (SQLModel) — Гексагональна (Ports & Adapters)
**Frontend:** React 18 + Zustand + TanStack Query + shadcn/ui
**Real-time:** Native WebSocket (не Socket.IO!)
**Message broker:** NATS JetStream + TaskIQ

```
Telegram → Webhook → FastAPI → PostgreSQL + pgvector
                         ↓
                    NATS JetStream
                         ↓
                    TaskIQ Worker (scoring, embedding, analysis)
                         ↓
                    WebSocket → React Dashboard
```

## Бізнес-логіка

### Message
- **Джерело:** Telegram webhook
- **Classification:** SIGNAL (важливе) / NOISE (шум)
- **Scoring:** importance_score (0-1) на основі 4 факторів
- **Storage:** embedding (1536 dims) для semantic search

### Topic
- Контейнер для організації Atoms
- Поля: `name`, `icon`, `color`, `keywords`
- M2M з Atoms та Messages

### Atom (ядро системи)
**Типи:** TASK, IDEA, QUESTION, DECISION, INSIGHT

**Статуси:**
```
DRAFT → PENDING_REVIEW → APPROVED / REJECTED
```

### AnalysisRun (AI pipeline)
**7 станів:**
```
PENDING → QUEUED → RUNNING → COMPLETED / FAILED / CANCELLED / TIMEOUT
```

### LLMProvider
- Типи: `ollama`, `openai`
- Статуси валідації: `pending → validating → connected / error`
- API keys encrypted (Fernet)

### Key Enums
```python
# Message
AnalysisStatus: pending, analyzed, spam, noise
NoiseClassification: signal, noise, spam, low_quality, high_quality

# Workflow
ProposalStatus: pending, approved, rejected, merged
ValidationStatus: pending, validating, connected, error

# Automation
RuleAction: approve, reject, escalate, notify
```

## LLM Pipeline (Pydantic AI)

**3 агенти:**
1. **Classification** — категорія + пріоритет повідомлення
2. **Extraction** — витяг сутностей (projects, components, tags)
3. **Analysis** — структуровані примітки

**RAG Context:**
```
Query Embedding → pgvector search →
├─ similar_proposals (past approved)
├─ relevant_atoms (knowledge base)
└─ related_messages (history)
→ Inject into LLM prompt
```

**TaskIQ Flow:**
```
save_telegram_message → score_message_task → extract_knowledge
                                           ↓
                        embed_messages_batch + embed_atoms_batch
```
Threshold: 10+ unprocessed messages → auto-trigger extraction

## WebSocket Topics

| Topic | Events |
|-------|--------|
| messages | message.updated, ingestion.started/progress/completed |
| knowledge | extraction_started/completed, topic/atom_created |
| noise_filtering | message_scored |
| monitoring | task_started/completed/failed |
| metrics | metrics:update |

**Cross-process:** Worker → NATS → API → Browser

## Services (40 сервісів)

**CRUD Layer:**
- BaseCRUD[T], AgentCRUD, ProviderCRUD, AtomCRUD, TopicCRUD

**Business Logic:**
- KnowledgeOrchestrator — LLM extraction
- RuleEngineService — automation rules (8 operators)
- VersioningService — entity snapshots, diffs

**AI/Search:**
- EmbeddingService — OpenAI/Ollama embeddings
- SemanticSearchService — pgvector cosine similarity
- RAGContextBuilder — context для LLM prompts

**Infrastructure:**
- WebSocketManager — real-time pub/sub + NATS relay
- CredentialEncryption — Fernet для API keys
