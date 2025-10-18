# Dashboard Metrics Actualization - Quick Summary

## Problem
DashboardPage shows **real task counts** but **hardcoded trend indicators** (12% up, 8% down, etc.)

## Root Cause
1. Backend `/stats` endpoint returns `total_tasks`, `categories`, `priorities`
2. Frontend expects `total`, `pending`, `in_progress`, `completed`
3. **Type mismatch** between backend and frontend
4. No historical data for trend calculation

## Solution Overview

### Backend Changes
**File**: `backend/app/api/v1/stats.py`
- Add historical comparison (7-day vs previous 7-day)
- Calculate real trend percentages
- Return status breakdown (open, in_progress, completed, closed)

### Frontend Changes
**File**: `frontend/src/pages/DashboardPage/index.tsx`
- Remove hardcoded trends (lines 64-81)
- Use real trend data from backend
- Fix type mismatch

## Placeholder Metrics Found

### Currently Hardcoded
```typescript
// Line 64-81 in DashboardPage/index.tsx
trend: { value: 12, direction: 'up' as const },  // FAKE
trend: { value: 8, direction: 'down' as const }, // FAKE
trend: { value: 5, direction: 'up' as const },   // FAKE
trend: { value: 3, direction: 'up' as const },   // FAKE
```

## Recommended New Metrics

### Already Available (Not Used)
1. **Sidebar Counts** - `GET /api/v1/sidebar-counts`
   - Unclosed analysis runs
   - Pending proposals

2. **Noise Stats** - `GET /api/v1/noise/stats`
   - Signal ratio
   - Messages needing review

### Should Add
3. **Task Trends** - Historical comparison
4. **AI Analysis Health** - Run status, proposal counts
5. **System Activity** - Messages today, active sources

## Files to Modify

### Backend (3 files)
1. `backend/app/api/v1/response_models.py` - Update StatsResponse schema
2. `backend/app/api/v1/stats.py` - Add trend calculation
3. `backend/app/models/enums.py` - Verify TaskStatus enum

### Frontend (2 files)
1. `frontend/src/shared/types/index.ts` - Fix TaskStats interface
2. `frontend/src/pages/DashboardPage/index.tsx` - Use real trends

## Priority
**High** - Dashboard is primary PM tool, placeholder data misleads users

## Effort
**Medium** - 2-3 days (backend + frontend + testing)

## Risk
**Medium** - Breaking change to `/stats` endpoint response format

---

**Full Report**: See `dashboard-analysis-report.md` for complete technical details
