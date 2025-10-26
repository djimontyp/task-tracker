# Agent System Investigation - Summary

**Session:** Feature 4 System Documentation - Phase 1 Research
**Batch:** 1B of 4 (Parallel)
**Status:** ✅ Complete
**Report:** `agent-system-investigation.md`

---

## Quick Reference

### Agent Configuration Workflow

```
1. LLM Provider → 2. Agent Config → 3. Task Config → 4. Assignment → 5. Execute
```

**Detailed:**
1. **Create Provider** - Configure Ollama/OpenAI connection
2. **Validate Provider** - Async background validation
3. **Create Agent** - Define model, prompts, temperature
4. **Create Task** - Define output schema (JSON Schema)
5. **Create Assignment** - Link agent to task (M2M)
6. **Test Agent** - Validate with custom prompts
7. **Run Analysis** - AgentRegistry creates/caches instance

---

## LLM Providers

### Supported Types

| Provider | Type | Configuration | Validation |
|----------|------|---------------|------------|
| Ollama | `ollama` | `base_url` | Test `/api/tags` or `/v1/models` |
| OpenAI | `openai` | `api_key` (encrypted) | Test authentication |

### Provider Model

```python
class LLMProvider:
    id: UUID
    name: str
    type: ProviderType              # ollama | openai
    base_url: str | None            # Ollama endpoint
    api_key_encrypted: bytes | None # Encrypted API key
    is_active: bool
    validation_status: ValidationStatus  # pending|validating|connected|error
    validation_error: str | None
    validated_at: datetime | None
```

### Validation States

```
pending → validating → connected
                    ↓
                  error
```

---

## Agent Configuration

### AgentConfig Model

```python
class AgentConfig:
    id: UUID
    name: str                       # Unique
    description: str | None
    provider_id: UUID               # FK to LLMProvider
    model_name: str                 # e.g., "llama3", "gpt-4"
    system_prompt: str              # Agent instructions
    temperature: float | None       # 0.0-1.0 (default: 0.7)
    max_tokens: int | None          # Response length limit
    is_active: bool
```

### Example

```json
{
  "name": "Message Classifier",
  "provider_id": "uuid...",
  "model_name": "llama3",
  "system_prompt": "You are a message classifier...",
  "temperature": 0.7,
  "max_tokens": 500
}
```

---

## Task Configuration

### TaskConfig Model

```python
class TaskConfig:
    id: UUID
    name: str                       # Unique
    description: str | None
    response_schema: dict           # JSON Schema for validation
    is_active: bool
```

### Response Schema Example

```json
{
  "name": "Message Classification",
  "response_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "category": {
        "type": "string",
        "enum": ["bug", "feature", "question", "discussion"]
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1
      }
    },
    "required": ["category", "confidence"]
  }
}
```

---

## Agent-Task Assignment

### AgentTaskAssignment Model

```python
class AgentTaskAssignment:
    id: UUID
    agent_id: UUID                  # FK to AgentConfig
    task_id: UUID                   # FK to TaskConfig
    is_active: bool
    assigned_at: datetime

    # Unique constraint: (agent_id, task_id)
```

### M2M Relationship

```
One Agent ↔ Many Tasks
One Task ↔ Many Agents
```

**Benefits:**
- A/B testing (same task, different agents)
- Agent specialization (one agent, multiple tasks)
- Flexible configuration

---

## Agent Registry

### Purpose
- Cache agent instances (avoid recreation)
- Use weak references (automatic GC)
- Thread-safe (async locks)

### Pattern

```python
class AgentRegistry:
    # Singleton
    _instance: AgentRegistry | None

    # Storage
    _registry: dict[tuple[UUID, UUID], weakref.ref[Agent]]
    _locks: dict[tuple[UUID, UUID], asyncio.Lock]

    async def get_or_create(
        agent_config: AgentConfig,
        task_config: TaskConfig
    ) -> Agent:
        key = (agent_config.id, task_config.id)

        # Check cache
        if key in _registry and _registry[key]() is not None:
            return _registry[key]()

        # Create new
        agent = await _create_agent(agent_config, task_config)

        # Store weak reference
        _registry[key] = weakref.ref(agent, cleanup_callback)

        return agent
```

---

## Hexagonal Architecture (LLM Layer)

### Layers

```
Domain (ports) ← Application (orchestration) → Infrastructure (adapters)
```

**Domain Layer** (framework-agnostic):
- Interfaces: `LLMAgent`, `LLMFramework`, `ModelFactory`
- Models: `AgentConfig`, `ProviderConfig`, `AgentResult`

**Application Layer** (orchestration):
- `LLMService` - High-level operations
- `ProviderResolver` - Provider lookup
- `FrameworkRegistry` - Framework selection

**Infrastructure Layer** (adapters):
- `PydanticAIFramework` - PydanticAI adapter
- `OllamaModelFactory` - Ollama integration
- `OpenAIModelFactory` - OpenAI integration

### LLMService

```python
class LLMService:
    async def create_agent(
        session: AsyncSession,
        config: AgentConfig,              # Domain config
        provider_name: str | None = None
    ) -> LLMAgent[Any]:
        # 1. Resolve provider
        provider = await resolver.resolve(session, provider_name)

        # 2. Convert to domain ProviderConfig
        provider_config = provider_to_config(provider)

        # 3. Create via framework adapter
        agent = await framework.create_agent(config, provider_config)

        return agent

    async def execute_prompt(
        session: AsyncSession,
        config: AgentConfig,
        prompt: str
    ) -> AgentResult[Any]:
        # Convenience: create + run
        agent = await self.create_agent(session, config)
        return await agent.run(prompt=prompt)
```

---

## API Endpoints

### LLM Providers (7 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/providers` | Create provider |
| GET | `/api/v1/providers` | List providers |
| GET | `/api/v1/providers/{id}` | Get provider |
| PUT | `/api/v1/providers/{id}` | Update provider |
| DELETE | `/api/v1/providers/{id}` | Delete provider |
| POST | `/api/v1/providers/{id}/validate` | Validate provider |
| GET | `/api/v1/providers/ollama/models` | List Ollama models |

### Agent Configurations (6 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents` | Create agent |
| GET | `/api/v1/agents` | List agents |
| GET | `/api/v1/agents/{id}` | Get agent |
| PUT | `/api/v1/agents/{id}` | Update agent |
| DELETE | `/api/v1/agents/{id}` | Delete agent |
| POST | `/api/v1/agents/{id}/test` | Test agent |

### Agent-Task Assignments (4 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents/{agent_id}/tasks` | Assign task |
| GET | `/api/v1/agents/{agent_id}/tasks` | List agent's tasks |
| DELETE | `/api/v1/agents/{agent_id}/tasks/{task_id}` | Unassign task |
| GET | `/api/v1/assignments` | List all assignments |

---

## Usage in Analysis Runs

### AnalysisRun Integration

```python
class AnalysisRun:
    id: UUID
    agent_assignment_id: UUID       # Links to assignment
    config_snapshot: dict           # Full config for reproducibility
    time_window_start: datetime
    time_window_end: datetime
    status: str                     # pending|running|completed
    proposals_total: int
    llm_tokens_used: int
```

### Execution Flow

```python
async def execute_analysis_run(run_id: UUID):
    # 1. Load assignment
    assignment = await load_assignment(run.agent_assignment_id)

    # 2. Load configs
    agent_config = await load_agent(assignment.agent_id)
    task_config = await load_task(assignment.task_id)

    # 3. Get/create agent instance
    agent = await AgentRegistry().get_or_create(
        agent_config, task_config
    )

    # 4. Process knowledge (topics/atoms)
    for batch in batches:
        result = await agent.run(prompt=build_prompt(batch))

        # result.output validated by task_config.response_schema

        # Store proposals
        save_proposals(run_id, result.output)
```

---

## Key Files

### Models
- `/backend/app/models/llm_provider.py`
- `/backend/app/models/agent_config.py`
- `/backend/app/models/task_config.py`
- `/backend/app/models/agent_task_assignment.py`
- `/backend/app/models/analysis_run.py`

### Services
- `/backend/app/services/provider_crud.py`
- `/backend/app/services/provider_validator.py`
- `/backend/app/services/agent_crud.py`
- `/backend/app/services/assignment_crud.py`
- `/backend/app/services/agent_registry.py`
- `/backend/app/services/agent_service.py`

### LLM Layer
- `/backend/app/llm/domain/ports.py`
- `/backend/app/llm/domain/models.py`
- `/backend/app/llm/application/llm_service.py`
- `/backend/app/llm/infrastructure/adapters/pydantic_ai/adapter.py`

### API Endpoints
- `/backend/app/api/v1/providers.py`
- `/backend/app/api/v1/agents.py`
- `/backend/app/api/v1/tasks.py`

---

## Quick Setup Example

```bash
# 1. Create provider
curl -X POST /api/v1/providers -d '{
  "name": "Ollama Local",
  "type": "ollama",
  "base_url": "http://localhost:11434"
}'

# 2. Create agent
curl -X POST /api/v1/agents -d '{
  "name": "Message Classifier",
  "provider_id": "uuid...",
  "model_name": "llama3",
  "system_prompt": "You are a classifier...",
  "temperature": 0.7
}'

# 3. Create task
curl -X POST /api/v1/tasks -d '{
  "name": "Classification",
  "response_schema": { ... }
}'

# 4. Create assignment
curl -X POST /api/v1/agents/{agent_id}/tasks -d '{
  "task_id": "uuid..."
}'

# 5. Test agent
curl -X POST /api/v1/agents/{agent_id}/test -d '{
  "prompt": "Test message"
}'

# 6. Create analysis run
curl -X POST /api/v1/analysis/runs -d '{
  "agent_assignment_id": "uuid...",
  "time_window_start": "2025-10-01T00:00:00Z",
  "time_window_end": "2025-10-26T23:59:59Z"
}'

# 7. Start run
curl -X POST /api/v1/analysis/runs/{run_id}/start
```

---

## Design Decisions

### Why Hexagonal Architecture?
- Framework independence
- Easy testing (mock adapters)
- Clear separation of concerns

### Why Agent Registry?
- Performance (reuse instances)
- Memory efficiency (weak references)
- Thread-safe (async locks)

### Why M2M Assignment?
- Flexibility (one agent → many tasks)
- A/B testing (one task → many agents)
- Agent specialization

### Why Separate Agent/Task Configs?
- Separation of concerns (HOW vs WHAT)
- Reusability (same task, different agents)
- Maintainability (update independently)

---

**Full Report:** `agent-system-investigation.md`
**Files Analyzed:** 15+
**Duration:** 30 minutes
