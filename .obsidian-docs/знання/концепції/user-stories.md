---
type: knowledge
created: 2025-12-28
status: draft
tags:
  - concept
  - user-stories
  - requirements
---

# User Stories

> **Status:** Draft — розширювати ітераційно

## End User Stories

### US-001: Morning Check-in

**As a** knowledge worker
**I want to** see what's new since my last visit
**So that** I can quickly understand the current state of my projects

**Acceptance Criteria:**
- [ ] Dashboard shows "What's New" section prominently
- [ ] Can filter by period: today, yesterday, this week
- [ ] Shows count of new atoms by type (problems, decisions, insights)
- [ ] One-click access to pending items

**Priority:** High
**Related:** [[user-journey#Step 1]]

---

### US-002: Daily Review Workflow

**As a** knowledge worker
**I want to** review and approve/reject pending atoms
**So that** the knowledge base stays accurate and relevant

**Acceptance Criteria:**
- [ ] TodaysFocus shows top pending atoms
- [ ] Can approve with one click
- [ ] Can reject with reason (duplicate, irrelevant, incorrect)
- [ ] Bulk approve/reject for trusted sources
- [ ] Progress indicator: "3 of 10 reviewed"

**Priority:** High
**Related:** [[user-journey#Step 3]]

---

### US-003: Topic Exploration

**As a** knowledge worker
**I want to** browse knowledge by topic category
**So that** I can find relevant information organized by domain

**Acceptance Criteria:**
- [ ] Topics page shows all categories with icons
- [ ] Each topic shows atom count and recent activity
- [ ] Click topic → see atoms within
- [ ] Can filter atoms by type within topic
- [ ] Search within topic

**Priority:** Medium
**Related:** [[entity-hierarchy#Topics]]

---

### US-004: Semantic Search

**As a** knowledge worker
**I want to** search for knowledge using natural language
**So that** I can find relevant atoms even if I don't know exact keywords

**Acceptance Criteria:**
- [ ] Search bar accepts natural language queries
- [ ] Results ranked by relevance (semantic similarity)
- [ ] Results grouped by topic
- [ ] Snippet preview with highlighted matches
- [ ] Quick filters: type, date range, topic

**Priority:** Medium
**Related:** [[user-journey#Step 4]]

---

### US-005: Knowledge Context

**As a** knowledge worker
**I want to** understand the context of an atom
**So that** I know where it came from and why it matters

**Acceptance Criteria:**
- [ ] Atom detail shows: source topic, creation date, confidence
- [ ] Related atoms linked (supports, contradicts, continues)
- [ ] "Source" link shows origin (admin only: message)
- [ ] Version history available

**Priority:** Low
**Related:** [[entity-hierarchy#Atoms]]

---

## Admin Stories

### US-101: Message Debug Access

**As an** admin
**I want to** access raw messages when extraction fails
**So that** I can troubleshoot and improve the AI pipeline

**Acceptance Criteria:**
- [ ] Admin toggle reveals Messages in sidebar
- [ ] Can view message with scoring factors
- [ ] Can see why message was classified as noise/signal
- [ ] Can manually trigger re-extraction
- [ ] Shows extraction history

**Priority:** Medium
**Related:** [[roles#Admin]]

---

### US-102: LLM Provider Configuration

**As an** admin
**I want to** configure and test LLM providers
**So that** I can optimize knowledge extraction quality

**Acceptance Criteria:**
- [ ] Add/edit/delete providers (OpenAI, Ollama)
- [ ] Test connection with validation
- [ ] See model availability (Ollama)
- [ ] Encrypted API key storage
- [ ] Status indicator: connected/error

**Priority:** High
**Related:** [[roles#Admin]]

---

### US-103: Prompt Tuning

**As an** admin
**I want to** customize extraction prompts
**So that** I can improve extraction quality for my domain

**Acceptance Criteria:**
- [ ] Edit knowledge extraction prompt
- [ ] Preview prompt with sample message
- [ ] Test extraction with current prompt
- [ ] Save/revert changes
- [ ] See extraction quality metrics

**Priority:** Low
**Related:** [[roles#Admin]]

---

### US-104: Extraction Threshold Tuning

**As an** admin
**I want to** adjust noise/signal thresholds
**So that** I can balance precision vs recall for my needs

**Acceptance Criteria:**
- [ ] Sliders for noise threshold (default 0.25)
- [ ] Sliders for signal threshold (default 0.65)
- [ ] Preview: "With these settings, 15 messages → noise"
- [ ] Apply and see immediate effect
- [ ] Undo/reset to defaults

**Priority:** Medium
**Related:** [[roles#Admin]]

---

## Future Stories (Backlog)

### US-201: Automation Rules

**As an** admin
**I want to** create auto-approval rules
**So that** trusted patterns are approved without manual review

---

### US-202: Team Collaboration

**As a** team lead
**I want to** assign topics to team members
**So that** review work is distributed effectively

---

### US-203: Knowledge Export

**As a** knowledge worker
**I want to** export knowledge to markdown/PDF
**So that** I can share findings outside the system

---

### US-204: Notification Preferences

**As a** knowledge worker
**I want to** configure notification preferences
**So that** I'm alerted only for important changes

---

## Story Map

```
                    DISCOVERY           VALIDATION          ORGANIZATION

End User:     US-001 Morning Check  US-002 Daily Review   US-003 Browse
              US-004 Search         US-005 Context

Admin:        US-101 Debug          US-102 Providers      US-103 Prompts
                                    US-104 Thresholds

Future:       US-203 Export         US-201 Automation     US-202 Teams
              US-204 Notifications
```

## Related

- [[user-journey]] — flow context
- [[roles]] — who does what
- [[entity-hierarchy]] — data model context
