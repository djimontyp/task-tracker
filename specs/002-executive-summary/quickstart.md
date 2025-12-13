# Quickstart: Executive Summary Epic

**Date**: 2025-12-13

## Prerequisites

1. **Running services**:
   ```bash
   just services-dev
   ```
   This starts: postgres, nats, worker, api, dashboard, nginx

2. **Seeded data** (for testing):
   ```bash
   just db-topics-seed 5 10 20
   ```
   Creates 5 topics with 10 atoms and 20 messages each

3. **Approved atoms** (required for summary):
   - Open http://localhost/dashboard/atoms
   - Approve some atoms (click checkbox → "Approve")
   - Or via API:
     ```bash
     curl -X POST http://localhost/api/v1/atoms/bulk-approve \
       -H "Content-Type: application/json" \
       -d '{"atom_ids": ["<uuid1>", "<uuid2>"]}'
     ```

## Development Setup

### Backend

1. **Create service file**:
   ```bash
   touch backend/app/services/executive_summary_service.py
   ```

2. **Create API endpoint file**:
   ```bash
   touch backend/app/api/v1/executive_summary.py
   ```

3. **Create schema file**:
   ```bash
   touch backend/app/api/v1/schemas/executive_summary.py
   ```

4. **Register router** in `backend/app/api/v1/router.py`:
   ```python
   from app.api.v1 import executive_summary
   api_router.include_router(executive_summary.router)
   ```

5. **Run typecheck**:
   ```bash
   just typecheck
   ```

### Frontend

1. **Create page directory**:
   ```bash
   mkdir -p frontend/src/pages/ExecutiveSummaryPage/components
   mkdir -p frontend/src/pages/ExecutiveSummaryPage/hooks
   ```

2. **Create feature module**:
   ```bash
   mkdir -p frontend/src/features/executive-summary/api
   mkdir -p frontend/src/features/executive-summary/types
   ```

3. **Add route** in `frontend/src/app/routes.tsx`:
   ```typescript
   const ExecutiveSummaryPage = lazy(() => import('@pages/ExecutiveSummaryPage'));

   // Add to routes array:
   {
     path: 'executive-summary',
     element: <ExecutiveSummaryPage />,
   }
   ```

4. **Add navigation** in `frontend/src/shared/components/AppSidebar.tsx`:
   ```typescript
   // In navigation items:
   {
     title: "Executive Summary",
     icon: ClipboardList, // from lucide-react
     href: "/executive-summary",
   }
   ```

## API Testing

### Get Summary (7 days default)
```bash
curl http://localhost/api/v1/executive-summary
```

### Get Summary (14 days)
```bash
curl "http://localhost/api/v1/executive-summary?period_days=14"
```

### Get Stats Only
```bash
curl http://localhost/api/v1/executive-summary/stats
```

### Export Markdown
```bash
curl -X POST http://localhost/api/v1/executive-summary/export \
  -H "Content-Type: application/json" \
  -d '{"period_days": 7, "format": "markdown"}'
```

## Key Files Reference

### Backend
- `backend/app/models/atom.py` - Atom, AtomType enum
- `backend/app/models/topic.py` - Topic model
- `backend/app/services/dashboard_service.py` - Pattern reference
- `backend/app/api/v1/dashboard.py` - Pattern reference

### Frontend
- `frontend/src/pages/DashboardPage/` - Pattern reference
- `frontend/src/shared/components/DataTable/` - For lists
- `frontend/src/shared/ui/badge.tsx` - For status badges
- `frontend/src/shared/tokens/` - Design tokens

## Testing Commands

### Backend Tests
```bash
# Run specific test file
cd backend && uv run pytest tests/api/v1/test_executive_summary.py -v

# Run with coverage
cd backend && uv run pytest tests/api/v1/test_executive_summary.py --cov=app/services/executive_summary_service
```

### Frontend Tests
```bash
# Unit tests
cd frontend && npm run test:run -- ExecutiveSummaryPage

# E2E tests
just e2e-fast tests/e2e/executive-summary.spec.ts
```

### Typecheck
```bash
# Backend
just typecheck

# Frontend
cd frontend && npx tsc --noEmit
```

## Common Issues

### "No atoms in summary"
- Check atoms are `user_approved=true`
- Check atoms are `archived=false`
- Check atom types are `decision` or `problem`
- Check `created_at` is within period

### "Topic not showing"
- Atom must be linked via `topic_atoms` table
- Use API: `POST /api/v1/atoms/{atom_id}/topics/{topic_id}`

### "Export fails"
- Check period_days is 7, 14, or 30
- Check format is "markdown" or "plain_text"

## Design System Quick Reference

### Status Badges (Blockers)
```tsx
// Stale blocker (>14 days)
<Badge variant="destructive" className="gap-1.5">
  <AlertTriangle className="h-3.5 w-3.5" />
  Critical
</Badge>

// Recent blocker
<Badge variant="outline" className="gap-1.5 border-destructive text-destructive">
  <AlertCircle className="h-3.5 w-3.5" />
  Blocker
</Badge>

// Decision
<Badge variant="outline" className="gap-1.5 border-primary text-primary">
  <CheckCircle className="h-3.5 w-3.5" />
  Decision
</Badge>
```

### Period Selector
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

<Select value={period} onValueChange={setPeriod}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Оберіть період" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="7">Останній тиждень</SelectItem>
    <SelectItem value="14">Останні 2 тижні</SelectItem>
    <SelectItem value="30">Останній місяць</SelectItem>
  </SelectContent>
</Select>
```

### Empty State
```tsx
import { EmptyState } from '@/shared/patterns';
import { FileText } from 'lucide-react';

<EmptyState
  icon={FileText}
  title="Немає активності"
  description="За обраний період немає рішень або блокерів"
  action={
    <Button onClick={() => setPeriod(30)}>
      Показати за місяць
    </Button>
  }
/>
```

## Useful Links

- [Spec](./spec.md) - Feature specification
- [Research](./research.md) - Technical decisions
- [Data Model](./data-model.md) - Schemas and types
- [API Contract](./contracts/api.yaml) - OpenAPI spec
- [Design System](../../docs/design-system/README.md) - UI guidelines
