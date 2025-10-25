# Backend Implementation Investigation Report

**Date**: 2025-10-25
**Feature**: API Documentation Fix (Feature 1 - Documentation Overhaul Epic)
**Task**: Backend Investigation for Accurate API Documentation
**Agent**: Backend Implementation Investigator

---

## Executive Summary

This report provides **accurate, code-verified** API specifications for the Knowledge Extraction system. All parameter names, types, endpoints, and event types have been extracted from the actual backend implementation.

### Key Findings vs Audit Claims

| Audit Claim | Investigation Result | Status |
|------------|---------------------|--------|
| Parameter is `provider_id` | **CORRECT**: Parameter is `agent_config_id` (UUID) | ✅ Confirmed breaking change |
| Missing period-based selection | **INCORRECT**: Period feature exists and is fully implemented | ✅ Found implementation |
| WebSocket endpoint wrong | **CORRECT**: Endpoint is `/ws?topics=knowledge`, NOT `/ws/knowledge` | ✅ Confirmed discrepancy |
| Missing `version_created` event | **INCORRECT**: Event exists and is fully implemented | ✅ Found implementation |
| Incomplete error handling | **PARTIALLY CORRECT**: Error handling exists but needs better documentation | ⚠️ Needs improvement |

---

## 1. Knowledge Extraction API Endpoint

### 1.1 Endpoint Specification

**Path**: `/api/v1/knowledge/extract`
**Method**: `POST`
**Status Code**: `202 ACCEPTED` (async task queued)
**Tags**: `["knowledge"]`

**Source Files**:
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/knowledge.py` (lines 69-151)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/router.py` (line 54)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/main.py` (line 95)

### 1.2 Request Schema: `KnowledgeExtractionRequest`

**Type**: Pydantic model with validation
**Source**: `/backend/app/api/v1/knowledge.py` (lines 34-56)

#### Required Parameters

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `agent_config_id` | `UUID` | ✅ Yes | Agent Config UUID to use for extraction | Must exist and be active |

#### Message Selection (Mutually Exclusive)

**CRITICAL**: Exactly ONE of the following must be provided:

**Option 1: Direct Message IDs**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `message_ids` | `list[int] \| None` | Conditional | Message IDs to analyze | `1-100` items, `10-50` recommended |

**Option 2: Period-Based Selection**

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `period` | `PeriodRequest \| None` | Conditional | Period-based message selection | See PeriodRequest schema below |

#### PeriodRequest Schema

**Source**: `/backend/app/api/v1/knowledge.py` (lines 19-31)

| Field | Type | Required | Description | Valid Values |
|-------|------|----------|-------------|--------------|
| `period_type` | `Literal` | ✅ Yes | Time period type | `"last_24h"`, `"last_7d"`, `"last_30d"`, `"custom"` |
| `topic_id` | `int \| None` | ❌ No | Optional topic filter | Any valid topic ID |
| `start_date` | `datetime \| None` | Conditional | Start date for custom period | Required if `period_type="custom"`, timezone-aware |
| `end_date` | `datetime \| None` | Conditional | End date for custom period | Required if `period_type="custom"`, timezone-aware |

**Validation Rules** (Source: lines 48-55):
1. Exactly one of `message_ids` or `period` must be provided
2. Cannot specify both `message_ids` and `period`
3. If neither provided: `ValueError: "Either message_ids or period must be provided"`
4. If both provided: `ValueError: "Cannot specify both message_ids and period, choose one"`

### 1.3 Response Schema: `KnowledgeExtractionResponse`

**Source**: `/backend/app/api/v1/knowledge.py` (lines 58-64)

| Field | Type | Description |
|-------|------|-------------|
| `message` | `str` | Success message with agent name and message count |
| `message_count` | `int` | Number of messages queued for extraction |
| `agent_config_id` | `str` | Agent Config UUID used (string representation) |

**Example Response**:
```json
{
  "message": "Knowledge extraction queued for 25 messages using agent 'knowledge_extractor'",
  "message_count": 25,
  "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 1.4 Error Responses

**Source**: `/backend/app/api/v1/knowledge.py` (lines 107-141)

| Status Code | Condition | Error Message Format |
|-------------|-----------|---------------------|
| `404 NOT_FOUND` | Agent config not found | `"Agent config {agent_config_id} not found"` |
| `400 BAD_REQUEST` | Agent config not active | `"Agent config '{agent_config.name}' is not active"` |
| `400 BAD_REQUEST` | Period validation failed | ValueError message from `get_messages_by_period()` |
| `400 BAD_REQUEST` | No messages found for period | `"No messages found for the selected {period_desc}"` |
| `422 UNPROCESSABLE_ENTITY` | Request validation failed | Pydantic validation error details |

#### Period Validation Error Conditions

**Source**: `/backend/app/services/knowledge_extraction_service.py` (lines 610-675)

| Condition | Error Message |
|-----------|--------------|
| Custom period without dates | `"Custom period requires both start_date and end_date"` |
| Future dates | `"Custom period dates cannot be in the future"` |
| Invalid date range | `"start_date must be before end_date"` |
| Invalid period_type | `"Invalid period_type: {period_type}"` |

---

## 2. WebSocket Implementation

### 2.1 WebSocket Endpoint Specification

**Path**: `/ws`
**Protocol**: WebSocket
**Source**: `/backend/app/ws/router.py` (lines 10-81)

**CRITICAL CORRECTION**: The endpoint is `/ws`, NOT `/ws/knowledge`. Topic subscription is controlled via query parameters.

### 2.2 Connection Pattern

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topics` | `str \| None` | ❌ No | Comma-separated list of topics to subscribe to |

**Valid Topic Values**:
- `agents`
- `tasks`
- `providers`
- `messages`
- `analysis`
- `proposals`
- `knowledge` ← Knowledge extraction events
- `experiments`
- `noise_filtering`
- `ingestion` (from messages topic)

**Default Behavior**: If `topics` is not specified, subscribes to: `["agents", "tasks", "providers", "messages", "analysis", "proposals"]`

**Connection URL Examples**:
```
ws://localhost/ws?topics=knowledge
ws://localhost/ws?topics=knowledge,messages
ws://localhost/ws  (subscribes to default topics)
```

### 2.3 Connection Handshake

**Source**: `/backend/app/ws/router.py` (lines 39-48)

After successful connection, server sends confirmation message:

```json
{
  "type": "connection",
  "data": {
    "status": "connected",
    "message": "Ready for real-time updates",
    "topics": ["knowledge"]
  }
}
```

### 2.4 Client → Server Messages

**Source**: `/backend/app/ws/router.py` (lines 52-75)

Clients can dynamically manage subscriptions:

**Subscribe to Topic**:
```json
{
  "action": "subscribe",
  "topic": "knowledge"
}
```

**Server Response**:
```json
{
  "type": "subscription",
  "data": {
    "action": "subscribed",
    "topic": "knowledge"
  }
}
```

**Unsubscribe from Topic**:
```json
{
  "action": "unsubscribe",
  "topic": "knowledge"
}
```

**Server Response**:
```json
{
  "type": "subscription",
  "data": {
    "action": "unsubscribed",
    "topic": "knowledge"
  }
}
```

### 2.5 Server → Client Event Format

**Source**: `/backend/app/services/websocket_manager.py` (lines 88-125)

All events follow this structure:
```json
{
  "type": "event_name",
  "data": { /* event-specific payload */ }
}
```

---

## 3. Knowledge Extraction Events

### 3.1 Event Type Overview

**Source**: `/backend/app/tasks.py` (lines 1009-1196)

All events are broadcast on the `"knowledge"` topic. Subscribe via: `/ws?topics=knowledge`

### 3.2 Event Specifications

#### 3.2.1 `knowledge.extraction_started`

**Trigger**: Task begins processing (line 1069-1079)
**Payload**:
```json
{
  "type": "knowledge.extraction_started",
  "data": {
    "message_count": 25,
    "agent_config_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_name": "knowledge_extractor"
  }
}
```

#### 3.2.2 `knowledge.topic_created`

**Trigger**: New topic created (NOT a version) (lines 1122-1134)
**Payload**:
```json
{
  "type": "knowledge.topic_created",
  "data": {
    "topic_id": 42,
    "topic_name": "FastAPI Development"
  }
}
```

#### 3.2.3 `knowledge.atom_created`

**Trigger**: New atom created (NOT a version) (lines 1149-1161)
**Payload**:
```json
{
  "type": "knowledge.atom_created",
  "data": {
    "atom_id": 123,
    "atom_title": "Async endpoint performance optimization",
    "atom_type": "insight"
  }
}
```

**Valid `atom_type` Values**:
- `problem`
- `solution`
- `decision`
- `insight`
- `question`
- `pattern`
- `requirement`

#### 3.2.4 `knowledge.version_created` ✅ FOUND

**Trigger**: Version snapshot created for existing topic/atom (lines 1136-1147, 1163-1174)

**CRITICAL FINDING**: This event DOES exist in the implementation, contradicting the audit claim of it being missing.

**Payload for Topic Version**:
```json
{
  "type": "knowledge.version_created",
  "data": {
    "entity_type": "topic",
    "entity_id": 42,
    "approved": false
  }
}
```

**Payload for Atom Version**:
```json
{
  "type": "knowledge.version_created",
  "data": {
    "entity_type": "atom",
    "entity_id": 123,
    "approved": false
  }
}
```

**Valid `entity_type` Values**:
- `topic`
- `atom`

#### 3.2.5 `knowledge.extraction_completed`

**Trigger**: Extraction task completes successfully (lines 1106-1120)
**Payload**:
```json
{
  "type": "knowledge.extraction_completed",
  "data": {
    "message_count": 25,
    "topics_created": 3,
    "atoms_created": 12,
    "links_created": 8,
    "messages_updated": 25,
    "topic_versions_created": 1,
    "atom_versions_created": 2
  }
}
```

**Payload Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `message_count` | `int` | Number of messages processed |
| `topics_created` | `int` | Number of topics processed (new + existing) |
| `atoms_created` | `int` | Number of atoms processed (new + existing) |
| `links_created` | `int` | Number of atom links created |
| `messages_updated` | `int` | Number of messages assigned to topics |
| `topic_versions_created` | `int` | Number of topic version snapshots created |
| `atom_versions_created` | `int` | Number of atom version snapshots created |

#### 3.2.6 `knowledge.extraction_failed`

**Trigger**: Extraction task encounters error (lines 1186-1194)
**Payload**:
```json
{
  "type": "knowledge.extraction_failed",
  "data": {
    "error": "Error message string"
  }
}
```

### 3.3 Event Sequence Example

**Typical flow for successful extraction**:

1. `knowledge.extraction_started` - Task begins
2. `knowledge.topic_created` (×3) - New topics created
3. `knowledge.version_created` (×1 topic) - Existing topic updated
4. `knowledge.atom_created` (×10) - New atoms created
5. `knowledge.version_created` (×2 atoms) - Existing atoms updated
6. `knowledge.extraction_completed` - Task finishes

**Failure flow**:

1. `knowledge.extraction_started` - Task begins
2. `knowledge.extraction_failed` - Task fails with error

---

## 4. Background Task Implementation

### 4.1 Task Function: `extract_knowledge_from_messages_task`

**Source**: `/backend/app/tasks.py` (lines 1009-1196)
**Broker**: TaskIQ with NATS
**Decorator**: `@nats_broker.task`

**Function Signature**:
```python
async def extract_knowledge_from_messages_task(
    message_ids: list[int],
    agent_config_id: str,
    created_by: str | None = None
) -> dict[str, int]
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message_ids` | `list[int]` | ✅ Yes | Message IDs to analyze (10-50 recommended) |
| `agent_config_id` | `str` | ✅ Yes | AgentConfig UUID as string |
| `created_by` | `str \| None` | ❌ No | User ID who triggered extraction (default: `None` → `"system"`) |

**Return Type**:
```python
{
    "topics_created": int,      # Number of topics processed
    "atoms_created": int,       # Number of atoms processed
    "links_created": int,       # Number of atom links created
    "messages_updated": int     # Number of messages assigned to topics
}
```

### 4.2 Task Execution Flow

**Source Analysis**: `/backend/app/tasks.py` (lines 1050-1096)

1. **Validation Phase** (lines 1051-1065):
   - Retrieve `AgentConfig` by UUID
   - Validate agent config exists
   - Retrieve associated `LLMProvider`
   - Validate provider exists
   - Query messages by IDs
   - Return early if no messages found

2. **Event Broadcasting** (lines 1069-1079):
   - Broadcast `knowledge.extraction_started` event

3. **Knowledge Extraction** (lines 1081-1096):
   - Initialize `KnowledgeExtractionService`
   - Call `extract_knowledge()` - LLM analysis
   - Call `save_topics()` - Create/version topics
   - Call `save_atoms()` - Create/version atoms
   - Call `link_atoms()` - Create atom relationships
   - Call `update_messages()` - Assign messages to topics

4. **Event Broadcasting** (lines 1106-1174):
   - Broadcast `knowledge.extraction_completed`
   - Broadcast individual `knowledge.topic_created` events
   - Broadcast individual `knowledge.version_created` events (topics)
   - Broadcast individual `knowledge.atom_created` events
   - Broadcast individual `knowledge.version_created` events (atoms)

5. **Error Handling** (lines 1183-1196):
   - Catch all exceptions
   - Log error with full traceback
   - Broadcast `knowledge.extraction_failed` event
   - Re-raise exception to mark TaskIQ job as failed

### 4.3 Service Layer: `KnowledgeExtractionService`

**Source**: `/backend/app/services/knowledge_extraction_service.py` (lines 119-608)

**Key Methods**:

| Method | Purpose | Returns |
|--------|---------|---------|
| `extract_knowledge()` | LLM analysis of messages | `KnowledgeExtractionOutput` (topics + atoms) |
| `save_topics()` | Create/version topics | `tuple[dict[str, Topic], list[int]]` (topic_map, version_ids) |
| `save_atoms()` | Create/version atoms | `tuple[list[Atom], list[int]]` (atoms, version_ids) |
| `link_atoms()` | Create atom relationships | `int` (links created count) |
| `update_messages()` | Assign messages to topics | `int` (messages updated count) |

**Versioning Behavior**:

- **Existing Entity Found**: Creates `TopicVersion` or `AtomVersion` snapshot instead of direct update
- **New Entity**: Creates `Topic` or `Atom` record normally
- **Confidence Threshold**: Default `0.7` - entities below threshold are skipped with warning log

**Source**:
- Topic versioning: lines 265-290
- Atom versioning: lines 364-387

---

## 5. Versioning System Integration

### 5.1 TopicVersion and AtomVersion Models

**Referenced in**: `/backend/app/services/knowledge_extraction_service.py` (line 25)

When the system detects an existing topic/atom with the same name/title:

1. **Creates Version Snapshot** via `VersioningService`:
   - `create_topic_version()` for topics
   - `create_atom_version()` for atoms

2. **Emits Version Event**:
   - `knowledge.version_created` with `entity_type` and `entity_id`
   - `approved: false` (requires manual approval)

3. **No Direct Update**:
   - Original entity remains unchanged
   - Version waits for approval/rejection

**Service**: `VersioningService` (imported but not inspected - out of scope)

---

## 6. Period-Based Message Selection

### 6.1 Function: `get_messages_by_period`

**Source**: `/backend/app/services/knowledge_extraction_service.py` (lines 610-675)

**Function Signature**:
```python
async def get_messages_by_period(
    db: AsyncSession,
    period_type: Literal["last_24h", "last_7d", "last_30d", "custom"],
    topic_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> list[int]
```

**Logic**:

1. **Period Calculation** (lines 634-656):
   - `last_24h`: Now - 24 hours
   - `last_7d`: Now - 7 days
   - `last_30d`: Now - 30 days
   - `custom`: Uses `start_date` and `end_date` (validated)

2. **Query Building** (lines 658-667):
   - Filter by `sent_at` range
   - Optional filter by `topic_id`
   - Returns list of message IDs

3. **Validation** (lines 643-656):
   - Custom period requires both dates
   - Dates cannot be in future
   - Start must be before end
   - Timezone handling (UTC conversion)

**Used by**: `/backend/app/api/v1/knowledge.py` (lines 125-133)

---

## 7. Integration Points for Documentation

### 7.1 API Documentation Needs

**File**: `docs/content/{en,uk}/api/knowledge.md`

**Required Sections**:

1. **Endpoint Specification**:
   - Full path: `POST /api/v1/knowledge/extract`
   - Status code: `202 ACCEPTED`
   - Request/response schemas with examples

2. **Request Parameters**:
   - `agent_config_id` (UUID, required)
   - Message selection: `message_ids` XOR `period`
   - Complete `PeriodRequest` schema
   - Validation rules

3. **Error Handling**:
   - All 4xx error codes with conditions
   - Error message formats
   - Period validation errors

4. **WebSocket Integration**:
   - Correct endpoint: `/ws?topics=knowledge`
   - Connection handshake format
   - All 6 event types with payloads
   - Event sequence examples

### 7.2 Architecture Documentation Needs

**File**: `docs/content/{en,uk}/architecture/knowledge-extraction.md`

**Required Sections**:

1. **Task Flow Diagram**:
   - API → TaskIQ queue → Background task
   - Service layer interactions
   - WebSocket event broadcasting

2. **Versioning System**:
   - When versions are created vs direct creation
   - Approval workflow integration
   - Event emission for versions

3. **Period Selection Feature**:
   - Time period types
   - Custom date range validation
   - Topic filtering capability

---

## 8. Discrepancies Found vs Audit Claims

### 8.1 Confirmed Discrepancies

✅ **Parameter Name Change**:
- Audit claimed `provider_id` but code uses `agent_config_id`
- Breaking change confirmed
- UUID type confirmed

✅ **WebSocket Endpoint**:
- Audit claimed docs say `/ws/knowledge`
- Code uses `/ws?topics=knowledge`
- Query parameter pattern confirmed

### 8.2 Audit Errors (Features Actually Exist)

❌ **Period-Based Selection "Missing"**:
- Audit claimed feature missing
- **FOUND**: Full implementation in `PeriodRequest` schema
- **FOUND**: Service method `get_messages_by_period()`
- **FOUND**: API integration in endpoint handler
- Status: Feature fully implemented, just not documented

❌ **`version_created` Event "Missing"**:
- Audit claimed event missing
- **FOUND**: Full implementation in task (lines 1136-1147, 1163-1174)
- **FOUND**: Emitted for both topics and atoms
- **FOUND**: Includes `entity_type` and `entity_id` fields
- Status: Event fully implemented, just not documented

### 8.3 Partially Correct

⚠️ **Error Handling**:
- Audit claimed incomplete documentation
- **FOUND**: All error codes exist in implementation
- **FOUND**: Error messages are clear and specific
- Status: Error handling is complete, just needs better documentation

---

## 9. Additional Findings

### 9.1 Undocumented Features

1. **Dynamic WebSocket Subscription**:
   - Clients can subscribe/unsubscribe to topics after connection
   - Not mentioned in audit or existing docs

2. **Confidence Threshold**:
   - Default 0.7 for auto-creation
   - Lower confidence entities are logged but skipped
   - Not exposed in API but affects behavior

3. **Message Count Statistics**:
   - Response includes detailed counts
   - `topic_versions_created` and `atom_versions_created` in completion event
   - Very useful for monitoring

4. **Created By Tracking**:
   - Optional `created_by` parameter in task
   - Defaults to `"system"` if not provided
   - API uses `"api_trigger"` for manual requests
   - Auto-threshold uses `"auto_threshold"`

### 9.2 Code Quality Notes

**Type Safety**: ✅ Excellent
- Full type hints throughout
- Pydantic models for validation
- No `Any` types in critical paths

**Error Handling**: ✅ Comprehensive
- Specific error messages
- Proper HTTP status codes
- Exception re-raising for TaskIQ tracking

**Logging**: ✅ Detailed
- INFO level for major steps
- DEBUG level for granular tracking
- ERROR level with full tracebacks

**Architecture**: ✅ Clean
- Clear separation: API → Task → Service
- Dependency injection for database sessions
- WebSocket manager singleton pattern

---

## 10. Recommendations for Documentation

### 10.1 High Priority

1. **Fix WebSocket Endpoint Documentation**:
   - Change from `/ws/knowledge` to `/ws?topics=knowledge`
   - Add query parameter explanation
   - Include multiple topic subscription examples

2. **Add Period-Based Selection**:
   - Document `PeriodRequest` schema fully
   - Include validation rules
   - Add usage examples for each period type

3. **Document `version_created` Event**:
   - Explain when versions are created vs new entities
   - Include both topic and atom examples
   - Link to versioning system docs

4. **Correct Parameter Name**:
   - Change all references from `provider_id` to `agent_config_id`
   - Specify UUID type requirement
   - Add migration note for existing integrations

### 10.2 Medium Priority

5. **Document All Error Codes**:
   - Create error reference table
   - Include all validation error conditions
   - Add troubleshooting section

6. **Add Event Sequence Examples**:
   - Success flow diagram
   - Failure flow diagram
   - Partial success scenarios

7. **Document Dynamic Subscriptions**:
   - Subscribe/unsubscribe message format
   - Server confirmation responses
   - Use cases for dynamic management

### 10.3 Low Priority

8. **Add Implementation Notes**:
   - Confidence threshold behavior
   - Recommended batch sizes (10-50)
   - `created_by` tracking for audit trails

---

## Appendix A: File Locations

**API Layer**:
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/knowledge.py` (lines 1-152)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/api/v1/router.py` (line 54)

**WebSocket Layer**:
- `/Users/maks/PycharmProjects/task-tracker/backend/app/ws/router.py` (lines 10-81)
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/websocket_manager.py` (lines 1-148)

**Task Layer**:
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py` (lines 1009-1196)

**Service Layer**:
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/knowledge_extraction_service.py` (lines 1-676)

**Application**:
- `/Users/maks/PycharmProjects/task-tracker/backend/app/main.py` (lines 75-126)

---

## Appendix B: Code Snippets for Documentation

### Example 1: Basic Request with Message IDs

```bash
curl -X POST "http://localhost/api/v1/knowledge/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "message_ids": [101, 102, 103, 104, 105],
    "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Example 2: Period-Based Request (Last 7 Days)

```bash
curl -X POST "http://localhost/api/v1/knowledge/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "period": {
      "period_type": "last_7d"
    },
    "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Example 3: Custom Date Range with Topic Filter

```bash
curl -X POST "http://localhost/api/v1/knowledge/extract" \
  -H "Content-Type: application/json" \
  -d '{
    "period": {
      "period_type": "custom",
      "start_date": "2025-10-01T00:00:00Z",
      "end_date": "2025-10-25T23:59:59Z",
      "topic_id": 42
    },
    "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Example 4: WebSocket Connection (JavaScript)

```javascript
const ws = new WebSocket('ws://localhost/ws?topics=knowledge');

ws.onopen = () => {
  console.log('Connected to knowledge extraction events');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'knowledge.extraction_started') {
    console.log(`Extraction started: ${message.data.message_count} messages`);
  } else if (message.type === 'knowledge.extraction_completed') {
    console.log(`Completed: ${message.data.topics_created} topics, ${message.data.atoms_created} atoms`);
  } else if (message.type === 'knowledge.version_created') {
    console.log(`Version created for ${message.data.entity_type} ${message.data.entity_id}`);
  }
};

// Dynamic subscription
ws.send(JSON.stringify({
  action: 'subscribe',
  topic: 'messages'
}));
```

---

**Report Complete**
**Lines of Code Analyzed**: ~1,500+
**Files Inspected**: 6
**Discrepancies Found**: 2 confirmed, 2 audit errors
**Features Discovered**: 4 undocumented
