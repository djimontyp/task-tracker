# Sequence: Daily Review (Dashboard Metrics)

**Flow:** Daily Review
**Actor:** PM
**Related Use Case:** UC-001, UC-002
**Related User Flow:** [Daily Review](../flows/README.md#flow-1-daily-review)

---

## Participants

| Component | Technology | Role |
|-----------|------------|------|
| Browser | React SPA | User interface |
| API | FastAPI | REST endpoints |
| MetricsBroadcaster | Python service | Metrics calculation |
| DB | PostgreSQL | Data storage |
| WebSocket | Native WS | Real-time updates |

---

## Sequence Diagram

```
┌─────────┐          ┌─────────┐          ┌───────────────────┐          ┌─────────┐          ┌─────────┐
│ Browser │          │   API   │          │MetricsBroadcaster │          │   DB    │          │   WS    │
└────┬────┘          └────┬────┘          └─────────┬─────────┘          └────┬────┘          └────┬────┘
     │                    │                         │                         │                    │
     │                    │                         │                         │                    │
     │  [1] Page Load     │                         │                         │                    │
     │════════════════════════════════════════════════════════════════════════════════════════════►│
     │  WS Connect: ws://host/ws?topics=metrics     │                         │                    │
     │◄═══════════════════════════════════════════════════════════════════════════════════════════│
     │  (connection established)                    │                         │                    │
     │                    │                         │                         │                    │
     │                    │                         │                         │                    │
     │  [2] GET /api/v1/metrics/dashboard           │                         │                    │
     │───────────────────►│                         │                         │                    │
     │                    │                         │                         │                    │
     │                    │  [3] _calculate_metrics(db)                       │                    │
     │                    │────────────────────────►│                         │                    │
     │                    │                         │                         │                    │
     │                    │                         │  [4] COUNT messages     │                    │
     │                    │                         │────────────────────────►│                    │
     │                    │                         │◄────────────────────────│                    │
     │                    │                         │  (total_messages: 1234) │                    │
     │                    │                         │                         │                    │
     │                    │                         │  [5] COUNT atoms        │                    │
     │                    │                         │────────────────────────►│                    │
     │                    │                         │◄────────────────────────│                    │
     │                    │                         │  (pending: 12, approved: 89)                 │
     │                    │                         │                         │                    │
     │                    │                         │  [6] COUNT topics       │                    │
     │                    │                         │────────────────────────►│                    │
     │                    │                         │◄────────────────────────│                    │
     │                    │                         │  (active_topics: 8)     │                    │
     │                    │                         │                         │                    │
     │                    │                         │  [7] Compute metrics    │                    │
     │                    │                         │  - quality_score        │                    │
     │                    │                         │  - noise_ratio          │                    │
     │                    │                         │  - signal_count         │                    │
     │                    │                         │                         │                    │
     │                    │◄────────────────────────│                         │                    │
     │                    │  DashboardMetrics       │                         │                    │
     │                    │                         │                         │                    │
     │◄───────────────────│                         │                         │                    │
     │  (200) {                                     │                         │                    │
     │    total_messages: 1234,                     │                         │                    │
     │    pending_atoms: 12,                        │                         │                    │
     │    approved_atoms: 89,                       │                         │                    │
     │    active_topics: 8,                         │                         │                    │
     │    quality_score: 0.87,                      │                         │                    │
     │    noise_ratio: 0.23                         │                         │                    │
     │  }                 │                         │                         │                    │
     │                    │                         │                         │                    │
     │                    │                         │                         │                    │
     │══════════════════════════════════════════════════════════════════════════════════════════════
     │                         REAL-TIME UPDATES (Background Loop)                                 │
     │══════════════════════════════════════════════════════════════════════════════════════════════
     │                    │                         │                         │                    │
     │                    │  [8] <async> Every 30s  │                         │                    │
     │                    │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ►│                         │                    │
     │                    │                         │  Recalculate metrics    │                    │
     │                    │                         │────────────────────────►│                    │
     │                    │                         │◄────────────────────────│                    │
     │                    │                         │                         │                    │
     │                    │                         │  [9] broadcast("metrics", {type: "metrics:update"})
     │                    │                         │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ►│
     │                    │                         │                         │                    │
     │◄════════════════════════════════════════════════════════════════════════════════════════════│
     │  WS: {type: "metrics:update", data: {...}}   │                         │                    │
     │                    │                         │                         │                    │
     │  [10] Update UI    │                         │                         │                    │
     │  (React Query invalidate)                    │                         │                    │
     │                    │                         │                         │                    │
     ▼                    ▼                         ▼                         ▼                    ▼
```

---

## Data Flow

### Request: GET /api/v1/metrics/dashboard

**Query Parameters:**
```
period: "today" | "week" | "month"  (default: "today")
```

### Response: DashboardMetrics

```json
{
  "total_messages": 1234,
  "signal_messages": 890,
  "noise_messages": 344,
  "pending_atoms": 12,
  "approved_atoms": 89,
  "rejected_atoms": 5,
  "active_topics": 8,
  "quality_score": 0.87,
  "noise_ratio": 0.23,
  "classification_accuracy": 0.92,
  "updated_at": "2025-01-15T09:30:00Z"
}
```

### WebSocket Event: metrics:update

```json
{
  "type": "metrics:update",
  "topic": "metrics",
  "data": {
    "total_messages": 1235,
    "pending_atoms": 11,
    "quality_score": 0.88
  },
  "timestamp": "2025-01-15T09:30:30Z"
}
```

---

## Business Rules Applied

| Rule | Description |
|------|-------------|
| BR-011 | Noise ratio = noise_messages / total_messages |
| BR-012 | Quality score based on 4-factor algorithm |
| BR-010 | Signal threshold >= 0.7 for classification |

---

## Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| API Response | < 500ms | Cached aggregations |
| WS Broadcast | < 100ms | NATS relay |
| UI Update | < 16ms | React batch update |

---

## Error Handling

```
[Error: DB Connection Failed]
     │
     │  API returns cached metrics (stale: true)
     │  + retry with exponential backoff
     │
[Error: WS Disconnected]
     │
     │  Browser: auto-reconnect (3 attempts)
     │  Fallback: polling GET /metrics every 60s
```

---

**Next:** [Atom Approval Sequence](02-atom-approval.md)
