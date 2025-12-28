# ADR-002: Entity Hierarchy — Topics > Atoms > Messages

**Date:** 2025-12-28
**Status:** Accepted
**Deciders:** maks, Claude
**Context Source:** Concept alignment session, 8 parallel explorations

## Context

Pulse Radar extracts knowledge from communication channels (Telegram initially). The system processes raw messages, extracts structured knowledge (atoms), and organizes them into topics.

**Current UI Issue:**
Messages are prominently displayed in the main sidebar (#3 position), implying they are a primary user concern. This creates cognitive load and misaligns with the system's purpose.

**Research Findings:**
- Messages page has 12 components, SmartFilters, bulk actions — heavy UX investment
- End users don't need to interact with raw messages during normal workflow
- Messages are only needed for debugging extraction issues (admin use case)

## Decision

Establish a clear 3-layer entity hierarchy:

```
TOPICS (Top Level)
└── ATOMS (Knowledge Units)
    └── MESSAGES (Hidden Layer)
```

### Topics

**Role:** Organizational categories
**Examples:** Mobile, Frontend, Backend, DevOps, AI/ML
**User Interaction:** Browse, filter, organize
**Visibility:** Main sidebar, high priority

### Atoms

**Role:** Extracted knowledge units (core value)
**Types:** problem, solution, decision, question, insight, idea, blocker, risk, requirement
**User Interaction:** Daily review (approve/reject), search, browse
**Visibility:** Main sidebar, primary workflow

### Messages

**Role:** Raw data layer (internal)
**Processing:** Auto-scored, auto-extracted → atoms
**User Interaction:** Debug only (admin mode)
**Visibility:** Hidden from main sidebar, accessible via Admin Panel

## Consequences

### UI Changes Required

1. **Sidebar restructure:**
   ```
   END USER:
   ├─ Dashboard
   ├─ Topics       ← elevated
   ├─ Atoms        ← elevated
   ├─ Search
   └─ Settings

   ADMIN (via toggle):
   ├─ Messages     ← moved here
   ├─ Providers
   ├─ Prompts
   └─ System Health
   ```

2. **Dashboard focus shift:**
   - From: System statistics (message counts, signal/noise ratio)
   - To: Actionable items (pending atoms, new knowledge today)

3. **Navigation patterns:**
   - Primary: Dashboard → Topic → Atoms
   - Secondary: Search → Atom → Topic
   - Debug (admin): Admin Panel → Messages

### Benefits

- **Cleaner UX:** Users focus on knowledge, not raw data
- **Clear mental model:** Topics contain atoms, messages are "how we got here"
- **Reduced cognitive load:** Less noise in daily workflow
- **Admin power tools:** Debug access when needed, hidden when not

### Risks

- **Learning curve:** Existing users expect Messages in sidebar
- **Mitigation:** Announcement, documentation, admin mode for power users

## Alternatives Considered

### Alternative A: Keep Messages in Sidebar (Lower Priority)

Move Messages to last position in sidebar but keep visible.

**Rejected because:** Still creates mental model confusion. Users don't need to see it.

### Alternative B: Remove Messages Entirely

No UI access to raw messages.

**Rejected because:** Admins need debug access when extraction fails.

## Implementation Notes

1. **Phase 1:** Restructure sidebar (move Messages to Admin Panel)
2. **Phase 2:** Update Dashboard to focus on TodaysFocus (pending atoms)
3. **Phase 3:** Add Messages debug view to Admin Panel
4. **Phase 4:** Documentation update

## Related

- Knowledge note: `.obsidian-docs/знання/концепції/entity-hierarchy.md`
- User journey: `.obsidian-docs/знання/концепції/user-journey.md`
- Roles: `.obsidian-docs/знання/концепції/roles.md`
