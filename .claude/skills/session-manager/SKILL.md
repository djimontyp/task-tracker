---
name: session-manager
description: Manages work sessions with pause/resume workflow. Triggers on "покажи сесії", "show sessions", "список сесій", "list sessions", "що далі", "what's next", "які плани", "what are the plans", "що по планам", "які цілі", "what are the goals", "що робимо", "what should we do", "де ми", "where are we", "продовжити", "continue", "resume", "давай", "let's go", "пауза", "pause", "зупинись", "stop", "статус", "status", "що зроблено", "what's done", "прогрес", "progress", "перемкнутись", "switch", "заархівувати", "archive". Replaces NEXT_SESSION_TODO.md with structured session files in planned/active/paused/completed dirs. Auto-saves progress, bilingual EN/UA.
allowed-tools: Read, Write, Glob, TodoWrite, Bash(git:*)
---

# Session Manager

## Overview

Session Manager provides automatic session state management and seamless pause/resume workflows. It replaces bulky orchestration skills (Task Orchestrator, parallel-coordinator, epic-orchestrator) with a lightweight, auto-saving approach.

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

Session Manager автоматично активується на природній мові (EN/UA). Використовує `.claude/sessions/{planned|active|paused|completed}/` для управління сесіями.

### Trigger Phrases

#### 1. Show Sessions (Показати сесії)
**EN**: "show sessions", "list sessions", "what sessions do we have", "available sessions", "all sessions", "what can we work on"
**UA**: "покажи сесії", "список сесій", "які сесії є", "доступні сесії", "всі сесії", "над чим можна працювати", "що по сесіям"

**Behavior**: List all sessions by status (planned/active/paused/completed) with progress bars

---

#### 2. What's Next / Plans (Що далі / Плани)
**EN**: "what's next", "what should we do", "what are the plans", "what's the plan", "next steps", "what to work on", "what are we doing", "what are the goals", "what's on the agenda", "what needs to be done", "what's pending", "what are our priorities"
**UA**: "що далі", "що робимо", "які плани", "що по планам", "наступні кроки", "над чим працювати", "який план", "що робити", "які цілі", "що в планах", "що треба зробити", "що залишилось", "що у черзі", "які пріоритети"

**Behavior**:
- If active session exists → show status
- If no active session → show planned sessions menu

---

#### 3. Session Status (Статус сесії)
**EN**: "session status", "where are we", "what's the progress", "current status", "how far are we", "show progress", "what have we done", "what's completed", "what's left"
**UA**: "статус сесії", "де ми", "який прогрес", "поточний статус", "що зроблено", "як справи", "покажи прогрес", "що виконано", "що готово", "що залишилось"

**Behavior**: Show detailed status of active session with progress bars, completed/remaining tasks

---

#### 4. Continue/Resume (Продовжити)
**EN**: "continue", "resume", "let's continue", "pick up where we left off", "resume session", "continue work", "let's go", "let's work", "start working", "pick up", "carry on"
**UA**: "продовжити", "продовж", "давай продовжимо", "продовжуємо", "відновити роботу", "поїхали", "давай працювати", "починаємо", "давай далі", "давай"

**Behavior**:
- If paused sessions exist → prompt to select
- If no paused → show planned sessions
- Auto-resume last active if only one

---

#### 5. Continue Specific Session (Продовжити конкретну)
**EN**: "continue [name]", "resume [name]", "work on [name]", "let's do [name]", "start [name]", "do [name]"
**UA**: "продовжити [назва]", "давай [назва]", "працювати над [назва]", "почати [назва]", "робити [назва]"

**Examples**:
- "давай спринт 1" → Load sprint-1-ux-fixes
- "continue backend" → Load backend-code-quality
- "work on testing" → Load testing-infrastructure

**Behavior**: Fuzzy match session name, confirm if ambiguous

---

#### 6. Pause (Пауза)
**EN**: "pause", "stop", "that's it for now", "save progress", "stop for today", "break", "done for now", "that's all", "enough for now", "let's stop", "take a break", "that's it"
**UA**: "пауза", "зупинись", "все на сьогодні", "зберегти прогрес", "перерва", "готово на сьогодні", "все", "достатньо", "хватит", "зупинимось", "зробимо перерву"

**Behavior**: Save active session to paused/, show resume instructions

---

#### 7. Switch Session (Перемкнутись)
**EN**: "switch to [name]", "work on [name] instead", "let's do something else", "change session", "do something different"
**UA**: "перемкнутись на [назва]", "краще попрацюємо над [назва]", "давай інше", "змінити сесію", "щось інше", "давай по-іншому"

**Behavior**: Pause current session, resume target session

---

#### 8. Archive (Архівувати)
**EN**: "archive this session", "this is done", "mark as complete", "finish this session", "complete session", "we're done", "session complete"
**UA**: "заархівувати сесію", "це готово", "позначити завершеним", "закінчити сесію", "завершити сесію", "ми закінчили", "сесія готова"

**Behavior**: Move session to completed/, mark status ✅

---

#### 9. Overview (Огляд)
**EN**: "overview", "big picture", "overall status", "where do we stand", "summary", "what's the situation"
**UA**: "огляд", "загальна картина", "загальний статус", "де ми стоїмо", "підсумок", "яка ситуація", "що по-загалом"

**Behavior**: Show high-level summary across all sessions

---

### Auto-Trigger Scenarios

**After TodoWrite updates** (automatic):
- When task marked as completed
- When new tasks added
- Every 5-7 task completions (checkpoint)

**On conversation end** (automatic):
- User says goodbye: "bye", "пока", "до побачення", "все"
- Long inactivity (if detectable)
- SessionEnd hook triggers

**On context switch** (automatic):
- User mentions different session name → offer to switch
- Example: working on Sprint 1, user says "давай backend" → auto-switch prompt

---

### Do NOT Use This Skill For

- Trivial tasks (complexity score 0-2, <3 todos)
- Read-only operations (no state to save)
- Simple Q&A (no workflow to resume)

---

## Session Name Matching

**Smart fuzzy keyword matching** allows users to reference sessions naturally:

| User says | Matches |
|-----------|---------|
| "спринт" / "sprint" | All sprint-* sessions |
| "спринт 1" / "sprint 1" | sprint-1-ux-fixes |
| "спринт 2" / "sprint 2" | sprint-2-ux-improvements |
| "бекенд" / "backend" | backend-code-quality |
| "тести" / "testing" | testing-infrastructure |
| "ux" | sprint-1, sprint-2, sprint-3 |

**Ambiguity resolution**:
When multiple matches found, prompt user to select:
```
Found 3 sessions matching "sprint":
1. Sprint 1: UX Fixes [10/14 done, 71%, 11.5h left]
2. Sprint 2: UX Improvements [0/7 done, 18h]
3. Sprint 3: UX Polish [0/4 done, 7h]

Which one? (type number or more specific name)
```

---

## Response Templates

### List Sessions Response
```
📊 Доступні сесії:

🔴 АКТИВНІ (1):
  → Sprint 1: UX Fixes [10/14, 71%, 11.5h left]

📅 ЗАПЛАНОВАНІ (4):
  1. Sprint 2: UX Improvements [0/7, 18h]
  2. Sprint 3: UX Polish [0/4, 7h]
  3. Backend Code Quality [0/10, 25h]
  4. Testing Infrastructure [0/4, 20h]

⏸️ ПРИЗУПИНЕНІ (2):
  • Sprint1 Audit (Oct 31)
  • Old Sprint1 Work (Oct 30)

✅ ЗАВЕРШЕНІ (0)

Щоб продовжити: "давай спринт 1" або "продовжити backend"
```

### Session Status Response
```
📊 Sprint 1: UX Fixes

Ціль: Критичні UX виправлення
Прогрес: 10/14 tasks (71%) ━━━━━━━━━⚊⚊⚊⚊
Час: 6h витрачено / 11.5h залишилось

✅ Зроблено (10):
  ✓ Dashboard duplication (7d395e2)
  ✓ Sidebar auto-expansion (c777c9e)
  ✓ Status badge system (4348208)
  ✓ Keyboard navigation docs (6bd9c99)
  ...

🔲 Залишилось (4):
  1. Badge tooltips (0.5h)
  2. ARIA labels (3h)
  3. Color contrast (0.5h)
  4. Empty states (4h)

Наступне: Add tooltips to notification badges

Готовий продовжити? Скажи "давай" або "продовжити"
```

### Resume Prompt
```
✅ Відновлюю сесію: Sprint 2 UX Improvements

Ціль: Оптимізація таблиць та мобільна версія
Прогрес: 0/7 tasks (0%)
Заплановано: 18h

Задачі:
  1. Messages Table optimization (2h)
  2. Mobile sidebar (4h)
  3. Mobile tables (3h)
  ...

Почнемо з: Messages Table column widths

Готовий? Скажи "готовий" або "поїхали"
```

### Pause Confirmation
```
💾 Сесію збережено: .claude/sessions/paused/sprint-1-ux-fixes.md

Прогрес: 10/14 tasks (71%) • 6h витрачено / 11.5h залишилось
Наступне: Badge tooltips

Щоб продовжити: "продовжити спринт 1" або "resume sprint 1"
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

## Agent Output Integration

### Purpose

When agents complete delegated work, they should integrate their findings directly into the active session instead of creating orphaned artifact files in the project root.

**Problem this solves:**
- ❌ **Before**: Agents create `SPRINT1_TEST_FIX_VERIFICATION.md`, `ANALYSIS_REPORT.md` etc.
- ✅ **After**: Agent findings automatically appended to `.claude/sessions/active/{slug}.md`

---

### For Agents (Subagents)

When you complete work as a delegated agent, follow this workflow:

#### Step 1: Check for Active Session

```bash
# Find active session file
active_session=$(ls .claude/sessions/active/*.md 2>/dev/null | head -1)
```

#### Step 2: Append Your Report

**If session exists:**

```bash
if [ -n "$active_session" ]; then
  # Add separator and timestamp header
  echo -e "\n---\n" >> "$active_session"
  echo "## Agent Report: $(date +'%Y-%m-%d %H:%M') - [Your Agent Name]" >> "$active_session"
  echo "" >> "$active_session"

  # Append your findings
  cat your_report.md >> "$active_session"

  echo "✅ Findings appended to: $active_session"
else
  echo "⚠️  No active session - creating standalone artifact"
  # Save to project root or .artifacts/
fi
```

**Alternative (using helper script):**

```bash
# Use the helper script (if available)
.claude/scripts/update-active-session.sh "your-agent-name" your_report.md
```

#### Step 3: Update TodoWrite (if needed)

If you discovered new tasks during your work:

```markdown
Use TodoWrite tool to add:
- [ ] New task discovered by agent
- [ ] Another follow-up action

This triggers auto-save automatically.
```

#### Step 4: Report Back

Include session update status in your final output:

```markdown
✅ Verification complete. Findings appended to active session.
📄 Session file: .claude/sessions/active/2025-11-01-sprint1-consolidated.md
```

---

### For Coordinator

When delegating to agents, provide session context:

**Good delegation:**
```markdown
Task: Verify test fixes from Sprint 1

**Context:** Active session: sprint-1-ux-fixes
**Session file:** .claude/sessions/active/2025-11-01-sprint1-consolidated.md

Please append your verification report to the active session.
```

**Agent will automatically:**
1. Check for active session
2. Append findings to session file
3. Update TodoWrite if new tasks found
4. Trigger auto-save

**Coordinator doesn't need to:**
- Manually merge agent outputs
- Link artifact files
- Update session manually

---

### Auto-Save Behavior

Agent session updates trigger auto-save:

| Event | Auto-Save Type | Location |
|-------|---------------|----------|
| Agent appends to session | Lightweight checkpoint | `active/` |
| TodoWrite update | Lightweight checkpoint | `active/` |
| Explicit `/pause` | Comprehensive save | `paused/` |

**Rationale**: Auto-save is lightweight (don't interrupt flow), explicit pause is comprehensive (user expects full checkpoint).

---

### Session Update Template

**Recommended format for agent reports:**

```markdown
---

## Agent Report: 2025-11-01 14:30 - Pytest Master (T1)

### Summary
Brief 1-2 sentence summary of findings.

### Verification Results
- ✅ Test X passed
- ❌ Test Y failed (reason)
- ⚠️  Test Z requires attention

### Recommendations
1. Action item 1
2. Action item 2

### Files Analyzed
- `backend/tests/test_foo.py`
- `backend/app/service.py`

---
```

---

### Handling Orphaned Artifacts

**If you find orphaned artifact files:**

Use the cleanup script during pause workflow:

```bash
# In PAUSE_WORKFLOW.md, step 6.5:
# Find orphaned agent artifacts
orphaned=$(find . -maxdepth 1 -name "*REPORT*.md" -o -name "*VERIFICATION*.md" -o -name "*SUMMARY*.md")

# Append to session before pausing
for artifact in $orphaned; do
  echo -e "\n## Orphaned Artifact: $(basename $artifact)\n" >> "$session_file"
  cat "$artifact" >> "$session_file"
  rm "$artifact"  # Clean up
done
```

---

### Examples

#### Example 1: Pytest Master (T1) Integration

**Before (creates orphaned file):**
```bash
# Agent creates: SPRINT1_TEST_FIX_VERIFICATION.md
# Coordinator must manually merge into session
```

**After (automatic integration):**
```bash
# Agent checks: ls .claude/sessions/active/
# Finds: 2025-11-01-sprint1-consolidated.md
# Appends verification report to session
# Updates TodoWrite with new tasks
# Auto-save triggered
# Result: Zero orphaned files
```

#### Example 2: React Frontend Expert (F1) Integration

**Agent completes UX audit:**

```bash
active_session=$(ls .claude/sessions/active/*.md | head -1)

if [ -n "$active_session" ]; then
  echo -e "\n---\n" >> "$active_session"
  echo "## Agent Report: $(date +'%Y-%m-%d %H:%M') - React Frontend Expert (F1)" >> "$active_session"
  echo "" >> "$active_session"
  echo "### UX Audit Results" >> "$active_session"
  echo "" >> "$active_session"
  echo "- ✅ Keyboard navigation: Fully accessible" >> "$active_session"
  echo "- ✅ WCAG 2.1 AA: All checks passed" >> "$active_session"
  echo "- ⚠️  Mobile sidebar: Needs improvement" >> "$active_session"
  echo "" >> "$active_session"
  echo "**Recommendation:** Implement hamburger menu for mobile (4h)" >> "$active_session"
fi
```

**Result:** Audit findings in session, TodoWrite updated with mobile task, auto-save triggered.

---

### Benefits

**For Agents:**
- ✅ Clear instructions on where to save outputs
- ✅ Automatic integration (no manual steps)
- ✅ Context preservation guaranteed

**For Coordinator:**
- ✅ Zero manual artifact merging
- ✅ All findings in one place (session file)
- ✅ Seamless pause/resume workflow

**For Project:**
- ✅ Zero orphaned files in project root
- ✅ Clean git status
- ✅ Easy to find historical work (session files)

---

## Comparison with Old Orchestration Skills

### What session-manager Replaces

**Task Orchestrator** (930 lines):
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
