# Tasks: LLM Agent Management System

**Input**: Design documents from `/home/maks/projects/task-tracker/specs/001-pydanticai/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/app/` for main code, `backend/core/` for shared logic, `backend/tests/` for tests
- **Frontend**: `frontend/src/components/` for UI, `frontend/src/services/` for API clients

---

## Phase 3.1: Setup

- [x] **T001** Generate Alembic migration from SQLModel models
  - PREREQUISITE: SQLModel models must be created first (T026-T029)
  - Run `just alembic-auto -m "create agent management tables"` AFTER models are defined
  - Alembic will auto-detect tables: `llm_providers`, `agent_configs`, `task_configs`, `agent_task_assignments`
  - Review generated migration for indexes, constraints, foreign keys
  - **NOTE**: This task executes AFTER T026-T029, not before

- [x] **T002** [P] Add cryptography dependency to pyproject.toml
  - File: `pyproject.toml`
  - Add `cryptography = "^41.0.0"` for Fernet encryption
  - PydanticAI already installed - skip
  - Run `uv sync`

- [x] **T003** [P] Configure environment variable for encryption key
  - File: `.env.example`
  - Add `ENCRYPTION_KEY=` with documentation
  - Generate key in README with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Parallel - Different Files)

- [x] **T005** [P] Contract test POST /api/providers in backend/tests/contract/test_providers_post.py
  - Test provider creation with valid Ollama config
  - Test provider creation with valid OpenAI config
  - Test validation error for missing required fields
  - Test 409 conflict for duplicate provider name
  - Assert 201 response with validation_status="validating"

- [x] **T006** [P] Contract test GET /api/providers in backend/tests/contract/test_providers_get.py
  - Test list all providers
  - Test get provider by ID
  - Test 404 for non-existent provider

- [x] **T007** [P] Contract test PUT /api/providers/{id} in backend/tests/contract/test_providers_put.py
  - Test update provider configuration
  - Test triggers async re-validation
  - Test 404 for non-existent provider

- [x] **T008** [P] Contract test DELETE /api/providers/{id} in backend/tests/contract/test_providers_delete.py
  - Test soft delete when agents reference provider
  - Test 204 response

- [x] **T009** [P] Contract test POST /api/agents in backend/tests/contract/test_agents_post.py
  - Test agent creation with valid config
  - Test validation error for missing system_prompt
  - Test 409 conflict for duplicate agent name
  - Test 404 when provider_id doesn't exist

- [x] **T010** [P] Contract test GET /api/agents in backend/tests/contract/test_agents_get.py
  - Test list all agents with pagination
  - Test get agent by ID with provider details
  - Test 404 for non-existent agent

- [x] **T011** [P] Contract test PUT /api/agents/{id} in backend/tests/contract/test_agents_put.py
  - Test update agent configuration
  - Test doesn't disrupt running instances (per FR-011)
  - Test 404 for non-existent agent

- [x] **T012** [P] Contract test DELETE /api/agents/{id} in backend/tests/contract/test_agents_delete.py
  - Test hard delete allowed (per FR-032)
  - Test 204 response
  - Test running instances continue independently

- [x] **T013** [P] Contract test POST /api/agents/{id}/tasks in backend/tests/contract/test_agent_tasks_post.py
  - Test assign task to agent
  - Test 409 conflict for duplicate assignment
  - Test 404 when agent or task doesn't exist

- [x] **T014** [P] Contract test GET /api/agents/{id}/tasks in backend/tests/contract/test_agent_tasks_get.py
  - Test list assigned tasks for agent
  - Test returns empty array for agent with no tasks

- [x] **T015** [P] Contract test POST /api/tasks in backend/tests/contract/test_tasks_post.py
  - Test task creation with valid Pydantic schema
  - Test schema validation (FR-029)
  - Test 400 error for invalid JSON Schema
  - Test 409 conflict for duplicate task name

- [x] **T016** [P] Contract test GET /api/tasks in backend/tests/contract/test_tasks_get.py
  - Test list all tasks
  - Test get task by ID with assigned agents
  - Test 404 for non-existent task

### Integration Tests (Parallel - Different Files)

- [ ] **T017** [P] Integration test provider validation workflow in backend/tests/integration/test_provider_validation.py
  - Test async validation task triggered on create
  - Test WebSocket notification sent on completion
  - Test validation_status transitions: pending → validating → connected/error
  - Mock Ollama/OpenAI endpoints

- [ ] **T018** [P] Integration test agent-task assignment workflow in backend/tests/integration/test_agent_task_workflow.py
  - Test agent instance created on task assignment
  - Test registry prevents duplicate instances
  - Test unassignment doesn't affect running instances

- [ ] **T019** [P] Integration test Pydantic schema generation in backend/tests/integration/test_schema_generation.py
  - Test runtime Pydantic model generation from JSON Schema
  - Test validation with generated model
  - Test invalid schema raises error

- [ ] **T020** [P] Integration test encryption/decryption in backend/tests/integration/test_credential_encryption.py
  - Test Fernet encryption of API keys
  - Test decryption retrieves original value
  - Test key rotation scenario

- [ ] **T021** [P] Integration test agent registry in backend/tests/integration/test_agent_registry.py
  - Test get_or_create pattern
  - Test weak references allow garbage collection
  - Test concurrent access thread-safety

- [ ] **T022** [P] Integration test WebSocket notifications in backend/tests/integration/test_websocket_notifications.py
  - Test topic-based subscriptions (agents, tasks, providers)
  - Test broadcast on state changes
  - Test multiple clients receive same message

- [ ] **T023** [P] Integration test quickstart Scenario 1 in backend/tests/integration/test_quickstart_scenario1.py
  - Full workflow: Create Ollama provider → Async validation → WebSocket notification
  - Assert validation_status="connected" or "error" within 5 seconds

- [ ] **T024** [P] Integration test quickstart Scenario 4 in backend/tests/integration/test_quickstart_scenario4.py
  - Full workflow: Create agent → Create task → Assign task → Agent instance created
  - Assert cannot assign same task twice (409)

- [ ] **T025** [P] Integration test quickstart Scenario 6 in backend/tests/integration/test_quickstart_scenario6.py
  - Full workflow: Create agent with tasks → Delete agent → Running instances continue
  - Mock running task execution

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Backend Models (Parallel - Different Files)

- [x] **T026** [P] Implement LLMProvider model in backend/app/models/llm_provider.py
  - SQLModel with all fields from data-model.md
  - ENUM for type (ollama, openai)
  - ENUM for validation_status
  - Validation: type-specific required fields (base_url for ollama, api_key for openai)

- [x] **T027** [P] Implement AgentConfig model in backend/app/models/agent_config.py
  - SQLModel with all fields from data-model.md
  - Foreign key to LLMProvider
  - Validation: system_prompt required, name unique

- [x] **T028** [P] Implement TaskConfig model in backend/app/models/task_config.py
  - SQLModel with all fields from data-model.md
  - JSONB fields for request_schema and response_schema
  - Validation: response_schema required, name unique

- [x] **T029** [P] Implement AgentTaskAssignment model in backend/app/models/agent_task_assignment.py
  - SQLModel with all fields from data-model.md
  - Foreign keys to AgentConfig and TaskConfig
  - Composite unique constraint on (agent_id, task_id)

### Backend Services (Sequential - Shared Dependencies)

- [x] **T030** Implement AgentRegistry service in backend/app/services/agent_registry.py
  - Singleton pattern with weak references
  - `get_or_create(agent_config, task_config)` method
  - Async lock for thread-safety
  - Garbage collection for inactive instances
  - Uses PydanticAI Agent class

- [x] **T031** Implement ProviderValidator service in backend/app/services/provider_validator.py
  - TaskIQ task for async validation
  - Ollama validation: HTTP request to base_url/api/tags
  - OpenAI validation: HTTP request with api_key
  - Update validation_status in database
  - Broadcast WebSocket notification on completion

- [x] **T032** Implement PydanticSchemaGenerator service in backend/app/services/pydantic_schema_gen.py
  - `generate_model_from_json_schema(schema_dict)` method
  - Uses `create_model()` from Pydantic
  - Validates JSON Schema before generation
  - Caches compiled models by schema hash

- [x] **T033** Implement CredentialEncryption service in backend/app/services/credential_encryption.py
  - `encrypt(plaintext: str) -> bytes` using Fernet
  - `decrypt(ciphertext: bytes) -> str` using Fernet
  - Load encryption key from environment variable
  - Raise error if ENCRYPTION_KEY not set

### Backend API Routers (Sequential - Same Router Files)

- [x] **T034** Implement POST /api/providers in backend/app/routers/providers.py
  - Validate provider data with Pydantic
  - Encrypt api_key if provided
  - Save to database with validation_status="pending"
  - Trigger ProviderValidator task
  - Return 201 with provider data

- [x] **T035** Implement GET /api/providers and GET /api/providers/{id} in backend/app/routers/providers.py
  - List all providers (no decryption of api_key in response)
  - Get by ID with validation details
  - Return 404 if not found

- [x] **T036** Implement PUT /api/providers/{id} and DELETE /api/providers/{id} in backend/app/routers/providers.py
  - Update: re-encrypt api_key if changed, trigger re-validation
  - Delete: soft delete (set is_active=false) if agents reference it
  - Return appropriate status codes

- [x] **T037** Implement POST /api/agents in backend/app/routers/agents.py
  - Validate agent data with Pydantic
  - Check provider_id exists and is active
  - Save to database
  - Return 201 with agent data

- [x] **T038** Implement GET /api/agents and GET /api/agents/{id} in backend/app/routers/agents.py
  - List with pagination (limit, offset)
  - Get by ID with provider details and assigned tasks
  - Return 404 if not found

- [x] **T039** Implement PUT /api/agents/{id} and DELETE /api/agents/{id} in backend/app/routers/agents.py
  - Update: modify config (doesn't affect running instances per FR-011)
  - Delete: hard delete allowed (running instances continue per FR-032)
  - Return appropriate status codes

- [x] **T040** Implement POST /api/agents/{id}/tasks and GET /api/agents/{id}/tasks in backend/app/routers/agents.py
  - Assign: create AgentTaskAssignment, check for duplicates (409)
  - List: return tasks assigned to agent
  - Return 404 if agent or task not found

- [x] **T041** Implement DELETE /api/agents/{id}/tasks/{task_id} in backend/app/routers/agents.py
  - Remove assignment
  - Return 204 on success, 404 if not found

- [x] **T042** Implement POST /api/tasks in backend/app/routers/tasks.py
  - Validate task data with Pydantic
  - Validate response_schema is valid JSON Schema (FR-029)
  - Save to database
  - Return 201 with task data

- [x] **T043** Implement GET /api/tasks and GET /api/tasks/{id} in backend/app/routers/tasks.py
  - List all tasks
  - Get by ID with assigned agents
  - Return 404 if not found

- [x] **T044** Implement PUT /api/tasks/{id} and DELETE /api/tasks/{id} in backend/app/routers/tasks.py
  - Update: modify schema (running instances use assignment-time schema)
  - Delete: prevent if active assignments exist
  - Return appropriate status codes

### Backend WebSocket Integration

- [x] **T045** Implement WebSocket manager in backend/app/services/websocket_manager.py
  - Topic-based subscriptions (agents, tasks, providers)
  - `broadcast(topic, data)` method
  - Connection pool management
  - Integrate with FastAPI WebSocket endpoint

- [x] **T046** Add WebSocket endpoint in backend/app/main.py
  - `/ws` endpoint
  - Subscribe to topics via query param or message
  - Handle connection lifecycle

---

## Phase 3.4: Frontend Implementation

### Frontend Types (Parallel - Different Files)

- [x] **T047** [P] Create Agent TypeScript types in frontend/src/types/agent.ts
  - AgentConfig interface matching backend schema
  - AgentConfigCreate, AgentConfigUpdate, AgentConfigDetail types
  - Export all types

- [x] **T048** [P] Create Task TypeScript types in frontend/src/types/task.ts
  - TaskConfig interface matching backend schema
  - TaskConfigCreate, TaskConfigUpdate, TaskConfigDetail types
  - Export all types

- [x] **T049** [P] Create Provider TypeScript types in frontend/src/types/provider.ts
  - LLMProvider interface matching backend schema
  - LLMProviderCreate, LLMProviderUpdate types
  - ValidationStatus enum
  - Export all types

### Frontend API Services (Parallel - Different Files)

- [x] **T050** [P] Implement Agent API service in frontend/src/services/agentService.ts
  - `listAgents()`, `getAgent(id)`, `createAgent(data)`, `updateAgent(id, data)`, `deleteAgent(id)`
  - `getAgentTasks(id)`, `assignTask(agentId, taskId)`, `unassignTask(agentId, taskId)`
  - Use fetch API with proper error handling

- [x] **T051** [P] Implement Task API service in frontend/src/services/taskService.ts
  - `listTasks()`, `getTask(id)`, `createTask(data)`, `updateTask(id, data)`, `deleteTask(id)`
  - Use fetch API with proper error handling

- [x] **T052** [P] Implement Provider API service in frontend/src/services/providerService.ts
  - `listProviders()`, `getProvider(id)`, `createProvider(data)`, `updateProvider(id, data)`, `deleteProvider(id)`
  - Use fetch API with proper error handling

### Frontend Components (Parallel - Different Files)

- [x] **T053** [P] Create AgentList component in frontend/src/pages/AgentsPage/components/AgentList.tsx
  - Display agents in card/table layout
  - Show name, description, model, provider
  - Edit and Delete buttons per agent
  - "Add Agent" button

- [x] **T054** [P] Create AgentForm component in frontend/src/pages/AgentsPage/components/AgentForm.tsx
  - Form fields: name, description, provider (dropdown), system_prompt (textarea), user_prompt, model_name
  - Validation: required fields, name uniqueness
  - Submit to agentService.createAgent or updateAgent

- [x] **T055** [P] Create AgentCard component in frontend/src/pages/AgentsPage/components/AgentCard.tsx
  - Display single agent details
  - "Manage Tasks" button
  - Edit and Delete actions
  - Provider validation status indicator

- [x] **T056** [P] Create TaskAssignment component in frontend/src/pages/AgentsPage/components/TaskAssignment.tsx
  - Modal/panel for managing agent's tasks
  - List assigned tasks
  - Dropdown to select and assign new tasks
  - Unassign button per task

- [x] **T057** [P] Create TaskList component in frontend/src/pages/AgentsPage/components/TaskList.tsx
  - Display tasks in card/table layout
  - Show name, description, schema preview
  - Edit and Delete buttons per task
  - "Add Task" button

- [x] **T058** [P] Create TaskForm component in frontend/src/pages/AgentsPage/components/TaskForm.tsx
  - Form fields: name, description
  - SchemaEditor for request_schema and response_schema
  - Validation: required response_schema, valid JSON Schema
  - Submit to taskService.createTask or updateTask

- [x] **T059** [P] Create SchemaEditor component in frontend/src/pages/AgentsPage/components/SchemaEditor.tsx
  - Card-based UI for schema definition (no code editor)
  - Select inputs for common schema properties (type, enum values)
  - Dynamic field addition for properties
  - JSON Schema validation on form submit
  - Display validation errors in card format
  - Preview generated schema as formatted JSON (read-only display)

- [x] **T060** [P] Create ProviderList component in frontend/src/pages/AgentsPage/components/ProviderList.tsx
  - Display providers in card/table layout
  - Show name, type (Ollama/OpenAI), validation status
  - Edit and Delete buttons per provider
  - "Add Provider" button

- [x] **T061** [P] Create ProviderForm component in frontend/src/pages/AgentsPage/components/ProviderForm.tsx
  - Form fields: name, type (radio/dropdown), base_url (conditional), api_key (password, conditional)
  - Conditional rendering: base_url for Ollama, api_key for OpenAI
  - Submit to providerService.createProvider or updateProvider

- [x] **T062** [P] Create ValidationStatus component in frontend/src/pages/AgentsPage/components/ValidationStatus.tsx
  - Display validation status badge (pending, validating, connected, error)
  - Show validation error message if status=error
  - Show validated_at timestamp
  - Real-time updates via WebSocket

### Frontend WebSocket Integration

- [ ] **T063** Implement WebSocket service in frontend/src/services/websocketService.ts
  - Connect to /ws endpoint
  - Subscribe to topics (agents, tasks, providers)
  - Event handlers for state updates
  - Auto-reconnect on disconnect

- [ ] **T064** Integrate WebSocket in Agents tab in frontend/src/components/Agents/AgentList.tsx
  - Subscribe to "agents" topic on mount
  - Update agent list on "created", "updated", "deleted" events
  - Handle reconnection gracefully

- [ ] **T065** Integrate WebSocket in Providers tab in frontend/src/components/Providers/ProviderList.tsx
  - Subscribe to "providers" topic on mount
  - Update validation status on "validation_update" events
  - Real-time status badge updates

### Frontend Routing & Layout

- [x] **T066** Add Agents tab to Dashboard navigation in frontend/src/app/routes.tsx and AppSidebar
  - New tab: "🤖 Agents"
  - Route to Agents component
  - Tab order after Tasks or Settings

- [x] **T067** Create Agents main component in frontend/src/pages/AgentsPage/index.tsx
  - Sub-tabs: Agents, Tasks, Providers
  - Render AgentList, TaskList, ProviderList based on active sub-tab
  - Responsive layout matching existing dashboard style

---

## Phase 3.5: Polish

- [ ] **T068** [P] Write unit tests for CredentialEncryption in backend/tests/unit/test_credential_encryption.py
  - Test encrypt/decrypt roundtrip
  - Test handles invalid ciphertext
  - Test raises error if ENCRYPTION_KEY not set

- [ ] **T069** [P] Write unit tests for PydanticSchemaGenerator in backend/tests/unit/test_pydantic_schema_gen.py
  - Test valid JSON Schema generates Pydantic model
  - Test invalid schema raises ValidationError
  - Test model caching works

- [ ] **T070** [P] Write unit tests for AgentRegistry in backend/tests/unit/test_agent_registry.py
  - Test singleton pattern
  - Test weak references
  - Test concurrent access

- [ ] **T071** [P] Write component tests for AgentForm in frontend/tests/components/Agents/AgentForm.test.tsx
  - Test form validation
  - Test submit calls agentService
  - Test error handling

- [ ] **T072** [P] Write component tests for SchemaEditor in frontend/tests/components/Tasks/SchemaEditor.test.tsx
  - Test card-based schema builder UI
  - Test dynamic field addition
  - Test schema validation on submit
  - Test error display in card format

- [ ] **T073** Run performance validation for API endpoints
  - Measure p95 latency for GET /api/agents (target <200ms)
  - Measure p95 latency for POST /api/agents (target <200ms)
  - Measure WebSocket notification latency (target <100ms)
  - Document results in performance-results.md

- [ ] **T074** Update backend/CLAUDE.md with agent management documentation
  - Add section for new models, services, routers
  - Document AgentRegistry pattern
  - Document async provider validation
  - Update API endpoints list

- [ ] **T075** Update frontend/CLAUDE.md with Agents tab documentation
  - Add section for Agents tab structure
  - Document card-based schema editor (no Monaco)
  - Document WebSocket subscriptions
  - Update component list

- [ ] **T076** Run manual testing from quickstart.md
  - Execute all 9 scenarios
  - Mark ✅ or ❌ for each scenario
  - Document any failures for fixing

- [ ] **T077** Run linting and formatting
  - Backend: `just lint` and `just fmt`
  - Frontend: `npm run lint` (if configured)
  - Fix any violations

- [ ] **T078** Apply database migration and seed test data
  - PREREQUISITE: T001 migration must be generated first
  - Run `just alembic-up`
  - Insert sample Ollama provider for development
  - Test migration rollback works

---

## Dependencies

```
Setup (T002-T003) can run in parallel, before everything
  NOTE: T001 (migration) runs AFTER models (T026-T029) - Alembic autogenerate

Tests (T005-T025) before implementation
  Contract tests (T005-T016) can run in parallel
  Integration tests (T017-T025) can run in parallel

Backend Models (T026-T029) can run in parallel, before Services
  THEN T001 (Alembic migration autogenerate)

Backend Services (T030-T033) sequential, after Models + T001

Backend Routers (T034-T046) sequential, after Services

Frontend Types (T047-T049) can run in parallel, before Services

Frontend Services (T050-T052) can run in parallel, before Components

Frontend Components (T053-T062) can run in parallel, after Services

WebSocket (T063-T065) after backend WebSocket manager (T045)

Routing (T066-T067) after all Components

Polish (T068-T078) after all implementation
```

## Parallel Execution Examples

### Launch Contract Tests Together (T005-T016)
```bash
# 12 tasks in parallel - all different files
pytest backend/tests/contract/test_providers_post.py & \
pytest backend/tests/contract/test_providers_get.py & \
pytest backend/tests/contract/test_providers_put.py & \
pytest backend/tests/contract/test_providers_delete.py & \
pytest backend/tests/contract/test_agents_post.py & \
pytest backend/tests/contract/test_agents_get.py & \
pytest backend/tests/contract/test_agents_put.py & \
pytest backend/tests/contract/test_agents_delete.py & \
pytest backend/tests/contract/test_agent_tasks_post.py & \
pytest backend/tests/contract/test_agent_tasks_get.py & \
pytest backend/tests/contract/test_tasks_post.py & \
pytest backend/tests/contract/test_tasks_get.py
```

### Launch Integration Tests Together (T017-T025)
```bash
# 9 tasks in parallel - all different files
pytest backend/tests/integration/test_provider_validation.py & \
pytest backend/tests/integration/test_agent_task_workflow.py & \
pytest backend/tests/integration/test_schema_generation.py & \
pytest backend/tests/integration/test_credential_encryption.py & \
pytest backend/tests/integration/test_agent_registry.py & \
pytest backend/tests/integration/test_websocket_notifications.py & \
pytest backend/tests/integration/test_quickstart_scenario1.py & \
pytest backend/tests/integration/test_quickstart_scenario4.py & \
pytest backend/tests/integration/test_quickstart_scenario6.py
```

### Launch Backend Models Together (T026-T029)
```bash
# 4 tasks in parallel - all different files
# Implement all models before running tests
```

### Launch Frontend Components Together (T053-T062)
```bash
# 10 tasks in parallel - all different files
# Implement all components before integration
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD)
- Commit after each task or logical group
- Constitutional compliance: TDD mandatory (principle III)
- Performance targets: <200ms p95 API, <100ms WebSocket (principle V)
- All async operations non-blocking (principle II)

---

**Total Tasks**: 76 (reduced from 78: removed T003 Monaco, merged T004→T003)
**Parallel Opportunities**: 40 tasks can run in parallel (T002-T003, T005-T016, T017-T025, T026-T029, T047-T062, T068-T072)
**Estimated Completion**: 2-3 days with parallel execution, 5-7 days sequential

**Next Steps**: Execute tasks in order, mark completed, run `/clarify` if ambiguities arise during implementation.
