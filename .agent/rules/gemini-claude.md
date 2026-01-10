---
trigger: always_on
---

# CLAUDE.md

## Самосприйняття

Не буть самонадіяним та самовпевненим! Твої плани не ідеальні і не чудові або твоїх агентів. Вони більше як наброски. Ти маєшь отримувати від мене підтвердження концепцій рішень архітектурних і подібного роду завдання, але якщо є задачі затверджені або мілкі тут треба працювати автономно.

## Мова

- **Спілкування:** завжди українською
- **Код:** коментарі та docstrings **ТІЛЬКИ** англійською
- **Питання:** спершу пряма відповідь, потім дії (не ігноруй питання!)

## MCP Playwright

**URL для браузера:** `http://localhost` (БЕЗ порта!)

```bash
# ✅ ПРАВИЛЬНО
http://localhost/messages
http://localhost/settings

# ❌ НЕПРАВИЛЬНО
http://localhost:3000/messages
```

Nginx проксує на правильний порт автоматично.

## Проект

**Pulse Radar** — AI-система збору знань з комунікаційних каналів (Telegram, Slack).

**Проблема:** 100+ повідомлень/день, 80% — шум. Важлива інформація втрачається.

**Core Flow:** `Telegram → Інгест → AI-екстракція → Атом → Топік → Дашборд`

**Статус:** MVP Верифіковано (11/31 features)

## Концепції (Core)

> **ADR-002:** Entity Hierarchy — Topics > Atoms > Messages

### Ієрархія сутностей

```
┌─────────────────────────────────────────────────────┐
│                      TOPICS                          │
│        (верхній рівень: Mobile, Frontend, Backend)   │
│  ┌─────────────────────────────────────────────────┐│
│  │                    ATOMS                        ││
│  │    (знання: problems, decisions, insights)      ││
│  │  ┌─────────────────────────────────────────┐   ││
│  │  │              MESSAGES                   │   ││
│  │  │         (raw data, hidden layer)        │   ││
│  │  └─────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

| Сутність | Роль | Видимість |
|----------|------|-----------|
| **Topics** | Організаційні категорії (Mobile, Frontend, Backend) | Main sidebar |
| **Atoms** | Одиниці знань (problem, solution, decision, insight) | Main sidebar, primary workflow |
| **Messages** | Raw data з Telegram (hidden layer) | Admin only, debug |

### User Journey

```
1. "Що накапало?" → Dashboard (pending atoms, new today)
2. "Drill-down" → Topics → Atoms (звідки, коли, навіщо)
3. "Підтвердження" → Approve/Reject atoms
4. (Admin) → Messages debug, Providers, Prompts
```

### Ролі

| Роль | Фокус | Доступ |
|------|-------|--------|
| **End User** | Knowledge consumption | Topics, Atoms, Dashboard, Search |
| **Admin** | + System configuration | + Messages, Providers, Prompts |

**Документація:** `.obsidian-docs/знання/концепції/`

## Команди

> **ВАЖЛИВО:** Завжди віддавай перевагу `just` командам! Див. [justfile](justfile)

```bash
just                  # показати всі команди

# Services
just services-dev     # запуск з live reload (ss)
just services-stop    # зупинити (st)
just rebuild backend  # перебудувати один сервіс

# Database
just db-full-reset    # nuclear reset + full seed
just db-seed 50       # seed N tasks
just db-topics-seed   # seed topics + atoms + messages

# Quality
just typecheck        # mypy перевірка (tc)
just fmt              # format code
just test             # pytest suite

# Docs
just docs             # http://127.0.0.1:8081
```

## Roadmap

**MVP (11 features) ✅:**
F001 Telegram інгест, F002 Messages, F003 AI-екстракція, F004 Topics, F005 Atoms, F006 Dashboard, F008 LLM Providers, F019 Health, F026 TaskIQ, F030 Settings, F031 shadcn Theme

**v1.1 (5):** WebSocket, AI-агенти, Семантичний пошук, Ембедінги, API інгесту
**v1.2 (5):** Task assignments, FTS, Projects, Version history, Users
**Later (5):** Noise filter, Automation rules, Scheduled jobs, Auto-approve, Scoring
**Dormant (5):** Metrics WS, Task configs, Prompts, RAG, Onboarding — *приховані з UI*

---

## Tech Stack (TL;DR)

**Backend:**
- Python 3.12, FastAPI 0.117.1, SQLModel 0.0.24
- Pydantic 2.10, Alembic 1.16, mypy 1.17 (strict)
- TaskIQ + taskiq-nats, Pydantic AI 1.0.10

**Frontend:**
- React 18.3.1, TypeScript 5.9.3, Vite 7.1.9
- Zustand 5.0, TanStack Query 5.90
- shadcn/ui (Radix), Tailwind CSS 3.4
- Vitest, Playwright

**Infrastructure:**
- PostgreSQL 15 + pgvector 0.4
- NATS JetStream
- Docker Compose + Nginx

**Детальна архітектура:** @.claude/rules/architecture.md

---

## Testing (TL;DR)

> **Я перевіряю UI 1 раз. Далі — тести МАЮТЬ ловити регресії!**

**Головне правило:**
Якщо UI зламається — тест **ПОВИНЕН** впасти. Якщо тест не впав при поломці — тест поганий, переписати.

**Обов'язково:**
- Backend: pytest (80%+ coverage), `just typecheck` після кожної зміни
- Frontend: Vitest (unit/integration), Playwright (E2E)
- Assertion messages: `assert x == y, f"Expected {y}, got {x}"`

**Повні правила:** @.claude/rules/testing.md

---

## Design System (TL;DR)

> **Semantic tokens, 4px grid, 44px touch, WCAG AA**

**Критичні правила:**
- ❌ Заборонені raw кольори: `bg-red-*`, `text-green-*`
- ✅ Використовуй tokens: `bg-semantic-error`, `text-status-connected`
- ❌ Заборонені odd spacing: `gap-3`, `p-5`, `m-7`
- ✅ Тільки 4px кратні: `gap-2`, `gap-4`, `p-4`, `p-6`
- ✅ Touch targets: кнопки ≥44px (`h-11 w-11`)
- ✅ Status indicators: icon + text (не тільки колір)

**Icons:** Тільки `lucide-react` (ESLint блокує heroicons)

**TypeScript tokens:**
```tsx
import { badges, cards, semantic } from '@/shared/tokens';
<Badge className={badges.status.connected}>
  <CheckCircle className="h-3.5 w-3.5" />
  Connected
</Badge>
```

**Повна документація:**
- Frontend patterns: @frontend/CLAUDE.md, @frontend/AGENTS.md
- Design tokens: Use `/design-tokens` skill
- Storybook: http://localhost:6006, use `/storybook` skill

---

## Detailed Rules & Workflows

**Architecture & Business Logic:**
@.claude/rules/architecture.md — Backend/Frontend/WebSocket/Services/LLM Pipeline

**Code Quality:**
@.claude/rules/code-rules.md — Imports, коментарі, принципи (KISS/DRY/YAGNI)
@.claude/rules/git-hooks.md — Pre-commit hooks, lint-staged
@.claude/rules/testing.md — Філософія тестування, assertions

**Agent Workflow:**
@.claude/rules/agent-workflow.md — Fail-fast, blockers, Beads integration

---

## Skills Reference

**Frontend Development:**
- `/frontend` — React 18, TypeScript, shadcn/ui patterns
- `/design-tokens` — Semantic colors, spacing grid, component patterns
- `/storybook` — Component library, CSF3 stories
- `/frontend-flow` — Design System verification pipeline

**Backend Development:**
- `/backend` — FastAPI endpoints, SQLModel, async services
- `/testing` — pytest, Vitest, Playwright patterns
- `/llm-pipeline` — Pydantic-AI agents, RAG, embeddings

**Workflow:**
- `/smart-commit` — Atomic commits with semantic grouping
- `/api-contracts` — Sync FastAPI ↔ React types
- `/ascii-diagrams` — Create/fix box-drawings (global skill)

**Documentation:**
- `/docs` — Bilingual docs (EN/UK), MkDocs, i18n

**Business Analysis:**
- `/ba` — Requirements analysis, RACI matrices, user stories

---

## Документація

- **Frontend:** @frontend/CLAUDE.md — архітектура, state management, patterns
- **Frontend AI Rules:** @frontend/AGENTS.md — правила для AI (tokens, do/don't)
- `docs/design-system/` — Design System (colors, spacing, components)
- `docs/architecture/OVERVIEW.md` — системна архітектура
- `.artifacts/progress.md` — прогрес стабілізації
