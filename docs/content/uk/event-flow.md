# Послідовність Подій і Топіки

!!! info "Огляд"
    Цей документ описує послідовний потік подій через WebSocket топіки та фонові завдання в системі Task Tracker.

---

## Огляд Архітектури

Система використовує **event-driven архітектуру** з:

- **WebSocket Topics** - Канали реального часу для оновлень фронтенду
- **TaskIQ + NATS** - Обробка фонових завдань з брокером повідомлень
- **PostgreSQL** - Постійне збереження стану з транзакційними гарантіями

### Основні Топіки

| Топік | Призначення | Події |
|-------|-------------|-------|
| `messages` | Оновлення Telegram повідомлень | `message.updated`, `ingestion.*` |
| `analysis_runs` | Життєвий цикл аналізу | `run_started`, `progress_updated`, `proposals_created`, `run_completed`, `run_failed` |
| `proposals` | Перегляд пропозицій задач | `approved`, `rejected`, `merged` |

---

## Повний Потік Подій

```mermaid
sequenceDiagram
    autonumber

    participant TG as Telegram
    participant API as FastAPI
    participant NATS as NATS Broker
    participant Worker as TaskIQ Worker
    participant DB as PostgreSQL
    participant WS as WebSocket Manager
    participant Client as Frontend Client

    %% Фаза 1: Прийом Повідомлень
    rect rgb(240, 248, 255)
        Note over TG,Client: Фаза 1: Прийом Повідомлень
        TG->>API: POST /webhook/telegram (message)
        API->>NATS: save_telegram_message.kiq()
        API-->>TG: 200 OK (миттєва відповідь)

        activate Worker
        NATS->>Worker: Доставка завдання
        Worker->>DB: INSERT message, user, profile
        Worker->>DB: COMMIT транзакція
        Worker->>WS: broadcast("messages", message.updated)
        WS-->>Client: WebSocket: message.updated
        deactivate Worker
    end

    %% Фаза 2: Створення Аналітичного Прогону
    rect rgb(255, 250, 240)
        Note over TG,Client: Фаза 2: Створення Аналітичного Прогону
        Client->>API: POST /api/runs (створити аналіз)
        API->>DB: Перевірка незакритих прогонів
        alt Незакритий прогон існує
            API-->>Client: 409 Conflict
        else Конфліктів немає
            API->>DB: INSERT analysis_run (status=pending)
            API-->>Client: 201 Created (run_id)
        end
    end

    %% Фаза 3: Запуск Аналізу
    rect rgb(240, 255, 240)
        Note over TG,Client: Фаза 3: Фонове Виконання Аналізу
        Client->>API: POST /api/runs/{id}/start
        API->>NATS: execute_analysis_run.kiq(run_id)
        API-->>Client: 202 Accepted

        activate Worker
        NATS->>Worker: Доставка завдання аналізу

        %% Крок 1: Старт прогону
        Worker->>DB: UPDATE status=running, started_at=now()
        Worker->>WS: broadcast("analysis_runs", run_started)
        WS-->>Client: WebSocket: run_started

        %% Крок 2: Отримання повідомлень
        Worker->>DB: SELECT messages WHERE sent_at IN [window]
        DB-->>Worker: messages[]

        %% Крок 3: Префільтрація
        Note over Worker: Фільтр за ключовими словами, довжиною, згадками

        %% Крок 4: Створення батчів
        Note over Worker: Групування по 10хв вікнах, макс 50 повідомлень

        %% Крок 5: Обробка кожного батчу
        loop Для кожного батчу
            Worker->>Worker: LLM Аналіз (Pydantic-AI)
            Worker->>DB: INSERT task_proposals (batch)
            Worker->>DB: UPDATE прогрес прогону
            Worker->>WS: broadcast("analysis_runs", proposals_created)
            WS-->>Client: WebSocket: proposals_created
            Worker->>WS: broadcast("analysis_runs", progress_updated)
            WS-->>Client: WebSocket: progress_updated
        end

        %% Крок 6: Завершення прогону
        Worker->>DB: UPDATE status=completed, proposals_total=X
        Worker->>WS: broadcast("analysis_runs", run_completed)
        WS-->>Client: WebSocket: run_completed
        deactivate Worker
    end

    %% Фаза 4: Перегляд Пропозицій
    rect rgb(255, 240, 255)
        Note over TG,Client: Фаза 4: Робочий Процес PM

        %% Схвалення пропозиції
        Client->>API: PUT /api/proposals/{id}/approve
        API->>DB: UPDATE proposal status=approved
        API->>DB: DECREMENT run.proposals_pending
        API->>DB: INCREMENT run.proposals_approved
        API->>DB: COMMIT транзакція
        API->>WS: broadcast("proposals", approved)
        WS-->>Client: WebSocket: approved
        API-->>Client: 200 OK

        Note over Client: Повторити для reject/merge дій
    end

    %% Фаза 5: Закриття Аналітичного Прогону
    rect rgb(255, 255, 240)
        Note over TG,Client: Фаза 5: Закриття Аналітичного Прогону
        Client->>API: PUT /api/runs/{id}/close
        API->>DB: SELECT run WHERE proposals_pending > 0
        alt Існують очікуючі пропозиції
            API-->>Client: 400 Bad Request
        else Всі пропозиції переглянуті
            API->>DB: UPDATE status=closed, accuracy_metrics={...}
            API->>WS: broadcast("analysis_runs", run_closed)
            WS-->>Client: WebSocket: run_closed
            API-->>Client: 200 OK
        end
    end
```

---

## Гарантії Послідовності Подій

### ✅ Сильні Гарантії

1. **Транзакції Бази Даних**
   - Всі зміни стану в межах одного запиту атомарні
   - WebSocket розсилка відбувається ПІСЛЯ успішного DB commit
   - Якщо розсилка не вдалася, це логується, але не відкочує транзакцію

2. **Життєвий Цикл Аналітичного Прогону**
   - Неможливо створити новий прогон, якщо існує незакритий (409 Conflict)
   - Неможливо закрити прогон з очікуючими пропозиціями (400 Bad Request)
   - Переходи статусу примусові: `pending → running → completed → reviewed → closed → failed → cancelled`
   - Тільки термінальні стани: `closed`, `failed`, `cancelled`

3. **Перегляд Пропозицій**
   - Кожне approve/reject атомарно оновлює пропозицію І лічильники прогону
   - Race conditions запобігаються обмеженнями БД та транзакціями

### ⚠️ Евентуальна Узгодженість

1. **Доставка WebSocket**
   - Доставка з найкращими зусиллями (не гарантована якщо клієнт відключився)
   - Клієнти повинні опитувати API при переподключенні для синхронізації

2. **Міжтопікові Події**
   - Події з різних топіків можуть прибути не по порядку
   - Фронтенд повинен впорядковувати використовуючи timestamps

---

## Машини Станів

### Стани Аналітичного Прогону

```mermaid
stateDiagram-v2
    [*] --> pending: Створити прогон
    pending --> running: Запустити виконання
    pending --> cancelled: Користувач скасовує
    running --> completed: Всі батчі оброблені
    running --> failed: Виникла помилка
    completed --> reviewed: PM переглядає пропозиції
    reviewed --> closed: Всі пропозиції вирішені
    closed --> [*]
    failed --> [*]
    cancelled --> [*]

    note right of pending
        Неможливо створити якщо
        існує незакритий прогон
    end note

    note right of closed
        Неможливо закрити якщо
        proposals_pending > 0
    end note
```

### Стани Пропозицій

```mermaid
stateDiagram-v2
    [*] --> pending: LLM створює пропозицію
    pending --> approved: PM схвалює
    pending --> rejected: PM відхиляє
    pending --> merged: Злиття з існуючою задачею
    approved --> [*]
    rejected --> [*]
    merged --> [*]

    note right of pending
        Можна редагувати
        перед переглядом
    end note
```

---

## Міркування Продуктивності

### Стратегія Батчингу

**Поточні Налаштування:**
- Часове вікно: 10 хвилин
- Макс повідомлень на батч: 50
- Паралельна обробка батчів: Ні (послідовна)

**Чому Послідовна?**
- Запобігає rate limiting LLM
- Підтримує безперервність контексту
- Легше відновлення від помилок

### Оптимізація WebSocket

1. **Ізоляція Топіків** - Клієнти підписуються лише на потрібні топіки
2. **Пулінг З'єднань** - Повторне використання з'єднань
3. **Вибіркова Розсилка** - Відправка лише підписаним клієнтам

---

## Майбутні Покращення

### 1. Space-Context Топіки

**Поточне:** Плоска структура топіків (`messages`, `analysis_runs`, `proposals`)

**Пропоноване:** Ієрархічні топіки з областю проєкту

```
space:{project_id}:messages
space:{project_id}:analysis_runs
space:{project_id}:proposals
```

**Переваги:**
- Ізоляція подій по проєктах
- Зменшення навантаження (клієнти підписуються лише на свої проєкти)
- Підтримка мультитенантності

### 2. Event Sourcing

Зберігати всі події в append-only лозі для:
- Аудит-треку
- Time-travel debugging
- Event replay для аналітики

### 3. Dead Letter Queue

Обробка невдалих фонових завдань:
- Повтор з експоненціальною затримкою
- Ручний перегляд невдалих завдань
- Сповіщення про повторювані збої

---

!!! question "Питання?"
    Якщо у вас є питання про потік подій, перегляньте архітектурні документи або зв'яжіться з командою.