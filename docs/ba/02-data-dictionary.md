# Data Dictionary

**Продукт:** Pulse Radar
**Статус:** 🟢 Approved
**Дата:** 2025-12-11

---

## Purpose

Централізований reference для всіх data entities, полів та їх семантики.

---

## Message

**Table:** `messages`
**Description:** Вхідні повідомлення з Telegram

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | uuid4() | Primary key |
| `external_id` | String | Yes | null | Telegram message ID |
| `content` | Text | No | - | Message text |
| `author` | String(100) | Yes | null | Author name/username |
| `channel` | String(100) | Yes | null | Telegram channel name |
| `timestamp` | DateTime | No | now() | Message timestamp |
| `importance_score` | Float | Yes | null | Scoring result (0.0-1.0) |
| `classification` | String | Yes | null | noise / weak_signal / signal |
| `analysis_status` | String | No | "pending" | pending / analyzed / spam / noise |
| `embedding` | Vector(1536) | Yes | null | OpenAI embedding |
| `meta` | JSON | Yes | null | Extra metadata |
| `created_at` | DateTime | No | now() | Record creation |
| `updated_at` | DateTime | No | now() | Last update |

### Classification Values

| Value | Score Range | Description |
|-------|-------------|-------------|
| `noise` | 0.0 - 0.3 | Low value, excluded from analysis |
| `weak_signal` | 0.3 - 0.7 | Medium value, needs human review |
| `signal` | 0.7 - 1.0 | High value, priority processing |

### Analysis Status Values

| Value | Description |
|-------|-------------|
| `pending` | Not yet processed |
| `analyzed` | AI extraction complete |
| `spam` | Marked as spam |
| `noise` | Confirmed noise |

---

## Atom

**Table:** `atoms`
**Description:** Структуровані одиниці знань (Zettelkasten)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | uuid4() | Primary key |
| `type` | String(20) | No | - | Atom type (see enum) |
| `title` | String(200) | No | - | Brief title |
| `content` | Text | No | - | Full content |
| `confidence` | Float | Yes | null | AI confidence (0.0-1.0) |
| `user_approved` | Boolean | No | false | Human approval flag |
| `archived` | Boolean | No | false | Archived flag |
| `archived_at` | DateTime | Yes | null | Archive timestamp |
| `embedding` | Vector(1536) | Yes | null | OpenAI embedding |
| `meta` | JSON | Yes | null | Extra metadata (tags, sources) |
| `created_at` | DateTime | No | now() | Record creation |
| `updated_at` | DateTime | No | now() | Last update |

### AtomType Enum

| Value | Description | Example |
|-------|-------------|---------|
| `problem` | Issue or blocker | "Auth not working on staging" |
| `solution` | Solution to problem | "Fixed by adding timeout" |
| `decision` | Made decision | "Using PostgreSQL" |
| `question` | Question needing answer | "What date format?" |
| `insight` | Useful observation | "Most errors from mobile" |
| `pattern` | Recurring pattern | "Fails every Monday morning" |
| `requirement` | Requirement | "Need 2FA support" |

### Status Combinations

| user_approved | archived | Effective Status |
|---------------|----------|------------------|
| false | false | PENDING REVIEW |
| true | false | APPROVED |
| false | true | REJECTED |
| true | true | ARCHIVED |

---

## Topic

**Table:** `topics`
**Description:** Тематичні контейнери для групування

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | uuid4() | Primary key |
| `name` | String(100) | No | - | Topic name |
| `description` | Text | Yes | null | Description |
| `icon` | String(50) | Yes | null | Lucide icon name |
| `color` | String(7) | Yes | null | Hex color (#RRGGBB) |
| `keywords` | Array[String] | Yes | [] | Auto-mapping keywords |
| `created_at` | DateTime | No | now() | Record creation |
| `updated_at` | DateTime | No | now() | Last update |

---

## LLMProvider

**Table:** `llm_providers`
**Description:** LLM service providers

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | uuid4() | Primary key |
| `name` | String(100) | No | - | Provider name |
| `type` | String(20) | No | - | openai / ollama |
| `api_key_encrypted` | Text | Yes | null | Fernet-encrypted API key |
| `base_url` | String(255) | Yes | null | Ollama base URL |
| `model` | String(50) | No | - | Model name (gpt-4, llama2) |
| `is_default` | Boolean | No | false | Default provider flag |
| `validation_status` | String | No | "pending" | Connection status |
| `last_validated_at` | DateTime | Yes | null | Last validation time |
| `created_at` | DateTime | No | now() | Record creation |
| `updated_at` | DateTime | No | now() | Last update |

### Validation Status Values

| Value | Description |
|-------|-------------|
| `pending` | Not yet validated |
| `validating` | Validation in progress |
| `connected` | Successfully connected |
| `error` | Connection failed |

---

## AnalysisRun

**Table:** `analysis_runs`
**Description:** AI extraction runs

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | uuid4() | Primary key |
| `status` | String | No | "pending" | Run status |
| `provider_id` | UUID | Yes | null | FK to llm_providers |
| `messages_count` | Integer | No | 0 | Input message count |
| `atoms_created` | Integer | No | 0 | Output atom count |
| `started_at` | DateTime | Yes | null | Run start time |
| `completed_at` | DateTime | Yes | null | Run completion time |
| `error_message` | Text | Yes | null | Error details |
| `created_at` | DateTime | No | now() | Record creation |

### Status Values

| Value | Description |
|-------|-------------|
| `pending` | Waiting to start |
| `queued` | In task queue |
| `running` | Processing |
| `completed` | Successfully finished |
| `failed` | Error occurred |
| `cancelled` | Manually cancelled |
| `timeout` | Exceeded time limit |

---

## Relationships

### Many-to-Many Tables

**atom_topics:**
| Field | Type | Description |
|-------|------|-------------|
| `atom_id` | UUID | FK to atoms |
| `topic_id` | UUID | FK to topics |

**message_topics:**
| Field | Type | Description |
|-------|------|-------------|
| `message_id` | UUID | FK to messages |
| `topic_id` | UUID | FK to topics |

**message_atoms:**
| Field | Type | Description |
|-------|------|-------------|
| `message_id` | UUID | FK to messages |
| `atom_id` | UUID | FK to atoms |

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   Message   │──────<│  message_atoms  │>──────│    Atom     │
└──────┬──────┘       └─────────────────┘       └──────┬──────┘
       │                                               │
       │              ┌─────────────────┐              │
       └─────────────<│ message_topics  │              │
                      └────────┬────────┘              │
                               │                       │
                               ▼                       │
                        ┌─────────────┐                │
                        │    Topic    │<───────────────┘
                        └─────────────┘    atom_topics


┌──────────────┐              ┌───────────────┐
│ LLMProvider  │<─────────────│  AnalysisRun  │
└──────────────┘   provider_id└───────────────┘
```

---

## Indexes

### Messages
- `ix_messages_id` (Primary)
- `ix_messages_classification` (Filter)
- `ix_messages_importance_score` (Range queries)
- `ix_messages_timestamp` (Date range)
- `ix_messages_analysis_status` (Filter)

### Atoms
- `ix_atoms_id` (Primary)
- `ix_atoms_type` (Filter)
- `ix_atoms_title` (Search)
- `ix_atoms_user_approved` (Filter)
- `ix_atoms_archived` (Filter)

### Topics
- `ix_topics_id` (Primary)
- `ix_topics_name` (Search)

---

## Constraints

### Business Constraints

| Entity | Constraint | Description |
|--------|------------|-------------|
| Message | importance_score 0-1 | CHECK (importance_score >= 0 AND importance_score <= 1) |
| Atom | confidence 0-1 | CHECK (confidence >= 0 AND confidence <= 1) |
| Atom | title max 200 | VARCHAR(200) |
| Topic | color hex format | Regex ^#[0-9A-Fa-f]{6}$ |

### Referential Integrity

| FK | On Delete | Rationale |
|----|-----------|-----------|
| atom_topics.atom_id | CASCADE | Delete links when atom deleted |
| atom_topics.topic_id | CASCADE | Delete links when topic deleted |
| message_atoms.message_id | CASCADE | Keep atoms, delete links |
| analysis_runs.provider_id | SET NULL | Preserve history |

---

**Related:** [Glossary](./02-glossary.md) | [Business Rules](./04-requirements/business-rules.md)
