# Sequence: Weekly Report

**Flow:** Weekly Report
**Actor:** CTO
**Related Use Case:** UC-010
**Related User Flow:** [Weekly Report](../flows/README.md#flow-3-weekly-report)

---

## Participants

| Component | Technology | Role |
|-----------|------------|------|
| Browser | React SPA | User interface |
| API | FastAPI | REST endpoints |
| ActivityService | Python | Data aggregation |
| DB | PostgreSQL | Data storage |

---

## Sequence Diagram

```
┌─────────┐          ┌─────────┐          ┌─────────────────┐          ┌─────────┐
│ Browser │          │   API   │          │ ActivityService │          │   DB    │
└────┬────┘          └────┬────┘          └────────┬────────┘          └────┬────┘
     │                    │                        │                        │
     │  [1] User opens Reports page / Dashboard    │                        │
     │                    │                        │                        │
     │  GET /api/v1/stats/activity?period=week     │                        │
     │───────────────────►│                        │                        │
     │                    │                        │                        │
     │                    │  [2] Parse parameters  │                        │
     │                    │  - period: "week"      │                        │
     │                    │  - date_from: NOW() - 7 days                    │
     │                    │  - date_to: NOW()      │                        │
     │                    │                        │                        │
     │                    │  [3] get_activity_data(period)                  │
     │                    │───────────────────────►│                        │
     │                    │                        │                        │
     │                    │                        │  [4] Query messages by hour
     │                    │                        │                        │
     │                    │                        │  SELECT                │
     │                    │                        │    DATE_TRUNC('hour', sent_at) as ts,
     │                    │                        │    source_id,          │
     │                    │                        │    COUNT(*) as count   │
     │                    │                        │  FROM messages         │
     │                    │                        │  WHERE sent_at BETWEEN │
     │                    │                        │    date_from AND date_to
     │                    │                        │  GROUP BY ts, source_id│
     │                    │                        │  ORDER BY ts           │
     │                    │                        │─────────────────────────►
     │                    │                        │◄─────────────────────────
     │                    │                        │  (168 hourly buckets)  │
     │                    │                        │                        │
     │                    │                        │  [5] Query source names│
     │                    │                        │                        │
     │                    │                        │  SELECT id, name       │
     │                    │                        │  FROM sources          │
     │                    │                        │  WHERE id IN (...)     │
     │                    │                        │─────────────────────────►
     │                    │                        │◄─────────────────────────
     │                    │                        │  (source mapping)      │
     │                    │                        │                        │
     │                    │                        │  [6] Aggregate by type │
     │                    │                        │                        │
     │                    │                        │  SELECT                │
     │                    │                        │    atom_type,          │
     │                    │                        │    COUNT(*) as count   │
     │                    │                        │  FROM atoms            │
     │                    │                        │  WHERE created_at BETWEEN
     │                    │                        │    date_from AND date_to
     │                    │                        │  GROUP BY atom_type    │
     │                    │                        │─────────────────────────►
     │                    │                        │◄─────────────────────────
     │                    │                        │  (type distribution)   │
     │                    │                        │                        │
     │                    │                        │  [7] Calculate trends  │
     │                    │                        │  - Compare to previous │
     │                    │                        │    period              │
     │                    │                        │  - % change            │
     │                    │                        │                        │
     │                    │◄───────────────────────│                        │
     │                    │  ActivityDataResponse  │                        │
     │                    │                        │                        │
     │◄───────────────────│                        │                        │
     │  (200) {                                    │                        │
     │    period: "week",                          │                        │
     │    date_from: "2025-01-08",                 │                        │
     │    date_to: "2025-01-15",                   │                        │
     │    timestamps: [...],                       │                        │
     │    sources: [...],                          │                        │
     │    counts: [...],                           │                        │
     │    atom_distribution: {...},                │                        │
     │    trends: {...}                            │                        │
     │  }                 │                        │                        │
     │                    │                        │                        │
     │  [8] Render charts │                        │                        │
     │  - ActivityHeatmap │                        │                        │
     │  - TrendsList      │                        │                        │
     │  - AtomTypePieChart│                        │                        │
     │                    │                        │                        │
     ▼                    ▼                        ▼                        ▼
```

---

## Optional: Export to PDF

```
┌─────────┐          ┌─────────┐          ┌─────────────────┐
│ Browser │          │   API   │          │ PDFGenerator    │
└────┬────┘          └────┬────┘          └────────┬────────┘
     │                    │                        │
     │  [1] User clicks "Export PDF"               │
     │                    │                        │
     │  POST /api/v1/reports/weekly/export         │
     │  {period: "week", format: "pdf"}            │
     │───────────────────►│                        │
     │                    │                        │
     │                    │  [2] Generate PDF      │
     │                    │───────────────────────►│
     │                    │                        │
     │                    │  - Fetch all data      │
     │                    │  - Render templates    │
     │                    │  - Create PDF bytes    │
     │                    │                        │
     │                    │◄───────────────────────│
     │                    │  PDF binary            │
     │                    │                        │
     │◄───────────────────│                        │
     │  (200) Binary PDF  │                        │
     │  Content-Type: application/pdf              │
     │  Content-Disposition: attachment            │
     │                    │                        │
     │  [3] Browser downloads file                 │
     │                    │                        │
     ▼                    ▼                        ▼
```

---

## Data Flow

### Request: GET /api/v1/stats/activity

**Query Parameters:**
```
period: "day" | "week" | "month" | "year"  (required)
date_from: ISO date string  (optional, overrides period)
date_to: ISO date string    (optional, overrides period)
```

### Response: ActivityDataResponse

```json
{
  "period": "week",
  "date_from": "2025-01-08T00:00:00Z",
  "date_to": "2025-01-15T00:00:00Z",
  "timestamps": [
    "2025-01-08T00:00:00Z",
    "2025-01-08T01:00:00Z",
    ...
  ],
  "sources": [
    {"id": "uuid-1", "name": "#project-team"},
    {"id": "uuid-2", "name": "#engineering"}
  ],
  "data": [
    {"timestamp": "2025-01-08T09:00:00Z", "source_id": "uuid-1", "count": 45},
    {"timestamp": "2025-01-08T09:00:00Z", "source_id": "uuid-2", "count": 23},
    ...
  ],
  "atom_distribution": {
    "task": 34,
    "decision": 12,
    "problem": 8,
    "insight": 15,
    "question": 6
  },
  "trends": {
    "total_messages": {"value": 1234, "change": 12.5},
    "signals": {"value": 890, "change": 8.2},
    "atoms_created": {"value": 75, "change": -3.1},
    "approval_rate": {"value": 0.87, "change": 2.0}
  }
}
```

---

## Business Rules Applied

| Rule | Description |
|------|-------------|
| BR-020 | Week = last 7 days from current date |
| BR-021 | Trends compare current period to previous |
| BR-022 | Change % = ((current - previous) / previous) * 100 |

---

## Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| Activity Query | < 1s | Indexed on sent_at |
| Aggregation | < 500ms | PostgreSQL native |
| Full Response | < 2s | Including trends |

---

## SQL Optimization

```sql
-- Index for fast time-range queries
CREATE INDEX idx_messages_sent_at ON messages (sent_at);

-- Partial index for signals only
CREATE INDEX idx_messages_signals ON messages (sent_at)
WHERE noise_classification = 'signal';
```

---

**Next:** [Knowledge Search Sequence](04-knowledge-search.md)
