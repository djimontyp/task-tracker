# Task Tracker - AI-powered Task Classification System

## Architecture
Event-driven microservices: **Telegram Bot** → **FastAPI Backend** (REST + WebSocket) → **React Dashboard** + **TaskIQ Worker** (NATS broker) + **PostgreSQL** + **Docker**

## Stack
- **Backend**: FastAPI, SQLAlchemy, TaskIQ, aiogram 3, Pydantic-AI
- **Frontend**: React 18 + TypeScript, WebSocket, Docker Compose Watch
- **Infrastructure**: PostgreSQL (port 5555), NATS, Nginx

## Commands

! Always give preference to **just** commands instead of executing directly. For example, instead of pytest -> just test {ARGS}
! Prefer using Python commands via **uv run**

- `just services` - Start all (postgres, nats, worker, api, dashboard, nginx)
- `just services-dev` - Development mode with live reload
- `just typecheck` / `just tc` - Run mypy type checking on backend
- `just fmt` / `just f` - Format code with ruff
- See @justfile for full list

## Guidelines
- **Delegation**: Use specialized agents (fastapi-backend-expert, react-frontend-architect, ...(from available agents list))
- **Patterns**: Async/await, dependency injection, type safety with mypy static analysis
- **Quality**: Run `just typecheck` after backend changes to ensure type safety
- **Imports**: Use absolute imports only (e.g., `from app.models import User`), never relative imports (e.g., `from . import User`)
- **Forbidden**: Modify dependencies without approval, commit secrets, use relative imports

## Code Quality Standards
- **Comments**: Write self-documenting code. Comments should only explain complex logic/algorithms, not describe obvious code structure
    - **Forbidden**: Use comments to explain WHAT, not WHY
    - **Forbidden**: WRITE COMMENTS ON OBVIOUS THINGS AND EXPLAIN EVERY STEP IN THE CODE.
    - ❌ BAD: `{/* Navigation Item */}`, `# Step 2: Update via API`, `// Create user object`
    - ✅ GOOD: Explain WHY, not WHAT (e.g., complex business rules, non-obvious optimizations, workarounds)
    - Rule: If code is self-explanatory, don't comment it. 80-90% of structural comments are noise