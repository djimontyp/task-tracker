---
description: Weekly retrospective with Git, Jira, Obsidian data + pattern analysis
argument-hint: [period] (default: last week)
allowed-tools: Read(*), Write(*), Glob(*), Bash(git:*), Bash(date:*), Bash(mkdir:*), mcp__atlassian__jira_search, mcp__atlassian__jira_get_issue
---

## Context

- **Vault**: `.obsidian-docs/`
- **Config**: @.obsidian-docs/.vault-config.json

## User Input

```
$ARGUMENTS
```

## Purpose

**Retro** = **work report** (for team/management) + **personal productivity** (for self):

1. **Work Report** — what matters to stakeholders:
   - Completed features/epics
   - Blockers with status history
   - Next week plan

2. **Personal Productivity** (collapsed) — for self-improvement:
   - Sessions, knowledge, patterns
   - Git details, journal highlights

> Work Report first, Personal second (collapsed)

## Path

From config: `structure.retro.*`

```
.obsidian-docs/Робоче/Ретро/YYYY/MM/week-WW.md
```

## Period Parsing

Flexible input:
- `(empty)` → last week
- `грудень 4-9` → 2025-12-04 — 2025-12-09
- `минулий тиждень` → Mon-Sun of previous week
- `з понеділка` → from Monday to today
- `цей тиждень` → current week
- `листопад` → entire month

## Algorithm

```
1. READ config .vault-config.json
2. PARSE period from arguments
3. COLLECT data:
   - Git: commits, files, stats (by author from config.user)
   - Jira: tasks, comments (if MCP available)
   - Obsidian: Journal entries for period
4. GROUP commits by feature/epic (parse conventional commit prefixes)
5. EXTRACT blockers from Journal (look for "блокер", "чекаємо", "TODO")
6. GENERATE work report sections
7. ANALYZE patterns (for personal section):
   - avg_sessions_per_day, knowledge rates, peak hours
8. UPDATE config learning.patterns
9. SAVE report
```

## Data Collection

### 1. Git

```bash
author = config.user.name

# Commits for period
git log --author="$author" --since="$START" --until="$END" --oneline

# Files changed
git log --author="$author" --since="$START" --until="$END" --name-only --pretty=format: | sort | uniq -c | sort -rn

# Stats
git log --author="$author" --since="$START" --until="$END" --shortstat
```

### 2. Jira (MCP, optional)

```
Project: MOYE
jql: "project = MOYE AND assignee = currentUser() AND updated >= '$START'"
```

If MCP unavailable — skip, note in report.

### 3. Obsidian Journal

```
Glob: .obsidian-docs/Робоче/Журнал/YYYY/MM/YYYY-MM-DD.md

Parse:
- ## Фокус дня → epic/feature name
- ### Сесія N: {name} → session for grouping
- Блокери, TODO, чекаємо → blockers
- ✅ items → completed work
```

## Grouping by Feature/Epic

Parse commit messages and journal focus:

```python
# From commits
"feat(tenant-rating): ..." → "Tenant Rating"
"fix(auth): ..." → "Auth"
"docs: ..." → "Documentation"

# From journal "Фокус дня"
"Tenant Rating: ..." → "Tenant Rating"
"taskN2 — Моніка" → "Моніка Integration"
```

Group related work under epic headers.

## Blocker Format

Extract from Journal and format with history:

```markdown
| Блокер | Виник | Власник | Статус |
|--------|-------|---------|--------|
| Токени T3, T4 | 17.12 | Андрій | ⏳ Чекаємо |
| Edge case E1 | 17.12 | Команда | ✅ Вирішено 18.12 |
```

Status values: ⏳ Чекаємо, ✅ Вирішено, ❌ Заблоковано

## Output Report

Save to: `.obsidian-docs/Робоче/Ретро/YYYY/MM/week-WW.md`

```markdown
---
type: retro
period: {YYYY}-W{WW}
created: {today}
author: {config.user.name}
tags:
  - retro
---

# Retro: {human readable period}

---

## Summary

> 1-2 речення: головні досягнення тижня

---

## Completed

### {Epic/Feature 1}

- ✅ {task 1}
- ✅ {task 2}
- Commits: `abc123`, `def456`

### {Epic/Feature 2}

- ✅ {task 1}
- Commits: `ghi789`

### Other

- ✅ {misc task}

---

## Blockers

| Блокер | Виник | Власник | Статус |
|--------|-------|---------|--------|
| {blocker 1} | {date} | {owner} | {status} |
| {blocker 2} | {date} | {owner} | {status} |

---

## Next Week

- [ ] {planned task 1}
- [ ] {planned task 2}
- [ ] {planned task 3}

---

## Metrics

| Метрика | Значення |
|---------|----------|
| Комітів | {N} |
| Файлів змінено | {N} |
| Рядків | +{added} / -{deleted} |
| Jira tasks | {N або "N/A"} |

---

<details>
<summary><strong>Personal Productivity</strong></summary>

### Sessions

| Дата | Сесії | Фокус |
|------|-------|-------|
| {date} | {N} | {focus} |

### Patterns

| Патерн | Значення |
|--------|----------|
| Сесій/день | {N} |
| Peak hours | {hours} |
| Common prefixes | {prefixes} |

### Knowledge Activity

| Note | Type | Change |
|------|------|--------|
| [[note]] | {type} | Created/Updated |

### Git Details

#### Commits
| Hash | Message | Date |
|------|---------|------|
| ... | ... | ... |

#### Files (top 10)
| File | Commits |
|------|---------|
| ... | ... |

### Journal Highlights

{extracted insights from journals}

### What Worked / What Didn't

**Worked:**
-

**Didn't work:**
-

**Improve:**
-

</details>
```

## Config Update

After execution:

```json
{
  "learning": {
    "patterns": { /* calculated */ },
    "history": {
      "retros_generated": +1,
      "commands_executed": { "retro": +1 },
      "last_activity": "{today}"
    }
  },
  "state": {
    "last_retro": "{today}"
  }
}
```

## Examples

```bash
/obsidian:retro                    # last week
/obsidian:retro грудень 9-15       # specific period
/obsidian:retro цей тиждень        # current week
```

## Response

In Ukrainian:
- 📊 Retro: {path}
- Work Report: {N} epics, {N} blockers
- Personal: collapsed section з {N} сесій
