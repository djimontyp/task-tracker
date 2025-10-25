# API Documentation Audit - Detailed Findings

## Overview

This document provides comprehensive analysis of discrepancies between Knowledge Extraction API documentation and actual implementation.

**Audit Date:** October 24, 2025  
**Scope:** Documentation in `docs/content/en/api/knowledge.md` vs Implementation in `backend/app/`  
**Severity:** 5 Critical Issues, 3 Warnings

---

## Finding 1: Provider-to-AgentConfig Architectural Change

### Issue
The entire API documentation is based on a `provider_id` model, but the actual implementation uses `agent_config_id`. This represents a significant architectural change that's not documented.

### Evidence

**Documentation (knowledge.md:29-31):**
```typescript
{
  message_ids: number[],    // Required: 1-100 message IDs to analyze
  provider_id: string       // Required: UUID of active LLM provider
}
```

**Actual Code (knowledge.py:34-46):**
```python
class KnowledgeExtractionRequest(BaseModel):
    """Request schema for triggering knowledge extraction."""
    
    message_ids: list[int] | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Message IDs to analyze (1-100, 10-50 recommended). Mutually exclusive with period.",
    )
    period: PeriodRequest | None = Field(
        default=None, description="Period-based message selection. Mutually exclusive with message_ids."
    )
    agent_config_id: UUID = Field(description="Agent Config UUID to use for extraction")
```

### Impact
- **Breaking Change**: Any client using `provider_id` will fail with validation error
- **Architecture**: Suggests LLMProvider is accessed through AgentConfig, not directly
- **Flexibility**: Allows multiple agent configurations per provider

### Root Cause
The code evolved from direct provider usage to an abstraction layer through AgentConfig, but documentation wasn't updated.

### Recommendation
Update documentation to explain the AgentConfig model and why it's preferred over direct provider references.

---

## Finding 2: Period-Based Message Selection (Completely Undocumented)

### Issue
The API supports sophisticated period-based message filtering, but this feature is completely absent from documentation.

### Evidence

**Actual Code (knowledge.py:19-31):**
```python
class PeriodRequest(BaseModel):
    """Period-based message selection for knowledge extraction."""

    period_type: Literal["last_24h", "last_7d", "last_30d", "custom"] = Field(
        description="Time period type: last_24h, last_7d, last_30d, or custom"
    )
    topic_id: int | None = Field(default=None, description="Optional topic ID to filter messages")
    start_date: datetime | None = Field(
        default=None, description="Start date for custom period (timezone-aware, required for custom)"
    )
    end_date: datetime | None = Field(
        default=None, description="End date for custom period (timezone-aware, required for custom)"
    )
```

**Validation (knowledge.py:48-55):**
```python
@model_validator(mode="after")
def validate_message_selection(self) -> "KnowledgeExtractionRequest":
    """Ensure exactly one of message_ids or period is provided."""
    if self.message_ids is None and self.period is None:
        raise ValueError("Either message_ids or period must be provided")
    if self.message_ids is not None and self.period is not None:
        raise ValueError("Cannot specify both message_ids and period, choose one")
    return self
```

### Capabilities
- Extract from last 24 hours
- Extract from last 7 days
- Extract from last 30 days
- Custom date range with timezone support
- Optional filtering by topic_id within period

### Example Usage (Not in Docs)
```json
{
  "period": {
    "period_type": "last_7d",
    "topic_id": 5
  },
  "agent_config_id": "uuid"
}
```

or

```json
{
  "period": {
    "period_type": "custom",
    "start_date": "2025-10-17T00:00:00Z",
    "end_date": "2025-10-24T23:59:59Z"
  },
  "agent_config_id": "uuid"
}
```

### Impact
- Users cannot discover this feature from documentation
- Requires code inspection to learn about
- Very useful for automated extractions without manual message ID tracking

### Recommendation
Add comprehensive section documenting period-based selection with examples.

---

## Finding 3: WebSocket Endpoint Structure Mismatch

### Issue
Documentation describes a dedicated `/ws/knowledge` endpoint, but actual implementation uses a generic `/ws` endpoint with topic-based subscription.

### Evidence

**Documentation (knowledge.md:156):**
```
**URL:** `ws://localhost:8000/ws/knowledge`
```

**Actual Code (ws/router.py:10-35):**
```python
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, topics: str | None = None) -> None:
    """WebSocket endpoint with topic-based subscriptions.
    
    Query params:
        topics: Comma-separated list of topics to subscribe to
                (agents, tasks, providers, messages, analysis, proposals)
                If not specified, subscribes to all topics
    
    Message format (client to server):
        {"action": "subscribe", "topic": "agents"}
        {"action": "unsubscribe", "topic": "tasks"}
    """
    # ... implementation
```

**Supporting Topic List (ws/router.py:32):**
```python
topic_list = ["agents", "tasks", "providers", "messages", "analysis", "proposals"]
```

Note: "knowledge" topic is supported but not in the default list!

### How It Works (Actual)
1. Client connects to `ws://localhost:8000/ws`
2. Client sends: `{"action": "subscribe", "topic": "knowledge"}`
3. Client receives knowledge extraction events

### How Documentation Suggests It Works
1. Client connects to `ws://localhost:8000/ws/knowledge`
2. Client receives events immediately

### Code Example (Actual)
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    action: 'subscribe',
    topic: 'knowledge'
  }));
};

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  // Handle knowledge.extraction_started, etc.
};
```

### Impact
- Documented examples will not work
- Clients following documentation will not receive knowledge events
- Generic `/ws` endpoint design is actually more flexible

### Recommendation
Update documentation to explain the topic-based subscription model clearly.

---

## Finding 4: WebSocket Event Parameter Mismatch

### Issue
WebSocket events include different parameters than documented.

### Evidence

**Documentation (knowledge.md:206-212):**
```json
{
  "type": "knowledge.extraction_started",
  "data": {
    "message_count": 15,
    "provider_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Actual Code (tasks.py):**
```python
await websocket_manager.broadcast(
    "knowledge",
    {
        "type": "knowledge.extraction_started",
        "data": {
            "message_count": len(messages),
            "agent_config_id": agent_config_id,
            "agent_name": agent_config.name,
        },
    },
)
```

### Changes
- `provider_id` → `agent_config_id` (missing field)
- `+ agent_name` (undocumented new field)

### All Documented Events and Actual Implementation

#### extraction_started
| Field | Documented | Actual |
|-------|-----------|--------|
| message_count | ✓ | ✓ |
| provider_id | ✓ | ❌ |
| agent_config_id | ❌ | ✓ |
| agent_name | ❌ | ✓ |

#### extraction_completed
**Documented (knowledge.md:273-289):**
```json
{
  "message_count": 15,
  "topics_created": 2,
  "atoms_created": 8,
  "links_created": 5,
  "messages_updated": 15
}
```

**Actual (tasks.py):**
```python
{
    "message_count": len(messages),
    "topics_created": len(topic_map),
    "atoms_created": len(saved_atoms),
    "links_created": links_created,
    "messages_updated": messages_updated,
    "topic_versions_created": len(version_created_topic_ids),
    "atom_versions_created": len(version_created_atom_ids),
}
```

**New Undocumented Fields:**
- `topic_versions_created`: Number of versions created for topics
- `atom_versions_created`: Number of versions created for atoms

### Recommendation
Update all event documentation to match actual implementation.

---

## Finding 5: Undocumented Versioning Feature

### Issue
The system includes a complete versioning system for Topics and Atoms, but it's not documented in the Knowledge API documentation.

### Evidence

**Actual Code (tasks.py, lines 270-330):**
```python
# Topic versioning
topic_map, version_created_topic_ids = await service.save_topics(
    extraction_output.topics, db, created_by=created_by or "system"
)
# Atom versioning
saved_atoms, version_created_atom_ids = await service.save_atoms(
    extraction_output.atoms, topic_map, db, created_by=created_by or "system"
)

# New WebSocket event for versions
for topic_id in version_created_topic_ids:
    await websocket_manager.broadcast(
        "knowledge",
        {
            "type": "knowledge.version_created",
            "data": {
                "entity_type": "topic",
                "entity_id": topic_id,
                "approved": False,
            },
        },
    )

for atom_id in version_created_atom_ids:
    await websocket_manager.broadcast(
        "knowledge",
        {
            "type": "knowledge.version_created",
            "data": {
                "entity_type": "atom",
                "entity_id": atom_id,
                "approved": False,
            },
        },
    )
```

### Feature Details
- Automatic version creation when topics/atoms are re-extracted
- Versions can be approved or rejected
- Separate tracking of version creation vs. new entity creation
- WebSocket event: `knowledge.version_created`

### Impact
- Clients cannot track version history without code inspection
- Versioning system is invisible to API users
- Important for understanding entity lifecycle

### Recommendation
Add comprehensive section documenting versioning system and version_created event.

---

## Finding 6: Error Handling Differences

### Issue
Error scenarios described in documentation differ from actual implementation.

### Evidence

**Documentation (knowledge.md:107-132):**
- Status 400: message_ids validation
- Status 404: Provider not found
- Status 422: Provider not active

**Actual Code (knowledge.py:110-119):**
```python
agent_config = await db.get(AgentConfig, request.agent_config_id)
if not agent_config:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, 
        detail=f"Agent config {request.agent_config_id} not found"
    )

if not agent_config.is_active:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,  # Not 422!
        detail=f"Agent config '{agent_config.name}' is not active"
    )
```

### Error Matrix

| Scenario | Documented Status | Actual Status | Difference |
|----------|------------------|---------------|-----------|
| Invalid message count | 400 | 400 | ✓ Match |
| provider_id not found | 404 | 404 (agent_config) | ⚠️ Different object |
| provider_id inactive | 422 | 400 | ❌ Different |
| No messages for period | Not mentioned | 400 | ⚠️ Undocumented |

### Additional Undocumented Errors (knowledge.py:124-141)
```python
except ValueError as e:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

if len(message_ids) == 0:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, 
        detail=f"No messages found for the selected {period_desc}"
    )
```

### Recommendation
Update error handling documentation to reflect actual status codes and entities.

---

## Finding 7: Related CRUD Operations Not Documented

### Issue
Knowledge API documentation only covers the extraction trigger endpoint, but related CRUD operations for Topics and Atoms exist separately and aren't referenced.

### Complete Topics API (Not in knowledge.md)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/topics` | List all topics (paginated) |
| GET | `/api/v1/topics/{topic_id}` | Get specific topic |
| POST | `/api/v1/topics` | Create new topic |
| PATCH | `/api/v1/topics/{topic_id}` | Update topic |
| GET | `/api/v1/topics/icons` | Get available icons |
| GET | `/api/v1/topics/recent` | Get recent topics by activity |
| GET | `/api/v1/topics/{topic_id}/suggest-color` | Auto-suggest color |
| GET | `/api/v1/topics/{topic_id}/atoms` | List atoms in topic |
| GET | `/api/v1/topics/{topic_id}/messages` | List messages in topic |

### Complete Atoms API (Not in knowledge.md)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/atoms` | List all atoms (paginated) |
| GET | `/api/v1/atoms/{atom_id}` | Get specific atom |
| POST | `/api/v1/atoms` | Create new atom |
| PATCH | `/api/v1/atoms/{atom_id}` | Update atom |
| DELETE | `/api/v1/atoms/{atom_id}` | Delete atom |
| POST | `/api/v1/atoms/{atom_id}/topics/{topic_id}` | Link atom to topic |

### Impact
Users learning from knowledge.md don't know:
- How to retrieve extracted topics
- How to update topics after extraction
- How to create manual topics/atoms
- Relationship between topics and atoms

### Recommendation
Add "Related Resources" section linking to or duplicating Topics/Atoms API documentation.

---

## Finding 8: Example Code Issues

### Issue
Provided code examples will not work with actual implementation.

### TypeScript Example (knowledge.md:458-547)

**Problem:** Uses documented `/ws/knowledge` endpoint
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/knowledge');
```

**Should Be:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    topic: 'knowledge'
  }));
};
```

### Python Example (knowledge.md:549-624)

**Problem:** Uses `provider_id` in request
```python
response = await client.post(
    f"{self.base_url}/api/v1/knowledge/extract",
    json={
        "message_ids": message_ids,
        "provider_id": provider_id
    }
)
```

**Should Be:**
```python
response = await client.post(
    f"{self.base_url}/api/v1/knowledge/extract",
    json={
        "message_ids": message_ids,
        "agent_config_id": agent_config_id
    }
)
```

### Impact
- Copy-paste failures for users
- Increased support burden
- Poor developer experience

### Recommendation
Update all examples to match actual API implementation.

---

## Finding 9: Missing Query Parameter Documentation

### Issue
The WebSocket endpoint supports a `topics` query parameter that's not mentioned in Knowledge API documentation.

### Evidence

**Actual Code (ws/router.py:10-12):**
```python
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, topics: str | None = None) -> None:
    """WebSocket endpoint with topic-based subscriptions.
    
    Query params:
        topics: Comma-separated list of topics to subscribe to
    ```

### Usage
```javascript
// Subscribe to specific topics on connection
const ws = new WebSocket('ws://localhost:8000/ws?topics=knowledge,messages,proposals');
```

### Benefit
Users can select specific topics at connection time instead of after handshake.

### Recommendation
Document this convenient feature in WebSocket section.

---

## Finding 10: Validation Rules Are Incomplete

### Issue
Documentation doesn't fully explain validation logic.

### Documented Validation (knowledge.md:136-146)
- message_ids: 1-100 range
- provider must be active
- model must support structured output

### Missing Validation Details

**Mutual Exclusivity (knowledge.py:48-55):**
```
- Either message_ids OR period must be provided, not both
- Cannot provide neither
```

**Period Validation (knowledge.py:124-141):**
```
- For custom period: both start_date and end_date required
- Period type must be: last_24h, last_7d, last_30d, or custom
- start_date must be before end_date (implied)
```

**Message Count Validation (knowledge.py:135-141):**
```
- Must return at least 1 message for the period
- If no messages found: 400 Bad Request (undocumented)
```

### Recommendation
Add comprehensive validation rules table in documentation.

---

## Summary Statistics

### Documentation vs. Reality Comparison

| Category | Documented | Actual | Match |
|----------|-----------|--------|-------|
| REST Endpoints | 1 | 1 | 100% |
| WebSocket Events | 5 | 6 | 83% |
| Request Fields | 2 | 3 | 67% |
| Response Fields | 3 | 3 | 100% |
| Error Cases | 3 | 5 | 60% |
| Related Endpoints | 0 | 16 | 0% |
| Example Code Blocks | 6 | 6 | 0% (all fail) |

### Issue Breakdown

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 5 | ❌ |
| Major | 3 | ⚠️ |
| Minor | 2 | ℹ️ |

### Files Updated Needed

1. `/docs/content/en/api/knowledge.md` - 5 major sections need updates
2. `/docs/content/uk/api/knowledge.md` - Same as above (Ukrainian translation)
3. All example code files if they exist separately

---

## Conclusion

The Knowledge Extraction API documentation is significantly out of sync with the actual implementation. While the core endpoint structure matches, critical parameters, features, and architectural details have diverged. The most impactful changes needed are:

1. Replace `provider_id` with `agent_config_id` throughout
2. Document period-based message selection
3. Fix WebSocket endpoint connection method
4. Document versioning system
5. Update all examples to work with actual API

These changes are essential for developers to successfully integrate with the API without guesswork or code inspection.

