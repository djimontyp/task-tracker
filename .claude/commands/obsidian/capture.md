---
description: Auto-capture learnings from session reflection into Obsidian vault
argument-hint: [auto|<source>|--task <id>] — sources: handoff, journal, beads task
allowed-tools: Read(*), Write(*), Glob(*), Bash(date:*), Bash(mkdir:*)
---

## Context

- **Vault**: `.obsidian-docs/`
- **Config**: @.obsidian-docs/.vault-config.json
- **Today**: !`date +%Y-%m-%d`

## User Input

```
$ARGUMENTS
```

## Purpose

**Capture** = automatic knowledge extraction from work sessions:

1. **Patterns** → `знання/паттерни/` — reusable solutions
2. **Decisions** → `знання/рішення/` — architectural choices
3. **Errors** → `знання/помилки/` — mistakes to avoid

> **Flow:** Work → Reflect → Capture → Structured Knowledge

## Arguments

| Argument | Description |
|----------|-------------|
| `(empty)` | Scan `.artifacts/handoff/` for uncaptured items |
| `auto` | Scan handoff + today's journal findings |
| `<file>` | Parse specific reflect/handoff file |
| `--task <id>` | Extract from Beads task |

## Algorithm

```
1. READ config .vault-config.json
2. PARSE arguments
3. DETERMINE sources:
   - (empty): .artifacts/handoff/*.md
   - auto: handoff + Workspace/Journal/{today}.md
   - file: specific file
   - --task: beads show {id}
4. FOR each source:
   a. PARSE "To Capture in Obsidian" section (if reflect template)
   b. PARSE "## Decisions Made" section (if handoff)
   c. PARSE callouts >[!tip], >[!warning] (if journal)
   d. EXTRACT items: {type, title, description, context}
5. FOR each item:
   a. category = detect_category(item.type)  # pattern|decision|error
   b. filename = kebab_case(item.title)
   c. path = "знання/{category}/{filename}.md"
   d. IF file_exists(path):
      - ASK: "Update existing or skip?"
   e. ELSE:
      - template = load_template(category)
      - content = fill_template(template, item)
      - WRITE(path, content)
   f. UPDATE source: [ ] → [x]
6. UPDATE config:
   - learning.history.knowledge_notes_captured++
   - learning.history.last_capture = today
   - capture_sources.{source_type}++
7. SAVE config
```

## Source Parsing

### Reflect Template

```markdown
## To Capture in Obsidian

### Patterns
- [ ] [[знання/паттерни/pattern-name]] — Description

### Decisions
- [ ] [[знання/рішення/decision-name]] — Description

### Errors
- [ ] [[знання/помилки/error-name]] — Description
```

Parse unchecked items `[ ]`, create notes, mark `[x]`.

### Handoff Document

```markdown
## Decisions Made

### 1. Decision Title
- **What:** Description
- **Alternatives:** Options considered
- **Why:** Reasoning
```

Each decision → `знання/рішення/` note.

### Journal Findings

```markdown
### Findings:
- [[pattern-name]] — discovered pattern

> [!tip] Pattern
> Description of useful approach

> [!warning] Error
> Mistake to avoid
```

Parse callouts and wikilinks in Findings section.

## Category Detection

| Signal | Category |
|--------|----------|
| `pattern`, `паттерн`, `approach`, `підхід` | pattern |
| `decision`, `рішення`, `chose`, `обрали` | decision |
| `error`, `помилка`, `mistake`, `avoid` | error |
| Default | decision |

## Output Templates

### Pattern (`знання/паттерни/`)

```markdown
---
title: "{{title}}"
created: {{date}}
source:
  type: {{source_type}}
  ref: "{{source_ref}}"
tags:
  - паттерн
  - {{domain}}
  - auto-captured
status: draft
---

# {{title}}

> Захоплено з [[{{source_ref}}]]

## Проблема
{{problem_from_context}}

## Рішення
{{solution_from_item}}

## Приклад
\```{{lang}}
// TODO: Add example
\```

## Коли використовувати
- {{context}}

## Пов'язане
- [[{{source_ref}}]]
```

### Decision (`знання/рішення/`)

Use existing `шаблони/рішення.md` + source frontmatter.

### Error (`знання/помилки/`)

```markdown
---
title: "{{title}}"
created: {{date}}
source:
  type: {{source_type}}
  ref: "{{source_ref}}"
tags:
  - помилка
  - {{domain}}
  - auto-captured
status: draft
---

# {{title}}

> Захоплено з [[{{source_ref}}]]

## Ситуація
{{context}}

## Помилка
{{error_description}}

## Причина
{{cause_if_known}}

## Запобігання
- [ ] {{prevention_action}}

## Пов'язане
- [[{{source_ref}}]]
```

## Examples

```bash
# Scan handoff directory
/obsidian:capture

# Scan handoff + today's journal
/obsidian:capture auto

# Parse specific file
/obsidian:capture .artifacts/handoff/PR-123.md

# Extract from Beads task
/obsidian:capture --task PR-123
```

## Response

In Ukrainian:

```
🎯 Obsidian Capture
════════════════════════════════════════

## Scanned Sources
- .artifacts/handoff/PR-123.md
- Workspace/Journal/2025/12/2025-12-30.md

## Captured (3)

| Type | Note | Source |
|------|------|--------|
| 🔄 Pattern | [[n-plus-one-prevention]] | PR-123 |
| 📋 Decision | [[eager-loading-strategy]] | PR-123 |
| ⚠️ Error | [[websocket-memory-leak]] | Journal |

## Skipped (1)
- [[type-guards]] — already exists

## Config Updated
- knowledge_notes_captured: +3
- last_capture: 2025-12-30

════════════════════════════════════════
💡 Run /obsidian:sync to validate new notes
```

## Integration

### With Journal
```bash
/obsidian:journal session "Fix bugs"
# ... work ...
/obsidian:journal done
/obsidian:capture auto  # captures findings
```

### With Retro
Retro report includes capture stats in "Knowledge Activity" section.

### With Beads
```bash
bd close PR-123 -r "Fixed N+1"
/obsidian:capture --task PR-123  # extracts learnings
```
