# Epic: Product-Ready Task Tracker

**Status**: 🔄 In Progress
**Started**: 2025-10-27
**Target Completion**: 2025-11-24 (4 weeks)
**Current Readiness**: 6.8/10 → Target: 9.0/10

---

## Goal

Transform Task Tracker from "architecturally sound" to **"ready to sell"** - focusing on core LLM features (Topics, Knowledge Extraction), UX consistency, and feature completeness. This is NOT about infrastructure (CI/CD, deployment) but about **product value proposition**.

**Success Metric**: User can demo the system, understand the value (50x information reduction via Topics), and see working end-to-end flows.

---

## Core Value Proposition

**"AI-powered knowledge extraction from Telegram messages organized into Topics with 4-layer noise filtering"**

Users should experience:
1. ✅ Send Telegram message → auto-scored (noise/signal)
2. ✅ AI extracts knowledge → creates Atoms
3. ✅ Atoms organized into Topics (contextual spaces)
4. ✅ Dashboard shows 50x reduced information (only signals)
5. ✅ Semantic search finds related knowledge
6. ✅ Analysis system proposes actionable tasks

**Current Reality**: pgvector broken (0 embeddings), UX inconsistent, 214 failing tests, no specs

---

## Scope - Product-Focused Features

### Feature 1: Core LLM Infrastructure (BLOCKER)
**Priority**: P0 🔴 - Without this, product doesn't work
**Effort**: 6-8 hours
**Status**: ⏳ Pending

**Why**: pgvector is 100% broken (D- score), knowledge extraction non-functional
- 0 embeddings generated (all NULL in database)
- 0 vector indexes (sequential scan = 500ms+ queries)
- Semantic search returns random results
- Topic similarity matching impossible

**Deliverables**:
- Working pgvector indexes (HNSW)
- Auto-embedding generation pipeline active
- Query latency <50ms
- Semantic search returns relevant results

---

### Feature 2: UX/Accessibility Fixes (CRITICAL)
**Priority**: P0 🔴 - Legal compliance, excludes 15-40% users
**Effort**: 13 hours
**Status**: ⏳ Pending

**Why**: WCAG violations (60% vs 95% needed), mobile unusable, poor UX
- Color contrast 3.2:1 (need 4.5:1) - accessibility violation
- Touch targets 36x36px (need 44x44px) - mobile unusable
- DataTable doesn't work on mobile
- Keyboard navigation broken (Recent Messages)
- 20+ missing ARIA labels

**Deliverables**:
- WCAG 2.1 AA compliance (95%+)
- Mobile-responsive DataTable
- Keyboard navigation works
- Accessible forms & modals

---

### Feature 3: End-to-End Feature Consistency
**Priority**: P0 🔴 - Core flows broken/incomplete
**Effort**: 20-25 hours
**Status**: ⏳ Pending

**Why**: 87% features lack specs, flows inconsistent, unclear behavior
- Knowledge extraction flow unclear (when triggered? batching?)
- Topic versioning rules ambiguous (draft → approved?)
- Analysis system logic scattered (no single source of truth)
- Message scoring inconsistent (what's "noise" threshold?)

**Deliverables**:
- Documented & tested flows:
  - Telegram message → scoring → extraction → Topic creation
  - Topic versioning (draft/approved lifecycle)
  - Analysis run triggers & proposal generation
- Working demo scenario (end-to-end)
- Consistent UX across all features

---

### Feature 4: Test Reliability & Type Safety
**Priority**: P1 🟡 - Quality foundation
**Effort**: 10-12 hours
**Status**: ⏳ Pending

**Why**: 214 failing tests, 52 TypeScript errors, 55% coverage
- Cannot confidently release changes
- Runtime errors in production
- Poor developer experience

**Deliverables**:
- 0 failing tests (939 total pass)
- 0 TypeScript errors
- 75%+ test coverage
- Integration test suite for core flows

---

### Feature 5: Resilience & Data Safety
**Priority**: P1 🟡 - Data loss prevention
**Effort**: 6-8 hours
**Status**: ⏳ Pending

**Why**: NATS message loss risk (3.5/10 resilience score)
- No JetStream persistence enabled
- No webhook retry logic
- Connection pool exhaustion risk
- Failed tasks silently drop

**Deliverables**:
- NATS JetStream persistence active
- Webhook retry with exponential backoff
- PostgreSQL connection pool tuning
- Circuit breakers for external APIs

---

### Feature 6: Authentication & Security (LONG-TERM)
**Priority**: P2 🟢 - Required for production, not for demo
**Effort**: 20-40 hours
**Status**: ⏳ Pending (Phase 2)

**Why**: Zero auth layer, cannot sell without security
- All data exposed (no user isolation)
- No API authentication
- Security vulnerability

**Deliverables**:
- User authentication (JWT or OAuth2)
- API route protection
- Data isolation per user
- Role-based access control

**Note**: Deprioritized for MVP demo - can demo locally without auth

---

## Timeline (Product-Focused)

### Week 1: Core LLM + UX Foundations (19-21h)
**Goal**: Make product demonstrable
- **Feature 1**: pgvector infrastructure (6-8h)
- **Feature 2**: UX/Accessibility critical fixes (13h)
- **Outcome**: Can demo knowledge extraction + Topics working end-to-end

### Week 2: Feature Consistency + Testing (30-37h)
**Goal**: All flows work reliably
- **Feature 3**: End-to-end feature consistency (20-25h)
- **Feature 4**: Test reliability & TypeScript (10-12h)
- **Outcome**: 0 failing tests, documented flows, consistent UX

### Week 3: Resilience + Polish (6-8h)
**Goal**: Production-ready quality
- **Feature 5**: Resilience & data safety (6-8h)
- Code quality polish (remove dead code, comments)
- **Outcome**: No data loss risk, clean codebase

### Week 4: Auth + Final Integration (20-40h, OPTIONAL)
**Goal**: Security layer (if needed for sale)
- **Feature 6**: Authentication system (20-40h)
- Final integration testing
- **Outcome**: Ready for multi-user production

**Total Effort**: 55-66h (Weeks 1-3) + 20-40h (Week 4 optional) = **75-106 hours**

---

## Success Criteria

### Product Demo Readiness (after Week 2)
1. ✅ User sends Telegram message → system auto-scores as noise/signal
2. ✅ AI extracts knowledge → creates Atom
3. ✅ Atom organized into Topic (semantic similarity)
4. ✅ Dashboard shows Topics hierarchy with 50x reduced info
5. ✅ Semantic search finds related Atoms/Topics
6. ✅ Analysis system proposes actionable tasks
7. ✅ All UX flows work on mobile + desktop
8. ✅ 0 failing tests, 0 TypeScript errors
9. ✅ Documented flows (users understand how it works)
10. ✅ No data loss risk (resilience mechanisms)

### Production Launch Readiness (after Week 4)
11. ✅ Authentication & user isolation
12. ✅ API security
13. ✅ Ready for multi-user deployment

---

## Dependencies

### External
- OpenAI/Anthropic API (for embeddings & LLM)
  - Cost: $0.40-3/month for 200 messages/day
  - Already configured in .env

### Internal Prerequisites
- PostgreSQL with pgvector extension (✅ already installed)
- NATS JetStream (✅ already configured, needs persistence enabled)
- React 18 + TypeScript 5.9 (✅ already set up)
- Pydantic AI agents (✅ already implemented)

### Cross-Feature Dependencies
1. **Feature 1 (pgvector)** → **Feature 3 (consistency)**: Need working embeddings to test knowledge extraction flow
2. **Feature 2 (UX)** → **Feature 3 (consistency)**: Consistent UX requires accessible components
3. **Feature 4 (tests)** → **Feature 3 (consistency)**: Tests validate that flows work consistently
4. **Feature 5 (resilience)** → **Feature 3 (consistency)**: Reliable message processing required for demo

**Recommended Order**: Feature 1 → Feature 2 → Feature 3 → Feature 4 → Feature 5 → Feature 6

---

## Out of Scope (Deferred to Post-Launch)

These are important for production infrastructure but **NOT blockers for product demo**:

- ❌ CI/CD pipeline (manual deployment acceptable for demo)
- ❌ Monitoring/observability (Loguru logs sufficient)
- ❌ Performance optimization (current 1.8GB RAM acceptable)
- ❌ Horizontal scaling (200-300 msg/day comfortable)
- ❌ Backup automation (manual backups acceptable)
- ❌ Documentation polish (technical docs exist, user docs minimal)

**Rationale**: Focus on **product value** (working features, good UX) over **operations** (CI/CD, monitoring). Infrastructure comes after proving product-market fit.

---

## Risk Mitigation

### Risk 1: pgvector Fix Takes Longer Than Expected
**Mitigation**:
- Detailed audit already done (vector-search-report.md)
- Clear fix path: create HNSW indexes + trigger embedding generation
- Fallback: Demo with pre-seeded embeddings if real-time generation fails

### Risk 2: Feature Consistency Uncovers More Issues
**Mitigation**:
- Iterative approach: Fix one flow at a time
- Document each flow as we go
- Prioritize core flow (Telegram → Topic) over edge cases

### Risk 3: TypeScript/Test Fixes Reveal Deeper Problems
**Mitigation**:
- Fix tests incrementally (by feature, not all at once)
- TypeScript strict mode already enabled (issues known)
- 52 errors already catalogued in react-architect-report.md

---

## Notes

- This epic focuses on **product readiness**, not infrastructure readiness
- User can demo after Week 2 (55-66h effort)
- Authentication (Week 4) is optional for local demo
- All audit findings preserved in `.v01-production/` for reference
- Epic artifacts tracked in `.artifacts/product-ready-epic/`
