---
description: Vault health check, registry validation, suggestions management
argument-hint: [show|analyze|accept|reject|reset|fix]
allowed-tools: Read(*), Write(*), Glob(*), Grep(*), Bash(find:*), Bash(wc:*), Bash(date:*)
---

## Context

- **Vault**: `.obsidian-docs/`
- **Config**: @.obsidian-docs/.vault-config.json

## User Input

```
$ARGUMENTS
```

## Purpose

**Sync** = central command for vault management:
- Health check of structure
- Knowledge frontmatter validation
- Registry consistency check
- Suggestions management

## Actions

### `show` or no arguments — vault status

```
1. READ config
2. SCAN vault structure (Knowledge/, Workspace/)
3. CHECK health:
   - Knowledge files: frontmatter, changelog, version
   - Registry: orphaned IDs, missing files
   - Journal: format validation
4. SHOW pending suggestions
5. SHOW stats from learning.history
```

**Output:**
```
📊 Obsidian Vault Status
════════════════════════════════════════

## Structure
| Folder | Files |
|--------|-------|
| Knowledge/Concepts | 6 |
| Knowledge/Flows | 9 |
| Knowledge/Models | 3 |
| Knowledge/Decisions | 3 |
| Knowledge/Sources | 3 |
| Workspace/Journal | 5 |
| Workspace/Questions | 3 |
| Workspace/Retro | 0 |

## Registry
| Type | Registered | Files |
|------|------------|-------|
| concepts | 6 | 6 ✅ |
| flows | 9 | 9 ✅ |
| models | 3 | 3 ✅ |
| decisions | 3 | 3 ✅ |
| sources | 3 | 3 ✅ |

## Health
✅ Structure: OK
✅ Registry: synced
⚠️ Missing frontmatter: 2 files
⚠️ Missing changelog: 5 files
✅ Broken links: 0

## Learning Stats
| Metric | Value |
|--------|-------|
| Journal entries | 5 |
| Sessions created | 12 |
| Knowledge notes | 24 |
| Last activity | 2025-12-19 |

## Pending Suggestions (2)
💡 [sug-001] Create Knowledge from Journal findings? (85%)
💡 [sug-002] Add aliases for search? (80%)

Use: /obsidian:sync accept sug-001
════════════════════════════════════════
```

### `analyze` — force pattern analysis

```
1. READ config
2. SCAN all Journal entries
3. SCAN all Knowledge files
4. CALCULATE patterns:
   - avg_sessions_per_day
   - knowledge_creation_rate
   - knowledge_update_rate
   - common_prefixes
   - peak_hours
5. GENERATE suggestions based on patterns
6. UPDATE config.learning.patterns
7. UPDATE config.suggestions.pending
8. SAVE config
```

### `accept <id>` — accept suggestion

```
1. FIND suggestion by id in suggestions.pending
2. MOVE to suggestions.accepted
3. APPLY action:
   - auto_create_journal_on_session → set default=true
   - suggest_knowledge_from_journal → set default=true
   - suggest_session_prefix → set default=true
   - reminder_retro → set default=true
4. SAVE config
```

### `reject <id>` — reject suggestion

```
1. FIND suggestion by id in suggestions.pending
2. MOVE to suggestions.rejected
3. SAVE config
```

### `reset` — reset learning

```
1. CONFIRM with user
2. RESET learning.patterns to defaults
3. RESET learning.history counters
4. CLEAR suggestions.pending
5. CLEAR suggestions.accepted
6. CLEAR suggestions.rejected
7. SAVE config
```

### `fix` — fix issues

```
1. CHECK for issues:
   - Knowledge files without required frontmatter
   - Knowledge files without changelog
   - Registry/files mismatch
   - Empty or malformed Journal entries
2. FOR each issue:
   - SHOW issue
   - ASK user to fix or skip
   - APPLY fix if confirmed
3. UPDATE config
```

**Fixes available:**
- Add missing frontmatter fields (id, status, version, author)
- Add changelog section
- Sync registry with actual files
- Fill author from config.user

## Health Checks

### Knowledge Files

**Required frontmatter:**
- id
- title
- type
- status
- created
- updated
- author
- version

**Required section:**
- `## Changelog` at the end

### Registry Validation

```python
for type in ["concepts", "flows", "models", "decisions", "sources"]:
    registered = config.registry[type]
    files = glob(f"Knowledge/{type.capitalize()}/*.md")

    # Check for orphaned IDs (in registry but no file)
    orphaned = [id for id in registered if f"{type[:-1]}-{id}.md" not in files]

    # Check for unregistered files (file exists but not in registry)
    unregistered = [f for f in files if extract_id(f) not in registered]
```

### Journal Validation

**Required frontmatter:**
- type: journal
- date
- author

**Expected sections:**
- `## Focus`
- `## Sessions`
- `## Notes`

## Pattern Analysis

```python
patterns = {
    "avg_sessions_per_day": sessions_count / days_count,
    "knowledge_creation_rate": knowledge_created / days_count,
    "knowledge_update_rate": knowledge_updated / knowledge_total,
    "common_prefixes": extract_session_prefixes().most_common(5),
    "peak_hours": extract_creation_hours().mode()
}

# Generate suggestions
if knowledge_creation_rate < 0.5:
    add_suggestion("suggest_knowledge_from_journal", confidence=0.8)

if missing_aliases_count > 5:
    add_suggestion("add_aliases_for_search", confidence=0.85)
```

## History Update

```json
{
  "learning": {
    "history": {
      "commands_executed": { "sync": +1 },
      "last_activity": "2025-12-19"
    }
  }
}
```

## Examples

```bash
/obsidian:sync                    # show status
/obsidian:sync analyze            # analyze patterns
/obsidian:sync accept sug-001     # accept suggestion
/obsidian:sync reject sug-002     # reject suggestion
/obsidian:sync fix                # fix issues
/obsidian:sync reset              # reset learning
```

## Response

In Ukrainian:
- 📊 Vault status displayed
- 🧠 Patterns analyzed: {count}
- 💡 Suggestions: {pending}/{accepted}/{rejected}
- ✅ Fixed: {count} issues
- ⚠️ Issues found: {count}
