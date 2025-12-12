# Implementation Plan: Daily Review Epic

**Branch**: `001-daily-review-epic` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-daily-review-epic/spec.md`

## Summary

Daily Review Epic надає PM та тімлідам дашборд з метриками, сторінку повідомлень з фільтром Signal/Noise, сторінку перегляду Atoms з групуванням по типу та пакетними операціями approve/reject, та навігацію по Topics. Технічно використовується існуючий backend (FastAPI + PostgreSQL) з новими endpoints для агрегованих метрик та розширенням frontend компонентів React + shadcn/ui.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.9.3 (frontend)
**Primary Dependencies**: FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, Zustand 5.0, shadcn/ui
**Storage**: PostgreSQL 15 + pgvector 0.4
**Testing**: pytest (backend, 996 тестів), Vitest (frontend unit), Playwright (E2E)
**Target Platform**: Docker Compose (web application), Modern browsers
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Dashboard load <2s (FR-006), Bulk approve 10 atoms <1s (FR-018)
**Constraints**: 1-5 concurrent users, 1000-5000 messages/day, українська мова UI
**Scale/Scope**: 4 User Stories, ~15 functional requirements, existing models reuse

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Note**: Project constitution is not yet defined (template placeholders). Using project's CLAUDE.md principles:

| Principle | Status | Justification |
|-----------|--------|---------------|
| **KISS** | ✅ PASS | Використовуємо існуючі моделі та API, мінімальні зміни |
| **DRY** | ✅ PASS | Бізнес-логіка в сервісах, компоненти з Design System |
| **YAGNI** | ✅ PASS | Тільки функціонал з User Stories, без "про запас" |
| **Test-First** | ⚠️ MONITOR | Вимога: кожна фіча = тест, кожен баг-фікс = тест |
| **Design System** | ✅ PASS | Semantic tokens, shadcn/ui, Storybook stories |
| **Semantic Tokens** | ✅ PASS | Заборонені raw Tailwind colors (bg-red-*, etc.) |
| **Spacing 4px Grid** | ✅ PASS | Тільки gap-2/4/6/8, p-2/4/6/8 |

**Pre-Phase 0 Gate**: ✅ PASSED — можна продовжувати research

## Project Structure

### Documentation (this feature)

```text
specs/001-daily-review-epic/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── openapi-daily-review.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── message.py           # Existing: Message з noise_classification, importance_score
│   │   ├── atom.py              # Existing: Atom, BulkApproveRequest/Response
│   │   ├── topic.py             # Existing: Topic, RecentTopicsResponse
│   │   └── enums.py             # Existing: NoiseClassification, AtomType
│   ├── api/v1/
│   │   ├── messages.py          # Existing: filter by classification
│   │   ├── atoms.py             # Existing: bulk-approve endpoint
│   │   ├── topics.py            # Existing: /recent endpoint
│   │   ├── stats.py             # Existing: /activity, /sidebar-counts
│   │   └── dashboard.py         # NEW: агреговані метрики для Dashboard
│   └── services/
│       └── dashboard_service.py # NEW: логіка агрегації метрик
└── tests/
    ├── api/
    │   └── test_dashboard.py    # NEW
    └── services/
        └── test_dashboard_service.py # NEW

frontend/
├── src/
│   ├── pages/
│   │   ├── DashboardPage/       # UPDATE: DashboardMetrics, TopTopics
│   │   ├── MessagesPage/        # UPDATE: Signal/Noise filter UI
│   │   ├── AtomsPage/           # NEW: сторінка перегляду Atoms
│   │   └── TopicsPage/          # UPDATE: Topics list з кількостями
│   ├── shared/
│   │   ├── api/
│   │   │   └── dashboard.ts     # NEW: API hooks для метрик
│   │   ├── components/
│   │   │   ├── AtomCard/        # NEW: картка атома
│   │   │   ├── AtomTypeGroup/   # NEW: групування по типу
│   │   │   └── SignalNoiseFilter/ # NEW: компонент фільтру
│   │   └── tokens/              # Existing: semantic colors, spacing
│   └── features/
│       └── atoms/               # NEW: Zustand store для atoms
└── tests/
    ├── components/              # Vitest unit tests
    └── e2e/                     # Playwright E2E tests
```

**Structure Decision**: Web application (backend + frontend). Використовуємо існуючу структуру проєкту з мінімальними новими файлами. Основна робота — розширення існуючих компонентів та додавання нового endpoint для Dashboard метрик.

## Complexity Tracking

> No violations — all principles pass.

| Area | Complexity | Justification |
|------|------------|---------------|
| New backend endpoint | Minimal | 1 new router, 1 new service |
| New frontend page | Minimal | AtomsPage reuses existing patterns |
| Database changes | None | Using existing models |
| API changes | Additive | 2 new endpoints, no breaking changes |

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design:*

| Principle | Status | Notes |
|-----------|--------|-------|
| **KISS** | ✅ PASS | Мінімальні нові файли, переважно reuse |
| **DRY** | ✅ PASS | Використовуємо існуючі моделі та patterns |
| **YAGNI** | ✅ PASS | Тільки необхідний функціонал для User Stories |
| **Test-First** | ✅ READY | Визначено тести в quickstart.md |
| **Design System** | ✅ PASS | Semantic tokens, EmptyState pattern |
| **Semantic Tokens** | ✅ PASS | Заплановано використання tokens/ |
| **Spacing 4px Grid** | ✅ PASS | Заплановано p-4, gap-4 |

**Post-Phase 1 Gate**: ✅ PASSED — готово до Phase 2 (tasks generation)

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Plan | `specs/001-daily-review-epic/plan.md` | ✅ Complete |
| Research | `specs/001-daily-review-epic/research.md` | ✅ Complete |
| Data Model | `specs/001-daily-review-epic/data-model.md` | ✅ Complete |
| API Contracts | `specs/001-daily-review-epic/contracts/openapi-daily-review.yaml` | ✅ Complete |
| Quickstart | `specs/001-daily-review-epic/quickstart.md` | ✅ Complete |

**Next Step**: Run `/speckit.tasks` to generate implementation tasks
