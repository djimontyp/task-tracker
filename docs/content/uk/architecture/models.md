# Моделі Бази Даних і Схема

**Останнє Оновлення:** 26 жовтня 2025
**Статус:** Завершено - 21 Модель, 45+ Зв'язків
**Статус Міграцій:** 2 застосовані, таблиці версіонування працюють

---

## Зміст

1. [Огляд Схеми](#огляд-схеми)
2. [Діаграма Зв'язків Сутностей](#діаграма-звязків-сутностей)
3. [Каталог Моделей за Доменами](#каталог-моделей-за-доменами)
4. [Структури Таблиць](#структури-таблиць)
5. [Підсумок Зв'язків](#підсумок-звязків)
6. [Стратегія Первинних Ключів](#стратегія-первинних-ключів)
7. [Спеціальні Функції](#спеціальні-функції)

---

## Огляд Схеми

База даних Task Tracker складається з **21 моделі**, організованих у 5 функціональних доменів:

<div class="grid cards" markdown>

- :material-account-group: **Управління Користувачами** (2 моделі)

    Користувачі та Telegram профілі з зв'язком один-до-одного

- :material-message-text: **Комунікація** (4 моделі)

    Зберігання повідомлень, джерела та завдання інгестії

- :material-brain: **Граф Знань** (6 моделей)

    Топіки, атоми, версіонування та зв'язки

- :material-robot: **Система Аналізу** (8 моделей)

    LLM провайдери, агенти, виконання аналізу та пропозиції

- :material-archive: **Застаріла Система** (3 моделі)

    Застаріле управління завданнями та вебхуки

</div>

---

## Діаграма Зв'язків Сутностей

### Повна Діаграма Схеми

```mermaid
erDiagram
    %% Домен Управління Користувачами
    users ||--o| telegram_profiles : має
    users ||--o{ messages : автори
    users ||--o{ analysis_runs : ініціює
    users ||--o{ task_proposals : переглядає
    users ||--o{ project_configs : керує

    %% Домен Комунікації
    sources ||--o{ messages : надає
    sources ||--o{ telegram_profiles : звязує
    messages }o--|| topics : класифіковано_як
    messages }o--o| telegram_profiles : від

    %% Домен Графа Знань
    topics ||--o{ topic_versions : версіоновано_як
    topics ||--o{ topic_atoms : містить
    atoms ||--o{ atom_versions : версіоновано_як
    atoms ||--o{ topic_atoms : належить_до
    atoms }o--o{ atoms : звязано_через_atom_links

    %% Домен Системи Аналізу
    llm_providers ||--o{ agent_configs : живить
    llm_providers ||--o{ classification_experiments : використано_в
    agent_configs ||--o{ agent_task_assignments : призначено_до
    task_configs ||--o{ agent_task_assignments : налаштовує
    agent_task_assignments ||--o{ analysis_runs : виконує
    project_configs ||--o{ analysis_runs : налаштовує
    analysis_runs ||--o{ task_proposals : генерує
    task_entities ||--o{ task_proposals : подібний_до
    task_entities ||--o{ task_proposals : батьківський_для

    %% Застарілий Домен
    sources ||--o{ tasks : походить
    messages ||--o| tasks : джерело_для
    users ||--o{ tasks : призначено_до
    users ||--o{ tasks : створено_ким

    %% Визначення Таблиць
    users {
        bigint id PK
        string first_name
        string last_name
        string email UK
        string phone UK
        string avatar_url
        boolean is_active
        boolean is_bot
        timestamp created_at
        timestamp updated_at
    }

    telegram_profiles {
        bigint id PK
        bigint telegram_user_id UK
        string first_name
        string last_name
        string language_code
        boolean is_bot
        boolean is_premium
        bigint user_id FK_UK
        bigint source_id FK
        timestamp created_at
        timestamp updated_at
    }

    sources {
        bigint id PK
        string name
        enum type
        jsonb config
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    messages {
        bigint id PK
        string external_message_id
        text content
        timestamp sent_at
        bigint source_id FK
        bigint author_id FK
        bigint telegram_profile_id FK
        string avatar_url
        string classification
        float confidence
        boolean analyzed
        string analysis_status
        jsonb included_in_runs
        bigint topic_id FK
        vector embedding
        float importance_score
        string noise_classification
        jsonb noise_factors
        timestamp created_at
        timestamp updated_at
    }

    topics {
        bigint id PK
        string name UK
        text description
        string icon
        string color
        timestamp created_at
        timestamp updated_at
    }

    topic_versions {
        bigint id PK
        bigint topic_id FK
        int version
        json data
        string created_by
        boolean approved
        timestamp created_at
        timestamp approved_at
    }

    atoms {
        bigint id PK
        enum type
        string title
        text content
        float confidence
        boolean user_approved
        json meta
        vector embedding
        timestamp created_at
        timestamp updated_at
    }

    atom_versions {
        bigint id PK
        bigint atom_id FK
        int version
        json data
        string created_by
        boolean approved
        timestamp created_at
        timestamp approved_at
    }

    topic_atoms {
        bigint topic_id PK_FK
        bigint atom_id PK_FK
        int position
        text note
        timestamp created_at
        timestamp updated_at
    }

    atom_links {
        bigint from_atom_id PK_FK
        bigint to_atom_id PK_FK
        enum link_type
        float strength
        timestamp created_at
        timestamp updated_at
    }

    llm_providers {
        uuid id PK
        text name UK
        enum type
        text base_url
        binary api_key_encrypted
        boolean is_active
        enum validation_status
        text validation_error
        timestamp validated_at
        timestamp created_at
        timestamp updated_at
    }

    agent_configs {
        uuid id PK
        text name UK
        uuid provider_id FK
        text model_name
        text system_prompt
        text description
        float temperature
        int max_tokens
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    task_configs {
        uuid id PK
        text name UK
        text description
        jsonb response_schema
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    agent_task_assignments {
        uuid id PK
        uuid agent_id FK_UK
        uuid task_id FK_UK
        boolean is_active
        timestamp assigned_at
    }

    project_configs {
        uuid id PK
        string name UK
        text description
        jsonb keywords
        jsonb glossary
        jsonb components
        jsonb default_assignee_ids
        bigint pm_user_id FK
        jsonb priority_rules
        string version
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    analysis_runs {
        uuid id PK
        timestamp time_window_start
        timestamp time_window_end
        uuid agent_assignment_id FK
        uuid project_config_id FK
        jsonb config_snapshot
        string trigger_type
        bigint triggered_by_user_id FK
        enum status
        timestamp created_at
        timestamp started_at
        timestamp completed_at
        timestamp closed_at
        int proposals_total
        int proposals_approved
        int proposals_rejected
        int proposals_pending
        int total_messages_in_window
        int messages_after_prefilter
        int batches_created
        int llm_tokens_used
        float cost_estimate
        jsonb error_log
        jsonb accuracy_metrics
    }

    task_proposals {
        uuid id PK
        uuid analysis_run_id FK
        uuid proposed_project_id FK
        uuid proposed_parent_id FK
        uuid similar_task_id FK
        bigint reviewed_by_user_id FK
        string proposed_title
        text proposed_description
        jsonb source_message_ids
        int message_count
        int time_span_seconds
        float confidence
        text reasoning
        enum proposed_priority
        enum proposed_category
        enum llm_recommendation
        enum status
        enum similarity_type
        jsonb proposed_tags
        jsonb proposed_sub_tasks
        jsonb diff_summary
        jsonb project_keywords_matched
        float similarity_score
        float project_classification_confidence
        timestamp created_at
        timestamp reviewed_at
    }

    task_entities {
        uuid id PK
        string title
        text description
        enum status
        enum priority
        enum category
        timestamp created_at
        timestamp updated_at
    }

    classification_experiments {
        bigint id PK
        uuid provider_id FK
        string model_name
        int message_count
        enum status
        jsonb topics_snapshot
        jsonb confusion_matrix
        jsonb classification_results
        float accuracy
        float avg_confidence
        float avg_execution_time_ms
        text error_message
        timestamp created_at
        timestamp updated_at
        timestamp started_at
        timestamp completed_at
    }

    message_ingestion_jobs {
        bigint id PK
        enum source_type
        jsonb source_identifiers
        timestamp time_window_start
        timestamp time_window_end
        enum status
        int messages_fetched
        int messages_stored
        int messages_skipped
        int errors_count
        int current_batch
        int total_batches
        jsonb error_log
        timestamp started_at
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }

    tasks {
        bigint id PK
        string title
        text description
        enum category
        enum priority
        enum status
        bigint source_id FK
        bigint source_message_id FK
        bigint assigned_to FK
        bigint created_by FK
        boolean ai_generated
        jsonb classification_data
        float confidence_score
        timestamp created_at
        timestamp updated_at
    }

    webhook_settings {
        bigint id PK
        string name
        jsonb config
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
```

!!! info "Легенда Діаграми"
    - **PK** = Первинний Ключ
    - **FK** = Зовнішній Ключ
    - **UK** = Унікальне Обмеження
    - **||--o{** = Один-до-Багатьох
    - **||--o|** = Один-до-Одного
    - **}o--o{** = Багато-до-Багатьох (через з'єднувальну таблицю)

---

## Каталог Моделей за Доменами

### Домен Управління Користувачами

| Модель | Призначення | Ключові Функції | Зв'язки |
|-------|---------|--------------|---------------|
| **User** | Основна сутність користувача | Email/телефон унікальні, прапорець бота, статус активності | → telegram_profiles (1:1)<br>→ messages (1:N)<br>→ analysis_runs (1:N)<br>→ task_proposals (1:N)<br>→ project_configs (1:N) |
| **TelegramProfile** | Платформо-специфічні дані користувача | Telegram user ID унікальний, прапорець преміум | → users (N:1)<br>→ sources (N:1) |

### Домен Комунікації

| Модель | Призначення | Ключові Функції | Зв'язки |
|-------|---------|--------------|---------------|
| **Source** | Відстеження походження повідомлень | Type enum (telegram/slack/email/api), JSONB конфіг | → messages (1:N)<br>→ telegram_profiles (1:N)<br>→ tasks (1:N) |
| **Message** | Зберігання сирих повідомлень | Векторні ембедінги (1536 вимірів), фільтрація шуму, класифікація топіків | → sources (N:1)<br>→ users (N:1)<br>→ topics (N:1)<br>→ telegram_profiles (N:1) |
| **MessageIngestionJob** | Відстеження пакетного імпорту | Status enum, лічильники пакетів, логування помилок | Немає |
| **WebhookSettings** | Застарілі налаштування вебхука | JSONB сховище конфігурації | Немає |

### Домен Графа Знань

| Модель | Призначення | Ключові Функції | Зв'язки |
|-------|---------|--------------|---------------|
| **Topic** | Категорії знань | Унікальна назва, автовибір іконки/кольору | → topic_versions (1:N)<br>→ messages (1:N)<br>↔ atoms (M:N через topic_atoms) |
| **TopicVersion** | Версіонування топіків (працюючий) | Незмінні знімки, процес затвердження | → topics (N:1) |
| **Atom** | Одиниці знань | Type enum (7 типів), векторні ембедінги, оцінка впевненості | → atom_versions (1:N)<br>↔ topics (M:N через topic_atoms)<br>↔ atoms (M:N через atom_links) |
| **AtomVersion** | Версіонування атомів (працюючий) | Незмінні знімки, процес затвердження | → atoms (N:1) |
| **TopicAtom** | З'єднувальна таблиця Топік-Атом | Позиційне упорядкування, опціональні примітки | → topics (N:1)<br>→ atoms (N:1) |
| **AtomLink** | Зв'язки Атом-Атом | Link type enum (7 типів), оцінка сили | → atoms (N:1 від)<br>→ atoms (N:1 до) |

### Домен Системи Аналізу

| Модель | Призначення | Ключові Функції | Зв'язки |
|-------|---------|--------------|---------------|
| **LLMProvider** | Управління AI провайдерами | Type enum (ollama/openai), зашифровані API ключі, статус валідації | → agent_configs (1:N)<br>→ classification_experiments (1:N) |
| **AgentConfig** | Конфігурація LLM агента | Назва моделі, системний промпт, температура, максимум токенів | → llm_providers (N:1)<br>→ agent_task_assignments (1:N) |
| **TaskConfig** | Визначення типів завдань | JSONB схема відповіді для валідації | → agent_task_assignments (1:N) |
| **AgentTaskAssignment** | Парування Агент-Завдання | Унікальне обмеження (agent_id, task_id) | → agent_configs (N:1)<br>→ task_configs (N:1)<br>→ analysis_runs (1:N) |
| **ProjectConfig** | Класифікація проєкту | Ключові слова, глосарій, компоненти, правила пріоритету (все JSONB) | → users (N:1 PM)<br>→ analysis_runs (1:N)<br>→ task_proposals (1:N) |
| **AnalysisRun** | Відстеження виконання аналізу | 7-стадійний життєвий цикл, лічильники, відстеження вартості, знімок конфігурації | → agent_task_assignments (N:1)<br>→ project_configs (N:1)<br>→ users (N:1)<br>→ task_proposals (1:N) |
| **TaskProposal** | AI-згенеровані пропозиції завдань | LLM рекомендація enum, виявлення подібності, оцінка впевненості | → analysis_runs (N:1)<br>→ project_configs (N:1)<br>→ task_entities (N:1 подібний)<br>→ task_entities (N:1 батьківський)<br>→ users (N:1 рецензент) |
| **ClassificationExperiment** | Оцінка моделі | Матриця плутанини, метрики точності, результати класифікації | → llm_providers (N:1) |

### Домен Застарілої Системи

| Модель | Призначення | Ключові Функції | Зв'язки |
|-------|---------|--------------|---------------|
| **Task** | Застаріле управління завданнями | Category/priority/status enums, прапорець AI генерації | → sources (N:1)<br>→ messages (N:1)<br>→ users (N:1 призначений)<br>→ users (N:1 створений) |
| **TaskEntity** | Заглушка сутності | Мінімальна реалізація для задоволення FK | → task_proposals (1:N подібний)<br>→ task_proposals (1:N батьківський) |

!!! warning "Статус Таблиць Версіонування"
    Моделі **TopicVersion** та **AtomVersion** визначені та **ПРАЦЮЮТЬ** у кодовій базі. Ці таблиці існують у базі даних і підтримують робочий процес версіонування. Вони не "зламані" чи "відсутні" - це активні функції системи.

---

## Структури Таблиць

### Таблиці Управління Користувачами

#### users

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| first_name | String(100) | NOT NULL | Обов'язкове |
| last_name | String(100) | NULL | Опціональне |
| email | String | NULL, UNIQUE, INDEXED | Опціональне унікальне |
| phone | String(20) | NULL, UNIQUE, INDEXED | Міжнародний формат валідується |
| avatar_url | String(500) | NULL | Опціональне |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| is_bot | Boolean | NOT NULL, DEFAULT false | Прапорець бота |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_users_email (unique), ix_users_phone (unique)
**Валідація:** phone відповідає `^\+?[1-9]\d{1,14}$`

#### telegram_profiles

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| telegram_user_id | BigInteger | NOT NULL, UNIQUE, INDEXED | Telegram ID |
| first_name | String(100) | NOT NULL | Обов'язкове |
| last_name | String(100) | NULL | Опціональне |
| language_code | String(10) | NULL | ISO код мови |
| is_bot | Boolean | NOT NULL, DEFAULT false | Прапорець бота |
| is_premium | Boolean | NOT NULL, DEFAULT false | Статус преміум |
| user_id | Integer | NOT NULL, UNIQUE, FK(users.id) | Зв'язок один-до-одного |
| source_id | Integer | NOT NULL, FK(sources.id) | Джерело повідомлень |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_telegram_profiles_telegram_user_id (unique)
**Обмеження:** UNIQUE(user_id)

### Таблиці Комунікації

#### sources

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| name | String(100) | NOT NULL | Назва джерела |
| type | SourceType | NOT NULL | telegram/slack/email/api |
| config | JSONB | NULL | Специфічний конфіг джерела |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

#### messages

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| external_message_id | String(100) | NOT NULL, INDEXED | ID зовнішньої системи |
| content | Text | NOT NULL | Вміст повідомлення |
| sent_at | DateTime | NOT NULL | Зовнішня часова мітка (без TZ) |
| source_id | Integer | NOT NULL, FK(sources.id) | Джерело повідомлення |
| author_id | Integer | NOT NULL, FK(users.id) | Автор повідомлення |
| telegram_profile_id | Integer | NULL, FK(telegram_profiles.id) | Опціональний Telegram профіль |
| avatar_url | String(500) | NULL | Опціональний аватар |
| classification | String(50) | NULL | AI класифікація |
| confidence | Float | NULL | 0.0-1.0 |
| analyzed | Boolean | NOT NULL, DEFAULT false | Прапорець аналізу |
| analysis_status | String(50) | NULL, DEFAULT 'pending' | pending/analyzed/spam/noise |
| included_in_runs | JSONB | NULL | UUID-и AnalysisRun (список) |
| topic_id | Integer | NULL, INDEXED, FK(topics.id) | Еталонний топік |
| embedding | Vector(1536) | NULL | Вектор семантичного пошуку |
| importance_score | Float | NULL | 0.0-1.0 |
| noise_classification | String(50) | NULL | signal/noise/spam/low_quality/high_quality |
| noise_factors | JSONB | NULL | Оцінки факторів (словник) |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_messages_external_message_id, ix_messages_topic_id

#### message_ingestion_jobs

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| source_type | IngestionStatus | NOT NULL | Enum типу джерела |
| source_identifiers | JSONB | NOT NULL | Специфічні ID джерела |
| time_window_start | DateTime(tz) | NULL | Опціональний час початку |
| time_window_end | DateTime(tz) | NULL | Опціональний час кінця |
| status | IngestionStatus | NOT NULL | pending/running/completed/failed/cancelled |
| messages_fetched | Integer | NOT NULL, DEFAULT 0 | Лічильник отримання |
| messages_stored | Integer | NOT NULL, DEFAULT 0 | Лічильник зберігання |
| messages_skipped | Integer | NOT NULL, DEFAULT 0 | Лічильник пропуску |
| errors_count | Integer | NOT NULL, DEFAULT 0 | Лічильник помилок |
| current_batch | Integer | NOT NULL, DEFAULT 0 | Поточний пакет |
| total_batches | Integer | NULL | Загальна кількість пакетів |
| error_log | JSONB | NULL | Деталі помилок |
| started_at | DateTime(tz) | NULL | Час початку завдання |
| completed_at | DateTime(tz) | NULL | Час завершення завдання |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

### Таблиці Графа Знань

#### topics

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| name | String(100) | NOT NULL, UNIQUE, INDEXED | Назва топіка |
| description | Text | NOT NULL | Опис топіка |
| icon | String(50) | NULL | Ідентифікатор іконки |
| color | String(7) | NULL | Hex колір #RRGGBB |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_topics_name (unique)
**Валідація:** color відповідає hex формату або Tailwind назві

#### topic_versions

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| topic_id | Integer | NOT NULL, INDEXED, FK(topics.id) | Батьківський топік |
| version | Integer | NOT NULL | Номер версії |
| data | JSON | NOT NULL | Незмінний знімок |
| created_by | String(100) | NULL | Ідентифікатор створювача |
| approved | Boolean | NOT NULL, DEFAULT false | Прапорець затвердження |
| created_at | DateTime | NOT NULL | Часова мітка версії |
| approved_at | DateTime | NULL | Часова мітка затвердження |

**Індекси:** ix_topic_versions_topic_id

#### atoms

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| type | String(20) | NOT NULL | AtomType enum (7 типів) |
| title | String(200) | NOT NULL, INDEXED | Заголовок атома |
| content | Text | NOT NULL | Вміст атома |
| confidence | Float | NULL | 0.0-1.0 |
| user_approved | Boolean | NOT NULL, DEFAULT false | Прапорець затвердження |
| meta | JSON | NULL | Структуровані метадані |
| embedding | Vector(1536) | NULL | Вектор семантичного пошуку |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_atoms_title

#### atom_versions

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| atom_id | Integer | NOT NULL, INDEXED, FK(atoms.id) | Батьківський атом |
| version | Integer | NOT NULL | Номер версії |
| data | JSON | NOT NULL | Незмінний знімок |
| created_by | String(100) | NULL | Ідентифікатор створювача |
| approved | Boolean | NOT NULL, DEFAULT false | Прапорець затвердження |
| created_at | DateTime | NOT NULL | Часова мітка версії |
| approved_at | DateTime | NULL | Часова мітка затвердження |

**Індекси:** ix_atom_versions_atom_id

#### topic_atoms (З'єднувальна Таблиця)

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| topic_id | Integer | PK, FK(topics.id) | Складовий PK |
| atom_id | Integer | PK, FK(atoms.id) | Складовий PK |
| position | Integer | NULL | Позиція упорядкування |
| note | Text | NULL | Опціональна примітка |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Первинний Ключ:** (topic_id, atom_id)

#### atom_links (З'єднувальна Таблиця)

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| from_atom_id | Integer | PK, FK(atoms.id) | Складовий PK |
| to_atom_id | Integer | PK, FK(atoms.id) | Складовий PK |
| link_type | String | NOT NULL | LinkType enum (7 типів) |
| strength | Float | NULL | 0.0-1.0 |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Первинний Ключ:** (from_atom_id, to_atom_id)

### Таблиці Системи Аналізу

#### llm_providers

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | Text | NOT NULL, UNIQUE, INDEXED | Назва провайдера |
| type | ProviderType | NOT NULL | ollama/openai |
| base_url | Text | NULL | Базовий URL API |
| api_key_encrypted | LargeBinary | NULL | Зашифрований API ключ |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| validation_status | ValidationStatus | NOT NULL, DEFAULT 'pending' | pending/validating/connected/error |
| validation_error | Text | NULL | Повідомлення помилки |
| validated_at | DateTime(tz) | NULL | Часова мітка валідації |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_llm_providers_name (unique)

#### agent_configs

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | Text | NOT NULL, UNIQUE, INDEXED | Назва агента |
| provider_id | UUID | NOT NULL, FK(llm_providers.id) | LLM провайдер |
| model_name | Text | NOT NULL | Ідентифікатор моделі |
| system_prompt | Text | NOT NULL | Системний промпт |
| description | Text | NULL | Опціональний опис |
| temperature | Float | NULL, DEFAULT 0.7 | 0.0-2.0 |
| max_tokens | Integer | NULL | Ліміт токенів |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_agent_configs_name (unique)

#### task_configs

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | Text | NOT NULL, UNIQUE, INDEXED | Назва завдання |
| description | Text | NULL | Опціональний опис |
| response_schema | JSONB | NOT NULL | JSON Schema для валідації |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_task_configs_name (unique)

#### agent_task_assignments

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| agent_id | UUID | NOT NULL, FK(agent_configs.id) | Конфіг агента |
| task_id | UUID | NOT NULL, FK(task_configs.id) | Конфіг завдання |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| assigned_at | DateTime(tz) | NOT NULL, DEFAULT now() | Часова мітка призначення |

**Обмеження:** UNIQUE(agent_id, task_id) з назвою "uq_agent_task"

#### project_configs

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | String(200) | NOT NULL, UNIQUE, INDEXED | Назва проєкту |
| description | Text | NOT NULL | Опис проєкту |
| keywords | JSONB | NOT NULL | Ключові слова класифікації (список) |
| glossary | JSONB | NOT NULL | Доменна термінологія (словник) |
| components | JSONB | NOT NULL | Компоненти/модулі (список[словник]) |
| default_assignee_ids | JSONB | NOT NULL | Призначені за замовчуванням (список[int]) |
| pm_user_id | Integer | NOT NULL, FK(users.id) | Менеджер проєкту |
| priority_rules | JSONB | NOT NULL | Правила пріоритету (словник) |
| version | String(50) | NOT NULL | Версія конфігу |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

**Індекси:** ix_project_configs_name (unique)

#### analysis_runs

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| time_window_start | DateTime(tz) | NULL | Початок вікна аналізу |
| time_window_end | DateTime(tz) | NULL | Кінець вікна аналізу |
| agent_assignment_id | UUID | NOT NULL, FK(agent_task_assignments.id) | Пара Агент-Завдання |
| project_config_id | UUID | NULL, FK(project_configs.id) | Опціональний проєкт |
| config_snapshot | JSONB | NOT NULL | Повний конфіг на момент виконання |
| trigger_type | String(50) | NOT NULL | Механізм тригера |
| triggered_by_user_id | Integer | NULL, FK(users.id) | Опціональний користувач |
| status | String(50) | NOT NULL, DEFAULT 'pending' | pending/running/completed/reviewed/closed/failed/cancelled |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| started_at | DateTime(tz) | NULL | Час початку виконання |
| completed_at | DateTime(tz) | NULL | Час завершення виконання |
| closed_at | DateTime(tz) | NULL | Час закриття виконання |
| proposals_total | Integer | NOT NULL, DEFAULT 0 | Загальна кількість пропозицій |
| proposals_approved | Integer | NOT NULL, DEFAULT 0 | Кількість затверджених |
| proposals_rejected | Integer | NOT NULL, DEFAULT 0 | Кількість відхилених |
| proposals_pending | Integer | NOT NULL, DEFAULT 0 | Кількість очікуючих |
| total_messages_in_window | Integer | NOT NULL, DEFAULT 0 | Кількість повідомлень |
| messages_after_prefilter | Integer | NOT NULL, DEFAULT 0 | Кількість після фільтру |
| batches_created | Integer | NOT NULL, DEFAULT 0 | Кількість пакетів |
| llm_tokens_used | Integer | NOT NULL, DEFAULT 0 | Використання токенів |
| cost_estimate | Float | NOT NULL, DEFAULT 0.0 | Оцінка вартості |
| error_log | JSONB | NULL | Деталі помилок |
| accuracy_metrics | JSONB | NULL | Метрики точності |

#### task_proposals

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| analysis_run_id | UUID | NOT NULL, FK(analysis_runs.id) | Батьківське виконання |
| proposed_project_id | UUID | NULL, FK(project_configs.id) | Опціональний проєкт |
| proposed_parent_id | UUID | NULL, FK(task_entities.id) | Батьківське завдання |
| similar_task_id | UUID | NULL, FK(task_entities.id) | Подібне завдання |
| reviewed_by_user_id | Integer | NULL, FK(users.id) | Рецензент |
| proposed_title | String(500) | NOT NULL | Запропонований заголовок |
| proposed_description | Text | NOT NULL | Запропонований опис |
| source_message_ids | JSONB | NOT NULL | ID повідомлень (список) |
| message_count | Integer | NOT NULL | Кількість повідомлень |
| time_span_seconds | Integer | NOT NULL | Часовий проміжок |
| confidence | Float | NOT NULL | 0.0-1.0 |
| reasoning | Text | NOT NULL | Міркування LLM |
| proposed_priority | TaskPriority | NOT NULL | low/medium/high/critical |
| proposed_category | TaskCategory | NOT NULL | bug/feature/improvement/question/chore |
| llm_recommendation | LLMRecommendation | NOT NULL | new_task/update_existing/merge/reject |
| status | ProposalStatus | NOT NULL | pending/approved/rejected/merged |
| similarity_type | SimilarityType | NOT NULL | exact_messages/semantic/none |
| proposed_tags | JSONB | NOT NULL | Теги (список) |
| proposed_sub_tasks | JSONB | NOT NULL | Підзавдання (список[словник]) |
| diff_summary | JSONB | NULL | Деталі різниці |
| project_keywords_matched | JSONB | NOT NULL | Співпадаючі ключові слова (список) |
| similarity_score | Float | NULL | 0.0-1.0 |
| project_classification_confidence | Float | NOT NULL | 0.0-1.0 |
| created_at | DateTime(tz) | NOT NULL, DEFAULT now() | Часова мітка сервера |
| reviewed_at | DateTime(tz) | NULL | Часова мітка рецензування |

#### classification_experiments

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| provider_id | UUID | NOT NULL, FK(llm_providers.id) | LLM провайдер |
| model_name | String(100) | NOT NULL | Ідентифікатор моделі |
| message_count | Integer | NOT NULL | Кількість повідомлень |
| status | ExperimentStatus | NOT NULL | pending/running/completed/failed |
| topics_snapshot | JSONB | NOT NULL | Топіки на момент експерименту |
| confusion_matrix | JSONB | NULL | Матриця плутанини |
| classification_results | JSONB | NOT NULL | Детальні результати (список[словник]) |
| accuracy | Float | NULL | 0.0-1.0 |
| avg_confidence | Float | NULL | 0.0-1.0 |
| avg_execution_time_ms | Float | NULL | Середній час |
| error_message | Text | NULL | Повідомлення помилки |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |
| started_at | DateTime(tz) | NULL | Початок експерименту |
| completed_at | DateTime(tz) | NULL | Завершення експерименту |

### Таблиці Застарілої Системи

#### tasks

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| title | String(200) | NOT NULL | Заголовок завдання |
| description | Text | NOT NULL | Опис завдання |
| category | TaskCategory | NOT NULL | bug/feature/improvement/question/chore |
| priority | TaskPriority | NOT NULL | low/medium/high/critical |
| status | TaskStatus | NOT NULL | open/in_progress/completed/closed |
| source_id | Integer | NOT NULL, FK(sources.id) | Джерело повідомлення |
| source_message_id | Integer | NULL, FK(messages.id) | Опціональне вихідне повідомлення |
| assigned_to | Integer | NULL, FK(users.id) | Опціональний призначений |
| created_by | Integer | NULL, FK(users.id) | Опціональний створювач |
| ai_generated | Boolean | NOT NULL, DEFAULT false | Прапорець AI генерації |
| classification_data | JSONB | NULL | Дані класифікації |
| confidence_score | Float | NULL | 0.0-1.0 |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

#### task_entities

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| title | String(500) | NOT NULL | Заголовок завдання |
| description | Text | NOT NULL | Опис завдання |
| status | TaskStatus | NOT NULL | open/in_progress/completed/closed |
| priority | TaskPriority | NOT NULL | low/medium/high/critical |
| category | TaskCategory | NOT NULL | bug/feature/improvement/question/chore |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

#### webhook_settings

| Поле | Тип | Обмеження | Примітки |
|-------|------|-------------|-------|
| id | BigInteger | PK | Автоінкремент |
| name | String(100) | NOT NULL | Назва налаштування |
| config | JSONB | NOT NULL | Дані конфігурації |
| is_active | Boolean | NOT NULL, DEFAULT true | Статус активності |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Часова мітка сервера |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Автооновлення |

---

## Підсумок Зв'язків

### Один-до-Одного (1:1)

| Батьківський | Дочірній | Через Поле | Обмеження |
|--------|-------|-----------|------------|
| users | telegram_profiles | user_id | UNIQUE(user_id) |
| messages | tasks | source_message_id | Опціональне |

### Один-до-Багатьох (1:N)

| Батьківський | Дочірній | Через Поле | Опціональне |
|--------|-------|-----------|----------|
| users | messages | author_id | Ні |
| users | analysis_runs | triggered_by_user_id | Так |
| users | task_proposals | reviewed_by_user_id | Так |
| users | project_configs | pm_user_id | Ні |
| users | tasks | assigned_to | Так |
| users | tasks | created_by | Так |
| sources | messages | source_id | Ні |
| sources | telegram_profiles | source_id | Ні |
| sources | tasks | source_id | Ні |
| topics | topic_versions | topic_id | Ні |
| topics | messages | topic_id | Так |
| atoms | atom_versions | atom_id | Ні |
| llm_providers | agent_configs | provider_id | Ні |
| llm_providers | classification_experiments | provider_id | Ні |
| agent_configs | agent_task_assignments | agent_id | Ні |
| task_configs | agent_task_assignments | task_id | Ні |
| agent_task_assignments | analysis_runs | agent_assignment_id | Ні |
| project_configs | analysis_runs | project_config_id | Так |
| project_configs | task_proposals | proposed_project_id | Так |
| analysis_runs | task_proposals | analysis_run_id | Ні |
| task_entities | task_proposals | similar_task_id | Так |
| task_entities | task_proposals | proposed_parent_id | Так |
| messages | tasks | source_message_id | Так |

### Багато-до-Багатьох (M:N)

| Ліва Сутність | Права Сутність | З'єднувальна Таблиця | Додаткові Поля |
|-------------|--------------|----------------|-------------------|
| topics | atoms | topic_atoms | position (int), note (text) |
| atoms | atoms | atom_links | link_type (enum), strength (float) |

**Примітка:** agent_task_assignments діє як з'єднувальна таблиця для агентів і завдань, але також має свої власні зв'язки з analysis_runs.

---

## Стратегія Первинних Ключів

### BigInteger (Автоінкремент)

**Використовується для високонавантажених, послідовних сутностей:**

- users
- telegram_profiles
- sources
- messages
- topics
- topic_versions
- atoms
- atom_versions
- tasks
- message_ingestion_jobs
- classification_experiments
- webhook_settings

**Обґрунтування:** Масштабованість для високонавантажених даних, ефективне індексування, проста послідовна обробка.

### UUID (Версія 4)

**Використовується для сутностей розподіленої системи:**

- llm_providers
- agent_configs
- task_configs
- agent_task_assignments
- project_configs
- analysis_runs
- task_proposals
- task_entities

**Обґрунтування:** Відсутність ризику колізій у розподілених системах, глобально унікальні, підходять для сутностей конфігурації/аналізу.

### Складові Первинні Ключі

**Використовуються для з'єднувальних таблиць:**

| Таблиця | Первинний Ключ | Призначення |
|-------|-------------|---------|
| topic_atoms | (topic_id, atom_id) | Багато-до-багатьох: topics ↔ atoms |
| atom_links | (from_atom_id, to_atom_id) | Багато-до-багатьох: atoms ↔ atoms |

**Обґрунтування:** Природні складові ключі для зв'язків багато-до-багатьох, запобігає дублікатам, ефективні з'єднання.

---

## Спеціальні Функції

### Векторний Пошук (pgvector)

**Розмірність:** 1536 (стандарт OpenAI embedding)

| Таблиця | Поле | Призначення |
|-------|-------|---------|
| messages | embedding | Семантичний пошук повідомлень |
| atoms | embedding | Семантичний пошук знань |

**Реалізація:** Розширення PostgreSQL pgvector з індексуванням HNSW для пошуку швидше 200мс.

### JSONB Структуроване Сховище

| Таблиця | Поле | Тип | Призначення |
|-------|-------|------|---------|
| sources | config | dict | Специфічна конфігурація джерела |
| messages | included_in_runs | list[str] | UUID-и AnalysisRun |
| messages | noise_factors | dict[str, float] | Фактори оцінки шуму |
| atoms | meta | dict | Додаткові структуровані метадані |
| message_ingestion_jobs | source_identifiers | dict | Специфічні ідентифікатори джерела |
| message_ingestion_jobs | error_log | dict | Деталі помилок |
| task_configs | response_schema | dict | Валідація JSON Schema |
| project_configs | keywords | list[str] | Ключові слова класифікації |
| project_configs | glossary | dict | Доменна термінологія |
| project_configs | components | list[dict] | Компоненти/модулі |
| project_configs | default_assignee_ids | list[int] | Призначені за замовчуванням |
| project_configs | priority_rules | dict | Правила пріоритету |
| analysis_runs | config_snapshot | dict | Повний знімок конфігу |
| analysis_runs | error_log | dict | Деталі помилок виконання |
| analysis_runs | accuracy_metrics | dict | Метрики точності |
| task_proposals | proposed_tags | list[str] | Запропоновані теги |
| task_proposals | proposed_sub_tasks | list[dict] | Пропозиції підзавдань |
| task_proposals | diff_summary | dict | Деталі різниці |
| task_proposals | project_keywords_matched | list[str] | Співпадаючі ключові слова |
| classification_experiments | topics_snapshot | dict | Знімок топіків |
| classification_experiments | confusion_matrix | dict | Матриця плутанини |
| classification_experiments | classification_results | list[dict] | Детальні результати |

### Обробка Часових Зон

**Усі часові мітки** використовують `DateTime(timezone=True)` з `server_default=func.now()`:

- created_at
- updated_at
- started_at
- completed_at
- closed_at
- validated_at
- assigned_at
- reviewed_at
- time_window_start
- time_window_end

**Виняток:** messages.sent_at використовує DateTime без часової зони (зовнішня часова мітка з системи джерела).

### Патерни Валідації

| Модель | Поле | Валідація |
|-------|-------|------------|
| users | phone | Міжнародний формат: `^\+?[1-9]\d{1,14}$` |
| topics | color | Hex формат `#RRGGBB` або Tailwind назва → hex конвертація |
| atoms | type | Enum: problem/solution/decision/question/insight/pattern/requirement |
| atom_links | link_type | Enum: continues/solves/contradicts/supports/refines/relates_to/depends_on |
| messages | confidence | Діапазон: 0.0-1.0 |
| messages | importance_score | Діапазон: 0.0-1.0 |
| task_proposals | confidence | Діапазон: 0.0-1.0 |
| task_proposals | similarity_score | Діапазон: 0.0-1.0 |

### Зашифровані Поля

| Таблиця | Поле | Метод Шифрування |
|-------|-------|-------------------|
| llm_providers | api_key_encrypted | LargeBinary (шифрування на рівні додатку) |

---

## Історія Міграцій

### Застосовані Міграції

| Міграція | Дата | Зміни |
|-----------|------|---------|
| d510922791ac | 2025-10-18 21:15:54 | Початкова міграція: 20 таблиць, 11 індексів, 8 enum |
| 4c301ba5595c | 2025-10-18 21:30:22 | Виправлення часової зони: часові мітки message_ingestion_jobs |

### Статистика Бази Даних

- **Загальна Кількість Моделей:** 21
- **Загальна Кількість Зв'язків:** 45+
- **Індекси:** 11 унікальних, множинні індекси зовнішніх ключів
- **Enums:** 12 типів
- **З'єднувальні Таблиці:** 2 (topic_atoms, atom_links)
- **Векторні Поля:** 2 (messages.embedding, atoms.embedding)

---

## Пов'язана Документація

- [Огляд Архітектури Системи](overview.md) - Архітектура високого рівня
- [Система Аналізу](analysis-system.md) - Деталі робочого процесу аналізу
- [Вилучення Знань](knowledge-extraction.md) - Вилучення топіків та атомів
- [Векторна База Даних](vector-database.md) - Реалізація семантичного пошуку

---

*Останнє оновлення: 26 жовтня 2025 - Вичерпна документація схеми бази даних*
