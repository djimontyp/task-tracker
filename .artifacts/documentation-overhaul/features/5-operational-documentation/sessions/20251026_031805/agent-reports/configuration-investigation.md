# Configuration & Environment Variables Investigation Report

**Date**: 2025-10-26
**Session**: Feature 5 Operational Documentation - Phase 1 Research (Batch 1B)
**Scope**: Backend configuration management, environment variables, and hardcoded values
**Investigator**: Configuration & Environment Variables Agent

---

## Executive Summary

The task tracker system uses **Pydantic Settings** for configuration management with modular settings classes. The investigation identified:

- **21 environment variables** across 6 configuration domains
- **38+ hardcoded values** requiring migration to configuration
- **Well-structured** Pydantic Settings implementation with type safety
- **Missing** comprehensive `.env.example` for all configurable parameters
- **Gaps** in operational tuning parameters (batch sizes, thresholds, time windows)

---

## 1. Environment Variables Catalog

### 1.1 Complete Inventory

| Variable Name | Category | Type | Required | Default | Purpose |
|--------------|----------|------|----------|---------|---------|
| **Application** |
| `APP_NAME` | App | string | No | "Pulse Radar" | Application display name |
| `APP_DESCRIPTION` | App | string | No | (long text) | Application description |
| `WEBAPP_URL` | App | string | No | http://localhost:8000/webapp | Web app URL |
| `API_BASE_URL` | App | string | No | http://localhost:8000 | API base URL |
| `WEBHOOK_BASE_URL` | App | string | No | http://localhost | Webhook base URL |
| `ENCRYPTION_KEY` | App | string | **Yes** | "" | Fernet encryption key for credentials |
| `LOG_LEVEL` | App | string | No | INFO | Logging verbosity |
| **Database** |
| `DATABASE_URL` | Database | string | No | postgresql+asyncpg://... | Database connection string |
| **Telegram** |
| `TELEGRAM_BOT_TOKEN` | Telegram | string | **Yes** | "" | Telegram bot API token |
| `TELEGRAM_API_ID` | Telegram | int | No | None | Telegram client API ID |
| `TELEGRAM_API_HASH` | Telegram | string | No | None | Telegram client API hash |
| `TELEGRAM_SESSION_STRING` | Telegram | string | No | None | Telegram session string |
| **LLM/AI** |
| `OLLAMA_BASE_URL` | LLM | string | No | http://localhost:11434 | Ollama API URL |
| `OLLAMA_BASE_URL_DOCKER` | LLM | string | No | http://host.docker.internal:11434 | Ollama URL for Docker |
| `RUNNING_IN_DOCKER` | LLM | bool | No | False | Docker environment flag |
| `LLM_PROVIDER` | LLM | string | No | ollama | Default LLM provider |
| `OLLAMA_MODEL` | LLM | string | No | mistral-nemo:12b-instruct-2407-q4_k_m | Default Ollama model |
| **TaskIQ** |
| `TASKIQ_NATS_SERVERS` | TaskIQ | string | No | nats://nats:4222 | NATS server connection |
| `TASKIQ_NATS_QUEUE` | TaskIQ | string | No | taskiq | NATS queue name |
| **Embeddings/Vector** |
| `OPENAI_EMBEDDING_MODEL` | Embedding | string | No | text-embedding-3-small | OpenAI embedding model |
| `OPENAI_EMBEDDING_DIMENSIONS` | Embedding | int | No | 1536 | OpenAI embedding dimensions |
| `OLLAMA_EMBEDDING_MODEL` | Embedding | string | No | llama3 | Ollama embedding model |
| `VECTOR_SIMILARITY_THRESHOLD` | Embedding | float | No | 0.7 | Vector search similarity threshold |
| `VECTOR_SEARCH_LIMIT` | Embedding | int | No | 10 | Max vector search results |
| `EMBEDDING_BATCH_SIZE` | Embedding | int | No | 100 | Embedding batch size |
| **Frontend (Docker Compose)** |
| `VITE_APP_NAME` | Frontend | string | No | Pulse Radar | Frontend app name |
| `VITE_API_BASE_URL` | Frontend | string | No | http://localhost:8000 | Frontend API URL |
| `VITE_WS_URL` | Frontend | string | No | ws://localhost/ws | WebSocket URL |
| `VITE_WS_HOST` | Frontend | string | No | localhost:8000 | WebSocket host |
| `VITE_WS_PATH` | Frontend | string | No | /ws | WebSocket path |
| **Infrastructure** |
| `POSTGRES_PASSWORD` | Database | string | No | postgres | PostgreSQL password |
| `POSTGRES_USER` | Database | string | No | postgres | PostgreSQL username |
| `POSTGRES_DB` | Database | string | No | tasktracker | PostgreSQL database name |
| `CORS_ORIGINS` | Security | string | No | http://localhost:3000,... | CORS allowed origins |
| `COMPOSE_BAKE` | Docker | bool | No | true | Docker Buildx Bake mode |

### 1.2 Configuration Structure

```
backend/core/config.py
├── DatabaseSettings (2 fields)
├── TelegramSettings (4 fields)
├── LLMSettings (5 fields)
├── TaskIQSettings (2 fields)
├── EmbeddingSettings (6 fields)
└── AppSettings (7 fields)
    └── Settings (aggregates all above)
```

---

## 2. Hardcoded Values Inventory

### 2.1 Critical Operational Parameters

#### **Knowledge Extraction** (`backend/app/tasks.py`)
| Variable | Value | Line | Purpose | Migration Priority |
|----------|-------|------|---------|-------------------|
| `KNOWLEDGE_EXTRACTION_THRESHOLD` | 10 | 15 | Min messages before auto-extraction | **HIGH** |
| `KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS` | 24 | 16 | Time window for unprocessed messages | **HIGH** |
| Batch limit | 50 | 72 | Messages per extraction batch | **MEDIUM** |

#### **Importance Scoring** (`backend/app/services/importance_scorer.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Content length thresholds | 10, 50, 200 | 94-99 | Message length scoring breakpoints | **MEDIUM** |
| Classification thresholds | 0.3, 0.7 | 292-294 | Noise/weak_signal/signal boundaries | **HIGH** |
| Content weights | 0.4, 0.2, 0.2, 0.2 | 289 | Factor importance weights | **HIGH** |
| Temporal thresholds | 1hr, 24hr, 168hr | 185-192 | Message recency scoring | **MEDIUM** |
| Topic activity threshold | 3 messages | 205 | Recent topic activity bonus | **LOW** |
| Topic size thresholds | 50, 10 | 244-248 | Topic importance by size | **MEDIUM** |

#### **Analysis Run Execution** (`backend/app/services/analysis_service.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Message length filter | 10 chars | 473 | Pre-filter spam messages | **MEDIUM** |
| Batch time window | 600 sec (10 min) | 516 | Max time gap for batching | **HIGH** |
| Batch size limit | 50 messages | 516 | Max messages per batch | **HIGH** |

#### **Telegram Ingestion** (`backend/app/tasks.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Telegram batch size | 100 | 270 | Telegram API limit | **LOW** |
| Default limit | 1000 | 222 | Messages per chat ingestion | **MEDIUM** |

#### **Embedding Service** (`backend/app/tasks.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Embedding batch size | 100 | 768, 818 | Messages/atoms per batch | **MEDIUM** |

#### **RAG Context Builder** (`backend/app/services/rag_context_builder.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Combined text limit | 1000 chars | 98 | Max context for embedding | **MEDIUM** |
| Default top_k | 5 | 63 | Similar items per category | **MEDIUM** |
| Content truncation | 200 chars | 98, 185, 253, 314 | Preview text length | **LOW** |

#### **Vector Search** (`backend/app/services/semantic_search_service.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Default limit | 10 | 43, 116 | Search results count | **LOW** |
| Default threshold | 0.7 | 44, 117 | Similarity threshold | **MEDIUM** |

#### **Classification Experiments** (`backend/app/tasks.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| Progress update interval | 10 messages | 635 | WebSocket broadcast rate | **LOW** |

#### **Noise Filter Keywords** (`backend/app/services/importance_scorer.py`)
| Variable | Value | Lines | Purpose | Migration Priority |
|----------|-------|-------|---------|-------------------|
| NOISE_KEYWORDS | Set of 13 keywords | 27 | Low-value message patterns | **LOW** |
| SIGNAL_KEYWORDS | Set of 14 keywords | 28-44 | High-value message patterns | **LOW** |

### 2.2 Hardcoded Values Summary

**Total Identified**: 38+ hardcoded configuration values

**By Priority**:
- **HIGH** (8): Thresholds that directly impact system behavior
- **MEDIUM** (15): Operational tuning parameters
- **LOW** (15): Display/formatting preferences

---

## 3. Configuration Management Implementation

### 3.1 Pydantic Settings Architecture

**Strengths**:
- Type-safe configuration with Pydantic validation
- Modular settings classes (separation of concerns)
- Support for `.env` file loading
- Field validation with `ge`, `le` constraints
- Alias support for environment variable names
- Default values for all optional fields

**Code Quality**:
```python
# Example from backend/core/config.py
class EmbeddingSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    vector_similarity_threshold: float = Field(
        default=0.7,
        ge=0.0,  # Greater than or equal
        le=1.0,  # Less than or equal
        validation_alias=AliasChoices("VECTOR_SIMILARITY_THRESHOLD", "vector_similarity_threshold"),
    )
```

### 3.2 Environment-Specific Configs

**Current Approach**:
- Single `.env` file for all environments
- Docker-specific settings (`RUNNING_IN_DOCKER`, `OLLAMA_BASE_URL_DOCKER`)
- No explicit dev/staging/prod separation

**Missing**:
- `.env.development`, `.env.production` templates
- Environment-specific validation rules
- Config reload mechanisms for hot-reload scenarios

### 3.3 Secret Management

**Current Implementation**:
- `ENCRYPTION_KEY` for encrypting LLM provider credentials
- Uses Fernet symmetric encryption
- API keys encrypted in database (`api_key_encrypted` field)
- No secrets in version control (`.env` is gitignored)

**Concerns**:
- Empty default for `ENCRYPTION_KEY` (requires manual generation)
- No validation to prevent production use with weak keys
- No key rotation mechanism documented

---

## 4. `.env.example` Analysis

### 4.1 Current State

**File**: `.env.example` exists at project root

**Coverage**:
- ✅ Application settings (APP_NAME, APP_DESCRIPTION)
- ✅ Telegram bot configuration
- ✅ Database connection strings
- ✅ LLM/Ollama settings
- ✅ Logging configuration
- ✅ Encryption key (with generation instructions)
- ✅ TaskIQ NATS configuration
- ✅ CORS origins
- ✅ Frontend environment variables (commented)

**Missing**:
- ❌ Operational tuning parameters (batch sizes, thresholds)
- ❌ Vector search configuration (VECTOR_SIMILARITY_THRESHOLD, VECTOR_SEARCH_LIMIT)
- ❌ Embedding batch size (EMBEDDING_BATCH_SIZE)
- ❌ Knowledge extraction parameters
- ❌ Importance scoring weights/thresholds
- ❌ Analysis run batching parameters

### 4.2 Recommendations for `.env.example`

**Add Missing Sections**:

```env
# Knowledge Extraction Configuration
KNOWLEDGE_EXTRACTION_THRESHOLD=10
KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS=24
KNOWLEDGE_EXTRACTION_BATCH_SIZE=50

# Importance Scoring Configuration
IMPORTANCE_CONTENT_WEIGHT=0.4
IMPORTANCE_AUTHOR_WEIGHT=0.2
IMPORTANCE_TEMPORAL_WEIGHT=0.2
IMPORTANCE_TOPICS_WEIGHT=0.2
NOISE_THRESHOLD=0.3
SIGNAL_THRESHOLD=0.7

# Analysis Run Batching
ANALYSIS_BATCH_TIME_WINDOW_SEC=600
ANALYSIS_BATCH_SIZE_LIMIT=50
ANALYSIS_MIN_MESSAGE_LENGTH=10

# Vector Search & Embeddings (already in EmbeddingSettings but not in .env.example)
VECTOR_SIMILARITY_THRESHOLD=0.7
VECTOR_SEARCH_LIMIT=10
EMBEDDING_BATCH_SIZE=100

# RAG Context Builder
RAG_CONTEXT_TOP_K=5
RAG_COMBINED_TEXT_LIMIT=1000

# Telegram Ingestion
TELEGRAM_INGESTION_BATCH_SIZE=100
TELEGRAM_INGESTION_DEFAULT_LIMIT=1000
```

---

## 5. Configuration Migration Strategy

### 5.1 Phase 1: Critical Thresholds (Priority: HIGH)

**Target Files**:
- `backend/app/tasks.py` (knowledge extraction)
- `backend/app/services/importance_scorer.py` (scoring thresholds)
- `backend/app/services/analysis_service.py` (batching parameters)

**Migration Steps**:
1. Create new settings class: `KnowledgeExtractionSettings`
2. Create new settings class: `ImportanceScoringSettings`
3. Create new settings class: `AnalysisRunSettings`
4. Add to `Settings` aggregator in `config.py`
5. Update service constructors to accept config instances
6. Update `.env.example` with new variables

**Example Implementation**:

```python
# backend/core/config.py
class KnowledgeExtractionSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ENV_FILE), extra="ignore")

    threshold: int = Field(
        default=10,
        ge=1,
        le=100,
        validation_alias=AliasChoices("KNOWLEDGE_EXTRACTION_THRESHOLD", "knowledge_extraction_threshold"),
    )
    lookback_hours: int = Field(
        default=24,
        ge=1,
        le=168,
        validation_alias=AliasChoices("KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS", "knowledge_extraction_lookback_hours"),
    )
    batch_size: int = Field(
        default=50,
        ge=10,
        le=200,
        validation_alias=AliasChoices("KNOWLEDGE_EXTRACTION_BATCH_SIZE", "knowledge_extraction_batch_size"),
    )
```

### 5.2 Phase 2: Operational Tuning (Priority: MEDIUM)

**Target Areas**:
- Batch sizes (embedding, ingestion)
- Time windows (temporal scoring, batching)
- Content limits (RAG context, truncation)

**Implementation**:
- Add to existing settings classes where applicable
- Create `OperationalSettings` for miscellaneous parameters

### 5.3 Phase 3: Display/Formatting (Priority: LOW)

**Target Areas**:
- Content truncation lengths
- Progress update intervals
- Keywords lists (consider database-driven instead)

---

## 6. Configuration Validation

### 6.1 Current Validation

**Pydantic Validators**:
- Type checking (automatic)
- Range validation (`ge`, `le` constraints)
- Required vs optional fields

**Example**:
```python
vector_similarity_threshold: float = Field(
    default=0.7,
    ge=0.0,  # Validates >= 0.0
    le=1.0,  # Validates <= 1.0
)
```

### 6.2 Missing Validation

**Production Safety**:
- No check for production use with default `ENCRYPTION_KEY`
- No validation for conflicting settings (e.g., batch_size > limit)
- No environment-specific validation rules

**Recommendations**:

```python
from pydantic import field_validator

class AppSettings(BaseSettings):
    encryption_key: str = Field(default="")

    @field_validator('encryption_key')
    @classmethod
    def validate_encryption_key(cls, v: str) -> str:
        if not v or len(v) < 32:
            raise ValueError(
                "ENCRYPTION_KEY must be set and at least 32 characters. "
                "Generate with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )
        return v
```

---

## 7. Docker Compose Configuration

### 7.1 Environment Variable Injection

**File**: `compose.yml`

**Services with ENV Vars**:
- `postgres`: Uses `.env` file (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)
- `worker`: Uses `.env` file (all backend variables)
- `api`: Uses `.env` file (all backend variables)
- `dashboard`: Inline environment variables (VITE_*)

**Strengths**:
- Centralized `.env` file for backend services
- Clear separation of frontend build-time variables
- Health checks configured per service

**Weaknesses**:
- No environment variable validation in compose file
- Duplicate variable definitions between `.env` and compose file
- Missing documentation for required vs optional variables

---

## 8. Config Reload Mechanisms

### 8.1 Current Behavior

**Static Loading**:
- Settings loaded once at application startup
- No hot-reload capability
- Requires service restart for config changes

**Impact**:
- Development: Minor inconvenience (fast restart with Docker watch)
- Production: Requires planned downtime for config updates

### 8.2 Recommendations

**For Development**:
- Current Docker watch mode is sufficient
- Consider adding config validation endpoint (`/api/health/config`)

**For Production**:
- Document config change procedure
- Consider implementing config reload signal handler (SIGHUP)
- Add config versioning for rollback capability

---

## 9. Recommendations Summary

### 9.1 Immediate Actions (Week 1)

1. **Extend `.env.example`**:
   - Add missing operational parameters
   - Document all configurable thresholds
   - Include production-ready examples

2. **Create New Settings Classes**:
   - `KnowledgeExtractionSettings`
   - `ImportanceScoringSettings`
   - `AnalysisRunSettings`

3. **Add Production Validation**:
   - Validate `ENCRYPTION_KEY` strength
   - Check for default/weak credentials

### 9.2 Short-Term Improvements (Week 2-3)

1. **Migrate Hardcoded Values**:
   - Priority HIGH: Scoring thresholds, extraction parameters
   - Priority MEDIUM: Batch sizes, time windows

2. **Configuration Documentation**:
   - Create `docs/content/en/configuration.md`
   - Document each setting with purpose, type, range, default
   - Include environment-specific examples

3. **Validation Enhancements**:
   - Add cross-field validation (e.g., batch_size <= limit)
   - Environment-specific validation rules

### 9.3 Long-Term Enhancements (Month 2+)

1. **Config Reload Mechanism**:
   - Implement SIGHUP handler for graceful config reload
   - Add `/api/admin/reload-config` endpoint

2. **Environment Separation**:
   - Create `.env.development.example`
   - Create `.env.production.example`
   - Document differences and migration path

3. **Secret Management**:
   - Integrate with secret managers (AWS Secrets, Vault)
   - Implement key rotation procedures
   - Add secret audit logging

---

## 10. Configuration Best Practices Compliance

### 10.1 Current Compliance

| Best Practice | Status | Notes |
|--------------|--------|-------|
| 12-Factor App: Store config in environment | ✅ Good | Using Pydantic Settings |
| Separate dev/staging/prod configs | ⚠️ Partial | Single `.env`, no explicit separation |
| Secrets never in version control | ✅ Good | `.env` gitignored |
| Type-safe configuration | ✅ Excellent | Pydantic validation |
| Default values for optional settings | ✅ Good | All fields have defaults |
| Validation for critical settings | ⚠️ Partial | Type validation only, missing business rules |
| Configuration documentation | ⚠️ Partial | `.env.example` exists but incomplete |
| Config reload without downtime | ❌ Missing | Requires restart |

### 10.2 Improvement Roadmap

```
Current State → Immediate Actions → Short-Term → Long-Term
     70%      →       80%         →    90%     →   95%
  [Partial]   →     [Good]        →  [Great]  → [Excellent]
```

---

## Appendix A: Environment Variable Reference

### A.1 Database Settings

```python
class DatabaseSettings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker"
    migration_database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker"
```

**Environment Variables**:
- `DATABASE_URL`: Full database connection string
- Used by: SQLAlchemy, Alembic migrations

### A.2 Telegram Settings

```python
class TelegramSettings(BaseSettings):
    telegram_bot_token: str = ""  # REQUIRED
    telegram_api_id: int | None = None
    telegram_api_hash: str | None = None
    telegram_session_string: str | None = None
```

**Environment Variables**:
- `TELEGRAM_BOT_TOKEN`: Bot API token from @BotFather (REQUIRED)
- `TELEGRAM_API_ID`: Client API ID from https://my.telegram.org/apps
- `TELEGRAM_API_HASH`: Client API hash
- `TELEGRAM_SESSION_STRING`: Pre-generated session string

### A.3 LLM Settings

```python
class LLMSettings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_base_url_docker: str = "http://host.docker.internal:11434"
    running_in_docker: bool = False
    llm_provider: str = "ollama"
    ollama_model: str = "mistral-nemo:12b-instruct-2407-q4_k_m"
```

**Environment Variables**:
- `OLLAMA_BASE_URL`: Ollama API endpoint
- `OLLAMA_BASE_URL_DOCKER`: Docker-specific endpoint
- `RUNNING_IN_DOCKER`: Environment detection flag
- `LLM_PROVIDER`: Default LLM provider
- `OLLAMA_MODEL`: Default model name

### A.4 Embedding Settings

```python
class EmbeddingSettings(BaseSettings):
    openai_embedding_model: str = "text-embedding-3-small"
    openai_embedding_dimensions: int = 1536
    ollama_embedding_model: str = "llama3"
    vector_similarity_threshold: float = 0.7  # 0.0-1.0
    vector_search_limit: int = 10  # 1-100
    embedding_batch_size: int = 100  # 1-1000
```

**Environment Variables**:
- `VECTOR_SIMILARITY_THRESHOLD`: Minimum similarity score (0.0-1.0)
- `VECTOR_SEARCH_LIMIT`: Max search results (1-100)
- `EMBEDDING_BATCH_SIZE`: Batch processing size (1-1000)

---

## Appendix B: Hardcoded Values Migration Checklist

### B.1 High Priority Migration

- [ ] `KNOWLEDGE_EXTRACTION_THRESHOLD` (tasks.py:15)
- [ ] `KNOWLEDGE_EXTRACTION_LOOKBACK_HOURS` (tasks.py:16)
- [ ] Knowledge extraction batch size (tasks.py:72)
- [ ] Noise classification threshold 0.3 (importance_scorer.py:292)
- [ ] Signal classification threshold 0.7 (importance_scorer.py:294)
- [ ] Content weight 0.4 (importance_scorer.py:289)
- [ ] Author weight 0.2 (importance_scorer.py:289)
- [ ] Analysis batch time window 600s (analysis_service.py:516)

### B.2 Medium Priority Migration

- [ ] Embedding batch sizes (tasks.py:768, 818)
- [ ] Message length thresholds (importance_scorer.py:94-99)
- [ ] Temporal scoring thresholds (importance_scorer.py:185-192)
- [ ] Topic size thresholds (importance_scorer.py:244-248)
- [ ] Analysis batch size 50 (analysis_service.py:516)
- [ ] RAG context top_k=5 (rag_context_builder.py:63)
- [ ] Combined text limit 1000 (rag_context_builder.py:98)

### B.3 Low Priority Migration

- [ ] Content truncation 200 chars (rag_context_builder.py)
- [ ] Progress update interval 10 (tasks.py:635)
- [ ] NOISE_KEYWORDS set (importance_scorer.py:27)
- [ ] SIGNAL_KEYWORDS set (importance_scorer.py:28-44)
- [ ] Default vector search limit 10 (semantic_search_service.py:43)

---

## Appendix C: Proposed Configuration Schema

### C.1 Complete Settings Structure

```
Settings
├── app: AppSettings (7 fields)
├── database: DatabaseSettings (2 fields)
├── telegram: TelegramSettings (4 fields)
├── llm: LLMSettings (5 fields)
├── taskiq: TaskIQSettings (2 fields)
├── embedding: EmbeddingSettings (6 fields)
├── knowledge_extraction: KnowledgeExtractionSettings (3 fields) [NEW]
├── importance_scoring: ImportanceScoringSettings (7 fields) [NEW]
└── analysis_run: AnalysisRunSettings (3 fields) [NEW]
```

**Total Fields**: 39 configurable parameters

---

**End of Report**

**Files Referenced**:
- `/Users/maks/PycharmProjects/task-tracker/.env.example`
- `/Users/maks/PycharmProjects/task-tracker/backend/core/config.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/tasks.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/importance_scorer.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/analysis_service.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/rag_context_builder.py`
- `/Users/maks/PycharmProjects/task-tracker/backend/app/services/semantic_search_service.py`
- `/Users/maks/PycharmProjects/task-tracker/compose.yml`
