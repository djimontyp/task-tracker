# Task Tracker - AI-powered Task Classification System

## Architecture
Event-driven microservices: **Telegram Bot** → **FastAPI Backend** (REST + WebSocket) → **React Dashboard** + **TaskIQ Worker** (NATS broker) + **PostgreSQL** + **Docker**

## Stack
- **Backend**: FastAPI, SQLAlchemy, TaskIQ, aiogram 3, Pydantic-AI
- **Frontend**: React 18 + TypeScript, WebSocket, Docker Compose Watch
- **Infrastructure**: PostgreSQL (port 5555), NATS, Nginx

## Commands
- `just services` - Start all (postgres, nats, worker, api, dashboard, nginx)
- `just services-dev` - Development mode with live reload
- See @justfile for full list

## Guidelines
- **Delegation**: Use specialized agents (fastapi-backend-expert, react-frontend-architect)
- **Patterns**: Async/await, dependency injection, type safety
- **Forbidden**: Modify dependencies without approval, commit secrets

## Code Quality Standards
- **Comments**: Write self-documenting code. Comments should only explain complex logic/algorithms, not describe obvious code structure
  - ❌ BAD: `{/* Navigation Item */}`, `# Step 2: Update via API`, `// Create user object`
  - ✅ GOOD: Explain WHY, not WHAT (e.g., complex business rules, non-obvious optimizations, workarounds)
  - Rule: If code is self-explanatory, don't comment it. 80-90% of structural comments are noise