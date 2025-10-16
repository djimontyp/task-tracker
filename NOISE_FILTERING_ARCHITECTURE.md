# Noise Filtering Architecture: Technical Design

## 📋 Document Purpose

This document describes the **technical implementation** of the noise filtering system that addresses user needs defined in `USER_NEEDS.md`.

**Links:**
- User Needs: [USER_NEEDS.md](./USER_NEEDS.md)
- Analysis System: [ANALYSIS_SYSTEM_ARCHITECTURE.md](./ANALYSIS_SYSTEM_ARCHITECTURE.md)
- Vector DB: [VECTOR_DB_IMPLEMENTATION_PLAN.md](./VECTOR_DB_IMPLEMENTATION_PLAN.md)

---

## 🏗️ System Architecture Overview

### Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Layer 4: DASHBOARD (Aggregated Insights)               │
│ "iOS crashes ↑ 300% this week"                          │ ← Human works here
│ "5 critical atoms need review"                          │
└────────────────────────┬────────────────────────────────┘
                         ↓ drill down (5% cases)
┌─────────────────────────────────────────────────────────┐
│ Layer 3: ATOMS (Structured Extracts)                   │
│ Atom: "iOS 17.2 login crash" (confidence: 0.95)        │ ← Human reviews if needed
│ Sources: 15 messages                                    │
└────────────────────────┬────────────────────────────────┘
                         ↓ drill down (edgecase)
┌─────────────────────────────────────────────────────────┐
│ Layer 2: SIGNAL MESSAGES (Filtered)                    │
│ 20 messages (importance_score > 0.7)                   │ ← Used for extraction
└────────────────────────┬────────────────────────────────┘
                         ↓ includes
┌─────────────────────────────────────────────────────────┐
│ Layer 1: ALL MESSAGES (Raw + Noise)                    │
│ 100 messages (80% noise, 20% signal)                   │ ← Fast ingestion
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Processing Pipeline

### Pipeline Overview

```
Message Arrives → Fast Save → Score → Filter → Extract → Aggregate → Display
     |             |           |        |         |          |           |
   10ms          10ms       1-2s      1s       30s        1s         <1s
```

### Pipeline Stages

**Stage 1: Fast Ingestion (10ms)**
```
Telegram/Email → FastAPI → PostgreSQL
                              ↓
                    embedding = NULL
                    importance_score = NULL
                    exclude_from_analysis = False
```

**Stage 2: Background Scoring (1-2s)**
```
TaskIQ Job (every 15 min):
├─ Find messages WHERE importance_score IS NULL
├─ Calculate score (0.0-1.0)
└─ UPDATE messages SET importance_score = X
```

**Stage 3: Noise Filtering (1s)**
```
TaskIQ Job (after scoring):
├─ IF score < 0.3 → status = 'noise', exclude_from_analysis = True
├─ IF score > 0.7 → status = 'signal', priority = 'high'
└─ ELSE → status = 'weak_signal', priority = 'medium'
```

**Stage 4: Embedding Generation (30s)**
```
TaskIQ Job (every 15 min):
├─ Find signal messages WHERE embedding IS NULL
├─ Batch OpenAI API (50% cheaper)
└─ UPDATE messages SET embedding = [...]
```

**Stage 5: Atom Extraction (30s)**
```
Analysis Run (on-demand or scheduled):
├─ Load signal messages (exclude_from_analysis = False)
├─ Use RAG for context
├─ Extract atoms with LLM
├─ Auto-approve if confidence > 0.9
└─ Link atoms ↔ messages
```

**Stage 6: Aggregation (1s)**
```
Dashboard API:
├─ Group atoms by type/topic
├─ Calculate trends
├─ Detect anomalies
└─ Return high-level view
```

---

## 📊 Database Schema

### Extended Message Model

```sql
CREATE TABLE messages (
    -- Existing fields
    id BIGINT PRIMARY KEY,
    content TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL,
    author_id BIGINT,
    source_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    -- Vector search
    embedding vector(1536),

    -- Analysis
    analyzed BOOLEAN DEFAULT FALSE,
    classification VARCHAR(50),
    confidence FLOAT,

    -- NEW: Importance scoring
    importance_score FLOAT,              -- 0.0-1.0
    scored_at TIMESTAMP,
    scoring_factors JSONB,               -- debugging: what influenced score

    -- NEW: Noise filtering
    status VARCHAR(20),                  -- 'signal', 'noise', 'weak_signal'
    priority VARCHAR(20),                -- 'high', 'medium', 'low'
    exclude_from_analysis BOOLEAN DEFAULT FALSE,

    -- NEW: Human feedback
    marked_by_human BOOLEAN DEFAULT FALSE,
    human_feedback JSONB,                -- reason for marking irrelevant

    CONSTRAINT importance_score_range CHECK (importance_score >= 0.0 AND importance_score <= 1.0)
);

-- Indexes for filtering
CREATE INDEX idx_messages_status ON messages(status) WHERE exclude_from_analysis = FALSE;
CREATE INDEX idx_messages_importance ON messages(importance_score DESC) WHERE importance_score IS NOT NULL;
CREATE INDEX idx_messages_unscored ON messages(id) WHERE importance_score IS NULL;
```

### Extended Atom Model

```sql
CREATE TABLE atoms (
    -- Existing fields
    id BIGINT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    confidence FLOAT,
    user_approved BOOLEAN DEFAULT FALSE,
    meta JSONB,
    embedding vector(1536),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    -- NEW: Status tracking
    status VARCHAR(20) DEFAULT 'needs_review',  -- 'auto_approved', 'needs_review', 'rejected'

    -- NEW: Source tracking
    source_message_ids BIGINT[],                -- array of message IDs
    source_message_count INT GENERATED ALWAYS AS (array_length(source_message_ids, 1)) STORED,

    -- NEW: Approval tracking
    auto_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    rejection_reason TEXT,

    CONSTRAINT atom_confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

-- Index for filtering
CREATE INDEX idx_atoms_status ON atoms(status);
CREATE INDEX idx_atoms_confidence ON atoms(confidence DESC) WHERE user_approved = FALSE;
```

### Message-Topic Many-to-Many (Enhanced)

```sql
CREATE TABLE message_topics (
    message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
    topic_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,

    -- NEW: Confidence & tracking
    confidence FLOAT NOT NULL,           -- 0.0-1.0
    auto_assigned BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (message_id, topic_id),

    CONSTRAINT topic_confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

CREATE INDEX idx_message_topics_confidence ON message_topics(confidence DESC);
```

---

## 🧮 Importance Scoring Algorithm

### Multi-Factor Scoring

```python
class ImportanceScorer:
    """Calculate importance score (0.0-1.0) for messages."""

    async def calculate_score(self, message: Message) -> ScoringResult:
        """
        Multi-factor scoring algorithm.

        Returns:
            ScoringResult with score (0.0-1.0) and factors breakdown
        """
        score = 0.5  # baseline
        factors = {}

        # Factor 1: Content Analysis (weight: 0.4)
        content_score = await self._score_content(message.content)
        score += content_score * 0.4
        factors['content'] = content_score

        # Factor 2: Author Reputation (weight: 0.2)
        author_score = await self._score_author(message.author_id)
        score += author_score * 0.2
        factors['author'] = author_score

        # Factor 3: Temporal Context (weight: 0.2)
        temporal_score = await self._score_temporal(message)
        score += temporal_score * 0.2
        factors['temporal'] = temporal_score

        # Factor 4: Topic Relevance (weight: 0.2)
        topic_score = await self._score_topics(message)
        score += topic_score * 0.2
        factors['topics'] = topic_score

        # Clamp to 0.0-1.0
        final_score = max(0.0, min(1.0, score))

        return ScoringResult(
            score=final_score,
            factors=factors,
            scored_at=datetime.now()
        )
```

### Content Analysis Signals

```python
async def _score_content(self, content: str) -> float:
    """Analyze content for importance signals."""
    score = 0.0

    # Positive signals
    if contains_error_keywords(content):     # "crash", "error", "bug"
        score += 0.3

    if contains_question_marks(content):     # "?", "how to", "why"
        score += 0.2

    if contains_actionable_words(content):   # "need", "should", "must"
        score += 0.2

    if has_technical_terms(content):         # "database", "API", "timeout"
        score += 0.1

    if has_code_snippets(content):           # backticks, indentation
        score += 0.2

    # Negative signals
    if is_too_short(content):                # < 10 chars
        score -= 0.3

    if is_generic_response(content):         # "ok", "thanks", "+1", "lol"
        score -= 0.5

    if is_emoji_only(content):               # 🔥😂👍
        score -= 0.4

    if is_forwarded_message(content):        # "Forwarded from..."
        score -= 0.2

    return score
```

### Author Reputation Scoring

```python
async def _score_author(self, author_id: int) -> float:
    """Score based on author's historical signal/noise ratio."""
    stats = await get_author_stats(author_id)

    # Calculate signal ratio
    total = stats.total_messages
    signal = stats.signal_messages
    noise = stats.noise_messages

    if total < 10:
        return 0.0  # not enough data

    signal_ratio = signal / total

    # 0.0-0.2 → low quality author (-0.3)
    # 0.2-0.5 → medium quality (0.0)
    # 0.5-1.0 → high quality (+0.3)

    if signal_ratio < 0.2:
        return -0.3
    elif signal_ratio < 0.5:
        return 0.0
    else:
        return (signal_ratio - 0.5) * 0.6  # 0.0 to 0.3
```

### Temporal Context Scoring

```python
async def _score_temporal(self, message: Message) -> float:
    """Score based on temporal context (recency + similar patterns)."""
    score = 0.0

    # Check if similar messages recently important
    recent_window = datetime.now() - timedelta(hours=24)
    similar_recent = await find_similar_messages(
        message=message,
        time_after=recent_window,
        status='signal'
    )

    if len(similar_recent) > 0:
        # Similar important messages recently → likely important
        score += min(0.4, len(similar_recent) * 0.1)

    # Check message freshness
    age_hours = (datetime.now() - message.sent_at).total_seconds() / 3600
    if age_hours < 1:
        score += 0.1  # very fresh

    return score
```

---

## 🎛️ Thresholds & Configuration

### Default Thresholds

```python
# config.py
class NoiseFilteringConfig(BaseSettings):
    """Configuration for noise filtering system."""

    # Scoring thresholds
    noise_threshold: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Messages below this score are marked as noise"
    )

    signal_threshold: float = Field(
        default=0.7,
        ge=0.0,
        le=1.0,
        description="Messages above this score are high-priority signal"
    )

    # Auto-approval thresholds
    atom_auto_approve_threshold: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Atoms above this confidence are auto-approved"
    )

    # Processing intervals
    scoring_interval_minutes: int = Field(
        default=15,
        ge=1,
        le=60,
        description="How often to run scoring job"
    )

    embedding_interval_minutes: int = Field(
        default=15,
        ge=5,
        le=120,
        description="How often to generate embeddings"
    )

    # Analysis windows
    analysis_window_days: int = Field(
        default=7,
        ge=1,
        le=30,
        description="Sliding window for analysis runs"
    )
```

### Threshold Tuning Strategy

**Phase 1: Conservative (Launch)**
```python
noise_threshold = 0.2   # mark less as noise
signal_threshold = 0.8  # only high-confidence as signal
```

**Phase 2: Balanced (After 1 month)**
```python
noise_threshold = 0.3
signal_threshold = 0.7
```

**Phase 3: Aggressive (After 3 months)**
```python
noise_threshold = 0.4   # filter more noise
signal_threshold = 0.6  # lower bar for signal
```

---

## 🔄 Background Jobs

### Job 1: Message Scoring

```python
@nats_broker.task
async def score_unscored_messages_task() -> dict[str, int]:
    """
    Score all messages that don't have importance_score yet.

    Runs every 15 minutes.
    """
    async with AsyncSessionLocal() as db:
        # Find unscored messages
        messages = await db.execute(
            select(Message)
            .where(Message.importance_score.is_(None))
            .order_by(Message.sent_at.desc())
            .limit(100)  # process in batches
        )
        messages = messages.scalars().all()

        if not messages:
            return {"scored": 0, "skipped": 0}

        scorer = ImportanceScorer()
        scored_count = 0

        for msg in messages:
            try:
                result = await scorer.calculate_score(msg)
                msg.importance_score = result.score
                msg.scored_at = result.scored_at
                msg.scoring_factors = result.factors
                scored_count += 1
            except Exception as e:
                logger.error(f"Failed to score message {msg.id}: {e}")

        await db.commit()

        return {
            "scored": scored_count,
            "failed": len(messages) - scored_count
        }
```

### Job 2: Noise Filtering

```python
@nats_broker.task
async def filter_noise_task() -> dict[str, int]:
    """
    Apply noise filtering to scored messages.

    Runs after scoring job.
    """
    async with AsyncSessionLocal() as db:
        # Find scored but unfiltered messages
        messages = await db.execute(
            select(Message)
            .where(
                Message.importance_score.isnot(None),
                Message.status.is_(None)
            )
        )
        messages = messages.scalars().all()

        config = get_config()
        stats = {"noise": 0, "signal": 0, "weak_signal": 0}

        for msg in messages:
            if msg.importance_score < config.noise_threshold:
                msg.status = "noise"
                msg.priority = "low"
                msg.exclude_from_analysis = True
                stats["noise"] += 1

            elif msg.importance_score > config.signal_threshold:
                msg.status = "signal"
                msg.priority = "high"
                stats["signal"] += 1

            else:
                msg.status = "weak_signal"
                msg.priority = "medium"
                stats["weak_signal"] += 1

        await db.commit()

        logger.info(f"Filtered {len(messages)} messages: {stats}")
        return stats
```

### Job 3: Embedding Generation (Signal Only)

```python
@nats_broker.task
async def generate_embeddings_for_signal_task() -> dict[str, int]:
    """
    Generate embeddings ONLY for signal messages.

    Runs every 15 minutes.
    Uses OpenAI Batch API (50% cheaper).
    """
    async with AsyncSessionLocal() as db:
        # Find signal messages without embeddings
        messages = await db.execute(
            select(Message)
            .where(
                Message.status.in_(["signal", "weak_signal"]),
                Message.embedding.is_(None),
                Message.exclude_from_analysis == False
            )
            .order_by(Message.sent_at.desc())
            .limit(100)
        )
        messages = messages.scalars().all()

        if not messages:
            return {"processed": 0}

        # Get provider
        provider = await get_default_embedding_provider(db)
        service = EmbeddingService(provider)

        # Generate embeddings (batch)
        stats = await service.embed_messages_batch(
            db,
            message_ids=[msg.id for msg in messages],
            batch_size=100
        )

        return stats
```

---

## 📈 Dashboard API

### Aggregated Insights Endpoint

```python
@router.get("/api/dashboard/insights")
async def get_dashboard_insights(
    db: DatabaseDep,
    time_window_days: int = Query(7, ge=1, le=30)
) -> DashboardInsights:
    """
    Get high-level aggregated insights.

    This is the PRIMARY view for users - no raw messages shown.
    """
    cutoff_date = datetime.now() - timedelta(days=time_window_days)

    # Get approved atoms only
    atoms = await db.execute(
        select(Atom)
        .where(
            Atom.created_at >= cutoff_date,
            Atom.user_approved == True
        )
        .order_by(Atom.confidence.desc())
    )
    atoms = atoms.scalars().all()

    # Aggregate by type
    by_type = defaultdict(list)
    for atom in atoms:
        by_type[atom.type].append(atom)

    # Detect critical issues
    critical = [a for a in atoms if a.confidence > 0.95 and a.type == "problem"]

    # Calculate trends
    trends = await detect_trending_topics(db, atoms, cutoff_date)

    # Noise statistics
    noise_stats = await get_noise_statistics(db, cutoff_date)

    return DashboardInsights(
        time_window_days=time_window_days,
        total_atoms=len(atoms),
        by_type={
            type_name: len(atoms_list)
            for type_name, atoms_list in by_type.items()
        },
        critical_issues=critical[:5],  # top 5
        trends=trends[:10],            # top 10
        noise_stats=noise_stats
    )
```

### Drill-Down Endpoint

```python
@router.get("/api/atoms/{atom_id}/drill-down")
async def drill_down_to_messages(
    atom_id: int,
    db: DatabaseDep
) -> AtomDrillDown:
    """
    Drill down from atom to source messages.

    Used ONLY when user needs to see raw data (5% cases).
    """
    atom = await db.get(Atom, atom_id)
    if not atom:
        raise HTTPException(404, "Atom not found")

    # Get source messages
    messages = await db.execute(
        select(Message)
        .where(Message.id.in_(atom.source_message_ids))
        .order_by(Message.sent_at.desc())
    )
    messages = messages.scalars().all()

    return AtomDrillDown(
        atom=AtomPublic.from_orm(atom),
        source_messages=[
            MessageWithScore(
                **msg.__dict__,
                can_mark_irrelevant=not msg.marked_by_human
            )
            for msg in messages
        ]
    )
```

### Mark Irrelevant Endpoint

```python
@router.post("/api/messages/{message_id}/mark-irrelevant")
async def mark_message_irrelevant(
    message_id: int,
    reason: str,
    db: DatabaseDep
) -> dict:
    """
    Human marks message as irrelevant (false positive).

    System learns from this feedback.
    """
    message = await db.get(Message, message_id)
    if not message:
        raise HTTPException(404, "Message not found")

    # Mark as excluded
    message.exclude_from_analysis = True
    message.marked_by_human = True
    message.human_feedback = {"reason": reason, "timestamp": datetime.now().isoformat()}

    # Find related atoms
    atoms = await db.execute(
        select(Atom)
        .where(Atom.source_message_ids.contains([message_id]))
    )
    atoms = atoms.scalars().all()

    # Recalculate atom confidence
    for atom in atoms:
        # Remove this message from sources
        atom.source_message_ids = [
            mid for mid in atom.source_message_ids if mid != message_id
        ]

        # Recalculate confidence
        if len(atom.source_message_ids) == 0:
            atom.status = "rejected"
            atom.rejection_reason = "All source messages marked irrelevant"
        else:
            atom.confidence = await recalculate_atom_confidence(atom, db)

    await db.commit()

    return {
        "message_id": message_id,
        "status": "excluded",
        "affected_atoms": len(atoms)
    }
```

---

## 🔍 Modified Analysis Run

### Signal-Only Processing

```python
async def execute_analysis_run(run_id: str, use_rag: bool = False):
    """
    Execute analysis run on SIGNAL messages only.

    KEY CHANGE: Excludes noise messages from processing.
    """
    db = await get_db_session()
    executor = AnalysisExecutor(db)

    # Start run
    await executor.start_run(UUID(run_id))

    # Fetch ONLY signal messages (noise excluded)
    messages = await db.execute(
        select(Message)
        .where(
            Message.status.in_(["signal", "weak_signal"]),  # ← KEY FILTER
            Message.exclude_from_analysis == False,         # ← EXCLUDE NOISE
            Message.analyzed == False,
            Message.sent_at >= get_time_window()
        )
        .order_by(Message.sent_at.desc())
    )
    messages = messages.scalars().all()

    logger.info(f"Processing {len(messages)} SIGNAL messages (noise excluded)")

    # Rest of analysis pipeline unchanged
    filtered = await executor.prefilter_messages(UUID(run_id), messages)
    batches = await executor.create_batches(filtered)

    for batch in batches:
        proposals = await executor.process_batch(UUID(run_id), batch, use_rag=use_rag)
        await executor.save_proposals(UUID(run_id), proposals)

    await executor.complete_run(UUID(run_id))
```

---

## 📊 Monitoring & Metrics

### System Health Metrics

```python
@router.get("/api/admin/metrics")
async def get_system_metrics(db: DatabaseDep) -> SystemMetrics:
    """
    System health metrics for monitoring.
    """
    now = datetime.now()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    # Message statistics
    total_messages = await count_messages(db)
    scored_messages = await count_messages(db, scored=True)

    # Status breakdown
    status_breakdown = await db.execute(
        select(Message.status, func.count(Message.id))
        .group_by(Message.status)
    )
    status_breakdown = dict(status_breakdown.all())

    # Scoring coverage
    scoring_coverage = (scored_messages / total_messages) * 100 if total_messages > 0 else 0

    # Signal/Noise ratio
    signal_count = status_breakdown.get("signal", 0) + status_breakdown.get("weak_signal", 0)
    noise_count = status_breakdown.get("noise", 0)
    signal_ratio = (signal_count / (signal_count + noise_count)) * 100 if (signal_count + noise_count) > 0 else 0

    # Atom statistics
    total_atoms = await count_atoms(db)
    auto_approved = await count_atoms(db, auto_approved=True)
    needs_review = await count_atoms(db, status="needs_review")

    # Processing lag
    oldest_unscored = await db.execute(
        select(Message.sent_at)
        .where(Message.importance_score.is_(None))
        .order_by(Message.sent_at.asc())
        .limit(1)
    )
    oldest_unscored = oldest_unscored.scalar_one_or_none()
    scoring_lag_minutes = (now - oldest_unscored).total_seconds() / 60 if oldest_unscored else 0

    return SystemMetrics(
        messages={
            "total": total_messages,
            "scored": scored_messages,
            "scoring_coverage_pct": round(scoring_coverage, 2),
            "status_breakdown": status_breakdown,
            "signal_ratio_pct": round(signal_ratio, 2)
        },
        atoms={
            "total": total_atoms,
            "auto_approved": auto_approved,
            "needs_review": needs_review
        },
        processing={
            "scoring_lag_minutes": round(scoring_lag_minutes, 2)
        }
    )
```

---

## 🎯 Implementation Roadmap

### Week 1: Scoring Infrastructure

**Day 1-2:**
- [ ] Add new fields to Message model
- [ ] Run migration
- [ ] Implement `ImportanceScorer` class

**Day 3-4:**
- [ ] Create `score_unscored_messages_task`
- [ ] Test scoring on 100 messages
- [ ] Tune content analysis weights

**Day 5:**
- [ ] Create `filter_noise_task`
- [ ] Test noise filtering
- [ ] Monitor false positives/negatives

---

### Week 2: Modified Pipeline

**Day 6-7:**
- [ ] Update `execute_analysis_run` to exclude noise
- [ ] Update `embed_messages_batch_task` to prioritize signal
- [ ] Test end-to-end with real data

**Day 8-9:**
- [ ] Implement dashboard insights endpoint
- [ ] Implement drill-down endpoint
- [ ] Implement mark-irrelevant endpoint

**Day 10:**
- [ ] Create monitoring metrics endpoint
- [ ] Test full workflow
- [ ] Document API changes

---

### Week 3: Frontend + Polish

**Day 11-12:**
- [ ] Dashboard UI (aggregated view)
- [ ] Drill-down UI
- [ ] Mark irrelevant button

**Day 13-14:**
- [ ] System metrics dashboard (admin)
- [ ] Tune thresholds based on real data
- [ ] Performance optimization

**Day 15:**
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Deploy to production

---

## 🧪 Testing Strategy

### Unit Tests

```python
# test_importance_scorer.py
async def test_score_error_message():
    """Messages with errors should score high."""
    msg = Message(content="Database connection error: timeout")
    scorer = ImportanceScorer()
    result = await scorer.calculate_score(msg)
    assert result.score > 0.7

async def test_score_noise_message():
    """Generic responses should score low."""
    msg = Message(content="ok")
    scorer = ImportanceScorer()
    result = await scorer.calculate_score(msg)
    assert result.score < 0.3
```

### Integration Tests

```python
# test_noise_filtering_pipeline.py
async def test_full_pipeline():
    """Test complete noise filtering pipeline."""
    # Create 100 messages (80 noise, 20 signal)
    messages = create_test_messages()

    # Run scoring
    await score_unscored_messages_task()

    # Run filtering
    await filter_noise_task()

    # Verify
    signal_count = count_messages(status="signal")
    noise_count = count_messages(status="noise")

    assert 15 <= signal_count <= 25  # ~20% signal
    assert 75 <= noise_count <= 85   # ~80% noise
```

---

## 📝 Document Status

- **Version:** 1.0
- **Date:** 2025-10-17
- **Status:** ✅ Architecture Approved
- **Dependencies:**
  - USER_NEEDS.md (requirements)
  - ANALYSIS_SYSTEM_ARCHITECTURE.md (existing system)
  - VECTOR_DB_IMPLEMENTATION_PLAN.md (embeddings)
- **Next Step:** Implementation Week 1

---

**This is the technical implementation of the noise filtering system.**
