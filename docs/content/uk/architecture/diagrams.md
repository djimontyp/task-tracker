# Діаграми архітектури системи

Цей документ надає комплексну візуальну документацію архітектури системи Task Tracker на різних рівнях деталізації.

## Високорівнева архітектура системи

Task Tracker — це подієво-орієнтована мікросервісна система з наступними ключовими компонентами:

```mermaid
graph TB
    subgraph "Рівень клієнтів"
        TG[Telegram Bot Client]
        WEB[React Dashboard]
        WEBAPP[Telegram WebApp]
    end

    subgraph "API Gateway"
        NGINX[Nginx Reverse Proxy]
    end

    subgraph "Рівень застосунку"
        API[FastAPI Backend<br/>REST + WebSocket]
        BOT[Telegram Bot<br/>aiogram 3]
        WORKER[TaskIQ Worker<br/>Фонові завдання]
    end

    subgraph "Брокер повідомлень"
        NATS[NATS Broker]
    end

    subgraph "AI Сервіси"
        PYDANTIC[Pydantic-AI<br/>Класифікація завдань]
        OLLAMA[Ollama<br/>Локальна LLM]
    end

    subgraph "Рівень даних"
        PG[(PostgreSQL<br/>:5555)]
        VECTOR[(pgvector<br/>Векторні вбудовування)]
    end

    TG -->|WebHook| NGINX
    WEBAPP -->|HTTP/WS| NGINX
    WEB -->|HTTP/WS| NGINX

    NGINX -->|/api| API
    NGINX -->|/webhook| BOT

    API <-->|WebSocket| WEB
    API <-->|SQL| PG
    API <-->|Вектори| VECTOR
    API -->|Черга завдань| NATS

    BOT <-->|Оновлення| TG
    BOT <-->|SQL| PG
    BOT -->|Черга завдань| NATS

    NATS -->|Обробка завдань| WORKER
    WORKER <-->|SQL| PG
    WORKER -->|AI Аналіз| PYDANTIC
    WORKER -->|Вбудовування| OLLAMA

    PYDANTIC -->|Інференс| OLLAMA

    style API fill:#ff6b35
    style BOT fill:#ff6b35
    style WORKER fill:#ff6b35
    style NATS fill:#004e89
    style PG fill:#004e89
```

**Ключові характеристики:**

- **Подієво-орієнтована**: Асинхронна комунікація через брокер повідомлень NATS
- **Реального часу**: WebSocket з'єднання для оновлень дашборду
- **AI-керована**: Автоматична класифікація та аналіз завдань за допомогою локальної LLM
- **Масштабована**: Мікросервісна архітектура з незалежними компонентами

## Архітектура компонентів

### Межі сервісів

```mermaid
graph LR
    subgraph "Frontend сервіси"
        DASH[React Dashboard<br/>TypeScript + Vite]
        WEBAPP[Telegram WebApp<br/>Mini App]
    end

    subgraph "Backend сервіси"
        API[FastAPI API<br/>REST + WebSocket]
        BOT[Telegram Bot<br/>aiogram 3]
        WORKER[TaskIQ Worker<br/>Асинхронна обробка]
    end

    subgraph "Інфраструктура"
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

## Потік класифікації завдань

Ця діаграма послідовності показує, як повідомлення завдання проходить через систему від введення користувача до AI класифікації:

```mermaid
sequenceDiagram
    autonumber
    actor User as Користувач
    participant TG as Telegram Bot
    participant API as FastAPI Backend
    participant NATS as NATS Broker
    participant Worker as TaskIQ Worker
    participant AI as Pydantic-AI
    participant Ollama as Ollama LLM
    participant DB as PostgreSQL
    participant WS as WebSocket Clients

    User->>TG: Надіслати повідомлення
    TG->>DB: Створити завдання (pending)
    TG->>NATS: Опублікувати classify_task job
    TG->>User: ✅ Завдання отримано

    NATS->>Worker: Доставити job
    Worker->>DB: Отримати деталі завдання
    Worker->>AI: Запит класифікації
    AI->>Ollama: LLM інференс
    Ollama-->>AI: Результат класифікації
    AI-->>Worker: Структурована відповідь

    Worker->>DB: Оновити класифікацію завдання
    Worker->>DB: Обчислити вбудовування
    Worker->>DB: Зберегти вектор
    Worker->>NATS: Опублікувати task_classified event

    NATS->>API: Доставити event
    API->>WS: Broadcast оновлення
    WS->>User: 🔄 Оновлення UI в реальному часі
```

**Кроки потоку:**

1. Користувач надсилає повідомлення через Telegram
2. Бот створює завдання зі статусом `pending`
3. Завдання ставиться в чергу NATS для асинхронної обробки
4. Worker забирає завдання класифікації
5. Pydantic-AI структурує запит до LLM
6. Ollama виконує інференс
7. Завдання оновлюється з класифікацією + вбудовуванням
8. WebSocket broadcast для всіх підключених клієнтів

## Потік оновлень в реальному часі

Показує, як WebSocket з'єднання синхронізують дашборд:

```mermaid
sequenceDiagram
    autonumber
    actor User1 as Користувач (Telegram)
    actor User2 as Користувач (Dashboard)
    participant TG as Telegram Bot
    participant API as FastAPI
    participant WS as WebSocket Manager
    participant DB as PostgreSQL
    participant NATS as NATS Broker
    participant Worker as TaskIQ Worker

    User2->>API: Підключити WebSocket
    API->>WS: Зареєструвати з'єднання
    WS-->>User2: Підключено

    User1->>TG: Створити завдання
    TG->>DB: Вставити завдання
    TG->>NATS: Додати classify_task в чергу

    NATS->>Worker: Обробити завдання
    Worker->>DB: Оновити завдання
    Worker->>NATS: Опублікувати task_updated event

    NATS->>API: Доставка події
    API->>WS: Broadcast task_updated
    WS->>User2: 🔄 Оновлення в реальному часі
    User2->>User2: UI перемальовується

    User2->>API: Оновити статус завдання
    API->>DB: Оновити завдання
    API->>WS: Broadcast task_updated
    WS->>User2: 🔄 Оновлення в реальному часі
    WS->>User1: 🔔 Telegram сповіщення (якщо увімкнено)
```

## Робочий процес системи аналізу

Система аналізу обробляє атоми через кілька AI провайдерів для генерації пропозицій:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Адміністратор
    participant API
    participant DB as PostgreSQL
    participant NATS
    participant Worker
    participant Agents as AI Агенти
    participant Providers as LLM Провайдери<br/>(OpenAI, Anthropic, Ollama)
    participant WS as WebSocket

    Admin->>API: Запустити сесію аналізу
    API->>DB: Створити AnalysisRun
    API->>NATS: Додати analyze_atoms jobs в чергу
    API-->>Admin: Запуск розпочато (run_id)

    loop Для кожного атома
        NATS->>Worker: Доставити analyze job
        Worker->>DB: Отримати вміст атома
        Worker->>Agents: Відправити до AI агентів

        par Мульти-провайдерний аналіз
            Agents->>Providers: OpenAI запит
            Agents->>Providers: Anthropic запит
            Agents->>Providers: Ollama запит
        end

        Providers-->>Agents: Пропозиції
        Agents-->>Worker: Агреговані пропозиції

        Worker->>DB: Зберегти записи AnalysisProposal
        Worker->>NATS: Опублікувати analysis_progress event
    end

    NATS->>API: Оновлення прогресу
    API->>WS: Broadcast прогресу
    WS->>Admin: 🔄 Прогрес в реальному часі

    Worker->>DB: Оновити статус запуску (completed)
    Worker->>NATS: Опублікувати analysis_completed event
    API->>WS: Broadcast завершення
    WS->>Admin: ✅ Аналіз завершено
```

**Можливості аналізу:**

- Паралельне виконання з кількома провайдерами
- Відстеження прогресу через WebSocket
- Налаштовувані стратегії агентів
- Валідація провайдерів перед виконанням

## Архітектура потоку даних

Як дані рухаються через систему:

```mermaid
flowchart TB
    subgraph "Джерела вводу"
        TG_IN[Telegram повідомлення]
        API_IN[Дії в Dashboard]
        WEBHOOK[Зовнішні Webhooks]
    end

    subgraph "Конвеєр обробки"
        VALIDATE[Рівень валідації<br/>Pydantic моделі]
        BUSINESS[Бізнес-логіка<br/>FastAPI сервіси]
        QUEUE[Черга завдань<br/>NATS]
        WORKER_PROC[Фонова обробка<br/>TaskIQ Workers]
    end

    subgraph "AI обробка"
        CLASSIFY[Класифікація завдань<br/>Pydantic-AI]
        EMBED[Векторні вбудовування<br/>Ollama]
        ANALYZE[Движок аналізу<br/>Мульти-агент]
    end

    subgraph "Сховище"
        PG_CORE[(Основні дані<br/>PostgreSQL)]
        PG_VECTOR[(Вектори<br/>pgvector)]
        PG_AUDIT[(Логи аудиту<br/>JSON)]
    end

    subgraph "Канали виводу"
        WS_OUT[WebSocket клієнти]
        TG_OUT[Telegram сповіщення]
        WEBHOOK_OUT[Зовнішні системи]
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

## Матриця взаємодії компонентів

Ключові взаємодії між компонентами системи:

```mermaid
graph TD
    subgraph "Основні компоненти"
        API[FastAPI API]
        BOT[Telegram Bot]
        WORKER[TaskIQ Worker]
    end

    subgraph "Інфраструктура"
        NATS[NATS Broker]
        PG[PostgreSQL]
        OLLAMA[Ollama]
    end

    subgraph "Клієнти"
        DASH[Dashboard]
        TG_CLIENT[Telegram]
    end

    API -->|"Pub: task_updated<br/>Sub: analysis_*"| NATS
    BOT -->|"Pub: classify_task<br/>Sub: task_classified"| NATS
    WORKER -->|"Sub: classify_task<br/>Pub: task_classified"| NATS

    API -->|SELECT/INSERT/UPDATE| PG
    BOT -->|INSERT/SELECT| PG
    WORKER -->|UPDATE/SELECT| PG

    WORKER -->|Інференс| OLLAMA

    DASH -->|HTTP/WebSocket| API
    TG_CLIENT -->|Webhook| BOT

    style API fill:#ff6b35
    style BOT fill:#ff6b35
    style WORKER fill:#ff6b35
    style NATS fill:#004e89
```

## Технологічний стек

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
        Фонові завдання
        NATS інтеграція
      SQLAlchemy
        ORM
        Async Sessions
      Pydantic-AI
        LLM інтеграція
        Структурований вивід
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
        Компоненти
        Tailwind CSS
    Інфраструктура
      Docker Compose
        Контейнери
        Watch режим
      PostgreSQL
        Реляційні дані
        pgvector розширення
      NATS
        Брокер повідомлень
        Event Bus
      Ollama
        Локальна LLM
        Вбудовування
      Nginx
        Reverse Proxy
        Статичні файли
```

## Архітектура розгортання

```mermaid
graph TB
    subgraph "Docker Compose оточення"
        subgraph "Мережа: task-tracker-network"
            NGINX[nginx:alpine<br/>Порт 80:80]
            API[task-tracker-api<br/>Внутрішній :8000]
            BOT[task-tracker-bot<br/>Тільки внутрішній]
            WORKER[task-tracker-worker<br/>Тільки внутрішній]
            DASH[task-tracker-dashboard<br/>Внутрішній :5173]
            NATS[nats:alpine<br/>Внутрішній :4222]
            PG[postgres:16<br/>Порт 5555:5432]
        end

        subgraph "Томи"
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

## Огляд схеми бази даних

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

## Робочий процес розробки

```mermaid
flowchart LR
    subgraph "Дії розробника"
        CODE[Написати код]
        TEST[Запустити тести]
        TYPE[Перевірка типів]
        FMT[Форматування коду]
    end

    subgraph "Перевірки якості"
        MYPY[mypy --strict]
        RUFF[ruff format + check]
        PYTEST[pytest]
    end

    subgraph "Docker команди"
        BUILD[docker compose build]
        WATCH[docker compose watch]
        UP[docker compose up]
    end

    subgraph "Операції з БД"
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

## Ключові шаблони проектування

### Подієво-орієнтована архітектура

```mermaid
sequenceDiagram
    participant Producer as Виробник
    participant NATS
    participant Consumer1 as Споживач1
    participant Consumer2 as Споживач2

    Producer->>NATS: Опублікувати подію
    NATS->>Consumer1: Доставити подію
    NATS->>Consumer2: Доставити подію
    Consumer1->>Consumer1: Обробити незалежно
    Consumer2->>Consumer2: Обробити незалежно
```

### Dependency Injection (FastAPI)

```mermaid
graph LR
    REQUEST[HTTP Запит] --> ROUTER[Router Endpoint]
    ROUTER --> DEPS[Залежності]
    DEPS --> DB[Сесія БД]
    DEPS --> CURRENT_USER[Поточний користувач]
    DEPS --> SETTINGS[Налаштування додатку]

    DB --> SERVICE[Рівень сервісу]
    CURRENT_USER --> SERVICE
    SETTINGS --> SERVICE

    SERVICE --> RESPONSE[HTTP Відповідь]
```

### Repository Pattern

```mermaid
graph TB
    ENDPOINT[API Endpoint] --> SERVICE[Рівень сервісу]
    SERVICE --> REPO[Рівень репозиторію]
    REPO --> SQLALCHEMY[SQLAlchemy ORM]
    SQLALCHEMY --> PG[(PostgreSQL)]

    style SERVICE fill:#ff6b35
    style REPO fill:#4ecdc4
```

## Моніторинг та спостережуваність

```mermaid
graph TB
    subgraph "Метрики застосунку"
        API_LOGS[FastAPI логи]
        BOT_LOGS[Bot логи]
        WORKER_LOGS[Worker логи]
    end

    subgraph "Метрики інфраструктури"
        PG_METRICS[PostgreSQL статистика]
        NATS_METRICS[NATS метрики]
        DOCKER_STATS[Статистика контейнерів]
    end

    subgraph "Бізнес-метрики"
        TASK_RATE[Швидкість створення завдань]
        CLASS_ACCURACY[Точність класифікації]
        ANALYSIS_TIME[Тривалість аналізу]
    end

    API_LOGS --> AGGREGATOR[Агрегатор логів]
    BOT_LOGS --> AGGREGATOR
    WORKER_LOGS --> AGGREGATOR

    PG_METRICS --> MONITOR[Система моніторингу]
    NATS_METRICS --> MONITOR
    DOCKER_STATS --> MONITOR

    TASK_RATE --> DASHBOARD[Адмін дашборд]
    CLASS_ACCURACY --> DASHBOARD
    ANALYSIS_TIME --> DASHBOARD
```

## Підсумок

Система Task Tracker побудована на сучасних архітектурних принципах:

- **Подієво-орієнтована**: Слабке зв'язування через NATS повідомлення
- **Реального часу**: WebSocket для оновлень в реальному часі
- **AI-керована**: Інтеграція локальної LLM з Ollama
- **Типобезпечна**: Сувора перевірка типів mypy у всій Python кодовій базі
- **Контейнеризована**: Повна оркестрація Docker Compose
- **Масштабована**: Незалежне масштабування сервісів
- **Спостережувана**: Комплексне логування та метрики

Для більш детальної інформації про конкретні компоненти, див. відповідну архітектурну документацію.
