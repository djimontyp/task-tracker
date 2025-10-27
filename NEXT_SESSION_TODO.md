# Technical Debt TODO

**Updated:** 2025-10-27
**Focus:** Critical Refactorings & Code Quality

---

## 📊 Progress Summary

✅ **Week 1 Completed (2025-10-27):**
- Tasks 3-8 (Auto-fix imports, dead deps, dead files, tests, comments)
- Result: **-1,377-1,407 LOC** (3.4x over target), **-180 KB** bundle
- Commits: `f281a85`, `434ee5c`, `9ff1d2d`
- **Archived:** `.artifacts/completed/week-1-cleanup-report.md`

---

## 🔴 CRITICAL PRIORITY (Week 2 - 8 hours)

### 1. God File: tasks.py (1,348 LOC) - ROI: 95/100
**Problem:** Monolithic file with all background tasks
**Location:** `/backend/app/tasks.py`
**Effort:** 4 hours | **Impact:** Critical

**Actions:**
- [ ] Create `/backend/app/tasks/knowledge.py` (knowledge extraction tasks)
- [ ] Create `/backend/app/tasks/ingestion.py` (webhook ingestion tasks)
- [ ] Create `/backend/app/tasks/scoring.py` (importance scoring tasks)
- [ ] Create `/backend/app/tasks/__init__.py` (re-export all tasks)
- [ ] Delete `/backend/app/tasks.py`
- [ ] Update imports in TaskIQ broker setup

**Win:** Reduced single point of failure, better discoverability

---

### 2. Circular Dependency: api ↔ services - ROI: 95/100
**Problem:** Violates hexagonal architecture, complicates refactoring
**Location:** `/backend/app/api/v1/` ↔ `/backend/app/services/`
**Effort:** 3 hours | **Impact:** High

**Actions:**
- [ ] Create `/backend/app/api/v1/schemas/` for all request/response DTOs
- [ ] Move Pydantic schemas from services → api/v1/schemas/
- [ ] Update imports in 26 API endpoint files
- [ ] Run `just typecheck` to verify

**Win:** Clean layering, safe refactoring

---

## 🟡 MEDIUM PRIORITY (Weeks 3-4 - 25 hours)

### 9. BaseCRUD Class (DRY for 9 services) - ROI: 60/100
**Effort:** 8 hours | **Impact:** High

**Problem:** 9 CRUD services with duplication (~800 LOC)
- agent_crud, task_crud, project_service, provider_crud, atom_crud
- topic_crud, assignment_crud, proposal_service, analysis_service

**Actions:**
- [ ] Create `/backend/app/services/base_crud.py`:
  ```python
  class BaseCRUD[T: SQLModel]:
      async def create(self, *, data: CreateSchema) -> T
      async def get(self, *, id: int) -> T | None
      async def update(self, *, id: int, data: UpdateSchema) -> T
      async def delete(self, *, id: int) -> bool
      async def list(self, *, skip: int, limit: int) -> list[T]
  ```
- [ ] Refactor 9 services → extend BaseCRUD
- [ ] Run `just test` to verify

**Win:** -800 LOC duplication, standardized patterns

---

### 10. Split Oversized Services (3 files) - ROI: 80/100
**Effort:** 12 hours | **Impact:** High

**analysis_service.py (780 LOC):**
- [ ] Create `analysis_validator.py` (AnalysisRunValidator class)
- [ ] Create `analysis_crud.py` (CRUD operations)
- [ ] Create `analysis_executor.py` (execute_analysis_run logic)
- [ ] Update imports in 4 API files

**knowledge_extraction_service.py (675 LOC):**
- [ ] Create `llm_agents.py` (Pydantic AI agent definitions)
- [ ] Create `knowledge_orchestrator.py` (high-level orchestration)
- [ ] Keep schemas in separate file

**versioning_service.py (653 LOC):**
- [ ] Create `topic_versioning.py`
- [ ] Create `atom_versioning.py`
- [ ] Create `diff_service.py`

**Win:** Easier testing, clear responsibilities

---

### 11. Replace print → logger (50 statements) - ROI: 70/100
**Effort:** 1 hour | **Impact:** Medium

**Files (top 5):**
- [ ] `importance_scorer.py` (3 print statements)
- [ ] `tasks.py` (5 print statements)
- [ ] `llm_service.py` (2 print statements)
- [ ] +11 more files

**Actions:**
- [ ] Replace `print(...)` → `logger.debug(...)` or `logger.info(...)`
- [ ] Ensure logger is imported: `from app.core.logging import logger`

**Win:** Production-ready logging, no console pollution

---

### 12. Consolidate Toast Libraries - ROI: 75/100
**Effort:** 30 minutes | **Impact:** Medium

**Problem:** 2 toast libraries installed
- `sonner` (v2.0.7) - 23 files use it
- `react-hot-toast` (v2.6.0) - 17 files use it

**Actions:**
- [ ] Keep: `sonner` (more popular in project)
- [ ] Migrate 17 files: `toast.success()` → `toast.success()`
- [ ] Remove `react-hot-toast` from package.json
- [ ] Remove imports: `import toast from 'react-hot-toast'`

**Win:** Consistency, -1 dependency

---

### 13. Organize Models by Domains - ROI: 65/100
**Effort:** 4 hours | **Impact:** Medium

**Problem:** 25 models in flat `/backend/app/models/` directory

**Actions:**
- [ ] Create domain directories:
  - `/backend/app/models/analysis/` (agent, provider, task, run, proposal)
  - `/backend/app/models/knowledge/` (topic, atom, message, relationship)
  - `/backend/app/models/automation/` (automation_rule, approval_rule, scheduled_job)
  - `/backend/app/models/notifications/` (notification_preference)
  - `/backend/app/models/core/` (user, project, assignment)
- [ ] Move 25 model files
- [ ] Update `/backend/app/models/__init__.py` (barrel exports)
- [ ] Update imports across codebase (~100 files)
- [ ] Run `just typecheck`

**Win:** Clear domain boundaries, easier navigation

---

## 🟢 LOW PRIORITY (Backlog - 7.5 hours)

### 14. Remove Relative Imports (14 occurrences)
**Effort:** 30 minutes | **Impact:** Low

**Violation:** CLAUDE.md explicitly forbids relative imports

**Actions:**
- [ ] Find: `from ..` and `from .`
- [ ] Replace with absolute: `from app.models import ...`
- [ ] Run `just fmt` to verify

---

### 15. Audit legacy.py (184 LOC) - ROI: 70/100
**Effort:** 6 hours | **Impact:** Medium

**Problem:** Legacy models (Source, TaskEntity) imported in 14 files

**Actions:**
- [ ] Grep usage: `rg "from app.models.legacy import"`
- [ ] Determine if these models are actively used
- [ ] If yes → migrate to new models
- [ ] If no → delete legacy.py + 14 import sites

**Win:** -184 LOC technical debt

---

### 16. Archive Root Documentation (7 files) - ROI: 65/100
**Effort:** 1 hour | **Impact:** Low

**Problem:** 7 markdown files in project root

**Actions:**
- [ ] Keep: `README.md`, `CLAUDE.md`, `LICENSE`
- [ ] Move to `.artifacts/`:
  - `front.md`
  - `INDEX.md`
  - `CONTRAST_AUDIT_REPORT.md`
  - `DOCUMENTATION_MAINTENANCE.md`
  - `BATCH_*` files

**Win:** Clean project root

---

## 🗓️ Recommended Sequence

### **Week 2: Critical Refactorings** (8 hours)
**Priority:** 🔴 High

**Day 1-2:**
- [ ] Split tasks.py into modules (4 hours)

**Day 3-4:**
- [ ] Fix circular api↔services dependency (3 hours)

**Day 5:**
- [ ] Archive root documentation (1 hour)

**Result:** Architectural integrity restored

---

### **Weeks 3-4: Large Refactorings** (20 hours)
**Priority:** 🟡 Medium

**Week 3:**
- [ ] Create BaseCRUD class (8 hours)

**Week 4:**
- [ ] Split 3 large services (12 hours)

**Result:** -800 LOC duplication, better testability

---

### **Backlog** (when there's time)
**Priority:** 🟢 Low

- [ ] Organize models by domains (4h)
- [ ] Audit and remove legacy.py (6h)
- [ ] Remove relative imports (30min)
- [ ] Consolidate toast libraries (30min)
- [ ] Replace 50 print → logger (1h)
- [ ] Modernize 22 Pydantic v1 configs
- [ ] Review 133 type ignore comments

---

## 📊 Expected Wins

✅ **Reduced cognitive load:** 20-30% (cleaner architecture)
✅ **Faster onboarding:** 2x (clear structure)
✅ **Fewer merge conflicts:** 1.5x (modular architecture vs god files)
✅ **Easier test coverage:** 2x (BaseCRUD standardized patterns)
✅ **Cleaner git history:** All features committed
✅ **Faster CI/CD:** 10-15% (fewer dependencies, less code)

---

**Total Estimated Time:** 33 hours (spread over 3-4 weeks)
**Next Session Priority:** Week 2 Critical Refactorings (tasks.py, circular deps)
