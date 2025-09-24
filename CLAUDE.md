# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands (via justfile)

**Production Mode:**
- `just services` - Start all services (PostgreSQL, NATS, Worker, API, Dashboard) via Docker
- `just services-stop` - Stop all services

**Development Mode (with file watching):**
- `just services-dev` - Start all services with Docker Compose Watch (auto-reload on changes)
- `just dev SERVICE` - Start specific service in development mode (e.g., `just dev api`)
- `just rebuild SERVICE` - Force rebuild specific service without cache

**Local Development:**
- `just bot` - Run Telegram bot with aiogram (alternative to dockerized bot)
- `just worker` - Run TaskIQ worker locally (alternative to dockerized worker)
- `just test` - Run all tests
- `just lint` - Lint code with ruff (auto-fixes issues)
- `just fmt` - Format code with ruff
- `just check` - Run both lint and format

### Application Launch Commands
- `just bot` - Start Telegram bot with aiogram and WebApp support
- `just services` - Start all services in production mode
- `just services-dev` - Start all services in development mode with file watching

### Package Management
- `uv sync` - Install dependencies
- `uv sync --all-groups` - Install all dependency groups (dev, test)
- `uv run python -m pytest` - Run tests directly
- `uv run alembic upgrade head` - Apply database migrations

### Database Migrations
- `uv run alembic revision --autogenerate -m "description"` - Generate new migration
- `uv run alembic upgrade head` - Apply migrations
- PostgreSQL runs on port 5555 (not default 5432)

## Architecture Overview

This is a universal task tracking system that processes messages from various communication channels (Telegram, Slack, etc.) and automatically classifies them as issues/tasks using AI.

**Current Status**: Basic MVP with working Docker services for **Feodal AI Sprint 2.0**. All core services are operational: PostgreSQL, NATS, FastAPI API, React Dashboard, Telegram bot, and TaskIQ worker. The foundation is solid but requires integration between components to complete the AI-powered task classification workflow.

**New Services Added**:
- **FastAPI Backend** (`backend/`) - REST API with task management endpoints, accessible at http://localhost:8000
- **React Dashboard** (`frontend/`) - Basic web interface with real-time WebSocket connection, accessible at http://localhost:3000
- **Telegram WebApp** (`frontend/public/webapp/`) - Task creation interface, accessible at http://localhost/webapp

**Development Features**:
- **Docker Compose Watch** - Auto-reload services on file changes using `just services-dev`
- **Service-specific development** - Watch individual services with `just dev api` or `just dev dashboard`
- **Smart sync strategies** - Different actions for different file types (sync, sync+restart, rebuild)

### Core Architecture Pattern
The system follows a microservices event-driven pattern:
1. **Telegram Bot** (backend/app/telegram_bot.py) - aiogram-based bot with WebApp support
2. **FastAPI Backend** (backend/app/main.py) - REST API for task management and message processing
3. **React Dashboard** (frontend/) - Basic web interface with real-time message display via WebSocket
4. **Worker Service** - TaskIQ worker for background processing
5. **Docker Services** - PostgreSQL, NATS, and all application services

### Key Components

**Telegram Integration** (backend/app/telegram_bot.py):
- Modern aiogram 3 bot with WebApp support
- Command handlers (/start, /webapp, /dashboard, /help)
- Automatic message processing and forwarding to FastAPI
- WebApp integration for task creation
- Real-time notifications and inline keyboards
- Configurable via TELEGRAM_BOT_TOKEN environment variable

**FastAPI Backend** (backend/app/main.py):
- REST API with basic task/message management endpoints
- WebSocket support for real-time updates
- CORS middleware for cross-origin requests
- **Currently uses in-memory storage** (complex SQLModel schemas exist in backend/core/models.py but not connected)
- Telegram webhook endpoint functional
- Health checks and configuration endpoints

**Current API Endpoints:**
```
GET  /                     # API status
GET  /api/health          # Health check
GET  /api/config          # Client configuration
POST /api/messages        # Create message
GET  /api/messages        # Get messages list
POST /api/tasks           # Create task
GET  /api/tasks           # Get tasks list
GET  /api/tasks/{id}      # Get specific task
PUT  /api/tasks/{id}/status # Update task status
GET  /api/stats           # Task statistics
POST /webhook/telegram    # Telegram webhook
WS   /ws                  # WebSocket real-time updates
```

**LLM Integration** (backend/core/llm.py, backend/core/agents.py):
- Uses pydantic-ai with structured outputs via Pydantic models
- Supports Ollama provider (configurable via settings)
- Three main agents: classification, entity extraction, and analysis
- Structured schemas defined in backend/core/schemas.py (TextClassification, EntityExtraction, EntityStructured)

**Async Task Processing** (backend/core/worker.py, backend/core/taskiq_config.py):
- TaskIQ with NATS broker for distributed task processing
- NATS runs on default ports: 4222 (client), 6222 (routing), 8222 (monitoring)
- Worker can run either in Docker or locally via `just worker`

**Configuration** (backend/core/config.py):
- Pydantic Settings with .env file support
- Key settings: database_url, ollama_base_url, llm_provider, telegram_bot_token, telegram_group_chat_id
- Database uses PostgreSQL with asyncpg driver
- Logging level configurable via LOG_LEVEL or LOGURU_LEVEL

**Data Models**:
- **Pydantic Schemas** (backend/core/schemas.py): AI classification results, priorities, categories
- **SQLModel Database Models** (backend/core/models.py): Complex relational schema with Source, Stream, Message, Issue, Output, ProcessingJob tables
- **Current Gap**: API uses simple in-memory storage instead of the sophisticated database models
- Categories: bug, feature, improvement, question, chore | Priorities: low, medium, high, critical

### Message Processing Flow
1. **Telegram Bot** - aiogram bot receives messages and commands
2. **WebApp Integration** - Users create structured tasks via Telegram WebApp
3. **FastAPI Processing** - Messages forwarded to API for classification and storage
4. **LLM Classification** - AI agents classify message content and extract entities (when implemented)
5. **React Dashboard** - Users view tasks and statistics via web interface
6. **Real-time Updates** - WebSocket notifications back to Telegram users

### Testing Strategy
- Full test coverage in tests/ directory
- Async tests using pytest-asyncio
- Integration tests for TaskIQ/NATS (run `just services` first)
- LLM integration tests with comprehensive scenarios

### Development Notes
- Python 3.12+ required
- Uses uv for package management instead of pip/poetry
- Docker Compose for services (PostgreSQL, NATS, Worker)
- All services containerized with Docker and Docker Compose
- Telegram integration with modern aiogram library
- All code and comments should be in English

### Current System Status

**✅ Working Components (Verified):**
- **All Docker Services** - 6 services running: PostgreSQL, NATS, API, Dashboard, Nginx, Worker
- **FastAPI Backend** - All API endpoints functional, health checks pass:
  - GET / (API status) ✅
  - GET /api/health ✅
  - GET /api/config ✅
  - All CRUD endpoints for tasks/messages working
- **React Dashboard (Direct Access)** - Clean UI loads at http://localhost:3000
  - Modern, responsive design with emoji-enhanced interface
  - Proper responsive layout (mobile, tablet, desktop tested)
  - No JavaScript runtime errors
- **Development Environment** - justfile commands working, proper service orchestration

**❌ Critical Issues Found (Testing Results):**
- **WebSocket Connection Failure** - Dashboard tries connecting to ngrok URL instead of localhost:8000/ws
  - Error: "Unexpected response code: 502"
  - Impact: No real-time functionality works
- **Nginx Routing Broken** - http://localhost/dashboard returns 502 Bad Gateway
  - Impact: Primary dashboard access route unusable
- **Dashboard Incomplete** - Only static display, no interactive task management UI
  - Missing: task creation forms, status updates, navigation
  - Current state: View-only with connection status indicator

**⚠️ Current Architectural Gaps:**
- **Database Integration**: Complex SQLModel schemas exist but API uses in-memory storage
- **AI Classification**: LLM agents defined but not connected to API workflow
- **WebSocket Configuration**: Dashboard configured for external ngrok instead of local API
- **Test Coverage**: Only LLM and TaskIQ tests, missing API/bot integration tests

**🔄 Immediate Fixes Needed (High Priority):**
1. **Fix WebSocket URL** - Change React config from ngrok to ws://localhost:8000/ws
2. **Fix Nginx Configuration** - Resolve 502 error for /dashboard proxy route
3. **Complete Dashboard UI** - Add interactive task management components

**🔄 Next Integration Steps (Medium Priority):**
1. Connect SQLModel database models to FastAPI endpoints
2. Implement AI message classification in API workflow
3. Add comprehensive API and bot integration tests

### Testing Results Summary

**Last Tested**: September 2025 with MCP Playwright and specialized agents

**Service Status Check:**
```bash
just services  # ✅ All services start successfully
docker ps       # ✅ 6 containers running (postgres, nats, api, dashboard, nginx, worker)
```

**API Endpoints Verification:**
- ✅ `http://localhost:8000/api/health` - Returns healthy status
- ✅ `http://localhost:8000/` - API status working
- ✅ `http://localhost:8000/api/config` - Returns WebSocket/API config (shows ngrok URLs)

**Frontend Accessibility:**
- ✅ `http://localhost:3000` - React Dashboard loads properly
- ❌ `http://localhost/dashboard` - 502 Bad Gateway (nginx proxy issue)
- 🔄 `http://localhost/webapp` - Not tested yet

**Key Findings:**
1. **Configuration Issue**: API config endpoint returns ngrok URLs instead of localhost
2. **Proxy Problem**: Nginx not properly routing to React service
3. **WebSocket Failure**: Real-time features broken due to wrong endpoint URL
4. **UI Incomplete**: Dashboard is view-only, lacks task management functionality

### Quick Start
1. **Setup environment**: Copy `.env.example` to `.env` and configure:
   - `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
2. **Start all services**: `just services` (API, Dashboard, Database, etc.)
3. **Alternative - run bot locally**: `just bot` (for development)
4. **Access interfaces**:
   - 🌐 Web Dashboard: http://localhost (via nginx)
   - 📱 Telegram WebApp: http://localhost/webapp
   - 🔗 API: http://localhost/api
   - 📊 Direct services: API (8000), Dashboard (3000)

## Code Implementation Guidelines

### Python Dependencies Policy
**CRITICAL**: NEVER modify Python dependencies in `pyproject.toml`. Only the user can add/remove/update dependencies. This includes:
- Do NOT add new packages to `dependencies` array
- Do NOT modify versions of existing packages
- Do NOT suggest dependency changes in pyproject.toml
- If you need a new package, ask the user to add it manually

### MCP Context7 Integration
When implementing features or fixing bugs, **ALWAYS** use MCP context7 to retrieve up-to-date documentation and examples for libraries and frameworks used in this project:

- **Before implementing**: Use `resolve-library-id` and `get-library-docs` to get current documentation for relevant libraries (pydantic-ai, TaskIQ, NATS, Textual, FastAPI, SQLAlchemy, etc.)
- **During development**: Reference official docs and best practices to ensure code follows latest patterns and conventions
- **For troubleshooting**: Get specific documentation sections to resolve implementation issues correctly

This ensures all implementations use current best practices and maintain consistency with the latest library versions.

## System File Restrictions

**Claude Code MUST ALWAYS ignore these system directories and files:**

```
.venv/              # Python virtual environment
node_modules/       # Node.js dependencies
__pycache__/        # Python compiled bytecode
*.pyc               # Python compiled files
.git/               # Git repository data
.pytest_cache/      # Pytest cache
.coverage           # Coverage reports
.DS_Store           # macOS system files
*.log               # Log files
.env.local          # Local environment overrides
```

**Reasoning:**
- **Security**: May contain sensitive environment data
- **Performance**: Large volumes of unnecessary files
- **Stability**: Modifying these files can break development environment
- **Relevance**: Only contain generated/system files, never application code

This restriction applies globally to all projects and has absolute priority over any other instructions.