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
- **FastAPI integration:** Better integration with async FastAPI backend
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