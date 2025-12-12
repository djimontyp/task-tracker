# Glossary — Словник термінів

**Продукт:** Pulse Radar
**Статус:** 🟢 Approved (Q5-Q7 узгоджено, aligned with code)
**Дата:** 2025-12-11

---

## Core Concepts

### Message (Повідомлення)

**Визначення:** Одиниця вхідних даних з Telegram каналу.

**Атрибути:**
- `content` — текст повідомлення
- `author` — автор
- `timestamp` — час надходження
- `importance_score` — оцінка важливості (0.0-1.0)
- `classification` — **signal / weak_signal / noise** (3-tier!)

**Lifecycle:**
```
Telegram → Webhook → Message → Scoring → Classification → Storage
                                    ↓
                              weak_signal → Human Review Queue
```

---

### Atom (Атом знань)

**Визначення:** Структурована одиниця знань, витягнута з повідомлень за допомогою AI. Базується на Zettelkasten методології.

**Типи (7 types):**

| Type | Код | Опис | Приклад |
|------|-----|------|---------|
| **Problem** | `problem` | Проблема чи блокер | "Не працює авторизація на staging" |
| **Solution** | `solution` | Рішення проблеми | "Виправили додавши timeout в config" |
| **Decision** | `decision` | Прийняте рішення | "Вирішили використовувати PostgreSQL" |
| **Question** | `question` | Питання що потребує відповіді | "Який формат дати використовуємо?" |
| **Insight** | `insight` | Корисне спостереження | "Більшість помилок з мобільних пристроїв" |
| **Pattern** | `pattern` | Повторюваний паттерн | "Завжди падає в понеділок вранці" |
| **Requirement** | `requirement` | Вимога | "Потрібна підтримка 2FA" |

> **Note:** BA docs раніше мали TASK/IDEA, але код використовує problem/solution/pattern/requirement. Цей glossary aligned з реальним кодом.

**Статус Model (Boolean Flags):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATOM STATUS MODEL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   user_approved: false          user_approved: true              │
│   archived: false               archived: false                  │
│   ────────────────              ────────────────                 │
│   = PENDING REVIEW              = APPROVED                       │
│                                                                  │
│   user_approved: false          user_approved: true/false        │
│   archived: true                archived: true                   │
│   ────────────────              ────────────────                 │
│   = REJECTED/DISCARDED          = ARCHIVED (after approval)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

State Transitions:
- New Atom: user_approved=false, archived=false (pending review)
- Approve:  user_approved=true, archived=false
- Reject:   archived=true (user_approved unchanged)
- Archive:  archived=true, archived_at=now()
```

**Інші атрибути:**
- `confidence` — AI confidence score (0.0-1.0), null for manual atoms
- `title` — коротка назва (max 200 chars)
- `content` — повний зміст
- `embedding` — vector (1536 dims) для semantic search
- `meta` — JSON metadata (tags, sources, etc.)

> **Q5 (Closed):** ✅ 7 типів в коді. Зокрема solution/pattern/requirement замість TASK/IDEA.

---

### Topic (Топік)

**Визначення:** Тематичний контейнер для групування Atoms.

**Атрибути:**
- `name` — назва топіка
- `icon` — візуальна іконка (Lucide icon name)
- `color` — колір для UI (hex)
- `keywords` — ключові слова для автоматичного mapping

**Приклади:**
- 🔧 Backend Development
- 🎨 UI/UX Design
- 📊 Analytics
- 🐛 Bug Reports

**Зв'язки:**
- Topic → Many Atoms (M2M через atom_topics)
- Topic → Many Messages (M2M через message_topics)

> **Q7 (Closed):** ✅ Auto + Manual: AI пропонує topics на основі keywords, людина підтверджує.

---

## Signal & Noise Classification

### 3-Tier Classification System

```
┌─────────────────────────────────────────────────────────────────┐
│                 MESSAGE CLASSIFICATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   0.0 ════════ 0.3 ════════════════ 0.7 ════════════════ 1.0    │
│        NOISE         WEAK_SIGNAL              SIGNAL             │
│                                                                  │
│   ┌─────────┐      ┌─────────────┐        ┌────────────┐        │
│   │ Exclude │      │   Review    │        │  Priority  │        │
│   │  Auto   │      │   Queue     │        │   Include  │        │
│   └─────────┘      └─────────────┘        └────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

| Score Range | Classification | Action | UI Treatment |
|-------------|----------------|--------|--------------|
| 0.00 - 0.30 | `noise` | Exclude from analysis | Hidden by default |
| 0.30 - 0.70 | `weak_signal` | Human review queue | Yellow badge, "Needs Review" |
| 0.70 - 1.00 | `signal` | Priority processing | Green badge, visible by default |

### Signal (Сигнал)

**Визначення:** Повідомлення з високою важливістю (score > 0.7).

**Критерії:**
- Містить actionable information
- Рішення, завдання, проблеми
- Signal keywords detected
- From known important author

### Weak Signal (Слабкий сигнал)

**Визначення:** Повідомлення з середньою важливістю (0.3 ≤ score ≤ 0.7).

**Поведінка:**
- Потрапляє в Review Queue
- Потребує human confirmation
- Може бути promoted до Signal або demoted до Noise

### Noise (Шум)

**Визначення:** Повідомлення з низькою інформаційною цінністю (score < 0.3).

**Приклади:**
- Привітання ("Доброго ранку!")
- Off-topic коментарі
- Дублікати
- Emoji-only повідомлення
- "+1", "ok", "lol"

> **Q6 (Closed):** ✅ Thresholds: noise < 0.3, signal > 0.7, weak_signal = 0.3-0.7

---

## Importance Scoring Algorithm

### Weighted Scoring Model

```
importance_score = (content_score × 0.4) +
                   (author_score × 0.2) +
                   (temporal_score × 0.2) +
                   (topics_score × 0.2)
```

| Factor | Weight | Опис |
|--------|--------|------|
| **Content** | 40% | Text analysis, keywords, length |
| **Author** | 20% | Author role, history |
| **Temporal** | 20% | Time context, urgency |
| **Topics** | 20% | Topic relevance |

### Content Scoring Rules

| Condition | Score | Опис |
|-----------|-------|------|
| Length < 10 chars | 0.1 | Too short |
| Length 10-50 | 0.4 | Short |
| Length 50-200 | 0.7 | Medium |
| Length > 200 | 0.9 | Long (detailed) |
| Noise keywords (+1, lol, ok) | 0.1 | Low value |
| Signal keywords (bug, error, decision) | 0.8-0.95 | High value |
| Question marks | +0.1 bonus | Questions are important |
| URLs/code blocks | +0.15 bonus | Technical content |

### Noise Keywords (auto-filter)

```
+1, lol, ok, haha, yeah, yep, nope, hmm, aha, 👍, 👌, 🙂, 😀
```

### Signal Keywords (boost score)

```
bug, error, problem, issue, fix, решение, баг, помилка,
decision, decided, agree, рішення, вирішили,
important, urgent, critical, терміново, критично,
deploy, release, production, merge, PR, pull request
```

---

## AI Pipeline

### Analysis Run

**Визначення:** Один запуск AI pipeline для обробки повідомлень.

**Стани (7 states):**
```
PENDING → QUEUED → RUNNING → COMPLETED
                          ↘ FAILED
                          ↘ CANCELLED
                          ↘ TIMEOUT
```

### LLM Provider

**Визначення:** Постачальник LLM сервісів для AI extraction.

**Типи:**
- `openai` — OpenAI API (GPT-4, GPT-3.5)
- `ollama` — Self-hosted Ollama (llama2, mistral)

**Validation States:**
```
pending → validating → connected / error
```

### 3-Stage Extraction Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐
│ CLASSIFICATION│────│  EXTRACTION │────│  ANALYSIS   │────│  ATOMS  │
│    Agent     │    │    Agent    │    │    Agent    │    │         │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────┘
      │                    │                   │
      ▼                    ▼                   ▼
  Category +           Entities           Structured
  Priority          (projects, tags)        Notes
```

### RAG Context

**Визначення:** Retrieval-Augmented Generation контекст для LLM prompts.

**Компоненти:**
- `similar_proposals` — схожі минулі пропозиції (approved)
- `relevant_atoms` — релевантні атоми з бази
- `related_messages` — пов'язані повідомлення (history)

---

## WebSocket Events

### Event Topics

| Topic | Events | Опис |
|-------|--------|------|
| `messages` | message.updated, ingestion.started/progress/completed | Message lifecycle |
| `knowledge` | extraction_started/completed, topic/atom_created | Knowledge extraction |
| `noise_filtering` | message_scored | Scoring updates |
| `monitoring` | task_started/completed/failed | Background tasks |
| `metrics` | metrics:update | Dashboard metrics |

### Cross-Process Communication

```
Worker → NATS JetStream → API → WebSocket → Frontend
```

---

## User Interface

### Dashboard

**Визначення:** Головний інтерфейс для перегляду та управління знаннями.

**Компоненти:**
- Messages list — вхідні повідомлення
- Topics view — перегляд по топіках
- Atoms list — структуровані знання
- Search — keyword пошук (semantic в v1.2)

### Consumer Mode / Admin Mode

| Mode | Призначення | Доступ |
|------|-------------|--------|
| Consumer | Перегляд та пошук знань | Всі користувачі |
| Admin | Налаштування, управління | PM / Admin role |

---

## Technical Terms

### Webhook

**Визначення:** HTTP endpoint для прийому повідомлень від Telegram.

**URL:** `/webhook/telegram`

### Embedding

**Визначення:** Векторне представлення тексту для semantic search.

**Розмірність:** 1536 (OpenAI text-embedding-ada-002)

### pgvector

**Визначення:** PostgreSQL extension для зберігання та пошуку векторів.

**Operations:** cosine similarity для semantic search

---

## Abbreviations

| Скорочення | Повна назва |
|------------|-------------|
| MVP | Minimum Viable Product |
| LLM | Large Language Model |
| RAG | Retrieval-Augmented Generation |
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| UI | User Interface |
| UX | User Experience |
| WS | WebSocket |
| NATS | Neural Autonomic Transport System (message broker) |

---

## Закриті питання

| # | Питання | Рішення |
|---|---------|---------|
| Q5 | Atom types | 7 types: problem, solution, decision, question, insight, pattern, requirement |
| Q6 | Scoring thresholds | noise < 0.3, weak_signal 0.3-0.7, signal > 0.7 |
| Q7 | Topics | Auto + Manual (AI пропонує, людина підтверджує) |

---

**Related:** [Data Dictionary](./02-data-dictionary.md) | [Business Rules](./04-requirements/business-rules.md)

**Next:** [Stakeholders](./03-stakeholders.md)
