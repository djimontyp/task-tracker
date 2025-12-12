# Agents v2 Architecture

## Принцип: Мінімальні агенти + Skills з Progressive Disclosure

### Чому так?

```
❌ Старий підхід:
   Agent = 150+ рядків документації
   Проблема: Агент НЕ читає автоматично @mentions з батьківської сесії
   Результат: Марна трата токенів на непотрібний контекст

✅ Новий підхід:
   Agent = 30 рядків (identity + model + skills)
   Skills = SKILL.md (~50 рядків) + references/ (lazy load)
   Результат: ~100 рядків замість 1270
```

### Архітектура

```
.claude/
├── agents-v2/                 # 7 мінімальних агентів
│   ├── F1-frontend-expert.md  # 30 lines, skills: [frontend, design-tokens]
│   ├── B1-backend-expert.md   # 30 lines, skills: [backend]
│   ├── V1-visual-designer.md  # 30 lines, skills: [design-tokens]
│   ├── U1-ux-specialist.md    # 30 lines, skills: [frontend, design-tokens]
│   ├── Q1-super-qa.md         # 30 lines, skills: [testing]
│   ├── L1-llm-engineer.md     # 30 lines, skills: [llm-pipeline]
│   └── I1-i18n-engineer.md    # 30 lines, skills: [docs]
│
└── skills-v2/                 # Детальна документація
    ├── frontend/
    │   ├── SKILL.md           # Core: React, TS, architecture
    │   └── references/
    │       ├── state-management.md  # Zustand + TanStack
    │       └── websocket.md         # WebSocket patterns
    ├── backend/
    │   └── SKILL.md           # Core: FastAPI, SQLModel
    ├── design-tokens/
    │   └── SKILL.md           # Core: colors, spacing, patterns
    ├── testing/
    │   └── SKILL.md           # Core: pytest, Vitest, Playwright
    ├── llm-pipeline/
    │   └── SKILL.md           # Core: Pydantic-AI, RAG, embeddings
    └── docs/
        └── SKILL.md           # Core: MkDocs, UK plurals
```

### Як працює Progressive Disclosure

```
1. Task(subagent_type="F1") викликається
2. Агент завантажує F1-frontend-expert.md (30 рядків)
3. Skills з YAML header завантажуються автоматично:
   - frontend/SKILL.md (50 рядків)
   - design-tokens/SKILL.md (50 рядків)
4. references/*.md завантажуються ТІЛЬКИ якщо агент їх читає
```

### Розмір контексту

| Компонент | Старий | Новий |
|-----------|--------|-------|
| Agent | 180 рядків | 30 рядків |
| Skills | (вбудовано) | 50 рядків × 2 |
| References | (вбудовано) | 0 (lazy) |
| **Total** | **180** | **~130** (і менше якщо refs не потрібні) |

### Матриця Agents → Skills

| Agent | Skills |
|-------|--------|
| A1 Business Analyst | ba |
| F1 Frontend | frontend, design-tokens, storybook |
| B1 Backend | backend |
| V1 Visual | design-tokens |
| U1 UX | frontend, design-tokens |
| Q1 QA | testing |
| L1 LLM | llm-pipeline |
| I1 i18n | docs |

### Використання

```bash
# Делегувати задачу агенту
Task(
  subagent_type="Frontend Expert (F1)",
  prompt="Створи AtomCard компонент"
)

# Агент автоматично отримує:
# - F1-frontend-expert.md
# - frontend/SKILL.md
# - design-tokens/SKILL.md
# - (references/ тільки якщо потрібно)
```

### Міграція

```bash
# Поточні агенти
.claude/agents/          # 17 файлів (старі)

# Нові агенти
.claude/agents-v2/       # 7 файлів (нові)

# Щоб активувати нову структуру:
mv .claude/agents .claude/agents-old
mv .claude/agents-v2 .claude/agents
mv .claude/skills-v2 .claude/skills-new
# Merge з існуючими skills
```

### Коли додавати reference?

- Базова інформація → SKILL.md
- Детальні приклади → references/examples.md
- Повна документація → references/full-docs.md
- Рідко використовувані патерни → references/advanced.md

**Правило:** Якщо інформація потрібна в 80% випадків → SKILL.md. Інакше → references/.