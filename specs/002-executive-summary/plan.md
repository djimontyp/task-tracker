# Implementation Plan: Executive Summary Epic

**Branch**: `002-executive-summary` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-executive-summary/spec.md`

## Summary

Executive Summary Epic надає CEO та PM тижневий підсумок ключових рішень (DECISION) та блокерів (BLOCKER) по всіх проєктах. Технічно це нова сторінка з агрегуючим API endpoint, що фільтрує approved атоми за період та групує по топіках. Frontend використовує існуючі компоненти DataTable та MetricCard.

**ВАЖЛИВО**: Epic включає US-010 (Must) + US-011 (Should) з PRD Epic 2.

## Pre-requisites

**AtomType Sync з PRD** (блокуюча залежність):

PRD (Частина 6.1) визначає 9 типів атомів, код має лише 7:

| PRD Type | В коді? | Дія |
|----------|---------|-----|
| decision | ✅ | — |
| problem | ✅ | — |
| solution | ✅ | — |
| question | ✅ | — |
| insight | ✅ | — |
| idea | ❌ | **ДОДАТИ** |
| blocker | ❌ | **ДОДАТИ** (критично для Executive Summary!) |
| risk | ❌ | **ДОДАТИ** |
| requirement | ✅ | — |
| pattern | ⚠️ | Немає в PRD — deprecate |

**Executive Summary фільтрує по `decision` та `blocker`** — без `blocker` типу фіча не працюватиме.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.9.3 (frontend)
**Primary Dependencies**: FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, shadcn/ui
**Storage**: PostgreSQL 15 (existing atoms, topics, topic_atoms tables)
**Testing**: pytest (backend), Vitest + Playwright (frontend)
**Target Platform**: Web (Docker deployment)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Summary load <3s for 50+ atoms (SC-002), Export <5s for 100 atoms (SC-005)
**Constraints**: Period change <2s (SC-007), No new tables needed, Ukrainian UI
**Scale/Scope**: 20-100 atoms/week, 1-10 topics/project

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> Note: Constitution file contains template only, no project-specific principles defined.
> Following project CLAUDE.md principles:
> - **KISS**: Simple aggregation endpoint, reuse existing components
> - **DRY**: Extend AtomCRUD, not new service
> - **YAGNI**: No advanced analytics, just filtering and grouping
> - **Test-first**: E2E tests for critical flows

**Pre-Phase 0 Status**: PASS (no violations)

## Project Structure

### Documentation (this feature)

```text
specs/002-executive-summary/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.yaml         # OpenAPI spec for new endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/
│   │   ├── executive_summary.py      # NEW: API endpoint
│   │   └── schemas/
│   │       └── executive_summary.py  # NEW: Response schemas
│   └── services/
│       └── executive_summary_service.py  # NEW: Business logic
└── tests/
    └── api/v1/
        └── test_executive_summary.py     # NEW: API tests

frontend/
├── src/
│   ├── pages/
│   │   └── ExecutiveSummaryPage/         # NEW: Page component
│   │       ├── index.tsx
│   │       ├── components/
│   │       │   ├── SummaryPeriodSelector.tsx
│   │       │   ├── DecisionsList.tsx
│   │       │   ├── BlockersList.tsx
│   │       │   ├── ProjectMetrics.tsx
│   │       │   └── ExportButton.tsx
│   │       └── hooks/
│   │           └── useExecutiveSummary.ts
│   └── features/
│       └── executive-summary/            # NEW: Feature module
│           ├── api/
│           │   └── executiveSummaryService.ts
│           └── types/
│               └── index.ts
└── tests/
    └── e2e/
        └── executive-summary.spec.ts     # NEW: E2E tests
```

**Structure Decision**: Web application (Option 2) - adding to existing backend/frontend structure

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
