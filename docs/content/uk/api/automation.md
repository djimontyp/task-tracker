# API Довідник автоматизації

**Останнє оновлення:** 27 жовтня 2025
**Статус:** Повний довідник API
**Версія:** v1

## Огляд

API автоматизації надає endpoints для управління планування, правил затвердження, сповіщень та статистики.

## Базовий URL

```
http://localhost/api/v1
```

## Аутентифікація

Усі endpoints вимагають аутентифікацію через Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost/api/v1/automation/stats
```

## Endpoints планувальника

### GET /scheduler/jobs

Список усіх запланованих завдань.

**Відповідь:**
```json
[
  {
    "id": 1,
    "name": "Щоденне виконання автоматизації",
    "cron_expression": "0 9 * * *",
    "next_run_time": "2025-10-27T09:00:00Z",
    "last_run_time": "2025-10-26T09:00:02Z",
    "is_active": true
  }
]
```

---

### POST /scheduler/jobs

Створити нове заплановане завдання.

**Запит:**
```json
{
  "name": "6-годинна автоматизація",
  "cron_expression": "0 */6 * * *",
  "is_active": true
}
```

**Відповідь:** `201 Created`

---

### PUT /scheduler/jobs/{id}

Оновити конфігурацію завдання.

**Запит:**
```json
{
  "cron_expression": "0 */4 * * *",
  "is_active": false
}
```

---

### POST /scheduler/jobs/{id}/trigger

Вручну запустити завдання негайно.

**Відповідь:** `202 Accepted`

---

### DELETE /scheduler/jobs/{id}

Видалити заплановане завдання.

**Відповідь:** `204 No Content`

---

## Endpoints правил затвердження

### GET /automation/rules

Список усіх правил затвердження.

**Параметри запиту:**
- `active_only` (boolean): Повернути тільки активні правила (за замовчуванням: false)

**Відповідь:**
```json
[
  {
    "id": 1,
    "name": "Авто-затвердження високої впевненості",
    "confidence_threshold": 90,
    "similarity_threshold": 85,
    "auto_action": "approve",
    "priority": 1,
    "is_active": true
  }
]
```

---

### POST /automation/rules

Створити нове правило затвердження.

**Запит:**
```json
{
  "name": "Збалансоване авто-затвердження",
  "confidence_threshold": 80,
  "similarity_threshold": 70,
  "auto_action": "approve",
  "priority": 3,
  "is_active": true
}
```

**Відповідь:** `201 Created`

---

### PUT /automation/rules/{id}

Оновити правило затвердження.

**Запит:**
```json
{
  "confidence_threshold": 85,
  "similarity_threshold": 75
}
```

---

### DELETE /automation/rules/{id}

Видалити правило затвердження.

**Відповідь:** `204 No Content`

---

### GET /automation/rules/{id}/preview

Попередній перегляд скількох версій відповідали б правилу.

**Відповідь:**
```json
{
  "rule_id": 3,
  "matching_versions": 47,
  "preview": [
    {
      "id": 101,
      "confidence": 87.5,
      "similarity": 78.2,
      "would_approve": true
    }
  ]
}
```

---

## Endpoints сповіщень

### GET /notifications/preferences

Отримати конфігурацію сповіщень.

**Відповідь:**
```json
{
  "email": {
    "enabled": true,
    "address": "admin@example.com",
    "frequency": "daily"
  },
  "telegram": {
    "enabled": true,
    "alert_threshold": 20
  }
}
```

---

### PUT /notifications/preferences

Оновити конфігурацію сповіщень.

---

### POST /notifications/test-email

Надіслати тестовий email.

**Відповідь:**
```json
{
  "status": "sent",
  "message": "Тестовий лист надіслано"
}
```

---

## Endpoints статистики

### GET /automation/stats

Отримати KPI метрики автоматизації для дашборду.

**Відповідь:**
```json
{
  "auto_approval_rate": 72.34,
  "pending_versions_count": 8,
  "total_rules_count": 4,
  "active_rules_count": 3
}
```

**Поля:**
- `auto_approval_rate`: Відсоток затверджених версій (0-100)
- `pending_versions_count`: Кількість версій, що очікують перегляду
- `total_rules_count`: Загальна кількість правил автоматизації
- `active_rules_count`: Кількість активних правил

---

### GET /automation/trends

Отримати щоденні тренди автоматизації для графіків дашборду.

**Параметри запиту:**
- `period` (string): Період часу (7d, 30d, 90d; за замовчуванням: 30d)

**Відповідь:**
```json
{
  "period": "30d",
  "data": [
    {
      "date": "2025-09-27",
      "approved": 12,
      "rejected": 0,
      "manual": 3
    },
    {
      "date": "2025-09-28",
      "approved": 8,
      "rejected": 0,
      "manual": 5
    }
  ]
}
```

**Поля:**
- `period`: Запитуваний період часу
- `data`: Масив щоденної статистики
  - `date`: Дата у форматі ISO (YYYY-MM-DD)
  - `approved`: Затверджених версій цього дня
  - `rejected`: Відхилених версій цього дня
  - `manual`: Версій, що очікують ручного перегляду

---

## Endpoints версій

### GET /versions/pending-count

Отримати кількість версій, що очікують затвердження.

**Відповідь:**
```json
{
  "count": 15,
  "topics": 8,
  "atoms": 7
}
```

**Поля:**
- `count`: Загальна кількість версій (topics + atoms)
- `topics`: Кількість версій тем
- `atoms`: Кількість версій атомів

**Призначення:** Відображення badge з кількістю в UI.

---

### POST /versions/bulk-approve

Затвердити кілька версій однією операцією.

**Запит:**
```json
{
  "entity_type": "topic",
  "version_ids": [101, 102, 103]
}
```

**Відповідь:**
```json
{
  "success_count": 2,
  "failed_ids": [103],
  "errors": {
    "103": "Версію вже затверджено"
  }
}
```

**Поля:**
- `entity_type`: Тип сутності ("topic" або "atom")
- `version_ids`: Масив ID версій для затвердження
- `success_count`: Кількість успішно затверджених версій
- `failed_ids`: Масив ID, що не вдалося затвердити
- `errors`: Map від ID до повідомлення про помилку

---

### POST /versions/bulk-reject

Відхилити кілька версій однією операцією.

**Запит:**
```json
{
  "entity_type": "atom",
  "version_ids": [201, 202]
}
```

**Відповідь:** Той самий формат, що й bulk-approve.

---

## Коди помилок

### 400 Bad Request

```json
{
  "error": "invalid_request",
  "message": "confidence_threshold має бути 0-100"
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Відсутній або недійсний токен автентифікації"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "message": "Правило з ID 99 не знайдено"
}
```

### 500 Internal Server Error

```json
{
  "error": "internal_error",
  "message": "Помилка підключення до бази даних"
}
```

---

## Обмеження швидкості

- **Ліміт:** 1000 запитів на хвилину на API ключ
- **Заголовок:** `X-RateLimit-Remaining: 950`
- **Повторити після 60 секунд при 429 Too Many Requests**

---

## Події WebSocket

Підключитися до WebSocket для оновлень в реальному часі:

```javascript
const ws = new WebSocket('ws://localhost/ws?topics=automation');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.event === 'rule_triggered') {
    console.log(`Правило ${data.rule_id} спрацьовало`);
  }
};
```

---

## Приклади коду

### Python

```python
import requests

BASE_URL = "http://localhost/api/v1"
HEADERS = {"Authorization": f"Bearer YOUR_TOKEN"}

# Отримати статистику
response = requests.get(f"{BASE_URL}/automation/stats", headers=HEADERS)
print(response.json())
```

### JavaScript

```javascript
const API_URL = 'http://localhost/api/v1';

async function getStats() {
  const response = await fetch(`${API_URL}/automation/stats`, {
    headers: { 'Authorization': `Bearer YOUR_TOKEN` }
  });
  return response.json();
}
```

---

**Дивіться також:** [Швидкий старт](../guides/automation-quickstart.md) | [Довідник конфігурації](../guides/automation-configuration.md)
