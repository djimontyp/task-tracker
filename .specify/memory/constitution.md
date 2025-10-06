# Task Tracker Constitution

<!--
SYNC IMPACT REPORT - Constitution v1.0.0

Version Change: Initial creation (v1.0.0)

Core Principles Defined:
  I. Microservices Architecture
  II. Event-Driven Processing
  III. Test-First Development (NON-NEGOTIABLE)
  IV. Type Safety & Async First
  V. Real-Time Capabilities
  VI. Docker-First Deployment
  VII. API-First Design

Template Sync Status:
  ✅ plan-template.md - Constitution Check section references this document
  ✅ spec-template.md - Requirements align with architectural principles
  ✅ tasks-template.md - Task ordering enforces TDD and async patterns
  ⚠️  agent-file-template.md - May require updates for agent-specific guidance

Follow-up TODOs: None

Last Generated: 2025-10-04
-->

## Core Principles

### I. Microservices Architecture
Every feature MUST respect the six-service architecture: PostgreSQL (persistence), NATS (message broker), FastAPI (API), React Dashboard (UI), Nginx (proxy), TaskIQ Worker (background processing). Services MUST communicate via well-defined interfaces (REST API, WebSocket, NATS messages). No direct cross-service database access.

**Rationale**: Maintains separation of concerns, enables independent scaling, and supports distributed processing patterns essential for handling multiple communication channels.

### II. Event-Driven Processing
All background processing MUST use TaskIQ with NATS broker. Message processing from external channels (Telegram, Slack) MUST be asynchronous. Real-time updates MUST propagate via WebSocket to connected clients. No blocking operations in API request handlers.

**Rationale**: Ensures system responsiveness under load, enables horizontal scaling of workers, and provides reliable message delivery for task classification workflows.

### III. Test-First Development (NON-NEGOTIABLE)
TDD cycle is strictly enforced: Write tests → User approves → Tests fail → Implement → Tests pass. Contract tests required for all API endpoints before implementation. Integration tests required for cross-service communication. pytest-asyncio required for all async code testing.

**Rationale**: Async bugs are difficult to debug; tests catch race conditions early. Microservices require contract validation to prevent integration failures. Type safety without tests is insufficient.

### IV. Type Safety & Async First
Python code MUST use type hints for all public APIs and function signatures. FastAPI endpoints MUST use Pydantic models for request/response validation. Database operations MUST use async SQLAlchemy with SQLModel. No synchronous blocking in async contexts.

**Rationale**: Type safety prevents runtime errors in production. Async-first architecture required for handling concurrent message streams from multiple channels.

### V. Real-Time Capabilities
All state changes (new messages, task updates, status changes) MUST broadcast via WebSocket. Frontend MUST handle WebSocket reconnection gracefully. Real-time filtering MUST respect active client-side filters. Connection status MUST be visible to users.

**Rationale**: Task tracking requires immediate visibility of updates. Multiple users and automated systems generate concurrent updates requiring real-time synchronization.

### VI. Docker-First Deployment
All services MUST run in Docker containers. Development mode MUST support live reload via docker-compose watch. Environment-specific configuration via .env files. No hardcoded connection strings or secrets.

**Rationale**: Ensures consistency across development, staging, and production. Simplifies onboarding and reduces "works on my machine" issues.

### VII. API-First Design
All business logic MUST be accessible via REST API endpoints. Telegram bot and future integrations are API clients. OpenAPI documentation required for all endpoints. API versioning required for breaking changes.

**Rationale**: Enables multiple frontends (Web dashboard, Telegram bot, future mobile apps) to share the same backend logic without duplication.

## Development Standards

### Code Organization
- **Backend**: FastAPI app in `backend/app/`, core logic in `backend/core/`, tests in `backend/tests/`
- **Frontend**: React components in `frontend/src/components/`, services in `frontend/src/services/`
- **Shared**: Type definitions and contracts MUST be synchronized between frontend and backend
- **Documentation**: Agent-specific guidance in root `CLAUDE.md`, backend in `backend/CLAUDE.md`, frontend in `frontend/CLAUDE.md`

### Dependency Management
- **Backend**: Use `uv` for Python package management, lock dependencies with `uv lock`
- **Frontend**: Use `npm` for JavaScript packages, commit `package-lock.json`
- **Approval Required**: All new dependencies MUST be approved before adding to pyproject.toml or package.json
- **Security**: Run dependency audits before production deployment

### Database Migrations
- **Alembic Required**: All schema changes via Alembic migrations (`just alembic-auto`)
- **Autogenerate**: Use `alembic revision --autogenerate` with descriptive messages
- **No Raw SQL**: Schema modifications via SQLModel ORM definitions only
- **Review Required**: All migrations reviewed before applying to production

## Quality Gates

### Pre-Commit Checks
- **Linting**: `ruff check backend --fix` MUST pass
- **Formatting**: `ruff format backend` MUST pass
- **Type Checking**: No mypy errors (when enabled)
- **Tests**: Relevant test suite MUST pass (`just test`)

### Code Review Requirements
- Constitution compliance verified for architectural changes
- API contract changes reviewed for breaking changes
- Database migrations reviewed for data safety
- Performance impact assessed for high-traffic endpoints

### Performance Standards
- **API Response Time**: <200ms p95 for CRUD operations
- **WebSocket Latency**: <100ms for state updates
- **Task Processing**: Messages classified within 5 seconds
- **Database Queries**: Use pagination for list endpoints (max 1000 items)

## Security Requirements

### Authentication & Authorization
- Telegram bot token via environment variable only
- Webhook endpoints MUST validate incoming requests
- Rate limiting required for public API endpoints
- CORS configuration MUST be explicit (no wildcard in production)

### Data Protection
- No sensitive data in logs (redact tokens, passwords)
- User data subject to retention policies (defined per entity)
- Database backups required for production PostgreSQL
- Secrets via environment variables, never committed to git

## Governance

### Amendment Process
1. Propose constitution change with justification
2. Document impact on existing codebase
3. Update all dependent templates (plan, spec, tasks)
4. Increment version following semantic versioning
5. Update agent guidance files to reflect changes

### Version Policy
- **MAJOR**: Breaking architectural changes (new required service, removed principle)
- **MINOR**: New principle added, expanded standards
- **PATCH**: Clarifications, typo fixes, non-semantic improvements

### Compliance Review
- All pull requests MUST verify no constitutional violations
- Architecture changes require explicit justification in PR description
- Complexity deviations documented in `plan.md` Complexity Tracking section
- Regular reviews (quarterly) to identify outdated principles

### Enforcement
- Constitution supersedes all other development practices
- Violations blocking merge require approved exception or code fix
- Repeated violations trigger team discussion for principle revision
- Emergency exceptions require post-facto documentation and review

**Version**: 1.0.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2025-10-04
