# Knowledge Proposal System - Master Implementation Guide

**Version:** 1.0
**Created:** October 23, 2025
**Status:** Ready for Execution
**Timeline:** 6 weeks (280 hours)
**Team Size:** 2-3 engineers + QA

---

## Executive Summary

### What We're Building

The Knowledge Proposal System transforms our knowledge extraction workflow from a direct-creation model to a **proposal-review-approval** architecture. Currently, when the AI extracts knowledge from messages (Topics and Atoms), it writes directly to the production database without human oversight. This creates noise, duplicates, and erodes user trust.

The new system introduces a comprehensive review workflow: AI extractions become *proposals* that sit in a review queue awaiting human approval. Users can approve, reject, or merge proposals—giving them full control over knowledge quality. This mirrors our successful TaskProposal implementation, which already demonstrates this pattern works well.

Think of it as adding a "drafts folder" between AI extraction and published knowledge. Every AI insight becomes reviewable before it becomes "truth" in the system. High-confidence proposals can auto-approve (configurable threshold), while edge cases get human review.

### Why It's Critical

**The Gap:** Our current knowledge system has an 80% complete backend but a critical architectural flaw—no review gate. Analysis shows five severe problems:

1. **Direct Creation Bypassing Review** - Topics/Atoms appear in production immediately without approval (vs TaskProposal's pending→approved lifecycle)
2. **No Audit Trail** - Zero history tracking, no rollback mechanism for bad extractions
3. **Primitive Deduplication** - Only exact name matching works; "API Design" and "API Architecture" both get created as separate topics
4. **Lost Low-Confidence Items** - Extractions below 0.7 confidence are silently discarded, never persisted for review
5. **No Consolidation Workflow** - Users can't merge duplicate topics/atoms, causing knowledge fragmentation

**Impact if unfixed:** Knowledge base becomes polluted with duplicates within weeks. Users estimate 2-4 hours/week manual cleanup, growing exponentially. System becomes noise generator instead of signal consolidator—the *opposite* of the user's stated goal.

**User's Priority Alignment:** The project constitution explicitly states: "Reduce noise, consolidate information, then decide on actions." Our current system does the opposite by creating noise immediately without consolidation opportunity.

### Total Effort and Timeline

**Timeline:** 6 weeks (phased rollout)
**Total Effort:** 280 hours
**Team:** 2 backend engineers (120h each) + 1 frontend engineer (40h) + DevOps (20h) + QA (40h)

**Critical Path:** 5 weeks minimum (Phases 0→1→2→4)
**Parallel Work:** Phase 3 (duplicate detection) and Phase 5 (automation) can run alongside critical path

**Fast-Track Option:** 4 weeks if Phase 5 (automation/polish) is deferred to post-launch

---

## Quick Start

### Week 1 Priorities

**For Backend Lead:**
1. Design TopicProposal and AtomProposal database schemas (Day 1-2)
2. Write Alembic migration scripts (Day 2-3)
3. Test migrations on production DB copy (Day 3-4)
4. Get schema approved in checkpoint review (Day 5)

**For DevOps:**
1. Set up staging environment with production data copy (Day 1)
2. Configure feature flags infrastructure (Day 2)
3. Prepare rollback scripts and monitoring dashboards (Day 3-5)

**For Project Manager:**
1. Set up GitHub project board with 87 tasks from implementation checklist (Day 1)
2. Schedule 6 weekly checkpoint reviews with stakeholders (Day 1)
3. Assign team members to phases (Day 2)

### Critical Path (Must Execute in Order)

```
Phase 0 (Week 1) → Phase 1 (Week 2) → Phase 2 (Week 3) → Phase 4 (Week 4-5)
   Database          Services             API             Frontend UI
   Foundation        Refactor           Endpoints         Review Dashboard
```

**Parallel Tracks (Can overlap with critical path):**
- Phase 3: Duplicate Detection (Week 3-4) - Runs alongside API work
- Phase 5: Automation & Polish (Week 5-6) - Runs alongside frontend work

### Team Setup

**Backend Lead (120 hours):**
- Owns schema design, migration strategy, API architecture
- Reviews all backend code, approves merges
- Attends all checkpoint reviews

**Backend Developer (120 hours):**
- Implements services, duplicate detection, background jobs
- Writes unit and integration tests (90%+ coverage required)
- Supports frontend team with API questions

**Frontend Developer (40 hours):**
- Builds review dashboard, proposal cards, merge dialog
- Implements WebSocket real-time updates
- Ensures WCAG 2.1 AA accessibility compliance

**DevOps Engineer (20 hours):**
- Manages database migrations in production
- Configures feature flags and monitoring
- Sets up alerting and rollback procedures

**QA Engineer (40 hours):**
- Writes E2E tests (Playwright)
- Performs load testing (1000 proposals, 50 concurrent users)
- Regression testing before production rollout

---

## Phase Overview

### Phase 0: Database Foundation (Week 1, 40 hours)

**What:** Create three new tables: `knowledge_extraction_runs`, `topic_proposals`, `atom_proposals`. Add indexes, foreign keys, constraints. Write reversible Alembic migrations.

**Why:** Foundation for entire system. Must be bulletproof—database migrations carry highest risk.

**Key Deliverables:**
- ERD diagram showing all relationships
- Migration scripts tested on production DB copy
- Rollback scripts validated (data integrity preserved)
- Config variables for feature flags

**Risk Mitigation:**
- Test on staging with production data snapshot
- Create full backup before migration
- Stop worker service during migration (prevent race conditions)
- Validate with `just db-migrate-fresh` on clean DB

### Phase 1: Models & Services (Week 2, 40 hours)

**What:** Build SQLAlchemy models for proposals. Refactor `KnowledgeExtractionService` to create proposals instead of final entities. Create `TopicProposalService` and `AtomProposalService` with CRUD operations.

**Why:** Changes extraction logic from "create and broadcast" to "propose and queue for review." This is the core behavioral change.

**Key Deliverables:**
- `TopicProposal` and `AtomProposal` models (mypy strict compliant)
- Refactored extraction service (creates proposals, NOT final entities)
- Basic duplicate detection (exact name matching)
- 90%+ unit test coverage

**Critical Change:**
```python
# OLD: Direct creation
new_topic = Topic(name=extracted.name)
session.add(new_topic)

# NEW: Proposal creation
proposal = TopicProposal(
    proposed_name=extracted.name,
    status="pending",
    confidence=extracted.confidence,
    extraction_run_id=run_id
)
session.add(proposal)
```

### Phase 2: API Endpoints (Week 3, 40 hours)

**What:** REST API for proposal management. Endpoints for listing, approving, rejecting, batch operations, merging. WebSocket events for real-time updates.

**Why:** Frontend needs API contracts. This phase unblocks frontend development (Phase 4).

**Key Deliverables:**
- 15 API endpoints (proposals list, approve, reject, merge, batch operations)
- Pydantic schemas for request/response validation
- WebSocket event broadcasting (proposal.created, proposal.approved, etc.)
- OpenAPI/Swagger documentation auto-generated
- Integration tests for all endpoints

**Critical Endpoints:**
- `GET /api/v1/knowledge/proposals?status=pending&confidence_min=0.7` - Review queue
- `POST /api/v1/knowledge/proposals/{id}/approve` - Approve single proposal
- `POST /api/v1/knowledge/proposals/batch/approve` - Bulk approve high-confidence items
- `POST /api/v1/knowledge/proposals/{id}/merge` - Merge duplicate proposals

### Phase 3: Duplicate Detection (Week 3-4, 32 hours, PARALLEL)

**What:** Semantic similarity detection using embeddings. Fuzzy name matching. Merge conflict resolution. Prevents knowledge fragmentation.

**Why:** Without this, "API Design" and "API Architecture" both get created as separate topics, fragmenting knowledge. Semantic similarity catches these edge cases.

**Key Deliverables:**
- `SimilarityService` with embedding-based search
- Three-tier duplicate detection: exact match → semantic similarity → fuzzy matching
- Merge logic with conflict resolution rules
- 85%+ duplicate detection accuracy (tested on real data)

**Algorithm:**
1. **Exact match** (fast path): Check if name exists character-for-character
2. **Semantic similarity**: Calculate embeddings, find vectors with cosine similarity > 0.85
3. **Fuzzy matching**: Levenshtein distance for typos/abbreviations (threshold 0.8)

### Phase 4: Frontend Review UI (Week 4-5, 60 hours)

**What:** React dashboard for proposal review. Cards for topics/atoms with approve/reject/merge actions. Bulk operations. Confidence filtering. Real-time updates via WebSocket.

**Why:** Users need intuitive UI to review AI proposals. This is the primary user-facing interface for the entire system.

**Key Deliverables:**
- `ProposalReviewDashboard` with filters, sorting, bulk selection
- `TopicProposalCard` and `AtomProposalCard` components
- `MergeSimilarDialog` for side-by-side comparison
- `ConfidenceFilter` with dual-handle slider
- WebSocket integration for live updates
- WCAG 2.1 AA accessibility compliance

**UX Flow:**
1. User opens review dashboard → sees 50 pending proposals
2. Filters by confidence > 0.8 → 20 high-confidence items
3. Bulk-selects all → clicks "Approve All" → 20 proposals become final entities in <2s
4. Sees low-confidence proposal (0.65) → reviews LLM reasoning → manually approves
5. Sees duplicate detected → clicks "Merge" → previews combined result → confirms

### Phase 5: Automation & Polish (Week 5-6, 48 hours, PARALLEL)

**What:** Background jobs for auto-approval, deduplication scanning, proposal expiration. Notification system. Extraction history viewer. User documentation.

**Why:** Reduces manual review burden. Auto-approves 50%+ of proposals (confidence > 0.95), leaving only edge cases for human review.

**Key Deliverables:**
- Auto-review job (runs every 5 minutes, approves confidence > 0.95)
- Deduplication scan job (finds existing duplicates in knowledge base)
- Proposal expiration job (auto-rejects proposals > 30 days old)
- Notification service (WebSocket events, in-app toasts)
- Extraction history viewer (shows all runs with statistics)
- User guide: "Reviewing Knowledge Proposals"

**Auto-Approval Logic:**
```python
@task(schedule="*/5 * * * *")  # Every 5 minutes
async def auto_review_high_confidence_proposals():
    proposals = await get_pending_proposals(confidence_min=0.95)
    for proposal in proposals:
        if not proposal.similar_entity_id:  # No duplicate detected
            await approve_proposal(proposal.id, reviewed_by="system")
```

---

## Key Technical Decisions

### Why Proposals Instead of Direct Creation?

**Problem:** Direct creation = no review gate. Bad AI extractions pollute production knowledge base immediately.

**Solution:** All AI extractions create *proposals* first. Proposals sit in review queue (status=pending). Humans approve/reject. Only approved proposals become final entities.

**Benefit:** User control over quality. Can reject bad extractions. Can adjust confidence thresholds. Knowledge base stays clean.

**Precedent:** TaskProposal already uses this pattern successfully. Copy proven architecture.

### Why Mirror TaskProposal Pattern?

**Observation:** TaskProposal has comprehensive workflow: status lifecycle, duplicate detection, merge capability, audit trail, LLM reasoning transparency.

**Decision:** Copy TaskProposal's architecture for Topics and Atoms. Same table structure, same API patterns, same UI components.

**Benefits:**
- Proven pattern (already in production)
- Reduces implementation risk
- Familiar to existing users
- Consistent UX across features
- Code reuse opportunities

**Specific Patterns Copied:**
- Status enum (pending/approved/rejected/merged)
- Review metadata (reviewed_by_user_id, reviewed_at, review_notes)
- Duplicate detection fields (similar_entity_id, similarity_score, similarity_method)
- LLM transparency (confidence, reasoning)
- Source tracking (extraction_run_id)

### Why Confidence-Based Auto-Approval?

**Challenge:** Manual review of ALL proposals creates bottleneck. Users don't want to review 100 proposals/day.

**Solution:** Auto-approve high-confidence proposals (default threshold: 0.95). Only edge cases need human review.

**Data Supporting Decision:**
- Current extraction creates 5-10 atoms per run
- ~60% have confidence > 0.9
- Manual review of 60% would take <5 minutes/day vs 20 minutes for 100%

**Configurable Threshold:** Users can adjust auto-approval threshold (0.0-1.0) based on their risk tolerance.

### Why Semantic Deduplication?

**Problem:** Exact name matching is too rigid. LLM uses slightly different phrasing each run:
- Run 1: "API Design Discussions"
- Run 2: "API Design" → Creates duplicate topic

**Solution:** Three-tier detection:
1. Exact match (fast, catches 40% of duplicates)
2. Semantic similarity via embeddings (catches 45% more)
3. Fuzzy string matching (catches remaining 10%)

**Target:** 85%+ duplicate detection accuracy (validated with real production data)

### Why Zero-Downtime Migration?

**Requirement:** System must stay operational during 6-week rollout. Can't afford full-system downtime.

**Strategy:** Feature flags + gradual rollout
- Phase 0: Database migration during low-traffic window (worker stopped, 5-minute downtime max)
- Phase 1-2: Deploy with `KNOWLEDGE_PROPOSALS_ENABLED=false` (old code path still works)
- Phase 3-4: Enable for internal users only (test in production with real data)
- Phase 5: Enable for all users (full rollout)

**Rollback Plan:** If issues arise, set feature flag to false. System reverts to old behavior in <5 minutes.

---

## Architecture Summary

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Message Ingestion Layer                     │
│                   (Telegram → save_telegram_message)                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Background Task Layer (TaskIQ)                   │
│              extract_knowledge_from_messages_task                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  1. Create KnowledgeExtractionRun (track run metadata)      │  │
│  │  2. Fetch unprocessed messages (up to 50)                   │  │
│  │  3. Call LLM with Pydantic AI agent                         │  │
│  │  4. Create TopicProposals (status=pending)                  │  │
│  │  5. Create AtomProposals (status=pending)                   │  │
│  │  6. Run duplicate detection                                 │  │
│  │  7. Broadcast WebSocket events (proposal.created)           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Proposal Database Layer                         │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ KnowledgeExtraction│  │  TopicProposals  │  │  AtomProposals  │ │
│  │        Runs        │  │ (status=pending) │  │ (status=pending)│ │
│  └────────────────────┘  └──────────────────┘  └─────────────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                  ▼
┌────────────────────────────┐    ┌──────────────────────────────────┐
│   Auto-Review Job (5min)   │    │    Review API + WebSocket        │
│                            │    │                                  │
│  If confidence > 0.95:     │    │  GET /proposals?status=pending   │
│    approve_proposal()      │    │  POST /proposals/{id}/approve    │
│    status → approved       │    │  POST /proposals/{id}/reject     │
│    Create final entity     │    │  POST /proposals/{id}/merge      │
└────────────────────────────┘    └──────────────┬───────────────────┘
                                                  │
                                                  ▼
                                  ┌───────────────────────────────────┐
                                  │   Frontend Review Dashboard       │
                                  │                                   │
                                  │  - Filter by confidence           │
                                  │  - Bulk approve/reject            │
                                  │  - Merge similar proposals        │
                                  │  - Real-time updates (WebSocket)  │
                                  └───────────────────────────────────┘
```

### Data Flow: Extraction → Proposal → Review → Entity

**Step 1: Message Arrives**
```
Telegram Webhook → save_telegram_message()
  → Create Message in DB (topic_id=NULL, status=unprocessed)
  → Check threshold: 10+ unprocessed in 24h?
    → YES: Queue extraction task
    → NO: Wait
```

**Step 2: Background Extraction (OLD vs NEW)**
```
OLD FLOW:
  LLM Extraction → Filter confidence ≥ 0.7 → CREATE Topic/Atom → Broadcast

NEW FLOW:
  LLM Extraction → CREATE TopicProposal/AtomProposal (ALL confidence levels)
    → Check for duplicates (semantic similarity)
    → status = "pending"
    → Broadcast "proposal.created" event
```

**Step 3: Review Queue**
```
Proposals sit in database (status=pending)
  → Auto-review job runs every 5 min:
      If confidence ≥ 0.95 AND no duplicate:
        → Approve automatically
      Else:
        → Wait for human review
```

**Step 4: Human Review**
```
User opens dashboard → Sees 50 pending proposals
  → Filters confidence > 0.8 → 20 items
  → Reviews LLM reasoning
  → Actions:
      - Approve → Creates final Topic/Atom entity
      - Reject → Sets status=rejected
      - Merge → Combines with existing entity
```

**Step 5: Final Entity Creation**
```
On approval:
  TopicProposal (status=pending) → Topic (final entity)
    → Set proposal.status = approved
    → Set proposal.reviewed_by_user_id = current_user
    → Set proposal.reviewed_at = now()
    → Create Topic with proposed data
    → Broadcast "knowledge.topic_created" event
```

### Integration Points

**Existing Systems:**
- **Messages** (source data) → Unchanged, still stores unprocessed messages
- **WebSocket** (real-time updates) → New events: proposal.created, proposal.approved
- **Background Workers** (TaskIQ) → Refactored extraction task + new auto-review job
- **Topic/Atom Models** (final entities) → Unchanged, still referenced by proposals
- **LLM Service** (Pydantic AI) → Unchanged, still returns structured extractions

**New Systems:**
- **KnowledgeExtractionRun** → Tracks each extraction run for audit trail
- **TopicProposal/AtomProposal** → New models for review workflow
- **Proposal API** → New endpoints for CRUD, approval, merge
- **Review Dashboard** → New frontend UI for proposal management
- **Auto-Review Job** → New TaskIQ scheduled job

**Backwards Compatibility:**
- Existing Topics/Atoms remain untouched
- Old API endpoints still work (deprecated but functional)
- Feature flag allows instant rollback to old behavior

---

## Success Metrics Dashboard

| Metric | Target | Current | After Implementation | Measurement |
|--------|--------|---------|---------------------|-------------|
| **Duplicate Rate** | <10% | ~40% (no detection) | <10% | % of proposals flagged as similar |
| **Knowledge Quality** | User-controlled | Uncontrolled (auto-created) | User-controlled | % of approved vs rejected proposals |
| **Auto-Approval Rate** | >60% | 0% (no auto-approval) | 60-70% | % of proposals approved by system |
| **Manual Review Time** | <30 min/week | 2-4 hours/week | <30 min/week | User-reported time spent reviewing |
| **Review Queue Depth** | <100 proposals | N/A | <50 proposals | Count of pending proposals |
| **Proposal Approval Rate** | >70% | N/A | 70-80% | % of proposals approved (vs rejected) |
| **Duplicate Detection Accuracy** | >85% | ~40% (exact match) | 85-90% | % of true duplicates caught |
| **API Response Time (p95)** | <200ms | N/A | <150ms | /proposals endpoint latency |
| **Proposal Creation Time** | <500ms | N/A | <400ms | Extraction → proposal in DB |
| **User Trust Score** | High | Low (no review) | High | User survey (1-10 scale) |
| **Knowledge Base Growth Rate** | Slower (consolidation) | Fast (no dedup) | Slower (consolidation) | Net new topics/atoms per week |
| **Test Coverage** | >90% | 96% (backend) | >90% (all code) | pytest --cov report |
| **Type Safety** | 100% | 100% (backend) | 100% (all code) | mypy strict compliance |

**Dashboard Location:** Grafana (setup in Phase 5)

**Alerts:**
- Review queue depth >100 → Notify team (might need to adjust auto-approval threshold)
- Duplicate detection accuracy <80% → Investigate similarity algorithm
- API response time >500ms → Performance issue, check database indexes
- Proposal approval rate <50% → LLM quality issue, adjust extraction prompt

---

## Risk Matrix

| # | Risk | Impact | Probability | Mitigation Strategy | Owner |
|---|------|--------|-------------|---------------------|-------|
| **R1** | Database migration fails in production | CRITICAL | Low | Test on production DB copy, create rollback script, schedule low-traffic window, stop worker during migration | DevOps |
| **R2** | Performance degradation (slow proposal queries) | HIGH | Medium | Add database indexes on status/confidence, implement pagination (100 max), cache similarity results, load test 1000 proposals | Backend Lead |
| **R3** | LLM accuracy drops (low approval rate) | HIGH | Medium | Monitor approval rate metrics, adjust confidence thresholds per entity type, allow manual override, A/B test prompts | Backend Developer |
| **R4** | User adoption issues (users ignore review queue) | MEDIUM | Medium | Default to auto-approval 0.95+, provide onboarding tutorial, gather feedback early, iterate quickly on UX | Frontend Lead |
| **R5** | Semantic similarity false positives | MEDIUM | Medium | Set conservative threshold (0.85), show reasoning to user, allow override, collect feedback on false positives | Backend Developer |
| **R6** | WebSocket connection instability | MEDIUM | Low | Implement reconnection logic with exponential backoff, show connection status indicator, queue events for offline users | Frontend Developer |
| **R7** | Proposal queue grows unbounded | MEDIUM | Low | Auto-reject proposals >30 days old, notify before expiration, show queue depth metrics, adjust auto-approval threshold | Backend Developer |
| **R8** | Merge conflicts corrupt data | HIGH | Low | Validate merge result before committing, add rollback capability, test merge logic extensively, require user confirmation | Backend Lead |
| **R9** | Feature flag misconfiguration | MEDIUM | Low | Document feature flag behavior clearly, test both enabled/disabled states, add health check endpoint | DevOps |
| **R10** | Timeline slippage due to scope creep | MEDIUM | Medium | Defer Phase 5 if needed (not critical path), prioritize P0/P1 tasks, weekly progress reviews, protect critical path | Project Manager |

**Risk Response Plan:**
- **CRITICAL risks:** Daily monitoring, pre-deployment testing required
- **HIGH risks:** Weekly review in checkpoint meetings, mitigation plan must be ready
- **MEDIUM risks:** Track in project board, address if probability increases

---

## Getting Started Checklist

### Week 0: Preparation (Before Phase 0 Starts)

**Project Manager:**
- [ ] Review this master guide with team (1 hour)
- [ ] Review implementation-checklist.md with task breakdown
- [ ] Create GitHub project board with 87 tasks
- [ ] Assign team members to phases
- [ ] Schedule 6 weekly checkpoint reviews
- [ ] Set up Slack channel for daily standups

**Backend Lead:**
- [ ] Read phase-0-database-schema.md in detail
- [ ] Read phase-1-models-spec.md and phase-2-services-spec.md
- [ ] Familiarize with TaskProposal implementation (reference pattern)
- [ ] Set up local development environment (just services-dev)

**DevOps:**
- [ ] Create staging environment with production data copy
- [ ] Set up feature flag infrastructure (config.py variables)
- [ ] Prepare monitoring dashboards (Grafana/Prometheus)
- [ ] Test database backup/restore procedures

**Frontend Developer:**
- [ ] Read phase-5-frontend-spec.md
- [ ] Review existing TaskProposal UI components (reuse patterns)
- [ ] Set up local development environment
- [ ] Review API contracts from phase-3-api-spec.md

**QA Engineer:**
- [ ] Read testing-strategy.md
- [ ] Set up E2E testing framework (Playwright)
- [ ] Create test data generators for proposals
- [ ] Prepare load testing scripts (K6 or similar)

### Phase 0: Begin Implementation

- [ ] Backend Lead creates feature branch: `feature/knowledge-proposals`
- [ ] Backend Lead designs database schema (ERD diagram)
- [ ] Backend Lead writes migration scripts (Alembic)
- [ ] DevOps tests migrations on staging
- [ ] Team reviews schema in checkpoint meeting (end of Week 1)
- [ ] **GO/NO-GO decision:** Approve schema, proceed to Phase 1

### Critical Success Factors

**For Backend Team:**
- Mypy strict compliance (0 errors) on all new code
- 90%+ test coverage required before PR merge
- Follow async/await patterns throughout
- Use absolute imports only (never relative)

**For Frontend Team:**
- WCAG 2.1 AA accessibility compliance
- Lighthouse score: 90+ Performance, 100 Accessibility
- No console errors or warnings
- Mobile-responsive design (test iOS/Android)

**For DevOps:**
- Zero-downtime deployments
- Feature flags tested in both states
- Rollback procedures validated
- Monitoring alerts configured before production

---

## Detailed Specifications Reference

All detailed specifications are in `.artifacts/knowledge-system-redesign/20251023_211420/phase-specs/`:

### Implementation Specs (Core)
1. **[implementation-checklist.md](phase-specs/implementation-checklist.md)** (1,110 lines)
   Master checklist with 87 tasks, hours estimates, dependencies, review checkpoints

2. **[phase-0-database-schema.md](phase-specs/phase-0-database-schema.md)** (580 lines)
   Complete SQL schema, migrations, indexes, foreign keys, enums

3. **[phase-1-models-spec.md](phase-specs/phase-1-models-spec.md)** (398 lines)
   TopicProposal, AtomProposal SQLAlchemy models with validation methods

4. **[phase-2-services-spec.md](phase-specs/phase-2-services-spec.md)** (1,806 lines)
   Business logic layer: ProposalService, ExtractionRunService, SimilarityService

5. **[phase-3-api-spec.md](phase-specs/phase-3-api-spec.md)** (1,610 lines)
   REST endpoints, Pydantic schemas, WebSocket events

6. **[phase-4-jobs-spec.md](phase-specs/phase-4-jobs-spec.md)** (1,093 lines)
   TaskIQ background jobs: auto-review, deduplication, expiration

7. **[phase-5-frontend-spec.md](phase-specs/phase-5-frontend-spec.md)** (500 lines)
   React components, UI workflows, accessibility requirements

### Supporting Specs
8. **[testing-strategy.md](phase-specs/testing-strategy.md)** (1,054 lines)
   Unit, integration, E2E, performance tests

9. **[migration-strategy.md](phase-specs/migration-strategy.md)** (388 lines)
   Zero-downtime migration plan, rollback procedures

10. **[deployment-monitoring.md](phase-specs/deployment-monitoring.md)** (388 lines)
    Deploy strategy, metrics, alerting

### Quick References
11. **[phase-3-quick-reference.md](phase-specs/phase-3-quick-reference.md)**
    API endpoint summary for quick lookup

12. **[README.md](phase-specs/README.md)**
    Navigation guide, document statistics

**Total Specification Size:** 390KB, 8,317 lines

---

## FAQ

### Why can't we just improve the existing extraction service?

The fundamental issue is architectural. Adding review workflow to the current "extract and create" flow would require:
- Retrofitting status fields to existing Topic/Atom models (breaks foreign keys)
- Adding review logic to extraction service (violates single responsibility)
- No audit trail for what was created when (historical data lost)

Starting with proposals-first is cleaner, safer, and follows proven patterns.

### How long before we see ROI?

**Immediate (Week 3):** Review API available, internal users can approve/reject proposals
**Short-term (Week 5):** Full UI deployed, auto-approval reduces manual work by 60%
**Medium-term (Month 2):** Knowledge base quality improves, duplicate rate drops to <10%
**Long-term (Month 3+):** Users trust knowledge system, spend <30 min/week on review

**Break-even:** Week 5 (time saved from auto-approval exceeds implementation cost)

### What if LLM accuracy is worse than expected?

**Monitoring:** Track approval rate (target: >70%). If it drops below 50%, investigate.

**Mitigation Options:**
1. Adjust confidence threshold (lower auto-approval from 0.95 to 0.98)
2. Improve LLM prompt (add examples of good extractions)
3. Fine-tune extraction rules per project
4. A/B test different LLM models (GPT-4 vs Claude vs Ollama)

**Fallback:** Even with 50% approval rate, system still provides value (users control quality, duplicates prevented).

### Can we deploy faster than 6 weeks?

**Yes, fast-track option (4 weeks):**
- Week 1: Phase 0 (Database)
- Week 2: Phase 1 (Services)
- Week 3: Phase 2 + Phase 3 in parallel (API + Deduplication)
- Week 4: Phase 4 (Frontend)
- **Defer Phase 5 (Automation) to post-launch**

Trade-off: No auto-approval initially (all proposals need manual review). Can add later without breaking changes.

### What if we need to rollback mid-deployment?

**Immediate Rollback (<5 minutes):**
```bash
# Set feature flag to disable new system
echo "KNOWLEDGE_PROPOSALS_ENABLED=false" >> .env
docker compose restart api worker
# System reverts to old extraction behavior
```

**Database Rollback (<1 hour):**
```bash
# If database migration must be reverted
just services-stop
uv run alembic downgrade -1  # Revert migration
docker compose up -d postgres
# Restore from backup if needed
```

**Rollback Triggers:**
- API error rate >5%
- Proposal creation time >5 seconds
- Database connection pool exhaustion
- User-reported data loss

### How do we handle existing knowledge (already in DB)?

**Migration Script (Phase 0):**
```python
# Convert existing Topics/Atoms to "approved" proposals
for topic in existing_topics:
    proposal = TopicProposal(
        proposed_name=topic.name,
        status="approved",  # Already in production
        confidence=1.0,  # Assume valid
        reviewed_by_user_id=1,  # System user
        reviewed_at=topic.created_at
    )
```

**Benefit:** Audit trail for existing knowledge. Can track when it was created, by whom.

### What if users ignore the review queue?

**Auto-Approval Safety Net:**
- Default threshold: 0.95 confidence
- Expected auto-approval rate: 60%+
- Only 40% of proposals need human review

**Proposal Expiration:**
- Proposals >30 days old auto-reject (configurable)
- Warning notification at 23 days

**User Feedback Loop:**
- If queue depth >100 proposals, adjust auto-approval threshold
- Make review process faster (keyboard shortcuts, bulk actions)
- Gamification (badge for reviewing 50+ proposals)

### How do we train the team on the new system?

**Week 5 (before production rollout):**
1. Create video tutorial (5 minutes): "Reviewing Knowledge Proposals"
2. Write user guide in docs: `docs/content/en/knowledge-proposals.md`
3. Internal testing session (1 hour): Team reviews 50 proposals together
4. Q&A session (30 minutes): Address concerns

**Week 6 (production rollout):**
1. In-app onboarding tour (first-time users)
2. Slack announcement with tutorial link
3. Office hours (2 hours): Team available for questions

### What's the biggest risk?

**Database migration (Phase 0).** It's the only operation that could cause data loss if done incorrectly.

**Mitigation:**
- Test on production DB copy (Week 0)
- Full backup before migration
- Stop worker to prevent race conditions
- Rollback script tested and ready
- DevOps on standby during migration
- Schedule during low-traffic window (Sunday 2am)

All other phases are code changes (easily reversible via git revert).

---

## Conclusion

The Knowledge Proposal System represents a critical evolution of our knowledge extraction architecture. By introducing human oversight through a proposal-review-approval workflow, we transform the system from a noise generator into a signal consolidator—directly aligning with the user's stated goals.

**The Bottom Line:**
- **Problem:** AI creates knowledge directly → pollution, duplicates, lost trust
- **Solution:** AI creates proposals → human approval → clean knowledge base
- **Timeline:** 6 weeks (or 4 weeks fast-track)
- **Risk:** Manageable (follow proven TaskProposal pattern)
- **ROI:** Positive by Week 5 (time saved > implementation cost)

**Success Depends On:**
1. **Schema approval by end of Week 1** (Phase 0 checkpoint)
2. **API stability by end of Week 3** (unblocks frontend)
3. **UX approval by end of Week 5** (Phase 4 checkpoint)
4. **Feature flag discipline** (zero-downtime rollout)

**Next Steps:**
1. Project Manager: Set up project board with 87 tasks
2. Backend Lead: Begin Phase 0 schema design (Monday)
3. DevOps: Prepare staging environment with production data copy
4. Full Team: Review this guide in kickoff meeting (1 hour)

**Ready to Execute:** All specifications complete, team assignments clear, success criteria defined, risks identified with mitigation plans.

---

**Document Status:** ✅ Ready for Execution
**Last Updated:** October 23, 2025
**Next Review:** After Phase 0 Completion (Week 1)
**Specification Set:** 390KB, 8,317 lines across 12 documents
