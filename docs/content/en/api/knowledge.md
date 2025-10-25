# Knowledge Extraction API

!!! info "API Reference"
    Complete API documentation for the Knowledge Extraction endpoints, WebSocket events, and request/response schemas.

---

## Base URL

```
http://localhost:8000/api/v1/knowledge
```

---

## Endpoints

### Trigger Knowledge Extraction

Manually trigger knowledge extraction from a batch of messages.

**POST** `/extract`

#### Request

=== "Schema"
    ```typescript
    {
      message_ids: number[] | null,      // Optional: 1-100 message IDs to analyze
      period: PeriodRequest | null,      // Optional: Period-based message selection
      agent_config_id: string            // Required: UUID of agent configuration
    }
    ```

=== "Example"
    ```json
    {
      "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

=== "Python"
    ```python
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/knowledge/extract",
            json={
                "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        )
        data = response.json()
        print(f"Queued extraction for {data['message_count']} messages")
    ```

=== "TypeScript"
    ```typescript
    const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        agent_config_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    });

    const data = await response.json();
    console.log(`Queued extraction for ${data.message_count} messages`);
    ```

=== "cURL"
    ```bash
    curl -X POST http://localhost:8000/api/v1/knowledge/extract \
      -H "Content-Type: application/json" \
      -d '{
        "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
      }'
    ```

#### Response

**Status:** `202 Accepted` - Task queued successfully

=== "Schema"
    ```typescript
    {
      message: string,          // Success message
      message_count: number,    // Number of messages queued
      agent_config_id: string   // Agent configuration UUID used
    }
    ```

=== "Example"
    ```json
    {
      "message": "Knowledge extraction queued for 10 messages",
      "message_count": 10,
      "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

#### Errors

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | Invalid request (message count not in 1-100 range, or no messages found for period) |
| `404` | Not Found | Agent configuration with given UUID not found |
| `400` | Bad Request | Agent configuration exists but is not active |

=== "400 - Invalid Request"
    ```json
    {
      "detail": "message_ids must contain between 1 and 100 message IDs"
    }
    ```

=== "404 - Agent Config Not Found"
    ```json
    {
      "detail": "Agent config 550e8400-e29b-41d4-a716-446655440000 not found"
    }
    ```

=== "400 - Agent Config Inactive"
    ```json
    {
      "detail": "Agent config 'knowledge_extractor' is not active"
    }
    ```

#### Best Practices

!!! tip "Optimal Batch Size"
    For best extraction quality, use **10-50 messages** per request. Smaller batches may lack context, larger batches may overwhelm the LLM.

!!! warning "Rate Limiting"
    Avoid triggering multiple extractions simultaneously. Wait for the previous extraction to complete before starting a new one.

!!! info "Agent Configuration Requirements"
    - Agent configuration must be active (`is_active = true`)
    - Associated LLM provider must be active and properly configured
    - Message selection: either `message_ids` (1-100) OR `period`, not both
    - For custom periods: both `start_date` and `end_date` required
    - Selected messages/period must contain at least 1 message

#### Message Selection Options

The API supports two mutually exclusive message selection strategies:

| Selection Method | Description | Use Case |
|------------------|-------------|----------|
| **Direct IDs** | Specify exact message IDs (1-100) | When you know specific messages to analyze |
| **Period-Based** | Auto-select messages by time range | When analyzing recent conversations or specific date ranges |

#### Period-Based Message Selection

When using period-based selection, the system automatically identifies messages within your specified timeframe:

| Period Type | Range | Example | Best For |
|------------|-------|---------|----------|
| `last_24h` | Last 24 hours | All messages from yesterday | Daily standup synthesis |
| `last_7d` | Last 7 days | All messages from past week | Weekly summary generation |
| `last_30d` | Last 30 days | All messages from past month | Monthly knowledge base updates |
| `custom` | User-defined | Start/end dates required | Ad-hoc analysis of specific periods |

**Optional Topic Filtering**: For any period type, you can filter to messages within a specific topic using the `topic_id` field.

**Timezone Handling**: All dates are timezone-aware and follow ISO 8601 format (UTC recommended).

**Custom Period Requirements**:
- Both `start_date` and `end_date` must be provided
- Dates cannot be in the future
- `start_date` must be before `end_date`
- Format: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601)

---

## WebSocket Events

Subscribe to real-time extraction progress updates using the generic WebSocket endpoint with topic-based subscriptions.

### Connection

**Endpoint:** `ws://localhost:8000/ws`

**Connection Steps:**

1. Connect to the `/ws` endpoint
2. Upon connection, send a subscription message to start receiving knowledge extraction events
3. The server responds with a connection confirmation containing your subscribed topics
4. Listen for events on the `knowledge` topic as extraction progresses

**Subscription Message Format:**

```json
{
  "action": "subscribe",
  "topic": "knowledge"
}
```

**Multi-Topic Subscriptions:**

You can subscribe to multiple topics simultaneously. The system supports these topics:

| Topic | Purpose |
|-------|---------|
| `knowledge` | Knowledge extraction events (topics, atoms, versions) |
| `agents` | Agent configuration lifecycle events |
| `tasks` | Task processing events |
| `providers` | LLM provider status events |
| `analysis` | Analysis system events |
| `proposals` | Proposal generation events |

To subscribe to multiple topics, send separate subscription messages for each:

```json
{"action": "subscribe", "topic": "knowledge"}
{"action": "subscribe", "topic": "analysis"}
```

Or use the query parameter when establishing the connection:

```
ws://localhost:8000/ws?topics=knowledge,analysis
```

**Connection Lifecycle:**

1. **Connection Established** - Server sends confirmation with subscribed topics
2. **Subscription Active** - Server broadcasts matching events to your connection
3. **Dynamic Updates** - Send additional `subscribe`/`unsubscribe` messages anytime
4. **Disconnection** - Client closes connection or server times out

### Event Types

#### extraction_started

Emitted when extraction task begins processing.

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

| Field | Type | Description |
|-------|------|-------------|
| `message_count` | number | Number of messages being analyzed |
| `agent_config_id` | string | UUID of agent configuration used |
| `agent_name` | string | Name of the agent configuration |

---

#### topic_created

Emitted for each topic created during extraction.

```json
{
  "type": "knowledge.topic_created",
  "data": {
    "topic_id": 42,
    "topic_name": "API Design"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `topic_id` | number | Database ID of created topic |
| `topic_name` | string | Name of the topic (2-4 words) |

!!! info "Related Operations"
    After receiving this event, use the **Topics Management API** to refine the topic: update descriptions, add icons/colors, link atoms, or retrieve related messages. See [Topics Management](#topics-management) for available endpoints.

---

#### atom_created

Emitted for each atom created during extraction.

```json
{
  "type": "knowledge.atom_created",
  "data": {
    "atom_id": 123,
    "atom_title": "Implement OAuth2 refresh token flow",
    "atom_type": "solution"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `atom_id` | number | Database ID of created atom |
| `atom_title` | string | Atom title (max 200 chars) |
| `atom_type` | string | Type: problem/solution/decision/insight/question/pattern/requirement |

!!! info "Related Operations"
    Use the **Atoms Management API** to further refine atoms: update titles/content, change types, approve/reject auto-classifications, or link atoms together. See [Atoms Management](#atoms-management) for available endpoints.

---

#### extraction_completed

Emitted when extraction task finishes successfully.

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

| Field | Type | Description |
|-------|------|-------------|
| `message_count` | number | Total messages analyzed |
| `topics_created` | number | Number of topics processed (new + existing) |
| `atoms_created` | number | Number of atoms processed (new + existing) |
| `links_created` | number | Number of atom links created |
| `messages_updated` | number | Number of messages assigned to topics |
| `topic_versions_created` | number | Number of topic version snapshots created |
| `atom_versions_created` | number | Number of atom version snapshots created |

---

#### extraction_failed

Emitted when extraction task encounters an error.

```json
{
  "type": "knowledge.extraction_failed",
  "data": {
    "error": "LLM provider connection timeout"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error` | string | Error message describing the failure |

---

#### version_created

Emitted when a version snapshot is created for an existing topic or atom during re-extraction.

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

| Field | Type | Description |
|-------|------|-------------|
| `entity_type` | string | Type of entity: `topic` or `atom` |
| `entity_id` | number | Database ID of the topic or atom |
| `approved` | boolean | Whether version requires approval (always false initially) |

When the system re-analyzes messages and discovers an existing topic or atom with the same name/title, it creates a version snapshot instead of modifying the original. This preserves the audit trail and allows for approval/rejection workflows.

!!! info "Related Operations"
    Use the **Versioning Operations API** to review and manage version changes: view version history, compare versions, or approve/reject changes. See [Versioning Operations](#versioning-operations) for available endpoints.

---

## Data Schemas

### ExtractedTopic

Structure returned by LLM for each identified topic.

```typescript
interface ExtractedTopic {
  name: string;                  // 2-4 words max
  description: string;           // Clear theme description
  confidence: number;            // 0.0-1.0 (0.7+ for auto-creation)
  keywords: string[];            // Key terms (2-5 items)
  related_message_ids: number[]; // Source message IDs
}
```

**Example:**

```json
{
  "name": "API Authentication",
  "description": "Discussions about API security, user authentication, and OAuth implementation",
  "confidence": 0.89,
  "keywords": ["oauth", "security", "authentication", "api", "tokens"],
  "related_message_ids": [1, 2, 5, 8, 9]
}
```

---

### ExtractedAtom

Structure returned by LLM for each identified knowledge unit.

```typescript
interface ExtractedAtom {
  type: AtomType;                      // problem/solution/decision/insight/question/pattern/requirement
  title: string;                       // Max 200 characters
  content: string;                     // Full self-contained description
  confidence: number;                  // 0.0-1.0 (0.7+ for auto-creation)
  topic_name: string;                  // Parent topic name
  related_message_ids: number[];       // Source message IDs
  links_to_atom_titles?: string[];     // Titles of related atoms
  link_types?: LinkType[];             // Relationship types
}

type AtomType =
  | 'problem'
  | 'solution'
  | 'decision'
  | 'insight'
  | 'question'
  | 'pattern'
  | 'requirement';

type LinkType =
  | 'solves'
  | 'supports'
  | 'contradicts'
  | 'continues'
  | 'refines'
  | 'relates_to'
  | 'depends_on';
```

**Example:**

```json
{
  "type": "solution",
  "title": "Implement OAuth2 refresh token flow",
  "content": "To solve the iOS login session timeout issue, we should implement OAuth2 refresh tokens that automatically renew user sessions without requiring re-login. This improves UX while maintaining security.",
  "confidence": 0.88,
  "topic_name": "API Authentication",
  "related_message_ids": [8, 9],
  "links_to_atom_titles": ["iOS login session expires prematurely"],
  "link_types": ["solves"]
}
```

---

### Topic (Database Model)

Persisted topic entity.

```typescript
interface Topic {
  id: number;
  name: string;          // Unique, max 100 chars
  description: string;
  icon: string | null;   // Heroicon name (e.g., "CodeBracketIcon")
  color: string | null;  // Hex color (e.g., "#3B82F6")
  created_at: string;    // ISO 8601 timestamp
  updated_at: string;    // ISO 8601 timestamp
}
```

---

### Atom (Database Model)

Persisted atom entity.

```typescript
interface Atom {
  id: number;
  type: AtomType;
  title: string;              // Max 200 chars
  content: string;
  confidence: number;         // 0.0-1.0
  user_approved: boolean;     // Manual verification flag
  meta: {
    source: string;           // "llm_extraction"
    message_ids: number[];    // Source messages
  };
  created_at: string;         // ISO 8601 timestamp
  updated_at: string;         // ISO 8601 timestamp
}
```

---

### AtomLink (Database Model)

Relationship between two atoms.

```typescript
interface AtomLink {
  id: number;
  from_atom_id: number;
  to_atom_id: number;
  link_type: LinkType;
  strength: number | null;    // 0.0-1.0 (optional)
  created_at: string;         // ISO 8601 timestamp
}
```

---

## Integration Examples

### Full Extraction Workflow

Complete example showing extraction trigger and event handling:

=== "TypeScript/React"
    ```typescript
    import { useState, useEffect } from 'react';

    interface ExtractionStatus {
      status: 'idle' | 'running' | 'completed' | 'failed';
      topicsCreated: number;
      atomsCreated: number;
      linksCreated: number;
      error?: string;
    }

    export function useKnowledgeExtraction() {
      const [status, setStatus] = useState<ExtractionStatus>({
        status: 'idle',
        topicsCreated: 0,
        atomsCreated: 0,
        linksCreated: 0,
      });

      useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
          ws.send(JSON.stringify({
            action: 'subscribe',
            topic: 'knowledge'
          }));
        };

        ws.onmessage = (event) => {
          const { type, data } = JSON.parse(event.data);

          switch (type) {
            case 'knowledge.extraction_started':
              setStatus({ status: 'running', topicsCreated: 0, atomsCreated: 0, linksCreated: 0 });
              break;

            case 'knowledge.topic_created':
              setStatus((prev) => ({
                ...prev,
                topicsCreated: prev.topicsCreated + 1,
              }));
              break;

            case 'knowledge.atom_created':
              setStatus((prev) => ({
                ...prev,
                atomsCreated: prev.atomsCreated + 1,
              }));
              break;

            case 'knowledge.extraction_completed':
              setStatus({
                status: 'completed',
                topicsCreated: data.topics_created,
                atomsCreated: data.atoms_created,
                linksCreated: data.links_created,
              });
              break;

            case 'knowledge.extraction_failed':
              setStatus({
                status: 'failed',
                topicsCreated: 0,
                atomsCreated: 0,
                linksCreated: 0,
                error: data.error,
              });
              break;
          }
        };

        return () => ws.close();
      }, []);

      const triggerExtraction = async (messageIds: number[], agentConfigId: string) => {
        const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_ids: messageIds,
            agent_config_id: agentConfigId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }

        return response.json();
      };

      return { status, triggerExtraction };
    }
    ```

=== "Python"
    ```python
    import asyncio
    import httpx
    import websockets
    import json
    from typing import Callable

    class KnowledgeExtractionClient:
        def __init__(self, base_url: str = "http://localhost:8000"):
            self.base_url = base_url
            self.ws_url = base_url.replace("http", "ws") + "/ws"

        async def trigger_extraction(
            self,
            message_ids: list[int],
            agent_config_id: str
        ) -> dict:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/knowledge/extract",
                    json={
                        "message_ids": message_ids,
                        "agent_config_id": agent_config_id
                    }
                )
                response.raise_for_status()
                return response.json()

        async def listen_events(
            self,
            on_started: Callable | None = None,
            on_topic_created: Callable | None = None,
            on_atom_created: Callable | None = None,
            on_completed: Callable | None = None,
            on_failed: Callable | None = None,
        ):
            async with websockets.connect(self.ws_url) as websocket:
                await websocket.send(json.dumps({
                    "action": "subscribe",
                    "topic": "knowledge"
                }))
                async for message in websocket:
                    event = json.loads(message)
                    event_type = event["type"]
                    data = event["data"]

                    if event_type == "knowledge.extraction_started" and on_started:
                        on_started(data)
                    elif event_type == "knowledge.topic_created" and on_topic_created:
                        on_topic_created(data)
                    elif event_type == "knowledge.atom_created" and on_atom_created:
                        on_atom_created(data)
                    elif event_type == "knowledge.extraction_completed" and on_completed:
                        on_completed(data)
                    elif event_type == "knowledge.extraction_failed" and on_failed:
                        on_failed(data)

    # Usage example
    async def main():
        client = KnowledgeExtractionClient()

        # Trigger extraction
        result = await client.trigger_extraction(
            message_ids=[1, 2, 3, 4, 5],
            agent_config_id="550e8400-e29b-41d4-a716-446655440000"
        )
        print(f"Queued: {result['message']}")

        # Listen for events
        await client.listen_events(
            on_started=lambda d: print(f"Started analyzing {d['message_count']} messages"),
            on_topic_created=lambda d: print(f"Created topic: {d['topic_name']}"),
            on_atom_created=lambda d: print(f"Created atom: {d['atom_title']} ({d['atom_type']})"),
            on_completed=lambda d: print(f"Completed: {d['topics_created']} topics, {d['atoms_created']} atoms"),
            on_failed=lambda d: print(f"Failed: {d['error']}")
        )

    asyncio.run(main())
    ```

---

## Related API Operations

The Knowledge Extraction API creates and manages topics and atoms that can be further refined through dedicated management endpoints.

### Topics Management

Topics created by the extraction process can be managed independently using the Topics API:

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **List** | `GET /api/v1/topics` | Retrieve all topics with pagination |
| **Get by ID** | `GET /api/v1/topics/{topic_id}` | Retrieve a specific topic |
| **Create** | `POST /api/v1/topics` | Create a new topic manually |
| **Update** | `PATCH /api/v1/topics/{topic_id}` | Modify topic name, description, icon, or color |
| **Get Atoms** | `GET /api/v1/topics/{topic_id}/atoms` | List all atoms in a topic |
| **Get Messages** | `GET /api/v1/topics/{topic_id}/messages` | List all messages associated with a topic |
| **Get Recent** | `GET /api/v1/topics/recent` | Retrieve topics by recent activity |
| **Get Icons** | `GET /api/v1/topics/icons` | List available icon options |

!!! tip "Topic Enhancement"
    After extraction creates topics, use the Topics API to refine descriptions, add custom icons/colors, or reorganize the hierarchy.

### Atoms Management

Atoms created by extraction can be managed, linked, and versioned using the Atoms API:

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **List** | `GET /api/v1/atoms` | Retrieve all atoms with pagination |
| **Get by ID** | `GET /api/v1/atoms/{atom_id}` | Retrieve a specific atom |
| **Create** | `POST /api/v1/atoms` | Create a new atom manually |
| **Update** | `PATCH /api/v1/atoms/{atom_id}` | Modify atom title, content, type, or approval status |
| **Delete** | `DELETE /api/v1/atoms/{atom_id}` | Remove an atom |
| **Link to Topic** | `POST /api/v1/atoms/{atom_id}/topics/{topic_id}` | Associate an atom with a topic |

!!! tip "Atom Refinement"
    Use the Atoms API to add manual atoms, update confidence scores, approve/reject auto-created atoms, or manage relationships between atoms.

### Versioning Operations

When extraction creates or updates topics/atoms, version snapshots are created. Manage versioning using the Versions API:

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **Topic Versions** | `GET /api/v1/versions/topics/{topic_id}` | List all version snapshots for a topic |
| **Topic Diff** | `GET /api/v1/versions/topics/{topic_id}/diff` | Compare two topic versions |
| **Approve Topic** | `POST /api/v1/versions/topics/{version_id}/approve` | Accept a topic version change |
| **Reject Topic** | `POST /api/v1/versions/topics/{version_id}/reject` | Decline a topic version change |
| **Atom Versions** | `GET /api/v1/versions/atoms/{atom_id}` | List all version snapshots for an atom |
| **Atom Diff** | `GET /api/v1/versions/atoms/{atom_id}/diff` | Compare two atom versions |
| **Approve Atom** | `POST /api/v1/versions/atoms/{version_id}/approve` | Accept an atom version change |
| **Reject Atom** | `POST /api/v1/versions/atoms/{version_id}/reject` | Decline an atom version change |

!!! warning "Version Approval Workflow"
    When re-extraction detects changes to existing topics/atoms, versions are created requiring approval. Reject changes you don't want to keep.

---

## Rate Limits

!!! warning "Current Limits"
    - **No hard rate limits** currently enforced
    - **Recommended:** Max 1 concurrent extraction per project
    - **Batch size:** 1-100 messages (10-50 recommended)
    - **Provider limits:** Depends on LLM provider (Ollama local, OpenAI has API limits)

---

## Changelog

### v1.0.0 (Current)

- Initial release of Knowledge Extraction API
- Manual extraction via POST /extract
- WebSocket real-time event broadcasting
- Support for Ollama and OpenAI providers
- Structured output using Pydantic AI

---

!!! question "Need Help?"
    - Check [User Guide](/knowledge-extraction) for feature overview
    - Review [Developer Guide](/architecture/knowledge-extraction) for implementation details
    - Report issues or request features via the project repository
