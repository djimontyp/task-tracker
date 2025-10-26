# Task Tracker - AI-powered Task Classification System

## **Important** Use SKILLS proactively!

## Architecture
Event-driven microservices: **Telegram Bot** → **FastAPI Backend** (REST + WebSocket) → **React Dashboard** + **TaskIQ Worker** (NATS broker) + **PostgreSQL** + **Docker**

## Stack
- **Backend**: FastAPI, SQLAlchemy, TaskIQ, aiogram 3, Pydantic-AI
- **Frontend**: React 18 + TypeScript, WebSocket, Docker Compose Watch
- **Infrastructure**: PostgreSQL (port 5555), NATS, Nginx

## Backend Architecture

The backend implements a layered hexagonal architecture for LLM integration with comprehensive data modeling. The system processes Telegram messages through an auto-triggered task chain: webhook ingestion → message scoring → knowledge extraction. All LLM operations follow ports-and-adapters pattern for framework independence, while the database uses a versioning system for Topics and Atoms to support approval workflows.

**Architecture Documentation:**
- [Database Models](docs/content/en/architecture/models.md) - 21 models across 5 domains with ER diagrams
- [LLM Architecture](docs/content/en/architecture/llm-architecture.md) - Hexagonal (ports & adapters) design
- [Backend Services](docs/content/en/architecture/backend-services.md) - 30 services organized by domain
- [Background Tasks](docs/content/en/architecture/background-tasks.md) - TaskIQ + NATS async processing

**Key Features:**
- **Hexagonal Architecture**: Framework-agnostic LLM integration via protocols (swap Pydantic AI ↔ LangChain without domain changes)
- **Versioning System**: Topic/Atom approval workflow with draft → approved state transitions
- **Vector Database**: pgvector integration (1536 dimensions) for semantic search
- **Auto-Task Chain**: `save_telegram_message` → `score_message_task` → `extract_knowledge_from_messages_task`
- **Domain Organization**: 30 services across CRUD (10), LLM (4), Analysis (3), Vector DB (4), Knowledge (2), Infrastructure (4), Utilities (3)

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
  - **Research/Investigation**: Prefer specialized agents over direct exploration - they're more efficient and thorough
- **Patterns**: Async/await, dependency injection, type safety with mypy static analysis
- **Quality**: Run `just typecheck` after backend changes to ensure type safety
- **Imports**: Use absolute imports only (e.g., `from app.models import User`), never relative imports (e.g., `from . import User`)
- **Estimations**: NEVER provide time/effort estimates unless explicitly requested by user
- **Forbidden**: Modify dependencies without approval, commit secrets, use relative imports

## Code Quality Standards
- **Comments**: Write self-documenting code. Comments should only explain complex logic/algorithms, not describe obvious code structure
    - **Forbidden**: Use comments to explain WHAT, not WHY
    - **Forbidden**: WRITE COMMENTS ON OBVIOUS THINGS AND EXPLAIN EVERY STEP IN THE CODE.
    - ❌ BAD: `{/* Navigation Item */}`, `# Step 2: Update via API`, `// Create user object`
    - ✅ GOOD: Explain WHY, not WHAT (e.g., complex business rules, non-obvious optimizations, workarounds)
    - Rule: If code is self-explanatory, don't comment it. 80-90% of structural comments are noise

## Documentation

Project documentation is organized in `docs/content/{en,uk}/`:

```
docs/content/
├── en/
│   ├── api/
│   │   └── knowledge.md
│   ├── architecture/
│   │   ├── agent-system.md
│   │   ├── analysis-run-state-machine.md
│   │   ├── analysis-system.md
│   │   ├── backend-services.md
│   │   ├── background-tasks.md
│   │   ├── classification-experiments.md
│   │   ├── diagrams.md
│   │   ├── knowledge-extraction.md
│   │   ├── llm-architecture.md
│   │   ├── models.md
│   │   ├── noise-filtering.md
│   │   ├── overview.md
│   │   ├── vector-database.md
│   │   └── versioning-system.md
│   ├── frontend/
│   │   └── architecture.md
│   ├── operations/
│   │   ├── configuration.md
│   │   ├── deployment.md
│   │   └── security-privacy.md
│   ├── auto-save.md
│   ├── event-flow.md
│   ├── index.md
│   ├── knowledge-extraction.md
│   └── topics.md
├── uk/
│   ├── api/
│   │   └── knowledge.md
│   ├── architecture/
│   │   ├── agent-system.md
│   │   ├── analysis-run-state-machine.md
│   │   ├── analysis-system.md
│   │   ├── backend-services.md
│   │   ├── background-tasks.md
│   │   ├── classification-experiments.md
│   │   ├── diagrams.md
│   │   ├── knowledge-extraction.md
│   │   ├── llm-architecture.md
│   │   ├── models.md
│   │   ├── noise-filtering.md
│   │   ├── overview.md
│   │   ├── vector-database.md
│   │   └── versioning-system.md
│   ├── frontend/
│   │   └── architecture.md
│   ├── operations/
│   │   ├── configuration.md
│   │   ├── deployment.md
│   │   └── security-privacy.md
│   ├── auto-save.md
│   ├── event-flow.md
│   ├── index.md
│   ├── knowledge-extraction.md
│   └── topics.md
```

**Commands:**
- `just docs` - Serve documentation locally on http://127.0.0.1:8081
- **Source**: Bilingual markdown files in `docs/content/{en,uk}/`
- **Built site**: `docs/site/` (generated, gitignored)