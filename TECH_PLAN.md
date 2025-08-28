# Технічне завдання: Universal Issue Detection & Processing System

## 🎯 **Мета проекту**

Створити універсальну систему автоматичного виявлення та класифікації проблем з різних комунікаційних каналів команд з гнучкими можливостями обробки та перенаправлення результатів.

---

## 📋 **Функціональні вимоги**

### **Core Features:**
1. **Source Adapters System**
   - Telegram integration (primary)
   - Slack adapter (майбутнє)
   - Discord adapter (майбутнє)
   - Email integration (майбутнє)
   - Generic API adapter для custom sources
   - Plugin architecture для нових джерел

2. **Universal Message Processing**
   - Batch обробка повідомлень по запиту або розкладу
   - Періодичне стягування нових повідомлень (polling)
   - Відновлення пропущених повідомлень після downtime
   - Source-agnostic message normalization

3. **AI Processing Engine**
   - Flexible LLM abstraction layer
   - Issue detection та classification
   - Category classification (bug, feature, question, info)
   - Priority assessment (high, medium, low)
   - Entity extraction (проект, технології, дедлайни)
   - Sentiment analysis

4. **Output Processing System**
   - Task creation processors (Jira, Linear, Asana)
   - Notification processors (Email, Slack, Teams)
   - Report generators (Analytics, Summaries)
   - Webhook processors для custom integrations
   - File export processors (JSON, CSV, Excel)
   - Plugin architecture для custom outputs

5. **Flexible LLM Support**
   - Локальні LLM (Ollama) для розробки/privacy
   - Cloud LLM (OpenAI, Anthropic) для production
   - Runtime переключення між провайдерами
   - Configurable accuracy vs cost trade-offs

6. **CLI Interface**
   - Interactive CLI з arrow navigation
   - Source management commands
   - Output processor configuration
   - Manual triggers для обробки
   - Scheduled jobs configuration
   - Plugin management interface

### **Advanced Features:**
- Duplicate detection (схожі проблеми)
- Context-aware аналіз (розуміння thread context)
- Integration APIs (Jira, Linear, Asana)
- Team analytics та performance metrics

---

## 🔧 **Технічні вимоги**

### **Модульна Архітектура:**
- **Core Engine:** Typer CLI application
- **CLI Interface:** Typer + Rich для interactive management
- **Database:** SQLModel + PostgreSQL
- **Migrations:** Alembic для schema evolution
- **Task Queue:** TaskIQ для async processing
- **Scheduler:** TaskIQ scheduler для periodic jobs
- **Configuration:** Pydantic Settings + YAML configs

### **Plugin Architecture:**
```
├── adapters/              # Source adapters
│   ├── base.py           # AbstractSourceAdapter
│   ├── telegram.py       # TelegramAdapter
│   ├── slack.py          # SlackAdapter (future)
│   ├── discord.py        # DiscordAdapter (future)
│   └── email.py          # EmailAdapter (future)
├── processors/           # Output processors  
│   ├── base.py           # AbstractOutputProcessor
│   ├── task_creator.py   # TaskCreationProcessor
│   ├── notifier.py       # NotificationProcessor
│   ├── reporter.py       # ReportingProcessor
│   └── webhook.py        # WebhookProcessor
├── llm/                  # LLM providers
│   ├── base.py           # AbstractLLMProvider
│   ├── ollama.py         # OllamaProvider
│   ├── openai.py         # OpenAIProvider
│   └── anthropic.py      # AnthropicProvider
└── core/                 # Core processing engine
    ├── message_processor.py
    ├── classification.py
    └── pipeline.py
```

### **Database Schema Design (SQLModel):**
```sql
-- Core normalized schema
sources (id, type, name, config, is_active, created_at)
channels (id, source_id, external_id, name, config, created_at)  
messages (id, channel_id, external_message_id, content, author, timestamp)
issues (id, message_id, classification, category, priority, confidence, created_at)
processing_jobs (id, channel_id, processor_type, status, config, started_at, completed_at)
outputs (id, issue_id, processor_type, external_id, status, created_at)
llm_providers (id, name, type, config, is_active, usage_stats)
```

### **LLM Providers:**
- **Local:** Ollama (llama3.1, qwen, etc.)
- **Cloud:** OpenAI GPT-4, Anthropic Claude, OpenRouter
- **Switching:** Runtime configuration через env vars або UI

### **Task Queue Choice - TaskIQ:**
- **Full async support:** На відміну від Celery, TaskIQ natively підтримує async/await
- **FastAPI integration:** Краща інтеграція з async FastAPI backend
- **Modern architecture:** Сучасніший підхід до distributed task processing
- **Simpler setup:** Менше boilerplate code порівняно з Celery
- **Type safety:** Краща підтримка Python typing

### **CLI Interface Choice:**
- **Typer:** Modern CLI framework з automatic help generation
- **Rich:** Beautiful terminal output, progress bars, tables, syntax highlighting  
- **Interactive Menus:** Arrow key navigation або numeric selection (1,2,3)
- **Real-time Updates:** Live progress bars для batch processing
- **Cross-platform:** Works на Windows, macOS, Linux
- **Zero Dependencies:** Не потребує browser або web server

### **Database Choice - SQLModel + PostgreSQL:**
- **SQLModel ORM:** Type-safe database operations з async support
- **Alembic:** Database migrations для schema evolution
- **PostgreSQL:** Production-ready RDBMS з JSON support
- **Async Support:** Повна async/await інтеграція з FastAPI
- **ACID Transactions:** Reliable data consistency

### **Technical Advantages:**
- **Plugin Architecture vs Monolithic:** Extensible design для нових sources/outputs
- **SQLModel vs Sync ORM:** High-performance concurrent operations
- **pytest-asyncio vs Standard Testing:** Proper async workflow testing
- **TaskIQ vs Celery:** Full async support, modern distributed processing
- **Normalized Schema vs Document DB:** Proper relationships, ACID transactions
- **Abstract Base Classes:** Type-safe plugin contracts з MyPy validation
- **Pydantic Configuration:** Type-safe plugin config з validation
- **Multi-Source Architecture:** Future-proof для Slack, Discord, Email integration
- **Flexible Output System:** Adaptable для будь-які business requirements
- **Source-Agnostic Processing:** Unified pipeline незалежно від джерела
- **Dynamic Plugin Loading:** Runtime extensibility без restart
- **Checkpoint System:** Reliable resume після failures з database persistence
- **CLI-Native Performance:** Direct database access без HTTP overhead

### **Telegram Integration - python-telegram-bot:**
- **High-level API:** Simplified Telegram Bot API interaction
- **Async Support:** Non-blocking operations
- **Error Handling:** Built-in retry mechanisms та rate limiting
- **Webhook Support:** Ready для production deployments
- **Type Safety:** Full typing support з MyPy

### **Comprehensive Testing Strategy (pytest-asyncio):**

#### **Test Structure:**
```python
tests/
├── unit/
│   ├── adapters/
│   │   ├── test_base_adapter.py       # Abstract adapter testing
│   │   ├── test_telegram_adapter.py   # Telegram-specific logic
│   │   └── test_adapter_registry.py   # Plugin system testing
│   ├── processors/
│   │   ├── test_base_processor.py     # Abstract processor testing
│   │   ├── test_task_creator.py       # Task creation logic
│   │   └── test_notifier.py          # Notification logic
│   ├── llm/
│   │   ├── test_base_provider.py      # LLM abstraction
│   │   ├── test_ollama_provider.py    # Local LLM testing
│   │   └── test_openai_provider.py    # Cloud LLM testing
│   ├── core/
│   │   ├── test_message_processor.py  # Core processing logic
│   │   ├── test_classification.py     # AI classification
│   │   └── test_pipeline.py          # Processing pipeline
│   └── cli/
│       ├── test_plugin_commands.py    # Plugin management CLI
│       └── test_interactive_menu.py   # CLI interaction testing
├── integration/
│   ├── test_full_pipeline.py          # End-to-end workflow
│   ├── test_plugin_loading.py         # Dynamic plugin loading
│   ├── test_sqlmodel_database.py         # SQLModel operations
│   └── test_multi_source.py          # Multiple sources processing
├── fixtures/
│   ├── async_database.py             # Async DB fixtures
│   ├── plugin_mocks.py               # Mock plugin implementations
│   ├── message_samples.py            # Sample data з різних джерел
│   └── llm_responses.py              # Deterministic LLM responses
└── conftest.py                       # pytest-asyncio configuration
```

#### **Async Testing Patterns:**
```python
# SQLModel testing
@pytest_asyncio.fixture
async def sqlmodel_db_session():
    # Setup SQLModel з transaction rollback
    
# Plugin system testing  
@pytest_asyncio.fixture
async def mock_source_adapter():
    # Mock source adapter для testing
    
# LLM provider async testing
@pytest.mark.asyncio
async def test_async_classification():
    # Test async LLM calls з mocked responses
    
# Pipeline async testing
@pytest.mark.asyncio  
async def test_full_async_pipeline():
    # End-to-end async workflow testing
```

#### **Plugin Testing Strategy:**
- **Abstract Base Testing:** Ensure all adapters follow contracts
- **Dynamic Loading Tests:** Verify runtime plugin loading/unloading
- **Configuration Validation:** Test Pydantic plugin configs
- **Error Handling:** Plugin failure scenarios
- **Performance Testing:** Concurrent plugin execution
```bash
ai-tracker                    # Main interactive menu
ai-tracker process           # Manual chat processing  
ai-tracker schedule          # Configure scheduled jobs
ai-tracker status           # Show system status
ai-tracker stats            # Display statistics tables
ai-tracker config           # LLM provider configuration
ai-tracker export           # Export issues to files
ai-tracker db               # Database management commands
ai-tracker db migrate       # Run Alembic migrations
ai-tracker db reset         # Reset database
```

### **Interactive Menu Example (Rich + Typer):**
```
┌─ AI Issue Tracker v0.1.0 ─────────────────┐
│                                            │
│  → Process chats now                       │
│    Schedule jobs                           │
│    View statistics                         │
│    Configure LLM provider                  │
│    Database management                     │
│    Export issues                           │
│    Exit                                    │
│                                            │
│  Use ↑↓ arrows or numbers (1-7)           │
│  PostgreSQL: Connected ✓                   │
│  LLM Provider: Ollama (llama3.1:8b) ✓     │
└────────────────────────────────────────────┘
```

### **Configuration Management (Pydantic Settings):**
```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://user:pass@localhost/ai_tracker"
    
    # LLM Provider  
    llm_provider: str = "ollama"
    openai_api_key: str | None = None
    ollama_model: str = "llama3.1:8b"
    
    # Telegram
    telegram_bot_token: str
    
    # TaskIQ
    taskiq_broker_url: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
```

### **Logging Choice - Loguru:**
- **Structured logging:** JSON output для production monitoring
- **Async-friendly:** Не блокує FastAPI/TaskIQ async operations
- **Rich formatting:** Colored output, exception tracing
- **Flexible configuration:** File rotation, compression, filtering
- **Zero configuration:** Works out of the box, no complex setup

### **Plugin System Design:**
- **Source Adapters:** Abstract base class для різних джерел
- **Output Processors:** Abstract base class для різних outputs
- **LLM Providers:** Pluggable LLM implementations
- **Configuration-Driven:** Dynamic loading через config
- **Type-Safe:** Pydantic models для plugin configurations
- **Hot-Reload:** Runtime plugin activation/deactivation

### **Data Flow Architecture:**
```
Source → Adapter → Normalization → AI Processing → Classification → Output Processors
   ↓         ↓           ↓              ↓              ↓              ↓
Telegram  → TG Adapter → Message → LLM Provider → Issue Record → Task Creator
Slack     → Slack Adapter        → Analysis    →              → Notifier  
Email     → Email Adapter                                      → Reporter
Custom    → Custom Adapter                                     → Webhook
```

**Direct CLI Architecture:**
```
CLI Commands → Core Engine → Database/TaskIQ → Async Processing → Results
     ↓              ↓              ↓               ↓               ↓
   Typer    → Business Logic → SQLModel → Background Jobs → Rich Output
```

### **Processing Modes:**
- **On-Demand:** Manual trigger через CLI commands
- **Scheduled:** Configurable cron-like jobs через TaskIQ
- **Event-Driven:** Real-time processing для urgent sources
- **Batch Processing:** Ефективна обробка multiple messages з pagination
- **Pipeline Processing:** Multi-stage async processing chains
- **Resume Capability:** Продовження обробки після interruption з checkpoints

### **Configuration Management (Pydantic Settings):**
```python
# Multi-source configuration
class SourceConfig(BaseModel):
    type: Literal["telegram", "slack", "discord", "email"]
    name: str
    config: Dict[str, Any]
    is_active: bool = True
    
class ProcessorConfig(BaseModel):
    type: Literal["task_creator", "notifier", "reporter", "webhook"]
    name: str
    config: Dict[str, Any]
    is_active: bool = True
    conditions: Optional[Dict[str, Any]] = None  # When to trigger
```

### **Recovery Mechanisms:**
- **Message Sync:** Telegram API history fetch для gap recovery
- **Checkpoint System:** Tracking останнього processed message per chat
- **Graceful Handling:** Fallbacks якщо LLM недоступний
- **Error Tracking:** Loguru для structured logging та debugging
- **Batch Processing:** TaskIQ для efficient message processing
- **Resume Capability:** Продовження обробки з останнього checkpoint

---

## 📊 **Нефункціональні вимоги**

### **Performance:**
- Response time: <3s для AI classification
- Concurrent processing: мінімум 10 чатів одночасно
- Uptime: 95%+ availability
- Scalability: можливість додавати нові чати без restart
- Async Processing: TaskIQ забезпечує full async support без blocking

### **Privacy & Security:**
- Local LLM option для sensitive data
- Encrypted storage опція
- GDPR compliance готовність
- Secure bot token management

### **Usability:**
- Zero-configuration onboarding (просто додати бота до групи)
- Intuitive web interface
- Mobile-friendly responsive design
- Multi-language UI support

### **Cost Efficiency:**
- Мінімальні operational costs з local LLM
- Configurable cost/accuracy trade-offs
- Resource optimization для hosted deployment

---

## 🎮 **User Stories**

### **Розробник команди:**
- Хочу підключити Telegram чат до системи через CLI
- Хочу налаштувати автоматичне створення Jira задач з виявлених issues
- Хочу додати Slack канал як додаткове джерело (майбутнє)
- Хочу отримувати summary reports у email щотижня
- Хочу налаштувати webhook для custom integrations

### **Team Lead:**
- Хочу бачити consolidated analytics з усіх джерел
- Хочу налаштувати різні output processors для різних типів issues
- Хочу scheduled reports по всіх каналах команди
- Хочу порівнювати activity між різними communication channels
- Хочу налаштувати escalation rules (high priority → instant notification)

### **DevOps/Admin:**
- Хочу easily додавати нові source adapters через config
- Хочу monitoring всіх processing pipelines
- Хочу control cost через configurable processing rules
- Хочу backup та export даних з усіх sources
- Хочу plugin management через CLI

### **Integration Manager:**
- Хочу підключити corporate email як джерело проблем
- Хочу налаштувати custom output processor для внутрішньої системи
- Хочу webhook integration з monitoring systems
- Хочу automated reports для management
- Хочу compliance-friendly data retention policies

### **Privacy Officer:**
- Хочу контроль над тим які дані з яких джерел обробляються
- Хочу audit trail для всіх data processing operations
- Хочу можливість per-source privacy settings
- Хочу data anonymization options для sensitive sources

---

## 🚀 **MVP Scope (28 годин)**

### **Must Have (MVP):**
1. **Core Architecture:** Plugin system з abstract base classes
2. **Telegram Source Adapter:** Повна implementation з SQLModel
3. **Task Creation Processor:** Basic output processor для створення задач  
4. **Local LLM Provider:** Ollama integration
5. **Interactive CLI:** Typer + Rich з source/processor management
6. **Database Schema:** Normalized design для multi-source support
7. **Alembic Migrations:** Schema evolution support
8. **Comprehensive Testing:** pytest-asyncio з >80% coverage
9. **Configuration System:** Pydantic Settings для plugin config
10. **Checkpoint System:** Resume capability після downtime

### **Should Have:**
1. **Cloud LLM Providers:** OpenAI та Anthropic adapters
2. **Notification Processor:** Email/Slack notifications
3. **Reporting Processor:** Analytics та summary reports
4. **Advanced Classification:** Category, priority, sentiment analysis
5. **CLI Plugin Management:** Dynamic plugin loading/unloading
6. **Database Export/Import:** Backup та migration tools
7. **Performance Monitoring:** Processing metrics та benchmarks

### **Could Have:**
1. **Slack Source Adapter:** Second source implementation
2. **Webhook Output Processor:** Custom integrations
3. **Real-time Processing Mode:** Event-driven processing
4. **Advanced Analytics:** Cross-source correlation analysis
5. **Web API:** REST endpoints для external integrations

### **Won't Have (поза MVP):**
1. **Discord/Email Source Adapters**
2. **External Task Tracker Integrations** (Jira, etc.)
3. **Multi-tenant Support**
4. **Complex ML Features** (clustering, anomaly detection)
5. **Real-time Dashboard UI**

### **Could Have:**
1. MongoDB integration
2. Export APIs
3. Real-time updates в UI
4. Mobile optimization

### **Won't Have (поза MVP):**
1. External integrations (Jira, etc.)
2. Advanced analytics
3. Multi-tenant support
4. Complex deployment options

---

## 📅 **Розробницький план (14 днів × 2 години)**

### **Тиждень 1: Backend Core (14 годин)**

**День 1-2 (4h):** Core Architecture + Plugin System
- Repository structure з plugin architecture
- Abstract base classes (SourceAdapter, OutputProcessor, LLMProvider)
- SQLModel models design
- Alembic migrations setup для normalized schema
- Pydantic models для plugin configurations
- Docker configuration з PostgreSQL
- MyPy/Ruff configuration для type safety

**День 3-4 (4h):** Telegram Source Adapter + LLM Integration
- TelegramSourceAdapter implementation з python-telegram-bot
- Message normalization layer
- Core LLM abstraction з async support
- OllamaProvider implementation
- Basic classification pipeline
- Async database operations з SQLModel
- Checkpoint system implementation

**День 5-6 (4h):** Task Creation Processor + CLI Foundation
- TaskCreationProcessor implementation
- Processing pipeline з async TaskIQ
- Typer CLI application з plugin management
- Interactive menu system з Rich
- Configuration management через Pydantic Settings
- Basic CRUD operations для sources/processors
- Error handling та logging з Loguru

**День 7 (2h):** Core Integration + Testing Setup
- End-to-end pipeline integration
- pytest-asyncio setup з database fixtures
- Core business logic unit tests
- Source adapter testing з mocked dependencies
- CLI testing з Typer test utilities

### **Тиждень 2: Advanced Features + Comprehensive Testing (14 годин)**

**День 8-9 (4h):** Plugin System + CLI Enhancement
- Dynamic plugin loading system
- Plugin registration та discovery
- CLI commands для plugin management
- Interactive source/processor configuration
- Rich formatting для plugin status
- Plugin validation та error handling

**День 10-11 (4h):** Output Processors + Advanced Testing
- NotificationProcessor implementation (email alerts)
- ReportingProcessor для analytics
- Advanced classification features (priority, sentiment)
- Comprehensive pytest-asyncio test suite
- Integration tests для plugin system
- Performance testing для batch operations

**День 12-13 (4h):** Production Readiness + Test Coverage
- Cloud LLM providers (OpenAI adapter)
- Production configuration management
- SQLModel performance optimization
- Error handling та recovery mechanisms
- Test coverage analysis (target >80%)
- Security testing та validation

**День 14 (2h):** Final Integration + Demo Preparation
- Complete end-to-end testing
- Plugin system demonstration scenarios
- CLI demo з multi-source processing
- Performance benchmarks та metrics
- Documentation та deployment guide

---

## 🎯 **Success Criteria**

### **Technical Metrics:**
- ✅ CLI successfully fetches та processes messages on-demand
- ✅ Interactive menus work з arrow keys та numeric selection
- ✅ Scheduled jobs execute reliably
- ✅ 80%+ accuracy в AI classification
- ✅ >80% test coverage з pytest
- ✅ All tests pass including async operations
- ✅ Checkpoint system works після restart
- ✅ Batch processing handles 100+ messages efficiently
- ✅ Local LLM processes batches в reasonable time
- ✅ CLI показує beautiful formatted output з Rich
- ✅ Database migrations work без data loss
- ✅ Type checking passes з MyPy

### **Business Metrics:**
- ✅ CLI processing trigger works в live demo
- ✅ Interactive scheduler demonstrates automated workflow
- ✅ Quantifiable time savings (manual vs automated batch processing)
- ✅ Clear cost advantages з local LLM
- ✅ Scalability story для enterprise use

### **Demo Pitch Strategy:**
> "Перше AI рішення що дає вибір між privacy (local LLM) та performance (cloud LLM). Почніть безкоштовно з локальною моделлю, scale до cloud при потребі. Ваші чати, ваші дані, ваш контроль."