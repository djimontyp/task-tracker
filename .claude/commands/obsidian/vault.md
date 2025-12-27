---
description: Universal query and update interface for Obsidian vault
argument-hint: "<request>" — update note, ask question, or list notes
allowed-tools: Read(*), Write(*), Glob(*), Grep(*), Bash(date:*)
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
user = config.user
registry = config.registry
```

### 2. Detect intent from $ARGUMENTS

Analyze keywords to determine action:

| Intent | Keywords (ukr) | Keywords (eng) |
|--------|----------------|----------------|
| UPDATE | оновити, додати до, змінити, статус | update, add to, change, status |
| ASK | що, як, коли, чому, де, скільки | what, how, when, why, where |
| LIST | список, всі, покажи | list, all, show |

### 3. Execute by intent

---

#### 3A. UPDATE — Modify existing note

**Parse:**
- Extract note ID (with or without prefix)
- Extract change description

**Resolve note:**
```
# Try exact match first
search_patterns = [
  "{id}.md",
  "концепт-{id}.md", "concept-{id}.md",
  "потік-{id}.md", "flow-{id}.md",
  "модель-{id}.md", "model-{id}.md",
  "adr-{id}.md", "рішення-{id}.md", "decision-{id}.md",
  "джерело-{id}.md", "source-{id}.md"
]

# Search in Knowledge/ and Workspace/
file = glob(".obsidian-docs/**/{pattern}")
```

**Apply changes:**
1. Read current file content
2. Show current state to user
3. Apply requested change:
   - Add section → append before `## Changelog` or at end
   - Update field → modify frontmatter
   - Change status → update `status:` in frontmatter
4. Update frontmatter:
   ```yaml
   updated: {today}
   version: {increment_minor(current_version)}
   ```
5. Add changelog entry:
   ```markdown
   | {new_version} | {today} | {user.name} | {user.email} | {change_summary} |
   ```

**Update history:**
```
config.learning.history.knowledge_notes_updated++
config.learning.history.commands_executed.vault++
```

---

#### 3B. ASK — Semantic query

**Search scope:**
1. Knowledge/ — concepts, flows, models, decisions, sources
2. Workspace/Journal/ — sessions, findings, notes
3. Workspace/Retro/ — patterns, blockers
4. Workspace/Questions/ — open questions

**Search strategy:**
1. Extract key terms from query
2. Search content with Grep
3. Search frontmatter (tags, aliases, title)
4. Aggregate results by relevance

**Synthesize answer:**
- Group by type (concepts, flows, journal entries)
- Include [[wikilinks]] to sources
- Quote relevant snippets

---

#### 3C. LIST — Show notes by criteria

**Parse criteria:**
- By type: "список концептів" → type:concept
- By status: "всі draft" → status:draft
- By time: "за грудень" → created >= 2024-12-01
- By tag: "з тегом auth" → tags contains auth

**Search:**
```
files = glob(".obsidian-docs/Knowledge/**/*.md")
files += glob(".obsidian-docs/Workspace/**/*.md")
# Filter by criteria from frontmatter
```

**Format output:**
- Group by folder/type
- Show: filename, title, status, updated

## Response Format (Ukrainian)

### For UPDATE:

```
📝 Оновлено: [[{note_id}]]

Зміни:
- {change_description}
- version: {old} → {new}

Файл: .obsidian-docs/{path}
```

### For ASK:

```
🔍 {query}

**Концепти:**
- [[концепт-x]] — {summary}

**Потоки:**
- [[потік-y]] — {summary}

**З журналу ({date}):**
- {relevant finding}

---
Джерела: {N} нотаток
```

### For LIST:

```
📋 {criteria}

**Knowledge/Concepts/** (N)
- концепт-auth.md — Автентифікація [active]
- концепт-review.md — Відгуки [draft]

**Knowledge/Flows/** (M)
- потік-registration.md — Реєстрація [stable]

---
Знайдено: {total} нотаток
```

### Errors:

**Note not found:**
```
❌ Нотатку "{id}" не знайдено

💡 Схожі:
- [[концепт-auth]] (auth)
- [[концепт-колбек]] (callback)

Або створи: /obsidian:create concept "{id}"
```

**Empty query:**
```
❌ Потрібен запит

Приклади:
- /obsidian:vault "оновити концепт-моніка: rate limits"
- /obsidian:vault "що знаю про callbacks?"
- /obsidian:vault "список рішень"
```

## History Update

```json
{
  "learning": {
    "history": {
      "commands_executed": { "vault": +1 },
      "last_activity": "{today}"
    }
  }
}
```

## Examples

```bash
# UPDATE
/obsidian:vault "оновити концепт-моніка: додати rate limits"
/obsidian:vault "adr-kafka-ready статус stable"
/obsidian:vault "додати до джерело-moye-445: нові вимоги"

# ASK
/obsidian:vault "що знаю про callbacks?"
/obsidian:vault "коли працював над tenant-rating?"
/obsidian:vault "які рішення про auth?"

# LIST
/obsidian:vault "список концептів"
/obsidian:vault "всі draft нотатки"
/obsidian:vault "рішення за грудень"
```