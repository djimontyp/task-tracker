# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands (via justfile)
- `just run` - Start the CLI application with interactive menu
- `just services` - Start all services (PostgreSQL, NATS, Worker) via Docker
- `just services-stop` - Stop all services
- `just worker` - Run TaskIQ worker locally (alternative to dockerized worker)
- `just test` - Run all tests
- `just lint` - Lint code with ruff (auto-fixes issues)
- `just fmt` - Format code with ruff
- `just check` - Run both lint and format

### Application Launch Commands
- `uv run python -m src` - Start Telegram listener (default mode)
- `uv run python -m src telegram` - Start Telegram listener explicitly
- `uv run python -m src cli` - Start interactive CLI interface

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

**Current Status**: Working on a functional MVP for **Feodal AI Sprint 2.0** (1 серпня - 1 вересня). This is a practical AI competition where participants create functional AI solutions that directly improve work processes. Focus on core functionality and stability - delivering a fully working case that can be easily integrated and scaled for teams or the entire company.

### Core Architecture Pattern
The system follows a simple event-driven pattern:
1. **Telegram Listener** (src/telegram.py) - Receives real-time messages from configured groups
2. **Message Processing** (src/__main__.py) - Main entry point that coordinates the pipeline
3. **LLM Classification** (src/agents.py) - AI agents that classify messages using pydantic-ai
4. **Future: Output Processors** - Will handle the results (task creation, notifications, etc.)

### Key Components

**Telegram Integration** (src/telegram.py):
- Real-time message listening from configured Telegram groups
- Uses python-telegram-bot library with polling mechanism
- Automatic message normalization and processing tracking
- Configurable via TELEGRAM_BOT_TOKEN and TELEGRAM_GROUP_CHAT_ID environment variables

**LLM Integration** (src/llm.py, src/agents.py):
- Uses pydantic-ai with structured outputs via Pydantic models
- Supports Ollama provider (configurable via settings)
- Three main agents: classification, entity extraction, and analysis
- Structured schemas defined in src/schemas.py (TextClassification, EntityExtraction, EntityStructured)

**Async Task Processing** (src/worker.py, src/taskiq_config.py):
- TaskIQ with NATS broker for distributed task processing
- NATS runs on default ports: 4222 (client), 6222 (routing), 8222 (monitoring)
- Worker can run either in Docker or locally via `just worker`

**Configuration** (src/config.py):
- Pydantic Settings with .env file support
- Key settings: database_url, ollama_base_url, llm_provider, telegram_bot_token, telegram_group_chat_id
- Database uses PostgreSQL with asyncpg driver
- Logging level configurable via LOG_LEVEL or LOGURU_LEVEL

**Data Models** (src/schemas.py):
- Structured Pydantic models for AI classification results
- Supports multiple classification categories: bug, feature, improvement, question, chore
- Priority levels: low, medium, high, critical

### Message Processing Flow
1. **Telegram Listener** - TelegramAdapter receives real-time messages from configured group
2. **Message Normalization** - Raw Telegram messages are converted to standard format
3. **LLM Classification** - AI agents classify message content and extract entities
4. **Output Processing** - Structured results are processed by output handlers
5. **Tracking** - Original messages are marked as processed to avoid duplication

### Testing Strategy
- Full test coverage in tests/ directory
- Async tests using pytest-asyncio
- Integration tests for TaskIQ/NATS (run `just services` first)
- LLM integration tests with comprehensive scenarios

### Development Notes
- Python 3.12+ required
- Uses uv for package management instead of pip/poetry
- Docker Compose for services (PostgreSQL, NATS, Worker)
- CLI interface built with Textual for interactive navigation
- Telegram integration with python-telegram-bot library
- All code and comments should be in English

### Quick Start
1. **Setup environment**: Copy `.env.example` to `.env` and configure:
   - `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
   - `TELEGRAM_GROUP_CHAT_ID` - Use debug mode to discover group ID
2. **Install dependencies**: `uv sync --all-groups`
3. **Start services**: `just services` (PostgreSQL, NATS)
4. **Run application**: `uv run python -m src` (starts Telegram listener)

## Code Implementation Guidelines

### MCP Context7 Integration
When implementing features or fixing bugs, **ALWAYS** use MCP context7 to retrieve up-to-date documentation and examples for libraries and frameworks used in this project:

- **Before implementing**: Use `resolve-library-id` and `get-library-docs` to get current documentation for relevant libraries (pydantic-ai, TaskIQ, NATS, Textual, FastAPI, SQLAlchemy, etc.)
- **During development**: Reference official docs and best practices to ensure code follows latest patterns and conventions
- **For troubleshooting**: Get specific documentation sections to resolve implementation issues correctly

This ensures all implementations use current best practices and maintain consistency with the latest library versions.