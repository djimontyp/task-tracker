---
name: session-manager
description: Auto-saves session state after task completion. Use when user says "pause", "stop", "save progress", "пауза", "зупинись", "зберегти" or needs to continue work later with "resume", "continue", "продовжити". Generates bilingual summaries with todos, context, agent states, next actions. Enables seamless pause/resume workflow across conversations. Integrates with TodoWrite for progress tracking.
allowed-tools: Read, Write, TodoWrite, Bash(git:*)
---

# Session Manager

## Overview

Session Manager provides automatic session state management and seamless pause/resume workflows. It replaces bulky orchestration skills (task-orchestrator, parallel-coordinator, epic-orchestrator) with a lightweight, auto-saving approach.

**Key capabilities:**
- **Auto-save**: Captures session state after every TodoWrite completion
- **Explicit pause**: User-triggered checkpoints with bilingual summaries
- **Context restoration**: Seamless resume with full todo/agent/artifact state
- **Bilingual support**: EN/UA commands and content
- **Compact format**: Single markdown file per session (tables, checkboxes, admonitions)

**Session storage**: `.claude/sessions/{active|paused|completed}/YYYY-MM-DD-{slug}.md`

---

## Core Workflow

```
User starts work
    ↓
Auto-save after each TodoWrite completion
    ↓
User says "pause" / "пауза"
    ↓
Generate summary → save to paused/
    ↓
[New conversation]
    ↓
User says "resume" / "продовжити" OR `claude --continue`
    ↓
Load session → restore TodoWrite → continue work
    ↓
Mark complete → move to completed/
```

---

## When to Use This Skill

### Auto-Trigger Scenarios

**After TodoWrite updates** (automatic):
- When task marked as completed
- When new tasks added
- When task status changes
- Every 3-5 task completions (checkpoint)

**User signals pause** (explicit):
- EN: "pause", "stop", "stop for now", "stop for today", "save progress", "checkpoint", "break", "take a break"
- UA: "пауза", "зупинись", "зупини", "зберегти прогрес", "зберегти", "чекпоінт", "перерва", "зроби перерву"

**User signals resume** (explicit):
- EN: "resume", "continue", "continue work", "pick up where we left off", "load session"
- UA: "продовжити", "продовж", "відновити", "продовжити роботу", "завантажити сесію"

**Conversation ending** (automatic):
- User says goodbye: "bye", "пока", "до побачення"
- Long inactivity (>5 min without response)
- Natural conversation conclusion

### Do NOT Use This Skill For

- Trivial tasks (complexity score 0-2, <3 todos)
- Read-only operations (no state to save)
- Simple Q&A (no workflow to resume)

---

## Commands

### `/pause`

**Purpose**: Explicitly checkpoint current work and generate resumable summary.

**Workflow**:
1. Check TodoWrite state (should have 0 in_progress tasks)
2. Generate session metadata (goal, approach, blockers, last action)
3. Capture todo list with progress stats
4. Document agents used with artifact links
5. Identify next 1-2 actions
6. Link all created/modified files
7. Save to `.claude/sessions/paused/YYYY-MM-DD-{slug}.md`
8. Output bilingual resume instruction

**Output**:
```
Session paused and saved to .claude/sessions/paused/2025-10-30-feature-name.md

To resume: `claude --continue` or say "resume" / "продовжити"

Progress: 5/12 tasks (42%) • 3h spent / 8h estimated
Next up: Implement authentication middleware
```

**Detailed workflow**: See `references/PAUSE_WORKFLOW.md`

---

### `/resume`

**Purpose**: Restore session context from saved state and continue work.

**Workflow**:
1. Locate session file (explicit path, latest paused/, NEXT_SESSION_TODO.md, or latest active/)
2. Parse markdown sections (Context, Todo, Agents, Next Actions, Artifacts)
3. Restore TodoWrite state with exact statuses
4. Verify artifact files still exist
5. Move session from paused/ to active/
6. Output context summary and readiness confirmation

**Output**:
```
Resuming session: OAuth2 Migration

Goal: User authentication
Progress: 5/12 tasks (42%)
Last action: Completed token refresh logic
Blockers: None

Next up: Implement JWT validation middleware

Context restored. Ready to continue?
Say "готовий" / "ready" to proceed.
```

**Detailed workflow**: See `references/RESUME_WORKFLOW.md`

---

### `/session`

**Purpose**: Show current session status without pausing.

**Output**:
```
Current Session: OAuth2 Migration
Status: 🔄 In Progress
Progress: 5/12 tasks (42%)
Active file: .claude/sessions/active/2025-10-30-oauth2-migration.md

Last updated: 2025-10-30 14:30
Last action: Completed token refresh logic
Next: Implement JWT validation middleware
```

---

## Auto-Save Logic

### When Auto-Save Triggers

**After TodoWrite completion** (primary trigger):
- Task marked as `completed`
- Batch completion (3-5 tasks done)
- Significant milestone reached

**On conversation end** (secondary trigger):
- User signals goodbye
- Inactivity detected
- Natural conclusion

### What Auto-Save Captures

**High-priority** (always):
- Current todo list state
- Last completed action
- Next pending task

**Medium-priority** (if changed):
- Session goal/approach
- Active blockers
- Agent outputs

**Low-priority** (on explicit pause only):
- Full artifact list
- Decision history
- Detailed notes

### Auto-Save vs Explicit Pause

| Trigger | Location | Detail Level | User Prompt |
|---------|----------|--------------|-------------|
| Auto-save | `active/` | High-priority only | Silent |
| Explicit `/pause` | `paused/` | Full detail | Bilingual message |

**Rationale**: Auto-save is lightweight (don't interrupt flow), explicit pause is comprehensive (user expects checkpoint).

---

## TodoWrite Integration

### Bi-Directional Sync

**TodoWrite → Session** (save):
- On task completion → update session file
- On new tasks → expand todo section
- On status change → reflect in session

**Session → TodoWrite** (restore):
- On `/resume` → recreate todo list with exact statuses
- Verify counts match (completed vs pending)
- Mark first pending task as `in_progress`

### State Validation

Before pause:
- Check: Only 0-1 tasks should be `in_progress`
- If multiple `in_progress`: Complete current or mark as blocked
- If inconsistent: Add warning to session file

After resume:
- Verify: TodoWrite state matches session file
- If mismatch: Session file is source of truth
- Output warning: "Todo state diverged. Restored from session."

---

## Session State Format

All sessions use the same markdown template with EN headers and bilingual content.

**Template**: See `references/SUMMARY_TEMPLATES.md`

**Key sections**:
1. **Context** - 2-word snippets in table format
2. **Todo** - Checkboxes synced with TodoWrite
3. **Agents Used** - Table with artifact links
4. **Next Actions** - Immediate steps + blockers + questions
5. **Artifacts** - File list with paths and metrics

**Admonitions**:
- `> [!NOTE]` - Session metadata, auto-sync indicators
- `> [!TIP]` - Todo list headers, workflow hints
- `> [!WARNING]` - Blockers, resume instructions
- `> [!IMPORTANT]` - Key decisions, constraints

**Example** (compact):
```markdown
# Session: BaseCRUD Refactor

**Status**: ⏸️ Paused

## Context

| What | State |
|------|-------|
| Goal | CRUD inheritance pattern |
| Approach | Migrate 8 services to BaseCRUD |
| Blocker | None |

## Todo

- [x] atom_crud.py (-50 LOC)
- [x] agent_crud.py (-18 LOC)
- [ ] message_crud.py (est. 20 min)

**Progress**: 2/8 tasks (25%)

## Next Actions

> [!WARNING]
> Resume: `/resume` або `/продовжити`

1. message_crud.py migration (20 min)
2. topic_crud.py migration (25 min)
```

---

## Session Lifecycle

### 1. Session Creation

**Trigger**: First TodoWrite call OR user starts complex task

**Actions**:
- Generate slug from task description
- Create session file in `active/`
- Initialize with goal, approach, empty todo list

**Location**: `.claude/sessions/active/YYYY-MM-DD-{slug}.md`

---

### 2. Active Session

**State**: Work in progress, auto-save enabled

**Updates**:
- After each TodoWrite completion → update progress stats
- After agent delegation → add to "Agents Used" table
- On file changes → update "Artifacts" section
- Every 3-5 completions → full checkpoint

**Location**: Stays in `active/`

---

### 3. Paused Session

**Trigger**: Explicit `/pause` OR conversation end

**Actions**:
- Generate comprehensive summary (all sections)
- Move file: `active/{slug}.md` → `paused/{slug}.md`
- Output bilingual resume instruction

**Location**: `.claude/sessions/paused/YYYY-MM-DD-{slug}.md`

---

### 4. Resumed Session

**Trigger**: Explicit `/resume` OR `claude --continue` with paused session

**Actions**:
- Load session file from `paused/`
- Restore TodoWrite state
- Verify artifacts exist
- Move back: `paused/{slug}.md` → `active/{slug}.md`
- Output context summary + readiness check

**Location**: Back to `active/`

---

### 5. Completed Session

**Trigger**: All todos completed OR user marks as done

**Actions**:
- Final summary generation
- Move file: `active/{slug}.md` → `completed/{slug}.md`
- Mark status as ✅ Complete
- Archive artifacts (optional)

**Location**: `.claude/sessions/completed/YYYY-MM-DD-{slug}.md`

---

## Error Handling

### Session File Not Found

**On `/resume`**:
```
No paused session found.

Checked:
- .claude/sessions/paused/ (0 files)
- NEXT_SESSION_TODO.md (not found)
- .claude/sessions/active/ (0 files)

Would you like to start new work?
```

---

### Session File Corrupted

**On `/resume`**:
```
Session file partially corrupted.

Readable context:
- Goal: OAuth2 migration
- Progress: 5/12 tasks
- Last action: Token refresh implemented

Unable to parse: Agents Used section

Continue with partial context? [y/n]
```

---

### TodoWrite State Mismatch

**On `/resume`**:
```
⚠️ Warning: Todo state diverged from session file.

Session says: 5/12 tasks done
TodoWrite shows: 3/12 tasks done

Restored from session file (source of truth).
Verify progress and update if needed.
```

---

### Multiple Active Sessions

**On auto-save OR `/pause`**:
```
⚠️ Warning: Multiple active sessions found:
1. 2025-10-30-oauth2-migration.md (updated 2h ago)
2. 2025-10-30-basecrud-refactor.md (updated just now)

Which session are you working on?
I'll pause the other automatically.
```

---

### Artifacts Missing

**On `/resume`**:
```
⚠️ Warning: Some artifacts were modified/deleted since pause:

Missing:
- backend/app/auth/jwt_handler.py (deleted?)

Modified:
- backend/app/auth/token.py (23 changes since pause)

Continue anyway? Context may be stale.
```

---

## Integration with Hooks

Session Manager integrates with Claude Code's SessionStart/SessionEnd hooks for automation.

### SessionStart Hook

**Purpose**: Auto-resume on conversation start

**Script**: `.claude/hooks/resume-session.sh`

**Behavior**:
- Check for paused sessions in `.claude/sessions/paused/`
- If found: Prompt "Resume session {name}? [y/n]"
- If yes: Trigger session-manager `/resume` workflow
- If no: Continue without session

**Configuration** (`.claude/settings.json`):
```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "resume",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/resume-session.sh"
      }]
    }]
  }
}
```

---

### SessionEnd Hook

**Purpose**: Auto-save on conversation end

**Script**: `.claude/hooks/save-session-state.sh`

**Behavior**:
- Check for active sessions in `.claude/sessions/active/`
- If found: Trigger lightweight auto-save
- Move to `paused/` if explicit goodbye detected

**Configuration** (`.claude/settings.json`):
```json
{
  "hooks": {
    "SessionEnd": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/save-session-state.sh"
      }]
    }]
  }
}
```

---

## Bilingual Support

### Command Aliases

All commands support EN and UA:

| EN | UA |
|----|-----|
| `/pause` | `/пауза` |
| `/resume` | `/продовжити` |
| `/session` | `/сесія` |

**Trigger phrases** (see "When to Use This Skill" section for full list)

---

### Content Format

**Headers**: Always EN (`## Context`, `## Todo`, `## Next Actions`)

**Content**: Mixed EN/UA as natural

**User-facing messages**: Always bilingual

**Examples**:
```markdown
Goal: Рефакторинг CRUD services
Approach: BaseCRUD inheritance pattern
```

```markdown
- [x] Migrate atom_crud.py (-50 LOC)
- [ ] Мігрувати message_crud.py (est. 20 min)
```

```markdown
Resume with: `/resume` або `/продовжити`
Say "ready" / "готовий" to proceed.
```

---

## Progressive Disclosure

This SKILL.md provides:
- High-level workflow overview
- Command descriptions
- Core behavior patterns

For detailed procedural steps, reference files are available:

### `references/PAUSE_WORKFLOW.md`

Detailed checklist for pause operation:
- Metadata generation steps
- Todo state capture logic
- Agent history documentation
- Next actions identification
- Session file generation
- Error handling procedures

Load when: Implementing pause logic or debugging pause issues.

---

### `references/RESUME_WORKFLOW.md`

Detailed checklist for resume operation:
- Session file location priority
- Context parsing steps
- TodoWrite restoration logic
- Artifact verification
- Session file movement
- Context reconstruction best practices

Load when: Implementing resume logic or debugging context restoration.

---

### `references/SUMMARY_TEMPLATES.md`

Complete templates with examples:
- Standard template (full session)
- Minimal template (quick tasks)
- Epic template (multi-day sessions)
- Admonition usage guide
- Bilingual content guidelines
- Compact context rules
- Session slug generation

Load when: Generating session summaries or validating format.

---

## Best Practices

### Compact Context

**Use 2-word snippets**:
- ✅ "Inheritance pattern", "API refactor"
- ❌ "We are using an inheritance-based pattern to..."

**Use tables over prose**:
- ✅ `| Blocker | TypeScript errors |`
- ❌ "Currently blocked by TypeScript errors..."

**Use metrics over descriptions**:
- ✅ "(-50 LOC)", "(+18 tests)", "(3.2s → 0.8s)"
- ❌ "Reduced code size", "Added tests", "Improved performance"

---

### Session File Management

**Active sessions**:
- Keep only 1-2 active at a time
- Auto-save every 3-5 completions
- Minimal detail (high-priority only)

**Paused sessions**:
- Full detail (all sections)
- Clear resume instructions
- Verify before moving

**Completed sessions**:
- Archive after 30 days
- Keep for historical reference
- Link from project docs if significant

---

### TodoWrite Sync

**Before pause**:
- Complete or block in_progress tasks
- Verify counts match
- Clean up stale todos

**After resume**:
- Recreate exact state
- Mark first pending as in_progress
- Validate against session file

---

### Artifact Links

**Use relative paths**:
- ✅ `backend/app/crud/atom_crud.py`
- ❌ `/Users/maks/project/backend/app/crud/atom_crud.py`

**Include metrics**:
- ✅ `atom_crud.py (230→180 LOC)`
- ❌ `atom_crud.py`

**Link artifacts**:
- ✅ `[migration report](.artifacts/basecrud/phase-1.md)`
- ❌ "See the migration report in artifacts"

---

## Comparison with Old Orchestration Skills

### What session-manager Replaces

**task-orchestrator** (930 lines):
- Over-engineered routing logic
- Manual session state JSON files
- Verbose coordination warnings

**parallel-coordinator** (657 lines):
- Medium-sized batching (15-25min)
- Manual checkpointing
- Session continuity (244 lines of docs)

**epic-orchestrator** (560 lines):
- Multi-week coordination
- Manual progress.md updates
- Git-centric team workflows

**Total**: 2,147 lines → 450 lines (79% reduction)

---

### Key Improvements

**Simplicity**:
- Single markdown file (not 8-12 files per session)
- Auto-save (not manual state management)
- Lightweight checkpoints (not comprehensive batches)

**Usability**:
- "It just works" (auto-save after TodoWrite)
- Clear commands (`/pause`, `/resume`)
- Bilingual support (EN/UA)

**Context efficiency**:
- One file to load (not scattered across artifacts)
- 2-word snippets (not essays)
- Progressive disclosure (load details on demand)

---

## Notes

- Session files are markdown (easy to read/edit manually)
- Use `.gitignore` for `active/` and `paused/` dirs (personal state)
- Keep `completed/` in git for historical reference (team visibility)
- Session slug max 40 chars total
- Always output bilingual prompts for user-facing messages
- Prefer tables over prose, metrics over descriptions
- Load reference files only when implementing or debugging
