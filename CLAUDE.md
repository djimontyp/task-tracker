# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands (via justfile)

**Production Mode:**
- `just services` - Start all services (PostgreSQL, NATS, Worker, API, Dashboard) via Docker
- `just services-stop` - Stop all services

**Development Mode (with file watching):**
- `just services-dev` - Start all services with Docker Compose Watch (auto-reload on changes)
  - **✅ Live CSS/JS Sync**: Frontend файли синхронізуються без rebuild
  - **✅ Backend Hot Reload**: Python код оновлюється з sync+restart
  - **✅ File Watching**: Автоматичне відстеження змін у `./frontend/src` та `./backend/`
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
- `just bot` - Start Telegram bot with aiogram
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

**Development Features**:
- **Docker Compose Watch** - Auto-reload services on file changes using `just services-dev`
- **Service-specific development** - Watch individual services with `just dev api` or `just dev dashboard`
- **Smart sync strategies** - Different actions for different file types (sync, sync+restart, rebuild)

### Core Architecture Pattern
The system follows a microservices event-driven pattern:
1. **Telegram Bot** (backend/app/telegram_bot.py) - aiogram-based bot
2. **FastAPI Backend** (backend/app/main.py) - REST API for task management and message processing
3. **React Dashboard** (frontend/) - Basic web interface with real-time message display via WebSocket
4. **Worker Service** - TaskIQ worker for background processing
5. **Docker Services** - PostgreSQL, NATS, and all application services

### Key Components

**Telegram Integration** (backend/app/telegram_bot.py):
- Modern aiogram 3 bot with proper relative imports
- Command handlers (/start, /help) with WebApp integration
- HTTP client for FastAPI communication via httpx
- Real-time notifications and inline keyboards
- Configurable via TELEGRAM_BOT_TOKEN environment variable
- Clean import structure without sys.path manipulation

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

**Async Task Processing** (backend/app/tasks.py, backend/core/taskiq_config.py):
- TaskIQ with NATS broker for distributed task processing
- NATS runs on default ports: 4222 (client), 6222 (routing), 8222 (monitoring)
- Basic task example for message processing (backend/app/tasks.py)
- Worker can run either in Docker (default) or locally via `just worker`
- **Current State**: Minimal TaskIQ integration, not connected to LLM processing workflow

**Configuration** (backend/core/config.py):
- Pydantic Settings with .env file support
- Key settings: database_url, ollama_base_url, llm_provider, telegram_bot_token, telegram_group_chat_id
- Database uses PostgreSQL with asyncpg driver
- Logging level configurable via LOG_LEVEL or LOGURU_LEVEL

**Data Models**:
- **Pydantic Schemas** (backend/core/schemas.py): AI classification results, priorities, categories
- **SQLModel Database Models** (backend/app/models.py): Complex relational schema with Source, Stream, Message, Issue, Output, ProcessingJob, LLMProvider tables
- **API Pydantic Models** (backend/app/main.py): Simple TaskCreate, Task, Message, Stats models for in-memory storage
- **Current Gap**: API uses in-memory storage instead of the sophisticated SQLModel database models
- **Model Duplication**: Task and Message classes exist in both main.py (simple) and models.py (complex SQLModel)
- Categories: bug, feature, improvement, question, chore | Priorities: low, medium, high, critical

### Message Processing Flow
1. **Telegram Bot** - aiogram bot receives messages and commands
2. **Message Processing** - Users send messages via Telegram bot
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

**✅ Working Components (Verified as of September 2025):**
- **All Docker Services** - 6 services running successfully: PostgreSQL, NATS, API, Dashboard, Nginx, Worker
- **FastAPI Backend** - All API endpoints functional, health checks pass:
  - GET / (API status) ✅
  - GET /api/health ✅
  - GET /api/config ✅ (now returns correct localhost URLs)
  - All CRUD endpoints for tasks/messages working
- **React Dashboard** - TypeScript React app working at http://localhost:3000
  - Modern responsive design with dark theme
  - Clean build process via Docker
  - No JavaScript runtime errors
- **Development Environment** - justfile commands working, proper service orchestration
- **Telegram Bot** - Modern aiogram 3 implementation with correct relative imports

**✅ Recently Fixed (September 2025) - Complete Backend Architecture Overhaul:**

**Phase 4 - Frontend UI/UX Improvements (NEW - September 2025):**
- **✅ Tab Navigation Enhancement**: Повністю перероблена система табів з професійним дизайном:
  - **Центрування**: Табы ідеально центровані з `justify-content: center`
  - **2K Monitor Support**: Адаптивні розміри для high-DPI displays:
    - Базові: `1.5rem 3rem` padding, `1.25rem` font, `1.75rem` icons
    - 2K: `2rem 4rem` padding, `1.5rem` font, `2.25rem` icons
    - 4K: `2.5rem 5rem` padding, `1.75rem` font, `2.5rem` icons
  - **Мінімалістичний дизайн**: Убрані закруглення та синя обводка для чіткого переходу в header
  - **Hover анімації**: GPU-прискорені ефекти підйому, масштабування, тіней
  - **Responsive**: Окремі стилі для мобільних з bottom navigation bar
- **✅ Layout Optimization**: Оптимізована структура dashboard:
  - **Hover Status Indicator**: Статус ConnectionStatus перенесено в елегантний tooltip (правий верхній кут)
  - **Content Hierarchy**: Видалено дублювання назв, підняті статистики вгору
  - **Flexible Layout**: Messages container розтягується на весь екран з `flex: 1`
  - **Visual Balance**: Зменшені відступи для кращого використання простору
- **✅ Docker Compose Watch Integration**: Налаштована повноцінна синхронізація файлів:
  - **Fixed compose.yml**: Убрано `profiles: production` з dashboard service
  - **Watch Configuration**: Додано `develop.watch` для frontend файлів
  - **Live Reload**: `just services-dev` синхронізує зміни CSS/JS без rebuild
  - **File Sync**: Автоматична синхронізація `./frontend/src` → `/app/src` в контейнер

**✅ Recently Fixed (September 2025) - Complete Backend Architecture Overhaul:**

**Phase 1 - Code Organization:**
- **✅ Code Organization**: Успішно розділено `main.py` на логічні компоненти:
  - `app/main.py` - тільки FastAPI app setup та middleware
  - `app/routers.py` - всі API endpoints
  - `app/websocket.py` - ConnectionManager для WebSocket
  - `app/database.py` - async database session management
  - `app/dependencies.py` - FastAPI dependencies з modern Annotated patterns
- **✅ Model Duplication Removed**: Видалено дубльовані моделі з `main.py`
- **✅ Hardcode Elimination**: Замінено хардкод URLs на використання `core/config.py`

**Phase 2 - Database Integration:**
- **✅ Database Integration Complete**: Замінено in-memory storage на повноцінну SQLModel database integration:
  - `app/api_schemas.py` - спрощені SQLModel таблиці (SimpleTask, SimpleMessage, SimpleSource)
  - Async database operations через SQLAlchemy/SQLModel
  - Proper database sessions з dependency injection
  - Auto-creation таблиць при старті через `create_db_and_tables()`
- **✅ Full CRUD Operations**: Всі endpoints працюють з database:
  - Tasks: create, read, update status, statistics
  - Messages: create, read, WebSocket broadcasting
  - Persistent data storage between requests
- **✅ Modern FastAPI Patterns**: DatabaseDep, SettingsDep dependencies

**Phase 3 - Docker Optimization (NEW - September 2025):**
- **✅ Multi-stage Dockerfile**: Оптимізовано backend/Dockerfile з 2-stage build:
  - **Dependencies Stage**: встановлення залежностей з `uv sync --locked --no-dev`
  - **Application Stage**: копіювання `.venv` та коду додатку
- **✅ Proper uv Integration**: Правильне використання uv в Docker:
  - ❌ НЕ ПРАЦЮЄ: `uv export` + `pip install` або `uv pip sync`
  - ✅ ПРАЦЮЄ: `uv sync --locked --no-dev` + копіювання `.venv` між stages
- **✅ Docker Layer Optimization**: Залежності кешуються окремо від коду для швидшого rebuild
- **✅ Security**: Non-root user `appuser` у фінальному образі
- **✅ Size Optimization**: Compile-time залежності (gcc) не потрапляють у фінальний образ

**⚠️ Current Architectural Gaps (Updated):**
- **AI Classification**: LLM agents defined in `backend/core/agents.py` but not connected to API workflow
- **TaskIQ Integration**: Basic TaskIQ setup exists but minimal integration with LLM processing
- **Test Coverage**: Limited to LLM and TaskIQ tests, missing comprehensive API/bot integration tests
- **Advanced Models**: Complex SQLModel schemas in `models.py` not utilized (using simplified schemas instead)

**✅ Database Integration Status (September 2025):**
- **Message Storage**: ✅ WORKING - Telegram messages persist to database correctly
- **Schema**: Both complex (`source`, `message`) and simple (`simple_sources`, `simple_messages`) schemas exist
- **Current Usage**: API uses simple schema tables for reliable message storage
- **Timezone Handling**: ✅ FIXED - UTC timestamps properly converted to timezone-naive format
- **Testing**: ✅ VERIFIED - PostgreSQL MCP confirms message persistence

**✅ Recently Resolved Issues (September 2025):**
- **Telegram Message Database Storage**: ✅ FIXED - Messages now properly stored in database
  - **Root Cause**: Schema mismatch between complex schema (alembic) and simple schema (API), plus datetime timezone issues
  - **Solution**: Fixed datetime timezone conversion (`.replace(tzinfo=None)`) and ensured proper table usage
  - **Result**: All Telegram messages successfully stored in `simple_messages` table with correct UTC timestamps
  - **Status**: Full message persistence working, verified with PostgreSQL MCP testing
  - **Files Modified**: `backend/app/routers.py` (datetime conversion), `backend/app/tasks.py` (TaskIQ worker)

- **Telegram Webhook 405 Errors**: ✅ FIXED - Added POST handler for root endpoint
  - **Root Cause**: External service or misconfigured webhook sending POST to `/` instead of `/webhook/telegram`
  - **Solution**: Added `@router.post("/")` handler to gracefully handle and log unexpected requests
  - **Result**: No more 405 errors, system provides helpful redirect message
  - **Status**: Real-time messaging working properly, no more error logs

**🔄 Next Integration Steps (High Priority):**
1. **AI Classification**: Connect LLM agents to message processing pipeline in API endpoints
2. **TaskIQ-LLM Integration**: Implement background AI processing tasks for message classification
3. **Advanced Schema Migration**: Move from simplified to full SQLModel schemas with relationships

**🔄 Code Quality Improvements (Medium Priority):**
1. Add comprehensive integration tests for API-bot-database flow
2. Implement proper database session management
3. Add interactive task management UI components to React dashboard
4. Configure CORS properly for production environment

### Testing Results Summary

**Last Tested**: September 2025 with comprehensive service analysis

**Service Status Check:**
```bash
just services  # ✅ All services start successfully
docker ps       # ✅ 6 containers running (postgres, nats, api, dashboard, nginx, worker)
```

**API Endpoints Verification:**
- ✅ `http://localhost:8000/api/health` - Returns healthy status with timestamp
- ✅ `http://localhost:8000/` - API status working ("Task Tracker API", "status": "running")
- ✅ `http://localhost:8000/api/config` - Returns correct localhost WebSocket and API URLs

**Frontend Status:**
- ✅ `http://localhost:3000` - **React Dashboard fully operational**
  - TypeScript React 18.3.1 application
  - Modern build pipeline with react-scripts 5.0.1
  - **Enhanced Tab Navigation**: Центровані табы з адаптивними розмірами для 2K+ мониторів
  - **Optimized Layout**: Hover status indicator, flexible messages container, improved content hierarchy
  - **Docker Watch Integration**: Live CSS/JS sync без rebuild через `just services-dev`
  - Successfully serves built static files via nginx in Docker

**Architecture Verification:**
- ✅ **Docker Compose**: 6-service architecture with proper dependencies
- ✅ **File Structure**: Complete backend architecture with database integration:
  ```
  backend/
  ├── core/              # конфіги, LLM, логінг
  │   ├── config.py      # settings з database URLs
  │   ├── agents.py      # LLM classification agents
  │   └── ...
  └── app/               # повністю інтегрований API код
      ├── main.py        # FastAPI app setup (45 рядків)
      ├── routers.py     # API endpoints з database integration (275 рядків)
      ├── websocket.py   # WebSocket ConnectionManager
      ├── database.py    # async session management + create_db_and_tables
      ├── dependencies.py # DatabaseDep, SettingsDep з Annotated patterns
      ├── api_schemas.py # спрощені SQLModel таблиці для API (NEW)
      ├── models.py      # комплексні SQLModel schemas (не використовуються)
      └── ...
  ```
- ✅ **Development Workflow**: justfile automation for common development tasks
- ✅ **Database Integration**: Повна заміна in-memory storage на SQLModel database operations
- ✅ **Modern Patterns**: Async CRUD, dependency injection, type safety

**Key Current State:**
1. **✅ Infrastructure**: All services containerized and running reliably
2. **✅ API Foundation**: FastAPI with WebSocket support and CORS configured
3. **✅ Frontend Foundation**: React TypeScript app with proper build process
4. **🔄 Integration Gap**: Need to connect SQLModel database schemas to FastAPI endpoints
5. **🔄 AI Processing**: LLM agents exist but not integrated into message processing workflow

### Quick Start
1. **Setup environment**: Copy `.env.example` to `.env` and configure:
   - `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
2. **Start all services**: `just services` (PostgreSQL, NATS, API, Dashboard, Worker, Nginx)
3. **Alternative - run bot locally**: `just bot` (for development)
4. **Access interfaces**:
   - 🌐 React Dashboard: http://localhost:3000 (direct access)
   - 🔗 API: http://localhost:8000 (direct access)
   - 📱 Nginx Proxy: http://localhost (proxies to services)
   - 📊 API Health: http://localhost:8000/api/health

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

## Task Delegation Guidelines

### Strict Delegation Policy - CRITICAL

**Claude Code MUST delegate tasks to specialized sub-agents whenever an appropriate agent exists. Only handle tasks directly when NO suitable agent is available.**

#### **MANDATORY Delegation Rules:**

1. **ALWAYS delegate first** - Before handling any non-trivial task, check if a specialized agent exists
2. **NEVER bypass agents** - Do not handle tasks that fall within an agent's expertise
3. **Multiple agents in parallel** - Use multiple agents concurrently when task requires different specializations
4. **Complete delegation** - Let agents handle their full scope, don't split their work

### Agent Decision Matrix

**Backend Development Tasks → fastapi-backend-expert:**
- Python/FastAPI development, async programming
- Database operations, SQLAlchemy/SQLModel integration
- TaskIQ/NATS background processing
- API endpoint creation/modification
- Backend architecture review
- LLM integration (pydantic-ai)

**Frontend Development Tasks → react-spa-architect:**
- React component development
- TypeScript/JavaScript frontend code
- WebSocket integration, real-time features
- UI/UX implementation
- Frontend-backend integration
- Modern React patterns (hooks, context, etc.)

**Infrastructure/DevOps Tasks → devops-expert:**
- Docker configuration, multi-stage builds
- CI/CD pipeline setup (GitHub Actions)
- Development environment configuration
- Service orchestration (docker-compose)
- Deployment automation
- Container optimization

**Architecture Review Tasks → architecture-guardian:**
- Code structure review
- Architectural compliance checking
- Design pattern adherence
- Code organization validation
- Refactoring guidance
- System design evaluation

**Complex Research/Multi-step Tasks → general-purpose:**
- Codebase exploration and analysis
- Complex debugging across multiple files
- Multi-step implementation planning
- Integration between multiple systems
- Performance optimization analysis

### Direct Action Criteria (VERY LIMITED)

**Claude Code should ONLY handle tasks directly in these specific scenarios:**

1. **Simple File Operations:**
   - Reading single files for information
   - Basic edits to existing files (1-2 line changes)
   - Configuration file updates

2. **Basic Commands:**
   - Simple bash commands (`ls`, `git status`, health checks)
   - Running existing justfile commands
   - Basic test execution

3. **Immediate Responses:**
   - Factual questions about the codebase
   - Explaining existing code functionality
   - Quick configuration lookups

4. **Documentation Updates:**
   - CLAUDE.md modifications (like this section)
   - Simple documentation fixes

### Delegation Examples

#### ✅ CORRECT Delegation:

```
User: "Add a new API endpoint for task filtering"
Assistant: I'll use the fastapi-backend-expert agent to implement this API endpoint with proper FastAPI patterns and database integration.
```

```
User: "Create a task management component for the React dashboard"
Assistant: I'll use the react-spa-architect agent to create a modern React component with proper TypeScript integration and state management.
```

```
User: "Optimize the Docker build process"
Assistant: I'll use the devops-expert agent to optimize the Docker configuration with multi-stage builds and proper caching.
```

#### ❌ INCORRECT Direct Handling:

```
User: "Add a new API endpoint for task filtering"
Assistant: I'll create the endpoint directly...
❌ WRONG - Should delegate to fastapi-backend-expert
```

```
User: "Review the current architecture for issues"
Assistant: Looking at the code structure...
❌ WRONG - Should delegate to architecture-guardian
```

### Enforcement and Validation

**Before Taking Any Action:**

1. **Task Analysis:** Identify the primary skill/expertise required
2. **Agent Matching:** Check if any agent specializes in this area
3. **Delegation Decision:** If match found → MUST delegate, else handle directly
4. **Parallel Delegation:** For multi-domain tasks, launch multiple agents

**Validation Questions:**
- "Does this involve backend development?" → fastapi-backend-expert
- "Does this involve frontend/React work?" → react-spa-architect
- "Does this involve Docker/infrastructure?" → devops-expert
- "Does this involve architectural review?" → architecture-guardian
- "Is this a complex multi-step research task?" → general-purpose

**CRITICAL:** When in doubt about which agent to use, **ALWAYS choose delegation over direct action**. It's better to over-delegate than to miss using specialized expertise.

### Code Quality Standards

#### **Comments Policy - CRITICAL**
**NEVER write obvious comments that just repeat what the code does.** Коментарі мають пояснювати **ЧОМУ**, не **ЩО**.

**❌ Погані приклади (НЕ робити):**
```python
# Include all routes
app.include_router(router)

# Create database session
session = AsyncSession()

# Return response
return {"status": "ok"}

# Set status to completed
task.status = "completed"
```

**✅ Хороші приклади (коли коментарі доречні):**
```python
# Working around FastAPI issue #1234 with WebSocket dependency injection
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: DatabaseDep):

# Complex business logic requires explanation
# Priority calculation: high=3, medium=2, low=1, then multiply by category weight
priority_score = PRIORITY_VALUES[task.priority] * CATEGORY_WEIGHTS[task.category]

# TODO: Replace with proper LLM classification once agents are integrated
classification = "manual"
```

**Правило:** Якщо код говорить сам за себе і не є складним - коментар не потрібен. Код має бути self-documenting.

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

## Docker Best Practices (uv Multi-stage Build)

### ✅ Optimized Multi-stage Dockerfile Pattern

**Правильна структура для uv в Docker:**

```dockerfile
# ============================================================================
# Dependencies Stage: Install dependencies in isolation
# ============================================================================
FROM python:3.12-slim AS dependencies

WORKDIR /app

# Install system dependencies required for package compilation
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies globally using environment variable
ENV UV_SYSTEM_PYTHON=1
RUN uv sync --locked --no-dev

# ============================================================================
# Application Stage: Copy application code and run
# ============================================================================
FROM python:3.12-slim AS application

WORKDIR /app

# Install only runtime dependencies (no gcc needed)
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Set UV_SYSTEM_PYTHON in final stage too (for consistency)
ENV UV_SYSTEM_PYTHON=1

# Copy virtual environment from dependencies stage
COPY --from=dependencies /app/.venv /app/.venv

# Add virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy application source code
COPY backend/app ./app
COPY backend/core ./core
COPY backend/alembic ./alembic

# Create non-root user for security
RUN groupadd --gid 1001 --system appgroup && \
    useradd --uid 1001 --system --gid appgroup --create-home appuser && \
    chown -R appuser:appgroup /app

USER appuser

# Expose port
EXPOSE 8000

# Use Python directly since packages are installed globally
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### 🚫 Що НЕ працює з uv:

```dockerfile
# ❌ НЕПРАВИЛЬНО - uv export + pip install
RUN uv export --frozen --no-dev --format requirements-txt > requirements.txt && \
    pip install --no-cache-dir -r requirements.txt

# ❌ НЕПРАВИЛЬНО - uv pip sync (не підтримує --frozen)
RUN uv pip sync --frozen --system uv.lock

# ❌ НЕПРАВИЛЬНО - uv.lock не requirements формат
RUN uv pip sync --system uv.lock
```

### ✅ Переваги Multi-stage підходу:

1. **Кешування**: Залежності кешуються окремо від коду
2. **Швидкий rebuild**: Зміна коду не перестворює stage з залежностями
3. **Менший розмір**: gcc та інші compile-time залежності не потрапляють у final image
4. **Безпека**: Non-root user у production image
5. **Оптимізація**: Використання правильних uv команд

### 📋 Команди для роботи:

```bash
# Rebuild конкретного сервісу
just rebuild api

# Перевірити API після rebuild
curl -s http://localhost:8000/api/health

# Запустити всі сервіси
just services
```