# Sequence: Atom Approval

**Flow:** Atom Approval
**Actor:** PM
**Related Use Case:** UC-003
**Related User Flow:** [Atom Approval](../flows/README.md#flow-2-atom-approval)

---

## Participants

| Component | Technology | Role |
|-----------|------------|------|
| Browser | React SPA | User interface |
| API | FastAPI | REST endpoints |
| AtomCRUD | Python service | Atom business logic |
| DB | PostgreSQL | Data storage |
| WebSocket | Native WS | Real-time broadcast |
| NATS | JetStream | Async events |

---

## Sequence Diagram

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
│ Browser │       │   API   │       │ AtomCRUD │       │   DB    │       │   WS    │       │  NATS   │
└────┬────┘       └────┬────┘       └────┬─────┘       └────┬────┘       └────┬────┘       └────┬────┘
     │                 │                 │                  │                 │                 │
     │  [1] User clicks "Approve" on AtomCard              │                 │                 │
     │                 │                 │                  │                 │                 │
     │  POST /api/v1/atoms/bulk-approve  │                  │                 │                 │
     │  {atom_ids: ["uuid-1", "uuid-2"]} │                  │                 │                 │
     │────────────────►│                 │                  │                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │  [2] Validate atom_ids exist       │                 │                 │
     │                 │────────────────►│                  │                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │  [3] SELECT * FROM atoms           │                 │
     │                 │                 │  WHERE id IN (uuid-1, uuid-2)      │                 │
     │                 │                 │─────────────────►│                 │                 │
     │                 │                 │◄─────────────────│                 │                 │
     │                 │                 │  (2 atoms found) │                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │  [4] Validate: user_approved = false                 │
     │                 │                 │  (can't re-approve already approved)                │
     │                 │                 │                  │                 │                 │
     │                 │◄────────────────│                  │                 │                 │
     │                 │  (validation OK)│                  │                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │  [5] bulk_approve_atoms(atom_ids)  │                 │                 │
     │                 │────────────────►│                  │                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │  [6] BEGIN TRANSACTION              │                 │
     │                 │                 │─────────────────►│                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │  [7] UPDATE atoms │                 │                 │
     │                 │                 │  SET user_approved = true,          │                 │
     │                 │                 │      updated_at = NOW()             │                 │
     │                 │                 │  WHERE id IN (...)│                 │                 │
     │                 │                 │─────────────────►│                 │                 │
     │                 │                 │◄─────────────────│                 │                 │
     │                 │                 │  (2 rows updated)│                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │  [8] INSERT INTO atom_versions      │                 │
     │                 │                 │  (snapshot for each atom)           │                 │
     │                 │                 │─────────────────►│                 │                 │
     │                 │                 │◄─────────────────│                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │  [9] COMMIT      │                 │                 │
     │                 │                 │─────────────────►│                 │                 │
     │                 │                 │◄─────────────────│                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │◄────────────────│                  │                 │                 │
     │                 │  ApproveResult  │                  │                 │                 │
     │                 │  {approved_count: 2}               │                 │                 │
     │                 │                 │                  │                 │                 │
     │                 │                 │                  │                 │                 │
     │══════════════════════════════════════════════════════════════════════════════════════════════
     │                              REAL-TIME NOTIFICATIONS                                        │
     │══════════════════════════════════════════════════════════════════════════════════════════════
     │                 │                 │                  │                 │                 │
     │                 │  [10] broadcast("knowledge", event)│                 │                 │
     │                 │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│                 │
     │                 │                 │                  │                 │                 │
     │                 │  [11] publish("version.updated")   │                 │                 │
     │                 │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│
     │                 │                 │                  │                 │                 │
     │◄════════════════════════════════════════════════════════════════════════│                 │
     │  WS: {type: "atom_updated", atom_ids: [...]}        │                 │                 │
     │                 │                 │                  │                 │                 │
     │◄────────────────│                 │                  │                 │                 │
     │  (200) {approved_count: 2}        │                  │                 │                 │
     │                 │                 │                  │                 │                 │
     │  [12] Update UI │                 │                  │                 │                 │
     │  - Remove atoms from "pending" list                 │                 │                 │
     │  - Show toast: "2 atoms approved" │                  │                 │                 │
     │  - Invalidate queries             │                  │                 │                 │
     │                 │                 │                  │                 │                 │
     ▼                 ▼                 ▼                  ▼                 ▼                 ▼
```

---

## Alternative Flow: Single Atom Approval

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Browser │       │   API   │       │   DB    │
└────┬────┘       └────┬────┘       └────┬────┘
     │                 │                 │
     │  PATCH /api/v1/atoms/{atom_id}    │
     │  {user_approved: true}            │
     │────────────────►│                 │
     │                 │                 │
     │                 │  UPDATE atoms   │
     │                 │  SET user_approved = true
     │                 │────────────────►│
     │                 │◄────────────────│
     │                 │                 │
     │◄────────────────│                 │
     │  (200) AtomResponse               │
     │                 │                 │
     ▼                 ▼                 ▼
```

---

## Data Flow

### Request: POST /api/v1/atoms/bulk-approve

```json
{
  "atom_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ]
}
```

### Response: ApproveResult

```json
{
  "approved_count": 2,
  "approved_ids": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002"
  ],
  "failed_ids": [],
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### WebSocket Event: atom_updated

```json
{
  "type": "atom_updated",
  "topic": "knowledge",
  "data": {
    "action": "approved",
    "atom_ids": ["uuid-1", "uuid-2"],
    "approved_by": "user-uuid",
    "timestamp": "2025-01-15T10:00:00Z"
  }
}
```

### NATS Event: version.updated

```json
{
  "event": "version.updated",
  "entity_type": "atom",
  "entity_ids": ["uuid-1", "uuid-2"],
  "version_ids": ["ver-1", "ver-2"],
  "action": "approved",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## Business Rules Applied

| Rule | Description |
|------|-------------|
| BR-001 | Atom requires user_approved = true to be visible in knowledge base |
| BR-003 | Each status change creates atom_version snapshot |
| BR-005 | Approved atoms count toward quality_score |

---

## Error Handling

```
[Error: Atom not found]
     │
     │  (404) {error: "Atom uuid-x not found"}
     │
[Error: Already approved]
     │
     │  (400) {error: "Atom uuid-x already approved"}
     │
[Error: Transaction failed]
     │
     │  Rollback all changes
     │  (500) {error: "Approval failed, please retry"}
```

---

## Rejection Flow

Same sequence, but:
- `user_approved` stays `false`
- `archived` set to `true` (soft delete)
- WebSocket event: `{type: "atom_rejected"}`

---

**Next:** [Weekly Report Sequence](03-weekly-report.md)
