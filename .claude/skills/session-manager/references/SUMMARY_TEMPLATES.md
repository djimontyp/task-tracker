# Session Summary Templates

## Template Format

Session files use **EN headers** with **bilingual content** (EN/UA mixed as needed).

Location: `.claude/sessions/{active|paused|completed}/YYYY-MM-DD-{slug}.md`

---

## Standard Template

```markdown
# Session: {Title}

**Created**: YYYY-MM-DD HH:MM
**Last Updated**: YYYY-MM-DD HH:MM
**Status**: 🔄 In Progress | ⏸️ Paused | ✅ Complete

---

## Context

> [!NOTE]
> Compact 2-word context snippets

| What | State |
|------|-------|
| Goal | {2-word goal description} |
| Approach | {pattern/strategy being used} |
| Blocker | {blocker or "None"} |
| Last Action | {brief last completed action} |

**Decisions Made:**
- {key decision 1}
- {key decision 2}

---

## Todo

> [!TIP]
> Auto-synced with TodoWrite tool

- [x] {Completed task 1} ({LOC change or metric})
- [x] {Completed task 2}
- [ ] {Pending task 1} (est. {time or scope})
- [ ] {Pending task 2}

**Progress**: {X}/{Y} tasks ({Z}%) • {hours} spent / {est-hours} estimated

---

## Agents Used

| Agent | Task | Output | Status |
|-------|------|--------|--------|
| {agent-name} | {task-description} | [link](#artifacts) | ✅ Done |
| {agent-name} | {task-description} | [link](#artifacts) | ⏸️ Partial |

---

## Next Actions

> [!WARNING]
> Resume with: `/resume` or `claude --continue`

**Immediate next**:
1. {Next task 1} ({time estimate})
2. {Next task 2} ({time estimate})

**Blockers**: {list or "None"}

**Questions**:
- {unanswered question 1}

---

## Artifacts

**Location**: `.artifacts/{feature-name}/YYYY-MM-DD/`

**Files created:**
- `{filename}.md` ({description})
- `{filename}.py` ({description})

**Key Files Changed**:
```
{file-path} ({before-LOC}→{after-LOC} LOC)
{file-path} ({before-LOC}→{after-LOC} LOC)
```

**Commits**: `{hash-1}`, `{hash-2}`

---

## Notes

{Any additional context, warnings, or observations}
```

---

## Minimal Template (Quick Tasks)

For simple tasks under 4 todos:

```markdown
# Session: {Title}

**Status**: ✅ Complete • {date}

## Summary

- Goal: {1-line goal}
- Completed: {X} tasks in {time}
- Output: {key deliverable}

## Files Changed

- `{file}` - {change}
- `{file}` - {change}

## Commit

`{hash}` - {commit message}
```

---

## Epic Template (Multi-Day Sessions)

For complex epics spanning multiple days:

```markdown
# Epic Session: {Epic Title}

**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Duration**: {days} days • {total-hours}h
**Status**: 🔄 In Progress ({X}% complete)

---

## Epic Overview

| Dimension | Value |
|-----------|-------|
| Goal | {epic-level goal} |
| Scope | {X} features, {Y} tasks |
| Timeline | {start} → {target-end} |
| Progress | {X}/{Y} features done |

**Features**:
- [x] Feature 1: {name} (completed {date})
- [ ] Feature 2: {name} (in progress)
- [ ] Feature 3: {name} (pending)

---

## Current Feature: {Feature Name}

### Context

| What | State |
|------|-------|
| Goal | {feature goal} |
| Approach | {approach} |
| Blocker | {blocker or "None"} |

### Todo

- [x] {Task 1}
- [ ] {Task 2}
- [ ] {Task 3}

**Feature Progress**: {X}/{Y} tasks ({Z}%)

---

## Session History

| Date | Session | Progress | Key Outcome |
|------|---------|----------|-------------|
| {date} | Day 1 | {X}% | {outcome} |
| {date} | Day 2 | {Y}% | {outcome} |

**Cumulative Time**: {total-hours}h across {days} days

---

## Next Actions

> [!WARNING]
> Resume with: `/resume @.claude/sessions/paused/{filename}.md`

**Next session goals**:
1. Complete Feature 2: {specific tasks}
2. Start Feature 3: {initial steps}

**Blockers**: {list}

**Questions for user**:
- {question 1}

---

## Artifacts

**Epic location**: `.artifacts/{epic-name}/`

**Sessions**:
- `session-1/` (Day 1: {date})
- `session-2/` (Day 2: {date})

**Key deliverables**:
- {deliverable 1}: `{path}`
- {deliverable 2}: `{path}`

**Total commits**: {count} commits across {branches} branches
```

---

## Admonition Usage Guide

Use GitHub-flavored admonitions for semantic highlighting:

### `> [!NOTE]`
- For informational context
- Session metadata
- Auto-sync indicators

### `> [!TIP]`
- For helpful guidance
- Todo list headers
- Workflow hints

### `> [!WARNING]`
- For blockers
- Resume instructions
- Critical next actions

### `> [!IMPORTANT]`
- For decisions made
- Key constraints
- Non-obvious context

---

## Bilingual Content Guidelines

### Headers
**Always EN**: `## Context`, `## Todo`, `## Next Actions`

### Content
**Mixed EN/UA**: Use whatever language is natural for the content

**Examples:**
```markdown
| Goal | Рефакторинг CRUD services |
| Approach | Inheritance pattern (BaseCRUD) |
```

```markdown
- [x] Migrate atom_crud.py (-50 LOC)
- [ ] Мігрувати message_crud.py (est. 20 min)
```

### User-Facing Messages
**Always bilingual**: Provide both EN and UA

```markdown
Resume with: `/resume` або `/продовжити`

To continue: Say "ready" / "готовий"
```

---

## Compact Context Rules

### 2-Word Snippets
**Good**: "Inheritance pattern", "API refactor", "Vector optimization"
**Bad**: "We are using an inheritance-based pattern to...", "Refactoring the API to improve..."

### Tables Over Prose
**Good**:
```
| What | State |
|------|-------|
| Blocker | TypeScript errors |
```

**Bad**:
```
Currently blocked by TypeScript errors that need to be resolved before proceeding.
```

### Metrics Over Descriptions
**Good**: "(-50 LOC)", "(+18 tests)", "(3.2s → 0.8s)"
**Bad**: "Reduced code size", "Added tests", "Improved performance"

---

## Session Slug Generation

Format: `YYYY-MM-DD-{kebab-case-title}.md`

**Examples:**
- `2025-10-30-basecrud-refactor.md`
- `2025-10-30-oauth2-migration.md`
- `2025-10-30-vector-search-optimization.md`

**Rules:**
- Max 40 chars total
- Lowercase
- Hyphens (no underscores)
- Descriptive but concise
- No special chars except hyphens
