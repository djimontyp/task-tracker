# Машина станів AnalysisRun

## Огляд

Машина станів AnalysisRun координує життєвий цикл AI-керованих аналітичних запусків, які обробляють партії Telegram повідомлень та генерують пропозиції задач використовуючи LLM агентів. Кожен запуск проходить через визначену послідовність станів від створення до закриття, з правилами валідації, що забезпечують консистентність даних та повний огляд пропозицій перед фіналізацією.

**Ключові характеристики**:
- 7-стану життєвий цикл з 5 активними станами та 2 зарезервованими для майбутніх функцій
- Застосування єдиного активного запуску для запобігання конфліктів ресурсів
- Обов'язкове завершення огляду пропозицій перед закриттям
- Комплексна трансляція WebSocket подій для оновлень UI в реальному часі
- Автоматичний розрахунок метрик точності при закритті

**Розв'язання розбіжностей**: Початковий аудит виявив 7 станів проти 4 станів. Дослідження підтверджує **7 станів визначених в енумі `AnalysisRunStatus`** з 5 активно використовуваними в робочих процесах та 2 невикористаними але зарезервованими.

---

## Каталог станів

| Стан | Опис | Статус | Термінальний |
|-------|-------------|--------|----------|
| `pending` | Запуск створено, очікує виконання фонової задачі | Активний | Ні |
| `running` | Фонова задача обробляє повідомлення та генерує пропозиції | Активний | Ні |
| `completed` | Виконання завершено успішно, всі пропозиції згенеровано | Активний | Ні |
| `reviewed` | PM переглянув всі пропозиції (зарезервовано, не реалізовано) | Не використовується | Ні |
| `closed` | PM закрив запуск, метрики точності розраховані та збережені | Активний | Так |
| `failed` | Виконання зіткнулося з критичною помилкою, залоговано в `error_log` | Активний | Так |
| `cancelled` | Запуск скасовано користувачем (зарезервовано, не реалізовано) | Не використовується | Так |

**Активні стани**: 5 станів з реалізованими робочими процесами
**Невикористані стани**: 2 стани (`reviewed`, `cancelled`) визначені в енумі але не посилаються в сервісах або ендпоінтах
**Термінальні стани**: 3 стани без вихідних переходів (`closed`, `failed`, `cancelled`)

---

## Діаграма машини станів

```mermaid
stateDiagram-v2
    [*] --> pending: POST /api/v1/analysis/runs

    pending --> running: POST /start<br/>TaskIQ: execute_analysis_run

    running --> completed: Всі партії оброблено<br/>AnalysisExecutor.complete_run()
    running --> failed: Виняток у фоновій задачі<br/>AnalysisExecutor.fail_run()

    completed --> closed: PUT /close<br/>Валідація: proposals_pending == 0<br/>Розрахувати метрики точності

    closed --> [*]
    failed --> [*]

    note right of reviewed
        Зарезервовано для майбутньої функції
        (Крок ручного огляду PM)
    end note

    note right of cancelled
        Зарезервовано для майбутньої функції
        (Скасування ініційоване користувачем)
    end note
```

**Шлях успіху**: `pending` → `running` → `completed` → `closed`
**Шлях помилки**: `running` → `failed`
**Майбутні розширення**: `completed` → `reviewed` → `closed`, скасування з `pending`/`running`

---

## Переходи станів

| З | До | Тригер | Метод сервісу | Розташування |
|------|----|---------| ---------------|----------|
| - | `pending` | POST `/api/v1/analysis/runs` | `AnalysisRunCRUD.create()` | `analysis_service.py:129-205` |
| `pending` | `running` | POST `/api/v1/analysis/runs/{run_id}/start` | `AnalysisExecutor.start_run()` | `analysis_service.py:366-401` |
| `running` | `completed` | Всі партії успішно оброблено | `AnalysisExecutor.complete_run()` | `analysis_service.py:689-739` |
| `running` | `failed` | Виняток під час виконання | `AnalysisExecutor.fail_run()` | `analysis_service.py:741-781` |
| `completed` | `closed` | PUT `/api/v1/analysis/runs/{run_id}/close` | `AnalysisRunCRUD.close()` | `analysis_service.py:309-340` |

**Оновлені мітки часу**:
- `created_at` → Встановлено при створенні (`pending`)
- `started_at` → Встановлено коли фонова задача стартує (`running`)
- `completed_at` → Встановлено коли виконання завершується (`completed`)
- `closed_at` → Встановлено коли PM закриває запуск (`closed`)

---

## Правила валідації

| Правило | Застосовує | HTTP Відповідь | Бізнес-логіка |
|------|-------------|---------------|----------------|
| **Єдиний активний запуск** | `AnalysisRunValidator.can_start_new_run()` | `409 Conflict` | Неможливо створити новий запуск якщо існують незакриті запуски (`pending`, `running`, `completed`, `reviewed`). Повертає список ID конфліктних запусків. |
| **Завершити огляд перед закриттям** | `AnalysisRunValidator.can_close_run()` | `400 Bad Request` | Неможливо закрити запуск якщо `proposals_pending > 0`. Повертає кількість очікуючих пропозицій що потребують огляду. |

**Розташування валідацій**:
- Правило 1: `analysis_service.py:54-93` (охорона ендпоінту створення)
- Правило 2: `analysis_service.py:95-127` (охорона ендпоінту закриття)

**Незакриті стани** (Правило 1): `pending`, `running`, `completed`, `reviewed`
**Закриті стани** (дозволені одночасні): `closed`, `failed`, `cancelled`

---

## API Ендпоінти

| Метод | Ендпоінт | Призначення | Зміна стану | Сервіс |
|--------|----------|---------|--------------|---------|
| POST | `/api/v1/analysis/runs` | Створити новий аналітичний запуск з вікном часу та фільтрами | → `pending` | `AnalysisRunCRUD.create()` |
| GET | `/api/v1/analysis/runs` | Список запусків з пагінацією та фільтрами статусу | - | `AnalysisRunCRUD.get_all()` |
| GET | `/api/v1/analysis/runs/{run_id}` | Отримати деталі запуску з лічильниками пропозицій | - | `AnalysisRunCRUD.get()` |
| POST | `/api/v1/analysis/runs/{run_id}/start` | Запустити виконання фонової задачі (TaskIQ) | `pending` → `running` | `AnalysisExecutor.start_run()` |
| PUT | `/api/v1/analysis/runs/{run_id}/close` | Закрити запуск та розрахувати метрики точності | `completed` → `closed` | `AnalysisRunCRUD.close()` |

**Джерело API**: `backend/app/api/v1/analysis_runs.py` (341 рядок)
**Параметри запиту**: `/start` приймає опціональний `?use_rag=true` для RAG-покращеної генерації пропозицій
**Схема відповіді**: `AnalysisRunSchema` зі станом, мітками часу, лічильниками пропозицій, метриками точності

---

## Виконання фонової задачі

**Задача**: `execute_analysis_run(run_id: UUID, use_rag: bool = False)`
**Джерело**: `backend/app/tasks.py:410-521`
**Брокер**: NATS (TaskIQ)

### 9-кроковий робочий процес

| Крок | Дія | Метод сервісу | Призначення |
|------|--------|----------------|---------|
| 1 | Запустити виконання | `AnalysisExecutor.start_run()` | Оновити статус `pending` → `running`, встановити `started_at` |
| 2 | Отримати повідомлення | `AnalysisExecutor.fetch_messages()` | Запит повідомлень в налаштованому вікні часу |
| 3 | Попередньо відфільтрувати повідомлення | `AnalysisExecutor.prefilter_messages()` | Застосувати фільтри ключового слова/довжини/@згадок |
| 4 | Створити партії | `AnalysisExecutor.create_batches()` | Групувати за часовою близькістю (5-10хв вікна, макс 50 повідомлень) |
| 5 | Обробити партії | `AnalysisExecutor.process_batch()` | LLM генерує пропозиції задач (з опціональним RAG контекстом) |
| 6 | Зберегти пропозиції | `AnalysisExecutor.save_proposals()` | Зберегти в БД, інкрементувати `proposals_total` та `proposals_pending` |
| 7 | Оновити прогрес | `AnalysisExecutor.update_progress()` | Транслювати WebSocket подію `progress_updated` |
| 8 | Завершити запуск | `AnalysisExecutor.complete_run()` | Оновити статус `running` → `completed`, встановити `completed_at` |
| 9 | АБО зафейлити запуск | `AnalysisExecutor.fail_run()` | При винятку: оновити статус `running` → `failed`, зберегти `error_log` |

**Обробка помилок**: Винятки в кроках 1-8 запускають `fail_run()` з повідомленням про помилку збереженим в JSON полі `error_log`. Задача TaskIQ позначається як невдала.

**RAG покращення**: Коли `use_rag=true`, крок 5 використовує `LLMProposalService.generate_proposals_with_rag()` для збагачення LLM контексту семантично подібними минулими пропозиціями через векторний пошук.

---

## WebSocket події

| Подія | Перехід стану | Канал | Корисне навантаження |
|-------|------------------|---------|---------|
| `run_created` | → `pending` | `analysis` | ID запуску, вікно часу, фільтри |
| `run_started` | `pending` → `running` | `analysis_runs` | ID запуску, мітка часу старту |
| `progress_updated` | Під час `running` | `analysis_runs` | Прогрес партії, повідомлення оброблено |
| `proposals_created` | Під час `running` | `analysis_runs` | ID нових пропозицій, оцінки впевненості |
| `run_completed` | `running` → `completed` | `analysis_runs` | ID запуску, мітка часу завершення, лічильники пропозицій |
| `run_failed` | `running` → `failed` | `analysis_runs` | ID запуску, повідомлення про помилку |
| `run_closed` | `completed` → `closed` | `analysis` | ID запуску, метрики точності |

**Сервіс трансляції**: `websocket_manager.broadcast()` використовується в усіх методах переходу станів
**Оновлення в реальному часі**: Панель керування підписується на канали для відстеження прогресу в реальному часі

---

## Архітектура сервісу

### AnalysisRunValidator

**Призначення**: Валідація бізнес-правил для переходів станів
**Розташування**: `backend/app/services/analysis_service.py:47-127`

**Методи**:
- `can_start_new_run()` → Застосувати правило єдиного активного запуску
- `can_close_run(run_id)` → Валідувати всі пропозиції переглянуті перед закриттям

**Використання**: Викликається CRUD сервісом перед операціями зміни стану

---

### AnalysisRunCRUD

**Призначення**: Операції з базою даних для аналітичних запусків
**Розташування**: `backend/app/services/analysis_service.py:129-363`

**Методи**:
- `create()` → Створити запуск в стані `pending`
- `get()` / `get_all()` → Запит запусків з фільтрами
- `close()` → Перехід `completed` → `closed`, розрахувати метрики точності

**Розрахунок метрик точності**:
```
approval_rate = proposals_approved / proposals_total
rejection_rate = proposals_rejected / proposals_total
```

Збережено в JSONB полі `accuracy_metrics` при закритті.

---

### AnalysisExecutor

**Призначення**: Оркестрація виконання фонової задачі
**Розташування**: `backend/app/services/analysis_service.py:366-781`

**Методи**:
- `start_run()` → Перехід `pending` → `running`, запустити TaskIQ задачу
- `complete_run()` → Перехід `running` → `completed`
- `fail_run()` → Перехід `running` → `failed`, залогувати помилку
- `fetch_messages()` → Запит повідомлень у вікні часу
- `prefilter_messages()` → Застосувати фільтри шуму
- `create_batches()` → Групувати повідомлення за часовою близькістю
- `process_batch()` → LLM генерація пропозицій
- `save_proposals()` → Зберегти пропозиції, оновити лічильники
- `update_progress()` → Транслювати WebSocket події

**Залежності**: `LLMProposalService`, `EmbeddingService`, `SemanticSearchService` (для RAG)

---

## Інтеграція життєвого циклу пропозиції

**Поля відстеження**:
- `proposals_total` → Інкрементується коли пропозиції збережені
- `proposals_approved` → Інкрементується коли PM затверджує пропозицію
- `proposals_rejected` → Інкрементується коли PM відхиляє пропозицію
- `proposals_pending` → Розраховано як `total - approved - rejected`

**Потік оновлення**:
1. `save_proposals()` → Інкрементує `proposals_total` та `proposals_pending`
2. PM переглядає пропозиції → `ProposalService.approve()` або `reject()` оновлює лічильники
3. `close()` → Валідує `proposals_pending == 0`, розраховує метрики точності

**Метрики точності** (збережені в JSONB `accuracy_metrics` при закритті):
- `proposals_total` → Всього згенеровано пропозицій
- `approval_rate` → Відсоток затверджених PM
- `rejection_rate` → Відсоток відхилених PM

---

## Файли реалізації

| Файл | Рядків | Опис |
|------|-------|-------------|
| `backend/app/models/analysis_run.py` | 212 | SQLAlchemy модель зі станом, мітками часу, метриками |
| `backend/app/models/enums.py` | 78 | Енум `AnalysisRunStatus` (7 станів) |
| `backend/app/services/analysis_service.py` | 781 | Сервіси Validator, CRUD, Executor |
| `backend/app/api/v1/analysis_runs.py` | 341 | FastAPI ендпоінти |
| `backend/app/tasks.py` | 521 | TaskIQ фонова задача |

---

## Дивіться також

- [Система фонових задач](./background-tasks.md) - Архітектура TaskIQ та NATS
- [LLM архітектура](./llm-architecture.md) - Pydantic-AI агенти та RAG система
- [Бекенд сервіси](./backend-services.md) - Повний каталог сервісів
