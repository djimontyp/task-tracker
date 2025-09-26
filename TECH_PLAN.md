# Technical Specification: Task Tracker System

## Current Status (September 2025)

The Task Tracker is a working MVP with six Docker services providing real-time message processing and AI task classification.

**✅ Fully Operational Services:**
- PostgreSQL database
- NATS message broker
- FastAPI Backend
- React Web Dashboard
- Nginx proxy
- TaskIQ background worker

## Architecture Overview

The system follows a microservices event-driven architecture:
1. **Telegram Bot**: Message ingestion via aiogram
2. **FastAPI Backend**: REST API for task management
3. **React Dashboard**: Real-time web interface
4. **Worker Service**: TaskIQ for background processing
5. **Docker Services**: PostgreSQL, NATS, and application services

## Technology Stack

### Core Infrastructure
- **Application Framework**: FastAPI with async/await
- **Task Queue**: TaskIQ with NATS broker
- **Database**: PostgreSQL 15 with SQLAlchemy/SQLModel
- **Containerization**: Docker with multi-stage builds

### AI & Processing
- **Primary LLM**: Local Ollama models
- **LLM Integration**: pydantic-ai for structured outputs
- **Classification**: AI-powered message classification

## Data Model

### Key Tables
- **Messages**: Store processed Telegram messages
- **Issues**: AI classification results
- **TaskExports**: External task tracking

## Current API Endpoints

- **GET /**: API status
- **GET /api/health**: Health check
- **GET /api/config**: Client configuration
- **POST /api/messages**: Create message
- **GET /api/tasks**: List tasks
- **POST /api/tasks**: Create task
- **WebSocket /ws**: Real-time updates

## Next Integration Steps

1. Connect LLM agents to message processing pipeline
2. Implement advanced TaskIQ-LLM integration
3. Move to full SQLModel schemas with relationships

## Performance Status

- **Message Processing**: Working with Telegram messages
- **Classification**: Basic AI classification implemented
- **Real-time Updates**: WebSocket broadcasting functional

## Development Commands

- `just services-dev`: Start services with live reload
- `just test`: Run test suite
- `just lint`: Code quality checks

## Future Roadmap

### Phase 1: Current MVP (Completed)
- Basic message processing
- Telegram bot integration
- Web dashboard
- TaskIQ background processing

### Phase 2: AI Enhancement (Next)
- Advanced LLM integration
- Improved task classification
- Multi-channel support