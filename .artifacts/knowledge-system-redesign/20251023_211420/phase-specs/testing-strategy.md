# Testing Strategy: Knowledge Proposal System

**Created:** October 23, 2025
**Phase:** All Phases (0-5)
**Target Coverage:** >90%
**Performance Target:** Proposal creation < 500ms

---

## Overview

Comprehensive testing strategy for Knowledge Proposal System migration from direct creation to proposal-review-approval workflow. Strategy aligns with existing test patterns (pytest-asyncio, FastAPI TestClient, SQLite in-memory) and ensures production readiness.

**Testing Philosophy:**
- Integration tests over unit tests for API functionality
- Async patterns throughout (pytest-asyncio)
- SQLite in-memory for fast test execution
- Mocked LLM calls with deterministic output
- Test fixtures for complex data scenarios
- Parametrized tests for multiple scenarios
- >90% coverage required before merge

---

## 1. Unit Tests for Models

### 1.1 TopicProposal Model Tests

**File:** `backend/tests/models/test_topic_proposal.py`

**Test Coverage:**
```python
class TestTopicProposal:
    """Unit tests for TopicProposal model."""

    @pytest.mark.asyncio
    async def test_create_topic_proposal_minimal(db_session):
        """Create proposal with minimal required fields."""

    @pytest.mark.asyncio
    async def test_create_topic_proposal_full(db_session):
        """Create proposal with all fields populated."""

    @pytest.mark.asyncio
    async def test_default_status_is_pending(db_session):
        """Verify default status is 'pending'."""

    @pytest.mark.asyncio
    async def test_confidence_validation(db_session):
        """Confidence must be 0.0-1.0 range."""

    @pytest.mark.asyncio
    async def test_extraction_run_foreign_key(db_session):
        """Verify FK constraint to KnowledgeExtractionRun."""

    @pytest.mark.asyncio
    async def test_similar_topic_foreign_key(db_session):
        """Verify FK constraint to existing Topic."""

    @pytest.mark.asyncio
    async def test_reviewed_fields_initially_null(db_session):
        """reviewed_by_user_id and reviewed_at start as null."""

    @pytest.mark.asyncio
    async def test_status_transitions(db_session):
        """Test valid status transitions: pending->approved/rejected/merged."""

    @pytest.mark.asyncio
    async def test_timestamps_auto_populated(db_session):
        """created_at set automatically."""
```

**Critical Validations:**
- Status enum validation (pending/approved/rejected/merged)
- Confidence bounds (0.0-1.0)
- Foreign key constraints (extraction_run_id, similar_topic_id, reviewed_by_user_id)
- Timestamp handling (created_at, reviewed_at)
- JSON field serialization (keywords, metadata)

### 1.2 AtomProposal Model Tests

**File:** `backend/tests/models/test_atom_proposal.py`

**Test Coverage:**
```python
class TestAtomProposal:
    """Unit tests for AtomProposal model."""

    @pytest.mark.asyncio
    async def test_create_atom_proposal_with_topics(db_session):
        """Create proposal with TopicProposal relationships."""

    @pytest.mark.asyncio
    async def test_atom_type_validation(db_session):
        """Validate atom type enum (problem/solution/decision/etc)."""

    @pytest.mark.asyncio
    async def test_similar_atom_detection_fields(db_session):
        """Test similar_atom_id and similarity_score fields."""

    @pytest.mark.asyncio
    async def test_source_message_tracking(db_session):
        """Verify source_message_ids stored in meta."""

    @pytest.mark.asyncio
    async def test_confidence_filtering(db_session):
        """Low-confidence atoms stored with pending status."""
```

**Critical Validations:**
- Atom type enum (7 types)
- TopicProposal relationships
- Similarity fields (similar_atom_id, similarity_score, similarity_type)
- Meta field structure (source, message_ids)
- Status transitions

### 1.3 KnowledgeExtractionRun Model Tests

**File:** `backend/tests/models/test_knowledge_extraction_run.py`

**Test Coverage:**
```python
class TestKnowledgeExtractionRun:
    """Unit tests for KnowledgeExtractionRun model."""

    @pytest.mark.asyncio
    async def test_create_extraction_run(db_session):
        """Create extraction run with config snapshot."""

    @pytest.mark.asyncio
    async def test_run_has_proposals(db_session):
        """Run can have multiple TopicProposal and AtomProposal."""

    @pytest.mark.asyncio
    async def test_run_status_tracking(db_session):
        """Track run status: started/completed/failed."""
```

**Critical Validations:**
- Run status tracking
- Config snapshot serialization
- Relationship to proposals (1:many)
- Timestamp tracking

---

## 2. Unit Tests for Services

### 2.1 TopicProposalService Tests

**File:** `backend/tests/services/test_topic_proposal_service.py`

**Test Coverage:**
```python
class TestTopicProposalService:
    """Unit tests for TopicProposalService."""

    @pytest.mark.asyncio
    async def test_create_proposal(db_session):
        """Create topic proposal from extraction data."""

    @pytest.mark.asyncio
    async def test_list_proposals_with_filters(db_session):
        """List proposals filtered by status, confidence."""

    @pytest.mark.asyncio
    async def test_get_proposal_by_id(db_session):
        """Retrieve single proposal."""

    @pytest.mark.asyncio
    async def test_update_proposal(db_session):
        """Update proposal fields."""

    @pytest.mark.asyncio
    async def test_approve_proposal_creates_topic(db_session):
        """Approving proposal creates final Topic entity."""

    @pytest.mark.asyncio
    async def test_reject_proposal_does_not_create_topic(db_session):
        """Rejecting proposal leaves no Topic."""

    @pytest.mark.asyncio
    async def test_merge_proposal_with_existing_topic(db_session):
        """Merge proposal updates existing Topic metadata."""

    @pytest.mark.asyncio
    async def test_batch_approve_high_confidence(db_session):
        """Bulk approve proposals above threshold."""
```

**Critical Logic:**
- CRUD operations (create, read, update, delete)
- Filtering (status, confidence, extraction_run_id)
- Approval workflow (creates final Topic entity)
- Rejection workflow (marks status, no creation)
- Merge workflow (updates existing Topic)
- Batch operations

### 2.2 AtomProposalService Tests

**File:** `backend/tests/services/test_atom_proposal_service.py`

**Test Coverage:**
```python
class TestAtomProposalService:
    """Unit tests for AtomProposalService."""

    @pytest.mark.asyncio
    async def test_create_atom_proposal_with_topics(db_session):
        """Create atom proposal linked to topic proposals."""

    @pytest.mark.asyncio
    async def test_approve_creates_atom_and_relationships(db_session):
        """Approval creates Atom + TopicAtom + AtomLink."""

    @pytest.mark.asyncio
    async def test_reject_marks_status_only(db_session):
        """Rejection changes status, no entity creation."""

    @pytest.mark.asyncio
    async def test_list_by_topic_proposal(db_session):
        """Filter atom proposals by topic proposal."""

    @pytest.mark.asyncio
    async def test_list_by_atom_type(db_session):
        """Filter by atom type (problem/solution/etc)."""
```

**Critical Logic:**
- Relationship management (TopicProposal, AtomProposal, AtomLink)
- Approval creates multiple entities atomically
- Filtering by topic, type, confidence
- Batch approval with validation

### 2.3 KnowledgeExtractionService Refactor Tests

**File:** `backend/tests/services/test_knowledge_extraction_service_proposals.py`

**Test Coverage:**
```python
class TestKnowledgeExtractionServiceProposals:
    """Tests for refactored extraction service (creates proposals)."""

    @pytest.mark.asyncio
    async def test_extract_creates_proposals_not_entities(db_session, mock_llm):
        """Extraction creates proposals, NOT final Topics/Atoms."""

    @pytest.mark.asyncio
    async def test_low_confidence_items_persisted_as_pending(db_session, mock_llm):
        """Items below 0.7 confidence stored with status='pending'."""

    @pytest.mark.asyncio
    async def test_extraction_run_tracking(db_session, mock_llm):
        """Each extraction creates KnowledgeExtractionRun."""

    @pytest.mark.asyncio
    async def test_all_proposals_have_extraction_run_id(db_session, mock_llm):
        """All proposals reference extraction_run_id."""

    @pytest.mark.asyncio
    async def test_duplicate_detection_populates_similar_fields(db_session, mock_llm):
        """Duplicate detection sets similar_topic_id/similar_atom_id."""

    @pytest.mark.asyncio
    async def test_extraction_with_existing_topics(db_session, mock_llm):
        """Extraction detects existing topics as similar."""
```

**Critical Changes:**
- Extraction creates proposals, NOT final entities
- Low-confidence items persisted (not skipped)
- Run tracking implemented
- Duplicate detection integrated

### 2.4 SimilarityService Tests

**File:** `backend/tests/services/test_similarity_service.py`

**Test Coverage:**
```python
class TestSimilarityService:
    """Tests for duplicate detection and similarity scoring."""

    @pytest.mark.asyncio
    async def test_exact_name_match_returns_1_0_score(db_session):
        """Exact name match returns score=1.0, type='exact'."""

    @pytest.mark.asyncio
    async def test_semantic_similarity_above_threshold(db_session, mock_embeddings):
        """Semantic match returns score>0.85, type='semantic'."""

    @pytest.mark.asyncio
    async def test_fuzzy_name_matching(db_session):
        """Fuzzy match catches typos/abbreviations."""

    @pytest.mark.asyncio
    async def test_no_match_returns_none(db_session):
        """No similar entity returns (None, 0.0, 'none')."""

    @pytest.mark.asyncio
    async def test_search_existing_topics_and_proposals(db_session):
        """Search includes both final Topics and TopicProposals."""

    @pytest.mark.asyncio
    async def test_performance_under_500ms(db_session):
        """Similarity check completes in <500ms."""
```

**Critical Logic:**
- Three-tier matching (exact -> semantic -> fuzzy)
- Threshold-based scoring
- Search scope (entities + proposals)
- Performance requirements

---

## 3. Integration Tests for API Endpoints

### 3.1 Topic Proposal API Tests

**File:** `backend/tests/api/v1/test_topic_proposals.py`

**Test Coverage:**
```python
class TestTopicProposalsAPI:
    """Integration tests for topic proposal endpoints."""

    @pytest.mark.asyncio
    async def test_list_topic_proposals(client, db_session):
        """GET /api/v1/knowledge/topics/proposals"""

    @pytest.mark.asyncio
    async def test_list_filtered_by_status(client, db_session):
        """GET /api/v1/knowledge/topics/proposals?status=pending"""

    @pytest.mark.asyncio
    async def test_list_filtered_by_confidence(client, db_session):
        """GET /api/v1/knowledge/topics/proposals?confidence_min=0.7"""

    @pytest.mark.asyncio
    async def test_get_topic_proposal_by_id(client, db_session):
        """GET /api/v1/knowledge/topics/proposals/{id}"""

    @pytest.mark.asyncio
    async def test_approve_topic_proposal_creates_topic(client, db_session):
        """POST /api/v1/knowledge/topics/proposals/{id}/approve"""

    @pytest.mark.asyncio
    async def test_reject_topic_proposal(client, db_session):
        """POST /api/v1/knowledge/topics/proposals/{id}/reject"""

    @pytest.mark.asyncio
    async def test_batch_approve_proposals(client, db_session):
        """POST /api/v1/knowledge/topics/proposals/batch/approve"""

    @pytest.mark.asyncio
    async def test_merge_with_existing_topic(client, db_session):
        """POST /api/v1/knowledge/proposals/{id}/merge"""

    @pytest.mark.asyncio
    async def test_approve_returns_created_topic_id(client, db_session):
        """Approval response includes created topic_id."""

    @pytest.mark.asyncio
    async def test_approve_twice_returns_409_conflict(client, db_session):
        """Cannot approve already-approved proposal."""
```

**Test Scenarios:**
- List with pagination (skip, limit)
- Filtering (status, confidence, extraction_run_id)
- Single approve/reject
- Batch operations
- Merge duplicates
- Error handling (404, 409, 422)
- Response schemas

### 3.2 Atom Proposal API Tests

**File:** `backend/tests/api/v1/test_atom_proposals.py`

**Test Coverage:**
```python
class TestAtomProposalsAPI:
    """Integration tests for atom proposal endpoints."""

    @pytest.mark.asyncio
    async def test_list_atom_proposals(client, db_session):
        """GET /api/v1/knowledge/atoms/proposals"""

    @pytest.mark.asyncio
    async def test_list_by_topic_proposal(client, db_session):
        """GET /api/v1/knowledge/atoms/proposals?topic_proposal_id={id}"""

    @pytest.mark.asyncio
    async def test_approve_atom_proposal_creates_atom(client, db_session):
        """POST /api/v1/knowledge/atoms/proposals/{id}/approve"""

    @pytest.mark.asyncio
    async def test_approve_creates_topic_atom_link(client, db_session):
        """Approval creates TopicAtom relationship."""

    @pytest.mark.asyncio
    async def test_approve_creates_atom_links(client, db_session):
        """Approval creates AtomLink relationships."""

    @pytest.mark.asyncio
    async def test_batch_approve_high_confidence_atoms(client, db_session):
        """POST /api/v1/knowledge/atoms/proposals/batch/approve"""
```

**Test Scenarios:**
- List with filters (topic, type, confidence)
- Approval workflow (creates Atom + relationships)
- Batch approval with threshold
- Error cases (missing topic, invalid type)

### 3.3 Extraction Trigger API Tests

**File:** `backend/tests/api/v1/test_knowledge_extraction_proposals.py`

**Test Coverage:**
```python
class TestKnowledgeExtractionProposalsAPI:
    """Tests for refactored extraction API (creates proposals)."""

    @pytest.mark.asyncio
    async def test_trigger_extraction_creates_proposals(client, db_session, mock_llm):
        """POST /api/v1/knowledge/extract creates proposals."""

    @pytest.mark.asyncio
    async def test_extraction_run_recorded(client, db_session, mock_llm):
        """Extraction creates KnowledgeExtractionRun."""

    @pytest.mark.asyncio
    async def test_websocket_proposal_events_broadcast(client, db_session, mock_ws):
        """Extraction broadcasts proposal_created events."""

    @pytest.mark.asyncio
    async def test_low_confidence_proposals_created(client, db_session, mock_llm):
        """Items below threshold still created with status=pending."""
```

---

## 4. E2E Tests for Full Workflow

### 4.1 Proposal Workflow E2E Tests

**File:** `backend/tests/integration/test_proposal_workflow.py`

**Test Coverage:**
```python
class TestProposalWorkflowE2E:
    """End-to-end tests for full proposal workflow."""

    @pytest.mark.asyncio
    async def test_full_workflow_extraction_to_approval(client, db_session):
        """
        Full flow:
        1. Trigger extraction
        2. Proposals created
        3. Review proposals
        4. Approve high-confidence
        5. Verify Topics/Atoms created
        """

    @pytest.mark.asyncio
    async def test_duplicate_detection_workflow(client, db_session):
        """
        Flow:
        1. Create existing Topic
        2. Extract similar topic
        3. Verify similar_topic_id populated
        4. Merge proposal with existing
        5. Verify metadata updated
        """

    @pytest.mark.asyncio
    async def test_low_confidence_review_workflow(client, db_session):
        """
        Flow:
        1. Extract with low confidence (<0.7)
        2. Proposals created with status=pending
        3. Manual review UI filters pending
        4. User approves after review
        5. Topic/Atom created
        """

    @pytest.mark.asyncio
    async def test_rejection_workflow(client, db_session):
        """
        Flow:
        1. Proposals created
        2. User rejects proposals
        3. Status updated to rejected
        4. No Topics/Atoms created
        5. Proposals archived
        """

    @pytest.mark.asyncio
    async def test_batch_approval_workflow(client, db_session):
        """
        Flow:
        1. Multiple high-confidence proposals
        2. Bulk approve endpoint called
        3. All proposals approved
        4. Topics/Atoms created atomically
        """
```

**Critical Flows:**
- Happy path: extract -> review -> approve -> entities created
- Duplicate path: extract -> detect similar -> merge
- Low-confidence path: extract -> pending -> manual review -> approve
- Rejection path: extract -> review -> reject -> no entities
- Batch path: multiple proposals -> bulk operations

### 4.2 Auto-Approval Job E2E Tests

**File:** `backend/tests/tasks/test_auto_review_job.py`

**Test Coverage:**
```python
class TestAutoReviewJobE2E:
    """E2E tests for auto-approval background job."""

    @pytest.mark.asyncio
    async def test_auto_approve_high_confidence_no_duplicates(db_session):
        """
        Flow:
        1. Create proposals with confidence > 0.95
        2. No duplicates detected
        3. Auto-review job runs
        4. Proposals auto-approved
        5. Topics/Atoms created
        """

    @pytest.mark.asyncio
    async def test_auto_approve_skips_duplicates(db_session):
        """Auto-approve skips proposals with similar_entity_id."""

    @pytest.mark.asyncio
    async def test_auto_approve_logs_decisions(db_session):
        """Audit trail created for auto-approvals."""

    @pytest.mark.asyncio
    async def test_deduplication_job_finds_duplicates(db_session):
        """Background job scans existing entities for duplicates."""
```

---

## 5. Performance Tests

### 5.1 Proposal Creation Performance

**File:** `backend/tests/performance/test_proposal_performance.py`

**Test Coverage:**
```python
class TestProposalPerformance:
    """Performance tests for proposal system."""

    @pytest.mark.asyncio
    async def test_proposal_creation_under_500ms(db_session, mock_llm):
        """Single proposal creation completes in <500ms."""

    @pytest.mark.asyncio
    async def test_batch_proposal_creation_scales_linearly(db_session, mock_llm):
        """100 proposals created in <5 seconds."""

    @pytest.mark.asyncio
    async def test_similarity_check_under_500ms(db_session):
        """Similarity check with 10k entities completes in <500ms."""

    @pytest.mark.asyncio
    async def test_list_proposals_pagination_fast(db_session, client):
        """List 1000 proposals with pagination in <200ms per page."""

    @pytest.mark.asyncio
    async def test_approval_workflow_under_1s(db_session, client):
        """Full approval (proposal -> entity) completes in <1s."""
```

**Performance Targets:**
- Single proposal creation: <500ms
- Batch creation (100): <5s (50ms average)
- Similarity check: <500ms (with 10k entities)
- List with pagination: <200ms per page
- Approval workflow: <1s (includes entity creation)

### 5.2 Database Query Performance

**File:** `backend/tests/performance/test_query_performance.py`

**Test Coverage:**
```python
class TestQueryPerformance:
    """Database query performance tests."""

    @pytest.mark.asyncio
    async def test_index_usage_for_status_filter(db_session):
        """Verify index on (status, confidence, extraction_run_id)."""

    @pytest.mark.asyncio
    async def test_pagination_query_performance(db_session):
        """Pagination queries use LIMIT/OFFSET efficiently."""

    @pytest.mark.asyncio
    async def test_similarity_search_uses_index(db_session):
        """Similarity search uses index on name field."""
```

**Index Validation:**
- Composite index: (status, confidence, extraction_run_id)
- Index on: similar_topic_id, similar_atom_id
- Index on: reviewed_at for audit queries

---

## 6. Test Data Fixtures

### 6.1 Core Fixtures

**File:** `backend/tests/fixtures/proposal_fixtures.py`

```python
@pytest.fixture
async def sample_extraction_run(db_session: AsyncSession) -> KnowledgeExtractionRun:
    """Create sample extraction run."""
    run = KnowledgeExtractionRun(
        id=uuid4(),
        agent_config_id=uuid4(),
        config_snapshot={"model": "llama3", "temperature": 0.3},
        status="completed",
        message_count=50,
    )
    db_session.add(run)
    await db_session.commit()
    await db_session.refresh(run)
    return run


@pytest.fixture
async def sample_topic_proposals(
    db_session: AsyncSession,
    sample_extraction_run: KnowledgeExtractionRun
) -> list[TopicProposal]:
    """Create sample topic proposals with varying confidence."""
    proposals = [
        TopicProposal(
            extraction_run_id=sample_extraction_run.id,
            name="API Design",
            description="REST API design discussions",
            keywords=["api", "rest", "design"],
            confidence=0.95,
            reasoning="Clear discussion about API structure",
            status="pending",
        ),
        TopicProposal(
            extraction_run_id=sample_extraction_run.id,
            name="Database Schema",
            description="Database design decisions",
            keywords=["database", "schema", "postgres"],
            confidence=0.85,
            reasoning="Multiple messages about DB design",
            status="pending",
        ),
        TopicProposal(
            extraction_run_id=sample_extraction_run.id,
            name="Testing Strategy",
            description="Test coverage and strategy",
            keywords=["testing", "pytest", "coverage"],
            confidence=0.65,
            reasoning="Brief mention, needs review",
            status="pending",
        ),
    ]
    for p in proposals:
        db_session.add(p)
    await db_session.commit()
    return proposals


@pytest.fixture
async def sample_atom_proposals(
    db_session: AsyncSession,
    sample_topic_proposals: list[TopicProposal]
) -> list[AtomProposal]:
    """Create sample atom proposals."""
    atoms = [
        AtomProposal(
            extraction_run_id=sample_topic_proposals[0].extraction_run_id,
            type="problem",
            title="Authentication bug preventing logins",
            content="Users cannot log in after session timeout",
            confidence=0.90,
            reasoning="Clear problem statement",
            status="pending",
        ),
        AtomProposal(
            extraction_run_id=sample_topic_proposals[0].extraction_run_id,
            type="solution",
            title="Reset session store",
            content="Fix: reset session store to clear corrupted sessions",
            confidence=0.88,
            reasoning="Proposed solution with context",
            status="pending",
        ),
    ]
    for a in atoms:
        db_session.add(a)
    await db_session.commit()
    return atoms


@pytest.fixture
def mock_llm_extraction_output() -> KnowledgeExtractionOutput:
    """Mock LLM extraction output for testing."""
    return KnowledgeExtractionOutput(
        topics=[
            ExtractedTopic(
                name="API Design",
                description="REST API design",
                keywords=["api", "rest"],
                confidence=0.95,
                reasoning="Clear API discussion",
                related_message_ids=[1, 2, 3],
            )
        ],
        atoms=[
            ExtractedAtom(
                type="problem",
                title="Auth bug",
                content="Login fails",
                confidence=0.90,
                reasoning="Clear problem",
                topics=["API Design"],
                related_message_ids=[1, 2],
                links=[],
            )
        ],
    )
```

### 6.2 Fixture Organization

**Fixture Files:**
- `backend/tests/fixtures/proposal_fixtures.py` - Proposal models
- `backend/tests/fixtures/extraction_fixtures.py` - Extraction runs, LLM outputs
- `backend/tests/fixtures/similarity_fixtures.py` - Duplicate detection scenarios
- `backend/tests/conftest.py` - Global fixtures (db_session, client)

---

## 7. Coverage Requirements

### 7.1 Coverage Targets

**Minimum Coverage: 90%**

**Per-Component Targets:**
- Models: 95% (simple logic, easy to test)
- Services: 92% (core business logic)
- API endpoints: 90% (integration tests)
- Background jobs: 85% (async complexity)
- Utilities: 95% (pure functions)

### 7.2 Coverage Measurement

**Command:**
```bash
just test-coverage  # or: uv run pytest --cov=app --cov-report=term-missing
```

**Coverage Report Format:**
```
Name                                              Stmts   Miss  Cover   Missing
-------------------------------------------------------------------------------
app/models/topic_proposal.py                         45      2    95%   67-68
app/models/atom_proposal.py                          52      3    94%   89-91
app/services/topic_proposal_service.py               120      8    93%   145-152
app/services/atom_proposal_service.py                135     10    93%   167-176
app/services/similarity_service.py                    78      5    94%   123-127
app/api/v1/topic_proposals.py                         95      9    91%   201-209
app/api/v1/atom_proposals.py                         102     10    90%   215-224
app/tasks/auto_review.py                              67      8    88%   98-105
-------------------------------------------------------------------------------
TOTAL                                                694     55    92%
```

### 7.3 Coverage Exclusions

**Exclude from coverage:**
- Type stubs and protocol definitions
- Abstract base classes (ABC)
- Development-only code (DEBUG blocks)
- Config file (constants only)

**Pragma directives:**
```python
if TYPE_CHECKING:  # pragma: no cover
    from app.models import User

def __repr__(self):  # pragma: no cover
    return f"<Proposal {self.id}>"
```

---

## 8. Test Execution Plan

### 8.1 Development Workflow

**Before Code Commit:**
```bash
# Run tests for changed module only
uv run pytest backend/tests/services/test_topic_proposal_service.py -v

# Run all tests
just test

# Check coverage
just test-coverage

# Type checking
just typecheck
```

### 8.2 CI/CD Pipeline

**GitHub Actions Workflow:**
```yaml
name: Test Knowledge Proposal System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install uv
        run: curl -LsSf https://astral.sh/uv/install.sh | sh
      - name: Install dependencies
        run: uv sync --all-groups
      - name: Run type checking
        run: cd backend && uv run mypy .
      - name: Run tests with coverage
        run: uv run pytest --cov=app --cov-report=xml --cov-fail-under=90
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 8.3 Phase-by-Phase Testing

**Phase 0: Database Foundation**
- Run migration tests
- Test model constraints
- Verify indexes created
- **Gate:** 100% model tests pass

**Phase 1: Service Layer**
- Run service unit tests
- Mock all external dependencies
- Verify CRUD operations
- **Gate:** 90% service coverage

**Phase 2: API Layer**
- Run integration tests
- Test all endpoints
- Verify response schemas
- **Gate:** All API tests pass

**Phase 3: Duplicate Detection**
- Run similarity tests
- Test performance (<500ms)
- Verify accuracy (>85%)
- **Gate:** Performance targets met

**Phase 4: Frontend (not covered here)**
- Jest/Playwright tests
- Component tests
- E2E user flows

**Phase 5: Automation**
- Run background job tests
- Test auto-approval logic
- Verify audit trail
- **Gate:** 85% job coverage

### 8.4 Smoke Tests

**Post-Deployment Smoke Test:**
```bash
# Verify API health
curl http://localhost:8000/health

# Create test proposal
curl -X POST http://localhost:8000/api/v1/knowledge/extract \
  -H "Content-Type: application/json" \
  -d '{"message_ids": [1,2,3], "agent_config_id": "..."}'

# List proposals
curl http://localhost:8000/api/v1/knowledge/topics/proposals

# Approve proposal
curl -X POST http://localhost:8000/api/v1/knowledge/topics/proposals/{id}/approve

# Verify topic created
curl http://localhost:8000/api/v1/topics
```

---

## 9. Testing Anti-Patterns to Avoid

### 9.1 Common Mistakes

**DON'T:**
- Test implementation details (private methods)
- Use real LLM API calls in unit tests (mock them)
- Share state between tests (use isolated db_session)
- Skip error cases (test 404, 409, 422, 500)
- Write brittle tests (assert on exact strings)
- Test multiple things in one test
- Use time.sleep() (use async properly)

**DO:**
- Test public interfaces (services, APIs)
- Mock external dependencies (LLM, embeddings)
- Use pytest fixtures for data setup
- Test all status codes and error paths
- Assert on structure, not exact content
- Keep tests focused (one assertion group)
- Use asyncio properly with pytest-asyncio

### 9.2 Test Quality Checklist

**Before PR:**
- [ ] All tests pass locally
- [ ] Coverage >90% for new code
- [ ] mypy passes (zero type errors)
- [ ] Tests run in <30 seconds total
- [ ] No skipped tests without explanation
- [ ] Error cases tested
- [ ] Documentation updated

---

## 10. Performance Testing Details

### 10.1 Load Testing Scenarios

**Scenario 1: High-Volume Proposal Creation**
```python
@pytest.mark.asyncio
async def test_concurrent_proposal_creation(db_session):
    """100 proposals created concurrently in <10s."""
    import asyncio

    tasks = [
        create_proposal(f"Topic {i}", confidence=0.9)
        for i in range(100)
    ]

    start = time.time()
    await asyncio.gather(*tasks)
    elapsed = time.time() - start

    assert elapsed < 10.0, f"Took {elapsed}s, expected <10s"
```

**Scenario 2: Similarity Search Performance**
```python
@pytest.mark.asyncio
async def test_similarity_search_with_10k_entities(db_session):
    """Similarity search with 10k entities in <500ms."""
    # Seed 10k topics
    await seed_topics(10000)

    proposal = TopicProposal(name="API Design", ...)

    start = time.time()
    similar = await similarity_service.find_similar_topics(proposal)
    elapsed = time.time() - start

    assert elapsed < 0.5, f"Took {elapsed}s, expected <0.5s"
```

### 10.2 Memory Profiling

**Test Memory Usage:**
```python
import tracemalloc

@pytest.mark.asyncio
async def test_batch_approval_memory_usage(db_session):
    """Batch approval of 1000 proposals uses <500MB."""
    tracemalloc.start()

    proposals = await create_proposals(1000)
    await batch_approve(proposals)

    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    assert peak < 500 * 1024 * 1024, f"Peak memory: {peak / 1024 / 1024}MB"
```

---

## Summary

This testing strategy ensures production-ready code through:

1. **Comprehensive Model Tests:** Validate constraints, relationships, status transitions
2. **Service Unit Tests:** Core business logic with >90% coverage
3. **API Integration Tests:** All endpoints, status codes, error cases
4. **E2E Workflow Tests:** Full flows from extraction to approval
5. **Performance Tests:** <500ms proposal creation, <1s approval
6. **Test Fixtures:** Reusable data scenarios for all tests
7. **Coverage Enforcement:** 90% minimum, tracked in CI/CD
8. **Phase-Gated Execution:** Tests block deployment if failing

**Key Success Metrics:**
- 90%+ test coverage maintained
- All tests pass before merge
- Performance targets met (<500ms, <1s)
- Zero type errors (mypy --strict)
- E2E workflows validated

**Execution Timeline:**
- Phase 0: Model tests (Week 1)
- Phase 1: Service tests (Week 2)
- Phase 2: API tests (Week 3)
- Phase 3: Similarity tests (Week 3-4)
- Phase 4: Frontend tests (Week 4-5)
- Phase 5: Job tests (Week 5-6)

**Deliverable Checklist:**
- [ ] All test files created
- [ ] Fixtures implemented
- [ ] Coverage >90% verified
- [ ] Performance targets met
- [ ] CI/CD pipeline configured
- [ ] Documentation updated

---

**Document Status:** Ready for Implementation
**Last Updated:** October 23, 2025
**Next Review:** After Phase 1 completion
