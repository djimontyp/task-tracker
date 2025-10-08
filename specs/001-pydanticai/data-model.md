# Data Model: LLM Agent Management System

**Feature**: 001-pydanticai
**Date**: 2025-10-04
**Database**: PostgreSQL (async SQLAlchemy + SQLModel)

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  LLMProvider    │       │  AgentConfig     │       │  TaskConfig     │
│─────────────────│       │──────────────────│       │─────────────────│
│ id (PK)         │◄──┐   │ id (PK)          │   ┌──►│ id (PK)         │
│ name (unique)   │   │   │ name (unique)    │   │   │ name (unique)   │
│ type (enum)     │   └───│ provider_id (FK) │   │   │ description     │
│ base_url        │       │ description      │   │   │ request_schema  │
│ api_key_enc     │       │ system_prompt    │   │   │ response_schema │
│ is_active       │       │ user_prompt      │   │   │ created_at      │
│ validation_*    │       │ model_name       │   │   │ updated_at      │
│ created_at      │       │ tools_config     │   │   └─────────────────┘
│ updated_at      │       │ created_at       │   │            ▲
└─────────────────┘       │ updated_at       │   │            │
                          └──────────────────┘   │            │
                                   │             │            │
                                   │             │            │
                                   │  M:N        │            │
                                   │             │            │
                                   ▼             │            │
                          ┌──────────────────┐   │            │
                          │ AgentTaskAssign  │───┘            │
                          │──────────────────│                │
                          │ id (PK)          │                │
                          │ agent_id (FK)    │────────────────┘
                          │ task_id (FK)     │
                          │ is_active        │
                          │ assigned_at      │
                          └──────────────────┘
```

## Entities

### 1. LLMProvider

**Purpose**: Store LLM provider configurations (Ollama, OpenAI)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Provider name (e.g., "Ollama Local", "OpenAI GPT-4") |
| `type` | ENUM | NOT NULL | Provider type: `ollama` or `openai` |
| `base_url` | VARCHAR(255) | NULLABLE | Base URL for provider (required for Ollama, null for OpenAI) |
| `api_key_encrypted` | BYTEA | NULLABLE | Encrypted API key (null for Ollama, required for OpenAI) |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether provider is active |
| `validation_status` | ENUM | NOT NULL | Status: `pending`, `validating`, `connected`, `error` |
| `validation_error` | TEXT | NULLABLE | Last validation error message |
| `validated_at` | TIMESTAMP | NULLABLE | Last successful validation timestamp |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_provider_type` on `type`
- `idx_provider_active` on `is_active`

**Validation Rules**:
- If `type = 'ollama'`: `base_url` required, `api_key_encrypted` null
- If `type = 'openai'`: `api_key_encrypted` required, `base_url` null
- `name` globally unique across all providers

**State Transitions** (`validation_status`):
```
pending → validating → connected
                    ↘ error
```

---

### 2. AgentConfig

**Purpose**: Store LLM agent configurations (prompts, model, provider)

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Agent name (e.g., "Message Classifier", "Entity Extractor") |
| `description` | TEXT | NULLABLE | Optional agent description |
| `provider_id` | UUID | FOREIGN KEY(LLMProvider.id), NOT NULL | Associated LLM provider |
| `system_prompt` | TEXT | NOT NULL | System prompt for agent |
| `user_prompt` | TEXT | NULLABLE | Optional default user prompt template |
| `model_name` | VARCHAR(100) | NOT NULL | Model identifier (e.g., "gpt-4", "llama3") |
| `tools_config` | JSONB | NULLABLE | Future: tool configurations for PydanticAI |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_agent_name` on `name`
- `idx_agent_provider` on `provider_id`

**Validation Rules**:
- `name` globally unique
- `system_prompt` required (non-empty string)
- `model_name` required (non-empty string)
- `provider_id` must reference active provider

**Relationships**:
- **Many-to-One** with `LLMProvider`: Each agent uses one provider
- **Many-to-Many** with `TaskConfig` via `AgentTaskAssignment`

---

### 3. TaskConfig

**Purpose**: Store task configurations with Pydantic schemas for structured I/O

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Task name (e.g., "Classify Message", "Extract Entities") |
| `description` | TEXT | NULLABLE | Optional task description |
| `request_schema` | JSONB | NULLABLE | JSON Schema for request structure (if applicable) |
| `response_schema` | JSONB | NOT NULL | JSON Schema for response structure (Pydantic model) |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes**:
- `idx_task_name` on `name`

**Validation Rules**:
- `name` globally unique
- `response_schema` required (valid JSON Schema)
- `response_schema` must be valid JSON Schema Draft 7 format
- Schemas validated before save using `jsonschema` library

**Relationships**:
- **Many-to-Many** with `AgentConfig` via `AgentTaskAssignment`

**Example `response_schema`**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "MessageClassification",
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
}
```

---

### 4. AgentTaskAssignment

**Purpose**: Many-to-many relationship between agents and tasks

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `agent_id` | UUID | FOREIGN KEY(AgentConfig.id), NOT NULL | Associated agent |
| `task_id` | UUID | FOREIGN KEY(TaskConfig.id), NOT NULL | Associated task |
| `is_active` | BOOLEAN | DEFAULT TRUE | Whether assignment is active |
| `assigned_at` | TIMESTAMP | NOT NULL | Assignment timestamp |

**Indexes**:
- `idx_assignment_agent` on `agent_id`
- `idx_assignment_task` on `task_id`
- `idx_assignment_active` on `is_active`
- `idx_assignment_composite` on `(agent_id, task_id)` (UNIQUE)

**Validation Rules**:
- Composite unique constraint on `(agent_id, task_id)`: One agent can't be assigned to same task twice
- `agent_id` must reference existing agent
- `task_id` must reference existing task

**Relationships**:
- **Many-to-One** with `AgentConfig`
- **Many-to-One** with `TaskConfig`

---

## Non-Persisted Entities (Runtime Only)

### AgentInstance

**Purpose**: Runtime representation of active agent loaded from configuration

**Structure** (in-memory, not in database):
```python
@dataclass
class AgentInstance:
    agent_config_id: UUID
    task_config_id: UUID
    agent: PydanticAgent  # PydanticAI agent instance
    response_model: Type[BaseModel]  # Dynamically generated Pydantic model
    created_at: datetime
    last_used_at: datetime
    use_count: int
```

**Lifecycle**:
- Created on first task execution for agent+task pair
- Cached in `AgentRegistry` with weak reference
- Garbage collected when no longer referenced and registry cleanup runs

---

## Schema Evolution Strategy

### Adding New Fields
1. Create Alembic migration with nullable defaults
2. Update SQLModel classes
3. Update API contracts
4. Frontend types updated automatically from OpenAPI

### Changing Schemas (TaskConfig)
- Task schemas are versioned via `updated_at` timestamp
- Running agent instances use schema from assignment time
- New task executions use latest schema
- No automatic migration of old task results

### Deleting Entities
- **LLMProvider**: Soft delete (set `is_active = FALSE`) if agents reference it
- **AgentConfig**: Hard delete allowed; running instances complete independently (per FR-032)
- **TaskConfig**: Soft delete (prevent deletion if assignments exist)
- **AgentTaskAssignment**: Hard delete allowed when `is_active = FALSE`

---

## Database Constraints Summary

| Constraint Type | Entity | Fields | Purpose |
|----------------|--------|--------|---------|
| UNIQUE | LLMProvider | name | Prevent duplicate provider names |
| UNIQUE | AgentConfig | name | Prevent duplicate agent names |
| UNIQUE | TaskConfig | name | Prevent duplicate task names |
| UNIQUE | AgentTaskAssignment | (agent_id, task_id) | Prevent duplicate assignments |
| CHECK | LLMProvider | type IN ('ollama', 'openai') | Enum enforcement |
| CHECK | LLMProvider | (type='ollama' AND base_url IS NOT NULL) OR (type='openai' AND api_key_encrypted IS NOT NULL) | Type-specific requirements |
| FOREIGN KEY | AgentConfig | provider_id → LLMProvider.id | Referential integrity |
| FOREIGN KEY | AgentTaskAssignment | agent_id → AgentConfig.id | Referential integrity |
| FOREIGN KEY | AgentTaskAssignment | task_id → TaskConfig.id | Referential integrity |

---

## Migration Plan

### Initial Migration (`001_create_agent_tables`)
```sql
CREATE TABLE llm_providers (...);
CREATE TABLE agent_configs (...);
CREATE TABLE task_configs (...);
CREATE TABLE agent_task_assignments (...);
CREATE INDEX idx_provider_type ON llm_providers(type);
CREATE INDEX idx_provider_active ON llm_providers(is_active);
CREATE INDEX idx_agent_name ON agent_configs(name);
CREATE INDEX idx_agent_provider ON agent_configs(provider_id);
CREATE INDEX idx_task_name ON task_configs(name);
CREATE INDEX idx_assignment_composite ON agent_task_assignments(agent_id, task_id);
```

### Seed Data (for development)
```sql
-- Ollama local provider
INSERT INTO llm_providers (name, type, base_url, validation_status)
VALUES ('Ollama Local', 'ollama', 'http://localhost:11434', 'pending');

-- Example agent configuration
INSERT INTO agent_configs (name, provider_id, system_prompt, model_name)
VALUES ('Message Classifier', '<provider_id>', 'You are a message classification assistant...', 'llama3');

-- Example task configuration
INSERT INTO task_configs (name, response_schema)
VALUES ('Classify Message', '{"type":"object", "properties": {...}}');
```

---

## Data Access Patterns

### Common Queries
1. **List all active agents with provider info**:
   ```sql
   SELECT a.*, p.name as provider_name, p.type as provider_type
   FROM agent_configs a
   JOIN llm_providers p ON a.provider_id = p.id
   WHERE p.is_active = TRUE;
   ```

2. **Get agent's assigned tasks**:
   ```sql
   SELECT t.*
   FROM task_configs t
   JOIN agent_task_assignments ata ON t.id = ata.task_id
   WHERE ata.agent_id = ? AND ata.is_active = TRUE;
   ```

3. **Find agents for a specific task**:
   ```sql
   SELECT a.*
   FROM agent_configs a
   JOIN agent_task_assignments ata ON a.id = ata.agent_id
   WHERE ata.task_id = ? AND ata.is_active = TRUE;
   ```

### Performance Considerations
- Use `SELECT DISTINCT` carefully; indexes on foreign keys help
- Paginate list endpoints (max 1000 items per constitutional standard)
- Use `JOIN` instead of N+1 queries for agent+provider+tasks

---

## Conclusion

Data model complete with 4 database entities, proper normalization, indexes, and constraints. Aligns with constitutional principles (type safety, async operations, API-first). Ready for API contract generation.
