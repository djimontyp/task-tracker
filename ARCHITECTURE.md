# Task Tracker System Architecture

## System Overview

The Task Tracker is a modern, event-driven microservices architecture designed for scalable message processing and AI-powered task classification. The system processes messages from multiple communication channels and intelligently converts them into actionable tasks.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   External      │    │    Task Tracker   │    │   Storage &     │
│   Channels      │◄──►│    Services       │◄──►│   Processing    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│                      │                       │
├─ Telegram           ├─ FastAPI Backend      ├─ PostgreSQL
├─ Slack (planned)    ├─ React Dashboard      ├─ NATS Broker
├─ Email (planned)    ├─ TaskIQ Worker        └─ File Storage
└─ Webhooks          ├─ Telegram Bot
                     └─ Nginx Proxy
```

---

## Microservices Architecture

### Service Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Nginx   │◄─┤Dashboard │  │   API    │  │  Worker  │       │
│  │  :80     │  │   :3000  │  │  :8000   │  │ TaskIQ   │       │
│  └────┬─────┘  └──────────┘  └─────┬────┘  └─────┬────┘       │
│       │                           │             │             │
│       │        ┌─────────┐        │             │             │
│       └────────┤   Bot   │────────┘             │             │
│                │aiogram  │                      │             │
│                └─────────┘                      │             │
│                                                 │             │
│  ┌──────────┐                    ┌──────────┐   │             │
│  │PostgreSQL│◄───────────────────┤   NATS   │◄──┘             │
│  │  :5555   │                    │  :4222   │                 │
│  └──────────┘                    └──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Details

### 1. FastAPI Backend (`backend/`)

**Role**: Core API service and business logic coordinator
**Port**: 8000
**Language**: Python 3.12+

#### Architecture Components:
```
backend/
├── app/
│   ├── main.py           # FastAPI application setup
│   ├── routers.py        # API endpoints (275 lines)
│   ├── websocket.py      # WebSocket connection manager
│   ├── database.py       # Async database sessions
│   ├── dependencies.py   # FastAPI dependency injection
│   ├── models.py         # Database models (SQLModel)
│   ├── webhook_service.py # Webhook management
│   └── tasks.py          # Background task definitions
└── core/
    ├── config.py         # Application settings
    ├── agents.py         # AI classification agents
    ├── llm.py           # LLM integration
    └── taskiq_config.py  # Task queue configuration
```

#### Key Responsibilities:
- **API Management**: RESTful endpoints for all operations
- **WebSocket Handling**: Real-time communication with frontend
- **Database Coordination**: Async SQLModel operations
- **Webhook Management**: Configuration and handling of external webhooks
- **Task Dispatch**: Sending background tasks to TaskIQ workers

#### API Architecture:
```
FastAPI App
├── Core Routes (/)
│   ├── Health Check
│   └── Configuration
├── API Routes (/api)
│   ├── Task Management
│   ├── Message Processing
│   ├── Webhook Settings
│   └── Statistics
├── WebSocket (/ws)
│   └── Real-time Updates
└── Webhook Handlers (/webhook)
    └── Platform Integrations
```

### 2. React Dashboard (`frontend/`)

**Role**: Real-time web interface for task management
**Port**: 3000 (development), served via Nginx in production
**Language**: TypeScript/React 18.3.1

#### Architecture:
```
frontend/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API communication
│   ├── types/            # TypeScript definitions
│   └── utils/            # Utility functions
├── public/               # Static assets
└── build/               # Production build output
```

#### Features:
- **Real-time Updates**: WebSocket integration for live task updates
- **Responsive Design**: Mobile-first UI with dark theme support
- **Task Management**: Create, edit, and track tasks
- **Message Monitoring**: View incoming messages and classifications
- **Statistics Dashboard**: Visual analytics and metrics

### 3. TaskIQ Worker

**Role**: Background task processing and AI classification
**Language**: Python 3.12+
**Broker**: NATS with JetStream

#### Workflow:
```
Message Received → Queue Task → AI Processing → Database Update → WebSocket Notification
```

#### Task Types:
- **Message Classification**: AI-powered task categorization
- **Entity Extraction**: Structured data extraction from messages
- **Notification Dispatch**: Real-time update broadcasting
- **Data Enrichment**: Additional context gathering

### 4. Telegram Bot (`backend/app/telegram_bot.py`)

**Role**: Message ingestion from Telegram
**Framework**: aiogram 3.22+

#### Features:
- **Command Handling**: `/start`, `/help`, `/status`
- **Message Processing**: Forward messages to API for classification
- **Webhook Integration**: Receive updates via webhook
- **WebApp Support**: Integrated web interface access

### 5. PostgreSQL Database

**Role**: Primary data storage
**Version**: PostgreSQL 15
**Port**: 5555 (mapped from 5432)

#### Schema Design:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Sources   │    │  Messages   │    │    Tasks    │
│─────────────│    │─────────────│    │─────────────│
│ id (PK)     │◄──┤ source_id   │    │ id (PK)     │
│ name        │   │ content     │    │ title       │
│ type        │   │ user_id     │    │ description │
│ config      │   │ created_at  │    │ status      │
└─────────────┘   │ metadata    │    │ priority    │
                  └─────────────┘    │ category    │
                                     │ created_at  │
                                     └─────────────┘
```

#### Advanced Features:
- **Async Operations**: Full SQLAlchemy 2.0+ async support
- **Migrations**: Alembic for schema evolution
- **Relationships**: Complex model relationships with SQLModel
- **Indexing**: Optimized queries for real-time performance

### 6. NATS Message Broker

**Role**: Inter-service communication and task queuing
**Version**: Latest with JetStream
**Ports**: 4222 (client), 6222 (routing), 8222 (monitoring)

#### Features:
- **JetStream**: Persistent message storage
- **Distributed Processing**: Horizontal worker scaling
- **Message Ordering**: Guaranteed message delivery
- **Monitoring**: Built-in metrics and health checks

### 7. Nginx Reverse Proxy

**Role**: Load balancing and static file serving
**Port**: 80 (HTTP), 443 (HTTPS in production)

#### Configuration:
```
Location Mappings:
├── / → React Dashboard (http://dashboard:3000)
├── /api → FastAPI Backend (http://api:8000)
├── /ws → WebSocket Proxy (http://api:8000)
└── /webhook → Webhook Handlers (http://api:8000)
```

---

## Data Flow Architecture

### 1. Message Processing Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  External   │    │  Telegram   │    │   FastAPI   │    │   TaskIQ    │
│  Platform   │───►│    Bot      │───►│   Backend   │───►│   Worker    │
│ (Telegram)  │    │  (aiogram)  │    │  (routers)  │    │(AI Classify)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                           │                     │
                                           ▼                     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   React     │◄───│  WebSocket  │◄───│ PostgreSQL  │◄───│    NATS     │
│ Dashboard   │    │  Manager    │    │  Database   │    │   Broker    │
│ (Updates)   │    │(Real-time)  │    │  (Storage)  │    │ (Queue)     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Webhook Configuration Flow

```
User Request → React Dashboard → FastAPI API → Webhook Service → External Platform API
                    ↓
              WebSocket Update ← Database Storage ← Configuration Saved
```

### 3. Real-time Update Flow

```
Database Change → WebSocket Manager → Connected Clients (React Dashboard)
       ↑
TaskIQ Worker → Task Completion → Trigger WebSocket Event
```

---

## AI & LLM Integration Architecture

### AI Processing Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Message   │    │   pydantic  │    │    LLM      │    │ Structured  │
│   Content   │───►│     AI      │───►│  Provider   │───►│   Output    │
│  (Raw Text) │    │ (Classify)  │    │ (Ollama)    │    │(Task Data)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                           │
                                           ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Task      │◄───│  Database   │◄───│   Agent     │
│ Creation    │    │   Update    │    │  Results    │
│(Automatic)  │    │ (Persist)   │    │(Validated)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### AI Agents

1. **Classification Agent**: Categorizes messages as bugs, features, questions, etc.
2. **Entity Extraction Agent**: Extracts structured data (priority, assignee, etc.)
3. **Analysis Agent**: Provides detailed task analysis and recommendations

---

## Security Architecture

### Container Security

```
Docker Security:
├── Non-root Users: All containers run as unprivileged users
├── Resource Limits: CPU and memory constraints
├── Network Isolation: Service-specific network segmentation
└── Image Scanning: Vulnerability scanning in CI/CD
```

### Data Security

```
Data Protection:
├── Database Encryption: PostgreSQL encryption at rest
├── Network Encryption: TLS for external communications
├── Secrets Management: Environment variable isolation
└── Input Validation: Comprehensive Pydantic validation
```

### API Security

```
API Protection:
├── CORS Configuration: Restricted origin access
├── Rate Limiting: Planned implementation for production
├── Input Sanitization: All inputs validated and sanitized
└── Error Handling: Secure error responses without data leakage
```

---

## Development Architecture

### Docker Compose Watch

```
File Changes → Docker Compose Watch → Service Restart/Sync
     ↓
Development Workflow:
├── Frontend: CSS/JS live sync without rebuild
├── Backend: Python code sync with container restart
├── Database: Persistent volumes for data retention
└── Configuration: Environment-based settings
```

### Build Architecture

```
Multi-stage Docker Builds:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Dependencies    │    │ Application     │    │  Production     │
│ Stage           │───►│ Stage           │───►│  Image          │
│(uv sync)        │    │(Copy + Config)  │    │(Optimized)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Scalability Architecture

### Horizontal Scaling Points

1. **FastAPI Backend**: Stateless design allows multiple instances
2. **TaskIQ Workers**: Distributed processing across multiple containers
3. **React Dashboard**: CDN-ready static assets
4. **Database**: PostgreSQL read replicas and sharding options

### Performance Optimizations

```
Performance Strategy:
├── Database: Connection pooling, indexed queries
├── Caching: Redis integration (planned)
├── CDN: Static asset delivery optimization
├── Load Balancing: Nginx upstream configuration
└── Monitoring: Real-time performance metrics
```

---

## Monitoring & Observability

### Health Checks

```
Health Monitoring:
├── API Health: /api/health endpoint
├── Database: Connection status checks
├── NATS: Broker connectivity verification
├── WebSocket: Connection state monitoring
└── Docker: Container health status
```

### Metrics Collection

```
Metrics Architecture:
├── Application Metrics: Custom business logic metrics
├── Infrastructure Metrics: Container resource usage
├── Performance Metrics: Response times and throughput
└── Error Tracking: Comprehensive error logging
```

---

## Deployment Architecture

### Development Environment

```
Development Stack:
├── Local Docker Compose: 6 services with file watching
├── Live Reloading: Automatic code synchronization
├── Debug Support: Source map availability
└── Hot Reload: Frontend and backend hot reloading
```

### Production Considerations

```
Production Architecture:
├── Container Orchestration: Kubernetes/Docker Swarm ready
├── Load Balancing: Multiple backend instances
├── Database: Master-slave replication
├── Monitoring: Comprehensive observability stack
├── Security: TLS termination, secret management
└── Backup: Automated database and configuration backups
```

---

## Future Architecture Evolution

### Phase 1: Current MVP ✅
- Core microservices operational
- Basic AI integration
- Real-time communication

### Phase 2: Enhanced AI 🔄
- Advanced LLM integration
- Multi-provider AI support
- Intelligent routing

### Phase 3: Enterprise Scale 🎯
- Multi-tenant architecture
- Advanced security features
- Comprehensive monitoring
- Cloud-native deployment

---

## Technology Decision Rationale

### Framework Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Backend** | FastAPI | Modern async Python, excellent performance, automatic OpenAPI |
| **Frontend** | React 18 | Component reusability, strong ecosystem, TypeScript support |
| **Database** | PostgreSQL | ACID compliance, JSON support, excellent Python integration |
| **Message Queue** | NATS | Cloud-native, lightweight, JetStream persistence |
| **Containerization** | Docker | Industry standard, development-production parity |
| **Task Queue** | TaskIQ | Modern async task processing, NATS integration |

### Architectural Patterns

1. **Microservices**: Independent scaling and deployment
2. **Event-Driven**: Loose coupling between services
3. **Async-First**: Non-blocking I/O throughout the stack
4. **API-First**: Clear service boundaries and contracts
5. **Infrastructure as Code**: Reproducible deployments

This architecture provides a solid foundation for scalable, maintainable, and performant task tracking system with advanced AI capabilities.