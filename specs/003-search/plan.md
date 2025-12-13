# Implementation Plan: Keyword Search

**Branch**: `003-search` | **Date**: 2025-12-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-search/spec.md`

## Summary

Implement keyword-based search across Messages and Atoms using PostgreSQL Full-Text Search (FTS). Users can search from any dashboard page via the header search bar. Results appear in an **inline dropdown/popover** (no page navigation required), grouped by type (Messages, Atoms) with highlighted matches and relevance ranking.

**Key insight**: Backend already has FTS for Topics+Messages (`/api/v1/search`). Need to extend for Atoms and modify frontend to show dropdown instead of navigating to `/search` page.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.9.3 (frontend)
**Primary Dependencies**: FastAPI 0.117.1, SQLModel 0.0.24, React 18.3.1, TanStack Query 5.90, shadcn/ui
**Storage**: PostgreSQL 15 with `to_tsvector`/`to_tsquery` for FTS
**Testing**: pytest (backend), Vitest + Playwright (frontend)
**Target Platform**: Web (Docker/Nginx), browsers 375px+
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Search results <500ms (spec SC-002)
**Constraints**: Debounce 300ms, max 256 chars query, 5 results per group in dropdown
**Scale/Scope**: MVP single-project, future multi-user

## Constitution Check

*GATE: Constitution is a template placeholder — no project-specific gates defined.*

✅ No violations detected. Project follows existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/003-search/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/v1/
│   │   └── search.py           # MODIFY: Add Atoms to FTS
│   └── models/
│       ├── message.py          # EXISTS: content field for search
│       └── atom.py             # EXISTS: title + content for search
└── tests/
    └── api/
        └── test_search.py      # ADD: FTS tests for Atoms

frontend/
├── src/
│   ├── features/search/
│   │   ├── api/searchService.ts     # MODIFY: Add FTS endpoint
│   │   ├── components/
│   │   │   ├── SearchBar.tsx        # MODIFY: Add dropdown
│   │   │   ├── SearchDropdown.tsx   # ADD: Results popover
│   │   │   └── SearchResultItem.tsx # ADD: Result row component
│   │   └── types/index.ts           # MODIFY: FTS types
│   └── pages/SearchPage/            # KEEP: Full results page
└── tests/
    └── features/search/
        └── SearchBar.test.tsx       # MODIFY: Dropdown tests
```

**Structure Decision**: Web application with backend/frontend separation. Extends existing search feature module.

## Complexity Tracking

No violations — feature uses existing patterns (FTS, shadcn Popover, TanStack Query).
