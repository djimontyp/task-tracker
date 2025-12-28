---
type: knowledge
created: 2025-12-28
status: validated
tags:
  - concept
  - ux
  - user-journey
  - core
---

# User Journey

> **Status:** Validated with user (2025-12-28)

## Overview

User's mental model when using Pulse Radar:

> "Я зайшов, побачив що там накапало за якийсь період. Побачив головні вектори — проблеми, рішення, інсайти. Далі переходжу до ознайомлення: звідки, коли, навіщо. Якщо треба — підтверджую знання."

## End User Journey

### Step 1: "What's New?" (Dashboard)

**Goal:** Швидко зрозуміти стан справ

**User sees:**
- Greeting based on time of day
- Summary: "3 items need your attention"
- Key metrics: problems, decisions, insights (delta from yesterday)
- Period selector: today / yesterday / last visit / this week

**User actions:**
- Scan the summary
- Click on topic/atom that interests
- Adjust period if needed

**UI Components:**
- TodaysFocus (pending atoms)
- QuickStats (counts by type)
- TopTopics (most active)
- RecentActivity timeline

---

### Step 2: "Drill-down" (Topics → Atoms)

**Goal:** Зрозуміти контекст конкретного знання

**User flow:**
```
Dashboard → Click Topic "Frontend"
         → See atoms in this topic
         → Read atom details
         → Understand: what, when, why
```

**User sees:**
- Topic header (icon, color, description)
- List of atoms grouped by type
- Each atom: title, content preview, confidence, date
- Related messages count (but not content)

**User actions:**
- Browse atoms by type filter
- Expand atom for full content
- Jump to related atoms (links)

---

### Step 3: "Approve/Reject" (Knowledge Validation)

**Goal:** Підтвердити або відхилити екстраговані знання

**Frequency:**
- **Early project:** Many pending atoms, high manual review
- **Stable project:** Fewer pending, mostly auto-approved
- **Mature project:** Full automation, rare manual intervention

**User flow:**
```
Dashboard → TodaysFocus shows "5 pending"
         → Click to review
         → Read atom
         → Approve ✓ or Reject ✗
         → Next atom
```

**Bulk actions:**
- "Approve All" for trusted sources
- Multi-select + approve/reject
- Quick keyboard shortcuts (future)

**Rejection reasons:**
- Duplicate
- Not relevant
- Incorrect extraction
- Noise

---

### Step 4: "Search & Explore"

**Goal:** Знайти конкретне знання

**Search types:**
1. **Keyword search:** "authentication bug"
2. **Semantic search:** "issues with login" (finds related)
3. **Filtered search:** type:problem topic:backend

**User sees:**
- Search results with snippets
- Grouped by topic
- Relevance score
- Quick filters

---

## Admin Journey

Admin has **all End User capabilities** plus:

### Step 5: "Influence Extraction" (Admin only)

**Goal:** Покращити якість AI extraction

**User actions:**
- Tune scoring thresholds (noise/signal boundary)
- Adjust confidence requirements
- Edit prompts for extraction
- Configure topic auto-creation rules

**Access via:**
- Settings → Providers
- Settings → Prompt Tuning
- Admin Panel → Extraction Config

---

### Step 6: "Debug & Troubleshoot" (Admin only)

**Goal:** Зрозуміти чому екстракція не працює

**When needed:**
- Atoms missing expected knowledge
- Wrong classification (signal as noise)
- Topic assignment incorrect

**User actions:**
- View raw messages
- Check scoring factors
- Inspect extraction logs
- Re-run extraction on messages

**Access via:**
- Admin Panel → Messages Debug
- Admin Panel → Analysis Runs

---

## Automation Progression

```
PHASE 1: Manual Review (новий проект)
├─ User approves 80%+ atoms
├─ High-confidence atoms still need review
└─ Learning what patterns work

PHASE 2: Semi-Auto (стабільний проект)
├─ Auto-approve high-confidence (>0.9)
├─ Manual review for medium (0.7-0.9)
└─ Auto-reject low confidence (<0.5)

PHASE 3: Full Auto (зрілий проект)
├─ All atoms auto-processed
├─ User only handles exceptions
└─ Rare manual intervention
```

## Key Insights

1. **Focus on value, not process**
   - User cares about atoms (knowledge), not messages (raw data)
   - Dashboard shows "what's important", not "what happened"

2. **Progressive disclosure**
   - Dashboard → Topic → Atom → Details
   - Don't overwhelm with information

3. **Trust builds over time**
   - Early: high manual review
   - Later: trust AI, only spot-check

4. **Admin is power user**
   - Same workflow + configuration access
   - Debug tools when things go wrong

## Related

- [[entity-hierarchy]] — Topics > Atoms > Messages
- [[roles]] — End User vs Admin permissions
