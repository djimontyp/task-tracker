# Agent System Configuration Investigation Report

**Date:** October 26, 2025
**Session:** Feature 4 System Documentation - Phase 1 Research
**Batch:** 1B of 4 (Parallel) - Agent System Configuration Investigation
**Status:** ✅ Complete

---

## Executive Summary

The Agent System provides a flexible, hexagonal architecture for managing AI agent configurations, LLM provider connections, and task assignments. The system uses PydanticAI as the primary framework with support for Ollama (local) and OpenAI (cloud) providers.

**Key Architecture Patterns:**
- **Hexagonal Architecture** - Domain layer isolated from infrastructure (PydanticAI adapter pattern)
- **Agent Registry** - Singleton pattern with weak references prevents duplicate agent instantiation
- **Provider Abstraction** - Factory pattern for provider-specific model creation
- **Assignment-based Instantiation** - Agents are created per agent+task combination

---

## 1. Agent Configuration Workflow

### 1.1 High-Level Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Configuration Flow                      │
└─────────────────────────────────────────────────────────────────┘

1. CREATE LLM PROVIDER
   ├─ POST /api/v1/providers
   ├─ Configure Ollama (base_url) or OpenAI (api_key)
   ├─ Automatic validation (background task)
   └─ Status: pending → validating → connected/error

2. CREATE AGENT CONFIG
   ├─ POST /api/v1/agents
   ├─ Specify: name, provider_id, model_name, system_prompt
   ├─ Optional: temperature, max_tokens
   └─ Validates provider exists

3. CREATE TASK CONFIG
   ├─ POST /api/v1/tasks
   ├─ Define: name, description
   └─ Include: response_schema (JSON Schema for output validation)

4. CREATE AGENT-TASK ASSIGNMENT
   ├─ POST /api/v1/agents/{agent_id}/tasks
   ├─ Links agent to task (M2M relationship)
   ├─ Unique constraint: one assignment per agent+task pair
   └─ Triggers agent instance creation on first use

5. EXECUTE AGENT
   ├─ Analysis run starts
   ├─ AgentRegistry.get_or_create(agent_config, task_config)
   ├─ Creates PydanticAI Agent instance if not cached
   ├─ Executes with structured output (validated by response_schema)
   └─ Results stored as TaskProposals
```

### 1.2 Detailed Component Flow

```
┌──────────────────┐
│  LLMProvider     │
│  (Database)      │
│                  │
│  - type: ollama  │
│  - base_url      │
│  - api_key_enc   │
│  - is_active     │
│  - validation    │
└────────┬─────────┘
         │
         │ references
         ↓
┌──────────────────┐         ┌──────────────────┐
│  AgentConfig     │         │  TaskConfig      │
│  (Database)      │         │  (Database)      │
│                  │         │                  │
│  - name          │         │  - name          │
│  - provider_id ──┼─────┐   │  - response_     │
│  - model_name    │     │   │    schema        │
│  - system_prompt │     │   │  - is_active     │
│  - temperature   │     │   └────────┬─────────┘
│  - max_tokens    │     │            │
└────────┬─────────┘     │            │
         │               │            │
         │               │            │
         │               ↓            ↓
         │        ┌─────────────────────────┐
         │        │ AgentTaskAssignment     │
         │        │ (M2M Join Table)        │
         │        │                         │
         │        │  - agent_id             │
         │        │  - task_id              │
         │        │  - is_active            │
         │        │                         │
         │        │  UNIQUE(agent_id,       │
         │        │         task_id)        │
         │        └───────────┬─────────────┘
         │                    │
         │                    │ triggers
         │                    ↓
         │        ┌─────────────────────────┐
         │        │   AgentRegistry         │
         │        │   (Singleton)           │
         │        │                         │
         │        │  get_or_create()        │
         │        │    ↓                    │
         │        │  - Check cache          │
         │        │  - Create if missing    │
         │        │  - Store weak ref       │
         │        └───────────┬─────────────┘
         │                    │
         │                    │ creates
         │                    ↓
         │        ┌─────────────────────────┐
         │        │  PydanticAI Agent       │
         │        │  (Runtime Instance)     │
         │        │                         │
         │        │  - model (from provider)│
         │        │  - system_prompt        │
         │        │  - output_type          │
         │        │  - model_settings       │
         │        └─────────────────────────┘
         │
         │ used in
         ↓
┌──────────────────┐
│  AnalysisRun     │
│  (Execution)     │
│                  │
│  - agent_        │
│    assignment_id │
│  - config_       │
│    snapshot      │
│  - status        │
└──────────────────┘
```

---

## 2. LLM Provider Management

### 2.1 LLMProvider Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/llm_provider.py`

**Core Fields:**
```python
class LLMProvider(SQLModel, table=True):
    id: UUID                              # Primary key
    name: str                             # Unique provider name
    type: ProviderType                    # "ollama" | "openai"

    # Connection Configuration
    base_url: str | None                  # API endpoint (Ollama)
    api_key_encrypted: bytes | None       # Fernet-encrypted key (OpenAI)

    # Status & Validation
    is_active: bool                       # Provider enabled
    validation_status: ValidationStatus   # pending|validating|connected|error
    validation_error: str | None          # Last error message
    validated_at: datetime | None         # Last validation timestamp

    # Timestamps
    created_at: datetime
    updated_at: datetime
```

**Provider Types:**
```python
class ProviderType(str, Enum):
    ollama = "ollama"    # Local Ollama instance
    openai = "openai"    # OpenAI cloud API
```

**Validation Statuses:**
```python
class ValidationStatus(str, Enum):
    pending = "pending"        # Not yet validated
    validating = "validating"  # Validation in progress
    connected = "connected"    # Successfully validated
    error = "error"            # Validation failed
```

### 2.2 Provider Configuration Examples

**Ollama (Local):**
```json
{
  "name": "Ollama Local",
  "type": "ollama",
  "base_url": "http://localhost:11434",
  "is_active": true
}
```

**Ollama (OpenAI-compatible endpoint):**
```json
{
  "name": "Ollama OpenAI API",
  "type": "ollama",
  "base_url": "http://localhost:11434/v1",
  "is_active": true
}
```

**OpenAI:**
```json
{
  "name": "OpenAI GPT-4",
  "type": "openai",
  "api_key": "sk-...",
  "is_active": true
}
```

### 2.3 Provider Validation Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/provider_validator.py`

**Validation Process:**

```python
class ProviderValidator:
    async def validate_provider_async(provider_id: UUID):
        # 1. Update status to 'validating'
        provider.validation_status = ValidationStatus.validating

        # 2. Perform type-specific validation
        if provider.type == ProviderType.ollama:
            await _validate_ollama(provider)  # Test /api/tags or /v1/models
        elif provider.type == ProviderType.openai:
            await _validate_openai(provider)  # Test with decrypted API key

        # 3. Update status based on result
        if success:
            provider.validation_status = ValidationStatus.connected
            provider.validation_error = None
        else:
            provider.validation_status = ValidationStatus.error
            provider.validation_error = str(exception)

        provider.validated_at = datetime.utcnow()

        # 4. Broadcast WebSocket update
        await websocket_manager.broadcast("providers", {
            "event": "validation_update",
            "provider_id": str(provider_id),
            "validation_status": provider.validation_status.value,
            "validation_error": provider.validation_error
        })
```

**Ollama Validation:**
- Tests native API: `GET {base_url}/api/tags`
- Tests OpenAI-compatible API: `GET {base_url}/v1/models`
- Verifies response structure

**OpenAI Validation:**
- Requires decrypted API key from CredentialEncryption service
- Tests authentication with OpenAI API

### 2.4 Credential Encryption

**Purpose:** Securely store API keys in database

**Implementation:**
- Uses Fernet symmetric encryption
- Key stored in environment variable
- API keys encrypted before database storage
- Decrypted on-demand for API calls

---

## 3. Agent Configuration

### 3.1 AgentConfig Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/agent_config.py`

**Core Fields:**
```python
class AgentConfig(SQLModel, table=True):
    id: UUID                    # Primary key
    name: str                   # Unique agent name (indexed)
    description: str | None     # Human-readable description

    # LLM Configuration
    provider_id: UUID           # FK to llm_providers.id
    model_name: str             # e.g., "llama3", "gpt-4"
    system_prompt: str          # Agent's system prompt

    # Behavior Configuration
    temperature: float | None   # 0.0-1.0 (default: 0.7)
    max_tokens: int | None      # Response length limit

    # Status
    is_active: bool             # Agent enabled

    # Timestamps
    created_at: datetime
    updated_at: datetime
```

**Example:**
```json
{
  "name": "Message Classifier",
  "description": "Classifies messages into categories",
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "model_name": "llama3",
  "system_prompt": "You are a message classification assistant. Analyze the message and categorize it as bug, feature, question, or discussion.",
  "temperature": 0.7,
  "max_tokens": 500,
  "is_active": true
}
```

### 3.2 AgentConfig CRUD Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/agent_crud.py`

**Key Operations:**

```python
class AgentCRUD:
    async def create(agent_data: AgentConfigCreate) -> AgentConfigPublic:
        # 1. Validate name uniqueness
        # 2. Verify provider exists
        # 3. Create agent record
        # 4. Return public schema

    async def get(agent_id: UUID) -> AgentConfigPublic | None:
        # Fetch single agent by ID

    async def get_by_name(name: str) -> AgentConfigPublic | None:
        # Fetch agent by unique name

    async def list(skip: int, limit: int, active_only: bool,
                   provider_id: UUID | None) -> list[AgentConfigPublic]:
        # List with pagination and filters

    async def update(agent_id: UUID, update_data: AgentConfigUpdate)
        -> AgentConfigPublic | None:
        # Update agent (validates provider_id if changed)

    async def delete(agent_id: UUID) -> bool:
        # Delete agent (cascades to assignments)
        # Running instances continue until task completion (FR-033)
```

### 3.3 Agent API Endpoints

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/agents.py`

**CRUD Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents` | Create new agent configuration |
| GET | `/api/v1/agents` | List all agents (with filters) |
| GET | `/api/v1/agents/{agent_id}` | Get agent by ID |
| PUT | `/api/v1/agents/{agent_id}` | Update agent configuration |
| DELETE | `/api/v1/agents/{agent_id}` | Delete agent configuration |

**Task Assignment Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents/{agent_id}/tasks` | Assign task to agent |
| GET | `/api/v1/agents/{agent_id}/tasks` | List agent's tasks |
| DELETE | `/api/v1/agents/{agent_id}/tasks/{task_id}` | Unassign task |

**Testing Endpoint:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents/{agent_id}/test` | Test agent with custom prompt |

---

## 4. Task Configuration

### 4.1 TaskConfig Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/task_config.py`

**Core Fields:**
```python
class TaskConfig(SQLModel, table=True):
    id: UUID                    # Primary key
    name: str                   # Unique task name (indexed)
    description: str | None     # Task description

    # Output Schema
    response_schema: dict       # JSON Schema for validation

    # Status
    is_active: bool             # Task enabled

    # Timestamps
    created_at: datetime
    updated_at: datetime
```

**Response Schema Example:**
```json
{
  "name": "Classify Message",
  "description": "Categorize incoming messages",
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
      },
      "reasoning": {
        "type": "string"
      }
    },
    "required": ["category", "confidence"]
  },
  "is_active": true
}
```

**Purpose:**
- Defines what the agent should output
- Provides JSON Schema for validation
- Ensures structured, type-safe responses
- Used by PydanticAI to generate output models

---

## 5. Agent-Task Assignment

### 5.1 AgentTaskAssignment Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/agent_task_assignment.py`

**Core Fields:**
```python
class AgentTaskAssignment(SQLModel, table=True):
    id: UUID                    # Primary key

    # Foreign Keys
    agent_id: UUID              # FK to agent_configs.id
    task_id: UUID               # FK to task_configs.id

    # Status
    is_active: bool             # Assignment enabled

    # Timestamp
    assigned_at: datetime       # Assignment timestamp

    # Constraints
    __table_args__ = (
        UniqueConstraint("agent_id", "task_id", name="uq_agent_task"),
    )
```

**Assignment with Details (JOIN query):**
```python
class AgentTaskAssignmentWithDetails(SQLModel):
    # Base assignment fields
    id: UUID
    agent_id: UUID
    task_id: UUID
    is_active: bool
    assigned_at: datetime

    # Joined fields from related tables
    agent_name: str             # From AgentConfig
    task_name: str              # From TaskConfig
    provider_name: str          # From LLMProvider
    provider_type: str          # From LLMProvider
```

### 5.2 Assignment CRUD Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/assignment_crud.py`

**Key Operations:**

```python
class AssignmentCRUD:
    async def create(assignment_data: AgentTaskAssignmentCreate)
        -> AgentTaskAssignmentPublic:
        # 1. Verify agent exists
        # 2. Verify task exists
        # 3. Create assignment (handles unique constraint)

    async def get(assignment_id: UUID)
        -> AgentTaskAssignmentPublic | None:
        # Fetch single assignment

    async def get_by_agent_and_task(agent_id: UUID, task_id: UUID)
        -> AgentTaskAssignmentPublic | None:
        # Find assignment by agent+task pair

    async def list_by_agent(agent_id: UUID, active_only: bool)
        -> list[AgentTaskAssignmentPublic]:
        # List all tasks assigned to agent

    async def list_by_task(task_id: UUID, active_only: bool)
        -> list[AgentTaskAssignmentPublic]:
        # List all agents assigned to task

    async def list_with_details(active_only: bool, skip: int, limit: int)
        -> list[AgentTaskAssignmentWithDetails]:
        # List with JOIN queries (agent, task, provider details)

    async def update_status(assignment_id: UUID, is_active: bool)
        -> AgentTaskAssignmentPublic | None:
        # Enable/disable assignment

    async def delete(assignment_id: UUID) -> bool:
        # Delete assignment
```

### 5.3 Assignment Process

**Workflow:**
```
1. User creates agent configuration
2. User creates task configuration
3. User creates assignment between agent and task
   ├─ POST /api/v1/agents/{agent_id}/tasks
   ├─ Validates both agent and task exist
   ├─ Enforces unique constraint (agent_id, task_id)
   └─ Creates assignment record

4. On first use in analysis run:
   ├─ Load assignment from database
   ├─ Load related agent_config and task_config
   ├─ Pass to AgentRegistry.get_or_create()
   └─ Registry creates or returns cached agent instance
```

**Unique Constraint:**
- One assignment per agent+task pair
- Prevents duplicate assignments
- Raises `IntegrityError` if duplicate attempted

---

## 6. Agent Registry

### 6.1 AgentRegistry Service

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/agent_registry.py`

**Purpose:**
- Prevents duplicate agent instantiation for same agent+task combination
- Uses weak references for automatic garbage collection
- Thread-safe with async locks

**Architecture:**
```python
class AgentRegistry:
    # Singleton instance
    _instance: AgentRegistry | None = None

    # Registry storage
    _registry: dict[tuple[UUID, UUID], weakref.ref[Agent]]

    # Per-instance locks for thread safety
    _locks: dict[tuple[UUID, UUID], asyncio.Lock]
    _global_lock: asyncio.Lock

    async def get_or_create(
        agent_config: AgentConfig,
        task_config: TaskConfig
    ) -> Agent:
        # 1. Create key from (agent_id, task_id)
        # 2. Check if agent exists in cache
        # 3. If exists and alive, return cached instance
        # 4. If not, create new agent via _create_agent()
        # 5. Store weak reference with cleanup callback
        # 6. Return agent instance
```

**Key Features:**

1. **Singleton Pattern:**
   - Single registry instance across application
   - Ensures consistent caching

2. **Weak References:**
   - Agents automatically garbage collected when unused
   - No manual cleanup required
   - Cleanup callback removes stale entries

3. **Thread Safety:**
   - Global lock for registry operations
   - Per-instance locks for concurrent creation
   - Prevents race conditions

4. **Automatic Cleanup:**
   ```python
   def cleanup(_: weakref.ref[Agent]) -> None:
       """Remove entry when agent is garbage collected."""
       self._registry.pop(key, None)
       self._locks.pop(key, None)
   ```

### 6.2 Agent Creation Process

**Current Implementation (Placeholder):**
```python
async def _create_agent(
    agent_config: AgentConfig,
    task_config: TaskConfig
) -> Agent:
    # TODO: Full implementation in T033 (SchemaGenerator service)

    # Minimal placeholder:
    agent = Agent(
        model=agent_config.model_name,
        system_prompt=agent_config.system_prompt,
    )

    return agent
```

**Full Implementation (T033):**
```python
async def _create_agent(
    agent_config: AgentConfig,
    task_config: TaskConfig
) -> Agent:
    # 1. Load provider from database
    provider = await load_provider(agent_config.provider_id)

    # 2. Generate Pydantic model from task_config.response_schema
    output_model = SchemaGenerator.generate_model(
        task_config.response_schema
    )

    # 3. Create provider-specific model
    model = create_model_for_provider(
        provider=provider,
        model_name=agent_config.model_name
    )

    # 4. Create PydanticAI agent
    agent = Agent(
        model=model,
        system_prompt=agent_config.system_prompt,
        output_type=output_model,  # Type-safe output
        model_settings={
            "temperature": agent_config.temperature,
            "max_tokens": agent_config.max_tokens,
        }
    )

    return agent
```

---

## 7. Agent Execution in LLM Layer

### 7.1 Hexagonal Architecture

The LLM layer follows hexagonal (ports and adapters) architecture:

**Domain Layer** (framework-agnostic):
- `/Users/maks/PycharmProjects/task-tracker/backend/app/llm/domain/`
- Defines ports (interfaces): `LLMAgent`, `LLMFramework`, `ModelFactory`
- Domain models: `AgentConfig`, `ProviderConfig`, `AgentResult`

**Application Layer** (orchestration):
- `/Users/maks/PycharmProjects/task-tracker/backend/app/llm/application/`
- `LLMService` - High-level agent creation and execution
- `ProviderResolver` - Provider lookup from database/settings
- `FrameworkRegistry` - Framework selection (PydanticAI, future LangChain)

**Infrastructure Layer** (adapters):
- `/Users/maks/PycharmProjects/task-tracker/backend/app/llm/infrastructure/adapters/pydantic_ai/`
- `PydanticAIFramework` - Implements `LLMFramework` port
- `PydanticAIAgentWrapper` - Implements `LLMAgent` port
- Provider factories: `OllamaModelFactory`, `OpenAIModelFactory`

### 7.2 LLMService (Application Layer)

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/llm/application/llm_service.py`

**Purpose:** High-level service for LLM operations

```python
class LLMService:
    def __init__(
        provider_resolver: ProviderResolver,
        framework_name: str | None = None  # "pydantic_ai" (default)
    ):
        self.provider_resolver = provider_resolver
        self.framework = FrameworkRegistry.get(framework_name)

    async def create_agent(
        session: AsyncSession,
        config: AgentConfig,              # Domain AgentConfig
        provider_name: str | None = None,
        provider_id: UUID | None = None
    ) -> LLMAgent[Any]:
        # 1. Resolve provider from database
        provider = await self.provider_resolver.resolve(
            session, provider_name, provider_id
        )

        # 2. Convert to domain ProviderConfig
        provider_config = provider_to_config(provider, crud)

        # 3. Create agent via framework adapter
        agent = await self.framework.create_agent(
            config=config,
            provider_config=provider_config
        )

        return agent

    async def execute_prompt(
        session: AsyncSession,
        config: AgentConfig,
        prompt: str,
        provider_name: str | None = None,
        dependencies: Any = None
    ) -> AgentResult[Any]:
        # Convenience method: create + run in one call
        agent = await self.create_agent(session, config, provider_name)
        return await agent.run(prompt=prompt, dependencies=dependencies)
```

**Domain vs Database Models:**

The system maintains separation between domain models and database models:

| Layer | Model Type | Location | Purpose |
|-------|------------|----------|---------|
| Domain | `AgentConfig` | `app.llm.domain.models` | Framework-agnostic configuration |
| Database | `AgentConfig` | `app.models.agent_config` | Persistent storage |
| Domain | `ProviderConfig` | `app.llm.domain.models` | Provider settings |
| Database | `LLMProvider` | `app.models.llm_provider` | Provider credentials |

**Conversion:**
```python
def provider_to_config(provider: LLMProvider, crud: ProviderCRUD) -> ProviderConfig:
    return ProviderConfig(
        provider_type=provider.type.value,
        base_url=provider.base_url,
        api_key=None,  # Decrypted on-demand
        timeout=None,
        max_retries=None,
        metadata=None,
    )
```

### 7.3 PydanticAI Adapter (Infrastructure Layer)

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/llm/infrastructure/adapters/pydantic_ai/adapter.py`

**Purpose:** Translate domain operations to PydanticAI framework calls

```python
class PydanticAIFramework:
    def __init__(self):
        # Registry of provider-specific factories
        self._factories: dict[str, ModelFactory] = {
            "ollama": OllamaModelFactory(),
            "openai": OpenAIModelFactory(),
        }

    async def create_agent(
        config: AgentConfig,           # Domain config
        provider_config: ProviderConfig
    ) -> LLMAgent[Any]:
        # 1. Select factory for provider type
        factory = self._factories.get(provider_config.provider_type)

        # 2. Create model via factory
        model = await factory.create_model(
            provider_config,
            config.model_name
        )

        # 3. Convert domain config to PydanticAI settings
        model_settings = agent_config_to_model_settings(config)

        # 4. Create PydanticAI agent
        pydantic_agent = PydanticAgent(
            model=model,
            output_type=config.output_type or str,
            system_prompt=config.system_prompt or "",
            deps_type=config.deps_type or type(None),
            model_settings=model_settings,
        )

        # 5. Wrap in domain protocol
        wrapper = PydanticAIAgentWrapper(pydantic_agent, config)
        return wrapper

    def supports_streaming(self) -> bool:
        return True  # PydanticAI supports streaming

    def supports_tools(self) -> bool:
        return True  # PydanticAI supports tool calling
```

**Model Factories:**

**Ollama Factory:**
```python
class OllamaModelFactory:
    async def create_model(
        provider_config: ProviderConfig,
        model_name: str
    ) -> OpenAIChatModel:
        ollama_provider = OllamaProvider(
            base_url=provider_config.base_url
        )

        return OpenAIChatModel(
            model_name=model_name,
            provider=ollama_provider,
        )
```

**OpenAI Factory:**
```python
class OpenAIModelFactory:
    async def create_model(
        provider_config: ProviderConfig,
        model_name: str
    ) -> OpenAIChatModel:
        openai_provider = OpenAIProvider(
            api_key=provider_config.api_key
        )

        return OpenAIChatModel(
            model_name=model_name,
            provider=openai_provider,
        )
```

---

## 8. Agent Testing

### 8.1 AgentTestService

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/services/agent_service.py`

**Purpose:** Test agent configurations with custom prompts

```python
class AgentTestService:
    async def test_agent(
        agent_id: UUID,
        test_prompt: str
    ) -> TestAgentResponse:
        # 1. Load agent configuration
        agent = await session.get(AgentConfig, agent_id)

        # 2. Load associated provider
        provider = await session.get(LLMProvider, agent.provider_id)

        # 3. Verify provider is active and validated
        if not provider.is_active:
            raise ValueError("Provider is inactive")

        if provider.validation_status != ValidationStatus.connected:
            raise ValueError("Provider not validated")

        # 4. Decrypt API key if needed
        api_key = None
        if provider.api_key_encrypted:
            api_key = self.encryptor.decrypt(provider.api_key_encrypted)

        # 5. Build model instance
        model = self._build_model_instance(provider, agent.model_name, api_key)

        # 6. Create PydanticAI agent
        pydantic_agent = PydanticAgent(
            model=model,
            system_prompt=agent.system_prompt,
        )

        # 7. Build model settings
        model_settings = {}
        if agent.temperature is not None:
            model_settings["temperature"] = agent.temperature
        if agent.max_tokens is not None:
            model_settings["max_tokens"] = agent.max_tokens

        # 8. Run the agent
        start_time = time.time()
        result = await pydantic_agent.run(
            test_prompt,
            model_settings=model_settings,
        )
        elapsed_time = time.time() - start_time

        # 9. Return response with metadata
        return TestAgentResponse(
            agent_id=agent.id,
            agent_name=agent.name,
            prompt=test_prompt,
            response=str(result.output),
            elapsed_time=elapsed_time,
            model_name=agent.model_name,
            provider_name=provider.name,
            provider_type=provider.type.value,
        )
```

**Test Response Schema:**
```python
class TestAgentResponse(BaseModel):
    agent_id: UUID
    agent_name: str
    prompt: str
    response: str                  # Agent's LLM response
    elapsed_time: float            # Execution time (seconds)
    model_name: str
    provider_name: str
    provider_type: str
```

### 8.2 Testing API Endpoint

**Endpoint:** `POST /api/v1/agents/{agent_id}/test`

**Request:**
```json
{
  "prompt": "Classify this message: The app crashed when I logged in"
}
```

**Response:**
```json
{
  "agent_id": "123e4567-e89b-12d3-a456-426614174000",
  "agent_name": "Message Classifier",
  "prompt": "Classify this message: The app crashed when I logged in",
  "response": "{\"category\": \"bug\", \"confidence\": 0.95, \"reasoning\": \"User reported a crash, which is a bug\"}",
  "elapsed_time": 2.34,
  "model_name": "llama3",
  "provider_name": "Ollama Local",
  "provider_type": "ollama"
}
```

---

## 9. Usage in Analysis Runs

### 9.1 AnalysisRun Model

**Location:** `/Users/maks/PycharmProjects/task-tracker/backend/app/models/analysis_run.py`

**Key Fields:**
```python
class AnalysisRun(SQLModel, table=True):
    id: UUID

    # Agent Assignment Reference
    agent_assignment_id: UUID   # FK to agent_task_assignments.id

    # Configuration Snapshot (for reproducibility)
    config_snapshot: dict       # JSONB - full config at run time

    # Time Window
    time_window_start: datetime
    time_window_end: datetime

    # Lifecycle
    status: str                 # pending|running|completed|failed
    started_at: datetime | None
    completed_at: datetime | None

    # Metrics
    proposals_total: int
    proposals_approved: int
    proposals_rejected: int
    llm_tokens_used: int
    cost_estimate: float
```

### 9.2 Analysis Execution Flow

**High-Level Process:**
```
1. User creates AnalysisRun with agent_assignment_id
   ├─ Assignment links to agent_config + task_config
   ├─ Snapshot captures full configuration
   └─ Status set to 'pending'

2. User starts run: POST /api/v1/analysis/runs/{run_id}/start
   ├─ Background job triggered
   └─ Status → 'running'

3. Background Job: execute_analysis_run(run_id)
   ├─ Load agent_assignment from database
   ├─ Load agent_config and task_config
   ├─ AgentRegistry.get_or_create(agent_config, task_config)
   │   ├─ Returns cached agent if exists
   │   └─ Creates new agent instance if needed
   │
   ├─ Fetch approved topics/atoms in time window
   ├─ Build knowledge context
   ├─ Create batches
   │
   ├─ For each batch:
   │   ├─ Build prompt with context
   │   ├─ Execute: result = await agent.run(prompt)
   │   ├─ Validate response against task_config.response_schema
   │   ├─ Store TaskProposal records
   │   └─ Update metrics
   │
   └─ Status → 'completed'

4. Results stored as TaskProposals
   ├─ Source: approved topics/atoms (not raw messages)
   ├─ Structured output validated by response_schema
   └─ Linked to analysis_run_id
```

**Code Example:**
```python
async def execute_analysis_run(run_id: UUID):
    # 1. Load run configuration
    run = await session.get(AnalysisRun, run_id)

    # 2. Load agent assignment
    assignment = await session.get(
        AgentTaskAssignment,
        run.agent_assignment_id
    )

    # 3. Load agent and task configs
    agent_config = await session.get(AgentConfig, assignment.agent_id)
    task_config = await session.get(TaskConfig, assignment.task_id)

    # 4. Get or create agent instance
    agent = await AgentRegistry().get_or_create(
        agent_config=agent_config,
        task_config=task_config
    )

    # 5. Fetch approved topics/atoms
    topics = await fetch_topics(run.time_window_start, run.time_window_end)
    atoms = await fetch_atoms(run.time_window_start, run.time_window_end)

    # 6. Build context from knowledge
    context = build_knowledge_context(topics, atoms)

    # 7. Create batches
    batches = create_batches(context, max_batch_size=50)

    # 8. Process each batch
    for batch in batches:
        # Build prompt
        prompt = build_prompt(batch, run.config_snapshot)

        # Execute agent
        result = await agent.run(prompt=prompt)

        # Validate output (automatic via task_config.response_schema)
        # result.output is already validated Pydantic model

        # Store proposals
        for proposal_data in result.output:
            proposal = TaskProposal(
                analysis_run_id=run.id,
                task_type=proposal_data.category,
                title=proposal_data.title,
                description=proposal_data.description,
                confidence=proposal_data.confidence,
                # ...
            )
            session.add(proposal)

        # Update metrics
        run.llm_tokens_used += result.usage.total_tokens
        run.proposals_total += len(result.output)

    # 9. Complete run
    run.status = "completed"
    run.completed_at = datetime.now(UTC)
    await session.commit()
```

---

## 10. API Endpoints Summary

### 10.1 LLM Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/providers` | Create LLM provider |
| GET | `/api/v1/providers` | List all providers |
| GET | `/api/v1/providers/{id}` | Get provider by ID |
| PUT | `/api/v1/providers/{id}` | Update provider |
| DELETE | `/api/v1/providers/{id}` | Delete provider |
| POST | `/api/v1/providers/{id}/validate` | Manually trigger validation |
| GET | `/api/v1/providers/ollama/models` | List Ollama models |

### 10.2 Agent Configurations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents` | Create agent configuration |
| GET | `/api/v1/agents` | List all agents (with filters) |
| GET | `/api/v1/agents/{id}` | Get agent by ID |
| PUT | `/api/v1/agents/{id}` | Update agent configuration |
| DELETE | `/api/v1/agents/{id}` | Delete agent configuration |
| POST | `/api/v1/agents/{id}/test` | Test agent with custom prompt |

### 10.3 Task Configurations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks` | Create task configuration |
| GET | `/api/v1/tasks` | List all tasks |
| GET | `/api/v1/tasks/{id}` | Get task by ID |
| PUT | `/api/v1/tasks/{id}` | Update task configuration |
| DELETE | `/api/v1/tasks/{id}` | Delete task configuration |

### 10.4 Agent-Task Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agents/{agent_id}/tasks` | Assign task to agent |
| GET | `/api/v1/agents/{agent_id}/tasks` | List agent's tasks |
| DELETE | `/api/v1/agents/{agent_id}/tasks/{task_id}` | Unassign task |
| GET | `/api/v1/assignments` | List all assignments with details |
| GET | `/api/v1/tasks/{task_id}/agents` | List task's agents |

---

## 11. Key Design Decisions

### 11.1 Why Hexagonal Architecture?

**Benefits:**
- Framework independence (can swap PydanticAI for LangChain)
- Testability (mock adapters easily)
- Clear separation of concerns
- Domain logic isolated from infrastructure

**Structure:**
```
Domain (ports) ← Application (orchestration) → Infrastructure (adapters)
```

### 11.2 Why Agent Registry with Weak References?

**Problem:** Creating new agent instance for every request is expensive

**Solution:** Cache agents with weak references

**Benefits:**
- Performance: Reuse existing agents
- Memory efficiency: Automatic garbage collection
- Thread-safe: Async locks prevent race conditions
- No manual cleanup: Weak references self-clean

### 11.3 Why Agent-Task Assignment M2M?

**Flexibility:**
- One agent can handle multiple tasks
- One task can be handled by multiple agents
- Enables A/B testing (same task, different agents)
- Supports agent specialization

**Example Use Cases:**
```
Agent: "GPT-4 Classifier"
Tasks:
  - Message Classification
  - Bug Detection
  - Feature Extraction

Task: "Message Classification"
Agents:
  - GPT-4 Classifier (high accuracy)
  - Llama3 Classifier (low cost)
  - Claude Classifier (context-aware)
```

### 11.4 Why Separate AgentConfig from TaskConfig?

**Separation of Concerns:**
- AgentConfig: HOW to execute (model, prompts, settings)
- TaskConfig: WHAT to output (response schema, validation)

**Benefits:**
- Reusability: Same task with different agents
- Flexibility: Change model without changing output schema
- Maintainability: Update prompts independently of schemas

### 11.5 Why Configuration Snapshots in AnalysisRun?

**Problem:** Configuration changes invalidate reproducibility

**Solution:** Store full config snapshot in JSONB

**Benefits:**
- Reproducibility: Can recreate exact analysis conditions
- Auditability: See what config was used
- Versioning: Track config changes over time
- Recovery: Restore from snapshot if needed

---

## 12. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AGENT SYSTEM ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│  API Endpoints (FastAPI)                                            │
│  ├─ /api/v1/providers     (LLM provider management)                │
│  ├─ /api/v1/agents        (Agent configuration CRUD)               │
│  ├─ /api/v1/tasks         (Task configuration CRUD)                │
│  ├─ /api/v1/assignments   (Agent-task assignment)                  │
│  └─ /api/v1/agents/{id}/test (Agent testing)                       │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│  Services                                                            │
│  ├─ AgentCRUD               (Agent CRUD operations)                │
│  ├─ TaskCRUD                (Task CRUD operations)                 │
│  ├─ AssignmentCRUD          (Assignment CRUD operations)           │
│  ├─ ProviderCRUD            (Provider CRUD operations)             │
│  ├─ ProviderValidator       (Async provider validation)            │
│  ├─ AgentTestService        (Agent testing with LLM)              │
│  └─ CredentialEncryption    (API key encryption/decryption)        │
│                                                                      │
│  Agent Registry (Singleton)                                         │
│  ├─ get_or_create()         (Agent instance management)            │
│  ├─ Weak references         (Automatic garbage collection)         │
│  └─ Thread-safe locks       (Concurrent access protection)         │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    LLM LAYER (HEXAGONAL ARCHITECTURE)               │
├─────────────────────────────────────────────────────────────────────┤
│  Domain Layer (Ports - Framework Agnostic)                          │
│  ├─ LLMAgent[T]             (Agent interface)                      │
│  ├─ LLMFramework            (Framework interface)                  │
│  ├─ ModelFactory            (Model creation interface)             │
│  ├─ AgentConfig             (Domain agent config)                  │
│  ├─ ProviderConfig          (Domain provider config)               │
│  └─ AgentResult[T]          (Execution result)                     │
│                                                                      │
│  Application Layer (Orchestration)                                  │
│  ├─ LLMService              (High-level LLM operations)            │
│  ├─ ProviderResolver        (Provider lookup from DB/settings)     │
│  └─ FrameworkRegistry       (Framework selection)                  │
│                                                                      │
│  Infrastructure Layer (Adapters - Framework Specific)               │
│  ├─ PydanticAIFramework     (Implements LLMFramework)             │
│  ├─ PydanticAIAgentWrapper  (Implements LLMAgent)                 │
│  ├─ OllamaModelFactory      (Ollama model creation)               │
│  └─ OpenAIModelFactory      (OpenAI model creation)               │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          FRAMEWORK LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  PydanticAI (Current Implementation)                                │
│  ├─ Agent                   (PydanticAI agent)                     │
│  ├─ OllamaProvider          (Ollama integration)                   │
│  ├─ OpenAIProvider          (OpenAI integration)                   │
│  └─ OpenAIChatModel         (Model abstraction)                    │
│                                                                      │
│  Future: LangChain (via adapter)                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Models (SQLModel + PostgreSQL)                                     │
│  ├─ LLMProvider             (Provider credentials & config)        │
│  ├─ AgentConfig             (Agent definitions)                    │
│  ├─ TaskConfig              (Task schemas)                         │
│  ├─ AgentTaskAssignment     (M2M relationship)                     │
│  └─ AnalysisRun             (Execution tracking)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────────────┤
│  LLM Providers                                                       │
│  ├─ Ollama (http://localhost:11434)                                │
│  └─ OpenAI (https://api.openai.com)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 13. Usage Examples

### 13.1 Complete Setup Flow

```python
# 1. Create LLM Provider
provider_response = requests.post("/api/v1/providers", json={
    "name": "Ollama Local",
    "type": "ollama",
    "base_url": "http://localhost:11434",
    "is_active": True
})
provider_id = provider_response.json()["id"]

# Wait for validation (WebSocket notification or polling)
# Status: pending → validating → connected

# 2. Create Agent Configuration
agent_response = requests.post("/api/v1/agents", json={
    "name": "Message Classifier",
    "description": "Classifies messages into categories",
    "provider_id": provider_id,
    "model_name": "llama3",
    "system_prompt": "You are a message classifier. Analyze and categorize messages.",
    "temperature": 0.7,
    "max_tokens": 500,
    "is_active": True
})
agent_id = agent_response.json()["id"]

# 3. Create Task Configuration
task_response = requests.post("/api/v1/tasks", json={
    "name": "Message Classification",
    "description": "Categorize messages",
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
    },
    "is_active": True
})
task_id = task_response.json()["id"]

# 4. Create Agent-Task Assignment
assignment_response = requests.post(
    f"/api/v1/agents/{agent_id}/tasks",
    json={
        "task_id": task_id,
        "is_active": True
    }
)
assignment_id = assignment_response.json()["id"]

# 5. Test Agent
test_response = requests.post(
    f"/api/v1/agents/{agent_id}/test",
    json={
        "prompt": "The app crashes when I log in on iOS"
    }
)
# Response:
# {
#   "agent_id": "...",
#   "agent_name": "Message Classifier",
#   "prompt": "The app crashes when I log in on iOS",
#   "response": "{\"category\": \"bug\", \"confidence\": 0.95}",
#   "elapsed_time": 2.34,
#   "model_name": "llama3",
#   "provider_name": "Ollama Local",
#   "provider_type": "ollama"
# }

# 6. Create Analysis Run
run_response = requests.post("/api/v1/analysis/runs", json={
    "agent_assignment_id": assignment_id,
    "time_window_start": "2025-10-01T00:00:00Z",
    "time_window_end": "2025-10-26T23:59:59Z",
    "trigger_type": "manual"
})
run_id = run_response.json()["id"]

# 7. Start Analysis Run
start_response = requests.post(f"/api/v1/analysis/runs/{run_id}/start")
# Background job triggered
# Agent instance created/cached by AgentRegistry
# Processes topics/atoms → generates TaskProposals
```

### 13.2 Agent Testing Example

```python
# Test agent with custom prompt before using in production
test_response = requests.post(
    f"/api/v1/agents/{agent_id}/test",
    json={
        "prompt": "How do I reset my password?"
    }
)

print(test_response.json())
# {
#   "agent_id": "123e4567-e89b-12d3-a456-426614174000",
#   "agent_name": "Message Classifier",
#   "prompt": "How do I reset my password?",
#   "response": "{\"category\": \"question\", \"confidence\": 0.92}",
#   "elapsed_time": 1.87,
#   "model_name": "llama3",
#   "provider_name": "Ollama Local",
#   "provider_type": "ollama"
# }
```

### 13.3 Multiple Agents for Same Task (A/B Testing)

```python
# Create multiple agents for same task
agents = [
    {"name": "GPT-4 Classifier", "model": "gpt-4", "provider": openai_id},
    {"name": "Llama3 Classifier", "model": "llama3", "provider": ollama_id},
    {"name": "Claude Classifier", "model": "claude-3", "provider": anthropic_id}
]

for agent_data in agents:
    # Create agent
    agent = requests.post("/api/v1/agents", json=agent_data)
    agent_id = agent.json()["id"]

    # Assign to same task
    requests.post(
        f"/api/v1/agents/{agent_id}/tasks",
        json={"task_id": task_id}
    )

# Run parallel analysis runs with different agents
# Compare accuracy, cost, speed
```

---

## 14. Files Reference

### 14.1 Models

| File | Description |
|------|-------------|
| `/backend/app/models/llm_provider.py` | LLM provider configuration and validation |
| `/backend/app/models/agent_config.py` | Agent configuration with prompts |
| `/backend/app/models/task_config.py` | Task configuration with response schema |
| `/backend/app/models/agent_task_assignment.py` | M2M assignment relationship |
| `/backend/app/models/analysis_run.py` | Analysis execution tracking |

### 14.2 Services

| File | Description |
|------|-------------|
| `/backend/app/services/provider_crud.py` | Provider CRUD operations |
| `/backend/app/services/provider_validator.py` | Async provider validation |
| `/backend/app/services/agent_crud.py` | Agent CRUD operations |
| `/backend/app/services/assignment_crud.py` | Assignment CRUD operations |
| `/backend/app/services/agent_registry.py` | Agent instance caching |
| `/backend/app/services/agent_service.py` | Agent testing service |
| `/backend/app/services/credential_encryption.py` | API key encryption |

### 14.3 LLM Layer

| File | Description |
|------|-------------|
| `/backend/app/llm/domain/ports.py` | Interface definitions (ports) |
| `/backend/app/llm/domain/models.py` | Domain models |
| `/backend/app/llm/application/llm_service.py` | High-level LLM service |
| `/backend/app/llm/application/provider_resolver.py` | Provider lookup |
| `/backend/app/llm/application/framework_registry.py` | Framework selection |
| `/backend/app/llm/infrastructure/adapters/pydantic_ai/adapter.py` | PydanticAI adapter |
| `/backend/app/llm/infrastructure/adapters/pydantic_ai/factories/ollama.py` | Ollama factory |
| `/backend/app/llm/infrastructure/adapters/pydantic_ai/factories/openai.py` | OpenAI factory |

### 14.4 API Endpoints

| File | Description |
|------|-------------|
| `/backend/app/api/v1/providers.py` | Provider management endpoints |
| `/backend/app/api/v1/agents.py` | Agent management endpoints |
| `/backend/app/api/v1/tasks.py` | Task management endpoints |

---

## 15. Future Enhancements

### 15.1 Planned Features

1. **Schema Generator (T033)**
   - Generate Pydantic models from JSON Schema
   - Type-safe output validation
   - Automatic model registration

2. **LangChain Adapter**
   - Alternative framework support
   - Framework switching via configuration
   - Maintains hexagonal architecture

3. **Agent Performance Metrics**
   - Track token usage per agent
   - Monitor response times
   - Cost analysis by agent

4. **Dynamic System Prompts**
   - Template-based prompts
   - Variable substitution
   - Context injection

5. **Agent Versioning**
   - Track configuration changes
   - Rollback support
   - A/B testing framework

---

## 16. Summary

### Agent Configuration Workflow
1. Create LLM Provider → Validate connection
2. Create Agent Config → Define model, prompts, settings
3. Create Task Config → Define output schema
4. Create Assignment → Link agent to task
5. Execute → AgentRegistry creates/caches instance

### LLM Provider Options
- **Ollama** (local): Requires base_url
- **OpenAI** (cloud): Requires encrypted api_key
- Future: Anthropic, Google, custom providers

### Assignment Process
- M2M relationship: One agent ↔ Many tasks
- Unique constraint: One assignment per agent+task pair
- Triggers agent instantiation on first use

### API Endpoints
- **16+ endpoints** across providers, agents, tasks, assignments
- CRUD operations for all entities
- Agent testing endpoint for validation

### Services & Architecture
- **Hexagonal architecture** for framework independence
- **Agent Registry** with weak references for caching
- **Provider validation** with async background tasks
- **Credential encryption** for secure API key storage

---

**Report Complete**
**Investigation Duration:** 30 minutes
**Files Analyzed:** 15+
**Report Location:** `/Users/maks/PycharmProjects/task-tracker/.artifacts/documentation-overhaul/features/4-system-documentation/sessions/20251026_030540/agent-reports/agent-system-investigation.md`
