---
description: Daily work log with sessions (replaces daily + progress)
argument-hint: [show|session "name"|done|"note text"]
allowed-tools: Read(*), Write(*), Glob(*), Bash(date:*), Bash(mkdir:*)
---

## Context

- **Vault**: `.obsidian-docs/`
- **Config**: @.obsidian-docs/.vault-config.json
- **Today**: !`date +%Y-%m-%d`
- **Time**: !`date +%H:%M`

## User Input

```
$ARGUMENTS
```

## Purpose

**Journal** = daily work log with embedded sessions:
- One file per day
- Focus tasks for the day
- Sessions (work blocks with goals and outcomes)
- Quick notes throughout the day

> **Flow:** Journal (daily + sessions) → Retro (weekly analysis)

## Path

From config: `structure.journal.folder` + `structure.journal.format`

```
.obsidian-docs/Workspace/Journal/YYYY/MM/YYYY-MM-DD.md
```

## Algorithm

```
1. READ config .vault-config.json
2. GET user info (name, email)
3. PARSE arguments
4. EXECUTE action (show/session/done/note)
5. LOG to config:
   - learning.history.journal_entries++ (if created)
   - learning.history.sessions_created++ (if session)
   - learning.history.commands_executed.journal++
   - learning.history.last_activity = now
   - state.last_journal = today
   - state.active_session = session_name (if started)
6. SAVE config
```

## Actions

### `show` or no arguments

Show today's journal. Create if doesn't exist.

```
/obsidian:journal
/obsidian:journal show
```

### `session "name"`

Start a new session in today's journal.

```
/obsidian:journal session "Review API"
/obsidian:journal session "feat: auth flow"
```

**Action:**
1. Open/create today's journal
2. Add session block under `## Sessions`:

```markdown
---

### {time} — {name}

**Goal:**

**Done:**
-

**Findings:**
- [[]]
```

3. Update state: `active_session = name`

### `done`

Close active session.

```
/obsidian:journal done
```

**Action:**
1. Check `state.active_session`
2. If no active session → error
3. Add completion marker to session
4. Clear state: `active_session = null`

### Text (anything else)

Add quick note to today's journal.

```
/obsidian:journal discussed API changes with team
```

**Action:**
1. Open/create today's journal
2. Add to `## Notes` section:

```markdown
- {time} — {text}
```

## Template

When creating new journal:

```markdown
---
type: journal
date: {today}
author: {user.name}
tags:
  - journal
---

# {today}

## Focus

- [ ] Main task

## Sessions

## Notes

```

## State Management

**Config state:**
```json
{
  "state": {
    "active_session": "Review API",  // or null
    "last_journal": "2025-12-19"
  }
}
```

**Rules:**
- Only one active session at a time
- Starting new session auto-closes previous
- `done` requires active session

## History Update

After execution, update config:

```json
{
  "learning": {
    "history": {
      "journal_entries": +1,
      "sessions_created": +1,
      "commands_executed": { "journal": +1 },
      "last_activity": "2025-12-19T14:30:00"
    }
  },
  "state": {
    "last_journal": "2025-12-19",
    "active_session": "Review API"
  }
}
```

## Examples

```bash
/obsidian:journal                        # show today
/obsidian:journal session "API review"   # start session
/obsidian:journal done                   # close session
/obsidian:journal call with client       # add note
```

## Response

Short, in Ukrainian:
- 📝 Journal shown
- 🆕 Journal created for {date}
- ▶️ Session started: {name}
- ✅ Session closed: {name}
- 📌 Note added
- ⚠️ No active session to close