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
## Key Features

### Phase 1: AI-Powered Analysis (2025-10-10)
- ✅ Manual analysis run triggers with time window selection
- ✅ AI-powered message classification using LLM
- ✅ Automated task proposal generation from message batches
- ✅ Project-based keyword classification
- ✅ PM review workflow (approve/reject/merge proposals)
- ✅ Real-time WebSocket updates for progress tracking
- ✅ Duplicate detection via source message tracking
- ✅ Accuracy metrics (approval rate, rejection rate)
- ✅ Background job processing with TaskIQ + NATS

### Phase 2: Noise Filtering System (2025-10-17)
- ✅ Multi-factor importance scoring (content 40%, author 20%, temporal 20%, topics 20%)
- ✅ Automatic message classification (noise/weak_signal/signal)
- ✅ RESTful API for noise statistics and scoring
- ✅ Background batch scoring tasks
- ✅ Signal/noise ratio tracking with 7-day trends
- ✅ Top noise sources identification
- ✅ Auto-scoring on message receipt (Telegram webhook)
### Comprehensive Features
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
### Message Filtering
The Messages tab includes powerful filtering capabilities:
- **Author Filter**: Search and filter by message author
- **Source Filter**: Filter by message source (Telegram, API, etc.)
- **Date Range**: Filter messages by custom date ranges
- **Real-Time**: New messages automatically respect active filters
- **Combined Filters**: Use multiple filters simultaneously
- **Quick Clear**: Reset all filters with one click
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
## Environment Setup
1. **Python**: 3.12+ required
2. **Dependencies**: Managed with `uv`
3. **Installation**:
   ```bash
   uv sync  # Install dependencies
   uv sync --all-groups  # Install dev/test dependencies
   ```
## Current Status
### ✅ Implemented Components
- Database models
- Analysis Run management
- Task Proposal generation
- Project configuration
- Background processing
- WebSocket real-time updates
### 🔄 Upcoming Development
- Task Entity system
- Advanced task hierarchy
- More complex incident tracking
## 📚 Documentation

### Core Concepts & Architecture

- **[Concepts Index](./CONCEPTS_INDEX.md)** - Complete system overview and navigation guide
- **[User Needs](./USER_NEEDS.md)** - Business requirements and user journey (what we're solving)
- **[Noise Filtering Architecture](./NOISE_FILTERING_ARCHITECTURE.md)** - Technical implementation of information overload solution (status: Phase 2 in progress)

### Technical Documentation

- **[Analysis System Architecture](./ANALYSIS_SYSTEM_ARCHITECTURE.md)** - AI-powered analysis pipeline
- **[Vector DB Implementation](./VECTOR_DB_IMPLEMENTATION_PLAN.md)** - Semantic search with pgvector
- **[Claude AI Guide](./CLAUDE.md)** - Development guidelines, patterns, and API reference

### API Reference

The noise filtering system provides REST endpoints for message scoring and statistics:

```bash
# Get noise filtering statistics (signal/noise breakdown with trends)
GET /api/v1/noise/stats

# Score a specific message (queues background task)
POST /api/v1/noise/score/{message_id}

# Batch score unscored messages
POST /api/v1/noise/score-batch?limit=100
```

See [NOISE_FILTERING_ARCHITECTURE.md](./NOISE_FILTERING_ARCHITECTURE.md#-dashboard-api) for detailed endpoint documentation.

### Key Innovation: Information Noise Filtering

**Problem:** 100 messages/day with 80% noise (chitchat, "+1", memes) → Information overload

**Solution:** Four-layer architecture:
```
Layer 4: Dashboard (trends & issues) ← Human works here
    ↓ drill down (5% cases)
Layer 3: Atoms (structured extracts)
    ↓ drill down (edgecase)
Layer 2: Signal Messages (filtered)
    ↓
Layer 1: All Messages (raw + noise)
```

**Result:**
- 50x less information to process
- 10x faster insight discovery
- Focus on trends, not individual messages

See [USER_NEEDS.md](./USER_NEEDS.md) for detailed explanation.

---

## Licensing
MIT License
