---
description: Create Knowledge or Question notes in Obsidian vault
argument-hint: <type> "id" — types: concept, flow, model, decision, source, question
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

## Algorithm

### 1. Read config

```
config = read(".obsidian-docs/.vault-config.json")
user = config.user  # { name, email }
registry = config.registry  # { concepts, flows, models, decisions, sources }
```

### 2. Parse arguments

```
type = $1  # concept | flow | model | decision | source | question
id = $2    # semantic ID without prefix (e.g., "auth", "registration")
```

**Validate type:**
- Knowledge types: `concept`, `flow`, `model`, `decision`, `source`
- Workspace types: `question`

### 3. Check registry for uniqueness (Knowledge only)

```python
registry_key = type + "s"  # concepts, flows, models, decisions, sources

if id in config.registry[registry_key]:
    # WARN: ID already exists
    return "⚠️ ID '{id}' already exists in {registry_key}. Use different ID or update existing note."

# Add to registry
config.registry[registry_key].append(id)
# Save config
```

### 4. Determine path and template

| Type | Folder | Prefix | Template |
|------|--------|--------|----------|
| concept | Knowledge/Concepts | concept- | tpl-concept.md |
| flow | Knowledge/Flows | flow- | tpl-flow.md |
| model | Knowledge/Models | model- | tpl-model.md |
| decision | Knowledge/Decisions | decision- | tpl-decision.md |
| source | Knowledge/Sources | source- | tpl-source.md |
| question | Workspace/Questions | question- | tpl-question.md |

```
folder = config.templates[type].folder
prefix = config.templates[type].prefix
filename = "{prefix}{id}.md"
filepath = ".obsidian-docs/{folder}/{filename}"
```

### 5. Generate frontmatter

**For Knowledge types:**
```yaml
---
id: {prefix}{id}
title: ""
aliases: []
type: {type}
status: draft
created: {today}
updated: {today}
author: {user.name}
version: 1.0
tags:
  - {type}
---
```

**For question:**
```yaml
---
id: question-{id}
title: ""
aliases: []
type: question
status: open
priority: medium
created: {today}
author: {user.name}
tags:
  - question
---
```

### 6. Create file from template

1. Read template from `_templates/tpl-{type}.md`
2. Replace placeholders:
   - `{{date:YYYY-MM-DD}}` → today's date
   - `{{time:HH:mm}}` → current time
   - Fill `author:` with `user.name`
   - Fill `id:` with `{prefix}{id}`
3. Write to filepath

### 7. Update config (Knowledge only)

Add ID to registry and save config.

### 8. Update history

```
config.learning.history.knowledge_notes_created++
config.learning.history.commands_executed.create++
config.learning.history.last_activity = now()
```

## Response

**Success:**
```
✅ Created: .obsidian-docs/{folder}/{filename}

Frontmatter:
- id: {prefix}{id}
- type: {type}
- status: draft
- author: {user.name}

Registry updated: {registry_key} now has {count} items.
```

**Already exists:**
```
⚠️ ID '{id}' already exists in registry.

Existing note: .obsidian-docs/{folder}/{prefix}{id}.md

Options:
1. Use different ID
2. Update existing note
```

**Invalid type:**
```
❌ Unknown type: {type}

Available types:
- Knowledge: concept, flow, model, decision, source
- Workspace: question
```

**Missing arguments:**
```
❌ Usage: /obsidian:create <type> "id"

Examples:
- /obsidian:create concept "auth"
- /obsidian:create flow "registration"
- /obsidian:create question "api-design"
```