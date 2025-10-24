# Implementation Checklist: Knowledge Proposal System

**Created:** October 23, 2025
**Status:** Ready for Execution
**Total Estimated Hours:** 240-280 hours (6 weeks, 2 engineers)
**Critical Path Duration:** 160 hours (4 weeks minimum)

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Phase 0: Database Foundation](#phase-0-database-foundation)
3. [Phase 1: Service Layer Refactor](#phase-1-service-layer-refactor)
4. [Phase 2: Review Workflow API](#phase-2-review-workflow-api)
5. [Phase 3: Duplicate Detection](#phase-3-duplicate-detection)
6. [Phase 4: Frontend Review UI](#phase-4-frontend-review-ui)
7. [Phase 5: Automation & Polish](#phase-5-automation--polish)
8. [Critical Path Analysis](#critical-path-analysis)
9. [Team Assignments](#team-assignments)
10. [Success Criteria by Phase](#success-criteria-by-phase)
11. [Review Checkpoints](#review-checkpoints)

---

## Quick Reference

### Phase Timeline
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   Week 1    │   Week 2    │   Week 3    │   Week 4    │   Week 5    │   Week 6    │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│   Phase 0   │   Phase 1   │   Phase 2   │   Phase 3   │   Phase 4   │   Phase 5   │
│  Database   │  Services   │     API     │  Duplicate  │  Frontend   │ Automation  │
│ Foundation  │   Refactor  │  Workflow   │  Detection  │   Review    │  & Polish   │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### Dependency Graph
```
Phase 0 ──► Phase 1 ──► Phase 2 ──┬──► Phase 4 ──► Phase 5
                │                   │
                └──────► Phase 3 ──┘
```

### Total Effort by Role
- **Backend:** 160 hours (Phases 0-3, 5)
- **Frontend:** 60 hours (Phase 4)
- **DevOps:** 20 hours (All phases)
- **Testing/QA:** 40 hours (All phases)

---

## Phase 0: Database Foundation

**Duration:** Week 1 (40 hours)
**Team:** Backend Lead + DevOps
**Critical Path:** YES
**Dependencies:** None

### Tasks

#### 0.1 Schema Design (8 hours)
**Owner:** Backend Lead

- [ ] Design `TopicProposal` table schema
  - [ ] Define core fields (id, name, description, status)
  - [ ] Add extraction fields (extraction_run_id, confidence, reasoning)
  - [ ] Add review fields (reviewed_by_user_id, reviewed_at, review_notes)
  - [ ] Add duplicate detection fields (similar_entity_id, similarity_score, similarity_method)
- [ ] Design `AtomProposal` table schema
  - [ ] Mirror TopicProposal structure
  - [ ] Add atom-specific fields (content, source_message_id)
- [ ] Design `KnowledgeExtractionRun` table
  - [ ] Add run metadata (id, started_at, completed_at, status)
  - [ ] Add statistics fields (total_topics, total_atoms, success_count)
- [ ] Create ERD diagram for proposal system
- [ ] Document enum values (ProposalStatus, SimilarityMethod)

**Deliverable:** Schema design document in `.artifacts/knowledge-system-redesign/20251023_211420/phase-specs/database-schema.md`

#### 0.2 Migration Scripts (12 hours)
**Owner:** Backend Lead
**Dependencies:** 0.1

- [ ] Create Alembic migration for `knowledge_extraction_runs` table
  - [ ] Add indexes on (status, created_at)
- [ ] Create Alembic migration for `topic_proposals` table
  - [ ] Add FK constraint to extraction_run_id
  - [ ] Add indexes on (status, confidence, extraction_run_id)
  - [ ] Add check constraint for confidence range (0.0-1.0)
- [ ] Create Alembic migration for `atom_proposals` table
  - [ ] Add FK constraint to extraction_run_id
  - [ ] Add FK constraint to source_message_id
  - [ ] Add indexes on (status, confidence, extraction_run_id)
- [ ] Test migrations on empty database
- [ ] Test migrations on database copy with existing data
- [ ] Create rollback scripts for each migration
- [ ] Document migration process

**Deliverable:** Migration files in `backend/alembic/versions/`

#### 0.3 SQLAlchemy Models (10 hours)
**Owner:** Backend Developer
**Dependencies:** 0.2

- [ ] Create `KnowledgeExtractionRun` model
  - [ ] Add relationships to proposals
  - [ ] Add computed properties (success_rate, duration)
- [ ] Create `TopicProposal` model
  - [ ] Add relationships (extraction_run, similar_entity, reviewed_by)
  - [ ] Add validation methods (validate_status_transition)
  - [ ] Add helper methods (approve, reject, merge)
- [ ] Create `AtomProposal` model
  - [ ] Mirror TopicProposal structure
  - [ ] Add atom-specific relationships
- [ ] Add enums (`ProposalStatus`, `SimilarityMethod`)
- [ ] Run mypy strict type checking
- [ ] Fix all type errors

**Deliverable:** Models in `backend/app/models/proposals/`

#### 0.4 Configuration Updates (4 hours)
**Owner:** Backend Developer
**Dependencies:** None

- [ ] Add knowledge proposal settings to `config.py`
  - [ ] `KNOWLEDGE_PROPOSALS_ENABLED` (feature flag)
  - [ ] `PROPOSAL_AUTO_APPROVE_THRESHOLD` (default: 0.95)
  - [ ] `PROPOSAL_CONFIDENCE_MIN` (default: 0.5)
  - [ ] `PROPOSAL_EXPIRATION_DAYS` (default: 30)
  - [ ] `SIMILARITY_THRESHOLD_EXACT` (default: 1.0)
  - [ ] `SIMILARITY_THRESHOLD_SEMANTIC` (default: 0.85)
  - [ ] `SIMILARITY_THRESHOLD_FUZZY` (default: 0.8)
- [ ] Update `.env.example` with new variables
- [ ] Document configuration options

**Deliverable:** Updated `backend/app/config.py`

#### 0.5 Testing & Validation (6 hours)
**Owner:** Backend Lead + DevOps
**Dependencies:** 0.1, 0.2, 0.3

- [ ] Create test database
- [ ] Run migrations from scratch
- [ ] Verify foreign key constraints
- [ ] Test rollback migrations
- [ ] Run migrations on production DB copy
- [ ] Verify no data loss after rollback
- [ ] Document any migration warnings

**Deliverable:** Test report with migration validation results

---

### Phase 0 Review Checkpoint

**Time:** End of Week 1
**Attendees:** Backend Lead, DevOps, Tech Lead
**Duration:** 1 hour

**Review Criteria:**
- [ ] All migrations run cleanly without errors
- [ ] Models pass mypy strict type checking
- [ ] ERD diagram approved by team
- [ ] Configuration variables documented
- [ ] Rollback plan tested and verified

**Go/No-Go Decision:** Proceed to Phase 1 if all criteria met

---

## Phase 1: Service Layer Refactor

**Duration:** Week 2 (40 hours)
**Team:** Backend Lead + Backend Developer
**Critical Path:** YES
**Dependencies:** Phase 0 complete

### Tasks

#### 1.1 Proposal Services (16 hours)
**Owner:** Backend Lead

- [ ] Create `TopicProposalService`
  - [ ] `create_proposal(data: TopicProposalCreate) -> TopicProposal`
  - [ ] `get_proposal(proposal_id: UUID) -> TopicProposal | None`
  - [ ] `list_proposals(filters: ProposalFilters) -> List[TopicProposal]`
  - [ ] `update_proposal(proposal_id: UUID, data: TopicProposalUpdate)`
  - [ ] `delete_proposal(proposal_id: UUID)`
  - [ ] Add transaction handling
  - [ ] Add error handling with custom exceptions
- [ ] Create `AtomProposalService`
  - [ ] Mirror TopicProposalService methods
  - [ ] Add atom-specific logic
- [ ] Create `KnowledgeExtractionRunService`
  - [ ] `create_run(metadata: RunMetadata) -> KnowledgeExtractionRun`
  - [ ] `update_run_status(run_id: UUID, status: str)`
  - [ ] `record_statistics(run_id: UUID, stats: RunStatistics)`

**Deliverable:** Services in `backend/app/services/proposals/`

#### 1.2 Extraction Service Refactor (12 hours)
**Owner:** Backend Developer
**Dependencies:** 1.1

- [ ] Refactor `KnowledgeExtractionService.save_topics()`
  - [ ] Rename to `create_topic_proposals()`
  - [ ] Change to create TopicProposal instead of Topic
  - [ ] Remove confidence threshold filtering
  - [ ] Add extraction_run_id parameter
  - [ ] Update return type
- [ ] Refactor `KnowledgeExtractionService.save_atoms()`
  - [ ] Rename to `create_atom_proposals()`
  - [ ] Change to create AtomProposal instead of Atom
  - [ ] Remove confidence threshold filtering
  - [ ] Add extraction_run_id parameter
- [ ] Add `start_extraction_run()` method
  - [ ] Create run record at start
  - [ ] Return run_id
- [ ] Add `complete_extraction_run()` method
  - [ ] Update run status to completed
  - [ ] Record statistics
- [ ] Update all caller code to use new methods

**Deliverable:** Refactored `backend/app/services/knowledge_extraction_service.py`

#### 1.3 Basic Duplicate Detection (8 hours)
**Owner:** Backend Developer
**Dependencies:** 1.1

- [ ] Add exact name matching to `TopicProposalService`
  - [ ] `find_by_exact_name(name: str) -> List[Topic | TopicProposal]`
  - [ ] Check both existing topics and pending proposals
- [ ] Add exact name matching to `AtomProposalService`
- [ ] Update `create_proposal()` to check for duplicates
  - [ ] Set `similar_entity_id` if exact match found
  - [ ] Set `similarity_score = 1.0`
  - [ ] Set `similarity_method = "exact"`
- [ ] Add test cases for duplicate detection

**Deliverable:** Duplicate detection logic in proposal services

#### 1.4 Unit Testing (4 hours)
**Owner:** Backend Developer
**Dependencies:** 1.1, 1.2, 1.3

- [ ] Write tests for `TopicProposalService`
  - [ ] Test CRUD operations
  - [ ] Test filtering and pagination
  - [ ] Test duplicate detection
- [ ] Write tests for `AtomProposalService`
- [ ] Write tests for `KnowledgeExtractionRunService`
- [ ] Write tests for refactored extraction service
- [ ] Achieve 90%+ code coverage
- [ ] Run mypy on all new code

**Deliverable:** Test suite in `backend/tests/services/test_proposals.py`

---

### Phase 1 Review Checkpoint

**Time:** End of Week 2
**Attendees:** Backend Team, Tech Lead
**Duration:** 1 hour

**Review Criteria:**
- [ ] Extraction creates proposals, NOT final entities
- [ ] Low-confidence items (< 0.7) are persisted
- [ ] Each extraction run is tracked with UUID
- [ ] All tests pass (90%+ coverage)
- [ ] Mypy passes with no errors

**Go/No-Go Decision:** Proceed to Phase 2 if all criteria met

---

## Phase 2: Review Workflow API

**Duration:** Week 3 (40 hours)
**Team:** Backend Lead + Backend Developer
**Critical Path:** YES
**Dependencies:** Phase 1 complete

### Tasks

#### 2.1 Pydantic Schemas (8 hours)
**Owner:** Backend Developer

- [ ] Create request schemas
  - [ ] `TopicProposalCreate`
  - [ ] `TopicProposalUpdate`
  - [ ] `TopicProposalFilter`
  - [ ] `AtomProposalCreate`
  - [ ] `AtomProposalUpdate`
  - [ ] `AtomProposalFilter`
  - [ ] `ProposalApprovalRequest`
  - [ ] `ProposalMergeRequest`
  - [ ] `BatchApprovalRequest`
- [ ] Create response schemas
  - [ ] `TopicProposalResponse`
  - [ ] `AtomProposalResponse`
  - [ ] `ExtractionRunResponse`
  - [ ] `PaginatedProposalResponse`
- [ ] Add field validation (min/max lengths, regex patterns)
- [ ] Add custom validators for business logic

**Deliverable:** Schemas in `backend/app/schemas/proposals.py`

#### 2.2 Topic Proposal Endpoints (10 hours)
**Owner:** Backend Lead
**Dependencies:** 2.1

- [ ] `GET /api/v1/knowledge/topics/proposals`
  - [ ] Add query params (status, confidence_min, confidence_max, limit, offset)
  - [ ] Add sorting (created_at, confidence)
  - [ ] Return paginated results
- [ ] `GET /api/v1/knowledge/topics/proposals/{id}`
  - [ ] Return single proposal with relationships
  - [ ] Include similar entities if found
- [ ] `POST /api/v1/knowledge/topics/proposals/{id}/approve`
  - [ ] Validate proposal exists and is pending
  - [ ] Create final Topic entity
  - [ ] Update proposal status to approved
  - [ ] Record reviewer and timestamp
- [ ] `POST /api/v1/knowledge/topics/proposals/{id}/reject`
  - [ ] Update proposal status to rejected
  - [ ] Record rejection reason
- [ ] `POST /api/v1/knowledge/topics/proposals/batch/approve`
  - [ ] Accept list of proposal IDs
  - [ ] Validate all proposals
  - [ ] Approve in transaction
  - [ ] Return success/failure report

**Deliverable:** Routes in `backend/app/api/v1/knowledge/topic_proposals.py`

#### 2.3 Atom Proposal Endpoints (10 hours)
**Owner:** Backend Developer
**Dependencies:** 2.1

- [ ] `GET /api/v1/knowledge/atoms/proposals`
- [ ] `GET /api/v1/knowledge/atoms/proposals/{id}`
- [ ] `POST /api/v1/knowledge/atoms/proposals/{id}/approve`
- [ ] `POST /api/v1/knowledge/atoms/proposals/{id}/reject`
- [ ] `POST /api/v1/knowledge/atoms/proposals/batch/approve`
- [ ] Mirror topic proposal logic

**Deliverable:** Routes in `backend/app/api/v1/knowledge/atom_proposals.py`

#### 2.4 Merge Endpoint (6 hours)
**Owner:** Backend Lead
**Dependencies:** 2.2, 2.3

- [ ] `POST /api/v1/knowledge/proposals/{id}/merge`
  - [ ] Accept target entity ID (topic or atom)
  - [ ] Validate proposal and target exist
  - [ ] Merge metadata (keep non-null fields)
  - [ ] Update relationships
  - [ ] Mark proposal as merged
  - [ ] Return merged entity
- [ ] Add merge conflict resolution logic
- [ ] Add rollback on error

**Deliverable:** Merge logic in proposal services and API route

#### 2.5 WebSocket Events (4 hours)
**Owner:** Backend Developer
**Dependencies:** 2.2, 2.3

- [ ] Emit `proposal.created` event
- [ ] Emit `proposal.approved` event
- [ ] Emit `proposal.rejected` event
- [ ] Emit `proposal.merged` event
- [ ] Emit `extraction_run.completed` event
- [ ] Add event payload schemas

**Deliverable:** WebSocket events in API handlers

#### 2.6 Integration Testing (2 hours)
**Owner:** Backend Developer
**Dependencies:** 2.1, 2.2, 2.3, 2.4

- [ ] Test all endpoints with valid data
- [ ] Test error cases (404, 400, 422)
- [ ] Test pagination
- [ ] Test batch operations
- [ ] Test merge conflicts
- [ ] Verify WebSocket events emitted

**Deliverable:** Integration tests in `backend/tests/api/test_proposals.py`

---

### Phase 2 Review Checkpoint

**Time:** End of Week 3
**Attendees:** Backend Team, Frontend Lead, Tech Lead
**Duration:** 1 hour

**Review Criteria:**
- [ ] All endpoints return proper status codes
- [ ] Request validation catches invalid data
- [ ] Approval creates final Topic/Atom entity
- [ ] WebSocket broadcasts proposal updates
- [ ] API documented in Swagger UI
- [ ] Integration tests pass

**Go/No-Go Decision:** Proceed to Phase 4 (Frontend can start). Phase 3 starts in parallel.

---

## Phase 3: Duplicate Detection

**Duration:** Week 3-4 (32 hours, parallel with Phase 2)
**Team:** Backend Developer
**Critical Path:** NO (parallel track)
**Dependencies:** Phase 1 complete

### Tasks

#### 3.1 Similarity Service (12 hours)
**Owner:** Backend Developer

- [ ] Create `SimilarityService` class
  - [ ] Add OpenAI embedding client
  - [ ] Add embedding cache (Redis or in-memory)
- [ ] Implement `calculate_embedding(text: str) -> List[float]`
  - [ ] Handle API rate limits with retry logic
  - [ ] Add timeout handling
- [ ] Implement `semantic_similarity_search(embedding, threshold) -> List[Match]`
  - [ ] Query existing topics/atoms with vector search
  - [ ] Return matches above threshold
- [ ] Implement `fuzzy_name_search(name: str, threshold: float) -> List[Match]`
  - [ ] Use Levenshtein distance
  - [ ] Handle abbreviations and typos
- [ ] Add batch embedding requests (optimization)

**Deliverable:** `backend/app/services/similarity_service.py`

#### 3.2 Duplicate Detection Algorithm (8 hours)
**Owner:** Backend Developer
**Dependencies:** 3.1

- [ ] Implement `check_for_duplicates(proposal)` in service
  - [ ] Step 1: Check exact name match (fast path)
  - [ ] Step 2: Calculate semantic similarity
  - [ ] Step 3: Try fuzzy matching if no semantic match
  - [ ] Return best match with score and method
- [ ] Update `TopicProposalService.create_proposal()`
  - [ ] Call duplicate detection
  - [ ] Set similar_entity_id, similarity_score, similarity_method
- [ ] Update `AtomProposalService.create_proposal()`
  - [ ] Add duplicate detection
- [ ] Add performance logging (time per check)

**Deliverable:** Integrated duplicate detection in proposal services

#### 3.3 Merge Logic (8 hours)
**Owner:** Backend Developer
**Dependencies:** 3.2

- [ ] Implement `merge_proposals(source_id, target_id)` in service
  - [ ] Combine metadata fields (keep non-null)
  - [ ] Transfer relationships (atoms to topic, etc.)
  - [ ] Update references in related entities
  - [ ] Mark source proposal as merged
- [ ] Add conflict resolution rules
  - [ ] Priority: user-reviewed > auto-created
  - [ ] Timestamps: keep earliest created_at
  - [ ] Descriptions: concatenate if both exist
- [ ] Add merge preview method (show result before committing)
- [ ] Add undo merge capability

**Deliverable:** Merge logic in proposal services

#### 3.4 Testing & Optimization (4 hours)
**Owner:** Backend Developer
**Dependencies:** 3.1, 3.2, 3.3

- [ ] Test semantic similarity accuracy (sample dataset)
  - [ ] Target: 85%+ correct matches
- [ ] Test fuzzy matching (typos, abbreviations)
- [ ] Test merge conflict resolution
- [ ] Performance test: 500ms target per duplicate check
  - [ ] Optimize with embedding cache
  - [ ] Optimize with database indexes
- [ ] Test with 10k existing entities

**Deliverable:** Test suite in `backend/tests/services/test_similarity.py`

---

### Phase 3 Review Checkpoint

**Time:** End of Week 4
**Attendees:** Backend Team, Tech Lead
**Duration:** 30 minutes

**Review Criteria:**
- [ ] Semantic similarity detection works (85%+ accuracy)
- [ ] Fuzzy matching catches typos
- [ ] Proposals flagged with similar_entity_id
- [ ] Merge operation works correctly
- [ ] Performance: < 500ms per check

**Go/No-Go Decision:** Can deploy to staging. Frontend merge UI can use this.

---

## Phase 4: Frontend Review UI

**Duration:** Week 4-5 (60 hours)
**Team:** Frontend Lead + Frontend Developer
**Critical Path:** YES
**Dependencies:** Phase 2 complete

### Tasks

#### 4.1 API Client & Hooks (12 hours)
**Owner:** Frontend Developer

- [ ] Create `proposalsApi.ts`
  - [ ] `fetchProposals(filters: ProposalFilters)`
  - [ ] `approveProposal(id: string, notes: string)`
  - [ ] `rejectProposal(id: string, reason: string)`
  - [ ] `batchApproveProposals(ids: string[])`
  - [ ] `mergeProposals(sourceId: string, targetId: string)`
- [ ] Create `useProposals` hook
  - [ ] Fetch proposals with filters
  - [ ] Handle loading/error states
  - [ ] Implement pagination
  - [ ] Cache results with React Query
- [ ] Create `useProposalReview` hook
  - [ ] Approve/reject mutations
  - [ ] Optimistic updates
  - [ ] Error handling with rollback
- [ ] Create WebSocket connection for real-time updates
  - [ ] Listen for proposal events
  - [ ] Update cache on events

**Deliverable:** `frontend/src/features/knowledge/api/proposalsApi.ts` and hooks

#### 4.2 Proposal Review Dashboard (16 hours)
**Owner:** Frontend Lead
**Dependencies:** 4.1

- [ ] Create `ProposalReviewDashboard` component
  - [ ] Header with stats (pending, approved, rejected)
  - [ ] Filter panel (status, type, confidence range)
  - [ ] Confidence slider (0.0 - 1.0)
  - [ ] Sort options (created_at, confidence)
  - [ ] Search by name
- [ ] Add proposal list view
  - [ ] Infinite scroll or pagination
  - [ ] Bulk selection checkboxes
  - [ ] Bulk action buttons (approve, reject)
- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Make responsive (mobile-friendly)

**Deliverable:** `frontend/src/features/knowledge/components/ProposalReviewDashboard.tsx`

#### 4.3 Topic Proposal Card (10 hours)
**Owner:** Frontend Developer
**Dependencies:** 4.1

- [ ] Create `TopicProposalCard` component
  - [ ] Display topic name and description
  - [ ] Show confidence score with visual indicator
  - [ ] Display LLM reasoning in expandable section
  - [ ] Show similar entities if found (badge)
  - [ ] Action buttons (approve, reject, merge)
- [ ] Add confidence visualization (progress bar or badge)
- [ ] Add review notes input field
- [ ] Add keyboard shortcuts (a = approve, r = reject)
- [ ] Add animations for state transitions

**Deliverable:** `frontend/src/features/knowledge/components/TopicProposalCard.tsx`

#### 4.4 Atom Proposal Card (8 hours)
**Owner:** Frontend Developer
**Dependencies:** 4.3

- [ ] Create `AtomProposalCard` component
  - [ ] Mirror topic card structure
  - [ ] Display atom content (truncated)
  - [ ] Show source message link
  - [ ] Add action buttons
- [ ] Handle long content with "Read more" expansion

**Deliverable:** `frontend/src/features/knowledge/components/AtomProposalCard.tsx`

#### 4.5 Merge Similar Dialog (10 hours)
**Owner:** Frontend Lead
**Dependencies:** 4.3, 4.4

- [ ] Create `MergeSimilarDialog` modal
  - [ ] Side-by-side comparison layout
  - [ ] Highlight differences
  - [ ] Field selection UI (checkboxes for each field)
  - [ ] Preview merged result
  - [ ] Merge button with confirmation
- [ ] Add conflict resolution UI
  - [ ] Show conflicting fields
  - [ ] Allow user to choose value
- [ ] Add undo capability
- [ ] Make accessible (WCAG 2.1 AA)

**Deliverable:** `frontend/src/features/knowledge/components/MergeSimilarDialog.tsx`

#### 4.6 Confidence Filter UI (4 hours)
**Owner:** Frontend Developer
**Dependencies:** 4.2

- [ ] Create `ConfidenceFilter` component
  - [ ] Dual-handle range slider
  - [ ] Numeric inputs for min/max
  - [ ] Preset buttons (High: 0.9+, Medium: 0.7-0.9, Low: <0.7)
  - [ ] Visual distribution histogram (if possible)
- [ ] Integrate with dashboard filters

**Deliverable:** `frontend/src/features/knowledge/components/ConfidenceFilter.tsx`

---

### Phase 4 Review Checkpoint

**Time:** End of Week 5
**Attendees:** Frontend Team, UX, Product Owner
**Duration:** 1 hour

**Review Criteria:**
- [ ] Users can review proposals in dashboard
- [ ] Bulk approve/reject works
- [ ] Merge UI shows clear comparison
- [ ] Real-time updates via WebSocket work
- [ ] No console errors or warnings
- [ ] Responsive on mobile devices
- [ ] Accessible (keyboard navigation, screen readers)

**Go/No-Go Decision:** Proceed to Phase 5. Can enable feature flag for staging.

---

## Phase 5: Automation & Polish

**Duration:** Week 5-6 (48 hours)
**Team:** Backend Developer + DevOps + Tech Writer
**Critical Path:** NO (nice-to-have features)
**Dependencies:** Phase 2 complete

### Tasks

#### 5.1 Auto-Review Job (12 hours)
**Owner:** Backend Developer

- [ ] Create TaskIQ scheduled task
  - [ ] Schedule: every 5 minutes
  - [ ] Query pending proposals with confidence > 0.95
  - [ ] Check for duplicates (skip if similar_entity_id set)
  - [ ] Auto-approve if no duplicates
  - [ ] Log decisions for audit trail
- [ ] Add circuit breaker (stop if error rate > 10%)
- [ ] Add retry logic with exponential backoff
- [ ] Add monitoring metrics
  - [ ] Auto-approval rate
  - [ ] Average confidence of auto-approved
  - [ ] Error count
- [ ] Create admin endpoint to pause/resume job

**Deliverable:** `backend/app/tasks/auto_review.py`

#### 5.2 Deduplication Scan Job (10 hours)
**Owner:** Backend Developer
**Dependencies:** Phase 3 complete

- [ ] Create daily scheduled task
  - [ ] Find duplicate topics in existing knowledge base
  - [ ] Create merge proposals for duplicates
  - [ ] Notify user of found duplicates
- [ ] Add configurable similarity threshold
- [ ] Add batch processing (100 entities at a time)
- [ ] Add progress tracking
- [ ] Create admin UI to trigger manual scan

**Deliverable:** `backend/app/tasks/deduplication_scan.py`

#### 5.3 Proposal Expiration Job (6 hours)
**Owner:** Backend Developer

- [ ] Create daily scheduled task
  - [ ] Find proposals older than 30 days (configurable)
  - [ ] Auto-reject with reason "Expired: no action taken"
  - [ ] Archive or soft-delete
- [ ] Add notification before expiration (7 days warning)
- [ ] Add admin override to extend expiration

**Deliverable:** `backend/app/tasks/proposal_expiration.py`

#### 5.4 Notification System (8 hours)
**Owner:** Backend Developer

- [ ] Create notification service
  - [ ] Send WebSocket events for important actions
  - [ ] Queue notifications for offline users
- [ ] Add notification types
  - [ ] High-confidence proposals pending review
  - [ ] Duplicate detected
  - [ ] Proposal expiring soon
  - [ ] Bulk operation completed
- [ ] Create notification preferences (allow user to opt-in/out)
- [ ] Add in-app notification UI (toast/banner)

**Deliverable:** `backend/app/services/notification_service.py`

#### 5.5 Extraction History Viewer (8 hours)
**Owner:** Frontend Developer
**Dependencies:** 5.1, 5.2

- [ ] Create `ExtractionHistoryView` component
  - [ ] List all extraction runs
  - [ ] Show run statistics (success rate, duration)
  - [ ] Link to proposals created in each run
  - [ ] Filter by date range
- [ ] Add run details page
  - [ ] Show all proposals from run
  - [ ] Show approval/rejection stats
  - [ ] Add retry failed run button

**Deliverable:** `frontend/src/features/knowledge/components/ExtractionHistoryView.tsx`

#### 5.6 Documentation (4 hours)
**Owner:** Tech Writer + Backend Lead

- [ ] Write user guide: "Reviewing Knowledge Proposals"
  - [ ] How to access proposal dashboard
  - [ ] How to approve/reject proposals
  - [ ] How to merge duplicates
  - [ ] Confidence score explanation
- [ ] Update developer docs
  - [ ] API reference (auto-generated from OpenAPI)
  - [ ] Service architecture diagram
  - [ ] Database schema ERD
- [ ] Write troubleshooting guide
  - [ ] Common issues and solutions

**Deliverable:** `docs/content/en/knowledge-proposals.md`

---

### Phase 5 Review Checkpoint

**Time:** End of Week 6
**Attendees:** Full Team, Product Owner
**Duration:** 1.5 hours

**Review Criteria:**
- [ ] Auto-approval runs reliably
- [ ] Jobs don't fail on errors (retry logic works)
- [ ] Notifications sent for important events
- [ ] Documentation complete and reviewed
- [ ] Performance: < 1s per proposal review
- [ ] All tests pass (unit, integration, E2E)

**Go/No-Go Decision:** Ready for production rollout

---

## Critical Path Analysis

### Critical Path (160 hours minimum)
```
Phase 0 (40h) → Phase 1 (40h) → Phase 2 (40h) → Phase 4 (60h) = 180 hours
```

**Critical Path with Buffer:** 200 hours (5 weeks, 1 backend + 1 frontend engineer)

### Non-Critical Path (parallel work)
```
Phase 3 (32h) - Can run alongside Phase 2
Phase 5 (48h) - Can be deferred if timeline is tight
```

### Bottlenecks
1. **Phase 0 → Phase 1:** Database schema must be complete before service work
2. **Phase 1 → Phase 2:** Service refactor must be done before API work
3. **Phase 2 → Phase 4:** API must be stable before frontend work begins

### Parallelization Opportunities
- **Week 3:** Phase 2 (API) and Phase 3 (Duplicate Detection) run in parallel
- **Week 4-5:** Phase 4 (Frontend) and Phase 3 (Duplicate Detection) overlap
- **Week 5-6:** Phase 4 (Frontend) and Phase 5 (Automation) overlap

### Fast-Track Option (4 weeks)
If timeline is aggressive, defer Phase 5 (Automation) to post-launch:
```
Week 1: Phase 0
Week 2: Phase 1
Week 3: Phase 2 + Phase 3 (parallel)
Week 4: Phase 4
```
Total: 172 hours (4.3 weeks with 2 engineers)

---

## Team Assignments

### Backend Lead (120 hours)
**Primary Responsibility:** Database, services, API design

**Assignments:**
- Phase 0: Schema design, migration scripts (20h)
- Phase 1: Proposal services, extraction refactor (24h)
- Phase 2: Topic proposal API, merge endpoint (20h)
- Phase 3: Review and guidance (4h)
- Phase 4: API support for frontend (8h)
- Phase 5: Auto-review job, documentation (16h)
- Testing & Review: Unit tests, code reviews (28h)

### Backend Developer (120 hours)
**Primary Responsibility:** Implementation, duplicate detection

**Assignments:**
- Phase 0: SQLAlchemy models, configuration (14h)
- Phase 1: Service implementation, unit tests (16h)
- Phase 2: Atom proposal API, WebSocket events (16h)
- Phase 3: Similarity service, duplicate detection (32h)
- Phase 5: Deduplication job, notification system (28h)
- Testing: Integration tests, performance optimization (14h)

### Frontend Lead (40 hours)
**Primary Responsibility:** UI architecture, complex components

**Assignments:**
- Phase 4: Dashboard design, merge dialog (26h)
- Phase 4: Code reviews, accessibility audit (8h)
- Phase 5: Extraction history viewer (6h)

### Frontend Developer (40 hours)
**Primary Responsibility:** Component implementation

**Assignments:**
- Phase 4: API client, hooks, proposal cards (34h)
- Phase 4: Confidence filter, testing (6h)

### DevOps (20 hours)
**Primary Responsibility:** Infrastructure, deployment

**Assignments:**
- Phase 0: Migration testing, rollback scripts (6h)
- Phase 2: WebSocket infrastructure (4h)
- Phase 5: Job scheduling setup, monitoring (6h)
- Production Deployment: Feature flag setup, rollout plan (4h)

### QA/Testing (40 hours)
**Primary Responsibility:** End-to-end testing, quality assurance

**Assignments:**
- Phase 2: Integration testing (8h)
- Phase 3: Duplicate detection testing (8h)
- Phase 4: E2E testing (Playwright) (12h)
- Phase 5: Load testing, smoke testing (8h)
- Final: Regression testing before production (4h)

### Tech Writer (4 hours)
**Primary Responsibility:** Documentation

**Assignments:**
- Phase 5: User guide, troubleshooting (4h)

---

## Success Criteria by Phase

### Phase 0: Database Foundation
**Success Metrics:**
- [ ] Zero migration errors on test database
- [ ] Rollback works without data loss
- [ ] Mypy strict passes on all models
- [ ] Schema review approved by team
- [ ] Performance: Migration completes < 5 minutes on production-size DB

**Quality Gate:**
- Migration tested on production DB copy
- Foreign key constraints validated
- Indexes confirmed with EXPLAIN ANALYZE

### Phase 1: Service Layer Refactor
**Success Metrics:**
- [ ] 90%+ unit test coverage
- [ ] Zero mypy errors
- [ ] Extraction creates proposals, not final entities
- [ ] Low-confidence items persisted (< 0.7 threshold)
- [ ] Performance: < 100ms per proposal creation

**Quality Gate:**
- All existing extraction tests updated and passing
- Service methods have type hints
- Transaction handling tested (rollback on error)

### Phase 2: Review Workflow API
**Success Metrics:**
- [ ] All endpoints return correct status codes
- [ ] Request validation catches 100% of invalid inputs
- [ ] Approval creates final entity correctly
- [ ] WebSocket events emitted for all actions
- [ ] OpenAPI docs auto-generated and accurate
- [ ] Performance: < 200ms response time (p95)

**Quality Gate:**
- Integration tests cover all endpoints
- Error responses include helpful messages
- Postman collection created for manual testing

### Phase 3: Duplicate Detection
**Success Metrics:**
- [ ] 85%+ semantic similarity accuracy (tested on sample dataset)
- [ ] Fuzzy matching catches common typos/abbreviations
- [ ] Merge operation preserves data integrity
- [ ] Performance: < 500ms per duplicate check
- [ ] False positive rate < 15%

**Quality Gate:**
- Algorithm tested on real production data
- Embedding cache improves performance by 50%+
- Merge conflicts handled gracefully

### Phase 4: Frontend Review UI
**Success Metrics:**
- [ ] Zero console errors or warnings
- [ ] Lighthouse score: 90+ Performance, 100 Accessibility
- [ ] Bulk operations handle 50+ proposals
- [ ] Real-time updates work (< 2s latency)
- [ ] Mobile-responsive (tested on iOS/Android)
- [ ] WCAG 2.1 AA compliant

**Quality Gate:**
- UX review completed
- Keyboard navigation works for all actions
- Loading states prevent UI jank

### Phase 5: Automation & Polish
**Success Metrics:**
- [ ] Auto-approval rate: 50%+ of high-confidence proposals
- [ ] Job failure rate: < 1%
- [ ] Notifications delivered within 5 seconds
- [ ] Documentation readability score: 80+ (Flesch-Kincaid)
- [ ] Performance: < 1s per proposal review

**Quality Gate:**
- Jobs monitored in staging for 48 hours
- Circuit breaker tested under failure conditions
- Documentation reviewed by non-technical stakeholder

---

## Review Checkpoints

### Checkpoint 1: Schema Approval (End of Week 1)
**Attendees:** Backend Lead, DevOps, Tech Lead
**Duration:** 1 hour
**Agenda:**
1. Review ERD diagram (15 min)
2. Discuss migration strategy (15 min)
3. Review rollback plan (15 min)
4. Go/No-Go decision (15 min)

**Deliverables Required:**
- ERD diagram
- Migration scripts
- Rollback scripts
- Test results from migration on DB copy

**Success Criteria:**
- All migrations run cleanly
- Team approves schema design
- No critical concerns raised

### Checkpoint 2: Service Layer Review (End of Week 2)
**Attendees:** Backend Team, Tech Lead
**Duration:** 1 hour
**Agenda:**
1. Demo service functionality (20 min)
2. Review test coverage report (15 min)
3. Discuss any blockers (10 min)
4. Code review highlights (15 min)

**Deliverables Required:**
- Working proposal services
- Test coverage report (must be 90%+)
- Mypy clean report

**Success Criteria:**
- Extraction creates proposals only
- All tests pass
- Mypy strict passes

### Checkpoint 3: API Review (End of Week 3)
**Attendees:** Backend Team, Frontend Lead, Tech Lead
**Duration:** 1 hour
**Agenda:**
1. Demo API endpoints in Swagger UI (20 min)
2. Frontend Q&A about API contracts (20 min)
3. Review integration tests (10 min)
4. Discuss any API changes needed (10 min)

**Deliverables Required:**
- All API endpoints implemented
- Swagger UI documentation
- Integration test results
- Postman collection

**Success Criteria:**
- API contracts agreed upon by frontend
- All endpoints documented
- Integration tests pass

### Checkpoint 4: Duplicate Detection Review (End of Week 4)
**Attendees:** Backend Team, Tech Lead
**Duration:** 30 minutes
**Agenda:**
1. Demo duplicate detection (10 min)
2. Review accuracy metrics (10 min)
3. Discuss performance results (10 min)

**Deliverables Required:**
- Similarity service implementation
- Accuracy test results (must be 85%+)
- Performance benchmarks

**Success Criteria:**
- Accuracy target met
- Performance < 500ms per check
- Merge logic works correctly

### Checkpoint 5: Frontend UX Review (End of Week 5)
**Attendees:** Frontend Team, UX Designer, Product Owner, Tech Lead
**Duration:** 1.5 hours
**Agenda:**
1. Live demo of UI (30 min)
2. UX feedback session (30 min)
3. Accessibility testing results (15 min)
4. Discuss polish items (15 min)

**Deliverables Required:**
- Working UI deployed to staging
- Accessibility audit report
- Lighthouse scores
- User testing notes (if available)

**Success Criteria:**
- UX approves design and flow
- Accessibility standards met
- No critical bugs found

### Checkpoint 6: Pre-Production Review (End of Week 6)
**Attendees:** Full Team, Product Owner, Stakeholders
**Duration:** 2 hours
**Agenda:**
1. End-to-end demo (30 min)
2. Review metrics and KPIs (20 min)
3. Discuss rollout plan (20 min)
4. Load testing results (15 min)
5. Documentation review (15 min)
6. Go/No-Go for production (20 min)

**Deliverables Required:**
- Complete system working in staging
- Load test results
- All documentation complete
- Rollout plan
- Rollback plan

**Success Criteria:**
- All phases complete
- All tests pass (unit, integration, E2E)
- Performance targets met
- Documentation approved
- Stakeholder approval

---

## Quick Task Summary

### Total Tasks: 87
- **Phase 0:** 19 tasks (Database Foundation)
- **Phase 1:** 16 tasks (Service Layer)
- **Phase 2:** 22 tasks (API)
- **Phase 3:** 12 tasks (Duplicate Detection)
- **Phase 4:** 20 tasks (Frontend)
- **Phase 5:** 19 tasks (Automation)

### Total Estimated Hours: 280 hours
- **Backend:** 160 hours (57%)
- **Frontend:** 80 hours (29%)
- **DevOps:** 20 hours (7%)
- **QA/Testing:** 20 hours (7%)

### Timeline: 6 weeks
- **Critical Path:** 5 weeks (with buffer)
- **Parallel Work:** Phase 3 and Phase 5 save 1 week
- **Fast-Track Option:** 4 weeks (defer Phase 5)

---

**Document Status:** Ready for Execution
**Last Updated:** October 23, 2025
**Next Review:** After Phase 0 completion (Week 1)
