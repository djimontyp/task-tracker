# Configuration Reference

**Last Updated:** October 26, 2025
**Status:** Complete - Operational Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables Reference](#environment-variables-reference)
3. [Configuration Domains](#configuration-domains)
4. [Validation Rules](#validation-rules)
5. [Hardcoded Values Migration](#hardcoded-values-migration)
6. [Configuration Best Practices](#configuration-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides a complete reference for configuring the Task Tracker system. All configuration is managed through environment variables using Pydantic Settings with type validation and constraints. The system reads configuration from a `.env` file at startup (requires service restart for changes).

**Key Principles:**
- Type-safe validation with Pydantic
- Environment variable override for all settings
- Sensible defaults for optional parameters
- Required parameters enforced at startup

---

## Environment Variables Reference

### All Variables

| Variable Name | Category | Type | Required | Default | Description |
|---------------|----------|------|----------|---------|-------------|
| **Application Settings** |
| `APP_NAME` | App | string | No | Pulse Radar | Display name for the application |
| `APP_DESCRIPTION` | App | string | No | (see below) | Application description text |
| `WEBAPP_URL` | App | string | No | http://localhost:8000/webapp | Web application URL for clients |
| `API_BASE_URL` | App | string | No | http://localhost:8000 | API base URL for client requests |
| `WEBHOOK_BASE_URL` | App | string | No | http://localhost | Webhook endpoint base URL |
| `LOG_LEVEL` | App | string | No | INFO | Logging verbosity: DEBUG, INFO, WARNING, ERROR |
| `ENCRYPTION_KEY` | App | string | **Yes** | (empty) | Fernet encryption key for credentials storage |
| **Database** |
| `DATABASE_URL` | Database | string | No | postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker | PostgreSQL async connection string |
| **Telegram Bot Integration** |
| `TELEGRAM_BOT_TOKEN` | Telegram | string | **Yes** | (empty) | Bot token from @BotFather on Telegram |
| `TELEGRAM_API_ID` | Telegram | integer | No | None | Telegram client API ID from my.telegram.org |
| `TELEGRAM_API_HASH` | Telegram | string | No | None | Telegram client API hash from my.telegram.org |
| `TELEGRAM_SESSION_STRING` | Telegram | string | No | None | Pre-generated session string for client mode |
| **LLM & AI Settings** |
| `OLLAMA_BASE_URL` | LLM | string | No | http://localhost:11434 | Ollama API endpoint (local development) |
| `OLLAMA_BASE_URL_DOCKER` | LLM | string | No | http://host.docker.internal:11434 | Ollama API endpoint (Docker containers) |
| `RUNNING_IN_DOCKER` | LLM | boolean | No | false | Set to true when running inside Docker |
| `LLM_PROVIDER` | LLM | string | No | ollama | Default LLM provider: ollama, openai, etc |
| `OLLAMA_MODEL` | LLM | string | No | mistral-nemo:12b-instruct-2407-q4_k_m | Default Ollama model identifier |
| **Task Queue & Broker** |
| `TASKIQ_NATS_SERVERS` | TaskIQ | string | No | nats://nats:4222 | NATS broker connection URL |
| `TASKIQ_NATS_QUEUE` | TaskIQ | string | No | taskiq | NATS queue name for task distribution |
| **Vector Search & Embeddings** |
| `OPENAI_EMBEDDING_MODEL` | Embedding | string | No | text-embedding-3-small | OpenAI embedding model name |
| `OPENAI_EMBEDDING_DIMENSIONS` | Embedding | integer | No | 1536 | OpenAI embedding vector dimensions |
| `OLLAMA_EMBEDDING_MODEL` | Embedding | string | No | llama3 | Ollama embedding model name |
| `VECTOR_SIMILARITY_THRESHOLD` | Embedding | float | No | 0.7 | Minimum similarity score (0.0-1.0) for vector search |
| `VECTOR_SEARCH_LIMIT` | Embedding | integer | No | 10 | Maximum number of vector search results (1-100) |
| `EMBEDDING_BATCH_SIZE` | Embedding | integer | No | 100 | Batch size for embedding operations (1-1000) |

---

## Configuration Domains

### Application Settings

Configure application metadata and endpoints.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `APP_NAME` | string | Pulse Radar | Application display name in UI |
| `APP_DESCRIPTION` | string | Long description | Shown to users about the system |
| `WEBAPP_URL` | string | http://localhost:8000/webapp | URL where web app is accessible |
| `API_BASE_URL` | string | http://localhost:8000 | API endpoint for frontend requests |
| `WEBHOOK_BASE_URL` | string | http://localhost | Base URL for Telegram webhook |
| `LOG_LEVEL` | string | INFO | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `ENCRYPTION_KEY` | string | (required) | Fernet symmetric encryption key for secrets |

**Usage**: Configure these for your deployment environment. URLs must be accessible from both clients and the Telegram infrastructure.

### Database Settings

Connect to PostgreSQL for persistent storage.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `DATABASE_URL` | string | postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker | Full async connection string |

**Connection String Format:**
```
postgresql+asyncpg://username:password@host:port/database
```

**Components:**
- `username`: PostgreSQL user (typically postgres)
- `password`: User password from POSTGRES_PASSWORD
- `host`: Database hostname (localhost or postgres)
- `port`: Database port (5555 in Docker, 5432 standard)
- `database`: Database name (tasktracker)

### Telegram Bot Integration

Integrate with Telegram for message ingestion.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | string | (required) | Bot token from @BotFather |
| `TELEGRAM_API_ID` | integer | None | Client API ID (optional, for advanced features) |
| `TELEGRAM_API_HASH` | string | None | Client API hash (optional) |
| `TELEGRAM_SESSION_STRING` | string | None | Pre-generated session (optional) |

**Required**: Only `TELEGRAM_BOT_TOKEN` is required for basic webhook ingestion.

**Optional Features**: API ID, hash, and session enable advanced client-mode features (not used by default).

### LLM & AI Settings

Configure language models for content analysis.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `OLLAMA_BASE_URL` | string | http://localhost:11434 | Ollama endpoint (development) |
| `OLLAMA_BASE_URL_DOCKER` | string | http://host.docker.internal:11434 | Ollama endpoint (Docker) |
| `RUNNING_IN_DOCKER` | boolean | false | Set to true in containerized environments |
| `LLM_PROVIDER` | string | ollama | Active LLM provider name |
| `OLLAMA_MODEL` | string | mistral-nemo:12b-instruct-2407-q4_k_m | Default Ollama model |

**Provider Selection**: System automatically selects the correct URL based on `RUNNING_IN_DOCKER` flag.

**Model Selection**: Model must be pre-pulled in Ollama before use. Adjust based on available GPU memory and inference speed requirements.

### Task Queue & Broker Settings

Configure background job processing via NATS.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `TASKIQ_NATS_SERVERS` | string | nats://nats:4222 | NATS broker connection URL |
| `TASKIQ_NATS_QUEUE` | taskiq | string | Queue name for task routing |

**Connection**: Format is `nats://hostname:port`. In Docker, the hostname is `nats`.

### Vector Search & Embeddings

Configure semantic search and embedding operations.

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `OPENAI_EMBEDDING_MODEL` | string | text-embedding-3-small | — | OpenAI model name for embeddings |
| `OPENAI_EMBEDDING_DIMENSIONS` | integer | 1536 | — | Vector dimensions (varies by model) |
| `OLLAMA_EMBEDDING_MODEL` | string | llama3 | — | Ollama model name for embeddings |
| `VECTOR_SIMILARITY_THRESHOLD` | float | 0.7 | 0.0-1.0 | Minimum similarity score for matches |
| `VECTOR_SEARCH_LIMIT` | integer | 10 | 1-100 | Maximum search results |
| `EMBEDDING_BATCH_SIZE` | integer | 100 | 1-1000 | Batch size for processing |

**Threshold Tuning**:
- Lower threshold (0.5-0.6): More results, lower precision
- Default (0.7): Balanced precision and recall
- Higher threshold (0.8-0.9): Fewer results, higher precision

---

## Validation Rules

### Type Validation

All environment variables are validated for correct type:

| Type | Validation | Example |
|------|-----------|---------|
| `string` | Any text value | "mistral-nemo:12b" |
| `integer` | Whole numbers only | "1536" |
| `boolean` | "true" or "false" (case-insensitive) | "true", "false" |
| `float` | Decimal numbers | "0.7" |

**Invalid Examples:**
- Setting `VECTOR_SIMILARITY_THRESHOLD=invalid` → TypeError
- Setting `VECTOR_SEARCH_LIMIT=10.5` → ValueError (must be integer)
- Setting `EMBEDDING_BATCH_SIZE=negative` → ValueError

### Range Constraints

Numeric fields have minimum and maximum bounds:

| Variable | Min | Max | Purpose |
|----------|-----|-----|---------|
| `VECTOR_SIMILARITY_THRESHOLD` | 0.0 | 1.0 | Similarity must be a probability |
| `VECTOR_SEARCH_LIMIT` | 1 | 100 | Reasonable search result bounds |
| `EMBEDDING_BATCH_SIZE` | 1 | 1000 | Memory-efficient batching |

**Invalid Examples:**
- `VECTOR_SIMILARITY_THRESHOLD=1.5` → Out of range (> 1.0)
- `VECTOR_SEARCH_LIMIT=0` → Out of range (< 1)
- `EMBEDDING_BATCH_SIZE=5000` → Out of range (> 1000)

### Required Fields

These variables **must** be set or the application will not start:

| Variable | Consequence |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | No webhook ingestion possible |
| `ENCRYPTION_KEY` | Cannot store encrypted credentials |

**Error on Missing**:
```
ValidationError: TELEGRAM_BOT_TOKEN must not be empty
ValidationError: ENCRYPTION_KEY must be provided
```

### Default Values

Optional variables have sensible defaults and will work without configuration:

- `OLLAMA_BASE_URL`: Defaults to localhost development setup
- `DATABASE_URL`: Connects to Docker postgres service
- `LOG_LEVEL`: Set to INFO (production-appropriate)
- `VECTOR_SIMILARITY_THRESHOLD`: 0.7 (balanced precision)

---

## Hardcoded Values Migration

The system contains hardcoded operational parameters that should be migrated to environment variables. This section tracks required configuration for optimal performance.

### HIGH Priority: Critical Thresholds

These parameters directly impact system behavior and should always be configurable.

| Parameter | Current Value | File:Line | Purpose | Validation |
|-----------|---------------|-----------|---------|-----------|
| Knowledge extraction minimum messages | 10 | tasks.py:15 | Auto-extract trigger | 1-100 |
| Knowledge extraction lookback hours | 24 | tasks.py:16 | Time window for pending messages | 1-168 |
| Noise classification threshold | 0.3 | importance_scorer.py:292 | Noise boundary score | 0.0-1.0 |
| Signal classification threshold | 0.7 | importance_scorer.py:294 | Signal boundary score | 0.0-1.0 |
| Content weight factor | 0.4 | importance_scorer.py:289 | Importance calculation weight | 0.0-1.0 |
| Author weight factor | 0.2 | importance_scorer.py:289 | Importance calculation weight | 0.0-1.0 |
| Analysis run batch time window | 600 (seconds) | analysis_service.py:516 | Maximum gap for message batching | 60-3600 |
| Analysis run batch size limit | 50 | analysis_service.py:516 | Max messages per analysis batch | 10-500 |

**Recommendation**: Migrate immediately. These thresholds require operational tuning and should not be hardcoded.

### MEDIUM Priority: Operational Tuning

These parameters tune system performance but have reasonable defaults.

| Parameter | Current Value | File:Line | Purpose | Priority |
|-----------|---------------|-----------|---------|----------|
| Embedding batch size | 100 | tasks.py:768, 818 | Batch processing efficiency | Batch operations |
| Message length threshold (scoring) | 10, 50, 200 | importance_scorer.py:94-99 | Content scoring breakpoints | Importance calculation |
| Temporal scoring thresholds | 1h, 24h, 168h | importance_scorer.py:185-192 | Recency score windows | Importance calculation |
| Topic size thresholds | 50, 10 | importance_scorer.py:244-248 | Topic importance by size | Importance calculation |
| RAG context top_k | 5 | rag_context_builder.py:63 | Similar items per category | Context quality |
| Combined text limit | 1000 characters | rag_context_builder.py:98 | Max context for embedding | Memory efficiency |
| Message length pre-filter | 10 characters | analysis_service.py:473 | Spam message filtering | Data quality |

**Recommendation**: Migrate as secondary priority. Useful for performance tuning without code changes.

### LOW Priority: Display & Formatting

These parameters affect display but have minimal impact on system behavior.

| Parameter | Current Value | File:Line | Purpose |
|-----------|---------------|-----------|---------|
| Content truncation | 200 characters | rag_context_builder.py | Preview text length |
| Progress update interval | 10 messages | tasks.py:635 | WebSocket broadcast rate |
| Noise keywords set | 13 keywords | importance_scorer.py:27 | Low-value patterns |
| Signal keywords set | 14 keywords | importance_scorer.py:28-44 | High-value patterns |
| Default vector search limit | 10 | semantic_search_service.py:43 | Results count |

**Recommendation**: Migrate after critical items. Consider database-driven keywords instead of configuration.

### Migration Requirements

For each hardcoded value, provide:
1. Environment variable name (e.g., `KNOWLEDGE_EXTRACTION_THRESHOLD`)
2. Type declaration (integer, float, string)
3. Validation constraints (min, max, allowed values)
4. Default value matching current behavior
5. Documentation of purpose and impact

---

## Configuration Best Practices

### Environment Variable Setup

**1. Create `.env` file from `.env.example`**

The `.env.example` file in the project root provides a template:

```
cp .env.example .env
```

Edit `.env` with your values. This file is gitignored and should never be committed.

**2. Required fields for startup**

Before starting services, verify these are set:
- `TELEGRAM_BOT_TOKEN` - from @BotFather
- `ENCRYPTION_KEY` - generate with Python: `from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())`

**3. Environment-specific values**

Change these per environment:
- `APP_NAME`, `APP_DESCRIPTION` - for environment identification
- `WEBHOOK_BASE_URL` - must match your deployment domain
- `API_BASE_URL` - must be accessible from clients
- `WEBAPP_URL` - where frontend is hosted
- `LOG_LEVEL` - DEBUG for development, INFO for production

### Secret Management

**API Keys and Credentials:**
- Never commit `.env` to version control
- Use strong `ENCRYPTION_KEY` (generates ~50 characters)
- Rotate `TELEGRAM_BOT_TOKEN` if compromised
- Store `.env` securely on production servers

**Verification:**
```
# Check encryption key is set
echo $ENCRYPTION_KEY | wc -c  # Should be ~45+ characters
```

### Environment-Specific Configurations

**Development**:
- `OLLAMA_BASE_URL=http://localhost:11434`
- `RUNNING_IN_DOCKER=false`
- `LOG_LEVEL=DEBUG`
- `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5555/tasktracker`

**Docker Compose Development**:
- `OLLAMA_BASE_URL_DOCKER=http://host.docker.internal:11434`
- `RUNNING_IN_DOCKER=true`
- Same other settings

**Production**:
- `OLLAMA_BASE_URL=http://ollama-service:11434` (internal)
- `LOG_LEVEL=INFO`
- `DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@db-server:5432/tasktracker`
- All URLs must use real domain names

### Required Parameter Combinations

**For Basic Operation:**
- Requires: `TELEGRAM_BOT_TOKEN`, `ENCRYPTION_KEY`
- Database: Uses default DATABASE_URL connecting to Docker postgres
- LLM: Uses default Ollama settings

**For Production Deployment:**
- All basic parameters
- Real domain in `WEBHOOK_BASE_URL`, `API_BASE_URL`, `WEBAPP_URL`
- Strong `ENCRYPTION_KEY`
- Production database credentials and host
- `LOG_LEVEL=INFO` or `WARNING`

**For Advanced Telegram Features:**
- Basic parameters
- Plus: `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_SESSION_STRING`
- Enables client-mode features (not used by default)

### Common Configuration Mistakes

| Mistake | Symptom | Solution |
|---------|---------|----------|
| Empty `TELEGRAM_BOT_TOKEN` | "Webhook cannot initialize" | Get token from @BotFather on Telegram |
| Wrong `WEBHOOK_BASE_URL` | Telegram cannot reach webhook | Use public domain, test with curl |
| Invalid `ENCRYPTION_KEY` | "Invalid encryption key format" | Generate with Fernet.generate_key() |
| `RUNNING_IN_DOCKER=false` in container | "Connection refused to Ollama" | Set to `true`, use Docker-specific URL |
| `VECTOR_SIMILARITY_THRESHOLD=2.0` | Type validation error | Must be 0.0-1.0 |
| Missing `DATABASE_URL` in production | Cannot connect to database | Explicitly set connection string |

---

## Troubleshooting

### Application Won't Start

**Error: "TELEGRAM_BOT_TOKEN must not be empty"**
- Check `.env` file exists and is readable
- Verify `TELEGRAM_BOT_TOKEN` has a value (not just the key without value)
- Regenerate token from @BotFather if needed

**Error: "ENCRYPTION_KEY must be provided"**
- Generate key: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
- Add to `.env`: `ENCRYPTION_KEY=your_generated_key_here`
- Restart service

### Database Connection Issues

**Error: "Connection refused to postgresql"**
- Verify PostgreSQL is running: `docker compose logs postgres`
- Check `DATABASE_URL` format is correct
- Verify port 5555 (or configured port) is accessible
- Ensure database `tasktracker` exists

**Error: "could not translate host name "postgres" to address"**
- Using wrong hostname outside Docker
- Development: Use `localhost`
- Docker: Use `postgres`
- Verify `RUNNING_IN_DOCKER` flag matches environment

### LLM Connection Failures

**Error: "Connection refused to http://localhost:11434"**
- Ollama not running: `ollama serve`
- Wrong URL: Development uses localhost, Docker uses `host.docker.internal`
- Check `RUNNING_IN_DOCKER` flag is set correctly

**Error: "Model 'mistral-nemo:12b' not found"**
- Pull model first: `ollama pull mistral-nemo:12b-instruct-2407-q4_k_m`
- Check `OLLAMA_MODEL` value matches available model
- List available: `ollama list`

### Webhook Not Receiving Messages

**Error: "Telegram cannot reach webhook"**
- Check `WEBHOOK_BASE_URL` is publicly accessible
- Verify firewall allows port 443 (HTTPS)
- Test connectivity: `curl -I https://your-domain.com/webhook/telegram`
- Check logs: `docker compose logs api | grep webhook`

**Error: "Invalid webhook URL"**
- Must use HTTPS (Telegram requirement)
- Must be public domain (not localhost or IP)
- Must return 200 OK on GET request
- Must accept POST requests

### Configuration Validation Errors

**Error: "VECTOR_SIMILARITY_THRESHOLD: 1.5 is not less than or equal to 1.0"**
- Value out of valid range (0.0-1.0)
- Check `.env` value: `VECTOR_SIMILARITY_THRESHOLD=0.8` (valid)

**Error: "EMBEDDING_BATCH_SIZE: 'abc' is not a valid integer"**
- Type mismatch: must be whole number
- Check `.env` value: `EMBEDDING_BATCH_SIZE=100` (not "abc")

**Error: "RUNNING_IN_DOCKER: 'yes' is not a valid boolean"**
- Boolean must be "true" or "false"
- Check `.env` value: `RUNNING_IN_DOCKER=true` (not "yes")

### Performance Issues

**Slow embedding operations**
- Check `EMBEDDING_BATCH_SIZE`: increase if memory available (default 100)
- Check `OLLAMA_MODEL`: ensure sufficient GPU memory for model
- Monitor: `docker compose logs worker | grep embedding`

**Slow vector search results**
- Check `VECTOR_SEARCH_LIMIT`: lower if timeout occurs
- Check `VECTOR_SIMILARITY_THRESHOLD`: increase to reduce computations
- Verify Postgres pgvector index exists

**High memory usage**
- Reduce `EMBEDDING_BATCH_SIZE` (default 100)
- Reduce `VECTOR_SEARCH_LIMIT` (default 10)
- Check Ollama model size: `ollama list`

---

**End of Configuration Reference**

**Related Documentation:**
- [System Architecture](../architecture/overview.md) - Overall system design
- [Event Flow](../event-flow.md) - Message processing pipeline
- [Knowledge Extraction](../knowledge-extraction.md) - Knowledge system details
