# System Overview (PRD-Level)

This specification defines the product scope, constraints, acceptance criteria, and cross-references for the Task Tracker system. Code and runtime serve this specification.

- Related: @{ARCHITECTURE.md}, @{TECH_PLAN.md}, @{API_DOCUMENTATION.md}
- Related specs: @{specs/backend/data-model.md}, @{specs/backend/api-contracts.md}, @{specs/backend/realtime.md}, @{specs/backend/webhook-management.md}, @{specs/backend/worker.md}, @{specs/backend/ai-processing.md}, @{specs/frontend/dashboard.md}, @{specs/infra/nats.md}, @{specs/non-functional/security.md}, @{specs/non-functional/dev-workflow.md}, @{specs/quality/testing.md}

## 1. Problem & Goals
- Provide a universal mechanism to ingest team communication from multiple channels (initial: Telegram; later: Slack, Email, Discord) and convert it into actionable tasks.
- Deliver a real-time dashboard for monitoring messages, auto-classification, and task lifecycle.
- Ensure specifications remain the source of truth with clear contracts for API, data, real-time events, and infrastructure.

## 2. Users & Primary Use Cases
- Admin/Operator
  - Configure Telegram webhook base URL and manage monitored groups.
  - Observe real-time incoming messages and resulting tasks.
  - Run daily/periodic analysis and review summarised tasks.
- Developer/Analyst
  - Extend adapters and AI agents.
  - Validate API contracts and end-to-end flows.
- Team Member (future)
  - Use basic dashboard views; comment/react (future scope).

## 3. In Scope (Phase Now)
- Telegram ingestion via webhook: @{backend/app/routers.py} `POST /webhook/telegram` and background persistence.
- Webhook management API: @{backend/app/routers.py} under `/api/webhook-settings*` and service @{backend/app/webhook_service.py}.
- Task management API: list/create/update status; see @{backend/app/routers.py}.
- Messages API with filtering; see @{backend/app/routers.py}.
- Real-time WebSocket broadcasting (message.new, message.updated, task_created): @{backend/app/websocket.py}, @{backend/app/routers.py}.
- Worker processing (TaskIQ + NATS): @{backend/app/tasks.py}, @{backend/core/taskiq_config.py}, @{backend/core/worker.py}.
- Frontend dashboard pages and settings integration: @{frontend/src/pages/}.
- Infrastructure via Docker Compose and Nginx proxy: @{compose.yml}, @{nginx/nginx.conf}.

## 4. Out of Scope (Current Phase)
- Slack/Discord/Email adapters (placeholders in roadmap only).
- Authentication/authorization (to be added for production).
- Complex analytics and advanced search.

## 5. Architecture Summary
- Services (compose): Postgres, NATS (JetStream), API (FastAPI), Worker (TaskIQ), Dashboard (React), Nginx. See @{compose.yml}.
- API app: @{backend/app/main.py}, routers in @{backend/app/routers.py}, DB in @{backend/app/database.py}, models in @{backend/app/models.py}.
- Webhook management: @{backend/app/webhook_service.py}.
- Real-time: @{backend/app/websocket.py}.
- Worker & broker: @{backend/core/taskiq_config.py}, @{backend/core/worker.py}.
- Frontend pages: @{frontend/src/pages/} and UI doc @{frontend/ui.md}.

## 6. External Interfaces & Contracts
- HTTP API: see @{specs/backend/api-contracts.md}. For current implementation, also reference @{API_DOCUMENTATION.md} and @{backend/app/routers.py}.
- WebSocket: see @{specs/backend/realtime.md}.
- Data model: see @{specs/backend/data-model.md}.
- Background tasks & broker: see @{specs/backend/worker.md}.

## 7. Data Overview
- Current persisted tables (compatibility layer): `simple_sources`, `simple_messages`, `simple_tasks`, and `webhook_settings`. See @{backend/app/models.py}.
- Planned normalized models: `sources`, `messages`, `tasks` (SQLModel classes already defined). Migration strategy: in @{specs/backend/data-model.md}.

## 8. Non-Functional Requirements
- Performance
  - Webhook processing returns immediately (< 500ms) and enqueues DB persistence via TaskIQ.
  - Dashboard WS broadcast is near-real-time (sub-second for in-memory path).
- Reliability
  - NATS with JetStream for persistence and backpressure (see @{compose.yml}).
- Security
  - No secrets in specs. Secrets in `.env`; encryption for sensitive settings via @{backend/core/crypto.py}.
  - Nginx proxies public endpoints; TLS in production (see @{nginx/nginx.conf}).
- Observability
  - Console logs; structured events planned. WS debug prints in @{backend/app/websocket.py}.

## 9. Assumptions & Constraints
- Python 3.12+, dependencies in @{pyproject.toml} managed with `uv`.
- FastAPI-based API; React 18 dashboard with React Query; NATS broker for tasks.
- Deployment via Docker Compose; developer workflow uses `just` commands (see @{justfile}, @{DEVELOPMENT_WORKFLOW.md}).

## 10. Acceptance Criteria
- Webhook settings CRUD work through `/api/webhook-settings*`, persisting config in DB `webhook_settings` table and reflecting `is_active`/`last_set_at`.
- Telegram webhook handler accepts updates and instantly broadcasts `message.new` with avatar fallback; later `message.updated` after persistence.
- `POST /api/messages`, `GET /api/messages` support filters (author, source, dates) and return correct joined `source_name`.
- `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/{id}/status` operate and broadcast `task_created` on creation.
- Dashboard renders stats, recent messages/tasks, and WebSocket connectivity indicator.
- Nginx routes `/`, `/api`, `/ws`, `/webhook/*` to correct upstreams.
- Tests in `tests/` pass and cover webhook settings, telegram settings crypto, API/webhook flows. See @{tests/}.

## 11. Risks & Mitigations
- Telegram rate limits for avatars → cache and fallbacks (see @{backend/app/webhook_service.py}).
- Local vs DB state drift for webhook settings → deterministic precedence and refresh (see Settings page logic @{frontend/src/pages/SettingsPage/index.tsx}).
- WS disconnects → reconnection logic on client, server-side cleanup of dead connections.

## 12. Open Questions [NEEDS CLARIFICATION]
- Supported production auth model for API and WS? [NEEDS CLARIFICATION]
- Slack/Email/Discord adapter sequence and minimal contracts? [NEEDS CLARIFICATION]
- Rate limiting and abuse prevention strategy? [NEEDS CLARIFICATION]
- Persistence strategy for AI classification results (current fields exist, usage plan)? [NEEDS CLARIFICATION]
