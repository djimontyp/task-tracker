# Use Cases

**Продукт:** Pulse Radar
**Статус:** 🟡 Draft
**Дата:** 2025-12-10

---

## Use Case Format

```
UC-XXX: [Name]

Actor:        [Primary user]
Trigger:      [What starts the use case]
Precondition: [Required state before]
Postcondition: [State after success]

Main Flow:
1. Step
2. Step
3. Step

Alternative Flows:
- A1: [Alternative path]
- A2: [Alternative path]

Exception Flows:
- E1: [Error handling]
```

---

## UC-001: View Daily Dashboard

**Related Story:** US-001 Dashboard Overview

**Actor:** PM
**Trigger:** PM opens Pulse Radar at start of workday
**Precondition:**
- PM is authenticated
- Telegram integration is active (messages are being ingested)

**Postcondition:** PM understands today's project status

### Main Flow

1. PM opens Dashboard page
2. System displays loading skeleton
3. System fetches today's metrics:
   - Messages received today
   - Signals vs Noise ratio
   - New Atoms extracted
   - Active Topics
4. System displays Dashboard with:
   - Summary cards (4 metric tiles)
   - Activity chart (last 7 days)
   - Recent Atoms list (last 10)
5. PM reviews metrics and decides next action

### Alternative Flows

**A1: First time user**
1. System detects no previous session
2. System shows welcome banner with quick tips
3. Continue from step 4

**A2: No messages today**
1. System detects 0 messages for today
2. System shows empty state: "No new messages today"
3. System suggests: "Check Telegram integration status"

### Exception Flows

**E1: API unavailable**
1. System fails to fetch metrics
2. System shows error banner: "Unable to load dashboard"
3. System shows retry button
4. User clicks retry → return to step 3

**E2: Session expired**
1. System detects invalid token
2. System redirects to login page
3. After login → return to step 1

---

## UC-002: Filter Messages by Signal/Noise

**Related Story:** US-002 Signal/Noise Filter

**Actor:** PM
**Trigger:** PM wants to focus on important messages only
**Precondition:**
- PM is on Messages page
- Messages have been scored by AI

**Postcondition:** PM sees only relevant messages (Signals)

### Main Flow

1. PM opens Messages page
2. System displays messages list with filter toolbar
3. System shows default filter: "Signals only" (active)
4. PM sees message count: "Showing 47 signals of 523 total"
5. PM reviews signal messages
6. PM can click any message to see details

### Alternative Flows

**A1: View all messages**
1. PM clicks "Show all" toggle
2. System displays all 523 messages
3. Messages show Signal/Noise badge
4. PM can toggle back to "Signals only"

**A2: View noise only**
1. PM clicks filter dropdown
2. PM selects "Noise only"
3. System shows noise messages (for review/training)
4. PM can mark noise as "Actually signal" for model improvement

**A3: Adjust threshold**
1. PM opens Settings → AI Scoring
2. PM adjusts Signal threshold (default: 0.65)
3. System recalculates classification
4. Messages page refreshes with new filter

### Exception Flows

**E1: No signals found**
1. System detects 0 signals in date range
2. System shows: "No signals detected"
3. System suggests: "Try expanding date range or adjusting threshold"

---

## UC-003: Review Today's Atoms

**Related Story:** US-003 Today's Atoms

**Actor:** PM
**Trigger:** PM wants to see extracted knowledge from today
**Precondition:**
- AI extraction has processed today's messages
- At least one Atom exists for today

**Postcondition:** PM has reviewed and moderated today's Atoms

### Main Flow

1. PM navigates to Atoms page (or Dashboard → Atoms section)
2. System displays Atoms grouped by type:
   - TASK (3)
   - DECISION (2)
   - PROBLEM (1)
   - QUESTION (4)
   - IDEA (2)
   - INSIGHT (1)
3. PM clicks on a type group to expand
4. System shows Atoms list with:
   - Title (extracted)
   - Source message preview
   - Status badge (DRAFT / PENDING / APPROVED)
   - Confidence score
5. PM clicks an Atom to see details
6. PM reviews Atom content and source message
7. PM approves or rejects Atom
8. System updates Atom status
9. PM continues reviewing remaining Atoms

### Alternative Flows

**A1: Edit Atom before approval**
1. PM clicks "Edit" on Atom detail
2. System shows edit form (title, content, type)
3. PM modifies fields
4. PM clicks "Save and Approve"
5. System saves changes and marks as APPROVED

**A2: Link Atom to Topic**
1. From Atom detail, PM clicks "Add to Topic"
2. System shows Topic selector (existing + create new)
3. PM selects Topic
4. System links Atom to Topic
5. Topic page now includes this Atom

**A3: Bulk approve**
1. PM selects multiple Atoms via checkboxes
2. PM clicks "Approve selected"
3. System shows confirmation: "Approve 5 atoms?"
4. PM confirms
5. System updates all selected to APPROVED

### Exception Flows

**E1: No Atoms extracted today**
1. System detects 0 Atoms for today
2. System shows empty state: "No knowledge extracted yet"
3. System shows possible reasons:
   - Not enough messages
   - AI extraction pending
   - LLM provider not configured

**E2: Extraction failed**
1. System detects failed extraction task
2. System shows warning: "Extraction failed for some messages"
3. System shows retry button
4. Admin can check Task page for details

---

## UC-010: Generate Weekly Summary

**Related Story:** US-010 Executive Summary

**Actor:** CTO
**Trigger:** CTO needs weekly project overview (typically Monday morning)
**Precondition:**
- At least 7 days of data exist
- Some Atoms have been approved

**Postcondition:** CTO has reviewed key decisions and blockers

### Main Flow

1. CTO opens Reports page
2. CTO selects "Weekly Summary" report type
3. CTO selects date range (default: last 7 days)
4. System generates summary:
   - **Decisions made** (DECISION atoms)
   - **Active blockers** (PROBLEM atoms with status != resolved)
   - **Key tasks** (TASK atoms by priority)
5. Summary grouped by Topic/Project
6. CTO reviews summary
7. CTO can export as PDF or share link

### Alternative Flows

**A1: Custom date range**
1. CTO clicks date picker
2. CTO selects custom range (e.g., last 2 weeks)
3. System regenerates summary
4. Continue from step 4

**A2: Drill down into details**
1. CTO clicks on a Decision item
2. System opens Atom detail modal
3. CTO sees full context: source messages, participants, related atoms
4. CTO closes modal, returns to summary

**A3: Filter by project**
1. CTO selects specific Topic from dropdown
2. System filters summary to that Topic only
3. Summary shows only related Decisions, Problems, Tasks

### Exception Flows

**E1: No data for period**
1. System detects 0 approved Atoms in range
2. System shows: "No summary data available"
3. System suggests: "Ensure atoms are being approved regularly"

---

## UC-020: Search Knowledge Base

**Related Story:** US-020 Keyword Search

**Actor:** Developer
**Trigger:** Developer needs to find past decision or discussion
**Precondition:**
- Developer is authenticated
- Knowledge base has indexed messages and atoms

**Postcondition:** Developer finds relevant information

### Main Flow

1. Developer clicks search icon in header
2. System shows search modal/dropdown
3. Developer types query: "database migration"
4. System searches as user types (debounced 300ms)
5. System displays results:
   - **Atoms** (2 matches) — shows title, type, date
   - **Messages** (7 matches) — shows preview, channel, date
6. Developer clicks on result
7. System opens detail view with keyword highlighted
8. Developer reads context

### Alternative Flows

**A1: Filter by type**
1. Developer clicks "Atoms only" filter
2. System shows only Atom results
3. Developer can also filter: Messages only, Last 7 days, etc.

**A2: No results**
1. System finds 0 matches
2. System shows: "No results for 'database migration'"
3. System suggests: "Try different keywords" or "Broaden your search"

**A3: Search from specific page**
1. Developer is on Messages page
2. Developer uses inline search field
3. Search scopes to Messages only (context-aware)

### Exception Flows

**E1: Search service unavailable**
1. System fails to connect to search
2. System shows: "Search temporarily unavailable"
3. Developer can retry or browse manually

---

## UC-030: Invite Team Member

**Related Story:** US-030 User Invitation

**Actor:** PM (as Admin)
**Trigger:** PM wants to add new team member to Pulse Radar
**Precondition:**
- PM has Admin role
- Email or Telegram available for invitee

**Postcondition:** New user can access Pulse Radar

### Main Flow

1. Admin opens Settings → Users
2. Admin clicks "Invite User"
3. System shows invite form:
   - Email (optional)
   - Telegram username (optional)
   - Role: Member / Admin
4. Admin fills form and clicks "Send Invite"
5. System generates unique invite link
6. System sends invite via selected channel (email or Telegram)
7. System shows success: "Invitation sent to @username"
8. Invitee receives link and clicks it
9. Invitee completes registration (name, password if needed)
10. System creates user account with assigned role
11. Admin sees new user in Users list

### Alternative Flows

**A1: Copy link manually**
1. Admin clicks "Copy link" instead of send
2. System copies invite URL to clipboard
3. Admin shares link via any channel
4. Continue from step 8

**A2: Resend invitation**
1. Admin sees pending invitation in list
2. Admin clicks "Resend"
3. System sends new notification
4. Old link remains valid

**A3: Cancel invitation**
1. Admin clicks "Cancel" on pending invite
2. System invalidates link
3. If invitee clicks old link → "Invitation expired"

### Exception Flows

**E1: User already exists**
1. Admin enters email of existing user
2. System shows: "User already registered"
3. Admin can view user profile instead

**E2: Invalid email/telegram**
1. System validates format
2. System shows validation error
3. Admin corrects input

---

## UC-031: Configure LLM Provider

**Related Story:** US-031 LLM Provider Setup

**Actor:** PM (as Admin)
**Trigger:** Admin needs to enable AI extraction
**Precondition:**
- Admin has API key for OpenAI or Ollama instance
- No provider currently configured (or updating existing)

**Postcondition:** LLM provider is connected and validated

### Main Flow

1. Admin opens Settings → AI Providers
2. System shows provider list (empty or existing)
3. Admin clicks "Add Provider"
4. System shows form:
   - Name (e.g., "Production OpenAI")
   - Type: OpenAI / Ollama
   - API Key (for OpenAI)
   - Base URL (for Ollama)
   - Model: dropdown of available models
5. Admin fills form
6. Admin clicks "Test Connection"
7. System sends test request to provider
8. System shows: "Connection successful" (green)
9. Admin clicks "Save"
10. System encrypts API key and stores
11. System shows provider in list with status: Connected

### Alternative Flows

**A1: Configure Ollama (self-hosted)**
1. Admin selects "Ollama" type
2. Form shows: Base URL field (not API key)
3. Admin enters: `http://ollama:11434`
4. Admin selects model from dropdown (llama2, mistral, etc.)
5. Continue from step 6

**A2: Edit existing provider**
1. Admin clicks "Edit" on existing provider
2. Form pre-fills with current values
3. API key field shows "••••••••" (masked)
4. Admin can update fields
5. Continue from step 6

**A3: Set as default**
1. Admin clicks "Set as Default" on provider
2. System marks provider as default
3. All extraction tasks use this provider

### Exception Flows

**E1: Test connection fails**
1. System fails to connect
2. System shows error: "Connection failed: Invalid API key"
3. Admin reviews and corrects API key
4. Return to step 6

**E2: Invalid model**
1. System connects but model not available
2. System shows: "Model 'gpt-5' not found"
3. Admin selects different model

---

## UC-033: Connect Telegram Channel

**Related Story:** US-033 Telegram Integration

**Actor:** PM (as Admin)
**Trigger:** Admin wants to ingest messages from Telegram
**Precondition:**
- Pulse Radar Telegram bot exists
- Admin has rights to add bot to channel

**Postcondition:** Telegram messages flow into Pulse Radar

### Main Flow

1. Admin opens Settings → Integrations → Telegram
2. System shows setup wizard:
   - Step 1: Bot info
   - Step 2: Add to channel
   - Step 3: Verify
3. System displays bot username: `@PulseRadarBot`
4. System shows instructions:
   - "Add @PulseRadarBot to your channel as admin"
   - "Bot needs: Read messages permission"
5. Admin adds bot to Telegram channel
6. Admin returns to Pulse Radar, clicks "Verify Connection"
7. System sends test message via bot
8. System receives webhook confirmation
9. System shows: "Channel connected: #project-team"
10. System starts ingesting messages

### Alternative Flows

**A1: Multiple channels**
1. Admin clicks "Add Another Channel"
2. Admin repeats process for second channel
3. System shows list of connected channels

**A2: Disconnect channel**
1. Admin clicks "Disconnect" on channel
2. System confirms: "Stop receiving from #project-team?"
3. Admin confirms
4. System stops ingestion (historical messages remain)

**A3: Configure channel settings**
1. Admin clicks "Settings" on channel
2. Admin can configure:
   - Auto-extract: On/Off
   - Default Topic: Select
   - Ignore patterns (regex)
3. Admin saves settings

### Exception Flows

**E1: Bot not added as admin**
1. System cannot verify channel
2. System shows: "Bot is not admin in this channel"
3. Admin adds bot with admin rights
4. Return to step 6

**E2: Webhook URL not reachable**
1. System cannot receive webhook
2. System shows: "Webhook verification failed"
3. System shows troubleshooting: check firewall, domain

---

## Use Case Summary

| UC | Name | Actor | Priority |
|----|------|-------|----------|
| UC-001 | View Daily Dashboard | PM | Must |
| UC-002 | Filter Messages | PM | Must |
| UC-003 | Review Today's Atoms | PM | Must |
| UC-010 | Generate Weekly Summary | CTO | Must |
| UC-020 | Search Knowledge Base | Developer | Must |
| UC-030 | Invite Team Member | Admin | Must |
| UC-031 | Configure LLM Provider | Admin | Must |
| UC-033 | Connect Telegram | Admin | Must |

---

## Use Case Diagram

```
                                    ┌─────────────────┐
                                    │   Pulse Radar   │
                                    │     System      │
                                    └────────┬────────┘
                                             │
           ┌─────────────────────────────────┼─────────────────────────────────┐
           │                                 │                                 │
           ▼                                 ▼                                 ▼
    ┌─────────────┐                   ┌─────────────┐                   ┌─────────────┐
    │     PM      │                   │     CTO     │                   │  Developer  │
    │  (Admin)    │                   │             │                   │             │
    └──────┬──────┘                   └──────┬──────┘                   └──────┬──────┘
           │                                 │                                 │
           │ ◄─── UC-001: Dashboard          │                                 │
           │ ◄─── UC-002: Filter             │ ◄─── UC-010: Weekly Summary     │
           │ ◄─── UC-003: Atoms              │                                 │
           │ ◄─── UC-030: Invite             │                                 │ ◄─── UC-020: Search
           │ ◄─── UC-031: LLM Setup          │                                 │
           │ ◄─── UC-033: Telegram           │                                 │
           │                                 │                                 │
           └─────────────────────────────────┴─────────────────────────────────┘
```

---

**Next:** [Acceptance Criteria](./acceptance-criteria.md)
