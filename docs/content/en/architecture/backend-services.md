# Backend Services Catalog

**Last Updated:** October 26, 2025
**Total Services:** 30
**Architecture Pattern:** Domain-Driven Service Layer with Dependency Injection

---

## Table of Contents

1. [Overview](#overview)
2. [Service Architecture Pattern](#service-architecture-pattern)
3. [CRUD Services](#crud-services)
4. [LLM Services](#llm-services)
5. [Analysis Services](#analysis-services)
6. [Vector Database Services](#vector-database-services)
7. [Knowledge Services](#knowledge-services)
8. [Infrastructure Services](#infrastructure-services)
9. [Service Dependencies](#service-dependencies)

---

## Overview

The backend implements 30 specialized services organized into 7 domain groups. Each service follows async/await patterns, uses dependency injection via FastAPI, and maintains single responsibility.

### Service Distribution by Domain

| Domain | Count | Purpose |
|--------|-------|---------|
| CRUD Services | 10 | Database operations for core entities |
| LLM Services | 4 | AI agent orchestration and LLM integration |
| Analysis Services | 3 | Message analysis and task proposal generation |
| Vector DB Services | 4 | Semantic search and embedding management |
| Knowledge Services | 2 | Knowledge extraction and versioning |
| Infrastructure Services | 4 | External integrations and system utilities |
| Utility Services | 3 | Schema generation, encryption, validation |

**Total:** 30 services across 7 domains

---

## Service Architecture Pattern

### Common Patterns

All services follow these design principles:

1. **Async-First:** All I/O operations use `async/await`
2. **Session-Based:** Database access via `AsyncSession` dependency injection
3. **Type-Safe:** Full type annotations with mypy strict compliance
4. **Single Responsibility:** Each service handles one domain concern
5. **Protocol-Based:** Services implement abstract protocols for testability

### Typical Service Structure

Services are injected into FastAPI endpoints via `Depends()`:

- Constructor accepts `AsyncSession` or configuration objects
- Public methods return Pydantic models for validation
- Error handling uses domain-specific exceptions
- Logging via Python's standard `logging` module

---

## CRUD Services

Basic create, read, update, delete operations for database entities.

### User & Identity

| Service | Responsibility | Key Operations |
|---------|---------------|----------------|
| `UserService` | User management and Telegram profile linking | `identify_or_create_user()`, `get_or_create_source()` |

### Communication

| Service | Responsibility | Key Operations |
|---------|---------------|----------------|
| `MessageCRUD` | Message CRUD with filtering and classification | Create, read, update, delete, list with filters |

### Knowledge Management

| Service | Responsibility | Key Operations |
|---------|---------------|----------------|
| `TopicCRUD` | Topic management with auto-icon selection | CRUD operations, `auto_select_icon()`, `auto_select_color()` |
| `AtomCRUD` | Atom operations and link management | CRUD, create links, manage topic-atom relationships |

### Tasks

| Service | Responsibility | Key Operations |
|---------|---------------|----------------|
| `TaskCRUD` | Legacy task system operations | CRUD for Task entities |

### LLM Configuration

| Service | Responsibility | Key Operations |
|---------|---------------|----------------|
| `ProviderCRUD` | LLM provider management with API key encryption | CRUD, validate provider, encrypt/decrypt API keys |
| `AgentCRUD` | Agent configuration management | CRUD for AgentConfig entities |
| `AssignmentCRUD` | Agent-task assignment tracking | CRUD for AgentTaskAssignment |

### Analysis Configuration

| Service | Responsibility | Key Operations |
|---------|---------------|----------------|
| `ProjectService` | Project configuration management | CRUD for ProjectConfig with versioning |
| `ProposalService` | Task proposal CRUD and review workflow | CRUD, review actions, batch operations |

**CRUD Services Total:** 10 services

---

## LLM Services

AI integration layer providing structured LLM interactions and agent orchestration.

| Service | Responsibility | Dependencies |
|---------|---------------|--------------|
| `AgentRegistry` | Runtime agent instance lifecycle management | None (singleton pattern) |
| `AgentTestService` | Test agent configurations with custom prompts | Pydantic-AI, CredentialEncryption |
| `OllamaService` | Ollama provider integration and model listing | HTTP client for Ollama API |
| `LLMProposalService` | Generate task proposals from message batches using LLM | AgentConfig, LLMProvider, RAGContextBuilder |

### AgentRegistry

Central registry for runtime agent instances. Manages agent creation, caching, and cleanup.

- **Pattern:** Singleton with in-memory storage
- **Operations:** `register_agent()`, `get_agent()`, `unregister_agent()`, `list_agents()`, `clear()`
- **Use Case:** Reuse configured agents across requests without recreation

### AgentTestService

Validates agent configurations by executing test prompts against LLM providers.

- **Pattern:** Stateless service with session dependency
- **Operations:** `test_agent(agent_id, test_prompt)` → TestAgentResponse
- **Use Case:** Configuration validation before production deployment

### OllamaService

Integration with Ollama local LLM provider.

- **Pattern:** Stateless HTTP client wrapper
- **Operations:** `list_models()`, `validate_connection()`
- **Use Case:** Ollama model discovery and health checking

### LLMProposalService

Core AI service for generating task proposals from message batches.

- **Pattern:** Stateful service with agent configuration
- **Operations:** `generate_proposals(messages, project_config)`, `generate_proposals_with_rag()`
- **Use Case:** Analysis run execution with RAG-enhanced context

**LLM Services Total:** 4 services

---

## Analysis Services

Message analysis, noise filtering, and task proposal generation orchestration.

| Service | Responsibility | Algorithm |
|---------|---------------|-----------|
| `AnalysisExecutor` | Analysis run lifecycle orchestration | 9-step execution pipeline |
| `ImportanceScorer` | Message noise filtering via heuristic scoring | 4-factor weighted algorithm |
| `TopicClassificationService` | Topic classification experiments with metrics | LLM-based classification with confusion matrix |

### AnalysisExecutor

Orchestrates the complete analysis run workflow from message fetching to proposal generation.

**Execution Pipeline (9 Steps):**

1. `start_run()` - Update status to "running"
2. `fetch_messages()` - Query messages in time window
3. `prefilter_messages()` - Filter by keywords, length, @mentions
4. `create_batches()` - Group messages into 5-10 minute windows
5. `process_batch()` - Call LLM, parse proposals
6. `save_proposals()` - Store proposals, update counts
7. `update_progress()` - Broadcast WebSocket progress events
8. `complete_run()` - Set status to "completed"
9. `fail_run()` - Handle errors, store error logs

**Features:**
- RAG support for context-aware proposals
- Real-time progress updates via WebSocket
- Configurable time windows and project contexts
- Batch size optimization (max 50 messages/batch)

### ImportanceScorer

Classifies messages as noise/weak_signal/signal using 4-factor heuristic algorithm.

**Scoring Factors (Weighted):**

| Factor | Weight | Scoring Rules |
|--------|--------|---------------|
| Content | 40% | Length, keywords, questions, URLs, code blocks |
| Author | 20% | Historical message quality score |
| Temporal | 20% | Message recency, topic activity |
| Topics | 20% | Topic importance (message count) |

**Classification Thresholds:**
- `noise`: score < 0.3 (e.g., "lol", "+1", single emoji)
- `weak_signal`: 0.3 ≤ score ≤ 0.7 (e.g., short questions)
- `signal`: score > 0.7 (e.g., bug reports, feature requests)

**Performance:** Processes 100 messages in 1-2 seconds (no LLM required)

### TopicClassificationService

Experiments with topic classification using different LLM models and configurations.

**Capabilities:**
- Multi-model testing (OpenAI, Ollama, custom)
- Accuracy metrics calculation
- Confusion matrix generation
- Classification results storage for analysis

**Use Case:** Model selection and prompt optimization before production deployment

**Analysis Services Total:** 3 services

---

## Vector Database Services

Semantic search and embedding management using pgvector and cosine similarity.

| Service | Responsibility | Vector Operations |
|---------|---------------|-------------------|
| `EmbeddingService` | Generate embeddings for messages and atoms | Batch embedding, single embedding |
| `SemanticSearchService` | Vector-based similarity search | Search messages/atoms, find duplicates |
| `RAGContextBuilder` | Assemble RAG context from similar messages/atoms | Context building for LLM prompts |
| `VectorQueryBuilder` | Construct pgvector SQL queries | Query generation helpers |

### EmbeddingService

Generates vector embeddings using configured LLM provider.

**Operations:**
- `generate_embedding(text)` → `list[float]` (single)
- `embed_messages_batch(messages)` → bulk database update
- `embed_atoms_batch(atoms)` → bulk database update

**Supported Providers:** OpenAI, Ollama (via text-embedding-ada-002 or local models)

### SemanticSearchService

Performs semantic similarity search using pgvector's `<=>` cosine distance operator.

**Search Methods:**

| Method | Purpose | Threshold |
|--------|---------|-----------|
| `search_messages(query)` | Text-based search | 0.7 (configurable) |
| `find_similar_messages(message_id)` | Similar message discovery | 0.7 (configurable) |
| `find_duplicates(message_id)` | Duplicate detection | 0.95 (high similarity) |
| `search_atoms(query)` | Atom semantic search | 0.7 (configurable) |
| `find_similar_atoms(atom_id)` | Related atom discovery | 0.7 (configurable) |

**Similarity Scoring:** `similarity = 1 - (cosine_distance / 2)` (maps to 0.0-1.0 range)

### RAGContextBuilder

Builds context for LLM prompts by retrieving semantically similar messages and atoms.

**Strategy:** Embed query → search top-k similar items → format as context string

**Use Case:** Enhanced task proposal generation with relevant historical context

### VectorQueryBuilder

Helper service for constructing pgvector SQL queries with proper type casting.

**Purpose:** Simplifies raw SQL construction for complex vector operations

**Vector Database Services Total:** 4 services

---

## Knowledge Services

LLM-driven knowledge extraction and version tracking for Topics and Atoms.

| Service | Responsibility | LLM Integration |
|---------|---------------|-----------------|
| `KnowledgeExtractionService` | Extract Topics and Atoms from message batches | Pydantic-AI with structured output |
| `VersioningService` | Version tracking and approval workflow | Database versioning |

### KnowledgeExtractionService

Analyzes message batches to extract structured knowledge using LLM.

**Extraction Pipeline:**

1. `extract_knowledge(messages)` → Structured LLM output
   - Topics: Discussion themes (2-4 words)
   - Atoms: Atomic knowledge units (problem/solution/insight/decision/question/pattern/requirement)
   - Confidence scores for auto-creation filtering

2. `save_topics(extracted_topics, confidence_threshold=0.7)`
   - Creates new topics or version snapshots for existing ones
   - Auto-selects icons and colors

3. `save_atoms(extracted_atoms, topic_map, confidence_threshold=0.7)`
   - Creates atoms with topic relationships
   - Version tracking for updates

4. `link_atoms(extracted_atoms, saved_atoms)`
   - Creates bidirectional atom links
   - Link types: solves/supports/contradicts/continues/refines/relates_to/depends_on

5. `update_messages(messages, topic_map, extracted_topics)`
   - Assigns messages to extracted topics

**LLM Configuration:**
- System prompt: Strict JSON schema enforcement
- Output retries: 5 attempts for validation
- Structured output: Pydantic models with type safety

**Confidence Filtering:**
- Default threshold: 0.7 (70% confidence)
- Low-confidence items skipped from auto-creation
- Manual review required for approval

### VersioningService

Tracks changes to Topics and Atoms with approval workflow.

**Version Lifecycle:**

1. `create_topic_version(topic_id, data, created_by)` → TopicVersion
2. `create_atom_version(atom_id, data, created_by)` → AtomVersion
3. `approve_version(version_id)` → Apply changes to parent entity
4. `get_version_history(entity_id)` → List of versions
5. `diff_versions(v1, v2)` → Change comparison

**Use Case:** Human review of LLM-generated knowledge before production integration

**Knowledge Services Total:** 2 services

---

## Infrastructure Services

External integrations and system-level utilities.

| Service | Responsibility | External System |
|---------|---------------|-----------------|
| `TelegramClientService` | Telegram Bot API integration | Telegram HTTP API |
| `TelegramIngestionService` | Batch message ingestion from Telegram chats | Telegram API + MessageIngestionJob |
| `WebSocketManager` | Real-time event broadcasting | WebSocket protocol |
| `CredentialEncryption` | Fernet encryption for API keys | Cryptography library |

### TelegramClientService

Telegram Bot API wrapper for outbound operations.

**Operations:**
- `send_message(chat_id, text)` - Send message to Telegram user
- `get_user_info(user_id)` - Fetch user profile
- Webhook management (set, delete, get info)

**Use Case:** Bot responses, user notifications, webhook configuration

### TelegramIngestionService

Batch ingestion of historical messages from Telegram chats.

**Process:**
1. Create `MessageIngestionJob` record
2. Fetch chat history via Telegram API
3. Store messages with source attribution
4. Update job progress in real-time
5. Broadcast WebSocket events for UI updates

**Use Case:** Initial data population, backfilling missing messages

### WebSocketManager

Centralized WebSocket connection and event broadcasting service.

**Event Types:**
- Analysis run progress
- Message ingestion updates
- Proposal creation notifications
- Score calculation events
- Knowledge extraction status

**Pattern:** Singleton with connection pool management

**Operations:**
- `connect(websocket)` - Register WebSocket connection
- `disconnect(websocket)` - Clean up connection
- `broadcast(channel, data)` - Send event to all connected clients
- `get_connection_count()` - Active connection monitoring

### CredentialEncryption

Fernet symmetric encryption for sensitive API keys.

**Operations:**
- `encrypt(plaintext)` → Base64-encoded ciphertext
- `decrypt(ciphertext)` → Original plaintext

**Security:**
- Key derivation from environment variable
- Database stores encrypted values only
- Decryption only in memory during API calls

**Infrastructure Services Total:** 4 services

---

## Utility Services

Cross-cutting concerns and helper functionality.

| Service | Responsibility |
|---------|---------------|
| `SchemaGenerator` | JSON schema generation from Pydantic models |
| `ProviderValidator` | LLM provider connection validation |

### SchemaGenerator

Generates JSON schemas from Pydantic models for TaskConfig response definitions.

**Use Case:** Dynamic task schema creation for structured LLM outputs

### ProviderValidator

Validates LLM provider connectivity and authentication.

**Validations:**
- Ollama: HTTP connection test, model listing
- OpenAI: API key verification, model access check

**Use Case:** Provider configuration validation before agent creation

**Utility Services Total:** 3 services (includes CredentialEncryption from Infrastructure)

---

## Service Dependencies

### Cross-Service Dependencies

**High-Level Dependency Graph:**

```
LLMProposalService
    ├─► AgentConfig (configuration)
    ├─► LLMProvider (provider settings)
    └─► RAGContextBuilder (optional context)
        ├─► EmbeddingService (query vectorization)
        └─► SemanticSearchService (similarity search)

AnalysisExecutor
    ├─► AgentTaskAssignment (agent selection)
    ├─► ProjectConfig (filtering rules)
    ├─► LLMProposalService (proposal generation)
    └─► WebSocketManager (progress broadcasting)

KnowledgeExtractionService
    ├─► AgentConfig (extraction configuration)
    ├─► LLMProvider (LLM access)
    ├─► VersioningService (change tracking)
    └─► TopicCRUD, AtomCRUD (entity persistence)

ImportanceScorer
    ├─► MessageCRUD (author history lookup)
    └─► TopicCRUD (topic activity metrics)
```

### Common Dependencies

All services depend on:

- **AsyncSession:** Database access via SQLAlchemy
- **Logging:** Python standard library logger
- **Pydantic:** Request/response validation

---

## Service Selection Guide

### When to Use Each Service

**Data Operations:**
- Need message CRUD? → `MessageCRUD`
- Need topic management? → `TopicCRUD`
- Need atom operations? → `AtomCRUD`

**AI Operations:**
- Need task proposals? → `LLMProposalService`
- Test agent config? → `AgentTestService`
- Extract knowledge? → `KnowledgeExtractionService`
- Filter noise? → `ImportanceScorer`

**Search Operations:**
- Text-based search? → `SemanticSearchService.search_messages()`
- Find duplicates? → `SemanticSearchService.find_duplicates()`
- Need embeddings? → `EmbeddingService`
- RAG context? → `RAGContextBuilder`

**Orchestration:**
- Run analysis? → `AnalysisExecutor`
- Experiment with models? → `TopicClassificationService`

**External Integrations:**
- Send Telegram message? → `TelegramClientService`
- Ingest chat history? → `TelegramIngestionService`
- Broadcast events? → `WebSocketManager`

---

## Service Performance Characteristics

### High-Performance Services

These services are optimized for speed and can handle high throughput:

- `MessageCRUD`: <50ms CRUD operations
- `ImportanceScorer`: 1-2 seconds for 100 messages
- `SemanticSearchService`: <200ms vector searches
- `WebSocketManager`: Real-time event delivery

### Resource-Intensive Services

These services require careful resource management:

- `LLMProposalService`: Depends on LLM provider latency
- `EmbeddingService`: Batch operations recommended (50+ items)
- `KnowledgeExtractionService`: LLM-dependent (5-30 seconds/batch)
- `AnalysisExecutor`: Long-running (minutes for full runs)

### Caching Strategies

- `AgentRegistry`: In-memory agent instance caching
- `SemanticSearchService`: Relies on database vector indexes
- `ProviderCRUD`: No caching (config changes require immediate effect)

---

## Related Documentation

- **Database Models:** See `database-models.md`
- **LLM Architecture:** See `llm-architecture.md`
- **Background Tasks:** See `background-tasks.md`
- **API Endpoints:** See backend/app/api/v1/ directory
- **Project Guidelines:** See CLAUDE.md

---

*This document catalogs all 30 backend services organized by domain. For implementation details, refer to service source code in `backend/app/services/`.*
