# Phase 3: Knowledge Proposal System - API Specification

**Version:** 1.0
**Created:** October 23, 2025
**Status:** Implementation Ready
**Base Path:** `/api/v1/knowledge`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Topic Proposals API](#topic-proposals-api)
4. [Atom Proposals API](#atom-proposals-api)
5. [Bulk Operations API](#bulk-operations-api)
6. [Version History API](#version-history-api)
7. [Data Schemas](#data-schemas)
8. [Error Responses](#error-responses)
9. [WebSocket Events](#websocket-events)
10. [OpenAPI Examples](#openapi-examples)

---

## Overview

This API enables proposal-review-approval workflow for auto-extracted knowledge (Topics and Atoms). Following the proven TaskProposal pattern, it provides endpoints for:

- **CRUD operations** on topic and atom proposals
- **Review actions** (approve, reject, merge)
- **Bulk operations** for efficient review
- **Version history** tracking for auditability
- **Duplicate detection** with similarity scoring

### Design Principles

1. **Consistency:** Mirror TaskProposal API patterns exactly
2. **Type Safety:** Full Pydantic validation on all schemas
3. **Transparency:** All LLM reasoning exposed in responses
4. **Auditability:** Track who reviewed what and when
5. **Performance:** Pagination, filtering, and indexes required

---

## Authentication & Authorization

### Required Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Permission Levels

| Action | Permission Required | Notes |
|--------|-------------------|-------|
| List proposals | `knowledge:read` | View pending proposals |
| Get proposal details | `knowledge:read` | Access single proposal |
| Approve proposal | `knowledge:approve` | Create final entity from proposal |
| Reject proposal | `knowledge:approve` | Mark as rejected |
| Merge proposals | `knowledge:approve` | Consolidate duplicates |
| Bulk operations | `knowledge:approve` | Batch review actions |
| View history | `knowledge:read` | Access version history |

**Note:** For MVP, all authenticated users have `knowledge:approve`. Future versions may restrict to specific roles.

---

## Topic Proposals API

### List Topic Proposals

**Endpoint:** `GET /knowledge/topics/proposals`

**Description:** Retrieve paginated list of topic proposals with filtering options.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skip` | integer | No | 0 | Records to skip (pagination) |
| `limit` | integer | No | 100 | Max records (1-1000) |
| `run_id` | UUID | No | null | Filter by extraction run |
| `status` | string | No | null | Filter by status |
| `confidence_min` | float | No | null | Min confidence (0.0-1.0) |
| `confidence_max` | float | No | null | Max confidence (0.0-1.0) |
| `has_duplicate` | boolean | No | null | Filter proposals with similar entities |

**Status Values:** `pending`, `approved`, `rejected`, `merged`

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "extraction_run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "proposed_name": "API Design",
      "proposed_description": "Discussion about REST API architecture patterns",
      "proposed_keywords": ["rest", "api", "design", "architecture"],
      "proposed_icon": "CodeBracketIcon",
      "proposed_color": "#8B5CF6",
      "similar_topic_id": null,
      "similarity_score": null,
      "similarity_type": null,
      "llm_recommendation": "new_topic",
      "confidence": 0.92,
      "reasoning": "Multiple messages discuss API design patterns, REST principles, and architectural decisions",
      "status": "pending",
      "reviewed_by_user_id": null,
      "reviewed_at": null,
      "review_notes": null,
      "created_at": "2025-10-23T14:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 100
}
```

**Error Responses:**

- `400 Bad Request` - Invalid filter parameters
- `401 Unauthorized` - Missing or invalid token
- `422 Unprocessable Entity` - Validation error

---

### Get Topic Proposal

**Endpoint:** `GET /knowledge/topics/proposals/{proposal_id}`

**Description:** Get single topic proposal with full details.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Topic proposal UUID |

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "extraction_run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "proposed_name": "API Design",
  "proposed_description": "Discussion about REST API architecture patterns",
  "proposed_keywords": ["rest", "api", "design", "architecture"],
  "proposed_icon": "CodeBracketIcon",
  "proposed_color": "#8B5CF6",
  "similar_topic_id": 15,
  "similarity_score": 0.87,
  "similarity_type": "semantic",
  "llm_recommendation": "merge",
  "confidence": 0.92,
  "reasoning": "Multiple messages discuss API design patterns. Similar to existing 'API Architecture' topic (87% match).",
  "status": "pending",
  "reviewed_by_user_id": null,
  "reviewed_at": null,
  "review_notes": null,
  "created_at": "2025-10-23T14:30:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Proposal doesn't exist
- `401 Unauthorized` - Missing or invalid token

---

### Approve Topic Proposal

**Endpoint:** `PUT /knowledge/topics/proposals/{proposal_id}/approve`

**Description:** Approve proposal and create final Topic entity. Updates `status` to `approved`, creates Topic, and broadcasts WebSocket event.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Topic proposal UUID |

**Request Body:** (Optional)

```json
{
  "review_notes": "Looks good, clear distinct topic"
}
```

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "extraction_run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "proposed_name": "API Design",
  "proposed_description": "Discussion about REST API architecture patterns",
  "proposed_keywords": ["rest", "api", "design", "architecture"],
  "proposed_icon": "CodeBracketIcon",
  "proposed_color": "#8B5CF6",
  "similar_topic_id": null,
  "similarity_score": null,
  "similarity_type": null,
  "llm_recommendation": "new_topic",
  "confidence": 0.92,
  "reasoning": "Multiple messages discuss API design patterns",
  "status": "approved",
  "reviewed_by_user_id": 42,
  "reviewed_at": "2025-10-23T15:45:12Z",
  "review_notes": "Looks good, clear distinct topic",
  "created_topic_id": 89,
  "created_at": "2025-10-23T14:30:00Z"
}
```

**Side Effects:**

1. Creates new `Topic` entity with proposed data
2. Sets `proposal.status = "approved"`
3. Records `reviewed_by_user_id` and `reviewed_at`
4. Decrements `extraction_run.proposals_pending`
5. Broadcasts WebSocket event: `knowledge.topic_proposal.approved`

**Error Responses:**

- `404 Not Found` - Proposal doesn't exist
- `409 Conflict` - Already reviewed (status != pending)
- `401 Unauthorized` - Missing permission

---

### Reject Topic Proposal

**Endpoint:** `PUT /knowledge/topics/proposals/{proposal_id}/reject`

**Description:** Reject proposal without creating entity. Sets `status` to `rejected`.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Topic proposal UUID |

**Request Body:**

```json
{
  "reason": "Too vague, not a distinct topic"
}
```

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "rejected",
  "reviewed_by_user_id": 42,
  "reviewed_at": "2025-10-23T15:50:00Z",
  "review_notes": "Too vague, not a distinct topic",
  "created_at": "2025-10-23T14:30:00Z"
}
```

**Side Effects:**

1. Sets `proposal.status = "rejected"`
2. Records `reviewed_by_user_id`, `reviewed_at`, `review_notes`
3. Decrements `extraction_run.proposals_pending`
4. Broadcasts WebSocket event: `knowledge.topic_proposal.rejected`

**Error Responses:**

- `404 Not Found` - Proposal doesn't exist
- `409 Conflict` - Already reviewed
- `400 Bad Request` - Missing required reason

---

### Merge Topic Proposal

**Endpoint:** `PUT /knowledge/topics/proposals/{proposal_id}/merge`

**Description:** Merge proposal into existing topic. Updates existing topic with new keywords/description.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Topic proposal UUID |

**Request Body:**

```json
{
  "target_topic_id": 15,
  "merge_strategy": "append_keywords",
  "update_description": false
}
```

**Merge Strategies:**

- `append_keywords` - Add new keywords to existing (default)
- `replace_keywords` - Replace existing keywords
- `keep_existing` - Don't update keywords

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "merged",
  "reviewed_by_user_id": 42,
  "reviewed_at": "2025-10-23T16:00:00Z",
  "review_notes": "Merged into existing 'API Architecture' topic",
  "merged_into_topic_id": 15,
  "created_at": "2025-10-23T14:30:00Z"
}
```

**Side Effects:**

1. Updates existing `Topic` entity with merged data
2. Sets `proposal.status = "merged"`
3. Records merge metadata
4. Decrements `extraction_run.proposals_pending`
5. Broadcasts WebSocket event: `knowledge.topic_proposal.merged`

**Error Responses:**

- `404 Not Found` - Proposal or target topic doesn't exist
- `409 Conflict` - Already reviewed
- `400 Bad Request` - Invalid merge strategy

---

## Atom Proposals API

### List Atom Proposals

**Endpoint:** `GET /knowledge/atoms/proposals`

**Description:** Retrieve paginated list of atom proposals with filtering options.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skip` | integer | No | 0 | Records to skip |
| `limit` | integer | No | 100 | Max records (1-1000) |
| `run_id` | UUID | No | null | Filter by extraction run |
| `topic_proposal_id` | UUID | No | null | Filter by parent topic proposal |
| `status` | string | No | null | Filter by status |
| `type` | string | No | null | Filter by atom type |
| `confidence_min` | float | No | null | Min confidence (0.0-1.0) |
| `confidence_max` | float | No | null | Max confidence (0.0-1.0) |
| `has_duplicate` | boolean | No | null | Filter with similar atoms |

**Atom Types:** `problem`, `solution`, `decision`, `insight`, `question`, `pattern`, `requirement`

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "extraction_run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "topic_proposal_id": "550e8400-e29b-41d4-a716-446655440000",
      "proposed_type": "decision",
      "proposed_title": "Use REST instead of GraphQL",
      "proposed_content": "Team decided to use REST API pattern for simplicity and better caching support.",
      "proposed_links": [
        {
          "to_atom_title": "Evaluate GraphQL benefits",
          "link_type": "solves",
          "strength": 0.9
        }
      ],
      "similar_atom_id": null,
      "similarity_score": null,
      "similarity_type": null,
      "llm_recommendation": "new_atom",
      "confidence": 0.88,
      "reasoning": "Clear architectural decision with rationale",
      "source_message_ids": [1001, 1002, 1005],
      "status": "pending",
      "reviewed_by_user_id": null,
      "reviewed_at": null,
      "review_notes": null,
      "created_at": "2025-10-23T14:32:00Z"
    }
  ],
  "total": 127,
  "page": 1,
  "page_size": 100
}
```

**Error Responses:**

- `400 Bad Request` - Invalid filter parameters
- `401 Unauthorized` - Missing or invalid token
- `422 Unprocessable Entity` - Validation error

---

### Get Atom Proposal

**Endpoint:** `GET /knowledge/atoms/proposals/{proposal_id}`

**Description:** Get single atom proposal with full details including relationships.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Atom proposal UUID |

**Response:** `200 OK`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "extraction_run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "topic_proposal_id": "550e8400-e29b-41d4-a716-446655440000",
  "proposed_type": "decision",
  "proposed_title": "Use REST instead of GraphQL",
  "proposed_content": "Team decided to use REST API pattern for simplicity and better caching support.",
  "proposed_links": [
    {
      "to_atom_title": "Evaluate GraphQL benefits",
      "link_type": "solves",
      "strength": 0.9
    }
  ],
  "similar_atom_id": 245,
  "similarity_score": 0.91,
  "similarity_type": "semantic",
  "llm_recommendation": "merge",
  "confidence": 0.88,
  "reasoning": "Clear architectural decision with rationale. Similar to existing atom about GraphQL evaluation.",
  "source_message_ids": [1001, 1002, 1005],
  "status": "pending",
  "reviewed_by_user_id": null,
  "reviewed_at": null,
  "review_notes": null,
  "created_at": "2025-10-23T14:32:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Proposal doesn't exist
- `401 Unauthorized` - Missing or invalid token

---

### Approve Atom Proposal

**Endpoint:** `PUT /knowledge/atoms/proposals/{proposal_id}/approve`

**Description:** Approve proposal and create final Atom entity with relationships.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Atom proposal UUID |

**Request Body:** (Optional)

```json
{
  "review_notes": "Good decision capture",
  "user_approved": true
}
```

**Response:** `200 OK`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "approved",
  "reviewed_by_user_id": 42,
  "reviewed_at": "2025-10-23T15:55:00Z",
  "review_notes": "Good decision capture",
  "created_atom_id": 512,
  "created_links": [
    {
      "from_atom_id": 512,
      "to_atom_id": 498,
      "link_type": "solves"
    }
  ],
  "created_at": "2025-10-23T14:32:00Z"
}
```

**Side Effects:**

1. Creates new `Atom` entity
2. Creates `AtomLink` relationships from `proposed_links`
3. Links atom to topic via `TopicAtom` (if topic exists)
4. Sets `proposal.status = "approved"`
5. Records review metadata
6. Decrements `extraction_run.proposals_pending`
7. Broadcasts WebSocket event: `knowledge.atom_proposal.approved`

**Error Responses:**

- `404 Not Found` - Proposal doesn't exist
- `409 Conflict` - Already reviewed
- `400 Bad Request` - Parent topic doesn't exist

---

### Reject Atom Proposal

**Endpoint:** `PUT /knowledge/atoms/proposals/{proposal_id}/reject`

**Description:** Reject proposal without creating entity.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Atom proposal UUID |

**Request Body:**

```json
{
  "reason": "Duplicate of existing atom #498"
}
```

**Response:** `200 OK`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "rejected",
  "reviewed_by_user_id": 42,
  "reviewed_at": "2025-10-23T15:58:00Z",
  "review_notes": "Duplicate of existing atom #498",
  "created_at": "2025-10-23T14:32:00Z"
}
```

**Error Responses:**

- `404 Not Found` - Proposal doesn't exist
- `409 Conflict` - Already reviewed
- `400 Bad Request` - Missing required reason

---

### Merge Atom Proposal

**Endpoint:** `PUT /knowledge/atoms/proposals/{proposal_id}/merge`

**Description:** Merge proposal into existing atom, combining content and links.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proposal_id` | UUID | Yes | Atom proposal UUID |

**Request Body:**

```json
{
  "target_atom_id": 498,
  "merge_strategy": "append_content",
  "transfer_links": true
}
```

**Merge Strategies:**

- `append_content` - Add proposal content as addendum (default)
- `replace_content` - Replace existing content
- `keep_existing` - Don't update content

**Response:** `200 OK`

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "status": "merged",
  "reviewed_by_user_id": 42,
  "reviewed_at": "2025-10-23T16:05:00Z",
  "review_notes": "Merged into atom #498",
  "merged_into_atom_id": 498,
  "created_links": [
    {
      "from_atom_id": 498,
      "to_atom_id": 512,
      "link_type": "continues"
    }
  ],
  "created_at": "2025-10-23T14:32:00Z"
}
```

**Side Effects:**

1. Updates existing `Atom` entity with merged content
2. Creates new `AtomLink` relationships
3. Updates atom metadata (adds `merged_from_proposal_id`)
4. Sets `proposal.status = "merged"`
5. Records merge metadata
6. Broadcasts WebSocket event: `knowledge.atom_proposal.merged`

**Error Responses:**

- `404 Not Found` - Proposal or target atom doesn't exist
- `409 Conflict` - Already reviewed
- `400 Bad Request` - Invalid merge strategy

---

## Bulk Operations API

### Bulk Approve Topic Proposals

**Endpoint:** `POST /knowledge/topics/proposals/bulk/approve`

**Description:** Approve multiple topic proposals in single transaction. Auto-approves high-confidence proposals without duplicates.

**Request Body:**

```json
{
  "proposal_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "review_notes": "Auto-approved high-confidence proposals"
}
```

**Alternative: Confidence-based bulk approval**

```json
{
  "confidence_threshold": 0.95,
  "exclude_duplicates": true,
  "run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "max_count": 50
}
```

**Response:** `200 OK`

```json
{
  "approved_count": 12,
  "failed_count": 0,
  "results": [
    {
      "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "approved",
      "created_topic_id": 89
    },
    {
      "proposal_id": "550e8400-e29b-41d4-a716-446655440001",
      "status": "approved",
      "created_topic_id": 90
    }
  ],
  "errors": []
}
```

**Error Responses:**

- `400 Bad Request` - Invalid parameters (too many IDs, invalid threshold)
- `207 Multi-Status` - Partial success (some approved, some failed)

**Limits:**

- Max 100 proposals per request
- Operations run in single database transaction (all-or-nothing)

---

### Bulk Approve Atom Proposals

**Endpoint:** `POST /knowledge/atoms/proposals/bulk/approve`

**Description:** Approve multiple atom proposals in single transaction.

**Request Body:**

```json
{
  "proposal_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ],
  "review_notes": "Batch approval of high-quality extractions",
  "user_approved": true
}
```

**Response:** `200 OK`

```json
{
  "approved_count": 45,
  "failed_count": 2,
  "results": [
    {
      "proposal_id": "660e8400-e29b-41d4-a716-446655440001",
      "status": "approved",
      "created_atom_id": 512
    }
  ],
  "errors": [
    {
      "proposal_id": "660e8400-e29b-41d4-a716-446655440099",
      "error": "Parent topic not found"
    }
  ]
}
```

**Error Responses:**

- `400 Bad Request` - Invalid parameters
- `207 Multi-Status` - Partial success

---

### Bulk Reject Proposals

**Endpoint:** `POST /knowledge/proposals/bulk/reject`

**Description:** Reject multiple proposals (topics and atoms) in one call.

**Request Body:**

```json
{
  "topic_proposal_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "atom_proposal_ids": ["660e8400-e29b-41d4-a716-446655440001"],
  "reason": "Low quality extraction batch"
}
```

**Response:** `200 OK`

```json
{
  "rejected_topics": 1,
  "rejected_atoms": 1,
  "total_rejected": 2
}
```

---

## Version History API

### Get Topic Version History

**Endpoint:** `GET /knowledge/topics/{topic_id}/history`

**Description:** Retrieve complete revision history for a topic.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic_id` | integer | Yes | Topic ID |

**Response:** `200 OK`

```json
{
  "topic_id": 89,
  "current_version": 3,
  "revisions": [
    {
      "version": 1,
      "name": "API Design",
      "description": "Discussion about REST API architecture",
      "icon": "CodeBracketIcon",
      "color": "#8B5CF6",
      "changed_by_user_id": null,
      "changed_by_source": "llm_extraction",
      "changed_at": "2025-10-23T14:30:00Z",
      "change_summary": "Initial creation from proposal"
    },
    {
      "version": 2,
      "name": "API Architecture",
      "description": "REST API design patterns and architectural decisions",
      "icon": "CodeBracketIcon",
      "color": "#8B5CF6",
      "changed_by_user_id": 42,
      "changed_by_source": "manual_edit",
      "changed_at": "2025-10-23T16:20:00Z",
      "change_summary": "Renamed for clarity, expanded description"
    }
  ]
}
```

**Error Responses:**

- `404 Not Found` - Topic doesn't exist

---

### Get Atom Version History

**Endpoint:** `GET /knowledge/atoms/{atom_id}/history`

**Description:** Retrieve complete revision history for an atom.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `atom_id` | integer | Yes | Atom ID |

**Response:** `200 OK`

```json
{
  "atom_id": 512,
  "current_version": 2,
  "revisions": [
    {
      "version": 1,
      "type": "decision",
      "title": "Use REST instead of GraphQL",
      "content": "Team decided to use REST API pattern.",
      "confidence": 0.88,
      "user_approved": true,
      "changed_by_user_id": null,
      "changed_by_source": "llm_extraction",
      "changed_at": "2025-10-23T14:32:00Z",
      "change_summary": "Created from proposal"
    },
    {
      "version": 2,
      "type": "decision",
      "title": "Use REST instead of GraphQL",
      "content": "Team decided to use REST API pattern for simplicity and better caching support.",
      "confidence": 0.88,
      "user_approved": true,
      "changed_by_user_id": 42,
      "changed_by_source": "manual_edit",
      "changed_at": "2025-10-23T17:10:00Z",
      "change_summary": "Added rationale for caching"
    }
  ]
}
```

**Error Responses:**

- `404 Not Found` - Atom doesn't exist

---

## Data Schemas

### TopicProposal Schema

```python
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class TopicProposal(BaseModel):
    """Topic proposal from knowledge extraction."""

    id: UUID
    extraction_run_id: UUID

    # Proposed data
    proposed_name: str = Field(max_length=100)
    proposed_description: str
    proposed_keywords: list[str] = Field(default_factory=list)
    proposed_icon: str | None = Field(max_length=50)
    proposed_color: str | None = Field(max_length=7)

    # Duplicate detection
    similar_topic_id: int | None = None
    similarity_score: float | None = Field(ge=0.0, le=1.0)
    similarity_type: str | None = Field(max_length=50)

    # LLM metadata
    llm_recommendation: str = Field(max_length=50)
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str

    # Review status
    status: str = Field(max_length=50)
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None

    # Result tracking
    created_topic_id: int | None = None
    merged_into_topic_id: int | None = None

    created_at: datetime
```

**LLM Recommendations:**

- `new_topic` - Create new distinct topic
- `merge` - Merge with similar existing topic
- `reject` - Low quality, skip

**Similarity Types:**

- `exact` - Exact name match
- `semantic` - Embedding similarity (>0.85)
- `fuzzy` - Fuzzy name matching (Levenshtein)
- `none` - No duplicate found

---

### AtomProposal Schema

```python
class AtomProposal(BaseModel):
    """Atom proposal from knowledge extraction."""

    id: UUID
    extraction_run_id: UUID
    topic_proposal_id: UUID | None = None

    # Proposed data
    proposed_type: str = Field(max_length=20)
    proposed_title: str = Field(max_length=200)
    proposed_content: str
    proposed_links: list[ProposedAtomLink] = Field(default_factory=list)

    # Source tracking
    source_message_ids: list[int] = Field(default_factory=list)

    # Duplicate detection
    similar_atom_id: int | None = None
    similarity_score: float | None = Field(ge=0.0, le=1.0)
    similarity_type: str | None = Field(max_length=50)

    # LLM metadata
    llm_recommendation: str = Field(max_length=50)
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str

    # Review status
    status: str = Field(max_length=50)
    reviewed_by_user_id: int | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None

    # Result tracking
    created_atom_id: int | None = None
    merged_into_atom_id: int | None = None
    created_links: list[CreatedAtomLink] = Field(default_factory=list)

    created_at: datetime
```

---

### ProposedAtomLink Schema

```python
class ProposedAtomLink(BaseModel):
    """Proposed relationship between atoms."""

    to_atom_title: str = Field(max_length=200)
    link_type: str = Field(max_length=20)
    strength: float | None = Field(ge=0.0, le=1.0)
```

**Link Types:**

- `continues` - Sequential continuation
- `solves` - Provides solution to
- `contradicts` - Disagrees with
- `supports` - Provides evidence for
- `refines` - Improves/clarifies
- `relates_to` - General relationship
- `depends_on` - Prerequisite relationship

---

### KnowledgeExtractionRun Schema

```python
class KnowledgeExtractionRun(BaseModel):
    """Metadata for knowledge extraction batch."""

    id: UUID
    agent_config_id: UUID
    message_count: int
    proposals_total: int
    proposals_pending: int
    topics_proposed: int
    atoms_proposed: int
    status: str = Field(max_length=50)
    started_at: datetime
    completed_at: datetime | None = None
    error_message: str | None = None
```

**Status Values:**

- `running` - Extraction in progress
- `completed` - Successfully finished
- `failed` - Error occurred
- `cancelled` - Manually stopped

---

## Error Responses

### Standard Error Format

All errors follow this schema:

```json
{
  "detail": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "request_id": "req_123abc",
  "timestamp": "2025-10-23T18:30:00Z"
}
```

### Error Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `400` | Bad Request | Invalid filter parameters, missing required fields |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Proposal/topic/atom doesn't exist |
| `409` | Conflict | Proposal already reviewed, duplicate action |
| `422` | Unprocessable Entity | Validation error (Pydantic) |
| `500` | Internal Server Error | Database error, LLM timeout |
| `503` | Service Unavailable | Database down, LLM provider unavailable |

### Example Error Responses

**400 Bad Request:**

```json
{
  "detail": "confidence_min must be between 0.0 and 1.0",
  "error_code": "VALIDATION_ERROR",
  "request_id": "req_abc123"
}
```

**404 Not Found:**

```json
{
  "detail": "Topic proposal with ID '550e8400-e29b-41d4-a716-446655440000' not found",
  "error_code": "PROPOSAL_NOT_FOUND",
  "request_id": "req_def456"
}
```

**409 Conflict:**

```json
{
  "detail": "Proposal already reviewed with status 'approved' at 2025-10-23T15:45:00Z",
  "error_code": "PROPOSAL_ALREADY_REVIEWED",
  "current_status": "approved",
  "reviewed_at": "2025-10-23T15:45:00Z",
  "reviewed_by": 42,
  "request_id": "req_ghi789"
}
```

**422 Validation Error:**

```json
{
  "detail": [
    {
      "loc": ["body", "proposal_ids"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ],
  "error_code": "VALIDATION_ERROR",
  "request_id": "req_jkl012"
}
```

---

## WebSocket Events

### Event Format

All WebSocket events follow this structure:

```json
{
  "type": "knowledge.{event_type}",
  "data": {
    "timestamp": "2025-10-23T18:30:00Z",
    ...event-specific fields
  }
}
```

### Topic Proposal Events

**Topic Proposal Approved:**

```json
{
  "type": "knowledge.topic_proposal.approved",
  "data": {
    "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
    "created_topic_id": 89,
    "topic_name": "API Design",
    "reviewed_by": 42,
    "timestamp": "2025-10-23T15:45:00Z"
  }
}
```

**Topic Proposal Rejected:**

```json
{
  "type": "knowledge.topic_proposal.rejected",
  "data": {
    "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
    "reason": "Too vague",
    "reviewed_by": 42,
    "timestamp": "2025-10-23T15:50:00Z"
  }
}
```

**Topic Proposal Merged:**

```json
{
  "type": "knowledge.topic_proposal.merged",
  "data": {
    "proposal_id": "550e8400-e29b-41d4-a716-446655440000",
    "merged_into_topic_id": 15,
    "topic_name": "API Architecture",
    "reviewed_by": 42,
    "timestamp": "2025-10-23T16:00:00Z"
  }
}
```

### Atom Proposal Events

**Atom Proposal Approved:**

```json
{
  "type": "knowledge.atom_proposal.approved",
  "data": {
    "proposal_id": "660e8400-e29b-41d4-a716-446655440001",
    "created_atom_id": 512,
    "atom_type": "decision",
    "atom_title": "Use REST instead of GraphQL",
    "links_created": 1,
    "reviewed_by": 42,
    "timestamp": "2025-10-23T15:55:00Z"
  }
}
```

**Atom Proposal Rejected:**

```json
{
  "type": "knowledge.atom_proposal.rejected",
  "data": {
    "proposal_id": "660e8400-e29b-41d4-a716-446655440001",
    "reason": "Duplicate of existing atom #498",
    "reviewed_by": 42,
    "timestamp": "2025-10-23T15:58:00Z"
  }
}
```

**Atom Proposal Merged:**

```json
{
  "type": "knowledge.atom_proposal.merged",
  "data": {
    "proposal_id": "660e8400-e29b-41d4-a716-446655440001",
    "merged_into_atom_id": 498,
    "merge_strategy": "append_content",
    "reviewed_by": 42,
    "timestamp": "2025-10-23T16:05:00Z"
  }
}
```

### Bulk Operation Events

**Bulk Approval Completed:**

```json
{
  "type": "knowledge.bulk.approval_completed",
  "data": {
    "approved_topics": 12,
    "approved_atoms": 45,
    "failed": 2,
    "reviewed_by": 42,
    "timestamp": "2025-10-23T16:30:00Z"
  }
}
```

---

## OpenAPI Examples

### Complete cURL Examples

**List pending topic proposals:**

```bash
curl -X GET \
  "http://localhost:8000/api/v1/knowledge/topics/proposals?status=pending&confidence_min=0.7" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**Approve topic proposal:**

```bash
curl -X PUT \
  "http://localhost:8000/api/v1/knowledge/topics/proposals/550e8400-e29b-41d4-a716-446655440000/approve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"review_notes": "Looks good"}'
```

**Bulk approve high-confidence proposals:**

```bash
curl -X POST \
  "http://localhost:8000/api/v1/knowledge/topics/proposals/bulk/approve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "confidence_threshold": 0.95,
    "exclude_duplicates": true,
    "max_count": 50
  }'
```

**Merge atom proposal:**

```bash
curl -X PUT \
  "http://localhost:8000/api/v1/knowledge/atoms/proposals/660e8400-e29b-41d4-a716-446655440001/merge" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "target_atom_id": 498,
    "merge_strategy": "append_content",
    "transfer_links": true
  }'
```

**Get version history:**

```bash
curl -X GET \
  "http://localhost:8000/api/v1/knowledge/topics/89/history" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Python Client Example

```python
from typing import Annotated
import httpx
from uuid import UUID

class KnowledgeProposalClient:
    """Python client for Knowledge Proposal API."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    async def list_topic_proposals(
        self,
        status: str | None = None,
        confidence_min: float | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> dict:
        """List topic proposals with filters."""
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        if confidence_min is not None:
            params["confidence_min"] = confidence_min

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/knowledge/topics/proposals",
                headers=self.headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def approve_topic_proposal(
        self,
        proposal_id: UUID,
        review_notes: str | None = None,
    ) -> dict:
        """Approve topic proposal."""
        body = {"review_notes": review_notes} if review_notes else {}

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/knowledge/topics/proposals/{proposal_id}/approve",
                headers=self.headers,
                json=body,
            )
            response.raise_for_status()
            return response.json()

    async def bulk_approve_atoms(
        self,
        proposal_ids: list[UUID],
        review_notes: str | None = None,
        user_approved: bool = True,
    ) -> dict:
        """Bulk approve atom proposals."""
        body = {
            "proposal_ids": [str(pid) for pid in proposal_ids],
            "user_approved": user_approved,
        }
        if review_notes:
            body["review_notes"] = review_notes

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/knowledge/atoms/proposals/bulk/approve",
                headers=self.headers,
                json=body,
            )
            response.raise_for_status()
            return response.json()


# Usage example
async def main():
    client = KnowledgeProposalClient(
        base_url="http://localhost:8000/api/v1",
        token="your_jwt_token_here",
    )

    # Get pending high-confidence proposals
    proposals = await client.list_topic_proposals(
        status="pending",
        confidence_min=0.8,
    )

    # Auto-approve proposals without duplicates
    to_approve = [
        UUID(p["id"])
        for p in proposals["items"]
        if p["similar_topic_id"] is None
    ]

    result = await client.bulk_approve_atoms(
        proposal_ids=to_approve,
        review_notes="Auto-approved high-confidence unique proposals",
    )

    print(f"Approved {result['approved_count']} proposals")
```

### TypeScript Client Example

```typescript
import type { UUID } from 'crypto';

interface TopicProposal {
  id: UUID;
  extraction_run_id: UUID;
  proposed_name: string;
  proposed_description: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  similar_topic_id?: number;
  llm_recommendation: string;
  reasoning: string;
  created_at: string;
}

interface BulkApproveResponse {
  approved_count: number;
  failed_count: number;
  results: Array<{
    proposal_id: UUID;
    status: string;
    created_topic_id?: number;
  }>;
  errors: Array<{
    proposal_id: UUID;
    error: string;
  }>;
}

class KnowledgeProposalAPI {
  constructor(
    private baseUrl: string,
    private token: string,
  ) {}

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  }

  async listTopicProposals(params: {
    status?: string;
    confidence_min?: number;
    skip?: number;
    limit?: number;
  }): Promise<{ items: TopicProposal[]; total: number }> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.confidence_min !== undefined) {
      query.set('confidence_min', params.confidence_min.toString());
    }
    query.set('skip', (params.skip || 0).toString());
    query.set('limit', (params.limit || 100).toString());

    return this.request('GET', `/knowledge/topics/proposals?${query}`);
  }

  async approveTopicProposal(
    proposalId: UUID,
    reviewNotes?: string,
  ): Promise<TopicProposal> {
    return this.request(
      'PUT',
      `/knowledge/topics/proposals/${proposalId}/approve`,
      reviewNotes ? { review_notes: reviewNotes } : undefined,
    );
  }

  async bulkApproveTopics(params: {
    confidence_threshold: number;
    exclude_duplicates?: boolean;
    max_count?: number;
  }): Promise<BulkApproveResponse> {
    return this.request(
      'POST',
      '/knowledge/topics/proposals/bulk/approve',
      params,
    );
  }

  async rejectAtomProposal(
    proposalId: UUID,
    reason: string,
  ): Promise<void> {
    await this.request(
      'PUT',
      `/knowledge/atoms/proposals/${proposalId}/reject`,
      { reason },
    );
  }
}

// Usage
const api = new KnowledgeProposalAPI(
  'http://localhost:8000/api/v1',
  'your_jwt_token',
);

// Get pending proposals
const { items } = await api.listTopicProposals({
  status: 'pending',
  confidence_min: 0.7,
});

// Bulk approve high-confidence proposals
const result = await api.bulkApproveTopics({
  confidence_threshold: 0.95,
  exclude_duplicates: true,
  max_count: 50,
});

console.log(`Approved ${result.approved_count} proposals`);
```

---

## Implementation Notes

### Database Indexes

Create these indexes for optimal query performance:

```sql
-- Topic proposals
CREATE INDEX idx_topic_proposals_run_id ON topic_proposals(extraction_run_id);
CREATE INDEX idx_topic_proposals_status ON topic_proposals(status);
CREATE INDEX idx_topic_proposals_confidence ON topic_proposals(confidence DESC);
CREATE INDEX idx_topic_proposals_created_at ON topic_proposals(created_at DESC);

-- Atom proposals
CREATE INDEX idx_atom_proposals_run_id ON atom_proposals(extraction_run_id);
CREATE INDEX idx_atom_proposals_topic_proposal_id ON atom_proposals(topic_proposal_id);
CREATE INDEX idx_atom_proposals_status ON atom_proposals(status);
CREATE INDEX idx_atom_proposals_type ON atom_proposals(proposed_type);
CREATE INDEX idx_atom_proposals_confidence ON atom_proposals(confidence DESC);
CREATE INDEX idx_atom_proposals_created_at ON atom_proposals(created_at DESC);
```

### Background Jobs

**Auto-Review Job** (runs every 5 minutes):

```python
from taskiq import TaskiqScheduler

@scheduler.task(schedule="*/5 * * * *")
async def auto_review_high_confidence_proposals():
    """Auto-approve proposals with 0.95+ confidence and no duplicates."""
    topic_proposals = await get_pending_topic_proposals(
        confidence_min=0.95,
        has_duplicate=False,
    )

    for proposal in topic_proposals:
        await approve_topic_proposal(
            proposal.id,
            reviewed_by_user_id=SYSTEM_USER_ID,
            review_notes="Auto-approved: high confidence, no duplicates",
        )
        logger.info(f"Auto-approved topic proposal {proposal.id}")
```

### Rate Limits

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| List proposals | 100 req/min | Per user |
| Get single proposal | 200 req/min | Per user |
| Approve/Reject | 50 req/min | Per user |
| Bulk approve | 10 req/min | Per user |
| Version history | 100 req/min | Per user |

---

**Document Status:** Ready for Implementation
**Last Updated:** October 23, 2025
**Next Phase:** Phase 4 (Frontend Review UI)
