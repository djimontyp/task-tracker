# Acceptance Criteria

**Продукт:** Pulse Radar
**Статус:** 🟡 Draft
**Дата:** 2025-12-10

---

## Format: Given-When-Then

```gherkin
Feature: [Feature Name]

  Scenario: [Scenario Name]
    Given [precondition]
    And [additional precondition]
    When [action]
    Then [expected result]
    And [additional result]
```

---

## US-001: Dashboard Overview

### AC-001.1: Dashboard loads with metrics

```gherkin
Feature: Dashboard Overview

  Scenario: Dashboard displays today's metrics
    Given I am logged in as PM
    And today is 2025-01-15
    And there are 150 messages received today
    When I open the Dashboard page
    Then I see a card showing "150 messages today"
    And I see a card showing Signal/Noise ratio
    And I see a card showing "X new atoms"
    And I see a card showing "Y active topics"
    And the page loads in under 3 seconds
```

### AC-001.2: Dashboard shows activity chart

```gherkin
  Scenario: Activity chart displays last 7 days
    Given I am on the Dashboard page
    When the page loads
    Then I see a bar chart with 7 bars
    And each bar represents one day
    And hovering shows exact message count
    And today's bar is highlighted
```

### AC-001.3: Dashboard shows recent atoms

```gherkin
  Scenario: Recent atoms section
    Given I am on the Dashboard page
    And 15 atoms were extracted today
    When the page loads
    Then I see a "Recent Atoms" section
    And it shows the last 10 atoms
    And each atom shows: type icon, title, time
    And clicking an atom opens detail modal
```

### AC-001.4: Empty state handling

```gherkin
  Scenario: No data yet
    Given I am a new user
    And no messages have been ingested
    When I open the Dashboard
    Then I see an empty state illustration
    And I see message "No data yet"
    And I see a button "Connect Telegram"
```

---

## US-002: Signal/Noise Filter

### AC-002.1: Default filter shows signals only

```gherkin
Feature: Signal/Noise Filter

  Scenario: Default view is signals only
    Given I am on the Messages page
    And there are 500 total messages
    And 120 are classified as Signal
    When the page loads
    Then the "Signals only" toggle is ON
    And I see 120 messages displayed
    And I see label "120 signals of 500 total"
```

### AC-002.2: Toggle to show all messages

```gherkin
  Scenario: Show all messages
    Given I am on Messages page with "Signals only" active
    When I click "Show all" toggle
    Then the toggle changes to "All messages"
    And I see all 500 messages
    And each message shows a badge: "Signal" or "Noise"
```

### AC-002.3: Signal/Noise badge appearance

```gherkin
  Scenario: Message badges
    Given I am viewing all messages
    When I look at a Signal message
    Then it has a green "Signal" badge
    And when I look at a Noise message
    Then it has a gray "Noise" badge
```

### AC-002.4: Noise reclassification

```gherkin
  Scenario: Mark noise as signal
    Given I am viewing a Noise message
    When I click "Mark as Signal"
    Then a confirmation appears
    And after confirming, the message badge changes to "Signal"
    And the message moves to Signals view
    And a feedback is logged for model improvement
```

---

## US-003: Today's Atoms

### AC-003.1: Atoms grouped by type

```gherkin
Feature: Today's Atoms

  Scenario: Atoms displayed by type
    Given I am on Atoms page
    And today's atoms are: 3 TASK, 2 DECISION, 1 PROBLEM
    When the page loads
    Then I see type tabs: TASK (3), DECISION (2), PROBLEM (1)
    And TASK tab is selected by default
    And I see 3 task atoms listed
```

### AC-003.2: Atom card content

```gherkin
  Scenario: Atom card displays required info
    Given I am viewing atoms list
    When I look at an atom card
    Then I see the atom title
    And I see the atom type icon
    And I see source message preview (truncated to 100 chars)
    And I see status badge (DRAFT/PENDING/APPROVED)
    And I see confidence score (e.g., "85%")
    And I see extraction timestamp
```

### AC-003.3: Approve atom

```gherkin
  Scenario: Approve a pending atom
    Given I am viewing a PENDING atom detail
    When I click "Approve" button
    Then the atom status changes to APPROVED
    And I see success toast "Atom approved"
    And the atom card updates with green checkmark
```

### AC-003.4: Reject atom

```gherkin
  Scenario: Reject an atom
    Given I am viewing a PENDING atom detail
    When I click "Reject" button
    Then a modal asks for rejection reason
    And I select reason or type custom
    And I click "Confirm Reject"
    Then the atom status changes to REJECTED
    And the atom is hidden from default view
```

### AC-003.5: Edit atom before approval

```gherkin
  Scenario: Edit atom content
    Given I am viewing an atom detail
    When I click "Edit" button
    Then I see editable fields: title, content, type
    And I modify the title
    And I click "Save"
    Then the atom updates with new title
    And edit history is logged
```

---

## US-010: Executive Summary

### AC-010.1: Weekly summary generation

```gherkin
Feature: Executive Summary

  Scenario: Generate weekly summary
    Given I am logged in as CTO
    And I am on Reports page
    When I select "Weekly Summary" report
    And I select date range "Last 7 days"
    And I click "Generate"
    Then I see a summary with sections:
      | Section      | Content                        |
      | Decisions    | List of DECISION atoms         |
      | Blockers     | List of unresolved PROBLEMs    |
      | Key Tasks    | High priority TASK atoms       |
    And each item shows title, date, source topic
```

### AC-010.2: Summary grouped by topic

```gherkin
  Scenario: Summary grouped by project
    Given I generated a weekly summary
    And there are 3 topics with activity
    When I view the summary
    Then decisions are grouped under topic headers
    And each topic section is collapsible
    And I can expand/collapse sections
```

### AC-010.3: Export summary

```gherkin
  Scenario: Export as PDF
    Given I am viewing a weekly summary
    When I click "Export" dropdown
    And I select "PDF"
    Then a PDF file downloads
    And it contains all summary sections
    And it has Pulse Radar branding
```

### AC-010.4: Drill-down to atom detail

```gherkin
  Scenario: View decision details
    Given I am viewing weekly summary
    When I click on a decision item
    Then a modal opens with full atom detail
    And I see source messages
    And I see discussion timeline
    And I can close and return to summary
```

---

## US-020: Keyword Search

### AC-020.1: Search input behavior

```gherkin
Feature: Keyword Search

  Scenario: Search as you type
    Given I clicked the search icon
    And the search modal is open
    When I type "database"
    Then after 300ms debounce, results appear
    And results show matching atoms and messages
    And keyword "database" is highlighted in results
```

### AC-020.2: Search results display

```gherkin
  Scenario: Search results format
    Given I searched for "migration"
    And there are 2 atoms and 5 messages matching
    When results display
    Then I see section "Atoms (2)"
    And I see section "Messages (5)"
    And each result shows:
      | Field   | Description                |
      | Title   | With keyword highlighted   |
      | Type    | Atom type or Message       |
      | Date    | When created               |
      | Preview | Snippet with keyword       |
```

### AC-020.3: Open search result

```gherkin
  Scenario: Navigate to result
    Given I have search results
    When I click on an Atom result
    Then the atom detail page opens
    And the search keyword is highlighted in content
    And I can navigate back to search
```

### AC-020.4: No results handling

```gherkin
  Scenario: No matches found
    Given I searched for "xyz123nonexistent"
    When no results are found
    Then I see message "No results for 'xyz123nonexistent'"
    And I see suggestions:
      | "Try different keywords"           |
      | "Check spelling"                   |
      | "Use broader terms"                |
```

### AC-020.5: Search performance

```gherkin
  Scenario: Search response time
    Given the knowledge base has 10,000 messages
    When I search for "api endpoint"
    Then results appear in under 500ms
    And results are paginated (20 per page)
```

---

## US-030: User Invitation

### AC-030.1: Invite form validation

```gherkin
Feature: User Invitation

  Scenario: Valid invitation form
    Given I am Admin on Users settings page
    When I click "Invite User"
    Then I see form with fields:
      | Field            | Required |
      | Email            | No*      |
      | Telegram         | No*      |
      | Role             | Yes      |
    And at least one contact method required
```

### AC-030.2: Send invite via email

```gherkin
  Scenario: Send email invitation
    Given I filled invite form with email "new@team.com"
    And selected role "Member"
    When I click "Send Invite"
    Then I see success message "Invitation sent to new@team.com"
    And email is sent with invite link
    And invitation appears in "Pending" list
```

### AC-030.3: Copy invite link

```gherkin
  Scenario: Copy link manually
    Given I filled invite form
    When I click "Copy Link" button
    Then invite link is copied to clipboard
    And I see toast "Link copied"
    And I can share link manually
```

### AC-030.4: Invitee registration flow

```gherkin
  Scenario: New user registration
    Given I received invite link
    When I click the link
    Then I see registration page
    And I see "You've been invited to Pulse Radar"
    And I fill in: name, password
    And I click "Join"
    Then my account is created with invited role
    And I am redirected to Dashboard
```

### AC-030.5: Duplicate user prevention

```gherkin
  Scenario: Email already registered
    Given user "existing@team.com" exists
    When Admin enters "existing@team.com" in invite form
    Then I see error "User already registered"
    And form shows link to user profile
```

---

## US-031: LLM Provider Setup

### AC-031.1: Add OpenAI provider

```gherkin
Feature: LLM Provider Setup

  Scenario: Configure OpenAI
    Given I am Admin on AI Providers page
    When I click "Add Provider"
    And I fill form:
      | Field     | Value                   |
      | Name      | Production OpenAI       |
      | Type      | OpenAI                  |
      | API Key   | sk-abc123...            |
      | Model     | gpt-4                   |
    And I click "Test Connection"
    Then I see "Testing..." spinner
    And after success, I see "Connection successful" (green)
    And I click "Save"
    Then provider appears in list with status "Connected"
```

### AC-031.2: Add Ollama provider

```gherkin
  Scenario: Configure Ollama (self-hosted)
    Given I am adding new provider
    When I select Type "Ollama"
    Then the form changes:
      | Field     | Visible |
      | API Key   | No      |
      | Base URL  | Yes     |
    And I enter Base URL "http://ollama:11434"
    And I select Model "llama2"
    And I test and save successfully
```

### AC-031.3: Connection test failure

```gherkin
  Scenario: Invalid API key
    Given I entered wrong API key
    When I click "Test Connection"
    Then I see "Connection failed" (red)
    And I see error details: "Invalid API key"
    And "Save" button remains disabled
```

### AC-031.4: Set default provider

```gherkin
  Scenario: Mark provider as default
    Given I have 2 providers configured
    When I click "Set as Default" on OpenAI provider
    Then OpenAI shows "(Default)" label
    And all new extraction tasks use OpenAI
```

### AC-031.5: API key security

```gherkin
  Scenario: API key is masked
    Given I saved a provider with API key
    When I edit the provider
    Then API key field shows "••••••••••••••••"
    And I can enter new key to replace
    And old key is never exposed in UI
```

---

## US-033: Telegram Integration

### AC-033.1: Setup wizard display

```gherkin
Feature: Telegram Integration

  Scenario: View setup instructions
    Given I am Admin on Telegram settings
    When the page loads
    Then I see setup wizard with 3 steps:
      | Step | Title                        |
      | 1    | Copy bot username            |
      | 2    | Add bot to Telegram channel  |
      | 3    | Verify connection            |
    And I see bot username "@PulseRadarBot"
    And I see "Copy" button next to bot name
```

### AC-033.2: Verify Telegram connection

```gherkin
  Scenario: Successful verification
    Given I added bot to my Telegram channel
    When I click "Verify Connection"
    Then I see "Checking..." spinner
    And system sends test message to bot
    And after receiving webhook
    Then I see "Channel connected: #project-team" (green)
    And channel appears in connected list
```

### AC-033.3: Verification failure

```gherkin
  Scenario: Bot not admin
    Given bot is added but not as admin
    When I click "Verify Connection"
    Then verification fails
    And I see "Bot needs admin rights in channel"
    And I see instructions to fix
```

### AC-033.4: Multiple channels

```gherkin
  Scenario: Connect second channel
    Given I have one channel connected
    When I click "Add Another Channel"
    Then I see same wizard for new channel
    And I can connect multiple channels
    And each channel shows in list with status
```

### AC-033.5: Message ingestion starts

```gherkin
  Scenario: First message received
    Given channel is connected
    When someone posts in Telegram channel
    Then message appears in Pulse Radar Messages page
    And message shows source: channel name
    And message has timestamp matching Telegram
```

### AC-033.6: Disconnect channel

```gherkin
  Scenario: Remove channel
    Given channel "#old-project" is connected
    When I click "Disconnect" on that channel
    Then I see confirmation "Stop receiving from #old-project?"
    And I click "Confirm"
    Then channel is removed from list
    And historical messages remain in system
    And no new messages are received
```

---

## Summary Table

| Story | Acceptance Criteria | Count |
|-------|---------------------|-------|
| US-001 | AC-001.1 to AC-001.4 | 4 |
| US-002 | AC-002.1 to AC-002.4 | 4 |
| US-003 | AC-003.1 to AC-003.5 | 5 |
| US-010 | AC-010.1 to AC-010.4 | 4 |
| US-020 | AC-020.1 to AC-020.5 | 5 |
| US-030 | AC-030.1 to AC-030.5 | 5 |
| US-031 | AC-031.1 to AC-031.5 | 5 |
| US-033 | AC-033.1 to AC-033.6 | 6 |

**Total: 38 Acceptance Criteria for 8 MVP Stories**

---

## Non-Functional Requirements

### NFR-001: Performance

```gherkin
  Scenario: Page load times
    Given standard network conditions
    When any page loads
    Then initial render completes in under 2 seconds
    And full interactive in under 3 seconds
```

### NFR-002: Responsive Design

```gherkin
  Scenario: Mobile support
    Given I am on a mobile device (375px width)
    When I view any page
    Then the layout adapts to screen size
    And all functionality remains accessible
    And touch targets are at least 44px
```

### NFR-003: Accessibility

```gherkin
  Scenario: Keyboard navigation
    Given I am using keyboard only
    When I navigate the application
    Then all interactive elements are focusable
    And focus order is logical
    And current focus is visible
```

### NFR-004: Data Security

```gherkin
  Scenario: API key storage
    Given Admin enters API key for LLM provider
    When key is saved
    Then it is encrypted at rest (Fernet)
    And never exposed in logs or responses
    And masked in UI
```

---

**Next:** [Context Diagram](../05-diagrams/context-diagram.md)
