---
type: plan
created: 2025-12-28
status: active
priority: P0
tags:
  - testing
  - core-flow
  - tdd
---

# Core Flow Verification

> **Мета:** Перевірити що основний flow працює end-to-end.
> **Підхід:** Жива розробка + TDD (якщо ламається — тест, потім фікс).

## Чому це критично

Ми робили документацію, ADRs, PRDs — але не перевіряли чи працює core flow:

```
Telegram webhook → Message → AI parsing → Atoms/Topics → UI
```

**Ця сесія — перевірка що система РЕАЛЬНО працює.**

---

## Підготовка

### Перед початком

- [ ] Зупинити всі сервіси: `just services-stop`
- [ ] Nuclear reset БД: `just db-nuclear-reset`
- [ ] Запустити сервіси: `just services-dev`
- [ ] Перевірити що worker запущений: `docker logs task-tracker-worker -f`
- [ ] Відкрити UI: http://localhost/dashboard
- [ ] Відкрити другий термінал для curl команд

### Перевірка готовності

- [ ] `curl http://localhost/health` → 200 OK
- [ ] `curl http://localhost/api/v1/messages` → `[]` (пуста БД)
- [ ] `curl http://localhost/api/v1/atoms` → `[]`
- [ ] `curl http://localhost/api/v1/topics` → `[]`
- [ ] LLM Provider налаштований (OpenAI або Ollama)

---

## Pipeline Stages

### Stage 1: Webhook → Message in DB

**Дія:** POST повідомлення на webhook

```bash
curl -X POST http://localhost/webhook/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "date": 1703750400,
      "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
      "from": {"id": 12345, "first_name": "Developer"},
      "text": "Знайшов баг — токен не рефрешиться після 24 годин"
    }
  }'
```

**Перевірка:**

- [ ] Response: 200 OK
- [ ] Message в БД: `curl http://localhost/api/v1/messages` → 1 message
- [ ] Status = `pending` або `processing`

**Якщо не працює:**

| Проблема | Можлива причина | Фікс |
|----------|-----------------|------|
| 404 | Webhook route не існує | Перевірити routes |
| 500 | Validation error | Перевірити Telegram payload schema |
| Message не в БД | Помилка збереження | Перевірити DB connection |

---

### Stage 2: Worker Scoring

**Дія:** Почекати 5-10 секунд, перевірити worker logs

```bash
docker logs task-tracker-worker --tail 50
```

**Перевірка:**

- [ ] Worker підхопив message (лог: "Processing message...")
- [ ] Scoring виконано (importance_score 0-1)
- [ ] Classification присвоєно (SIGNAL/NOISE)
- [ ] Message status = `analyzed`

```bash
curl http://localhost/api/v1/messages/1
# Очікуємо: importance_score > 0, classification = "signal"
```

**Якщо не працює:**

| Проблема | Можлива причина | Фікс |
|----------|-----------------|------|
| Worker не бачить message | NATS connection | Перевірити NATS logs |
| Scoring = 0 | Алгоритм проблема | Дебажити score_message_task |
| Все = noise | Threshold занадто високий | Знизити noise_threshold |

---

### Stage 3: AI Extraction

**Дія:** Перевірити чи створились Atoms

```bash
curl http://localhost/api/v1/atoms
```

**Перевірка:**

- [ ] Atom створено (якщо message = SIGNAL)
- [ ] Atom type правильний (TASK/PROBLEM/DECISION/INSIGHT)
- [ ] Atom має title та content
- [ ] source_message_id = ID нашого message

**Якщо не працює:**

| Проблема | Можлива причина | Фікс |
|----------|-----------------|------|
| Atoms = [] | Extraction не запустилась | Перевірити trigger threshold |
| LLM error | Provider не налаштований | Налаштувати OpenAI/Ollama |
| Timeout | LLM занадто повільний | Збільшити timeout |
| Parsing error | LLM output не валідний | Дебажити Pydantic AI response |

---

### Stage 4: Topic Assignment

**Дія:** Перевірити Topics

```bash
curl http://localhost/api/v1/topics
```

**Перевірка:**

- [ ] Topic створено або існуючий matched
- [ ] Atom пов'язаний з Topic
- [ ] Topic має правильну назву (Backend/Frontend/Mobile/etc)

```bash
curl http://localhost/api/v1/atoms/1
# Очікуємо: topics: [{id: X, name: "Backend"}]
```

**Якщо не працює:**

| Проблема | Можлива причина | Фікс |
|----------|-----------------|------|
| Topics = [] | Topic creation disabled | Перевірити extraction pipeline |
| Atom без topic | M2M relationship broken | Дебажити topic assignment |
| Неправильний topic | Keyword matching проблема | Покращити topic detection |

---

### Stage 5: UI Display

**Дія:** Перевірити UI

**Перевірка:**

- [ ] Dashboard: TodaysFocus показує новий atom
- [ ] Dashboard: NewToday показує activity
- [ ] Topics: Topic card з atom count = 1
- [ ] Atoms: Atom в списку з правильним type badge
- [ ] Atom Detail: Click → бачимо повну інформацію
- [ ] WebSocket: Зміни з'являються без refresh

**Якщо не працює:**

| Проблема | Можлива причина | Фікс |
|----------|-----------------|------|
| UI пустий | API не повертає дані | Дебажити API response |
| Треба refresh | WebSocket не працює | Дебажити WS connection |
| Помилки в console | Frontend баги | Дебажити React components |

---

## Тестові повідомлення

### SIGNAL — мають створити Atoms

```bash
# Problem
curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 2,
  "message": {
    "message_id": 2, "date": 1703750401,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "Memory leak в React компоненті MessageList, росте до 500MB"
  }
}'

# Decision
curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 3,
  "message": {
    "message_id": 3, "date": 1703750402,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "Вирішили юзати Redis для кешу сесій, Postgres не тягне навантаження"
  }
}'

# Question
curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 4,
  "message": {
    "message_id": 4, "date": 1703750403,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "Як правильно робити graceful shutdown в FastAPI з background tasks?"
  }
}'

# Insight
curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 5,
  "message": {
    "message_id": 5, "date": 1703750404,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "Виявилось що 80% юзерів використовують dark mode, треба пріоритизувати"
  }
}'
```

### NOISE — НЕ мають створювати Atoms

```bash
curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 6,
  "message": {
    "message_id": 6, "date": 1703750405,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "Ок"
  }
}'

curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 7,
  "message": {
    "message_id": 7, "date": 1703750406,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "👍"
  }
}'

curl -X POST http://localhost/webhook/telegram -H "Content-Type: application/json" -d '{
  "update_id": 8,
  "message": {
    "message_id": 8, "date": 1703750407,
    "chat": {"id": -100123456, "type": "group", "title": "Dev Team"},
    "from": {"id": 12345, "first_name": "Dev"},
    "text": "Хто хоче каву?"
  }
}'
```

---

## TDD Process

Коли щось ламається:

```
1. DOCUMENT: Записати що саме не працює
2. TEST: Написати failing test що відтворює проблему
3. FIX: Виправити код
4. VERIFY: Тест проходить
5. CONTINUE: Йти далі по чекбоксам
```

### Приклад

**Проблема:** Webhook повертає 500

**Test (pytest):**
```python
def test_telegram_webhook_accepts_valid_message(client):
    payload = {
        "update_id": 1,
        "message": {
            "message_id": 1,
            "date": 1703750400,
            "chat": {"id": -100123456, "type": "group", "title": "Test"},
            "from": {"id": 12345, "first_name": "Test"},
            "text": "Test message"
        }
    }
    response = client.post("/webhook/telegram", json=payload)
    assert response.status_code == 200, f"Got {response.status_code}: {response.json()}"
```

**Fix:** Виправити validation/handler

**Verify:** Тест проходить, curl працює

---

## Success Criteria

### Мінімум для "працює"

- [ ] 4 SIGNAL повідомлення → 4 Atoms створено
- [ ] 3 NOISE повідомлення → 0 Atoms (filtered)
- [ ] Topics auto-assigned
- [ ] UI показує все без refresh

### Бонус

- [ ] WebSocket live updates працюють
- [ ] Різні atom types правильно визначені
- [ ] Confidence scores адекватні

---

## Tracking Issues

### Знайдені проблеми

| # | Stage | Опис проблеми | Test написаний | Fixed |
|---|-------|---------------|----------------|-------|
| 1 | | | [ ] | [ ] |
| 2 | | | [ ] | [ ] |
| 3 | | | [ ] | [ ] |

### Notes

*Записуй спостереження тут під час сесії*

---

## Команди Reference

```bash
# Сервіси
just services-dev          # Запустити з live reload
just services-stop         # Зупинити
just db-nuclear-reset      # Повний reset БД

# Logs
docker logs task-tracker-worker -f
docker logs task-tracker-api -f
docker logs task-tracker-nats -f

# Database
just db-seed 0             # Тільки міграції, без seed даних

# API checks
curl http://localhost/health
curl http://localhost/api/v1/messages
curl http://localhost/api/v1/atoms
curl http://localhost/api/v1/topics
curl http://localhost/api/v1/providers
```

---

**Estimated time:** 2-4 години (залежить від кількості багів)

**Next session:** Почати з "Підготовка" чекбоксів
