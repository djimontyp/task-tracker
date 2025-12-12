# User Stories

**Продукт:** Pulse Radar
**Статус:** ✅ Approved (Q11-Q12 узгоджено)
**Дата:** 2025-12-10

---

## Story Format

```
As a [role],
I want [goal/desire]
so that [benefit/reason].

Acceptance Criteria:
- Given [context], when [action], then [outcome]
```

**Priority:** 🔴 Must / 🟡 Should / 🟢 Could / ⚪ Won't

---

## Epic 1: Daily Review (PM)

> **Persona:** PM Олена
> **Goal:** Швидко зрозуміти стан проєкту без читання всіх повідомлень

### US-001: Dashboard Overview 🔴 Must

**As a** PM,
**I want** to see a dashboard with today's key activities
**so that** I can understand project status in 5 minutes instead of 30.

**Acceptance Criteria:**
- [ ] Dashboard shows messages count for today
- [ ] Dashboard shows new Atoms extracted
- [ ] Dashboard shows active Topics
- [ ] Dashboard loads in <3 seconds

---

### US-002: Signal/Noise Filter 🔴 Must

**As a** PM,
**I want** to see only important messages (signals)
**so that** I don't waste time on noise.

**Acceptance Criteria:**
- [ ] Messages are classified as Signal or Noise
- [ ] Default view shows only Signals
- [ ] I can toggle to see all messages
- [ ] Signal/Noise ratio is visible

---

### US-003: Today's Atoms 🔴 Must

**As a** PM,
**I want** to see Atoms extracted today
**so that** I quickly understand what decisions, tasks, problems appeared.

**Acceptance Criteria:**
- [ ] Atoms grouped by type (TASK, DECISION, PROBLEM, etc.)
- [ ] Each Atom shows source message
- [ ] I can approve/reject Atoms
- [ ] Atom count per type is visible

---

### US-004: Topic Navigation 🟡 Should

**As a** PM,
**I want** to browse knowledge by Topics
**so that** I can focus on specific project areas.

**Acceptance Criteria:**
- [ ] Topics list with icons and colors
- [ ] Click topic → see related Atoms
- [ ] Topic shows message count
- [ ] I can create/edit Topics

---

## Epic 2: Weekly Summary (CTO)

> **Persona:** CTO Максим
> **Goal:** Бачити key decisions та blockers без читання всіх каналів

### US-010: Executive Summary 🔴 Must

**As a** CTO,
**I want** a weekly summary of key decisions and blockers
**so that** I stay informed without reading all channels.

**Acceptance Criteria:**
- [ ] Summary shows DECISION atoms from last 7 days
- [ ] Summary shows PROBLEM atoms (blockers)
- [ ] Grouped by project/topic
- [ ] Exportable as report

---

### US-011: Cross-Project View 🟡 Should

**As a** CTO,
**I want** to see activity across all projects
**so that** I identify patterns and bottlenecks.

**Acceptance Criteria:**
- [ ] View shows all projects
- [ ] Activity metrics per project
- [ ] Comparison view available
- [ ] Drill-down to project details

---

## Epic 3: Knowledge Search (Developer)

> **Persona:** Developer
> **Goal:** Знайти контекст минулих рішень

### US-020: Keyword Search 🔴 Must

**As a** Developer,
**I want** to search messages and atoms by keywords
**so that** I find relevant information quickly.

**Acceptance Criteria:**
- [ ] Search box in header
- [ ] Results show messages AND atoms
- [ ] Results highlighted with keyword
- [ ] Response time <500ms

---

### US-021: Semantic Search ⚪ Won't (v1.2+)

**As a** Developer,
**I want** to search by meaning, not just keywords
**so that** I find related information even with different wording.

**Acceptance Criteria:**
- [ ] Search understands context
- [ ] "database issues" finds "PostgreSQL problems"
- [ ] Relevance ranking
- [ ] "Did you mean?" suggestions

---

### US-022: Decision Context 🟡 Should

**As a** Developer,
**I want** to see why a decision was made
**so that** I understand the context before making changes.

**Acceptance Criteria:**
- [ ] DECISION atom shows source messages
- [ ] Timeline of related discussions
- [ ] Participants in decision
- [ ] Related atoms linked

---

## Epic 4: Admin & Configuration (PM/Admin)

> **Persona:** PM (as Admin)
> **Goal:** Налаштувати систему для команди

### US-030: User Invitation 🔴 Must

**As a** PM/Admin,
**I want** to invite team members to Pulse Radar
**so that** they can access the knowledge base.

**Acceptance Criteria:**
- [ ] Generate invite link
- [ ] Set role for invited user
- [ ] Invite via email or Telegram
- [ ] Track pending invitations

---

### US-031: LLM Provider Setup 🔴 Must

**As a** PM/Admin,
**I want** to configure LLM provider (OpenAI/Ollama)
**so that** AI extraction works.

**Acceptance Criteria:**
- [ ] Add API key for OpenAI
- [ ] Test connection button
- [ ] Status indicator (connected/error)
- [ ] Switch between providers

---

### US-032: Topic Management 🟡 Should

**As a** PM/Admin,
**I want** to create and configure Topics
**so that** knowledge is organized properly.

**Acceptance Criteria:**
- [ ] Create topic with name, icon, color
- [ ] Define keywords for auto-mapping
- [ ] Edit/delete topics
- [ ] Merge topics

---

### US-033: Telegram Integration 🔴 Must

**As a** PM/Admin,
**I want** to connect Telegram channels
**so that** messages are ingested automatically.

**Acceptance Criteria:**
- [ ] Add Telegram bot to channel
- [ ] Webhook configured
- [ ] Test message received
- [ ] Channel list with status

---

## Epic 5: Onboarding (New User)

> **Persona:** New team member
> **Goal:** Швидко розібратися в системі

### US-040: First-Time Guide 🟢 Could

**As a** new user,
**I want** a guided tour of Pulse Radar
**so that** I understand how to use it.

**Acceptance Criteria:**
- [ ] Welcome screen on first login
- [ ] Key features highlighted
- [ ] Skip option available
- [ ] Don't show again checkbox

---

### US-041: Quick Start 🟡 Should

**As a** new user,
**I want** to see recent activity immediately
**so that** I can start using the system right away.

**Acceptance Criteria:**
- [ ] Dashboard shows last 7 days
- [ ] No empty states for new users
- [ ] Sample data for demo mode
- [ ] Help tooltips

---

## Story Map

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    PULSE RADAR                       │
                    │              User Story Map                          │
                    └─────────────────────────────────────────────────────┘

User Journey:       DISCOVER        DAILY USE        SEARCH          ADMIN
                        │               │               │               │
                        ▼               ▼               ▼               ▼
                   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
MVP (v1.0)         │ US-040  │    │ US-001  │    │ US-020  │    │ US-030  │
                   │ US-041  │    │ US-002  │    │         │    │ US-031  │
                   │         │    │ US-003  │    │         │    │ US-033  │
                   └─────────┘    └─────────┘    └─────────┘    └─────────┘
                        │               │               │               │
                        ▼               ▼               ▼               ▼
                   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
v1.1               │         │    │ US-004  │    │ US-021  │    │ US-032  │
                   │         │    │ US-010  │    │ US-022  │    │         │
                   │         │    │ US-011  │    │         │    │         │
                   └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

## Definition of Done (DoD)

Кожна User Story вважається **Done** коли:

### Code
- [ ] Код написаний та merged в main
- [ ] TypeScript компілюється без помилок (`npx tsc --noEmit`)
- [ ] ESLint проходить без errors (`npm run lint`)
- [ ] Код відповідає Design System (semantic tokens, 4px grid)

### Testing
- [ ] Unit тести написані та проходять
- [ ] Acceptance Criteria перевірені вручну
- [ ] Немає regression в існуючому функціоналі

### Documentation
- [ ] Storybook story створена (для UI компонентів)
- [ ] API endpoint задокументований (якщо є)

### Review
- [ ] Code review пройдено
- [ ] Перевірено в browser (Chrome, Firefox)
- [ ] Перевірено responsive (mobile 375px+)

---

## Priority Summary

| Priority | Stories | Count |
|----------|---------|-------|
| 🔴 Must | US-001, US-002, US-003, US-010, US-020, US-030, US-031, US-033 | 8 |
| 🟡 Should | US-004, US-011, US-022, US-032, US-041 | 5 |
| 🟢 Could | US-040 | 1 |
| ⚪ Won't (v1.2+) | US-021 | 1 |

**MVP Scope:** 8 Must-Have stories

---

## Закриті питання

| # | Питання | Рішення |
|---|---------|---------|
| Q11 | Weekly Summary пріоритет | Must (MVP) |
| Q12 | Semantic Search | v1.2+ (не пріоритет) |

---

**Next:** [Use Cases](./use-cases.md) | [Acceptance Criteria](./acceptance-criteria.md)
