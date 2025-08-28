# Технічне завдання: AI Issue Tracker для Telegram

## 🎯 **Мета проекту**

Створити систему автоматичного виявлення та класифікації проблем у Telegram чатах проектних команд з можливістю відновлення пропущених повідомлень.

---

## 📋 **Функціональні вимоги**

### **Core Features:**
1. **Моніторинг чатів**
   - Підключення до Telegram груп через бота
   - Batch обробка повідомлень по запиту або розкладу
   - Періодичне стягування нових повідомлень (polling)
   - Відновлення пропущених повідомлень після downtime

2. **AI аналіз повідомлень**
   - Batch processing повідомлень за період
   - Визначення чи є повідомлення проблемою/питанням
   - Класифікація по категоріях (bug, feature, question, info)
   - Оцінка пріоритету (high, medium, low)
   - Витягування ключових сутностей (проект, технології, дедлайни)

3. **Flexible LLM підтримка**
   - Локальні LLM (Ollama) для розробки/privacy
   - Cloud LLM (OpenAI, Anthropic) для production
   - Runtime переключення між провайдерами
   - Configurable accuracy vs cost trade-offs

4. **Історія чатів**
   - Збереження локальної копії повідомлень
   - Можливість аналізу старих повідомлень
   - Відновлення missed messages після bot restart
   - Export/import chat history

5. **CLI інтерфейс**
   - Interactive CLI з arrow navigation
   - Manual triggers для обробки чатів
   - Scheduled jobs configuration
   - Статистика та аналітика через CLI
   - LLM provider management
   - Chat selection та filtering

### **Advanced Features:**
- Duplicate detection (схожі проблеми)
- Context-aware аналіз (розуміння thread context)
- Integration APIs (Jira, Linear, Asana)
- Team analytics та performance metrics

---

## 🔧 **Технічні вимоги**

### **Архітектура:**
- **Backend:** FastAPI REST API (internal only)
- **CLI:** Rich + Click для interactive interface  
- **LLM Layer:** Абстракція для multiple providers
- **Database:** MongoDB для structured data + JSON backup
- **Task Queue:** TaskIQ для async processing
- **Scheduler:** TaskIQ scheduler для periodic jobs
- **Polling:** Telegram Bot API для message fetching
- **Deploy:** Docker containerization

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
- **Rich:** Beautiful terminal output, progress bars, tables, syntax highlighting
- **Click:** Command-line interface creation, argument parsing
- **Interactive Menus:** Arrow key navigation або numeric selection (1,2,3)
- **Real-time Updates:** Live progress bars для batch processing
- **Cross-platform:** Works на Windows, macOS, Linux
- **Zero Dependencies:** Не потребує browser або web server

### **CLI Commands Structure:**
```bash
ai-tracker                    # Main interactive menu
ai-tracker process           # Manual chat processing
ai-tracker schedule          # Configure scheduled jobs  
ai-tracker status           # Show system status
ai-tracker stats            # Display statistics
ai-tracker config           # LLM provider configuration
ai-tracker export           # Export issues to files
```

### **Interactive Menu Example:**
```
┌─ AI Issue Tracker ─────────────────────────┐
│                                            │
│  → Process chats now                       │
│    Schedule jobs                           │
│    View statistics                         │
│    Configure LLM provider                  │
│    Export issues                           │
│    Exit                                    │
│                                            │
│  Use ↑↓ arrows or numbers (1-6)           │
└────────────────────────────────────────────┘
```

### **Logging Choice - Loguru:**
- **Structured logging:** JSON output для production monitoring
- **Async-friendly:** Не блокує FastAPI/TaskIQ async operations
- **Rich formatting:** Colored output, exception tracing
- **Flexible configuration:** File rotation, compression, filtering
- **Zero configuration:** Works out of the box, no complex setup

### **Data Storage:**
- **Messages:** Повна локальна копія chat history з timestamps
- **Processing State:** Останній processed message per chat
- **Issues:** Structured metadata про виявлені проблеми
- **Jobs:** Scheduler configuration та execution history
- **Analytics:** Aggregated statistics
- **Backups:** Regular export можливостей

### **Processing Modes:**
- **On-Demand:** Manual trigger через web UI або API
- **Scheduled:** Configurable cron-like jobs (hourly, daily, etc.)
- **Batch Processing:** Ефективна обробка multiple messages одночасно
- **Incremental:** Обробка тільки нових повідомлень з last checkpoint

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
- Хочу запускати CLI команду для аналізу чату manually коли потрібно
- Хочу інтерактивне меню для налаштування scheduled обробки
- Хочу бачити progress bar під час batch processing
- Хочу експортувати issues через CLI commands

### **Team Lead:**
- Хочу CLI dashboard з scheduled reports по issues
- Хочу швидко запускати on-demand аналіз через terminal
- Хочу бачити statistics tables у красивому форматі
- Хочу порівнювати проекти через CLI interface

### **DevOps/Admin:**
- Хочу управляти scheduled jobs через CLI
- Хочу monitoring batch processing через terminal
- Хочу scriptable commands для automation
- Хочу CLI access до всіх configuration options

### **Privacy Officer:**
- Хочу CLI logs з аудитом всіх processing jobs
- Хочу terminal-based control над data processing
- Хочу command-line data retention management
- Хочу scriptable compliance reports

---

## 🚀 **MVP Scope (28 годин)**

### **Must Have:**
1. Telegram bot integration з polling API
2. Interactive CLI з Rich/Click
3. Manual trigger через CLI commands
4. Basic scheduled jobs (daily processing)
5. Basic AI classification (issue/not issue)
6. CLI dashboard для перегляду results та triggers
7. Local LLM support (Ollama)
8. Checkpoint system для incremental processing
9. JSON-based data storage

### **Should Have:**
1. Cloud LLM providers integration
2. Advanced classification (category, priority)  
3. Configurable scheduler через CLI
4. CLI statistics tables з Rich formatting
5. Batch processing progress bars

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

**День 1-2 (4h):** Project Setup + Infrastructure
- Repository structure
- FastAPI boilerplate
- Telegram Bot API setup (polling approach)
- Local LLM setup (Ollama)
- TaskIQ scheduler configuration
- Loguru logging configuration
- Docker configuration

**День 3-4 (4h):** Core AI Integration + Polling
- LLM abstraction layer design
- TaskIQ setup для scheduled processing
- Telegram message fetching logic
- Basic message classification logic
- Checkpoint system implementation
- Error handling та fallbacks

**День 5-6 (4h):** Batch Processing + Scheduler
- Scheduled jobs implementation
- Manual trigger API endpoints
- Batch message processing pipeline
- Progress tracking mechanisms
- Basic CRUD operations
- Data persistence mechanisms

**День 7 (2h):** Integration Testing
- End-to-end pipeline testing
- Bot deployment та webhook setup
- Performance optimization
- Bug fixing

### **Тиждень 2: CLI Interface + Polish (14 годин)**

**День 8-9 (4h):** CLI Foundation
- Rich + Click setup
- Interactive menu structure  
- Basic commands (process, schedule, status)
- Beautiful terminal output formatting
- Arrow key navigation implementation

**День 10-11 (4h):** Interactive Features
- Processing progress bars з Rich
- Job scheduling через CLI interface
- Statistics tables та dashboards
- LLM provider switching через меню
- Chat selection та filtering commands

**День 12-13 (4h):** Production Readiness
- Deployment configuration
- Loguru structured logging setup
- CLI error handling та user feedback
- Performance optimization
- Security hardening

**День 14 (2h):** Demo Preparation
- CLI demo scenarios
- Terminal recording setup
- Command shortcuts preparation  
- Final testing

---

## 🎯 **Success Criteria**

### **Technical Metrics:**
- ✅ CLI successfully fetches та processes messages on-demand
- ✅ Interactive menus work з arrow keys та numeric selection
- ✅ Scheduled jobs execute reliably
- ✅ 80%+ accuracy в AI classification
- ✅ Checkpoint system works після restart
- ✅ Batch processing handles 100+ messages efficiently
- ✅ Local LLM processes batches в reasonable time
- ✅ CLI показує beautiful formatted output з Rich

### **Business Metrics:**
- ✅ CLI processing trigger works в live demo
- ✅ Interactive scheduler demonstrates automated workflow
- ✅ Quantifiable time savings (manual vs automated batch processing)
- ✅ Clear cost advantages з local LLM
- ✅ Scalability story для enterprise use

### **Demo Requirements:**
- ✅ Live CLI demo з interactive navigation
- ✅ Scheduled job configuration через CLI
- ✅ Real-time progress bars під час processing
- ✅ LLM provider switching через меню
- ✅ Beautiful terminal output з Rich formatting
- ✅ Clear ROI value proposition
- ✅ Production-ready CLI interface

---

## ⚠️ **Ризики та Mitigation**

### **Technical Risks:**
- **Ollama setup складність** → Fallback до cloud LLM for demo
- **Telegram API rate limits** → Implement proper throttling
- **LLM response inconsistency** → Fallback classification rules + detailed Loguru logging
- **Message recovery failures** → Manual recovery procedures з error tracking
- **TaskIQ debugging** → Loguru structured logs для task monitoring

### **Timeline Risks:**
- **2 години/день недостатньо** → Simplify scope, focus на core demo
- **Integration bugs** → Prepare fallback demo scenarios
- **Deployment issues** → Local demo backup plan

### **Competition Risks:**
- **Similar solutions exist** → Emphasize unique LLM flexibility
- **Technical demo fails** → Pre-recorded backup video
- **Questions about scalability** → Prepare architecture diagrams

---

## 💰 **Бюджет та ресурси**

### **Development Costs:**
- **LLM:** $0 (Ollama local) до $50 (cloud APIs)
- **Hosting:** $10-20 для VPS
- **Domain:** $10 (optional)
- **Total:** $10-80

### **Time Investment:**
- **Development:** 28 годин over 14 днів
- **Learning curve:** Ollama setup, Telegram Bot API
- **Documentation:** README, deployment guide
- **Demo prep:** Scenario testing, backup plans

### **ROI Projection:**
- **Time saved:** 2+ години/день × team size
- **Cost saved:** $100-300/day у productive time
- **LLM costs:** $0-150/month
- **Net benefit:** $2000-6000/month для 5-person team

---

## 🏆 **Конкурентні переваги**

### **Unique Value Props:**
1. **Flexible LLM Architecture** - єдине рішення з local+cloud options
2. **Zero LLM Costs** - можливість повністю безкоштовного використання
3. **100% Privacy Mode** - local processing для sensitive data
4. **Controlled Processing** - on-demand та scheduled approach для cost/privacy control
5. **CLI-First Design** - scriptable, no browser dependencies, dev-friendly
6. **Batch Efficiency** - ефективна обробка великих chat histories
7. **Instant Setup** - single binary, zero web server configuration
8. **Modern Async Stack** - TaskIQ scheduler забезпечує reliable job execution

### **Technical Advantages:**
- **TaskIQ vs Celery:** Full async support, сучасніша архітектура, reliable scheduling
- **Rich CLI vs Web UI:** No browser dependencies, scriptable, faster для power users
- **Loguru vs logging:** Structured logging, async-friendly, zero config setup
- **Scheduled Processing:** Контрольований підхід до cost management та resource usage
- **Local LLM:** Незалежність від зовнішніх API, 100% privacy
- **Batch Processing:** Ефективне використання LLM resources
- **Vendor Independence:** Підтримка multiple LLM providers

### **Market Differentiation:**
- **vs UTasks/Corcava:** AI detection vs manual task creation + CLI vs web-only
- **vs Corporate tools:** Privacy та cost control через local LLM + developer-friendly CLI
- **vs Cloud-only solutions:** Vendor independence та data control + scriptable interface
- **vs Web tools:** Zero browser dependencies, faster для power users, integrates у dev workflows

### **Demo Pitch Strategy:**
> "Перше AI рішення що дає вибір між privacy (local LLM) та performance (cloud LLM). Почніть безкоштовно з локальною моделлю, scale до cloud при потребі. Ваші чати, ваші дані, ваш контроль."