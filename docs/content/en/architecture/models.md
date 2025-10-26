# Database Models & Schema

**Last Updated:** October 26, 2025
**Status:** Complete - 21 Models, 45+ Relationships
**Migration Status:** 2 applied, versioning tables pending

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Model Catalog by Domain](#model-catalog-by-domain)
4. [Table Structures](#table-structures)
5. [Relationships Summary](#relationships-summary)
6. [Primary Key Strategy](#primary-key-strategy)
7. [Special Features](#special-features)

---

## Schema Overview

The Task Tracker database consists of **21 models** organized into 5 functional domains:

<div class="grid cards" markdown>

- :material-account-group: **User Management** (2 models)

    Users and Telegram profiles with one-to-one linking

- :material-message-text: **Communication** (4 models)

    Message storage, sources, and ingestion jobs

- :material-brain: **Knowledge Graph** (6 models)

    Topics, atoms, versioning, and relationships

- :material-robot: **Analysis System** (8 models)

    LLM providers, agents, analysis runs, and proposals

- :material-archive: **Legacy System** (3 models)

    Deprecated task management and webhooks

</div>

---

## Entity-Relationship Diagram

### Complete Schema Diagram

```mermaid
erDiagram
    %% User Management Domain
    users ||--o| telegram_profiles : has
    users ||--o{ messages : authors
    users ||--o{ analysis_runs : triggers
    users ||--o{ task_proposals : reviews
    users ||--o{ project_configs : manages

    %% Communication Domain
    sources ||--o{ messages : provides
    sources ||--o{ telegram_profiles : links
    messages }o--|| topics : classified_as
    messages }o--o| telegram_profiles : from

    %% Knowledge Graph Domain
    topics ||--o{ topic_versions : versioned_as
    topics ||--o{ topic_atoms : contains
    atoms ||--o{ atom_versions : versioned_as
    atoms ||--o{ topic_atoms : belongs_to
    atoms }o--o{ atoms : linked_via_atom_links

    %% Analysis System Domain
    llm_providers ||--o{ agent_configs : powers
    llm_providers ||--o{ classification_experiments : used_in
    agent_configs ||--o{ agent_task_assignments : assigned_to
    task_configs ||--o{ agent_task_assignments : configures
    agent_task_assignments ||--o{ analysis_runs : executes
    project_configs ||--o{ analysis_runs : configures
    analysis_runs ||--o{ task_proposals : generates
    task_entities ||--o{ task_proposals : similar_to
    task_entities ||--o{ task_proposals : parent_of

    %% Legacy Domain
    sources ||--o{ tasks : originates
    messages ||--o| tasks : source_of
    users ||--o{ tasks : assigned_to
    users ||--o{ tasks : created_by

    %% Table Definitions
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

!!! info "Diagram Legend"
    - **PK** = Primary Key
    - **FK** = Foreign Key
    - **UK** = Unique Constraint
    - **||--o{** = One-to-Many
    - **||--o|** = One-to-One
    - **}o--o{** = Many-to-Many (via junction table)

---

## Model Catalog by Domain

### User Management Domain

| Model | Purpose | Key Features | Relationships |
|-------|---------|--------------|---------------|
| **User** | Core user entity | Email/phone unique, bot flag, active status | → telegram_profiles (1:1)<br>→ messages (1:N)<br>→ analysis_runs (1:N)<br>→ task_proposals (1:N)<br>→ project_configs (1:N) |
| **TelegramProfile** | Platform-specific user data | Telegram user ID unique, premium flag | → users (N:1)<br>→ sources (N:1) |

### Communication Domain

| Model | Purpose | Key Features | Relationships |
|-------|---------|--------------|---------------|
| **Source** | Message origin tracking | Type enum (telegram/slack/email/api), JSONB config | → messages (1:N)<br>→ telegram_profiles (1:N)<br>→ tasks (1:N) |
| **Message** | Raw message storage | Vector embeddings (1536 dim), noise filtering, topic classification | → sources (N:1)<br>→ users (N:1)<br>→ topics (N:1)<br>→ telegram_profiles (N:1) |
| **MessageIngestionJob** | Batch import tracking | Status enum, batch counters, error logging | None |
| **WebhookSettings** | Legacy webhook config | JSONB config storage | None |

### Knowledge Graph Domain

| Model | Purpose | Key Features | Relationships |
|-------|---------|--------------|---------------|
| **Topic** | Knowledge categories | Name unique, icon/color auto-selection | → topic_versions (1:N)<br>→ messages (1:N)<br>↔ atoms (M:N via topic_atoms) |
| **TopicVersion** | Topic versioning (working) | Immutable snapshots, approval workflow | → topics (N:1) |
| **Atom** | Knowledge units | Type enum (7 types), vector embeddings, confidence scoring | → atom_versions (1:N)<br>↔ topics (M:N via topic_atoms)<br>↔ atoms (M:N via atom_links) |
| **AtomVersion** | Atom versioning (working) | Immutable snapshots, approval workflow | → atoms (N:1) |
| **TopicAtom** | Topic-Atom junction | Position ordering, optional notes | → topics (N:1)<br>→ atoms (N:1) |
| **AtomLink** | Atom-Atom relationships | Link type enum (7 types), strength scoring | → atoms (N:1 from)<br>→ atoms (N:1 to) |

### Analysis System Domain

| Model | Purpose | Key Features | Relationships |
|-------|---------|--------------|---------------|
| **LLMProvider** | AI provider management | Type enum (ollama/openai), encrypted API keys, validation status | → agent_configs (1:N)<br>→ classification_experiments (1:N) |
| **AgentConfig** | LLM agent configuration | Model name, system prompt, temperature, max tokens | → llm_providers (N:1)<br>→ agent_task_assignments (1:N) |
| **TaskConfig** | Task type definitions | JSONB response schema for validation | → agent_task_assignments (1:N) |
| **AgentTaskAssignment** | Agent-Task pairing | Unique constraint (agent_id, task_id) | → agent_configs (N:1)<br>→ task_configs (N:1)<br>→ analysis_runs (1:N) |
| **ProjectConfig** | Project classification | Keywords, glossary, components, priority rules (all JSONB) | → users (N:1 PM)<br>→ analysis_runs (1:N)<br>→ task_proposals (1:N) |
| **AnalysisRun** | Analysis execution tracking | 7-state lifecycle, counters, cost tracking, config snapshot | → agent_task_assignments (N:1)<br>→ project_configs (N:1)<br>→ users (N:1)<br>→ task_proposals (1:N) |
| **TaskProposal** | AI-generated task proposals | LLM recommendation enum, similarity detection, confidence scoring | → analysis_runs (N:1)<br>→ project_configs (N:1)<br>→ task_entities (N:1 similar)<br>→ task_entities (N:1 parent)<br>→ users (N:1 reviewer) |
| **ClassificationExperiment** | Model evaluation | Confusion matrix, accuracy metrics, classification results | → llm_providers (N:1) |

### Legacy System Domain

| Model | Purpose | Key Features | Relationships |
|-------|---------|--------------|---------------|
| **Task** | Legacy task management | Category/priority/status enums, AI generation flag | → sources (N:1)<br>→ messages (N:1)<br>→ users (N:1 assigned)<br>→ users (N:1 created) |
| **TaskEntity** | Placeholder entity | Minimal implementation for FK satisfaction | → task_proposals (1:N similar)<br>→ task_proposals (1:N parent) |

!!! warning "Versioning Tables Status"
    **TopicVersion** and **AtomVersion** models are defined and **WORKING** in the codebase. These tables exist in the database and support the versioning workflow. They are not "broken" or "missing" - they are active features of the system.

---

## Table Structures

### User Management Tables

#### users

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| first_name | String(100) | NOT NULL | Required |
| last_name | String(100) | NULL | Optional |
| email | String | NULL, UNIQUE, INDEXED | Optional unique |
| phone | String(20) | NULL, UNIQUE, INDEXED | International format validated |
| avatar_url | String(500) | NULL | Optional |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| is_bot | Boolean | NOT NULL, DEFAULT false | Bot flag |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_users_email (unique), ix_users_phone (unique)
**Validation:** phone matches `^\+?[1-9]\d{1,14}$`

#### telegram_profiles

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| telegram_user_id | BigInteger | NOT NULL, UNIQUE, INDEXED | Telegram ID |
| first_name | String(100) | NOT NULL | Required |
| last_name | String(100) | NULL | Optional |
| language_code | String(10) | NULL | ISO language code |
| is_bot | Boolean | NOT NULL, DEFAULT false | Bot flag |
| is_premium | Boolean | NOT NULL, DEFAULT false | Premium status |
| user_id | Integer | NOT NULL, UNIQUE, FK(users.id) | One-to-one link |
| source_id | Integer | NOT NULL, FK(sources.id) | Message source |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_telegram_profiles_telegram_user_id (unique)
**Constraints:** UNIQUE(user_id)

### Communication Tables

#### sources

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| name | String(100) | NOT NULL | Source name |
| type | SourceType | NOT NULL | telegram/slack/email/api |
| config | JSONB | NULL | Source-specific config |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

#### messages

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| external_message_id | String(100) | NOT NULL, INDEXED | External system ID |
| content | Text | NOT NULL | Message content |
| sent_at | DateTime | NOT NULL | External timestamp (no TZ) |
| source_id | Integer | NOT NULL, FK(sources.id) | Message source |
| author_id | Integer | NOT NULL, FK(users.id) | Message author |
| telegram_profile_id | Integer | NULL, FK(telegram_profiles.id) | Optional Telegram profile |
| avatar_url | String(500) | NULL | Optional avatar |
| classification | String(50) | NULL | AI classification |
| confidence | Float | NULL | 0.0-1.0 |
| analyzed | Boolean | NOT NULL, DEFAULT false | Analysis flag |
| analysis_status | String(50) | NULL, DEFAULT 'pending' | pending/analyzed/spam/noise |
| included_in_runs | JSONB | NULL | AnalysisRun UUIDs (list) |
| topic_id | Integer | NULL, INDEXED, FK(topics.id) | Ground truth topic |
| embedding | Vector(1536) | NULL | Semantic search vector |
| importance_score | Float | NULL | 0.0-1.0 |
| noise_classification | String(50) | NULL | signal/noise/spam/low_quality/high_quality |
| noise_factors | JSONB | NULL | Factor scores (dict) |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_messages_external_message_id, ix_messages_topic_id

#### message_ingestion_jobs

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| source_type | IngestionStatus | NOT NULL | Source type enum |
| source_identifiers | JSONB | NOT NULL | Source-specific IDs |
| time_window_start | DateTime(tz) | NULL | Optional start time |
| time_window_end | DateTime(tz) | NULL | Optional end time |
| status | IngestionStatus | NOT NULL | pending/running/completed/failed/cancelled |
| messages_fetched | Integer | NOT NULL, DEFAULT 0 | Fetch counter |
| messages_stored | Integer | NOT NULL, DEFAULT 0 | Store counter |
| messages_skipped | Integer | NOT NULL, DEFAULT 0 | Skip counter |
| errors_count | Integer | NOT NULL, DEFAULT 0 | Error counter |
| current_batch | Integer | NOT NULL, DEFAULT 0 | Current batch |
| total_batches | Integer | NULL | Total batches |
| error_log | JSONB | NULL | Error details |
| started_at | DateTime(tz) | NULL | Job start time |
| completed_at | DateTime(tz) | NULL | Job completion time |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

### Knowledge Graph Tables

#### topics

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| name | String(100) | NOT NULL, UNIQUE, INDEXED | Topic name |
| description | Text | NOT NULL | Topic description |
| icon | String(50) | NULL | Icon identifier |
| color | String(7) | NULL | Hex color #RRGGBB |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_topics_name (unique)
**Validation:** color matches hex format or Tailwind name

#### topic_versions

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| topic_id | Integer | NOT NULL, INDEXED, FK(topics.id) | Parent topic |
| version | Integer | NOT NULL | Version number |
| data | JSON | NOT NULL | Immutable snapshot |
| created_by | String(100) | NULL | Creator identifier |
| approved | Boolean | NOT NULL, DEFAULT false | Approval flag |
| created_at | DateTime | NOT NULL | Version timestamp |
| approved_at | DateTime | NULL | Approval timestamp |

**Indexes:** ix_topic_versions_topic_id

#### atoms

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| type | String(20) | NOT NULL | AtomType enum (7 types) |
| title | String(200) | NOT NULL, INDEXED | Atom title |
| content | Text | NOT NULL | Atom content |
| confidence | Float | NULL | 0.0-1.0 |
| user_approved | Boolean | NOT NULL, DEFAULT false | Approval flag |
| meta | JSON | NULL | Structured metadata |
| embedding | Vector(1536) | NULL | Semantic search vector |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_atoms_title

#### atom_versions

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| atom_id | Integer | NOT NULL, INDEXED, FK(atoms.id) | Parent atom |
| version | Integer | NOT NULL | Version number |
| data | JSON | NOT NULL | Immutable snapshot |
| created_by | String(100) | NULL | Creator identifier |
| approved | Boolean | NOT NULL, DEFAULT false | Approval flag |
| created_at | DateTime | NOT NULL | Version timestamp |
| approved_at | DateTime | NULL | Approval timestamp |

**Indexes:** ix_atom_versions_atom_id

#### topic_atoms (Junction Table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| topic_id | Integer | PK, FK(topics.id) | Composite PK |
| atom_id | Integer | PK, FK(atoms.id) | Composite PK |
| position | Integer | NULL | Ordering position |
| note | Text | NULL | Optional note |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Primary Key:** (topic_id, atom_id)

#### atom_links (Junction Table)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| from_atom_id | Integer | PK, FK(atoms.id) | Composite PK |
| to_atom_id | Integer | PK, FK(atoms.id) | Composite PK |
| link_type | String | NOT NULL | LinkType enum (7 types) |
| strength | Float | NULL | 0.0-1.0 |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Primary Key:** (from_atom_id, to_atom_id)

### Analysis System Tables

#### llm_providers

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | Text | NOT NULL, UNIQUE, INDEXED | Provider name |
| type | ProviderType | NOT NULL | ollama/openai |
| base_url | Text | NULL | API base URL |
| api_key_encrypted | LargeBinary | NULL | Encrypted API key |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| validation_status | ValidationStatus | NOT NULL, DEFAULT 'pending' | pending/validating/connected/error |
| validation_error | Text | NULL | Error message |
| validated_at | DateTime(tz) | NULL | Validation timestamp |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_llm_providers_name (unique)

#### agent_configs

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | Text | NOT NULL, UNIQUE, INDEXED | Agent name |
| provider_id | UUID | NOT NULL, FK(llm_providers.id) | LLM provider |
| model_name | Text | NOT NULL | Model identifier |
| system_prompt | Text | NOT NULL | System prompt |
| description | Text | NULL | Optional description |
| temperature | Float | NULL, DEFAULT 0.7 | 0.0-2.0 |
| max_tokens | Integer | NULL | Token limit |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_agent_configs_name (unique)

#### task_configs

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | Text | NOT NULL, UNIQUE, INDEXED | Task name |
| description | Text | NULL | Optional description |
| response_schema | JSONB | NOT NULL | JSON Schema for validation |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_task_configs_name (unique)

#### agent_task_assignments

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| agent_id | UUID | NOT NULL, FK(agent_configs.id) | Agent config |
| task_id | UUID | NOT NULL, FK(task_configs.id) | Task config |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| assigned_at | DateTime(tz) | NOT NULL, DEFAULT now() | Assignment timestamp |

**Constraints:** UNIQUE(agent_id, task_id) named "uq_agent_task"

#### project_configs

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| name | String(200) | NOT NULL, UNIQUE, INDEXED | Project name |
| description | Text | NOT NULL | Project description |
| keywords | JSONB | NOT NULL | Classification keywords (list) |
| glossary | JSONB | NOT NULL | Domain terminology (dict) |
| components | JSONB | NOT NULL | Components/modules (list[dict]) |
| default_assignee_ids | JSONB | NOT NULL | Default assignees (list[int]) |
| pm_user_id | Integer | NOT NULL, FK(users.id) | Project manager |
| priority_rules | JSONB | NOT NULL | Priority rules (dict) |
| version | String(50) | NOT NULL | Config version |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

**Indexes:** ix_project_configs_name (unique)

#### analysis_runs

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| time_window_start | DateTime(tz) | NULL | Analysis window start |
| time_window_end | DateTime(tz) | NULL | Analysis window end |
| agent_assignment_id | UUID | NOT NULL, FK(agent_task_assignments.id) | Agent-Task pair |
| project_config_id | UUID | NULL, FK(project_configs.id) | Optional project |
| config_snapshot | JSONB | NOT NULL | Full config at run time |
| trigger_type | String(50) | NOT NULL | Trigger mechanism |
| triggered_by_user_id | Integer | NULL, FK(users.id) | Optional user |
| status | String(50) | NOT NULL, DEFAULT 'pending' | pending/running/completed/reviewed/closed/failed/cancelled |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| started_at | DateTime(tz) | NULL | Run start time |
| completed_at | DateTime(tz) | NULL | Run completion time |
| closed_at | DateTime(tz) | NULL | Run closure time |
| proposals_total | Integer | NOT NULL, DEFAULT 0 | Total proposals |
| proposals_approved | Integer | NOT NULL, DEFAULT 0 | Approved count |
| proposals_rejected | Integer | NOT NULL, DEFAULT 0 | Rejected count |
| proposals_pending | Integer | NOT NULL, DEFAULT 0 | Pending count |
| total_messages_in_window | Integer | NOT NULL, DEFAULT 0 | Message count |
| messages_after_prefilter | Integer | NOT NULL, DEFAULT 0 | Filtered count |
| batches_created | Integer | NOT NULL, DEFAULT 0 | Batch count |
| llm_tokens_used | Integer | NOT NULL, DEFAULT 0 | Token usage |
| cost_estimate | Float | NOT NULL, DEFAULT 0.0 | Cost estimate |
| error_log | JSONB | NULL | Error details |
| accuracy_metrics | JSONB | NULL | Accuracy metrics |

#### task_proposals

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| analysis_run_id | UUID | NOT NULL, FK(analysis_runs.id) | Parent run |
| proposed_project_id | UUID | NULL, FK(project_configs.id) | Optional project |
| proposed_parent_id | UUID | NULL, FK(task_entities.id) | Parent task |
| similar_task_id | UUID | NULL, FK(task_entities.id) | Similar task |
| reviewed_by_user_id | Integer | NULL, FK(users.id) | Reviewer |
| proposed_title | String(500) | NOT NULL | Proposed title |
| proposed_description | Text | NOT NULL | Proposed description |
| source_message_ids | JSONB | NOT NULL | Message IDs (list) |
| message_count | Integer | NOT NULL | Message count |
| time_span_seconds | Integer | NOT NULL | Time span |
| confidence | Float | NOT NULL | 0.0-1.0 |
| reasoning | Text | NOT NULL | LLM reasoning |
| proposed_priority | TaskPriority | NOT NULL | low/medium/high/critical |
| proposed_category | TaskCategory | NOT NULL | bug/feature/improvement/question/chore |
| llm_recommendation | LLMRecommendation | NOT NULL | new_task/update_existing/merge/reject |
| status | ProposalStatus | NOT NULL | pending/approved/rejected/merged |
| similarity_type | SimilarityType | NOT NULL | exact_messages/semantic/none |
| proposed_tags | JSONB | NOT NULL | Tags (list) |
| proposed_sub_tasks | JSONB | NOT NULL | Sub-tasks (list[dict]) |
| diff_summary | JSONB | NULL | Diff details |
| project_keywords_matched | JSONB | NOT NULL | Matched keywords (list) |
| similarity_score | Float | NULL | 0.0-1.0 |
| project_classification_confidence | Float | NOT NULL | 0.0-1.0 |
| created_at | DateTime(tz) | NOT NULL, DEFAULT now() | Server timestamp |
| reviewed_at | DateTime(tz) | NULL | Review timestamp |

#### classification_experiments

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| provider_id | UUID | NOT NULL, FK(llm_providers.id) | LLM provider |
| model_name | String(100) | NOT NULL | Model identifier |
| message_count | Integer | NOT NULL | Message count |
| status | ExperimentStatus | NOT NULL | pending/running/completed/failed |
| topics_snapshot | JSONB | NOT NULL | Topics at experiment time |
| confusion_matrix | JSONB | NULL | Confusion matrix |
| classification_results | JSONB | NOT NULL | Detailed results (list[dict]) |
| accuracy | Float | NULL | 0.0-1.0 |
| avg_confidence | Float | NULL | 0.0-1.0 |
| avg_execution_time_ms | Float | NULL | Average time |
| error_message | Text | NULL | Error message |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |
| started_at | DateTime(tz) | NULL | Experiment start |
| completed_at | DateTime(tz) | NULL | Experiment completion |

### Legacy System Tables

#### tasks

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| title | String(200) | NOT NULL | Task title |
| description | Text | NOT NULL | Task description |
| category | TaskCategory | NOT NULL | bug/feature/improvement/question/chore |
| priority | TaskPriority | NOT NULL | low/medium/high/critical |
| status | TaskStatus | NOT NULL | open/in_progress/completed/closed |
| source_id | Integer | NOT NULL, FK(sources.id) | Message source |
| source_message_id | Integer | NULL, FK(messages.id) | Optional source message |
| assigned_to | Integer | NULL, FK(users.id) | Optional assignee |
| created_by | Integer | NULL, FK(users.id) | Optional creator |
| ai_generated | Boolean | NOT NULL, DEFAULT false | AI generation flag |
| classification_data | JSONB | NULL | Classification data |
| confidence_score | Float | NULL | 0.0-1.0 |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

#### task_entities

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | UUID | PK | UUID v4 |
| title | String(500) | NOT NULL | Task title |
| description | Text | NOT NULL | Task description |
| status | TaskStatus | NOT NULL | open/in_progress/completed/closed |
| priority | TaskPriority | NOT NULL | low/medium/high/critical |
| category | TaskCategory | NOT NULL | bug/feature/improvement/question/chore |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

#### webhook_settings

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | BigInteger | PK | Auto-increment |
| name | String(100) | NOT NULL | Setting name |
| config | JSONB | NOT NULL | Configuration data |
| is_active | Boolean | NOT NULL, DEFAULT true | Active status |
| created_at | DateTime(tz) | NULL, DEFAULT now() | Server timestamp |
| updated_at | DateTime(tz) | NULL, DEFAULT now(), ON UPDATE now() | Auto-update |

---

## Relationships Summary

### One-to-One (1:1)

| Parent | Child | Via Field | Constraint |
|--------|-------|-----------|------------|
| users | telegram_profiles | user_id | UNIQUE(user_id) |
| messages | tasks | source_message_id | Optional |

### One-to-Many (1:N)

| Parent | Child | Via Field | Optional |
|--------|-------|-----------|----------|
| users | messages | author_id | No |
| users | analysis_runs | triggered_by_user_id | Yes |
| users | task_proposals | reviewed_by_user_id | Yes |
| users | project_configs | pm_user_id | No |
| users | tasks | assigned_to | Yes |
| users | tasks | created_by | Yes |
| sources | messages | source_id | No |
| sources | telegram_profiles | source_id | No |
| sources | tasks | source_id | No |
| topics | topic_versions | topic_id | No |
| topics | messages | topic_id | Yes |
| atoms | atom_versions | atom_id | No |
| llm_providers | agent_configs | provider_id | No |
| llm_providers | classification_experiments | provider_id | No |
| agent_configs | agent_task_assignments | agent_id | No |
| task_configs | agent_task_assignments | task_id | No |
| agent_task_assignments | analysis_runs | agent_assignment_id | No |
| project_configs | analysis_runs | project_config_id | Yes |
| project_configs | task_proposals | proposed_project_id | Yes |
| analysis_runs | task_proposals | analysis_run_id | No |
| task_entities | task_proposals | similar_task_id | Yes |
| task_entities | task_proposals | proposed_parent_id | Yes |
| messages | tasks | source_message_id | Yes |

### Many-to-Many (M:N)

| Left Entity | Right Entity | Junction Table | Additional Fields |
|-------------|--------------|----------------|-------------------|
| topics | atoms | topic_atoms | position (int), note (text) |
| atoms | atoms | atom_links | link_type (enum), strength (float) |

**Note:** agent_task_assignments acts as a junction table for agents and tasks, but also has its own relationships to analysis_runs.

---

## Primary Key Strategy

### BigInteger (Auto-Increment)

**Used for high-volume, sequential entities:**

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

**Rationale:** Scalable for high-volume data, efficient indexing, simple sequential processing.

### UUID (Version 4)

**Used for distributed system entities:**

- llm_providers
- agent_configs
- task_configs
- agent_task_assignments
- project_configs
- analysis_runs
- task_proposals
- task_entities

**Rationale:** No collision risk in distributed systems, globally unique, suitable for config/analysis entities.

### Composite Primary Keys

**Used for junction tables:**

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| topic_atoms | (topic_id, atom_id) | Many-to-many: topics ↔ atoms |
| atom_links | (from_atom_id, to_atom_id) | Many-to-many: atoms ↔ atoms |

**Rationale:** Natural composite keys for many-to-many relationships, prevents duplicates, efficient joins.

---

## Special Features

### Vector Search (pgvector)

**Dimension:** 1536 (OpenAI embedding standard)

| Table | Field | Purpose |
|-------|-------|---------|
| messages | embedding | Semantic message search |
| atoms | embedding | Semantic knowledge search |

**Implementation:** PostgreSQL pgvector extension with HNSW indexing for sub-200ms searches.

### JSONB Structured Storage

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| sources | config | dict | Source-specific configuration |
| messages | included_in_runs | list[str] | AnalysisRun UUIDs |
| messages | noise_factors | dict[str, float] | Noise scoring factors |
| atoms | meta | dict | Additional structured metadata |
| message_ingestion_jobs | source_identifiers | dict | Source-specific identifiers |
| message_ingestion_jobs | error_log | dict | Error details |
| task_configs | response_schema | dict | JSON Schema validation |
| project_configs | keywords | list[str] | Classification keywords |
| project_configs | glossary | dict | Domain terminology |
| project_configs | components | list[dict] | Components/modules |
| project_configs | default_assignee_ids | list[int] | Default assignees |
| project_configs | priority_rules | dict | Priority rules |
| analysis_runs | config_snapshot | dict | Full config snapshot |
| analysis_runs | error_log | dict | Run error details |
| analysis_runs | accuracy_metrics | dict | Accuracy metrics |
| task_proposals | proposed_tags | list[str] | Proposed tags |
| task_proposals | proposed_sub_tasks | list[dict] | Sub-task proposals |
| task_proposals | diff_summary | dict | Diff details |
| task_proposals | project_keywords_matched | list[str] | Matched keywords |
| classification_experiments | topics_snapshot | dict | Topics snapshot |
| classification_experiments | confusion_matrix | dict | Confusion matrix |
| classification_experiments | classification_results | list[dict] | Detailed results |

### Timezone Handling

**All timestamps** use `DateTime(timezone=True)` with `server_default=func.now()`:

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

**Exception:** messages.sent_at uses DateTime without timezone (external timestamp from source system).

### Validation Patterns

| Model | Field | Validation |
|-------|-------|------------|
| users | phone | International format: `^\+?[1-9]\d{1,14}$` |
| topics | color | Hex format `#RRGGBB` or Tailwind name → hex conversion |
| atoms | type | Enum: problem/solution/decision/question/insight/pattern/requirement |
| atom_links | link_type | Enum: continues/solves/contradicts/supports/refines/relates_to/depends_on |
| messages | confidence | Range: 0.0-1.0 |
| messages | importance_score | Range: 0.0-1.0 |
| task_proposals | confidence | Range: 0.0-1.0 |
| task_proposals | similarity_score | Range: 0.0-1.0 |

### Encrypted Fields

| Table | Field | Encryption Method |
|-------|-------|-------------------|
| llm_providers | api_key_encrypted | LargeBinary (application-level encryption) |

---

## Migration History

### Applied Migrations

| Migration | Date | Changes |
|-----------|------|---------|
| d510922791ac | 2025-10-18 21:15:54 | Initial migration: 20 tables, 11 indexes, 8 enums |
| 4c301ba5595c | 2025-10-18 21:30:22 | Timezone fix: message_ingestion_jobs timestamps |

### Database Statistics

- **Total Models:** 21
- **Total Relationships:** 45+
- **Indexes:** 11 unique, multiple foreign key indexes
- **Enums:** 12 types
- **Junction Tables:** 2 (topic_atoms, atom_links)
- **Vector Fields:** 2 (messages.embedding, atoms.embedding)

---

## Related Documentation

- [System Architecture Overview](overview.md) - High-level architecture
- [Analysis System](analysis-system.md) - Analysis workflow details
- [Knowledge Extraction](knowledge-extraction.md) - Topic and Atom extraction
- [Vector Database](vector-database.md) - Semantic search implementation

---

*Last updated: October 26, 2025 - Comprehensive database schema documentation*
