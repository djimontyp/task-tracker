
# Implementation Plan: LLM Agent Management System

**Branch**: `001-pydanticai` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/maks/projects/task-tracker/specs/001-pydanticai/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Build a comprehensive LLM Agent Management System with frontend UI and backend API for managing PydanticAI agents, task configurations, and LLM providers (Ollama, OpenAI). The system enables administrators to create agent configurations with prompts and models, define tasks with Pydantic schemas for structured I/O, and assign multiple tasks to agents. Each task assignment creates independent agent instances. Real-time WebSocket updates for agent and provider status. Async provider validation, encrypted credentials storage, and graceful handling of agent deletion without disrupting running tasks.

## Technical Context
**Language/Version**: Python 3.13+ (backend), TypeScript/React 18.3.1 (frontend)
**Primary Dependencies**: FastAPI, PydanticAI, SQLModel, async SQLAlchemy, TaskIQ, NATS, React, WebSocket (socket.io)
**Storage**: PostgreSQL (agent configs, task configs, provider configs), In-memory registry (agent instances)
**Testing**: pytest-asyncio, pytest-pydantic, React Testing Library
**Target Platform**: Docker containers (Linux), Web browsers (dashboard)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <200ms p95 API responses, <100ms WebSocket updates, async provider validation
**Constraints**: Encrypted credentials, no blocking operations in API handlers, independent agent instances per task
**Scale/Scope**: Multiple agents with multiple tasks each, concurrent task execution, real-time UI updates

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Microservices Architecture ✅ PASS
- Agent management APIs will use FastAPI backend (existing service)
- Frontend dashboard extends existing React app
- PostgreSQL for persistence (existing service)
- WebSocket for real-time updates (existing pattern)
- No new services required; extends existing architecture

### II. Event-Driven Processing ✅ PASS
- Provider validation runs asynchronously (background tasks)
- Agent instance management non-blocking
- Real-time status updates via WebSocket
- No blocking operations in API handlers

### III. Test-First Development (NON-NEGOTIABLE) ⚠️ MODIFIED
- Contract tests required for all new API endpoints before implementation
- Integration tests for agent-task assignment workflows
- pytest-asyncio for async agent instantiation logic
- Pydantic schema validation tests

**Project Exception**: TDD cycle modified per project decision (2025-10-04). Contract test structure created for API validation, but strict test-fail-before-implement cycle not enforced. Integration tests (T017-T025) skipped per user request. Tests serve as structural contracts rather than pre-implementation validation.

### IV. Type Safety & Async First ✅ PASS
- All API endpoints use Pydantic models (AgentConfig, TaskConfig, ProviderConfig)
- Type hints for all public APIs
- Async SQLAlchemy for database operations
- PydanticAI integration maintains type safety for schemas

### V. Real-Time Capabilities ✅ PASS
- WebSocket broadcasts for agent status changes
- Provider validation status updates
- Task assignment notifications
- Frontend handles reconnection gracefully

### VI. Docker-First Deployment ✅ PASS
- Extends existing docker-compose setup
- No new containers required
- Environment variables for provider credentials
- Development mode with live reload supported

### VII. API-First Design ✅ PASS
- All agent/task/provider management via REST APIs
- OpenAPI documentation for new endpoints
- Frontend and future integrations consume same API

**Result**: ⚠️ **1 EXCEPTION APPROVED** - Feature aligns with constitutional principles except Principle III (Test-First Development) which has approved project exception documented above

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
backend/
├── app/
│   ├── models/
│   │   ├── agent_config.py          # NEW: Agent configuration SQLModel
│   │   ├── task_config.py           # NEW: Task configuration SQLModel
│   │   └── llm_provider.py          # NEW: LLM provider configuration SQLModel
│   ├── routers/
│   │   ├── agents.py                # NEW: Agent CRUD endpoints
│   │   ├── tasks.py                 # NEW: Task CRUD & assignment endpoints
│   │   └── providers.py             # NEW: Provider CRUD & validation endpoints
│   └── services/
│       ├── agent_registry.py        # NEW: Agent instance management service
│       ├── provider_validator.py    # NEW: Async provider validation service
│       └── pydantic_schema_gen.py   # NEW: Runtime Pydantic schema generation
├── core/
│   └── agents.py                    # EXISTING: Extend with agent registry
└── tests/
    ├── contract/
    │   ├── test_agents_api.py       # NEW: Agent API contract tests
    │   ├── test_tasks_api.py        # NEW: Task API contract tests
    │   └── test_providers_api.py    # NEW: Provider API contract tests
    ├── integration/
    │   ├── test_agent_task_assignment.py  # NEW: Agent-task workflow tests
    │   └── test_provider_validation.py    # NEW: Async validation tests
    └── unit/
        ├── test_agent_registry.py   # NEW: Registry unit tests
        └── test_schema_generation.py # NEW: Schema gen unit tests

frontend/
├── src/
│   ├── components/
│   │   ├── Agents/                  # NEW: Agent management components
│   │   │   ├── AgentList.tsx
│   │   │   ├── AgentForm.tsx
│   │   │   ├── AgentCard.tsx
│   │   │   └── TaskAssignment.tsx
│   │   ├── Tasks/                   # NEW: Task management components
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   └── SchemaEditor.tsx     # Pydantic schema JSON editor
│   │   └── Providers/               # NEW: Provider configuration components
│   │       ├── ProviderList.tsx
│   │       ├── ProviderForm.tsx
│   │       └── ValidationStatus.tsx
│   ├── services/
│   │   ├── agentService.ts          # NEW: Agent API client
│   │   ├── taskService.ts           # NEW: Task API client
│   │   └── providerService.ts       # NEW: Provider API client
│   └── types/
│       ├── agent.ts                 # NEW: Agent TypeScript types
│       ├── task.ts                  # NEW: Task TypeScript types
│       └── provider.ts              # NEW: Provider TypeScript types
└── tests/
    └── components/
        ├── Agents/                  # NEW: Agent component tests
        ├── Tasks/                   # NEW: Task component tests
        └── Providers/               # NEW: Provider component tests
```

**Structure Decision**: Web application structure (Option 2). Extends existing backend/ and frontend/ directories with new agent management modules. Backend adds 3 new models, 3 new routers, 3 new services. Frontend adds new Agents tab with 3 subsections (Agents, Tasks, Providers). Follows existing project patterns (SQLModel, FastAPI routers, React functional components, CSS modules).

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- **Contract Tests** (agents-api.yaml, tasks-api.yaml, providers-api.yaml) → 12 contract test tasks [P]
- **Database Models** (4 entities) → 4 model creation tasks [P]
- **Services** (agent_registry, provider_validator, schema_generator) → 3 service implementation tasks
- **API Routers** (agents, tasks, providers) → 3 router implementation tasks
- **Frontend Components** (9 components across Agents/Tasks/Providers) → 9 component tasks [P]
- **Integration Tests** (from quickstart scenarios) → 9 integration test tasks
- **WebSocket Integration** → 2 tasks (backend broadcast, frontend subscription)

**Ordering Strategy**:
1. **Setup Phase**: Database migration, project dependencies
2. **TDD Phase**: All contract tests (must fail) [P] - **Modified**: Tests created for structure, execution optional
3. **Backend Core**: Models [P] → Services → Routers
4. **Frontend**: Components [P] → API services → WebSocket integration
5. **Integration**: Integration tests → Quickstart validation - **Modified**: Integration tests skipped per project decision
6. **Polish**: Unit tests, performance validation, documentation

**Note on TDD Modification**: The strict test-first approach (write failing tests → implement → tests pass) was modified per project decision (2025-10-04). Contract tests (T005-T016) serve as API structure documentation. Integration tests (T017-T025) were skipped. See Constitution Check Principle III for full exception details.

**Estimated Output**: 45-50 numbered, ordered tasks in tasks.md

**Parallel Execution Opportunities**:
- Contract tests (12 tasks) - different files
- Model creation (4 tasks) - different files
- Frontend components (9 tasks) - different files
- Backend routers (3 tasks) - different files after services complete

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
  - [x] research.md created with 7 technical decisions
  - [x] Technology stack validated
  - [x] All unknowns resolved
- [x] Phase 1: Design complete (/plan command)
  - [x] data-model.md created (4 entities, ERD, constraints)
  - [x] contracts/ created (agents-api.yaml, tasks-api.yaml, providers-api.yaml)
  - [x] quickstart.md created (9 acceptance scenarios)
- [x] Phase 2: Task planning approach described (/plan command)
  - [x] Task generation strategy defined
  - [x] Ordering strategy defined
  - [x] Estimated 45-50 tasks
- [x] Phase 3: Tasks generated (/tasks command)
  - [x] 78 tasks created (42 parallel, 36 sequential)
  - [x] TDD ordering enforced (tests before implementation)
  - [x] Dependency graph documented
  - [x] Parallel execution examples provided
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (no violations)
- [x] Post-Design Constitution Check: PASS (reaffirmed - no new violations)
- [x] All NEEDS CLARIFICATION resolved (via /clarify session)
- [x] Complexity deviations documented (N/A - no violations)

**Artifacts Generated**:
- `/specs/001-pydanticai/plan.md` (this file)
- `/specs/001-pydanticai/research.md` (7 decisions)
- `/specs/001-pydanticai/data-model.md` (4 entities + ERD)
- `/specs/001-pydanticai/contracts/agents-api.yaml` (12 endpoints)
- `/specs/001-pydanticai/contracts/tasks-api.yaml` (5 endpoints)
- `/specs/001-pydanticai/contracts/providers-api.yaml` (5 endpoints)
- `/specs/001-pydanticai/quickstart.md` (9 scenarios)
- `/specs/001-pydanticai/tasks.md` (78 tasks, 42 parallel)

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
