# Research: LLM Agent Management System

**Feature**: 001-pydanticai
**Date**: 2025-10-04
**Status**: Complete

## Research Questions

### 1. PydanticAI Integration Strategy

**Decision**: Use PydanticAI's agent configuration system with dynamic schema injection

**Rationale**:
- PydanticAI supports runtime schema definition via `result_type` parameter
- Allows storing Pydantic schemas as JSON in database
- Can dynamically instantiate agents with different schemas per task
- Maintains type safety through Pydantic validation

**Alternatives Considered**:
- **Hardcoded agent types**: Too inflexible; requires code changes for new tasks
- **Custom LLM wrapper**: Reinventing wheel; PydanticAI provides structured outputs already
- **LangChain**: Heavier dependency; PydanticAI more focused on Pydantic integration

**Implementation Approach**:
```python
# Runtime schema generation from stored JSON
schema_dict = json.loads(task_config.response_schema)
ResponseModel = create_model_from_dict(schema_dict)
agent = Agent(model=provider_model, result_type=ResponseModel)
```

### 2. Agent Instance Registry Pattern

**Decision**: Implement singleton registry with weak references to agent instances

**Rationale**:
- Prevents duplicate instantiations for identical agent+task combinations
- Weak references allow garbage collection when instances no longer needed
- Thread-safe with async locks for concurrent access
- Aligns with constitutional principle IV (Type Safety & Async First)

**Alternatives Considered**:
- **Database-backed registry**: Too slow for frequent lookups; adds DB overhead
- **Redis cache**: Unnecessary external dependency for in-process state
- **No registry (always create new)**: Wastes resources; violates FR-010

**Implementation Approach**:
```python
class AgentRegistry:
    _instances: Dict[Tuple[int, int], weakref.ref] = {}  # (agent_id, task_id)
    _lock = asyncio.Lock()

    async def get_or_create(self, agent_config, task_config):
        async with self._lock:
            key = (agent_config.id, task_config.id)
            if key in self._instances:
                instance = self._instances[key]()
                if instance: return instance
            # Create new instance
```

### 3. Provider Credential Encryption

**Decision**: Use Fernet symmetric encryption with key from environment variable

**Rationale**:
- Simple symmetric encryption sufficient for database-at-rest protection
- Fast encryption/decryption for API operations
- Key rotation supported via environment variable update
- Aligns with constitutional Security Requirements

**Alternatives Considered**:
- **Database-level encryption**: Limited granularity; encrypts all or nothing
- **AWS KMS**: Over-engineered for local/containerized deployment
- **Plaintext with PostgreSQL SSL**: Insufficient; doesn't protect data at rest

**Implementation Approach**:
```python
from cryptography.fernet import Fernet
cipher = Fernet(os.getenv("ENCRYPTION_KEY"))
encrypted = cipher.encrypt(api_key.encode())
# Store encrypted bytes in database
```

### 4. Async Provider Validation Pattern

**Decision**: Use TaskIQ background tasks triggered by save operation

**Rationale**:
- Non-blocking API response (constitutional principle II: Event-Driven)
- Leverages existing NATS infrastructure
- Results stored in database, updates via WebSocket
- Retry logic handled by TaskIQ

**Alternatives Considered**:
- **Synchronous validation in API**: Blocks user; unacceptable UX
- **Celery**: Redundant with existing TaskIQ setup
- **Threading**: Less robust than TaskIQ for distributed systems

**Implementation Approach**:
```python
@broker.task
async def validate_provider(provider_id: int):
    # Attempt connection to provider
    # Update validation_status in database
    # Broadcast status via WebSocket
```

### 5. Pydantic Schema Storage Format

**Decision**: Store schemas as JSON with `$schema` metadata for validation

**Rationale**:
- JSON Schema compatible with Pydantic
- Allows frontend JSON editor with validation
- Can validate schema syntax before saving (FR-029)
- Portable across language boundaries

**Alternatives Considered**:
- **Python AST as string**: Not portable; hard to edit in UI
- **YAML**: Less standard for schemas; extra parsing
- **GraphQL SDL**: Wrong abstraction layer; Pydantic is Python-native

**Implementation Approach**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "classification": {"type": "string", "enum": ["bug", "feature", "question"]},
    "confidence": {"type": "number", "minimum": 0, "maximum": 1}
  },
  "required": ["classification"]
}
```

### 6. Frontend Schema Editor Component

**Decision**: Use card-based form UI with select inputs for schema definition

**Rationale**:
- Consistent with existing dashboard card-based design
- User-friendly for non-technical users
- Select dropdowns for type, enum values, required fields
- Dynamic field addition for properties
- JSON preview (read-only) for verification
- No code editor dependency needed

**Alternatives Considered**:
- **Monaco Editor**: Overkill; assumes technical users; extra dependency
- **Plain textarea**: Poor UX; no validation feedback
- **CodeMirror**: Less feature-rich than Monaco

**Implementation Approach**:
```tsx
// Card-based schema builder
<SchemaCard>
  <SelectInput label="Type" options={["string", "number", "object", "array"]} />
  <DynamicFields label="Properties" onAdd={addProperty} />
  <MultiSelect label="Required" options={propertyNames} />
  <JsonPreview schema={generatedSchema} readOnly />
</SchemaCard>
```

### 7. WebSocket Event Subscription Model

**Decision**: Topic-based subscriptions (agents, tasks, providers)

**Rationale**:
- Clients subscribe only to relevant updates
- Reduces bandwidth for large deployments
- Aligns with constitutional principle V (Real-Time Capabilities)
- Scales better than broadcast-all approach

**Alternatives Considered**:
- **Broadcast all events**: Wasteful; clients filter manually
- **Per-entity subscriptions**: Too granular; connection overhead
- **Polling**: Not real-time; violates constitutional principle

**Implementation Approach**:
```python
# Backend
await ws_manager.broadcast(topic="agents", data={"event": "created", ...})

# Frontend
socket.on('agents', (data) => { /* update UI */ });
```

## Technology Stack Decisions

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Backend ORM** | SQLModel + async SQLAlchemy | Constitutional principle IV; existing pattern |
| **Agent Framework** | PydanticAI | Native Pydantic integration; structured outputs |
| **Encryption** | Cryptography (Fernet) | Simple, secure, Python-native |
| **Background Jobs** | TaskIQ + NATS | Constitutional principle II; existing infrastructure |
| **WebSocket** | FastAPI WebSocket + socket.io-client | Constitutional principle V; existing pattern |
| **Frontend State** | React Hooks + Context API | Lightweight; no Redux needed for this feature |
| **Schema Editor** | Card-based form UI | Consistent with dashboard design; user-friendly |
| **API Validation** | Pydantic v2 | Constitutional principle IV |

## Performance Considerations

1. **Agent Instance Caching**: Registry reduces instantiation overhead (~50-100ms per agent)
2. **Database Indexes**: Add indexes on `agent_config.name`, `task_config.name`, `llm_provider.type`
3. **WebSocket Throttling**: Debounce rapid status updates (max 10/sec per topic)
4. **Schema Validation**: Cache compiled Pydantic models to avoid re-parsing JSON schemas

## Security Considerations

1. **Credential Encryption**: Fernet encryption for API keys at rest
2. **Environment Isolation**: Encryption key never in database or logs
3. **Input Validation**: Pydantic validates all API inputs; JSON Schema validates task schemas
4. **Rate Limiting**: Apply to provider validation endpoints to prevent DoS

## Open Questions for Implementation

1. **Schema versioning**: How to handle task schema evolution? (deferred to implementation)
2. **Agent instance lifecycle**: When to garbage collect inactive instances? (deferred to implementation)
3. **Provider health monitoring**: Periodic re-validation of providers? (future enhancement)
4. **Audit logging**: Track agent/task configuration changes? (future enhancement)

## Conclusion

All technical unknowns resolved. Stack aligns with constitutional principles. Ready for Phase 1 (Design & Contracts).
