# Database Schema Deep Dive Investigation Report

**Session**: 2025-10-26_database-schema
**Batch**: 1B of 9 - Database Schema Deep Dive
**Feature**: Backend Architecture Documentation (Feature 3 of Epic Documentation Overhaul)
**Analyst**: Database Schema Investigator
**Date**: 2025-10-26

---

## Executive Summary

Comprehensive analysis of Task Tracker database schema for ER diagram creation. Analyzed 20 models across 5 domains (User Management, Knowledge Graph, Analysis System, Legacy System, Configuration). Identified 45+ relationships, 12+ enums, and 3 base mixins for inheritance.

**Key Findings**:
- **Primary Key Strategy**: Mixed - BigInteger for scalable entities, UUID for distributed systems
- **Vector Search**: pgvector integration for semantic search (1536 dimensions)
- **Versioning System**: Defined but NOT migrated (atom_versions, topic_versions models exist but no migration)
- **Timezone Handling**: All timestamps use timezone-aware DateTime
- **JSONB Usage**: Extensive use for flexible metadata, configuration snapshots, and arrays

---

## 1. Model Relationships

### 1.1 Relationship Matrix

| From Model | To Model | Type | Cardinality | FK Field | Notes |
|------------|----------|------|-------------|----------|-------|
| **User Management Domain** |
| User | TelegramProfile | one-to-one | 1:1 | telegram_profiles.user_id | Unique constraint |
| User | Message | one-to-many | 1:N | messages.author_id | User as message author |
| User | Task | one-to-many | 1:N | tasks.assigned_to | Optional task assignment |
| User | Task | one-to-many | 1:N | tasks.created_by | Optional task creator |
| User | AnalysisRun | one-to-many | 1:N | analysis_runs.triggered_by_user_id | Optional trigger |
| User | TaskProposal | one-to-many | 1:N | task_proposals.reviewed_by_user_id | Optional reviewer |
| User | ProjectConfig | one-to-many | 1:N | project_configs.pm_user_id | Project manager (required) |
| TelegramProfile | Source | many-to-one | N:1 | telegram_profiles.source_id | Telegram source link |
| **Message & Communication Domain** |
| Source | Message | one-to-many | 1:N | messages.source_id | Message source |
| Source | TelegramProfile | one-to-many | 1:N | telegram_profiles.source_id | Telegram profiles |
| Source | Task | one-to-many | 1:N | tasks.source_id | Legacy task source |
| Message | TelegramProfile | many-to-one | N:1 | messages.telegram_profile_id | Optional Telegram profile |
| Message | Topic | many-to-one | N:1 | messages.topic_id | Ground truth topic (optional) |
| Message | Task | one-to-one | 1:1 | tasks.source_message_id | Optional source message |
| **Knowledge Graph Domain** |
| Topic | TopicVersion | one-to-many | 1:N | topic_versions.topic_id | Versioning (lazy select) |
| Topic | Message | one-to-many | 1:N | messages.topic_id | Ground truth classification |
| Topic | Atom | many-to-many | M:N | topic_atoms (junction) | Topic-Atom association |
| Atom | AtomVersion | one-to-many | 1:N | atom_versions.atom_id | Versioning (lazy select) |
| Atom | Atom | many-to-many | M:N | atom_links (junction) | Bidirectional atom links |
| Atom | Topic | many-to-many | M:N | topic_atoms (junction) | Atom-Topic association |
| **Analysis System Domain** |
| LLMProvider | AgentConfig | one-to-many | 1:N | agent_configs.provider_id | Provider-Agent link |
| LLMProvider | ClassificationExperiment | one-to-many | 1:N | classification_experiments.provider_id | Experiment provider |
| AgentConfig | AgentTaskAssignment | one-to-many | 1:N | agent_task_assignments.agent_id | Agent assignments |
| TaskConfig | AgentTaskAssignment | one-to-many | 1:N | agent_task_assignments.task_id | Task assignments |
| AgentTaskAssignment | AnalysisRun | one-to-many | 1:N | analysis_runs.agent_assignment_id | Run configuration |
| ProjectConfig | AnalysisRun | one-to-many | 1:N | analysis_runs.project_config_id | Optional project config |
| ProjectConfig | TaskProposal | one-to-many | 1:N | task_proposals.proposed_project_id | Optional project assignment |
| AnalysisRun | TaskProposal | one-to-many | 1:N | task_proposals.analysis_run_id | Run proposals |
| TaskEntity | TaskProposal | one-to-many | 1:N | task_proposals.similar_task_id | Similar task detection |
| TaskEntity | TaskProposal | one-to-many | 1:N | task_proposals.proposed_parent_id | Parent-child task hierarchy |

### 1.2 Junction Tables (Many-to-Many)

| Junction Table | Left Entity | Right Entity | Additional Fields | Notes |
|----------------|-------------|--------------|-------------------|-------|
| **topic_atoms** | Topic | Atom | position (int), note (text) | Composite PK (topic_id, atom_id) |
| **atom_links** | Atom (from) | Atom (to) | link_type (str), strength (float) | Composite PK (from_atom_id, to_atom_id) |

### 1.3 Self-Referencing Relationships

| Model | Field | Type | Notes |
|-------|-------|------|-------|
| Atom | atom_links | many-to-many | Bidirectional links via atom_links junction |

---

## 2. Field Analysis by Domain

### 2.1 User Management Domain

#### User (users)
**Primary Key**: BigInteger id
**Indexes**: email (unique), phone (unique)
**Required Fields**: first_name
**Optional Fields**: last_name, email, phone, avatar_url
**Booleans**: is_active (default=True), is_bot (default=False)
**Computed**: full_name (property)
**Validation**: phone (international format regex)

#### TelegramProfile (telegram_profiles)
**Primary Key**: BigInteger id
**Indexes**: telegram_user_id (unique)
**Foreign Keys**: user_id (unique), source_id
**Required Fields**: telegram_user_id, first_name, user_id, source_id
**Optional Fields**: last_name, language_code
**Booleans**: is_bot (default=False), is_premium (default=False)
**Computed**: full_name (property)

### 2.2 Message & Communication Domain

#### Source (sources)
**Primary Key**: BigInteger id
**Required Fields**: name, type (SourceType enum)
**Optional Fields**: config (JSONB)
**Booleans**: is_active (default=True)

#### Message (messages)
**Primary Key**: BigInteger id
**Indexes**: external_message_id, topic_id
**Foreign Keys**: source_id, author_id, telegram_profile_id (optional), topic_id (optional)
**Required Fields**: external_message_id, content (Text), sent_at, source_id, author_id
**Optional Fields**: telegram_profile_id, avatar_url, classification, confidence, topic_id
**Booleans**: analyzed (default=False)
**Enums/Strings**: analysis_status (AnalysisStatus enum - pending/analyzed/spam/noise)
**JSONB Fields**: included_in_runs (list[str]), noise_factors (dict[str, float])
**Vector Fields**: embedding (pgvector, 1536 dimensions)
**Scores**: confidence (0.0-1.0), importance_score (0.0-1.0)
**Classification**: noise_classification (signal/noise/spam/low_quality/high_quality)

#### MessageIngestionJob (message_ingestion_jobs)
**Primary Key**: BigInteger id
**Required Fields**: source_type, source_identifiers (JSONB)
**Optional Fields**: time_window_start, time_window_end (timezone-aware)
**Enums**: status (IngestionStatus - pending/running/completed/failed/cancelled)
**Counters**: messages_fetched, messages_stored, messages_skipped, errors_count, current_batch
**Optional Counters**: total_batches
**JSONB Fields**: error_log
**Timestamps**: started_at, completed_at (timezone-aware)

### 2.3 Knowledge Graph Domain

#### Topic (topics)
**Primary Key**: BigInteger id
**Indexes**: name (unique)
**Required Fields**: name (max 100), description (Text)
**Optional Fields**: icon (max 50), color (max 7, hex format #RRGGBB)
**Relationships**: versions (one-to-many to TopicVersion, lazy select)
**Validation**: color (hex format or Tailwind name converted to hex)
**Auto-Selection**: icon/color based on keywords

#### TopicVersion (topic_versions) - **NOT MIGRATED**
**Primary Key**: BigInteger id
**Indexes**: topic_id
**Foreign Keys**: topic_id
**Required Fields**: topic_id, version (int), data (JSON), created_at
**Optional Fields**: created_by (max 100), approved_at
**Booleans**: approved (default=False)
**Immutable**: All fields (version snapshot)

#### Atom (atoms)
**Primary Key**: BigInteger id
**Indexes**: title
**Required Fields**: type (AtomType enum), title (max 200), content (Text)
**Optional Fields**: confidence (0.0-1.0), meta (JSON)
**Booleans**: user_approved (default=False)
**Vector Fields**: embedding (pgvector, 1536 dimensions)
**Enums**: type (problem/solution/decision/question/insight/pattern/requirement)
**Relationships**: versions (one-to-many to AtomVersion, lazy select)

#### AtomVersion (atom_versions) - **NOT MIGRATED**
**Primary Key**: BigInteger id
**Indexes**: atom_id
**Foreign Keys**: atom_id
**Required Fields**: atom_id, version (int), data (JSON), created_at
**Optional Fields**: created_by (max 100), approved_at
**Booleans**: approved (default=False)
**Immutable**: All fields (version snapshot)

#### AtomLink (atom_links)
**Composite Primary Key**: (from_atom_id, to_atom_id)
**Foreign Keys**: from_atom_id, to_atom_id
**Required Fields**: from_atom_id, to_atom_id, link_type (LinkType enum)
**Optional Fields**: strength (0.0-1.0)
**Enums**: link_type (continues/solves/contradicts/supports/refines/relates_to/depends_on)

#### TopicAtom (topic_atoms)
**Composite Primary Key**: (topic_id, atom_id)
**Foreign Keys**: topic_id, atom_id
**Required Fields**: topic_id, atom_id
**Optional Fields**: position (int), note (Text)

### 2.4 Analysis System Domain

#### LLMProvider (llm_providers)
**Primary Key**: UUID
**Indexes**: name (unique)
**Required Fields**: name (Text, unique), type (ProviderType enum)
**Optional Fields**: base_url (Text), api_key_encrypted (bytes), validation_error (Text), validated_at
**Booleans**: is_active (default=True)
**Enums**: type (ollama/openai), validation_status (pending/validating/connected/error)
**Timestamps**: created_at, updated_at (server_default=now())

#### AgentConfig (agent_configs)
**Primary Key**: UUID
**Indexes**: name (unique)
**Foreign Keys**: provider_id (UUID)
**Required Fields**: name (Text, unique), provider_id, model_name (Text), system_prompt (Text)
**Optional Fields**: description (Text), temperature (default=0.7), max_tokens
**Booleans**: is_active (default=True)
**Timestamps**: created_at, updated_at

#### TaskConfig (task_configs)
**Primary Key**: UUID
**Indexes**: name (unique)
**Required Fields**: name (Text, unique), response_schema (JSONB)
**Optional Fields**: description (Text)
**Booleans**: is_active (default=True)
**Timestamps**: created_at, updated_at

#### AgentTaskAssignment (agent_task_assignments)
**Primary Key**: UUID
**Unique Constraint**: (agent_id, task_id)
**Foreign Keys**: agent_id (UUID), task_id (UUID)
**Required Fields**: agent_id, task_id
**Booleans**: is_active (default=True)
**Timestamps**: assigned_at

#### ProjectConfig (project_configs)
**Primary Key**: UUID
**Indexes**: name (unique)
**Foreign Keys**: pm_user_id (int)
**Required Fields**: name (max 200, unique), description (Text), keywords (JSONB), glossary (JSONB), components (JSONB), default_assignee_ids (JSONB), pm_user_id, priority_rules (JSONB), version (max 50)
**Booleans**: is_active (default=True)
**JSONB Fields**: keywords (list[str]), glossary (dict), components (list[dict]), default_assignee_ids (list[int]), priority_rules (dict)
**Timestamps**: created_at, updated_at

#### AnalysisRun (analysis_runs)
**Primary Key**: UUID
**Foreign Keys**: agent_assignment_id (UUID), project_config_id (UUID, optional), triggered_by_user_id (int, optional)
**Required Fields**: time_window_start, time_window_end, agent_assignment_id, config_snapshot (JSONB), trigger_type (max 50), status (default=pending)
**Enums**: status (pending/running/completed/reviewed/closed/failed/cancelled)
**Counters**: proposals_total, proposals_approved, proposals_rejected, proposals_pending, total_messages_in_window, messages_after_prefilter, batches_created, llm_tokens_used
**Floats**: cost_estimate
**JSONB Fields**: config_snapshot, error_log, accuracy_metrics
**Timestamps**: created_at, started_at, completed_at, closed_at (all timezone-aware)

#### TaskProposal (task_proposals)
**Primary Key**: UUID
**Foreign Keys**: analysis_run_id (UUID), proposed_project_id (UUID, optional), proposed_parent_id (UUID, optional), similar_task_id (UUID, optional), reviewed_by_user_id (int, optional)
**Required Fields**: analysis_run_id, proposed_title (max 500), proposed_description (Text), source_message_ids (JSONB), message_count, time_span_seconds, confidence (0.0-1.0), reasoning (Text)
**Enums**: proposed_priority (TaskPriority - low/medium/high/critical), proposed_category (TaskCategory - bug/feature/improvement/question/chore), llm_recommendation (new_task/update_existing/merge/reject), status (pending/approved/rejected/merged), similarity_type (exact_messages/semantic/none)
**JSONB Fields**: proposed_tags (list[str]), proposed_sub_tasks (list[dict]), diff_summary (dict), project_keywords_matched (list[str])
**Scores**: confidence (0.0-1.0), similarity_score (0.0-1.0), project_classification_confidence (0.0-1.0)
**Timestamps**: created_at, reviewed_at

#### ClassificationExperiment (classification_experiments)
**Primary Key**: BigInteger id
**Foreign Keys**: provider_id (UUID)
**Required Fields**: provider_id, model_name (max 100), message_count
**Enums**: status (pending/running/completed/failed)
**JSONB Fields**: topics_snapshot, confusion_matrix, classification_results (list[dict])
**Scores**: accuracy (0.0-1.0), avg_confidence (0.0-1.0)
**Floats**: avg_execution_time_ms
**Optional Fields**: error_message (Text)
**Timestamps**: created_at, updated_at, started_at, completed_at

### 2.5 Legacy System Domain

#### Task (tasks) - **LEGACY**
**Primary Key**: BigInteger id
**Foreign Keys**: source_id, source_message_id (optional), assigned_to (optional), created_by (optional)
**Required Fields**: title (max 200), description (Text), category (TaskCategory), priority (TaskPriority), status (TaskStatus), source_id
**Enums**: category (bug/feature/improvement/question/chore), priority (low/medium/high/critical), status (open/in_progress/completed/closed)
**Booleans**: ai_generated (default=False)
**Optional Fields**: classification_data (JSONB), confidence_score
**Timestamps**: created_at, updated_at

#### TaskEntity (task_entities) - **PLACEHOLDER**
**Primary Key**: UUID
**Required Fields**: title (max 500), description (Text)
**Enums**: status (open/in_progress/completed/closed), priority (low/medium/high/critical), category (bug/feature/improvement/question/chore)
**Note**: Minimal implementation for foreign key satisfaction in TaskProposal

#### WebhookSettings (webhook_settings) - **LEGACY**
**Primary Key**: BigInteger id
**Required Fields**: name (max 100), config (JSONB)
**Booleans**: is_active (default=True)
**Timestamps**: created_at, updated_at

---

## 3. Model Inheritance Structure

### 3.1 Base Mixins

#### IDMixin
```python
id: int | None = Field(default=None, primary_key=True, sa_type=BigInteger)
```
**Used by**: All models except UUID-based models (LLMProvider, AgentConfig, TaskConfig, etc.)

#### TimestampMixin
```python
created_at: datetime | None = Field(
    default=None,
    sa_type=DateTime(timezone=True),
    sa_column_kwargs={"server_default": func.now()}
)
updated_at: datetime | None = Field(
    default=None,
    sa_type=DateTime(timezone=True),
    sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()}
)
```
**Used by**: All models except versioning models and specific configs

### 3.2 Inheritance Hierarchy

| Model | Inherits From | Notes |
|-------|---------------|-------|
| User | IDMixin, TimestampMixin, SQLModel | Base user model |
| TelegramProfile | IDMixin, TimestampMixin, SQLModel | Platform-specific profile |
| Message | IDMixin, TimestampMixin, SQLModel | Message storage |
| Source | IDMixin, TimestampMixin, SourceBase | Base model pattern |
| Topic | IDMixin, TimestampMixin, SQLModel | Knowledge category |
| TopicVersion | IDMixin, SQLModel | No TimestampMixin (immutable) |
| Atom | IDMixin, TimestampMixin, SQLModel | Knowledge unit |
| AtomVersion | IDMixin, SQLModel | No TimestampMixin (immutable) |
| AtomLink | TimestampMixin, SQLModel | No IDMixin (composite PK) |
| TopicAtom | TimestampMixin, SQLModel | No IDMixin (composite PK) |
| Task | IDMixin, TimestampMixin, TaskBase | Legacy task |
| LLMProvider | SQLModel | UUID primary key, custom timestamps |
| AgentConfig | SQLModel | UUID primary key, custom timestamps |
| TaskConfig | SQLModel | UUID primary key, custom timestamps |
| ProjectConfig | SQLModel | UUID primary key, custom timestamps |
| AnalysisRun | SQLModel | UUID primary key, custom timestamps |
| TaskProposal | SQLModel | UUID primary key, created_at only |
| TaskEntity | SQLModel | UUID primary key, custom timestamps |
| MessageIngestionJob | IDMixin, TimestampMixin, SQLModel | Job tracking |
| ClassificationExperiment | IDMixin, TimestampMixin, SQLModel | Experiment tracking |
| WebhookSettings | IDMixin, TimestampMixin, WebhookSettingsBase | Legacy config |

### 3.3 Primary Key Strategy

| Strategy | Models | Rationale |
|----------|--------|-----------|
| **BigInteger** | User, TelegramProfile, Message, Source, Topic, Atom, Task, MessageIngestionJob, ClassificationExperiment, WebhookSettings, Versions | Scalable sequential IDs for high-volume entities |
| **UUID** | LLMProvider, AgentConfig, TaskConfig, ProjectConfig, AgentTaskAssignment, AnalysisRun, TaskProposal, TaskEntity | Distributed system compatibility, no collision |
| **Composite** | AtomLink (from_atom_id, to_atom_id), TopicAtom (topic_id, atom_id) | Junction tables for many-to-many |

---

## 4. Enum Types

### 4.1 Task-Related Enums

#### TaskStatus (str, Enum)
- open
- in_progress
- completed
- closed

#### TaskCategory (str, Enum)
- bug
- feature
- improvement
- question
- chore

#### TaskPriority (str, Enum)
- low
- medium
- high
- critical

### 4.2 Communication Enums

#### SourceType (str, Enum)
- telegram
- slack
- email
- api

#### AnalysisStatus (str, Enum)
- pending
- analyzed
- spam
- noise

#### NoiseClassification (str, Enum)
- signal
- noise
- spam
- low_quality
- high_quality

### 4.3 Knowledge Graph Enums

#### AtomType (str, Enum)
- problem
- solution
- decision
- question
- insight
- pattern
- requirement

#### LinkType (str, Enum)
- continues
- solves
- contradicts
- supports
- refines
- relates_to
- depends_on

### 4.4 Analysis System Enums

#### ProviderType (str, Enum)
- ollama
- openai

#### ValidationStatus (str, Enum)
- pending
- validating
- connected
- error

#### IngestionStatus (str, Enum)
- pending
- running
- completed
- failed
- cancelled

#### AnalysisRunStatus (str, Enum)
- pending
- running
- completed
- reviewed
- closed
- failed
- cancelled

#### ProposalStatus (str, Enum)
- pending
- approved
- rejected
- merged

#### LLMRecommendation (str, Enum)
- new_task
- update_existing
- merge
- reject

#### SimilarityType (str, Enum)
- exact_messages
- semantic
- none

#### ExperimentStatus (str, Enum)
- pending
- running
- completed
- failed

---

## 5. Migration Analysis

### 5.1 Initial Migration (d510922791ac)
**Date**: 2025-10-18 21:15:54
**Status**: Applied

**Tables Created** (18):
1. atoms
2. llm_providers
3. message_ingestion_jobs
4. sources
5. task_configs
6. task_entities
7. topics
8. users
9. webhook_settings
10. agent_configs
11. atom_links
12. classification_experiments
13. project_configs
14. telegram_profiles
15. topic_atoms
16. agent_task_assignments
17. messages
18. analysis_runs
19. tasks (legacy)
20. task_proposals

**Indexes Created**:
- ix_atoms_title
- ix_llm_providers_name (unique)
- ix_task_configs_name (unique)
- ix_topics_name (unique)
- ix_users_email (unique)
- ix_users_phone (unique)
- ix_agent_configs_name (unique)
- ix_telegram_profiles_telegram_user_id (unique)
- ix_project_configs_name (unique)
- ix_messages_external_message_id
- ix_messages_topic_id

**Constraints**:
- telegram_profiles: unique(user_id)
- agent_task_assignments: unique(agent_id, task_id) named "uq_agent_task"

**Enums Created**:
- ProviderType (ollama, openai)
- ValidationStatus (pending, validating, connected, error)
- IngestionStatus (pending, running, completed, failed, cancelled)
- SourceType (telegram, slack, email, api)
- TaskCategory (bug, feature, improvement, question, chore)
- TaskPriority (low, medium, high, critical)
- TaskStatus (open, in_progress, completed, closed)
- ExperimentStatus (pending, running, completed, failed)

### 5.2 Timezone Fix Migration (4c301ba5595c)
**Date**: 2025-10-18 21:30:22
**Status**: Applied

**Changes**:
- message_ingestion_jobs.time_window_start: TIMESTAMP → DateTime(timezone=True)
- message_ingestion_jobs.time_window_end: TIMESTAMP → DateTime(timezone=True)
- message_ingestion_jobs.started_at: TIMESTAMP → DateTime(timezone=True)
- message_ingestion_jobs.completed_at: TIMESTAMP → DateTime(timezone=True)

### 5.3 Missing Migrations

**CRITICAL**: Versioning tables defined but NOT migrated:
- **atom_versions** (model exists, no migration)
- **topic_versions** (model exists, no migration)

**Impact**: Versioning functionality is defined in code but not available in database schema.

---

## 6. ER Diagram Data (Structured)

### 6.1 Domain Grouping

```json
{
  "domains": {
    "user_management": {
      "tables": ["users", "telegram_profiles"],
      "color": "#3B82F6"
    },
    "communication": {
      "tables": ["sources", "messages", "message_ingestion_jobs", "webhook_settings"],
      "color": "#10B981"
    },
    "knowledge_graph": {
      "tables": ["topics", "topic_versions", "atoms", "atom_versions", "atom_links", "topic_atoms"],
      "color": "#F59E0B"
    },
    "analysis_system": {
      "tables": ["llm_providers", "agent_configs", "task_configs", "agent_task_assignments", "project_configs", "analysis_runs", "task_proposals", "classification_experiments"],
      "color": "#A855F7"
    },
    "legacy_tasks": {
      "tables": ["tasks", "task_entities"],
      "color": "#64748B"
    }
  }
}
```

### 6.2 Table Specifications

```json
{
  "tables": [
    {
      "name": "users",
      "pk": "id (BigInteger)",
      "domain": "user_management",
      "fields": [
        {"name": "id", "type": "BigInteger", "nullable": false, "pk": true},
        {"name": "first_name", "type": "String(100)", "nullable": false},
        {"name": "last_name", "type": "String(100)", "nullable": true},
        {"name": "email", "type": "String", "nullable": true, "unique": true, "indexed": true},
        {"name": "phone", "type": "String(20)", "nullable": true, "unique": true, "indexed": true},
        {"name": "avatar_url", "type": "String(500)", "nullable": true},
        {"name": "is_active", "type": "Boolean", "nullable": false, "default": true},
        {"name": "is_bot", "type": "Boolean", "nullable": false, "default": false},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "telegram_profiles",
      "pk": "id (BigInteger)",
      "domain": "user_management",
      "fields": [
        {"name": "id", "type": "BigInteger", "nullable": false, "pk": true},
        {"name": "telegram_user_id", "type": "BigInteger", "nullable": false, "unique": true, "indexed": true},
        {"name": "first_name", "type": "String(100)", "nullable": false},
        {"name": "last_name", "type": "String(100)", "nullable": true},
        {"name": "language_code", "type": "String(10)", "nullable": true},
        {"name": "is_bot", "type": "Boolean", "nullable": false, "default": false},
        {"name": "is_premium", "type": "Boolean", "nullable": false, "default": false},
        {"name": "user_id", "type": "Integer", "nullable": false, "fk": "users.id", "unique": true},
        {"name": "source_id", "type": "Integer", "nullable": false, "fk": "sources.id"},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "sources",
      "pk": "id (BigInteger)",
      "domain": "communication",
      "fields": [
        {"name": "id", "type": "BigInteger", "nullable": false, "pk": true},
        {"name": "name", "type": "String(100)", "nullable": false},
        {"name": "type", "type": "SourceType", "nullable": false},
        {"name": "config", "type": "JSONB", "nullable": true},
        {"name": "is_active", "type": "Boolean", "nullable": false, "default": true},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "messages",
      "pk": "id (BigInteger)",
      "domain": "communication",
      "fields": [
        {"name": "id", "type": "BigInteger", "nullable": false, "pk": true},
        {"name": "external_message_id", "type": "String(100)", "nullable": false, "indexed": true},
        {"name": "content", "type": "Text", "nullable": false},
        {"name": "sent_at", "type": "DateTime", "nullable": false},
        {"name": "source_id", "type": "Integer", "nullable": false, "fk": "sources.id"},
        {"name": "author_id", "type": "Integer", "nullable": false, "fk": "users.id"},
        {"name": "telegram_profile_id", "type": "Integer", "nullable": true, "fk": "telegram_profiles.id"},
        {"name": "avatar_url", "type": "String(500)", "nullable": true},
        {"name": "classification", "type": "String(50)", "nullable": true},
        {"name": "confidence", "type": "Float", "nullable": true},
        {"name": "analyzed", "type": "Boolean", "nullable": false, "default": false},
        {"name": "analysis_status", "type": "String(50)", "nullable": true, "default": "pending"},
        {"name": "included_in_runs", "type": "JSONB", "nullable": true},
        {"name": "topic_id", "type": "Integer", "nullable": true, "fk": "topics.id", "indexed": true},
        {"name": "embedding", "type": "Vector(1536)", "nullable": true},
        {"name": "importance_score", "type": "Float", "nullable": true},
        {"name": "noise_classification", "type": "String(50)", "nullable": true},
        {"name": "noise_factors", "type": "JSONB", "nullable": true},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "topics",
      "pk": "id (BigInteger)",
      "domain": "knowledge_graph",
      "fields": [
        {"name": "id", "type": "BigInteger", "nullable": false, "pk": true},
        {"name": "name", "type": "String(100)", "nullable": false, "unique": true, "indexed": true},
        {"name": "description", "type": "Text", "nullable": false},
        {"name": "icon", "type": "String(50)", "nullable": true},
        {"name": "color", "type": "String(7)", "nullable": true},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "atoms",
      "pk": "id (BigInteger)",
      "domain": "knowledge_graph",
      "fields": [
        {"name": "id", "type": "BigInteger", "nullable": false, "pk": true},
        {"name": "type", "type": "String(20)", "nullable": false},
        {"name": "title", "type": "String(200)", "nullable": false, "indexed": true},
        {"name": "content", "type": "Text", "nullable": false},
        {"name": "confidence", "type": "Float", "nullable": true},
        {"name": "user_approved", "type": "Boolean", "nullable": false, "default": false},
        {"name": "meta", "type": "JSON", "nullable": true},
        {"name": "embedding", "type": "Vector(1536)", "nullable": true},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "llm_providers",
      "pk": "id (UUID)",
      "domain": "analysis_system",
      "fields": [
        {"name": "id", "type": "UUID", "nullable": false, "pk": true},
        {"name": "name", "type": "Text", "nullable": false, "unique": true, "indexed": true},
        {"name": "type", "type": "ProviderType", "nullable": false},
        {"name": "base_url", "type": "Text", "nullable": true},
        {"name": "api_key_encrypted", "type": "LargeBinary", "nullable": true},
        {"name": "is_active", "type": "Boolean", "nullable": false, "default": true},
        {"name": "validation_status", "type": "ValidationStatus", "nullable": false, "default": "pending"},
        {"name": "validation_error", "type": "Text", "nullable": true},
        {"name": "validated_at", "type": "DateTime(tz)", "nullable": true},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "updated_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()", "onupdate": "now()"}
      ]
    },
    {
      "name": "analysis_runs",
      "pk": "id (UUID)",
      "domain": "analysis_system",
      "fields": [
        {"name": "id", "type": "UUID", "nullable": false, "pk": true},
        {"name": "time_window_start", "type": "DateTime(tz)", "nullable": true},
        {"name": "time_window_end", "type": "DateTime(tz)", "nullable": true},
        {"name": "agent_assignment_id", "type": "UUID", "nullable": false, "fk": "agent_task_assignments.id"},
        {"name": "project_config_id", "type": "UUID", "nullable": true, "fk": "project_configs.id"},
        {"name": "config_snapshot", "type": "JSONB", "nullable": false},
        {"name": "trigger_type", "type": "String(50)", "nullable": false},
        {"name": "triggered_by_user_id", "type": "Integer", "nullable": true, "fk": "users.id"},
        {"name": "status", "type": "String(50)", "nullable": false, "default": "pending"},
        {"name": "created_at", "type": "DateTime(tz)", "nullable": true, "server_default": "now()"},
        {"name": "started_at", "type": "DateTime(tz)", "nullable": true},
        {"name": "completed_at", "type": "DateTime(tz)", "nullable": true},
        {"name": "closed_at", "type": "DateTime(tz)", "nullable": true},
        {"name": "proposals_total", "type": "Integer", "nullable": false, "default": 0},
        {"name": "proposals_approved", "type": "Integer", "nullable": false, "default": 0},
        {"name": "proposals_rejected", "type": "Integer", "nullable": false, "default": 0},
        {"name": "proposals_pending", "type": "Integer", "nullable": false, "default": 0},
        {"name": "total_messages_in_window", "type": "Integer", "nullable": false, "default": 0},
        {"name": "messages_after_prefilter", "type": "Integer", "nullable": false, "default": 0},
        {"name": "batches_created", "type": "Integer", "nullable": false, "default": 0},
        {"name": "llm_tokens_used", "type": "Integer", "nullable": false, "default": 0},
        {"name": "cost_estimate", "type": "Float", "nullable": false, "default": 0.0},
        {"name": "error_log", "type": "JSONB", "nullable": true},
        {"name": "accuracy_metrics", "type": "JSONB", "nullable": true}
      ]
    }
  ]
}
```

### 6.3 Relationship Data

```json
{
  "relationships": [
    {
      "from_table": "telegram_profiles",
      "to_table": "users",
      "type": "one-to-one",
      "cardinality": "1:1",
      "fk_field": "user_id",
      "constraint": "unique",
      "notes": "One Telegram profile per user"
    },
    {
      "from_table": "messages",
      "to_table": "users",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "author_id",
      "constraint": "required",
      "notes": "Every message has an author"
    },
    {
      "from_table": "messages",
      "to_table": "sources",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "source_id",
      "constraint": "required",
      "notes": "Every message comes from a source"
    },
    {
      "from_table": "messages",
      "to_table": "topics",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "topic_id",
      "constraint": "optional",
      "notes": "Ground truth topic for classification"
    },
    {
      "from_table": "topic_atoms",
      "to_table": "topics",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "topic_id",
      "constraint": "required",
      "notes": "Junction table for topics and atoms"
    },
    {
      "from_table": "topic_atoms",
      "to_table": "atoms",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "atom_id",
      "constraint": "required",
      "notes": "Junction table for topics and atoms"
    },
    {
      "from_table": "atom_links",
      "to_table": "atoms",
      "type": "many-to-many",
      "cardinality": "N:M",
      "fk_field": "from_atom_id, to_atom_id",
      "constraint": "required",
      "notes": "Bidirectional atom relationships"
    },
    {
      "from_table": "agent_configs",
      "to_table": "llm_providers",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "provider_id",
      "constraint": "required",
      "notes": "Agent uses specific provider"
    },
    {
      "from_table": "analysis_runs",
      "to_table": "agent_task_assignments",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "agent_assignment_id",
      "constraint": "required",
      "notes": "Run uses agent-task assignment"
    },
    {
      "from_table": "task_proposals",
      "to_table": "analysis_runs",
      "type": "many-to-one",
      "cardinality": "N:1",
      "fk_field": "analysis_run_id",
      "constraint": "required",
      "notes": "Proposals belong to analysis run"
    }
  ]
}
```

---

## 7. Special Features

### 7.1 Vector Search Integration

**Library**: pgvector (PostgreSQL extension)
**Dimension**: 1536 (OpenAI embedding standard)
**Usage**:
- Message.embedding: Semantic message search
- Atom.embedding: Semantic knowledge search

**Implementation**:
```python
from pgvector.sqlalchemy import Vector
embedding: list[float] | None = Field(
    default=None,
    sa_column=Column(Vector(1536)),
    description="Vector embedding for semantic search"
)
```

### 7.2 JSONB Usage Patterns

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| sources | config | dict | Source-specific configuration |
| messages | included_in_runs | list[str] | UUIDs of AnalysisRuns |
| messages | noise_factors | dict[str, float] | Contributing factors for noise score |
| atoms | meta | dict | Additional structured metadata |
| message_ingestion_jobs | source_identifiers | dict | Source-specific identifiers |
| message_ingestion_jobs | error_log | dict | Error details |
| task_configs | response_schema | dict | JSON Schema for validation |
| project_configs | keywords | list[str] | Classification keywords |
| project_configs | glossary | dict | Domain-specific terminology |
| project_configs | components | list[dict] | Components/modules |
| project_configs | default_assignee_ids | list[int] | Default assignees |
| project_configs | priority_rules | dict | Priority assignment rules |
| analysis_runs | config_snapshot | dict | Full config at run time |
| analysis_runs | error_log | dict | Run error details |
| analysis_runs | accuracy_metrics | dict | Calculated accuracy metrics |
| task_proposals | proposed_tags | list[str] | Proposed task tags |
| task_proposals | proposed_sub_tasks | list[dict] | Sub-task proposals |
| task_proposals | diff_summary | dict | Diff between proposal and similar task |
| task_proposals | project_keywords_matched | list[str] | Matched project keywords |
| classification_experiments | topics_snapshot | dict | Topics at experiment time |
| classification_experiments | confusion_matrix | dict | Confusion matrix data |
| classification_experiments | classification_results | list[dict] | Detailed results |

### 7.3 Timezone Handling

**All timestamps** use `DateTime(timezone=True)` with `server_default=func.now()` for:
- created_at
- updated_at
- started_at
- completed_at
- closed_at
- validated_at
- assigned_at

**Exception**: Message.sent_at uses DateTime without timezone (external timestamp)

### 7.4 Validation Patterns

| Model | Field | Validation |
|-------|-------|------------|
| User | phone | International format regex `^\+?[1-9]\d{1,14}$` |
| Topic | color | Hex format `#RRGGBB` or Tailwind name → hex conversion |
| Atom | type | Enum validation (AtomType) |
| AtomLink | link_type | Enum validation (LinkType) |
| Message | confidence | Range 0.0-1.0 |
| Message | importance_score | Range 0.0-1.0 |
| TaskProposal | confidence | Range 0.0-1.0 |
| TaskProposal | similarity_score | Range 0.0-1.0 |

---

## 8. Critical Findings

### 8.1 Versioning System NOT Migrated

**Issue**: atom_versions and topic_versions models are defined but not in migration files.

**Impact**:
- Code references versioning relationships (lazy select)
- Database schema does not include these tables
- Versioning functionality is broken until migration created

**Recommendation**: Create migration for versioning tables before documenting as feature.

### 8.2 Mixed Primary Key Strategy

**UUID Models** (10):
- LLMProvider
- AgentConfig
- TaskConfig
- AgentTaskAssignment
- ProjectConfig
- AnalysisRun
- TaskProposal
- TaskEntity

**BigInteger Models** (10):
- User
- TelegramProfile
- Source
- Message
- Topic
- Atom
- Task
- MessageIngestionJob
- ClassificationExperiment
- WebhookSettings

**Composite Primary Keys** (2):
- AtomLink (from_atom_id, to_atom_id)
- TopicAtom (topic_id, atom_id)

**Rationale**:
- UUID: Distributed systems, config entities, analysis workflows
- BigInteger: High-volume data, sequential processing
- Composite: Junction tables for many-to-many

### 8.3 Orphaned Models

**TaskEntity**: Minimal placeholder for TaskProposal foreign keys. Full implementation pending Phase 2.

### 8.4 Legacy Models

**Deprecation Candidates**:
- Task (tasks table) - Legacy task management
- WebhookSettings - Old webhook config pattern
- Source.config (JSONB) - Unstructured configuration

---

## 9. File Locations

### 9.1 Model Files
```
backend/app/models/
├── __init__.py
├── base.py                          # IDMixin, TimestampMixin
├── enums.py                         # All enum types
├── user.py                          # User model
├── telegram_profile.py              # TelegramProfile model
├── message.py                       # Message model
├── message_ingestion.py             # MessageIngestionJob model
├── topic.py                         # Topic model
├── topic_version.py                 # TopicVersion model (NOT MIGRATED)
├── atom.py                          # Atom, AtomLink, TopicAtom models
├── atom_version.py                  # AtomVersion model (NOT MIGRATED)
├── llm_provider.py                  # LLMProvider model
├── agent_config.py                  # AgentConfig model
├── task_config.py                   # TaskConfig model
├── agent_task_assignment.py         # AgentTaskAssignment model
├── project_config.py                # ProjectConfig model
├── analysis_run.py                  # AnalysisRun model
├── task_proposal.py                 # TaskProposal model
├── task_entity.py                   # TaskEntity placeholder
├── classification_experiment.py     # ClassificationExperiment model
└── legacy.py                        # Source, Task, WebhookSettings
```

### 9.2 Migration Files
```
backend/alembic/versions/
├── d510922791ac_initial_migration.py           # 2025-10-18 21:15:54
└── 4c301ba5595c_fix_message_ingestion_timezone_fields.py  # 2025-10-18 21:30:22
```

### 9.3 Missing Migrations
- atom_versions table (model exists in atom_version.py)
- topic_versions table (model exists in topic_version.py)

---

## 10. ER Diagram Recommendations

### 10.1 Visual Layout Suggestions

**Domain Clustering**:
1. **Top-Left**: User Management (users, telegram_profiles)
2. **Top-Right**: Communication (sources, messages, message_ingestion_jobs)
3. **Middle**: Knowledge Graph (topics, atoms, relationships)
4. **Bottom-Left**: Analysis System (providers, agents, runs, proposals)
5. **Bottom-Right**: Legacy (tasks, webhook_settings)

**Color Coding**:
- Blue (#3B82F6): User Management
- Green (#10B981): Communication
- Amber (#F59E0B): Knowledge Graph
- Purple (#A855F7): Analysis System
- Slate (#64748B): Legacy/Deprecated

### 10.2 Relationship Rendering

**One-to-Many**: Simple line with crow's foot at many side
**Many-to-Many**: Show junction table explicitly
**One-to-One**: Line with single bar both sides
**Optional**: Dashed line for nullable foreign keys
**Required**: Solid line for non-nullable foreign keys

### 10.3 Field Display

**Show in ER Diagram**:
- Primary keys (highlighted)
- Foreign keys (with FK icon)
- Unique constraints (with U icon)
- Indexed fields (with I icon)
- Required fields (bold)
- Enums (with type name)

**Hide in ER Diagram** (show in detail view):
- Timestamps (created_at, updated_at)
- JSON/JSONB fields (reference only)
- Text fields (show as "Text")
- Vector fields (show as "Vector(1536)")

---

## Appendix A: Complete Enum Reference

```python
# Task-Related
TaskStatus: open | in_progress | completed | closed
TaskCategory: bug | feature | improvement | question | chore
TaskPriority: low | medium | high | critical

# Communication
SourceType: telegram | slack | email | api
AnalysisStatus: pending | analyzed | spam | noise
NoiseClassification: signal | noise | spam | low_quality | high_quality

# Knowledge Graph
AtomType: problem | solution | decision | question | insight | pattern | requirement
LinkType: continues | solves | contradicts | supports | refines | relates_to | depends_on

# Analysis System
ProviderType: ollama | openai
ValidationStatus: pending | validating | connected | error
IngestionStatus: pending | running | completed | failed | cancelled
AnalysisRunStatus: pending | running | completed | reviewed | closed | failed | cancelled
ProposalStatus: pending | approved | rejected | merged
LLMRecommendation: new_task | update_existing | merge | reject
SimilarityType: exact_messages | semantic | none
ExperimentStatus: pending | running | completed | failed
```

---

## Appendix B: Foreign Key Reference

| Table | Field | References | Constraint | Notes |
|-------|-------|------------|------------|-------|
| telegram_profiles | user_id | users.id | unique | One-to-one |
| telegram_profiles | source_id | sources.id | required | Many-to-one |
| messages | source_id | sources.id | required | Many-to-one |
| messages | author_id | users.id | required | Many-to-one |
| messages | telegram_profile_id | telegram_profiles.id | optional | Many-to-one |
| messages | topic_id | topics.id | optional | Many-to-one |
| topic_versions | topic_id | topics.id | required | Many-to-one |
| atom_versions | atom_id | atoms.id | required | Many-to-one |
| atom_links | from_atom_id | atoms.id | required | Composite PK |
| atom_links | to_atom_id | atoms.id | required | Composite PK |
| topic_atoms | topic_id | topics.id | required | Composite PK |
| topic_atoms | atom_id | atoms.id | required | Composite PK |
| agent_configs | provider_id | llm_providers.id | required | Many-to-one |
| agent_task_assignments | agent_id | agent_configs.id | required | Unique pair |
| agent_task_assignments | task_id | task_configs.id | required | Unique pair |
| project_configs | pm_user_id | users.id | required | Many-to-one |
| analysis_runs | agent_assignment_id | agent_task_assignments.id | required | Many-to-one |
| analysis_runs | project_config_id | project_configs.id | optional | Many-to-one |
| analysis_runs | triggered_by_user_id | users.id | optional | Many-to-one |
| task_proposals | analysis_run_id | analysis_runs.id | required | Many-to-one |
| task_proposals | proposed_project_id | project_configs.id | optional | Many-to-one |
| task_proposals | proposed_parent_id | task_entities.id | optional | Many-to-one |
| task_proposals | similar_task_id | task_entities.id | optional | Many-to-one |
| task_proposals | reviewed_by_user_id | users.id | optional | Many-to-one |
| classification_experiments | provider_id | llm_providers.id | required | Many-to-one |
| tasks | source_id | sources.id | required | Many-to-one |
| tasks | source_message_id | messages.id | optional | Many-to-one |
| tasks | assigned_to | users.id | optional | Many-to-one |
| tasks | created_by | users.id | optional | Many-to-one |

---

**END OF REPORT**

**Next Steps for Phase 2**:
1. Create migration for atom_versions and topic_versions tables
2. Generate ER diagram using this data
3. Document versioning workflow
4. Create database schema visualization in documentation
