# Implementation Plan: i18n Internationalization

**Branch**: `005-i18n` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-i18n/spec.md`

## Summary

Two-level localization system for Pulse Radar:
1. **UI Language** — User interface localization using react-i18next with Zustand persistence
2. **Project Language** — AI-generated content language using separate native prompts

Ukrainian default. Instant language switching (<100ms). Backend persistence for user preferences.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.9.3 (frontend)
**Primary Dependencies**: FastAPI 0.117.1, React 18.3.1, react-i18next, Zustand 5.0, langdetect
**Storage**: PostgreSQL 15 (user.ui_language, project.language fields)
**Testing**: pytest (backend), Vitest (frontend)
**Target Platform**: Linux server (backend), Web browser (frontend)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: <100ms language switch, no page reload
**Constraints**: 2 languages initially (uk, en), Ukrainian default
**Scale/Scope**: 14 pages, ~200 UI strings, 3 AI agents with prompts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note:** Constitution file contains template placeholders. Applying general principles:

| Principle | Status | Notes |
|-----------|--------|-------|
| Library-First | ✅ PASS | Using established react-i18next library |
| Test-First | ✅ PASS | Tests planned for language switching |
| Simplicity | ✅ PASS | Namespace-based structure, no over-engineering |
| YAGNI | ✅ PASS | Only 2 languages, expand later as needed |

## Project Structure

### Documentation (this feature)

```text
specs/005-i18n/
├── plan.md              # This file
├── research.md          # Phase 0 output - i18n library research
├── data-model.md        # Phase 1 output - entity changes
├── quickstart.md        # Phase 1 output - implementation guide
├── contracts/           # Phase 1 output
│   ├── openapi-i18n.yaml    # API contract for language endpoints
│   └── typescript-i18n.ts   # TypeScript type definitions
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── user.py                 # Add ui_language field
│   │   └── project_config.py       # Add language field
│   ├── schemas/
│   │   └── users.py                # Add ui_language to response/update
│   ├── llm/
│   │   └── domain/models.py        # Add prompt_variants to AgentConfig
│   └── services/
│       └── knowledge/llm_agents.py # Use language-specific prompts
├── alembic/
│   └── versions/
│       └── xxx_add_i18n_fields.py  # Migration for language columns
└── tests/
    └── unit/
        └── test_i18n.py            # Language validation tests

frontend/
├── public/
│   └── locales/
│       ├── uk/
│       │   ├── common.json         # Shared UI strings
│       │   ├── dashboard.json
│       │   ├── messages.json
│       │   ├── atoms.json
│       │   ├── topics.json
│       │   ├── settings.json
│       │   └── errors.json
│       └── en/
│           └── [same structure]
├── src/
│   ├── i18n/
│   │   ├── config.ts               # i18next configuration
│   │   └── types.ts                # TypeScript module augmentation
│   ├── shared/
│   │   ├── store/
│   │   │   └── uiStore.ts          # Add language state
│   │   └── hooks/
│   │       └── useLanguage.ts      # Language hook
│   └── pages/
│       └── SettingsPage/
│           └── components/
│               └── GeneralTab.tsx  # Add language selector
└── tests/
    └── unit/
        └── i18n.test.ts            # Language switching tests
```

**Structure Decision**: Web application structure. Frontend owns UI localization; backend owns data persistence and AI prompt selection.

## Key Implementation Decisions

### 1. Frontend i18n Library: react-i18next

**Rationale:** Most mature (2.1M downloads), excellent TypeScript support, instant language switching, namespace-based lazy loading.

See: [research.md](./research.md#decision-1-frontend-i18n-library)

### 2. Translation File Structure: Namespace Pattern

**Rationale:** Feature-based namespaces allow lazy loading and easier maintenance.

```
public/locales/{lang}/{namespace}.json
```

### 3. Ukrainian Pluralization: 3 Forms

**Rationale:** Ukrainian has 3 plural forms (one/few/many) vs English 2.

```json
{
  "message_one": "1 повідомлення",
  "message_few": "{{count}} повідомлення",
  "message_many": "{{count}} повідомлень"
}
```

### 4. AI Prompts: Separate Native Variants

**Rationale:** Research shows 14% accuracy improvement with native language prompts vs English with language instruction.

```python
prompt_variants = {
    "uk": "Ви експерт з класифікації...",
    "en": "You are a classification expert..."
}
```

### 5. Language Persistence: Zustand + Backend Sync

**Rationale:** Instant UI update via Zustand localStorage, with debounced backend sync for cross-device persistence.

## Dependencies

### Frontend (npm)

```json
{
  "i18next": "^24.0.0",
  "react-i18next": "^15.0.0",
  "i18next-http-backend": "^3.0.0"
}
```

### Backend (pip)

```
langdetect>=1.0.9
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Missing translations | Fallback to key name + dev warning |
| AI generates wrong language | langdetect validation + retry with stronger prompt |
| Performance on language switch | Namespace lazy loading + memory cache |
| TypeScript key typos | Module augmentation for compile-time checking |

## Success Metrics

| Metric | Target |
|--------|--------|
| Language switch time | <100ms |
| Translation coverage | 100% UI elements |
| AI language accuracy | 95%+ correct language output |
| Persistence reliability | 100% survives refresh |

## Complexity Tracking

No constitution violations requiring justification.
