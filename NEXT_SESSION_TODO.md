# Technical Debt TODO

**Updated:** 2025-10-28
**Focus:** Critical Refactorings & Code Quality

---

## 📊 Progress Summary

✅ **Week 1 Completed (2025-10-27):**
- Tasks 3-8 (Auto-fix imports, dead deps, dead files, tests, comments)
- Result: **-1,377-1,407 LOC** (3.4x over target), **-180 KB** bundle
- Commits: `f281a85`, `434ee5c`, `9ff1d2d`
- **Archived:** `.artifacts/completed/week-1-cleanup-report.md`

✅ **Week 2 Task 3 Completed (2025-10-27):**
- Background Task Monitoring System (6 hours)
- Result: Fully functional monitoring dashboard with polling updates
- Phases: UX Design → Specification → Backend Implementation → Frontend Dashboard

✅ **Feature 3: Business Logic Consistency Completed (2025-10-28):**
- **Duration:** 18 hours (4 agents: 2x llm-ml-engineer, documentation-expert, fastapi-backend-expert)
- **Deliverables:**
  1. AI Infrastructure Analysis (15000+ words, 2 comprehensive reports)
     - Knowledge Extraction + Embeddings + Topics/Atoms (15 problems found)
     - Message Scoring + Analysis System + Auto-Task Chain (5 critical issues)
  2. Unified AI Documentation (`docs/content/uk/architecture/ai-infrastructure.md`, 1284 lines, українською)
  3. Config Refactoring (`backend/app/config/ai_config.py`, 23 magic numbers → typed config)
- **Key Findings:**
  - 🔴 3 Critical: LLM timeout fallback, validation framework, retry mechanism
  - ⚠️ 6 High: Cost tracking, noise filtering, checkpointing
  - 💰 ROI: **$1200/month savings** (80% LLM cost reduction potential)
  - Production Readiness Score: **6/10**
- **Location:** `.artifacts/ai-infrastructure-analysis.md`, `.artifacts/product-ready-epic/batch-1.2-ai-infrastructure-analysis.md`

---

---

## 🚨 IMMEDIATE NEXT SESSION (Feature 3 Critical Fixes - 5-6h)

**Context:** Feature 3 AI аналіз виявив критичні production blockers

### 0. Validation Framework for Message Scoring - ROI: 100/100
**Problem:** Scoring accuracy unknown (no ground truth, no metrics)
**Location:** `/backend/app/services/importance_scorer.py`
**Effort:** 3-4 hours | **Impact:** CRITICAL (prevent false negatives)

**Actions:**
- [ ] Create ground truth dataset: 100 messages manually labeled (noise/weak_signal/signal)
- [ ] Implement `ScoringValidator` class:
  ```python
  # backend/app/services/scoring_validator.py
  class ScoringValidator:
      async def validate(self, ground_truth_dataset):
          # Calculate precision, recall, F1-score
          # Return metrics + confusion matrix
  ```
- [ ] Run validation → tune thresholds (0.3/0.7) based on F1-score
- [ ] Add monitoring dashboard for false positive/negative rate

**Win:** Data-driven thresholds, measure actual accuracy (target: 85% F1-score)

---

### 0.1 Retry Mechanism with Exponential Backoff - ROI: 100/100
**Problem:** Tasks fail permanently on transient errors (no retry, no DLQ)
**Location:** `/backend/app/tasks.py`
**Effort:** 2 hours | **Impact:** CRITICAL (prevent message loss)

**Actions:**
- [ ] Add `tenacity` dependency: `uv add tenacity`
- [ ] Wrap critical tasks with retry decorator:
  ```python
  from tenacity import retry, stop_after_attempt, wait_exponential

  @retry(
      stop=stop_after_attempt(3),
      wait=wait_exponential(multiplier=2, min=4, max=60),
      retry=retry_if_exception_type((NetworkError, TimeoutError))
  )
  @nats_broker.task
  async def score_message_task(message_id: int):
      ...
  ```
- [ ] Add DLQ for permanent failures
- [ ] Test with simulated NATS failure

**Win:** Resilience, prevent 1% failure rate = 300 lost messages/month

---

## 🔴 CRITICAL PRIORITY (Week 2 - 7 hours remaining)

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

### **IMMEDIATE (Feature 3 Critical Fixes)** (5-6 hours)
**Priority:** 🚨 URGENT - Production Blockers

**Next Session Start Here:**
- [ ] Validation framework for scoring (3-4h) - Task 0
- [ ] Retry mechanism + exponential backoff (2h) - Task 0.1

**Why First:**
- Prevent critical bugs from being missed (false negatives)
- Prevent permanent message loss (transient errors)
- Data from Feature 3 analysis shows 6/10 production readiness

**Result:** Production-ready AI infrastructure, validated thresholds

---

### **Week 2: Critical Refactorings** (7 hours remaining after Feature 3 fixes)
**Priority:** 🔴 High

**Day 1-2:**
- [ ] Split tasks.py into modules (4 hours)

**Day 3:**
- [ ] Fix circular api↔services dependency (3 hours)

**Completed:**
- [x] Background Task Monitoring System (6 hours) ✅
  - UX design → specification → backend → frontend
- [x] Feature 3: Business Logic Consistency (18 hours) ✅
  - AI infrastructure analysis + documentation + config refactoring

**Result:** Architectural integrity + operational visibility + validated AI system

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

## 📋 Session Restore Context

**Якщо втратив context, почни тут:**

1. **Прочитай Feature 3 результати:**
   - Executive Summary: `.artifacts/product-ready-epic/ANALYSIS-SUMMARY.md`
   - Повний звіт 1: `.artifacts/ai-infrastructure-analysis.md` (Knowledge Extraction + Embeddings)
   - Повний звіт 2: `.artifacts/product-ready-epic/batch-1.2-ai-infrastructure-analysis.md` (Scoring + Analysis)
   - Unified docs: `docs/content/uk/architecture/ai-infrastructure.md`

2. **Критичні проблеми (need immediate fix):**
   - NO validation dataset → can't measure scoring accuracy
   - NO retry mechanism → transient errors = permanent failures
   - Cost waste: $1500/month (можна $300/month з filtering)

3. **Config вже готово:**
   - `backend/app/config/ai_config.py` (23 magic numbers extracted)
   - All services updated to use typed config

4. **Наступний крок:** Implement Task 0 + Task 0.1 (validation + retry)

---

**Total Estimated Time:** 38-39 hours remaining (5-6h urgent + 33h planned)
**Next Session Priority:** 🚨 Feature 3 Critical Fixes (validation + retry) THEN Week 2 Refactorings
