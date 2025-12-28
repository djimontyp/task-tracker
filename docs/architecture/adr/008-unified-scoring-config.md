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

## Thresholds (Optimized)

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `noise_threshold` | 0.25 | Grid search Oct 2025: F1=85.2% (+24.3% vs 0.30) |
| `signal_threshold` | 0.65 | Improves signal recall (92.7%) |

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
