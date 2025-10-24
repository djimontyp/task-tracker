# Implementation Roadmap: Knowledge Proposal System

**Created:** October 23, 2025
**Status:** Ready for Implementation
**Timeline:** 4-6 weeks (phased rollout)

---

## Overview

Transform the Knowledge Extraction system from **direct creation** to **proposal-review-approval** workflow by adopting the proven TaskProposal pattern.

**Current Problem:**
Topics and Atoms are created directly from LLM extraction without review, causing knowledge base pollution and defeating the user's goal to "reduce noise, consolidate information."

**Solution:**
Implement TopicProposal and AtomProposal models with comprehensive review workflow, duplicate detection, and versioning.

---

## Implementation Phases

### Phase 0: Database Foundation (Week 1)

**Goal:** Create proposal schema and migration infrastructure

**Tasks:**
1. Design TopicProposal and AtomProposal tables (mirror TaskProposal pattern)
2. Create KnowledgeExtractionRun table for audit trail
3. Write Alembic migration scripts
4. Add database indexes for performance
5. Update config.py with knowledge proposal settings

**Key Fields to Add:**
```python
# Both TopicProposal and AtomProposal need:
- status: str  # pending/approved/rejected/merged
- extraction_run_id: UUID  # FK to KnowledgeExtractionRun
- confidence: float
- reasoning: str  # LLM explanation
- reviewed_by_user_id: int | None
- reviewed_at: datetime | None
- similar_entity_id: UUID | None  # For duplicate detection
- similarity_score: float | None
```

**Deliverables:**
- Migration files in `alembic/versions/`
- Models in `backend/app/models/proposals/`
- Updated `backend/app/config.py`

**Acceptance Criteria:**
- [ ] Migration runs cleanly on fresh database
- [ ] Migration tested on copy of production data
- [ ] All models pass mypy strict type checking
- [ ] Foreign key constraints properly defined

**Blockers/Risks:**
- Migration could break existing knowledge data → Mitigation: Test on DB copy first

---

### Phase 1: Service Layer Refactor (Week 2)

**Goal:** Change extraction logic to create proposals instead of final entities

**Tasks:**
1. Create `TopicProposalService` with CRUD operations
2. Create `AtomProposalService` with CRUD operations
3. Refactor `KnowledgeExtractionService`:
   - `save_topics()` → `create_topic_proposals()`
   - `save_atoms()` → `create_atom_proposals()`
   - Remove confidence threshold filtering (persist ALL)
4. Create `KnowledgeExtractionRunService` for run tracking
5. Add basic duplicate detection (exact name matching first)

**Critical Changes:**
```python
# OLD: Direct creation
new_topic = Topic(name=extracted_topic.name)
session.add(new_topic)

# NEW: Proposal creation
proposal = TopicProposal(
    name=extracted_topic.name,
    status="pending",
    extraction_run_id=run_id,
    confidence=extracted_topic.confidence,
    reasoning=extracted_topic.reasoning
)
session.add(proposal)
```

**Deliverables:**
- Services in `backend/app/services/proposals/`
- Refactored `knowledge_extraction_service.py`
- Unit tests with 90%+ coverage

**Acceptance Criteria:**
- [ ] Extraction creates proposals, NOT final entities
- [ ] Low-confidence items (< 0.7) are persisted as proposals
- [ ] Each extraction run is tracked with UUID
- [ ] All tests pass
- [ ] mypy passes on all new code

**Blockers/Risks:**
- Existing extraction calls will break → Mitigation: Update in same PR

---

### Phase 2: Review Workflow API (Week 3)

**Goal:** Enable programmatic review and approval

**Tasks:**
1. Create API endpoints for topic proposals:
   - `GET /api/v1/knowledge/topics/proposals` (list with filters)
   - `POST /api/v1/knowledge/topics/proposals/{id}/approve`
   - `POST /api/v1/knowledge/topics/proposals/{id}/reject`
   - `POST /api/v1/knowledge/topics/proposals/batch/approve`
2. Create equivalent endpoints for atom proposals
3. Add merge endpoint: `POST /api/v1/knowledge/proposals/{id}/merge`
4. Create Pydantic schemas for request/response validation
5. Add WebSocket events for proposal updates

**Critical Endpoints:**
```python
# Review queue with filtering
GET /api/v1/knowledge/proposals?status=pending&confidence_min=0.7

# Approve single proposal (creates final entity)
POST /api/v1/knowledge/proposals/{id}/approve
Body: {"review_notes": "Looks good"}

# Bulk approve high-confidence proposals
POST /api/v1/knowledge/proposals/batch/approve
Body: {"proposal_ids": [...], "confidence_threshold": 0.9}
```

**Deliverables:**
- API routes in `backend/app/api/v1/knowledge/proposals.py`
- Pydantic schemas in `backend/app/schemas/proposals.py`
- Integration tests for all endpoints
- OpenAPI documentation

**Acceptance Criteria:**
- [ ] All endpoints return proper status codes
- [ ] Request validation catches invalid data
- [ ] Approval creates final Topic/Atom entity
- [ ] WebSocket broadcasts proposal updates
- [ ] API documented in Swagger UI

**Blockers/Risks:**
- None (API layer is independent)

---

### Phase 3: Duplicate Detection (Week 3-4)

**Goal:** Prevent knowledge fragmentation via semantic similarity

**Tasks:**
1. Create `SimilarityService` using embedding comparison
2. Add similarity check to proposal creation:
   - Calculate embeddings for new proposals
   - Query existing entities + proposals for similar items
   - Flag if similarity_score > 0.85
3. Update proposal API to return similar entities
4. Add fuzzy name matching (Levenshtein distance) as fallback
5. Implement merge logic (combine proposals into single entity)

**Algorithm:**
```python
async def check_for_duplicates(proposal: TopicProposal):
    # 1. Exact name match (fast path)
    exact_match = await find_by_name(proposal.name)
    if exact_match:
        return (exact_match, 1.0, "exact")

    # 2. Semantic similarity via embeddings
    embedding = await get_embedding(proposal.name)
    similar = await vector_search(embedding, threshold=0.85)
    if similar:
        return (similar[0], similarity_score, "semantic")

    # 3. Fuzzy name matching
    fuzzy_matches = await fuzzy_search(proposal.name, threshold=0.8)
    if fuzzy_matches:
        return (fuzzy_matches[0], score, "fuzzy")

    return (None, 0.0, "none")
```

**Deliverables:**
- `backend/app/services/similarity_service.py`
- Updated proposal services with duplicate detection
- Tests for similarity algorithms

**Acceptance Criteria:**
- [ ] Semantic similarity detection works (85%+ accuracy)
- [ ] Fuzzy matching catches typos and abbreviations
- [ ] Proposals flagged with similar_entity_id if found
- [ ] Merge operation combines metadata correctly
- [ ] Performance: < 500ms for similarity check

**Blockers/Risks:**
- Embedding API rate limits → Mitigation: Batch requests, cache embeddings

---

### Phase 4: Frontend Review UI (Week 4-5)

**Goal:** User interface for proposal management

**Tasks:**
1. Create `ProposalReviewDashboard` component:
   - List view with filters (status, confidence, type)
   - Bulk selection and approval
   - Confidence threshold slider
2. Create `TopicProposalCard` component:
   - Show LLM reasoning
   - Display similar entities if found
   - Approve/Reject/Merge actions
3. Create `AtomProposalCard` component (similar to topic)
4. Create `MergeSimilarDialog` modal:
   - Side-by-side comparison
   - Field selection for merge
   - Preview merged result
5. Add WebSocket integration for real-time updates
6. Create confidence filter UI

**Key Components:**
```
frontend/src/features/knowledge/
├── components/
│   ├── ProposalReviewDashboard.tsx
│   ├── TopicProposalCard.tsx
│   ├── AtomProposalCard.tsx
│   ├── MergeSimilarDialog.tsx
│   └── ConfidenceFilter.tsx
├── hooks/
│   ├── useProposals.ts
│   └── useProposalReview.ts
└── api/
    └── proposalsApi.ts
```

**Deliverables:**
- All components in `frontend/src/features/knowledge/`
- Integration with WebSocket
- Responsive design (mobile-friendly)
- Accessibility (WCAG 2.1 AA)

**Acceptance Criteria:**
- [ ] Users can review proposals in dashboard
- [ ] Bulk approve/reject works
- [ ] Merge UI shows clear comparison
- [ ] Real-time updates via WebSocket
- [ ] No console errors or warnings

**Blockers/Risks:**
- Complexity of merge UI → Mitigation: Start with simple version, iterate

---

### Phase 5: Automation & Polish (Week 5-6)

**Goal:** Auto-approval for high confidence, cleanup jobs

**Tasks:**
1. Create auto-review job (TaskIQ):
   - Runs every 5 minutes
   - Auto-approves proposals with confidence > 0.95
   - Logs decisions for audit trail
2. Create deduplication scan job:
   - Finds existing duplicate entities
   - Creates merge proposals
3. Create proposal expiration job:
   - Auto-rejects proposals older than 30 days with no action
4. Add notification system (WebSocket events)
5. Create extraction history viewer UI
6. Write user documentation

**Auto-Approval Logic:**
```python
@task(schedule="*/5 * * * *")  # Every 5 minutes
async def auto_review_high_confidence_proposals():
    proposals = await get_pending_proposals(confidence_min=0.95)
    for proposal in proposals:
        # Check for duplicates first
        if not proposal.similar_entity_id:
            await approve_proposal(
                proposal.id,
                reviewed_by="system",
                review_notes="Auto-approved: high confidence"
            )
            logger.info(f"Auto-approved {proposal.id}")
```

**Deliverables:**
- Background jobs in `backend/app/tasks.py`
- Job scheduling configuration
- Notification system
- Documentation in `docs/content/en/knowledge-proposals.md`

**Acceptance Criteria:**
- [ ] Auto-approval runs reliably
- [ ] Jobs don't fail on errors (retry logic)
- [ ] Notifications sent for important events
- [ ] Documentation covers full workflow
- [ ] Performance: < 1s per proposal review

**Blockers/Risks:**
- Auto-approval too aggressive → Mitigation: Start with 0.95 threshold, adjust based on metrics

---

## Phase Dependencies

```
Phase 0 (Database) ──→ Phase 1 (Services) ──→ Phase 2 (API) ──→ Phase 4 (Frontend)
                              ↓                                         ↓
                       Phase 3 (Duplicates) ──→ Phase 5 (Automation & Polish)
```

**Critical Path:** Phase 0 → Phase 1 → Phase 2 → Phase 4
**Parallel Work:** Phase 3 can start alongside Phase 2

---

## Migration Strategy

### Step 1: Deploy with Feature Flag (Week 3)
- Add `KNOWLEDGE_PROPOSALS_ENABLED` config flag
- Deploy proposal system (disabled by default)
- Test in staging environment

### Step 2: Gradual Rollout (Week 4)
- Enable for internal users first
- Monitor metrics: approval rate, duplicate detection accuracy
- Adjust confidence thresholds based on data

### Step 3: Migrate Existing Data (Week 5)
```python
# Script to convert existing Topics/Atoms to "approved" proposals
async def migrate_existing_knowledge():
    topics = await get_all_topics()
    for topic in topics:
        proposal = TopicProposal(
            name=topic.name,
            description=topic.description,
            status="approved",  # Already in production
            confidence=1.0,  # Assume valid
            reviewed_by_user_id=1,  # System user
            reviewed_at=topic.created_at
        )
        await create_proposal(proposal)
```

### Step 4: Enable for All Users (Week 6)
- Set `KNOWLEDGE_PROPOSALS_ENABLED=true`
- Monitor for issues
- Gather user feedback

---

## Success Metrics

### Before Implementation
- **Duplicate Rate:** High (no detection)
- **Knowledge Quality:** Uncontrolled
- **User Trust:** Low (no review capability)
- **Manual Cleanup Time:** 2-4 hours/week
- **Goal Alignment:** 0% (creates noise)

### Target After Implementation
- **Duplicate Rate:** < 10% (with semantic detection)
- **Knowledge Quality:** User-controlled via review
- **User Trust:** High (transparency + control)
- **Manual Cleanup Time:** < 30 minutes/week
- **Goal Alignment:** 100% (consolidate THEN decide)

### KPIs to Track
1. **Proposal Approval Rate:** Target 70%+ (indicates good LLM accuracy)
2. **Auto-Approval Rate:** Target 50%+ (high-confidence proposals)
3. **Duplicate Detection Accuracy:** Target 85%+ (correct similar matches)
4. **Review Time per Proposal:** Target < 30 seconds
5. **Knowledge Base Growth Rate:** Should slow down (consolidation working)

---

## Risks & Mitigation

### Risk 1: Database Migration Fails
**Impact:** HIGH
**Mitigation:**
- Test migration on copy of production DB
- Create rollback script
- Schedule during low-traffic window

### Risk 2: Performance Degradation
**Impact:** MEDIUM
**Mitigation:**
- Add database indexes on status, confidence, extraction_run_id
- Implement pagination (max 100 proposals per page)
- Cache similarity calculations

### Risk 3: User Adoption Issues
**Impact:** MEDIUM
**Mitigation:**
- Provide clear onboarding tutorial
- Default to auto-approval for 0.95+ confidence
- Gather feedback early, iterate quickly

### Risk 4: LLM Accuracy Drops
**Impact:** MEDIUM
**Mitigation:**
- Monitor approval rate metrics
- Adjust confidence thresholds per entity type
- Allow manual confidence override

---

## Rollback Plan

If critical issues arise post-deployment:

1. **Immediate:** Set `KNOWLEDGE_PROPOSALS_ENABLED=false` (revert to old flow)
2. **Within 1 hour:** Investigate issue, fix if possible
3. **Within 24 hours:** If unfixable, revert database migration
4. **Within 1 week:** Post-mortem, plan fixes, schedule re-deployment

**Rollback Triggers:**
- API error rate > 5%
- Proposal creation time > 5 seconds
- Database connection pool exhaustion
- User-reported data loss

---

## Testing Strategy

### Unit Tests (90%+ coverage required)
- All service methods
- Duplicate detection algorithms
- Proposal state transitions

### Integration Tests
- API endpoints (all status codes)
- WebSocket events
- Background jobs

### E2E Tests (Playwright)
- Full review workflow (create → review → approve)
- Bulk operations
- Merge similar proposals
- Auto-approval flow

### Performance Tests
- 1000 proposals in database (page load time)
- 100 concurrent proposal creations
- Similarity search with 10k entities

### Load Testing (before production)
- Simulate 50 users reviewing proposals simultaneously
- Measure API response times under load
- Verify database query performance

---

## Documentation Updates

### User-Facing Docs
1. **Knowledge Proposals Guide** (`docs/content/en/knowledge-proposals.md`):
   - How to review proposals
   - Approval workflow
   - Merge duplicates
   - Confidence threshold explanation

2. **Knowledge Extraction Update** (`docs/content/en/knowledge-extraction.md`):
   - Update to reflect proposal workflow
   - Remove mention of direct creation
   - Add troubleshooting section

### Developer Docs
1. **API Reference** (auto-generated from OpenAPI)
2. **Service Architecture** (proposal flow diagram)
3. **Database Schema** (ERD with proposal tables)

---

## Open Questions (to resolve before starting)

1. **Confidence Thresholds:**
   - Should auto-approval threshold be configurable per user?
   - Different thresholds for Topics vs Atoms?

2. **Merge Strategy:**
   - When merging, keep older or newer entity?
   - How to handle conflicting metadata?

3. **Proposal Expiration:**
   - 30 days appropriate, or should it be configurable?
   - What happens to expired proposals (archive or delete)?

4. **Notifications:**
   - Email notifications for pending reviews?
   - Slack integration for high-confidence proposals?

---

## Next Steps (Immediate)

1. **Week 0 (Prep):**
   - [ ] Review this roadmap with team
   - [ ] Resolve open questions
   - [ ] Create GitHub project board
   - [ ] Set up feature branch: `feature/knowledge-proposals`

2. **Week 1 (Start Phase 0):**
   - [ ] Design database schema (collaborative session)
   - [ ] Write migration scripts
   - [ ] Get schema review and approval
   - [ ] Begin model implementation

3. **Ongoing:**
   - [ ] Daily standups (15 min)
   - [ ] Weekly progress review
   - [ ] Update roadmap as blockers arise

---

**Timeline Summary:**
- **Phase 0:** Week 1 (Database Foundation)
- **Phase 1:** Week 2 (Service Layer)
- **Phase 2:** Week 3 (API)
- **Phase 3:** Week 3-4 (Duplicate Detection)
- **Phase 4:** Week 4-5 (Frontend UI)
- **Phase 5:** Week 5-6 (Automation & Polish)

**Total Duration:** 6 weeks to full production-ready system

**Critical Path Items:** Database migration, service refactor, API endpoints, review UI

**Can be deferred if needed:** Auto-approval jobs, advanced merge UI, notification system

---

**Document Status:** Ready for team review and approval
**Last Updated:** October 23, 2025
**Next Review:** After Phase 0 completion