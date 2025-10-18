# Звіт: Як запустити AI-аналіз імпортованих Telegram повідомлень

**Дата:** 2025-10-18
**Версія:** 1.0
**Автор:** Backend Implementation Expert

---

## 1. Резюме (Executive Summary)

Analysis System - це повнофункціональна система AI-аналізу повідомлень з Telegram, яка використовує LLM (Large Language Models) для автоматичного створення task proposals на основі історії чату.

**Ключові факти:**
- ✅ Система повністю реалізована і готова до використання
- ✅ Підтримка Ollama (локально) та OpenAI (хмара)
- ✅ Фонові TaskIQ завдання для асинхронної обробки
- ✅ WebSocket для real-time оновлень
- ✅ RAG (Retrieval-Augmented Generation) для контекстно-залежних пропозицій
- ⚠️ Потребує налаштування: LLM Provider → Agent → Task Config → Assignment → Analysis Run

---

## 2. Архітектура Analysis System

### 2.1 Компоненти системи

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS SYSTEM ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────┘

1. LLM Provider (llm_providers)
   ├── Тип: Ollama або OpenAI
   ├── Конфігурація: base_url, API key (encrypted)
   └── Валідація: автоматична перевірка підключення

2. Agent Config (agent_configs)
   ├── Привʼязка до LLM Provider
   ├── System prompt (інструкції для AI)
   ├── Model name (llama3.2, gpt-4, тощо)
   └── Параметри: temperature, max_tokens

3. Task Config (task_configs)
   ├── Опис завдання (що має робити AI)
   └── JSON Schema для валідації відповіді

4. Agent-Task Assignment (agent_task_assignments)
   ├── Звʼязок Agent + Task
   └── Створює незалежний екземпляр агента

5. Analysis Run (analysis_runs)
   ├── Координує виконання AI-аналізу
   ├── Time window (які повідомлення аналізувати)
   ├── Config snapshot (версіонування для відтворюваності)
   └── Lifecycle: pending → running → completed → reviewed → closed

6. Task Proposal (task_proposals)
   ├── AI-згенеровані пропозиції завдань
   ├── Source messages (для детектування дублікатів)
   ├── Confidence score + reasoning (чому AI так вирішив)
   └── PM Review: approve/reject/merge
```

### 2.2 Database Schema (ключові таблиці)

```sql
-- Imported messages (з Telegram)
message_ingestion (sources → messages)
├── external_message_id
├── content
├── sent_at
├── analyzed (чи проаналізоване повідомлення)
└── analysis_status (pending/analyzed/spam)

-- Analysis System
llm_providers → agent_configs → agent_task_assignments
                                        ↓
                                  analysis_runs
                                        ↓
                                  task_proposals
```

---

## 3. Поточний стан бази даних

### 3.1 Що існує

✅ **Messages:** Імпортовані Telegram повідомлення в таблиці `messages`
✅ **API Endpoints:** Повний REST API для управління системою
✅ **TaskIQ Background Jobs:** Асинхронна обробка через NATS
✅ **WebSocket Broadcasting:** Real-time оновлення для frontend

### 3.2 Що потрібно налаштувати

⚠️ **LLM Provider:** Додати конфігурацію Ollama або OpenAI
⚠️ **Agent Config:** Створити AI-агента з промптом
⚠️ **Task Config:** Визначити схему завдання
⚠️ **Assignment:** Звʼязати агента з завданням
⚠️ **Analysis Run:** Запустити аналіз на історії повідомлень

---

## 4. Покроковий workflow: Як запустити AI-аналіз

### Крок 1: Створити LLM Provider

**Мета:** Налаштувати підключення до Ollama (локально) або OpenAI

**API Endpoint:**
```http
POST /api/v1/providers
Content-Type: application/json

{
  "name": "Local Ollama",
  "type": "ollama",
  "base_url": "http://host.docker.internal:11434/v1",
  "api_key": null,
  "is_active": true
}
```

**Відповідь:**
```json
{
  "id": "uuid-here",
  "name": "Local Ollama",
  "type": "ollama",
  "base_url": "http://host.docker.internal:11434/v1",
  "is_active": true,
  "validation_status": "pending",
  "created_at": "2025-10-18T21:00:00Z"
}
```

**Альтернатива (OpenAI):**
```json
{
  "name": "OpenAI GPT-4",
  "type": "openai",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-your-api-key-here",
  "is_active": true
}
```

**Перевірка статусу валідації:**
```http
GET /api/v1/providers/{provider_id}
```

---

### Крок 2: Створити Agent Config

**Мета:** Визначити AI-агента з інструкціями (system prompt)

**API Endpoint:**
```http
POST /api/v1/agents
Content-Type: application/json

{
  "name": "Task Proposal Generator",
  "description": "Generates structured task proposals from Telegram discussions",
  "provider_id": "{provider_id_from_step1}",
  "model_name": "llama3.2",
  "system_prompt": "You are a product management assistant. Analyze Telegram chat messages and create well-structured task proposals. Focus on actionable items, feature requests, and bug reports. Ignore spam and small talk. Return structured JSON with: title, description, priority, category, tags, and confidence score.",
  "temperature": 0.7,
  "max_tokens": 2000,
  "is_active": true
}
```

**System Prompt Tips:**
- Чітко опишіть роль агента
- Вкажіть, що саме шукати в повідомленнях
- Вкажіть формат відповіді (JSON schema)
- Приклади хороших промптів: `/backend/scripts/seed_analysis_system.py` lines 83-119

---

### Крок 3: Створити Task Config

**Мета:** Визначити структуру відповіді AI (JSON schema)

**API Endpoint:**
```http
POST /api/v1/task-configs
Content-Type: application/json

{
  "name": "Task Proposal Generation",
  "description": "Generate structured task proposal from messages",
  "response_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "Concise task title"
      },
      "description": {
        "type": "string",
        "description": "Detailed task description"
      },
      "category": {
        "type": "string",
        "enum": ["bug", "feature", "documentation", "task"]
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "urgent", "critical"]
      },
      "tags": {
        "type": "array",
        "items": {"type": "string"}
      },
      "confidence": {
        "type": "number",
        "minimum": 0,
        "maximum": 1,
        "description": "AI confidence score"
      }
    },
    "required": ["title", "description", "category", "priority", "confidence"]
  },
  "is_active": true
}
```

**Приклади schema:** `/backend/scripts/seed_analysis_system.py` lines 121-183

---

### Крок 4: Створити Agent-Task Assignment

**Мета:** Звʼязати Agent з Task (створює екземпляр агента)

**API Endpoint:**
```http
POST /api/v1/agents/{agent_id}/tasks
Content-Type: application/json

{
  "task_id": "{task_config_id_from_step3}",
  "is_active": true
}
```

**Альтернатива (через /assignments):**
```http
GET /api/v1/assignments?active_only=true
```

**Збережіть `assignment_id` для наступного кроку!**

---

### Крок 5: Створити Analysis Run

**Мета:** Визначити time window для аналізу повідомлень

**API Endpoint:**
```http
POST /api/v1/analysis/runs
Content-Type: application/json

{
  "time_window_start": "2025-10-01T00:00:00Z",
  "time_window_end": "2025-10-18T23:59:59Z",
  "agent_assignment_id": "{assignment_id_from_step4}",
  "project_config_id": null,
  "trigger_type": "manual",
  "triggered_by_user_id": null
}
```

**Відповідь:**
```json
{
  "id": "run-uuid-here",
  "status": "pending",
  "time_window_start": "2025-10-01T00:00:00Z",
  "time_window_end": "2025-10-18T23:59:59Z",
  "agent_assignment_id": "assignment-uuid",
  "config_snapshot": {
    "agent": {...},
    "task": {...}
  },
  "created_at": "2025-10-18T21:30:00Z"
}
```

**Збережіть `run_id` для наступного кроку!**

---

### Крок 6: Запустити Analysis Run

**Мета:** Запустити фоновий TaskIQ job для обробки повідомлень

**API Endpoint:**
```http
POST /api/v1/analysis/runs/{run_id}/start?use_rag=false
```

**Параметри:**
- `use_rag=true` - Увімкнути RAG для context-aware proposals (рекомендовано!)
- `use_rag=false` - Базовий аналіз без RAG

**Відповідь:**
```json
{
  "status": "started",
  "message": "Analysis run job submitted for background processing",
  "run_id": "run-uuid-here",
  "use_rag": false
}
```

**Що відбувається в background job:**
1. Fetch messages in time window (з таблиці `messages`)
2. Pre-filter messages (видалити спам, короткі повідомлення)
3. Create batches (групування для ефективності)
4. Process each batch with LLM (відправка до Ollama/OpenAI)
5. Save proposals (зберегти AI-пропозиції в `task_proposals`)
6. Update run metrics (токени, вартість, тощо)
7. Broadcast WebSocket events (real-time оновлення)

**Моніторинг прогресу:**
```http
GET /api/v1/analysis/runs/{run_id}
```

**WebSocket subscription (frontend):**
```javascript
ws://localhost/ws/analysis
// Events: run_created, run_progress, run_completed, run_failed
```

---

### Крок 7: Переглянути Proposals

**Мета:** Переглянути AI-згенеровані пропозиції завдань

**API Endpoint:**
```http
GET /api/v1/analysis/proposals?run_id={run_id}&status=pending
```

**Фільтри:**
- `status` - pending/approved/rejected/merged
- `confidence_min` - мінімальний confidence score (0.0-1.0)
- `confidence_max` - максимальний confidence score

**Відповідь:**
```json
{
  "items": [
    {
      "id": "proposal-uuid",
      "proposed_title": "Fix authentication timeout on backend API",
      "proposed_description": "Users reporting session timeouts after 5 minutes...",
      "proposed_priority": "high",
      "proposed_category": "bug",
      "proposed_tags": ["backend", "authentication", "security"],
      "source_message_ids": [123, 124, 125],
      "message_count": 3,
      "confidence": 0.92,
      "reasoning": "Multiple user reports indicate production issue...",
      "llm_recommendation": "new_task",
      "status": "pending",
      "created_at": "2025-10-18T21:45:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 100
}
```

---

### Крок 8: Approve/Reject Proposals

**Approve proposal:**
```http
PUT /api/v1/analysis/proposals/{proposal_id}/approve
Content-Type: application/json

{
  "notes": "Good catch! Creating task."
}
```

**Reject proposal:**
```http
PUT /api/v1/analysis/proposals/{proposal_id}/reject
Content-Type: application/json

{
  "reason": "Duplicate of existing task #123"
}
```

**Merge proposal:**
```http
PUT /api/v1/analysis/proposals/{proposal_id}/merge
Content-Type: application/json

{
  "target_task_id": "existing-task-uuid"
}
```

---

### Крок 9: Close Analysis Run

**Мета:** Закрити run та отримати accuracy metrics

**Умова:** Всі proposals мають бути reviewed (`proposals_pending == 0`)

**API Endpoint:**
```http
PUT /api/v1/analysis/runs/{run_id}/close
```

**Відповідь:**
```json
{
  "id": "run-uuid",
  "status": "closed",
  "proposals_total": 15,
  "proposals_approved": 12,
  "proposals_rejected": 3,
  "proposals_pending": 0,
  "accuracy_metrics": {
    "approval_rate": 0.80,
    "avg_confidence": 0.87,
    "precision": 0.92
  },
  "closed_at": "2025-10-18T22:00:00Z"
}
```

---

## 5. Доступні API Endpoints

### 5.1 LLM Providers
```
POST   /api/v1/providers           - Create provider
GET    /api/v1/providers           - List providers
GET    /api/v1/providers/{id}      - Get provider
PUT    /api/v1/providers/{id}      - Update provider
DELETE /api/v1/providers/{id}      - Delete provider
```

### 5.2 Agent Configs
```
POST   /api/v1/agents              - Create agent
GET    /api/v1/agents              - List agents
GET    /api/v1/agents/{id}         - Get agent
PUT    /api/v1/agents/{id}         - Update agent
DELETE /api/v1/agents/{id}         - Delete agent
POST   /api/v1/agents/{id}/test    - Test agent with prompt
```

### 5.3 Task Configs
```
POST   /api/v1/task-configs        - Create task config
GET    /api/v1/task-configs        - List task configs
GET    /api/v1/task-configs/{id}   - Get task config
PUT    /api/v1/task-configs/{id}   - Update task config
DELETE /api/v1/task-configs/{id}   - Delete task config
```

### 5.4 Assignments
```
GET    /api/v1/assignments         - List all assignments with details
POST   /api/v1/agents/{agent_id}/tasks  - Create assignment
GET    /api/v1/agents/{agent_id}/tasks  - List agent's tasks
DELETE /api/v1/agents/{agent_id}/tasks/{task_id}  - Delete assignment
```

### 5.5 Analysis Runs
```
POST   /api/v1/analysis/runs       - Create run
GET    /api/v1/analysis/runs       - List runs (with filters)
GET    /api/v1/analysis/runs/{id}  - Get run details
POST   /api/v1/analysis/runs/{id}/start  - Start run (TaskIQ job)
PUT    /api/v1/analysis/runs/{id}/close  - Close run
```

### 5.6 Proposals
```
GET    /api/v1/analysis/proposals          - List proposals (with filters)
GET    /api/v1/analysis/proposals/{id}     - Get proposal
PUT    /api/v1/analysis/proposals/{id}     - Update proposal
PUT    /api/v1/analysis/proposals/{id}/approve  - Approve proposal
PUT    /api/v1/analysis/proposals/{id}/reject   - Reject proposal
PUT    /api/v1/analysis/proposals/{id}/merge    - Merge with existing task
```

---

## 6. Налаштування та вимоги

### 6.1 Ollama (локально)

**1. Встановити Ollama:**
```bash
# На host машині (не в Docker)
curl -fsSL https://ollama.com/install.sh | sh
```

**2. Запустити Ollama:**
```bash
ollama serve
```

**3. Завантажити модель:**
```bash
ollama pull llama3.2
# або
ollama pull llama3
```

**4. Перевірити:**
```bash
curl http://localhost:11434/v1/models
```

**5. Конфігурація для Docker:**
```json
{
  "base_url": "http://host.docker.internal:11434/v1"
}
```

### 6.2 OpenAI (хмара)

**1. Отримати API key:** https://platform.openai.com/api-keys

**2. Конфігурація:**
```json
{
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-your-key-here"
}
```

**3. Моделі:**
- `gpt-4` - Найкраща якість, дорого
- `gpt-4-turbo` - Швидше, дешевше
- `gpt-3.5-turbo` - Базова модель

---

## 7. Seed Script для тестування

**Швидкий старт з тестовими даними:**

```bash
# У backend директорії
cd backend

# Очистити + Seed (3 runs, 5 proposals)
uv run python scripts/seed_analysis_system.py --clear --seed --runs 3 --proposals 5

# Тільки seed (залишити існуючі дані)
uv run python scripts/seed_analysis_system.py --seed --runs 10 --proposals 30

# Тільки очистити
uv run python scripts/seed_analysis_system.py --clear
```

**Що створює seed script:**
- ✅ 2 Users (PM + Developer)
- ✅ 3 Sources (Telegram, Slack, Email)
- ✅ 3 LLM Providers (Ollama + OpenAI GPT-4 + GPT-3.5)
- ✅ 5 Agent Configs (classifiers, analyzers, generators)
- ✅ 4 Task Configs (classification, detection, generation)
- ✅ 5 Agent-Task Assignments
- ✅ 3 Project Configs (Backend, Frontend, Bot)
- ✅ 100 Messages (із різних джерел)
- ✅ 10 Analysis Runs (різні статуси)
- ✅ 30 Task Proposals (pending/approved/rejected)

**Файл:** `/backend/scripts/seed_analysis_system.py`

---

## 8. Приклад повного workflow (curl)

```bash
# 1. Create Ollama Provider
PROVIDER_ID=$(curl -X POST http://localhost/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Ollama",
    "type": "ollama",
    "base_url": "http://host.docker.internal:11434/v1",
    "is_active": true
  }' | jq -r '.id')

echo "Provider ID: $PROVIDER_ID"

# 2. Create Agent
AGENT_ID=$(curl -X POST http://localhost/api/v1/agents \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Task Analyzer\",
    \"description\": \"Analyzes messages and creates task proposals\",
    \"provider_id\": \"$PROVIDER_ID\",
    \"model_name\": \"llama3.2\",
    \"system_prompt\": \"You are a PM assistant. Create task proposals from chat messages.\",
    \"temperature\": 0.7
  }" | jq -r '.id')

echo "Agent ID: $AGENT_ID"

# 3. Create Task Config
TASK_ID=$(curl -X POST http://localhost/api/v1/task-configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Proposal Generation",
    "description": "Generate task proposal",
    "response_schema": {
      "type": "object",
      "properties": {
        "title": {"type": "string"},
        "description": {"type": "string"},
        "category": {"type": "string"},
        "priority": {"type": "string"},
        "confidence": {"type": "number"}
      },
      "required": ["title", "description", "confidence"]
    }
  }' | jq -r '.id')

echo "Task ID: $TASK_ID"

# 4. Create Assignment
ASSIGNMENT_ID=$(curl -X POST http://localhost/api/v1/agents/$AGENT_ID/tasks \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}" | jq -r '.id')

echo "Assignment ID: $ASSIGNMENT_ID"

# 5. Create Analysis Run (last 7 days)
START_DATE=$(date -u -d '7 days ago' '+%Y-%m-%dT%H:%M:%SZ')
END_DATE=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

RUN_ID=$(curl -X POST http://localhost/api/v1/analysis/runs \
  -H "Content-Type: application/json" \
  -d "{
    \"time_window_start\": \"$START_DATE\",
    \"time_window_end\": \"$END_DATE\",
    \"agent_assignment_id\": \"$ASSIGNMENT_ID\",
    \"trigger_type\": \"manual\"
  }" | jq -r '.id')

echo "Run ID: $RUN_ID"

# 6. Start Analysis Run
curl -X POST "http://localhost/api/v1/analysis/runs/$RUN_ID/start?use_rag=true"

# 7. Monitor Progress
curl http://localhost/api/v1/analysis/runs/$RUN_ID | jq

# 8. List Proposals
curl "http://localhost/api/v1/analysis/proposals?run_id=$RUN_ID&status=pending" | jq
```

---

## 9. Troubleshooting

### 9.1 Provider validation failed

**Симптом:** `validation_status: "error"`

**Рішення:**
```bash
# Перевірити, чи Ollama запущений
curl http://localhost:11434/v1/models

# Перевірити логи
docker logs task-tracker-api

# Re-validate provider
curl -X PUT http://localhost/api/v1/providers/{id} \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

### 9.2 Analysis run failed

**Симптом:** `status: "failed"`, `error_log` не null

**Рішення:**
```bash
# 1. Перевірити статус run
curl http://localhost/api/v1/analysis/runs/{run_id} | jq '.error_log'

# 2. Перевірити логи worker
docker logs task-tracker-worker

# 3. Перевірити, чи є повідомлення в time window
curl "http://localhost/api/v1/messages?start_date={start}&end_date={end}" | jq '.total'
```

### 9.3 No proposals created

**Симптом:** `proposals_total: 0` після `completed`

**Можливі причини:**
- Немає повідомлень в time window
- Pre-filter відфільтрував всі повідомлення (spam)
- LLM не знайшов actionable tasks
- Помилка в response_schema

**Рішення:**
```bash
# Перевірити кількість повідомлень
curl http://localhost/api/v1/analysis/runs/{run_id} | jq '{
  total_messages: .total_messages_in_window,
  after_filter: .messages_after_prefilter,
  batches: .batches_created
}'

# Перевірити логи LLM
docker logs task-tracker-worker | grep "Run {run_id}"
```

### 9.4 Database connection error

**Симптом:** `socket.gaierror: Temporary failure in name resolution`

**Рішення:**
```bash
# Запустити PostgreSQL
just services
# або
docker compose up -d postgres

# Перевірити підключення
docker exec -it task-tracker-postgres pg_isready
```

---

## 10. Наступні кроки

### 10.1 Для тестування (локально)
1. ✅ Встановити Ollama на host машині
2. ✅ Завантажити модель: `ollama pull llama3.2`
3. ✅ Запустити services: `just services`
4. ✅ Seed тестові дані: `just db-analysis-seed`
5. ✅ Створити provider → agent → task → assignment
6. ✅ Запустити analysis run
7. ✅ Переглянути proposals

### 10.2 Для production
1. ⚠️ Налаштувати OpenAI API key
2. ⚠️ Створити project configs з glossary
3. ⚠️ Налаштувати RAG для context-aware proposals
4. ⚠️ Імплементувати PM review workflow у frontend
5. ⚠️ Налаштувати моніторинг LLM usage (токени, вартість)
6. ⚠️ Додати rate limiting для LLM API

---

## 11. Посилання на код

**Моделі:**
- `backend/app/models/llm_provider.py` - LLM Provider
- `backend/app/models/agent_config.py` - Agent Config
- `backend/app/models/task_config.py` - Task Config
- `backend/app/models/agent_task_assignment.py` - Assignment
- `backend/app/models/analysis_run.py` - Analysis Run
- `backend/app/models/task_proposal.py` - Task Proposal

**API Endpoints:**
- `backend/app/api/v1/providers.py` - Provider CRUD
- `backend/app/api/v1/agents.py` - Agent CRUD + Testing
- `backend/app/api/v1/task_configs.py` - Task Config CRUD
- `backend/app/api/v1/assignments.py` - Assignment listing
- `backend/app/api/v1/analysis_runs.py` - Analysis Run management
- `backend/app/api/v1/proposals.py` - Proposal review

**Services:**
- `backend/app/services/analysis_service.py` - AnalysisExecutor (core logic)
- `backend/app/services/provider_crud.py` - Provider CRUD
- `backend/app/services/agent_service.py` - Agent CRUD + Testing
- `backend/app/services/proposal_service.py` - Proposal review

**Background Jobs:**
- `backend/app/tasks.py` - `execute_analysis_run()` (line 330-441)

**Seed Script:**
- `backend/scripts/seed_analysis_system.py` - Повний seed з прикладами

---

## 12. Висновок

Analysis System повністю реалізований і готовий до використання. Для запуску AI-аналізу Telegram повідомлень потрібно:

1. **Налаштувати LLM** (Ollama або OpenAI)
2. **Створити конфігурацію** (Provider → Agent → Task → Assignment)
3. **Запустити Analysis Run** через API
4. **Переглянути Proposals** та approve/reject

Всі API endpoints документовані з OpenAPI schema, доступні через Swagger UI:
```
http://localhost/docs#/analysis
```

**Контакт для питань:** Backend team через project Slack channel

---

**Дата створення:** 2025-10-18
**Версія звіту:** 1.0
**Статус:** ✅ Ready for use
