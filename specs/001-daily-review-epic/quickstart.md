# Quickstart: Daily Review Epic

**Branch**: `001-daily-review-epic` | **Date**: 2025-12-13

## Prerequisites

1. **Docker + Docker Compose** installed
2. **Node.js 18+** installed
3. **uv** Python package manager
4. Services running: `just services-dev`

## Quick Verification

### 1. Check Existing API Endpoints

```bash
# Messages with Signal filter (EXISTING)
curl -s "http://localhost/api/v1/messages?classification=signal&page_size=5" | jq '.items | length'
# Expected: number of signal messages

# Atoms list (EXISTING)
curl -s "http://localhost/api/v1/atoms?limit=5" | jq '.total'
# Expected: total atom count

# Recent Topics (EXISTING)
curl -s "http://localhost/api/v1/topics/recent?period=week&limit=5" | jq '.items | length'
# Expected: number of recent topics

# Bulk Approve (EXISTING)
curl -s -X POST "http://localhost/api/v1/atoms/bulk-approve" \
  -H "Content-Type: application/json" \
  -d '{"atom_ids": []}' | jq '.approved_count'
# Expected: 0 (empty list)
```

### 2. Seed Test Data

```bash
# Full database reset with test data
just db-full-reset

# Or individual seeds:
just db-seed 50         # 50 messages
just db-topics-seed 5 10 20  # 5 topics, 10 atoms, 20 messages each
```

### 3. Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server (already running via docker)
# Access at http://localhost/dashboard

# Run Storybook for component development
npm run storybook
# Access at http://localhost:6006
```

## Implementation Checklist

### Backend (NEW)

- [ ] Create `backend/app/api/v1/dashboard.py` with `/metrics` endpoint
- [ ] Create `backend/app/services/dashboard_service.py`
- [ ] Add `BulkRejectRequest/Response` to `backend/app/models/atom.py`
- [ ] Add `/atoms/bulk-reject` endpoint to `backend/app/api/v1/atoms.py`
- [ ] Register dashboard router in `backend/app/api/v1/router.py`
- [ ] Run `just typecheck` to verify

### Frontend (NEW/UPDATE)

- [ ] Create `frontend/src/pages/AtomsPage/` with type grouping
- [ ] Update `frontend/src/pages/DashboardPage/` to use new metrics API
- [ ] Add Signal/Noise filter toggle to `frontend/src/pages/MessagesPage/`
- [ ] Create `frontend/src/shared/api/dashboard.ts` hooks
- [ ] Add Storybook stories for new components
- [ ] Run `npm run lint` to verify Design System compliance

### Tests

- [ ] Add `backend/tests/api/test_dashboard.py`
- [ ] Add `backend/tests/services/test_dashboard_service.py`
- [ ] Add Vitest tests for new frontend components
- [ ] Add Playwright E2E test for daily review flow

## Key Files Reference

### Existing (Read-Only)

| File | Purpose |
|------|---------|
| `backend/app/models/message.py` | Message model with noise_classification |
| `backend/app/models/atom.py` | Atom model, BulkApprove schemas |
| `backend/app/models/topic.py` | Topic model, RecentTopicsResponse |
| `backend/app/api/v1/messages.py` | Messages API with classification filter |
| `backend/app/api/v1/atoms.py` | Atoms API with bulk-approve |
| `backend/app/api/v1/topics.py` | Topics API with /recent |

### New (To Create)

| File | Purpose |
|------|---------|
| `backend/app/api/v1/dashboard.py` | Dashboard metrics endpoint |
| `backend/app/services/dashboard_service.py` | Metrics aggregation logic |
| `frontend/src/pages/AtomsPage/index.tsx` | Atoms review page |
| `frontend/src/shared/api/dashboard.ts` | Dashboard API hooks |

## Development Commands

```bash
# Backend
just typecheck           # mypy type check
just test                # pytest suite
just fmt                 # format code

# Frontend
cd frontend
npm run lint            # ESLint (Design System rules)
npm run test:run        # Vitest tests
npm run storybook       # Component library

# Full stack
just services-dev       # Start with live reload
just rebuild backend    # Rebuild after changes
```

## API Contracts

See `contracts/openapi-daily-review.yaml` for:
- `GET /api/v1/dashboard/metrics` - NEW
- `POST /api/v1/atoms/bulk-reject` - NEW
- Existing endpoints documented for reference

## Success Criteria Verification

| Criteria | How to Verify |
|----------|---------------|
| Dashboard loads <2s | Browser DevTools → Network → initial load time |
| Bulk approve 10 atoms <1s | `time curl -X POST /atoms/bulk-approve` |
| Signal filter works | UI shows only signal messages by default |
| Atoms grouped by type | UI shows collapsible type sections |
| Topics show counts | TopicCard displays message_count, atoms_count |

## Troubleshooting

### No data on Dashboard

```bash
# Check if messages exist
curl -s "http://localhost/api/v1/messages" | jq '.total'

# Seed data if needed
just db-topics-seed
```

### API returns 500

```bash
# Check backend logs
docker logs task-tracker-api -f

# Verify typecheck passes
just typecheck
```

### Frontend lint errors

```bash
cd frontend

# Check for Design System violations
ESLINT_USE_FLAT_CONFIG=false npx eslint src --ext .ts,.tsx

# Common fixes:
# - Replace bg-red-* with bg-semantic-error
# - Replace p-3/p-5 with p-2/p-4
```
