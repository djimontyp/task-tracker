# Gap Analysis: PRD vs Current Implementation

> **Date:** 2025-12-12
> **PRD:** `docs/product/PRD-FULL-VISION.md`
> **Status:** Initial Analysis

---

## Summary

| Category | Total Items | Done | Partial | Missing |
|----------|-------------|------|---------|---------|
| Data Models | 8 | 7 | 1 | 0 |
| Backend Services | 12 | 10 | 1 | 1 |
| API Endpoints | 10 | 8 | 1 | 1 |
| Frontend Pages | 8 | 6 | 2 | 0 |
| Frontend Features | 10 | 4 | 3 | 3 |

**Overall: ~70% infrastructure exists, ~30% needs work**

---

## LEGEND

- **DONE** — Implemented and working
- **PARTIAL** — Code exists but incomplete/not connected
- **MISSING** — Not implemented
- **MOCK** — Uses mock data, real API not connected

---

## 1. DATA MODELS

| Feature | PRD Requirement | Status | Location | Notes |
|---------|-----------------|--------|----------|-------|
| **Atoms** | 7 types + versioning | DONE | `models/atom.py` | problem, solution, decision, question, insight, pattern, requirement |
| **Atom Links** | Typed relationships | DONE | `models/atom.py` | continues, solves, contradicts, supports, refines, relates_to, depends_on |
| **Topics** | With versioning | DONE | `models/topic.py` | name, description, icon, color, embedding |
| **Messages** | With scoring | DONE | `models/message.py` | importance_score, classification |
| **Projects** | With glossary | DONE | `models/project_config.py` | keywords, glossary, components |
| **Users** | Roles | DONE | `models/user.py` | Basic user model |
| **Versioning** | History, audit | DONE | `models/atom_version.py`, `topic_version.py` | Full version history |
| **Notifications** | In-app | MISSING | - | Table removed: `remove_notification_preferences_table.py` |

---

## 2. BACKEND SERVICES

| Feature | PRD Requirement | Status | Location | Notes |
|---------|-----------------|--------|----------|-------|
| **Knowledge Extraction** | AI extraction | DONE | `services/knowledge/knowledge_orchestrator.py` | 22KB, full pipeline |
| **Versioning** | History, rollback | DONE | `services/versioning_service.py` | 23KB, comprehensive |
| **Embeddings** | Vector generation | DONE | `services/embedding_service.py` | 19KB, OpenAI integration |
| **Semantic Search** | pgvector | DONE | `services/semantic_search_service.py` | 16KB |
| **RAG Context** | Context building | DONE | `services/rag_context_builder.py` | 14KB |
| **Importance Scoring** | 4-factor scoring | DONE | `services/importance_scorer.py` | 10KB |
| **WebSocket** | Real-time | DONE | `services/websocket_manager.py` | 20KB |
| **Telegram Ingestion** | Webhook | DONE | `services/telegram_ingestion_service.py` | 7KB |
| **Automation Rules** | Rule engine | DONE | `services/rule_engine_service.py` | 10KB |
| **Scheduler** | Scheduled jobs | DONE | `services/scheduler_service.py` | 12KB |
| **Dashboard Metrics API** | Aggregated data | PARTIAL | - | Endpoints may not exist |
| **Notifications Service** | In-app notifications | MISSING | - | Not implemented |

---

## 3. API ENDPOINTS

| Feature | PRD Requirement | Status | File | Notes |
|---------|-----------------|--------|------|-------|
| **Atoms CRUD** | Full CRUD + bulk | DONE | `api/v1/atoms.py` | Includes bulk approve/archive |
| **Topics CRUD** | Full CRUD | DONE | `api/v1/topics.py` | |
| **Messages** | List, filter | DONE | `api/v1/messages.py` | |
| **Projects** | CRUD + glossary | DONE | `api/v1/projects.py` | |
| **Providers** | LLM management | DONE | `api/v1/providers.py` | |
| **Knowledge** | Extraction | DONE | `api/v1/knowledge.py` | |
| **Search** | Keyword + semantic | DONE | `api/v1/search.py`, `semantic_search.py` | |
| **Versions** | History | DONE | `api/v1/versions.py` | |
| **Dashboard Metrics** | Aggregated stats | PARTIAL | `api/v1/stats.py`? | Frontend uses MOCK data |
| **Notifications** | CRUD | MISSING | - | Not implemented |

---

## 4. FRONTEND PAGES

| Page | PRD Requirement | Status | Location | Notes |
|------|-----------------|--------|----------|-------|
| **Dashboard** | Metrics, trends, insights | PARTIAL | `pages/DashboardPage/` | **MOCK DATA** — `USE_MOCK_DATA = true` |
| **Messages** | List, filter | DONE | `pages/MessagesPage/` | |
| **Topics** | List, detail | DONE | `pages/TopicsPage/` | |
| **Settings** | Configuration | DONE | `pages/SettingsPage/` | |
| **Projects** | CRUD | DONE | `pages/ProjectsPage/` | |
| **Search** | Search page | DONE | `pages/SearchPage/` | |
| **Onboarding** | Wizard | PARTIAL | `features/onboarding/` | Exists but needs review |
| **Notifications** | List | MISSING | - | Not implemented |

---

## 5. FRONTEND FEATURES (PRD-specific)

| Feature | PRD Requirement | Status | Notes |
|---------|-----------------|--------|-------|
| **Period Selector** | Dropdown (day/week/month) | MISSING | Types exist but no UI selector on dashboard |
| **Project Switcher** | Switch between projects | MISSING | No UI for project switching |
| **Batch Approval UI** | Quick approve (1-3 min) | PARTIAL | Bulk approve exists in atoms, but not optimized UX |
| **Notifications UI** | In-app with read/archive | MISSING | Not implemented |
| **Glossary Editor** | Per-project glossary | PARTIAL | Field exists in ProjectConfig, UI unclear |
| **Onboarding Wizard** | 4-step wizard | PARTIAL | Exists, needs validation against PRD |
| **Dashboard Real API** | Connect to backend | MISSING | Currently mock data |
| **Orphan Atoms View** | Show unlinked atoms | MISSING | Not implemented |
| **Backlinks UI** | Show who references atom | MISSING | Not implemented |
| **Graph/Links View** | Visualize connections | MISSING | Lists only, no graph |

---

## 6. CRITICAL GAPS (Priority P1)

### 6.1 Dashboard Mock Data

**Problem:** `USE_MOCK_DATA = true` in `useDashboardData.ts`

**Impact:** Dashboard shows fake data, not real system state

**Fix Required:**
1. Verify/create backend endpoints for metrics, trends, insights, topics
2. Switch `USE_MOCK_DATA = false`
3. Test with real data

### 6.2 Period Selector Missing

**Problem:** PRD says "dropdown для day/week/month", but dashboard hardcoded to 'today'

**Impact:** Users can't change time period

**Fix Required:**
1. Add dropdown component to dashboard header
2. Wire to `useDashboardData(period)`

### 6.3 Project Switcher Missing

**Problem:** PRD says "перемикач проекту", but no UI exists

**Impact:** Multi-project not usable

**Fix Required:**
1. Add project selector to navbar/header
2. Filter all data by selected project

### 6.4 Notifications Not Implemented

**Problem:** PRD says "in-app notifications for batch ready"

**Impact:** Users won't know when to approve

**Fix Required:**
1. Create notifications model
2. Create notifications service
3. Create notifications API
4. Create notifications UI

---

## 7. MEDIUM GAPS (Priority P2)

### 7.1 Batch Approval UX

**Problem:** Bulk approve exists but may not match PRD (1-3 min target)

**Needs Review:**
- How many clicks to approve batch?
- Can user see source messages quickly?
- Is there swipe/checkbox option?

### 7.2 Onboarding Wizard

**Problem:** Exists but may not match PRD flow

**Needs Review:**
- Does it have 4 steps (Basics, Sources, Glossary, Done)?
- Is glossary optional?
- Is re-onboarding available from settings?

### 7.3 Glossary Editor

**Problem:** Field exists in model, but UI for editing unclear

**Needs Review:**
- Can user add/edit glossary terms?
- Does AI suggest new terms?

---

## 8. LOWER GAPS (Priority P3)

| Gap | PRD Says | Status |
|-----|----------|--------|
| Orphan atoms view | Show unlinked, suggestions to link | MISSING |
| Backlinks UI | "Who references this atom" | MISSING |
| Transclusion | Atom embeds another | MISSING (model?) |
| Graph visualization | Visual graph view | MISSING (low priority per PRD) |
| A/B test approval UI | Checkboxes vs swipe | MISSING |

---

## 9. WHAT'S ALREADY GOOD

| Area | Status | Notes |
|------|--------|-------|
| **Data Models** | Excellent | All core models with versioning |
| **Knowledge Pipeline** | Excellent | Full extraction with RAG |
| **Versioning** | Excellent | Comprehensive service |
| **Search** | Good | Keyword + semantic |
| **WebSocket** | Good | Real-time infrastructure |
| **UI Components** | Good | 33 shadcn components |
| **Storybook** | Good | Component documentation |

---

## 10. RECOMMENDED NEXT STEPS

### Phase 1: Dashboard Working (1-2 days)

1. [ ] Verify/create dashboard API endpoints
2. [ ] Switch `USE_MOCK_DATA = false`
3. [ ] Add period selector dropdown
4. [ ] Test with real data

### Phase 2: Multi-Project (1 day)

1. [ ] Add project switcher to navbar
2. [ ] Filter all queries by project_id

### Phase 3: Notifications (2-3 days)

1. [ ] Create notification model
2. [ ] Create notification service (on batch ready)
3. [ ] Create notification API
4. [ ] Create notification UI (badge + list)

### Phase 4: Approval UX Review (1 day)

1. [ ] Test current batch approval flow
2. [ ] Measure clicks/time to approve
3. [ ] Improve if >3 min

---

## APPENDIX: Files Reviewed

**Backend:**
- `backend/app/models/*.py` (22 files)
- `backend/app/services/*.py` (36 files)
- `backend/app/api/v1/*.py` (26 files)

**Frontend:**
- `frontend/src/pages/` (18 directories)
- `frontend/src/features/` (14 modules)
- `frontend/src/pages/DashboardPage/` (13 files)

---

*Document generated: 2025-12-12*
