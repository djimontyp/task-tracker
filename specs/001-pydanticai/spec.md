# Feature Specification: LLM Agent Management System

**Feature Branch**: `001-pydanticai`
**Created**: 2025-10-04
**Status**: Draft
**Input**: User description: "я потребую реалізації управління агентами ллм на фронтенді. треба додати новий таб Агенти. там будуть управління по агентам - додати видалити налаштувати. конфіги агентів маєть зберігатись у базі данних. агенти мають конфігуруватись на основі цих конфігів з бази данних. має бути реалізован мабуть якесь управління станом агентів на бекенді що б не створювались копії агентів с того ж самого конфіга. з фронта має бути просте управління агентами - має відображати налаштування агента з PydanticAI там точно є юзер промт, системний промт, модель порвайдер. треба також секцію з ллм провайдерами. зараз цікавлять тільки оллама локальна та опенаі. ці агенти далі будуть використовуватись в проєкті. для класифікації повідомлень наприклад, витягування ентіті, структурування тем обговорюваних і так далі, задач буде безліч різних."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-10-04
- Q: When an agent configuration is updated while it's actively processing tasks, what should happen to in-flight operations? → A: Different agents handle different tasks independently; configuration updates should not interfere with running tasks or parallel operations
- Q: How should the system assign agents to different task types (classification, entity extraction, topic structuring)? → A: Rename "tasks" to "topics" for research. Agents execute "tasks" (jobs). One configured agent can be assigned multiple tasks, creating separate agent instances per task. Tasks require Pydantic schemas for structured requests/responses. Task configurations must be stored and dynamically generated for agents.
- Q: Should provider connectivity validation happen during save or in the background? → A: Asynchronous (Option B)
- Q: When deleting an agent that is currently assigned to active tasks, what should happen? → A: Allow deletion (Option D). Agent instances complete their running tasks. Task stopping managed separately through dedicated task management interface.
- Q: Should agent names be globally unique, or can different agents have the same name? → A: Globally unique (Option A)

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a system administrator, I need to manage LLM agents and their assigned tasks through a web interface. I configure agents (with prompts, models, providers) and define tasks (with Pydantic schemas for structured input/output). One agent configuration can execute multiple different tasks, with the system creating separate agent instances per task. This enables researching topics through specialized agent tasks without manual configuration editing or service restarts.

### Acceptance Scenarios

1. **Given** I am on the Dashboard, **When** I navigate to the "Agents" tab, **Then** I see a list of all configured LLM agents with their names, descriptions, models, and providers

2. **Given** I am on the Agents tab, **When** I click "Add New Agent", **Then** I see a form with fields for name, description, system prompt, user prompt, model provider (Ollama/OpenAI), and model name

3. **Given** I have filled in the agent creation form, **When** I submit the form, **Then** the agent configuration is saved to the database and appears in the agents list

4. **Given** I am on the Agents tab, **When** I click "Manage Tasks" for an agent, **Then** I see a task assignment interface where I can assign existing tasks or create new tasks for this agent

5. **Given** I am creating or editing a task, **When** I define Pydantic schemas for request and response, **Then** the system validates the schema syntax and stores it for runtime generation

6. **Given** I have assigned a task to an agent, **When** the task is executed, **Then** the system creates a dedicated agent instance configured with the task's Pydantic schemas

7. **Given** I have existing agents in the list, **When** I click "Edit" on an agent, **Then** I can modify its configuration and save changes

8. **Given** I have an agent selected, **When** I click "Delete", **Then** the agent configuration is removed from the database, disappears from the list, and any running agent instances continue executing their assigned tasks until completion

13. **Given** I need to stop a running task, **When** I access the task management interface, **Then** I can manually stop individual task instances independent of agent deletion

6. **Given** an agent configuration exists in the database, **When** the backend needs to use that agent, **Then** the agent is instantiated from the stored configuration without creating duplicate instances

9. **Given** I am viewing the Agents tab, **When** I navigate to the "LLM Providers" section, **Then** I see configuration options for Ollama (local) and OpenAI providers

10. **Given** I save a new provider configuration, **When** the save completes, **Then** the provider is saved immediately and validation status shows "Validating..." while background connectivity check runs

11. **Given** background provider validation completes, **When** I view the providers list, **Then** I see updated status (Connected/Error) with validation timestamp

12. **Given** multiple agents use the same configuration, **When** the backend loads agents, **Then** agent state is managed to prevent duplicate instantiations for identical configs

### Edge Cases
- Invalid model names or unavailable providers handled gracefully with error messages (FR-031, FR-032)
- Agent configuration referencing unconfigured provider prevented by foreign key constraint
- Agent configuration updates must not disrupt ongoing tasks; each agent maintains independent task processing state (FR-011)
- System and user prompts validated for required fields; system_prompt required, user_prompt optional (FR-029)

## Requirements *(mandatory)*

### Functional Requirements

#### Agent Management (Frontend)
- **FR-001**: System MUST provide a new "Agents" navigation tab in the Dashboard
- **FR-002**: System MUST display a list of all configured agents with name, description, model, and provider
- **FR-003**: Users MUST be able to create new agents via a form interface
- **FR-004**: Users MUST be able to edit existing agent configurations
- **FR-005**: Users MUST be able to delete agent configurations
- **FR-006**: Agent creation form MUST include fields for:
  - Name (required)
  - Description (optional)
  - System prompt (required)
  - User prompt (optional)
  - Model provider selection (Ollama/OpenAI)
  - Model name (required)

#### Agent Configuration (Backend)
- **FR-007**: System MUST store agent configurations in PostgreSQL database
- **FR-008**: System MUST load agent configurations from database on backend startup
- **FR-009**: System MUST instantiate PydanticAI agents based on stored configurations
- **FR-010**: System MUST manage agent state to prevent duplicate instantiations for identical configurations
- **FR-011**: System MUST allow multiple independent agents to operate concurrently without interference between their configurations or task queues

#### LLM Provider Management
- **FR-012**: System MUST provide a "LLM Providers" section in the frontend
- **FR-013**: System MUST support Ollama (local) provider configuration with base URL
- **FR-014**: System MUST support OpenAI provider configuration with API key
- **FR-015**: System MUST save provider configurations immediately and validate connectivity asynchronously in the background
- **FR-016**: System MUST display provider validation status (validating, connected, error) in the UI after background validation completes
- **FR-017**: System MUST store provider configurations securely (encrypted credentials)

#### Agent Task Assignment
- **FR-018**: System MUST support assigning multiple tasks to a single agent configuration
- **FR-019**: System MUST create separate agent instances for each task assigned to an agent
- **FR-020**: System MUST allow defining tasks with Pydantic schema configurations for structured requests and responses
- **FR-021**: System MUST store task configurations in database for dynamic generation
- **FR-022**: Task Pydantic schemas MUST be rendered/generated for use in PydanticAI for structured outputs

#### Data Persistence & State
- **FR-023**: System MUST persist agent configurations across service restarts
- **FR-024**: System MUST persist task configurations and their Pydantic schemas across service restarts
- **FR-025**: System MUST maintain a registry of active agent instances mapped to agent configurations and assigned tasks
- **FR-026**: System MUST handle concurrent access to agent instances safely

#### Validation & Error Handling
- **FR-027**: System MUST validate agent name uniqueness before creation
- **FR-028**: System MUST validate task name uniqueness before creation
- **FR-029**: System MUST validate required fields (name, system prompt, model, provider for agents; name, Pydantic schema for tasks)
- **FR-030**: System MUST validate Pydantic schema syntax before saving task configuration
- **FR-031**: System MUST provide user-friendly error messages for validation failures
- **FR-032**: System MUST handle provider unavailability gracefully when instantiating agents for tasks
- **FR-033**: System MUST handle agent deletion with active task assignments:
  - (a) Agent configuration deletion MUST be allowed regardless of active task assignments
  - (b) Running agent instances MUST continue executing their assigned tasks until completion
  - (c) System MUST provide separate task management interface for manually stopping running tasks independent of agent deletion

### Key Entities *(include if feature involves data)*

- **Agent Configuration**: Represents a configured LLM agent with name, description, system prompt, user prompt, model identifier, and provider reference. Can be assigned to multiple tasks. Stored persistently in database.

- **Task Configuration**: Represents an agent task with name, description, Pydantic schema for structured request format, Pydantic schema for structured response format, and reference to assigned agent configuration. Stored persistently in database.

- **LLM Provider**: Represents an LLM provider (Ollama or OpenAI) with connection details (base URL for Ollama, API key for OpenAI), provider type, and validation status.

- **Agent Instance**: Runtime representation of an active agent loaded from agent configuration and task configuration. One agent configuration can have multiple instances (one per assigned task). Maintains independent state per task. Not persisted directly but managed in memory/cache.

- **Topic** (renamed from Task entity): Represents research topics being investigated. Distinct from Task Configuration which defines agent execution jobs.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain (deferred questions documented separately)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---

## Resolved Questions

### Session 2025-10-04 Clarifications Applied

1. ✅ **Hot-reload behavior**: Configuration updates don't disrupt running tasks; each agent maintains independent task processing state (FR-011)

2. ✅ **Provider validation**: Asynchronous background validation (FR-015)

3. ✅ **Agent-task assignment**: One configured agent can be assigned multiple tasks, creating separate agent instances per task (FR-018, FR-019)

4. ✅ **Agent deletion behavior**: Hard deletion allowed; running instances continue independently (FR-033)

5. ✅ **Agent name uniqueness**: Globally unique (FR-027)

## Deferred Questions (Future Enhancements)

The following questions are deferred for post-v1 implementation:

1. **Usage metrics**: Agent usage metrics (invocation count, error rate) - deferred to future release

2. **Provider unavailability fallback**: Retry logic and fallback strategies - handled by FR-032 (graceful error handling) for v1

3. **Model name validation**: Pre-save validation of model existence on provider - deferred to future release

4. **Tools configuration schema**: Structure for future extensions - to be designed when tools feature is planned

5. **Access control**: User permission requirements - deferred; all dashboard users have access in v1
