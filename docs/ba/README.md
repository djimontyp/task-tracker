# Pulse Radar: Business Analysis Artifacts

Продуктова документація з використанням BA методології.

---

## Quick Links

| Артефакт | Статус | Опис |
|----------|--------|------|
| [Vision & Scope](./01-vision-scope.md) | 🟢 | Що робимо і навіщо |
| [Glossary](./02-glossary.md) | 🟢 | Терміни (aligned with code) |
| [Data Dictionary](./02-data-dictionary.md) | 🟢 | **NEW:** Field-level reference |
| [Stakeholders](./03-stakeholders.md) | 🟢 | Зацікавлені сторони |
| [User Stories](./04-requirements/user-stories.md) | 🟢 | 15 stories, 8 MVP |
| [Use Cases](./04-requirements/use-cases.md) | 🟢 | 8 MVP use cases |
| [Acceptance Criteria](./04-requirements/acceptance-criteria.md) | 🟢 | 38 Gherkin criteria |
| [Traceability Matrix](./04-requirements/traceability-matrix.md) | 🟢 | Story→UC→AC→Component |
| [Business Rules](./04-requirements/business-rules.md) | 🟢 | 25 business rules |
| [Security Requirements](./04-requirements/security-requirements.md) | 🟢 | **NEW:** OWASP, encryption, auth |
| [Context Diagram](./05-diagrams/context-diagram.md) | 🟢 | Системна архітектура |
| [User Flows](./05-diagrams/flows/README.md) | 🟢 | 6 ключових flows |
| [Sequence Diagrams](./05-diagrams/sequences/README.md) | 🟢 | 6 technical sequences |
| [UI State Diagrams](./05-diagrams/ui-states/README.md) | 🟢 | **NEW:** 6 component states |
| [Roadmap](./06-planning/roadmap.md) | 🟢 | MVP → v1.1 → v1.2 |
| [Risk Register](./06-planning/risks.md) | 🟢 | 9 ризиків |

**Статуси:** 🔴 Not Started → 🟡 Draft → 🟠 Review → 🟢 Approved

**Прогрес:** ✅ 16/16 approved | **Питань закрито:** 12 | **Deep dive score:** 9/10

---

## Структура

```
docs/ba/
├── README.md                    # Ця сторінка
├── 01-vision-scope.md           # Vision & Scope Document
├── 02-glossary.md               # Глосарій термінів
├── 03-stakeholders.md           # Stakeholder Analysis
├── 04-requirements/
│   ├── user-stories.md          # User Stories (INVEST) + DoD
│   ├── use-cases.md             # Use Cases (8 MVP)
│   ├── acceptance-criteria.md   # Acceptance Criteria (Gherkin)
│   ├── traceability-matrix.md   # Story→UC→AC→Component mapping
│   ├── business-rules.md        # 25 business rules
│   └── security-requirements.md # Security (OWASP, encryption)
├── 05-diagrams/
│   ├── context-diagram.md       # Context/Container Diagrams
│   ├── flows/
│   │   └── README.md            # User Flow Diagrams
│   ├── sequences/
│   │   ├── README.md            # Index + Legend
│   │   ├── 01-daily-review.md   # Dashboard metrics
│   │   ├── 02-atom-approval.md  # Approve/Reject + WS
│   │   ├── 03-weekly-report.md  # Activity aggregation
│   │   ├── 04-knowledge-search.md # Semantic + pgvector
│   │   ├── 05-user-invitation.md  # User CRUD + Telegram
│   │   └── 06-telegram-setup.md   # Webhook + Ingestion
│   └── ui-states/
│       └── README.md            # Component state diagrams
└── 06-planning/
    ├── roadmap.md               # Product Roadmap (with dates)
    └── risks.md                 # Risk Register
```

---

## MVP Scope (8 Stories)

| Epic | Stories | Focus |
|------|---------|-------|
| Daily Review | US-001, US-002, US-003 | Dashboard, Filter, Atoms |
| Weekly Summary | US-010 | Executive Report |
| Search | US-020 | Keyword Search |
| Admin | US-030, US-031, US-033 | Users, LLM, Telegram |

---

## Key Numbers

| Metric | Value |
|--------|-------|
| User Stories | 15 total, 8 MVP |
| Use Cases | 8 (MVP coverage) |
| Acceptance Criteria | 38 (Gherkin format) |
| Traceability | Story→UC→AC→Component |
| User Flows | 6 key scenarios |
| Sequence Diagrams | 6 technical flows |
| UI State Diagrams | 6 component states |
| Security Requirements | OWASP + encryption |
| Risks | 9 identified |
| Questions Resolved | 12/12 |
| Definition of Done | ✅ Added |
| Timeline | Dec 2025 → Jun 2026+ |

---

## Tracking

Робочі файли для відстеження прогресу:
- [Progress](/.artifacts/ba-work/PROGRESS.md) — статус артефактів
- [Questions](/.artifacts/ba-work/QUESTIONS.md) — рішення

---

## BA Course Reference

Методологія базується на курсі в [docs/ba-course/](../ba-course/README.md):
- Vision & Scope шаблон → `05-артефакты-ба-часть-1.md`
- User Stories (INVEST) → `08-артефакты-ба-часть-2.md`
- Use Cases → `08-артефакты-ба-часть-2.md`
- BPMN діаграми → `06-артефакты-визуализации-диаграммы-bpmn.md`
- Stakeholder Analysis → `02-стейкхолдеры.md`
- Risk Management → `11-риски-и-изменения-требований.md`
