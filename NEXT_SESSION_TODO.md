# Next Session TODO

## 🎯 Priority 1: Pipeline Integration (CRITICAL)

**Goal:** Integrate noise filtering into analysis runs to exclude noise messages from processing.

### Tasks:
- [ ] Modify `execute_analysis_run()` in `/backend/app/services/analysis_service.py`
  - Add filter: `WHERE status IN ('signal', 'weak_signal')`
  - Add filter: `AND exclude_from_analysis = FALSE`
  - Exclude noise messages from batches

- [ ] Update embedding generation task
  - Skip noise messages (don't generate embeddings)
  - Only process signal/weak_signal messages
  - File: `/backend/app/tasks.py` - embedding tasks

- [ ] Add metrics tracking
  - Log: "Processing X signal messages (Y noise excluded)"
  - Track cost savings from skipped embeddings
  - Monitor signal/noise ratio per analysis run

**Expected Impact:**
- Faster analysis runs (process 20% instead of 100%)
- 80% reduction in embedding costs
- More accurate atoms (no noise contamination)
- Better RAG context (signal messages only)

**Files to Modify:**
- `/backend/app/services/analysis_service.py`
- `/backend/app/tasks.py` (embedding generation)
- `/backend/tests/integration/test_analysis_pipeline.py` (tests)

---

## 🎯 Priority 2: Frontend Polish

**Goal:** Add drill-down capability and human feedback UI.

### Tasks:

#### 2.1 Drill-Down to Source Messages
- [ ] Create API endpoint: `GET /api/v1/atoms/{atom_id}/drill-down`
  - Return atom details + source messages
  - Include importance scores and noise factors
  - File: `/backend/app/api/v1/atoms.py`

- [ ] Add drill-down UI component
  - Click atom → modal with source messages
  - Show message content, score, classification
  - File: `/frontend/src/pages/AtomsPage/DrillDownModal.tsx`

- [ ] Add "View Sources" button to atom cards
  - File: `/frontend/src/pages/AtomsPage/components/AtomCard.tsx`

#### 2.2 Mark Message as Irrelevant
- [ ] Create API endpoint: `POST /api/v1/messages/{id}/mark-irrelevant`
  - Set `exclude_from_analysis = TRUE`
  - Set `marked_by_human = TRUE`
  - Store feedback reason in JSONB
  - Recalculate related atoms confidence
  - File: `/backend/app/api/v1/messages.py`

- [ ] Add "Mark Irrelevant" button to message rows
  - Show confirmation dialog with reason input
  - Toast notification on success
  - File: `/frontend/src/pages/MessagesPage/components/MarkIrrelevantButton.tsx`

- [ ] Update atom confidence after feedback
  - Remove message from atom.source_message_ids
  - Recalculate atom confidence
  - Auto-reject atom if no sources left

**Expected Impact:**
- Better transparency (see where atoms come from)
- Human-in-the-loop learning
- Improved scoring accuracy over time

**Files to Create:**
- `/frontend/src/pages/AtomsPage/DrillDownModal.tsx`
- `/frontend/src/pages/MessagesPage/components/MarkIrrelevantButton.tsx`

**Files to Modify:**
- `/backend/app/api/v1/atoms.py` (new endpoint)
- `/backend/app/api/v1/messages.py` (new endpoint)
- `/frontend/src/pages/AtomsPage/components/AtomCard.tsx`

---

## 🎯 Priority 3: Advanced Features (Optional)

**Goal:** Enhance system with ML and automation.

### Tasks:

#### 3.1 Machine Learning Model
- [ ] Collect training data
  - Export scored messages with human feedback
  - Create dataset: features → importance_score

- [ ] Train simple ML model
  - Random Forest or LightGBM
  - Features: content embeddings, author stats, temporal signals
  - Replace heuristic scoring with ML predictions

- [ ] A/B testing
  - Run heuristic vs ML in parallel
  - Compare accuracy and user feedback
  - Gradual rollout

#### 3.2 User Feedback Learning Loop
- [ ] Create feedback collection system
  - Track human corrections (mark irrelevant, edit scores)
  - Store in `human_feedback` JSONB field

- [ ] Build feedback dashboard
  - Show disagreements between system and humans
  - Identify scoring blind spots
  - Tune thresholds based on data

#### 3.3 Per-Topic Noise Thresholds
- [ ] Add `noise_threshold` field to Topics table
- [ ] Allow admins to configure thresholds per topic
- [ ] Use topic-specific thresholds in scoring

#### 3.4 Anomaly Detection
- [ ] Detect sudden noise spikes
  - Alert if noise ratio > 90% in 1 hour
  - Flag potential spam attacks

- [ ] Detect sudden signal spikes
  - Alert if signal ratio > 80% (unusual)
  - May indicate important event

**Expected Impact:**
- 90%+ accuracy (vs 70-80% with heuristics)
- Adaptive system that learns from usage
- Better handling of edge cases

---

## 📊 Session Metrics

**Current State (October 17, 2025):**
- ✅ Backend scoring system: 100% complete
- ✅ API endpoints: 100% complete
- ✅ Frontend UI: 100% complete
- ✅ Auto-scoring: 100% complete
- ❌ Pipeline integration: 0% complete
- ❌ Drill-down UI: 0% complete
- ❌ Human feedback: 0% complete

**Overall Progress: 50%**

**Next Session Goal:**
- Complete Priority 1 (Pipeline Integration) → 70% overall
- Complete Priority 2 (Frontend Polish) → 85% overall

---

## 🔗 Related Documents

- [NOISE_FILTERING.md](./docs/architecture/NOISE_FILTERING.md) - Technical architecture
- [OVERVIEW.md](./docs/architecture/OVERVIEW.md) - System overview and user requirements
- [ANALYSIS_SYSTEM.md](./docs/architecture/ANALYSIS_SYSTEM.md) - Analysis pipeline architecture

---

**Created:** October 17, 2025
**For:** Next development session
**Estimated Time:** Priority 1 (2-3 hours) + Priority 2 (2-3 hours) = 4-6 hours total
