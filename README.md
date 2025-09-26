# Task Tracker

A web-based task management system with real-time message processing and AI-powered task classification.

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/task-tracker.git
   cd task-tracker
   ```

2. **Copy configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your Telegram bot token and other settings
   ```

3. **Start all services**:
   ```bash
   just services
   ```

## Architecture Overview

The Task Tracker is a modern microservices system with six Docker services:
- **PostgreSQL**: Database for storing messages and tasks
- **NATS**: Message broker for asynchronous processing
- **FastAPI Backend**: REST API for task management
- **React Dashboard**: Web interface for real-time task tracking
- **Nginx**: Web server and reverse proxy
- **TaskIQ Worker**: Background task processing

## Access Points

- **Web Dashboard**: http://localhost:3000
- **API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/health

## Development Commands

- `just services-dev`: Start services with live reloading
- `just test`: Run all tests
- `just lint`: Check code quality
- `just fmt`: Format code

## Current API Endpoints

- `GET /`: API status
- `GET /api/health`: Health check
- `GET /api/config`: Client configuration
- `POST /api/messages`: Create message
- `GET /api/messages`: Get messages list
- `POST /api/tasks`: Create task
- `GET /api/tasks`: Get tasks list
- `GET /api/tasks/{id}`: Get specific task
- `PUT /api/tasks/{id}/status`: Update task status
- `GET /api/stats`: Task statistics
- `POST /webhook/telegram`: Telegram webhook
- `WS /ws`: WebSocket real-time updates

## Licensing

MIT License