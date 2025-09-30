# Backend Documentation

## Architecture Overview

The backend is a sophisticated, event-driven microservice built with FastAPI, providing robust task management and message processing capabilities.

## Key Components

### Telegram Integration
- **Location**: `backend/app/telegram_bot.py`
- Modern aiogram 3 bot implementation
- Command handlers for `/start`, `/help`
- WebApp integration
- HTTP client for FastAPI communication

### FastAPI Backend
- **Location**: `backend/app/main.py`
- REST API with comprehensive task/message management endpoints
- WebSocket support for real-time updates
- CORS middleware configuration

### API Endpoints

```
GET  /                     # API status
GET  /api/health           # Health check
GET  /api/config           # Client configuration
POST /api/messages         # Create message
GET  /api/messages         # Get messages list
POST /api/tasks            # Create task
GET  /api/tasks            # Get tasks list
GET  /api/tasks/{id}       # Get specific task
PUT  /api/tasks/{id}/status # Update task status
GET  /api/stats            # Task statistics
POST /webhook/telegram     # Telegram webhook
WS   /ws                   # WebSocket real-time updates
```

### LLM Integration
- **Location**: `backend/core/agents.py`
- Uses pydantic-ai for structured AI outputs
- Supports multiple AI providers (e.g., Ollama)
- Agents for:
  - Message classification
  - Entity extraction
  - Advanced analysis

### Async Task Processing
- **Location**: `backend/app/tasks.py`
- TaskIQ with NATS broker for distributed processing
- Background job management
- Worker can run in Docker or locally

### Database Integration
- SQLModel with async SQLAlchemy operations
- Complex relational schemas
- Supports both simple and advanced database models
- Async database session management

## Development Commands

### Package Management
- `uv sync`: Install dependencies
- `uv sync --all-groups`: Install all dependency groups
- `uv run python -m pytest`: Run tests

### Database Migrations
- `uv run alembic revision --autogenerate -m "description"`: Generate migration
- `uv run alembic upgrade head`: Apply migrations

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OLLAMA_BASE_URL`: LLM provider URL
- `TELEGRAM_BOT_TOKEN`: Telegram bot authentication
- `LOG_LEVEL`: Logging configuration

## Current Architectural Status

### ✅ Working Components
- Docker services
- API endpoints
- Database integration
- Basic LLM agent definition

### 🔄 Ongoing Development
- Full LLM agent integration
- Advanced TaskIQ processing
- Comprehensive test coverage

## Development Guidelines

### Code Quality
- Use async programming patterns
- Implement type hints
- Write comprehensive docstrings
- Follow PEP 8 guidelines

### Testing
- Async tests with pytest-asyncio
- Integration tests for TaskIQ/NATS
- Mock external services

## Troubleshooting

### Common Issues
- Ensure PostgreSQL is running on port 5555
- Check Telegram bot token configuration
- Verify LLM provider connectivity

## Last Updated
September 2025