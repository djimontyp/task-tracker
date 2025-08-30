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
   - Output processor management
   - Configuration commands
   - Service management (start/stop/restart)

7. **Task Queue System**
   - Asynchronous task processing with TaskIQ
   - NATS message broker for distributed processing
   - Worker service for background task execution
   - Result backend for storing task results
   - Dockerized services for easy deployment

---

## 🏗️ **Архітектура**

### **Core Architecture:**
```
tests/
├── test_base_classes.py        # Тести для абстрактних базових класів
├── test_message_processor.py   # Тести для основного обробника повідомлень
├── test_ollama_provider.py     # Тести для Ollama провайдера
├── test_pydantic_ai.py         # Тести для інтеграції з pydantic-ai
├── test_task_creator.py        # Тести для обробника створення завдань
├── test_taskiq_nats.py         # Тести для інтеграції TaskIQ з NATS
├── test_telegram_adapter.py    # Тести для Telegram адаптера
└── llm_comprehensive_test.py   # Комплексні тести для LLM

src/
├── adapters/          # Source adapters (Telegram, Slack, etc.)
├── core/              # Core processing logic
├── llm/               # LLM abstraction layer
├── models/            # Database models
├── processors/        # Output processors
├── config.py          # Configuration management
├── main.py            # CLI entry point
├── taskiq_config.py   # TaskIQ configuration with NATS
├── worker.py          # TaskIQ worker
└── example_task.py    # Example task usage
```

### **Task Queue Choice - TaskIQ with NATS:**
- **Full async support:** Native async/await support
- **Framework-agnostic:** Async-first підхід без прив'язки до веб-фреймворку (FastAPI видалено з проєкту)
- **Modern architecture:** Modern approach to distributed task processing
- **NATS broker:** High-performance message broker with JetStream
- **Dockerized services:** Easy deployment with Docker Compose
- **Simpler setup:** Less boilerplate code compared to Celery

---

## 🧪 **Тестування**

### **Unit Testing:**
```python
@pytest.mark.asyncio
async def test_telegram_adapter():
    # Test Telegram adapter functionality
    
@pytest.mark.asyncio
async def test_ollama_provider():
    # Test Ollama LLM provider
    
@pytest.mark.asyncio
async def test_task_creation_processor():
    # Test task creation output processor
    
@pytest.mark.asyncio
async def test_async_classification():
    # Test async LLM calls з mocked responses
    
# Pipeline async testing
```

### **Integration Testing:**
```python
@pytest.mark.asyncio
async def test_full_pipeline():
    # Test full message processing pipeline
    
@pytest.mark.asyncio
async def test_taskiq_nats_integration():
    # Test TaskIQ with NATS integration
    
@pytest.mark.asyncio
async def test_docker_services():
    # Test Docker services startup
```

### **Test Organization:**
- Всі тести розташовані в окремій директорії `tests/`
- Модульні тести для кожного компонента
- Інтеграційні тести для перевірки взаємодії компонентів
- Тести LLM для перевірки інтеграції з мовними моделями
- Тести TaskIQ/NATS для перевірки асинхронної обробки
- Всі тести використовують правильні моки та фікстури
- Тести не використовують sys.path хаки

---

## ⚙️ **Конфігурація**

### **Environment Configuration:**
```env
# Telegram bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5555/tasktracker

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Output processor
OUTPUT_PROCESSOR_TYPE=jira
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your_email@example.com
JIRA_API_TOKEN=your_jira_api_token_here

# Logging
LOG_LEVEL=INFO

# TaskIQ NATS
TASKIQ_NATS_SERVERS=nats://nats:4222
TASKIQ_NATS_QUEUE=taskiq
```

### **Processor Configuration:**
```python
from pydantic import BaseModel
from typing import Dict, Any, Literal

class ProcessorConfig(BaseModel):
    type: Literal["task_creator", "notifier", "reporter", "webhook"]
    name: str
    config: Dict[str, Any]
    is_active: bool = True
```

---

## 🚀 **Майбутні можливості**

1. **Advanced Output Processors:** Slack, Teams, Email notifications
2. **Webhook Output Processor:** Custom integrations
3. **Real-time Processing Mode:** Event-driven processing
4. **Advanced Analytics:** Cross-source correlation analysis
5. **Web API:** REST endpoints для external integrations

---

## 📦 **Залежності**

### **Core Dependencies:**
- `python-telegram-bot` - Telegram integration
- `sqlmodel` - Database ORM
- `pydantic` - Data validation
- `pydantic-settings` - Configuration management
- `pydantic-ai` - LLM integration
- `ollama` - Local LLM support
- `taskiq` - Task queue framework
- `taskiq-nats` - NATS broker for TaskIQ
- `typer` - CLI framework
- `loguru` - Logging
- `alembic` - Database migrations
- `rich` - Вивід у CLI (консольні стилі)
- `asyncpg` - Async драйвер PostgreSQL для SQLAlchemy/SQLModel

### **Development Dependencies:**
- `pytest` - Testing framework
- `pytest-asyncio` - Async testing support
- `ruff` - Code linting
- `mypy` - Type checking

### **Deployment Dependencies:**
- `docker` - Containerization
- `docker-compose` - Service orchestration
- `uv` - Python package manager
- `just` - Command runner

---

## 📆 **Стан реалізації (2025-08-30)**

- Абстракції та архітектура: готово (`adapters/base.py`, `processors/base.py`, `llm/base.py`, структура `src/`)
- Telegram адаптер: є каркас і нормалізація, але без реальної інтеграції з `python-telegram-bot` (polling/webhook не реалізовано) — `adapters/telegram.py`
- LLM: Ollama через `pydantic-ai` реалізовано — `llm/ollama.py`; тести для інтеграції з pydantic-ai — `tests/test_pydantic_ai.py`
- Основний конвеєр: `core/message_processor.py` реалізує базову обробку (fetch → normalize → classify → process → mark)
- Обробник виводу: `processors/task_creator.py` існує як заглушка (друк у консоль), реальні інтеграції відсутні
- Асинхронна черга: конфіг TaskIQ+NATS та воркер — готово (`taskiq_config.py`, `worker.py`), є приклад задачі (`example_task.py`); конвеєр з чергою ще не зв’язано
- База даних: моделі `sqlmodel` є (`models/database.py`), але немає async engine/session, Alembic міграцій і збереження артефактів у конвеєрі
- CLI: `main.py` з Typer+InquirerPy працює, але всі дії — заглушки, зв’язки з конвеєром/воркером немає
- Конфігурація: `config.py` на BaseSettings; є невідповідності з `.env.example` (порти/назви полів)
- Логування: `loguru` у залежностях, але майже не використовується
- Тести: наявні для LLM і TaskIQ/NATS, е2е/CLI/БД відсутні

---

## 🚨 **Ризики та прогалини**

- Telegram інтеграція відсутня (лише заглушка) → немає реального надходження повідомлень
- CLI не під’єднано до конвеєра/черги → немає one-click E2E запуску
- БД: немає Alembic/engine/session → дані не зберігаються, відсутня ідемпотентність/відновлення
- LLM: немає strict Pydantic-схем для відповідей, можливі неструктуровані виходи
- Конфіг: розбіжності `.env.example` ↔ `config.py` (наприклад, `DATABASE_URL` і порт 5555), відсутні описи деяких полів
- Залежності: у `pyproject.toml` відсутній `rich` (використовується в `main.py`), для async Postgres потрібен `asyncpg`
- Логування/обсервабіліті: відсутні структуровані логи та базові метрики
- Тести: недостатнє покриття е2е/CLI/БД; автономний `ollama_integration_test.py` використовує `result.output` замість узгодженого `result.data`

---

## 📝 **Пріоритетні наступні кроки**

Високий пріоритет:
- [ ] Провести CLI до реального конвеєра: у `process_chats()` створити фабрики (TelegramAdapter, OllamaProvider, TaskCreationProcessor) і викликати `MessageProcessor.process_messages()`
- [ ] Реалізувати `TelegramAdapter` з `python-telegram-bot` (polling на старт) із `fetch/normalize/mark`
- [ ] Підключити БД: async engine/session, Alembic initial міграція; збереження `Message/Issue/Output` під час обробки
- [ ] Інтегрувати конвеєр у TaskIQ: задачі `process_channel`/`process_pending`; оновити CLI `start_worker`
- [ ] Уніфікувати конфіги: вирівняти `.env.example` ↔ `config.py` (порти/назви), опис у README

Середній пріоритет:
- [ ] Логування через `loguru` у ключових модулях; базові метрики
- [ ] Стандартизувати LLM-відповіді: Pydantic-схеми (strict JSON), обробка помилок
- [ ] Оновити README під `uv`, додати розділ “Known limitations” і перший запуск
- [ ] Вирівняти/розширити тести: покрити фабрики/CLI/БД; виправити `ollama_integration_test.py`

Низький пріоритет:
- [ ] Додаткові процесори (Notifier/Reporter) і правила маршрутизації
- [ ] Підтримка OpenAI/Anthropic із runtime-перемикачем