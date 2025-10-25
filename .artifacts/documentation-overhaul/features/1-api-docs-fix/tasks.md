# Feature 1: API Documentation Fix

## Goal

Fix critical API documentation discrepancies identified in audit (40% accuracy → 95%+)

## Audit Context

**Source:** `docs/audit-2025-10-24/API_AUDIT_EXECUTIVE_SUMMARY.md`

**Critical Issues:**
1. Parameter name change: `provider_id` → `agent_config_id` (BREAKING)
2. Missing period-based message selection feature
3. Wrong WebSocket endpoint structure
4. Missing `knowledge.version_created` event
5. Incomplete error handling documentation
6. All 6 code examples non-functional

## Tasks

### 1. Update Knowledge Extraction API Parameters
**Domain:** API Documentation
**Estimate:** 1.5 hours
**Files:**
- `docs/content/en/api/knowledge.md`
- `docs/content/uk/api/knowledge.md`

**Changes:**
- Replace all `provider_id` references with `agent_config_id`
- Update request/response schemas
- Fix error handling (422 → 400 for inactive config)
- Update entity references (Provider → AgentConfig)

**Acceptance:** All parameter names match backend implementation

---

### 2. Document Period-Based Message Selection
**Domain:** API Documentation
**Estimate:** 2 hours
**Files:**
- `docs/content/en/api/knowledge.md`
- `docs/content/uk/api/knowledge.md`

**Add:**
- Period-based extraction feature (last_24h, last_7d, last_30d)
- Custom date range parameters
- Optional topic_id filtering
- Timezone support documentation

**Acceptance:** Users can discover and use time-based message selection

---

### 3. Fix WebSocket Endpoint Documentation
**Domain:** API Documentation
**Estimate:** 1 hour
**Files:**
- `docs/content/en/api/knowledge.md`
- `docs/content/uk/api/knowledge.md`

**Changes:**
- Correct endpoint: `/ws/knowledge` → `/ws?topics=knowledge`
- Document subscription mechanism
- Explain topic-based WebSocket routing

**Acceptance:** WebSocket examples connect successfully

---

### 4. Document WebSocket Events
**Domain:** API Documentation
**Estimate:** 1.5 hours
**Files:**
- `docs/content/en/api/knowledge.md`
- `docs/content/uk/api/knowledge.md`

**Add:**
- `knowledge.version_created` event
- `topic_versions_created` field in completion event
- `atom_versions_created` field in completion event
- Event payload schemas

**Acceptance:** All WebSocket events documented

---

### 5. Update Code Examples
**Domain:** API Documentation
**Estimate:** 2 hours
**Files:**
- `docs/content/en/api/knowledge.md`
- `docs/content/uk/api/knowledge.md`

**Fix:**
- TypeScript/React example (WebSocket endpoint)
- Python example (parameter name)
- cURL examples (all parameters)
- Test all examples for functionality

**Acceptance:** All 6 documented examples are functional

---

### 6. Add Related CRUD Endpoints Reference
**Domain:** API Documentation
**Estimate:** 1 hour
**Files:**
- `docs/content/en/api/knowledge.md`
- `docs/content/uk/api/knowledge.md`

**Add:**
- Reference to Topics API (9+ endpoints)
- Reference to Atoms API (16+ endpoints)
- Cross-links for related operations

**Acceptance:** Users can discover related CRUD operations

---

## Execution Order

**Phase 1: Core Fixes (Sequential)**
- Task 1: Update parameters (foundation)
- Task 2: Document period-based selection

**Phase 2: WebSocket (Sequential)**
- Task 3: Fix WebSocket endpoint
- Task 4: Document WebSocket events

**Phase 3: Examples & Integration (Parallel)**
- Task 5: Update code examples
- Task 6: Add CRUD references

## Total Estimate

6-8 hours

## Dependencies

- Backend code as source of truth: `backend/app/api/v1/knowledge.py`
- WebSocket implementation: `backend/app/ws/router.py`
- Tasks implementation: `backend/app/tasks.py`

## Success Criteria

1. Parameter naming matches backend implementation
2. All features discoverable in documentation
3. WebSocket examples connect successfully
4. All 6 code examples functional
5. Error handling documented accurately
6. Related CRUD endpoints referenced
7. Both en/uk versions synchronized

## Format Requirements

- Hybrid: tables + diagrams (NO code examples in main docs)
- Concise, no fluff
- En/uk synchronized (full translation)
