# System Architecture Diagrams

This document provides comprehensive visual documentation of the Task Tracker system architecture at different levels of detail.

## High-Level System Architecture

The Task Tracker is an event-driven microservices system with the following key components:

```mermaid
graph TB
    subgraph "Client Layer"
        TG[Telegram Bot Client]
        WEB[React Dashboard]
        WEBAPP[Telegram WebApp]
    end

    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy]
    end

    subgraph "Application Layer"
        API[FastAPI Backend<br/>REST + WebSocket]
        BOT[Telegram Bot<br/>aiogram 3]
        WORKER[TaskIQ Worker<br/>Background Jobs]
    end

    subgraph "Message Broker"
        NATS[NATS Broker]
    end

    subgraph "AI Services"
        PYDANTIC[Pydantic-AI<br/>Task Classification]
        OLLAMA[Ollama<br/>Local LLM]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>:5555)]
        VECTOR[(pgvector<br/>Embeddings)]
    end

    TG -->|WebHook| NGINX
    WEBAPP -->|HTTP/WS| NGINX
    WEB -->|HTTP/WS| NGINX

    NGINX -->|/api| API
    NGINX -->|/webhook| BOT

    API <-->|WebSocket| WEB
    API <-->|SQL| PG
    API <-->|Vectors| VECTOR
    API -->|Queue Jobs| NATS

    BOT <-->|Updates| TG
    BOT <-->|SQL| PG
    BOT -->|Queue Jobs| NATS

    NATS -->|Consume Jobs| WORKER
    WORKER <-->|SQL| PG
    WORKER -->|AI Analysis| PYDANTIC
    WORKER -->|Embeddings| OLLAMA

    PYDANTIC -->|Inference| OLLAMA

    style API fill:#ff6b35
    style BOT fill:#ff6b35
    style WORKER fill:#ff6b35
    style NATS fill:#004e89
    style PG fill:#004e89
```

**Key Characteristics:**

- **Event-Driven**: Asynchronous communication via NATS message broker
- **Real-Time**: WebSocket connections for live dashboard updates
- **AI-Powered**: Automated task classification and analysis using local LLM
- **Scalable**: Microservices architecture with independent components

## Component Architecture

### Service Boundaries

```mermaid
graph LR
    subgraph "Frontend Services"
        DASH[React Dashboard<br/>TypeScript + Vite]
        WEBAPP[Telegram WebApp<br/>Mini App]
    end

    subgraph "Backend Services"
        API[FastAPI API<br/>REST + WebSocket]
        BOT[Telegram Bot<br/>aiogram 3]
        WORKER[TaskIQ Worker<br/>Async Processing]
    end

    subgraph "Infrastructure"
        NGINX[Nginx]
        NATS[NATS Broker]
        PG[(PostgreSQL + pgvector)]
        OLLAMA[Ollama LLM]
    end

    DASH -->|HTTP/WS| NGINX
    WEBAPP -->|HTTP| NGINX
    NGINX --> API
    NGINX --> BOT

    API --> NATS
    BOT --> NATS
    NATS --> WORKER

    API --> PG
    BOT --> PG
    WORKER --> PG
    WORKER --> OLLAMA

    style DASH fill:#61dafb
    style WEBAPP fill:#61dafb
    style API fill:#ff6b35
    style BOT fill:#ff6b35
    style WORKER fill:#ff6b35
```

## Task Classification Flow

This sequence diagram shows how a task message flows through the system from user input to AI classification:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant TG as Telegram Bot
    participant API as FastAPI Backend
    participant NATS as NATS Broker
    participant Worker as TaskIQ Worker
    participant AI as Pydantic-AI
    participant Ollama as Ollama LLM
    participant DB as PostgreSQL
    participant WS as WebSocket Clients

    User->>TG: Send message
    TG->>DB: Create task (pending)
    TG->>NATS: Publish classify_task job
    TG->>User: ✅ Task received

    NATS->>Worker: Deliver job
    Worker->>DB: Get task details
    Worker->>AI: Request classification
    AI->>Ollama: LLM inference
    Ollama-->>AI: Classification result
    AI-->>Worker: Structured response

    Worker->>DB: Update task classification
    Worker->>DB: Calculate embeddings
    Worker->>DB: Store vector
    Worker->>NATS: Publish task_classified event

    NATS->>API: Deliver event
    API->>WS: Broadcast update
    WS->>User: 🔄 Real-time UI update
```

**Flow Steps:**

1. User sends a message via Telegram
2. Bot creates task with `pending` status
3. Job queued to NATS for async processing
4. Worker picks up classification job
5. Pydantic-AI structures the LLM request
6. Ollama performs inference
7. Task updated with classification + embedding
8. WebSocket broadcast to all connected clients

## Real-Time Updates Flow

Shows how WebSocket connections keep the dashboard synchronized:

```mermaid
sequenceDiagram
    autonumber
    actor User1 as User (Telegram)
    actor User2 as User (Dashboard)
    participant TG as Telegram Bot
    participant API as FastAPI
    participant WS as WebSocket Manager
    participant DB as PostgreSQL
    participant NATS as NATS Broker
    participant Worker as TaskIQ Worker

    User2->>API: Connect WebSocket
    API->>WS: Register connection
    WS-->>User2: Connected

    User1->>TG: Create task
    TG->>DB: Insert task
    TG->>NATS: Queue classify_task

    NATS->>Worker: Process task
    Worker->>DB: Update task
    Worker->>NATS: Publish task_updated event

    NATS->>API: Event delivery
    API->>WS: Broadcast task_updated
    WS->>User2: 🔄 Live update
    User2->>User2: UI re-renders

    User2->>API: Update task status
    API->>DB: Update task
    API->>WS: Broadcast task_updated
    WS->>User2: 🔄 Live update
    WS->>User1: 🔔 Telegram notification (if enabled)
```

## Analysis System Workflow

The Analysis System is a two-stage pipeline: Knowledge Extraction creates Topics/Atoms, then Analysis Run generates TaskProposals from that knowledge:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant API
    participant NATS
    participant Worker
    participant DB as PostgreSQL
    participant LLM as LLM Service
    participant WS as WebSocket

    rect rgb(240, 248, 255)
        Note over User,WS: Stage 1: Knowledge Extraction
        User->>API: POST /knowledge/extract (from messages)
        API->>NATS: Queue knowledge_extraction job

        NATS->>Worker: Deliver extraction job
        Worker->>DB: Fetch messages
        Worker->>LLM: Extract topics/atoms
        Worker->>DB: Create TopicProposals/AtomProposals
        Worker->>WS: Broadcast proposals_created
    end

    rect rgb(255, 250, 240)
        Note over User,WS: Human Review & Approval
        User->>API: Review TopicProposals
        User->>API: POST /proposals/{id}/approve
        API->>DB: Create Topic/Atom (from approved proposal)
        API->>WS: Broadcast topic_created
    end

    rect rgb(240, 255, 240)
        Note over User,WS: Stage 2: Task Proposal Analysis
        User->>API: POST /analysis/runs (Analysis Run)
        API->>DB: Create AnalysisRun (pending)
        User->>API: POST /analysis/runs/{id}/start
        API->>NATS: Queue analyze_knowledge job

        NATS->>Worker: Deliver analysis job
        Worker->>DB: Fetch approved Topics/Atoms
        Worker->>LLM: Analyze accumulated knowledge
        Worker->>DB: Create TaskProposals (from topics/atoms)
        Worker->>WS: Broadcast progress_updated
    end

    rect rgb(255, 240, 255)
        Note over User,WS: Human Review of TaskProposals
        User->>API: Review TaskProposals
        User->>API: POST /proposals/{id}/approve
        API->>DB: Update proposal status
        API->>WS: Broadcast proposal_approved
    end
```

**Key Points:**

- Stage 1: Messages → TopicProposals/AtomProposals → Approved Topics/Atoms
- Stage 2: Approved Topics/Atoms → Analysis Run → TaskProposals
- TaskProposals are derived from accumulated knowledge, not directly from messages
- Human review and approval at each stage

## Data Flow Architecture

How data moves through the system:

```mermaid
flowchart TB
    subgraph "Input Sources"
        TG_IN[Telegram Messages]
        API_IN[Dashboard Actions]
        WEBHOOK[External Webhooks]
    end

    subgraph "Processing Pipeline"
        VALIDATE[Validation Layer<br/>Pydantic Models]
        BUSINESS[Business Logic<br/>FastAPI Services]
        QUEUE[Job Queue<br/>NATS]
        WORKER_PROC[Background Processing<br/>TaskIQ Workers]
    end

    subgraph "AI Processing"
        CLASSIFY[Task Classification<br/>Pydantic-AI]
        EMBED[Vector Embeddings<br/>Ollama]
        ANALYZE[Analysis Engine<br/>Multi-Agent]
    end

    subgraph "Storage"
        PG_CORE[(Core Data<br/>PostgreSQL)]
        PG_VECTOR[(Vectors<br/>pgvector)]
        PG_AUDIT[(Audit Logs<br/>JSON)]
    end

    subgraph "Output Channels"
        WS_OUT[WebSocket Clients]
        TG_OUT[Telegram Notifications]
        WEBHOOK_OUT[External Systems]
    end

    TG_IN --> VALIDATE
    API_IN --> VALIDATE
    WEBHOOK --> VALIDATE

    VALIDATE --> BUSINESS
    BUSINESS --> QUEUE
    BUSINESS --> PG_CORE

    QUEUE --> WORKER_PROC

    WORKER_PROC --> CLASSIFY
    WORKER_PROC --> EMBED
    WORKER_PROC --> ANALYZE

    CLASSIFY --> PG_CORE
    EMBED --> PG_VECTOR
    ANALYZE --> PG_CORE

    PG_CORE --> WS_OUT
    PG_CORE --> TG_OUT
    PG_CORE --> WEBHOOK_OUT

    style VALIDATE fill:#4ecdc4
    style BUSINESS fill:#ff6b35
    style QUEUE fill:#004e89
    style WORKER_PROC fill:#ff6b35
    style CLASSIFY fill:#ffe66d
    style EMBED fill:#ffe66d
    style ANALYZE fill:#ffe66d
```

## Component Interaction Matrix

Key interactions between system components:

```mermaid
graph TD
    subgraph "Core Components"
        API[FastAPI API]
        BOT[Telegram Bot]
        WORKER[TaskIQ Worker]
    end

    subgraph "Infrastructure"
        NATS[NATS Broker]
        PG[PostgreSQL]
        OLLAMA[Ollama]
    end

    subgraph "Clients"
        DASH[Dashboard]
        TG_CLIENT[Telegram]
    end

    API -->|"Pub: task_updated<br/>Sub: analysis_*"| NATS
    BOT -->|"Pub: classify_task<br/>Sub: task_classified"| NATS
    WORKER -->|"Sub: classify_task<br/>Pub: task_classified"| NATS

    API -->|SELECT/INSERT/UPDATE| PG
    BOT -->|INSERT/SELECT| PG
    WORKER -->|UPDATE/SELECT| PG

    WORKER -->|Inference| OLLAMA

    DASH -->|HTTP/WebSocket| API
    TG_CLIENT -->|Webhook| BOT

    style API fill:#ff6b35
    style BOT fill:#ff6b35
    style WORKER fill:#ff6b35
    style NATS fill:#004e89
```

## Technology Stack

```mermaid
mindmap
  root((Task Tracker))
    Backend
      FastAPI
        REST API
        WebSocket
        Dependency Injection
      aiogram 3
        Telegram Bot
        WebHook Handler
      TaskIQ
        Background Jobs
        NATS Integration
      SQLAlchemy
        ORM
        Async Sessions
      Pydantic-AI
        LLM Integration
        Structured Output
    Frontend
      React 18
        TypeScript
        Hooks
      Vite
        Build Tool
        HMR
      TanStack Query
        Data Fetching
        Cache
      shadcn/ui
        Components
        Tailwind CSS
    Infrastructure
      Docker Compose
        Containers
        Watch Mode
      PostgreSQL
        Relational Data
        pgvector Extension
      NATS
        Message Broker
        Event Bus
      Ollama
        Local LLM
        Embeddings
      Nginx
        Reverse Proxy
        Static Files
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Docker Compose Environment"
        subgraph "Network: task-tracker-network"
            NGINX[nginx:alpine<br/>Port 80:80]
            API[task-tracker-api<br/>Internal :8000]
            BOT[task-tracker-bot<br/>Internal only]
            WORKER[task-tracker-worker<br/>Internal only]
            DASH[task-tracker-dashboard<br/>Internal :5173]
            NATS[nats:alpine<br/>Internal :4222]
            PG[postgres:16<br/>Port 5555:5432]
        end

        subgraph "Volumes"
            PG_DATA[(postgres_data)]
            NATS_DATA[(nats_data)]
        end
    end

    NGINX -->|proxy_pass| API
    NGINX -->|proxy_pass| BOT
    NGINX -->|proxy_pass| DASH

    API --> NATS
    BOT --> NATS
    WORKER --> NATS

    API --> PG
    BOT --> PG
    WORKER --> PG

    PG --> PG_DATA
    NATS --> NATS_DATA

    style NGINX fill:#269f42
    style API fill:#ff6b35
    style BOT fill:#ff6b35
    style WORKER fill:#ff6b35
    style DASH fill:#61dafb
```

## Database Schema Overview

```mermaid
erDiagram
    USERS ||--o{ TASKS : creates
    TASKS ||--o{ TOPICS : belongs_to
    TASKS ||--o{ ATOMS : contains
    ATOMS ||--o{ MESSAGES : has
    ATOMS }o--o{ TOPICS : tagged_with

    ATOMS ||--o{ ANALYSIS_RUNS : analyzed_by
    ANALYSIS_RUNS ||--o{ ANALYSIS_PROPOSALS : generates
    ANALYSIS_PROVIDERS ||--o{ ANALYSIS_PROPOSALS : provides

    USERS {
        bigint id PK
        bigint telegram_id UK
        string username
        timestamp created_at
    }

    TASKS {
        int id PK
        bigint user_id FK
        string content
        string category
        timestamp created_at
        vector embedding
    }

    TOPICS {
        int id PK
        string name
        string description
        timestamp created_at
    }

    ATOMS {
        int id PK
        string title
        text content
        timestamp created_at
    }

    MESSAGES {
        int id PK
        int atom_id FK
        text content
        enum role
        int sequence_number
    }

    ANALYSIS_RUNS {
        int id PK
        string session_name
        enum status
        jsonb config
        timestamp started_at
    }

    ANALYSIS_PROPOSALS {
        int id PK
        int run_id FK
        int provider_id FK
        int atom_id FK
        jsonb proposal_data
        timestamp created_at
    }
```

## Development Workflow

```mermaid
flowchart LR
    subgraph "Developer Actions"
        CODE[Write Code]
        TEST[Run Tests]
        TYPE[Type Check]
        FMT[Format Code]
    end

    subgraph "Quality Gates"
        MYPY[mypy --strict]
        RUFF[ruff format + check]
        PYTEST[pytest]
    end

    subgraph "Docker Commands"
        BUILD[docker compose build]
        WATCH[docker compose watch]
        UP[docker compose up]
    end

    subgraph "Database Operations"
        MIGRATE[alembic upgrade head]
        SEED[just db-seed]
        RESET[just db-reset]
    end

    CODE --> TYPE
    TYPE --> MYPY
    MYPY --> FMT
    FMT --> RUFF
    RUFF --> TEST
    TEST --> PYTEST

    PYTEST --> BUILD
    BUILD --> MIGRATE
    MIGRATE --> SEED
    SEED --> WATCH

    WATCH --> UP

    style CODE fill:#4ecdc4
    style MYPY fill:#ff6b35
    style RUFF fill:#ff6b35
    style PYTEST fill:#ffe66d
    style WATCH fill:#61dafb
```

## Key Design Patterns

### Event-Driven Architecture

```mermaid
sequenceDiagram
    participant Producer
    participant NATS
    participant Consumer1
    participant Consumer2

    Producer->>NATS: Publish event
    NATS->>Consumer1: Deliver event
    NATS->>Consumer2: Deliver event
    Consumer1->>Consumer1: Process independently
    Consumer2->>Consumer2: Process independently
```

### Dependency Injection (FastAPI)

```mermaid
graph LR
    REQUEST[HTTP Request] --> ROUTER[Router Endpoint]
    ROUTER --> DEPS[Dependencies]
    DEPS --> DB[Database Session]
    DEPS --> CURRENT_USER[Current User]
    DEPS --> SETTINGS[App Settings]

    DB --> SERVICE[Service Layer]
    CURRENT_USER --> SERVICE
    SETTINGS --> SERVICE

    SERVICE --> RESPONSE[HTTP Response]
```

### Repository Pattern

```mermaid
graph TB
    ENDPOINT[API Endpoint] --> SERVICE[Service Layer]
    SERVICE --> REPO[Repository Layer]
    REPO --> SQLALCHEMY[SQLAlchemy ORM]
    SQLALCHEMY --> PG[(PostgreSQL)]

    style SERVICE fill:#ff6b35
    style REPO fill:#4ecdc4
```

## Monitoring & Observability

```mermaid
graph TB
    subgraph "Application Metrics"
        API_LOGS[FastAPI Logs]
        BOT_LOGS[Bot Logs]
        WORKER_LOGS[Worker Logs]
    end

    subgraph "Infrastructure Metrics"
        PG_METRICS[PostgreSQL Stats]
        NATS_METRICS[NATS Metrics]
        DOCKER_STATS[Container Stats]
    end

    subgraph "Business Metrics"
        TASK_RATE[Task Creation Rate]
        CLASS_ACCURACY[Classification Accuracy]
        ANALYSIS_TIME[Analysis Duration]
    end

    API_LOGS --> AGGREGATOR[Log Aggregator]
    BOT_LOGS --> AGGREGATOR
    WORKER_LOGS --> AGGREGATOR

    PG_METRICS --> MONITOR[Monitoring System]
    NATS_METRICS --> MONITOR
    DOCKER_STATS --> MONITOR

    TASK_RATE --> DASHBOARD[Admin Dashboard]
    CLASS_ACCURACY --> DASHBOARD
    ANALYSIS_TIME --> DASHBOARD
```

## Summary

The Task Tracker system is built on modern architectural principles:

- **Event-Driven**: Loose coupling via NATS messaging
- **Real-Time**: WebSocket for live updates
- **AI-Powered**: Local LLM integration with Ollama
- **Type-Safe**: Strict mypy typing across Python codebase
- **Containerized**: Full Docker Compose orchestration
- **Scalable**: Independent service scaling
- **Observable**: Comprehensive logging and metrics

For more details on specific components, see the related architecture documentation.
