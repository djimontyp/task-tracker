# API Documentation Comparison - Quick Reference

## Critical Mismatches

### 1. Request Parameter: provider_id vs agent_config_id

**Documented:**
```json
{
  "message_ids": [1, 2, 3],
  "provider_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Actual:**
```json
{
  "message_ids": [1, 2, 3],
  "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Or with period-based selection (UNDOCUMENTED):**
```json
{
  "period": {
    "period_type": "last_24h",
    "topic_id": 5
  },
  "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 2. WebSocket Endpoint

**Documented:**
```
ws://localhost:8000/ws/knowledge
```

**Actual:**
```
ws://localhost:8000/ws?topics=knowledge

// Client must subscribe to "knowledge" topic after connecting
{
  "action": "subscribe",
  "topic": "knowledge"
}
```

---

### 3. WebSocket Events

| Event | Documented | Actual | Status |
|-------|-----------|--------|--------|
| extraction_started | provider_id | agent_config_id, agent_name | ❌ Different |
| topic_created | ✓ | ✓ | ✓ Match |
| atom_created | ✓ | ✓ | ✓ Match |
| extraction_completed | 5 fields | 5 fields + 2 new | ⚠️ Extended |
| version_created | - | NEW | ❌ Undocumented |
| extraction_failed | ✓ | ✓ | ✓ Match |

---

### 4. Missing Documentation

#### Feature: Period-Based Selection
Allows extracting knowledge from messages within time periods without specifying IDs.

```python
class PeriodRequest(BaseModel):
    period_type: Literal["last_24h", "last_7d", "last_30d", "custom"]
    topic_id: int | None  # Optional filter
    start_date: datetime | None  # For custom periods
    end_date: datetime | None  # For custom periods
```

#### Feature: Versioning
Automatic version creation for Topics and Atoms when extracted multiple times.

**New WebSocket Event:**
```json
{
  "type": "knowledge.version_created",
  "data": {
    "entity_type": "topic|atom",
    "entity_id": 123,
    "approved": false
  }
}
```

#### Feature: Related CRUD Operations
Topics and Atoms can be managed separately, but not documented in Knowledge API.

**Available Endpoints:**
- GET /api/v1/topics
- POST /api/v1/topics
- GET /api/v1/atoms
- POST /api/v1/atoms
- And more...

---

## Architecture Change: From Provider to AgentConfig

**Documented Model:**
```
API Request → LLMProvider → Knowledge Extraction
```

**Actual Model:**
```
API Request → AgentConfig → LLMProvider → Knowledge Extraction
```

This is a more flexible architecture allowing:
- Multiple agent configurations per provider
- Different extraction strategies per agent
- Version history per agent

---

## Error Handling Differences

### Documented
```
404 Provider Not Found: Provider {provider_id} not found
422 Provider Not Active: Provider '{name}' is not active
```

### Actual
```
404 Agent Config Not Found: Agent config {agent_config_id} not found
400 Agent Config Not Active: Agent config '{name}' is not active
```

Note: Status code differs (422 → 400)

---

## Data Flow Comparison

### Documented Flow
```
POST /api/v1/knowledge/extract
├── Input: message_ids[], provider_id
├── Validation: Check provider exists and is active
├── Queue Task: Background extraction
└── Output: message_count, provider_id
```

### Actual Flow
```
POST /api/v1/knowledge/extract
├── Input: (message_ids[] OR period), agent_config_id
├── Validation: Check agent_config exists and is active
├── Message Selection: Filter by IDs or period
├── Queue Task: Background extraction
└── Output: message_count, agent_config_id
```

---

## Integration Code: Before vs After

### Before (Based on Documentation)
```typescript
const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
  method: 'POST',
  body: JSON.stringify({
    message_ids: [1, 2, 3, 4, 5],
    provider_id: '550e8400-e29b-41d4-a716-446655440000'
  })
});
```

### After (Using Actual Implementation)
```typescript
const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
  method: 'POST',
  body: JSON.stringify({
    message_ids: [1, 2, 3, 4, 5],
    agent_config_id: '550e8400-e29b-41d4-a716-446655440000'
  })
});

// For WebSocket: Subscribe to knowledge topic
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    topic: 'knowledge'
  }));
};
```

---

## Validation Rules

### Documented
| Rule | Description |
|------|-------------|
| message_ids | Required, 1-100 items |
| provider_id | Required UUID, must exist and be active |

### Actual
| Rule | Description |
|------|-------------|
| message_ids | Optional, 1-100 items |
| period | Optional, mutually exclusive with message_ids |
| agent_config_id | Required UUID, must exist and be active |
| At least one of message_ids or period | Must provide selection method |

---

## Breaking Changes for Integrations

If integrating based on documentation, the following will fail:

1. ❌ Using `provider_id` instead of `agent_config_id`
2. ❌ Not subscribing to topic after WebSocket connection
3. ❌ Expecting `provider_id` in response and events
4. ❌ Handling 422 status code instead of 400 for inactive config
5. ❌ Assuming direct `/ws/knowledge` endpoint exists

---

## Recommended Actions

1. **Update Documentation**
   - [ ] Change `provider_id` → `agent_config_id`
   - [ ] Document period-based selection
   - [ ] Correct WebSocket endpoint and subscription method
   - [ ] Document versioning features

2. **Update Examples**
   - [ ] Fix TypeScript/React examples
   - [ ] Fix Python examples
   - [ ] Fix cURL examples

3. **Consider API Versioning**
   - [ ] Maintain backward compatibility or
   - [ ] Clearly mark as breaking changes in release notes

4. **Add Validation Tests**
   - [ ] Test with different message selection methods
   - [ ] Test WebSocket event subscriptions
   - [ ] Test versioning behavior

