# Session: Backend Code Quality

**Status**: 📅 Planned
**Created**: 2025-10-31
**Last Updated**: 2025-10-31
**Estimated**: 20-25h
**Priority**: 🟡 Medium

## Context

| What | State |
|------|-------|
| Goal | Reduce code duplication, improve maintainability |
| Approach | Refactor services, consolidate patterns, fix tests |
| Progress | 0/10 tasks |
| Next | Create BaseCRUD class |
| Blocker | None (can run parallel to UX sprints) |

## Tasks

### Service Refactoring (20h)
- [ ] Create BaseCRUD class - 8h
  - **Problem**: 9 CRUD services with duplication (~800 LOC)
  - **Solution**: Generic `BaseCRUD[T]` class with type parameters
  - **Impact**: -800 LOC, standardized patterns, easier testing
  - **Files**:
    - `backend/app/crud/base_crud.py` (new)
    - Refactor: `atom_crud.py`, `topic_crud.py`, `message_crud.py`, `agent_crud.py`, `provider_crud.py`, `analysis_run_crud.py`, `proposal_crud.py`, `classification_crud.py`, `topic_relationship_crud.py`
  - **Approach**:
    1. Design generic base class with CRUD operations
    2. Migrate simplest service first (atom_crud)
    3. Gradually migrate remaining 8 services
    4. Update tests

- [ ] Split analysis_service.py - 5h
  - **Problem**: 780 LOC monolithic service with multiple concerns
  - **Solution**: Split into focused modules
  - **Files**:
    - `backend/app/services/analysis/analysis_validator.py` (validation logic)
    - `backend/app/services/analysis/analysis_crud.py` (CRUD operations)
    - `backend/app/services/analysis/analysis_executor.py` (execution logic)
  - **Impact**: Better testability, clearer responsibilities

- [ ] Split knowledge_extraction_service.py - 4h
  - **Problem**: 675 LOC monolithic service
  - **Solution**: Separate LLM agents from orchestration
  - **Files**:
    - `backend/app/services/knowledge/llm_agents.py` (agent definitions)
    - `backend/app/services/knowledge/knowledge_orchestrator.py` (workflow)
  - **Impact**: -675 LOC in single file, clearer separation

- [ ] Split versioning_service.py - 3h
  - **Problem**: 653 LOC with multiple concerns (topics, atoms, diffs)
  - **Solution**: Split by entity type
  - **Files**:
    - `backend/app/services/versioning/topic_versioning.py`
    - `backend/app/services/versioning/atom_versioning.py`
    - `backend/app/services/versioning/diff_service.py`
  - **Impact**: Clearer boundaries, easier to maintain

### Code Quality (5h)
- [ ] Replace print → logger - 1h
  - **Problem**: 50 print statements in codebase
  - **Solution**: Replace with `logger.debug()` or `logger.info()`
  - **Files**: `importance_scorer.py`, `tasks.py`, `llm_service.py`, +11 more
  - **Impact**: Proper logging, easier debugging in production

- [ ] Consolidate toast libraries - 0.5h
  - **Problem**: Both `sonner` and `react-hot-toast` imported
    - 17 files use `react-hot-toast`
    - 23 files use `sonner`
  - **Solution**: Migrate to `sonner` (already majority), remove `react-hot-toast`
  - **Files**: 17 frontend components
  - **Impact**: -1 dependency, consistent UX

- [ ] Organize models by domains - 4h
  - **Problem**: 25 models in flat `/backend/app/models/` directory
  - **Solution**: Create domain subdirectories
  - **Structure**:
    ```
    models/
    ├── analysis/      # AnalysisRun, AnalysisProposal, Agent, Provider
    ├── knowledge/     # Topic, Atom, TopicVersion, AtomVersion
    ├── automation/    # Classification, TaskEntity
    ├── core/          # TelegramMessage, User, ImportSource
    └── legacy/        # Deprecated models
    ```
  - **Impact**: Clear domain boundaries, easier navigation

- [ ] Remove relative imports - 0.5h
  - **Problem**: 14 occurrences of `from ..` or `from .`
  - **Solution**: Replace with absolute imports `from app.models import ...`
  - **Files**: Various backend files
  - **Impact**: Clearer import paths, easier refactoring

- [ ] Audit legacy.py - 6h
  - **Problem**: Legacy models (Source, TaskEntity) still in 14 files
  - **Solution**: Determine usage, migrate to new models or delete
  - **Files**: `backend/app/models/legacy.py` + 14 dependents
  - **Impact**: -184 LOC technical debt if unused
  - **Approach**:
    1. Find all usage of legacy models
    2. Determine if still needed
    3. Migrate consumers to new models OR
    4. Delete if unused

## Next Actions

1. **Start with BaseCRUD** (8h)
   - Design generic base class
   - Migrate atom_crud.py first (simplest)
   - Measure LOC reduction

2. **Split large services** (12h total)
   - analysis_service.py → 3 files
   - knowledge_extraction_service.py → 2 files
   - versioning_service.py → 3 files

3. **Quick wins** (2h)
   - Replace print statements
   - Consolidate toast libraries
   - Remove relative imports

## Success Criteria

- ✅ BaseCRUD class created, 9 services migrated
- ✅ 3 monolithic services split into focused modules
- ✅ Zero print statements (all logging via logger)
- ✅ Single toast library (sonner)
- ✅ Models organized by domain
- ✅ Zero relative imports
- ✅ Type checking passes (`just typecheck`)

## Completion Target

**Estimated completion**: 20-25 hours
**Blocking dependencies**: None
**Can be parallelized**: Yes (can run alongside UX sprints)

## Impact Metrics

- **LOC reduction**: ~800 (BaseCRUD) + ~300 (consolidation) = -1100 LOC
- **File organization**: 25 flat models → 5 domain dirs
- **Code quality**: 50 print → 0 print, 14 relative imports → 0
- **Maintainability**: 3 monolithic services → 8 focused modules

---

*Migrated from NEXT_SESSION_TODO.md on 2025-10-31*
