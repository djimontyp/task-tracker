# Phase 3 API - Quick Reference

**Full Spec:** [phase-3-api-spec.md](./phase-3-api-spec.md)

---

## Endpoint Summary

### Topic Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/knowledge/topics/proposals` | List with filters |
| `GET` | `/knowledge/topics/proposals/{id}` | Get single proposal |
| `PUT` | `/knowledge/topics/proposals/{id}/approve` | Approve → create Topic |
| `PUT` | `/knowledge/topics/proposals/{id}/reject` | Reject proposal |
| `PUT` | `/knowledge/topics/proposals/{id}/merge` | Merge into existing |
| `POST` | `/knowledge/topics/proposals/bulk/approve` | Bulk approve |

### Atom Proposals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/knowledge/atoms/proposals` | List with filters |
| `GET` | `/knowledge/atoms/proposals/{id}` | Get single proposal |
| `PUT` | `/knowledge/atoms/proposals/{id}/approve` | Approve → create Atom |
| `PUT` | `/knowledge/atoms/proposals/{id}/reject` | Reject proposal |
| `PUT` | `/knowledge/atoms/proposals/{id}/merge` | Merge into existing |
| `POST` | `/knowledge/atoms/proposals/bulk/approve` | Bulk approve |

### Bulk Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/knowledge/proposals/bulk/reject` | Reject multiple proposals |

### Version History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/knowledge/topics/{id}/history` | Topic revision history |
| `GET` | `/knowledge/atoms/{id}/history` | Atom revision history |

---

## Key Filters

**Topic Proposals:**
- `status` - pending/approved/rejected/merged
- `confidence_min` / `confidence_max` - 0.0-1.0
- `run_id` - UUID
- `has_duplicate` - boolean

**Atom Proposals:**
- All topic filters plus:
- `type` - problem/solution/decision/insight/question/pattern/requirement
- `topic_proposal_id` - UUID

---

## Status Flow

```
pending → approve → approved (creates entity)
pending → reject → rejected
pending → merge → merged (updates existing)
```

---

## Common Patterns

### List High-Confidence Pending

```bash
GET /knowledge/topics/proposals?status=pending&confidence_min=0.8
```

### Approve Single

```bash
PUT /knowledge/topics/proposals/{id}/approve
Body: {"review_notes": "Looks good"}
```

### Bulk Approve by Confidence

```bash
POST /knowledge/topics/proposals/bulk/approve
Body: {
  "confidence_threshold": 0.95,
  "exclude_duplicates": true,
  "max_count": 50
}
```

### Merge Duplicate

```bash
PUT /knowledge/atoms/proposals/{id}/merge
Body: {
  "target_atom_id": 498,
  "merge_strategy": "append_content",
  "transfer_links": true
}
```

---

## WebSocket Events

**Format:** `knowledge.{entity}.{action}`

**Topics:**
- `knowledge.topic_proposal.approved`
- `knowledge.topic_proposal.rejected`
- `knowledge.topic_proposal.merged`

**Atoms:**
- `knowledge.atom_proposal.approved`
- `knowledge.atom_proposal.rejected`
- `knowledge.atom_proposal.merged`

**Bulk:**
- `knowledge.bulk.approval_completed`

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (invalid params) |
| 401 | Unauthorized (missing token) |
| 404 | Not Found (proposal doesn't exist) |
| 409 | Conflict (already reviewed) |
| 422 | Validation Error (Pydantic) |

---

## Implementation Checklist

### Database (Phase 0)
- [ ] Create `topic_proposals` table
- [ ] Create `atom_proposals` table
- [ ] Create `knowledge_extraction_runs` table
- [ ] Create `topic_revisions` table
- [ ] Create `atom_revisions` table
- [ ] Add indexes (run_id, status, confidence, created_at)

### Models
- [ ] TopicProposal model
- [ ] AtomProposal model
- [ ] KnowledgeExtractionRun model
- [ ] TopicRevision model
- [ ] AtomRevision model
- [ ] Pydantic schemas (Create/Update/Public)

### Services
- [ ] TopicProposalCRUD
- [ ] AtomProposalCRUD
- [ ] KnowledgeExtractionRunCRUD
- [ ] SimilarityService (duplicate detection)
- [ ] VersionHistoryService

### API Endpoints
- [ ] Topic proposals CRUD
- [ ] Atom proposals CRUD
- [ ] Bulk operations
- [ ] Version history

### Background Jobs
- [ ] Auto-review high-confidence (0.95+)
- [ ] Proposal expiration (30 days)

### WebSocket Events
- [ ] Broadcast approval events
- [ ] Broadcast rejection events
- [ ] Broadcast merge events
- [ ] Broadcast bulk completion

### Tests
- [ ] Unit tests (services)
- [ ] Integration tests (API)
- [ ] WebSocket event tests
- [ ] Bulk operation tests

---

**Created:** October 23, 2025
**For:** Phase 3 Implementation
