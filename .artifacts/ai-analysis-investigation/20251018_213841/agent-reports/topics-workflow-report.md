# Звіт: Топіки в Task Tracker - Повний Життєвий Цикл

**Дата:** 2025-10-18
**Автор:** React Frontend Architect
**Статус:** ✅ Завершено

---

## Короткий Підсумок

**Відповідь на питання "де і як з'являться топіки?":**

🔴 **ВАЖЛИВО:** Топіки НЕ створюються автоматично AI аналізом. Зараз топіки потрібно створювати **вручну** через API або seed скрипт. Автоматичне створення топіків - це майбутня фіча згідно з документацією.

---

## 1. Де в UI можна побачити топіки?

### Основна сторінка: `/topics`
**Компонент:** `frontend/src/pages/TopicsPage/index.tsx`

**Що відображається:**
- Сітка з картками топіків (grid layout: 1 колонка на мобільному, 2 на планшеті, 3 на десктопі)
- Кожна картка показує:
  - Іконку та колір топіка
  - Назву та опис
  - ID та дату створення
  - ColorPickerPopover для зміни кольору

**Дані:**
```typescript
GET /api/v1/topics
Response: {
  items: Topic[],
  total: number,
  page: number,
  page_size: number
}
```

### Деталі топіка: `/topics/:topicId`
**Компонент:** `frontend/src/pages/TopicDetailPage/index.tsx`

**Що відображається:**
- Редагування назви та опису топіка (з автозбереженням або мануальним збереженням)
- Зміна кольору та іконки
- **Knowledge Atoms** - атоми знань пов'язані з топіком
- **Related Messages** - повідомлення згруповані по топіку

**Дані:**
```typescript
GET /api/v1/topics/:id
GET /api/v1/topics/:id/atoms
GET /api/v1/topics/:id/messages
```

---

## 2. Як створюються топіки?

### ❌ НЕ автоматично AI
**Факт:** AI аналіз (AnalysisRun) НЕ створює топіки автоматично.

**Що робить AI аналіз:**
1. Фетчить повідомлення з time window
2. Фільтрує за keywords та довжиною
3. Групує в батчі
4. Генерує **TaskProposal** (пропозиції задач)
5. Зберігає proposals в БД

**Що НЕ робить AI:**
- Не створює Topics
- Не присвоює message.topic_id автоматично
- Не класифікує повідомлення по топіках

### ✅ Вручну через API
**Endpoint:** `POST /api/v1/topics`

```python
# backend/app/api/v1/topics.py:118-142
@router.post("", response_model=TopicPublic, status_code=201)
async def create_topic(
    topic_data: TopicCreate,
    session: AsyncSession = Depends(get_session),
) -> TopicPublic:
    """Create a new topic.

    If icon is not provided, it will be automatically selected based on
    keywords in the topic name and description.
    """
    crud = TopicCRUD(session)
    return await crud.create(topic_data)
```

**Request Body:**
```json
{
  "name": "Mobile App Development",
  "description": "iOS and Android development",
  "icon": "CodeBracketIcon",  // опціонально - автовибір
  "color": "#8B5CF6"          // опціонально - автовибір
}
```

### ✅ Через seed скрипт
**Команда:** `just db-topics-seed 5 10 20`

**Скрипт:** `backend/scripts/seed_topics_atoms.py`

**Що робить:**
1. Створює Topics з TOPIC_DATA (Mobile App, Backend API, DevOps, Product Design, Team Planning)
2. Створює Atoms (problem, solution, decision, feature_request, insight)
3. Створює Messages з **topic_id** вже встановленим
4. Створює зв'язки TopicAtom, AtomLink

---

## 3. Коли з'являються топіки після запуску аналізу?

### ❌ НІКОЛИ - AI аналіз НЕ створює топіки

**Workflow AI аналізу:**
```
1. Start Analysis Run → status=running
2. Fetch Messages (з time window)
3. Prefilter Messages (keywords, length, @mentions)
4. Create Batches (50 messages per batch)
5. Process Batch with LLM → генерує TaskProposal
6. Save Proposals → proposals_total++, proposals_pending++
7. Complete Run → status=completed
```

**Результат:**
- Створюються **TaskProposal** (пропозиції задач)
- НЕ створюються **Topics**
- НЕ оновлюється **message.topic_id**

---

## 4. Який зв'язок між Proposals → Topics?

### ❌ Зв'язку НЕМАЄ

**TaskProposal модель НЕ має:**
- `topic_id` поля
- Зв'язку з Topics таблицею
- Жодної логіки створення топіків

**TaskProposal має:**
```python
# backend/app/models/task_proposal.py
class TaskProposal:
    proposed_title: str
    proposed_description: str
    proposed_priority: str
    proposed_category: str  # ← це НЕ topic_id
    proposed_tags: list[str]
    source_message_ids: list[int]
    confidence: float
    llm_reasoning: str
```

**Workflow approval:**
```python
# backend/app/api/v1/proposals.py:136-196
@router.put("/{proposal_id}/approve")
async def approve_proposal(proposal_id: UUID):
    # 1. proposal.status = "approved"
    # 2. run.proposals_pending--
    # 3. run.proposals_approved++
    # 4. Broadcast WebSocket event
    # ❌ НЕ створює Topic
    # ❌ НЕ створює TaskEntity
```

**Коментар з коду:**
```python
# Note: Approved proposals should be converted to TaskEntity records
# in Phase 2 implementation.
```

---

## 5. Чи може користувач бачити повідомлення згруповані по топіках?

### ✅ ТАК - але тільки якщо topic_id вже встановлений

**TopicDetailPage показує:**
```typescript
// frontend/src/pages/TopicDetailPage/index.tsx:53-57
const { data: messages = [] } = useQuery<Message[]>({
  queryKey: ['messages', 'topic', parseInt(topicId!)],
  queryFn: () => messageService.getMessagesByTopic(parseInt(topicId!)),
})
```

**Backend endpoint:**
```python
# backend/app/api/v1/topics.py:247-285
@router.get("/{topic_id}/messages")
async def get_topic_messages(topic_id: int):
    """Get all messages belonging to a topic."""
    crud = MessageCRUD(session)
    return await crud.list_by_topic(topic_id, skip, limit)
```

**SQL запит:**
```python
# backend/app/services/message_crud.py
SELECT * FROM messages
WHERE topic_id = :topic_id
ORDER BY sent_at DESC
```

**Проблема:**
- `message.topic_id` встановлюється тільки **вручну** через seed скрипт
- AI аналіз **НЕ** присвоює topic_id повідомленням
- Після імпорту Telegram повідомлень `topic_id = NULL` для всіх

---

## 6. Покрокова інструкція: від імпорту до перегляду топіків

### Варіант 1: Використання seed скрипту (для тестування)

```bash
# Крок 1: Створити топіки, атоми та повідомлення з topic_id
just db-topics-seed 5 10 20
# Створює 5 топіків, 10 атомів на топік, 20 повідомлень на топік

# Крок 2: Відкрити UI
# Перейти на http://localhost/topics
# Побачити 5 топіків (Mobile App, Backend API, DevOps, Product Design, Team Planning)

# Крок 3: Клікнути на топік
# Побачити пов'язані повідомлення та атоми
```

### Варіант 2: Реальний workflow (зараз НЕ працює повністю)

```bash
# Крок 1: Імпортувати Telegram повідомлення
# Telegram бот → FastAPI webhook → БД
# Результат: повідомлення з topic_id=NULL

# Крок 2: ❌ Запустити AI аналіз
POST /api/v1/analysis/runs
# Результат: створюються TaskProposal, але НЕ Topics

# Крок 3: ❌ Переглянути proposals
GET /api/v1/proposals
# Результат: можна approve/reject, але топіки НЕ створюються

# Крок 4: ❌ Чекати топіки
# ❌ НЕ ПРАЦЮЄ - топіки потрібно створювати вручну
```

### Варіант 3: Гібрид (поточне рішення до Phase 2)

```bash
# Крок 1: Імпортувати Telegram повідомлення
# topic_id=NULL для всіх

# Крок 2: Вручну створити топіки через API
POST /api/v1/topics
Body: {"name": "Bug Fixes", "description": "...", "icon": "..."}

# Крок 3: Вручну присвоїти topic_id повідомленням
# ❌ Немає UI для цього
# ❌ Потрібно робити через SQL або кастомний скрипт

UPDATE messages
SET topic_id = 1
WHERE content LIKE '%баг%' OR content LIKE '%fix%';

# Крок 4: Переглянути топіки в UI
# Перейти на /topics/:topicId
# Побачити пов'язані повідомлення
```

---

## Висновки та Проблеми

### ❌ Поточні проблеми

1. **Розрив між AI аналізом та топіками**
   - AI генерує TaskProposal
   - Топіки створюються окремо вручну
   - Немає автоматичного зв'язку

2. **message.topic_id не заповнюється автоматично**
   - Після імпорту: `topic_id = NULL`
   - Після AI аналізу: `topic_id = NULL`
   - Потрібен мануальний SQL update

3. **Немає UI для класифікації повідомлень**
   - Не можна присвоїти топік повідомленню з UI
   - Не можна побачити нескласифіковані повідомлення
   - Немає bulk actions для призначення топіків

4. **Proposals не конвертуються в Topics**
   - Approved proposals не створюють топіки
   - `proposed_category` != `topic_id`
   - Немає логіки merge proposals → topics

### ✅ Що працює зараз

1. **CRUD топіків через API** ✅
   - Створення топіків (POST /topics)
   - Редагування (PATCH /topics/:id)
   - Перегляд списку (GET /topics)
   - Деталі топіка (GET /topics/:id)

2. **UI для топіків** ✅
   - Список топіків (/topics)
   - Деталі топіка (/topics/:id)
   - Редагування назви/опису
   - Зміна кольору/іконки

3. **Перегляд повідомлень по топіках** ✅
   - GET /topics/:id/messages
   - Якщо topic_id встановлений вручну

4. **Seed скрипт** ✅
   - Створення тестових топіків
   - Створення повідомлень з topic_id

### 🚀 Майбутні фічі (згідно документації)

Згідно з `docs/content/uk/topics.md`:

> - 🤖 **Автоматичне створення просторів** на основі виявлених патернів
> - 🔍 **Міжпросторовий пошук** та аналітика
> - 📝 **Шаблони просторів** для типових типів проєктів
> - 📄 **AI-генеровані підсумки** вмісту просторів

**Це означає:**
- Автоматичне створення топіків - заплановано, але НЕ реалізовано
- Зараз system працює тільки з вручну створеними топіками

---

## Рекомендації

### Для користувача (зараз)

1. **Використовуйте seed скрипт для тестування:**
   ```bash
   just db-topics-seed 5 10 20
   ```

2. **Для реальних даних створюйте топіки вручну:**
   ```bash
   curl -X POST http://localhost/api/v1/topics \
     -H "Content-Type: application/json" \
     -d '{"name": "Bug Fixes", "description": "Bug tracking and fixes"}'
   ```

3. **Чекайте Phase 2:**
   - Автоматичне створення топіків з proposals
   - Автоматична класифікація повідомлень
   - UI для призначення топіків

### Для розробників (Phase 2)

**Потрібно реалізувати:**

1. **Classification Pipeline:**
   ```python
   # Після AI аналізу:
   # 1. Групувати proposals по proposed_category
   # 2. Створювати Topics з найчастіших категорій
   # 3. Оновлювати message.topic_id на основі proposals
   ```

2. **UI для класифікації:**
   - MessagesPage: колонка "Topic" з dropdown для призначення
   - Bulk actions для масового призначення топіків
   - Фільтр "Unclassified messages" (topic_id IS NULL)

3. **Auto-classification Agent:**
   ```python
   # Новий TaskIQ worker:
   # 1. Витягує embeddings для повідомлень
   # 2. Шукає найближчі атоми в топіках
   # 3. Присвоює topic_id автоматично
   # 4. Confidence threshold для авто-присвоєння
   ```

---

## Технічні деталі

### Database Schema

```sql
-- Topics
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),  -- Hex format #RRGGBB
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Messages з topic_id
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    content TEXT,
    topic_id INTEGER REFERENCES topics(id),  -- ← ключове поле
    -- ... інші поля
);

-- TaskProposal БЕЗ topic_id
CREATE TABLE task_proposals (
    id UUID PRIMARY KEY,
    proposed_category VARCHAR(100),  -- ← це НЕ topic_id
    -- ... НЕ має foreign key до topics
);
```

### API Endpoints

```
Topics:
GET    /api/v1/topics              - List topics
GET    /api/v1/topics/:id          - Get topic
POST   /api/v1/topics              - Create topic
PATCH  /api/v1/topics/:id          - Update topic
GET    /api/v1/topics/:id/atoms    - Get topic atoms
GET    /api/v1/topics/:id/messages - Get topic messages

Proposals (NO topic connection):
GET    /api/v1/proposals           - List proposals
PUT    /api/v1/proposals/:id/approve  - ❌ НЕ створює topic
```

### Frontend Routes

```
/topics          - TopicsPage (список)
/topics/:topicId - TopicDetailPage (деталі + messages + atoms)
```

---

**Дата завершення:** 2025-10-18
**Статус:** ✅ Аналіз завершено
