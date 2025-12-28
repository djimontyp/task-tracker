# ADR-008: Unified Scoring Configuration

**Status:** Accepted
**Date:** 2025-12-28
**Context:** Scoring thresholds hardcoded in 3+ places with different values

## Problem

Scoring thresholds (signal/noise boundaries) were duplicated:

| Location | noise | signal | Status |
|----------|-------|--------|--------|
| `ai_config.py` | 0.25 | 0.65 | Centralized but unused |
| `statusBadges.ts` | 0.3 | 0.7 | Hardcoded |
| `noise.py` SQL | 0.3 | 0.7 | Hardcoded |

**Impact:** UI showed 23 noise / 0 signals because threshold was 0.7 but max score was 0.63.

## Decision

Single source of truth via API endpoint:

```
ai_config.py (source) → GET /api/v1/config/scoring → Frontend fetch
```

### Backend

- New endpoint: `GET /api/v1/config/scoring`
- Returns thresholds from `ai_config.message_scoring`
- `noise.py` uses `ai_config` instead of hardcoded values

### Frontend

- `useScoringConfig()` hook fetches config on app start
- `statusBadges.ts` functions accept optional config parameter
- Default fallback values if API unavailable

## Thresholds (Calibrated Dec 2025)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `noise_threshold` | **0.30** | Ensures "Ок", "👍" (content_score=0.1) fall below with neutral factors |
| `signal_threshold` | **0.60** | Ensures "Критичний баг" (content_score=0.8) exceeds with neutral factors |

### Threshold Calculation

With weights 40/20/20/20 and content_score extremes:

```
Noise case ("Ок"): 0.1×0.4 + 0.5×0.6 = 0.04 + 0.30 = 0.34 → needs threshold ≤0.35
Signal case ("bug"): 0.8×0.4 + 0.5×0.6 = 0.32 + 0.30 = 0.62 → needs threshold ≤0.62
```

Previous 0.25/0.65 thresholds were too tight for the weighted scoring algorithm.

## Files Changed

**Backend:**
- `backend/app/api/v1/config.py` (new)
- `backend/app/api/v1/noise.py`
- `backend/app/services/importance_scorer.py`

**Frontend:**
- `frontend/src/shared/api/scoringConfig.ts` (new)
- `frontend/src/shared/utils/statusBadges.ts`
- `frontend/src/pages/MessagesPage/*`

## Consequences

**Positive:**
- Single source of truth
- Runtime configurable via env vars
- Consistent UI/backend behavior

**Negative:**
- Extra API call on app start (mitigated by caching)
