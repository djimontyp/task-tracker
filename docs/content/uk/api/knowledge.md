# API витягування знань

!!! info "Довідник API"
    Повна документація API для ендпоінтів витягування знань, WebSocket подій та схем запитів/відповідей.

---

## Базовий URL

```
http://localhost:8000/api/v1/knowledge
```

---

## Ендпоінти

### Запуск витягування знань

Ручний запуск витягування знань з пакета повідомлень.

**POST** `/extract`

#### Запит

=== "Схема"
    ```typescript
    {
      message_ids: number[],    // Обов'язково: 1-100 ID повідомлень для аналізу
      provider_id: string       // Обов'язково: UUID активного LLM провайдера
    }
    ```

=== "Приклад"
    ```json
    {
      "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "provider_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

=== "Python"
    ```python
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/knowledge/extract",
            json={
                "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "provider_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        )
        data = response.json()
        print(f"Поставлено в чергу витягування для {data['message_count']} повідомлень")
    ```

=== "cURL"
    ```bash
    curl -X POST http://localhost:8000/api/v1/knowledge/extract \
      -H "Content-Type: application/json" \
      -d '{
        "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "provider_id": "550e8400-e29b-41d4-a716-446655440000"
      }'
    ```

#### Відповідь

**Статус:** `202 Accepted` - Задача успішно поставлена в чергу

=== "Схема"
    ```typescript
    {
      message: string,          // Повідомлення про успіх
      message_count: number,    // Кількість повідомлень у черзі
      provider_id: string       // Використаний UUID провайдера
    }
    ```

=== "Приклад"
    ```json
    {
      "message": "Knowledge extraction queued for 10 messages",
      "message_count": 10,
      "provider_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

#### Помилки

| Статус | Помилка | Опис |
|--------|---------|------|
| `400` | Bad Request | Невалідний запит (кількість повідомлень не в діапазоні 1-100) |
| `404` | Not Found | Провайдер з даним UUID не знайдено |
| `422` | Unprocessable Entity | Провайдер існує, але не активний |

#### Кращі практики

!!! tip "Оптимальний розмір пакета"
    Для найкращої якості витягування використовуйте **10-50 повідомлень** на запит.

!!! warning "Обмеження частоти"
    Уникайте одночасного запуску кількох витягувань. Дочекайтесь завершення попереднього витягування перед початком нового.

!!! info "Вимоги до провайдера"
    - Провайдер повинен бути активним (`is_active = true`)
    - Провайдери Ollama потребують валідного `base_url`
    - Провайдери OpenAI потребують валідного API ключа
    - Модель повинна підтримувати структурований вивід (JSON режим)

---

## WebSocket події

Підпишіться на оновлення прогресу витягування в реальному часі.

### Підключення

**URL:** `ws://localhost:8000/ws/knowledge`

=== "JavaScript"
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/ws/knowledge');

    ws.onopen = () => {
      console.log('Підключено до оновлень витягування знань');
    };

    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      handleEvent(type, data);
    };

    ws.onerror = (error) => {
      console.error('Помилка WebSocket:', error);
    };

    ws.onclose = () => {
      console.log('Відключено від оновлень витягування знань');
    };
    ```

### Типи подій

#### extraction_started

Випускається, коли починається обробка задачі витягування.

```json
{
  "type": "knowledge.extraction_started",
  "data": {
    "message_count": 15,
    "provider_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

#### topic_created

Випускається для кожного створеного топіка під час витягування.

```json
{
  "type": "knowledge.topic_created",
  "data": {
    "topic_id": 42,
    "topic_name": "Дизайн API"
  }
}
```

---

#### atom_created

Випускається для кожного створеного атома під час витягування.

```json
{
  "type": "knowledge.atom_created",
  "data": {
    "atom_id": 123,
    "atom_title": "Впровадити OAuth2 refresh token flow",
    "atom_type": "solution"
  }
}
```

---

#### extraction_completed

Випускається при успішному завершенні задачі витягування.

```json
{
  "type": "knowledge.extraction_completed",
  "data": {
    "message_count": 15,
    "topics_created": 2,
    "atoms_created": 8,
    "links_created": 5,
    "messages_updated": 15
  }
}
```

---

#### extraction_failed

Випускається при виникненні помилки під час витягування.

```json
{
  "type": "knowledge.extraction_failed",
  "data": {
    "error": "Таймаут підключення до LLM провайдера"
  }
}
```

---

## Схеми даних

### ExtractedTopic

Структура, що повертається LLM для кожного виявленого топіка.

```typescript
interface ExtractedTopic {
  name: string;                  // Макс. 2-4 слова
  description: string;           // Чіткий опис теми
  confidence: number;            // 0.0-1.0 (0.7+ для автоматичного створення)
  keywords: string[];            // Ключові терміни (2-5 елементів)
  related_message_ids: number[]; // ID вихідних повідомлень
}
```

---

### ExtractedAtom

Структура, що повертається LLM для кожної виявленої одиниці знань.

```typescript
interface ExtractedAtom {
  type: AtomType;                      // problem/solution/decision/insight/question/pattern/requirement
  title: string;                       // Макс. 200 символів
  content: string;                     // Повний самодостатній опис
  confidence: number;                  // 0.0-1.0 (0.7+ для автоматичного створення)
  topic_name: string;                  // Назва батьківського топіка
  related_message_ids: number[];       // ID вихідних повідомлень
  links_to_atom_titles?: string[];     // Заголовки пов'язаних атомів
  link_types?: LinkType[];             // Типи відносин
}

type AtomType =
  | 'problem'
  | 'solution'
  | 'decision'
  | 'insight'
  | 'question'
  | 'pattern'
  | 'requirement';

type LinkType =
  | 'solves'
  | 'supports'
  | 'contradicts'
  | 'continues'
  | 'refines'
  | 'relates_to'
  | 'depends_on';
```

---

### Topic (Модель бази даних)

Збережена сутність топіка.

```typescript
interface Topic {
  id: number;
  name: string;          // Унікальна, макс. 100 символів
  description: string;
  icon: string | null;   // Назва Heroicon (наприклад, "CodeBracketIcon")
  color: string | null;  // Hex колір (наприклад, "#3B82F6")
  created_at: string;    // Мітка часу ISO 8601
  updated_at: string;    // Мітка часу ISO 8601
}
```

---

### Atom (Модель бази даних)

Збережена сутність атома.

```typescript
interface Atom {
  id: number;
  type: AtomType;
  title: string;              // Макс. 200 символів
  content: string;
  confidence: number;         // 0.0-1.0
  user_approved: boolean;     // Прапорець ручної перевірки
  meta: {
    source: string;           // "llm_extraction"
    message_ids: number[];    // Вихідні повідомлення
  };
  created_at: string;         // Мітка часу ISO 8601
  updated_at: string;         // Мітка часу ISO 8601
}
```

---

### AtomLink (Модель бази даних)

Відношення між двома атомами.

```typescript
interface AtomLink {
  id: number;
  from_atom_id: number;
  to_atom_id: number;
  link_type: LinkType;
  strength: number | null;    // 0.0-1.0 (опціонально)
  created_at: string;         // Мітка часу ISO 8601
}
```

---

## Приклади інтеграції

Детальні приклади інтеграції дивіться в англійській версії документації.

---

## Обмеження частоти

!!! warning "Поточні обмеження"
    - **Жорстких обмежень частоти** наразі немає
    - **Рекомендовано:** Максимум 1 одночасне витягування на проект
    - **Розмір пакета:** 1-100 повідомлень (10-50 рекомендовано)
    - **Обмеження провайдера:** Залежить від LLM провайдера (Ollama локальний, OpenAI має ліміти API)

---

## Журнал змін

### v1.0.0 (Поточна)

- Початковий випуск API витягування знань
- Ручне витягування через POST /extract
- Трансляція подій WebSocket в реальному часі
- Підтримка провайдерів Ollama та OpenAI
- Структурований вивід за допомогою Pydantic AI

---

!!! question "Потрібна допомога?"
    - Перевірте [Посібник користувача](/knowledge-extraction) для огляду функцій
    - Перегляньте [Посібник розробника](/architecture/knowledge-extraction) для деталей реалізації
    - Повідомляйте про проблеми або запитуйте функції через репозиторій проекту
