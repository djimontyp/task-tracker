# API Documentation vs Reality Audit Report

## Executive Summary

The Knowledge Extraction API documentation describes a `/extract` endpoint with comprehensive WebSocket support, but the implementation shows **significant discrepancies** between what's documented and what actually exists in the codebase.

---

## 1. Documented Endpoints vs Actual Implementation

### Documented (in docs/content/en/api/knowledge.md)

| Endpoint | Method | Status Code | Notes |
|----------|--------|-------------|-------|
| `/api/v1/knowledge/extract` | POST | 202 Accepted | Manually trigger knowledge extraction |

### Actual (in backend/app/api/v1/knowledge.py)

| Endpoint | Method | Status Code | Parameter Changes |
|----------|--------|-------------|-------------------|
| `/api/v1/knowledge/extract` | POST | 202 Accepted | ✓ MATCHES |

**VERDICT: ENDPOINT MATCHES** ✓

---

## 2. Request Schema Comparison

### Documented Schema
```json
{
  "message_ids": number[],      // Required: 1-100 message IDs
  "provider_id": string         // Required: UUID of active LLM provider
}
```

### Actual Implementation
```python
class KnowledgeExtractionRequest(BaseModel):
    message_ids: list[int] | None
    period: PeriodRequest | None
    agent_config_id: UUID  # NOT provider_id!
```

### Key Differences Found

| Field | Documented | Actual | Status |
|-------|-----------|--------|--------|
| `message_ids` | Required, 1-100 | Optional (mutually exclusive with period) | ❌ DIFFERS |
| `provider_id` | Required, UUID | ❌ NOT PRESENT | ❌ MISSING |
| `agent_config_id` | ❌ NOT DOCUMENTED | Required, UUID | ⚠️ UNDOCUMENTED |
| `period` | ❌ NOT DOCUMENTED | Optional, complex object | ⚠️ UNDOCUMENTED |
| `start_date` | ❌ NOT DOCUMENTED | Optional (for custom period) | ⚠️ UNDOCUMENTED |
| `end_date` | ❌ NOT DOCUMENTED | Optional (for custom period) | ⚠️ UNDOCUMENTED |

**VERDICT: CRITICAL DIFFERENCES** ❌

---

## 3. Response Schema Comparison

### Documented Response (202 Accepted)
```json
{
  "message": string,          // Success message
  "message_count": number,    // Number of messages queued
  "provider_id": string       // Provider UUID used
}
```

### Actual Response (202 Accepted)
```python
class KnowledgeExtractionResponse(BaseModel):
    message: str
    message_count: int
    agent_config_id: str  # NOT provider_id!
```

### Differences

| Field | Documented | Actual | Status |
|-------|-----------|--------|--------|
| `message` | ✓ | ✓ | ✓ MATCHES |
| `message_count` | ✓ | ✓ | ✓ MATCHES |
| `provider_id` | ✓ Required | ❌ NOT PRESENT | ❌ MISSING |
| `agent_config_id` | ❌ NOT DOCUMENTED | ✓ Present | ⚠️ UNDOCUMENTED |

**VERDICT: RESPONSE MISMATCH** ❌

---

## 4. Error Handling Comparison

### Documented Error Cases

| Status | Error | Response Format |
|--------|-------|-----------------|
| 400 | Bad Request | message_ids must contain between 1 and 100 IDs |
| 404 | Provider Not Found | Provider {id} not found |
| 422 | Provider Inactive | Provider '{name}' is not active |

### Actual Error Cases

| Status | Error | Implementation |
|--------|-------|-----------------|
| 400 | Bad Request - Validation | ✓ If message_ids/period validation fails |
| 400 | Bad Request - No Messages | ✓ If no messages found for period |
| 404 | Agent Config Not Found | ✓ If agent_config_id not found (different from doc!) |
| 400 | Agent Config Not Active | ✓ If agent_config.is_active is false |

**VERDICT: ERROR HANDLING DIFFERS** ❌
- Docs mention **Provider** errors
- Code checks **AgentConfig** errors (the provider relationship is accessed through agent_config)

---

## 5. WebSocket Events Comparison

### Documented Events in API Documentation

1. **knowledge.extraction_started**
   - message_count: number
   - provider_id: string

2. **knowledge.topic_created**
   - topic_id: number
   - topic_name: string

3. **knowledge.atom_created**
   - atom_id: number
   - atom_title: string
   - atom_type: string

4. **knowledge.extraction_completed**
   - message_count: number
   - topics_created: number
   - atoms_created: number
   - links_created: number
   - messages_updated: number

5. **knowledge.extraction_failed**
   - error: string

### Actual WebSocket Events (from tasks.py)

1. **knowledge.extraction_started** ✓
   - message_count: number
   - agent_config_id: string (docs say provider_id)
   - agent_name: string

2. **knowledge.topic_created** ✓
   - topic_id: number
   - topic_name: string

3. **knowledge.atom_created** ✓
   - atom_id: number
   - atom_title: string
   - atom_type: string

4. **knowledge.version_created** ⚠️ UNDOCUMENTED
   - entity_type: string (topic or atom)
   - entity_id: number
   - approved: boolean

5. **knowledge.extraction_completed** ✓ (with additions)
   - message_count: number
   - topics_created: number
   - atoms_created: number
   - links_created: number
   - messages_updated: number
   - topic_versions_created: number ⚠️ UNDOCUMENTED
   - atom_versions_created: number ⚠️ UNDOCUMENTED

6. **knowledge.extraction_failed** ✓
   - error: string

**VERDICT: PARTIAL MATCH WITH UNDOCUMENTED EVENTS** ⚠️

---

## 6. WebSocket Endpoint Location

### Documented
- **URL:** `ws://localhost:8000/ws/knowledge`
- **Type:** Knowledge-specific WebSocket

### Actual
- **URL:** `ws://localhost:8000/ws`
- **Type:** Topic-based subscription to `knowledge` among many topics

**VERDICT: ENDPOINT LOCATION DIFFERS** ❌
- Docs suggest dedicated `/ws/knowledge` endpoint
- Actual: Generic `/ws` endpoint that supports topics: `["agents", "tasks", "providers", "messages", "analysis", "proposals", "knowledge"]`
- Must subscribe to "knowledge" topic after connecting

---

## 7. Missing/Undocumented Features

### In Code But Not In Docs

1. **Period-Based Message Selection**
   - Allows filtering by time periods instead of direct message IDs
   - Supports: `last_24h`, `last_7d`, `last_30d`, `custom`
   - Optional `topic_id` filter
   - Custom date range support

2. **Topic/Atom Versioning**
   - Automatic version creation for modified entities
   - `knowledge.version_created` WebSocket event
   - Versioning service integration

3. **AgentConfig Requirement**
   - Uses AgentConfig instead of LLMProvider
   - Multiple agent configurations can coexist

### In Docs But Not In Code

1. **Dedicated `/ws/knowledge` WebSocket**
   - Docs suggest a dedicated knowledge extraction WebSocket
   - Actual: Generic `/ws` with topic-based subscription

2. **Provider-Based Error Handling**
   - Docs show provider-specific errors
   - Actual: AgentConfig-based validation

3. **Direct Listing Endpoints**
   - No documented GET endpoints for retrieving:
     - List of extraction jobs
     - Extraction status
     - Created topics/atoms

---

## 8. Topics & Atoms CRUD Operations

### Documented in knowledge.md
- ❌ NO ENDPOINTS listed

### Actual Implementations (in separate modules)

#### Topics API (`/api/v1/topics`)
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/topics` | List topics (paginated) |
| GET | `/topics/{topic_id}` | Get specific topic |
| POST | `/topics` | Create new topic |
| PATCH | `/topics/{topic_id}` | Update topic |
| GET | `/topics/icons` | List available icons |
| GET | `/topics/recent` | Get recent topics by activity |
| GET | `/topics/{topic_id}/suggest-color` | Auto-suggest color |
| GET | `/topics/{topic_id}/atoms` | Get atoms for topic |
| GET | `/topics/{topic_id}/messages` | Get messages for topic |

#### Atoms API (`/api/v1/atoms`)
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/atoms` | List atoms (paginated) |
| GET | `/atoms/{atom_id}` | Get specific atom |
| POST | `/atoms` | Create new atom |
| PATCH | `/atoms/{atom_id}` | Update atom |
| DELETE | `/atoms/{atom_id}` | Delete atom |
| POST | `/atoms/{atom_id}/topics/{topic_id}` | Link atom to topic |

**VERDICT: INCOMPLETE KNOWLEDGE API DOCUMENTATION** ❌
- Knowledge extraction only documents the trigger endpoint
- Related CRUD operations documented separately

---

## 9. Data Schemas & Models

### Documented in knowledge.md
- ✓ ExtractedTopic (request schema)
- ✓ ExtractedAtom (request schema)
- ✓ Topic (database model)
- ✓ Atom (database model)
- ✓ AtomLink (database model)

### Actual Implementation
All documented schemas exist and match the documentation.

**VERDICT: SCHEMAS MATCH** ✓

---

## 10. Integration Examples

### Documented
- TypeScript/React hooks implementation
- Python async client implementation
- Both include WebSocket subscription examples

### Actual
- Examples use documented `/ws/knowledge` endpoint (incorrect)
- Examples use correct event type names
- Callback-based pattern matches actual implementation

**VERDICT: EXAMPLES NEED UPDATES** ⚠️

---

## Summary of Issues

### Critical Issues (❌)

1. **Parameter Mismatch**: Docs use `provider_id`, code uses `agent_config_id`
2. **Missing Features**: Period-based selection, versioning, topic filters NOT documented
3. **WebSocket Endpoint**: Docs specify `/ws/knowledge`, actual is `/ws` with topic subscription
4. **Error Handling**: Docs describe Provider errors, code implements AgentConfig errors
5. **Incomplete API Doc**: Only documents trigger endpoint, not CRUD operations

### Warnings (⚠️)

1. **Undocumented Events**: `knowledge.version_created`, version counts in completion event
2. **Examples**: Code examples reference incorrect WebSocket endpoint

### Matches (✓)

1. Main endpoint path and method
2. Response fields (message, message_count, status code)
3. Event names and basic structure
4. Data schema definitions

---

## Recommendations

### Priority 1 (Fix Immediately)

1. [ ] Update request schema documentation to use `agent_config_id` instead of `provider_id`
2. [ ] Document period-based message selection feature
3. [ ] Correct WebSocket endpoint documentation from `/ws/knowledge` to `/ws` with topic subscription
4. [ ] Document error handling for AgentConfig (not Provider)
5. [ ] Update example code to use correct WebSocket connection method

### Priority 2 (Complete)

1. [ ] Document `knowledge.version_created` WebSocket event
2. [ ] Document version counts in `knowledge.extraction_completed` event
3. [ ] Add section documenting related Topics and Atoms CRUD endpoints
4. [ ] Document topic_id filter in period-based selection
5. [ ] Add examples of period-based extraction triggers

### Priority 3 (Enhance)

1. [ ] Add GET endpoints for querying extraction history/status
2. [ ] Document automatic extraction threshold trigger
3. [ ] Add best practices for handling versioning events
4. [ ] Document AgentConfig relationship with LLMProvider
5. [ ] Add troubleshooting section for common issues

---

## Files Analyzed

- `/home/maks/projects/task-tracker/docs/content/en/api/knowledge.md` (654 lines)
- `/home/maks/projects/task-tracker/docs/content/uk/api/knowledge.md` (374 lines - partial translation)
- `/home/maks/projects/task-tracker/backend/app/api/v1/knowledge.py` (152 lines)
- `/home/maks/projects/task-tracker/backend/app/tasks.py` (extract_knowledge_from_messages_task)
- `/home/maks/projects/task-tracker/backend/app/ws/router.py` (81 lines)
- `/home/maks/projects/task-tracker/backend/app/api/v1/topics.py` (338 lines)
- `/home/maks/projects/task-tracker/backend/app/api/v1/atoms.py` (254 lines)

