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
      message_ids: number[],    // Required: 1-100 message IDs to analyze
      provider_id: string       // Required: UUID of active LLM provider
    }
    ```

=== "Example"
    ```json
    {
      "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "provider_id": "550e8400-e29b-41d4-a716-446655440000"
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
                "provider_id": "550e8400-e29b-41d4-a716-446655440000"
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
        provider_id: '550e8400-e29b-41d4-a716-446655440000'
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
        "provider_id": "550e8400-e29b-41d4-a716-446655440000"
      }'
    ```

#### Response

**Status:** `202 Accepted` - Task queued successfully

=== "Schema"
    ```typescript
    {
      message: string,          // Success message
      message_count: number,    // Number of messages queued
      provider_id: string       // Provider UUID used
    }
    ```

=== "Example"
    ```json
    {
      "message": "Knowledge extraction queued for 10 messages",
      "message_count": 10,
      "provider_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

#### Errors

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Bad Request | Invalid request (message count not in 1-100 range) |
| `404` | Not Found | Provider with given UUID not found |
| `422` | Unprocessable Entity | Provider exists but is not active |

=== "400 - Invalid Request"
    ```json
    {
      "detail": "message_ids must contain between 1 and 100 message IDs"
    }
    ```

=== "404 - Provider Not Found"
    ```json
    {
      "detail": "Provider 550e8400-e29b-41d4-a716-446655440000 not found"
    }
    ```

=== "422 - Provider Inactive"
    ```json
    {
      "detail": "Provider 'Ollama Local' is not active"
    }
    ```

#### Best Practices

!!! tip "Optimal Batch Size"
    For best extraction quality, use **10-50 messages** per request. Smaller batches may lack context, larger batches may overwhelm the LLM.

!!! warning "Rate Limiting"
    Avoid triggering multiple extractions simultaneously. Wait for the previous extraction to complete before starting a new one.

!!! info "Provider Requirements"
    - Provider must be active (`is_active = true`)
    - Ollama providers need valid `base_url`
    - OpenAI providers need valid API key
    - Model must support structured output (JSON mode)

---

## WebSocket Events

Subscribe to real-time extraction progress updates.

### Connection

**URL:** `ws://localhost:8000/ws/knowledge`

=== "JavaScript"
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/ws/knowledge');

    ws.onopen = () => {
      console.log('Connected to knowledge extraction updates');
    };

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      handleEvent(type, data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from knowledge extraction updates');
    };
    ```

=== "Python"
    ```python
    import asyncio
    import websockets
    import json

    async def listen_extraction_events():
        uri = "ws://localhost:8000/ws/knowledge"
        async with websockets.connect(uri) as websocket:
            print("Connected to knowledge extraction updates")

            async for message in websocket:
                event = json.loads(message)
                print(f"Event: {event['type']}")
                print(f"Data: {event['data']}")

    asyncio.run(listen_extraction_events())
    ```

### Event Types

#### extraction_started

Emitted when extraction task begins processing.

```json
{
  "type": "knowledge.extraction_started",
  "data": {
    "message_count": 15,
    "provider_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message_count` | number | Number of messages being analyzed |
| `provider_id` | string | UUID of LLM provider used |

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

---

#### extraction_completed

Emitted when extraction task finishes successfully.

```json
{
  "type": "knowledge.extraction_completed",
  "data": {
    "message_count": 15,
    "topics_created": 2,
    "atoms_created": 8,
    "links_created": 5,
    "messages_updated": 15
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message_count` | number | Total messages analyzed |
| `topics_created` | number | Number of new topics created |
| `atoms_created` | number | Number of new atoms created |
| `links_created` | number | Number of atom links created |
| `messages_updated` | number | Number of messages assigned to topics |

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
        const ws = new WebSocket('ws://localhost:8000/ws/knowledge');

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

      const triggerExtraction = async (messageIds: number[], providerId: string) => {
        const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_ids: messageIds,
            provider_id: providerId,
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
            self.ws_url = base_url.replace("http", "ws") + "/ws/knowledge"

        async def trigger_extraction(
            self,
            message_ids: list[int],
            provider_id: str
        ) -> dict:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/knowledge/extract",
                    json={
                        "message_ids": message_ids,
                        "provider_id": provider_id
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
            provider_id="550e8400-e29b-41d4-a716-446655440000"
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
