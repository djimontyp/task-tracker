# Task Tracker

A universal task tracking system that processes messages from various communication channels (Telegram, Slack, etc.) and automatically classifies them as issues/tasks using AI.

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/task-tracker.git
   cd task-tracker
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
   **Required Configuration**:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram bot token from @BotFather
   - `DATABASE_URL`: PostgreSQL connection string
   - `OLLAMA_BASE_URL`: LLM provider URL (optional)

3. **Start Services**:
   ```bash
   # Production mode (all services)
   just services

   # Development mode with live reloading
   just services-dev
   ```

## Architecture Overview

The Task Tracker is a modern, event-driven microservices system with six Docker services:

- **PostgreSQL**: Database for persistent message and task storage
- **NATS**: Message broker for asynchronous processing
- **FastAPI Backend**: REST API with WebSocket support
- **React Dashboard**: Real-time web interface for task management
- **Nginx**: Web server and reverse proxy
- **TaskIQ Worker**: Background task processing and AI classification

### Key Features

- **Multi-Channel Message Processing**: Support for Telegram, Slack, and other communication platforms
- **Advanced Message Filtering**: Filter messages by author, source, date range with real-time updates
- **AI-Powered Task Classification**: Intelligent task categorization and prioritization
- **Real-Time WebSocket Updates**: Instant notifications and task tracking with live filtering
- **Interactive Dashboard**: Modern React interface with responsive design and dark/light themes
- **Dockerized Microservices**: Easy deployment and scaling
- **Modern Development Workflow**: Live reloading and file watching

## Access Points

- **Web Dashboard**: http://localhost
- **API Base URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **WebSocket Endpoint**: `ws://localhost:8000/ws`

## Dashboard Features

The React Dashboard provides a comprehensive interface for task and message management:

### Navigation Tabs
- **🏠 Dashboard**: Overview with statistics and recent activity
- **💬 Messages**: Advanced message filtering and management
- **📋 Tasks**: Task creation, tracking, and status management
- **📈 Analytics**: System metrics and performance data
- **⚙️ Settings**: Configuration and webhook management

### Message Filtering (New!)
The Messages tab includes powerful filtering capabilities:
- **Author Filter**: Search and filter by message author
- **Source Filter**: Filter by message source (Telegram, API, etc.)
- **Date Range**: Filter messages by custom date ranges
- **Real-Time**: New messages automatically respect active filters
- **Combined Filters**: Use multiple filters simultaneously
- **Quick Clear**: Reset all filters with one click

### Real-Time Features
- **Live Updates**: WebSocket integration for instant message and task updates
- **Filter Sync**: Real-time messages are automatically filtered based on active criteria
- **Status Indicators**: Visual feedback for connection and processing status
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Development Commands

### Service Management
- `just services`: Start all services in production mode
- `just services-dev`: Start services with live file watching and hot-reload
- `just dev api`: Start specific service in development mode

### Development Tools
- `just test`: Run comprehensive test suite
- `just lint`: Check code quality with ruff
- `just fmt`: Auto-format code
- `just bot`: Run Telegram bot locally

## Webhook Management

The system includes a robust webhook management service with the following capabilities:

### Webhook Endpoints
- `GET /api/webhook/config`: Retrieve webhook configuration
- `POST /api/webhook/telegram/set`: Configure Telegram webhook
- `DELETE /api/webhook/telegram/delete`: Remove Telegram webhook

### Configuration
Configure webhooks through `.env` or API endpoints:
- `TELEGRAM_WEBHOOK_URL`: Webhook URL for Telegram
- `TELEGRAM_GROUP_CHAT_ID`: Group chat for message processing

## Current API Endpoints

### Core Endpoints
- `GET /`: API status
- `GET /api/health`: Health check
- `GET /api/config`: Client configuration

### Task Management
- `POST /api/tasks`: Create task
- `GET /api/tasks`: List tasks
- `GET /api/tasks/{id}`: Get specific task
- `PUT /api/tasks/{id}/status`: Update task status
- `GET /api/stats`: Task statistics

### Message Processing
- `POST /api/messages`: Create message
- `GET /api/messages`: List messages with advanced filtering
  - `?author=username`: Filter by message author
  - `?source=telegram`: Filter by message source (telegram, api, etc.)
  - `?date_from=2024-01-01`: Filter messages from date
  - `?date_to=2024-01-31`: Filter messages until date
  - `?limit=50`: Limit number of results
- `GET /api/messages/filters`: Get filter metadata (authors, sources, date range)
- `POST /webhook/telegram`: Telegram webhook handler

### Real-Time
- `WS /ws`: WebSocket real-time updates

## Development Workflow

### Docker Compose Watch
- **Live Reload**: Automatically sync changes in `./frontend/src` and `./backend/`
- **CSS/JS Sync**: Frontend files update without full rebuild
- **Backend Hot Reload**: Python code updates with sync+restart

### Local Development
- Supports running individual services locally
- Uses `uv` for package management
- Integrated linting and formatting with ruff

## Environment Setup

1. **Python**: 3.12+ required
2. **Dependencies**: Managed with `uv`
3. **Installation**:
   ```bash
   uv sync  # Install dependencies
   uv sync --all-groups  # Install dev/test dependencies
   ```

## Licensing

MIT License