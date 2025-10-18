# 🤖 Analysis System - Інструкція для користувачів

> **TL;DR:** Система для автоматичного аналізу Telegram повідомлень за допомогою AI. Витягує task proposals з історії чату.

**Останнє оновлення:** 2025-10-18
**Версія:** 1.0
**Для кого:** Розробники, які імпортували повідомлення та хочуть запустити AI-аналіз

---

## 📖 Зміст

1. [Що це таке?](#-що-це-таке)
2. [Що потрібно для початку](#-що-потрібно-для-початку)
3. [Швидкий старт (5 хвилин)](#-швидкий-старт-5-хвилин)
4. [Покрокова інструкція](#-покрокова-інструкція)
5. [Перегляд результатів](#-перегляд-результатів)
6. [Приклади команд](#-приклади-команд)
7. [Troubleshooting](#-troubleshooting)
8. [API Reference](#-api-reference)

---

## 🎯 Що це таке?

**Analysis System** - це AI-помічник, який:

- 📩 Читає ваші імпортовані Telegram повідомлення
- 🧠 Аналізує їх за допомогою LLM (Ollama або OpenAI)
- 📝 Створює task proposals (баги, фічі, завдання)
- ✅ Дає змогу approve/reject кожну пропозицію
- 📊 Збирає метрики та accuracy stats

**Приклад:**
У вас є 100 повідомлень з чату за тиждень. AI знайде 5-10 actionable tasks та запропонує їх створити.

---

## 🔧 Що потрібно для початку

### Варіант 1: Локально з Ollama (безкоштовно)

```bash
# Встановити Ollama на host машині
curl -fsSL https://ollama.com/install.sh | sh

# Запустити Ollama
ollama serve

# Завантажити модель
ollama pull llama3.2

# Перевірити
curl http://localhost:11434/v1/models
```

**Плюси:** Безкоштовно, приватність, швидко
**Мінуси:** Потрібен потужний комп'ютер, гірша якість ніж GPT-4

### Варіант 2: OpenAI (платно)

```bash
# Отримати API key
# https://platform.openai.com/api-keys
```

**Плюси:** Найкраща якість, не потрібні ресурси
**Мінуси:** Платно (~$0.01-0.03 за запит)

### Запуск сервісів

```bash
# Запустити всі сервіси
just services

# Або окремо
docker compose up -d postgres nats worker api
```

---

## ⚡ Швидкий старт (5 хвилин)

**Для тих, хто хоче швидко потестувати:**

```bash
# 1. Запустити сервіси
just services

# 2. Seed тестові дані (створює всю конфігурацію)
cd backend
uv run python scripts/seed_analysis_system.py --clear --seed --runs 3 --proposals 10

# 3. Відкрити Swagger UI
open http://localhost/docs#/analysis
```

**Що створить seed script:**

- ✅ 3 LLM Providers (Ollama + OpenAI GPT-4 + GPT-3.5)
- ✅ 5 AI Agents з різними промптами
- ✅ 4 Task Configs (різні JSON schemas)
- ✅ 5 Agent-Task Assignments
- ✅ 100 тестових повідомлень
- ✅ 3 готових Analysis Runs
- ✅ 10 Task Proposals

**Тепер можна:**

```bash
# Переглянути proposals
curl http://localhost/api/v1/analysis/proposals | jq

# Approve пропозицію
curl -X PUT http://localhost/api/v1/analysis/proposals/{proposal_id}/approve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Good catch!"}'
```

---

## 📋 Покрокова інструкція

### Крок 1: Створити LLM Provider

**Що це:** Налаштування підключення до AI (Ollama або OpenAI)

**Приклад з Ollama:**

```bash
curl -X POST http://localhost/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Ollama",
    "type": "ollama",
    "base_url": "http://host.docker.internal:11434/v1",
    "api_key": null,
    "is_active": true
  }'
```

**Приклад з OpenAI:**

```bash
curl -X POST http://localhost/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenAI GPT-4",
    "type": "openai",
    "base_url": "https://api.openai.com/v1",
    "api_key": "sk-your-api-key-here",
    "is_active": true
  }'
```

**Збережіть `id` з відповіді** - він знадобиться в наступному кроці!

**Перевірка:**

```bash
# Перевірити статус валідації
curl http://localhost/api/v1/providers/{provider_id} | jq '.validation_status'
# Має бути: "valid"
```

---

### Крок 2: Створити AI Agent

**Що це:** Налаштування AI з інструкціями (system prompt)

**System prompt** - це інструкції для AI, що саме він має робити.

**Приклад:**

```bash
curl -X POST http://localhost/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Task Proposal Generator",
    "description": "Generates structured task proposals from Telegram discussions",
    "provider_id": "{provider_id_from_step1}",
    "model_name": "llama3.2",
    "system_prompt": "You are a product management assistant. Analyze Telegram chat messages and create well-structured task proposals. Focus on:\n\n- Feature requests from users\n- Bug reports\n- Technical debt\n- Actionable improvements\n\nIgnore:\n- Casual conversations\n- Spam\n- Off-topic discussions\n\nReturn structured JSON with: title, description, priority (low/medium/high/urgent/critical), category (bug/feature/task/documentation), tags, and confidence score (0-1).",
    "temperature": 0.7,
    "max_tokens": 2000,
    "is_active": true
  }'
```

**Параметри:**

- `temperature` (0.0-1.0): Креативність AI. 0.7 = збалансовано, 0.3 = консервативно, 0.9 = креативно
- `max_tokens`: Максимальна довжина відповіді (2000 = ~500 слів)
- `model_name`: Для Ollama - `llama3.2`, для OpenAI - `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`

**💡 Tip:** Подивіться приклади промптів у файлі `/backend/scripts/seed_analysis_system.py` (lines 83-119)

**Збережіть `id` агента!**

---

### Крок 3: Створити Task Config

**Що це:** Визначення структури відповіді AI (JSON schema)

**Приклад:**

```bash
curl -X POST http://localhost/api/v1/task-configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Task Proposal Generation",
    "description": "Generate structured task proposal from messages",
    "response_schema": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Concise task title (max 100 chars)"
        },
        "description": {
          "type": "string",
          "description": "Detailed task description"
        },
        "category": {
          "type": "string",
          "enum": ["bug", "feature", "documentation", "task", "technical_debt"]
        },
        "priority": {
          "type": "string",
          "enum": ["low", "medium", "high", "urgent", "critical"]
        },
        "tags": {
          "type": "array",
          "items": {"type": "string"},
          "description": "Relevant tags: frontend, backend, api, ui, etc."
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "AI confidence score (0-1)"
        }
      },
      "required": ["title", "description", "category", "priority", "confidence"]
    },
    "is_active": true
  }'
```

**💡 Tip:** JSON schema валідує відповідь AI. Якщо AI поверне невалідний JSON - запит провалиться.

**Збережіть `id` task config!**

---

### Крок 4: Створити Assignment

**Що це:** Зв'язок між Agent та Task (створює екземпляр агента)

**Приклад:**

```bash
curl -X POST http://localhost/api/v1/agents/{agent_id}/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "{task_config_id_from_step3}",
    "is_active": true
  }'
```

**Збережіть `id` assignment!**

**Перевірка:**

```bash
# Переглянути всі активні assignments
curl http://localhost/api/v1/assignments?active_only=true | jq
```

---

### Крок 5: Створити Analysis Run

**Що це:** Визначення time window для аналізу повідомлень

**Приклад (останні 7 днів):**

```bash
# Розрахувати дати
START_DATE=$(date -u -d '7 days ago' '+%Y-%m-%dT%H:%M:%SZ')
END_DATE=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# Створити run
curl -X POST http://localhost/api/v1/analysis/runs \
  -H "Content-Type: application/json" \
  -d "{
    \"time_window_start\": \"$START_DATE\",
    \"time_window_end\": \"$END_DATE\",
    \"agent_assignment_id\": \"{assignment_id_from_step4}\",
    \"project_config_id\": null,
    \"trigger_type\": \"manual\",
    \"triggered_by_user_id\": null
  }"
```

**Приклад (конкретні дати):**

```bash
curl -X POST http://localhost/api/v1/analysis/runs \
  -H "Content-Type: application/json" \
  -d '{
    "time_window_start": "2025-10-01T00:00:00Z",
    "time_window_end": "2025-10-18T23:59:59Z",
    "agent_assignment_id": "{assignment_id}",
    "trigger_type": "manual"
  }'
```

**Відповідь:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "time_window_start": "2025-10-01T00:00:00Z",
  "time_window_end": "2025-10-18T23:59:59Z",
  "agent_assignment_id": "...",
  "config_snapshot": { ... },
  "created_at": "2025-10-18T21:30:00Z"
}
```

**Збережіть `id` run!**

---

### Крок 6: Запустити Analysis Run

**Що це:** Запуск фонового TaskIQ job для обробки повідомлень

**Приклад:**

```bash
# З RAG (рекомендовано для кращої точності)
curl -X POST "http://localhost/api/v1/analysis/runs/{run_id}/start?use_rag=true"

# Без RAG (базовий аналіз)
curl -X POST "http://localhost/api/v1/analysis/runs/{run_id}/start?use_rag=false"
```

**Що відбувається під капотом:**

1. ⏳ Fetch messages in time window (з БД)
2. 🧹 Pre-filter (видалити спам, короткі повідомлення)
3. 📦 Create batches (групування по 10-20 messages)
4. 🤖 Process each batch with LLM (API call до Ollama/OpenAI)
5. 💾 Save proposals (зберегти AI-пропозиції)
6. 📊 Update run metrics (токени, вартість)
7. 📡 Broadcast WebSocket events (real-time оновлення)

**Моніторинг прогресу:**

```bash
# Перевірити статус
curl http://localhost/api/v1/analysis/runs/{run_id} | jq '{
  status: .status,
  total_messages: .total_messages_in_window,
  proposals_total: .proposals_total,
  proposals_pending: .proposals_pending
}'
```

**Статуси:**

- `pending` - Створено, але не запущено
- `running` - В процесі обробки
- `completed` - Обробка завершена, чекає review
- `reviewed` - Всі proposals reviewed
- `closed` - Закрито з accuracy metrics
- `failed` - Помилка (див. `error_log`)

---

## 📊 Перегляд результатів

### Переглянути всі proposals

```bash
# Всі proposals з run
curl "http://localhost/api/v1/analysis/proposals?run_id={run_id}" | jq

# Тільки pending (потребують review)
curl "http://localhost/api/v1/analysis/proposals?run_id={run_id}&status=pending" | jq

# Високий confidence (>0.8)
curl "http://localhost/api/v1/analysis/proposals?confidence_min=0.8" | jq

# Пагінація
curl "http://localhost/api/v1/analysis/proposals?page=1&page_size=20" | jq
```

**Приклад відповіді:**

```json
{
  "items": [
    {
      "id": "proposal-uuid",
      "proposed_title": "Fix authentication timeout on backend API",
      "proposed_description": "Users reporting session timeouts after 5 minutes of inactivity. Need to increase JWT token expiration and add refresh token mechanism.",
      "proposed_priority": "high",
      "proposed_category": "bug",
      "proposed_tags": ["backend", "authentication", "security"],
      "source_message_ids": [123, 124, 125],
      "message_count": 3,
      "confidence": 0.92,
      "reasoning": "Multiple user reports indicate production issue affecting user experience. Clear actionable steps identified.",
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

### Approve proposal

```bash
curl -X PUT http://localhost/api/v1/analysis/proposals/{proposal_id}/approve \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Good catch! Creating task in backlog."
  }'
```

### Reject proposal

```bash
curl -X PUT http://localhost/api/v1/analysis/proposals/{proposal_id}/reject \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Duplicate of existing task #123"
  }'
```

### Merge з існуючим завданням

```bash
curl -X PUT http://localhost/api/v1/analysis/proposals/{proposal_id}/merge \
  -H "Content-Type: application/json" \
  -d '{
    "target_task_id": "existing-task-uuid",
    "merge_notes": "Related to ongoing authentication refactoring"
  }'
```

### Закрити Analysis Run

**Умова:** Всі proposals мають бути reviewed (`proposals_pending == 0`)

```bash
curl -X PUT http://localhost/api/v1/analysis/runs/{run_id}/close
```

**Відповідь з accuracy metrics:**

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

## 💡 Приклади команд

### Повний workflow (bash script)

```bash
#!/bin/bash
set -e

# 1. Create Ollama Provider
echo "Creating LLM Provider..."
PROVIDER_ID=$(curl -s -X POST http://localhost/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Ollama",
    "type": "ollama",
    "base_url": "http://host.docker.internal:11434/v1",
    "is_active": true
  }' | jq -r '.id')

echo "✅ Provider ID: $PROVIDER_ID"

# 2. Create Agent
echo "Creating AI Agent..."
AGENT_ID=$(curl -s -X POST http://localhost/api/v1/agents \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Task Analyzer\",
    \"description\": \"Analyzes messages and creates task proposals\",
    \"provider_id\": \"$PROVIDER_ID\",
    \"model_name\": \"llama3.2\",
    \"system_prompt\": \"You are a PM assistant. Analyze chat messages and create task proposals.\",
    \"temperature\": 0.7,
    \"max_tokens\": 2000
  }" | jq -r '.id')

echo "✅ Agent ID: $AGENT_ID"

# 3. Create Task Config
echo "Creating Task Config..."
TASK_ID=$(curl -s -X POST http://localhost/api/v1/task-configs \
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
        "tags": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "number"}
      },
      "required": ["title", "description", "confidence"]
    }
  }' | jq -r '.id')

echo "✅ Task ID: $TASK_ID"

# 4. Create Assignment
echo "Creating Assignment..."
ASSIGNMENT_ID=$(curl -s -X POST http://localhost/api/v1/agents/$AGENT_ID/tasks \
  -H "Content-Type: application/json" \
  -d "{\"task_id\": \"$TASK_ID\"}" | jq -r '.id')

echo "✅ Assignment ID: $ASSIGNMENT_ID"

# 5. Create Analysis Run (last 7 days)
echo "Creating Analysis Run..."
START_DATE=$(date -u -d '7 days ago' '+%Y-%m-%dT%H:%M:%SZ')
END_DATE=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

RUN_ID=$(curl -s -X POST http://localhost/api/v1/analysis/runs \
  -H "Content-Type: application/json" \
  -d "{
    \"time_window_start\": \"$START_DATE\",
    \"time_window_end\": \"$END_DATE\",
    \"agent_assignment_id\": \"$ASSIGNMENT_ID\",
    \"trigger_type\": \"manual\"
  }" | jq -r '.id')

echo "✅ Run ID: $RUN_ID"

# 6. Start Analysis Run
echo "Starting Analysis Run..."
curl -s -X POST "http://localhost/api/v1/analysis/runs/$RUN_ID/start?use_rag=true" | jq

# 7. Monitor Progress
echo "Monitoring progress..."
while true; do
  STATUS=$(curl -s http://localhost/api/v1/analysis/runs/$RUN_ID | jq -r '.status')
  echo "Current status: $STATUS"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi

  sleep 5
done

# 8. List Proposals
echo "Listing proposals..."
curl -s "http://localhost/api/v1/analysis/proposals?run_id=$RUN_ID&status=pending" | jq

echo "✅ Done! Review proposals at: http://localhost/api/v1/analysis/proposals?run_id=$RUN_ID"
```

### Тестування AI Agent (без run)

```bash
# Протестувати агента перед створенням run
curl -X POST http://localhost/api/v1/agents/{agent_id}/test \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "User reported: \"The login button is not working on mobile Safari. Getting 500 error when clicking submit.\""
  }'
```

**Відповідь:**

```json
{
  "success": true,
  "response": {
    "title": "Fix login button 500 error on mobile Safari",
    "description": "Users experiencing server error when submitting login form on mobile Safari browser...",
    "category": "bug",
    "priority": "high",
    "tags": ["mobile", "safari", "authentication"],
    "confidence": 0.88
  },
  "raw_response": "{...}"
}
```

---

## 🔥 Troubleshooting

### ❌ Provider validation failed

**Симптом:**

```json
{
  "validation_status": "error",
  "last_validation_error": "Connection refused"
}
```

**Рішення:**

```bash
# 1. Перевірити, чи Ollama запущений
curl http://localhost:11434/v1/models

# Якщо не працює - запустити Ollama
ollama serve

# 2. Перевірити логи API
docker logs task-tracker-api | grep "Provider validation"

# 3. Re-validate provider
curl -X PUT http://localhost/api/v1/providers/{provider_id} \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

---

### ❌ Analysis run failed

**Симптом:**

```json
{
  "status": "failed",
  "error_log": "LLM API error: ..."
}
```

**Рішення:**

```bash
# 1. Перевірити error_log
curl http://localhost/api/v1/analysis/runs/{run_id} | jq '.error_log'

# 2. Перевірити логи worker
docker logs task-tracker-worker | grep "Run {run_id}"

# 3. Перевірити, чи є повідомлення в time window
curl "http://localhost/api/v1/messages?start_date={start}&end_date={end}" | jq '.total'

# 4. Перевірити статус LLM provider
curl http://localhost/api/v1/providers/{provider_id} | jq '.validation_status'
```

---

### ❌ No proposals created

**Симптом:**

```json
{
  "status": "completed",
  "proposals_total": 0
}
```

**Можливі причини:**

1. Немає повідомлень в time window
2. Pre-filter відфільтрував всі повідомлення (spam, короткі)
3. LLM не знайшов actionable tasks
4. Помилка в response_schema

**Рішення:**

```bash
# Перевірити кількість повідомлень
curl http://localhost/api/v1/analysis/runs/{run_id} | jq '{
  total_messages: .total_messages_in_window,
  after_filter: .messages_after_prefilter,
  batches: .batches_created,
  proposals: .proposals_total
}'

# Якщо total_messages == 0
# → Змінити time window

# Якщо after_filter == 0
# → Перевірити налаштування pre-filter

# Якщо batches_created > 0, але proposals == 0
# → Перевірити логи LLM відповідей
docker logs task-tracker-worker | grep "Run {run_id}"
```

---

### ❌ Database connection error

**Симптом:**

```
socket.gaierror: Temporary failure in name resolution
```

**Рішення:**

```bash
# 1. Запустити PostgreSQL
just services
# або
docker compose up -d postgres

# 2. Перевірити підключення
docker exec -it task-tracker-postgres pg_isready

# 3. Перевірити змінні оточення
docker exec task-tracker-api env | grep DATABASE_URL
```

---

### ❌ JSON schema validation error

**Симптом:**

```json
{
  "error": "LLM response does not match schema"
}
```

**Рішення:**

```bash
# 1. Перевірити response_schema
curl http://localhost/api/v1/task-configs/{task_id} | jq '.response_schema'

# 2. Протестувати агента
curl -X POST http://localhost/api/v1/agents/{agent_id}/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test message"}' | jq

# 3. Переконатися, що schema та system_prompt узгоджені
# Наприклад:
# - Schema вимагає "priority": "high"
# - Prompt має містити: enum values (low/medium/high/urgent/critical)

# 4. Оновити system_prompt
curl -X PUT http://localhost/api/v1/agents/{agent_id} \
  -H "Content-Type: application/json" \
  -d '{
    "system_prompt": "...Return JSON with fields: title (string), description (string), priority (low/medium/high/urgent/critical), confidence (0-1)..."
  }'
```

---

## 📚 API Reference

### LLM Providers

| Endpoint                     | Method | Description             |
| ---------------------------- | ------ | ----------------------- |
| `/api/v1/providers`          | POST   | Create provider         |
| `/api/v1/providers`          | GET    | List providers          |
| `/api/v1/providers/{id}`     | GET    | Get provider details    |
| `/api/v1/providers/{id}`     | PUT    | Update provider         |
| `/api/v1/providers/{id}`     | DELETE | Delete provider         |

**Query params (GET):**

- `active_only=true` - Тільки активні providers

---

### Agent Configs

| Endpoint                       | Method | Description             |
| ------------------------------ | ------ | ----------------------- |
| `/api/v1/agents`               | POST   | Create agent            |
| `/api/v1/agents`               | GET    | List agents             |
| `/api/v1/agents/{id}`          | GET    | Get agent details       |
| `/api/v1/agents/{id}`          | PUT    | Update agent            |
| `/api/v1/agents/{id}`          | DELETE | Delete agent            |
| `/api/v1/agents/{id}/test`     | POST   | Test agent with prompt  |

**Query params (GET):**

- `provider_id={uuid}` - Filter by provider
- `active_only=true` - Тільки активні agents

---

### Task Configs

| Endpoint                       | Method | Description             |
| ------------------------------ | ------ | ----------------------- |
| `/api/v1/task-configs`         | POST   | Create task config      |
| `/api/v1/task-configs`         | GET    | List task configs       |
| `/api/v1/task-configs/{id}`    | GET    | Get task config details |
| `/api/v1/task-configs/{id}`    | PUT    | Update task config      |
| `/api/v1/task-configs/{id}`    | DELETE | Delete task config      |

**Query params (GET):**

- `active_only=true` - Тільки активні configs

---

### Assignments

| Endpoint                                      | Method | Description                  |
| --------------------------------------------- | ------ | ---------------------------- |
| `/api/v1/assignments`                         | GET    | List all assignments         |
| `/api/v1/agents/{agent_id}/tasks`             | POST   | Create assignment            |
| `/api/v1/agents/{agent_id}/tasks`             | GET    | List agent's tasks           |
| `/api/v1/agents/{agent_id}/tasks/{task_id}`   | DELETE | Delete assignment            |

**Query params (GET):**

- `active_only=true` - Тільки активні assignments
- `agent_id={uuid}` - Filter by agent
- `task_id={uuid}` - Filter by task

---

### Analysis Runs

| Endpoint                                | Method | Description                      |
| --------------------------------------- | ------ | -------------------------------- |
| `/api/v1/analysis/runs`                 | POST   | Create run                       |
| `/api/v1/analysis/runs`                 | GET    | List runs                        |
| `/api/v1/analysis/runs/{id}`            | GET    | Get run details                  |
| `/api/v1/analysis/runs/{id}/start`      | POST   | Start run (TaskIQ job)           |
| `/api/v1/analysis/runs/{id}/close`      | PUT    | Close run (calculate metrics)    |

**Query params (GET):**

- `status=pending|running|completed|reviewed|closed|failed`
- `trigger_type=manual|scheduled|webhook`
- `assignment_id={uuid}` - Filter by assignment

**Query params (POST /start):**

- `use_rag=true|false` - Enable RAG for context-aware proposals

---

### Proposals

| Endpoint                                       | Method | Description                    |
| ---------------------------------------------- | ------ | ------------------------------ |
| `/api/v1/analysis/proposals`                   | GET    | List proposals                 |
| `/api/v1/analysis/proposals/{id}`              | GET    | Get proposal details           |
| `/api/v1/analysis/proposals/{id}`              | PUT    | Update proposal                |
| `/api/v1/analysis/proposals/{id}/approve`      | PUT    | Approve proposal               |
| `/api/v1/analysis/proposals/{id}/reject`       | PUT    | Reject proposal                |
| `/api/v1/analysis/proposals/{id}/merge`        | PUT    | Merge with existing task       |

**Query params (GET):**

- `run_id={uuid}` - Filter by run
- `status=pending|approved|rejected|merged`
- `confidence_min=0.0` - Min confidence score
- `confidence_max=1.0` - Max confidence score
- `llm_recommendation=new_task|merge_with_existing|update_existing|ignore`
- `page=1` - Page number
- `page_size=100` - Items per page

---

## 🎓 Додаткові ресурси

### Приклади конфігурацій

**Файли:**

- System prompts: `/backend/scripts/seed_analysis_system.py` (lines 83-119)
- JSON schemas: `/backend/scripts/seed_analysis_system.py` (lines 121-183)
- Full workflow: Цей документ, розділ "Приклади команд"

### Код бази

**Моделі:**

- LLM Provider: `/backend/app/models/llm_provider.py`
- Agent Config: `/backend/app/models/agent_config.py`
- Task Config: `/backend/app/models/task_config.py`
- Analysis Run: `/backend/app/models/analysis_run.py`
- Task Proposal: `/backend/app/models/task_proposal.py`

**API Endpoints:**

- Providers: `/backend/app/api/v1/providers.py`
- Agents: `/backend/app/api/v1/agents.py`
- Task Configs: `/backend/app/api/v1/task_configs.py`
- Analysis Runs: `/backend/app/api/v1/analysis_runs.py`
- Proposals: `/backend/app/api/v1/proposals.py`

**Background Jobs:**

- TaskIQ executor: `/backend/app/tasks.py` (line 330-441)

### Swagger UI

**Інтерактивна документація:**

```
http://localhost/docs#/analysis
```

Тут можна:

- 📖 Переглянути всі endpoints
- 🧪 Протестувати API в браузері
- 📋 Скопіювати приклади запитів

---

## ✅ Checklist для першого запуску

- [ ] Ollama встановлено та запущено (`ollama serve`)
- [ ] Модель завантажено (`ollama pull llama3.2`)
- [ ] Сервіси запущено (`just services`)
- [ ] Є імпортовані повідомлення в БД
- [ ] Створено LLM Provider
- [ ] Створено Agent Config з промптом
- [ ] Створено Task Config з JSON schema
- [ ] Створено Agent-Task Assignment
- [ ] Створено Analysis Run з time window
- [ ] Запущено Analysis Run (`POST /runs/{id}/start`)
- [ ] Дочекатися `status: "completed"`
- [ ] Переглянути proposals (`GET /proposals?run_id=...`)
- [ ] Approve/Reject proposals
- [ ] Закрити run (`PUT /runs/{id}/close`)

---

## 🎯 Наступні кроки

**Після першого успішного run:**

1. ⚙️ Налаштувати Project Config з glossary (для RAG)
2. 🔄 Експериментувати з різними промптами
3. 📊 Аналізувати accuracy metrics (`approval_rate`, `precision`)
4. 🤖 Створити кілька агентів для різних категорій завдань
5. 📅 Налаштувати scheduled runs (cron-like)
6. 🎨 Імплементувати PM review UI у frontend

**Для production:**

- 🔐 Налаштувати OpenAI API key (encrypted)
- 📈 Моніторинг LLM usage (токени, вартість)
- ⚡ Rate limiting для LLM API
- 🔔 WebSocket notifications для PM
- 📊 Analytics dashboard для accuracy tracking

---

**Питання або проблеми?**

- 📖 Технічний звіт: `.artifacts/ai-analysis-investigation/20251018_213841/agent-reports/backend-implementation-report.md`
- 💬 Backend team: project Slack channel
- 🐛 Bug reports: GitHub Issues

---

**Створено:** 2025-10-18
**Версія:** 1.0
**Статус:** ✅ Ready to use
