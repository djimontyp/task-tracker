---
title: "LLM Extraction Pipeline — Дослідження"
created: 2025-01-03
updated: 2025-01-03
tags:
  - дослідження
  - llm
  - extraction
  - pydantic-ai
status: in-progress
---

# LLM Extraction Pipeline — Дослідження

> Глибокий аналіз як працює knowledge extraction в Pulse Radar

## Проблема

Користувачі очікують що система автоматично структурує messages → atoms/topics.
При тестуванні агента локальні моделі (DeepSeek, Qwen) повертають JSON загорнутий у markdown code blocks замість чистого JSON.

## Архітектура Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE EXTRACTION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Message arrives → save_telegram_message()                      │
│       │                                                         │
│       ├─▶ score_message_task() ✅                               │
│       │                                                         │
│       └─▶ queue_knowledge_extraction_if_needed()               │
│            │                                                    │
│            ├── unprocessed_count >= 10? (ai_config)            │
│            ├── AgentConfig "knowledge_extractor" exists?       │
│            └── extract_knowledge_from_messages_task.kiq()      │
│                     │                                           │
│                     ▼                                           │
│            KnowledgeOrchestrator.extract_knowledge()           │
│                     │                                           │
│                     ▼                                           │
│            Topics + Atoms saved to DB                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Ключові файли

| Файл | Призначення |
|------|-------------|
| `backend/app/services/knowledge/llm_agents.py` | System prompts (EN/UK), build_model_instance |
| `backend/app/services/knowledge/knowledge_orchestrator.py` | Головна логіка extraction |
| `backend/app/services/knowledge/knowledge_schemas.py` | Pydantic schemas для output |
| `backend/app/services/agent_service.py` | Test endpoint для UI |
| `backend/app/tasks/ingestion.py` | Auto-trigger logic |
| `backend/app/tasks/knowledge.py` | TaskIQ background jobs |
| `backend/app/config/ai_config.py` | Thresholds та налаштування |

## Знахідка #1: Два різних flows

### Test Endpoint (UI кнопка "Тестувати агента")

```python
# agent_service.py:80-83
pydantic_agent = PydanticAgent(
    model=model,
    system_prompt=agent.system_prompt,  # ← з БД (юзер написав)
    # ❌ НІ output_type — free text!
)
```

**Проблема:** Без `output_type` Pydantic AI не форсить JSON schema.

### Production Extraction

```python
# knowledge_orchestrator.py:191-196
agent = PydanticAgent(
    model=model,
    system_prompt=system_prompt,  # ← get_extraction_prompt() з коду
    output_type=KnowledgeExtractionOutput,  # ✅ STRUCTURED!
    output_retries=5,  # ✅ RETRY!
)
```

**Результат:** Pydantic AI парсить response в schema, навіть якщо модель додала markdown wrapper.

## Знахідка #2: System prompts

Production extraction використовує hardcoded prompts з `llm_agents.py`, а НЕ `AgentConfig.system_prompt` з бази даних.

```python
# knowledge_orchestrator.py:137
system_prompt = get_extraction_prompt(self.language)  # ← з КОДУ!
```

Це означає що юзер може редагувати system_prompt в UI, але для production extraction він НЕ використовується.

## Знахідка #3: Auto-extraction вимоги

Для автоматичного запуску extraction потрібно:

1. **AgentConfig** з `name="knowledge_extractor"` + `is_active=True`
2. **LLMProvider** активний та валідований
3. **≥10 unprocessed messages** за останні 24h (configurable)

Якщо немає агента — система мовчки skip'ає з WARNING в logs.

## Проблеми для вирішення

### P1: Test endpoint не репрезентативний

Test endpoint не використовує:
- Structured output (`output_type`)
- Hardcoded prompts з коду
- Retry logic

**Рішення варіанти:**
- [ ] A) Додати `output_type` в test service
- [ ] B) Strip markdown wrappers з response
- [ ] C) Показати warning "Test != Production"

### P2: AgentConfig.system_prompt не використовується

Юзер може редагувати prompt в UI, але production extraction його ігнорує.

**Рішення варіанти:**
- [ ] A) Використовувати AgentConfig.system_prompt + append schema
- [ ] B) Прибрати поле з UI (read-only display)
- [ ] C) Merge: base prompt + user customizations

### P3: Seed default agent

Нові юзери не мають `knowledge_extractor` агента.

**Issue:** task-tracker-sa2

### P4: Слабкі моделі ігнорують JSON instructions

DeepSeek-r1, Qwen та інші локальні моделі часто:
- Додають markdown code fences
- Додають пояснення до/після JSON
- "Думають вголос" (reasoning models)

**Рішення варіанти:**
- [ ] A) Post-processing: strip ```json і ```
- [ ] B) Stronger prompting: few-shot examples
- [ ] C) Provider-specific flags: Ollama `format: "json"`
- [ ] D) Retry з fallback parsing

## Thresholds (ai_config.py)

| Setting | Default | Description |
|---------|---------|-------------|
| `message_threshold` | 10 | Min messages to trigger extraction |
| `lookback_hours` | 24 | Time window |
| `confidence_threshold` | 0.7 | Auto-approval threshold |
| `batch_size` | 50 | Max messages per batch |
| `noise_threshold` | 0.30 | Below = noise |
| `signal_threshold` | 0.60 | Above = signal |

## Цінність кожної сутності

### Agent (Спеціаліст) — WHO

**Цінність:** Різні "мізки" для різних задач

| Agent | Model | Temp | Use Case |
|-------|-------|------|----------|
| **Knowledge Extractor** | deepseek-r1:14b (локальний) | 0.3 | Щоденний parsing → atoms/topics |
| **Executive Summarizer** | gpt-4o (платний) | 0.7 | Тижневі звіти для CEO |
| **Bug Detector** | qwen2.5:7b (швидкий) | 0.1 | Real-time alert на баги |

**User value:** Дешева модель для рутини, дорога — для важливих звітів.

### Project (Контекст) — WHAT

**Цінність:** Домен-специфічний контекст для точнішого parsing

**Приклад "Mobile App":**
```yaml
keywords: ["flutter", "ios", "android", "crash", "ANR"]
glossary: {"ANR": "Application Not Responding"}
components: ["auth", "payments", "push", "analytics"]
priority: {bug: HIGH, feature: MEDIUM}
```

**Без Project:**
```
Message: "ANR на логіні, P99 виріс"
LLM output: "Якась технічна проблема" (generic)
```

**З Project:**
```
LLM output: "CRITICAL: Mobile App crash (ANR) + Backend latency"
```

**User value:** LLM розуміє МІЙ домен, а не generic tech terms.

### Scheduled Task (Автоматизація) — WHEN + HOW

**Цінність:** "Set and forget" — система працює без мене

| Task | Schedule | Agent | Project | Action |
|------|----------|-------|---------|--------|
| Daily Mobile Extraction | 9:00 daily | Knowledge Extractor | Mobile App | Extract + auto-approve >0.85 |
| Weekly Executive Report | Fri 17:00 | Summarizer (GPT-4o) | All projects | Markdown → Slack |
| Real-time Bug Alert | Every 15min | Bug Detector | Mobile App | Telegram notification |

**User value:** Налаштував раз — працює завжди.

### Комбінації (сила системи)

```
SIMPLE: 1 Agent + 1 Project + 1 Task
─────────────────────────────────────
Knowledge Extractor → Mobile App → Daily 9am

CROSS-PROJECT: 1 Agent + N Projects + 1 Task
─────────────────────────────────────────────
Summarizer → [Mobile + Backend + Design] → Weekly report

MULTI-PURPOSE: N Agents + 1 Project + N Tasks
─────────────────────────────────────────────
Mobile App → Extractor (daily) + Summarizer (weekly) + Bug Detector (15min)
```

---

## Архітектурне рішення (v2)

### Розділення відповідальностей

```
┌─────────────────┐
│     AGENT       │  = WHO (Хто робить)
│   (Specialist)  │
├─────────────────┤
│ • model_name    │  deepseek-r1:14b, gpt-4o, etc.
│ • temperature   │  0.3 (factual) ... 0.9 (creative)
│ • base_prompt   │  READ-ONLY: структура, JSON schema
│ • custom_prompt │  EDITABLE: додаткові інструкції
└────────┬────────┘
         │ M:N
         ▼
┌─────────────────┐
│    PROJECT      │  = WHAT (Що шукати)
│    (Context)    │
├─────────────────┤
│ • keywords      │  ["api", "баг", "рішення"]
│ • glossary      │  {"PR": "Pull Request", ...}
│ • components    │  ["backend", "mobile", "auth"]
│ • priority_rules│  {"bug": high, "idea": medium}
│ • atom_types    │  [problem, solution, decision]
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│ SCHEDULED TASK  │  = WHEN + HOW (Коли і як)
│   (Execution)   │
├─────────────────┤
│ • cron_schedule │  "0 9 * * *" (daily 9am)
│ • agent_id      │  → який агент
│ • project_ids[] │  → які проєкти (context)
│ • filters       │  channels, min_score, lookback
│ • auto_approve  │  confidence > 0.85 → approve
└─────────────────┘
```

### System Prompt Composition

При виконанні extraction система збирає prompt з 3 частин:

```
┌────────────────────────────────────────────────────────────────┐
│ 1. BASE PROMPT (read-only, from code)                          │
│    • JSON schema definition                                    │
│    • Atom types: problem/solution/insight/decision/...         │
│    • Confidence scoring rules                                  │
│    • Language: "Output MUST be in Ukrainian"                   │
├────────────────────────────────────────────────────────────────┤
│ 2. PROJECT CONTEXT (injected from selected projects)           │
│    • Keywords: {merged from all projects}                      │
│    • Glossary: {merged glossaries}                             │
│    • Components: {merged components}                           │
│    • Priority rules: {merged priorities}                       │
├────────────────────────────────────────────────────────────────┤
│ 3. AGENT CUSTOMIZATION (editable by user)                      │
│    • "Focus on technical decisions"                            │
│    • "Ignore small talk and greetings"                         │
│    • Domain-specific instructions                              │
└────────────────────────────────────────────────────────────────┘
```

### Принципи

| Принцип | Реалізація |
|---------|------------|
| **Прозорість** | Base prompt видимий (read-only), user бачить що система робить |
| **Розділення** | Agent = поведінка, Project = контекст, Task = execution |
| **Композиція** | Final prompt = Base + Project(s) + Agent custom |
| **Гнучкість** | Можна комбінувати різні agents + projects |

### UI зміни

**Agent Card:**
- Base prompt: показати read-only (collapsible)
- Custom prompt: editable textarea
- Прив'язані projects: multi-select

**Test Modal:**
- Має використовувати той самий flow що production
- Показати composed prompt перед тестом

## План реалізації

### Phase 1: Sync Test = Production
- [ ] Test endpoint використовує `output_type=KnowledgeExtractionOutput`
- [ ] Test endpoint використовує composed prompt (base + project + custom)
- [ ] Strip markdown wrappers як fallback

### Phase 2: UI Transparency
- [ ] Agent form: показати base_prompt (read-only)
- [ ] Agent form: розділити на base + custom
- [ ] Test modal: показати final composed prompt

### Phase 3: Project Integration
- [ ] M:N зв'язок Agent ↔ Project
- [ ] Merge project contexts при extraction
- [ ] UI для вибору projects в agent

### Phase 4: Scheduled Tasks
- [ ] CRUD для scheduled extraction tasks
- [ ] Cron scheduler integration
- [ ] Auto-approve rules

## Changelog

| Дата | Зміна |
|------|-------|
| 2025-01-03 | Початок дослідження, знайдено 2 flows |
| 2025-01-03 | Архітектурне рішення v2: Agent/Project/Task separation |
| 2025-01-03 | Додано цінність кожної сутності + use cases + комбінації |

## Пов'язане

- [[knowledge-pipeline-roadmap]] — Product roadmap
- [[../знання/архітектура/api-layer]] — API structure
- task-tracker-sa2 — Seed default agent issue
