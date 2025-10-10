# Backend Architecture: Task Tracker System

## 🏗️ Architectural Overview

The backend is a sophisticated, event-driven microservice ecosystem built with FastAPI, designed for comprehensive task management and intelligent message processing.

## 📂 Project Structure

### Core Components
- `app/api/v1/`: API Endpoints
- `app/models/`: Database Models
- `app/services/`: Business Logic Services
- `app/tasks.py`: Background Job Definitions

### API Modules
- `analysis_runs.py`: Analysis Run Management
- `proposals.py`: Task Proposal Workflow
- `projects.py`: Project Configuration
- `task_configs.py`: Task Configuration Management
- `agents.py`: AI Agent Management
- `providers.py`: LLM Provider Management

## 🔌 API Endpoint Categories

### 1. Analysis Management
- Endpoints for managing analysis runs
- Lifecycle tracking (pending → running → completed)
- Proposal generation and review workflow

### 2. Task Proposal System
- Intelligent task suggestion mechanism
- Confidence-based proposal ranking
- Review and approval workflow

### 3. Project Configuration
- Dynamic project keyword configuration
- Semantic versioning of project settings
- Team and default assignee tracking

### 4. Agent and Provider Management
- AI agent CRUD operations
- LLM provider configuration
- Agent testing capabilities

## 🧠 Intelligent Processing Workflow

### Analysis Run Lifecycle
```
start_run() → status="running"
├── fetch_messages()
├── prefilter_messages()
├── create_batches()
│   └── FOR each batch:
│       ├── update_progress()
│       ├── process_batch()
│       └── save_proposals()
└── complete_run() → status="completed"
```

### Proposal Review Process
- Confidence tracking (high > 0.9, medium 0.7-0.9, low < 0.7)
- Duplicate detection via message IDs
- Metadata preservation (recommendation, reasoning)

## 🔧 Technical Foundations

### Background Processing
- **Broker**: NATS (nats://localhost:4222)
- **Worker**: Docker container `task-tracker-worker`
- **Framework**: TaskIQ for distributed task processing

### Database Models
1. **AnalysisRun**
   - Coordinates AI analysis runs
   - Tracks lifecycle states
   - Stores LLM usage statistics

2. **TaskProposal**
   - AI-generated task suggestions
   - Tracks source messages
   - Supports review workflow

3. **ProjectConfig**
   - Project classification configurations
   - Keyword-based detection
   - Semantic versioning support

## 🚀 Development Status (2025-10-10)

### ✅ Implemented Features
- Full Analysis Run management API
- Task Proposal generation and review
- Project configuration endpoints
- Background job processing
- WebSocket real-time updates

### 🔄 Ongoing Development
- Advanced metrics calculation
- Enhanced proposal review workflow
- Comprehensive test coverage

## 🧪 Testing Strategy
- Model lifecycle tests
- Background job scenarios
- WebSocket event propagation
- Error handling validation

## 🔍 Key Development Principles
- Strict task delegation
- Async programming
- Dependency injection
- Type safety
- Clean, maintainable code

## 📊 Performance Considerations
- Efficient batch processing
- LLM interaction optimization
- Minimal database overhead
- Real-time progress tracking

## 🚧 Known Limitations
- Requires PostgreSQL on port 5555
- Depends on configured Telegram bot token
- LLM provider connectivity critical

## 📅 Last Updated
2025-10-10 (Phase 1 Complete)
