# Feature 3: Backend Architecture Documentation

## Goal

Document backend architecture: 25+ models with ER diagram, LLM hexagonal architecture, 30+ services catalog, background tasks system

## Audit Context

**Source:** `docs/audit-2025-10-24/KEY_FINDINGS.md`, `AUDIT_COMPARISON_TABLE.md`

**Critical Gaps:**
1. Database models (25+) not documented - no ER diagram
2. LLM hexagonal architecture completely hidden (major design achievement)
3. 30+ backend services not cataloged
4. Background task system (12+ jobs) vaguely documented

## Scope

### Files to Create/Update

1. **docs/content/en/architecture/models.md** - NEW (ER diagram + catalog)
2. **docs/content/uk/architecture/models.md** - NEW (synchronized)
3. **docs/content/en/architecture/llm-architecture.md** - NEW (hexagonal design)
4. **docs/content/uk/architecture/llm-architecture.md** - NEW (synchronized)
5. **docs/content/en/architecture/backend-services.md** - NEW (30+ services)
6. **docs/content/uk/architecture/backend-services.md** - NEW (synchronized)
7. **docs/content/en/architecture/background-tasks.md** - NEW (TaskIQ jobs)
8. **docs/content/uk/architecture/background-tasks.md** - NEW (synchronized)
9. **CLAUDE.md** - UPDATE (add backend overview)

### Content to Document

**Database Models (25+):**
- Message, Task, User, Source, Topic, Atom, TopicVersion, AtomVersion
- AgentConfig, AnalysisRun, TaskProposal, LLMProvider
- MessageIngestion, ProjectConfig, ClassificationExperiment
- AgentTaskAssignment, TaskConfig, TelegramProfile
- All relationships and foreign keys
- ER diagram (Mermaid or visual)

**LLM Hexagonal Architecture:**
- backend/app/llm/domain/ - Framework-agnostic protocols
- backend/app/llm/infrastructure/ - Pydantic AI adapters
- backend/app/llm/application/ - Business logic
- Ports & Adapters pattern
- Design principles

**Backend Services (30+):**
- CRUD: agent_crud, atom_crud, message_crud, topic_crud, user_service
- LLM: llm_proposal_service, knowledge_extraction_service, agent_service
- Analysis: analysis_service, importance_scorer, topic_classification_service
- Vector DB: embedding_service, semantic_search_service, rag_context_builder
- Infrastructure: telegram_client_service, websocket_manager, credential_encryption

**Background Tasks (12+):**
- Message: save_telegram_message, ingest_telegram_messages_task
- AI: execute_analysis_run, extract_knowledge_from_messages_task
- Embeddings: embed_messages_batch_task, embed_atoms_batch_task
- Scoring: score_message_task

## Tasks

### 1. Investigate Backend Structure
**Domain:** Backend Research
**Estimate:** 45 minutes
**Agents:** fastapi-backend-expert (parallel with task 2)

**Scope:**
- Map all models in backend/app/models/
- Extract LLM architecture from backend/app/llm/
- Catalog services in backend/app/services/
- Document background tasks in backend/app/tasks.py
- Identify relationships and dependencies

---

### 2. Investigate Database Schema
**Domain:** Database Research
**Estimate:** 30 minutes
**Agent:** fastapi-backend-expert (parallel with task 1)

**Scope:**
- Analyze SQLModel models for fields and types
- Extract foreign keys and relationships
- Identify indexes and constraints
- Prepare data for ER diagram
- Check migration files for additional info

---

### 3. Document Database Models (en)
**Domain:** Backend Documentation
**Estimate:** 60 minutes
**Agent:** documentation-expert

**Scope:**
- Create docs/content/en/architecture/models.md
- ER diagram (Mermaid or visual)
- Model catalog (25+ models with fields, types, relationships)
- Table structure
- Indexes and constraints

**Format:** Hybrid (diagram + tables), NO code

---

### 4. Document LLM Architecture (en)
**Domain:** Backend Documentation
**Estimate:** 50 minutes
**Agent:** fastapi-backend-expert

**Scope:**
- Create docs/content/en/architecture/llm-architecture.md
- Hexagonal architecture explanation
- Domain layer (protocols, models)
- Infrastructure layer (Pydantic AI adapters)
- Application layer (orchestration)
- Design principles and benefits

**Format:** Hybrid (architecture diagram + descriptions), NO code

---

### 5. Document Backend Services (en)
**Domain:** Backend Documentation
**Estimate:** 50 minutes
**Agent:** documentation-expert

**Scope:**
- Create docs/content/en/architecture/backend-services.md
- Services catalog (30+ services)
- Grouped by domain (CRUD, LLM, Analysis, Vector DB, Infrastructure)
- Service responsibilities
- Dependencies between services

**Format:** Tables + brief descriptions

---

### 6. Document Background Tasks (en)
**Domain:** Backend Documentation
**Estimate:** 40 minutes
**Agent:** fastapi-backend-expert

**Scope:**
- Create docs/content/en/architecture/background-tasks.md
- TaskIQ + NATS setup
- Task catalog (12+ jobs)
- Task flow diagram
- Error handling and retry logic

**Format:** Diagram + table

---

### 7. Update CLAUDE.md
**Domain:** Backend Documentation
**Estimate:** 20 minutes
**Agent:** documentation-expert

**Scope:**
- Add backend architecture overview section
- Reference new documentation files
- Summarize key backend components

---

### 8. Translate to Ukrainian (4 files)
**Domain:** Translation
**Estimate:** 90 minutes
**Agent:** documentation-expert

**Scope:**
- Translate all 4 new architecture docs to Ukrainian
- Full synchronization
- Consistent terminology

---

### 9. Final Validation
**Domain:** Architecture
**Estimate:** 25 minutes
**Agent:** architecture-guardian

**Scope:**
- Verify backend code alignment
- Check ER diagram accuracy
- Validate service catalog completeness
- EN/UK synchronization
- Production-readiness

---

## Execution Order

**Phase 1: Research (Parallel)**
- Task 1 & 2: Backend + Database investigation (parallel)

**Phase 2: Documentation (Sequential)**
- Task 3: Database models (en)
- Task 4: LLM architecture (en)
- Task 5: Backend services (en)
- Task 6: Background tasks (en)
- Task 7: Update CLAUDE.md

**Phase 3: Translation & Validation**
- Task 8: Ukrainian translation (4 files)
- Task 9: Final validation

## Total Estimate

12-16 hours (450 minutes core tasks)

## Dependencies

- Backend codebase: backend/app/
- Database models: backend/app/models/
- LLM architecture: backend/app/llm/
- Services: backend/app/services/
- Tasks: backend/app/tasks.py

## Success Criteria

1. All 25+ database models documented with ER diagram
2. LLM hexagonal architecture fully explained
3. All 30+ services cataloged
4. All 12+ background tasks documented
5. EN/UK versions synchronized
6. CLAUDE.md updated with backend overview
7. Production-ready documentation

## Format Requirements

- Hybrid: tables + diagrams (NO code examples)
- Concise, no fluff
- En/uk synchronized (full translation)
- For working professionals
