# Backend API Contracts

This specification defines the HTTP API for the Task Tracker backend. It is the authoritative contract. Implementation must conform to this spec. Where current code diverges, [NEEDS CLARIFICATION] notes are added with fix suggestions.

- Related implementation: @{backend/app/routers.py}, @{backend/app/models.py}, @{backend/app/schemas.py}
- Related realtime spec: @{specs/backend/realtime.md}
- Related webhook spec: @{specs/backend/webhook-management.md}
- Legacy reference: @{API_DOCUMENTATION.md}

## 1. Base
- Base URL: http://localhost:8000
- API prefix: /api
- Content type: application/json
- Time formats: ISO 8601 (UTC, e.g., `2025-01-15T10:30:00Z`)

## 2. Health & Config
- GET `/api/health`
  - 200 OK → `{ "status": "healthy", "timestamp": "<ISO 8601>" }`

- GET `/api/config`
  - 200 OK → `{ "wsUrl": "ws://<host>/ws", "apiBaseUrl": "http://<host>" }`
  - Note: current implementation returns `wsUrl` and `apiBaseUrl`. Legacy docs show `websocket_url` and `api_base_url`. [NEEDS CLARIFICATION] Align naming across backend and docs/UI.

## 3. Messages
- POST `/api/messages`
  - Purpose: Create a new message from external system (or manual test) and broadcast in realtime.
  - Request body:
    ```json
    {
      "id": "string",                // original message id
      "content": "string",
      "author": "string",
      "timestamp": "2025-01-15T10:20:00Z",
      "chat_id": "string",
      "user_id": 123456,
      "avatar_url": "https://..."   // optional, will be resolved if missing
    }
    ```
  - Behavior:
    - Ensures a `simple_sources` record named `api` exists.
    - Persists as `simple_messages` with resolved `avatar_url` (may use Telegram fallback when `user_id` present).
    - Broadcasts `message.new` over WS; see @{specs/backend/realtime.md}.
  - Response:
    - 200 OK → `{ "status": "message received", "id": <number> }`
    - [NEEDS CLARIFICATION] Prefer returning full `MessageResponse` for consistency.

- GET `/api/messages`
  - Query params:
    - `limit`: integer, default 50
    - `author`: string (ilike match)
    - `source`: string (ilike match)
    - `date_from`: YYYY-MM-DD
    - `date_to`: YYYY-MM-DD
  - 200 OK → `MessageResponse[]`
  - `MessageResponse`:
    ```json
    {
      "id": 1,
      "external_message_id": "abc-123",
      "content": "...",
      "author": "John",
      "sent_at": "2025-01-15T10:20:00Z",
      "source_name": "telegram|api|...",
      "analyzed": false,
      "avatar_url": "https://...",
      "persisted": true
    }
    ```

- GET `/api/messages/filters`
  - 200 OK →
    ```json
    {
      "authors": ["John", "Anna"],
      "sources": ["telegram", "api"],
      "total_messages": 42,
      "date_range": { "earliest": "2025-01-01", "latest": "2025-01-15" }
    }
    ```

## 4. Tasks
- GET `/api/tasks`
  - 200 OK → `TaskResponse[]`

- POST `/api/tasks`
  - Request body (`TaskCreateRequest`):
    ```json
    { "title": "string", "description": "string", "category": "bug|feature|improvement|question|chore", "priority": "low|medium|high|critical", "source": "string" }
    ```
  - 201 Created → `TaskResponse`
  - Side effects: Broadcasts `task_created` over WS.

- GET `/api/tasks/{task_id}`
  - 200 OK → `TaskResponse`
  - 404 Not Found

- PUT `/api/tasks/{task_id}/status`
  - Request body:
    ```json
    { "status": "pending|in_progress|completed|cancelled|open" }
    ```
  - 200 OK → `{ "message": "Task status updated", "task_id": <id>, "status": "..." }`
  - [NEEDS CLARIFICATION] Consider returning updated `TaskResponse` for consistency and FE alignment.

`TaskResponse` example:
```json
{
  "id": 1,
  "title": "Fix auth bug",
  "description": "...",
  "category": "bug",
  "priority": "high",
  "source": "api",
  "created_at": "2025-01-15T10:15:00Z",
  "status": "open"
}
```

## 5. Stats & Activity
- GET `/api/stats`
  - 200 OK →
    ```json
    {
      "total_tasks": 42,
      "open_tasks": 15,
      "completed_tasks": 19,
      "categories": {"bug": 18, "feature": 12},
      "priorities": {"low": 10, "medium": 20, "high": 8, "critical": 4}
    }
    ```
  - [NEEDS CLARIFICATION] Frontend expects `pending`, `in_progress`, `completed`, `cancelled`. Either map `open_tasks` → `pending` and add counts, or update FE. Define authoritative shape here and align code and FE.

- GET `/api/activity`
  - Query params:
    - `period`: `week` (default) or `month`
    - `month`: 0-11 (for month period)
    - `year`: number (for month period)
  - 200 OK →
    ```json
    {
      "data": [ { "timestamp": "2025-01-15T10:00:00Z", "source": "telegram", "count": 1 } ],
      "period": { "type": "week|month", "start": "<ISO>", "end": "<ISO>", "month": 0, "year": 2025 },
      "total_messages": 123
    }
    ```

## 6. Webhook Management (Telegram)
- GET `/api/webhook-settings`
  - 200 OK → `WebhookConfigResponse`:
    ```json
    {
      "telegram": {
        "protocol": "http|https",
        "host": "example.ngrok.io",
        "webhook_url": "https://example.ngrok.io/webhook/telegram",
        "is_active": true,
        "last_set_at": "2025-01-15T09:00:00Z",
        "groups": [{"id": -100123, "name": "Support"}]
      },
      "default_protocol": "http|https",
      "default_host": "localhost"
    }
    ```

- POST `/api/webhook-settings`
  - Request body:
    ```json
    { "protocol": "http|https", "host": "example.ngrok.io" }
    ```
  - 200 OK → `TelegramWebhookConfig`

- POST `/api/webhook-settings/telegram/set`
  - Request body: same as above
  - 200 OK → `SetWebhookResponse`

- DELETE `/api/webhook-settings/telegram`
  - 200 OK → `SetWebhookResponse`

- GET `/api/webhook-settings/telegram/info`
  - 200 OK → `{ "success": true, "webhook_info": { ...Telegram getWebhookInfo... } }`

- PUT `/api/webhook-settings/telegram/group-ids` (legacy)
  - Request: `{ "group_ids": [ -100123, -100456 ] }`
  - 200 OK → `TelegramWebhookConfig`
  - Deprecation plan: replace with granular groups endpoints below.

- [Planned] POST `/api/webhook-settings/telegram/groups`
  - Request: `{ "group_id": -100123 }`
  - 200 OK → `TelegramWebhookConfig`

- [Planned] DELETE `/api/webhook-settings/telegram/groups/{group_id}`
  - 200 OK → `TelegramWebhookConfig`

- [Planned] POST `/api/webhook-settings/telegram/groups/refresh-names`
  - 200 OK → `TelegramWebhookConfig`

Notes:
- Services for groups exist in @{backend/app/webhook_service.py} but routes are not implemented. [NEEDS CLARIFICATION] Implement these to match FE at @{frontend/src/pages/SettingsPage/index.tsx}.

## 7. Webhook Ingestion (External)
- POST `/webhook/telegram`
  - Called by Telegram servers.
  - 200 OK → `{ "status": "ok" }`
  - Side effects: instant WS broadcast `message.new` with temporary `id=0`; schedule background persistence via TaskIQ which later emits `message.updated`.

## 8. Errors & Validation
- Error response (generic):
  ```json
  { "detail": "Error description" }
  ```
- Validation errors follow FastAPI default structure.
- Common statuses: 200, 201 (create), 400 (bad request), 404 (not found), 500 (server error).

## 9. Security
- No authentication in current phase. [NEEDS CLARIFICATION] Define auth (e.g., token or session) before production.

## 10. Versioning
- Current unversioned under `/api`. [NEEDS CLARIFICATION] Introduce `/api/v1` once contracts stabilize.

## 11. Acceptance Criteria
- Endpoints above return shapes exactly as defined (or approved clarifications) and FE uses them without adapter shims.
- Webhook settings endpoints fully support FE operations (save, activate, delete, list/update groups, refresh names).
- WS events align with @{specs/backend/realtime.md} and are emitted on message/task events.
