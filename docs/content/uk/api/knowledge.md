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
      message_ids: number[] | null,      // Обов'язково: 1-100 ID повідомлень для аналізу
      period: PeriodRequest | null,      // Опціонально: вибір повідомлень за періодом часу
      agent_config_id: string            // Обов'язково: UUID конфігурації агента
    }
    ```

=== "Приклад"
    ```json
    {
      "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
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
                "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        )
        data = response.json()
        print(f"Поставлено в чергу витягування для {data['message_count']} повідомлень")
    ```

=== "TypeScript"
    ```typescript
    const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        agent_config_id: '550e8400-e29b-41d4-a716-446655440000'
      })
    });

    const data = await response.json();
    console.log(`Поставлено в чергу витягування для ${data.message_count} повідомлень`);
    ```

=== "cURL"
    ```bash
    curl -X POST http://localhost:8000/api/v1/knowledge/extract \
      -H "Content-Type: application/json" \
      -d '{
        "message_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
      }'
    ```

#### Відповідь

**Статус:** `202 Accepted` - Задача успішно поставлена в чергу

=== "Схема"
    ```typescript
    {
      message: string,          // Повідомлення про успіх
      message_count: number,    // Кількість повідомлень у черзі
      agent_config_id: string   // UUID використаної конфігурації агента
    }
    ```

=== "Приклад"
    ```json
    {
      "message": "Knowledge extraction queued for 10 messages",
      "message_count": 10,
      "agent_config_id": "550e8400-e29b-41d4-a716-446655440000"
    }
    ```

#### Помилки

| Статус | Помилка | Опис |
|--------|---------|------|
| `400` | Bad Request | Невалідний запит (кількість повідомлень не в діапазоні 1-100, або не знайдено повідомлень для періоду) |
| `404` | Not Found | Конфігурація агента з даним UUID не знайдена |
| `400` | Bad Request | Конфігурація агента існує, але не активна |

=== "400 - Невалідний запит"
    ```json
    {
      "detail": "message_ids must contain between 1 and 100 message IDs"
    }
    ```

=== "404 - Конфігурація агента не знайдена"
    ```json
    {
      "detail": "Agent config 550e8400-e29b-41d4-a716-446655440000 not found"
    }
    ```

=== "400 - Конфігурація агента неактивна"
    ```json
    {
      "detail": "Agent config 'knowledge_extractor' is not active"
    }
    ```

#### Кращі практики

!!! tip "Оптимальний розмір пакета"
    Для найкращої якості витягування використовуйте **10-50 повідомлень** на запит. Менші пакети можуть бути недостатніми для контексту, більші пакети можуть перевантажити мовну модель.

!!! warning "Обмеження частоти"
    Уникайте одночасного запуску кількох витягувань. Дочекайтесь завершення попереднього витягування перед початком нового.

!!! info "Вимоги до конфігурації агента"
    - Конфігурація агента повинна бути активною (`is_active = true`)
    - Пов'язаний провайдер LLM повинен бути активним та належним чином налаштованим
    - Вибір повідомлень: або `message_ids` (1-100), або `period`, але не обидва
    - Для користувацьких періодів: обов'язкові обидва `start_date` та `end_date`
    - Вибрані повідомлення/період повинні містити щонайменше 1 повідомлення

#### Параметри вибору повідомлень

API підтримує два взаємовиключні способи вибору повідомлень:

| Способ вибору | Опис | Використання |
|------------------|-------------|----------|
| **Прямі ID** | Вкажіть точні ID повідомлень (1-100) | Коли знаєте конкретні повідомлення для аналізу |
| **За періодом** | Автоматичний вибір повідомлень за часовим діапазоном | Для аналізу останніх розмов або конкретних дат |

#### Вибір повідомлень за періодом

При використанні вибору за періодом система автоматично визначає повідомлення у вказаному часовому діапазоні:

| Тип періоду | Діапазон | Приклад | Краще для |
|------------|-------|---------|----------|
| `last_24h` | Останні 24 години | Всі повідомлення з вчора | Щоденний синтез стану робіт |
| `last_7d` | Останні 7 днів | Всі повідомлення за минулий тиждень | Генерація тижневого резюме |
| `last_30d` | Останні 30 днів | Всі повідомлення за минулий місяць | Оновлення бази знань щомісячно |
| `custom` | Визначено користувачем | Потрібні дати початку та кінця | Спеціалізований аналіз конкретних періодів |

**Опціональне фільтрування за темою**: Для будь-якого типу періоду можете фільтрувати повідомлення в межах конкретної теми за допомогою поля `topic_id`.

**Обробка часових поясів**: Всі дати враховують часовий пояс та дотримуються формату ISO 8601 (рекомендується UTC).

**Вимоги для користувацького періоду**:
- Обидва `start_date` та `end_date` повинні бути надані
- Дати не можуть бути в майбутньому
- `start_date` повинна бути раніше за `end_date`
- Формат: `YYYY-MM-DDTHH:mm:ssZ` (ISO 8601)

---

## WebSocket події

Підпишіться на оновлення прогресу витягування в реальному часі за допомогою універсального WebSocket ендпоінту з підписками за темами.

### Підключення

**Ендпоінт:** `ws://localhost:8000/ws`

**Кроки підключення:**

1. Підключіться до ендпоінту `/ws`
2. Після підключення відправте повідомлення про підписку для отримання подій витягування знань
3. Сервер відповідь з підтвердженням підключення та списком ваших підписок
4. Слухайте события на темі `knowledge` в процесі витягування

**Формат повідомлення про підписку:**

```json
{
  "action": "subscribe",
  "topic": "knowledge"
}
```

**Підписки на кілька тем:**

Можете підписатись на кілька тем одночасно. Система підтримує ці теми:

| Тема | Призначення |
|-------|---------|
| `knowledge` | События витягування знань (теми, атоми, версії) |
| `agents` | События життєвого циклу конфігурацій агентів |
| `tasks` | События обробки завдань |
| `providers` | События стану постачальників LLM |
| `analysis` | События системи аналізу |
| `proposals` | События генерування пропозицій |

Для підписки на кілька тем відправте окремі повідомлення про підписку для кожної:

```json
{"action": "subscribe", "topic": "knowledge"}
{"action": "subscribe", "topic": "analysis"}
```

Або скористайтеся параметром запиту при встановленні підключення:

```
ws://localhost:8000/ws?topics=knowledge,analysis
```

**Життєвий цикл підключення:**

1. **Підключення встановлено** - Сервер відправляє підтвердження з темами підписки
2. **Підписка активна** - Сервер трансляює відповідні события до вашого підключення
3. **Динамічні оновлення** - Відправте додаткові повідомлення `subscribe`/`unsubscribe` будь-коли
4. **Розірвання підключення** - Клієнт закриває підключення або сервер встановлює тайм-аут

### Типи подій

#### extraction_started

Випускається, коли починається обробка задачі витягування.

```json
{
  "type": "knowledge.extraction_started",
  "data": {
    "message_count": 25,
    "agent_config_id": "550e8400-e29b-41d4-a716-446655440000",
    "agent_name": "knowledge_extractor"
  }
}
```

| Поле | Тип | Опис |
|-------|------|-------------|
| `message_count` | number | Кількість повідомлень для аналізу |
| `agent_config_id` | string | UUID конфігурації агента |
| `agent_name` | string | Назва конфігурації агента |

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

| Поле | Тип | Опис |
|-------|------|-------------|
| `topic_id` | number | ID теми в базі даних |
| `topic_name` | string | Назва теми (2-4 слова) |

!!! info "Пов'язані операції"
    Після отримання цієї события скористайтеся **API управління темами** для уточнення теми: оновіть опис, додайте значки/кольори, зв'яжіть атоми або отримайте пов'язані повідомлення. Див. [Управління темами](#управління-темами) для доступних ендпоінтів.

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

| Поле | Тип | Опис |
|-------|------|-------------|
| `atom_id` | number | ID атома в базі даних |
| `atom_title` | string | Заголовок атома (макс. 200 символів) |
| `atom_type` | string | Тип: problem/solution/decision/insight/question/pattern/requirement |

!!! info "Пов'язані операції"
    Скористайтеся **API управління атомами** для подальшого уточнення атомів: оновіть заголовки/вміст, змініть типи, схаліть/відхиліть автоматичні класифікації або пов'яжіть атоми разом. Див. [Управління атомами](#управління-атомами) для доступних ендпоінтів.

---

#### extraction_completed

Випускається при успішному завершенні задачі витягування.

```json
{
  "type": "knowledge.extraction_completed",
  "data": {
    "message_count": 25,
    "topics_created": 3,
    "atoms_created": 12,
    "links_created": 8,
    "messages_updated": 25,
    "topic_versions_created": 1,
    "atom_versions_created": 2
  }
}
```

| Поле | Тип | Опис |
|-------|------|-------------|
| `message_count` | number | Всього проаналізовано повідомлень |
| `topics_created` | number | Кількість тем оброблено (нові + існуючі) |
| `atoms_created` | number | Кількість атомів оброблено (нові + існуючі) |
| `links_created` | number | Кількість створених зв'язків між атомами |
| `messages_updated` | number | Кількість повідомлень пов'язаних з темами |
| `topic_versions_created` | number | Кількість створених снімків версій тем |
| `atom_versions_created` | number | Кількість створених снімків версій атомів |

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

| Поле | Тип | Опис |
|-------|------|-------------|
| `error` | string | Повідомлення про помилку |

---

#### version_created

Випускається при створенні снімку версії для існуючої теми або атома під час повторного витягування.

```json
{
  "type": "knowledge.version_created",
  "data": {
    "entity_type": "topic",
    "entity_id": 42,
    "approved": false
  }
}
```

| Поле | Тип | Опис |
|-------|------|-------------|
| `entity_type` | string | Тип сутності: `topic` або `atom` |
| `entity_id` | number | ID теми або атома в базі даних |
| `approved` | boolean | Чи потребує версія затвердження (спочатку завжди false) |

Коли система повторно аналізує повідомлення та виявляє існуючу тему або атом з тією ж назвою/заголовком, вона створює снімок версії замість зміни оригіналу. Це зберігає історію змін та дозволяє робочі потоки затвердження/відхилення.

!!! info "Пов'язані операції"
    Скористайтеся **API операцій версіонування** для перегляду та управління змінами версій: перегляду історії версій, порівняння версій або затвердження/відхилення змін. Див. [Операції версіонування](#операції-версіонування) для доступних ендпоінтів.

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

### Повний робочий процес витягування

Повний приклад, що показує запуск витягування та обробку событій:

=== "TypeScript/React"
    ```typescript
    import { useState, useEffect } from 'react';

    interface ExtractionStatus {
      status: 'idle' | 'running' | 'completed' | 'failed';
      topicsCreated: number;
      atomsCreated: number;
      linksCreated: number;
      error?: string;
    }

    export function useKnowledgeExtraction() {
      const [status, setStatus] = useState<ExtractionStatus>({
        status: 'idle',
        topicsCreated: 0,
        atomsCreated: 0,
        linksCreated: 0,
      });

      useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws');

        ws.onopen = () => {
          ws.send(JSON.stringify({
            action: 'subscribe',
            topic: 'knowledge'
          }));
        };

        ws.onmessage = (event) => {
          const { type, data } = JSON.parse(event.data);

          switch (type) {
            case 'knowledge.extraction_started':
              setStatus({ status: 'running', topicsCreated: 0, atomsCreated: 0, linksCreated: 0 });
              break;

            case 'knowledge.topic_created':
              setStatus((prev) => ({
                ...prev,
                topicsCreated: prev.topicsCreated + 1,
              }));
              break;

            case 'knowledge.atom_created':
              setStatus((prev) => ({
                ...prev,
                atomsCreated: prev.atomsCreated + 1,
              }));
              break;

            case 'knowledge.extraction_completed':
              setStatus({
                status: 'completed',
                topicsCreated: data.topics_created,
                atomsCreated: data.atoms_created,
                linksCreated: data.links_created,
              });
              break;

            case 'knowledge.extraction_failed':
              setStatus({
                status: 'failed',
                topicsCreated: 0,
                atomsCreated: 0,
                linksCreated: 0,
                error: data.error,
              });
              break;
          }
        };

        return () => ws.close();
      }, []);

      const triggerExtraction = async (messageIds: number[], agentConfigId: string) => {
        const response = await fetch('http://localhost:8000/api/v1/knowledge/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_ids: messageIds,
            agent_config_id: agentConfigId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail);
        }

        return response.json();
      };

      return { status, triggerExtraction };
    }
    ```

=== "Python"
    ```python
    import asyncio
    import httpx
    import websockets
    import json
    from typing import Callable

    class KnowledgeExtractionClient:
        def __init__(self, base_url: str = "http://localhost:8000"):
            self.base_url = base_url
            self.ws_url = base_url.replace("http", "ws") + "/ws"

        async def trigger_extraction(
            self,
            message_ids: list[int],
            agent_config_id: str
        ) -> dict:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/v1/knowledge/extract",
                    json={
                        "message_ids": message_ids,
                        "agent_config_id": agent_config_id
                    }
                )
                response.raise_for_status()
                return response.json()

        async def listen_events(
            self,
            on_started: Callable | None = None,
            on_topic_created: Callable | None = None,
            on_atom_created: Callable | None = None,
            on_completed: Callable | None = None,
            on_failed: Callable | None = None,
        ):
            async with websockets.connect(self.ws_url) as websocket:
                await websocket.send(json.dumps({
                    "action": "subscribe",
                    "topic": "knowledge"
                }))
                async for message in websocket:
                    event = json.loads(message)
                    event_type = event["type"]
                    data = event["data"]

                    if event_type == "knowledge.extraction_started" and on_started:
                        on_started(data)
                    elif event_type == "knowledge.topic_created" and on_topic_created:
                        on_topic_created(data)
                    elif event_type == "knowledge.atom_created" and on_atom_created:
                        on_atom_created(data)
                    elif event_type == "knowledge.extraction_completed" and on_completed:
                        on_completed(data)
                    elif event_type == "knowledge.extraction_failed" and on_failed:
                        on_failed(data)

    # Приклад використання
    async def main():
        client = KnowledgeExtractionClient()

        # Запуск витягування
        result = await client.trigger_extraction(
            message_ids=[1, 2, 3, 4, 5],
            agent_config_id="550e8400-e29b-41d4-a716-446655440000"
        )
        print(f"Поставлено в чергу: {result['message']}")

        # Слухати события
        await client.listen_events(
            on_started=lambda d: print(f"Запущено аналізування {d['message_count']} повідомлень"),
            on_topic_created=lambda d: print(f"Створена тема: {d['topic_name']}"),
            on_atom_created=lambda d: print(f"Створен атом: {d['atom_title']} ({d['atom_type']})"),
            on_completed=lambda d: print(f"Завершено: {d['topics_created']} тем, {d['atoms_created']} атомів"),
            on_failed=lambda d: print(f"Помилка: {d['error']}")
        )

    asyncio.run(main())
    ```

---

## Пов'язані операції API

API витягування знань створює та керує темами та атомами, які можна додатково уточнити за допомогою спеціалізованих ендпоінтів управління.

### Управління темами

Теми, створені процесом витягування, можна керувати незалежно за допомогою API тем:

| Операція | Ендпоінт | Опис |
|-----------|----------|-------------|
| **Список** | `GET /api/v1/topics` | Отримати всі теми з розбиттям на сторінки |
| **За ID** | `GET /api/v1/topics/{topic_id}` | Отримати конкретну тему |
| **Створити** | `POST /api/v1/topics` | Створити нову тему вручну |
| **Оновити** | `PATCH /api/v1/topics/{topic_id}` | Змінити назву, опис, значок або колір теми |
| **Отримати атоми** | `GET /api/v1/topics/{topic_id}/atoms` | Отримати список всіх атомів у темі |
| **Отримати повідомлення** | `GET /api/v1/topics/{topic_id}/messages` | Отримати список всіх повідомлень, пов'язаних з темою |
| **Нещодавні** | `GET /api/v1/topics/recent` | Отримати теми за недавною активністю |
| **Значки** | `GET /api/v1/topics/icons` | Отримати список доступних варіантів значків |

!!! tip "Поліпшення тем"
    Після створення тем витягуванням скористайтеся API тем для уточнення описів, додавання користувацьких значків/кольорів або переорганізації ієрархії.

### Управління атомами

Атоми, створені витягуванням, можна керувати, зв'язувати та версіонувати за допомогою API атомів:

| Операція | Ендпоінт | Опис |
|-----------|----------|-------------|
| **Список** | `GET /api/v1/atoms` | Отримати всі атоми з розбиттям на сторінки |
| **За ID** | `GET /api/v1/atoms/{atom_id}` | Отримати конкретний атом |
| **Створити** | `POST /api/v1/atoms` | Створити новий атом вручну |
| **Оновити** | `PATCH /api/v1/atoms/{atom_id}` | Змінити заголовок, вміст, тип або статус затвердження атома |
| **Видалити** | `DELETE /api/v1/atoms/{atom_id}` | Видалити атом |
| **Зв'язати з темою** | `POST /api/v1/atoms/{atom_id}/topics/{topic_id}` | Пов'язати атом з темою |

!!! tip "Уточнення атомів"
    Скористайтеся API атомів для додавання вручну створених атомів, оновлення оцінок впевненості, затвердження/відхилення автоматично створених атомів або управління відносинами між атомами.

### Операції версіонування

Коли витягування створює або оновлює теми/атоми, створюються снімки версій. Керуйте версіонуванням за допомогою API версій:

| Операція | Ендпоінт | Опис |
|-----------|----------|-------------|
| **Версії тем** | `GET /api/v1/versions/topics/{topic_id}` | Отримати список всіх снімків версій для теми |
| **Різниця тем** | `GET /api/v1/versions/topics/{topic_id}/diff` | Порівняти дві версії теми |
| **Затвердити тему** | `POST /api/v1/versions/topics/{version_id}/approve` | Прийняти зміну версії теми |
| **Відхилити тему** | `POST /api/v1/versions/topics/{version_id}/reject` | Відхилити зміну версії теми |
| **Версії атомів** | `GET /api/v1/versions/atoms/{atom_id}` | Отримати список всіх снімків версій для атома |
| **Різниця атомів** | `GET /api/v1/versions/atoms/{atom_id}/diff` | Порівняти дві версії атома |
| **Затвердити атом** | `POST /api/v1/versions/atoms/{version_id}/approve` | Прийняти зміну версії атома |
| **Відхилити атом** | `POST /api/v1/versions/atoms/{version_id}/reject` | Відхилити зміну версії атома |

!!! warning "Робочий процес затвердження версій"
    Коли повторне витягування виявляє зміни існуючих тем/атомів, створюються версії, які потребують затвердження. Відхиліть зміни, які ви не хочете зберігати.

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
