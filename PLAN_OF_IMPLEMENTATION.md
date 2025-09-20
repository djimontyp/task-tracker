# Послідовний план реалізації: Universal Issue Detection & Processing System

## Оновлення статусу (2025-01-20)

### Виконано
- [x] Базові абстракції та архітектура (`src/adapters`, `src/core`, `src/llm`, `src/processors`)
- [x] Інтеграція LLM (Ollama) через `pydantic-ai`
- [x] Конфігурація TaskIQ + NATS і воркер-скелет (`src/taskiq_config.py`, `src/worker.py`)
- [x] CLI на Rich (замість Typer + InquirerPy)
- [x] Додано залежності `rich` та `asyncpg` у `pyproject.toml`
- [x] Оновлено README: uv-only інсталяція, запуск сервісів і CLI
- [x] Початкова Alembic міграція створена і застосована; схема БД розгорнута
- [x] Спрощена модель БД (3 таблиці замість 7)
- [x] Видалені абстрактні класи та зайві тести
- [x] Конфіги підправлені

### У процесі / Заплановано для Sprint'у
- [ ] Реальна інтеграція `TelegramAdapter` з `python-telegram-bot` (polling)
- [ ] Зв'язати CLI команди з конвеєром обробки повідомлень
- [ ] Async SQLModel engine/session; персистенція `Message/Issue/TaskExport`
- [ ] Інтеграція конвеєра у TaskIQ: задачі `process_message`, запуск `start_worker`
- [ ] Linear GraphQL API інтеграція для створення задач
- [ ] Duplicate detection система через семантичну схожість
- [ ] Логування через `loguru` у ключових модулях + базові метрики
- [ ] Demo-ready CLI dashboard з real-time статистикою

## Sprint Plan: Feodal AI 2.0 (1-2 дні)

### День 1: Core Integration (8 годин)

#### Ранок (3 години): Telegram Real Integration
**Мета:** Замінити заглушку на реальний polling

**Завдання:**
- Реалізувати справжній `python-telegram-bot` polling у `TelegramAdapter`
- Налаштувати обробку повідомлень з реальних чатів
- Додати просту дедуплікацію (на основі message_id)
- Тестування на тестовому боті з приватним чатом

**Критерій готовності:** Система читає і обробляє реальні повідомлення з Telegram

#### День (3 години): Ollama Classification Pipeline  
**Мета:** Зв'язати всі компоненти в робочий конвеєр

**Завдання:**
- Інтеграція `TelegramAdapter` → `MessageProcessor` → `OllamaProvider`
- Налаштування конвеєра обробки через TaskIQ
- Збереження результатів у БД (Message, Issue таблиці)
- CLI команди для запуску та моніторингу процесу

**Критерій готовності:** End-to-end обробка: Telegram → AI аналіз → БД

#### Вечір (2 години): Task Creation Integration
**Мета:** Автоматичне створення задач

**Завдання:**
- Linear GraphQL API інтеграція АБО JSON файл fallback
- Маппінг результатів класифікації на структуру задач
- Збереження створених задач у `TaskExport` таблицю
- Обробка помилок та retry логіка

**Критерій готовності:** Створені задачі видимі в Linear або JSON файлі

### День 2: Demo Polish (6 годин)

#### Ранок (2 години): CLI Dashboard
**Мета:** Beautiful interface для демонстрації

**Завдання:**
- Rich CLI dashboard з real-time оновленнями
- Статистика обробки (кількість повідомлень, issues, tasks)
- Відображення нещодавніх класифікацій та результатів
- Команди для статусу черги та воркерів

**Критерій готовності:** Інтерактивний dashboard показує live активність

#### День (2 години): Performance & Reliability
**Мета:** Стабільність для демо

**Завдання:**
- Circuit breaker для зовнішніх API викликів
- Retry логіка з exponential backoff
- Proper error handling та логування
- Тестування з реальним навантаженням

**Критерій готовності:** Система працює стабільно під навантаженням

#### Вечір (2 години): Demo Preparation
**Мета:** Готовність до презентації

**Завдання:**
- Підготовка демо сценарію з тестовими повідомленнями
- Документація основних команд та функцій
- Screenshots/recordings ключових features
- Presentation script (3-5 хвилин)

**Критерій готовності:** Готова презентація з live demo

## Post-Sprint Roadmap (опційно)

### Тиждень 1: Advanced Features
- Multi-channel support (додаткові Telegram чати)
- Advanced duplicate detection з Sentence Transformers
- Custom classification rules та templates
- Batch processing для historical messages

### Тиждень 2: Production Features  
- Comprehensive monitoring з Langfuse
- A/B testing framework для моделей
- Advanced security (input validation, rate limiting)
- Backup and disaster recovery procedures

### Тиждень 3: Scaling Features
- Horizontal scaling з Kubernetes
- Multi-team support з isolated processing
- Advanced analytics та reporting
- API endpoints для external integrations

## Технічні рішення на основі дослідження

### LLM Strategy
**Primary:** Ollama local models (приватність, no costs)
**Fallback:** GPT-4o-mini для складних випадків (якщо потрібно)
**Optimization:** Семантичне кешування для повторних queries

### Duplicate Detection
**Approach:** Multi-level detection (exact string → fuzzy → semantic)
**Model:** all-MiniLM-L6-v2 для швидкості та точності
**Threshold:** 0.85 cosine similarity для near-duplicates

### Task Tracker Integration
**Primary:** Linear GraphQL API (1,500 requests/hour)
**Fallback:** JSON file export для offline demo
**Strategy:** Bulk operations для high-volume scenarios

### Reliability Patterns
**Message Processing:** Exactly-once через NATS JetStream
**Error Handling:** Circuit breakers + exponential backoff
**Data Persistence:** Transactional outbox pattern

## Success Metrics для Sprint'у

### Functional Requirements
- ✅ Читає повідомлення з реального Telegram чату
- ✅ Класифікує повідомлення через локальну LLM
- ✅ Створює задачі в Linear або зберігає в файл
- ✅ Відображає статистику в CLI dashboard
- ✅ Відновлюється після перезапуску (persistent queue)

### Performance Targets
- **Response Time:** <5 секунд для класифікації
- **Throughput:** 100+ повідомлень на годину
- **Accuracy:** >80% правильної класифікації (subjective)
- **Uptime:** 99% під час демо періоду
- **Recovery Time:** <30 секунд після падіння

### Demo Requirements
- **Live Processing:** Real-time обробка під час презентації
- **Visual Appeal:** Beautiful CLI з кольорами та прогрес-барами
- **Ease of Use:** Одна команда для запуску всієї системи
- **Reliability:** Стабільна робота протягом 10+ хвилин demo
- **Clear Value:** Obvious time savings та automation benefits

## Risk Mitigation

### High Priority Risks
1. **Ollama Performance** → Fallback до більш швидких моделей
2. **Telegram Rate Limits** → Batch processing та respect limits
3. **Linear API Failures** → JSON fallback для demo continuity  
4. **Demo Technical Issues** → Pre-recorded backup content

### Contingency Plans
- **LLM Unavailable:** Rule-based classification fallback
- **Database Issues:** In-memory storage for demo period
- **Network Issues:** Offline mode з pre-loaded messages
- **Time Constraints:** Minimal viable demo з core features only

## Definition of Success

**Sprint MVP Ready:**
- Processes 20+ real Telegram messages successfully
- Creates corresponding tasks in Linear or file
- Displays results in beautiful CLI dashboard
- Demonstrates clear ROI potential for teams
- Runs stable demo for 5+ minutes without issues

**Business Value Demonstrated:**
- Automatic issue detection saves manual triage time
- Consistent task creation prevents lost issues
- Real-time processing enables faster response
- Scalable architecture supports team growth
- Clear integration path for production deployment