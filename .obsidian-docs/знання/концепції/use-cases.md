---
type: knowledge
created: 2025-12-28
status: draft
tags:
  - concept
  - use-cases
  - requirements
---

# Use Cases

> **Status:** Draft — розширювати з реальними сценаріями

## UC-001: Morning Check-in

**Actor:** Knowledge Worker
**Trigger:** User opens Pulse Radar in the morning
**Preconditions:** User is authenticated, Telegram channels configured

### Main Flow

1. User opens Dashboard
2. System shows greeting based on time of day
3. System displays TodaysFocus (pending atoms)
4. System shows NewToday timeline
5. User scans items for 30 seconds
6. User clicks on interesting atom
7. System navigates to atom detail

### Alternative Flows

**A1: No pending atoms**
- At step 3, system shows "All caught up!" message
- User proceeds to browse topics

**A2: Many pending atoms (>10)**
- At step 3, system shows top 5 with "View all X pending" link
- User can click to go to Daily Review page

### Edge Cases

| Case | Behavior |
|------|----------|
| First visit ever | Show onboarding wizard |
| No data at all | Show "Connect Telegram" CTA |
| Weekend (no activity) | Show "Quiet weekend" message |
| Error loading data | Show error with retry button |

### Postconditions
- User understands current state of knowledge
- User knows what needs attention

---

## UC-002: Daily Review

**Actor:** Knowledge Worker / Team Lead
**Trigger:** TodaysFocus shows pending atoms OR user clicks "Daily Review"
**Preconditions:** Pending atoms exist

### Main Flow

1. User navigates to Atoms page
2. System shows Pending tab selected
3. User sees atoms grouped by type
4. User reads first atom
5. User clicks Approve or Reject
6. System moves atom to appropriate status
7. User repeats for remaining atoms

### Alternative Flows

**A1: Bulk approval**
1. User selects multiple atoms via checkbox
2. User clicks "Approve Selected"
3. System approves all selected atoms
4. System shows success toast

**A2: Rejection with reason**
1. User clicks Reject on atom
2. System shows reason dialog (duplicate, irrelevant, incorrect)
3. User selects reason
4. System archives atom with reason

**A3: Approve All**
1. User clicks "Approve All"
2. System shows confirmation: "Approve 12 atoms?"
3. User confirms
4. System approves all pending atoms

### Edge Cases

| Case | Behavior |
|------|----------|
| Atom already approved by someone else | Show "Already approved" toast, refresh list |
| Network error during approve | Show error, keep atom pending, allow retry |
| Duplicate atom detected | Show "Similar atom exists" warning |
| Very long atom content | Truncate with "Show more" |

### Postconditions
- Pending atoms are approved or rejected
- Knowledge base is updated

---

## UC-003: Topic Exploration

**Actor:** Knowledge Worker
**Trigger:** User wants to browse knowledge by category
**Preconditions:** Topics exist with atoms

### Main Flow

1. User clicks Topics in sidebar
2. System shows topics grid with icons
3. User clicks on "Frontend" topic
4. System shows TopicDetail page
5. User sees atoms within topic
6. User filters by type (e.g., Problems)
7. User reads atom details

### Alternative Flows

**A1: Search within topic**
1. User types in topic search box
2. System filters atoms matching query
3. User clicks matching atom

**A2: Create atom in topic**
1. User clicks "+ Create Atom"
2. System shows CreateAtomDialog
3. User fills form
4. System creates atom linked to topic

### Edge Cases

| Case | Behavior |
|------|----------|
| Topic has no atoms | Show "No atoms yet" with extraction CTA |
| Topic deleted while viewing | Redirect to Topics list with toast |
| Very long topic name | Truncate with ellipsis |
| 100+ atoms in topic | Paginate (20 per page) |

### Postconditions
- User found relevant knowledge
- User understands topic context

---

## UC-004: Semantic Search

**Actor:** Knowledge Worker
**Trigger:** User needs to find specific knowledge
**Preconditions:** Atoms exist with embeddings

### Main Flow

1. User clicks search bar (or Cmd+K)
2. User types query: "authentication issues"
3. System shows search dropdown with results
4. User sees matching atoms grouped by topic
5. User clicks relevant result
6. System navigates to atom

### Alternative Flows

**A1: No results found**
1. System shows "No results for 'xyz'"
2. System suggests: "Try different keywords"
3. User modifies query

**A2: Filter results**
1. User clicks filter icon
2. User selects type: "Decisions"
3. System filters results
4. User sees only decision atoms

### Edge Cases

| Case | Behavior |
|------|----------|
| Single character query | Don't search, show hint "Min 2 characters" |
| Special characters in query | Escape properly, search normally |
| Very common word | Rank by relevance, show top 20 |
| Exact match exists | Show exact match first |
| Search takes > 3s | Show loading indicator |

### Postconditions
- User found relevant atom
- User can navigate to full context

---

## UC-005: Admin Debug Messages

**Actor:** Admin
**Trigger:** Extraction not working as expected
**Preconditions:** Admin mode enabled, messages exist

### Main Flow

1. Admin enables Admin Mode (Cmd+Shift+A)
2. Admin navigates to Admin Panel → Messages
3. System shows raw messages with scoring
4. Admin filters by classification (noise)
5. Admin inspects message scoring factors
6. Admin identifies issue (threshold too low)
7. Admin adjusts settings

### Alternative Flows

**A1: Re-extract message**
1. Admin clicks "Re-extract" on message
2. System queues extraction job
3. System shows progress indicator
4. New atoms appear when done

**A2: Mark as training data**
1. Admin clicks "Add to training"
2. System marks message for future model training
3. Admin provides expected classification

### Edge Cases

| Case | Behavior |
|------|----------|
| Message has no embedding | Show "Embedding pending" status |
| Extraction failed | Show error with reason |
| Message from deleted channel | Show "(deleted source)" |
| Very long message (>10k chars) | Truncate in list, full in detail |

### Postconditions
- Admin identified extraction issue
- Admin can fix or report problem

---

## UC-006: Cold Start (First Use)

**Actor:** New User
**Trigger:** First login to Pulse Radar
**Preconditions:** None

### Main Flow

1. User logs in for first time
2. System detects no data
3. System shows onboarding wizard
4. User connects Telegram
5. System ingests initial messages
6. System extracts first atoms
7. User sees Dashboard with real data

### Alternative Flows

**A1: Skip onboarding**
1. User clicks "Skip for now"
2. System shows empty Dashboard
3. System shows CTA to connect Telegram

**A2: Multiple channels**
1. User adds multiple Telegram groups
2. System ingests from all
3. Topics created for each domain

### Edge Cases

| Case | Behavior |
|------|----------|
| Telegram already connected (re-login) | Skip Telegram step |
| No Telegram groups available | Show "Join a group first" message |
| Rate limited by Telegram | Show retry with countdown |
| 1000+ messages to ingest | Show progress bar, async |

### Postconditions
- User has working Pulse Radar
- Initial knowledge extracted

---

## Error Scenarios

### E-001: Network Failure

**Trigger:** Network unavailable during operation

**Behavior:**
1. Show error toast: "Network error. Please check connection."
2. Cache current state locally
3. Show retry button
4. Auto-retry after 5 seconds (max 3 times)

### E-002: API Rate Limit

**Trigger:** Too many requests to backend

**Behavior:**
1. Show warning: "Slow down! Try again in X seconds"
2. Disable action buttons temporarily
3. Re-enable after cooldown

### E-003: Concurrent Edit

**Trigger:** Another user modified same atom

**Behavior:**
1. Show conflict dialog
2. Show both versions
3. Let user choose which to keep
4. Or merge changes

### E-004: Session Expired

**Trigger:** Token expired during use

**Behavior:**
1. Show modal: "Session expired"
2. Redirect to login
3. Preserve current URL for redirect back

---

## Related

- [[user-stories]] — high-level stories
- [[user-journey]] — flow overview
- [[entity-hierarchy]] — data model
