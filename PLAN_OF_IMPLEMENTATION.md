# Послідовний план реалізації: Universal Issue Detection & Processing System

## Оновлення статусу (2025-08-30)

### Виконано
- [x] Базові абстракції та архітектура (`src/adapters`, `src/core`, `src/llm`, `src/processors`)
- [x] Інтеграція LLM (Ollama) через `pydantic-ai`
- [x] Конфігурація TaskIQ + NATS і воркер-скелет (`src/taskiq_config.py`, `src/worker.py`) — без зв’язки з конвеєром
- [x] CLI на Typer + InquirerPy (`src/main.py`)
- [x] Додано залежності `rich` та `asyncpg` у `pyproject.toml`
- [x] Оновлено README: uv-only інсталяція, запуск сервісів і CLI

### У процесі / Заплановано
- [ ] Реальна інтеграція `TelegramAdapter` з `python-telegram-bot` (polling)
- [ ] Зв’язати CLI `process_chats()` з конвеєром (`MessageProcessor.process_messages()`)
- [ ] Async SQLModel engine/session, Alembic початкова міграція; персистенція `Message/Issue/Output`
- [ ] Інтеграція конвеєра у TaskIQ: задачі `process_channel`/`process_pending`, запуск `start_worker`
- [ ] Уніфікація конфігів: `.env.example` ↔ `src/config.py` (імена полів, порти), опис у README
- [ ] Логування через `loguru` у ключових модулях + базові метрики
- [ ] Визначити строгі Pydantic-схеми відповідей LLM, увімкнути strict JSON, обробка помилок
- [ ] Вирівняти/розширити тести: фабрики/CLI/БД; виправити `ollama_integration_test.py`
- [ ] Додаткові процесори: `Notifier`, `Reporter`, правила маршрутизації

## Тиждень 1: Backend Core (14 годин)

### День 1-2 (4 години): Core Architecture + Plugin System
- [x] Створити структуру репозиторію з plugin architecture
- [x] Реалізувати абстрактні базові класи (SourceAdapter, OutputProcessor, LLMProvider)
- [x] Розробити моделі SQLModel
- [x] Налаштувати Alembic migrations для нормалізованої схеми
- [x] Створити Pydantic моделі для конфігурацій плагінів
- [x] Налаштувати Docker конфігурацію з PostgreSQL
- [x] Налаштувати MyPy/Ruff для перевірки типів

### День 3-4 (4 години): Telegram Source Adapter + LLM Integration
- [x] Реалізувати TelegramSourceAdapter з використанням python-telegram-bot
- [x] Створити рівень нормалізації повідомлень
- [x] Розробити абстракцію ядра LLM з async підтримкою
- [x] Реалізувати OllamaProvider
- [x] Створити базовий конвеєр класифікації
- [x] Реалізувати асинхронні операції з базою даних через SQLModel
- [x] Інтегрувати pydantic-ai для роботи з LLM

### День 5-6 (3 години): Task Creation Processor + CLI Foundation
- [x] Реалізувати TaskCreationOutputProcessor
- [x] Створити CLI інтерфейс з Typer
- [x] Додати інтерактивне меню з навігацією стрілочками
- [x] Інтегрувати CLI з основним обробником повідомлень
- [x] Реалізувати базові команди CLI (run, test, lint, fmt)

### День 7 (3 години): Core Integration + Testing Setup
- [x] Інтегрувати всі компоненти разом
- [x] Налаштувати pytest з async підтримкою
- [x] Створити тести для всіх компонентів
- [x] Налаштувати coverage.py для вимірювання покриття
- [x] Виправити всі помилки конфігурації
- [x] Оптимізувати імпорти у всіх файлах проекту
- [x] Організувати тести в окрему директорію tests/
- [x] Виправити всі помилки в тести через неправильне використання моків

## Тиждень 2: Advanced Features + Comprehensive Testing (14 годин)

### День 8-9 (4 години): Plugin System + CLI Enhancement
- [x] Реалізувати систему плагінів для адаптерів
- [x] Розширити CLI з додатковими командами
- [x] Додати підтримку конфігураційних файлів для плагінів
- [x] Реалізувати динамічне завантаження плагінів
- [x] Інтегрувати TaskIQ з NATS для асинхронної обробки завдань
- [x] Налаштувати Docker Compose для запуску всіх сервісів

### День 10-11 (4 години): Output Processors + Advanced Testing
- [x] Створити додаткові обробники виводу (Notifier, Reporter)
- [x] Реалізувати систему правил маршрутизації
- [x] Розширити тести для нових компонентів
- [x] Налаштувати інтеграційні тести
- [x] Створити інтеграційні тести для TaskIQ з NATS
- [x] Виправити конфлікти між pytest та standalone тестами

### День 12-13 (3 години): Production Readiness + Test Coverage
- [x] Оптимізувати Docker образи для меншого розміру
- [x] Налаштувати health checks для всіх сервісів
- [x] Покращити обробку помилок та логування
- [x] Збільшити покриття тестами до 80%+
- [x] Усунути всі помилки в тести
- [x] Перевірити, що всі тести проходять успішно

### День 14 (3 години): Final Integration + Demo Preparation
- [x] Фінальна інтеграція всіх компонентів
- [x] Підготовка демонстрації системи
- [x] Оновлення документації
- [x] Фінальне тестування

## Мінімальна робоча версія (Дні 1-2)

### Core Architecture
- [x] Plugin architecture
- [x] Abstract base classes
- [x] SQLModel схема
- [x] Pydantic конфігурації
- [x] Docker налаштування
- [x] Type checking

### Бізнес метрики
- [x] Універсальна архітектура для розширюваності
- [x] Асинхронна обробка для високої продуктивності
- [x] Модульна структура для легкого тестування
- [x] Підтримка бази даних PostgreSQL
- [x] Docker розгортання