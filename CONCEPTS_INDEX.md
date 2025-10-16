# Concepts Index: Complete System Overview

## 🎯 Purpose

This document connects all key concepts and documentation in the Task Tracker system, serving as a navigation guide between user needs, technical architecture, and implementation details.

---

## 📋 Document Hierarchy

```
CONCEPTS_INDEX.md (you are here)
    ↓
    ├─ USER_NEEDS.md (WHAT we're solving)
    │   └─ Business requirements, user journey, success metrics
    │
    ├─ NOISE_FILTERING_ARCHITECTURE.md (HOW we solve it)
    │   └─ Technical implementation, algorithms, database schema
    │
    ├─ ANALYSIS_SYSTEM_ARCHITECTURE.md (Existing system)
    │   └─ AI-powered analysis runs, proposal generation
    │
    └─ VECTOR_DB_IMPLEMENTATION_PLAN.md (Existing feature)
        └─ Semantic search, RAG, pgvector
```

---

## 🔑 Key Concepts Map

### 1. Information Overload Problem

**Document:** [USER_NEEDS.md](./USER_NEEDS.md)

**Concept:**
```
100 messages/day → 80% noise + 20% signal
↓
Human can't process all → Important info lost
↓
NEED: Automatic noise filtering + insight extraction
```

**Key Principles:**
- Humans work with **aggregated insights**, NOT raw messages
- **Eventual consistency** is acceptable (fast ingestion, process later)
- **Good enough > perfect** (false positives/negatives are OK if rare)
- **Drill-down capability** for edgecases (but not the default flow)

---

### 2. Four-Layer Architecture

**Document:** [NOISE_FILTERING_ARCHITECTURE.md](./NOISE_FILTERING_ARCHITECTURE.md)

**Concept:**
```
Layer 4: DASHBOARD (trends, alerts) ← Human 95% time here
    ↓
Layer 3: ATOMS (structured extracts) ← Human reviews if needed
    ↓
Layer 2: SIGNAL (filtered messages) ← Used by AI for extraction
    ↓
Layer 1: RAW DATA (all messages) ← Fast ingestion, no blocking
```

**Key Technical Decisions:**
- **Importance scoring** (0.0-1.0) for every message
- **Noise threshold** (< 0.3 = excluded from analysis)
- **Signal threshold** (> 0.7 = high priority)
- **Auto-approval** (atoms > 0.9 confidence)

---

### 3. Importance Scoring System

**Document:** [NOISE_FILTERING_ARCHITECTURE.md § Importance Scoring Algorithm](./NOISE_FILTERING_ARCHITECTURE.md#-importance-scoring-algorithm)

**Concept:**
```
Multi-factor scoring:
├─ Content analysis (40% weight)
│   ├─ Error keywords → +0.3
│   ├─ Questions → +0.2
│   └─ Generic responses → -0.5
│
├─ Author reputation (20% weight)
│   └─ Historical signal/noise ratio
│
├─ Temporal context (20% weight)
│   └─ Similar important messages recently?
│
└─ Topic relevance (20% weight)
    └─ Multi-label classification scores
```

**Why Multi-Factor:**
- Single-factor fails on edge cases
- Balances different types of importance
- Learns from historical patterns
- Adapts to temporal context

---

### 4. Processing Pipeline

**Document:** [NOISE_FILTERING_ARCHITECTURE.md § Processing Pipeline](./NOISE_FILTERING_ARCHITECTURE.md#-processing-pipeline)

**Concept:**
```
Message arrives (10ms - fast ingestion)
    ↓
Background scoring (1-2s - TaskIQ job every 15 min)
    ↓
Noise filtering (1s - apply thresholds)
    ↓
Embedding generation (30s - only for signal, batch API)
    ↓
Atom extraction (30s - analysis run on signal only)
    ↓
Dashboard aggregation (1s - high-level view)
```

**Key Pattern: Eventual Consistency**
- Don't block ingestion on slow operations
- Process in background with acceptable delay
- System remains responsive even during heavy processing

---

### 5. Many-to-Many Relationships

**Documents:**
- [USER_NEEDS.md § Need 5](./USER_NEEDS.md#need-5-один-message--кілька-topics)
- [NOISE_FILTERING_ARCHITECTURE.md § Database Schema](./NOISE_FILTERING_ARCHITECTURE.md#-database-schema)

**Concept:**
```
One message can belong to multiple topics:

Message: "iOS app crashes on login after update"
    ├─ Topic: iOS (confidence: 0.95)
    ├─ Topic: Authentication (confidence: 0.88)
    ├─ Topic: Backend Bugs (confidence: 0.82)
    └─ Topic: Urgent (confidence: 0.76)
```

**Implementation:**
```sql
CREATE TABLE message_topics (
    message_id BIGINT,
    topic_id BIGINT,
    confidence FLOAT,
    auto_assigned BOOLEAN,
    PRIMARY KEY (message_id, topic_id)
);
```

**Why Important:**
- Real-world problems are multidimensional
- Same message relevant in different contexts
- Confidence scores allow ranking/filtering

---

### 6. Atom Extraction & Approval

**Documents:**
- [USER_NEEDS.md § Need 6](./USER_NEEDS.md#need-6-апрувити-витяги-не-messages)
- [ANALYSIS_SYSTEM_ARCHITECTURE.md](./ANALYSIS_SYSTEM_ARCHITECTURE.md)

**Concept:**
```
100 messages about "iOS crash"
    ↓ (AI extraction)
5 Atoms:
├─ "iOS 17.2 login crash" (confidence: 0.95) → auto-approved
├─ "Memory leak pattern" (confidence: 0.88) → auto-approved
├─ "Network timeout" (confidence: 0.74) → needs review
├─ "UI freeze" (confidence: 0.68) → needs review
└─ "Unknown error" (confidence: 0.42) → rejected

Human reviews 2 atoms (not 100 messages!)
```

**Auto-Approval Thresholds:**
- > 0.9 → auto-approve (high confidence)
- 0.7-0.9 → needs review (medium)
- < 0.7 → reject or flag (low)

---

### 7. Sliding Window & Temporal Context

**Documents:**
- [USER_NEEDS.md § Need 4](./USER_NEEDS.md#need-4-контекст-і-час-мають-значення)
- Research: Time-Series Vector Search

**Concept:**
```
Same text, different context:

June 2025: "payment bug" → Backend Bugs
July 2025: "payment bug" → Migration Issues (after upgrade)

Why? Context changed:
├─ Recent upgrade happened
├─ Historical patterns shifted
└─ Topic drift detected
```

**Implementation:**
- Analysis runs use 7-day sliding window
- RAG retrieves with temporal decay
- Old messages archived after 90 days

---

### 8. Drill-Down Capability

**Document:** [USER_NEEDS.md § User Journey § Step 4](./USER_NEEDS.md#4-drill-down-тільки-при-потребі)

**Concept:**
```
Normal Flow (95%):
Dashboard → See "iOS crashes ↑ 300%" → Done

Edgecase Flow (5%):
Dashboard → Click atom → Looks wrong → Drill-down
    ↓
See 15 source messages
    ↓
Find 2 false positives → Mark irrelevant
    ↓
System recalculates atom confidence → Updates dashboard
```

**Why Important:**
- Provides safety net when AI makes mistakes
- Allows human feedback loop
- But doesn't require human review by default

---

### 9. Integration with Existing Systems

**How Noise Filtering Integrates:**

```
Existing: Analysis System
├─ Analysis runs trigger
├─ Fetch messages in time window
├─ Batch processing
└─ Generate proposals

NEW: Noise Filtering Layer
├─ Filter messages BEFORE analysis
├─ Only process signal messages
├─ Exclude noise automatically
└─ Reduce processing load 5x
```

**Existing: Vector Search**
```
├─ Semantic search across all messages
└─ RAG for context-aware proposals

NEW: Enhanced with Noise Filtering
├─ Semantic search on signal only
├─ RAG excludes noise from context
└─ Higher quality results
```

**Key Point:** Noise filtering is a **preprocessing layer** that enhances existing systems, not a replacement.

---

### 10. Success Metrics

**Document:** [USER_NEEDS.md § Success Metrics](./USER_NEEDS.md#-success-metrics)

**Primary Metric:**
```
User DOES NOT open "Messages" section in UI

Why?
Because all needed info visible in:
├─ Dashboard (trends, alerts)
└─ Atoms (structured extracts)
```

**Secondary Metrics:**
- Time to insight: 30min → 5min (6x faster)
- Noise reduction: 100% shown → 20% signal (5x less)
- Atom accuracy: >85% correct
- False positives: <10%
- User time: <5 min/day on reviews

---

## 🔄 Data Flow Example

### Scenario: 100 Messages Arrive

**Hour 1: Ingestion**
```
10:00 - Message 1: "iOS crash on login" → DB (score=NULL)
10:01 - Message 2: "thanks!" → DB (score=NULL)
10:02 - Message 3: "lol" → DB (score=NULL)
...
11:00 - Message 100: "memory leak" → DB (score=NULL)

✅ All saved in 3 seconds (no blocking)
```

**Hour 2: Background Processing**
```
11:15 - Scoring job runs:
    ├─ Message 1 → score: 0.92 (signal)
    ├─ Message 2 → score: 0.05 (noise)
    ├─ Message 3 → score: 0.02 (noise)
    └─ Message 100 → score: 0.95 (signal)

11:16 - Filtering job runs:
    ├─ 60 messages → noise (excluded)
    ├─ 20 messages → signal (high priority)
    └─ 20 messages → weak signal (medium)

11:30 - Embedding job runs:
    └─ Generate embeddings for 40 signal messages only
```

**Hour 3: Analysis & Extraction**
```
12:00 - Analysis run triggered:
    ├─ Process 40 signal messages (60 noise excluded)
    ├─ Extract 5 atoms
    ├─ Auto-approve 3 atoms (confidence > 0.9)
    └─ Flag 2 for review (confidence 0.7-0.9)
```

**Hour 4: Human Review**
```
13:00 - PM opens dashboard:
    ├─ Sees: "iOS crashes ↑ 300%" (critical alert)
    ├─ Sees: 2 atoms need review
    ├─ Reviews 2 atoms (2 minutes)
    └─ Done for the day!

Result: 100 messages → 5 atoms → 2 human reviews
```

---

## 🛠️ Implementation Status

### ✅ Already Implemented
- Analysis System (proposals, runs, approval workflow)
- Vector DB (embeddings, semantic search, RAG)
- Dashboard (messages, tasks, analytics)
- Background jobs (TaskIQ + NATS)

### 🚧 To Be Implemented (Noise Filtering)
- [ ] Message importance scoring
- [ ] Noise filtering pipeline
- [ ] Signal-only analysis runs
- [ ] Aggregated insights dashboard
- [ ] Drill-down UI
- [ ] Human feedback loop

**Estimated Timeline:** 3 weeks (see [NOISE_FILTERING_ARCHITECTURE.md § Implementation Roadmap](./NOISE_FILTERING_ARCHITECTURE.md#-implementation-roadmap))

---

## 🎓 Learning Resources

### For Understanding User Needs:
1. Start with [USER_NEEDS.md](./USER_NEEDS.md)
2. Read user personas and anti-requirements
3. Understand success metrics

### For Technical Implementation:
1. Read [NOISE_FILTERING_ARCHITECTURE.md](./NOISE_FILTERING_ARCHITECTURE.md)
2. Study importance scoring algorithm
3. Review database schema changes
4. Check implementation roadmap

### For Existing System Context:
1. [ANALYSIS_SYSTEM_ARCHITECTURE.md](./ANALYSIS_SYSTEM_ARCHITECTURE.md) - How analysis runs work
2. [VECTOR_DB_IMPLEMENTATION_PLAN.md](./VECTOR_DB_IMPLEMENTATION_PLAN.md) - Semantic search & RAG
3. [CLAUDE.md](./CLAUDE.md) - Development patterns

---

## 📞 Quick Reference

### When to Read What:

**"Why are we doing this?"**
→ [USER_NEEDS.md](./USER_NEEDS.md)

**"How does it work technically?"**
→ [NOISE_FILTERING_ARCHITECTURE.md](./NOISE_FILTERING_ARCHITECTURE.md)

**"How does analysis system work?"**
→ [ANALYSIS_SYSTEM_ARCHITECTURE.md](./ANALYSIS_SYSTEM_ARCHITECTURE.md)

**"How does vector search work?"**
→ [VECTOR_DB_IMPLEMENTATION_PLAN.md](./VECTOR_DB_IMPLEMENTATION_PLAN.md)

**"What are the coding guidelines?"**
→ [CLAUDE.md](./CLAUDE.md)

**"Where do I start?"**
→ You're reading it! (CONCEPTS_INDEX.md)

---

## 📝 Document Maintenance

**When to Update:**
- USER_NEEDS.md → When user requirements change
- NOISE_FILTERING_ARCHITECTURE.md → When technical design changes
- CONCEPTS_INDEX.md → When new major concepts added

**Version Control:**
- All docs versioned with git
- Breaking changes require version bump
- Link updates trigger CI/CD documentation build

---

## 🎯 Core Philosophy

**The Central Idea:**
> Humans are not data processors. They are decision makers.
> Give them insights, not raw data.

**Design Principles:**
1. **Information Hierarchy** - Show high-level first, details on demand
2. **Eventual Consistency** - Speed of ingestion > immediate processing
3. **Good Enough** - 85% accuracy is better than 100% latency
4. **Human-in-the-Loop** - AI proposes, human approves, AI learns
5. **Scalability** - More messages should NOT mean more human work

---

**This index connects all concepts and provides navigation through the system documentation.**

Last Updated: 2025-10-17
