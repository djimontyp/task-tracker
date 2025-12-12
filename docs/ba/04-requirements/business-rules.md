# Business Rules Catalog

**Продукт:** Pulse Radar
**Статус:** 🟢 Approved
**Дата:** 2025-12-11

---

## Format

```
BR-XXX: [Rule Name]
Trigger:   When [condition]
Action:    Then [action]
Exception: Unless [exception]
```

---

## Message Scoring Rules

### BR-001: Classification Thresholds

**Trigger:** Message receives importance_score from scoring algorithm
**Action:**
```
IF importance_score < 0.3 THEN classification = "noise"
ELSE IF importance_score > 0.7 THEN classification = "signal"
ELSE classification = "weak_signal"
```
**Exception:** None
**Source:** `importance_scorer.py:298-303`

---

### BR-002: Content Length Scoring

**Trigger:** Content scoring phase of importance calculation
**Action:**
```
IF content.length < 10 THEN content_score = 0.1
ELSE IF content.length < 50 THEN content_score = 0.4
ELSE IF content.length < 200 THEN content_score = 0.7
ELSE content_score = 0.9
```
**Exception:** None
**Source:** `importance_scorer.py:75-86`

---

### BR-003: Noise Keyword Auto-Filter

**Trigger:** Message content matches noise keywords
**Action:**
```
IF content IN ["+1", "lol", "ok", "haha", "yeah", "yep", "nope", "hmm", "👍", "👌"]
THEN content_score = 0.1
```
**Exception:** If message contains signal keywords too, apply higher score
**Source:** `importance_scorer.py:28,88-91`

---

### BR-004: Signal Keyword Boost

**Trigger:** Message content matches signal keywords
**Action:**
```
IF content CONTAINS ["bug", "error", "problem", "issue", "fix", "decision", "urgent", "critical", "deploy", "release", "production"]
THEN content_score = 0.8-0.95 (based on keyword importance)
```
**Exception:** None
**Source:** `importance_scorer.py:29-47,104`

---

### BR-005: Question Mark Bonus

**Trigger:** Message contains question mark
**Action:**
```
IF content CONTAINS "?" THEN content_score += 0.1
```
**Exception:** Multiple question marks don't stack
**Source:** `importance_scorer.py` (implicit)

---

### BR-006: Technical Content Bonus

**Trigger:** Message contains URLs or code blocks
**Action:**
```
IF content CONTAINS [URL, code block (``` or inline `)]
THEN content_score += 0.15
```
**Exception:** None
**Source:** `importance_scorer.py` (implicit)

---

## Atom Rules

### BR-010: New Atom Default State

**Trigger:** Atom created by AI extraction
**Action:**
```
SET user_approved = false
SET archived = false
SET confidence = AI_confidence_score
```
**Exception:** Manual atoms have confidence = null

---

### BR-011: Atom Approval

**Trigger:** User clicks "Approve" on atom
**Action:**
```
SET user_approved = true
SET archived = false
```
**Exception:** Cannot approve already archived atom

---

### BR-012: Atom Rejection

**Trigger:** User clicks "Reject" on atom
**Action:**
```
SET archived = true
-- user_approved unchanged
```
**Exception:** None

---

### BR-013: Atom Archive

**Trigger:** User archives approved atom
**Action:**
```
SET archived = true
SET archived_at = now()
```
**Exception:** Cannot archive pending atoms (must approve/reject first)

---

### BR-014: Auto-Approval Eligibility

**Trigger:** Atom confidence score checked (v1.2+ feature)
**Action:**
```
IF atom.confidence >= 0.85 THEN eligible_for_auto_approval = true
ELSE eligible_for_auto_approval = false
```
**Exception:** Admin can disable auto-approval globally

---

## Extraction Rules

### BR-020: Auto-Extraction Trigger

**Trigger:** Check for pending messages
**Action:**
```
IF COUNT(messages WHERE analysis_status = "pending" AND age < 24h) >= 10
THEN trigger extraction_task
```
**Exception:** If extraction already running, skip

---

### BR-021: Extraction Batch Size

**Trigger:** Extraction task starts
**Action:**
```
Process MAX 50 messages per extraction run
Order by timestamp ASC (oldest first)
```
**Exception:** Admin can override batch size

---

### BR-022: Extraction Timeout

**Trigger:** Extraction run exceeds time limit
**Action:**
```
IF extraction_run.duration > 10 minutes
THEN SET status = "timeout"
AND save partial results
```
**Exception:** None

---

## Topic Rules

### BR-030: Auto-Topic Suggestion

**Trigger:** Atom created without topic
**Action:**
```
FOR EACH topic IN topics:
  IF atom.content MATCHES topic.keywords
  THEN suggest topic with confidence_score
ORDER BY confidence_score DESC
RETURN top 3 suggestions
```
**Exception:** If no matches, leave unassigned

---

### BR-031: Topic Assignment

**Trigger:** User assigns topic to atom
**Action:**
```
CREATE atom_topics(atom_id, topic_id)
-- M2M allows multiple topics per atom
```
**Exception:** Cannot assign same topic twice

---

## User & Auth Rules

### BR-040: Invite Expiration

**Trigger:** Invitation created
**Action:**
```
SET expires_at = created_at + 7 days
```
**Exception:** Admin can extend manually

---

### BR-041: Invitation Link Validation

**Trigger:** User clicks invitation link
**Action:**
```
IF invitation.used = true THEN error "Already used"
ELSE IF now() > invitation.expires_at THEN error "Expired"
ELSE allow registration
```
**Exception:** None

---

### BR-042: Role Assignment

**Trigger:** New user registration via invite
**Action:**
```
SET user.role = invitation.role
-- Roles: member, admin
```
**Exception:** First user is always admin

---

## LLM Provider Rules

### BR-050: Provider Validation

**Trigger:** Provider added or API key changed
**Action:**
```
SET validation_status = "validating"
TRY send test request to provider
  ON success: SET validation_status = "connected"
  ON failure: SET validation_status = "error"
SET last_validated_at = now()
```
**Exception:** None

---

### BR-051: Default Provider Selection

**Trigger:** Extraction task needs LLM
**Action:**
```
SELECT provider WHERE is_default = true AND validation_status = "connected"
IF none found:
  SELECT ANY provider WHERE validation_status = "connected"
IF none found:
  FAIL extraction with "No available provider"
```
**Exception:** None

---

### BR-052: API Key Security

**Trigger:** API key saved
**Action:**
```
ENCRYPT key with Fernet before storage
NEVER log or expose in responses
MASK in UI as "••••••••"
```
**Exception:** None

---

## WebSocket Rules

### BR-060: Real-time Updates

**Trigger:** Entity changed (message, atom, topic)
**Action:**
```
PUBLISH event to NATS topic
API relays to WebSocket clients
```
**Exception:** Batch updates may be debounced

---

### BR-061: Metrics Broadcast Rate Limit

**Trigger:** Metrics broadcast requested
**Action:**
```
IF last_broadcast < 1 second ago THEN skip
ELSE broadcast and update timestamp
```
**Exception:** None
**Source:** `metrics_broadcaster.py:76`

---

## Summary

| Category | Rules | Description |
|----------|-------|-------------|
| **Scoring** | BR-001 to BR-006 | Message classification thresholds and bonuses |
| **Atoms** | BR-010 to BR-014 | Atom lifecycle and approval |
| **Extraction** | BR-020 to BR-022 | AI pipeline triggers and limits |
| **Topics** | BR-030 to BR-031 | Topic suggestions and assignment |
| **Auth** | BR-040 to BR-042 | User invitation and roles |
| **LLM** | BR-050 to BR-052 | Provider management |
| **WebSocket** | BR-060 to BR-061 | Real-time updates |

---

**Related:** [Glossary](../02-glossary.md) | [Data Dictionary](../02-data-dictionary.md) | [Acceptance Criteria](./acceptance-criteria.md)
